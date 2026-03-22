import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Send } from 'lucide-react';

const Unsubscribe = ({ email, token, setView, onUnsubscribe }) => {
  const [step, setStep] = useState('confirm'); // 'confirm', 'processing', 'success'
  const [error, setError] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const reasons = [
    { label: "Too much noise", value: "too_much_noise" },
    { label: "Irrelevant signal", value: "irrelevant_signal" },
    { label: "Moving to a different node", value: "different_node" },
    { label: "Protocol mission complete", value: "mission_complete" }
  ];

  const handleUnsubscribe = async () => {
    setStep('processing');
    setError('');

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });

      if (!response.ok) throw new Error('Unsubscribe failed');
      
      setStep('success');
      if (onUnsubscribe) onUnsubscribe();
    } catch (err) {
      setError('Protocol deactivation failed. Please try again.');
      setStep('confirm');
    }
  };

  const sendFeedback = async (reason) => {
    if (feedbackSent) return;
    try {
      await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, reasons: [reason], isFeedbackOnly: true })
      });
      setFeedbackSent(true);
    } catch (err) {
      setFeedbackSent(true); // Don't block UI on error
    }
  };

  if (step === 'success') {
    return (
      <div className="newsletter-container fade-in">
        <div className="newsletter-card" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center', minHeight: 'auto' }}>
          <div style={{ padding: '40px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '10px' }}>Node Disconnected</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '30px' }}>Your neural link has been severed. You will no longer receive transmissions.</p>
            
            {!feedbackSent ? (
              <div className="fade-in">
                <p style={{ color: '#fff', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px', opacity: 0.6 }}>// HELP_US_OPTIMIZE_THE_SIGNAL</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {reasons.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => sendFeedback(r.label)}
                      className="secondary-btn"
                      style={{ padding: '12px 16px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', borderRadius: '8px' }}
                    >
                      {r.label} <Send size={14} style={{ opacity: 0.4 }} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="fade-in" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: '#10b981', fontWeight: '800', fontSize: '0.9rem', margin: 0 }}>Intelligence Logged. Safe travels, Operative.</p>
              </div>
            )}
            
            <button 
              onClick={() => setView('home')} 
              style={{ marginTop: '30px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
            >
              Return to Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="newsletter-container fade-in">
      <div className="newsletter-card" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center', minHeight: 'auto' }}>
        <div style={{ padding: '40px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '10px' }}>Terminate Protocol?</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '10px' }}>
            You are about to disconnect from <strong>THE SIGNAL</strong>.
          </p>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '30px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
            TARGET_NODE: {email || 'SECURED_TOKEN_LINK'}
          </div>

          {error && <p style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={handleUnsubscribe} 
              className="submit-btn" 
              style={{ padding: '16px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: '700' }}
              disabled={step === 'processing'}
            >
              {step === 'processing' ? 'PROCESSING...' : 'DISCONNECT NODE'}
            </button>
            <button 
              onClick={() => setView('home')} 
              className="secondary-btn"
              style={{ padding: '16px', borderRadius: '12px' }}
              disabled={step === 'processing'}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
