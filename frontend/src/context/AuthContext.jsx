import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mamasalva_token') || null);
  const [loading, setLoading] = useState(true);

  // Carregar utilizador ativo na inicialização
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Sessão expirada ou indisponível:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (loginIdentifier, password) => {
    const res = await api.login(loginIdentifier, password);
    if (res.success && res.token) {
      localStorage.setItem('mamasalva_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
  };

  const demoLogin = async (perfil) => {
    try {
      const res = await api.demoLogin(perfil);
      if (res.success && res.token) {
        localStorage.setItem('mamasalva_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      console.error('Falha ao alternar perfil demonstrativo:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('mamasalva_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      const res = await api.getMe();
      if (res.success) setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
};
