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
        const myMat = matRes.maternidades.find((m) => m.user_id === user.id) || matRes.maternidades[0];
        setMaternity(myMat);
        setCamasLivres(myMat.camas_obstetricas_livres);
        setSalasParto(myMat.salas_parto_ativas);
        setBlocoDisponivel(myMat.bloco_operatorio_disponivel);
        setNeonatologiaAtiva(myMat.neonatologia_ativa);
        setEstadoFuncionamento(myMat.estado_funcionamento);

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
  }, []);

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
      alert('Capacidade e prontidão hospitalar atualizadas e transmitidas à Central 114!');
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
      alert(`Recepção da utente ${selectedOccurrence.protocolo_codigo} confirmada com sucesso!`);
      setSelectedOccurrence(null);
      setObservacoesAdmissao('');
      loadData();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (!maternity) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>A carregar dados da maternidade...</div>;
  }

  const arrivingCases = incomingOccurrences.filter((o) => o.estado_ocorrencia !== 'Concluída' && o.estado_ocorrencia !== 'Cancelada');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 28px' }}>
      {/* Header Hospitalar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', letterSpacing: '0.04em' }}>
            REDE HOSPITALAR MATERNA DE LUANDA
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
            {maternity.nome} ({maternity.sigla})
          </h2>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '3px' }}>
            Município: {maternity.municipio} • Bairro: {maternity.bairro} | Nível: {maternity.nivel_atencao}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Prontidão da Unidade:</span>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13.5px',
              fontWeight: '700',
              backgroundColor: estadoFuncionamento === 'Normal' ? '#ECFDF5' : '#FEF2F2',
              color: estadoFuncionamento === 'Normal' ? '#047857' : '#DC2626',
              border: estadoFuncionamento === 'Normal' ? '1px solid #A7F3D0' : '1px solid #FECACA',
            }}
          >
            {estadoFuncionamento}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>
        {/* Coluna Esquerda: Notificações de Chegada Iminente */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              Notificações de Chegada Iminente / Transferências ({arrivingCases.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#0284C7', fontWeight: '600' }}>Aviso prévio via Central 114</span>
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
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span className="tabular-nums" style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                        {oc.protocolo_codigo}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '8px' }}>
                        Origem: {oc.bairro}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <PriorityBadge prioridade={oc.prioridade} />
                      <StatusBadge estado={oc.estado_ocorrencia} />
                    </div>
                  </div>

                  <LifecycleStepTracker etapaAtual={oc.etapa_atual} estado={oc.estado_ocorrencia} />

                  {/* Resumo Clínico */}
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px', margin: '10px 0', fontSize: '12.5px' }}>
                    <div style={{ fontWeight: '700', color: '#0284C7', marginBottom: '4px' }}>
                      Identificação & Dados Clínicos Obstétricos:
                    </div>
                    <div style={{ color: '#0F172A', fontWeight: '600' }}>
                      Paciente: {oc.gravida_nome || oc.solicitante_nome}
                      {oc.gravida_semanas && ` | Gestação: ${oc.gravida_semanas} semanas`}
                      {oc.grupo_sanguineo && ` | Sangue: ${oc.grupo_sanguineo}`}
                    </div>
                    <div style={{ color: '#334155', marginTop: '4px' }}>
                      Sintomas: {oc.descricao_sintomas}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
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
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              Gestão de Capacidade em Tempo Real
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B' }}>
              Valores sincronizados instantaneamente com a Central 114
            </p>
          </div>

          {/* Camas Obstétricas Livres */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Camas Obstétricas Livres</div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>Total: {maternity.camas_totais}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCamasLivres(Math.max(0, camasLivres - 1))}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', width: '28px', height: '28px', borderRadius: '4px', fontSize: '14px', fontWeight: '700' }}
              >
                -
              </button>
              <span className="tabular-nums" style={{ fontSize: '17px', fontWeight: '800', color: '#059669', minWidth: '30px', textAlign: 'center' }}>
                {camasLivres}
              </span>
              <button
                onClick={() => setCamasLivres(camasLivres + 1)}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', width: '28px', height: '28px', borderRadius: '4px', fontSize: '14px', fontWeight: '700' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Salas de Parto Ativas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Salas de Parto Operacionais</div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>Disponíveis para partos normais</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setSalasParto(Math.max(0, salasParto - 1))}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', width: '28px', height: '28px', borderRadius: '4px', fontSize: '14px', fontWeight: '700' }}
              >
                -
              </button>
              <span className="tabular-nums" style={{ fontSize: '17px', fontWeight: '800', color: '#0284C7', minWidth: '30px', textAlign: 'center' }}>
                {salasParto}
              </span>
              <button
                onClick={() => setSalasParto(salasParto + 1)}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', width: '28px', height: '28px', borderRadius: '4px', fontSize: '14px', fontWeight: '700' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Bloco Operatório */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Bloco Operatório (Cesarianas)</div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>Cirurgia obstétrica de urgência</div>
            </div>
            <button
              onClick={() => setBlocoDisponivel(!blocoDisponivel)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: blocoDisponivel ? '#ECFDF5' : '#FEF2F2',
                color: blocoDisponivel ? '#047857' : '#DC2626',
                border: blocoDisponivel ? '1px solid #A7F3D0' : '1px solid #FECACA',
              }}
            >
              {blocoDisponivel ? '✓ Disponível' : '✕ Ocupado'}
            </button>
          </div>

          {/* Neonatologia */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Unidade Neonatal (Incubadoras)</div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>Prematuridade e cuidados especiais</div>
            </div>
            <button
              onClick={() => setNeonatologiaAtiva(!neonatologiaAtiva)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: neonatologiaAtiva ? '#ECFDF5' : '#FEF2F2',
                color: neonatologiaAtiva ? '#047857' : '#DC2626',
                border: neonatologiaAtiva ? '1px solid #A7F3D0' : '1px solid #FECACA',
              }}
            >
              {neonatologiaAtiva ? '✓ Ativa' : '✕ Restrita'}
            </button>
          </div>

          {/* Estado de Funcionamento */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', color: '#334155', fontWeight: '600', marginBottom: '4px' }}>
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
              padding: '11px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: '700',
              marginTop: '4px',
            }}
          >
            {savingCapacity ? 'A gravar...' : 'Atualizar Capacidade Hospitalar'}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Recepção */}
      {selectedOccurrence && (
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
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
              Confirmar Recepção e Admissão Hospitalar
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '16px' }}>
              Protocolo: <strong style={{ color: '#0F172A' }}>{selectedOccurrence.protocolo_codigo}</strong> | Paciente:{' '}
              <strong style={{ color: '#0284C7' }}>{selectedOccurrence.gravida_nome || selectedOccurrence.solicitante_nome}</strong>
            </p>

            <form onSubmit={handleConfirmReception} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', fontWeight: '600', marginBottom: '4px' }}>
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
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', fontWeight: '600', marginBottom: '4px' }}>
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
                  style={{ padding: '8px 14px', fontSize: '12.5px', color: '#64748B', backgroundColor: '#F1F5F9', borderRadius: '6px' }}
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
                    fontSize: '12.5px',
                    fontWeight: '700',
                  }}
                >
                  Confirmar Recepção & Concluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
