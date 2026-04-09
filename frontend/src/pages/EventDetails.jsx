import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { eventApi, giftApi } from '../api';
import { useAlert } from '../components/Modal.jsx';

const EventDetails = ({ userId, userEmail }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [ownedEvents, setOwnedEvents] = useState([]);
  const [movingGift, setMovingGift] = useState(null);
  const [showOnlyReserved, setShowOnlyReserved] = useState(false);
  const [newGift, setNewGift] = useState({ name: '', link: '', notes: '' });
  const [viewers, setViewers] = useState([]);
  const [newViewerInput, setNewViewerInput] = useState('');
  const navigate = useNavigate();

  const { showAlert, showConfirm } = useAlert();

  const fetchEvent = async () => {
    try {
      const { data } = await eventApi.get(id);
      setEvent(data);
      setViewers(data.viewers);
      
      if (data.owner_id === userId) {
        const eventsRes = await eventApi.list();
        setOwnedEvents(eventsRes.data.filter(e => e.id !== parseInt(id)));
      }
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  if (!event) return <p>{t('common.loading')}</p>;

  const isOwner = event.owner_id === userId;
  const canAddGift = isOwner || event.is_group;

  const handleAddGift = async (e) => {
    e.preventDefault();
    try {
      await giftApi.add(id, newGift);
      setNewGift({ name: '', link: '', notes: '' });
      fetchEvent();
    } catch (err) {
      showAlert(t('eventDetails.errorAddGift'));
    }
  };

  const handleUpdateShares = async () => {
    try {
      await eventApi.updateShares(id, viewers.map(v => v.viewer_email));
      showAlert(t('eventDetails.sharesUpdated'), t('common.success'));
      fetchEvent();
    } catch (err) {
      showAlert(t('eventDetails.errorUpdateShares'));
    }
  };

  const handleAddViewer = () => {
    if (!newViewerInput.trim()) return;
    const existingEmails = viewers.map(v => v.viewer_email);
    const emails = newViewerInput.split(',').map(e => e.trim()).filter(e => e && !existingEmails.includes(e));
    if (emails.length > 0) {
      const newViewers = emails.map(email => ({
        viewer_email: email,
        viewer_name: null,
        is_registered: true // Assume registered for now, backend will confirm
      }));
      setViewers([...viewers, ...newViewers]);
      setNewViewerInput('');
    }
  };

  const handleRemoveViewer = (email) => {
    setViewers(viewers.filter(v => v.viewer_email !== email));
  };

  const handleReserve = async (giftId, reserve) => {
    try {
      await giftApi.update(giftId, { reserved_by: reserve ? userEmail : null });
      fetchEvent();
    } catch (err) {
      showAlert(t('eventDetails.errorUpdateGift'));
    }
  };

  const handleDeleteGift = async (giftId) => {
    if (!await showConfirm(t('eventDetails.deleteGiftConfirm'))) return;
    try {
      await giftApi.delete(giftId);
      fetchEvent();
    } catch (err) {
      showAlert(t('eventDetails.errorDeleteGift'));
    }
  };

  const giftsByUser = event.gifts.reduce((acc, gift) => {
    const key = gift.user_id;
    if (!acc[key]) acc[key] = { name: gift.user_name, email: gift.user_email, gifts: [] };
    acc[key].gifts.push(gift);
    return acc;
  }, {});

  const sortedUserIds = Object.keys(giftsByUser).sort((a, b) => {
    if (parseInt(a) === userId) return -1;
    if (parseInt(b) === userId) return 1;
    return 0;
  });

  const handleDeleteEvent = async () => {
    if (!await showConfirm(t('eventDetails.deleteEventConfirm'))) return;
    try {
      await eventApi.delete(id);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.detail === "Cannot delete event with gifts") {
        showAlert(t('eventDetails.errorDeleteEventGifts'));
      } else {
        showAlert(t('common.error'));
      }
    }
  };

  const handleMoveGift = async (giftId, targetEventId) => {
    if (!targetEventId) return;
    try {
      await giftApi.update(giftId, { event_id: parseInt(targetEventId) });
      showAlert(t('eventDetails.moveSuccess'), t('common.success'));
      setMovingGift(null);
      fetchEvent();
    } catch (err) {
      const msg = err.response?.data?.detail === "Cannot move a reserved gift" 
        ? t('eventDetails.cannotMoveReserved') 
        : t('eventDetails.errorMoveGift');
      showAlert(msg);
    }
  };

  return (
    <div style={{maxWidth: '1000px', margin: '0 auto'}}>
      <div className="nav">
        <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span style={{fontSize: '1.4rem'}}>←</span> {t('eventDetails.backToDashboard')}
        </Link>
        {isOwner && (
          <button 
            onClick={handleDeleteEvent} 
            className="btn" 
            style={{
              background: 'none', 
              color: '#ff7675', 
              boxShadow: 'none', 
              border: '1px solid #ff7675',
              padding: '0.6rem 1.2rem'
            }}
          >
            {t('eventDetails.deleteEvent')}
          </button>
        )}
      </div>

      <div className="event-card" style={{borderLeft: '8px solid var(--primary-color)'}}>
        <h2 style={{marginTop: 0, fontSize: '2.4rem'}}>{event.title}</h2>
        <p style={{fontSize: '1.1rem', color: '#64748b', lineHeight: '1.6'}}>{event.description}</p>
        {!isOwner && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: '#f1f5f9', borderRadius: '100px', fontSize: '0.9rem', color: '#475569', marginTop: '1rem' }}>
            <span style={{width: '8px', height: '8px', background: 'var(--primary-color)', borderRadius: '50%'}}></span>
            {t('common.owner')} <strong>{event.owner_name || event.owner_email}</strong>
          </div>
        )}
        
        {isOwner && (
          <div style={{marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem'}}>
            <h4 style={{marginBottom: '1rem'}}>{t('eventDetails.shareWith')}</h4>
            
            {viewers.length > 0 && (
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem'}}>
                {viewers.map(viewer => (
                  <div key={viewer.viewer_email} style={{
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '8px 12px', 
                    background: 'var(--bg-color)', 
                    borderRadius: '14px', 
                    fontSize: '0.9rem',
                    border: viewer.is_registered ? '1px solid #e2e8f0' : '1px solid #ff7675'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <span style={{fontWeight: viewer.viewer_name ? 'bold' : 'normal'}}>
                        {viewer.viewer_name || viewer.viewer_email}
                      </span>
                      <button 
                        onClick={() => handleRemoveViewer(viewer.viewer_email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff7675',
                          cursor: 'pointer',
                          padding: '0 4px',
                          fontSize: '1.1rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {viewer.viewer_name && (
                      <span style={{fontSize: '0.8rem', color: '#64748b'}}>{viewer.viewer_email}</span>
                    )}
                    {!viewer.is_registered && (
                      <span style={{fontSize: '0.8rem', color: '#ff7675', fontWeight: 'bold'}}>
                        {t('eventDetails.userNotFound')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1.5rem'}}>
              <div style={{flex: '1 1 300px', display: 'flex', gap: '8px'}}>
                <input 
                  style={{flex: 1, padding: '0.8rem 1rem', borderRadius: '14px'}} 
                  value={newViewerInput} 
                  onChange={e => setNewViewerInput(e.target.value)} 
                  placeholder={t('eventDetails.addUsersPlaceholder')}
                  onKeyPress={e => e.key === 'Enter' && handleAddViewer()}
                />
                <button 
                  onClick={handleAddViewer} 
                  className="btn" 
                  style={{background: 'var(--primary-color)', color: 'white'}}
                >
                  {t('common.add') || '+'}
                </button>
              </div>
              <button onClick={handleUpdateShares} className="btn" style={{background: 'var(--secondary-color)', boxShadow: '0 4px 12px rgba(78, 205, 196, 0.2)'}}>
                {t('eventDetails.updateShares')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{background: 'var(--card-bg)', borderRadius: '32px', padding: '2.5rem', boxShadow: 'var(--shadow)', border: '1px solid rgba(0,0,0,0.02)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap'}}>
            <h3 style={{margin: 0, fontSize: '1.8rem'}}>{t('eventDetails.gifts')}</h3>
            <div style={{display: 'flex', gap: '8px'}}>
              <span style={{background: 'var(--primary-color)', color: 'white', padding: '4px 12px', borderRadius: '100px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
                {event.gifts.length}
              </span>
              <span style={{background: '#e67e22', color: 'white', padding: '4px 12px', borderRadius: '100px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
                {event.gifts.filter(g => g.is_reserved).length} {t('eventDetails.reservedCount')}
              </span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', fontSize: '0.9rem', color: '#64748b'}}>
              <input 
                type="checkbox" 
                id="showReserved" 
                checked={showOnlyReserved} 
                onChange={() => setShowOnlyReserved(!showOnlyReserved)}
                style={{cursor: 'pointer'}}
              />
              <label htmlFor="showReserved" style={{cursor: 'pointer'}}>{t('eventDetails.showOnlyReserved')}</label>
            </div>
          </div>
        </div>

        {event.gifts.length === 0 && (
          <div style={{textAlign: 'center', padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '24px', border: '2px dashed #e2e8f0'}}>
             <p style={{color: '#94a3b8', fontSize: '1.1rem'}}>{t('eventDetails.noGifts')}</p>
          </div>
        )}

        {sortedUserIds.map((uId, idx) => {
          const userGroup = giftsByUser[uId];
          const isMyList = parseInt(uId) === userId;
          
          const giftsCountInGroup = userGroup.gifts.filter(gift => !showOnlyReserved || (gift.is_reserved && gift.reserved_by === userEmail)).length;
          
          return (
            giftsCountInGroup > 0 && (
              <div key={uId} style={{marginBottom: '3.5rem', animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`}}>
                {event.is_group && (
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem'}}>
                    <h4 style={{margin: 0, color: 'var(--primary-color)', fontSize: '1.3rem', whiteSpace: 'nowrap'}}>
                      {isMyList ? t('eventDetails.myGiftList') : t('eventDetails.giftListOf', {name: userGroup.name || userGroup.email})}
                    </h4>
                    <div style={{flex: 1, height: '2px', background: 'linear-gradient(90deg, #edf2f7, transparent)'}}></div>
                  </div>
                )}
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '15px'}}>
                  {userGroup.gifts
                    .filter(gift => !showOnlyReserved || (gift.is_reserved && gift.reserved_by === userEmail))
                    .map(gift => {
                    const isGiftOwner = gift.user_id === userId;
                  
                  return (
                    <div key={gift.id} className="gift-item">
                      <div style={{textAlign: 'left', flex: 1, width: '100%'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                           <strong style={{fontSize: '1.2rem', color: 'var(--text-color)'}}>{gift.name}</strong>
                           {!isGiftOwner && gift.is_reserved && gift.reserved_by === userEmail && (
                            <span style={{background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold'}}>
                              {t('eventDetails.reservedByYou')}
                            </span>
                          )}
                        </div>
                        <p style={{margin: '12px 0', fontSize: '1rem', color: 'var(--text-color)', opacity: 0.8, lineHeight: '1.6'}}>{gift.notes}</p>
                        
                        {gift.preview_title && (
                          <a href={gift.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{
                              marginTop: '15px',
                              display: 'flex',
                              gap: '15px',
                              padding: '12px',
                              background: 'rgba(0,0,0,0.03)',
                              borderRadius: '16px',
                              border: '1px solid rgba(0,0,0,0.05)',
                              fontSize: '0.9rem',
                              transition: 'var(--transition)'
                            }} className="preview-card">
                              {gift.preview_image && (
                                <img 
                                  src={gift.preview_image} 
                                  alt="" 
                                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }}
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', marginBottom: '6px', color: 'var(--primary-color)', fontSize: '1rem' }}>{gift.preview_title}</div>
                                {gift.preview_description && <div style={{ color: 'var(--text-color)', opacity: 0.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', fontSize: '0.85rem' }}>{gift.preview_description}</div>}
                              </div>
                            </div>
                          </a>
                        )}

                        {!gift.preview_title && gift.link && (
                          <div style={{ marginTop: '10px' }}>
                            <a href={gift.link} target="_blank" rel="noreferrer" className="btn" style={{padding: '0.4rem 1rem', fontSize: '0.8rem', background: '#f1f5f9', color: 'var(--primary-color)', boxShadow: 'none', border: '1px solid #e2e8f0'}}>
                              {t('eventDetails.linkText')} ↗
                            </a>
                          </div>
                        )}
                      </div>

                      <div style={{display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '120px', alignItems: 'flex-end'}}>
                        {isGiftOwner || (isOwner && !event.is_group) ? (
                          <div style={{display: 'flex', gap: '8px'}}>
                            {isGiftOwner && !gift.reserved_by && (
                              <button 
                                onClick={() => setMovingGift(movingGift === gift.id ? null : gift.id)} 
                                className="btn" 
                                style={{color: 'var(--secondary-color)', background: 'none', boxShadow: 'none', padding: '8px', fontSize: '0.9rem'}}
                              >
                                {t('eventDetails.moveGift')}
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteGift(gift.id)} 
                              className="btn" 
                              style={{color: '#ff7675', background: 'none', boxShadow: 'none', padding: '8px', fontSize: '0.9rem'}}
                            >
                              {t('eventDetails.deleteGift')}
                            </button>
                          </div>
                        ) : (
                          <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                            {gift.is_reserved && gift.reserved_by !== userEmail ? (
                              <span style={{color: '#e67e22', fontWeight: 'bold', padding: '8px 16px', background: '#fff9f0', borderRadius: '12px', border: '1px solid #ffeaa7', fontSize: '0.9rem'}}>
                                {t('eventDetails.reserved')}
                              </span>
                            ) : (
                              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                <button 
                                  className="btn" 
                                  onClick={() => handleReserve(gift.id, !gift.reserved_by)}
                                  style={{
                                    backgroundColor: gift.reserved_by ? '#f1f5f9' : 'var(--secondary-color)', 
                                    color: gift.reserved_by ? '#64748b' : 'white', 
                                    padding: '10px 20px',
                                    boxShadow: gift.reserved_by ? 'none' : '0 6px 15px rgba(78, 205, 196, 0.25)'
                                  }}
                                >
                                  {gift.reserved_by === userEmail ? t('eventDetails.unreserve') : t('eventDetails.reserve')}
                                </button>
                                {isOwner && !event.is_group && (
                                  <button 
                                    onClick={() => handleDeleteGift(gift.id)} 
                                    className="btn" 
                                    style={{color: '#ff7675', background: 'none', boxShadow: 'none', padding: '8px', fontSize: '0.9rem'}}
                                  >
                                    {t('eventDetails.deleteGift')}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {movingGift === gift.id && (
                        <div style={{
                          width: '100%', 
                          marginTop: '15px', 
                          padding: '20px', 
                          background: 'var(--bg-color)', 
                          borderRadius: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '15px',
                          border: '2px solid var(--secondary-color)',
                          animation: 'fadeIn 0.3s ease-out'
                        }}>
                          <label style={{fontSize: '1rem', fontWeight: 'bold'}}>{t('eventDetails.moveGiftTitle')}</label>
                          <div style={{display: 'flex', gap: '12px'}}>
                            <select 
                              style={{flex: 1, padding: '12px', borderRadius: '12px'}}
                              onChange={(e) => handleMoveGift(gift.id, e.target.value)}
                              defaultValue=""
                            >
                              <option value="" disabled>{t('eventDetails.selectEvent')}</option>
                              {ownedEvents.map(e => (
                                <option key={e.id} value={e.id}>{e.title}</option>
                              ))}
                            </select>
                            <button className="btn" style={{background: '#f1f5f9', color: '#64748b', boxShadow: 'none'}} onClick={() => setMovingGift(null)}>{t('common.cancel')}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
          );
        })}

        {canAddGift && (
          <form onSubmit={handleAddGift} style={{marginTop: '4rem', borderTop: '2px solid #f1f5f9', paddingTop: '2.5rem'}}>
            <h4 style={{fontSize: '1.5rem', marginBottom: '1.5rem'}}>{t('eventDetails.addNewGift')}</h4>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>{t('eventDetails.giftName')}</label>
                <input placeholder="What do you want?" value={newGift.name} onChange={e => setNewGift({...newGift, name: e.target.value})} required />
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>{t('eventDetails.link')}</label>
                <input placeholder="https://..." value={newGift.link} onChange={e => setNewGift({...newGift, link: e.target.value})} />
              </div>
            </div>
            <div className="form-group" style={{marginTop: '20px'}}>
              <label>{t('eventDetails.notes')}</label>
              <textarea placeholder="Size, color, or other details..." value={newGift.notes} onChange={e => setNewGift({...newGift, notes: e.target.value})} rows="2" />
            </div>
            <button type="submit" className="btn" style={{width: '100%', marginTop: '10px', padding: '1rem'}}>
               <span style={{fontSize: '1.2rem'}}>+</span> {t('eventDetails.addGift')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
