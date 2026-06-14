import { forwardRef, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MapPinIcon, TrashIcon } from "phosphor-react-native";
import { BottomSheet, BottomSheetRef } from "@/components/ui/bottom-sheet";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { StatusPill, statusFor } from "./knowledge-status";
import type { KnowledgeEntry } from "../types";

export type KnowledgeDetailBottomSheetRef = BottomSheetRef;

interface KnowledgeDetailBottomSheetProps {
  entry: KnowledgeEntry | null;
  restaurantName?: string;
  onDelete: (id: string) => void;
}

export const KnowledgeDetailBottomSheet = forwardRef<
  KnowledgeDetailBottomSheetRef,
  KnowledgeDetailBottomSheetProps
>(({ entry, restaurantName, onDelete }, ref) => {
  const sheetRef = useRef<BottomSheetRef>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  return (
    <BottomSheet ref={sheetRef} snapPoints={["50%"]}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        {entry && (
          <>
            {!!restaurantName && (
              <HStack className="items-center" style={{ gap: 8 }}>
                <View style={styles.pinBadge}>
                  <MapPinIcon size={14} color="#000" weight="fill" />
                </View>
                <Text style={styles.restaurant} numberOfLines={1}>
                  {restaurantName}
                </Text>
              </HStack>
            )}

            <StatusPill status={statusFor(entry)} />

            <Text style={styles.body}>{entry.text.trim() || "—"}</Text>

            <Pressable
              onPress={() => onDelete(entry.id)}
              style={styles.deleteButton}
            >
              <TrashIcon size={18} color="#F87171" weight="regular" />
              <Text style={styles.deleteText}>Delete from memory</Text>
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

KnowledgeDetailBottomSheet.displayName = "KnowledgeDetailBottomSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurant: {
    flex: 1,
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  body: {
    color: "#fff",
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: "rgba(248,113,113,0.12)",
  },
  deleteText: {
    color: "#F87171",
    fontSize: 15,
    fontFamily: "DM-Sans-Medium",
  },
});
