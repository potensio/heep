import { FlatList, FlatListProps } from "react-native";

type ListProps<T> = Omit<FlatListProps<T>, "estimatedItemSize"> & {
  estimatedItemSize?: number;
};

export function List<T>({ estimatedItemSize: _, ...props }: ListProps<T>) {
  return <FlatList<T> {...(props as any)} />;
}
