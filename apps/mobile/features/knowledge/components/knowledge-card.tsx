import React, { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { TrashIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import type { KnowledgeEntry } from "../types";

type Props = {
  item: KnowledgeEntry;
  onDelete: (id: string) => void;
};

function StatusPill({ active }: { active: boolean }) {
  return (
    <HStack
      className="items-center rounded-full px-3 py-1"
      style={{ gap: 6, backgroundColor: active ? "#F0FDF4" : "#F3F4F6" }}
    >
      <Box
        className="rounded-full"
        style={{
          width: 6,
          height: 6,
          backgroundColor: active ? "#16A34A" : "#9CA3AF",
        }}
      />
      <Text
        style={{
          fontSize: 11,
          color: active ? "#16A34A" : "#6B7280",
          fontFamily: "DM-Sans-Medium",
        }}
      >
        {active ? "Active" : "Inactive"}
      </Text>
    </HStack>
  );
}

export const KnowledgeCard = memo(({ item, onDelete }: Props) => {
  const handleDelete = useCallback(
    () => onDelete(item.id),
    [item.id, onDelete],
  );

  return (
    <VStack className="bg-white rounded-[32px] p-5 gap-4 mb-3">
      <Text
        className="text-foreground text-xl font-normal tracking-tighter"
        numberOfLines={3}
      >
        {item.text.trim() || "—"}
      </Text>

      <HStack className="items-center justify-between">
        <StatusPill active={item.isActivated} />

        <Pressable
          onPress={handleDelete}
          hitSlop={8}
          className="w-9 h-9 rounded-full items-center justify-center"
        >
          <TrashIcon size={18} color="#EF4444" weight="light" />
        </Pressable>
      </HStack>
    </VStack>
  );
});

KnowledgeCard.displayName = "KnowledgeCard";
