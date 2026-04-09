import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const Header = ({ user, onLogout }) => {
  const { t } = useTranslation();

  return (
    <header className="nav" style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.2rem 2.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.8rem',
            background: 'linear-gradient(135deg, var(--primary-color), #ff8787)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em'
          }}>
            {t('common.appTitle')}
          </h1>
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-end' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/profile" className="profile-link">
              {user.name || user.email}
            </Link>
            <button 
              onClick={onLogout} 
              className="btn" 
              style={{ 
                background: 'none', 
                color: '#ff7675', 
                boxShadow: 'none', 
                padding: '5px',
                fontSize: '0.95rem'
              }}
            >
              {t('common.logout')}
            </button>
          </div>
        )}
        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default Header;
