import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { AccountSection } from '../account-section';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

describe('AccountSection', () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  });

  it('renders profile fields', async () => {
    const { getByText } = await render(<AccountSection />);
    expect(getByText('Hanif')).toBeTruthy();
    expect(getByText('Yaskur')).toBeTruthy();
    expect(getByText('hanifyaskur@gmail.com')).toBeTruthy();
  });

  it('calls router.replace with /auth on log out press', async () => {
    const { getByText } = await render(<AccountSection />);
    fireEvent.press(getByText('Log out'));
    expect(mockReplace).toHaveBeenCalledWith('/auth');
  });

  it('renders delete account button', async () => {
    const { getByText } = await render(<AccountSection />);
    expect(getByText('Delete my account')).toBeTruthy();
  });
});
