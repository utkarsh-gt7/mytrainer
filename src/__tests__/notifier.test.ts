import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notify, subscribe, dismiss, __resetForTests, type Notification } from '@/services/notifier';

describe('notifier', () => {
  beforeEach(() => {
    __resetForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits the current (empty) state on subscribe', () => {
    const listener = vi.fn<(items: Notification[]) => void>();
    subscribe(listener);
    expect(listener).toHaveBeenCalledWith([]);
  });

  it('pushes info/success/warning/error notifications', () => {
    const seen: Notification[][] = [];
    subscribe((items) => seen.push(items));
    notify.info('Hi');
    notify.success('Yes');
    notify.warning('Careful');
    notify.error('Boom', 'details');
    const last = seen[seen.length - 1];
    expect(last.map((n) => n.kind)).toEqual(['info', 'success', 'warning', 'error']);
    expect(last[3].description).toBe('details');
  });

  it('auto-dismisses after the default duration', () => {
    const listener = vi.fn<(items: Notification[]) => void>();
    subscribe(listener);
    notify.info('Hello');
    expect(listener).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ title: 'Hello' })]));
    vi.advanceTimersByTime(3500);
    expect(listener).toHaveBeenLastCalledWith([]);
  });

  it('allows manual dismissal via id', () => {
    let current: Notification[] = [];
    subscribe((items) => {
      current = items;
    });
    const id = notify.error('Problem');
    expect(current).toHaveLength(1);
    dismiss(id);
    expect(current).toHaveLength(0);
  });

  it('ignores dismiss for unknown ids', () => {
    let current: Notification[] = [];
    subscribe((items) => {
      current = items;
    });
    notify.info('Persist');
    dismiss('nonexistent');
    expect(current).toHaveLength(1);
  });

  it('unsubscribe stops future updates', () => {
    const listener = vi.fn<(items: Notification[]) => void>();
    const unsubscribe = subscribe(listener);
    listener.mockClear();
    unsubscribe();
    notify.info('After unsubscribe');
    expect(listener).not.toHaveBeenCalled();
  });
});
