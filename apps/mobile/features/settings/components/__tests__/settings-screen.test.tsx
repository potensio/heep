import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import SettingsScreen from '../../screens/settings-screen';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn() });
  });

  it('renders the Settings title', async () => {
    const { getByText } = await render(<SettingsScreen />);
    expect(getByText('Settings')).toBeTruthy();
  });

  it('shows AccountSection by default', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('account-section')).toBeTruthy();
  });

  it('switches to NotificationsSection when Notifications tab is pressed', async () => {
    const { getByTestId, queryByTestId } = await render(<SettingsScreen />);
    await fireEvent.press(getByTestId('tab-notifications'));
    expect(queryByTestId('account-section')).toBeNull();
    expect(getByTestId('notifications-section')).toBeTruthy();
  });

  it('switches to ActivationSection when Activation tab is pressed', async () => {
    const { getByTestId, queryByTestId } = await render(<SettingsScreen />);
    await fireEvent.press(getByTestId('tab-activation'));
    expect(queryByTestId('account-section')).toBeNull();
    expect(getByTestId('activation-section')).toBeTruthy();
  });

  it('switches back to AccountSection when Account tab is pressed', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    await fireEvent.press(getByTestId('tab-notifications'));
    await fireEvent.press(getByTestId('tab-account'));
    expect(getByTestId('account-section')).toBeTruthy();
  });
});
