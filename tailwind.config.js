/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: '#8b5cf6',
          teal: '#14b8a6',
          orange: '#f59e0b',
          blue: '#3b82f6',
          green: '#10b981',
          pink: '#ec4899',
          cyan: '#00F3FF'
        },
        dark: {
          primary: '#0f0f23',
          secondary: '#1a1a2e',
          tertiary: '#16213e',
          card: '#1f1f3a'
        }
      },
      boxShadow: {
        'neon-subtle': '0 0 10px rgba(139, 92, 246, 0.3)',
        'neon-medium': '0 0 20px rgba(139, 92, 246, 0.5), inset 0 0 10px rgba(139, 92, 246, 0.1)',
        'neon-strong': '0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(139, 92, 246, 0.4)',
        'neon-teal': '0 0 20px rgba(20, 184, 166, 0.5), inset 0 0 10px rgba(20, 184, 166, 0.1)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.1)',
        'neon-green': '0 0 20px rgba(16, 185, 129, 0.5), inset 0 0 10px rgba(16, 185, 129, 0.1)',
        'neon-orange': '0 0 20px rgba(245, 158, 11, 0.5), inset 0 0 10px rgba(245, 158, 11, 0.1)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.5), inset 0 0 10px rgba(236, 72, 153, 0.1)',
        'neon-cyan': '0 0 20px rgba(0, 243, 255, 0.5), inset 0 0 10px rgba(0, 243, 255, 0.1)'
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s infinite',
        'neon-glow': 'neon-glow 3s ease-in-out infinite alternate',
        'border-flow': 'border-flow 3s linear infinite'
      }
    },
  },
  plugins: [],
};
