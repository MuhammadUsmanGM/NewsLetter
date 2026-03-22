import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, ShieldAlert, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import logo from '../assets/Favicon.png';
import './Feedback.css';
import './Welcome.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ArchiveExplorer = ({ setView, setSelectedIssueId }) => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));
      const fetchPromise = supabase
        .from('newsletter_archive')
        .select('id, week_date, created_at, is_pro')
        .order('id', { ascending: false });

      const [_, { data, error }] = await Promise.all([minLoadTime, fetchPromise]);

      if (error) throw error;
      setArchives(data || []);
    } catch (err) {
      console.error('Error fetching archives:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-logo-container">
            <img src={logo} alt="Company Logo" className="welcome-logo" />
          </div>
          <div className="welcome-text">THE SIGNAL</div>
          <div className="loading-container">
            <div className="loading-bar"></div>
          </div>
          <div className="welcome-subtitle">Scanning Intelligence Vault...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container fade-in">
      <div className="feedback-card" style={{ maxWidth: '900px', width: '100%', borderTop: '4px solid #10b981' }}>
        <div className="feedback-header">
          <div className="feedback-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Intelligence Archive</div>
          <h1 className="feedback-title" style={{ letterSpacing: '-2px' }}>DATA_VAULT_v3.0.</h1>
          <p className="feedback-subtitle">Access all historical signals extracted by the neural network.</p>
        </div>

        <div className="feedback-form">
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr' }}>
            {archives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: '#94a3b8' }}>Archive is currently empty. Initializing first signal capture sequence.</p>
              </div>
            ) : (
              archives.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    if (item.is_pro) {
                        setView('omegawall');
                        return;
                    }
                    window.history.pushState({}, '', `/?view=issue&id=${item.id}`);
                    if (setSelectedIssueId) setSelectedIssueId(item.id);
                    setView('issue');
                  }}
                  style={{ 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px',
                    background: item.is_pro ? 'rgba(239, 68, 68, 0.02)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${item.is_pro ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = item.is_pro ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)';
                    e.currentTarget.style.borderColor = item.is_pro ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = item.is_pro ? 'rgba(239, 68, 68, 0.02)' : 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = item.is_pro ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      background: item.is_pro ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                      borderRadius: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: item.is_pro ? '#ef4444' : '#10b981',
                      border: `1px solid ${item.is_pro ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                      fontWeight: '800'
                    }}>
                      {item.is_pro ? <Lock size={20} /> : `#${item.id}`}
                    </div>
                    <div>
                      {item.is_pro && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '2px' }}>RESTRICTED</div>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>OMEGA_CLEARANCE_REQUIRED</span>
                        </div>
                      )}
                      <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{item.week_date}</h3>
                      <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Decrypted on: {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ color: item.is_pro ? '#ef4444' : '#10b981', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.is_pro ? 'Upgrade Access' : 'Access Deep-Dive'} <ArrowRight size={16} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <button onClick={() => setView('home')} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '0.9rem', textDecoration: 'underline' }}>Return to Home Protocol</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveExplorer;
