import React, { useEffect, useState, useRef } from 'react';
import './LiveTicker.css';

const LiveTicker = () => {
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

      // Handle cases where the browser prevents scrolling (edge of the container)
      // If we couldn't scroll to where we wanted, it might be because the viewport is too wide
      // or content too short. We don't need to do anything special here as the loop handles it.
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
      // Synchronize internal state with user's manual scroll position
      scrollPos.current = tickerRef.current.scrollLeft;
    }
    // Small delay before resuming to prevent instant snap-back
    setTimeout(() => {
      isInteracting.current = false;
    }, 50);
  };

  if (loading) return (
    <div className="live-ticker-container">
      <div className="ticker-label">
        <span className="live-dot"></span> CONNECTING...
      </div>
    </div>
  );

  const displayTitles = titles.length > 0 ? titles : ["ESTABLISHING SECURE CONNECTION...", "SYNCHRONIZING GLOBAL NEWS FEEDS...", "FETCHING REAL-TIME AI BREAKTHROUGHS...", "ESTABLISHING NEURAL LINK..."];
  // Triple the titles to guarantee we can always scroll far enough to jump seamlessly
  const finalTitles = [...displayTitles, ...displayTitles, ...displayTitles];

  return (
    <div className="live-ticker-container">
      <div className="ticker-label">
        <span className="live-dot"></span> LIVE SIGNAL FEED
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
          // If we're not interacting, this scroll event was likely caused by our JS
          // If we ARE interacting, we need to keep our scrollPos in sync
          if (isInteracting.current) {
            scrollPos.current = e.target.scrollLeft;
          }
        }}
      >
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

