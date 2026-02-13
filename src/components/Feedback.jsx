import { useState, useEffect } from 'react';
import './Feedback.css';

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Populate form from URL params if available
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    const emailParam = params.get('email');
    
    if (nameParam || emailParam) {
      setFormData(prev => ({
        ...prev,
        name: nameParam || '',
        email: emailParam || ''
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.message.trim()) {
      setError('Please enter your feedback.');
      return;
    }



    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send feedback');
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Feedback error:', err);
      setError('Failed to transmit signal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="feedback-container">
        <div className="feedback-card">
          <div className="success-view">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="feedback-title">Transmission Received</h2>
            <p className="feedback-subtitle" style={{ color: '#94a3b8', marginTop: '16px' }}>
              Your intelligence has been successfully logged. We appreciate your contribution to the protocol.
            </p>
            <a href="/" className="back-link">Return to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-card">
        <div className="feedback-header">
          <div className="feedback-badge">Internal Comms</div>
          <h1 className="feedback-title">Feedback Channel</h1>
          <p className="feedback-subtitle">Help us optimize the intelligence protocol.</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: '#ef4444', 
              padding: '12px', 
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name" className="form-label">Codename / Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="Commander"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Contact Frequency (Email)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="commander@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message" className="form-label">Signal Content</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Report bugs, suggest features, or request specific intelligence topics..."
              required
            />
          </div>



          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Transmitting...
              </>
            ) : (
              'Transmit Signal'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
