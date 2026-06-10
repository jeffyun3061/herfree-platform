import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D4A32',
          light: '#3D6444',
          foreground: '#FFFFFF',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          dark: '#EDE8DF',
          foreground: '#1A1A1A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#D4B86A',
          foreground: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#FAFAF7',
          foreground: '#1A1A1A',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
        },
        muted: {
          DEFAULT: '#6B7280',
          foreground: '#6B7280',
        },
        border: '#E5E5E0',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: {
        app: '430px',
      },
    },
  },
  plugins: [],
};

export default config;
