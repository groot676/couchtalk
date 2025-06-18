'use client';

export function AtmosphereEffects() {
  return (
    <>
      {/* Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        backgroundImage: 'url("/images/therapy-room.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(2px) brightness(0.85)',
        transform: 'scale(1.05)',
      }}>
        <div style={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)',
        }} />
      </div>

      {/* Lighting Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(255, 220, 180, 0.15) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 40%, rgba(255, 200, 150, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at bottom, rgba(0, 0, 0, 0.4) 0%, transparent 60%)
        `,
      }} />

      {/* Fireplace Glow */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse at center bottom, rgba(255, 140, 50, 0.3) 0%, transparent 70%)',
        zIndex: 2,
        animation: 'flicker 3s ease-in-out infinite',
      }} />

      {/* Candle Lights */}
      <div style={{
        position: 'fixed',
        top: '45%',
        right: '10%',
        width: '80px',
        height: '80px',
        background: 'radial-gradient(circle, rgba(255, 200, 100, 0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'candleFlicker 4s ease-in-out infinite',
        zIndex: 3,
      }} />
      <div style={{
        position: 'fixed',
        bottom: '35%',
        left: '5%',
        width: '80px',
        height: '80px',
        background: 'radial-gradient(circle, rgba(255, 200, 100, 0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'candleFlicker 4s ease-in-out infinite',
        animationDelay: '1s',
        zIndex: 3,
      }} />

      {/* Dust Particles */}
      {[0, 4, 8, 12, 16].map((delay, i) => (
        <div key={i} style={{
          position: 'fixed',
          width: '2px',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          animation: `float 20s linear infinite`,
          animationDelay: `${delay}s`,
          left: `${10 + i * 20}%`,
          zIndex: 4,
        }} />
      ))}

      {/* Animations */}
      <style jsx>{`
        @keyframes flicker {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.9; transform: translateX(-50%) scale(1.05); }
        }
        
        @keyframes candleFlicker {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        
        @keyframes float {
          from {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          to {
            transform: translateY(-100vh) translateX(100px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}