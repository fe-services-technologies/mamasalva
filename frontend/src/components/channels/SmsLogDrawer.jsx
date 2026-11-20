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
      title="Gateway de Mensagens SMS (Notificações Luanda)"
      subtitle="Registo de notificações automáticas enviadas para grávidas, familiares e equipas hospitalares"
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Envio Manual de SMS */}
        <form onSubmit={handleSendCustom} style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '10px' }}>
            Simular Disparo de SMS de Emergência:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', color: '#64748B', marginBottom: '4px' }}>
                Telefone (+244)
              </label>
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                style={{ width: '100%', fontSize: '13px', padding: '8px 10px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', color: '#64748B', marginBottom: '4px' }}>
                Texto da Mensagem
              </label>
              <input
                type="text"
                placeholder="Ex: Ambulância a caminho..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: '100%', fontSize: '13px', padding: '8px 10px' }}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              style={{
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                padding: '9px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              {sending ? 'A enviar...' : 'Enviar SMS'}
            </button>
          </div>
        </form>

        {/* Histórico de Mensagens Enviadas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
              Histórico Recente de Notificações SMS ({messages.length})
            </span>
            <button
              onClick={fetchLogs}
              style={{ fontSize: '12px', color: '#0284C7', fontWeight: '600' }}
            >
              ↻ Atualizar
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              A carregar histórico...
            </div>
          ) : (
            <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  Nenhum SMS registado ainda.
                </div>
              ) : (
                messages.map((sms) => (
                  <div
                    key={sms.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B' }}>
                      <span>
                        Para: <strong style={{ color: '#0F172A' }}>{sms.telefone_destino}</strong>
                      </span>
                      <span>{new Date(sms.criado_em).toLocaleTimeString('pt-PT')}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#1E293B', lineHeight: 1.4 }}>
                      {sms.conteudo}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      <span>Canal: {sms.canal}</span>
                      <span style={{ color: '#059669', fontWeight: '600' }}>✓ Entregue (Simulação)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
