import { useState, useEffect } from 'react';
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
        <div className="welcome-text">
          Welcome to AI Newsletter
        </div>
        <div className="loading-dots">
          <span className="dot glowing"></span>
          <span className="dot glowing"></span>
          <span className="dot glowing"></span>
        </div>
      </div>
    </div>
  );
};

export default Welcome;