import React from 'react';
import { render } from '@testing-library/react-native';
import { Image } from '../image';

jest.mock('expo-image', () => ({
  Image: ({ testID, source, placeholder, cachePolicy, transition, contentFit, style }: any) => {
    const { View } = require('react-native');
    return (
      <View
        testID={testID}
        accessibilityLabel={JSON.stringify({ source, placeholder, cachePolicy, transition, contentFit })}
        style={style}
      />
    );
  },
}));

describe('Image', () => {
  it('renders with required uri', async () => {
    const { getByTestId } = await render(
      <Image uri="https://example.com/img.jpg" testID="img" />
    );
    expect(getByTestId('img')).toBeTruthy();
  });

  it('sets memory-disk cache policy', async () => {
    const { getByTestId } = await render(
      <Image uri="https://example.com/img.jpg" testID="img" />
    );
    const props = JSON.parse(getByTestId('img').props.accessibilityLabel);
    expect(props.cachePolicy).toBe('memory-disk');
  });

  it('sets blurhash placeholder when provided', async () => {
    const hash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
    const { getByTestId } = await render(
      <Image uri="https://example.com/img.jpg" blurhash={hash} testID="img" />
    );
    const props = JSON.parse(getByTestId('img').props.accessibilityLabel);
    expect(props.placeholder).toEqual({ blurhash: hash });
  });

  it('defaults contentFit to cover', async () => {
    const { getByTestId } = await render(
      <Image uri="https://example.com/img.jpg" testID="img" />
    );
    const props = JSON.parse(getByTestId('img').props.accessibilityLabel);
    expect(props.contentFit).toBe('cover');
  });
});
