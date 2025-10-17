const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/nonce', authController.getNonce);
router.post('/verify', authController.verifySignature);

module.exports = router;