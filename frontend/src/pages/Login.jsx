import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/');
  }

  const { email, password } = formData;

  const validateField = (fieldName, value) => {
    let err = '';
    if (fieldName === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length > 0) err = 'Invalid email address';
      if (!value) err = 'Email is required';
    }
    if (fieldName === 'password') {
      if (!value) err = 'Password is required';
    }
    
    setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
  };

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    validateField(e.target.name, e.target.value);
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    const hasErrors = Object.values(fieldErrors).some(err => err !== '');
    if (hasErrors) {
      setError('Please fix all errors before submitting');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.msg);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-box">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your account</p>
        
        {error && <div className="alert">{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={email} 
              onChange={onChange} 
              required 
              className={`form-control ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="name@example.com"
            />
            {fieldErrors.email && <small style={{color: '#ef4444', marginTop: '0.25rem', display: 'block'}}>{fieldErrors.email}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={password} 
                onChange={onChange} 
                required 
                className={`form-control ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.password && <small style={{color: '#ef4444', marginTop: '0.25rem', display: 'block'}}>{fieldErrors.password}</small>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={Object.values(fieldErrors).some(err => err !== '')}>Sign In</button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
