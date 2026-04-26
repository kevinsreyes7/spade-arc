/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0d1a',
        card: '#111827',
        border: '#1e2d4a',
        accent: '#c8d4f0',
        secondary: '#4a6fa5',
        textPrimary: '#e8eaf0',
        textMuted: '#4a5568',
        highlight: '#7b9fd4',
        danger: '#c0392b',
        success: '#27ae60',
        phase1: '#4a6fa5',
        phase2: '#7b9fd4',
        phase3: '#c8d4f0',
        phase4: '#f0c040',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      letterSpacing: {
        widest: '0.25em',
        superwide: '0.4em',
      },
      boxShadow: {
        glow: '0 0 20px rgba(74,111,165,0.18)',
        'glow-accent': '0 0 30px rgba(200,212,240,0.12)',
        'glow-key': '0 0 12px rgba(192,57,43,0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-down': 'slideDown 0.35s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-navy': 'linear-gradient(135deg, #0a0d1a 0%, #0f1628 50%, #0a0d1a 100%)',
      },
    },
  },
  plugins: [],
}
