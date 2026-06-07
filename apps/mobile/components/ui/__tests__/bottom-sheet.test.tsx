import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BottomSheet, BottomSheetRef } from '../bottom-sheet';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  return {
    BottomSheetModal: React.forwardRef(({ children }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        present: jest.fn(),
        dismiss: jest.fn(),
      }));
      return children ?? null;
    }),
    useBottomSheetSpringConfigs: () => ({}),
  };
});

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

describe('BottomSheet', () => {
  it('renders children', async () => {
    const ref = React.createRef<BottomSheetRef>();
    const { getByText } = await render(
      <BottomSheet ref={ref}>
        <Text>Hello</Text>
      </BottomSheet>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('exposes open and close via ref', async () => {
    const ref = React.createRef<BottomSheetRef>();
    await render(
      <BottomSheet ref={ref}>
        <Text>Content</Text>
      </BottomSheet>
    );
    expect(typeof ref.current?.open).toBe('function');
    expect(typeof ref.current?.close).toBe('function');
  });
});
