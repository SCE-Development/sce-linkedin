const axios = require('axios');

// Firecrawl configuration
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2/agent';

/**
 * Determine which fields are empty or null in an alumni record
 * @param {Object} alumni - The alumni record
 * @returns {Array} Array of Firecrawl field names that need enrichment
 */
function getMissingFields(alumni) {
  const missingFields = [];

  if (!alumni.currentCompany || alumni.currentCompany.trim() === '') {
    missingFields.push('current_company');
  }
  if (!alumni.currentJobTitle || alumni.currentJobTitle.trim() === '') {
    missingFields.push('current_job_title');
  }
  if (!alumni.graduationYear) {
    missingFields.push('graduation_year');
  }
  if (!alumni.location || alumni.location.trim() === '') {
    missingFields.push('location');
  }
  if (!alumni.linkedInUrl || alumni.linkedInUrl.trim() === '') {
    missingFields.push('linkedin_profile_url');
  }
  if (!alumni.bio || alumni.bio.trim() === '') {
    missingFields.push('bio');
  }
  if (!alumni.headline || alumni.headline.trim() === '') {
    missingFields.push('headline');
  }
  if (!alumni.startYear) {
    missingFields.push('start_year');
  }
  if (!alumni.major || alumni.major.trim() === '') {
    missingFields.push('major');
  }

  return missingFields;
}

/**
 * Build a dynamic prompt for Firecrawl based on missing fields
 * @param {Object} alumni - The alumni record
 * @param {Array} missingFields - Array of field names to request
 * @returns {String} The prompt to send to Firecrawl
 */
function buildPrompt(alumni, missingFields) {
  const fieldsList = missingFields.join(', ');
  return `Find information about ${alumni.name}, an SJSU alumnus. If there are multiple people with this name, choose one who has any association with a club called The Software and Computer Engineering Society or SCE. Return ONLY these fields: ${fieldsList}. Try to find the most recent information (2024-2025). If recent data is not available, return whatever you can find. Provide accurate, factual data.`;
}

/**
 * Poll Firecrawl job status until completion or failure
 * @param {String} jobId - The Firecrawl job ID
 * @param {Number} timeoutMs - Maximum time to wait in milliseconds (default 5 minutes)
 * @returns {Promise<Object>} The job result data
 */
async function pollFirecrawlJob(jobId, timeoutMs = 15 * 60 * 1000) { // 15 minutes
  const pollUrl = `${FIRECRAWL_BASE_URL}/${jobId}`;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await axios.get(pollUrl, {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        }
      });

      const job = response.data;
      const status = job.status;

      if (status === 'completed' || status === 'success') {
        return { success: true, data: job.data || job };
      } else if (status === 'failed' || status === 'error') {
        return { success: false, error: job.error || 'Firecrawl job failed' };
      }

      // Status is 'pending' or 'running' - wait and poll again
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
    } catch (error) {
      console.error('Error polling Firecrawl job:', error.message);
      throw error;
    }
  }

  throw new Error('Firecrawl job timeout after 5 minutes');
}

/**
 * Start a Firecrawl agent job to enrich alumni data
 * @param {Object} alumni - The alumni record to enrich
 * @returns {Promise<Object>} Result with success flag and optional data/error
 */
async function enrichAlumniRecord(alumni) {
  // Check if enrichment is already in progress or completed
  if (alumni.enrichmentStatus === 'pending') {
    console.log(`Enrichment already in progress for alumni ${alumni._id}`);
    return { success: true, skipped: true, reason: 'already_pending' };
  }

  // Determine which fields are missing
  const missingFields = getMissingFields(alumni);

  if (missingFields.length === 0) {
    console.log(`No missing fields for alumni ${alumni._id}, skipping enrichment`);
    return { success: true, skipped: true, reason: 'no_missing_fields' };
  }

  console.log(`Starting enrichment for alumni ${alumni._id}, missing fields: ${missingFields.join(', ')}`);

  // Build the prompt
  const prompt = buildPrompt(alumni, missingFields);

  try {
    // Start the Firecrawl agent job
    const response = await axios.post(
      FIRECRAWL_BASE_URL,
      {
        prompt: prompt
      },
      {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const jobId = response.data.jobId || response.data.id;
    console.log(`Firecrawl job started with ID: ${jobId}`);

    // Update the alumni record with job ID and pending status
    alumni.enrichmentJobId = jobId;
    alumni.enrichmentStatus = 'pending';
    await alumni.save();

    // Poll for completion (this can be done in background)
    pollFirecrawlJob(jobId)
      .then(async (result) => {
        if (result.success) {
          // Update only the fields that were requested
          const updateData = {};

          missingFields.forEach(field => {
            const value = result.data[field];
            if (value && value !== '') {
              // Map Firecrawl field names to our schema fields
              const schemaField = mapFirecrawlFieldToSchema(field);
              updateData[schemaField] = value;
            }
          });

          if (Object.keys(updateData).length > 0) {
            updateData.enrichmentStatus = 'completed';
            updateData.enrichmentJobId = jobId;

            // Use the model to update
            const Alumni = require('../models/Alumni');
            await Alumni.findByIdAndUpdate(alumni._id, updateData);
            console.log(`Enrichment completed for alumni ${alumni._id}:`, updateData);
          } else {
            // No data returned
            alumni.enrichmentStatus = 'failed';
            await alumni.save();
            console.log(`Enrichment returned no data for alumni ${alumni._id}`);
          }
        } else {
          // Job failed
          alumni.enrichmentStatus = 'failed';
          await alumni.save();
          console.error(`Enrichment failed for alumni ${alumni._id}:`, result.error);
        }
      })
      .catch(async (error) => {
        console.error(`Enrichment error for alumni ${alumni._id}:`, error.message);
        alumni.enrichmentStatus = 'failed';
        await alumni.save();
      });

    return { success: true, jobId: jobId, status: 'pending' };

  } catch (error) {
    console.error(`Failed to start Firecrawl job for alumni ${alumni._id}:`, error.message);

    // Mark as failed
    alumni.enrichmentStatus = 'failed';
    await alumni.save();

    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: 'failed'
    };
  }
}

/**
 * Map Firecrawl field names to Alumni schema field names
 * @param {String} firecrawlField - Field name from Firecrawl
 * @returns {String} Corresponding field name in Alumni schema
 */
function mapFirecrawlFieldToSchema(firecrawlField) {
  const fieldMap = {
    'current_company': 'currentCompany',
    'current_job_title': 'currentJobTitle',
    'graduation_year': 'graduationYear',
    'location': 'location',
    'linkedin_profile_url': 'linkedInUrl',
    'bio': 'bio',
    'headline': 'headline',
    'start_year': 'startYear',
    'major': 'major'
  };

  return fieldMap[firecrawlField] || firecrawlField;
}

module.exports = {
  enrichAlumniRecord,
  getMissingFields,
  buildPrompt
};
