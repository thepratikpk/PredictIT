/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Google Sans', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Material Design 3 Color Palette
        md: {
          primary: '#1A73E8',
          'primary-dark': '#1557B0',
          'primary-container': '#E8F0FE',
          'on-primary-container': '#185ABC',
          surface: '#FFFFFF',
          'surface-dim': '#F8F9FA',
          'surface-container': '#F1F3F4',
          'on-surface': '#202124',
          'on-surface-variant': '#5F6368',
          outline: '#747775',
          'outline-variant': '#E0E0E0',
          error: '#D93025',
          'error-container': '#FCE8E6',
        },
        // Legacy support
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#1A73E8",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F8F9FA",
          foreground: "#202124",
        },
        destructive: {
          DEFAULT: "#D93025",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F8F9FA",
          foreground: "#5F6368",
        },
        accent: {
          DEFAULT: "#E8F0FE",
          foreground: "#1A73E8",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#202124",
        },
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '28px',
        'full': '9999px',
      },
      boxShadow: {
        // MD3 Elevation Levels
        'md-1': '0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15)',
        'md-2': '0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15)',
        'md-3': '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)',
        'md-4': '0 2px 3px 0 rgba(60, 64, 67, 0.3), 0 6px 10px 4px rgba(60, 64, 67, 0.15)',
      },
      keyframes: {
        "md-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "md-slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "md-scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "md-fade-in": "md-fade-in 0.2s ease-out",
        "md-slide-up": "md-slide-up 0.25s cubic-bezier(0.2, 0, 0, 1)",
        "md-scale-in": "md-scale-in 0.2s cubic-bezier(0.2, 0, 0, 1)",
        "spin": "spin 1s linear infinite",
      },
      transitionTimingFunction: {
        'md-standard': 'cubic-bezier(0.2, 0, 0, 1)',
        'md-emphasized': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'md-decelerate': 'cubic-bezier(0, 0, 0, 1)',
        'md-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}