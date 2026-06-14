import React, { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { MapPinIcon, QuotesIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { StatusPill, statusFor } from "./knowledge-status";
import type { KnowledgeEntry } from "../types";

type Props = {
  item: KnowledgeEntry;
  restaurantName?: string;
  onPress: (item: KnowledgeEntry) => void;
};

export const KnowledgeCard = memo(({ item, restaurantName, onPress }: Props) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <VStack className="bg-white rounded-[32px] p-5 gap-3 mb-3">
        {/* Restaurant: pin badge + name */}
        {!!restaurantName && (
          <HStack className="items-center" style={{ gap: 8 }}>
            <Box className="w-7 h-7 rounded-full bg-foreground items-center justify-center">
              <MapPinIcon size={14} color="#fff" weight="fill" />
            </Box>
            <Text
              className="text-subtle text-sm font-normal tracking-tighter flex-1"
              numberOfLines={1}
            >
              {restaurantName}
            </Text>
          </HStack>
        )}

        {/* The fact, framed as a remembered quote */}
        <VStack style={{ gap: 2 }}>
          <QuotesIcon size={20} color="#C8D1CE" weight="fill" />
          <Text
            className="text-foreground text-lg font-normal tracking-tighter"
            numberOfLines={4}
          >
            {item.text.trim() || "—"}
          </Text>
        </VStack>

        <StatusPill status={statusFor(item)} />
      </VStack>
    </Pressable>
  );
});

KnowledgeCard.displayName = "KnowledgeCard";
