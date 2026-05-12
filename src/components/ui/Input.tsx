import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

/**
 * Shared base classes for every form control. Designed to look
 * consistent across `<input>`, `<textarea>`, `<select>`.
 */
const fieldBase =
  'block w-full rounded-md bg-surface border border-line text-fg placeholder:text-fg-subtle ' +
  'transition-colors duration-150 ' +
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const sizes = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: keyof typeof sizes;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', className, ...rest },
  ref,
) {
  return (
    <input ref={ref} className={cn(fieldBase, sizes[inputSize], className)} {...rest} />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(fieldBase, 'py-2 px-3 text-sm resize-y', className)}
      {...rest}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  inputSize?: keyof typeof sizes;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { inputSize = 'md', className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(fieldBase, sizes[inputSize], 'pr-8 appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center]', className)}
      style={{
        backgroundImage:
          // SVG chevron — inlined so it tints with currentColor logic isn't needed.
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23a1a1aa' stroke-width='2'><path d='m6 8 4 4 4-4'/></svg>\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
});

/** Labelled wrapper for a form control with optional helper / error text. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-medium text-fg-muted"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
