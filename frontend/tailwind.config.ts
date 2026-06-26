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
          bg: '#EFF1F0',
          surface: '#FFFFFF',
          border: '#DDE3E1',
          muted: '#5B6864',
        },
        herfree: {
          green: '#0B3B36',
          gray: '#5B6864',
          yellow: '#FFD566',
          'bg-muted': '#EFF1F0',
          'bg-dark': '#1A1A1A',
          'icon-bg': '#F4F6F5',
        },
        canvas: {
          DEFAULT: '#F5F5F7',
          dark: '#EBEBEF',
        },
        hero: {
          DEFAULT: '#F2EFE9',
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
          DEFAULT: '#F5F5F7',
          dark: '#EBEBEF',
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
        border: '#E8E8ED',
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
        sans: ['SUIT', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['SUIT', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
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
        card: '0 2px 12px rgba(47, 143, 131, 0.06)',
        'card-hover': '0 4px 20px rgba(47, 143, 131, 0.1)',
        product: '0 4px 20px rgba(30, 41, 59, 0.08)',
        fab: '0 4px 16px rgba(47, 143, 131, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
