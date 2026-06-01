import { View, Text, TouchableOpacity, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Share, Bookmark } from "@solar-icons/react-native/Linear";
import { Bookmark as BookmarkBold } from "@solar-icons/react-native/Bold";
import { useState } from "react";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { ProductDetail } from "./ProductDetail";
import { useProduct } from "./hooks/useProduct";
import { useIsSaved } from "./hooks/useIsSaved";
import { useSaveProduct } from "@/features/saved/hooks/useSaveProduct";
import { useAuth } from "@/context/AuthContext";
import { startConversation } from "@/lib/api";
import { ApiError } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ProductDetailScreenProps {
  id: string;
}

export function ProductDetailScreen({ id }: ProductDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user, getValidToken } = useAuth();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const { data: product, isLoading, error } = useProduct(id);
  const { data: isSaved = false } = useIsSaved(id);
  const { save, unsave, isSaving, isUnsaving } = useSaveProduct(id);

  const headerOpacity = useSharedValue(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const imageHeight = SCREEN_WIDTH;
    const newOpacity = Math.min(scrollY / imageHeight, 1);
    headerOpacity.value = newOpacity;
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(249, 242, 230, ${headerOpacity.value})`,
  }));

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      router.push({ pathname: '/auth' as any, params: { returnTo: `/product/${id}` } });
      return;
    }
    if (isSaved) {
      await unsave();
    } else {
      await save();
    }
  };

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
            {is404 ? 'Produk tidak ditemukan.' : 'Gagal memuat produk. Coba lagi.'}
          </Text>
        </View>
      </View>
    );
  }

  const productData = {
    name: product.name,
    price: product.price,
    description: product.description,
    photos: product.photos.map(p => p.url),
    category: product.category,
    sellerId: product.seller.id,
    sellerName: product.seller.name ?? 'Penjual',
  };

  const isOwnProduct = user?.id === product.seller.id;

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      router.push({ pathname: '/auth' as any, params: { returnTo: `/product/${id}` } });
      return;
    }
    setIsStartingChat(true);
    try {
      const token = await getValidToken();
      const convo = await startConversation(token, { productId: id, sellerId: productData.sellerId });
      router.push({
        pathname: `/chat/${convo.id}` as any,
        params: {
          productId: id,
          productName: productData.name,
          productPrice: productData.price,
          productImage: productData.photos[0],
          sellerId: productData.sellerId,
          sellerName: productData.sellerName,
        },
      });
    } finally {
      setIsStartingChat(false);
    }
  };

  const footerContent = isOwnProduct ? null : (
    <Button
      onPress={handleStartChat}
      disabled={isStartingChat}
      style={{ width: '100%' }}
    >
      {isStartingChat ? 'Memuat...' : 'Mulai chat'}
    </Button>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <Animated.View 
        className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-4 pb-3"
        style={[{ paddingTop: insets.top > 0 ? insets.top : 12 }, animatedHeaderStyle]}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => {}} className="p-1">
            <Share size={22} color="#0A0A0A" />
          </TouchableOpacity>
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
        </View>
      </Animated.View>

      <ProductDetail
        product={productData}
        onSellerPress={() => router.push(`/user/${productData.sellerId}`)}
        footerContent={footerContent}
        onScroll={handleScroll}
        footerPaddingBottom={insets.bottom > 0 ? insets.bottom : 16}
      />
    </View>
  );
}
