const API_URL = '/api';

// DOM Elements
const createForm = document.getElementById('createAlumniForm');
const alumniGrid = document.getElementById('alumniGrid');
const loading = document.getElementById('loading');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editAlumniForm');
const closeBtn = document.querySelector('.close');

// State
let alumniList = [];

// Utility functions
function showAlert(message, type = 'success') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  document.body.prepend(alert);
  setTimeout(() => alert.remove(), 5000);
}

function formatValue(value, defaultValue = 'N/A') {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

function getStatusBadge(status) {
  const statusMap = {
    'pending': 'status-pending',
    'completed': 'status-completed',
    'failed': 'status-failed'
  };
  const className = status ? statusMap[status] || 'status-none' : 'status-none';
  return `<span class="status ${className}">${status || 'not requested'}</span>`;
}

// Fetch all alumni
async function loadAlumni() {
  try {
    loading.style.display = 'block';
    alumniGrid.innerHTML = '';

    const response = await fetch(`${API_URL}/alumni`);
    if (!response.ok) throw new Error('Failed to fetch alumni');

    alumniList = await response.json();
    renderAlumni();
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    loading.style.display = 'none';
  }
}

// Render alumni cards
function renderAlumni() {
  alumniGrid.innerHTML = '';

  if (alumniList.length === 0) {
    alumniGrid.innerHTML = '<p style="text-align:center;color:#666;grid-column:1/-1;">No alumni yet. Add one above!</p>';
    return;
  }

  alumniList.forEach(alumni => {
    const card = document.createElement('div');
    card.className = 'alumni-card';
    card.innerHTML = `
      <h3>${formatValue(alumni.name)}</h3>
      <div class="info">
        <div class="info-item">
          <span class="info-label">Company</span>
          <span class="info-value">${formatValue(alumni.currentCompany)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Job Title</span>
          <span class="info-value">${formatValue(alumni.currentJobTitle)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Location</span>
          <span class="info-value">${formatValue(alumni.location)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">LinkedIn</span>
          <span class="info-value">${formatValue(alumni.linkedInUrl)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Graduation</span>
          <span class="info-value">${formatValue(alumni.graduationYear)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Major</span>
          <span class="info-value">${formatValue(alumni.major)}</span>
        </div>
      </div>
      ${getStatusBadge(alumni.enrichmentStatus)}
      <div class="actions">
        <button class="btn btn-edit" onclick="openEditModal('${alumni._id}')">Edit</button>
        <button class="btn btn-delete" onclick="deleteAlumni('${alumni._id}')">Delete</button>
      </div>
    `;
    alumniGrid.appendChild(card);
  });
}

// Create alumni
async function createAlumni(formData) {
  try {
    const response = await fetch(`${API_URL}/alumni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create alumni');
    }

    showAlert('Alumni created successfully!');
    createForm.reset();
    loadAlumni();

    // If enrichment was requested, poll for updates
    const created = await response.json();
    if (created.enrichmentStatus === 'pending') {
      pollEnrichment(created._id);
    }
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Poll enrichment status
function pollEnrichment(alumniId) {
  const maxPolls = 90; // 15 minutes at 10s intervals
  let polls = 0;

  const interval = setInterval(async () => {
    polls++;

    try {
      const response = await fetch(`${API_URL}/alumni/${alumniId}`);
      if (!response.ok) return;

      const alumni = await response.json();

      // Update the specific card in the list
      const index = alumniList.findIndex(a => a._id === alumniId);
      if (index !== -1) {
        alumniList[index] = alumni;
        renderAlumni();
      }

      if (alumni.enrichmentStatus !== 'pending' || polls >= maxPolls) {
        clearInterval(interval);
      }
    } catch (error) {
      console.error('Polling error:', error);
      clearInterval(interval);
    }
  }, 10000); // Poll every 10 seconds
}

// Delete alumni
async function deleteAlumni(id) {
  if (!confirm('Are you sure you want to delete this alumni?')) return;

  try {
    const response = await fetch(`${API_URL}/alumni/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete alumni');
    }

    showAlert('Alumni deleted successfully!');
    loadAlumni();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Edit alumni - open modal
function openEditModal(id) {
  const alumni = alumniList.find(a => a._id === id);
  if (!alumni) return;

  document.getElementById('editId').value = alumni._id;
  document.getElementById('editName').value = alumni.name || '';
  document.getElementById('editBio').value = alumni.bio || '';
  document.getElementById('editHeadline').value = alumni.headline || '';
  document.getElementById('editProfilePhotoUrl').value = alumni.profilePhotoUrl || '';
  document.getElementById('editLinkedInUrl').value = alumni.linkedInUrl || '';
  document.getElementById('editStartYear').value = alumni.startYear || '';
  document.getElementById('editGraduationYear').value = alumni.graduationYear || '';
  document.getElementById('editMajor').value = alumni.major || '';
  document.getElementById('editCurrentCompany').value = alumni.currentCompany || '';
  document.getElementById('editCurrentJobTitle').value = alumni.currentJobTitle || '';
  document.getElementById('editLocation').value = alumni.location || '';

  editModal.style.display = 'block';
}

// Update alumni
async function updateAlumni(formData, id) {
  try {
    const response = await fetch(`${API_URL}/alumni/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update alumni');
    }

    showAlert('Alumni updated successfully!');
    editModal.style.display = 'none';
    loadAlumni();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Event Listeners
createForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    name: document.getElementById('name').value,
    bio: document.getElementById('bio').value,
    headline: document.getElementById('headline').value,
    profilePhotoUrl: document.getElementById('profilePhotoUrl').value,
    linkedInUrl: document.getElementById('linkedInUrl').value,
    startYear: document.getElementById('startYear').value
      ? parseInt(document.getElementById('startYear').value)
      : null,
    graduationYear: document.getElementById('graduationYear').value
      ? parseInt(document.getElementById('graduationYear').value)
      : null,
    major: document.getElementById('major').value,
    needsEnrichment: document.getElementById('needsEnrichment').checked
  };

  await createAlumni(formData);
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const formData = {
    name: document.getElementById('editName').value,
    bio: document.getElementById('editBio').value,
    headline: document.getElementById('editHeadline').value,
    profilePhotoUrl: document.getElementById('editProfilePhotoUrl').value,
    linkedInUrl: document.getElementById('editLinkedInUrl').value,
    startYear: document.getElementById('editStartYear').value
      ? parseInt(document.getElementById('editStartYear').value)
      : null,
    graduationYear: document.getElementById('editGraduationYear').value
      ? parseInt(document.getElementById('editGraduationYear').value)
      : null,
    major: document.getElementById('editMajor').value,
    currentCompany: document.getElementById('editCurrentCompany').value,
    currentJobTitle: document.getElementById('editCurrentJobTitle').value,
    location: document.getElementById('editLocation').value
  };

  await updateAlumni(formData, id);
});

closeBtn.addEventListener('click', () => {
  editModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === editModal) {
    editModal.style.display = 'none';
  }
});

// document.addEventListener('keydown', (e) => {
//   if (e.key === 'Escape') {
//     editModal.style.display = 'none';
//   }
// });

// Initial load
loadAlumni();
