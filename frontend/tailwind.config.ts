import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B3B36',
          light: '#0F4F48',
          dark: '#082E2A',
          foreground: '#FFFFFF',
        },
        navy: {
          DEFAULT: '#1A1C1E',
          light: '#2A2D31',
          foreground: '#F8FAFC',
        },
        wrtn: {
          bg: '#F3EDE3',
          surface: '#FFFFFF',
          border: '#E5DDCF',
          muted: '#5B6864',
        },
        herfree: {
          green: '#0B3B36',
          gray: '#5B6864',
          yellow: '#F0C778',
          'bg-muted': '#F3EDE3',
          'bg-dark': '#07251F',
          'icon-bg': '#F6F1E8',
        },
        canvas: {
          DEFAULT: '#F5F5F7',
          dark: '#EBEBEF',
        },
        hero: {
          DEFAULT: '#F3EDE3',
          foreground: '#1A1C1E',
        },
        sage: {
          DEFAULT: '#2F8F83',
          light: '#3BA896',
          muted: '#7AB5AD',
        },
        pedestal: {
          DEFAULT: '#E8DFD0',
          dark: '#D4C4A8',
        },
        cream: {
          DEFAULT: '#F3EDE3',
          dark: '#DED4C2',
          foreground: '#1A1A1A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#D4B86A',
          foreground: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
        },
        muted: {
          DEFAULT: '#8E8E93',
          foreground: '#8E8E93',
        },
        border: '#E5DDCF',
        ink: {
          DEFAULT: '#1A1C1E',
          soft: '#5C5F66',
        },
        journal: {
          hero: '#0B3B36',
          sun: '#F5A623',
          success: '#0B3B36',
          community: '#0A1A16',
        },
      },
      fontFamily: {
        sans: [
          'SUIT Variable',
          'SUIT',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        display: [
          'SUIT Variable',
          'SUIT',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      maxWidth: {
        app: '430px',
        content: '80rem',
        prose: '42rem',
      },
      borderRadius: {
        shell: '20px',
        card: '12px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 30, 25, 0.04), 0 14px 32px -22px rgba(20, 30, 25, 0.22)',
        'card-hover': '0 8px 28px -18px rgba(20, 30, 25, 0.34)',
        product: '0 4px 20px rgba(30, 41, 59, 0.08)',
        fab: '0 4px 16px rgba(47, 143, 131, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
