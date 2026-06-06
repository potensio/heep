import { renderHook, waitFor } from '@testing-library/react-native';
import { InteractionManager } from 'react-native';
import { useScreenData } from '../useScreenData';

jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((cb: any) => {
  cb?.();
  return { cancel: jest.fn(), then: jest.fn(), done: jest.fn() };
});

describe('useScreenData', () => {
  it('starts with null data and loading true', async () => {
    const fetcher = jest.fn(() => new Promise(() => {})); // never resolves
    const { result } = await renderHook(() => useScreenData(fetcher));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('populates data after interactions', async () => {
    const { result } = await renderHook(() =>
      useScreenData(() => Promise.resolve('loaded'))
    );
    await waitFor(() => expect(result.current.data).toBe('loaded'));
  });

  it('sets loading to false after data loads', async () => {
    const { result } = await renderHook(() =>
      useScreenData(() => Promise.resolve('done'))
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('captures errors', async () => {
    const { result } = await renderHook(() =>
      useScreenData(() => Promise.reject(new Error('boom')))
    );
    await waitFor(() => expect(result.current.error?.message).toBe('boom'));
  });
});
