// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createAuthStorage } from './storage';
beforeEach(() => localStorage.clear());
describe('auth storage across browser restrictions and tabs', () => {
  it('does not resurrect a persisted session removed by another tab', () => {
    const storage = createAuthStorage();
    storage.setItem('fixture', 'synthetic-session');
    localStorage.removeItem('fixture');
    expect(storage.getItem('fixture')).toBeNull();
  });
  it('supports a memory session and logout when storage is blocked', () => {
    const storage = createAuthStorage(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    storage.setItem('fixture', 'synthetic-session');
    expect(storage.getItem('fixture')).toBe('synthetic-session');
    storage.removeItem('fixture');
    expect(storage.getItem('fixture')).toBeNull();
  });
  it('clears the fallback after storage becomes writable', () => {
    let blocked = true;
    const storage = createAuthStorage(() => {
      if (blocked) throw new DOMException('Blocked', 'SecurityError');
      return localStorage;
    });
    storage.setItem('fixture', 'old-synthetic-session');
    blocked = false;
    storage.setItem('fixture', 'new-synthetic-session');
    localStorage.removeItem('fixture');
    expect(storage.getItem('fixture')).toBeNull();
  });
});
