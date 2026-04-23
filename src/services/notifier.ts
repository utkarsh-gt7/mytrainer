/**
 * Tiny framework-agnostic toast notifier.
 *
 * Usage from anywhere in the codebase:
 *   import { notify } from '@/services/notifier';
 *   notify.error('Could not save to cloud');
 *   notify.success('Meal saved');
 *
 * Usage from React:
 *   const toasts = useToasts();
 */

export type NotificationKind = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  description?: string;
  /** Auto-dismiss timeout in ms. 0 disables auto-dismiss. */
  durationMs: number;
}

type Listener = (items: Notification[]) => void;

let items: Notification[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(items);
}

function push(n: Omit<Notification, 'id' | 'durationMs'> & Partial<Pick<Notification, 'durationMs'>>): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const durationMs = n.durationMs ?? (n.kind === 'error' ? 6000 : 3500);
  items = [...items, { id, kind: n.kind, title: n.title, description: n.description, durationMs }];
  emit();
  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs);
  }
  return id;
}

export function dismiss(id: string) {
  const next = items.filter((x) => x.id !== id);
  if (next.length === items.length) return;
  items = next;
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  // Emit current state immediately so subscribers render existing toasts.
  listener(items);
  return () => listeners.delete(listener);
}

/** Reset state — intended for tests only. */
export function __resetForTests() {
  items = [];
  listeners.clear();
}

export const notify = {
  info: (title: string, description?: string) => push({ kind: 'info', title, description }),
  success: (title: string, description?: string) => push({ kind: 'success', title, description }),
  warning: (title: string, description?: string) => push({ kind: 'warning', title, description }),
  error: (title: string, description?: string) => push({ kind: 'error', title, description }),
};
