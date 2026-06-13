import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, MessageSquare, Activity, AlertTriangle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/tickets';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Conflict Modal State
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [serverState, setServerState] = useState(null);
  const [attemptedStatus, setAttemptedStatus] = useState('');

  // SLA Live Countdown
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (!ticket) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date(ticket.slaDeadline);
      const diff = deadline - now;
      
      if (diff <= 0) {
        setTimeRemaining('Breached');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${mins}m remaining`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [ticket?.slaDeadline]);

  const fetchTicket = async () => {
    try {
      const res = await axios.get(`${API_URL}/${id}`);
      setTicket(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  const legalTransitions = {
    'Open': ['In Progress'],
    'In Progress': ['Resolved'],
    'Resolved': ['Closed', 'In Progress'],
    'Queued': ['Open'],
    'Closed': []
  };

  const handleStatusChange = async (newStatus) => {
    if (!ticket) return;
    const oldStatus = ticket.status;
    const oldVersion = ticket.version;
    
    // Optimistic Update
    setTicket({ ...ticket, status: newStatus });
    
    try {
      const res = await axios.patch(`${API_URL}/${id}`, {
        version: oldVersion,
        status: newStatus
      });
      // Update with server confirmed version
      setTicket(res.data);
    } catch (err) {
      if (err.response?.status === 409) {
        // Show Conflict Modal
        setAttemptedStatus(newStatus);
        setServerState(err.response.data.serverState);
        setConflictModalOpen(true);
      } else {
        // Rollback
        setTicket({ ...ticket, status: oldStatus });
        alert(err.response?.data?.msg || 'Failed to update status.');
      }
    }
  };

  const handleTakeTheirs = () => {
    setTicket(serverState);
    setConflictModalOpen(false);
  };

  const handleRetryMine = async () => {
    // Retry with server's version
    const retryVersion = serverState.version;
    const targetStatus = attemptedStatus;
    
    try {
      const res = await axios.patch(`${API_URL}/${id}`, {
        version: retryVersion,
        status: targetStatus
      });
      setTicket(res.data);
      setConflictModalOpen(false);
    } catch (err) {
      if (err.response?.status === 409) {
        setServerState(err.response.data.serverState);
      } else {
        alert('Failed to retry update.');
        setConflictModalOpen(false);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim().length < 3) return;
    
    try {
      setSubmittingComment(true);
      const res = await axios.post(`${API_URL}/${id}/comments`, { text: newComment });
      setTicket(res.data);
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div className="container" style={{ padding: '4rem' }}><div className="alert">{error}</div></div>;
  if (!ticket) return null;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <button className="btn" style={{ background: 'transparent', padding: 0, color: 'var(--primary)', marginBottom: '1rem' }} onClick={() => navigate('/tickets')}>
        ← Back to List
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Main Content */}
        <div>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h1 style={{ margin: 0 }}>{ticket.title}</h1>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge badge-priority-${ticket.priority}`}>{ticket.priority}</span>
                <span className={`badge badge-status-${ticket.status.replace(/\s+/g, '')}`}>{ticket.status}</span>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </p>

            <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Category</small>
                <strong>{ticket.category}</strong>
              </div>
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Agent</small>
                <strong>{ticket.assignedAgent || 'Unassigned'}</strong>
              </div>
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Created</small>
                <strong>{new Date(ticket.createdAt).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <MessageSquare size={20} /> Comments
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {ticket.comments.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>No comments yet.</div>
              ) : (
                ticket.comments.map(c => (
                  <div key={c._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>{c.createdBy}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div>{c.text}</div>
                  </div>
                ))
              )}
            </div>

            {ticket.status === 'Closed' ? (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: '8px', textAlign: 'center' }}>
                Comments are disabled because this ticket is Closed.
              </div>
            ) : (
              <form onSubmit={handleAddComment}>
                <div className="form-group">
                  <textarea 
                    className="form-control" 
                    placeholder="Add a comment..." 
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submittingComment} style={{ width: 'auto' }}>
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Status & SLA Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Ticket Actions</h3>
            
            <div className="form-group">
              <label>Update Status</label>
              <select 
                className="filter-select" 
                style={{ width: '100%' }}
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={ticket.status === 'Closed'}
              >
                <option value={ticket.status}>{ticket.status} (Current)</option>
                {legalTransitions[ticket.status]?.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock size={16} /> <strong>SLA Countdown</strong>
              </div>
              <div style={{ fontSize: '1.2rem', color: ticket.slaState === 'ok' ? '#10b981' : ticket.slaState === 'at_risk' ? '#f59e0b' : '#ef4444' }}>
                {timeRemaining}
              </div>
            </div>
          </div>

          {/* History Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Activity size={20} /> History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {[...ticket.history].reverse().map((h, i) => (
                <div key={i} style={{ paddingLeft: '1rem', borderLeft: '2px solid rgba(99, 102, 241, 0.5)', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-5px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(h.timestamp).toLocaleString()}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{h.action}</div>
                  <div style={{ fontSize: '0.85rem' }}>{h.details}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Conflict Modal */}
      {conflictModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '1.5rem' }}>
              <AlertTriangle /> Conflict Detected
            </h2>
            <p style={{ marginBottom: '2rem' }}>This ticket was changed by someone else while you were viewing it.</p>
            
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Server State</h4>
                <p><strong>Status:</strong> {serverState?.status}</p>
                <p><strong>Priority:</strong> {serverState?.priority}</p>
                <p><strong>Agent:</strong> {serverState?.assignedAgent || 'Unassigned'}</p>
              </div>
              <div style={{ flex: 1, padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Your Change</h4>
                <p><strong>Attempted Status:</strong> {attemptedStatus}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={handleTakeTheirs}>
                Take Theirs
              </button>
              <button className="btn btn-primary" onClick={handleRetryMine}>
                Retry Mine on Top
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TicketDetail;
