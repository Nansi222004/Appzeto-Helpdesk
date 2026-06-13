import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tickets';

const AgentWorkload = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalPages = Math.ceil(tickets.length / limit) || 1;

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

  // Calculate workload counts
  const agentLoads = { Riya: 0, Karan: 0, Dev: 0, Unassigned: 0 };
  tickets.forEach(t => {
    if (t.status !== 'Resolved' && t.status !== 'Closed') {
      if (t.assignedAgent === 'Riya') agentLoads.Riya++;
      else if (t.assignedAgent === 'Karan') agentLoads.Karan++;
      else if (t.assignedAgent === 'Dev') agentLoads.Dev++;
      else agentLoads.Unassigned++;
    }
  });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ padding: '1rem 2rem', textAlign: 'center', flex: 1, minWidth: '150px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Riya's Active Tickets</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{agentLoads.Riya} / 3</div>
        </div>
        <div className="glass-panel" style={{ padding: '1rem 2rem', textAlign: 'center', flex: 1, minWidth: '150px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Karan's Active Tickets</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{agentLoads.Karan} / 4</div>
        </div>
        <div className="glass-panel" style={{ padding: '1rem 2rem', textAlign: 'center', flex: 1, minWidth: '150px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Dev's Active Tickets</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{agentLoads.Dev} / 5</div>
        </div>
        <div className="glass-panel" style={{ padding: '1rem 2rem', textAlign: 'center', flex: 1, minWidth: '150px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Unassigned / Queued</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{agentLoads.Unassigned}</div>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="glass-panel" style={{ overflowX: 'auto', padding: '1rem' }}>
        {loading && tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tickets found.</div>
        ) : (
          <>
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
                {tickets.slice((page - 1) * limit, page * limit).map(t => (
                  <tr key={t._id} className="workload-row">
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
                        className="workload-select" 
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
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <span style={{ margin: '0 1rem', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
                <button 
                  className="page-btn" 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AgentWorkload;
