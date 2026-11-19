const express = require('express');
const router = express.Router();
const channelsController = require('../controllers/channels.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

// Simulador interativo USSD (*114#) - Acesso público para simulação móvel
router.post('/ussd', channelsController.handleUssdSession);

// Registo rápido de chamada verbal 114 pelo operador da central
router.post(
  '/phone-call',
  authenticateToken,
  authorizeRoles('operador', 'supervisor', 'administrador'),
  channelsController.createPhoneIntake
);

// Logs e envio de SMS
router.get('/sms', authenticateToken, channelsController.getSmsLogs);
router.post('/sms/send', authenticateToken, channelsController.sendSms);

module.exports = router;
