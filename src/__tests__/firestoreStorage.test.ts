import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  isFirebaseConfigured: vi.fn(() => true),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn(),
  doc: vi.fn(() => 'ref'),
  db: {} as unknown,
  deleteField: vi.fn(() => ({ __sentinel: 'delete' })),
}));

vi.mock('@/services/firebase', () => ({
  isFirebaseConfigured: mocks.isFirebaseConfigured,
  db: mocks.db,
  doc: mocks.doc,
  setDoc: mocks.setDoc,
  getDoc: mocks.getDoc,
}));

vi.mock('firebase/firestore', () => ({
  deleteField: mocks.deleteField,
}));

vi.mock('@/services/notifier', () => ({
  notify: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

import { firestoreStorage, _resetHydrationGuard } from '@/store/useAppStore';
import { notify } from '@/services/notifier';

describe('firestoreStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFirebaseConfigured.mockReturnValue(true);
    _resetHydrationGuard();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getItem', () => {
    it('returns the serialized value when the doc exists and the key is present', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ 'fitness-tracker-storage': { darkMode: true } }),
      });
      const result = await firestoreStorage.getItem('fitness-tracker-storage');
      expect(result).toBe(JSON.stringify({ darkMode: true }));
    });

    it('returns null when the doc exists but the key is absent', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      });
      const result = await firestoreStorage.getItem('fitness-tracker-storage');
      expect(result).toBeNull();
    });

    it('returns null when the doc does not exist', async () => {
      mocks.getDoc.mockResolvedValue({ exists: () => false });
      const result = await firestoreStorage.getItem('fitness-tracker-storage');
      expect(result).toBeNull();
    });

    it('throws when Firebase is not configured', async () => {
      mocks.isFirebaseConfigured.mockReturnValue(false);
      await expect(firestoreStorage.getItem('key')).rejects.toThrow(
        /Firebase is not configured/,
      );
    });

    it('rethrows Firestore errors via console.error', async () => {
      const err = new Error('firestore offline');
      mocks.getDoc.mockRejectedValue(err);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(firestoreStorage.getItem('k')).rejects.toThrow('firestore offline');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('setItem', () => {
    it('writes a merged payload when Firebase is configured', async () => {
      await firestoreStorage.setItem('fitness-tracker-storage', JSON.stringify({ a: 1 }));
      expect(mocks.setDoc).toHaveBeenCalledWith('ref', { 'fitness-tracker-storage': { a: 1 } }, { merge: true });
    });

    it('throws when Firebase is not configured', async () => {
      mocks.isFirebaseConfigured.mockReturnValue(false);
      await expect(firestoreStorage.setItem('k', '{}')).rejects.toThrow(
        /Firebase is not configured/,
      );
    });

    it('rethrows Firestore errors', async () => {
      const err = new Error('write failed');
      mocks.setDoc.mockRejectedValueOnce(err);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(firestoreStorage.setItem('k', '{}')).rejects.toThrow('write failed');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('write-protection guard (_hydratedLogCount)', () => {
    const storageKey = 'fitness-tracker-storage';

    const mockDocWith = (logs: unknown[]) =>
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          [storageKey]: { state: { workoutLogs: logs } },
        }),
      });

    const mockEmptyDoc = () =>
      mocks.getDoc.mockResolvedValue({ exists: () => false });

    it('does not block when _hydratedLogCount is 0 (new user)', async () => {
      mockEmptyDoc();
      await firestoreStorage.getItem(storageKey);
      await firestoreStorage.setItem(storageKey, JSON.stringify({ state: { workoutLogs: [] } }));
      expect(mocks.setDoc).toHaveBeenCalled();
    });

    it('blocks an empty-log write when Firestore had N > 0 logs at hydration', async () => {
      mockDocWith([{ id: 'a' }, { id: 'b' }]);
      await firestoreStorage.getItem(storageKey);
      await firestoreStorage.setItem(storageKey, JSON.stringify({ state: { workoutLogs: [] } }));
      expect(mocks.setDoc).not.toHaveBeenCalled();
      expect(notify.error).toHaveBeenCalledWith(
        'Data protected',
        expect.stringContaining('blocked'),
      );
    });

    it('allows a write that still carries logs when _hydratedLogCount > 0', async () => {
      mockDocWith([{ id: 'a' }]);
      await firestoreStorage.getItem(storageKey);
      const payload = JSON.stringify({ state: { workoutLogs: [{ id: 'a' }, { id: 'b' }] } });
      await firestoreStorage.setItem(storageKey, payload);
      expect(mocks.setDoc).toHaveBeenCalled();
    });

    it('updates the tracked count after a successful write, so a follow-up empty write is also blocked', async () => {
      mockDocWith([{ id: 'a' }]);
      await firestoreStorage.getItem(storageKey);
      await firestoreStorage.setItem(
        storageKey,
        JSON.stringify({ state: { workoutLogs: [{ id: 'a' }, { id: 'b' }] } }),
      );
      mocks.setDoc.mockClear();
      await firestoreStorage.setItem(storageKey, JSON.stringify({ state: { workoutLogs: [] } }));
      expect(mocks.setDoc).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('writes a deleteField sentinel payload', async () => {
      await firestoreStorage.removeItem('fitness-tracker-storage');
      expect(mocks.deleteField).toHaveBeenCalled();
      expect(mocks.setDoc).toHaveBeenCalledWith(
        'ref',
        { 'fitness-tracker-storage': { __sentinel: 'delete' } },
        { merge: true },
      );
    });

    it('throws when Firebase is not configured', async () => {
      mocks.isFirebaseConfigured.mockReturnValue(false);
      await expect(firestoreStorage.removeItem('k')).rejects.toThrow(
        /Firebase is not configured/,
      );
    });

    it('rethrows Firestore errors', async () => {
      const err = new Error('remove failed');
      mocks.setDoc.mockRejectedValueOnce(err);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(firestoreStorage.removeItem('k')).rejects.toThrow('remove failed');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
