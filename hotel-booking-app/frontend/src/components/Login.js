import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import './Login.css';

function Login({ onLogin, onRegister }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin({ username, password });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onRegister({
        usuario: username,
        nombre: firstName,
        apellido: lastName,
        mail: email,
        contrasena: password
      });
      setMode('login');
      setUsername('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setEmail('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            {t('login')}
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            {t('register')}
          </button>
        </div>

        {mode === 'login' ? (
          <>
            <h2>{t('login')}</h2>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="username">{t('username')}</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('enterUsername')}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('password')}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('enterPassword')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? t('loggingIn') : t('loginButton')}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>{t('register')}</h2>
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="username">{t('username')}</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('enterUsername')}
                  disabled={isLoading}
                />
              </div>
              <p className="optional-info">{t('usernamePasswordRequired')}</p>

              <div className="form-group">
                <label htmlFor="firstName">{t('firstName')} <span className="optional-text">({t('optional')})</span></label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('enterFirstName')}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('lastName')} <span className="optional-text">({t('optional')})</span></label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('enterLastName')}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">{t('email')} <span className="optional-text">({t('optional')})</span></label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('enterEmail')}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('password')}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('enterPassword')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? t('registering') : t('registerButton')}
              </button>
            </form>
          </>
        )}

        <div className="test-credentials">
          <h4>{t('testCredentials')}</h4>
          <p><strong>{t('enabledUser')}</strong><br /> testuser / password123</p>
          <p><strong>{t('disabledUser')}</strong><br /> disableduser / password123</p>
          <p><strong>{t('admin')}:</strong><br /> admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
