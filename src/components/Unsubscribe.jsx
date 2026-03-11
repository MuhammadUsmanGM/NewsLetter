import React, { useState } from 'react';

const Unsubscribe = ({ email, setView, onUnsubscribe }) => {
  const [reasons, setReasons] = useState({
    tooMany: false,
    notRelevant: false,
    noLongerWant: false,
    other: false,
  });
  const [otherReasonText, setOtherReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setReasons((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Prepare reasons data
    const selectedReasons = [];
    if (reasons.tooMany) selectedReasons.push('Too many emails');
    if (reasons.notRelevant) selectedReasons.push('Not relevant to me anymore');
    if (reasons.noLongerWant) selectedReasons.push('I no longer want to receive these emails');
    if (reasons.other && otherReasonText.trim()) {
      selectedReasons.push(`Other: ${otherReasonText}`);
    } else if (reasons.other) {
      selectedReasons.push('Other: No specifics provided');
    }

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          reasons: selectedReasons
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to unsubscribe');
      }

      // Automatically assume the parent will handle the success state, e.g. updating the URL and showing success
      onUnsubscribe();
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError('Failed to process unsubscribe request. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="newsletter-container fade-in">
      <div className="newsletter-card fade-in" style={{ maxWidth: '600px', margin: '0 auto', display: 'block', minHeight: 'auto' }}>
        <div style={{ padding: '40px', textAlign: 'left' }}>
          <div style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '30px' }}>
            <h2 style={{ color: '#ef4444', fontSize: '1.8rem', marginBottom: '10px' }}>Unsubscribe Confirmation</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
              We're sorry to see you go. To complete the process, please tell us why you are leaving the intelligence protocol.
            </p>
          </div>
          
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '15px 20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Target Email</span>
            <strong style={{ color: '#fff', fontSize: '1.2rem', wordBreak: 'break-all' }}>{email}</strong>
          </div>

          <form onSubmit={handleSubmit}>
            <p style={{ color: '#f1f5f9', fontWeight: 'bold', marginBottom: '15px' }}>Why do you want to unsubscribe?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input 
                  type="checkbox" 
                  name="tooMany" 
                  checked={reasons.tooMany} 
                  onChange={handleCheckboxChange}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                Emails are too frequent
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input 
                  type="checkbox" 
                  name="notRelevant" 
                  checked={reasons.notRelevant} 
                  onChange={handleCheckboxChange}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                Content is not relevant to me anymore
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input 
                  type="checkbox" 
                  name="noLongerWant" 
                  checked={reasons.noLongerWant} 
                  onChange={handleCheckboxChange}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                I no longer want to receive these emails
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input 
                  type="checkbox" 
                  name="other" 
                  checked={reasons.other} 
                  onChange={handleCheckboxChange}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                Other
              </label>
              
              {reasons.other && (
                <div style={{ marginLeft: '28px', marginTop: '5px' }}>
                  <input
                    type="text"
                    value={otherReasonText}
                    onChange={(e) => setOtherReasonText(e.target.value)}
                    placeholder="Please specify..."
                    className="stunning-input"
                    style={{ padding: '10px 15px', fontSize: '0.95rem' }}
                  />
                </div>
              )}
            </div>

            {error && <div className="api-error-message fade-in" style={{ marginBottom: '20px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                type="button" 
                onClick={() => setView('home')} 
                className="secondary-btn"
                style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
                disabled={isSubmitting}
              >
                Go Back
              </button>
              <button 
                type="submit" 
                className="submit-btn" 
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Unsubscribe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
