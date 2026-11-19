const express = require('express');
const router = express.Router();
const maternitiesController = require('../controllers/maternities.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

router.use(authenticateToken);

router.get('/', maternitiesController.getMaternities);
router.get('/:id', maternitiesController.getMaternityById);
router.put(
  '/:id/capacity',
  authorizeRoles('maternidade', 'supervisor', 'administrador'),
  maternitiesController.updateMaternityCapacity
);

module.exports = router;
