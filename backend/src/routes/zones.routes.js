const express = require('express');
const router = express.Router();
const zonesController = require('../controllers/zones.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

router.get('/', zonesController.getZones);
router.get('/:id', zonesController.getZoneById);

router.post(
  '/:id/report',
  (req, res, next) => {
    if (req.headers['authorization']) {
      return authenticateToken(req, res, next);
    }
    next();
  },
  zonesController.reportRoadCondition
);

router.put(
  '/:id/verify',
  authenticateToken,
  authorizeRoles('operador', 'supervisor', 'administrador'),
  zonesController.verifyRoadCondition
);

module.exports = router;
