
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import logo from '../assets/Favicon.png';
import './Feedback.css'; // Reuse premium styles for content
import './Welcome.css';  // Reuse loading styles

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LatestIssue = ({ issueId = null }) => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      // Simulate at least 1.5s loading time for the animation to be felt
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));
      
      let query = supabase.from('newsletter_archive').select('*');
      
      if (issueId) {
        query = query.eq('id', issueId).single();
      } else {
        query = query.order('id', { ascending: false }).limit(1);
      }
        
      const [_, result] = await Promise.all([minLoadTime, query]);

      const data = result.data;
      const error = result.error;

      if (error && !issueId) throw error; // Optional error handling for single fetch

      if (issueId) {
        setIssue(data);
      } else if (data && data.length > 0) {
        setIssue(data[0]);
      }
    } catch (err) {
      console.error('Error fetching issue:', err);
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
          <div className="welcome-text">
            THE SIGNAL
          </div>
          <div className="loading-container">
            <div className="loading-bar"></div>
          </div>
          <div className="welcome-subtitle">
            {issueId ? 'Accessing Protocol Record...' : 'Decrypting Latest Protocol'}
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="feedback-container">
        <div className="feedback-card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 className="feedback-title">Signal Not Found</h2>
          <p className="feedback-subtitle">The requested intelligence record is missing or classified.</p>
          <a href="/?view=archive" className="back-link">Return to Archive</a>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-card" style={{ maxWidth: '800px', width: '100%' }}>
        {/* Header */}
        <div className="feedback-header">
          <div className="feedback-badge">{issueId ? `Protocol Record #${issueId}` : 'Latest Protocol Release'}</div>
          <h1 className="feedback-title">THE SIGNAL.</h1>
          <p className="feedback-subtitle">{issue.week_date}</p>
        </div>

        {/* Content Body */}
        <div className="feedback-form" style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
          {/* We inject the saved HTML directly here */}
          <div 
            dangerouslySetInnerHTML={{ __html: issue.content_html }} 
            className="newsletter-content"
          />
          
          <div style={{ marginTop: '60px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
            <p style={{ marginBottom: '20px' }}>{issueId ? 'Interested in future signals?' : 'Want this delivered to your inbox?'}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto', padding: '12px 30px' }}>
                Subscribe to Protocol
              </a>
              <a href="/?view=archive" className="back-link" style={{ marginTop: 0 }}>
                Protocol Archive
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestIssue;
