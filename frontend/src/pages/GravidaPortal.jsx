import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { PriorityBadge, StatusBadge, LifecycleStepTracker, RoadAccessibilityBadge } from '../components/common/Badges';
import { LuandaMap } from '../components/map/LuandaMap';

export const GravidaPortal = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  // App navigation tabs: 'socorro' (emergência), 'caderneta' (minha gravidez), 'ajudar' (ajudar outra pessoa)
  const [currentTab, setCurrentTab] = useState('socorro');

  const [activeOccurrence, setActiveOccurrence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Formulário Grávida
  const [sintomasSelecionados, setSintomasSelecionados] = useState([]);
  const [outrosSintomas, setOutrosSintomas] = useState('');
  const [bairro, setBairro] = useState(user?.bairro_base || 'Tala Hady');
  const [rua, setRua] = useState('Rua dos Comandos');
  const [pontoReferencia, setPontoReferencia] = useState('Próximo ao Centro de Saúde');
  const [telefoneContato, setTelefoneContato] = useState(user?.telefone || '+244 923 456 789');
  const [usarGps, setUsarGps] = useState(true);
  const [coords, setCoords] = useState({ lat: -8.8105, lon: 13.2750 });

  // Modo Ajudar Outra Pessoa (Cidadão)
  const [nomeOutra, setNomeOutra] = useState('');
  const [relacaoOutra, setRelacaoOutra] = useState('Vizinho');

  const sintomasAmigaveis = [
    { id: 'hemorragia', icon: '🩸', label: 'Sangramento / Sangue', desc: 'Perda de sangue pela vagina' },
    { id: 'dores', icon: '⚡', label: 'Dores Fortes na Barriga', desc: 'Contrações ou cólicas muito intensas' },
    { id: 'bolsa', icon: '💧', label: 'Bolsa Rota / Água a Sair', desc: 'Líquido a escorrer pelas pernas' },
    { id: 'eclampsia', icon: '🧠', label: 'Dor de Cabeça / Tonturas', desc: 'Visão com pontos brilhantes ou pressão alta' },
    { id: 'parto', icon: '👶', label: 'Bebé a Querer Nascer', desc: 'Sensação de cabeça a querer sair' },
    { id: 'febre', icon: '🌡️', label: 'Febre Alta e Tremores', desc: 'Corpo muito quente ou calafrios fortes' },
  ];

  const handleToggleSintoma = (label) => {
    setSintomasSelecionados((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const fetchActiveOccurrences = async () => {
    try {
      const res = await api.getOccurrences();
      if (res.success && res.ocorrencias.length > 0) {
        const active = res.ocorrencias.find((o) => o.estado_ocorrencia !== 'Concluída' && o.estado_ocorrencia !== 'Cancelada');
        setActiveOccurrence(active || null);
      } else {
        setActiveOccurrence(null);
      }
    } catch (err) {
      console.error('Falha ao carregar ocorrências:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOccurrences();

    const unsubUpdated = subscribe('occurrence:updated', () => fetchActiveOccurrences());
    const unsubCreated = subscribe('occurrence:created', () => fetchActiveOccurrences());
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
      unsubCreated();
      unsubAmbulance();
    };
  }, [user]);

  const handleCaptureGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setUsarGps(true);
          setSuccessMsg('Localização GPS capturada com sucesso!');
          setTimeout(() => setSuccessMsg(''), 4000);
        },
        () => {
          setErrorMsg('Sinal de GPS fraco. Por favor, confirme o Bairro e o Ponto de Referência.');
          setUsarGps(false);
          setTimeout(() => setErrorMsg(''), 5000);
        }
      );
    } else {
      setUsarGps(false);
    }
  };

  const handleSubmitSocorro = async (isAjudaOutra = false) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (sintomasSelecionados.length === 0 && !outrosSintomas.trim()) {
      setErrorMsg('Por favor, toque em pelo menos um sintoma que esteja a sentir.');
      return;
    }

    if (!bairro.trim() || !pontoReferencia.trim()) {
      setErrorMsg('Por favor, informe o Bairro e um Ponto de Referência para a equipa saber onde ir.');
      return;
    }

    setRequesting(true);
    try {
      const payload = {
        canal_entrada: isAjudaOutra ? 'App Cidadão Auxílio' : 'App MATERNITY SOS Luanda',
        solicitante_nome: isAjudaOutra ? `${user?.nome || 'Acompanhante'} (Ajudando)` : (user?.nome || 'Esperança Manuel'),
        solicitante_telefone: telefoneContato,
        tipo_solicitante: isAjudaOutra ? 'cidadao_conhecido' : 'propria_gravida',
        relacao_gravida: isAjudaOutra ? relacaoOutra : 'Própria',
        descricao_sintomas: `${sintomasSelecionados.join('; ')}${outrosSintomas ? ` - Outro: ${outrosSintomas}` : ''}`,
        sinais_alerta: sintomasSelecionados,
        municipio: 'Luanda',
        bairro,
        rua,
        ponto_referencia: pontoReferencia,
        latitude: coords.lat,
        longitude: coords.lon,
        origem_coordenadas: usarGps ? 'GPS Automático do Telemóvel' : 'Entrada Manual',
      };

      if (isAjudaOutra) {
        payload.gravida_cadastrada = false;
        payload.tipo_solicitante = 'cidadao_desconhecido';
        payload.solicitante_nome = nomeOutra ? `${nomeOutra} (Pedido Comunitário)` : 'Grávida na Comunidade';
      }

      const res = await api.createOccurrence(payload);
      if (res.success) {
        setActiveOccurrence(res.ocorrencia);
        setSuccessMsg(`Pedido de socorro ${res.ocorrencia.protocolo_codigo} enviado! A equipa 114 já foi alertada.`);
        setShowForm(false);
        fetchActiveOccurrences();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao enviar pedido de socorro. Tente ligar 114.');
    } finally {
      setRequesting(false);
    }
  };

  const isCitizen = user?.perfil === 'cidadao';

  return (
    <div
      style={{
        maxWidth: '680px', /* Escala 125% confortável */
        margin: '0 auto',
        padding: '20px 18px 50px',
      }}
    >
      {/* Messages */}
      {successMsg && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            color: '#065F46',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontWeight: '700',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '20px' }}>✓</span>
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            color: '#991B1B',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* App Navigation Segmented Control (Escala 125%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCitizen ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: '8px',
          backgroundColor: '#E2E8F0',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setCurrentTab('socorro')}
          style={{
            padding: '12px 10px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: currentTab === 'socorro' ? '800' : '600',
            backgroundColor: currentTab === 'socorro' ? '#FFFFFF' : 'transparent',
            color: currentTab === 'socorro' ? '#DC2626' : '#64748B',
            boxShadow: currentTab === 'socorro' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🚨</span>
          <span>{activeOccurrence ? 'Seguir Socorro' : 'Pedir Ajuda'}</span>
        </button>

        {!isCitizen && (
          <button
            onClick={() => setCurrentTab('caderneta')}
            style={{
              padding: '12px 10px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: currentTab === 'caderneta' ? '800' : '600',
              backgroundColor: currentTab === 'caderneta' ? '#FFFFFF' : 'transparent',
              color: currentTab === 'caderneta' ? '#0284C7' : '#64748B',
              boxShadow: currentTab === 'caderneta' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>🤰</span>
            <span>Minha Gravidez</span>
          </button>
        )}

        <button
          onClick={() => setCurrentTab('ajudar')}
          style={{
            padding: '12px 10px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: currentTab === 'ajudar' ? '800' : '600',
            backgroundColor: currentTab === 'ajudar' ? '#FFFFFF' : 'transparent',
            color: currentTab === 'ajudar' ? '#059669' : '#64748B',
            boxShadow: currentTab === 'ajudar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🤝</span>
          <span>Ajudar Vizinha</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: SOCORRO & ACOMPANHAMENTO EM TEMPO REAL            */}
      {/* ======================================================== */}
      {currentTab === 'socorro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Se houver ocorrência ativa, exibe o cartão acolhedor de acompanhamento */}
          {activeOccurrence && activeOccurrence.estado_ocorrencia !== 'Concluída' && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '2.5px solid #0284C7',
                borderRadius: '20px',
                padding: '26px 24px',
                boxShadow: '0 12px 25px -4px rgba(2, 132, 199, 0.14)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: '800',
                      backgroundColor: '#E0F2FE',
                      color: '#0284C7',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    SOCORRO EM ANDAMENTO
                  </span>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
                    Protocolo: {activeOccurrence.protocolo_codigo}
                  </h3>
                </div>
                <StatusBadge estado={activeOccurrence.estado_ocorrencia} />
              </div>

              {/* Barra de Progresso Simples */}
              <div style={{ margin: '18px 0' }}>
                <LifecycleStepTracker etapaAtual={activeOccurrence.etapa_atual} estado={activeOccurrence.estado_ocorrencia} />
              </div>

              {/* Informação sobre a Ambulância e Hospital */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div
                  style={{
                    backgroundColor: '#F0F9FF',
                    border: '1.5px solid #BAE6FD',
                    padding: '16px 18px',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#0369A1', fontWeight: '800' }}>
                    🚑 Ambulância a Caminho:
                  </div>
                  <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#0F172A', marginTop: '3px' }}>
                    {activeOccurrence.ambulancia_codigo ? `${activeOccurrence.ambulancia_codigo} — ${activeOccurrence.ambulancia_instituicao || 'INEMA'}` : 'A Central 114 está a enviar a viatura mais próxima'}
                  </div>
                  {activeOccurrence.ambulancia_equipa && (
                    <div style={{ fontSize: '14px', color: '#475569', marginTop: '3px' }}>
                      Socorristas: {activeOccurrence.ambulancia_equipa}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1.5px solid #A7F3D0',
                    padding: '16px 18px',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#047857', fontWeight: '800' }}>
                    🏥 Maternidade de Destino:
                  </div>
                  <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#0F172A', marginTop: '3px' }}>
                    {activeOccurrence.maternidade_nome || 'Maternidade Lucrécia Paim (Maianga)'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#059669', marginTop: '3px', fontWeight: '600' }}>
                    ✓ Equipa médica hospitalar já foi avisada da sua chegada
                  </div>
                </div>

                {/* Se a rua for de difícil acesso */}
                {activeOccurrence.classificacao_acesso_local === 'Acesso impossível para ambulância convencional' && (
                  <div
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1.5px solid #FCA5A5',
                      padding: '16px 18px',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#DC2626' }}>
                      ⚠️ Ponto de Encontro da Ambulância:
                    </div>
                    <p style={{ fontSize: '15px', color: '#991B1B', marginTop: '4px', lineHeight: 1.45, fontWeight: '600' }}>
                      Como a sua rua é de difícil acesso para o carro, a ambulância vai aguardar em: <strong>{activeOccurrence.ponto_encontro_coordenadas || activeOccurrence.ponto_referencia}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Mapa Limpo Ampliado */}
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '8px' }}>
                  Acompanhe a viatura no mapa:
                </span>
                <LuandaMap
                  height="280px"
                  patientCoords={{ lat: activeOccurrence.latitude, lon: activeOccurrence.longitude }}
                  patientLabel="Você Está Aqui"
                  ambulanceCoords={activeOccurrence.ambulancia_lat ? { lat: activeOccurrence.ambulancia_lat, lon: activeOccurrence.ambulancia_lon } : null}
                  ambulanceLabel={activeOccurrence.ambulancia_codigo || 'Viatura'}
                  roadAccessStatus={activeOccurrence.classificacao_acesso_local}
                  rendezvousCoords={activeOccurrence.ponto_encontro_coordenadas ? { lat: -8.8140, lon: 13.2715 } : null}
                />
              </div>

              {/* Dicas de Primeiros Socorros Imediatos */}
              <div
                style={{
                  marginTop: '20px',
                  backgroundColor: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  borderRadius: '14px',
                  padding: '18px 20px',
                }}
              >
                <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#B45309', marginBottom: '10px' }}>
                  💡 O QUE FAZER ENQUANTO ESPERA A EQUIPA:
                </div>
                <ul style={{ paddingLeft: '22px', fontSize: '14.5px', color: '#78350F', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Deite-se do lado esquerdo</strong> para oxigenar melhor o bebé.</li>
                  <li><strong>Respire fundo</strong> pelo nariz e deite o ar pela boca calmamente.</li>
                  <li><strong>Mantenha o telefone livre</strong> para atender a chamada dos socorristas.</li>
                  <li>Não coma alimentos pesados e não tome medicamentos por conta própria.</li>
                </ul>
              </div>

              {/* Botão de contacto direto com o operador */}
              <div style={{ marginTop: '20px' }}>
                <a
                  href="tel:114"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '800',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📞</span>
                  <span>Falar com o Operador da Central 114</span>
                </a>
              </div>
            </div>
          )}

          {/* Cartão de Boas-Vindas da Mamã (quando não houver emergência ativa) */}
          {(!activeOccurrence || activeOccurrence.estado_ocorrencia === 'Concluída') && !showForm && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1.5px solid #E2E8F0',
                padding: '32px 24px',
                textAlign: 'center',
                boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF2F2',
                  border: '2.5px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                ♥
              </div>

              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A' }}>
                Olá, {user?.linkedData?.nome_completo?.split(' ')[0] || user?.nome || 'Mamã'}!
              </h2>
              <p style={{ fontSize: '16px', color: '#64748B', marginTop: '6px' }}>
                Estamos consigo a cada minuto da sua gravidez. Como se está a sentir?
              </p>

              {user?.linkedData && (
                <div
                  style={{
                    display: 'inline-block',
                    margin: '14px auto 0',
                    padding: '6px 16px',
                    borderRadius: '24px',
                    backgroundColor: '#E0F2FE',
                    color: '#0284C7',
                    fontSize: '14.5px',
                    fontWeight: '800',
                  }}
                >
                  {user.linkedData.semanas_gestacao} semanas de gestação • Luanda
                </div>
              )}

              {/* BOTÃO SOS PRINCIPAL GIGANTE (Escala 125%) */}
              <div style={{ marginTop: '30px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="sos-pulse"
                  style={{
                    width: '100%',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    padding: '24px 28px',
                    borderRadius: '20px',
                    fontSize: '20px',
                    fontWeight: '800',
                    letterSpacing: '0.02em',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>🚨</span>
                  <span>ESTOU A PASSAR MAL</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', opacity: 0.95 }}>
                    Toque aqui para chamar socorro imediato
                  </span>
                </button>
              </div>

              {/* Botão de Ligação Telefónica Rápida */}
              <div style={{ marginTop: '16px' }}>
                <a
                  href="tel:114"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #CBD5E1',
                    color: '#0F172A',
                    padding: '15px 20px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '800',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📞</span>
                  <span>Ligar Grátis para a Central 114</span>
                </a>
              </div>
            </div>
          )}

          {/* FORMULÁRIO DE PEDIDO DE SOCORRO RÁPIDO (SUPER SIMPLIFICADO) */}
          {showForm && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1.5px solid #E2E8F0',
                padding: '26px 22px',
                boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '21px', fontWeight: '800', color: '#0F172A' }}>
                    Pedir Socorro Obstétrico
                  </h3>
                  <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '2px' }}>
                    Selecione o que está a sentir com um toque
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    backgroundColor: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#64748B',
                  }}
                >
                  ✕ Voltar
                </button>
              </div>

              {/* Cartões Grandes de Sintomas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                {sintomasAmigaveis.map((item) => {
                  const isChecked = sintomasSelecionados.includes(item.label);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleSintoma(item.label)}
                      style={{
                        padding: '15px 18px',
                        borderRadius: '12px',
                        backgroundColor: isChecked ? '#FEF2F2' : '#F8FAFC',
                        border: isChecked ? '2.5px solid #DC2626' : '1.5px solid #E2E8F0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '28px' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: isChecked ? '#991B1B' : '#0F172A' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '13.5px', color: '#64748B', marginTop: '1px' }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: isChecked ? '#DC2626' : '#FFFFFF',
                          border: isChecked ? '2.5px solid #DC2626' : '2px solid #CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          fontWeight: '800',
                          flexShrink: 0,
                        }}
                      >
                        {isChecked ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Localização em Luanda */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '15.5px', fontWeight: '800', color: '#0F172A' }}>
                    Onde Você Está em Luanda?
                  </span>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    style={{
                      backgroundColor: '#E0F2FE',
                      color: '#0284C7',
                      border: '1.5px solid #BAE6FD',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '800',
                    }}
                  >
                    📍 Usar GPS
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>
                      Bairro em Luanda *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Tala Hady, Cazenga, Viana..."
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>
                      Ponto de Referência Conhecido * (Para o socorro achar rápido)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Perto do Centro de Saúde, perto da Escola ou da Bomba..."
                      value={pontoReferencia}
                      onChange={(e) => setPontoReferencia(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Enviar Socorro */}
              <button
                type="button"
                onClick={() => handleSubmitSocorro(false)}
                disabled={requesting}
                style={{
                  width: '100%',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  padding: '19px',
                  borderRadius: '14px',
                  fontSize: '18px',
                  fontWeight: '800',
                  boxShadow: '0 5px 14px rgba(220, 38, 38, 0.3)',
                  border: 'none',
                }}
              >
                {requesting ? 'A Enviar Pedido à Central 114...' : 'CONFIRMAR E CHAMAR SOCORRO AGORA'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: MINHA CADERNETA / GRAVIDEZ (INFORMAÇÕES CLÍNICAS) */}
      {/* ======================================================== */}
      {currentTab === 'caderneta' && !isCitizen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '26px 22px',
              boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                  fontWeight: '800',
                  flexShrink: 0,
                }}
              >
                🤰
              </div>
              <div>
                <h3 style={{ fontSize: '21px', fontWeight: '800', color: '#0F172A' }}>
                  {user?.linkedData?.nome_completo || user?.nome || 'Esperança Manuel'}
                </h3>
                <span style={{ fontSize: '15px', color: '#64748B' }}>
                  Processo Pré-Natal: <strong style={{ color: '#0F172A' }}>{user?.linkedData?.numero_processo || 'GRAV-2026-0814'}</strong>
                </span>
              </div>
            </div>

            {/* Destaque das Semanas de Gravidez */}
            <div
              style={{
                marginTop: '20px',
                backgroundColor: '#F0F9FF',
                border: '1.5px solid #BAE6FD',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0369A1' }}>
                TEMPO DE GESTAÇÃO
              </span>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#0284C7', marginTop: '2px' }}>
                {user?.linkedData?.semanas_gestacao || 36} Semanas
              </div>
              <span style={{ fontSize: '15px', color: '#475569', fontWeight: '600' }}>
                9º Mês • Últimas semanas antes do parto
              </span>

              {/* Barra de progresso gestacional */}
              <div style={{ width: '100%', height: '10px', backgroundColor: '#E2E8F0', borderRadius: '5px', marginTop: '14px', overflow: 'hidden' }}>
                <div style={{ width: '90%', height: '100%', backgroundColor: '#0284C7', borderRadius: '5px' }} />
              </div>
            </div>

            {/* Dados Médicos Rápidos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1.5px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Grupo Sanguíneo:</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#DC2626', marginTop: '2px' }}>
                  {user?.linkedData?.grupo_sanguineo || 'O+'}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1.5px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Idade:</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                  {user?.linkedData?.idade || 26} Anos
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Maternidade de Referência:</span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
                  Maternidade Lucrécia Paim (Maianga, Luanda)
                </div>
              </div>
            </div>
          </div>

          {/* Dicas de Cuidado para a Mamã */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '22px',
            }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
              Dicas de Saúde para Esta Semana:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px', color: '#475569', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>💧</span>
                <span>Beba bastante água tratada ou fervida ao longo do dia.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🛌</span>
                <span>Descanse sempre virada para o lado esquerdo para melhorar o fluxo do bebé.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>👜</span>
                <span>Mantenha a malinha da maternidade pronta com os documentos e roupinhas.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: AJUDAR OUTRA GRÁVIDA (MODO CIDADÃO / VIZINHO)     */}
      {/* ======================================================== */}
      {currentTab === 'ajudar' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1.5px solid #E2E8F0',
            padding: '26px 22px',
            boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: '800',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              SOLIDARIEDADE COMUNITÁRIA
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
              Ajudar Uma Grávida em Luanda
            </h3>
            <p style={{ fontSize: '15px', color: '#64748B', marginTop: '4px' }}>
              Encontrou uma vizinha ou mulher em trabalho de parto na via pública? Chame socorro rápido por aqui.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '4px' }}>
                Nome da Grávida (se souber, ou escreva 'Desconhecida')
              </label>
              <input
                type="text"
                placeholder="Ex: Vizinha Maria ou Desconhecida"
                value={nomeOutra}
                onChange={(e) => setNomeOutra(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '4px' }}>
                A sua Relação com Ela
              </label>
              <select
                value={relacaoOutra}
                onChange={(e) => setRelacaoOutra(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Vizinho">Vizinho / Morador da Área</option>
                <option value="Familiar">Esposo / Familiar</option>
                <option value="Transeunte">Pessoa que a encontrou na rua</option>
                <option value="Agente Comunitário">Agente de Saúde Comunitário</option>
              </select>
            </div>

            {/* Sintomas da Grávida */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', color: '#334155', fontWeight: '700', marginBottom: '8px' }}>
                O que ela está a sentir?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sintomasAmigaveis.map((item) => {
                  const isChecked = sintomasSelecionados.includes(item.label);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleSintoma(item.label)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: isChecked ? '#FEF2F2' : '#F8FAFC',
                        border: isChecked ? '2.5px solid #DC2626' : '1.5px solid #E2E8F0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '15px', fontWeight: isChecked ? '800' : '600', color: isChecked ? '#991B1B' : '#0F172A' }}>
                        {item.icon} {item.label}
                      </span>
                      <span style={{ color: isChecked ? '#DC2626' : '#94A3B8', fontWeight: '800', fontSize: '16px' }}>
                        {isChecked ? '✓' : '+'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Localização onde ela está */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '10px' }}>
                Onde ela está agora? (Luanda)
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Bairro (ex: Cazenga, Viana, Sambizanga...)"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  style={{ width: '100%' }}
                />
                <input
                  type="text"
                  placeholder="Ponto de Referência (ex: perto da padaria, da paragem...)"
                  value={pontoReferencia}
                  onChange={(e) => setPontoReferencia(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSubmitSocorro(true)}
            disabled={requesting}
            style={{
              width: '100%',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              padding: '18px',
              borderRadius: '14px',
              fontSize: '17px',
              fontWeight: '800',
              border: 'none',
            }}
          >
            {requesting ? 'A Enviar Pedido...' : 'ENVIAR SOCORRO PARA ESTA PESSOA'}
          </button>
        </div>
      )}
    </div>
  );
};
