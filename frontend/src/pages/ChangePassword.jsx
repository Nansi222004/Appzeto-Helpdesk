import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const ChangePassword = () => {
  const { changePassword } = useContext(AuthContext);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const validateField = (fieldName, value, currentFormData = passwordData) => {
    let err = '';
    if (fieldName === 'currentPassword') {
      if (!value) err = 'Current password is required';
    }
    if (fieldName === 'newPassword') {
      if (value.length < 6 && value.length > 0) err = 'New password must be at least 6 characters';
      if (!value) err = 'New password is required';
    }
    if (fieldName === 'confirmNewPassword') {
      if (value !== currentFormData.newPassword && value.length > 0) err = 'New passwords do not match';
      if (!value) err = 'Please confirm your new password';
    }
    
    setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
  };

  const onPasswordChange = e => {
    const newData = { ...passwordData, [e.target.name]: e.target.value };
    setPasswordData(newData);
    validateField(e.target.name, e.target.value, newData);

    // Revalidate confirm password if new password changes
    if (e.target.name === 'newPassword' && newData.confirmNewPassword) {
      validateField('confirmNewPassword', newData.confirmNewPassword, newData);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    const hasErrors = Object.values(fieldErrors).some(err => err !== '');
    if (hasErrors || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fix all errors before updating' });
      return;
    }

    const res = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setFieldErrors({});
    } else {
      setPasswordMsg({ type: 'error', text: res.msg });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Change Password</h2>
          
          {passwordMsg.text && (
            <div className="alert" style={{ 
              backgroundColor: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: passwordMsg.type === 'success' ? '#34d399' : '#fca5a5'
            }}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="input-wrapper">
                <input 
                  type={showCurrent ? "text" : "password"} 
                  name="currentPassword" 
                  value={passwordData.currentPassword} 
                  onChange={onPasswordChange} 
                  required 
                  className={`form-control ${fieldErrors.currentPassword ? 'input-error' : ''}`}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.currentPassword && <small style={{color: '#ef4444', marginTop: '0.25rem', display: 'block'}}>{fieldErrors.currentPassword}</small>}
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-wrapper">
                <input 
                  type={showNew ? "text" : "password"} 
                  name="newPassword" 
                  value={passwordData.newPassword} 
                  onChange={onPasswordChange} 
                  required 
                  minLength="6"
                  className={`form-control ${fieldErrors.newPassword ? 'input-error' : ''}`}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.newPassword && <small style={{color: '#ef4444', marginTop: '0.25rem', display: 'block'}}>{fieldErrors.newPassword}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <div className="input-wrapper">
                <input 
                  type={showNew ? "text" : "password"} 
                  name="confirmNewPassword" 
                  value={passwordData.confirmNewPassword} 
                  onChange={onPasswordChange} 
                  required 
                  minLength="6"
                  className={`form-control ${fieldErrors.confirmNewPassword ? 'input-error' : ''}`}
                />
              </div>
              {fieldErrors.confirmNewPassword && <small style={{color: '#ef4444', marginTop: '0.25rem', display: 'block'}}>{fieldErrors.confirmNewPassword}</small>}
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={Object.values(fieldErrors).some(err => err !== '')}>
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
