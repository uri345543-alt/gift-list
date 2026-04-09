import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api';
import { useAlert } from '../components/Modal.jsx';
import {Link} from "react-router-dom";

const Profile = ({ user, setUser }) => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        name: user.name || '',
        password: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      
      const { data } = await authApi.updateMe(updateData);
      setUser(data);
      showAlert(t('profile.updateSuccess'), t('common.success'));
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      if (err.response?.status === 422) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          const isEmailError = detail.some(d => d.loc.includes('email'));
          if (isEmailError) {
            showAlert(t('signup.invalidEmail'));
            return;
          }
        }
      }
      showAlert(err.response?.data?.detail || t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{marginTop: '5vh'}}>
      <h2 style={{textAlign: 'center', marginBottom: '2.5rem', display: 'block'}}>{t('profile.title')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('profile.name')}</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            placeholder="Your Name"
          />
        </div>
        <div className="form-group">
          <label>{t('profile.email')}</label>
          <input 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            required 
            placeholder="your@email.com"
          />
        </div>
        <div className="form-group">
          <label>{t('profile.password')} ({t('profile.passwordHint')})</label>
          <input 
            type="password" 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn" disabled={loading} style={{width: '100%', padding: '1rem', marginTop: '1rem'}}>
          {loading ? t('common.loading') : t('profile.save')}
        </button>
      </form>
      <div style={{marginTop: '2rem', textAlign: 'center'}}>
        <Link to="/" style={{color: '#64748b', fontWeight: '500'}}>← {t('common.back')}</Link>
      </div>
    </div>
  );
};

export default Profile;
