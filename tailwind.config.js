/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        soc: {
          bg: '#090D16',
          panel: '#0F172A',
          raised: '#151E33',
          inset: '#0B1120',
          hover: '#1E293B',
          border: '#1E293B',
          'border-active': '#334155',
          subtle: '#111827',
          muted: '#64748B',
          text: '#F8FAFC',
          'text-dim': '#94A3B8',
        },
        threat: {
          clean: '#10B981',
          'clean-bg': 'rgba(6, 78, 59, 0.25)',
          'clean-border': 'rgba(16, 185, 129, 0.35)',
          suspicious: '#F59E0B',
          'suspicious-bg': 'rgba(69, 26, 3, 0.3)',
          'suspicious-border': 'rgba(245, 158, 11, 0.35)',
          high: '#EF4444',
          'high-bg': 'rgba(69, 10, 10, 0.35)',
          'high-border': 'rgba(239, 68, 68, 0.35)',
          neutral: '#64748B',
          'neutral-bg': 'rgba(30, 41, 59, 0.4)',
        },
        cyber: {
          cyan: '#06B6D4',
          sky: '#0EA5E9',
          blue: '#3B82F6',
          glow: 'rgba(6, 182, 212, 0.15)',
        }
      },
      boxShadow: {
        'soc-subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.37), 0 1px 2px -1px rgba(0, 0, 0, 0.37)',
        'soc-card': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'threat-high': '0 0 15px -3px rgba(239, 68, 68, 0.3)',
        'threat-clean': '0 0 15px -3px rgba(16, 185, 129, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
