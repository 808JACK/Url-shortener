import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';

function Stats() {
  const { code } = useParams();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStats();
  }, [code]);

  const fetchStats = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/links/${code}`));
      if (!res.ok) throw new Error('Link not found');
      const data = await res.json();
      setLink(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="card"><div className="error">{error}</div></div>;

  return (
    <div className="card">
      <Link to="/">← Back to Dashboard</Link>
      <h2 style={{ marginTop: '20px' }}>Link Statistics</h2>
      
      <div style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <strong>Short Code:</strong> {link.code}
        </div>
        <div style={{ marginBottom: '16px' }}>
          <strong>Target URL:</strong> <a href={link.target_url} target="_blank" rel="noopener noreferrer">{link.target_url}</a>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <strong>Total Clicks:</strong> {link.total_clicks}
        </div>
        <div style={{ marginBottom: '16px' }}>
          <strong>Last Clicked:</strong> {link.last_clicked ? new Date(link.last_clicked).toLocaleString() : 'Never'}
        </div>
        <div style={{ marginBottom: '16px' }}>
          <strong>Created:</strong> {new Date(link.created_at).toLocaleString()}
        </div>
        <div style={{ marginTop: '24px' }}>
          <strong>Short URL:</strong>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ wordBreak: 'break-all' }}>
              {import.meta.env.VITE_API_URL || 'http://localhost:3001'}/{link.code}
            </span>
            <button onClick={() => {
              navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/${link.code}`);
              setSuccess('Copied to clipboard!');
              setTimeout(() => setSuccess(''), 2000);
            }}>
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {success && <div className="toast success-toast">{success}</div>}
    </div>
  );
}

export default Stats;
