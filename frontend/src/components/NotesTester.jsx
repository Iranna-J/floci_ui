import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function NotesTester() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNotes();
      setNotes(data || []);
    } catch (err) {
      setError('Could not fetch notes. Is Spring Boot running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const newNote = await api.createNote(content);
      setNotes((prev) => [...prev, newNote]);
      setContent('');
      setStatusMsg('Saved string to DynamoDB table "Notes"!');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setStatusMsg('Deleted note from DynamoDB!');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete note');
    }
  };

  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Database size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Live DynamoDB Test: <code>Notes</code> Table
          </h3>
        </div>
        <button
          onClick={fetchNotes}
          disabled={loading}
          style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.5 }}>
        This demonstrates saving and reading simple strings to a secondary DynamoDB table (<code>Notes</code>) in AWS Floci.
      </p>

      {error && (
        <div style={{ background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {statusMsg && (
        <div style={{ background: '#064e3b', border: '1px solid #059669', color: '#6ee7b7', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {statusMsg}
        </div>
      )}

      <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <input
          type="text"
          placeholder="Enter a dummy text/string (e.g. 'Hello AWS DynamoDB!')..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ flex: 1, padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem' }}
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          style={{ padding: '0.6rem 1rem', background: '#38bdf8', color: '#0f172a', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
        >
          <Plus size={16} />
          Save to AWS
        </button>
      </form>

      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Items in DynamoDB Notes Table ({notes.length}):
        </div>
        {notes.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', border: '1px dashed #334155', borderRadius: '8px' }}>
            No items in Notes table yet. Type a string above and click "Save to AWS"!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notes.map((item) => (
              <div
                key={item.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem' }}
              >
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 500, fontSize: '0.9rem' }}>{item.content}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    ID: <code>{item.id}</code> &bull; Created: {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(item.id)}
                  title="Delete from DynamoDB"
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
