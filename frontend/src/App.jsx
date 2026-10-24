import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import FileUploadSection from './components/FileUploadSection';
import { getCurrentUser, removeAuthToken, removeCurrentUser } from './services/api';
import { ShieldCheck, CheckCircle, ArrowRight, User, Database, Server, UploadCloud, Layers } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    removeAuthToken();
    removeCurrentUser();
    setUser(null);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  return (
    <div className="app-container">
      <Navbar
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {/* Status Banner */}
        <section className="status-banner">
          <div className="status-info">
            <div className="pulse-dot" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                AWS RDS PostgreSQL + AWS S3 Active (via Floci)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Backend (Port 8080) &bull; React (Port 5173) &bull; RDS (Port 7001) &bull; S3 (Port 4566)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#10b981' }}>
              RDS (7001)
            </span>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#38bdf8' }}>
              S3 (4566)
            </span>
          </div>
        </section>

        {/* Main Card */}
        {user ? (
          <>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#312e81', padding: '0.6rem', borderRadius: '10px' }}>
                  <User size={24} color="#818cf8" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Welcome, {user.username}!</h2>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {user.email ? `Email: ${user.email}` : 'Signed in with persistent account'}
                  </p>
                </div>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} color="#10b981" />
                  <span>Step 3: AWS S3 File Storage is Online!</span>
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  Upload images and documents below. The binary files are sent directly to your local <strong>AWS S3</strong> bucket (<code style={{ color: '#38bdf8' }}>floci-uploads</code>), while the metadata (file size, MIME type, upload timestamp, and owner) is persisted into your <strong>AWS RDS PostgreSQL</strong> database.
                </p>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
                🗺️ Learning Roadmap:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#1e293b', border: '1px solid #10b981', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Step 1 (Done)
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Base Project & Auth</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Spring Boot + React + JWT Auth.
                  </div>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #10b981', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Step 2 (Done)
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>AWS RDS via Floci</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    PostgreSQL 16.3 on port 7001 with Pgweb GUI on 8081.
                  </div>
                </div>

                <div style={{ background: '#1e293b', border: '2px solid #38bdf8', borderRadius: '10px', padding: '1rem', boxShadow: '0 0 12px rgba(56, 189, 248, 0.15)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Step 3 (Active)
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>AWS S3 File Upload</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    AWS SDK v2 S3 Client + Dual Storage (S3 Binary + RDS Metadata).
                  </div>
                </div>
              </div>
            </div>

            {/* S3 File Upload Section */}
            <FileUploadSection user={user} />
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <ShieldCheck size={48} color="#818cf8" style={{ margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Baseline Full-Stack Application
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
              All AWS and Floci components have been removed. Register a test user or sign in to verify that your basic Spring Boot and React project is working.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => handleOpenAuth('login')}>
                Sign In
              </button>
              <button className="btn btn-secondary" onClick={() => handleOpenAuth('register')}>
                Create Account
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
