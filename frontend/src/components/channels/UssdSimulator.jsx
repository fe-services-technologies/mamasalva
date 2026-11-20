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
      title="Simulador de Canal USSD (*114# Luanda)"
      subtitle="Canal de telecomunicação sem dados móveis (2G/GSM) para acesso universal e inclusivo em Angola"
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Mock Feature Phone */}
        <div
          style={{
            width: '320px',
            backgroundColor: '#0F172A',
            borderRadius: '24px',
            padding: '20px 16px',
            border: '8px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Top Speaker */}
          <div style={{ width: '40px', height: '4px', backgroundColor: '#475569', borderRadius: '2px', margin: '0 auto 12px' }} />

          {/* LCD Screen */}
          <div
            style={{
              backgroundColor: '#C5D8B6',
              border: '2px solid #829C71',
              borderRadius: '6px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#1A2E1A',
              minHeight: '170px',
              whiteSpace: 'pre-wrap',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>{screenText}</div>
            {loading && <div style={{ fontWeight: 'bold', marginTop: '6px' }}>A processar...</div>}
          </div>

          {/* Input field inside phone */}
          {!isEnd && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Resposta..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                style={{
                  flex: 1,
                  backgroundColor: '#1E293B',
                  color: '#FFFFFF',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                OK
              </button>
            </div>
          )}

          {/* Keypad Quick Actions */}
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (!isEnd) setInputVal((prev) => prev + k);
                }}
                style={{
                  backgroundColor: '#1E293B',
                  color: '#CBD5E1',
                  border: '1px solid #334155',
                  padding: '8px 0',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {k}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              Reiniciar *114#
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#334155',
                color: '#CBD5E1',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
