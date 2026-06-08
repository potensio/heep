import React, { memo, useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserIcon, CaretLeftIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { List } from "@/components/ui/list";

type Message = {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
};

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "them",
    text: "Hey! I just arrived at the villa. The place is absolutely amazing!",
    time: "10:02",
  },
  {
    id: "2",
    sender: "me",
    text: "Welcome, Mathis! So glad you love it. Don't hesitate to reach out if you need anything at all.",
    time: "10:03",
  },
  {
    id: "3",
    sender: "them",
    text: "Quick question — what's the WiFi password?",
    time: "10:05",
  },
  {
    id: "4",
    sender: "me",
    text: 'Of course! The network is "VillaSunset_5G" and the password is "sunset2025". Let me know if you have trouble connecting.',
    time: "10:05",
  },
  {
    id: "5",
    sender: "them",
    text: "Perfect, thanks! Is there a supermarket nearby?",
    time: "10:18",
  },
  {
    id: "6",
    sender: "me",
    text: "Yes! There's a Carrefour about 5 minutes away by car on Rue de la République. There's also a smaller convenience store just a 2-minute walk.",
    time: "10:19",
  },
  {
    id: "7",
    sender: "them",
    text: "Great, will check it out. One more thing — can we get a late checkout? We're planning a trip Sunday morning.",
    time: "14:32",
  },
  {
    id: "8",
    sender: "me",
    text: "I'll check on that for you! What time were you thinking? We can usually accommodate up to 12:00 PM.",
    time: "14:33",
  },
  {
    id: "9",
    sender: "them",
    text: "Around 1pm would be perfect if possible 🙏",
    time: "14:35",
  },
];

type MessageBubbleProps = {
  message: Message;
};

const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const isMe = message.sender === "me";
  return (
    <Box className={`px-4 mb-2 ${isMe ? "items-end" : "items-start"}`}>
      <Box
        className={`rounded-[20px] px-4 py-3 max-w-[78%] ${
          isMe ? "bg-[#4A6660]" : "bg-white"
        }`}
        style={{
          borderBottomRightRadius: isMe ? 4 : 20,
          borderBottomLeftRadius: isMe ? 20 : 4,
        }}
      >
        <Text
          className={`text-sm leading-5 ${
            isMe ? "text-white" : "text-foreground"
          }`}
        >
          {message.text}
        </Text>
      </Box>
      <Text className="text-muted text-xs mt-1 px-1">{message.time}</Text>
    </Box>
  );
});

MessageBubble.displayName = "MessageBubble";

type ConversationDetailScreenProps = {
  name?: string;
  phone?: string;
};

export default function ConversationDetailScreen({
  name = "Mathis Vella",
  phone = "+33 7 78 56 61 00",
}: ConversationDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [aiPaused, setAiPaused] = useState(false);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    const newMsg: Message = {
      id: String(Date.now()),
      sender: "me",
      text: message.trim(),
      time: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");
  }, [message]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background-muted"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <HStack className="items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <HStack className="items-center" style={{ gap: 4 }}>
            <CaretLeftIcon size={20} />
            <Text className="text-base text-foreground">Back</Text>
          </HStack>
        </Pressable>
        <Text className="text-base text-subtle">Details</Text>
      </HStack>

      {/* Separator */}
      <Box className="h-px bg-outline-200 mx-0" />

      {/* Contact Card */}
      <Box className="border-b border-border/10 px-4 py-4">
        <HStack className="items-center justify-between">
          <HStack className="items-center flex-1" style={{ gap: 12 }}>
            <Box className="w-12 h-12 rounded-full bg-[#C8D1CE] items-center justify-center">
              <UserIcon size={24} color="#8A9690" weight="light" />
            </Box>
            <VStack style={{ gap: 2 }}>
              <Text className="text-foreground text-lg font-medium tracking-tight">
                {name}
              </Text>
              <Text className="text-muted text-sm">{phone}</Text>
            </VStack>
          </HStack>
          <HStack style={{ gap: 8 }}>
            <Pressable>
              <Box className="p-2 rounded-full border border-outline-200 bg-white">
                <Text className="text-subtle text-[10px]">Translate</Text>
              </Box>
            </Pressable>
          </HStack>
        </HStack>
      </Box>

      {/* Messages */}
      <Box className="flex-1">
        <List
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          estimatedItemSize={72}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      </Box>

      {/* Bottom Area */}
      <VStack
        className="rounded-t-2xl"
        style={{ paddingBottom: keyboardVisible ? 8 : insets.bottom + 8 }}
      >
        {/* Pause AI Wrapper - transparent */}
        <Box className="mx-4">
          <HStack className="items-center justify-between bg-teal-100 rounded-t-2xl px-4 py-2">
            <Text className="text-xs tracking-tighter">
              Pause AI on this conversation
            </Text>
            <Pressable onPress={() => setAiPaused(!aiPaused)}>
              <Text
                className={`text-xs font-medium ${aiPaused ? "text-teal-600" : "text-red-500"}`}
              >
                {aiPaused ? "Turn on" : "Turn off"}
              </Text>
            </Pressable>
          </HStack>
        </Box>

        {/* Input Container */}
        <Box className="bg-white pt-3 border border-border/10 rounded-t-2xl">
          {/* Input Row */}
          <Box className="mx-4 mb-3">
            <HStack
              className="items-center border border-border/30 bg-background-muted rounded-2xl px-4"
              style={{ gap: 8, minHeight: 44 }}
            >
              <TextInput
                className="flex-1 text-base text-foreground py-3"
                placeholder="Send a message"
                placeholderTextColor="#9BA5A0"
                value={message}
                onChangeText={setMessage}
                multiline
                style={{ fontFamily: "DM-Sans" }}
              />
            </HStack>
          </Box>
        </Box>
      </VStack>
    </KeyboardAvoidingView>
  );
}
