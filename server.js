const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'frontend');

// Serve static frontend files
app.use(express.static(PUBLIC_DIR));

// Simple endpoint check
app.get('/status', (req, res) => {
  res.json({ status: 'running' });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server is running at http://localhost:${PORT}`);
});

module.exports = server;
