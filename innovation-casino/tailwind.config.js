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
        casino: {
          gold: '#FFD700',
          'dark-bg': '#1a1a1a',
          'felt-green': '#0d5e3f',
          'casino-gold': '#d4af37',
        },
        chip: {
          red: '#DC2626',
          blue: '#3B82F6',
          green: '#10B981',
        },
        table: {
          'safe-bet': '#3B82F6',
          jackpot: '#FFD700',
          'wild-card': '#9333EA',
          moonshot: '#EF4444',
        },
        status: {
          waiting: '#6B7280',
          voting: '#10B981',
          results: '#3B82F6',
          closed: '#DC2626',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      fontSize: {
        'display-xs': '0.75rem',    // 12px
        'display-sm': '0.875rem',   // 14px
        'display-base': '1rem',     // 16px
        'display-lg': '1.125rem',   // 18px
        'display-xl': '1.25rem',    // 20px
        'display-2xl': '1.5rem',    // 24px
        'display-3xl': '1.875rem',  // 30px
        'display-4xl': '2.25rem',   // 36px
        'display-5xl': '3rem',      // 48px - Big Screen
        'display-6xl': '4rem',      // 64px - Big Screen
        'display-7xl': '4.5rem',    // 72px - Big Screen
      },
    },
  },
  plugins: [],
}
