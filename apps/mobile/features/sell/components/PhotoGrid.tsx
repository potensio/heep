import { View, TouchableOpacity, Image, Text } from "react-native";
import { GalleryAdd } from "@solar-icons/react-native/Linear";
import { X } from "lucide-react-native";
import { useCallback } from "react";
import Sortable from "react-native-sortables";
import type { SortableGridRenderItem } from "react-native-sortables";

type Item = { type: "photo"; uri: string } | { type: "add" };

interface PhotoGridProps {
  photos: string[];
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onSetCover: (index: number) => void;
  onReorder: (photos: string[]) => void;
  maxPhotos?: number;
}

const GAP = 12;

export function PhotoGrid({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onSetCover,
  onReorder,
  maxPhotos = 6,
}: PhotoGridProps) {
  const data: Item[] = [
    ...photos.map((uri) => ({ type: "photo" as const, uri })),
    ...(photos.length < maxPhotos ? [{ type: "add" as const }] : []),
  ];

  const renderItem = useCallback<SortableGridRenderItem<Item>>(
    ({ item, index }) => {
      if (item.type === "add") {
        return (
          <Sortable.Handle mode="fixed-order">
            <TouchableOpacity
              onPress={onAddPhoto}
              style={{ aspectRatio: 1 }}
              className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 items-center justify-center active:bg-gray-100"
            >
              <GalleryAdd size={32} className="text-gray-400" />
              {photos.length === 0 && (
                <Text className="text-xs text-gray-400 mt-2 text-center px-2">
                  + Tambah foto
                </Text>
              )}
            </TouchableOpacity>
          </Sortable.Handle>
        );
      }

      const isCover = index === 0;

      return (
        <Sortable.Handle>
          <View style={{ aspectRatio: 1 }}>
            <TouchableOpacity
              onPress={() => !isCover && onSetCover(index)}
              activeOpacity={isCover ? 1 : 0.85}
              style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
            >
              <Image
                source={{ uri: item.uri }}
                className="w-full h-full"
                resizeMode="cover"
              />
              {isCover && (
                <View
                  className="absolute bottom-0 left-0 right-0 py-1"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <Text className="text-white text-xs text-center">Cover</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onRemovePhoto(index)}
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#000",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={13} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </Sortable.Handle>
      );
    },
    [photos, onAddPhoto, onRemovePhoto, onSetCover],
  );

  return (
    <Sortable.Grid
      columns={2}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) =>
        item.type === "photo" ? item.uri : "__add__"
      }
      rowGap={GAP}
      columnGap={GAP}
      customHandle
      overflow="visible"
      onDragEnd={({ data: newData }) => {
        const reordered = newData
          .filter((item): item is { type: "photo"; uri: string } =>
            item.type === "photo"
          )
          .map((item) => item.uri);
        onReorder(reordered);
      }}
    />
  );
}
