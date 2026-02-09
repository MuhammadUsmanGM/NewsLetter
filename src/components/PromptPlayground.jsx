
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, X, Cpu, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './PromptPlayground.css';

const PromptPlayground = ({ initialPrompt, onClose }) => {
  const [userRequest, setUserRequest] = useState(initialPrompt || '');
  const [history, setHistory] = useState([
    { role: 'system', content: 'Neural Terminal v2.4.0 Established.' },
    { role: 'system', content: `Base Protocol: ${initialPrompt.substring(0, 60)}...` },
    { role: 'assistant', content: 'System ready. How should I apply this prompt protocol for you?' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalEndRef = useRef(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!userRequest.trim() || isProcessing) return;

    const message = userRequest;
    setUserRequest('');
    setHistory(prev => [...prev, { role: 'user', content: message }]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: initialPrompt, userMessage: message })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response (Status: ${response.status})`);
      }

      const data = await response.json();
      if (data.response) {
        setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error(data.error || 'Connection lost');
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'system', content: `ERR: ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      className="playground-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="playground-modal"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="playground-header">
          <div className="header-title">
            <Terminal size={18} className="header-icon" />
            <span>NEURAL PLAYGROUND</span>
            <div className="status-badge">
              <span className="pulse-dot"></span> LIVE
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="terminal-body">
          <div className="terminal-welcome">
            <Cpu size={14} /> <span>Gemini-2.5-Flash-Lite Pipeline Active</span>
          </div>
          
          {history.map((msg, i) => (
            <div key={i} className={`terminal-line ${msg.role}`}>
              {msg.role === 'user' && <span className="line-prefix">USR {'>'}</span>}
              {msg.role === 'assistant' && <span className="line-prefix">SIG {'>'}</span>}
              {msg.role === 'system' && <span className="line-prefix">SYS {'>'}</span>}
              <div className="line-content">{msg.content}</div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="terminal-line system">
              <span className="line-prefix">SYS {'>'}</span>
              <div className="line-content processing">
                Synthesizing data...
                <motion.div 
                  className="processing-bar"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>

        <form onSubmit={handleExecute} className="terminal-input-area">
          <div className="input-wrapper">
            <span className="prompt-char">{'>'}</span>
            <input 
              type="text" 
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              placeholder="Inject override parameters or request execution..."
              autoFocus
            />
            <button type="submit" disabled={isProcessing || !userRequest.trim()}>
              <Send size={16} />
            </button>
          </div>
          <div className="input-meta">
            <Zap size={10} /> Shift+Enter for multiline • Protocol: Foundational
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PromptPlayground;
