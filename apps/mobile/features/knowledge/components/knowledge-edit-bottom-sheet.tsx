import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheet, BottomSheetRef } from "@/components/ui/bottom-sheet";
import { Text } from "@/components/ui/text";

export type KnowledgeEditBottomSheetRef = BottomSheetRef;

interface KnowledgeEditBottomSheetProps {
  onSave: (text: string) => void;
}

export const KnowledgeEditBottomSheet = forwardRef<
  KnowledgeEditBottomSheetRef,
  KnowledgeEditBottomSheetProps
>(({ onSave }, ref) => {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [text, setText] = useState("");

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  const handleSave = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setText("");
    sheetRef.current?.close();
  }, [text, onSave]);

  const canSave = text.trim().length > 0;

  return (
    <BottomSheet ref={sheetRef} snapPoints={["48%"]}>
      <BottomSheetView style={styles.container}>
        <Text style={styles.label}>Add to memory</Text>

        <BottomSheetTextInput
          style={styles.input}
          placeholder="Do you have an outdoor seating?"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
          autoFocus
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
});

KnowledgeEditBottomSheet.displayName = "KnowledgeEditBottomSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  label: {
    color: "#fff",
    fontSize: 13,
  },
  input: {
    minHeight: 160,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: "#fff",
    fontSize: 18,
    lineHeight: 24,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "DM-Sans-Medium",
  },
});
