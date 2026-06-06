import { FlashList, FlashListProps } from "@shopify/flash-list";

type ListProps<T> = Omit<FlashListProps<T>, "estimatedItemSize"> & {
  estimatedItemSize: number;
};

export function List<T>({
  estimatedItemSize,
  ...props
}: PerformantListProps<T>) {
  return (
    <FlashList<T>
      estimatedItemSize={estimatedItemSize}
      {...(props as any)}
    />
  );
}
