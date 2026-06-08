import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from '../location-picker-bottom-sheet';
import type { Location } from '../../types';

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
  const locations: Location[] = [
    { id: '1', name: 'Villa Sunset' },
    { id: '2', name: 'City Loft' },
  ];

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
    expect(onSelect).toHaveBeenCalledWith(locations[0]);
    expect(mockClose).toHaveBeenCalled();
  });

  it('renders selected location with white background', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByTestId } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={locations[0]}
        onSelect={jest.fn()}
      />
    );
    const selectedItem = getByTestId('location-item-1');
    expect(selectedItem.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#fff' }),
      ])
    );
  });

  it('shows check icon next to selected location', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByTestId, queryByTestId } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={locations[0]}
        onSelect={jest.fn()}
      />
    );
    expect(getByTestId('check-icon-1')).toBeTruthy();
    expect(queryByTestId('check-icon-2')).toBeNull();
  });

  it('shows clear button when a location is selected and onClear is provided', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByTestId } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={locations[0]}
        onSelect={jest.fn()}
        onClear={jest.fn()}
      />
    );
    expect(getByTestId('clear-button')).toBeTruthy();
  });

  it('calls onClear and closes sheet when clear button is pressed', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const onClear = jest.fn();
    const { getByTestId } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={locations[0]}
        onSelect={jest.fn()}
        onClear={onClear}
      />
    );
    fireEvent.press(getByTestId('clear-button'));
    expect(onClear).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('does not show clear button when no location is selected', async () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { queryByTestId } = await render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={null}
        onSelect={jest.fn()}
        onClear={jest.fn()}
      />
    );
    expect(queryByTestId('clear-button')).toBeNull();
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
