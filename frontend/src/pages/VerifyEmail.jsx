import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api';

const VerifyEmail = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        return;
      }
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="card" style={{ marginTop: '10vh', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '2rem' }}>{t('common.appTitle')}</h1>
      {status === 'loading' && <p>{t('signup.verifying')}</p>}
      {status === 'success' && (
        <>
          <p style={{ color: 'green', fontWeight: 'bold' }}>{t('signup.verifySuccess')}</p>
          <div style={{ marginTop: '2rem' }}>
            <Link to="/login" className="btn" style={{ padding: '0.5rem 2rem' }}>
              {t('signup.login')}
            </Link>
          </div>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="error">{t('signup.verifyFailed')}</p>
          <div style={{ marginTop: '2rem' }}>
            <Link to="/signup" className="btn" style={{ padding: '0.5rem 2rem', backgroundColor: '#64748b' }}>
              {t('signup.title')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
