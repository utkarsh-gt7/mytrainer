import { cn } from '@/utils/cn';

/**
 * Minimal segmented control. Pure presentational — caller controls
 * `value` and supplies `onChange`. Renders as semantic radio buttons
 * so keyboard users can arrow-navigate between options.
 */
export interface TabsOption<T extends string> {
  value: T;
  label: string;
  /** Optional badge or count rendered after the label. */
  trailing?: React.ReactNode;
}

export interface TabsProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: TabsOption<T>[];
  name?: string;
  className?: string;
}

export default function Tabs<T extends string>({
  value,
  onChange,
  options,
  name = 'tabs',
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-0.5 p-1 rounded-md bg-surface-2 border border-line',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${name}-${opt.value}-panel`}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 h-8 rounded text-sm font-medium transition-colors focus-ring',
              active
                ? 'bg-surface text-fg shadow-xs'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {opt.label}
            {opt.trailing}
          </button>
        );
      })}
    </div>
  );
}
