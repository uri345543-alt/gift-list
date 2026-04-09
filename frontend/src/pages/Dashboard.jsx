import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { eventApi } from '../api';
import { useAlert } from '../components/Modal.jsx';

const Dashboard = () => {
  const { t } = useTranslation();
  const [myEvents, setMyEvents] = useState([]);
  const [sharedEvents, setSharedEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isGroup, setIsGroup] = useState(false);

  const fetchData = async () => {
    try {
      const [mine, shared] = await Promise.all([eventApi.list(), eventApi.shared()]);
      setMyEvents(mine.data);
      setSharedEvents(shared.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { showAlert } = useAlert();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await eventApi.create({ title: newTitle, description: newDesc, is_group: isGroup });
      setNewTitle('');
      setNewDesc('');
      setIsGroup(false);
      setShowCreate(false);
      fetchData();
    } catch (err) {
      showAlert(t('dashboard.errorCreate'));
    }
  };

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap', gap: '20px', marginBottom: '2rem'}}>
        <h2 style={{margin: 0}}>{t('dashboard.myEvents')}</h2>
        <button className="btn" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? t('common.cancel') : (
            <>
              <span style={{fontSize: '1.2rem'}}>+</span> {t('dashboard.newEvent')}
            </>
          )}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="event-card" style={{border: '2px solid var(--secondary-color)', background: 'var(--bg-color)'}}>
          <div className="form-group">
            <label>{t('dashboard.title')}</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="e.g. My Birthday 2024" />
          </div>
          <div className="form-group">
            <label>{t('dashboard.description')}</label>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Tell everyone what this event is about..." rows="3" />
          </div>
          <div className="form-group" style={{flexDirection: 'row', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #edf2f7'}}>
            <input 
              type="checkbox" 
              id="isGroup" 
              checked={isGroup} 
              onChange={e => setIsGroup(e.target.checked)} 
              style={{width: '20px', height: '20px', cursor: 'pointer'}}
            />
            <label htmlFor="isGroup" style={{marginBottom: 0, cursor: 'pointer', fontSize: '0.95rem'}}>{t('dashboard.isGroup')}</label>
          </div>
          <button type="submit" className="btn" style={{width: '100%', padding: '1rem'}}>{t('dashboard.create')}</button>
        </form>
      )}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
        {myEvents.map(ev => (
          <div key={ev.id} className="event-card" style={{margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div>
              <h3 style={{marginTop: 0}}><Link to={`/events/${ev.id}`}>{ev.title}</Link></h3>
              <p style={{color: '#64748b', fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{ev.description}</p>
            </div>
            <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
              <Link to={`/events/${ev.id}`} className="btn" style={{padding: '0.5rem 1.2rem', fontSize: '0.9rem', background: 'var(--secondary-color)', boxShadow: '0 4px 12px rgba(78, 205, 196, 0.2)'}}>
                {t('common.view')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{marginTop: '4rem'}}>{t('dashboard.sharedWithMe')}</h2>
      {sharedEvents.length === 0 && (
        <div className="event-card" style={{textAlign: 'center', padding: '3rem', color: '#94a3b8'}}>
           <p>{t('dashboard.noShared')}</p>
        </div>
      )}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
        {sharedEvents.map(ev => (
          <div key={ev.id} className="event-card" style={{margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div>
              <h3 style={{marginTop: 0}}><Link to={`/events/${ev.id}`}>{ev.title}</Link></h3>
              <p style={{color: '#64748b', fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{ev.description}</p>
            </div>
            <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                {t('common.owner')} <span style={{color: 'var(--primary-color)', fontWeight: '600'}}>{ev.owner_name || ev.owner_email}</span>
              </p>
              <Link to={`/events/${ev.id}`} className="btn" style={{padding: '0.5rem 1.2rem', fontSize: '0.9rem', background: 'var(--secondary-color)', boxShadow: '0 4px 12px rgba(78, 205, 196, 0.2)'}}>
                {t('common.view')}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
