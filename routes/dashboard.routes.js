const express = require('express');
const router = express.Router();
const path = require('path');
const { requireAdmin } = require('../middleware/auth');

// Dashboard principal
router.get('/dashboard', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

module.exports = router;
