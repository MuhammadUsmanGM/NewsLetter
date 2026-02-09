
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AudioSynthesis.css';

const AudioSynthesis = ({ contentHtml }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);

  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const cleanText = (text) => {
    return text
      .replace(/Read Technical Analysis →/g, '')
      .replace(/This Week's Actionable Insight/g, 'The weekly actionable insight is:')
      .trim();
  };

  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
    };
  }, []);

  const handleToggleSpeech = () => {
    if (isSpeaking && !isPaused) {
      synth.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      return;
    }

    const textToSpeak = cleanText(stripHtml(contentHtml));
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Find a premium technical voice
    const voices = synth.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Aria')) || voices[0];
    
    if (premiumVoice) utterance.voice = premiumVoice;
    
    utterance.rate = 0.95; // Slightly slower for that "AI" feel
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(0);
    };
    
    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const handleStop = () => {
    synth.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
  };

  return (
    <div className="audio-protocol-container">
      <div className="audio-meta">
        <Radio size={14} className={isSpeaking && !isPaused ? 'pulse-icon' : ''} />
        <span className="protocol-label">NEURAL VOICE RELAY</span>
      </div>

      <div className="audio-controls">
        <button 
          onClick={handleToggleSpeech} 
          className={`audio-btn ${isSpeaking ? 'active' : ''}`}
          title={isSpeaking ? (isPaused ? 'Resume Signal' : 'Pause Signal') : 'Synthesize Signal'}
        >
          {isSpeaking && !isPaused ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {isSpeaking && (
          <button onClick={handleStop} className="audio-btn stop" title="Terminate Relay">
            <VolumeX size={18} />
          </button>
        )}

        <div className="audio-visualizer">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="vis-bar"
              animate={{
                height: isSpeaking && !isPaused ? [4, 15, 6, 20, 4] : 2
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.05,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
      
      {isSpeaking && (
        <div className="status-text fade-in">
          {isPaused ? 'Signal Interrupted' : 'Synthesizing Intelligence...'}
        </div>
      )}
    </div>
  );
};

export default AudioSynthesis;
