const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth');

router.post('/login', authController.login);
router.post('/demo-login', authController.demoLogin);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
