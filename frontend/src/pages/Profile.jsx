import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Camera, Trash2 } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [removePic, setRemovePic] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
      if (user.profilePic && !removePic) {
        setImagePreview(`http://localhost:5000${user.profilePic}`);
      }
    }
  }, [user, removePic]);

  const validateField = (fieldName, value) => {
    let err = '';
    if (fieldName === 'name') {
      if (value.trim().length < 2 && value.length > 0) err = 'Name must be at least 2 characters';
      if (!value) err = 'Name is required';
    }
    
    setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
  };

  const onChange = e => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    validateField(e.target.name, e.target.value);
  };

  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemovePic(false); // Cancel remove if a new image is selected
    }
  };

  const handleRemovePic = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemovePic(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    
    if (fieldErrors.name || !profileData.name) {
      setProfileMsg({ type: 'error', text: 'Please fix the errors before updating' });
      return;
    }

    const formData = new FormData();
    formData.append('name', profileData.name);
    formData.append('email', profileData.email);
    
    if (removePic) {
      formData.append('removeProfilePic', 'true');
    } else if (imageFile) {
      formData.append('profilePic', imageFile);
    }

    const res = await updateProfile(formData);
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setRemovePic(false);
    } else {
      setProfileMsg({ type: 'error', text: res.msg });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
        
        {/* Profile Image Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', 
              border: '3px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontSize: '3rem', fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()}
              title="Upload Photo"
              style={{ 
                position: 'absolute', bottom: '0', right: '10px', 
                backgroundColor: 'var(--primary)', color: 'white', 
                border: 'none', borderRadius: '50%', width: '36px', height: '36px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onImageChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
          </div>

          {(imagePreview || user?.profilePic) && !removePic && (
            <button 
              type="button"
              onClick={handleRemovePic}
              style={{ 
                background: 'none', border: 'none', color: '#ef4444', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.875rem', marginTop: '0.5rem', transition: 'color 0.2s'
              }}
            >
              <Trash2 size={14} /> Remove Photo
            </button>
          )}

          <h2 style={{ margin: '1rem 0 0 0', fontSize: '2rem' }}>My Profile</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage your personal information</p>
        </div>

        {profileMsg.text && (
          <div className="alert" style={{ 
            backgroundColor: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: profileMsg.type === 'success' ? '#34d399' : '#fca5a5'
          }}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={profileData.email} 
              onChange={onChange} 
              disabled
              className="form-control"
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
              title="Email address cannot be changed here"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={profileData.name} 
              onChange={onChange} 
              required
              className={`form-control ${fieldErrors.name ? 'input-error' : ''}`}
            />
            {fieldErrors.name && <small style={{color: '#ef4444', marginTop: '0.25rem', display: 'block'}}>{fieldErrors.name}</small>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }} disabled={!!fieldErrors.name}>
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
