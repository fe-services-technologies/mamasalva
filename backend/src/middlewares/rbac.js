const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.perfil) {
      return res.status(401).json({
        success: false,
        message: 'Utilizador não autenticado para esta operação.',
      });
    }

    if (!allowedRoles.includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado: Perfil '${req.user.perfil}' não tem autorização para realizar esta operação.`,
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
