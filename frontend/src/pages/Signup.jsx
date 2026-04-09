import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api';

const Signup = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authApi.signup(email, password, name);
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 422) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          const isEmailError = detail.some(d => d.loc.includes('email'));
          if (isEmailError) {
            setError(t('signup.invalidEmail'));
            return;
          }
        }
      }
      setError(t('signup.failed'));
    }
  };

  return (
    <div className="card" style={{marginTop: '10vh'}}>
      <h1 style={{textAlign: 'center'}}>{t('common.appTitle')}</h1>
      <h3 style={{textAlign: 'center', marginBottom: '2rem', color: '#64748b'}}>{t('signup.title')}</h3>
      {error && <p className="error">{error}</p>}
      {success && <p style={{color: 'green', fontWeight: 'bold', textAlign: 'center'}}>{t('signup.success')}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('signup.name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
        </div>
        <div className="form-group">
          <label>{t('signup.email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
        </div>
        <div className="form-group">
          <label>{t('signup.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <button type="submit" className="btn" style={{width: '100%', padding: '1rem', marginTop: '1rem'}}>{t('signup.button')}</button>
      </form>
      <p style={{textAlign: 'center', marginTop: '2rem'}}>
        {t('signup.haveAccount')} <Link to="/login" style={{color: 'var(--secondary-color)'}}>{t('signup.login')}</Link>
      </p>
    </div>
  );
};

export default Signup;
