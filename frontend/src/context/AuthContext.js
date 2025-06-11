import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/me', {
            headers: {
              'x-auth-token': storedToken
            }
          });
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    // Set default authorization header for all future requests
    axios.defaults.headers.common['x-auth-token'] = newToken;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // Remove authorization header
    delete axios.defaults.headers.common['x-auth-token'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 