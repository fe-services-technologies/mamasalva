const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('mamasalva_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || `Erro na requisição HTTP: ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // Autenticação
  login: async (login, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    return handleResponse(res);
  },

  demoLogin: async (perfil) => {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perfil }),
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Ocorrências
  getOccurrences: async () => {
    const res = await fetch(`${API_BASE}/occurrences`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getOccurrenceById: async (id) => {
    const res = await fetch(`${API_BASE}/occurrences/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  createOccurrence: async (data) => {
    const res = await fetch(`${API_BASE}/occurrences`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  validateTriage: async (id, data) => {
    const res = await fetch(`${API_BASE}/occurrences/${id}/triage`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  dispatchAmbulance: async (id, data) => {
    const res = await fetch(`${API_BASE}/occurrences/${id}/dispatch`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  referToMaternity: async (id, data) => {
    const res = await fetch(`${API_BASE}/occurrences/${id}/refer-maternity`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateOccurrenceStatus: async (id, data) => {
    const res = await fetch(`${API_BASE}/occurrences/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  confirmReception: async (id, data) => {
    const res = await fetch(`${API_BASE}/occurrences/${id}/confirm-reception`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  flagSuspicious: async (id, data) => {
    const res = await fetch(`${API_BASE}/occurrences/${id}/flag-suspicious`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  reviewSuspicious: async (id, data) => {
    const res = await fetch(`${API_BASE}/occurrences/${id}/review-suspicious`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Ambulâncias
  getAmbulances: async () => {
    const res = await fetch(`${API_BASE}/ambulances`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getAmbulanceById: async (id) => {
    const res = await fetch(`${API_BASE}/ambulances/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateAmbulanceStatus: async (id, data) => {
    const res = await fetch(`${API_BASE}/ambulances/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  simulateAmbulanceStep: async (id, data) => {
    const res = await fetch(`${API_BASE}/ambulances/${id}/simulate-step`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Maternidades
  getMaternities: async () => {
    const res = await fetch(`${API_BASE}/maternities`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getMaternityById: async (id) => {
    const res = await fetch(`${API_BASE}/maternities/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateMaternityCapacity: async (id, data) => {
    const res = await fetch(`${API_BASE}/maternities/${id}/capacity`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Zonas e Acessibilidade Viária
  getZones: async () => {
    const res = await fetch(`${API_BASE}/zones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  reportRoadCondition: async (id, data) => {
    const res = await fetch(`${API_BASE}/zones/${id}/report`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  verifyRoadCondition: async (id, data) => {
    const res = await fetch(`${API_BASE}/zones/${id}/verify`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Canais
  sendUssd: async (sessionId, phoneNumber, text) => {
    const res = await fetch(`${API_BASE}/channels/ussd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, phoneNumber, text }),
    });
    return handleResponse(res);
  },

  createPhoneIntake: async (data) => {
    const res = await fetch(`${API_BASE}/channels/phone-call`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getSmsLogs: async () => {
    const res = await fetch(`${API_BASE}/channels/sms`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  sendSms: async (data) => {
    const res = await fetch(`${API_BASE}/channels/sms/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Relatórios & Indicadores
  getDashboardKPIs: async () => {
    const res = await fetch(`${API_BASE}/reports/kpis`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/reports/audit-logs`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Utilizadores & Pesquisa
  searchGravidas: async (q) => {
    const res = await fetch(`${API_BASE}/users/search-gravidas?q=${encodeURIComponent(q)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  createUser: async (data) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getOperatorShifts: async () => {
    const res = await fetch(`${API_BASE}/users/shifts`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateMyShiftStatus: async (status_operador) => {
    const res = await fetch(`${API_BASE}/users/my-shift-status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status_operador }),
    });
    return handleResponse(res);
  },
};
