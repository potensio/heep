import { View, Text, Image } from "react-native";
import type { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  if (message.image) {
    return (
      <View
        className={`max-w-[70%] ${isCurrentUser ? "self-end" : "self-start"}`}
      >
        <Image
          source={{ uri: message.image }}
          className="w-48 h-36 rounded-2xl"
          resizeMode="cover"
        />
        {message.text && (
          <Text className="text-sm mt-1 text-neutral-800">{message.text}</Text>
        )}
      </View>
    );
  }

  return (
    <View
      className={`max-w-[75%] ${isCurrentUser ? "self-end" : "self-start"}`}
    >
      <View
        className={`px-4 py-3 rounded-2xl ${
          isCurrentUser
            ? "bg-black rounded-br-[0px]"
            : "bg-accent-orange rounded-bl-[0px]"
        }`}
      >
        <Text
          className={`text-base ${isCurrentUser ? "text-white" : "text-white"}`}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}
