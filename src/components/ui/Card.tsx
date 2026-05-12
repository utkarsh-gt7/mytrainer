import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

/**
 * Card — the canonical surface container.
 *
 * Variants:
 *  `flat`     — no shadow, just a 1px border. Default.
 *  `raised`   — adds a subtle shadow for stand-out emphasis.
 *  `interactive` — adds hover surface + border emphasis for clickable cards.
 */
export type CardVariant = 'flat' | 'raised' | 'interactive';

const variants: Record<CardVariant, string> = {
  flat: 'border border-line',
  raised: 'border border-line shadow-sm',
  interactive:
    'border border-line transition-colors duration-150 hover:bg-surface-2 hover:border-line-strong cursor-pointer',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** When true the card omits internal padding (use `CardBody` instead). */
  bare?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'flat', bare, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-surface rounded-lg',
        variants[variant],
        bare ? '' : 'p-4 sm:p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Card;

/** Header row at the top of a card. */
export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 mb-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Card title — h3 level by default for proper document outline. */
export function CardTitle({
  className,
  children,
  as: As = 'h3',
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }) {
  return (
    <As
      className={cn('text-base font-semibold text-fg tracking-tight', className)}
      {...rest}
    >
      {children}
    </As>
  );
}

/** Body slot for bare cards that handle their own padding/layout. */
export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4 sm:p-5', className)} {...rest}>
      {children}
    </div>
  );
}
