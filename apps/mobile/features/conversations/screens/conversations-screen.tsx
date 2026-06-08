import { useRef, useState, useCallback, useDeferredValue, startTransition } from 'react';
import { Pressable } from 'react-native';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon, FunnelSimpleIcon, CaretRightIcon } from 'phosphor-react-native';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { List } from '@/components/ui/list';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from '@/features/dashboard/components/location-picker-bottom-sheet';
import { useLocations } from '@/features/dashboard/hooks/use-locations';
import { useConversations } from '../hooks/use-conversations';
import { useConversationsSocket } from '../hooks/use-conversations-socket';
import { ConversationCard } from '../components/conversation-card';
import type { Conversation } from '../types';
import type { Location } from '@/features/dashboard/types';

export default function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColor();

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const locationSheetRef = useRef<LocationPickerBottomSheetRef>(null);
  const { data: locations = [] } = useLocations();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  useConversationsSocket();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useConversations();

  const allConversations = Array.from(
    new Map(
      (data?.pages.flatMap((p) => p.data) ?? []).map((c) => [c.id, c]),
    ).values(),
  );

  const filtered = deferredSearch.trim()
    ? allConversations.filter((c) =>
        c.contact.name.toLowerCase().includes(deferredSearch.toLowerCase()),
      )
    : allConversations;

  const handlePress = useCallback((id: string) => router.push(`/conversation/${id}`), [router]);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <List
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={120}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            <Text className="font-extralight text-2xl mb-4 tracking-tighter">
              View conversations
            </Text>

            <HStack className="items-center justify-between mb-6" style={{ gap: 16 }}>
              <Pressable onPress={() => locationSheetRef.current?.open()}>
                <HStack
                  className={`items-center px-6 py-4 rounded-full ${selectedLocation ? 'bg-foreground' : 'bg-white'}`}
                  style={{ gap: 12 }}
                >
                  <Text className={`text-xs ${selectedLocation ? 'text-background' : 'text-foreground'}`}>
                    {selectedLocation?.name ?? 'Select a location'}
                  </Text>
                  <CaretRightIcon size={16} color={selectedLocation ? '#fff' : '#000'} />
                </HStack>
              </Pressable>

              <Pressable>
                <HStack className="items-center bg-white/75 rounded-full p-1" style={{ gap: 10 }}>
                  <Box className="w-14 h-14 rounded-[1000px] bg-background-error/10 items-center justify-center">
                    <FunnelSimpleIcon size={20} color="#FB2C36" />
                  </Box>
                  <HStack className="items-center px-6 py-4 rounded-full bg-white" style={{ gap: 12 }}>
                    <Text className="text-xs text-foreground">Filters</Text>
                  </HStack>
                </HStack>
              </Pressable>
            </HStack>

            <Box className="mb-6">
              <Input variant="rounded" size="xl" className="bg-foreground/5 border-0">
                <InputSlot className="pl-0">
                  <MagnifyingGlassIcon size={18} color={colors.foregroundMuted} />
                </InputSlot>
                <InputField
                  placeholder="Search"
                  className="pl-2"
                  value={search}
                  onChangeText={(v) => startTransition(() => setSearch(v))}
                />
              </Input>
            </Box>

            {isLoading && (
              <Box className="items-center py-12">
                <Spinner size={32} />
              </Box>
            )}
            {isError && (
              <Text className="text-red-500 text-sm text-center py-8">Failed to load conversations</Text>
            )}
          </>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <Box className="items-center py-4">
              <Spinner size={20} />
            </Box>
          ) : null
        }
      />

      <LocationPickerBottomSheet
        ref={locationSheetRef}
        locations={locations}
        selectedLocation={selectedLocation}
        onSelect={setSelectedLocation}
        onClear={() => setSelectedLocation(null)}
      />
    </Box>
  );
}
