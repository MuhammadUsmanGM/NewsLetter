
import React, { useEffect, useState } from 'react';
import './LiveTicker.css';

const LiveTicker = () => {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickerData = async () => {
    try {
      const response = await fetch('/api/ticker');
      const data = await response.json();
      if (data.titles) {
        // Double the titles to ensure seamless looping
        setTitles([...data.titles, ...data.titles]);
      }
    } catch (err) {
      console.error('Ticker fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickerData();
    const interval = setInterval(fetchTickerData, 600000); // Update every 10 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="live-ticker-container">
      <div className="ticker-label">
        <span className="live-dot"></span> CONNECTING...
      </div>
    </div>
  );

  const displayTitles = titles.length > 0 ? titles : ["ESTABLISHING SECURE CONNECTION...", "SYNCHRONIZING GLOBAL NEWS FEEDS...", "FETCHING REAL-TIME AI BREAKTHROUGHS...", "ESTABLISHING NEURAL LINK..."];
  const finalTitles = [...displayTitles, ...displayTitles]; // Seamless loop

  return (
    <div className="live-ticker-container">
      <div className="ticker-label">
        <span className="live-dot"></span> LIVE SIGNAL FEED
      </div>
      <div className="ticker-wrap">
        <div className="ticker-move">
          {finalTitles.map((title, index) => (
            <div key={index} className="ticker-item">
              <span className="ticker-sep">/</span> {title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;
