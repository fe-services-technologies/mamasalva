import React, { useState } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

export const UssdSimulator = ({ isOpen, onClose, onOccurrenceCreated }) => {
  const [phoneNumber, setPhoneNumber] = useState('+244 923 000 114');
  const [sessionId] = useState(`sess_${Date.now()}`);
  const [screenText, setScreenText] = useState(
    'MATERNITY SOS Luanda (*114#)\n1. Estou grávida e preciso de ajuda\n2. Pedir ajuda para outra grávida\n3. Grávida não cadastrada — Emergência\n4. Sair'
  );
  const [inputVal, setInputVal] = useState('');
  const [isEnd, setIsEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async (valToSend) => {
    const textToSend = valToSend !== undefined ? valToSend : inputVal;
    if (!textToSend && !isEnd) return;

    setLoading(true);
    try {
      const res = await api.sendUssd(sessionId, phoneNumber.replace(/\s+/g, ''), textToSend);
      setScreenText(res.message);
      setIsEnd(res.isEnd);
      setInputVal('');
      if (res.isEnd && onOccurrenceCreated) {
        onOccurrenceCreated();
      }
    } catch (err) {
      setScreenText(`Erro de rede USSD: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await api.sendUssd(sessionId, phoneNumber.replace(/\s+/g, ''), '*114#');
      setScreenText(res.message);
      setIsEnd(false);
      setInputVal('');
    } catch (err) {
      setScreenText(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador de Sessão USSD (*114#)"
      subtitle="Canal alternativo offline para redes móveis em Angola sem necessidade de ligação à internet"
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        {/* Phone Frame */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#020617',
            border: '2px solid #334155',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* LCD Screen */}
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '2px solid #475569',
              borderRadius: '8px',
              padding: '14px',
              minHeight: '160px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#38BDF8',
              whiteSpace: 'pre-line',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>{screenText}</div>
            {loading && <div style={{ color: '#FCD34D', fontSize: '11px', marginTop: '8px' }}>Processando comando na rede móvel...</div>}
          </div>

          {/* Input & Action */}
          {!isEnd ? (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Resposta ou opção (1-4)..."
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: '#0B1120',
                  color: '#F8FAFC',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                }}
              >
                Enviar
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button
                onClick={handleReset}
                style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                }}
              >
                Discar *114# Novamente
              </button>
            </div>
          )}

          {/* Quick keypad shortcuts */}
          {!isEnd && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '12px' }}>
              {['1', '2', '3', '4'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleSend(btn)}
                  disabled={loading}
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#E2E8F0',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: '1px solid #334155',
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informative Note */}
        <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', lineHeight: 1.4 }}>
          * O serviço USSD funciona em qualquer telemóvel simples sem internet. Como não transmite GPS automático, a localização (Bairro e Ponto de Referência) é recolhida textualmente pelo menu.
        </p>
      </div>
    </Modal>
  );
};
