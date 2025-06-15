'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function LandingPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleGetStarted = () => {
    router.push('/signup');
  };

  return (
    <div className="landing-container">
      {/* Background Elements */}
      <div className="living-room-bg" />
      <div className="lighting-overlay" />
      <div className="fireplace-glow" />
      
      {/* Ambient Elements */}
      <div className="candle-light candle1" />
      <div className="candle-light candle2" />
      
      {/* Dust Particles */}
      <div className="dust-particle dust1" />
      <div className="dust-particle dust2" />
      <div className="dust-particle dust3" />
      <div className="dust-particle dust4" />
      <div className="dust-particle dust5" />
      
      {/* Content */}
      <div className={`content-wrapper ${isLoaded ? 'fade-in' : ''}`}>
        {/* Header */}
        <header className="header">
          <div className="logo">CouchTalk</div>
          <div className="auth-buttons">
            <Link href="/signin" className="btn btn-secondary">Sign in</Link>
          </div>
        </header>
        
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>
              Find your <span className="highlight">sanctuary</span> in the comfort of conversation
            </h1>
            <p className="subtitle">
              Experience therapy that feels like talking with your most trusted friend. 
              Connect solo or bring your partner for guided conversations together.
            </p>
            <div className="cta-container">
              <button onClick={handleGetStarted} className="cta-primary">
                Start your session
              </button>
            </div>
            <div className="trust-indicators">
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span>Always available</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}