import { spring, timing, fadeIn, fadeOut } from '../animations';

jest.mock('react-native-reanimated', () => ({
  withSpring: jest.fn((value: number, config: object) => ({ type: 'spring', value, config })),
  withTiming: jest.fn((value: number, config: object) => ({ type: 'timing', value, config })),
  Easing: {
    bezier: jest.fn(() => 'bezier-fn'),
  },
}));

describe('animation presets', () => {
  it('spring returns a spring animation to target value', () => {
    const result = spring(1) as any;
    expect(result.type).toBe('spring');
    expect(result.value).toBe(1);
  });

  it('spring uses damping 20 and stiffness 200', () => {
    const result = spring(1) as any;
    expect(result.config.damping).toBe(20);
    expect(result.config.stiffness).toBe(200);
  });

  it('timing returns a timing animation with 250ms default', () => {
    const result = timing(1) as any;
    expect(result.type).toBe('timing');
    expect(result.config.duration).toBe(250);
  });

  it('timing accepts custom duration', () => {
    const result = timing(1, 400) as any;
    expect(result.config.duration).toBe(400);
  });

  it('fadeIn animates opacity to 1', () => {
    const result = fadeIn() as any;
    expect(result.value).toBe(1);
  });

  it('fadeOut animates opacity to 0', () => {
    const result = fadeOut() as any;
    expect(result.value).toBe(0);
  });
});
