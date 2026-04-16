import { describe, it, expect } from 'vitest';
import { storage } from '@/services/localStorage';

describe('localStorage service', () => {
  it('throws on get in cloud-only mode', () => {
    expect(() => storage.get('nonexistent', 42)).toThrow('cloud-only mode');
  });

  it('throws on set in cloud-only mode', () => {
    expect(() => storage.set('testkey', { hello: 'world' })).toThrow('cloud-only mode');
  });

  it('throws on remove in cloud-only mode', () => {
    expect(() => storage.remove('toremove')).toThrow('cloud-only mode');
  });

  it('throws on clear in cloud-only mode', () => {
    expect(() => storage.clear()).toThrow('cloud-only mode');
  });
});
