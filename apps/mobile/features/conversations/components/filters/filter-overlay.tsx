import { useEffect, useState, useCallback } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { XIcon } from "phosphor-react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import {
  FILTERS,
  COMBO_FILTERS,
  CHANNEL_FILTERS,
  PLATFORM_VALUES,
  type FilterDef,
  type ActiveFilters,
} from "./filter-config";
import { FilterPill } from "./filter-pill";
import { OptionListSheet } from "./option-list-sheet";
import { usePopIn } from "./use-pop-in";
import { useConversationsTranslation } from "@/features/conversations/i18n";
import { useFilterTags } from "@/features/conversations/hooks/use-filter-tags";

interface FilterOverlayProps {
  visible: boolean;
  onClose: () => void;
  /** Commits the selected filters (Apply). */
  onApply?: (filters: ActiveFilters) => void;
}

/**
 * Fullscreen filter popup: a dimmed/blurred backdrop with a staggered cascade
 * of filter pills. Channel pills toggle selection; combo pills with a `sheet`
 * config open a light sub-sheet that layers on top.
 */
export function FilterOverlay({ visible, onClose, onApply }: FilterOverlayProps) {
  const { t } = useConversationsTranslation();
  // Tags are fetched lazily once the overlay is on screen.
  const { data: tags, isLoading: tagsLoading } = useFilterTags(visible);
  const [render, setRender] = useState(visible);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeSheetKey, setActiveSheetKey] = useState<string | null>(null);
  // Per-sheet selections (Tag/Priority/Conversations), lifted so the combo
  // pills can show a count badge and Apply can aggregate everything.
  const [sheetSelections, setSheetSelections] = useState<
    Record<string, string[]>
  >({});
  const backdrop = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setRender(true);
      backdrop.value = withTiming(1, { duration: 220 });
    } else {
      backdrop.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setRender)(false);
      });
    }
  }, [visible, backdrop]);

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handlePillPress = useCallback(
    (filter: FilterDef) => {
      if (filter.sheet) setActiveSheetKey(filter.key);
      else toggle(filter.key);
    },
    [toggle],
  );

  const handleSheetApply = useCallback((key: string, options: string[]) => {
    setSheetSelections((prev) => ({ ...prev, [key]: options }));
  }, []);

  const handleApply = useCallback(() => {
    const platform = [...selected]
      .map((k) => PLATFORM_VALUES[k])
      .filter(Boolean);
    onApply?.({
      platform,
      priority: sheetSelections["priority"] ?? [],
      tags: sheetSelections["tag"] ?? [],
      isSpam: selected.has("spam"),
      isArchived: selected.has("archived"),
    });
    onClose();
  }, [onApply, onClose, selected, sheetSelections]);

  const handleCancel = useCallback(() => onClose(), [onClose]);

  const handleReset = useCallback(() => {
    setSelected(new Set());
    setSheetSelections({});
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  const activeFilter = FILTERS.find((f) => f.key === activeSheetKey);
  const totalCount =
    selected.size + Object.values(sheetSelections).flat().length;

  // The tag sheet's options come from the API; others are static config.
  const isTagSheet = activeFilter?.key === "tag";
  const tagOptions = (tags ?? []).map((tag) => ({
    value: tag.id,
    label: tag.label,
  }));

  if (!render) return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      {/* gorhom needs a gesture root inside the RN Modal for its pan gestures
          to work in the Modal's separate native view tree. */}
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable
          style={[StyleSheet.absoluteFill, styles.scrim]}
          onPress={handleCancel}
        />
      </Animated.View>

      <Box className="flex-1 items-center justify-center" pointerEvents="box-none">
        {/* Combo pills - one per row, centered */}
        <Box className="items-center" style={{ gap: 12 }} pointerEvents="box-none">
          {COMBO_FILTERS.map((filter) => (
            <FilterPill
              key={filter.key}
              filter={filter}
              label={t(filter.labelKey)}
              index={FILTERS.indexOf(filter)}
              visible={visible}
              selected={selected.has(filter.key)}
              count={sheetSelections[filter.key]?.length ?? 0}
              onPress={() => handlePillPress(filter)}
            />
          ))}
        </Box>

        {/* Channel pills - wrap into rows, centered */}
        <Box
          className="flex-row flex-wrap items-center justify-center"
          style={{ gap: 12, paddingHorizontal: 24, marginTop: 12 }}
          pointerEvents="box-none"
        >
          {CHANNEL_FILTERS.map((filter) => (
            <FilterPill
              key={filter.key}
              filter={filter}
              label={t(filter.labelKey)}
              index={FILTERS.indexOf(filter)}
              visible={visible}
              selected={selected.has(filter.key)}
              onPress={() => handlePillPress(filter)}
            />
          ))}
        </Box>

        <Box className="items-center" style={{ marginTop: 28, gap: 14 }}>
          {totalCount > 0 && (
            <ResetButton label={t("filters.reset")} onPress={handleReset} />
          )}
          <ApplyButton
            index={FILTERS.length}
            visible={visible}
            label={t("filters.apply")}
            count={totalCount}
            onPress={handleApply}
          />
          <CloseButton
            index={FILTERS.length + 1}
            visible={visible}
            onPress={handleCancel}
          />
        </Box>
      </Box>

        {/* Only the active sub-sheet is mounted; it opens on mount and the
            inline gorhom sheet renders in place, above the pills. Add a sheet
            to any filter via `filter-config`. */}
        {activeFilter?.sheet && (
          <OptionListSheet
            key={activeFilter.key}
            config={activeFilter.sheet}
            options={isTagSheet ? tagOptions : undefined}
            loading={isTagSheet && tagsLoading}
            initialSelected={sheetSelections[activeFilter.key]}
            onApply={(values) => handleSheetApply(activeFilter.key, values)}
            onClose={() => setActiveSheetKey(null)}
          />
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

function ApplyButton({
  index,
  visible,
  label,
  count,
  onPress,
}: {
  index: number;
  visible: boolean;
  label: string;
  count: number;
  onPress: () => void;
}) {
  const style = usePopIn(index, visible);
  return (
    <Animated.View style={style}>
      <Pressable onPress={onPress}>
        <Box
          className="rounded-full bg-teal-600 items-center justify-center"
          style={{ paddingHorizontal: 36, paddingVertical: 15 }}
        >
          <Text className="text-sm text-white">
            {count > 0 ? `${label} (${count})` : label}
          </Text>
        </Box>
      </Pressable>
    </Animated.View>
  );
}

/** Quick spring-in (no cascade delay) since it appears reactively when a
    selection exists, after the popup has already settled. */
function ResetButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withSpring(1, { damping: 14, stiffness: 260, mass: 0.6 });
  }, [v]);
  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ scale: 0.9 + v.value * 0.1 }],
  }));
  return (
    <Animated.View style={style}>
      <Pressable onPress={onPress}>
        <Box
          className="rounded-full items-center justify-center"
          style={{
            paddingHorizontal: 22,
            paddingVertical: 11,
            backgroundColor: "rgba(255,255,255,0.14)",
          }}
        >
          <Text className="text-sm text-white">{label}</Text>
        </Box>
      </Pressable>
    </Animated.View>
  );
}

function CloseButton({
  index,
  visible,
  onPress,
}: {
  index: number;
  visible: boolean;
  onPress: () => void;
}) {
  const style = usePopIn(index, visible);
  return (
    <Animated.View style={style}>
      <Pressable onPress={onPress} hitSlop={12} style={styles.closeButton}>
        <XIcon size={22} color="#fff" weight="bold" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    // BlurView can't sample the app from inside an RN Modal, so this scrim
    // carries the dimming on its own; kept lighter than before for "brighter".
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  closeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(120,120,128,0.85)",
  },
});
