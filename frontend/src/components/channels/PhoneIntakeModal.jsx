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
      const payload = {
        canal_entrada: 'Linha Telefónica 114',
        solicitante_nome: formData.solicitante_nome || 'Chamador Telefónico 114',
        solicitante_telefone: formData.solicitante_telefone,
        tipo_solicitante: formData.gravida_cadastrada ? 'propria_gravida' : 'cidadao_desconhecido',
        relacao_gravida: 'Atendimento Telefónico Central',
        gravida_cadastrada: formData.gravida_cadastrada,
        descricao_sintomas: formData.descricao_sintomas,
        sinais_alerta: formData.sinais_alerta,
        municipio: formData.municipio,
        bairro: formData.bairro,
        rua: formData.rua,
        ponto_referencia: formData.ponto_referencia,
        latitude: -8.8105,
        longitude: 13.2750,
        origem_coordenadas: 'Registo Telefónico Central',
        observacoes_iniciais: formData.observacoes_chamada,
        prioridade: formData.prioridade_atribuida,
      };

      const res = await api.createOccurrence(payload);
      if (res.success) {
        if (onCreated) onCreated(res.ocorrencia);
        onClose();
      }
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
      title="Atendimento Telefónico da Central 114"
      subtitle="Registo rápido de chamada de emergência obstétrica recebida pelo operador de Luanda"
      maxWidth="720px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '6px', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Nome do Solicitante / Grávida
            </label>
            <input
              type="text"
              placeholder="Ex: Teresa Sebastião"
              value={formData.solicitante_nome}
              onChange={(e) => setFormData({ ...formData, solicitante_nome: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Telefone de Contacto *
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
        </div>

        {/* Localização em Luanda */}
        <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '10px' }}>
            Localização Informada pelo Chamador (Luanda):
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', color: '#64748B', marginBottom: '4px' }}>
                Bairro em Luanda *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Tala Hady, Cazenga"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', color: '#64748B', marginBottom: '4px' }}>
                Rua / Zona
              </label>
              <input
                type="text"
                placeholder="Ex: Rua dos Comandos"
                value={formData.rua}
                onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#64748B', marginBottom: '4px' }}>
              Ponto de Referência Conhecido (Crucial para socorro em Luanda) *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Próximo à Escola Primária ou Paragem de Táxis"
              value={formData.ponto_referencia}
              onChange={(e) => setFormData({ ...formData, ponto_referencia: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Sinais de Alerta */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
            Sinais de Alerta Informados na Chamada:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {alertOptions.map((opt) => {
              const checked = formData.sinais_alerta.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => handleToggleAlert(opt)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: checked ? '#FEF2F2' : '#FFFFFF',
                    border: checked ? '1px solid #DC2626' : '1px solid #CBD5E1',
                    color: checked ? '#991B1B' : '#334155',
                    fontSize: '12px',
                    fontWeight: checked ? '700' : '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{checked ? '☑' : '☐'}</span>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
            Descrição Clínica dos Sintomas / Relato do Chamador *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Descreva o que a pessoa relata, tempo de sangramento ou dores..."
            value={formData.descricao_sintomas}
            onChange={(e) => setFormData({ ...formData, descricao_sintomas: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              borderRadius: '6px',
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
              padding: '10px 22px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              borderRadius: '6px',
              fontSize: '13.5px',
              fontWeight: '700',
            }}
          >
            {loading ? 'A registar...' : 'Registar Ocorrência 114'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
