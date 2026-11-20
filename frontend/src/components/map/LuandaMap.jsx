import React from 'react';

export const LuandaMap = ({
  height = '380px',
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
    return ((maxLat - clamped) / (maxLat - minLat)) * 100;
  };

  // Preset known landmarks in Luanda
  const luandaLandmarks = [
    { name: 'Cazenga (Tala Hady)', lat: -8.8105, lon: 13.2750, access: 'Acesso impossível' },
    { name: 'Sambizanga (Ngola Kiluanje)', lat: -8.8020, lon: 13.2560, access: 'Acesso impossível' },
    { name: 'Maianga (Lucrécia Paim)', lat: -8.8268, lon: 13.2385, access: 'Acesso normal' },
    { name: 'Rangel (Augusto Ngangula)', lat: -8.8152, lon: 13.2498, access: 'Acesso normal' },
    { name: 'Kilamba Kiaxi (Palanca)', lat: -8.8741, lon: 13.2652, access: 'Acesso normal' },
    { name: 'Viana (Estalagem)', lat: -8.8920, lon: 13.3410, access: 'Acesso condicionado' },
    { name: 'Cacuaco (Kicolo)', lat: -8.7690, lon: 13.3320, access: 'Acesso condicionado' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        height,
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Map Control Header */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '12px',
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12.5px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', flexShrink: 0 }} />
          <span style={{ fontWeight: '700', color: '#0F172A' }}>Mapa de Luanda</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', color: '#64748B', fontSize: '11.5px' }}>
          <span style={{ color: '#DC2626', fontWeight: '700' }}>● Emergência</span>
          <span style={{ color: '#0284C7', fontWeight: '700' }}>▲ Ambulância</span>
          <span style={{ color: '#059669', fontWeight: '700' }}>■ Maternidade</span>
          <span style={{ color: '#D97706', fontWeight: '700' }}>★ Ponto Encontro</span>
        </div>
      </div>

      {/* Road Access Condition Warning Strip if impossible */}
      {roadAccessStatus === 'Acesso impossível para ambulância convencional' && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            right: '12px',
            zIndex: 10,
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '9px 14px',
            color: '#991B1B',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>
              <strong>Alerta de Via Intransitável:</strong> Ambulância aguardará no ponto de encontro acessível.
            </span>
          </div>
          {rendezvousLabel && (
            <span style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700' }}>
              {rendezvousLabel}
            </span>
          )}
        </div>
      )}

      {/* Interactive Map Visualizer */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <pattern id="light-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E2E8F0" strokeWidth="0.4" />
          </pattern>
          <linearGradient id="ocean-light" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>
        </defs>

        {/* Ocean Background */}
        <rect width="100" height="100" fill="url(#ocean-light)" />

        {/* Land Mass */}
        <path
          d="M 22,0 L 100,0 L 100,100 L 52,100 C 45,90 35,78 30,65 C 24,50 18,30 22,0 Z"
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="0.5"
        />

        {/* Luanda Land Grid */}
        <rect width="100" height="100" fill="url(#light-grid)" opacity="0.6" />

        {/* Main Road Corridors */}
        <path
          d="M 28,35 L 75,75"
          stroke="#CBD5E1"
          strokeWidth="1.6"
          strokeDasharray="2,1"
        />
        <path
          d="M 32,20 L 80,40"
          stroke="#94A3B8"
          strokeWidth="1.4"
        />
        <path
          d="M 35,45 L 85,90"
          stroke="#64748B"
          strokeWidth="1.8"
        />

        {/* Landmarks */}
        {luandaLandmarks.map((lm, idx) => {
          const x = toSvgX(lm.lon);
          const y = toSvgY(lm.lat);
          const isDifficult = lm.access === 'Acesso impossível';
          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={y}
                r={isDifficult ? 2.5 : 1.8}
                fill={isDifficult ? '#FEE2E2' : '#F1F5F9'}
                stroke={isDifficult ? '#DC2626' : '#94A3B8'}
                strokeWidth="0.6"
              />
              <text
                x={x + 3}
                y={y + 1}
                fill={isDifficult ? '#B91C1C' : '#475569'}
                fontSize="2.8"
                fontWeight={isDifficult ? '700' : '500'}
                fontFamily="inherit"
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
                x={x - 2.8}
                y={y - 2.8}
                width="5.6"
                height="5.6"
                rx="1.2"
                fill="#059669"
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
              <text x={x} y={y + 1.2} textAnchor="middle" fill="#FFFFFF" fontSize="3.2" fontWeight="800">
                +
              </text>
              <text x={x} y={y + 5.8} textAnchor="middle" fill="#065F46" fontSize="2.7" fontWeight="700">
                {mat.sigla} ({mat.camas_obstetricas_livres}c)
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
                points={`${x},${y - 3} ${x + 2.8},${y + 2.4} ${x - 2.8},${y + 2.4}`}
                fill={isBusy ? '#0284C7' : '#0D9488'}
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
              <text x={x} y={y + 5.4} textAnchor="middle" fill="#0369A1" fontSize="2.6" fontWeight="700">
                {amb.codigo_identificacao}
              </text>
            </g>
          );
        })}

        {/* Active Emergency (Patient) Marker */}
        {patientCoords && (
          <g>
            <circle cx={toSvgX(patientCoords.lon)} cy={toSvgY(patientCoords.lat)} r="6" fill="rgba(220, 38, 38, 0.25)">
              <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={toSvgX(patientCoords.lon)}
              cy={toSvgY(patientCoords.lat)}
              r="3"
              fill="#DC2626"
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
            <text
              x={toSvgX(patientCoords.lon)}
              y={toSvgY(patientCoords.lat) - 4.5}
              textAnchor="middle"
              fill="#991B1B"
              fontSize="3.1"
              fontWeight="800"
            >
              {patientLabel}
            </text>
          </g>
        )}

        {/* Active Dispatched Ambulance Marker */}
        {ambulanceCoords && (
          <g>
            <polygon
              points={`${toSvgX(ambulanceCoords.lon)},${toSvgY(ambulanceCoords.lat) - 4} ${toSvgX(ambulanceCoords.lon) + 3.2},${toSvgY(ambulanceCoords.lat) + 3} ${toSvgX(ambulanceCoords.lon) - 3.2},${toSvgY(ambulanceCoords.lat) + 3}`}
              fill="#0284C7"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            <text
              x={toSvgX(ambulanceCoords.lon)}
              y={toSvgY(ambulanceCoords.lat) + 7}
              textAnchor="middle"
              fill="#0369A1"
              fontSize="3.0"
              fontWeight="800"
            >
              {ambulanceLabel}
            </text>
          </g>
        )}

        {/* Rendezvous point marker */}
        {rendezvousCoords && roadAccessStatus === 'Acesso impossível para ambulância convencional' && (
          <g>
            <circle
              cx={toSvgX(rendezvousCoords.lon)}
              cy={toSvgY(rendezvousCoords.lat)}
              r="3.5"
              fill="#D97706"
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
            <text
              x={toSvgX(rendezvousCoords.lon)}
              y={toSvgY(rendezvousCoords.lat) + 1.2}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="3.2"
              fontWeight="800"
            >
              ★
            </text>
            <text
              x={toSvgX(rendezvousCoords.lon)}
              y={toSvgY(rendezvousCoords.lat) - 4.5}
              textAnchor="middle"
              fill="#B45309"
              fontSize="2.9"
              fontWeight="800"
            >
              {rendezvousLabel}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
