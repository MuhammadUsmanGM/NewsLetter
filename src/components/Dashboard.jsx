import React, { useState, useEffect } from 'react';
import '../App.css'; // Reusing global styles for consistency

const Dashboard = () => {
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate time until next 9 AM
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date();
      
      // Set to 9 AM today
      tomorrow.setHours(9, 0, 0, 0);
      
      // If it's already past 9 AM, set to 9 AM tomorrow
      if (now > tomorrow) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="newsletter-container">
      <div className="newsletter-card" style={{ flexDirection: 'column', alignItems: 'center', padding: '4rem', textAlign: 'center', minHeight: 'auto' }}>
        
        <div className="success-icon-container" style={{ marginBottom: '2rem' }}>
          <div className="success-circle"></div>
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem', 
          background: 'linear-gradient(to right, #fff, var(--primary-light))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          fontWeight: '800'
        }}>
          Founding Member Dashboard
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6', marginBottom: '3rem' }}>
          Welcome back to the inner circle. You are confirmed for the next briefing.
        </p>

        <div style={{ 
          background: 'rgba(15, 23, 42, 0.6)', 
          padding: '2rem', 
          borderRadius: '1.5rem', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: '500px',
          marginBottom: '3rem'
        }}>
          <p style={{ color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
            Next AI Briefing Drops In
          </p>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {timeLeft}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Targeting 9:00 AM your local time
          </p>
        </div>

        <div className="social-links-container" style={{ justifyContent: 'center', margin: 0, padding: 0, border: 'none' }}>
            <div className="social-link">
            <a href="https://github.com/MuhammadUsmanGM" target="_blank" rel="noopener noreferrer">
                <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                </svg>
                GitHub
            </a>
            </div>
            <div className="social-link">
            <a href="https://www.linkedin.com/in/muhammad-usman-ai-dev" target="_blank" rel="noopener noreferrer">
                <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
                </svg>
                LinkedIn
            </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
