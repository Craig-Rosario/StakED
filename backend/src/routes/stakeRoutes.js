const express = require('express');
const router = express.Router();

// TODO: Add stake routes
router.get('/', (req, res) => {
  res.json({ message: 'Stake routes - Coming soon' });
});

module.exports = router;