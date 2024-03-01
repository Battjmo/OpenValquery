const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
          'logo-tile': 'url(/logo.svg)',
          'logo-spear': "url('/icon.svg')"
      },
          colors: {
      blue: "#000AFF",
      slate: "#F0F0F4",
      white: "#FFF",
      pink: colors.pink,
      lightGrey: "#F9FAFC",
      blueGradientBackground: "linear-gradient(333deg, #0D0A9D 0%, #000AFF 85.75%), #000AFF",
    },
    },
  },
  plugins: [],
}
