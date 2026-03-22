import React from 'react';
import { Lock, Zap, ShieldCheck, ArrowRight, CreditCard, ExternalLink } from 'lucide-react';

const OmegaWall = ({ setView }) => {
  // Stripe/Payment Link
  const STRIPE_LINK = "https://buy.stripe.com/example"; // Replace with real link

  return (
    <div className="feedback-container fade-in">
      <div className="feedback-card" style={{ maxWidth: '600px', margin: '60px auto', position: 'relative', overflow: 'hidden' }}>
        
        {/* Background "Omega" Ambient Glow */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '50%', filter: 'blur(80px)', z_index: 0 }}></div>

        <div style={{ padding: '60px 40px', position: 'relative', z_index: 1 }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <Lock size={32} />
          </div>

          <p className="mono" style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '15px' }}>
            // ACCESS_RESTRICTED :: CLEARANCE_LOW
          </p>
          
          <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800', marginBottom: '20px', letterSpacing: '-1.5px' }}>Omega Prime Required.</h1>
          
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '40px', lineHeight: '1.6' }}>
            This signal contains **high-fidelity intelligence** and deep-dive technical research reserved for our elite operatives. Your current clearance is restricted to standard transmissions.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '25px', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
            <p className="mono" style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '15px' }}>OMEGA_PRIME_ASSETS:</p>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f1f5f9', fontSize: '0.95rem' }}>
                <ShieldCheck size={18} color="#ef4444" /> Full access to all archived Deep-Dives
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f1f5f9', fontSize: '0.95rem' }}>
                <Zap size={18} color="#ef4444" /> Private AI Signal drops (Beta Tools)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f1f5f9', fontSize: '0.95rem' }}>
                <ExternalLink size={18} color="#ef4444" /> Direct node access to the elite community
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <a 
              href={STRIPE_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="submit-btn" 
              style={{ 
                padding: '18px', 
                borderRadius: '12px', 
                background: '#ef4444', 
                border: 'none', 
                color: '#fff', 
                fontSize: '1.1rem', 
                fontWeight: '800', 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px' 
              }}
            >
              Upgrade to Omega Prime <CreditCard size={20} />
            </a>
            
            <button 
              onClick={() => setView('archive')} 
              className="secondary-btn"
              style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8' }}
            >
              Return to Public Vault
            </button>
          </div>

          <p style={{ marginTop: '30px', fontSize: '0.8rem', color: '#475569' }}>
            Powered by **Stripe Secure Intelligence Protocol**. Your contribution optimizes the neural network.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OmegaWall;
