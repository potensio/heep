import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { AccountSection } from '../account-section';
import * as useAuthHooks from '@/features/auth/hooks/use-auth';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock('@/features/auth/hooks/use-auth', () => ({
  useLogout: jest.fn(() => jest.fn()),
  useCurrentUser: jest.fn(),
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  avatar_url: null,
  profile_completed: true,
  bubble_token: null,
};

describe('AccountSection', () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (useAuthHooks.useCurrentUser as jest.Mock).mockReturnValue(mockUser);
  });

  it('renders profile fields from current user', async () => {
    const { getByDisplayValue } = await render(<AccountSection />);
    expect(getByDisplayValue('Ada')).toBeTruthy();
    expect(getByDisplayValue('Lovelace')).toBeTruthy();
    expect(getByDisplayValue('test@example.com')).toBeTruthy();
  });

  it('renders empty strings when user is null', async () => {
    (useAuthHooks.useCurrentUser as jest.Mock).mockReturnValue(null);
    const { getAllByDisplayValue } = await render(<AccountSection />);
    expect(getAllByDisplayValue('')).toHaveLength(3);
  });

  it('renders delete account button', async () => {
    const { getByText } = await render(<AccountSection />);
    expect(getByText('Delete my account')).toBeTruthy();
  });
});
