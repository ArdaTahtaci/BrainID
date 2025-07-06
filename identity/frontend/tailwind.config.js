/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        eeg: {
          alpha: '#22c55e',
          beta: '#3b82f6',
          gamma: '#f59e0b',
          delta: '#8b5cf6',
          theta: '#ef4444',
        },
        neural: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'brain-wave': 'brain-wave 2s ease-in-out infinite',
        'neural-flow': 'neural-flow 4s ease-in-out infinite',
      },
      keyframes: {
        'brain-wave': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.2)' },
        },
        'neural-flow': {
          '0%': { opacity: '0.3', transform: 'translateX(-100%)' },
          '50%': { opacity: '1', transform: 'translateX(0%)' },
          '100%': { opacity: '0.3', transform: 'translateX(100%)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neural': '0 0 20px rgba(59, 130, 246, 0.3)',
        'eeg': '0 0 30px rgba(34, 197, 94, 0.2)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 