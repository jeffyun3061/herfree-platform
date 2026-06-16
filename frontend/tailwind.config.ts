import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D4739',
          light: '#3A5A49',
          dark: '#1F3328',
          foreground: '#FFFFFF',
        },
        navy: {
          DEFAULT: '#1A1C1E',
          light: '#2A2D31',
          foreground: '#F8FAFC',
        },
        canvas: {
          DEFAULT: '#F9F9F7',
          dark: '#F2F0EB',
        },
        hero: {
          DEFAULT: '#F2EFE9',
          foreground: '#1A1C1E',
        },
        sage: {
          DEFAULT: '#4A6B52',
          light: '#5F7660',
          muted: '#8FA894',
        },
        pedestal: {
          DEFAULT: '#E8DFD0',
          dark: '#D4C4A8',
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
          DEFAULT: '#64748B',
          foreground: '#64748B',
        },
        border: '#E8E6E1',
        ink: {
          DEFAULT: '#1A1C1E',
          soft: '#5C5F66',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
      },
      maxWidth: {
        app: '430px',
        content: '80rem',
        prose: '42rem',
      },
      borderRadius: {
        shell: '32px',
        card: '14px',
        pill: '20px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(45, 71, 57, 0.06)',
        'card-hover': '0 4px 20px rgba(45, 71, 57, 0.1)',
        product: '0 4px 20px rgba(30, 41, 59, 0.08)',
        fab: '0 4px 16px rgba(45, 71, 57, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
