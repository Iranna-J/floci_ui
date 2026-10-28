const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
export const setCurrentUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeCurrentUser = () => localStorage.removeItem('user');

export const api = {
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  async register(username, password, email) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  },

  async uploadFile(file) {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        removeAuthToken();
        removeCurrentUser();
        throw new Error('Your login session has expired. Please sign in again.');
      }
      const err = await res.json().catch(() => ({ message: 'File upload failed' }));
      throw new Error(err.message || 'File upload failed');
    }
    return res.json();
  },

  async getFiles() {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/files`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        removeAuthToken();
        removeCurrentUser();
        throw new Error('Your login session has expired. Please sign in again.');
      }
      const err = await res.json().catch(() => ({ message: 'Failed to fetch files' }));
      throw new Error(err.message || 'Failed to fetch files');
    }
    return res.json();
  },

  async deleteFile(id) {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/files/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        removeAuthToken();
        removeCurrentUser();
        throw new Error('Your login session has expired. Please sign in again.');
      }
      const err = await res.json().catch(() => ({ message: 'Failed to delete file' }));
      throw new Error(err.message || 'Failed to delete file');
    }
    return res.json();
  },

  getFileViewUrl(id) {
    const token = getAuthToken();
    return `${API_BASE}/files/view/${id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  getFileDownloadUrl(id) {
    const token = getAuthToken();
    return `${API_BASE}/files/download/${id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // ⚡ AWS Lambda & Serverless Explorer APIs
  async runServerlessInApp(payload) {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/serverless/thumbnail/in-app`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        removeAuthToken();
        removeCurrentUser();
        throw new Error('Your login session has expired. Please sign in again.');
      }
      const err = await res.json().catch(() => ({ message: 'Execution failed' }));
      throw new Error(err.message || 'Execution failed');
    }
    return res.json();
  },

  async runServerlessViaLambda(payload) {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/serverless/thumbnail/lambda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        removeAuthToken();
        removeCurrentUser();
        throw new Error('Your login session has expired. Please sign in again.');
      }
      const err = await res.json().catch(() => ({ message: 'Lambda execution failed' }));
      throw new Error(err.message || 'Lambda execution failed');
    }
    return res.json();
  },

  getServerlessThumbnailUrl(key) {
    const token = getAuthToken();
    return `${API_BASE}/serverless/thumbnail-view?key=${encodeURIComponent(key)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  }
};

