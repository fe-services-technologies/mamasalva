import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoadAccessibilityBadge } from '../components/common/Badges';
import { LuandaMap } from '../components/map/LuandaMap';

export const AdminDashboard = ({ onOpenUssd, onOpenSms, onOpenContingency }) => {
  const [activeTab, setActiveTab] = useState('kpis'); // 'kpis', 'users', 'zones', 'audit', 'operations'
  const [kpis, setKpis] = useState(null);
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [maternities, setMaternities] = useState([]);
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
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Verificação de via selecionada
  const [selectedZone, setSelectedZone] = useState(null);
  const [verifyClass, setVerifyClass] = useState('Acesso normal');
  const [verifyPontoEncontro, setVerifyPontoEncontro] = useState('');

  const loadData = async () => {
    try {
      const [kpiRes, usrRes, zonRes, audRes, ambRes, matRes] = await Promise.all([
        api.getDashboardKPIs(),
        api.getUsers(),
        api.getZones(),
        api.getAuditLogs(),
        api.getAmbulances(),
        api.getMaternities(),
      ]);

      if (kpiRes.success) setKpis(kpiRes.kpis);
      if (usrRes.success) setUsers(usrRes.users);
      if (zonRes.success) setZones(zonRes.zonas);
      if (audRes.success) setAuditLogs(audRes.logs);
      if (ambRes.success) setAmbulances(ambRes.ambulancias);
      if (matRes.success) setMaternities(matRes.maternidades);
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
    setCreateSuccess('');
    setCreateError('');
    try {
      await api.createUser(newUser);
      setCreateSuccess(`Utilizador ${newUser.nome} (${newUser.perfil}) registado com sucesso!`);
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
      setTimeout(() => setCreateSuccess(''), 5000);
    } catch (err) {
      setCreateError(err.message || 'Falha ao criar utilizador.');
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
      setSelectedZone(null);
      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1560px', margin: '0 auto', padding: '28px 32px 70px' }}>
      {/* Header do Painel Administrativo */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '18px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div>
          <span style={{ fontSize: '13px', color: '#0284C7', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            PAINEL DE ADMINISTRAÇÃO E AUDITORIA GERAL
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '3px' }}>
            Coordenação Central MATERNITY SOS Luanda
          </h2>
          <p style={{ fontSize: '15px', color: '#64748B', marginTop: '2px' }}>
            Gestão de equipas, infraestrutura viária de Luanda, auditoria operacional e indicadores globais
          </p>
        </div>

        {/* Tab Switcher (Escala 125%) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'kpis', label: '📊 Indicadores Globais' },
            { key: 'users', label: '👥 Utilizadores & Perfis' },
            { key: 'zones', label: '🛣️ Vias & Zonas de Luanda' },
            { key: 'operations', label: '🏥 Frota & Maternidades' },
            { key: 'audit', label: '🔒 Auditoria Operacional' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '14.5px',
                fontWeight: activeTab === tab.key ? '800' : '600',
                backgroundColor: activeTab === tab.key ? '#0284C7' : '#F1F5F9',
                color: activeTab === tab.key ? '#FFFFFF' : '#334155',
                border: activeTab === tab.key ? '1px solid #0284C7' : '1.5px solid #E2E8F0',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. ABA INDICADORES GLOBAIS */}
      {activeTab === 'kpis' && kpis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '700' }}>Total de Ocorrências</div>
              <div className="tabular-nums" style={{ fontSize: '34px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
                {kpis.ocorrencias.total_ocorrencias}
              </div>
              <div style={{ fontSize: '13px', color: '#DC2626', fontWeight: '700', marginTop: '4px' }}>
                {kpis.ocorrencias.ativas} em andamento ({kpis.ocorrencias.ativas_nivel_1} críticas L1)
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '700' }}>Média de Resposta da Central</div>
              <div className="tabular-nums" style={{ fontSize: '34px', fontWeight: '800', color: '#0284C7', marginTop: '6px' }}>
                {kpis.tempos_medios_minutos.media_minutos_primeira_resposta || '4.2'} min
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Entre o registo e a triagem clínica</div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '700' }}>Tempo de Despacho de Viatura</div>
              <div className="tabular-nums" style={{ fontSize: '34px', fontWeight: '800', color: '#D97706', marginTop: '6px' }}>
                {kpis.tempos_medios_minutos.media_minutos_atribuicao_equipa || '8.5'} min
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Atribuição efetiva à ambulância INEMA</div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '700' }}>Taxa de Geolocalização Identificada</div>
              <div className="tabular-nums" style={{ fontSize: '34px', fontWeight: '800', color: '#059669', marginTop: '6px' }}>
                {kpis.geolocalizacao.perc_geolocalizacao_identificada || '100'}%
              </div>
              <div style={{ fontSize: '13px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>GPS ou Bairro de Luanda mapeado</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>
            {/* Distribuição por Canais de Entrada */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
                Distribuição por Canais de Entrada em Luanda:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {kpis.distribuicao_canais?.map((c) => (
                  <div key={c.canal_entrada} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px 18px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '15px' }}>
                    <span style={{ color: '#1E293B', fontWeight: '700' }}>{c.canal_entrada}</span>
                    <strong className="tabular-nums" style={{ color: '#0284C7', fontSize: '16px' }}>{c.total} pedidos</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribuição por Município em Luanda */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
                Ocorrências por Município de Luanda:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {kpis.distribuicao_municipios?.map((m) => (
                  <div key={m.municipio} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px 18px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '15px' }}>
                    <span style={{ color: '#1E293B', fontWeight: '700' }}>{m.municipio}</span>
                    <strong className="tabular-nums" style={{ color: '#059669', fontSize: '16px' }}>{m.total} emergências</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mapa Geral de Luanda */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
              Mapa Operacional Integrado da Província de Luanda:
            </h3>
            <LuandaMap
              height="400px"
              zones={zones}
              ambulances={ambulances}
              maternities={maternities}
            />
          </div>
        </div>
      )}

      {/* 2. ABA UTILIZADORES & PERFIS */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '26px' }}>
          {/* Tabela de Utilizadores */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
              Utilizadores do Sistema Registados ({users.length})
            </h3>
            <div style={{ maxHeight: '620px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #CBD5E1', color: '#64748B' }}>
                    <th style={{ padding: '12px 10px' }}>Nome</th>
                    <th style={{ padding: '12px 10px' }}>Email / Contacto</th>
                    <th style={{ padding: '12px 10px' }}>Perfil RBAC</th>
                    <th style={{ padding: '12px 10px' }}>Zona</th>
                    <th style={{ padding: '12px 10px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '800', color: '#0F172A' }}>{u.nome}</td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{u.email}<br /><span style={{ fontSize: '13px', color: '#64748B' }}>{u.telefone}</span></td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#E0F2FE', color: '#0284C7', fontSize: '12.5px', fontWeight: '800' }}>
                          {u.perfil}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', color: '#64748B' }}>{u.municipio_base}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ color: u.ativo ? '#059669' : '#DC2626', fontWeight: '800', fontSize: '13px' }}>
                          {u.ativo ? '● Ativo' : '● Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cadastro de Novo Utilizador */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
              Cadastrar Novo Utilizador Oficial
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '18px' }}>
              Atribua credenciais e perfil RBAC para profissionais da saúde e operadores
            </p>

            {createSuccess && (
              <div style={{ backgroundColor: '#ECFDF5', border: '1.5px solid #A7F3D0', color: '#065F46', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '14px', fontWeight: '700' }}>
                ✓ {createSuccess}
              </div>
            )}
            {createError && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '14px' }}>
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '4px' }}>Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Ana Luísa dos Santos"
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '4px' }}>Email Institucional *</label>
                <input
                  type="email"
                  required
                  placeholder="nome@maternitysos.ao"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '4px' }}>Telefone de Contacto (+244) *</label>
                <input
                  type="text"
                  required
                  placeholder="+244 9..."
                  value={newUser.telefone}
                  onChange={(e) => setNewUser({ ...newUser, telefone: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '4px' }}>Palavra-Passe Provisória *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '4px' }}>Perfil de Acesso (RBAC) *</label>
                <select
                  value={newUser.perfil}
                  onChange={(e) => setNewUser({ ...newUser, perfil: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="operador">Operador Call Center 114</option>
                  <option value="supervisor">Supervisor Central de Regulação</option>
                  <option value="equipa_emergencia">Equipa de Emergência / Ambulância INEMA</option>
                  <option value="maternidade">Maternidade Hospitalar</option>
                  <option value="administrador">Administrador de Sistema</option>
                  <option value="cidadao">Cidadão / Acompanhante</option>
                  <option value="gravida">Grávida / Gestante</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '13px 20px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '800',
                  marginTop: '8px',
                }}
              >
                {creatingUser ? 'A registar...' : 'Criar Utilizador'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ABA VIAS & ZONAS DE LUANDA */}
      {activeTab === 'zones' && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
              Zonas de Luanda e Monitorização de Acessibilidade Viária
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>
              Classificação das vias para ambulâncias e definição de pontos de encontro seguros
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {zones.map((z) => (
              <div
                key={z.id}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '16px', color: '#0F172A' }}>{z.nome_zona}</strong>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>({z.municipio})</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                    {z.descricao_condicoes}
                  </div>
                  {z.ponto_encontro_alternativo && (
                    <div style={{ fontSize: '13.5px', color: '#D97706', marginTop: '4px', fontWeight: '700' }}>
                      📍 Ponto de Encontro: {z.ponto_encontro_alternativo}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <RoadAccessibilityBadge classificacao={z.classificacao_acesso} />
                  <button
                    onClick={() => {
                      setSelectedZone(z);
                      setVerifyClass(z.classificacao_acesso);
                      setVerifyPontoEncontro(z.ponto_encontro_alternativo || '');
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      color: '#0284C7',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: '800',
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
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '24px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '28px',
                  maxWidth: '540px',
                  width: '100%',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12)',
                }}
              >
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
                  Atualizar Acessibilidade: {selectedZone.nome_zona}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '5px' }}>
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
                    <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '5px' }}>
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedZone(null)}
                      style={{ padding: '9px 16px', fontSize: '14px', color: '#64748B', backgroundColor: '#F1F5F9', borderRadius: '8px' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyZone(selectedZone.id)}
                      style={{
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        padding: '9px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '800',
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

      {/* 4. ABA FROTA & MATERNIDADES */}
      {activeTab === 'operations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
          {/* Maternidades */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
              Rede de Maternidades da Província de Luanda ({maternities.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {maternities.map((mat) => (
                <div key={mat.id} style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '15px', color: '#0F172A' }}>{mat.nome} ({mat.sigla})</strong>
                    <span style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '5px', backgroundColor: '#ECFDF5', color: '#059669', fontWeight: '800' }}>
                      {mat.estado_funcionamento}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px' }}>
                    Município: {mat.municipio} • Bairro: {mat.bairro}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px' }}>
                    <div>Camas Livres: <strong style={{ color: '#059669' }}>{mat.camas_obstetricas_livres}</strong></div>
                    <div>Salas Parto: <strong style={{ color: '#0284C7' }}>{mat.salas_parto_ativas}</strong></div>
                    <div>Bloco: <strong style={{ color: mat.bloco_operatorio_disponivel ? '#059669' : '#DC2626' }}>{mat.bloco_operatorio_disponivel ? 'Disponível' : 'Ocupado'}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ambulâncias */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
              Frota de Ambulâncias em Luanda ({ambulances.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {ambulances.map((amb) => (
                <div key={amb.id} style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '15px', color: '#0F172A' }}>{amb.codigo_identificacao}</strong>
                    <span style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '5px', backgroundColor: amb.estado_operacional === 'Livre' ? '#ECFDF5' : '#E0F2FE', color: amb.estado_operacional === 'Livre' ? '#059669' : '#0284C7', fontWeight: '800' }}>
                      {amb.estado_operacional}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px' }}>
                    Instituição: {amb.instituicao} • Base: {amb.municipio_base}
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', marginTop: '8px' }}>
                    Equipa: {amb.equipa_designada || 'Equipa de Turno'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ABA AUDITORIA (AUDIT LOGS) */}
      {activeTab === 'audit' && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
            Registos de Auditoria e Conformidade Legal ({auditLogs.length})
          </h3>
          <div style={{ maxHeight: '620px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #CBD5E1', color: '#64748B' }}>
                  <th style={{ padding: '10px' }}>Data / Hora</th>
                  <th style={{ padding: '10px' }}>Utilizador</th>
                  <th style={{ padding: '10px' }}>Perfil</th>
                  <th style={{ padding: '10px' }}>Ação Realizada</th>
                  <th style={{ padding: '10px' }}>Entidade</th>
                  <th style={{ padding: '10px' }}>Detalhes Operacionais</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="tabular-nums" style={{ padding: '10px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('pt-AO')}
                    </td>
                    <td style={{ padding: '10px', fontWeight: '800', color: '#0F172A' }}>
                      {log.usuario_nome}
                    </td>
                    <td style={{ padding: '10px', color: '#0284C7', fontWeight: '700' }}>{log.perfil}</td>
                    <td style={{ padding: '10px', fontWeight: '800', color: '#1E293B' }}>
                      {log.acao}
                    </td>
                    <td style={{ padding: '10px', color: '#64748B' }}>
                      {log.entidade} #{log.entidade_id}
                    </td>
                    <td style={{ padding: '10px', color: '#334155' }}>{log.detalhes}</td>
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
