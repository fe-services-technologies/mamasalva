const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

router.use(authenticateToken);

router.get(
  '/kpis',
  authorizeRoles('operador', 'supervisor', 'administrador'),
  reportsController.getDashboardKPIs
);

router.get(
  '/audit-logs',
  authorizeRoles('supervisor', 'administrador'),
  reportsController.getAuditLogs
);

module.exports = router;
