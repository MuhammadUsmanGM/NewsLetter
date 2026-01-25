import { useState, useEffect } from 'react';
import logo from '../assets/Favicon.png';
import './Welcome.css';

const Welcome = ({ onWelcomeComplete }) => {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Automatically proceed after 4 seconds to show the newsletter form
    const timer = setTimeout(() => {
      setShowWelcome(false);
      onWelcomeComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onWelcomeComplete]);

  if (!showWelcome) {
    return null; // Don't render anything after the welcome completes
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo-container">
          <img src={logo} alt="Company Logo" className="welcome-logo" />
        </div>
        <div className="welcome-text">
          AI NEWSLETTER
        </div>
        <div className="loading-container">
          <div className="loading-bar"></div>
        </div>
        <div className="welcome-subtitle">
          Initializing experience
        </div>
      </div>
    </div>
  );
};

export default Welcome;