import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { PriorityBadge, StatusBadge, RoadAccessibilityBadge, LifecycleStepTracker } from '../components/common/Badges';
import { LuandaMap } from '../components/map/LuandaMap';
import { Modal } from '../components/common/Modal';

export const EmergencyTeamDashboard = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [ambulance, setAmbulance] = useState(null);
  const [assignedOccurrence, setAssignedOccurrence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [roadObsReason, setRoadObsReason] = useState('');
  const [roadSuggestedClass, setRoadSuggestedClass] = useState('Acesso condicionado');

  const operationalStates = [
    'Livre',
    'A caminho da ocorrência',
    'No local',
    'Em transporte',
    'Indisponível',
  ];

  const loadData = async () => {
    try {
      const ambRes = await api.getAmbulances();
      if (ambRes.success && ambRes.ambulancias.length > 0) {
        // Encontrar ambulância vinculada ao utilizador logado ou a primeira para demonstração
        const myAmb = ambRes.ambulancias.find((a) => a.user_id === user.id) || ambRes.ambulancias[0];
        setAmbulance(myAmb);

        if (myAmb.ocorrencia_ativa_id) {
          const ocRes = await api.getOccurrenceById(myAmb.ocorrencia_ativa_id);
          if (ocRes.success) {
            setAssignedOccurrence(ocRes.ocorrencia);
          }
        } else {
          setAssignedOccurrence(null);
        }
      }
    } catch (err) {
      console.error('Falha ao carregar dados da equipa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubAssigned = subscribe('occurrence:ambulance_assigned', () => loadData());
    const unsubUpdated = subscribe('occurrence:updated', () => loadData());
    const unsubConfirmed = subscribe('occurrence:reception_confirmed', () => loadData());

    return () => {
      unsubAssigned();
      unsubUpdated();
      unsubConfirmed();
    };
  }, [user]);

  const handleUpdateStatus = async (novoEstado) => {
    if (!ambulance) return;
    try {
      await api.updateAmbulanceStatus(ambulance.id, {
        estado_operacional: novoEstado,
      });

      // Se houver ocorrência ativa, avançar também o estado da ocorrência
      if (assignedOccurrence) {
        let ocState = null;
        if (novoEstado === 'No local') ocState = 'Equipa no Local';
        else if (novoEstado === 'Em transporte') ocState = 'Em Transporte para Maternidade';

        if (ocState) {
          await api.updateOccurrenceStatus(assignedOccurrence.id, {
            novo_estado: ocState,
            observacao: `Equipa atualizou estado da viatura para: ${novoEstado}`,
          });
        }
      }

      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Simular avanço na rota de Luanda (1 passo mais perto do destino)
  const handleSimulateStep = async () => {
    if (!ambulance || !assignedOccurrence) return;
    setSimulating(true);

    const targetLat = assignedOccurrence.latitude || -8.8105;
    const targetLon = assignedOccurrence.longitude || 13.2750;

    try {
      const res = await api.simulateAmbulanceStep(ambulance.id, {
        target_lat: targetLat,
        target_lon: targetLon,
        step_fraction: 0.35,
      });

      if (res.success && res.data.arrived) {
        alert('Viatura de resgate chegou às imediações do local da grávida / ponto de encontro!');
      }
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleReportObstruction = async (e) => {
    e.preventDefault();
    if (!roadObsReason.trim() || !assignedOccurrence?.zona_vulneravel_id) {
      alert('Preencha o motivo do bloqueio da via.');
      return;
    }

    try {
      await api.reportRoadCondition(assignedOccurrence.zona_vulneravel_id, {
        motivo_bloqueio: roadObsReason,
        classificacao_sugerida: roadSuggestedClass,
        descricao: `Reportado em tempo real pela equipa da viatura ${ambulance.codigo_identificacao}`,
      });
      alert('Condição da via comunicada à Central 114 de Regulação.');
      setReportModalOpen(false);
      setRoadObsReason('');
      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (!ambulance) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>A carregar dados da viatura...</div>;
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 28px' }}>
      {/* Header da Viatura */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div>
          <span style={{ fontSize: '12px', color: '#38BDF8', fontWeight: '700', letterSpacing: '0.04em' }}>
            PAINEL DE BORDO DA EQUIPA DE RESGATE
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC', marginTop: '2px' }}>
            {ambulance.codigo_identificacao} — {ambulance.instituicao}
          </h2>
          <div style={{ fontSize: '13.5px', color: '#94A3B8', marginTop: '3px' }}>
            Equipa: <strong>{ambulance.equipa_responsavel}</strong> | Base: {ambulance.base_operacional}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Estado Operacional Atual:</span>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '700',
              backgroundColor: ambulance.estado_operacional === 'Livre' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 165, 233, 0.2)',
              color: ambulance.estado_operacional === 'Livre' ? '#34D399' : '#38BDF8',
              border: '1px solid currentColor',
            }}
          >
            {ambulance.estado_operacional}
          </span>
        </div>
      </div>

      {/* Botões de Transição de Estado Obrigatórios */}
      <div
        style={{
          backgroundColor: '#0B1120',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', display: 'block', marginBottom: '10px' }}>
          ATUALIZAR ESTADO OPERACIONAL DA VIATURA:
        </span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {operationalStates.map((st) => {
            const isCurrent = ambulance.estado_operacional === st;
            return (
              <button
                key={st}
                onClick={() => handleUpdateStatus(st)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  minHeight: '40px',
                  backgroundColor: isCurrent ? '#0284C7' : '#1E293B',
                  color: isCurrent ? '#FFFFFF' : '#CBD5E1',
                  border: isCurrent ? '1px solid #38BDF8' : '1px solid #334155',
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ocorrência Atribuída */}
      {assignedOccurrence ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Coluna Esquerda: Informações da Ocorrência e Rota */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #0284C7',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700' }}>
                  MISSÃO DE RESGATE ATRIBUÍDA
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#F8FAFC' }}>
                  Protocolo: {assignedOccurrence.protocolo_codigo}
                </h3>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Utente: <strong>{assignedOccurrence.gravida_nome || assignedOccurrence.solicitante_nome}</strong> ({assignedOccurrence.solicitante_telefone})
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <PriorityBadge prioridade={assignedOccurrence.prioridade} />
                <StatusBadge estado={assignedOccurrence.estado_ocorrencia} />
              </div>
            </div>

            <LifecycleStepTracker etapaAtual={assignedOccurrence.etapa_atual} estado={assignedOccurrence.estado_ocorrencia} />

            {/* Condições da Via e Ponto de Encontro */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#38BDF8' }}>
                  Condições de Acesso Viário (Luanda):
                </span>
                <RoadAccessibilityBadge
                  classificacao={assignedOccurrence.classificacao_acesso_local}
                  pontoEncontro={assignedOccurrence.ponto_encontro_coordenadas}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#E2E8F0' }}>
                Local: <strong>{assignedOccurrence.bairro}</strong> ({assignedOccurrence.ponto_referencia})
              </div>
              {assignedOccurrence.rua && (
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Rua: {assignedOccurrence.rua}</div>
              )}
            </div>

            {/* Sintomas da Grávida */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#FCA5A5' }}>
                Sintomas Reportados / Triagem:
              </span>
              <p style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '4px', lineHeight: 1.4 }}>
                {assignedOccurrence.descricao_sintomas}
              </p>
            </div>

            {/* Maternidade de Destino */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981' }}>
                Maternidade de Destino Designada:
              </span>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC', marginTop: '2px' }}>
                {assignedOccurrence.maternidade_nome || 'A definir pela regulação central'}
              </div>
            </div>

            {/* Ações da Equipa: Avançar Simulação / Comunicar Bloqueio */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={handleSimulateStep}
                disabled={simulating}
                style={{
                  flex: 1,
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: '1px solid #38BDF8',
                }}
              >
                {simulating ? 'A deslocar...' : 'Simular Deslocamento na Rota (Avançar)'}
              </button>

              <button
                onClick={() => setReportModalOpen(true)}
                style={{
                  backgroundColor: '#B45309',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid #F59E0B',
                }}
              >
                Reportar Vala / Bloqueio de Via
              </button>
            </div>
          </div>

          {/* Coluna Direita: Mapa da Rota de Resgate */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', marginBottom: '10px' }}>
              Navegação e Trajeto em Luanda:
            </h3>
            <LuandaMap
              height="400px"
              patientCoords={{ lat: assignedOccurrence.latitude, lon: assignedOccurrence.longitude }}
              patientLabel="Local da Grávida"
              ambulanceCoords={{ lat: ambulance.latitude_atual, lon: ambulance.longitude_atual }}
              ambulanceLabel={ambulance.codigo_identificacao}
              roadAccessStatus={assignedOccurrence.classificacao_acesso_local}
              rendezvousCoords={assignedOccurrence.ponto_encontro_coordenadas ? { lat: -8.8140, lon: 13.2715 } : null}
            />
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#0F172A', padding: '40px', textAlign: 'center', color: '#94A3B8', borderRadius: '8px' }}>
          Nenhuma ocorrência atribuída a esta viatura no momento. A viatura encontra-se em prontidão operacional.
        </div>
      )}

      {/* Modal de Reporte de Condição de Via */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Reporte de Condições Viárias pela Equipa"
        subtitle="Comunique bloqueios, inundações ou vias intransitáveis encontradas no terreno"
        maxWidth="500px"
      >
        <form onSubmit={handleReportObstruction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Classificação Observada pela Equipa
            </label>
            <select
              value={roadSuggestedClass}
              onChange={(e) => setRoadSuggestedClass(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="Acesso impossível para ambulância convencional">Acesso impossível para ambulância convencional</option>
              <option value="Acesso condicionado">Acesso condicionado (Buracos / Tráfego lento)</option>
              <option value="Acesso normal">Acesso normal desimpedido</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Descrição do Obstáculo no Terreno *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Vala de drenagem aberta após chuva, beco estreito sem passagem de viatura..."
              value={roadObsReason}
              onChange={(e) => setRoadObsReason(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              style={{ padding: '6px 12px', fontSize: '12px', color: '#94A3B8' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              Transmitir Alerta de Via
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
