const express = require('express');
const router = express.Router();

// TODO: Add exam routes
router.get('/', (req, res) => {
  res.json({ message: 'Exam routes - Coming soon' });
});

module.exports = router;