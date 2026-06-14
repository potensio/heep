import React, { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { StorefrontIcon, TrashIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import type { KnowledgeEntry } from "../types";

type Props = {
  item: KnowledgeEntry;
  restaurantName?: string;
  onDelete: (id: string) => void;
};

type Status = "processing" | "active" | "inactive";

const STATUS_STYLES: Record<
  Status,
  { label: string; color: string; bg: string }
> = {
  processing: { label: "Processing", color: "#D97706", bg: "#FFFBEB" },
  active: { label: "Active", color: "#16A34A", bg: "#F0FDF4" },
  inactive: { label: "Inactive", color: "#6B7280", bg: "#F3F4F6" },
};

// An empty pinecone_id means the memory is still being embedded.
function statusFor(item: KnowledgeEntry): Status {
  if (!item.pineconeId) return "processing";
  return item.isActivated ? "active" : "inactive";
}

function StatusPill({ status }: { status: Status }) {
  const { label, color, bg } = STATUS_STYLES[status];
  return (
    <HStack
      className="items-center rounded-full px-3 py-1"
      style={{ gap: 6, backgroundColor: bg }}
    >
      <Box
        className="rounded-full"
        style={{ width: 6, height: 6, backgroundColor: color }}
      />
      <Text style={{ fontSize: 11, color, fontFamily: "DM-Sans-Medium" }}>
        {label}
      </Text>
    </HStack>
  );
}

export const KnowledgeCard = memo(({ item, restaurantName, onDelete }: Props) => {
  const handleDelete = useCallback(
    () => onDelete(item.id),
    [item.id, onDelete],
  );

  return (
    <VStack className="bg-white rounded-[32px] p-5 gap-4 mb-3">
      {!!restaurantName && (
        <HStack className="items-center" style={{ gap: 6 }}>
          <StorefrontIcon size={14} color="#9CA3AF" weight="regular" />
          <Text
            className="text-subtle text-xs font-normal tracking-tighter"
            numberOfLines={1}
          >
            {restaurantName}
          </Text>
        </HStack>
      )}

      <Text
        className="text-foreground text-xl font-normal tracking-tighter"
        numberOfLines={3}
      >
        {item.text.trim() || "—"}
      </Text>

      <HStack className="items-center justify-between">
        <StatusPill status={statusFor(item)} />

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
