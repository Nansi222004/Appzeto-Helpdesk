import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const { name, email, password, confirmPassword } = formData;

  const validateField = (fieldName, value, currentFormData = formData) => {
    let err = '';
    if (fieldName === 'name') {
      if (value.trim().length < 2 && value.length > 0) err = 'Name must be at least 2 characters';
      if (!value) err = 'Name is required';
    }
    if (fieldName === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length > 0) err = 'Invalid email address';
      if (!value) err = 'Email is required';
    }
    if (fieldName === 'password') {
      if (value.length < 6 && value.length > 0) err = 'Password must be at least 6 characters';
      if (!value) err = 'Password is required';
    }
    if (fieldName === 'confirmPassword') {
      if (value !== currentFormData.password && value.length > 0) err = 'Passwords do not match';
      if (!value) err = 'Please confirm your password';
    }
    
    setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
  };

  const onChange = e => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);
    validateField(e.target.name, e.target.value, newFormData);
    
    // Also revalidate confirm password if password changes
    if (e.target.name === 'password' && newFormData.confirmPassword) {
      validateField('confirmPassword', newFormData.confirmPassword, newFormData);
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const hasErrors = Object.values(fieldErrors).some(err => err !== '');
    if (hasErrors || !name || !email || !password || !confirmPassword) {
      setError('Please fix all errors before submitting');
      return;
    }

    const res = await register(name, email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.msg);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-box">
        <h2>Create an Account</h2>
        <p className="subtitle">Join us to experience the premium feel</p>
        
        {error && <div className="alert">{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={name} 
              onChange={onChange} 
              required 
              className={`form-control ${fieldErrors.name ? 'input-error' : ''}`}
              placeholder="John Doe"
            />
            {fieldErrors.name && <small style={{color: '#ef4444', marginTop: '0.25rem', display: 'block'}}>{fieldErrors.name}</small>}
          </div>
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
                minLength="6"
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
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword" 
                value={confirmPassword} 
                onChange={onChange} 
                required 
                minLength="6"
                className={`form-control ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <small style={{color: '#ef4444', marginTop: '0.25rem', display: 'block'}}>{fieldErrors.confirmPassword}</small>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={Object.values(fieldErrors).some(err => err !== '')}>Sign Up</button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
