import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Empty-state placeholder. Centered icon + heading + helper text + optional
 * action. Used for "no logs yet", "no meals saved", etc.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-10 px-4 gap-3',
        className,
      )}
    >
      {Icon && (
        <div className="w-11 h-11 rounded-lg bg-surface-2 border border-line flex items-center justify-center">
          <Icon size={20} className="text-fg-subtle" />
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
