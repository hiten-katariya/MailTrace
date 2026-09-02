/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      colors: {
        soc: {
          bg: '#070B12',
          base: '#0A0F18',
          panel: '#0E1522',
          card: '#111927',
          raised: '#151E2D',
          inset: '#0B101A',
          hover: '#182335',
          border: 'rgba(148, 163, 184, 0.12)',
          'border-subtle': 'rgba(255, 255, 255, 0.06)',
          'border-active': 'rgba(40, 199, 232, 0.35)',
          subtle: '#090E17',
          muted: '#64748B',
          text: '#F1F5F9',
          'text-dim': '#94A3B8',
        },
        threat: {
          clean: '#10B981',
          'clean-bg': 'rgba(16, 185, 129, 0.08)',
          'clean-border': 'rgba(16, 185, 129, 0.25)',
          suspicious: '#F59E0B',
          'suspicious-bg': 'rgba(245, 158, 11, 0.08)',
          'suspicious-border': 'rgba(245, 158, 11, 0.25)',
          high: '#EF4444',
          'high-bg': 'rgba(239, 68, 68, 0.10)',
          'high-border': 'rgba(239, 68, 68, 0.25)',
          neutral: '#64748B',
          'neutral-bg': 'rgba(100, 116, 139, 0.10)',
        },
        cyber: {
          cyan: '#28C7E8',
          sky: '#0EA5E9',
          indigo: '#6366F1',
          violet: '#818CF8',
          blue: '#3B82F6',
          glow: 'rgba(40, 199, 232, 0.12)',
        }
      },
      boxShadow: {
        'soc-subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.45)',
        'soc-card': '0 4px 12px -2px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'soc-glow': '0 0 16px -2px rgba(40, 199, 232, 0.15)',
        'threat-high': '0 0 12px -2px rgba(239, 68, 68, 0.25)',
        'threat-clean': '0 0 12px -2px rgba(16, 185, 129, 0.2)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
