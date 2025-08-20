/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(228 12% 10%)',
        foreground: 'hsl(210 30% 95%)',
        card: 'hsl(228 10% 15%)',
        'card-foreground': 'hsl(210 30% 95%)',
        primary: 'hsl(180 100% 50%)',
        'primary-foreground': 'hsl(228 12% 10%)',
        secondary: 'hsl(220 8% 25%)',
        'secondary-foreground': 'hsl(210 30% 95%)',
        muted: 'hsl(220 8% 25%)',
        'muted-foreground': 'hsl(210 20% 75%)',
        accent: 'hsl(270 100% 70%)',
        'accent-foreground': 'hsl(210 30% 95%)',
        destructive: 'hsl(0 80% 60%)',
        'destructive-foreground': 'hsl(0 0% 100%)',
        border: 'hsl(220 8% 30%)',
        input: 'hsl(220 8% 20%)',
        ring: 'hsl(180 100% 60%)',
      },
      fontFamily: {
        'cyber': ['Orbitron', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%': { boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(0, 255, 255, 0.7)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
