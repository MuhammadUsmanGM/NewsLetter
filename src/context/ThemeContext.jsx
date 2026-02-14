import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const SPECTRUM = [
  { rank: '01', title: 'Alpha Initiate', color: '#10b981', grad: '#064e3b' },     // Emerald Green
  { rank: '02', title: 'Beta Observer', color: '#14b8a6', grad: '#0d9488' },      // Sea Teal
  { rank: '03', title: 'Gamma Link', color: '#06b6d4', grad: '#0e7490' },         // Technical Cyan
  { rank: '04', title: 'Delta Signal', color: '#0ea5e9', grad: '#0369a1' },       // High-Bandwidth Sky
  { rank: '05', title: 'Epsilon Core', color: '#3b82f6', grad: '#1e40af' },       // Cobalt Blue
  { rank: '06', title: 'Zeta Vanguard', color: '#6366f1', grad: '#3730a3' },      // Indigo Shift
  { rank: '07', title: 'Theta Master', color: '#8b5cf6', grad: '#5b21b6' },      // Cyber Violet
  { rank: '08', title: 'Omega Prime', color: '#d946ef', grad: '#86198f' },       // Fuchsia Protocol
  { rank: '09', title: 'Vertex Oracle', color: '#f43f5e', grad: '#9f1239' },      // Crimson Rose
  { rank: '10', title: 'Signal Eternal', color: '#ef4444', grad: '#7f1d1d' },     // Emerald Red
];

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(SPECTRUM[0]);
  const [isPrismUnlocked, setIsPrismUnlocked] = useState(false);
  const [userJoinDate, setUserJoinDate] = useState(null);

  const calculateTheme = (joinDateStr, preferredThemeIndex = null) => {
    if (!joinDateStr) return;
    setUserJoinDate(joinDateStr);
    
    const joinDate = new Date(joinDateStr);
    const now = new Date();
    const diffDays = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    
    // Check for Prism Unlock (Week 11+)
    if (weekIndex >= 10) {
      setIsPrismUnlocked(true);
      // If user has a saved preference, use it. Otherwise, default to Red.
      if (preferredThemeIndex !== null && SPECTRUM[preferredThemeIndex]) {
        applyTheme(SPECTRUM[preferredThemeIndex]);
      } else {
        applyTheme(SPECTRUM[9]);
      }
    } else {
      setIsPrismUnlocked(false);
      applyTheme(SPECTRUM[weekIndex]);
    }
  };

  const applyTheme = (theme) => {
    setCurrentTheme(theme);
    
    // Inject into CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.color);
    root.style.setProperty('--grad-1', theme.grad);
    
    // Subtle Variations
    root.style.setProperty('--primary-dark', `${theme.color}CC`); // 80% opacity
    root.style.setProperty('--primary-light', `${theme.color}FF`);
    root.style.setProperty('--accent', theme.color);
  };

  const activatePrism = (index) => {
    if (isPrismUnlocked && SPECTRUM[index]) {
      applyTheme(SPECTRUM[index]);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      isPrismUnlocked, 
      calculateTheme, 
      activatePrism,
      SPECTRUM 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useNeuralTheme = () => useContext(ThemeContext);
