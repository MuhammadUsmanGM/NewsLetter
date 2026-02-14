import React, { useEffect, useState, useRef } from 'react';
import { useNeuralTheme } from '../context/ThemeContext';
import './LiveTicker.css';

const LiveTicker = () => {
  const { currentTheme } = useNeuralTheme();
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const tickerRef = useRef(null);
  const requestRef = useRef();
  const scrollPos = useRef(0);
  const isInteracting = useRef(false);

  const fetchTickerData = async () => {
    try {
      const response = await fetch('/api/ticker');
      const data = await response.json();
      if (data.titles) {
        setTitles(data.titles);
      }
    } catch (err) {
      console.error('Ticker fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickerData();
    const interval = setInterval(fetchTickerData, 600000);
    return () => clearInterval(interval);
  }, []);

  const animate = () => {
    if (tickerRef.current && !isInteracting.current) {
      const container = tickerRef.current;
      const content = container.firstChild;
      if (!content) return;

      const oneThirdWidth = content.scrollWidth / 3;
      
      // Increment position
      scrollPos.current += 1.0; 
      
      // Seamless loop jump: when we've scrolled through one whole set
      if (scrollPos.current >= oneThirdWidth) {
        scrollPos.current = 0;
      }
      
      container.scrollLeft = scrollPos.current;
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!loading) {
      requestRef.current = requestAnimationFrame(animate);
    }
    
    const handleResize = () => {
      if (tickerRef.current) {
        scrollPos.current = tickerRef.current.scrollLeft;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [loading]);

  const handleInteractionStart = () => {
    isInteracting.current = true;
  };

  const handleInteractionEnd = () => {
    if (tickerRef.current) {
      scrollPos.current = tickerRef.current.scrollLeft;
    }
    setTimeout(() => {
      isInteracting.current = false;
    }, 50);
  };

  if (loading) return (
    <div className="live-ticker-container" style={{ borderColor: `${currentTheme.color}22` }}>
      <div className="ticker-label" style={{ color: currentTheme.color }}>
        <span className="live-dot" style={{ background: currentTheme.color }}></span> CONNECTING...
      </div>
    </div>
  );

  const displayTitles = titles.length > 0 ? titles : ["ESTABLISHING SECURE CONNECTION...", "SYNCHRONIZING GLOBAL NEWS FEEDS...", "FETCHING REAL-TIME AI BREAKTHROUGHS...", "ESTABLISHING NEURAL LINK..."];
  const finalTitles = [...displayTitles, ...displayTitles, ...displayTitles];

  return (
    <div className="live-ticker-container" style={{ borderColor: `${currentTheme.color}22` }}>
      <div className="ticker-label" style={{ color: currentTheme.color }}>
        <span className="live-dot" style={{ background: currentTheme.color }}></span> LIVE SIGNAL FEED
      </div>
      <div 
        className="ticker-wrap" 
        ref={tickerRef}
        onMouseEnter={handleInteractionStart}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onScroll={(e) => {
          if (isInteracting.current) {
            scrollPos.current = e.target.scrollLeft;
          }
        }}
      >
        <div className="ticker-move">
          {finalTitles.map((title, index) => (
            <div key={index} className="ticker-item">
              <span className="ticker-sep" style={{ color: currentTheme.color }}>/</span> {title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;
