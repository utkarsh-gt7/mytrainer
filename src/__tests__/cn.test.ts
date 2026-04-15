import { describe, it, expect } from 'vitest';
import { cn } from '@/utils/cn';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
  });

  it('merges tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles empty strings', () => {
    expect(cn('', 'foo', '')).toBe('foo');
  });

  it('resolves tailwind dark mode conflicts', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles objects', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});
