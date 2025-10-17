const express = require('express');
const router = express.Router();

// TODO: Add verifier routes
router.get('/', (req, res) => {
  res.json({ message: 'Verifier routes - Coming soon' });
});

module.exports = router;