import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/client.ts';

interface AuthContextType {
  isAdmin: boolean;
  pin: string | null;
  login: (pin: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isPinModalOpen: boolean;
  openPinModal: () => void;
  closePinModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PIN_KEY = 'admin_pin';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(ADMIN_PIN_KEY));
  });
  const [pin, setPin] = useState<string | null>(() => {
    return localStorage.getItem(ADMIN_PIN_KEY);
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Validar PIN salvo ao carregar se existir
    const savedPin = localStorage.getItem(ADMIN_PIN_KEY);
    if (savedPin) {
      authApi.verify(savedPin).then((res) => {
        if (!res.isValid) {
          localStorage.removeItem(ADMIN_PIN_KEY);
          setIsAdmin(false);
          setPin(null);
        }
      }).catch(() => {
        // Se a requisição falhar (ex: 401), desloga
        localStorage.removeItem(ADMIN_PIN_KEY);
        setIsAdmin(false);
        setPin(null);
      });
    }
  }, []);

  const login = async (inputPin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authApi.verify(inputPin);
      if (res.isValid) {
        localStorage.setItem(ADMIN_PIN_KEY, inputPin);
        setIsAdmin(true);
        setPin(inputPin);
        setIsPinModalOpen(false);
        return { success: true, message: 'Autenticado com sucesso!' };
      } else {
        return { success: false, message: 'PIN incorreto.' };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'PIN incorreto ou erro de conexão.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_PIN_KEY);
    setIsAdmin(false);
    setPin(null);
  };

  const openPinModal = () => setIsPinModalOpen(true);
  const closePinModal = () => setIsPinModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        pin,
        login,
        logout,
        isPinModalOpen,
        openPinModal,
        closePinModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
