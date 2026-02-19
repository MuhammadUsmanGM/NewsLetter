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
  Award,
  Download
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import logo from '../assets/Favicon.png';
import { useNeuralTheme } from '../context/ThemeContext';
import './Dashboard.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Dashboard = ({ name, email, setView }) => {
  const { currentTheme, isPrismUnlocked, calculateTheme, activatePrism, SPECTRUM } = useNeuralTheme();
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '03' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [daysCounter, setDaysCounter] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    fetchSubscriberData();
    
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
  }, [email]);

  const fetchSubscriberData = async () => {
    if (!email) return;
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('created_at, preferred_theme_index')
        .eq('email', email)
        .single();
        
      if (data) {
        const joinDate = new Date(data.created_at);
        const now = new Date();
        const diffDays = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
        setDaysCounter(diffDays);
        calculateTheme(data.created_at, data.preferred_theme_index);
      }
    } catch (err) {
      console.error('Error fetching tier data:', err);
    }
  };

  const savePrismTheme = async (index) => {
    activatePrism(index);
    if (!email) return;
    try {
      await supabase
        .from('newsletter_subscribers')
        .update({ preferred_theme_index: index })
        .eq('email', email);
    } catch (err) {
      console.error('Error saving Prism theme:', err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <div className="dashboard-wrapper">
      <motion.div 
        className="dashboard-container"
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
      >
        <div className="dashboard-main-content">
          <motion.div className="dashboard-header-card" variants={itemVariants}>
            <div className="brand-badge" style={{ borderColor: currentTheme.color }}>
              <img src={logo} alt="Signal Logo" />
            </div>
            <div className="greeting-wrap">
              <h1 className="hero-title">
                THE SIGNAL <span className="text-gradient" style={{ backgroundImage: `linear-gradient(135deg, ${currentTheme.color} 0%, #fff 100%)` }}>3-3-2-2-1</span>
              </h1>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', margin: '1rem 0' }}>
                Welcome Back, {name || 'Commander'}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                Your neural link is stable. Next 3-3-2-2-1 intelligence protocol is being synthesized.
              </p>
              
              <div className="tier-badge" style={{ background: `${currentTheme.color}22`, color: currentTheme.color, border: `1px solid ${currentTheme.color}44`, display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>
                <Award size={14} />
                {currentTheme.title}
              </div>
            </div>
          </motion.div>

          {/* Access Latest Briefing */}
          <motion.div className="glass-card" variants={itemVariants} style={{ marginBottom: '24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${currentTheme.color}33` }}>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '4px' }}>Latest Signal Archive</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Access this week's 3-3-2-2-1 intelligence briefing immediately.</p>
            </div>
            <button 
              onClick={() => setView('latest')} 
              className="sync-btn" 
              style={{ width: 'auto', background: `${currentTheme.color}11`, color: currentTheme.color, border: `1px solid ${currentTheme.color}33`, cursor: 'pointer', padding: '10px 20px', borderRadius: '10px' }}
            >
              <Zap size={16} style={{ marginRight: '8px' }} />
              Read Protocol
            </button>
          </motion.div>

          {/* Optimized 3-2-2-1 Countdown */}
          <motion.div className="glass-card countdown-section" variants={itemVariants}>
            <div className="countdown-title">Next 3-3-2-2-1 Intelligence Release</div>
            <div className="timer-grid">
              <div className="timer-box">
                <span className="timer-num" style={{ color: currentTheme.color }}>{timeLeft.d}</span>
                <span className="timer-label">DAYS</span>
              </div>
              <span className="timer-sep">:</span>
              <div className="timer-box">
                <span className="timer-num" style={{ color: currentTheme.color }}>{timeLeft.h}</span>
                <span className="timer-label">HOURS</span>
              </div>
              <span className="timer-sep">:</span>
              <div className="timer-box">
                <span className="timer-num" style={{ color: currentTheme.color }}>{timeLeft.m}</span>
                <span className="timer-label">MIN</span>
              </div>
              <span className="timer-sep">:</span>
              <div className="timer-box">
                <span className="timer-num" style={{ color: currentTheme.color }}>{timeLeft.s}</span>
                <span className="timer-label">SEC</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', opacity: 0.6, marginTop: '1.5rem' }}>
              Targeting Monday 09:00:00 (Local Frequency)
            </p>
          </motion.div>

          {isPrismUnlocked && (
            <motion.div 
              className="glass-card" 
              style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center', border: `1px solid ${currentTheme.color}33` }} 
              variants={itemVariants}
            >
              <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.2rem' }}>Prism Protocol Unlocked</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Master of the Spectrum detected. Choose your active neural theme.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {SPECTRUM.map((t, idx) => (
                  <button
                    key={t.rank}
                    onClick={() => savePrismTheme(idx)}
                    style={{
                      width: '35px',
                      height: '35px',
                      borderRadius: '50%',
                      background: t.color,
                      border: currentTheme.rank === t.rank ? '3px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      boxShadow: currentTheme.rank === t.rank ? `0 0 15px ${t.color}` : 'none'
                    }}
                    title={t.title}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="dashboard-sidebar">
          <motion.div className="glass-card identifier-card" variants={itemVariants}>
            <div className="avatar-shield">
              <div className="avatar-inner" style={{ background: `${currentTheme.color}11`, color: currentTheme.color }}>
                <Cpu size={40} />
              </div>
            </div>
            <div className="id-name">{name || 'Researcher 2026'}</div>
            <div className="id-status" style={{ color: currentTheme.color, background: `${currentTheme.color}11` }}>AUTHENTICATED</div>
            
            <div className="id-meta">
              <div className="meta-row">
                <span className="meta-lbl">ID Protocol</span>
                <span className="meta-val">{currentTheme.title}</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Protocol Age</span>
                <span className="meta-val">{daysCounter} Days</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Neural Sync</span>
                <span className="meta-val" style={{ color: currentTheme.color }}>100%</span>
              </div>
            </div>

            <div className="social-sync">
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Synchronize External Nodes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="https://github.com/MuhammadUsmanGM" target="_blank" rel="noopener noreferrer" className="sync-btn" style={{ borderColor: `${currentTheme.color}22` }}>
                  <Github size={18} /> GitHub Access
                </a>
                <a href="https://www.linkedin.com/in/muhammad-usman-ai-dev" target="_blank" rel="noopener noreferrer" className="sync-btn" style={{ borderColor: `${currentTheme.color}22` }}>
                  <Linkedin size={18} /> LinkedIn Terminal
                </a>
                <button onClick={() => setView('install')} className="sync-btn" style={{ background: `${currentTheme.color}11`, borderColor: `${currentTheme.color}33`, color: currentTheme.color, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <Download size={18} /> Mobile Protocol
                </button>
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
