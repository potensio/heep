import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import type { KnowledgeEntry } from "../types";

export type KnowledgeStatus = "processing" | "active" | "inactive";

const STATUS_STYLES: Record<
  KnowledgeStatus,
  { label: string; color: string; bg: string }
> = {
  processing: { label: "Processing", color: "#D97706", bg: "#FFFBEB" },
  active: { label: "Active", color: "#16A34A", bg: "#F0FDF4" },
  inactive: { label: "Inactive", color: "#6B7280", bg: "#F3F4F6" },
};

// An empty pinecone_id means the memory is still being embedded.
export function statusFor(item: KnowledgeEntry): KnowledgeStatus {
  if (!item.pineconeId) return "processing";
  return item.isActivated ? "active" : "inactive";
}

export function StatusPill({ status }: { status: KnowledgeStatus }) {
  const { label, color, bg } = STATUS_STYLES[status];
  return (
    <HStack
      className="items-center rounded-full px-3 py-1 self-start"
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
