import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoadAccessibilityBadge } from '../components/common/Badges';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('kpis'); // 'kpis', 'users', 'zones', 'audit'
  const [kpis, setKpis] = useState(null);
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulário Novo Utilizador
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    telefone: '',
    password: '',
    perfil: 'operador',
    municipio_base: 'Luanda',
    bairro_base: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Verificação de via selecionada
  const [selectedZone, setSelectedZone] = useState(null);
  const [verifyClass, setVerifyClass] = useState('Acesso normal');
  const [verifyPontoEncontro, setVerifyPontoEncontro] = useState('');

  const loadData = async () => {
    try {
      const [kpiRes, usrRes, zonRes, audRes] = await Promise.all([
        api.getDashboardKPIs(),
        api.getUsers(),
        api.getZones(),
        api.getAuditLogs(),
      ]);

      if (kpiRes.success) setKpis(kpiRes.kpis);
      if (usrRes.success) setUsers(usrRes.users);
      if (zonRes.success) setZones(zonRes.zonas);
      if (audRes.success) setAuditLogs(audRes.logs);
    } catch (err) {
      console.error('Falha ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await api.createUser(newUser);
      alert('Utilizador cadastrado com sucesso!');
      setNewUser({
        nome: '',
        email: '',
        telefone: '',
        password: '',
        perfil: 'operador',
        municipio_base: 'Luanda',
        bairro_base: '',
      });
      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleVerifyZone = async (zoneId) => {
    try {
      await api.verifyRoadCondition(zoneId, {
        classificacao_acesso: verifyClass,
        ponto_encontro_alternativo: verifyPontoEncontro,
        bloqueio_ativo: verifyClass === 'Acesso impossível para ambulância convencional',
      });
      alert('Condição da via verificada e validada oficialmente!');
      setSelectedZone(null);
      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header do Administrador */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700', letterSpacing: '0.04em' }}>
            PAINEL DE ADMINISTRAÇÃO E AUDITORIA
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F8FAFC' }}>
            Administração Geral do Sistema MATERNITY SOS
          </h2>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            Configuração de acessos, vias de Luanda, auditoria operacional e indicadores globais
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'kpis', label: 'Indicadores Globais' },
            { key: 'users', label: 'Utilizadores & Perfis' },
            { key: 'zones', label: 'Vias & Zonas de Luanda' },
            { key: 'audit', label: 'Auditoria (Audit Logs)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: activeTab === tab.key ? '700' : '500',
                backgroundColor: activeTab === tab.key ? '#0284C7' : '#1E293B',
                color: activeTab === tab.key ? '#FFFFFF' : '#94A3B8',
                border: activeTab === tab.key ? '1px solid #38BDF8' : '1px solid #334155',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. ABA INDICADORES GLOBAIS */}
      {activeTab === 'kpis' && kpis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>Total de Ocorrências</div>
              <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: '800', color: '#F8FAFC', marginTop: '4px' }}>
                {kpis.ocorrencias.total_ocorrencias}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                {kpis.ocorrencias.ativas} em andamento ({kpis.ocorrencias.ativas_nivel_1} críticas)
              </div>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>Média Resposta da Central</div>
              <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: '800', color: '#38BDF8', marginTop: '4px' }}>
                {kpis.tempos_medios_minutos.media_minutos_primeira_resposta || '4.2'} min
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Entre registo e triagem</div>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>Média Atribuição de Viatura</div>
              <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: '800', color: '#F59E0B', marginTop: '4px' }}>
                {kpis.tempos_medios_minutos.media_minutos_atribuicao_equipa || '8.5'} min
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Despacho efetivo de socorro</div>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>Geolocalização Identificada</div>
              <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>
                {kpis.geolocalizacao.perc_geolocalizacao_identificada || '100'}%
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>GPS ou endereço geocodificado</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Distribuição por Canais de Entrada */}
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '12px' }}>
                Distribuição por Canais de Entrada:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {kpis.distribuicao_canais?.map((c) => (
                  <div key={c.canal_entrada} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>
                    <span style={{ color: '#E2E8F0' }}>{c.canal_entrada}</span>
                    <strong className="tabular-nums" style={{ color: '#38BDF8' }}>{c.total} pedidos</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribuição por Município em Luanda */}
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '12px' }}>
                Ocorrências por Município de Luanda:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {kpis.distribuicao_municipios?.map((m) => (
                  <div key={m.municipio} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>
                    <span style={{ color: '#E2E8F0' }}>{m.municipio}</span>
                    <strong className="tabular-nums" style={{ color: '#10B981' }}>{m.total} emergências</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA UTILIZADORES & PERFIS */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
          {/* Tabela de Utilizadores */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '12px' }}>
              Utilizadores do Sistema ({users.length})
            </h3>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                    <th style={{ padding: '8px' }}>Nome</th>
                    <th style={{ padding: '8px' }}>Email / Contacto</th>
                    <th style={{ padding: '8px' }}>Perfil RBAC</th>
                    <th style={{ padding: '8px' }}>Zona</th>
                    <th style={{ padding: '8px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '8px', fontWeight: '600', color: '#F8FAFC' }}>{u.nome}</td>
                      <td style={{ padding: '8px', color: '#94A3B8' }}>{u.email}<br />{u.telefone}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: '#1E293B', color: '#38BDF8', fontSize: '11px', fontWeight: '600' }}>
                          {u.perfil}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: '#94A3B8' }}>{u.municipio_base}</td>
                      <td style={{ padding: '8px', color: u.ativo ? '#10B981' : '#EF4444' }}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cadastro de Novo Utilizador */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '12px' }}>
              Cadastrar Novo Utilizador
            </h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Email Institucional *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Telefone *</label>
                <input
                  type="text"
                  required
                  value={newUser.telefone}
                  onChange={(e) => setNewUser({ ...newUser, telefone: e.target.value })}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Palavra-Passe Inicial *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Perfil de Acesso (RBAC) *</label>
                <select
                  value={newUser.perfil}
                  onChange={(e) => setNewUser({ ...newUser, perfil: e.target.value })}
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  <option value="operador">Operador Call Center</option>
                  <option value="supervisor">Supervisor da Central</option>
                  <option value="equipa_emergencia">Equipa de Emergência / Ambulância</option>
                  <option value="maternidade">Maternidade Hospitalar</option>
                  <option value="cidadao">Cidadão / Acompanhante</option>
                  <option value="gravida">Grávida</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  marginTop: '8px',
                }}
              >
                {creatingUser ? 'A cadastrar...' : 'Criar Utilizador'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ABA VIAS & ZONAS DE LUANDA */}
      {activeTab === 'zones' && (
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '12px' }}>
            Zonas de Luanda e Classificação de Acessibilidade Viária
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {zones.map((z) => (
              <div
                key={z.id}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>{z.nome_zona}</strong>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>({z.municipio})</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '2px' }}>
                    {z.descricao_condicoes}
                  </div>
                  {z.ponto_encontro_alternativo && (
                    <div style={{ fontSize: '11px', color: '#FCD34D', marginTop: '2px' }}>
                      Ponto de Encontro: <strong>{z.ponto_encontro_alternativo}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RoadAccessibilityBadge classificacao={z.classificacao_acesso} />
                  <button
                    onClick={() => {
                      setSelectedZone(z);
                      setVerifyClass(z.classificacao_acesso);
                      setVerifyPontoEncontro(z.ponto_encontro_alternativo || '');
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    Editar / Verificar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de Verificação de Via */}
          {selectedZone && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(3, 7, 18, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '20px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '20px',
                  maxWidth: '480px',
                  width: '100%',
                }}
              >
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC', marginBottom: '8px' }}>
                  Atualizar Acessibilidade: {selectedZone.nome_zona}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                      Classificação Oficial de Acesso:
                    </label>
                    <select
                      value={verifyClass}
                      onChange={(e) => setVerifyClass(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="Acesso normal">Acesso normal</option>
                      <option value="Acesso condicionado">Acesso condicionado</option>
                      <option value="Acesso impossível para ambulância convencional">Acesso impossível para ambulância convencional</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                      Ponto de Encontro Alternativo Recomendado:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Largo da BCA, Esquadra da 5ª Avenida..."
                      value={verifyPontoEncontro}
                      onChange={(e) => setVerifyPontoEncontro(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedZone(null)}
                      style={{ padding: '6px 12px', fontSize: '12px', color: '#94A3B8' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyZone(selectedZone.id)}
                      style={{
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        padding: '6px 16px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      Gravar Alteração
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ABA AUDITORIA (AUDIT LOGS) */}
      {activeTab === 'audit' && (
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '12px' }}>
            Registos de Auditoria e Conformidade Legal ({auditLogs.length})
          </h3>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                  <th style={{ padding: '6px' }}>Data / Hora</th>
                  <th style={{ padding: '6px' }}>Utilizador</th>
                  <th style={{ padding: '6px' }}>Perfil</th>
                  <th style={{ padding: '6px' }}>Ação Realizada</th>
                  <th style={{ padding: '6px' }}>Entidade</th>
                  <th style={{ padding: '6px' }}>Detalhes Operacionais</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td className="tabular-nums" style={{ padding: '6px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('pt-AO')}
                    </td>
                    <td style={{ padding: '6px', fontWeight: '600', color: '#F8FAFC' }}>
                      {log.usuario_nome}
                    </td>
                    <td style={{ padding: '6px', color: '#38BDF8' }}>{log.perfil}</td>
                    <td style={{ padding: '6px', fontWeight: '700', color: '#E2E8F0' }}>
                      {log.acao}
                    </td>
                    <td style={{ padding: '6px', color: '#94A3B8' }}>
                      {log.entidade} #{log.entidade_id}
                    </td>
                    <td style={{ padding: '6px', color: '#CBD5E1' }}>{log.detalhes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
