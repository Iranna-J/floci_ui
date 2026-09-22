import React from 'react';
import { User, LogOut, LogIn, UserPlus, Layers } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout }) {
  return (
    <header className="navbar">
      <div className="logo-container">
        <span className="logo-badge">STEP 1</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers style={{ width: 22, height: 22, color: '#818cf8' }} />
          <span className="logo-title">Spring Boot & React App</span>
        </div>
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            <div className="user-info">
              <User size={16} color="#818cf8" />
              <span>{user.username}</span>
            </div>
            <button className="btn btn-secondary" onClick={onLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={() => onOpenAuth('login')}>
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
            <button className="btn btn-primary" onClick={() => onOpenAuth('register')}>
              <UserPlus size={16} />
              <span>Register</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
