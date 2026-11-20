import React from 'react';
import { Modal } from './Modal';

export const ContingencyModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Protocolos de Contingência e Salvaguardas Humanas"
      subtitle="Procedimentos operacionais obrigatórios para situações de falha técnica, sobrecarga ou pedidos suspeitos em Luanda"
      maxWidth="720px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', lineHeight: 1.55 }}>
        {/* Contingência 1: Falta de Internet */}
        <div style={{ backgroundColor: '#F0F9FF', padding: '14px 16px', borderRadius: '8px', borderLeft: '4px solid #0284C7', border: '1px solid #BAE6FD', borderLeftWidth: '4px' }}>
          <strong style={{ color: '#0369A1' }}>1. Falta de Ligação à Internet / Rede de Dados:</strong>
          <p style={{ color: '#334155', marginTop: '4px' }}>
            Se a ligação móvel de dados ou Wi-Fi falhar, o cidadão ou profissional deve recorrer imediatamente ao menu interativo <strong>USSD (*114#)</strong> ou à <strong>Linha Telefónica Direta 114</strong>. Caso haja corte total de sinal de telecomunicações, orientar envio de aviso pessoal ao Centro de Saúde ou posto policial mais próximo.
          </p>
        </div>

        {/* Contingência 2: Falha de GPS */}
        <div style={{ backgroundColor: '#FFFBEB', padding: '14px 16px', borderRadius: '8px', borderLeft: '4px solid #D97706', border: '1px solid #FDE68A', borderLeftWidth: '4px' }}>
          <strong style={{ color: '#B45309' }}>2. Falha de Geolocalização por GPS:</strong>
          <p style={{ color: '#334155', marginTop: '4px' }}>
            O sistema nunca impede a solicitação por ausência de sinal GPS. É ativado o modo de <em>Entrada Manual</em> com obrigatoriedade de: Bairro, Rua/Beco, Ponto de Referência conhecido (escola, igreja, posto Sonangol, paragem de candongueiros) e localização próxima identificável.
          </p>
        </div>

        {/* Contingência 3: Escassez de Ambulâncias */}
        <div style={{ backgroundColor: '#FEF2F2', padding: '14px 16px', borderRadius: '8px', borderLeft: '4px solid #DC2626', border: '1px solid #FECACA', borderLeftWidth: '4px' }}>
          <strong style={{ color: '#B91C1C' }}>3. Todas as Ambulâncias da Zona Ocupadas / Indisponíveis:</strong>
          <p style={{ color: '#334155', marginTop: '4px' }}>
            A ocorrência mantém a prioridade máxima na fila. A Central 114 aciona o protocolo de cooperação interinstitucional (solicitação de viaturas aos Bombeiros, Cruz Vermelha de Angola ou apoio intermunicipal) com acompanhamento direto pelo Supervisor de Turno.
          </p>
        </div>

        {/* Contingência 4: Maternidade em Sobrecarga */}
        <div style={{ backgroundColor: '#FAF5FF', padding: '14px 16px', borderRadius: '8px', borderLeft: '4px solid #9333EA', border: '1px solid #E9D5FF', borderLeftWidth: '4px' }}>
          <strong style={{ color: '#7E22CE' }}>4. Maternidade de Destino sem Camas ou Bloco Bloqueado:</strong>
          <p style={{ color: '#334155', marginTop: '4px' }}>
            O operador consulta no painel de capacidades as unidades obstétricas alternativas disponíveis na Província de Luanda (ex.: Lucrécia Paim, Augusto Ngangula, Hospital Geral de Luanda) e redireciona a viatura antes da chegada, com comunicação prévia mandatória.
          </p>
        </div>

        {/* Contingência 5: Revisão Humana de Trotes */}
        <div style={{ backgroundColor: '#ECFDF5', padding: '14px 16px', borderRadius: '8px', borderLeft: '4px solid #059669', border: '1px solid #A7F3D0', borderLeftWidth: '4px' }}>
          <strong style={{ color: '#047857' }}>5. Pedidos Suspeitos ou Múltiplos Chamados (Trotes):</strong>
          <p style={{ color: '#334155', marginTop: '4px' }}>
            <strong>É expressamente proibido o bloqueio automático de números telefónicos de emergência.</strong> Quando houver suspeita de trote ou duplicidade, o registo é marcado como <em>Sob Revisão de Suspeita</em> e encaminhado à fila de validação humana do Supervisor da Central, garantindo que nenhum caso real seja desassistido.
          </p>
        </div>
      </div>
    </Modal>
  );
};
