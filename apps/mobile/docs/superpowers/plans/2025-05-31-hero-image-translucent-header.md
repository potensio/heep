# Hero Image + Translucent Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement hero image with translucent header that transitions to solid on scroll, plus proper footer safe area handling.

**Architecture:** Parent screen (`ProductDetailScreen`) handles header opacity animation based on scroll events from child `ProductDetail` component. Footer receives safe area bottom inset via props.

**Tech Stack:** React Native, react-native-reanimated, NativeWind

---

## File Structure

| File | Responsibility |
|------|----------------|
| `features/product/ProductDetail.tsx` | Reusable product display component, emits scroll events, accepts footer padding |
| `features/product/ProductDetailScreen.tsx` | Screen wrapper with animated header |
| `features/sell/components/ReviewStep.tsx` | Uses ProductDetail without header changes |

---

### Task 1: Add scroll callback and footer padding props to ProductDetail

**Files:**
- Modify: `features/product/ProductDetail.tsx`

- [ ] **Step 1: Add new props to ProductDetailProps interface**

```tsx
interface ProductDetailProps {
  product: ProductDetailData;
  showSeller?: boolean;
  onSellerPress?: () => void;
  footerContent?: React.ReactNode;
  isSaved?: boolean;
  onSaveToggle?: () => void;
  isSaving?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  footerPaddingBottom?: number;
}
```

- [ ] **Step 2: Add NativeSyntheticEvent and NativeScrollEvent imports**

```tsx
import { View, Text, Image, ScrollView, TouchableOpacity, FlatList, Dimensions, Modal, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
```

- [ ] **Step 3: Destructure new props in component function**

```tsx
export function ProductDetail({
  product,
  showSeller = true,
  onSellerPress,
  footerContent,
  isSaved = false,
  onSaveToggle,
  isSaving = false,
  onScroll,
  footerPaddingBottom = 16,
}: ProductDetailProps) {
```

- [ ] **Step 4: Modify ScrollView to pass onScroll event**

Find the ScrollView (around line 219):

```tsx
<ScrollView className="flex-1" showsVerticalScrollIndicator={true} bounces={true}>
```

Change to:

```tsx
<ScrollView
  className="flex-1"
  showsVerticalScrollIndicator={true}
  bounces={true}
  onScroll={onScroll}
  scrollEventThrottle={16}
>
```

- [ ] **Step 5: Modify footer container to use footerPaddingBottom**

Find the footer View (around line 342):

```tsx
<View className="px-5 py-4 bg-cream border-t border-gray-200">
```

Change to:

```tsx
<View
  className="px-5 py-4 bg-cream border-t border-gray-200"
  style={{ paddingBottom: footerPaddingBottom }}
>
```

- [ ] **Step 6: Commit changes**

```bash
git add features/product/ProductDetail.tsx
git commit -m "feat(product): add onScroll and footerPaddingBottom props to ProductDetail"
```

---

### Task 2: Implement animated translucent header in ProductDetailScreen

**Files:**
- Modify: `features/product/ProductDetailScreen.tsx`

- [ ] **Step 1: Add react-native-reanimated imports**

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
```

- [ ] **Step 2: Add SCREEN_WIDTH import and constant**

```tsx
import { Dimensions } from "react-native";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
```

- [ ] **Step 3: Create header opacity shared value**

Inside component function, after existing hooks:

```tsx
const headerOpacity = useSharedValue(0);
```

- [ ] **Step 4: Create onScroll handler for header opacity**

```tsx
const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
  const scrollY = event.nativeEvent.contentOffset.y;
  const imageHeight = SCREEN_WIDTH;
  const newOpacity = Math.min(scrollY / imageHeight, 1);
  headerOpacity.value = newOpacity;
};
```

- [ ] **Step 5: Add NativeSyntheticEvent and NativeScrollEvent imports**

```tsx
import { View, Text, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
```

- [ ] **Step 6: Create animated header style**

```tsx
const animatedHeaderStyle = useAnimatedStyle(() => ({
  backgroundColor: `rgba(249, 242, 230, ${headerOpacity.value})`,
}));
```

Note: `#F9F2E6` is the cream background color, converted to rgba: `rgba(249, 242, 230, opacity)`

- [ ] **Step 7: Modify header View to use animated style**

Find the header View (around line 98-106):

```tsx
<View
  className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-4 pb-3 bg-background"
  style={{ paddingTop: insets.top > 0 ? insets.top : 12 }}
>
```

Change to:

```tsx
<Animated.View
  className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-4 pb-3"
  style={[{ paddingTop: insets.top > 0 ? insets.top : 12 }, animatedHeaderStyle]}
>
```

And close with `</Animated.View>` instead of `</View>`.

- [ ] **Step 8: Pass onScroll and footerPaddingBottom to ProductDetail**

Find the ProductDetail component usage (around line 120):

```tsx
<ProductDetail
  product={productData}
  onSellerPress={() => router.push(`/user/${productData.sellerId}`)}
  footerContent={footerContent}
/>
```

Change to:

```tsx
<ProductDetail
  product={productData}
  onSellerPress={() => router.push(`/user/${productData.sellerId}`)}
  footerContent={footerContent}
  onScroll={handleScroll}
  footerPaddingBottom={insets.bottom > 0 ? insets.bottom : 16}
/>
```

- [ ] **Step 9: Commit changes**

```bash
git add features/product/ProductDetailScreen.tsx
git commit -m "feat(product): add translucent header with progressive opacity on scroll"
```

---

### Task 3: Verify and test the implementation

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Start dev server and test manually**

```bash
npx expo start
```

Test checklist:
1. Navigate to a product detail page
2. Verify header is transparent when at top
3. Scroll down slowly — header background should fade in progressively
4. After scrolling past the image, header should be solid cream
5. Scroll back up — header should fade back to transparent
6. Verify footer has proper bottom padding on devices with home indicator

- [ ] **Step 3: Commit final verification**

```bash
git add -A
git commit -m "chore: verify translucent header implementation"
```

---

## Summary

Changes made:
1. `ProductDetail.tsx`: Added `onScroll` callback and `footerPaddingBottom` props
2. `ProductDetailScreen.tsx`: Animated header with progressive opacity based on scroll position

No changes needed to `ReviewStep.tsx` — it uses `ProductDetail` without passing `onScroll`, so the component works as before with default footer padding.
