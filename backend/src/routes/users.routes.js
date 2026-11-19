const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

router.use(authenticateToken);

// Pesquisa de gestantes (acessível a cidadão com privacidade e operadores com vista clínica)
router.get('/search-gravidas', usersController.searchGravidas);

// Gestão de utilizadores (apenas administrador)
router.get('/', authorizeRoles('administrador'), usersController.getUsers);
router.post('/', authorizeRoles('administrador'), usersController.createUser);

// Escalas e turnos da Central
router.get(
  '/shifts',
  authorizeRoles('operador', 'supervisor', 'administrador'),
  usersController.getOperatorShifts
);

router.put(
  '/my-shift-status',
  authorizeRoles('operador', 'supervisor', 'administrador'),
  usersController.updateOperatorStatus
);

module.exports = router;
