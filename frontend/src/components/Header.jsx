import { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { User, Activity, Shield, LogOut, Menu, X } from 'lucide-react';

const Header = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={isAuthenticated ? "/tickets" : "/"} style={{ textDecoration: 'none', color: 'inherit' }}>
          Appzeto Helpdesk
        </Link>
      </div>

      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {isAuthenticated ? (
          <>
            <Link to="/agent-workload" className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', color: 'white' }} onClick={() => setIsMobileMenuOpen(false)}>
              <Activity size={16} style={{ marginRight: '0.5rem' }} /> Agent Workload
            </Link>
            <div className="profile-menu-container" ref={dropdownRef}>
              <div
                className="profile-avatar"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {getInitials()}
              </div>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  <User size={18} />
                  My Profile
                </Link>
                <Link to="/change-password" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  <Shield size={18} />
                  Change Password
                </Link>

                <div className="dropdown-divider"></div>

                <button onClick={handleLogout} className="dropdown-item text-danger">
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setIsMobileMenuOpen(false)}>
              Login
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setIsMobileMenuOpen(false)}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;
