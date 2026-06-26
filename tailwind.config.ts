import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1220',
        foreground: '#F8FAFC',
        primary: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#111A2E',
          foreground: '#F8FAFC',
          border: '#1E293B',
        },
        muted: {
          DEFAULT: '#1E293B',
          foreground: '#94A3B8',
        },
        border: '#1E293B',
        accent: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        'premium': '0 8px 30px rgb(0 0 0 / 0.5)',
        'premium-glow': '0 0 40px rgba(37, 99, 235, 0.15)',
      }
    },
  },
  plugins: [],
}

export default config
