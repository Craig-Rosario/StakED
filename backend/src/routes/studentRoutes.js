const express = require('express');
const router = express.Router();

// TODO: Add student routes
router.get('/', (req, res) => {
  res.json({ message: 'Student routes - Coming soon' });
});

module.exports = router;