const db = require('../db');
const { emitToAll, emitToOccurrence, emitToCentral } = require('../realtime/socketHandler');

// Haversine formula to calculate distance in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

// Simulate 1 step of movement for an ambulance toward target
const simulateMovementStep = async (ambulanceId, targetLat, targetLon, stepFraction = 0.25) => {
  const ambResult = await db.query(
    'SELECT id, codigo_identificacao, latitude_atual, longitude_atual, estado_operacional FROM ambulancias WHERE id = $1',
    [ambulanceId]
  );

  if (ambResult.rows.length === 0) return null;
  const amb = ambResult.rows[0];

  const currentLat = parseFloat(amb.latitude_atual);
  const currentLon = parseFloat(amb.longitude_atual);
  const destLat = parseFloat(targetLat);
  const destLon = parseFloat(targetLon);

  const remainingDist = calculateDistanceKm(currentLat, currentLon, destLat, destLon);

  // If already very close (< 100 meters)
  if (remainingDist < 0.1) {
    return {
      ambulanceId,
      latitude: destLat,
      longitude: destLon,
      distanceKm: 0,
      arrived: true,
    };
  }

  // Move stepFraction closer
  const newLat = currentLat + (destLat - currentLat) * stepFraction;
  const newLon = currentLon + (destLon - currentLon) * stepFraction;

  await db.query(
    'UPDATE ambulancias SET latitude_atual = $1, longitude_atual = $2, ultima_comunicacao = CURRENT_TIMESTAMP WHERE id = $3',
    [newLat, newLon, ambulanceId]
  );

  const newDist = calculateDistanceKm(newLat, newLon, destLat, destLon);

  const payload = {
    ambulanceId,
    codigo_identificacao: amb.codigo_identificacao,
    latitude: Number(newLat.toFixed(7)),
    longitude: Number(newLon.toFixed(7)),
    distanceKm: newDist,
    arrived: newDist < 0.15,
  };

  emitToAll('ambulance:position_updated', payload);
  emitToCentral('ambulance:position_updated', payload);

  return payload;
};

module.exports = {
  calculateDistanceKm,
  simulateMovementStep,
};
