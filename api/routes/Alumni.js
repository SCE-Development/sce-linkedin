const express = require('express');
const Alumni = require('../models/Alumni');
const { enrichAlumniRecord } = require('../services/enrichmentService');
require('dotenv').config();

const router = express.Router();

// List all alumni profiles
router.get('/', async (req, res) => {
  try {
    const alumni = await Alumni.find();
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single alumni profile by ID
router.get('/:id', async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new alumni profile
router.post('/', async (req, res) => {
  try {
    // Ensure name is provided (required for enrichment)
    if (!req.body.name) {
      return res.status(400).json({ error: 'Name is required for alumni record' });
    }

    const alumni = await new Alumni(req.body).save();

    // Check if enrichment is requested
    if (req.body.needsEnrichment === true) {
      // Trigger enrichment in the background (fire and forget)
      enrichAlumniRecord(alumni)
        .then(result => {
          console.log('Enrichment triggered:', result);
        })
        .catch(error => {
          console.error('Enrichment trigger error:', error);
        });
    }

    // Return the created alumni immediately
    res.status(201).json(alumni);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing alumni profile
router.put('/:id', async (req, res) => {
  try {
    const alumni = await Alumni.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an alumni profile
router.delete('/:id', async (req, res) => {
  try {
    const alumni = await Alumni.findByIdAndDelete(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
