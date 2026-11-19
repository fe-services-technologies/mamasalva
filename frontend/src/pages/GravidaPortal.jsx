import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { PriorityBadge, StatusBadge, LifecycleStepTracker, RoadAccessibilityBadge } from '../components/common/Badges';
import { LuandaMap } from '../components/map/LuandaMap';

export const GravidaPortal = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [activeTab, setActiveTab] = useState('propria'); // 'propria', 'outra', 'nao_cadastrada'
  const [activeOccurrence, setActiveOccurrence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Formulário Grávida
  const [sintomasSelecionados, setSintomasSelecionados] = useState([]);
  const [outrosSintomas, setOutrosSintomas] = useState('');
  const [bairro, setBairro] = useState(user?.bairro_base || 'Tala Hady');
  const [rua, setRua] = useState('Rua dos Comandos');
  const [pontoReferencia, setPontoReferencia] = useState('Próximo ao Centro de Saúde');
  const [telefoneContato, setTelefoneContato] = useState(user?.telefone || '+244 923 456 789');
  const [usarGps, setUsarGps] = useState(true);
  const [coords, setCoords] = useState({ lat: -8.8105, lon: 13.2750 });

  // Formulário Cidadão: Pesquisa de Grávida
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGravida, setSelectedGravida] = useState(null);

  // Formulário Não Cadastrada
  const [nomeNaoCadastrada, setNomeNaoCadastrada] = useState('');
  const [relacaoSolicitante, setRelacaoSolicitante] = useState('Vizinho');

  const sintomasOpcoes = [
    'Dor de cabeça violenta / Visão turva ou pontos brilhantes (Sinais de Eclâmpsia)',
    'Hemorragia vaginal ativa ou sangramento abundante',
    'Dor abdominal súbita intensa em barra',
    'Perda contínua de água / Bolsa rota',
    'Sensação de pressão / Cabeça a querer nascer (Trabalho de Parto Avançado)',
    'Febre alta e calafrios intensos',
  ];

  const handleToggleSintoma = (s) => {
    setSintomasSelecionados((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const fetchActiveOccurrences = async () => {
    try {
      const res = await api.getOccurrences();
      if (res.success && res.ocorrencias.length > 0) {
        // Encontrar ocorrência em andamento mais recente
        const active = res.ocorrencias.find((o) => o.estado_ocorrencia !== 'Concluída' && o.estado_ocorrencia !== 'Cancelada');
        setActiveOccurrence(active || res.ocorrencias[0]);
      }
    } catch (err) {
      console.error('Falha ao carregar ocorrências:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOccurrences();

    const unsubUpdated = subscribe('occurrence:updated', (data) => {
      fetchActiveOccurrences();
    });
    const unsubAmbulance = subscribe('ambulance:position_updated', (data) => {
      if (activeOccurrence && activeOccurrence.ambulancia_id === data.ambulanceId) {
        setActiveOccurrence((prev) => ({
          ...prev,
          ambulancia_lat: data.latitude,
          ambulancia_lon: data.longitude,
          ambulancia_distancia_km: data.distanceKm,
        }));
      }
    });

    return () => {
      unsubUpdated();
      unsubAmbulance();
    };
  }, [user]);

  // Simular captura de GPS do navegador com fallback
  const handleCaptureGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setUsarGps(true);
          setSuccessMsg('Localização GPS capturada com sucesso.');
          setTimeout(() => setSuccessMsg(''), 4000);
        },
        () => {
          setErrorMsg('Sinal de GPS indisponível no dispositivo. Ativado fallback de entrada manual de endereço.');
          setUsarGps(false);
          setTimeout(() => setErrorMsg(''), 5000);
        }
      );
    } else {
      setUsarGps(false);
    }
  };

  const handleSearchGravida = async (q) => {
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      try {
        const res = await api.searchGravidas(q);
        if (res.success) setSearchResults(res.gravidas);
      } catch (err) {
        console.error('Falha na pesquisa:', err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSubmitEmergency = async (tipo) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (sintomasSelecionados.length === 0 && !outrosSintomas.trim()) {
      setErrorMsg('Por favor, assinale pelo menos um sintoma ou descreva o que está a sentir.');
      return;
    }

    if (!bairro.trim() || !pontoReferencia.trim()) {
      setErrorMsg('O bairro e o ponto de referência são indispensáveis para orientar a equipa em Luanda.');
      return;
    }

    setRequesting(true);
    try {
      let payload = {
        canal_entrada: tipo === 'propria' ? 'App Grávida' : tipo === 'outra' ? 'Cidadão Auxílio' : 'Grávida Não Cadastrada',
        solicitante_nome: tipo === 'propria' ? user.nome : `${user.nome} (Acompanhante)`,
        solicitante_telefone: telefoneContato,
        tipo_solicitante: tipo === 'propria' ? 'propria_gravida' : 'cidadao_conhecido',
        relacao_gravida: tipo === 'propria' ? 'Própria' : relacaoSolicitante,
        descricao_sintomas: `${sintomasSelecionados.join('; ')}${outrosSintomas ? ` - Outros: ${outrosSintomas}` : ''}`,
        sinais_alerta: sintomasSelecionados,
        municipio: 'Luanda',
        bairro,
        rua,
        ponto_referencia: pontoReferencia,
        latitude: coords.lat,
        longitude: coords.lon,
        origem_coordenadas: usarGps ? 'GPS Automático' : 'Entrada Manual',
      };

      if (tipo === 'outra' && selectedGravida) {
        payload.gravida_id = selectedGravida.id;
        payload.numero_processo = selectedGravida.numero_processo;
      } else if (tipo === 'nao_cadastrada') {
        payload.gravida_cadastrada = false;
        payload.tipo_solicitante = 'cidadao_desconhecido';
        payload.solicitante_nome = nomeNaoCadastrada ? `${nomeNaoCadastrada} (Registo Emergencial)` : 'Grávida Não Identificada';
      }

      const res = await api.createOccurrence(payload);
      if (res.success) {
        setActiveOccurrence(res.ocorrencia);
        setSuccessMsg(`Pedido de socorro ${res.ocorrencia.protocolo_codigo} enviado para a Central 114 de Luanda!`);
        fetchActiveOccurrences();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao enviar solicitação de socorro.');
    } finally {
      setRequesting(false);
    }
  };

  const isCitizen = user?.perfil === 'cidadao';

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 28px' }}>
      {/* Messages */}
      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '14px 18px', borderRadius: '6px', marginBottom: '18px', fontWeight: '600', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', border: '1px solid #DC2626', color: '#FCA5A5', padding: '14px 18px', borderRadius: '6px', marginBottom: '18px', fontSize: '14px' }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* Se houver ocorrência ativa, exibe o painel de acompanhamento em tempo real */}
      {activeOccurrence && activeOccurrence.estado_ocorrencia !== 'Concluída' && (
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '2px solid #0284C7',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', borderBottom: '1px solid #1E293B', paddingBottom: '16px', marginBottom: '18px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.04em' }}>
                OCORRÊNCIA EM CURSO
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC', marginTop: '2px' }}>
                Protocolo: {activeOccurrence.protocolo_codigo}
              </h2>
              <span style={{ fontSize: '13.5px', color: '#94A3B8' }}>
                Zona: {activeOccurrence.bairro} ({activeOccurrence.ponto_referencia})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PriorityBadge prioridade={activeOccurrence.prioridade} />
              <StatusBadge estado={activeOccurrence.estado_ocorrencia} />
            </div>
          </div>

          {/* Ciclo em 6 etapas */}
          <div style={{ marginBottom: '16px' }}>
            <LifecycleStepTracker etapaAtual={activeOccurrence.etapa_atual} estado={activeOccurrence.estado_ocorrencia} />
          </div>

          {/* Acessibilidade da via */}
          <div style={{ marginBottom: '16px' }}>
            <RoadAccessibilityBadge
              classificacao={activeOccurrence.classificacao_acesso_local}
              pontoEncontro={activeOccurrence.ponto_encontro_coordenadas}
            />
          </div>

          {/* Grid com Mapa e Detalhes da Coordenação */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase' }}>
                Posição Simulada e Rota de Resgate (Luanda):
              </h4>
              <LuandaMap
                height="260px"
                patientCoords={{ lat: activeOccurrence.latitude, lon: activeOccurrence.longitude }}
                patientLabel="Local da Grávida"
                ambulanceCoords={activeOccurrence.ambulancia_lat ? { lat: activeOccurrence.ambulancia_lat, lon: activeOccurrence.ambulancia_lon } : null}
                ambulanceLabel={activeOccurrence.ambulancia_codigo || 'Viatura Despachada'}
                roadAccessStatus={activeOccurrence.classificacao_acesso_local}
                rendezvousCoords={activeOccurrence.ponto_encontro_coordenadas ? { lat: -8.8140, lon: 13.2715 } : null}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Estado da Ambulância:</div>
                <div style={{ fontWeight: '700', color: '#38BDF8', fontSize: '14px' }}>
                  {activeOccurrence.ambulancia_codigo ? `${activeOccurrence.ambulancia_codigo} — ${activeOccurrence.ambulancia_instituicao || 'INEMA'}` : 'Aguardando atribuição pela Central 114'}
                </div>
                {activeOccurrence.ambulancia_equipa && (
                  <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '2px' }}>
                    Equipa: {activeOccurrence.ambulancia_equipa}
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Maternidade Destino Coordenada:</div>
                <div style={{ fontWeight: '700', color: '#10B981', fontSize: '14px' }}>
                  {activeOccurrence.maternidade_nome || 'A definir conforme triagem clínica'}
                </div>
                {activeOccurrence.maternidade_comunicada && (
                  <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '2px' }}>
                    ✓ Notificação antecipada transmitida à equipa hospitalar de recepção
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: '#0B1120', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1E293B' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Orientação Imediata ao Utente:</div>
                <p style={{ color: '#E2E8F0', fontSize: '12px', marginTop: '2px' }}>
                  Mantenha a gestante deitada do lado esquerdo (decúbito lateral esquerdo), não ofereça alimentos sólidos e mantenha o telefone desimpedido para contactos da equipa de socorro.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cartão de Identificação Pré-Natal da Grávida Cadastrada (Apenas perfil gravida) */}
      {!isCitizen && user?.linkedData && (
        <div
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700', letterSpacing: '0.04em' }}>
              CADASTRO PRÉ-NATAL VINCULADO
            </span>
            <h3 style={{ fontSize: '16px', color: '#F8FAFC', fontWeight: '700' }}>
              {user.linkedData.nome_completo} ({user.linkedData.idade} anos)
            </h3>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>
              Nº de Processo: <strong className="tabular-nums" style={{ color: '#F8FAFC' }}>{user.linkedData.numero_processo}</strong> | Tempo de Gestação:{' '}
              <strong className="tabular-nums" style={{ color: '#38BDF8' }}>{user.linkedData.semanas_gestacao} semanas</strong>
            </p>
          </div>

          <div style={{ fontSize: '12px', textAlign: 'right' }}>
            <div>Grupo Sanguíneo: <strong style={{ color: '#EF4444' }}>{user.linkedData.grupo_sanguineo || 'O+'}</strong></div>
            <div style={{ color: '#94A3B8' }}>Bairro: {user.linkedData.bairro_residencia}</div>
            {user.linkedData.condicoes_clinicas && user.linkedData.condicoes_clinicas.length > 0 && (
              <div style={{ color: '#FCD34D', fontWeight: '500', marginTop: '2px' }}>
                Condições Clínicas: {user.linkedData.condicoes_clinicas.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canais e Modos de Pedido */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {!isCitizen && (
          <button
            onClick={() => setActiveTab('propria')}
            style={{
              padding: '13px 22px',
              borderRadius: '6px',
              fontSize: '14.5px',
              fontWeight: '800',
              backgroundColor: activeTab === 'propria' ? '#DC2626' : '#1E293B',
              color: '#FFFFFF',
              border: activeTab === 'propria' ? '1px solid #B91C1C' : '1px solid #334155',
              boxShadow: activeTab === 'propria' ? '0 4px 6px rgba(220, 38, 38, 0.4)' : 'none',
              minHeight: '44px',
            }}
          >
            ESTOU A PASSAR MAL — PEDIR AJUDA
          </button>
        )}

        <button
          onClick={() => setActiveTab('outra')}
          style={{
            padding: '13px 22px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '700',
            backgroundColor: activeTab === 'outra' ? '#0284C7' : '#1E293B',
            color: '#FFFFFF',
            border: activeTab === 'outra' ? '1px solid #0369A1' : '1px solid #334155',
            minHeight: '44px',
          }}
        >
          PEDIR AJUDA PARA OUTRA PESSOA
        </button>

        <button
          onClick={() => setActiveTab('nao_cadastrada')}
          style={{
            padding: '13px 22px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '700',
            backgroundColor: activeTab === 'nao_cadastrada' ? '#D97706' : '#1E293B',
            color: '#FFFFFF',
            border: activeTab === 'nao_cadastrada' ? '1px solid #B45309' : '1px solid #334155',
            minHeight: '44px',
          }}
        >
          GRÁVIDA NÃO CADASTRADA — EMERGÊNCIA
        </button>
      </div>

      {/* Formulário Principal de Solicitação */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '28px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC', marginBottom: '6px' }}>
          {activeTab === 'propria' && 'Solicitação de Socorro Obstétrico Imediato'}
          {activeTab === 'outra' && 'Auxílio a Outra Grávida Cadastrada no Sistema'}
          {activeTab === 'nao_cadastrada' && 'Registo Emergencial de Grávida Sem Cadastro'}
        </h3>
        <p style={{ fontSize: '13.5px', color: '#94A3B8', marginBottom: '22px', lineHeight: 1.5 }}>
          {activeTab === 'outra' && 'Por respeito rigoroso à privacidade médica, o cidadão não visualiza o histórico clínico detalhado da gestante.'}
          {activeTab === 'nao_cadastrada' && 'O sistema recolhe apenas os dados estritamente necessários para enviar o socorro. O registo clínico integral será feito na maternidade.'}
          {activeTab === 'propria' && 'Selecione os sintomas observados para orientar a equipa da Central 114.'}
        </p>

        {/* Se for auxílio para outra: pesquisa */}
        {activeTab === 'outra' && (
          <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: '#1E293B', borderRadius: '6px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#38BDF8', marginBottom: '6px' }}>
              Pesquisar Grávida por Nome ou Nº de Processo Pré-Natal:
            </label>
            <input
              type="text"
              placeholder="Digite o nome ou processo (ex: Esperança ou GRAV-2026-0814)..."
              value={searchQuery}
              onChange={(e) => handleSearchGravida(e.target.value)}
              style={{ width: '100%', fontSize: '13px', marginBottom: '8px' }}
            />

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {searchResults.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGravida(g)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: selectedGravida?.id === g.id ? '#0369A1' : '#0B1120',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#F8FAFC' }}>{g.nome_completo}</strong>
                      <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '8px' }}>
                        Processo: {g.numero_processo} | Bairro: {g.bairro_residencia}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '600' }}>
                      {selectedGravida?.id === g.id ? '✓ Selecionada' : 'Selecionar'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Se for grávida não cadastrada: nome opcional e relação */}
        {activeTab === 'nao_cadastrada' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                Nome da Grávida (se conhecido)
              </label>
              <input
                type="text"
                placeholder="Nome ou 'Desconhecido'"
                value={nomeNaoCadastrada}
                onChange={(e) => setNomeNaoCadastrada(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                Sua Relação com a Grávida
              </label>
              <select
                value={relacaoSolicitante}
                onChange={(e) => setRelacaoSolicitante(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Vizinho">Vizinho / Morador Próximo</option>
                <option value="Esposo / Familiar">Esposo / Familiar</option>
                <option value="Transeunte">Transeunte na via pública</option>
                <option value="Enfermeiro Comunitário">Agente de Saúde Comunitário</option>
              </select>
            </div>
          </div>
        )}

        {/* Sintomas / Situação Observada */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#F8FAFC', marginBottom: '8px' }}>
            Selecione o que está a acontecer (Sintomas / Sinais de Alerta): *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
            {sintomasOpcoes.map((s) => {
              const isChecked = sintomasSelecionados.includes(s);
              return (
                <div
                  key={s}
                  onClick={() => handleToggleSintoma(s)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: isChecked ? 'rgba(220, 38, 38, 0.2)' : '#1E293B',
                    border: isChecked ? '1px solid #DC2626' : '1px solid #334155',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isChecked ? '600' : '400',
                    color: isChecked ? '#FCA5A5' : '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '700', color: isChecked ? '#DC2626' : '#64748B' }}>
                    {isChecked ? '☑' : '☐'}
                  </span>
                  <span>{s}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Outras observações importantes sobre o estado da mulher..."
              value={outrosSintomas}
              onChange={(e) => setOutrosSintomas(e.target.value)}
              style={{ width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Localização e Fallback de GPS */}
        <div style={{ marginBottom: '20px', backgroundColor: '#1E293B', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                Localização Exata da Ocorrência em Luanda
              </span>
              <p style={{ fontSize: '11px', color: '#94A3B8' }}>
                Coordenadas e referências para guiar a equipa de emergência
              </p>
            </div>
            <button
              type="button"
              onClick={handleCaptureGps}
              style={{
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
              }}
            >
              Capturar GPS Atual
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                Bairro em Luanda *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Tala Hady, Cazenga"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                Rua / Travessa
              </label>
              <input
                type="text"
                placeholder="Ex: Rua dos Comandos, Beco 12"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                Ponto de Referência Conhecido (Escola, Hospital, Bomba, Mercado) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Próximo ao Centro de Saúde do Tala Hady, perto da Esquadra..."
                value={pontoReferencia}
                onChange={(e) => setPontoReferencia(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Botão de Envio de Emergência */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ fontSize: '13.5px', color: '#94A3B8' }}>
            Contacto do Solicitante: <strong style={{ color: '#F8FAFC' }}>{telefoneContato}</strong>
          </div>

          <button
            onClick={() => handleSubmitEmergency(activeTab)}
            disabled={requesting}
            style={{
              padding: '14px 32px',
              borderRadius: '6px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: '800',
              letterSpacing: '0.04em',
              border: '1px solid #B91C1C',
              boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.4)',
              minHeight: '48px',
            }}
          >
            {requesting ? 'A enviar socorro...' : 'CONFIRMAR E ENVIAR PEDIDO DE AJUDA'}
          </button>
        </div>
      </div>
    </div>
  );
};
