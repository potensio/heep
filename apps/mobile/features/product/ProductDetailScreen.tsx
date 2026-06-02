import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Share,
  Bookmark,
  Phone,
  PenNewSquare,
} from "@solar-icons/react-native/Linear";
import { Bookmark as BookmarkBold } from "@solar-icons/react-native/Bold";
import { Button } from "@/components/ui/Button";
import { ProductDetail } from "./ProductDetail";
import { useProduct } from "./hooks/useProduct";
import { useIsSaved } from "./hooks/useIsSaved";
import { useSaveProduct } from "@/features/saved/hooks/useSaveProduct";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

interface ProductDetailScreenProps {
  id: string;
}

export function ProductDetailScreen({ id }: ProductDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const { data: product, isLoading, error } = useProduct(id);
  const { data: isSaved = false } = useIsSaved(id);
  const { save, unsave, isSaving, isUnsaving } = useSaveProduct(id);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      router.push({
        pathname: "/auth" as any,
        params: { returnTo: `/product/${id}` },
      });
      return;
    }
    if (isSaved) {
      await unsave();
    } else {
      await save();
    }
  };

  const openContactModal = useCallback(() => {
    setContactModalVisible(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, modalScale, modalOpacity]);

  const closeContactModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setContactModalVisible(false);
    });
  }, [backdropOpacity, modalScale, modalOpacity]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Memuat produk...</Text>
      </View>
    );
  }

  if (error || !product) {
    const is404 = error instanceof ApiError && error.status === 404;
    return (
      <View className="flex-1 bg-background">
        <View
          className="flex-row items-center px-4 pb-3"
          style={{ paddingTop: insets.top > 0 ? insets.top : 12 }}
        >
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <ArrowLeft size={24} color="#0A0A0A" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 text-center">
            {is404
              ? "Produk tidak ditemukan."
              : "Gagal memuat produk. Coba lagi."}
          </Text>
        </View>
      </View>
    );
  }

  const isOwner = !!user && product.seller.id === user.id;

  const productData = {
    name: product.name,
    price: product.price,
    description: product.description,
    photos: product.photos.map((p) => p.url),
    category: product.category,
    sellerId: product.seller.id,
    sellerName: product.seller.name ?? "Penjual",
    sellerAvatar: product.seller.avatarUrl ?? undefined,
    sellerPhone: product.seller.phone,
  };

  const footerContent = (
    <Button
      onPress={() => {
        const conversationId = `product-${id}-seller-${productData.sellerId}`;
        router.push({
          pathname: `/chat/${conversationId}` as any,
          params: {
            productId: id,
            productName: productData.name,
            productPrice: productData.price,
            productImage: productData.photos[0],
            sellerId: productData.sellerId,
            sellerName: productData.sellerName,
          },
        });
      }}
      style={{ width: "100%" }}
    >
      Mulai chat
    </Button>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 bg-background"
        style={{ paddingTop: insets.top > 0 ? insets.top : 12 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => {}} className="p-1">
            <Share size={22} color="#0A0A0A" />
          </TouchableOpacity>
          {isOwner ? (
            <TouchableOpacity
              onPress={() => router.push(`/edit/${id}/foto` as any)}
              className="p-1"
            >
              <PenNewSquare size={22} color="#0A0A0A" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSaveToggle}
              disabled={isSaving || isUnsaving}
              className="p-1"
            >
              {isSaved ? (
                <BookmarkBold size={22} color="#155DFC" />
              ) : (
                <Bookmark size={22} color="#0A0A0A" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ProductDetail
        product={productData}
        onSellerPress={() => router.push(`/user/${productData.sellerId}`)}
        onContactPress={openContactModal}
        footerContent={footerContent}
        footerPaddingBottom={insets.bottom > 0 ? insets.bottom + 16 : 24}
      />

      {/* Contact Modal */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeContactModal}
        statusBarTranslucent
      >
        <View className="flex-1">
          {/* Backdrop */}
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "black",
              opacity: backdropOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            }}
          >
            <Pressable className="flex-1" onPress={closeContactModal} />
          </Animated.View>

          {/* Modal Content */}
          <Pressable
            className="flex-1 items-center justify-center"
            onPress={closeContactModal}
          >
            <Animated.View
              style={{
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              }}
            >
              <View
                className="bg-white rounded-2xl p-6 w-80"
                onStartShouldSetResponder={() => true}
              >
                <Text className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Kontak Penjual
                </Text>
                <Text className="text-sm text-gray-500 text-center mb-4">
                  Hubungi penjual melalui nomor berikut
                </Text>
                <View className="flex-row items-center justify-center gap-3 bg-gray-100 rounded-xl px-4 py-3">
                  <Phone size={20} color="#155DFC" />
                  <Text className="text-lg font-semibold text-gray-900">
                    {productData.sellerPhone || "Tidak tersedia"}
                  </Text>
                </View>
                <Button
                  variant="outline"
                  onPress={closeContactModal}
                  style={{ marginTop: 16, width: "100%" }}
                >
                  Tutup
                </Button>
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
