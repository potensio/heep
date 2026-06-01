import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  Animated,
} from "react-native";
import { CloseSquare } from "@solar-icons/react-native/Linear";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const AVATARS = [
  "https://media.thenightshift.dev/default-avatar/avatar-male-a.png",
  "https://media.thenightshift.dev/default-avatar/avatar-male-b.png",
  "https://media.thenightshift.dev/default-avatar/avatar-male-c.png",
  "https://media.thenightshift.dev/default-avatar/avatar-male-d.png",
  "https://media.thenightshift.dev/default-avatar/avatar-male-e.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-a.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-b.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-c.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-d.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-e.png",
];

// Preload all avatar images
export function preloadAvatars() {
  AVATARS.forEach((url) => {
    Image.prefetch(url);
  });
}

interface AvatarSelectorProps {
  value: string | null;
  onChange: (url: string) => void;
}

// Subset of avatars for inline selector (4 male, 4 female)
const SELECTOR_AVATARS = [
  ...AVATARS.slice(0, 4),  // First 4 male avatars
  ...AVATARS.slice(5, 9),  // First 4 female avatars
];

export function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  // Ensure avatars are preloaded when component mounts
  useEffect(() => {
    preloadAvatars();
  }, []);

  const renderAvatar = (url: string) => (
    <TouchableOpacity
      key={url}
      onPress={() => onChange(url)}
      activeOpacity={0.8}
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: value === url ? 3 : 4,
        borderColor: value === url ? "#155DFC" : "transparent",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={{ uri: url }}
        style={{ width: 72, height: 72 }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View className="items-center w-full px-4">
      <View className="flex-row flex-wrap justify-center gap-2">
        {SELECTOR_AVATARS.map(renderAvatar)}
      </View>
    </View>
  );
}

interface AvatarSheetContextValue {
  openAvatarSheet: (
    onSelect: (url: string) => void,
    initialAvatar?: string | null,
  ) => void;
}

const AvatarSheetContext = createContext<AvatarSheetContextValue | null>(null);

export function useAvatarSheet() {
  const context = useContext(AvatarSheetContext);
  if (!context) {
    throw new Error("useAvatarSheet must be used within AvatarSheetProvider");
  }
  return context;
}

export function AvatarSheetProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const onSelectCallback = useRef<((url: string) => void) | null>(null);
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetTranslateY] = useState(() => new Animated.Value(300));

  const openAvatarSheet = useCallback(
    (onSelect: (url: string) => void, initialAvatar?: string | null) => {
      setSelectedAvatar(initialAvatar ?? null);
      onSelectCallback.current = onSelect;
      setVisible(true);

      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    },
    [backdropOpacity, sheetTranslateY],
  );

  const handleClose = useCallback(() => {
    // Animate out
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [backdropOpacity, sheetTranslateY]);

  const handleSelect = useCallback(
    (url: string) => {
      setSelectedAvatar(url);
      if (onSelectCallback.current) {
        onSelectCallback.current(url);
      }
      handleClose();
    },
    [handleClose],
  );

  return (
    <AvatarSheetContext.Provider value={{ openAvatarSheet }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        {/* Backdrop - fades in */}
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "black",
            opacity: backdropOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          }}
        >
          <Pressable className="flex-1" onPress={handleClose} />
        </Animated.View>

        {/* Sheet - slides up from bottom */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <View
            className="bg-white rounded-t-3xl"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row justify-between items-center border-b border-gray-200 pb-3 px-5 mb-4">
              <Text className="text-2xl font-heading font-medium text-gray-900">
                Pilih Avatar
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <CloseSquare size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Avatar Grid */}
            <View className="px-5">
              <View className="items-center">
                {/* Row 1: 3 avatars */}
                <View className="flex-row gap-3 mb-3 justify-center">
                  {AVATARS.slice(0, 3).map((url) => (
                    <TouchableOpacity
                      key={url}
                      onPress={() => handleSelect(url)}
                      activeOpacity={0.8}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        borderWidth: selectedAvatar === url ? 3 : 2,
                        borderColor: selectedAvatar === url ? "#155DFC" : "#D1D5DB",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={{ width: 80, height: 80 }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 2: 2 avatars (centered) */}
                <View className="flex-row gap-3 mb-3 justify-center">
                  {AVATARS.slice(3, 5).map((url) => (
                    <TouchableOpacity
                      key={url}
                      onPress={() => handleSelect(url)}
                      activeOpacity={0.8}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        borderWidth: selectedAvatar === url ? 3 : 2,
                        borderColor: selectedAvatar === url ? "#155DFC" : "#D1D5DB",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={{ width: 80, height: 80 }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 3: 3 avatars */}
                <View className="flex-row gap-3 mb-3 justify-center">
                  {AVATARS.slice(5, 8).map((url) => (
                    <TouchableOpacity
                      key={url}
                      onPress={() => handleSelect(url)}
                      activeOpacity={0.8}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        borderWidth: selectedAvatar === url ? 3 : 2,
                        borderColor: selectedAvatar === url ? "#155DFC" : "#D1D5DB",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={{ width: 80, height: 80 }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 4: 2 avatars (centered) */}
                <View className="flex-row gap-3 justify-center">
                  {AVATARS.slice(8, 10).map((url) => (
                    <TouchableOpacity
                      key={url}
                      onPress={() => handleSelect(url)}
                      activeOpacity={0.8}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        borderWidth: selectedAvatar === url ? 3 : 2,
                        borderColor: selectedAvatar === url ? "#155DFC" : "#D1D5DB",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={{ width: 80, height: 80 }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </AvatarSheetContext.Provider>
  );
}
