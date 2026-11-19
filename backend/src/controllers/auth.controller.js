const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const { logAudit } = require('../services/auditService');

const login = async (req, res, next) => {
  try {
    const { login, password } = req.body; // login can be email or telefone

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe o seu email/telefone e a palavra-passe.',
      });
    }

    const trimmedLogin = login.trim();
    const loginAlt = trimmedLogin.includes('@mamasalva.ao')
      ? trimmedLogin.replace('@mamasalva.ao', '@maternitysos.ao')
      : trimmedLogin.includes('@maternitysos.ao')
      ? trimmedLogin.replace('@maternitysos.ao', '@mamasalva.ao')
      : trimmedLogin;

    const result = await db.query(
      `SELECT u.id, u.nome, u.email, u.telefone, u.perfil, u.password_hash, u.ativo,
              u.municipio_base, u.bairro_base
       FROM users u
       WHERE (LOWER(u.email) = LOWER($1) OR LOWER(u.email) = LOWER($2) OR u.telefone = $1)
       LIMIT 1`,
      [trimmedLogin, loginAlt]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas. Verifique o email/telefone e tente novamente.',
      });
    }

    const user = result.rows[0];

    if (!user.ativo) {
      return res.status(403).json({
        success: false,
        message: 'Utilizador desativado. Contacte o administrador do sistema.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Palavra-passe incorreta.',
      });
    }

    // Update last login
    await db.query('UPDATE users SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { userId: user.id, perfil: user.perfil, nome: user.nome },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Fetch related profile entity if any
    let linkedData = null;
    if (user.perfil === 'gravida') {
      const g = await db.query('SELECT * FROM gravidas WHERE user_id = $1', [user.id]);
      linkedData = g.rows[0] || null;
    } else if (user.perfil === 'equipa_emergencia') {
      const amb = await db.query('SELECT * FROM ambulancias WHERE user_id = $1', [user.id]);
      linkedData = amb.rows[0] || null;
    } else if (user.perfil === 'maternidade') {
      const mat = await db.query('SELECT * FROM maternidades WHERE user_id = $1', [user.id]);
      linkedData = mat.rows[0] || null;
    }

    await logAudit({
      usuarioId: user.id,
      usuarioNome: user.nome,
      perfil: user.perfil,
      acao: 'LOGIN',
      entidade: 'users',
      entidadeId: user.id,
      ipOrigem: req.ip,
      detalhes: `Login efetuado com sucesso pelo perfil ${user.perfil}`,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        perfil: user.perfil,
        municipio_base: user.municipio_base,
        bairro_base: user.bairro_base,
        linkedData,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Fast Demo Switcher: allows switching to any of the 7 profiles instantly for evaluation
const demoLogin = async (req, res, next) => {
  try {
    const { perfil } = req.body;
    if (!perfil) {
      return res.status(400).json({ success: false, message: 'Perfil não especificado.' });
    }

    const result = await db.query(
      `SELECT u.id, u.nome, u.email, u.telefone, u.perfil, u.municipio_base, u.bairro_base
       FROM users u
       WHERE u.perfil = $1 AND u.ativo = true
       ORDER BY u.id ASC
       LIMIT 1`,
      [perfil]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Nenhum utilizador encontrado com o perfil ${perfil}.` });
    }

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, perfil: user.perfil, nome: user.nome },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    let linkedData = null;
    if (user.perfil === 'gravida') {
      const g = await db.query('SELECT * FROM gravidas WHERE user_id = $1', [user.id]);
      linkedData = g.rows[0] || null;
    } else if (user.perfil === 'equipa_emergencia') {
      const amb = await db.query('SELECT * FROM ambulancias WHERE user_id = $1', [user.id]);
      linkedData = amb.rows[0] || null;
    } else if (user.perfil === 'maternidade') {
      const mat = await db.query('SELECT * FROM maternidades WHERE user_id = $1', [user.id]);
      linkedData = mat.rows[0] || null;
    }

    res.json({
      success: true,
      token,
      user: {
        ...user,
        linkedData,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    let linkedData = null;
    if (req.user.perfil === 'gravida') {
      const g = await db.query('SELECT * FROM gravidas WHERE user_id = $1', [req.user.id]);
      linkedData = g.rows[0] || null;
    } else if (req.user.perfil === 'equipa_emergencia') {
      const amb = await db.query('SELECT * FROM ambulancias WHERE user_id = $1', [req.user.id]);
      linkedData = amb.rows[0] || null;
    } else if (req.user.perfil === 'maternidade') {
      const mat = await db.query('SELECT * FROM maternidades WHERE user_id = $1', [req.user.id]);
      linkedData = mat.rows[0] || null;
    }

    res.json({
      success: true,
      user: {
        ...req.user,
        linkedData,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  demoLogin,
  getMe,
};
