import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { PriorityBadge, StatusBadge, RoadAccessibilityBadge, LifecycleStepTracker } from '../components/common/Badges';
import { PhoneIntakeModal } from '../components/channels/PhoneIntakeModal';
import { LuandaMap } from '../components/map/LuandaMap';

export const CallCenterDashboard = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [occurrences, setOccurrences] = useState([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [maternities, setMaternities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [shiftStatus, setShiftStatus] = useState('Disponível');

  // Form states inside detail drawer
  const [triagePriority, setTriagePriority] = useState('Nível 1 - Vermelho');
  const [triageJustification, setTriageJustification] = useState('');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [selectedMaternityId, setSelectedMaternityId] = useState('');
  const [suspiciousReason, setSuspiciousReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllData = async () => {
    try {
      const [ocRes, ambRes, matRes] = await Promise.all([
        api.getOccurrences(),
        api.getAmbulances(),
        api.getMaternities(),
      ]);

      if (ocRes.success) {
        setOccurrences(ocRes.ocorrencias);
        if (!selectedOccurrence && ocRes.ocorrencias.length > 0) {
          setSelectedOccurrence(ocRes.ocorrencias[0]);
        } else if (selectedOccurrence) {
          const updatedSelected = ocRes.ocorrencias.find((o) => o.id === selectedOccurrence.id);
          if (updatedSelected) setSelectedOccurrence(updatedSelected);
        }
      }
      if (ambRes.success) setAmbulances(ambRes.ambulancias);
      if (matRes.success) setMaternities(matRes.maternidades);
    } catch (err) {
      console.error('Falha ao sincronizar dados da central:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const unsubCreated = subscribe('occurrence:created', () => loadAllData());
    const unsubUpdated = subscribe('occurrence:updated', () => loadAllData());
    const unsubTriaged = subscribe('occurrence:triaged', () => loadAllData());
    const unsubAssigned = subscribe('occurrence:ambulance_assigned', () => loadAllData());
    const unsubConfirmed = subscribe('occurrence:reception_confirmed', () => loadAllData());
    const unsubAmb = subscribe('ambulance:status_updated', () => loadAllData());
    const unsubMat = subscribe('maternity:capacity_updated', () => loadAllData());

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubTriaged();
      unsubAssigned();
      unsubConfirmed();
      unsubAmb();
      unsubMat();
    };
  }, []);

  const handleSelectOccurrence = async (oc) => {
    try {
      const res = await api.getOccurrenceById(oc.id);
      if (res.success) {
        setSelectedOccurrence(res.ocorrencia);
        setTriagePriority(res.ocorrencia.prioridade !== 'Pendente' ? res.ocorrencia.prioridade : 'Nível 1 - Vermelho');
        setTriageJustification(res.ocorrencia.justificativa_prioridade || '');
        setSelectedMaternityId(res.ocorrencia.maternidade_destino_id || '');
        setSelectedAmbulanceId(res.ocorrencia.ambulancia_id || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleValidateTriage = async () => {
    if (!selectedOccurrence) return;
    setActionLoading(true);
    try {
      await api.validateTriage(selectedOccurrence.id, {
        prioridade: triagePriority,
        justificativa_prioridade: triageJustification || `Protocolo clínico validado pelo operador ${user.nome}`,
      });
      loadAllData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchAmbulance = async () => {
    if (!selectedOccurrence || !selectedAmbulanceId) {
      alert('Selecione uma viatura para despacho.');
      return;
    }
    setActionLoading(true);
    try {
      await api.dispatchAmbulance(selectedOccurrence.id, {
        ambulancia_id: selectedAmbulanceId,
      });
      loadAllData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReferMaternity = async () => {
    if (!selectedOccurrence || !selectedMaternityId) {
      alert('Selecione a maternidade de destino.');
      return;
    }
    setActionLoading(true);
    try {
      await api.referToMaternity(selectedOccurrence.id, {
        maternidade_id: selectedMaternityId,
        observacoes_encaminhamento: 'Encaminhamento com aviso prévio transmitido à equipa obstétrica hospitalar.',
      });
      loadAllData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagSuspicious = async () => {
    if (!selectedOccurrence || !suspiciousReason.trim()) {
      alert('Indique o motivo da suspeita de inconsistência ou trote.');
      return;
    }
    setActionLoading(true);
    try {
      await api.flagSuspicious(selectedOccurrence.id, {
        motivo_suspeita: suspiciousReason,
      });
      setSuspiciousReason('');
      loadAllData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const calculateWaitMinutes = (tempoInicio) => {
    if (!tempoInicio) return 0;
    const diff = Math.floor((new Date() - new Date(tempoInicio)) / 60000);
    return Math.max(0, diff);
  };

  const freeAmbulances = ambulances.filter((a) => a.estado_operacional === 'Livre');

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 28px' }}>
      {/* Top Operator Control Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '16px 24px',
          marginBottom: '24px',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#38BDF8', fontWeight: '700', letterSpacing: '0.04em' }}>
              CENTRAL 114 DE ATENDIMENTO E REGULAÇÃO
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', marginTop: '2px' }}>
              Posto de Atendimento: {user.nome}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>Estado de Atendimento:</span>
            {['Disponível', 'Em atendimento', 'Pausa Técnica'].map((st) => (
              <button
                key={st}
                onClick={() => setShiftStatus(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  fontSize: '12.5px',
                  fontWeight: shiftStatus === st ? '700' : '500',
                  minHeight: '34px',
                  backgroundColor:
                    shiftStatus === st
                      ? st === 'Disponível'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : st === 'Em atendimento'
                        ? 'rgba(217, 119, 6, 0.2)'
                        : '#334155'
                      : '#1E293B',
                  color:
                    shiftStatus === st
                      ? st === 'Disponível'
                        ? '#34D399'
                        : st === 'Em atendimento'
                        ? '#FBBF24'
                        : '#CBD5E1'
                      : '#94A3B8',
                  border: shiftStatus === st ? '1px solid currentColor' : '1px solid #334155',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setPhoneModalOpen(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: '700',
              border: '1px solid #B91C1C',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '40px',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
            }}
          >
            <span style={{ fontSize: '15px' }}>☎</span> Atender Chamada 114
          </button>
        </div>
      </div>

      {/* Main Grid: Fila à Esquerda, Detalhes da Ocorrência à Direita */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.05fr) minmax(460px, 1.45fr)', gap: '22px' }}>
        {/* Fila de Prioridades */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #1E293B' }}>
            <h3 style={{ fontSize: '15.5px', fontWeight: '700', color: '#F8FAFC' }}>
              Fila Operacional por Prioridade ({occurrences.length})
            </h3>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              Ambulâncias Livres: <strong style={{ color: '#10B981' }}>{freeAmbulances.length}</strong> de {ambulances.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '760px' }}>
            {occurrences.map((oc) => {
              const isSelected = selectedOccurrence?.id === oc.id;
              const waitMins = calculateWaitMinutes(oc.tempo_inicio);

              return (
                <div
                  key={oc.id}
                  onClick={() => handleSelectOccurrence(oc)}
                  style={{
                    backgroundColor: isSelected ? '#1E293B' : '#0B1120',
                    border: isSelected ? '1px solid #0284C7' : '1px solid #1E293B',
                    borderRadius: '7px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                    <div>
                      <span className="tabular-nums" style={{ fontSize: '14.5px', fontWeight: '800', color: '#F8FAFC' }}>
                        {oc.protocolo_codigo}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '8px' }}>
                        via {oc.canal_entrada}
                      </span>
                    </div>
                    <PriorityBadge prioridade={oc.prioridade} />
                  </div>

                  <div style={{ fontSize: '14px', color: '#CBD5E1', marginBottom: '6px', fontWeight: '600' }}>
                    {oc.gravida_nome || oc.solicitante_nome}
                    {oc.gravida_semanas ? ` (${oc.gravida_semanas} semanas)` : ''}
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#94A3B8', marginBottom: '10px' }}>
                    Zona: <strong style={{ color: '#E2E8F0' }}>{oc.bairro}</strong> ({oc.ponto_referencia})
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                    <StatusBadge estado={oc.estado_ocorrencia} />
                    <span className="tabular-nums" style={{ color: waitMins > 15 ? '#EF4444' : '#94A3B8', fontWeight: '500' }}>
                      Espera: <strong>{waitMins} min</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel Detalhado da Ocorrência Selecionada */}
        {selectedOccurrence ? (
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Header do Detalhe */}
            <div style={{ borderBottom: '1px solid #1E293B', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#38BDF8', fontWeight: '700', letterSpacing: '0.04em' }}>
                    PAINEL DETALHADO DA OCORRÊNCIA
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC', marginTop: '2px' }}>
                    {selectedOccurrence.protocolo_codigo}
                  </h3>
                  <div style={{ fontSize: '13.5px', color: '#94A3B8', marginTop: '3px' }}>
                    Solicitante: <strong>{selectedOccurrence.solicitante_nome}</strong> ({selectedOccurrence.solicitante_telefone}) | Canal: {selectedOccurrence.canal_entrada}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <PriorityBadge prioridade={selectedOccurrence.prioridade} />
                  <StatusBadge estado={selectedOccurrence.estado_ocorrencia} />
                </div>
              </div>

              {/* Lifecycle Step Tracker */}
              <div style={{ marginTop: '14px' }}>
                <LifecycleStepTracker etapaAtual={selectedOccurrence.etapa_atual} estado={selectedOccurrence.estado_ocorrencia} />
              </div>
            </div>

            {/* Informações Clínicas e Sintomatologia */}
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#38BDF8', marginBottom: '8px' }}>
                Sintomas e Descrição da Emergência:
              </div>
              <p style={{ fontSize: '14.5px', color: '#F8FAFC', lineHeight: 1.5, marginBottom: '10px' }}>
                {selectedOccurrence.descricao_sintomas}
              </p>

              {selectedOccurrence.condicoes_clinicas && selectedOccurrence.condicoes_clinicas.length > 0 && (
                <div style={{ fontSize: '12.5px', color: '#FCD34D', fontWeight: '500' }}>
                  Condições Pré-Natais Registadas: {selectedOccurrence.condicoes_clinicas.join(', ')}
                </div>
              )}
              {selectedOccurrence.observacoes_prenatal && (
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                  Obs. Pré-Natal: {selectedOccurrence.observacoes_prenatal}
                </div>
              )}
            </div>

            {/* Localização e Acessibilidade Viária em Luanda */}
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#38BDF8' }}>
                  Localização e Condições da Via (Luanda):
                </span>
                <RoadAccessibilityBadge
                  classificacao={selectedOccurrence.classificacao_acesso_local}
                  pontoEncontro={selectedOccurrence.ponto_encontro_coordenadas}
                />
              </div>
              <div style={{ fontSize: '13.5px', color: '#E2E8F0' }}>
                Bairro: <strong>{selectedOccurrence.bairro}</strong> | Rua: {selectedOccurrence.rua || 'Não indicada'}
              </div>
              <div style={{ fontSize: '13.5px', color: '#E2E8F0', marginTop: '3px' }}>
                Ponto de Referência: <strong>{selectedOccurrence.ponto_referencia}</strong>
              </div>
            </div>

            {/* Ações Operacionais: 3 Blocos de Decisão Humana */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Bloco 1: Validação de Triagem (Etapa 3) */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '6px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC', marginBottom: '10px' }}>
                  1. Triagem Clínica Protocolada
                </div>
                <select
                  value={triagePriority}
                  onChange={(e) => setTriagePriority(e.target.value)}
                  style={{ width: '100%', marginBottom: '10px', fontSize: '13.5px', padding: '9px 12px' }}
                >
                  <option value="Nível 1 - Vermelho">Nível 1 — Vermelho (Crítico / Imediato)</option>
                  <option value="Nível 2 - Amarelo">Nível 2 — Amarelo (Urgente)</option>
                  <option value="Nível 3 - Verde">Nível 3 — Verde (Não Crítico)</option>
                </select>
                <input
                  type="text"
                  placeholder="Justificativa clínica do operador..."
                  value={triageJustification}
                  onChange={(e) => setTriageJustification(e.target.value)}
                  style={{ width: '100%', marginBottom: '10px', fontSize: '13px', padding: '8px 12px' }}
                />
                <button
                  onClick={handleValidateTriage}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '5px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    minHeight: '38px',
                  }}
                >
                  Confirmar Triagem
                </button>
              </div>

              {/* Bloco 2: Despacho de Ambulância (Etapa 4) */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '6px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC', marginBottom: '10px' }}>
                  2. Despacho de Viatura de Socorro
                </div>
                <select
                  value={selectedAmbulanceId}
                  onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                  style={{ width: '100%', marginBottom: '10px', fontSize: '13.5px', padding: '9px 12px' }}
                >
                  <option value="">Selecione a ambulância...</option>
                  {ambulances.map((amb) => (
                    <option key={amb.id} value={amb.id}>
                      {amb.codigo_identificacao} ({amb.instituicao}) — {amb.estado_operacional}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleDispatchAmbulance}
                  disabled={actionLoading || !selectedAmbulanceId}
                  style={{
                    width: '100%',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '5px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    minHeight: '38px',
                  }}
                >
                  Despachar Viatura
                </button>
              </div>
            </div>

            {/* Bloco 3: Encaminhamento para Maternidade (Etapa 5) */}
            <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '6px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC', marginBottom: '10px' }}>
                3. Encaminhamento Hospitalar e Aviso Prévio à Maternidade
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={selectedMaternityId}
                  onChange={(e) => setSelectedMaternityId(e.target.value)}
                  style={{ flex: 1, minWidth: '260px', fontSize: '13.5px', padding: '9px 12px' }}
                >
                  <option value="">Selecione a unidade obstétrica de destino...</option>
                  {maternities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} ({m.sigla}) — {m.camas_obstetricas_livres} camas livres | {m.estado_funcionamento}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleReferMaternity}
                  disabled={actionLoading || !selectedMaternityId}
                  style={{
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    padding: '8px 18px',
                    borderRadius: '5px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    minHeight: '38px',
                  }}
                >
                  Enviar Aviso à Maternidade
                </button>
              </div>
            </div>

            {/* Salvaguarda: Sinalizar Pedido Suspeito para Revisão Humana */}
            <div style={{ borderTop: '1px solid #1E293B', paddingTop: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Motivo de suspeita de trote (para revisão do supervisor)..."
                value={suspiciousReason}
                onChange={(e) => setSuspiciousReason(e.target.value)}
                style={{ flex: 1, minWidth: '240px', fontSize: '13px', padding: '8px 12px' }}
              />
              <button
                onClick={handleFlagSuspicious}
                disabled={actionLoading || !suspiciousReason.trim()}
                style={{
                  backgroundColor: '#7F1D1D',
                  color: '#FCA5A5',
                  padding: '8px 14px',
                  borderRadius: '5px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  border: '1px solid #DC2626',
                  minHeight: '36px',
                }}
              >
                Sinalizar Suspeita (Revisão)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#0F172A', padding: '40px', textAlign: 'center', color: '#94A3B8', borderRadius: '8px', fontSize: '15px' }}>
            Selecione uma ocorrência na fila para visualizar os dados clínicos e conduzir as ações operacionais.
          </div>
        )}
      </div>

      {/* Modal de Registo Telefónico 114 */}
      <PhoneIntakeModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onCreated={() => loadAllData()}
      />
    </div>
  );
};
