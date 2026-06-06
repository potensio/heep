import { FlashList, FlashListProps } from "@shopify/flash-list";

type PerformantListProps<T> = Omit<FlashListProps<T>, "estimatedItemSize"> & {
  estimatedItemSize: number;
};

export function PerformantList<T>({
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
