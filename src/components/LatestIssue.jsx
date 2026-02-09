import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import logo from '../assets/Favicon.png';
import './Feedback.css'; // Reuse premium styles for content
import './Welcome.css';  // Reuse loading styles
import PromptPlayground from './PromptPlayground';
import { AnimatePresence } from 'framer-motion';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LatestIssue = ({ issueId = null }) => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayground, setShowPlayground] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  useEffect(() => {
    // Detect prompt in content and extract it for the playground
    if (issue && issue.content_html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(issue.content_html, 'text/html');
      
      // Look for the specific pattern we defined in newsletter.mjs
      const insightHeader = Array.from(doc.querySelectorAll('h3')).find(h => 
        h.textContent.includes("This Week's Actionable Insight")
      );

      if (insightHeader && insightHeader.parentElement) {
        const promptText = insightHeader.parentElement.querySelector('p')?.textContent;
        if (promptText) {
          setCurrentPrompt(promptText);
        }
      }
    }
  }, [issue]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
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

      if (error && !issueId) throw error;

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

  const openPlayground = () => {
    setShowPlayground(true);
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

          {/* Actionable Prompt Playground Access */}
          {currentPrompt && (
            <div style={{ 
              marginTop: '40px',
              marginBottom: '30px', 
              padding: '20px', 
              background: 'rgba(16, 185, 129, 0.08)', 
              border: '1px solid rgba(16, 185, 129, 0.2)', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
            }}>
              <div>
                <div style={{ color: '#10b981', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Interactive Insight Pipeline
                </div>
                <div style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: '600' }}>
                  Execute this week's neural protocol in the side-sandbox.
                </div>
              </div>
              <button 
                onClick={openPlayground}
                className="submit-btn" 
                style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}
              >
                Open Terminal
              </button>
            </div>
          )}
          
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

      <AnimatePresence>
        {showPlayground && (
          <PromptPlayground 
            initialPrompt={currentPrompt} 
            onClose={() => setShowPlayground(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LatestIssue;
