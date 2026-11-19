import React, { useState } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

export const PhoneIntakeModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    solicitante_nome: '',
    solicitante_telefone: '',
    gravida_nome: '',
    numero_processo: '',
    gravida_cadastrada: true,
    municipio: 'Luanda',
    bairro: 'Cazenga',
    rua: '',
    ponto_referencia: '',
    descricao_sintomas: '',
    sinais_alerta: [],
    prioridade_atribuida: 'Nível 1 - Vermelho',
    observacoes_chamada: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const alertOptions = [
    'Hemorragia vaginal ativa',
    'Dor abdominal severa / em barra',
    'Bolsa rota com líquido escuro',
    'Sensação de expulsão / cabeça a sair',
    'Cefaleia violenta e visão turva',
    'Convulsões prévias / perda de sentidos',
  ];

  const handleToggleAlert = (opt) => {
    setFormData((prev) => {
      const exists = prev.sinais_alerta.includes(opt);
      return {
        ...prev,
        sinais_alerta: exists
          ? prev.sinais_alerta.filter((x) => x !== opt)
          : [...prev.sinais_alerta, opt],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.solicitante_telefone || !formData.descricao_sintomas || !formData.bairro || !formData.ponto_referencia) {
      setError('Telefone, sintomas, bairro e ponto de referência são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      await api.createPhoneIntake(formData);
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Falha ao registar chamada telefónica.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registo Rápido de Chamada Telefónica (Linha 114)"
      subtitle="Formulário verbal direto para operador da central de atendimento durante a chamada"
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', border: '1px solid #DC2626', color: '#FCA5A5', padding: '8px 12px', borderRadius: '4px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Telefone do Solicitante / Grávida *
            </label>
            <input
              type="text"
              required
              placeholder="+244 9..."
              value={formData.solicitante_telefone}
              onChange={(e) => setFormData({ ...formData, solicitante_telefone: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Nome do Interveniente / Quem Liga
            </label>
            <input
              type="text"
              placeholder="Nome do solicitante ou grávida"
              value={formData.solicitante_nome}
              onChange={(e) => setFormData({ ...formData, solicitante_nome: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Município de Luanda *
            </label>
            <select
              value={formData.municipio}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="Luanda">Luanda (Sede)</option>
              <option value="Cazenga">Cazenga</option>
              <option value="Viana">Viana</option>
              <option value="Cacuaco">Cacuaco</option>
              <option value="Kilamba Kiaxi">Kilamba Kiaxi</option>
              <option value="Sambizanga">Sambizanga</option>
              <option value="Maianga">Maianga</option>
              <option value="Rangel">Rangel</option>
              <option value="Belas">Belas</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Bairro / Zona *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Tala Hady, Estalagem, Palanca..."
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
            Ponto de Referência Local e Rua *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Próximo à bomba Sonangol, atrás da escola 1024, travessa 3..."
            value={formData.ponto_referencia}
            onChange={(e) => setFormData({ ...formData, ponto_referencia: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
            Descrição da Emergência e Sintomas Observados *
          </label>
          <textarea
            required
            rows={2}
            placeholder="Descreva o que o utente está a relatar pelo telefone..."
            value={formData.descricao_sintomas}
            onChange={(e) => setFormData({ ...formData, descricao_sintomas: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
            Sinais de Alerta Obstétrico Identificados:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {alertOptions.map((opt) => {
              const isChecked = formData.sinais_alerta.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => handleToggleAlert(opt)}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: isChecked ? '600' : '400',
                    backgroundColor: isChecked ? 'rgba(220, 38, 38, 0.25)' : '#1E293B',
                    color: isChecked ? '#FCA5A5' : '#CBD5E1',
                    border: isChecked ? '1px solid #DC2626' : '1px solid #334155',
                  }}
                >
                  {isChecked ? '☑ ' : '☐ '} {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Validação Imediata de Prioridade
            </label>
            <select
              value={formData.prioridade_atribuida}
              onChange={(e) => setFormData({ ...formData, prioridade_atribuida: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="Nível 1 - Vermelho">Nível 1 — Vermelho (Crítico / Imediato)</option>
              <option value="Nível 2 - Amarelo">Nível 2 — Amarelo (Urgente)</option>
              <option value="Nível 3 - Verde">Nível 3 — Verde (Não Crítico)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              Nº de Processo Pré-Natal (se tiver)
            </label>
            <input
              type="text"
              placeholder="Ex: GRAV-2026-..."
              value={formData.numero_processo}
              onChange={(e) => setFormData({ ...formData, numero_processo: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#1E293B',
              color: '#94A3B8',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid #B91C1C',
            }}
          >
            {loading ? 'A registar...' : 'Registar Ocorrência Telefónica 114'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
