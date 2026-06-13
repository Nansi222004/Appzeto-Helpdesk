import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Search, Filter, ArrowUpDown, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/tickets';

const Home = () => {
  const navigate = useNavigate();
  
  // State
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ status: {}, priority: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Pagination
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Polling / Toast
  const [toastMessage, setToastMessage] = useState('');
  const previousTicketsRef = useRef([]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Data function
  const fetchData = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      
      const [ticketsRes, statsRes] = await Promise.all([
        axios.get(API_URL, {
          params: { status, priority, search: debouncedSearch, sort, page }
        }),
        axios.get(`${API_URL}/stats`)
      ]);

      setStats(statsRes.data);
      setTotalPages(ticketsRes.data.totalPages);

      const newTickets = ticketsRes.data.tickets;
      
      // If polling, check for updates to show toast
      if (isPolling && previousTicketsRef.current.length > 0) {
        const changedCount = newTickets.filter((nt, i) => {
          const pt = previousTicketsRef.current.find(t => t._id === nt._id);
          // Simple heuristic: status, priority, or version changed
          return pt && (pt.status !== nt.status || pt.priority !== nt.priority || pt.version !== nt.version);
        }).length;
        
        if (changedCount > 0) {
          setToastMessage(`${changedCount} ticket(s) updated`);
          setTimeout(() => setToastMessage(''), 3000);
        }
      }

      setTickets(newTickets);
      previousTicketsRef.current = newTickets;
      setError('');
    } catch (err) {
      if (!isPolling) setError('Failed to load tickets.');
      console.error(err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [status, priority, debouncedSearch, sort, page]);

  // Initial fetch and dependency fetch
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Polling every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Helper for relative time
  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getSlaClass = (state) => {
    if (state === 'ok') return 'sla-ok';
    if (state === 'at_risk') return 'sla-at_risk';
    return 'sla-breached';
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      
      {/* Header & Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Appzeto Helpdesk</h1>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/create')}>
          + New Ticket
        </button>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="glass-panel stat-card">
          <div className="stat-value">{stats.status?.Open || 0}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value">{stats.status?.['In Progress'] || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value">{stats.priority?.Critical || 0}</div>
          <div className="stat-label" style={{ color: '#ef4444' }}>Critical</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value">{stats.status?.Resolved || 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel filters-bar">
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search tickets..." 
            className="filter-input" 
            style={{ width: '100%', maxWidth: '300px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Filter size={20} color="var(--text-muted)" />
          <select className="filter-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Queued">Queued</option>
          </select>

          <select className="filter-select" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <ArrowUpDown size={20} color="var(--text-muted)" />
          <select className="filter-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {error && <div className="alert">{error}</div>}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No tickets found matching your criteria.
        </div>
      ) : (
        <>
          <div className="ticket-grid">
            {tickets.map(ticket => (
              <div 
                key={ticket._id} 
                className="glass-panel ticket-card"
                onClick={() => navigate(`/ticket/${ticket._id}`)}
              >
                <div className="ticket-header">
                  <h3 className="ticket-title">{ticket.title}</h3>
                  <span className={`badge badge-priority-${ticket.priority}`}>
                    {ticket.priority}
                  </span>
                </div>
                
                <div className="ticket-meta">
                  <span className={`badge badge-status-${ticket.status.replace(/\s+/g, '')}`}>
                    {ticket.status}
                  </span>
                  <span>•</span>
                  <span>{ticket.category}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                    Agent: {ticket.assignedAgent || 'Unassigned'}
                  </span>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <div className={`sla-indicator ${getSlaClass(ticket.slaState)}`}>
                    <Clock size={16} />
                    SLA: {ticket.slaState === 'ok' ? 'OK' : ticket.slaState === 'at_risk' ? 'At Risk' : 'Breached'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {getRelativeTime(ticket.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button 
                  key={i + 1} 
                  className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                className="page-btn" 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <AlertCircle size={20} color="#818cf8" />
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
