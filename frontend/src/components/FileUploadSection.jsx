import React, { useState, useEffect, useRef } from 'react';
import { api, getAuthToken } from '../services/api';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  ExternalLink, 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  HardDrive,
  Database
} from 'lucide-react';

export default function FileUploadSection({ user }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getFiles();
      setFiles(data);
    } catch (err) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const uploadedRecord = await api.uploadFile(file);
      setSuccess(`"${uploadedRecord.fileName}" uploaded successfully to AWS S3!`);
      // Reload list
      await loadFiles();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This will remove it from AWS S3 and the database.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await api.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setSuccess(`File "${fileName}" deleted successfully from S3 and database.`);
    } catch (err) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const isImage = (contentType) => {
    return contentType && contentType.startsWith('image/');
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      {/* Header */}
      <div className="card-header">
        <div>
          <div className="card-title">
            <UploadCloud size={24} color="#818cf8" />
            <span>AWS S3 File Storage (Floci Emulator)</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Binary files stored in S3 bucket <code style={{ color: '#38bdf8' }}>floci-uploads</code> &bull; Metadata tracked in RDS PostgreSQL
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={loadFiles} 
            disabled={loading}
            title="Refresh files"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* S3 Architecture Info Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        marginBottom: '1.25rem',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HardDrive size={16} color="#38bdf8" />
          <span style={{ color: '#cbd5e1' }}>Bucket:</span>
          <span style={{ color: '#f8fafc', fontWeight: 600 }}>floci-uploads</span>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: '#cbd5e1' }}>Endpoint:</span>
          <span style={{ color: '#a78bfa' }}>http://localhost:4566</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={16} color="#10b981" />
          <span style={{ color: '#94a3b8' }}>Table:</span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>files (RDS Port 7001)</span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="error-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          {error.includes('expired') && (
            <button
              className="btn btn-primary"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => window.location.reload()}
            >
              Sign In Again
            </button>
          )}
        </div>
      )}


      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '0.6rem 0.85rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{ opacity: uploading ? 0.7 : 1, pointerEvents: uploading ? 'none' : 'auto' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        {uploading ? (
          <div>
            <Loader2 size={40} color="#818cf8" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600, color: '#818cf8', fontSize: '1rem' }}>
              Uploading to AWS S3 via Floci...
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Streaming binary to bucket & saving metadata in RDS PostgreSQL
            </div>
          </div>
        ) : (
          <div>
            <UploadCloud className="drop-zone-icon" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc' }}>
              Drag & Drop file here, or <span style={{ color: '#818cf8', textDecoration: 'underline' }}>browse</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Supports Images (PNG, JPG, SVG), Documents (PDF, TXT), Archives &bull; Max 25 MB
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files Section */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
            Uploaded Files ({files.length})
          </h4>
          {files.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Stored in S3 &bull; Indexed in RDS
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
            <div>Loading uploaded files...</div>
          </div>
        ) : files.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            background: '#0f172a',
            border: '1px dashed #334155',
            borderRadius: '10px',
            color: '#94a3b8'
          }}>
            <FileText size={36} color="#475569" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No files uploaded yet</p>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Drag and drop an image or document above to test AWS S3 file upload!
            </p>
          </div>
        ) : (
          <div className="files-grid">
            {files.map((file) => {
              const viewUrl = api.getFileViewUrl(file.id);
              const downloadUrl = api.getFileDownloadUrl(file.id);
              const isImg = isImage(file.contentType);

              return (
                <div key={file.id} className="file-card">
                  {/* Preview Area */}
                  <div className="file-preview">
                    {isImg ? (
                      <img
                        src={viewUrl}
                        alt={file.fileName}
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to icon if preview fails
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div style="color: #64748b"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>';
                        }}
                      />
                    ) : (
                      <FileText className="file-preview-icon" />
                    )}
                  </div>

                  {/* Details Area */}
                  <div className="file-details">
                    <div>
                      <div className="file-name" title={file.fileName}>
                        {file.fileName}
                      </div>
                      <div className="file-meta">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.contentType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        <div>By: <span style={{ color: '#cbd5e1' }}>{file.uploadedBy}</span></div>
                        <div>{formatDate(file.uploadedAt)}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="file-actions">
                      <a
                        href={downloadUrl}
                        download={file.fileName}
                        className="btn btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', padding: '0.4rem 0.5rem', fontSize: '0.8rem', textDecoration: 'none' }}
                        title="Download file"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>

                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', textDecoration: 'none' }}
                        title="Open in new tab"
                      >
                        <ExternalLink size={14} />
                      </a>

                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(file.id, file.fileName)}
                        style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                        title="Delete from S3 and database"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
