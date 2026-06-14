import { useState, useMemo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MagnifyingGlassIcon, CheckIcon, XIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useConversationsTranslation } from "@/features/conversations/i18n";
import type { FilterSheetConfig, FilterOption } from "./filter-config";

interface OptionListSheetProps {
  config: FilterSheetConfig;
  /** Overrides config.options with a dynamic list (e.g. tags from the API). */
  options?: FilterOption[];
  /** Shows a spinner instead of the list while dynamic options load. */
  loading?: boolean;
  /** Selection to restore when reopening the sheet. */
  initialSelected?: string[];
  /** Fired when the sheet finishes closing (drag-down or backdrop tap). */
  onClose: () => void;
  /** Reports the current selection to the parent on every change. */
  onApply?: (selected: string[]) => void;
}

/**
 * A native (gorhom) light bottom sheet: optional search + a selectable list.
 * Uses the inline (non-modal) BottomSheet so it renders in place above the
 * filter overlay's pills — BottomSheetModal's portal does not survive an RN
 * Modal. Mounted only while active; opens on mount, unmounts after onClose.
 */
export function OptionListSheet({
  config,
  options,
  loading = false,
  initialSelected,
  onClose,
  onApply,
}: OptionListSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useConversationsTranslation();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );
  const snapPoints = useMemo(() => ["60%"], []);

  const allOptions = options ?? config.options;

  // Display label: translated key for app enums, else a literal label
  // (dynamic data like tags), else the raw value.
  const labelOf = useCallback(
    (option: FilterOption) =>
      option.labelKey ? t(option.labelKey) : (option.label ?? option.value),
    [t],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.5}
      />
    ),
    [],
  );

  const toggle = useCallback(
    (option: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(option)) next.delete(option);
        else next.add(option);
        onApply?.(Array.from(next));
        return next;
      });
    },
    [onApply],
  );

  const filtered = useMemo(() => {
    if (!config.searchable) return allOptions;
    const q = query.trim().toLowerCase();
    return q
      ? allOptions.filter((o) => labelOf(o).toLowerCase().includes(q))
      : allOptions;
  }, [allOptions, config.searchable, query, labelOf]);

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t(config.titleKey)}</Text>

        {config.searchable && (
          <View style={styles.searchRow}>
            <MagnifyingGlassIcon size={16} color="rgba(0,0,0,0.35)" weight="regular" />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder={t("filters.search")}
              placeholderTextColor="rgba(0,0,0,0.3)"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <XIcon size={16} color="rgba(0,0,0,0.35)" weight="bold" />
              </Pressable>
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.loading}>
            <Spinner size={24} />
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>{t("filters.noResults")}</Text>
        ) : (
          filtered.map((option) => {
            const isSelected = selected.has(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => toggle(option.value)}
                style={[styles.item, isSelected && styles.itemSelected]}
              >
                <Text
                  style={[styles.itemText, isSelected && styles.itemTextSelected]}
                >
                  {labelOf(option)}
                </Text>
                {isSelected && <CheckIcon size={16} color="#fff" weight="bold" />}
              </Pressable>
            );
          })
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#fff",
  },
  handleIndicator: {
    backgroundColor: "rgba(0,0,0,0.15)",
    width: 40,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },
  title: {
    color: "rgba(0,0,0,0.5)",
    fontSize: 13,
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    color: "#000",
    fontSize: 14,
    paddingVertical: 0,
  },
  item: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemSelected: {
    backgroundColor: "#111",
  },
  itemText: {
    color: "#111",
    fontSize: 14,
  },
  itemTextSelected: {
    color: "#fff",
  },
  emptyText: {
    color: "rgba(0,0,0,0.4)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  loading: {
    alignItems: "center",
    paddingVertical: 32,
  },
});
