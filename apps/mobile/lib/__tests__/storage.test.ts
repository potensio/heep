import { storage } from '../storage';

describe('storage', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('writes and reads a string synchronously', () => {
    storage.set('key', 'value');
    expect(storage.getString('key')).toBe('value');
  });

  it('returns undefined for missing key', () => {
    expect(storage.getString('missing')).toBeUndefined();
  });

  it('removes a key', () => {
    storage.set('key', 'value');
    storage.remove('key');
    expect(storage.contains('key')).toBe(false);
  });
});
