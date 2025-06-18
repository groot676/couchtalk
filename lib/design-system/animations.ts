export const animations = {
  transition: {
    fast: '150ms ease',
    base: '300ms ease',
    slow: '500ms ease',
    spring: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    float: {
      '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
      '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
      '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
    },
  },
};