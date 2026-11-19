const express = require('express');
const router = express.Router();
const ambulancesController = require('../controllers/ambulances.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

router.use(authenticateToken);

router.get('/', ambulancesController.getAmbulances);
router.get('/:id', ambulancesController.getAmbulanceById);
router.put(
  '/:id/status',
  authorizeRoles('equipa_emergencia', 'operador', 'supervisor', 'administrador'),
  ambulancesController.updateAmbulanceStatus
);
router.post(
  '/:id/simulate-step',
  authorizeRoles('equipa_emergencia', 'operador', 'supervisor', 'administrador'),
  ambulancesController.simulateMovement
);

module.exports = router;
