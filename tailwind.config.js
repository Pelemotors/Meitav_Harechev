/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Strong Luxury Cars Brand Colors
        // Primary Colors
        'slc-dark': '#1a1a1a',      // אפור כהה (רקע)
        'slc-dark-alt': '#2d2d2d',  // אפור כהה חלופי
        'slc-bronze': '#cd7f32',    // נחושת/ברונזה מטאלי
        'slc-bronze-alt': '#b8860b', // נחושת/ברונזה חלופי
        'slc-white': '#ffffff',     // לבן
        
        // Secondary Colors
        'slc-light-gray': '#f5f5f5', // אפור בהיר
        'slc-gray': '#808080',       // אפור בינוני
        'slc-black': '#000000',      // שחור
        
        // Status Colors
        'slc-success': '#28a745',    // הצלחה
        'slc-warning': '#ffc107',    // אזהרה
        'slc-error': '#dc3545',      // שגיאה
        'slc-info': '#17a2b8',       // מידע
        
        // Legacy Colors (for backward compatibility)
        primary: '#cd7f32',          // מפה ל-bronze
        darkBlue: '#1a1a1a',         // מפה ל-dark
        lightGray: '#f5f5f5',        // מפה ל-light-gray
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
