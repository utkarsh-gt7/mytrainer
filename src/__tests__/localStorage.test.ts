import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '@/services/localStorage';

describe('localStorage service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('get', () => {
    it('returns fallback when key does not exist', () => {
      expect(storage.get('nonexistent', 42)).toBe(42);
    });

    it('returns stored value', () => {
      localStorage.setItem('ft_mykey', JSON.stringify({ a: 1 }));
      expect(storage.get('mykey', {})).toEqual({ a: 1 });
    });

    it('returns fallback on parse error', () => {
      localStorage.setItem('ft_badkey', 'not-json{');
      expect(storage.get('badkey', 'default')).toBe('default');
    });
  });

  describe('set', () => {
    it('stores value with prefix', () => {
      storage.set('testkey', { hello: 'world' });
      expect(JSON.parse(localStorage.getItem('ft_testkey')!)).toEqual({ hello: 'world' });
    });

    it('stores arrays', () => {
      storage.set('arr', [1, 2, 3]);
      expect(storage.get('arr', [])).toEqual([1, 2, 3]);
    });

    it('handles write failure gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => storage.set('fail', 'data')).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('remove', () => {
    it('removes a key', () => {
      storage.set('toremove', 'value');
      storage.remove('toremove');
      expect(storage.get('toremove', null)).toBe(null);
    });
  });

  describe('clear', () => {
    it('removes all prefixed keys', () => {
      storage.set('a', 1);
      storage.set('b', 2);
      localStorage.setItem('other_key', 'keep');
      storage.clear();
      expect(storage.get('a', null)).toBe(null);
      expect(storage.get('b', null)).toBe(null);
      expect(localStorage.getItem('other_key')).toBe('keep');
    });
  });
});
