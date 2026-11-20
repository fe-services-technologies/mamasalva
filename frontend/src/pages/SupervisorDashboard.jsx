import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { PriorityBadge, StatusBadge, RoadAccessibilityBadge } from '../components/common/Badges';
import { LuandaMap } from '../components/map/LuandaMap';

export const SupervisorDashboard = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [kpis, setKpis] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [maternities, setMaternities] = useState([]);
  const [zones, setZones] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Ação de revisão humana de trotes
  const [selectedSuspicious, setSelectedSuspicious] = useState(null);
  const [supervisorParecer, setSupervisorParecer] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadData = async () => {
    try {
      const [kpiRes, ocRes, ambRes, matRes, zonRes, shfRes] = await Promise.all([
        api.getDashboardKPIs(),
        api.getOccurrences(),
        api.getAmbulances(),
        api.getMaternities(),
        api.getZones(),
        api.getOperatorShifts(),
      ]);

      if (kpiRes.success) setKpis(kpiRes.kpis);
      if (ocRes.success) setOccurrences(ocRes.ocorrencias);
      if (ambRes.success) setAmbulances(ambRes.ambulancias);
      if (matRes.success) setMaternities(matRes.maternidades);
      if (zonRes.success) setZones(zonRes.zonas);
      if (shfRes.success) setShifts(shfRes.escalas);
    } catch (err) {
      console.error('Falha ao carregar dados do supervisor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubAlert = subscribe('supervisor:alert', () => loadData());
    const unsubUpdated = subscribe('occurrence:updated', () => loadData());
    const unsubCreated = subscribe('occurrence:created', () => loadData());

    return () => {
      unsubAlert();
      unsubUpdated();
      unsubCreated();
    };
  }, []);

  const handleReviewSuspicious = async (acao) => {
    if (!selectedSuspicious || !supervisorParecer.trim()) {
      alert('Por favor, informe o parecer técnico do supervisor.');
      return;
    }
    setReviewLoading(true);
    try {
      await api.reviewSuspicious(selectedSuspicious.id, {
        parecer_supervisor: supervisorParecer,
        acao, // 'MANTER_VALIDA' ou 'CANCELAR_TROTE'
      });
      setSelectedSuspicious(null);
      setSupervisorParecer('');
      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setReviewLoading(false);
    }
  };

  const activeL1 = occurrences.filter((o) => o.prioridade === 'Nível 1 - Vermelho' && o.estado_ocorrencia !== 'Concluída' && o.estado_ocorrencia !== 'Cancelada');
  const unassigned = occurrences.filter((o) => !o.ambulancia_id && o.estado_ocorrencia !== 'Concluída' && o.estado_ocorrencia !== 'Cancelada');
  const difficultAccessCases = occurrences.filter((o) => o.classificacao_acesso_local === 'Acesso impossível para ambulância convencional');
  const suspiciousCases = occurrences.filter((o) => o.is_suspeita_trote && !o.revisao_supervisor_feita);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 28px' }}>
      {/* Header do Supervisor */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '24px',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#D97706', fontWeight: '800', letterSpacing: '0.04em' }}>
            SALA DE SITUAÇÃO E SUPERVISÃO REGULATÓRIA
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
            Dr. Rui Kapapelo — Supervisor Chefe de Turno
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Monitoramento de sobrecarga, tempos de resposta, vias degradadas em Luanda e auditoria de chamados
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadData}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#F0F9FF',
              color: '#0284C7',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid #BAE6FD',
              cursor: 'pointer',
            }}
          >
            ↻ Sincronizar Indicadores
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>EMERGÊNCIAS CRÍTICAS (L1)</div>
          <div className="tabular-nums" style={{ fontSize: '28px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
            {activeL1.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Prioridade máxima ativa</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>SEM EQUIPA ATRIBUÍDA</div>
          <div className="tabular-nums" style={{ fontSize: '28px', fontWeight: '800', color: unassigned.length > 0 ? '#D97706' : '#059669', marginTop: '4px' }}>
            {unassigned.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Aguardando despacho</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>VIAS COM ACESSO IMPOSSÍVEL</div>
          <div className="tabular-nums" style={{ fontSize: '28px', fontWeight: '800', color: difficultAccessCases.length > 0 ? '#DC2626' : '#059669', marginTop: '4px' }}>
            {difficultAccessCases.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Exigem ponto de encontro</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>REVISÃO HUMANA (TROTES)</div>
          <div className="tabular-nums" style={{ fontSize: '28px', fontWeight: '800', color: suspiciousCases.length > 0 ? '#D97706' : '#0284C7', marginTop: '4px' }}>
            {suspiciousCases.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Pendentes de parecer</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>TEMPO MÉDIO RESPOSTA</div>
          <div className="tabular-nums" style={{ fontSize: '28px', fontWeight: '800', color: '#0284C7', marginTop: '4px' }}>
            {kpis?.tempos_medios_minutos?.media_minutos_primeira_resposta || '4.2'} min
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Entre pedido e triagem</div>
        </div>
      </div>

      {/* Grid Central: Vias / Sobrecarga + Fila de Revisão de Trotes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.25fr) minmax(360px, 1fr)', gap: '22px', marginBottom: '26px' }}>
        {/* Mapa Operacional e Vias Críticas em Luanda */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              Mapa de Cobertura e Acessibilidade Viária em Luanda
            </h3>
            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
              Maternidades: {maternities.length} | Ambulâncias: {ambulances.length}
            </span>
          </div>

          <LuandaMap
            height="360px"
            ambulances={ambulances}
            maternities={maternities}
            roadAccessStatus={difficultAccessCases.length > 0 ? 'Acesso impossível para ambulância convencional' : 'Acesso normal'}
          />

          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284C7', marginBottom: '8px' }}>
              Zonas Vulneráveis com Limitação Viária Registada:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {zones
                .filter((z) => z.classificacao_acesso !== 'Acesso normal')
                .map((z) => (
                  <div
                    key={z.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0F172A' }}>{z.nome_zona}</strong>
                      <div style={{ color: '#64748B', marginTop: '2px' }}>{z.descricao_condicoes}</div>
                    </div>
                    <RoadAccessibilityBadge classificacao={z.classificacao_acesso} />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Fila de Revisão Humana de Trotes / Suspeitas + Escala de Operadores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Fila de Trotes / Pedidos Suspeitos */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                Fila de Revisão Humana de Chamados Suspeitos ({suspiciousCases.length})
              </h3>
              <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '800', backgroundColor: '#FEF2F2', padding: '3px 8px', borderRadius: '4px' }}>
                SEM BLOQUEIO AUTOMÁTICO
              </span>
            </div>

            {suspiciousCases.length === 0 ? (
              <p style={{ fontSize: '12.5px', color: '#64748B', padding: '14px 0' }}>
                Nenhuma ocorrência sob suspeita de inconsistência pendente de parecer.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {suspiciousCases.map((sc) => (
                  <div
                    key={sc.id}
                    style={{
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: '8px',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#0F172A' }}>{sc.protocolo_codigo}</strong>
                      <span style={{ fontSize: '11.5px', color: '#B45309', fontWeight: '600' }}>{sc.solicitante_telefone}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '6px' }}>
                      Motivo apontado: <em>"{sc.motivo_suspeita}"</em>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '8px' }}>
                      Zona: {sc.bairro} ({sc.ponto_referencia})
                    </div>

                    {selectedSuspicious?.id === sc.id ? (
                      <div style={{ marginTop: '8px', borderTop: '1px solid #FDE68A', paddingTop: '8px' }}>
                        <textarea
                          rows={2}
                          placeholder="Parecer técnico fundamentado do supervisor..."
                          value={supervisorParecer}
                          onChange={(e) => setSupervisorParecer(e.target.value)}
                          style={{ width: '100%', fontSize: '12.5px', marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedSuspicious(null)}
                            style={{ padding: '4px 10px', fontSize: '12px', color: '#64748B' }}
                          >
                            Fechar
                          </button>
                          <button
                            onClick={() => handleReviewSuspicious('CANCELAR_TROTE')}
                            disabled={reviewLoading}
                            style={{
                              backgroundColor: '#DC2626',
                              color: '#FFFFFF',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                            }}
                          >
                            Confirmar Trote (Arquivar)
                          </button>
                          <button
                            onClick={() => handleReviewSuspicious('MANTER_VALIDA')}
                            disabled={reviewLoading}
                            style={{
                              backgroundColor: '#059669',
                              color: '#FFFFFF',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                            }}
                          >
                            Validar como Real (Despachar)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSuspicious(sc);
                          setSupervisorParecer('');
                        }}
                        style={{
                          backgroundColor: '#D97706',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}
                      >
                        Avaliar Chamado
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Escala de Operadores (Turnos) */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
              Escala de 3 Turnos dos Operadores da Central
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {shifts.map((s) => (
                <div
                  key={s.id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ color: '#0F172A' }}>{s.operador_nome}</strong>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{s.turno}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        backgroundColor: s.status_operador === 'Disponível' ? '#ECFDF5' : '#FFFBEB',
                        color: s.status_operador === 'Disponível' ? '#059669' : '#D97706',
                      }}
                    >
                      {s.status_operador}
                    </span>
                    <div className="tabular-nums" style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                      {s.total_atendimentos_turno} atendimentos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
