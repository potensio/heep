import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from '../location-picker-bottom-sheet';

let mockClose: jest.Mock;

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { ScrollView, TextInput } = require('react-native');
  return {
    BottomSheetScrollView: ({ children, contentContainerStyle }: any) =>
      <ScrollView contentContainerStyle={contentContainerStyle}>{children}</ScrollView>,
    BottomSheetTextInput: React.forwardRef((props: any, ref: any) =>
      <TextInput ref={ref} testID="search-input" {...props} />
    ),
  };
});

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

  it('filters locations by search query', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByTestId, getByText, queryByText } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={null}
        onSelect={jest.fn()}
      />
    );
    await act(async () => {
      fireEvent.changeText(getByTestId('search-input'), 'villa');
    });
    expect(getByText('Villa Sunset')).toBeTruthy();
    expect(queryByText('City Loft')).toBeNull();
  });

  it('shows no results when query matches nothing', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByTestId, getByText } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={null}
        onSelect={jest.fn()}
      />
    );
    await act(async () => {
      fireEvent.changeText(getByTestId('search-input'), 'zzz');
    });
    expect(getByText('No results')).toBeTruthy();
  });
});
