
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './Feedback.css'; // Reuse premium styles

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LatestIssue = () => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestIssue();
  }, []);

  const fetchLatestIssue = async () => {
    try {
      // Fetch the most recent entry from the archive
      const { data, error } = await supabase
        .from('newsletter_archive')
        .select('*')
        .order('id', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setIssue(data[0]);
      }
    } catch (err) {
      console.error('Error fetching latest issue:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="feedback-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="feedback-container">
        <div className="feedback-card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 className="feedback-title">No Intelligence Yet</h2>
          <p className="feedback-subtitle">The protocol hasn't archived its first signal yet. Check back Monday.</p>
          <a href="/" className="back-link">Return to Base</a>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-card" style={{ maxWidth: '800px', width: '100%' }}>
        {/* Header */}
        <div className="feedback-header">
          <div className="feedback-badge">Latest Protocol Release</div>
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
            <p style={{ marginBottom: '20px' }}>Want this delivered to your inbox?</p>
            <a href="/" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto', padding: '12px 30px' }}>
              Subscribe to Protocol
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestIssue;
