import React, { useState } from 'react';
import { api, setAuthToken, setCurrentUser } from '../services/api';
import { X, Lock, User, Mail } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await api.login(username, password);
      } else {
        data = await api.register(username, password, email);
      }

      setAuthToken(data.token);
      const userObj = { username: data.username, email: data.email };
      setCurrentUser(userObj);
      onSuccess(userObj);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {isLogin ? 'Sign In to Floci App' : 'Create an Account'}
          </h2>
          <button 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-badge">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <a
                href="#"
                style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}
                onClick={(e) => { e.preventDefault(); setIsLogin(false); setError(''); }}
              >
                Register now
              </a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a
                href="#"
                style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}
                onClick={(e) => { e.preventDefault(); setIsLogin(true); setError(''); }}
              >
                Sign In
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
