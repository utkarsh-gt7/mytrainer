/**
 * FitTracker Design System
 * ─────────────────────────
 * Monochrome neutral base (zinc) with a single warm accent (orange) for
 * energy and emphasis. Semantic colours are reserved for status/data
 * (success / warning / danger / info) and used sparingly so the UI
 * stays calm. No gradient hero panels, no display fonts, no glows.
 *
 * Conventions:
 *  - Surfaces: bg-surface / bg-surface-2 / bg-canvas
 *  - Text: text-fg / text-fg-muted / text-fg-subtle
 *  - Borders: border-line / border-line-strong
 *  - Accent: text-accent / bg-accent / ring-accent
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ─── Semantic surface + foreground tokens ────────────────── */
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        'fg-subtle': 'rgb(var(--fg-subtle) / <alpha-value>)',

        /* ─── Brand accent ─────────────────────────────────────────
         * Warm coral-orange — energetic without being loud. Used for
         * primary buttons, focus rings, active states, key callouts.
         */
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
          DEFAULT: '#ea580c',
          fg: '#ffffff',
        },

        /* ─── Status / data tokens (used sparingly) ───────────────── */
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          DEFAULT: '#10b981',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          DEFAULT: '#f59e0b',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          DEFAULT: '#ef4444',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          DEFAULT: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        /* tighter line-heights for headings; comfortable for body */
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        /* tight, modern corners — md for controls, lg for cards, xl for dialogs */
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        /* subtle, single-layer shadows — no glows */
        xs: '0 1px 1px rgba(0,0,0,0.04)',
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        lg: '0 10px 24px -4px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.04)',
        'focus': '0 0 0 2px rgb(var(--canvas)), 0 0 0 4px rgb(var(--accent))',
      },
      ringColor: {
        DEFAULT: 'rgb(var(--accent))',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
    },
  },
  plugins: [],
};
