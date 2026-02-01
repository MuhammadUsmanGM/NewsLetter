import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Cpu, 
  Globe, 
  Lock, 
  Zap, 
  Github, 
  Linkedin, 
  ExternalLink,
  Activity,
  Award
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ name }) => {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '03' });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const calculateTimeLeft = () => {
      const now = new Date();
      let target = new Date();
      const currentDay = now.getDay();
      let daysUntilMonday = (1 - currentDay + 7) % 7;
      
      if (daysUntilMonday === 0 && (now.getHours() >= 9)) {
        daysUntilMonday = 7;
      }
      
      target.setDate(now.getDate() + daysUntilMonday);
      target.setHours(9, 0, 0, 0);
      
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft({
        d: d.toString().padStart(2, '0'),
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0')
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="dashboard-wrapper">
      <motion.div 
        className="dashboard-container"
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {/* Main Intelligence Column */}
        <div className="main-column">
          
          {/* Hero Command Header */}
          <motion.div className="glass-card hero-card" variants={itemVariants}>
            <div className="member-badge">
              <Shield size={14} /> Founding Member Active
            </div>
            <div className="greeting-wrap">
              <h1 className="hero-title">
                THE SIGNAL <span className="text-gradient">3-2-1</span>
              </h1>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', margin: '1rem 0' }}>
                Welcome Back, {name || 'Commander'}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                Your neural link is stable. Next 3-2-1 intelligence protocol is being synthesized.
              </p>
            </div>
          </motion.div>

          {/* Optimized 3-2-1 Countdown */}
          <motion.div className="glass-card countdown-section" variants={itemVariants}>
            <div className="countdown-title">Next 3-2-1 Intelligence Release</div>
            <div className="timer-grid">
              <div className="timer-box">
                <span className="timer-num">{timeLeft.d}</span>
                <span className="timer-label">DAYS</span>
              </div>
              <span className="timer-sep">:</span>
              <div className="timer-box">
                <span className="timer-num">{timeLeft.h}</span>
                <span className="timer-label">HOURS</span>
              </div>
              <span className="timer-sep">:</span>
              <div className="timer-box">
                <span className="timer-num">{timeLeft.m}</span>
                <span className="timer-label">MINUTES</span>
              </div>
              <span className="timer-sep">:</span>
              <div className="timer-box">
                <span className="timer-num">{timeLeft.s}</span>
                <span className="timer-label">SECONDS</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', opacity: 0.6 }}>
              Targeting Monday 09:00:00 (Local Frequency)
            </p>
          </motion.div>

          {/* Operational Stats */}
          <div className="stats-grid">
            <motion.div className="stat-item" variants={itemVariants}>
              <div className="stat-label">Intelligence Tier</div>
              <div className="stat-value" style={{ color: '#10b981' }}>Alpha-1</div>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <div className="stat-label">Network Status</div>
              <div className="stat-value">
                <span className="live-pulse"></span> Encrypted
              </div>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <div className="stat-label">Briefings Accessed</div>
              <div className="stat-value">Priority</div>
            </motion.div>
          </div>
        </div>

        {/* Tactical Info Column */}
        <div className="info-column">
          <motion.div className="glass-card id-card" variants={itemVariants}>
            <div className="avatar-shield">
              <div className="avatar-inner">
                <Cpu size={40} />
              </div>
            </div>
            <div className="id-name">{name || 'Researcher 2026'}</div>
            <div className="id-status">AUTHENTICATED</div>
            
            <div className="id-meta">
              <div className="meta-row">
                <span className="meta-lbl">ID Protocol</span>
                <span className="meta-val">AIW-8821</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Join Order</span>
                <span className="meta-val">Early Adopter</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Neural Sync</span>
                <span className="meta-val">100%</span>
              </div>
            </div>

            <div className="social-sync">
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Synchronize External Nodes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="https://github.com/MuhammadUsmanGM" target="_blank" rel="noopener noreferrer" className="sync-btn">
                  <Github size={18} /> GitHub Access
                </a>
                <a href="https://www.linkedin.com/in/muhammad-usman-ai-dev" target="_blank" rel="noopener noreferrer" className="sync-btn">
                  <Linkedin size={18} /> LinkedIn Terminal
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="glass-card" 
            style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center' }} 
            variants={itemVariants}
          >
            <Award size={24} style={{ color: '#fbbf24', marginBottom: '0.5rem' }} />
            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>Active Founder Status</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Priority support and early access to all beta modules is enabled.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
