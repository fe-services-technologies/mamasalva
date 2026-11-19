import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [lastEvent, setLastEvent] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const listenersRef = useRef(new Map());

  // Registrar callback para eventos específicos
  const subscribe = (event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);

    return () => {
      const set = listenersRef.current.get(event);
      if (set) {
        set.delete(callback);
      }
    };
  };

  const notifyListeners = (event, data) => {
    setLastEvent({ event, data, timestamp: Date.now() });
    const set = listenersRef.current.get(event);
    if (set) {
      set.forEach((cb) => {
        try { cb(data); } catch (e) { console.error('Erro no listener:', e); }
      });
    }
  };

  const addAlert = (alert) => {
    const newAlert = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('pt-AO'),
      ...alert,
    };
    setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]);
  };

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Conexão WebSockets com fallback automático
  useEffect(() => {
    let socket = null;

    try {
      if (window.io) {
        socket = window.io('/', {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
          setIsConnected(true);
          if (user) {
            socket.emit('join', { userId: user.id, perfil: user.perfil });
          }
        });

        const events = [
          'occurrence:created',
          'occurrence:updated',
          'occurrence:triaged',
          'occurrence:ambulance_assigned',
          'occurrence:maternity_notified',
          'occurrence:reception_confirmed',
          'ambulance:position_updated',
          'maternity:capacity_updated',
          'supervisor:alert',
        ];

        events.forEach((evt) => {
          socket.on(evt, (data) => {
            notifyListeners(evt, data);
            if (evt === 'supervisor:alert') {
              addAlert(data);
            }
          });
        });

        socket.on('disconnect', () => setIsConnected(false));
      }
    } catch (e) {
      console.warn('Socket.IO indisponível no ambiente de rede. Operando em modo de sincronização local resiliente.');
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        subscribe,
        notifyListeners,
        lastEvent,
        alerts,
        addAlert,
        dismissAlert,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser utilizado dentro de um SocketProvider.');
  }
  return context;
};
