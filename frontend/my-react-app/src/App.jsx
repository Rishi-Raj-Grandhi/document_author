import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import WorkspacePage from './components/WorkspacePage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (data) => {
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: '#0F172A', color: '#F1F5F9' }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="App">
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <WorkspacePage user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;