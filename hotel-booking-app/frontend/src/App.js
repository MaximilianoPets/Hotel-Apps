import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import HotelSearch from './components/HotelSearch';
import AdminPanel from './components/AdminPanel';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { ModalProvider, useModal } from './ModalContext';
import './App.css';

function AppContent() {
  const { t, language, changeLanguage } = useLanguage();
  const { showAlert } = useModal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user already logged in
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      }
    }
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post('/api/login', credentials);
      setToken(response.data.token);
      setUser(response.data.user);
      setIsLoggedIn(true);
      
      // Store in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      showAlert(t('loginSuccessful'));
    } catch (error) {
      showAlert(t('loginFailed') + (error.response?.data?.error || ''));
    }
  };

  const handleRegister = async (registrationData) => {
    try {
      await axios.post('/api/register', registrationData);
      showAlert(t('registerSuccess'));
    } catch (error) {
      showAlert(t('registerFailed') + (error.response?.data?.error || ''));
      throw error;
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>{t('hotelBookingSystem')}</h1>
        <div className="header-controls">
          <div className="language-selector">
            <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
              <option value="es">{t('spanish')}</option>
              <option value="en">{t('english')}</option>
            </select>
          </div>
          {isLoggedIn && (
            <div className="user-info">
              <span>{t('welcome')}, {user?.username}!</span>
              <button onClick={handleLogout} style={{ marginLeft: '10px' }}>{t('logout')}</button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {!isLoggedIn ? (
          <Login onLogin={handleLogin} onRegister={handleRegister} />
        ) : user?.is_admin === 1 ? (
          <AdminPanel userId={user?.id} />
        ) : (
          <HotelSearch token={token} userId={user?.id} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </LanguageProvider>
  );
}

export default App;
