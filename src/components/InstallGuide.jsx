
import React from 'react';
import { Smartphone, Monitor, Command, ArrowLeft, Download, Apple } from 'lucide-react';
import './InstallGuide.css';

const InstallGuide = () => {
  return (
    <div className="install-container">
      <div className="install-card-wrapper">
        <div className="install-header">
          <button onClick={() => window.location.href = '/'} className="back-btn">
            <ArrowLeft size={20} />
            <span>Return to Signal</span>
          </button>
          <div className="header-content">
            <div className="install-badge">System Deployment</div>
            <h1>Initialize Local Protocol</h1>
            <p>Install THE SIGNAL directly to your device for distinct, lag-free intelligence access.</p>
          </div>
        </div>

        <div className="devices-grid">
          {/* Mobile Card */}
          <div className="device-card">
            <div className="card-icon">
              <Smartphone size={32} />
            </div>
            <h3>Mobile Command</h3>
            <p className="device-desc">iOS & Android</p>
            <div className="instruction-list">
              <div className="step">
                <span className="step-num">01</span>
                <span>Open <strong>Safari</strong> (iOS) or <strong>Chrome</strong> (Android).</span>
              </div>
              <div className="step">
                <span className="step-num">02</span>
                <span>Tap the <strong>Share</strong> icon (iOS) or <strong>Menu</strong> (Android).</span>
              </div>
              <div className="step">
                <span className="step-num">03</span>
                <span>Select <strong>"Add to Home Screen"</strong>.</span>
              </div>
            </div>
            <div className="status-indicator">
              <span className="dot"></span> Native Feel
            </div>
          </div>

          {/* Desktop Card */}
          <div className="device-card">
            <div className="card-icon">
              <Monitor size={32} />
            </div>
            <h3>Desktop Terminal</h3>
            <p className="device-desc">Windows & Linux (Chrome/Edge)</p>
            <div className="instruction-list">
              <div className="step">
                <span className="step-num">01</span>
                <span>Look for the <strong>Install Icon</strong> <Download size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> in the URL bar.</span>
              </div>
              <div className="step">
                <span className="step-num">02</span>
                <span>Click <strong>"Install THE SIGNAL"</strong>.</span>
              </div>
              <div className="step">
                <span className="step-num">03</span>
                <span>Launch directly from your desktop or taskbar.</span>
              </div>
            </div>
             <div className="status-indicator">
              <span className="dot"></span> Windowed Mode
            </div>
          </div>

          {/* Mac Card */}
          <div className="device-card">
            <div className="card-icon">
              <Apple size={32} />
            </div>
            <h3>Macintosh Uplink</h3>
            <p className="device-desc">macOS (Sarafi/Chrome)</p>
            <div className="instruction-list">
              <div className="step">
                <span className="step-num">01</span>
                <span>Open in <strong>Safari</strong> or <strong>Chrome</strong>.</span>
              </div>
              <div className="step">
                <span className="step-num">02</span>
                <span><strong>Safari:</strong> File {'>'} Add to Dock.<br/><strong>Chrome:</strong> Menu {'>'} Cast/Save {'>'} Install.</span>
              </div>
              <div className="step">
                <span className="step-num">03</span>
                <span>Access via Launchpad or Spotlight.</span>
              </div>
            </div>
             <div className="status-indicator">
              <span className="dot"></span> Dock Integration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallGuide;
