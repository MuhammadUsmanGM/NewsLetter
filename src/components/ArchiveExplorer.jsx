
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import logo from '../assets/Favicon.png';
import './Feedback.css';
import './Welcome.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ArchiveExplorer = ({ setView }) => {
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
        .select('id, week_date, created_at')
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
    <div className="feedback-container">
      <div className="feedback-card" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="feedback-header">
          <div className="feedback-badge">Intelligence Archive</div>
          <h1 className="feedback-title">PROTOCOL VAULT.</h1>
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
                    // Update URL without reload for potential bookmarking
                    window.history.pushState({}, '', `/?view=issue&id=${item.id}`);
                    setView('issue');
                  }}
                  style={{ 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#10b981',
                      fontWeight: '800'
                    }}>
                      #{item.id}
                    </div>
                    <div>
                      <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem' }}>{item.week_date}</h3>
                      <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Signal archived on {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ color: '#10b981', fontWeight: '700', fontSize: '0.9rem' }}>
                    Access Deep-Dive →
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <button onClick={() => setView('home')} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Return to Base</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveExplorer;
