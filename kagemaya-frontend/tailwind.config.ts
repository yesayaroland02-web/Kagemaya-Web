import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kage: {
          black: '#0B0B0D',
          yoru: '#121216',
          'yoru-light': '#1C1C22',
          'yoru-card': '#16161B',
          red: '#C62828',
          vermilion: '#E5484D',
          gold: '#D6A85F',
          'gold-dim': 'rgba(214, 168, 95, 0.16)',
          'red-dim': 'rgba(198, 40, 40, 0.15)',
          washi: '#F4F0E8',
          mist: '#B8B5B0',
          'mist-dim': '#85837F',
          border: '#292930',
          'border-light': '#3D3D47',
          success: '#4CAF7D',
          error: '#E05252',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Noto Serif JP', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
