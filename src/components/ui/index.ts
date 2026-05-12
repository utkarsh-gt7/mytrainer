/**
 * Barrel for the design-system primitives. Page-level code should
 * import from `@/components/ui` so the underlying file layout stays
 * an implementation detail.
 */
export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as Card, CardHeader, CardTitle, CardBody } from './Card';
export type { CardProps, CardVariant } from './Card';

export { Input, Textarea, Select, Field } from './Input';
export type { InputProps, TextareaProps, SelectProps } from './Input';

export { default as Badge } from './Badge';
export type { BadgeProps, BadgeTone, BadgeVariant } from './Badge';

export { default as Progress } from './Progress';
export type { ProgressTone } from './Progress';

export { default as StatTile } from './StatTile';
export type { StatTileProps } from './StatTile';

export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

export { default as Tabs } from './Tabs';
export type { TabsOption, TabsProps } from './Tabs';

export { default as EmptyState } from './EmptyState';
