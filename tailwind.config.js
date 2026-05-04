/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6C5CE7', light: '#A29BFE', dark: '#5A4BD1' },
        secondary: '#00CEC9',
        accent: { DEFAULT: '#FDCB6E', orange: '#F39C12' },
        success: '#00B894',
        warning: '#FDCB6E',
        error: '#E17055',
        info: '#74B9FF',
        surface: '#FFFFFF',
        background: '#F8F9FE',
        'text-primary': '#2D3436',
        'text-secondary': '#636E72',
        'text-light': '#B2BEC3',
        border: '#E8ECF4',
        'child-bg': '#FFF8E7',
        'piggy-pink': '#FF6B9D',
        'star-gold': '#FFD93D',
      },
    },
  },
  plugins: [],
};
