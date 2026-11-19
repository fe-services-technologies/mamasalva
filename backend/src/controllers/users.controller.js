const bcrypt = require('bcryptjs');
const db = require('../db');
const { logAudit } = require('../services/auditService');

const getUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, nome, email, telefone, perfil, municipio_base, bairro_base, ativo, ultimo_acesso, created_at
       FROM users
       ORDER BY perfil, nome`
    );

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { nome, email, telefone, password, perfil, municipio_base, bairro_base } = req.body;

    if (!nome || !email || !telefone || !password || !perfil) {
      return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (nome, email, telefone, password_hash, perfil, municipio_base, bairro_base)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nome, email, telefone, perfil, municipio_base, bairro_base, ativo, created_at`,
      [nome, email, telefone, passwordHash, perfil, municipio_base || 'Luanda', bairro_base || null]
    );

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'CRIAR_UTILIZADOR',
      entidade: 'users',
      entidadeId: result.rows[0].id,
      ipOrigem: req.ip,
      detalhes: `Novo utilizador cadastrado: ${nome} com perfil ${perfil}`,
    });

    res.status(201).json({
      success: true,
      message: 'Utilizador criado com sucesso.',
      user: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Já existe um utilizador com este email ou telefone.' });
    }
    next(err);
  }
};

// Pesquisa de grávidas (Com proteção de privacidade clínica para cidadãos)
const searchGravidas = async (req, res, next) => {
  try {
    const { q } = req.query; // search query (name or process number)
    const userRole = req.user.perfil;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, gravidas: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    let query = '';
    if (userRole === 'cidadao') {
      // Cidadão pesquisando para ajudar outra: apenas dados de identificação e bairro, SEM histórico clínico
      query = `
        SELECT g.id, g.nome_completo, g.numero_processo, g.bairro_residencia, g.municipio_residencia,
               m.nome AS maternidade_acompanhamento
        FROM gravidas g
        LEFT JOIN maternidades m ON g.maternidade_acompanhamento_id = m.id
        WHERE LOWER(g.nome_completo) LIKE LOWER($1) OR LOWER(g.numero_processo) LIKE LOWER($1)
        LIMIT 10
      `;
    } else {
      // Profissionais de saúde, operadores e administradores: dados completos
      query = `
        SELECT g.*, m.nome AS maternidade_acompanhamento
        FROM gravidas g
        LEFT JOIN maternidades m ON g.maternidade_acompanhamento_id = m.id
        WHERE LOWER(g.nome_completo) LIKE LOWER($1) OR LOWER(g.numero_processo) LIKE LOWER($1)
        LIMIT 10
      `;
    }

    const result = await db.query(query, [searchTerm]);

    res.json({
      success: true,
      gravidas: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// Escalas dos operadores da central
const getOperatorShifts = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT e.*, u.nome AS operador_nome, u.telefone AS operador_telefone,
              s.nome AS supervisor_nome
       FROM escalas_operadores e
       JOIN users u ON e.usuario_id = u.id
       LEFT JOIN users s ON e.supervisor_responsavel_id = s.id
       ORDER BY e.data_escala DESC, e.turno`
    );

    res.json({
      success: true,
      escalas: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const updateOperatorStatus = async (req, res, next) => {
  try {
    const { status_operador } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE escalas_operadores
       SET status_operador = $1
       WHERE usuario_id = $2 AND data_escala = CURRENT_DATE
       RETURNING *`,
      [status_operador, userId]
    );

    res.json({
      success: true,
      message: 'Estado do operador atualizado com sucesso.',
      escala: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  createUser,
  searchGravidas,
  getOperatorShifts,
  updateOperatorStatus,
};
