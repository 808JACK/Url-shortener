require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const linksRouter = require('./routes/links');
const redirectRouter = require('./routes/redirect');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Routes
app.use('/healthz', healthRouter);
app.use('/api/links', linksRouter);
app.use('/', redirectRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
