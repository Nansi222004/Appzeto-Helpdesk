import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';

const Landing = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return null;
  
  if (isAuthenticated) {
    return <Navigate to="/tickets" />;
  }

  return (
    <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome to Appzeto Helpdesk
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          A robust, load-balanced, real-time support ticket system. Please sign in to access the dashboard and manage your tickets.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-primary" style={{ width: 'auto', padding: '1rem 2rem' }}>
            Sign In
          </Link>
          <Link to="/register" className="btn" style={{ width: 'auto', padding: '1rem 2rem', background: 'rgba(255,255,255,0.1)' }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
