import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="container" style={{ paddingTop: '4rem' }}>
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>
            You have successfully logged in and accessed the protected home page.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ padding: '2rem', flex: '1', minWidth: '250px' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Your Profile</h3>
              <div style={{ textAlign: 'left', color: 'var(--text-main)' }}>
                <p style={{ marginBottom: '0.5rem' }}><strong>Name:</strong> {user?.name}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {user?.email}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Member Since:</strong> {user?.date ? new Date(user.date).toLocaleDateString() : 'Today'}</p>
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '2rem', flex: '1', minWidth: '250px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>Account Status</h3>
              <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>Active</p>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                Your account is fully verified and secure.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Home;
