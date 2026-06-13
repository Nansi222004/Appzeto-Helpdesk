import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/tickets';

const CreateTicket = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.title || formData.title.length < 5 || formData.title.length > 100) {
      newErrors.title = 'Title must be between 5 and 100 characters.';
    }
    if (!formData.description || formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters.';
    }
    if (!['Bug', 'Feature', 'Billing', 'Other'].includes(formData.category)) {
      newErrors.category = 'Please select a valid category.';
    }
    if (!['Low', 'Medium', 'High', 'Critical'].includes(formData.priority)) {
      newErrors.priority = 'Please select a valid priority.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field error on change
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      setServerError('');
      await axios.post(API_URL, formData);
      navigate('/tickets');
    } catch (err) {
      setServerError(err.response?.data?.msg || 'Failed to create ticket. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Create New Ticket</h1>
          <button className="btn" style={{ background: 'transparent', border: '1px solid var(--text-muted)', width: 'auto' }} onClick={() => navigate('/tickets')}>
            Cancel
          </button>
        </div>

        {serverError && <div className="alert">{serverError}</div>}

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input 
                type="text" 
                name="title" 
                className={`form-control ${errors.title ? 'input-error' : ''}`} 
                placeholder="Brief summary of the issue (5-100 characters)"
                value={formData.title}
                onChange={handleChange}
              />
              {errors.title && <div className="error-msg">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                name="category" 
                className={`form-control ${errors.category ? 'input-error' : ''}`}
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
                <option value="Billing">Billing</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <div className="error-msg">{errors.category}</div>}
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select 
                name="priority" 
                className={`form-control ${errors.priority ? 'input-error' : ''}`}
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="">Select Priority</option>
                <option value="Low">Low (72h SLA)</option>
                <option value="Medium">Medium (24h SLA)</option>
                <option value="High">High (8h SLA)</option>
                <option value="Critical">Critical (2h SLA)</option>
              </select>
              {errors.priority && <div className="error-msg">{errors.priority}</div>}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                name="description" 
                className={`form-control ${errors.description ? 'input-error' : ''}`} 
                placeholder="Detailed description (min 20 characters)"
                rows="6"
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && <div className="error-msg">{errors.description}</div>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Submitting...' : 'Create Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
