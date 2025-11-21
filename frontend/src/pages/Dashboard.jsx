import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';

function Dashboard() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ target_url: '', code: '' });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch(getApiUrl('/api/links'));
      const data = await res.json();
      setLinks(data);
    } catch (err) {
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(getApiUrl('/api/links'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create link');
      }

      setSuccess('Link created successfully!');
      setFormData({ target_url: '', code: '' });
      fetchLinks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (code) => {
    try {
      await fetch(getApiUrl(`/api/links/${code}`), { method: 'DELETE' });
      fetchLinks();
      setSuccess('Link deleted successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to delete link');
    }
  };

  const copyToClipboard = (code) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    navigator.clipboard.writeText(`${backendUrl}/${code}`);
    setSuccess('Link copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const filteredLinks = links.filter(link =>
    link.code.toLowerCase().includes(search.toLowerCase()) ||
    link.target_url.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="card">
        <h2>Create Short Link</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Target URL *</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.target_url}
              onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Custom Code (optional, 6-8 characters)</label>
            <input
              type="text"
              placeholder="mycode"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              pattern="[A-Za-z0-9]{6,8}"
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Link'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>All Links</h2>
        <div className="form-group">
          <input
            type="text"
            placeholder="Search by code or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredLinks.length === 0 ? (
          <div className="empty">No links found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Target URL</th>
                <th>Clicks</th>
                <th>Last Clicked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map(link => (
                <tr key={link.code}>
                  <td>
                    <Link to={`/code/${link.code}`}>{link.code}</Link>
                  </td>
                  <td className="truncate" title={link.target_url}>
                    {link.target_url}
                  </td>
                  <td>{link.total_clicks}</td>
                  <td>{link.last_clicked ? new Date(link.last_clicked).toLocaleString() : 'Never'}</td>
                  <td className="actions">
                    <Link to={`/code/${link.code}`}>
                      <button>Stats</button>
                    </Link>
                    <button onClick={() => copyToClipboard(link.code)}>Copy</button>
                    <button className="danger" onClick={() => handleDelete(link.code)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast Notifications */}
      {error && <div className="toast error-toast">{error}</div>}
      {success && <div className="toast success-toast">{success}</div>}
    </>
  );
}

export default Dashboard;
