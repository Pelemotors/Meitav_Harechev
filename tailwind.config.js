/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // מיטב הרכב Modern Brand Colors - מערכת צבעים מודרנית והרמונית
        
        // Primary - כחול עמוק ומודרני
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Primary main
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        
        // Secondary - זהב אלגנטי
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Secondary main
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        
        // Accent - ירוק מודרני
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Accent main
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },
        
        // Neutral - אפורים מודרניים
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a'
        },
        
        // Legacy colors for backward compatibility
        'slc-dark': '#171717',
        'slc-bronze': '#f59e0b',
        'slc-white': '#ffffff',
        'slc-light-gray': '#f5f5f5',
        'slc-gray': '#737373',
        
        // Status Colors - מעודכנים למודרניים
        'slc-success': '#10b981',
        'slc-warning': '#f59e0b',
        'slc-error': '#ef4444',
        'slc-info': '#3b82f6',
        
        // Additional modern colors
        'dark-blue': '#1e293b',
        'light-blue': '#f8fafc',
        'border-gray': '#e5e5e5',
      },
      fontFamily: {
        // Hebrew Fonts
        'hebrew': ['Heebo', 'Assistant', 'system-ui', 'sans-serif'],
        // English Fonts
        'english': ['Montserrat', 'system-ui', 'sans-serif'],
        // Numbers Font
        'numbers': ['Roboto Mono', 'monospace'],
        // Default
        sans: ['Heebo', 'Assistant', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'heading-1': ['3rem', { lineHeight: '1.2' }],    // 48px
        'heading-2': ['2rem', { lineHeight: '1.3' }],    // 32px
        'heading-3': ['1.5rem', { lineHeight: '1.4' }],  // 24px
        'body': ['1rem', { lineHeight: '1.6' }],         // 16px
        'small': ['0.875rem', { lineHeight: '1.5' }],    // 14px
      },
      spacing: {
        section: '80px',
        card: '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scale-up': 'scaleUp 0.3s ease-in-out',
        'scale-down': 'scaleDown 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
        scaleDown: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.95)' },
        },
      },
    },
  },
  plugins: [],
};
