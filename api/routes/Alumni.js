const express = require('express');
const Alumni = require('../models/Alumni');

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
    const alumni = await new Alumni(req.body).save();
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
