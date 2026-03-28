import React, { useEffect, useState } from 'react';
import logo from '../assets/Favicon.webp';

export default function VerificationStatus({ setView, setUserName, setFormData }) {
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'failed'
  const [errorMsg, setErrorMsg] = useState('');
  const [isReauth, setIsReauth] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifiedStatus = params.get('verified');
    const verifyError = params.get('error');
    const nameParam = params.get('name');
    const emailParam = params.get('email');
    const reauthParam = params.get('reauth');

    if (nameParam) setUserName(nameParam);
    if (emailParam) {
      setEmail(emailParam);
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
    
    setIsReauth(reauthParam === 'true');

    if (verifiedStatus === 'true') {
      setStatus('success');
    } else if (verifiedStatus === 'failed') {
      setStatus('failed');
      const msg = verifyError === 'invalid_token' 
        ? 'Verification token expired or invalid. Please request a new link.'
        : 'Protocol activation failed. Please contact the operator.';
      setErrorMsg(msg);
    } else {
      // shouldn't happen if routed correctly
      setStatus('failed');
      setErrorMsg('Invalid verification request.');
    }
    
    // Clean up URL so it doesn't persist on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [setUserName, setFormData]);

  const handleDashboard = () => {
    setView('dashboard');
  };

  const handleResend = () => {
    // Just take them back to home so they can enter their details again
    // which effectively resends the link since it triggers the subscribe flow again.
    setView('home');
  };

  return (
    <div className="newsletter-container">
      <div className="newsletter-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div className="brand-logo-container" style={{ margin: '0 auto 2rem' }}>
          <img src={logo} alt="AI Logo" className="brand-logo" />
        </div>
        
        {status === 'loading' && (
          <div className="success-state fade-in">
             <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
             <p style={{ marginTop: '1rem' }}>Verifying credentials...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success-state fade-in">
            <div className="success-icon-container" style={{ margin: '0 auto 1.5rem' }}>
              <div className="success-circle"></div>
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <div className="success-content">
              <div className="success-badge" style={{ margin: '0 auto 1rem', width: 'fit-content' }}>Neural Link Activated</div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Verification Successful</h2>
              <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
                {isReauth 
                  ? 'Your signal is already active.' 
                  : 'Welcome to the inner circle. A welcome email has just been sent to your inbox.'}
              </p>
              
              <button 
                onClick={handleDashboard}
                className="submit-btn"
                style={{ width: 'auto', padding: '12px 30px', margin: '0 auto' }}
              >
                Enter Dashboard
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="success-state fade-in">
            <div className="success-icon-container" style={{ margin: '0 auto 1.5rem' }}>
              <div className="success-circle" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}></div>
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" style={{ stroke: '#ef4444', opacity: 0.5 }}/>
                <path className="checkmark-check" fill="none" d="M16 16L36 36M36 16L16 36" style={{ stroke: '#ef4444', strokeWidth: 3 }}/>
              </svg>
            </div>
            <div className="success-content">
              <div className="success-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', margin: '0 auto 1rem', width: 'fit-content' }}>Verification Failed</div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Connection Failed</h2>
              <p style={{ marginBottom: '2rem', opacity: 0.8 }}>{errorMsg}</p>
              
              <button 
                onClick={handleResend}
                className="submit-btn"
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--primary)', 
                  color: '#fff',
                  width: 'auto', 
                  padding: '12px 30px', 
                  margin: '0 auto',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Resend Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
