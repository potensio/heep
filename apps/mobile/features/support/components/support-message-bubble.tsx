import React, { memo } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import type { SupportMessage } from "../types";

type Props = {
  message: SupportMessage;
};

export const SupportMessageBubble = memo(({ message }: Props) => {
  // The app user's own messages sit on the right; the Heep support team's
  // replies sit on the left.
  const isMine = message.sent_by === "user";
  const time = message.sent_at
    ? new Date(message.sent_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Box className={`px-4 mb-2 ${isMine ? "items-end" : "items-start"}`}>
      <Box
        className={`rounded-[20px] px-4 py-3 max-w-[78%] ${isMine ? "bg-[#4A6660]" : "bg-white"}`}
        style={{
          borderBottomRightRadius: isMine ? 4 : 20,
          borderBottomLeftRadius: isMine ? 20 : 4,
        }}
      >
        <Text className={`text-sm leading-5 ${isMine ? "text-white" : "text-foreground"}`}>
          {message.text}
        </Text>
      </Box>
      <Text className="text-muted text-xs mt-1 px-1">{time}</Text>
    </Box>
  );
});

SupportMessageBubble.displayName = "SupportMessageBubble";
