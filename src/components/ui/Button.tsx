import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

/**
 * Variants
 * --------
 * `primary`   — solid accent, used for the page's principal CTA
 * `secondary` — neutral surface with a border, the safe default
 * `ghost`     — no chrome, only hover surface; toolbars, list rows
 * `danger`    — destructive actions (delete, clear)
 * `outline`   — bordered transparent; alternate to ghost when on busy surfaces
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ' +
  'disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap active:scale-[0.98]';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-700 dark:hover:bg-accent-600 shadow-xs',
  secondary:
    'bg-surface text-fg border border-line hover:bg-surface-2 hover:border-line-strong',
  ghost:
    'text-fg hover:bg-surface-2',
  danger:
    'bg-danger text-white hover:bg-danger-600 shadow-xs',
  outline:
    'border border-line-strong text-fg bg-transparent hover:bg-surface-2',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a leading spinner and disable the button while truthy. */
  loading?: boolean;
}

/**
 * Project-wide button primitive. Replaces the ad-hoc gradient / glow
 * buttons scattered across pages with one consistent set of variants.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled ?? loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  );
});

export default Button;
