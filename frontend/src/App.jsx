import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from './api';
import { ModalProvider } from './components/Modal.jsx';
import Header from './components/Header.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EventDetails from './pages/EventDetails.jsx';
import Profile from './pages/Profile.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';

function App() {
  const { t } = useTranslation();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      authApi.me()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    } else {
      setUser(null);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <ModalProvider>
      <Router>
        <div className="App">
          <Header user={user} onLogout={handleLogout} />

          <main>
            <Routes>
              <Route path="/login" element={token ? <Navigate to="/" /> : <Login setToken={setToken} />} />
              <Route path="/signup" element={token ? <Navigate to="/" /> : <Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route 
                path="/" 
                element={token ? <Dashboard /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/events/:id" 
                element={token ? <EventDetails userId={user?.id} userEmail={user?.email} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/profile" 
                element={token ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ModalProvider>
  );
}

export default App;
