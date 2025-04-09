import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      const savedUser = localStorage.getItem('currentUser');
      const savedAuth = localStorage.getItem('isAuthenticated');
      
      if (savedUser && savedAuth === 'true') {
        setCurrentUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    loadAuthState();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Simple validation
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Create a new user or get existing one
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      let user = existingUsers.find((u: User) => u.username === username);

      if (!user) {
        // Create new user
        user = {
          id: uuidv4(),
          username: username,
        };
        existingUsers.push(user);
        localStorage.setItem('users', JSON.stringify(existingUsers));
      }

      // Update auth state
      setCurrentUser(user);
      setIsAuthenticated(true);

      // Save auth state to localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');

      // Initialize user's data storage
      const storageKeyPrefix = `user-${user.id}`;
      if (!localStorage.getItem(`${storageKeyPrefix}-entries`)) {
        localStorage.setItem(`${storageKeyPrefix}-entries`, JSON.stringify([]));
      }
      if (!localStorage.getItem(`${storageKeyPrefix}-recurring-payments`)) {
        localStorage.setItem(`${storageKeyPrefix}-recurring-payments`, JSON.stringify([]));
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Login failed');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 