export const createMMKV = jest.fn().mockImplementation(() => {
  const store = new Map<string, string | number | boolean>();
  return {
    set: (key: string, value: string | number | boolean) => store.set(key, value),
    getString: (key: string) => store.get(key) as string | undefined,
    getNumber: (key: string) => store.get(key) as number | undefined,
    getBoolean: (key: string) => store.get(key) as boolean | undefined,
    remove: (key: string) => store.delete(key),
    contains: (key: string) => store.has(key),
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => store.clear(),
  };
});
