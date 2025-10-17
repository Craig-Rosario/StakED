const express = require('express');
const router = express.Router();

// TODO: Add class routes
router.get('/', (req, res) => {
  res.json({ message: 'Class routes - Coming soon' });
});

module.exports = router;