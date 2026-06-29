/**
 * tailwind.config.js
 *
 * Values are intentionally kept in sync with src/styles/tokens.ts.
 * When updating a colour or radius here, update tokens.ts too (and vice-versa).
 * The canonical source is tokens.ts; this file mirrors values for Tailwind classes.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Brand ---
        brand: {
          cyan:    '#00F3FF',
          magenta: '#FF00B8',
          purple:  '#8B5CF6',
        },
        // --- Surfaces ---
        surface: {
          base:     '#080808',
          raised:   '#0F1012',
          overlay:  '#1A1A1A',
          elevated: '#242428',
          canvas:   '#14171F',
        },
        // --- Status ---
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error:   '#EF4444',
          info:    '#00F3FF',
        },
        // --- Legacy aliases (kept so existing classes don't break) ---
        neon: {
          purple:  '#8B5CF6',
          teal:    '#14B8A6',
          orange:  '#F59E0B',
          blue:    '#3B82F6',
          green:   '#10B981',
          pink:    '#EC4899',
          cyan:    '#00F3FF',
          magenta: '#FF00B8',
        },
        dark: {
          primary:   '#0F0F23',
          secondary: '#1A1A2E',
          tertiary:  '#16213E',
          card:      '#1F1F3A',
        },
      },

      borderRadius: {
        xs:    '2px',
        sm:    '4px',
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      boxShadow: {
        card:            '0 4px 24px rgba(0, 0, 0, 0.60)',
        modal:           '0 8px 48px rgba(0, 0, 0, 0.80)',
        'glow-cyan':     '0 0 16px rgba(0, 243, 255, 0.35)',
        'glow-cyan-lg':  '0 0 28px rgba(0, 243, 255, 0.55)',
        'glow-magenta':  '0 0 16px rgba(255, 0, 184, 0.35)',
        'glow-purple':   '0 0 16px rgba(139, 92, 246, 0.35)',
        // Legacy
        'neon-subtle':   '0 0 10px rgba(139, 92, 246, 0.30)',
        'neon-medium':   '0 0 20px rgba(139, 92, 246, 0.50), inset 0 0 10px rgba(139, 92, 246, 0.10)',
        'neon-strong':   '0 0 30px rgba(139, 92, 246, 0.80), 0 0 60px rgba(139, 92, 246, 0.40)',
        'neon-teal':     '0 0 20px rgba(20, 184, 166, 0.50), inset 0 0 10px rgba(20, 184, 166, 0.10)',
        'neon-blue':     '0 0 20px rgba(59, 130, 246, 0.50), inset 0 0 10px rgba(59, 130, 246, 0.10)',
        'neon-green':    '0 0 20px rgba(16, 185, 129, 0.50), inset 0 0 10px rgba(16, 185, 129, 0.10)',
        'neon-orange':   '0 0 20px rgba(245, 158, 11, 0.50), inset 0 0 10px rgba(245, 158, 11, 0.10)',
        'neon-pink':     '0 0 20px rgba(236, 72, 153, 0.50), inset 0 0 10px rgba(236, 72, 153, 0.10)',
        'neon-cyan':     '0 0 20px rgba(0, 243, 255, 0.50), inset 0 0 10px rgba(0, 243, 255, 0.10)',
      },

      fontFamily: {
        sans: ['"Inter"', '"Roboto"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Source Code Pro"', 'monospace'],
      },

      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '350ms',
      },

      animation: {
        'neon-pulse':  'neon-pulse 2s infinite',
        'neon-glow':   'neon-glow 3s ease-in-out infinite alternate',
        'border-flow': 'border-flow 3s linear infinite',
        'skeleton':    'skeleton-shimmer 1.5s ease-in-out infinite',
      },

      keyframes: {
        'skeleton-shimmer': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1'   },
        },
      },
    },
  },
  plugins: [],
};
