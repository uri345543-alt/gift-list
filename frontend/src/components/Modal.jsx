import React, { useState, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const { t } = useTranslation();
  const [modal, setModal] = useState({ isOpen: false, message: '', title: '', onConfirm: null });

  const showAlert = (message, title = t('common.error')) => {
    setModal({ isOpen: true, message, title, onConfirm: null });
  };

  const showConfirm = (message, title = t('common.confirm')) => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        message,
        title,
        onConfirm: () => {
          setModal({ ...modal, isOpen: false });
          resolve(true);
        },
        onCancel: () => {
          setModal({ ...modal, isOpen: false });
          resolve(false);
        }
      });
    });
  };

  const closeModal = () => {
    if (modal.onCancel) modal.onCancel();
    setModal({ ...modal, isOpen: false });
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{modal.title}</h3>
            <p>{modal.message}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '2rem' }}>
              {modal.onConfirm ? (
                <>
                  <button className="btn" style={{ backgroundColor: '#dfe6e9', color: '#636e72' }} onClick={modal.onCancel}>{t('common.cancel')}</button>
                  <button className="btn" onClick={modal.onConfirm}>{t('common.confirm')}</button>
                </>
              ) : (
                <button className="btn" onClick={closeModal}>{t('common.ok')}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useAlert = () => useContext(ModalContext);
