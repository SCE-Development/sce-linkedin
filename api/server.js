require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const alumniRouter = require('./routes/Alumni');
const path = require('path');

const app = express();
const PORT = 8081;

app.use(express.json());

// Serve React build from dist/
app.use(express.static('dist'));

// API routes
app.use('/api', alumniRouter);

// Fallback to index.html for React - must come after static and API routes
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

const dbHost = process.env.DATABASE_HOST || '127.0.0.1';
mongoose
  .connect(`mongodb://${dbHost}:27017/sce_linkedin`)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
