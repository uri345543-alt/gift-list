import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api';

const Login = ({ setToken }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || t('login.invalid'));
    }
  };

  return (
    <div className="card" style={{marginTop: '10vh'}}>
      <h1 style={{textAlign: 'center'}}>{t('common.appTitle')}</h1>
      <h3 style={{textAlign: 'center', marginBottom: '2rem', color: '#64748b'}}>{t('login.title')}</h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('login.email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
        </div>
        <div className="form-group">
          <label>{t('login.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <button type="submit" className="btn" style={{width: '100%', padding: '1rem', marginTop: '1rem'}}>{t('login.button')}</button>
      </form>
      <p style={{textAlign: 'center', marginTop: '2rem'}}>
        {t('login.noAccount')} <Link to="/signup" style={{color: 'var(--secondary-color)'}}>{t('login.signup')}</Link>
      </p>
    </div>
  );
};

export default Login;
