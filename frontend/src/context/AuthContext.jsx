import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth');
      setUser(res.data);
    } catch (error) {
      console.error('Error loading user', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        msg: error.response?.data?.errors?.[0]?.msg || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        msg: error.response?.data?.errors?.[0]?.msg || 'Registration failed' 
      };
    }
  };

  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUser(res.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        msg: error.response?.data?.errors?.[0]?.msg || 'Failed to update profile' 
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axios.put('http://localhost:5000/api/auth/password', { currentPassword, newPassword });
      return { success: true, msg: res.data.msg };
    } catch (error) {
      return { 
        success: false, 
        msg: error.response?.data?.errors?.[0]?.msg || 'Failed to change password' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
