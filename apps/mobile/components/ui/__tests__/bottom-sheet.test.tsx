import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BottomSheet, BottomSheetRef } from '../bottom-sheet';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

const mockClose = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  return {
    BottomSheetModal: React.forwardRef(({ children, backdropComponent }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        present: jest.fn(),
        dismiss: jest.fn(),
      }));
      const backdrop = backdropComponent?.({
        animatedIndex: { value: 0 },
        style: {},
        animatedPosition: { value: 0 },
      });
      return <>{backdrop}{children ?? null}</>;
    }),
    useBottomSheetTimingConfigs: () => ({}),
    useBottomSheet: () => ({ close: mockClose }),
  };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: React.forwardRef((props: any, ref: any) => <View ref={ref} {...props} />),
  };
});

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

  it('closes when backdrop is pressed', async () => {
    const ref = React.createRef<BottomSheetRef>();
    const { getByTestId } = await render(
      <BottomSheet ref={ref}>
        <Text>Content</Text>
      </BottomSheet>
    );
    fireEvent.press(getByTestId('bottom-sheet-backdrop'));
    expect(mockClose).toHaveBeenCalled();
  });
});
