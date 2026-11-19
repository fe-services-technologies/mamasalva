import React, { useState } from 'react';

export const LuandaMap = ({
  height = '420px',
  patientCoords,
  patientLabel = 'Local da Grávida',
  ambulanceCoords,
  ambulanceLabel = 'Ambulância INEMA',
  maternityCoords,
  maternityLabel = 'Maternidade Lucrécia Paim',
  rendezvousCoords,
  rendezvousLabel = 'Ponto de Encontro Alternativo',
  roadAccessStatus = 'Acesso normal',
  zones = [],
  ambulances = [],
  maternities = [],
  onSelectMarker,
}) => {
  // Luanda Bounding Box approx:
  // Lat: -8.74 (North Cacuaco) to -8.96 (South Viana/Camama)
  // Lon: 13.18 (West Ilha de Luanda) to 13.40 (East Viana)
  const minLat = -8.96;
  const maxLat = -8.74;
  const minLon = 13.18;
  const maxLon = 13.40;

  // Convert (lat, lon) to SVG (x, y) percent coordinates
  const toSvgX = (lon) => {
    if (!lon) return 50;
    const clamped = Math.max(minLon, Math.min(maxLon, parseFloat(lon)));
    return ((clamped - minLon) / (maxLon - minLon)) * 100;
  };

  const toSvgY = (lat) => {
    if (!lat) return 50;
    const clamped = Math.max(minLat, Math.min(maxLat, parseFloat(lat)));
    // Invert because SVG Y grows downwards
    return ((maxLat - clamped) / (maxLat - minLat)) * 100;
  };

  // Preset known landmarks in Luanda
  const luandaLandmarks = [
    { name: 'Cazenga (Tala Hady)', lat: -8.8105, lon: 13.2750, access: 'Acesso impossível' },
    { name: 'Sambizanga (Ngola Kiluanje)', lat: -8.8020, lon: 13.2560, access: 'Acesso impossível' },
    { name: 'Maianga (Lucrécia Paim)', lat: -8.8268, lon: 13.2385, access: 'Acesso normal' },
    { name: 'Rangel (Augusto Ngangula)', lat: -8.8152, lon: 13.2498, access: 'Acesso normal' },
    { name: 'Kilamba Kiaxi (Palanca / HGL)', lat: -8.8741, lon: 13.2652, access: 'Acesso normal' },
    { name: 'Viana (Estalagem)', lat: -8.8920, lon: 13.3410, access: 'Acesso condicionado' },
    { name: 'Cacuaco (Kicolo)', lat: -8.7690, lon: 13.3320, access: 'Acesso condicionado' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        height,
        width: '100%',
        backgroundColor: '#0B1120',
        borderRadius: '8px',
        border: '1px solid #1E293B',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Map Control Header */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          zIndex: 10,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(4px)',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '13px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
          <span style={{ fontWeight: '700', color: '#F8FAFC' }}>Província de Luanda</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', color: '#94A3B8', fontSize: '12.5px' }}>
          <span>Legenda:</span>
          <span style={{ color: '#EF4444', fontWeight: '600' }}>● Emergência</span>
          <span style={{ color: '#38BDF8', fontWeight: '600' }}>▲ Ambulância</span>
          <span style={{ color: '#10B981', fontWeight: '600' }}>■ Maternidade</span>
          <span style={{ color: '#F59E0B', fontWeight: '600' }}>★ Ponto Encontro</span>
        </div>
      </div>

      {/* Road Access Condition Warning Strip if impossible */}
      {roadAccessStatus === 'Acesso impossível para ambulância convencional' && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '14px',
            right: '14px',
            zIndex: 10,
            backgroundColor: 'rgba(220, 38, 38, 0.95)',
            border: '1px solid #B91C1C',
            borderRadius: '6px',
            padding: '10px 16px',
            color: '#FFFFFF',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠</span>
            <span>
              <strong>Alerta Viário em Luanda:</strong> Acesso impossível para ambulância convencional na via interna. Encaminhamento para ponto de encontro alternativo.
            </span>
          </div>
          {rendezvousLabel && (
            <span style={{ backgroundColor: '#7F1D1D', padding: '4px 10px', borderRadius: '4px', fontSize: '12.5px', fontWeight: '600' }}>
              {rendezvousLabel}
            </span>
          )}
        </div>
      )}

      {/* Interactive Map Visualizer (Schematic & Geographic with Luanda grid) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
      >
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1E293B" strokeWidth="0.3" />
          </pattern>
          <linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#081827" />
            <stop offset="100%" stopColor="#0B1E34" />
          </linearGradient>
        </defs>

        {/* Luanda Coastline & Atlantic Ocean background */}
        <rect width="100" height="100" fill="url(#ocean)" />
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Coastal silhouette (Baía de Luanda & Ilha do Cabo curve) */}
        <path
          d="M 0,0 L 25,0 C 22,25 18,45 35,70 C 45,85 55,95 60,100 L 0,100 Z"
          fill="#06121E"
          opacity="0.8"
        />

        {/* Main Road Corridors (Avenida Deolinda Rodrigues, Estrada de Cacuaco, Via Expressa) */}
        <path
          d="M 28,35 L 75,75"
          stroke="#334155"
          strokeWidth="1.3"
          strokeDasharray="2,1"
        />
        <path
          d="M 32,20 L 80,40"
          stroke="#334155"
          strokeWidth="1.3"
        />
        <path
          d="M 35,45 L 85,90"
          stroke="#475569"
          strokeWidth="1.6"
        />

        {/* Bairros / Zones indicators */}
        {luandaLandmarks.map((lm, idx) => {
          const x = toSvgX(lm.lon);
          const y = toSvgY(lm.lat);
          const isDifficult = lm.access === 'Acesso impossível';
          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={y}
                r={isDifficult ? 3.2 : 2.2}
                fill={isDifficult ? 'rgba(239, 68, 68, 0.3)' : 'rgba(51, 65, 85, 0.45)'}
                stroke={isDifficult ? '#DC2626' : '#475569'}
                strokeWidth="0.6"
              />
              <text
                x={x + 3.5}
                y={y + 1.2}
                fill={isDifficult ? '#FCA5A5' : '#94A3B8'}
                fontSize="3.2"
                fontWeight={isDifficult ? '700' : '500'}
                fontFamily="Inter, sans-serif"
              >
                {lm.name}
              </text>
            </g>
          );
        })}

        {/* Maternities Markers */}
        {maternities.map((mat) => {
          const x = toSvgX(mat.longitude);
          const y = toSvgY(mat.latitude);
          return (
            <g key={mat.id} style={{ cursor: 'pointer' }} onClick={() => onSelectMarker && onSelectMarker('maternity', mat)}>
              <rect
                x={x - 3}
                y={y - 3}
                width="6"
                height="6"
                rx="1.2"
                fill="#059669"
                stroke="#10B981"
                strokeWidth="0.7"
              />
              <text x={x} y={y + 1.4} textAnchor="middle" fill="#FFFFFF" fontSize="3.4" fontWeight="800">
                +
              </text>
              <text x={x} y={y + 6.5} textAnchor="middle" fill="#A7F3D0" fontSize="3.0" fontWeight="700">
                {mat.sigla} ({mat.camas_obstetricas_livres} camas)
              </text>
            </g>
          );
        })}

        {/* Ambulances Markers */}
        {ambulances.map((amb) => {
          const x = toSvgX(amb.longitude_atual);
          const y = toSvgY(amb.latitude_atual);
          const isBusy = amb.estado_operacional !== 'Livre';
          return (
            <g key={amb.id} style={{ cursor: 'pointer' }} onClick={() => onSelectMarker && onSelectMarker('ambulance', amb)}>
              <polygon
                points={`${x},${y - 3.5} ${x + 3},${y + 2.5} ${x - 3},${y + 2.5}`}
                fill={isBusy ? '#0284C7' : '#0D9488'}
                stroke="#BAE6FD"
                strokeWidth="0.7"
              />
              <text x={x} y={y + 5.5} textAnchor="middle" fill="#7DD3FC" fontSize="2.8" fontWeight="700">
                {amb.codigo_identificacao}
              </text>
            </g>
          );
        })}

        {/* Patient Location Pin (if specified) */}
        {patientCoords && patientCoords.lat && patientCoords.lon && (
          <g>
            {/* Pulse animation circle */}
            <circle
              cx={toSvgX(patientCoords.lon)}
              cy={toSvgY(patientCoords.lat)}
              r="5.5"
              fill="rgba(220, 38, 38, 0.4)"
            >
              <animate attributeName="r" values="3.5;7;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={toSvgX(patientCoords.lon)}
              cy={toSvgY(patientCoords.lat)}
              r="2.5"
              fill="#DC2626"
              stroke="#FEE2E2"
              strokeWidth="0.9"
            />
            <text
              x={toSvgX(patientCoords.lon)}
              y={toSvgY(patientCoords.lat) - 4}
              textAnchor="middle"
              fill="#FCA5A5"
              fontSize="3.2"
              fontWeight="800"
            >
              {patientLabel}
            </text>
          </g>
        )}

        {/* Meeting / Rendezvous Point Pin (if specified) */}
        {rendezvousCoords && rendezvousCoords.lat && rendezvousCoords.lon && (
          <g>
            <circle
              cx={toSvgX(rendezvousCoords.lon)}
              cy={toSvgY(rendezvousCoords.lat)}
              r="2.8"
              fill="#D97706"
              stroke="#FEF3C7"
              strokeWidth="0.8"
            />
            <polygon
              points={`
                ${toSvgX(rendezvousCoords.lon)},${toSvgY(rendezvousCoords.lat) - 2}
                ${toSvgX(rendezvousCoords.lon) + 2.2},${toSvgY(rendezvousCoords.lat) - 4.5}
                ${toSvgX(rendezvousCoords.lon)},${toSvgY(rendezvousCoords.lat) - 4.5}
              `}
              fill="#F59E0B"
            />
            <text
              x={toSvgX(rendezvousCoords.lon)}
              y={toSvgY(rendezvousCoords.lat) + 5.5}
              textAnchor="middle"
              fill="#FDE68A"
              fontSize="3.0"
              fontWeight="700"
            >
              Ponto Encontro
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
