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

import { firestoreStorage } from '@/store/useAppStore';

describe('firestoreStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFirebaseConfigured.mockReturnValue(true);
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
