import React, { memo, useCallback } from 'react';
import { Pressable } from 'react-native';
import { UserIcon, PauseCircleIcon, StarIcon } from 'phosphor-react-native';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { ChannelIcon } from './channel-icon';
import type { Conversation } from '../types';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

type Props = {
  item: Conversation;
  onPress: (id: string) => void;
};

export const ConversationCard = memo(({ item, onPress }: Props) => {
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <VStack className={`${item.is_heep_member ? 'bg-blue-500/5' : 'bg-white'} rounded-[32px] p-4 gap-3 mb-3`}>
        <HStack className="items-center gap-2">
          <Box className="w-14 h-14">
            {item.contact.avatar_url ? (
              <Image
                uri={item.contact.avatar_url}
                width="100%"
                height="100%"
                contentFit="cover"
                style={{ borderRadius: 28 }}
              />
            ) : (
              <Box className="w-14 h-14 rounded-full bg-[#C8D1CE] items-center justify-center">
                <UserIcon size={28} color="#8A9690" weight="light" />
              </Box>
            )}
            <Box className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm items-center justify-center">
              <ChannelIcon channel={item.channel} size={16} />
            </Box>
          </Box>

          <Text
            className="text-foreground text-2xl font-normal flex-1 tracking-tighter"
            numberOfLines={1}
          >
            {item.contact.name.trim() || '—'}
          </Text>

          <Text className="text-subtle text-lg font-normal tracking-tighter">
            {formatDate(item.last_message.sent_at)}
          </Text>
        </HStack>

        {(item.is_ai_paused || item.is_heep_member) && (
          <HStack style={{ gap: 6 }}>
            {item.is_ai_paused && (
              <HStack
                className="items-center rounded-full px-3 py-1"
                style={{ gap: 4, backgroundColor: '#FEF3C7' }}
              >
                <PauseCircleIcon size={12} color="#D97706" weight="fill" />
                <Text style={{ fontSize: 11, color: '#D97706', fontFamily: 'DM-Sans-Medium' }}>
                  AI paused
                </Text>
              </HStack>
            )}
            {item.is_heep_member && (
              <HStack
                className="items-center rounded-full px-3 py-1"
                style={{ gap: 4, backgroundColor: '#F0FDF4' }}
              >
                <StarIcon size={12} color="#16A34A" weight="fill" />
                <Text style={{ fontSize: 11, color: '#16A34A', fontFamily: 'DM-Sans-Medium' }}>
                  Heep member
                </Text>
              </HStack>
            )}
          </HStack>
        )}

        {item.last_message.text ? (
          <Text className="text-subtle text-base font-normal" numberOfLines={3}>
            {item.last_message.text}
          </Text>
        ) : null}
      </VStack>
    </Pressable>
  );
});

ConversationCard.displayName = 'ConversationCard';
