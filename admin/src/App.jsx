import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = 'http://localhost:5000/api/tickets';

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, { params: { limit: 100 } });
      setTickets(res.data.tickets);
      setError('');
    } catch (err) {
      setError('Failed to load tickets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = async (ticketId, currentVersion, newAgent) => {
    try {
      const res = await axios.patch(`${API_URL}/${ticketId}`, {
        version: currentVersion,
        assignedAgent: newAgent === 'unassigned' ? null : newAgent
      });
      // Update local state
      setTickets(tickets.map(t => t._id === ticketId ? { ...t, assignedAgent: res.data.assignedAgent, version: res.data.version, status: res.data.status } : t));
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Conflict: Ticket was modified by someone else. Refreshing data.');
        fetchTickets();
      } else {
        alert('Failed to reassign agent.');
      }
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', background: 'linear-gradient(to right, #f43f5e, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Appzeto Admin Panel
        </h1>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="glass-panel" style={{ overflowX: 'auto', padding: '1rem' }}>
        {loading && tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tickets found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem' }}>Title</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Priority</th>
                <th style={{ padding: '1rem' }}>Current Assignee</th>
                <th style={{ padding: '1rem' }}>Reassign Agent</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
                      {t.title}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-status-${t.status.replace(/\s+/g, '')}`}>{t.status}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-priority-${t.priority}`}>{t.priority}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {t.assignedAgent || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      className="filter-select" 
                      style={{ padding: '0.25rem 0.5rem', background: 'rgba(15, 23, 42, 0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                      value={t.assignedAgent || 'unassigned'}
                      onChange={(e) => handleAssign(t._id, t.version, e.target.value)}
                    >
                      <option value="unassigned">Unassigned</option>
                      <option value="Riya">Riya</option>
                      <option value="Karan">Karan</option>
                      <option value="Dev">Dev</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
