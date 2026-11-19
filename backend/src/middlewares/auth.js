const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado: Token de autenticação não fornecido.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const result = await db.query(
      'SELECT id, nome, email, telefone, perfil, ativo FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].ativo) {
      return res.status(401).json({
        success: false,
        message: 'Utilizador não encontrado ou inativo no sistema.',
      });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Sessão inválida ou expirada. Efetue login novamente.',
    });
  }
};

module.exports = {
  authenticateToken,
};
