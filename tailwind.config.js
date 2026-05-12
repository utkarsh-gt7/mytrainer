/**
 * FitTracker Design System
 * ─────────────────────────
 * Monochrome neutral base (zinc) with a single warm accent (orange) for
 * energy and emphasis. Semantic colours are reserved for status/data
 * (success / warning / danger / info) and used sparingly so the UI
 * body stays calm.
 *
 * The one exception is `<PageHeader>` — each page gets a gradient
 * banner in its theme colour (workout=red, nutrition=green,
 * metrics=blue, progress=gold, dashboard=red→orange→gold,
 * plan/library/archive/settings=charcoal). Those palettes live under
 * `colors.workout/nutrition/metrics/gold/flame/iron` and the
 * banner backgrounds + glows under `backgroundImage.hero-*` +
 * `boxShadow.glow-*`. The display face for the banner titles is
 * Oswald (font-display); the rest of the app remains Inter.
 *
 * Conventions:
 *  - Surfaces: bg-surface / bg-surface-2 / bg-canvas
 *  - Text: text-fg / text-fg-muted / text-fg-subtle
 *  - Borders: border-line / border-line-strong
 *  - Accent: text-accent / bg-accent / ring-accent
 *  - Page banner: bg-hero-{theme} + shadow-glow-{theme} + font-display
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

        /* ─── Per-page banner palettes (used ONLY by PageHeader hero) ───
         * These shades back the `bg-hero-*` gradients + `shadow-glow-*`
         * colored shadows. They never appear in card/body chrome — the
         * neutral surface tokens are still the rule there.
         */
        workout: {       /* iron red — strength / training */
          500: '#ef2b2b',
          700: '#af1313',
          900: '#410707',
        },
        nutrition: {     /* leaf green — meals / macros */
          500: '#22ac5c',
          700: '#156e3c',
          900: '#12482c',
        },
        metrics: {       /* blueprint blue — measurements / analytics */
          500: '#2f8dff',
          700: '#175adc',
          900: '#1c3f89',
        },
        gold: {          /* trophy gold — PRs / progress */
          400: '#f7c948',
          500: '#f0b429',
          700: '#cb6e17',
          900: '#8d2b0b',
        },
        flame: {         /* streak orange — daily consistency */
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        iron: {          /* warm charcoal — plan / library / archive / settings banners */
          400: '#79796f',
          500: '#55554c',
          700: '#2d2d28',
          800: '#1f1f1c',
          900: '#121210',
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
        /*
         * `font-display` powers the stamped-steel uppercase titles on
         * the page banners. It's intentionally scoped — the rest of the
         * app uses Inter via `font-sans`.
         */
        display: ['Oswald', 'Impact', 'Inter', 'sans-serif'],
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
        /* subtle, single-layer shadows for cards / body chrome */
        xs: '0 1px 1px rgba(0,0,0,0.04)',
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        lg: '0 10px 24px -4px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.04)',
        'focus': '0 0 0 2px rgb(var(--canvas)), 0 0 0 4px rgb(var(--accent))',
        /* Colored ambient glows reserved for `<PageHeader>` banners */
        'glow-workout':   '0 10px 30px -8px rgba(239,43,43,0.45)',
        'glow-nutrition': '0 10px 30px -8px rgba(34,172,92,0.40)',
        'glow-metrics':   '0 10px 30px -8px rgba(47,141,255,0.40)',
        'glow-gold':      '0 10px 30px -8px rgba(240,180,41,0.45)',
        'glow-flame':     '0 10px 30px -8px rgba(249,115,22,0.40)',
        'glow-iron':      '0 8px 24px -10px rgba(0,0,0,0.55)',
      },
      backgroundImage: {
        /* Gradient backings for `<PageHeader theme="...">` banners. */
        'hero-workout':    'linear-gradient(135deg, rgba(239,43,43,0.92) 0%, rgba(175,19,19,0.95) 60%, rgba(65,7,7,0.95) 100%)',
        'hero-nutrition':  'linear-gradient(135deg, rgba(34,172,92,0.92) 0%, rgba(21,110,60,0.95) 60%, rgba(18,72,44,0.95) 100%)',
        'hero-metrics':    'linear-gradient(135deg, rgba(47,141,255,0.92) 0%, rgba(23,90,220,0.95) 60%, rgba(28,63,137,0.95) 100%)',
        'hero-progress':   'linear-gradient(135deg, rgba(240,180,41,0.95) 0%, rgba(203,110,23,0.95) 60%, rgba(141,43,11,0.95) 100%)',
        'hero-dashboard':  'linear-gradient(135deg, rgba(239,43,43,0.95) 0%, rgba(249,115,22,0.90) 55%, rgba(240,180,41,0.90) 100%)',
        'hero-plan':       'linear-gradient(135deg, rgba(63,63,56,0.95) 0%, rgba(18,18,16,0.98) 100%)',
        'hero-library':    'linear-gradient(135deg, rgba(85,85,76,0.95) 0%, rgba(31,31,28,0.98) 100%)',
        'hero-archive':    'linear-gradient(135deg, rgba(63,63,56,0.95) 0%, rgba(18,18,16,0.98) 100%)',
        'hero-settings':   'linear-gradient(135deg, rgba(63,63,56,0.95) 0%, rgba(18,18,16,0.98) 100%)',
        /* Subtle white grid texture overlaid on banner gradients */
        'grid-iron':       'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
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
