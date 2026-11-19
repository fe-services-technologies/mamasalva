import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { PriorityBadge, StatusBadge, LifecycleStepTracker } from '../components/common/Badges';

export const MaternityDashboard = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [maternity, setMaternity] = useState(null);
  const [incomingOccurrences, setIncomingOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [receptionModalOpen, setReceptionModalOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [responsavelRecepcao, setResponsavelRecepcao] = useState('Dra. Luísa Faria (Médica Obstetra)');
  const [observacoesAdmissao, setObservacoesAdmissao] = useState('');

  // Estados de capacidade editáveis
  const [camasLivres, setCamasLivres] = useState(14);
  const [salasParto, setSalasParto] = useState(6);
  const [blocoDisponivel, setBlocoDisponivel] = useState(true);
  const [neonatologiaAtiva, setNeonatologiaAtiva] = useState(true);
  const [estadoFuncionamento, setEstadoFuncionamento] = useState('Normal');

  const loadData = async () => {
    try {
      const matRes = await api.getMaternities();
      if (matRes.success && matRes.maternidades.length > 0) {
        // Encontra a maternidade vinculada ao utilizador logado ou a primeira
        const myMat = matRes.maternidades.find((m) => m.user_id === user.id) || matRes.maternidades[0];
        setMaternity(myMat);
        setCamasLivres(myMat.camas_obstetricas_livres);
        setSalasParto(myMat.salas_parto_ativas);
        setBlocoDisponivel(myMat.bloco_operatorio_disponivel);
        setNeonatologiaAtiva(myMat.neonatologia_ativa);
        setEstadoFuncionamento(myMat.estado_funcionamento);

        // Buscar ocorrências vinculadas à maternidade
        const ocRes = await api.getOccurrences();
        if (ocRes.success) {
          const incoming = ocRes.ocorrencias.filter((o) => o.maternidade_destino_id === myMat.id);
          setIncomingOccurrences(incoming);
        }
      }
    } catch (err) {
      console.error('Falha ao carregar maternidade:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubNotified = subscribe('occurrence:maternity_notified', () => loadData());
    const unsubUpdated = subscribe('occurrence:updated', () => loadData());
    const unsubConfirmed = subscribe('occurrence:reception_confirmed', () => loadData());

    return () => {
      unsubNotified();
      unsubUpdated();
      unsubConfirmed();
    };
  }, [user]);

  const handleUpdateCapacity = async () => {
    if (!maternity) return;
    setSavingCapacity(true);
    try {
      await api.updateMaternityCapacity(maternity.id, {
        camas_obstetricas_livres: camasLivres,
        salas_parto_ativas: salasParto,
        bloco_operatorio_disponivel: blocoDisponivel,
        neonatologia_ativa: neonatologiaAtiva,
        estado_funcionamento: estadoFuncionamento,
      });
      alert('Capacidade operacional atualizada e transmitida à Central de Coordenação.');
      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleConfirmReception = async (e) => {
    e.preventDefault();
    if (!selectedOccurrence) return;

    try {
      await api.confirmReception(selectedOccurrence.id, {
        responsavel_recepcao: responsavelRecepcao,
        observacoes_admissao: observacoesAdmissao,
      });

      alert(`Recepção formal confirmada para a gestante. Viatura desmobilizada e ciclo concluído.`);
      setSelectedOccurrence(null);
      setReceptionModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (!maternity) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>A carregar dados da maternidade...</div>;
  }

  const arrivingCases = incomingOccurrences.filter((o) => !o.maternidade_confirmou_recepcao && o.estado_ocorrencia !== 'Cancelada');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header da Maternidade */}
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
          gap: '14px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', letterSpacing: '0.04em' }}>
            UNIDADE HOSPITALAR OBSTÉTRICA
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F8FAFC' }}>
            {maternity.nome} ({maternity.sigla})
          </h2>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>
            Município: {maternity.municipio} ({maternity.bairro}) | Linha de Emergência:{' '}
            <strong style={{ color: '#F8FAFC' }}>{maternity.telefone_emergencia}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Estado de Funcionamento:</span>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: estadoFuncionamento === 'Normal' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: estadoFuncionamento === 'Normal' ? '#34D399' : '#FCA5A5',
              border: '1px solid currentColor',
            }}
          >
            {estadoFuncionamento}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Coluna Esquerda: Notificações de Chegada Iminente */}
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC' }}>
              Notificações de Chegada Iminente / Transferências ({arrivingCases.length})
            </h3>
            <span style={{ fontSize: '11px', color: '#38BDF8' }}>Aviso prévio via Central 114</span>
          </div>

          {arrivingCases.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', padding: '32px 0' }}>
              Nenhuma paciente a caminho desta maternidade no momento.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {arrivingCases.map((oc) => (
                <div
                  key={oc.id}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span className="tabular-nums" style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC' }}>
                        {oc.protocolo_codigo}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '8px' }}>
                        Origem: {oc.bairro}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <PriorityBadge prioridade={oc.prioridade} />
                      <StatusBadge estado={oc.estado_ocorrencia} />
                    </div>
                  </div>

                  <LifecycleStepTracker etapaAtual={oc.etapa_atual} estado={oc.estado_ocorrencia} />

                  {/* Resumo Clínico Autorizado */}
                  <div style={{ backgroundColor: '#0B1120', padding: '10px 12px', borderRadius: '6px', margin: '10px 0', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', color: '#38BDF8', marginBottom: '4px' }}>
                      Identificação & Dados Clínicos Obstétricos:
                    </div>
                    <div style={{ color: '#F8FAFC' }}>
                      Paciente: <strong>{oc.gravida_nome || oc.solicitante_nome}</strong>
                      {oc.gravida_semanas && ` | Idade Gestacional: ${oc.gravida_semanas} semanas`}
                      {oc.grupo_sanguineo && ` | Sangue: ${oc.grupo_sanguineo}`}
                    </div>
                    <div style={{ color: '#E2E8F0', marginTop: '4px' }}>
                      Sintomas: {oc.descricao_sintomas}
                    </div>
                    {oc.condicoes_clinicas && oc.condicoes_clinicas.length > 0 && (
                      <div style={{ color: '#FCD34D', marginTop: '2px' }}>
                        Antecedentes: {oc.condicoes_clinicas.join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      Viatura: <strong>{oc.ambulancia_codigo || 'Em trânsito'}</strong> ({oc.ambulancia_instituicao || 'INEMA'})
                    </span>

                    <button
                      onClick={() => {
                        setSelectedOccurrence(oc);
                        setReceptionModalOpen(true);
                      }}
                      style={{
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: '1px solid #10B981',
                      }}
                    >
                      CONFIRMAR RECEPÇÃO DA GRÁVIDA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna Direita: Gestão de Capacidade Operacional */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC' }}>
              Gestão de Capacidade em Tempo Real
            </h3>
            <p style={{ fontSize: '11px', color: '#94A3B8' }}>
              Estes valores sincronizam instantaneamente a Central 114 para evitar encaminhamentos a maternidades lotadas
            </p>
          </div>

          {/* Camas Obstétricas Livres */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#F8FAFC' }}>Camas Obstétricas Livres</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Total cadastrado: {maternity.camas_totais}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCamasLivres(Math.max(0, camasLivres - 1))}
                style={{ backgroundColor: '#0B1120', color: '#FFFFFF', width: '28px', height: '28px', borderRadius: '4px', fontSize: '14px', fontWeight: '700' }}
              >
                -
              </button>
              <span className="tabular-nums" style={{ fontSize: '16px', fontWeight: '800', color: '#10B981', minWidth: '30px', textAlign: 'center' }}>
                {camasLivres}
              </span>
              <button
                onClick={() => setCamasLivres(camasLivres + 1)}
                style={{ backgroundColor: '#0B1120', color: '#FFFFFF', width: '28px', height: '28px', borderRadius: '4px', fontSize: '14px', fontWeight: '700' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Salas de Parto Ativas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#F8FAFC' }}>Salas de Parto Operacionais</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Disponíveis para partos normais</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setSalasParto(Math.max(0, salasParto - 1))}
                style={{ backgroundColor: '#0B1120', color: '#FFFFFF', width: '28px', height: '28px', borderRadius: '4px', fontSize: '14px', fontWeight: '700' }}
              >
                -
              </button>
              <span className="tabular-nums" style={{ fontSize: '16px', fontWeight: '800', color: '#38BDF8', minWidth: '30px', textAlign: 'center' }}>
                {salasParto}
              </span>
              <button
                onClick={() => setSalasParto(salasParto + 1)}
                style={{ backgroundColor: '#0B1120', color: '#FFFFFF', width: '28px', height: '28px', borderRadius: '4px', fontSize: '14px', fontWeight: '700' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Bloco Operatório para Cesarianas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#F8FAFC' }}>Bloco Operatório (Cesarianas)</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Cirurgia obstétrica de urgência</div>
            </div>
            <button
              onClick={() => setBlocoDisponivel(!blocoDisponivel)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: blocoDisponivel ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: blocoDisponivel ? '#34D399' : '#FCA5A5',
                border: '1px solid currentColor',
              }}
            >
              {blocoDisponivel ? '✓ Disponível' : '✕ Ocupado / Indisponível'}
            </button>
          </div>

          {/* Neonatologia / UTI Neonatal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#F8FAFC' }}>Unidade Neonatal (Incubadoras)</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Prematuridade e cuidados especiais</div>
            </div>
            <button
              onClick={() => setNeonatologiaAtiva(!neonatologiaAtiva)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: neonatologiaAtiva ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: neonatologiaAtiva ? '#34D399' : '#FCA5A5',
                border: '1px solid currentColor',
              }}
            >
              {neonatologiaAtiva ? '✓ Ativa' : '✕ Restrita / Sem Vagas'}
            </button>
          </div>

          {/* Estado Geral de Funcionamento */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Estado Geral de Funcionamento:
            </label>
            <select
              value={estadoFuncionamento}
              onChange={(e) => setEstadoFuncionamento(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="Normal">Normal (Capacidade Regular)</option>
              <option value="Sobrecarga">Sobrecarga (Avisar Central)</option>
              <option value="Restrito">Restrito (Apenas emergências cirúrgicas)</option>
              <option value="Inoperante">Inoperante temporário</option>
            </select>
          </div>

          <button
            onClick={handleUpdateCapacity}
            disabled={savingCapacity}
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid #38BDF8',
              marginTop: '8px',
            }}
          >
            {savingCapacity ? 'A gravar...' : 'Atualizar Capacidade Hospitalar'}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Recepção (Etapa 6) */}
      {selectedOccurrence && (
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
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC', marginBottom: '4px' }}>
              Confirmar Recepção e Admissão Hospitalar
            </h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
              Protocolo: <strong style={{ color: '#F8FAFC' }}>{selectedOccurrence.protocolo_codigo}</strong> | Paciente:{' '}
              <strong style={{ color: '#38BDF8' }}>{selectedOccurrence.gravida_nome || selectedOccurrence.solicitante_nome}</strong>
            </p>

            <form onSubmit={handleConfirmReception} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  Profissional de Saúde Responsável pela Recepção *
                </label>
                <input
                  type="text"
                  required
                  value={responsavelRecepcao}
                  onChange={(e) => setResponsavelRecepcao(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  Observações de Entrada na Admissão / Triagem
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Gestante admitida estável no Bloco de Partos 2, sem intercorrências no trajeto..."
                  value={observacoesAdmissao}
                  onChange={(e) => setObservacoesAdmissao(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedOccurrence(null)}
                  style={{ padding: '8px 14px', fontSize: '12px', color: '#94A3B8' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}
                >
                  Confirmar Recepção & Concluir Ciclo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
