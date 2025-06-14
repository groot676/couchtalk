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
    router.push('/chat');
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
          <nav className="nav">
            <a href="#experience" className="nav-link">Experience</a>
            <a href="#approach" className="nav-link">Approach</a>
            <a href="#membership" className="nav-link">Membership</a>
          </nav>
          <div className="auth-buttons">
            <Link href="/signin" className="btn btn-secondary">Sign in</Link>
            <button onClick={handleGetStarted} className="btn btn-primary">
              Begin journey
            </button>
          </div>
        </header>
        
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>
              Find your <span className="highlight">sanctuary</span> in the comfort of conversation
            </h1>
            <p className="subtitle">
              Step into a space where warmth meets wisdom. Experience therapy 
              that feels like a conversation with your most trusted confidant, 
              available whenever you need it.
            </p>
            <div className="cta-container">
              <button onClick={handleGetStarted} className="cta-primary">
                Start your session
              </button>
              <button className="cta-secondary">Take a tour</button>
            </div>
            <div className="trust-indicators">
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                <span>Complete privacy</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
                <span>Evidence-based care</span>
              </div>
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
      
      {/* Premium Badge */}
      <div className="premium-badge">
        Trusted by 50,000+ members worldwide
      </div>
    </div>
  );
}