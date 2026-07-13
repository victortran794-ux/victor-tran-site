module.exports = {
  content: [
    './pikappapp/demo.html',
    './pikappapp/demo-source.jsx',
  ],
  theme: {
    extend: {
      colors: {
        pikapp: {
          blue: '#15295C',
          'blue-deep': '#0B173A',
          'blue-mid': '#1F3A7A',
          'blue-soft': '#2C4A8E',
          gold: '#E8B33D',
          'gold-light': '#F5D97A',
          'gold-deep': '#B98828',
          cream: '#FAF7EE',
          ink: '#0E1A3E',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        brand: ['Barlow', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        pill: '0 12px 36px -10px rgba(11, 23, 58, 0.35), 0 4px 12px -4px rgba(11, 23, 58, 0.15)',
        card: '0 2px 10px -2px rgba(11, 23, 58, 0.08), 0 1px 3px rgba(11, 23, 58, 0.04)',
        ring: '0 0 0 4px rgba(232, 179, 61, 0.2)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'spin-slow': 'spin 18s linear infinite',
      },
      opacity: {
        8: '0.08',
      },
    },
  },
};
