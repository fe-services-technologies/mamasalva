const express = require('express');
const router = express.Router();
const occurrencesController = require('../controllers/occurrences.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

// Permite criar emergência tanto autenticado como anónimo (via formulários públicos de emergência)
router.post(
  '/',
  (req, res, next) => {
    // Se o header de autorização estiver presente, tenta autenticar; senão, passa como anónimo
    if (req.headers['authorization']) {
      return authenticateToken(req, res, next);
    }
    next();
  },
  occurrencesController.createOccurrence
);

// Rotas autenticadas
router.use(authenticateToken);

router.get('/', occurrencesController.getOccurrences);
router.get('/:id', occurrencesController.getOccurrenceById);

// Etapa 3: Triagem
router.put(
  '/:id/triage',
  authorizeRoles('operador', 'supervisor', 'administrador'),
  occurrencesController.validateTriage
);

// Etapa 4: Despacho de Ambulância
router.put(
  '/:id/dispatch',
  authorizeRoles('operador', 'supervisor', 'administrador'),
  occurrencesController.dispatchAmbulance
);

// Etapa 5: Encaminhamento para Maternidade
router.put(
  '/:id/refer-maternity',
  authorizeRoles('operador', 'supervisor', 'equipa_emergencia', 'administrador'),
  occurrencesController.referToMaternity
);

// Etapas 4/5: Atualização de Estados Operacionais
router.put(
  '/:id/status',
  authorizeRoles('equipa_emergencia', 'operador', 'supervisor', 'administrador'),
  occurrencesController.updateOperationalStatus
);

// Etapa 6: Confirmação de Recepção Hospitalar
router.put(
  '/:id/confirm-reception',
  authorizeRoles('maternidade', 'supervisor', 'administrador'),
  occurrencesController.confirmReception
);

// Contingências e Suspeitas
router.put(
  '/:id/flag-suspicious',
  authorizeRoles('operador', 'supervisor', 'administrador'),
  occurrencesController.flagSuspicious
);

router.put(
  '/:id/review-suspicious',
  authorizeRoles('supervisor', 'administrador'),
  occurrencesController.reviewSuspicious
);

module.exports = router;
