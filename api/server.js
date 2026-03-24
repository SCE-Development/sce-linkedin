require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const alumniRouter = require('./routes/Alumni');

const app = express();
const PORT = 8081;

app.use(express.json());
app.use(express.static('public'));
app.use('/api', alumniRouter);

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
