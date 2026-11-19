import React from 'react';
import { Modal } from './Modal';

export const ContingencyModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Protocolos de Contingência e Salvaguardas Humanas"
      subtitle="Procedimentos operacionais obrigatórios para situações de falha técnica, sobrecarga ou pedidos suspeitos em Luanda"
      maxWidth="700px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: 1.5 }}>
        {/* Contingência 1: Falta de Internet */}
        <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '6px', borderLeft: '4px solid #38BDF8' }}>
          <strong style={{ color: '#38BDF8' }}>1. Falta de Ligação à Internet / Rede de Dados:</strong>
          <p style={{ color: '#CBD5E1', marginTop: '4px' }}>
            Se a ligação móvel de dados ou Wi-Fi falhar, o cidadão ou profissional deve recorrer imediatamente ao menu interativo <strong>USSD (*114#)</strong> ou à <strong>Linha Telefónica Direta 114</strong>. Caso haja corte total de sinal de telecomunicações, orientar envio de aviso pessoal ao Centro de Saúde ou posto policial mais próximo.
          </p>
        </div>

        {/* Contingência 2: Falha de GPS */}
        <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '6px', borderLeft: '4px solid #F59E0B' }}>
          <strong style={{ color: '#FCD34D' }}>2. Falha de Geolocalização por GPS:</strong>
          <p style={{ color: '#CBD5E1', marginTop: '4px' }}>
            O sistema nunca impede a solicitação por ausência de sinal GPS. É ativado o modo de <em>Entrada Manual</em> com obrigatoriedade de: Bairro, Rua/Beco, Ponto de Referência conhecido (escola, igreja, posto Sonangol, paragem de candongueiros) e localização próxima identificável.
          </p>
        </div>

        {/* Contingência 3: Escassez de Ambulâncias */}
        <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '6px', borderLeft: '4px solid #EF4444' }}>
          <strong style={{ color: '#F87171' }}>3. Todas as Ambulâncias da Zona Ocupadas / Indisponíveis:</strong>
          <p style={{ color: '#CBD5E1', marginTop: '4px' }}>
            A ocorrência mantém a prioridade máxima na fila. A Central 114 aciona o protocolo de cooperação interinstitucional (solicitação de viaturas aos Bombeiros, Cruz Vermelha de Angola ou apoio intermunicipal) com acompanhamento direto pelo Supervisor de Turno.
          </p>
        </div>

        {/* Contingência 4: Maternidade em Sobrecarga */}
        <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '6px', borderLeft: '4px solid #A855F7' }}>
          <strong style={{ color: '#D8B4FE' }}>4. Maternidade de Destino sem Camas ou Bloco Bloqueado:</strong>
          <p style={{ color: '#CBD5E1', marginTop: '4px' }}>
            O operador consulta no painel de capacidades as unidades obstétricas alternativas disponíveis na Província de Luanda (ex.: Lucrécia Paim, Augusto Ngangula, Hospital Geral de Luanda) e redireciona a viatura antes da chegada, com comunicação prévia mandatória.
          </p>
        </div>

        {/* Contingência 5: Revisão Humana de Trotes */}
        <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '6px', borderLeft: '4px solid #10B981' }}>
          <strong style={{ color: '#6EE7B7' }}>5. Pedidos Suspeitos ou Múltiplos Chamados (Trotes):</strong>
          <p style={{ color: '#CBD5E1', marginTop: '4px' }}>
            <strong>É expressamente proibido o bloqueio automático de números telefónicos de emergência.</strong> Quando houver suspeita de trote ou duplicidade, o registo é marcado como <em>Sob Revisão de Suspeita</em> e encaminhado à fila de validação humana do Supervisor da Central, garantindo que nenhum caso real seja desassistido.
          </p>
        </div>
      </div>
    </Modal>
  );
};
