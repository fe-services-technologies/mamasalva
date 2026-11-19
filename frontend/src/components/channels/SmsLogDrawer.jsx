import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

export const SmsLogDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetPhone, setTargetPhone] = useState('+244 923 456 789');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getSmsLogs();
      if (res.success) setMessages(res.mensagens);
    } catch (err) {
      console.error('Falha ao carregar logs SMS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchLogs();
  }, [isOpen]);

  const handleSendCustom = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      await api.sendSms({
        telefone_destino: targetPhone.replace(/\s+/g, ''),
        conteudo: content.trim(),
      });
      setContent('');
      fetchLogs();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registo e Visualização de Mensagens SMS"
      subtitle="Comunicações automáticas de confirmação e atualização enviadas para os telefones dos utentes"
      maxWidth="650px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Envio Manual Simulado */}
        <form
          onSubmit={handleSendCustom}
          style={{
            backgroundColor: '#0B1120',
            border: '1px solid #1E293B',
            borderRadius: '6px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#38BDF8' }}>
            Expedir Mensagem SMS de Apoio / Orientação:
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="+244 9..."
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              style={{ width: '160px', fontSize: '12px' }}
            />
            <input
              type="text"
              placeholder="Escreva a mensagem (ex: Mantenha a calma, ambulância a 5 minutos)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ flex: 1, fontSize: '12px' }}
            />
            <button
              type="submit"
              disabled={sending}
              style={{
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {sending ? 'A enviar...' : 'Enviar SMS'}
            </button>
          </div>
        </form>

        {/* Lista de SMS */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8' }}>
              Histórico Recente de Mensagens SMS:
            </span>
            <button onClick={fetchLogs} style={{ fontSize: '11px', color: '#38BDF8' }}>
              Atualizar Lista
            </button>
          </div>

          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {messages.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '16px' }}>
                Nenhuma mensagem SMS registada.
              </p>
            ) : (
              messages.map((sms) => (
                <div
                  key={sms.id}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: '#F8FAFC' }}>
                      {sms.telefone_destino}
                    </span>
                    <span style={{ color: '#10B981', fontSize: '11px', fontWeight: '600' }}>
                      ✓ {sms.status_entrega}
                    </span>
                  </div>
                  <p style={{ color: '#E2E8F0', lineHeight: 1.4 }}>{sms.conteudo}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B', marginTop: '6px' }}>
                    {sms.protocolo_codigo ? <span>Protocolo: {sms.protocolo_codigo}</span> : <span />}
                    <span className="tabular-nums">{new Date(sms.created_at).toLocaleString('pt-AO')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
