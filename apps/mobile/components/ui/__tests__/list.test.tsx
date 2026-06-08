import React, { memo } from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { List } from '../list';

const Item = memo(function Item({ label }: { label: string }) {
  return <Text testID={`item-${label}`}>{label}</Text>;
});

describe('List', () => {
  const data = [
    { id: '1', label: 'Apple' },
    { id: '2', label: 'Banana' },
  ];

  it('renders all items', async () => {
    const { getByTestId } = await render(
      <List
        data={data}
        renderItem={({ item }) => <Item label={item.label} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
      />
    );

    expect(getByTestId('item-Apple')).toBeTruthy();
    expect(getByTestId('item-Banana')).toBeTruthy();
  });

  it('accepts estimatedItemSize as optional prop', async () => {
    const { getByTestId } = await render(
      <List
        data={[{ id: '1', label: 'Test' }]}
        renderItem={({ item }) => <Item label={item.label} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
      />
    );
    expect(getByTestId('item-Test')).toBeTruthy();
  });
});
