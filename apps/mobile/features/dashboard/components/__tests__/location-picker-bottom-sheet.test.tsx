import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from '../location-picker-bottom-sheet';

let mockClose: jest.Mock;

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetView: ({ children, style }: any) => children ?? null,
}));

jest.mock('@/components/ui/bottom-sheet', () => {
  const React = require('react');
  return {
    BottomSheet: React.forwardRef(({ children }: any, ref: any) => {
      mockClose = jest.fn();
      React.useImperativeHandle(ref, () => ({
        open: jest.fn(),
        close: mockClose,
      }));
      return children ?? null;
    }),
  };
});

describe('LocationPickerBottomSheet', () => {
  const locations = ['Villa Sunset', 'City Loft'];

  it('renders all location buttons', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByText } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={null}
        onSelect={jest.fn()}
      />
    );
    expect(getByText('Villa Sunset')).toBeTruthy();
    expect(getByText('City Loft')).toBeTruthy();
  });

  it('calls onSelect with the tapped location and closes the sheet', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const onSelect = jest.fn();
    const { getByText } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={null}
        onSelect={onSelect}
      />
    );
    fireEvent.press(getByText('Villa Sunset'));
    expect(onSelect).toHaveBeenCalledWith('Villa Sunset');
    expect(mockClose).toHaveBeenCalled();
  });

  it('renders selected location with white background', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByTestId } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation="Villa Sunset"
        onSelect={jest.fn()}
      />
    );
    const selectedItem = getByTestId('location-item-Villa Sunset');
    expect(selectedItem.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#fff' }),
      ])
    );
  });
});
