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
        setTriagePriority(res.ocorrencia.prioridade || 'Nível 1 - Vermelho');
      }
    } catch (err) {
      setSelectedOccurrence(oc);
    }
  };

  const handleValidateTriage = async () => {
    if (!selectedOccurrence) return;
    setActionLoading(true);
    try {
      await api.validateTriage(selectedOccurrence.id, {
        prioridade: triagePriority,
        justificativa: triageJustification || 'Triagem protocolada pelo operador da Central 114',
      });
      setTriageJustification('');
      loadAllData();
    } catch (err) {
      alert(`Erro na validação de triagem: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchAmbulance = async () => {
    if (!selectedOccurrence || !selectedAmbulanceId) return;
    setActionLoading(true);
    try {
      await api.dispatchAmbulance(selectedOccurrence.id, {
        ambulancia_id: parseInt(selectedAmbulanceId, 10),
      });
      loadAllData();
    } catch (err) {
      alert(`Erro no despacho de ambulância: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReferMaternity = async () => {
    if (!selectedOccurrence || !selectedMaternityId) return;
    setActionLoading(true);
    try {
      await api.referToMaternity(selectedOccurrence.id, {
        maternidade_id: parseInt(selectedMaternityId, 10),
        comunicacao_previa: true,
      });
      loadAllData();
    } catch (err) {
      alert(`Erro no encaminhamento hospitalar: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagSuspicious = async () => {
    if (!selectedOccurrence || !suspiciousReason.trim()) return;
    setActionLoading(true);
    try {
      await api.flagSuspicious(selectedOccurrence.id, {
        motivo: suspiciousReason,
      });
      setSuspiciousReason('');
      loadAllData();
    } catch (err) {
      alert(`Erro ao sinalizar suspeita: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const calculateWaitMinutes = (inicio) => {
    if (!inicio) return 0;
    const diff = Math.floor((new Date() - new Date(inicio)) / 60000);
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
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: '800', letterSpacing: '0.04em' }}>
              CENTRAL 114 DE ATENDIMENTO E REGULAÇÃO
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
              Posto de Atendimento: {user.nome}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Estado:</span>
            {['Disponível', 'Em atendimento', 'Pausa Técnica'].map((st) => (
              <button
                key={st}
                onClick={() => setShiftStatus(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: shiftStatus === st ? '700' : '500',
                  minHeight: '32px',
                  backgroundColor:
                    shiftStatus === st
                      ? st === 'Disponível'
                        ? '#ECFDF5'
                        : st === 'Em atendimento'
                        ? '#FFFBEB'
                        : '#F1F5F9'
                      : '#FFFFFF',
                  color:
                    shiftStatus === st
                      ? st === 'Disponível'
                        ? '#047857'
                        : st === 'Em atendimento'
                        ? '#B45309'
                        : '#475569'
                      : '#64748B',
                  border: shiftStatus === st ? '1px solid currentColor' : '1px solid #CBD5E1',
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
              borderRadius: '8px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '40px',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
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
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              Fila Operacional por Prioridade ({occurrences.length})
            </h3>
            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
              Ambulâncias Livres: <strong style={{ color: '#059669' }}>{freeAmbulances.length}</strong> de {ambulances.length}
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
                    backgroundColor: isSelected ? '#F0F9FF' : '#F8FAFC',
                    border: isSelected ? '2px solid #0284C7' : '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                    <div>
                      <span className="tabular-nums" style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
                        {oc.protocolo_codigo}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '8px' }}>
                        via {oc.canal_entrada}
                      </span>
                    </div>
                    <PriorityBadge prioridade={oc.prioridade} />
                  </div>

                  <div style={{ fontSize: '14px', color: '#1E293B', marginBottom: '6px', fontWeight: '700' }}>
                    {oc.gravida_nome || oc.solicitante_nome}
                    {oc.gravida_semanas ? ` (${oc.gravida_semanas} semanas)` : ''}
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '10px' }}>
                    Zona: <strong style={{ color: '#0F172A' }}>{oc.bairro}</strong> ({oc.ponto_referencia})
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                    <StatusBadge estado={oc.estado_ocorrencia} />
                    <span className="tabular-nums" style={{ color: waitMins > 15 ? '#DC2626' : '#64748B', fontWeight: '600' }}>
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
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {/* Header do Detalhe */}
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: '800', letterSpacing: '0.04em' }}>
                    PAINEL DETALHADO DA OCORRÊNCIA
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                    {selectedOccurrence.protocolo_codigo}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '3px' }}>
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
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0284C7', marginBottom: '8px' }}>
                Sintomas e Descrição da Emergência:
              </div>
              <p style={{ fontSize: '14px', color: '#0F172A', lineHeight: 1.5, marginBottom: '10px', fontWeight: '600' }}>
                {selectedOccurrence.descricao_sintomas}
              </p>

              {selectedOccurrence.condicoes_clinicas && selectedOccurrence.condicoes_clinicas.length > 0 && (
                <div style={{ fontSize: '12px', color: '#B45309', fontWeight: '600' }}>
                  Condições Pré-Natais: {selectedOccurrence.condicoes_clinicas.join(', ')}
                </div>
              )}
            </div>

            {/* Localização e Acessibilidade Viária em Luanda */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0284C7' }}>
                  Localização e Condições da Via (Luanda):
                </span>
                <RoadAccessibilityBadge
                  classificacao={selectedOccurrence.classificacao_acesso_local}
                  pontoEncontro={selectedOccurrence.ponto_encontro_coordenadas}
                />
              </div>
              <div style={{ fontSize: '13px', color: '#334155' }}>
                Bairro: <strong>{selectedOccurrence.bairro}</strong> | Rua: {selectedOccurrence.rua || 'Não indicada'}
              </div>
              <div style={{ fontSize: '13px', color: '#334155', marginTop: '3px' }}>
                Ponto de Referência: <strong>{selectedOccurrence.ponto_referencia}</strong>
              </div>
            </div>

            {/* Ações Operacionais */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Bloco 1: Validação de Triagem */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
                  1. Triagem Clínica
                </div>
                <select
                  value={triagePriority}
                  onChange={(e) => setTriagePriority(e.target.value)}
                  style={{ width: '100%', marginBottom: '8px', fontSize: '13px', padding: '8px 10px' }}
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
                  style={{ width: '100%', marginBottom: '8px', fontSize: '12.5px', padding: '8px 10px' }}
                />
                <button
                  onClick={handleValidateTriage}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  Confirmar Triagem
                </button>
              </div>

              {/* Bloco 2: Despacho de Ambulância */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
                  2. Despacho de Viatura
                </div>
                <select
                  value={selectedAmbulanceId}
                  onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                  style={{ width: '100%', marginBottom: '8px', fontSize: '13px', padding: '8px 10px' }}
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
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  Despachar Viatura
                </button>
              </div>
            </div>

            {/* Bloco 3: Encaminhamento para Maternidade */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
                3. Encaminhamento Hospitalar e Notificação Prévia
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={selectedMaternityId}
                  onChange={(e) => setSelectedMaternityId(e.target.value)}
                  style={{ flex: 1, minWidth: '240px', fontSize: '13px', padding: '8px 10px' }}
                >
                  <option value="">Selecione a maternidade...</option>
                  {maternities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} ({m.sigla}) — {m.camas_obstetricas_livres} camas livres
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
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  Avisar Maternidade
                </button>
              </div>
            </div>

            {/* Suspeita de Trote */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Motivo de suspeita (para revisão do supervisor)..."
                value={suspiciousReason}
                onChange={(e) => setSuspiciousReason(e.target.value)}
                style={{ flex: 1, minWidth: '220px', fontSize: '12.5px', padding: '7px 10px' }}
              />
              <button
                onClick={handleFlagSuspicious}
                disabled={actionLoading || !suspiciousReason.trim()}
                style={{
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: '1px solid #FCA5A5',
                }}
              >
                Sinalizar Suspeita
              </button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '40px', textAlign: 'center', color: '#64748B', borderRadius: '12px', fontSize: '14px' }}>
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
