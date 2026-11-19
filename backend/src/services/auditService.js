const db = require('../db');

const logAudit = async ({
  usuarioId,
  usuarioNome,
  perfil,
  acao,
  entidade,
  entidadeId,
  ipOrigem,
  dadosAnteriores = null,
  dadosNovos = null,
  detalhes = '',
}) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (
        usuario_id, usuario_nome, perfil, acao, entidade, entidade_id, ip_origem, dados_anteriores, dados_novos, detalhes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        usuarioId || null,
        usuarioNome || 'Sistema MATERNITY SOS',
        perfil || 'sistema',
        acao,
        entidade,
        String(entidadeId || ''),
        ipOrigem || '127.0.0.1',
        dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
        dadosNovos ? JSON.stringify(dadosNovos) : null,
        detalhes,
      ]
    );
  } catch (err) {
    console.error('Falha ao gravar audit_log:', err.message);
  }
};

module.exports = {
  logAudit,
};
