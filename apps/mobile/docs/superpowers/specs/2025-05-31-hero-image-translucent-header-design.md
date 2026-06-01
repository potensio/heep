# Hero Image + Translucent Header Design

**Date:** 2025-05-31
**Status:** Approved

## Problem

1. Header `absolute` dengan background solid menutupi sebagian foto produk
2. Footer tidak punya safe area bottom inset
3. Inkonsistensi antara `ProductDetailScreen` (dengan header) dan `ReviewStep` (tanpa header)

## Solution

Implement **Pattern 1: Hero Image Full Width + Translucent Header** dengan progressive opacity saat scroll.

---

## Design Details

### 1. Header Behavior

| State | Background Opacity | Visual |
|-------|-------------------|--------|
| Di atas (image visible) | 0 (transparan) | Icon hitam di atas gambar |
| Scrolling | 0 → 1 (progressive) | Background cream muncul bertahap |
| Setelah image terlewati | 1 (solid) | Header solid cream, icon hitam |

**Opacity calculation:**
```
opacity = min(scrollY / imageHeight, 1)
```

- `scrollY` = current scroll position
- `imageHeight` = SCREEN_WIDTH (square image)
- Opacity reaches 1 when `scrollY >= imageHeight`

### 2. Footer Safe Area

- `ProductDetail` menerima `footerPaddingBottom` prop
- Parent screen (`ProductDetailScreen`) passes `insets.bottom`
- Default value: 16 (reasonable fallback jika prop tidak di-pass)

### 3. Scroll Event Communication

`ProductDetail` akan notify parent tentang scroll position melalui callback:

```tsx
interface ProductDetailProps {
  ...
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  footerPaddingBottom?: number;
}
```

Parent dapat menggunakan event ini untuk animated header opacity.

---

## File Changes

### `ProductDetail.tsx`

1. Tambah props:
   - `onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void`
   - `footerPaddingBottom?: number`

2. Modify `ScrollView`:
   - Pass `onScroll` prop jika provided
   - Keep existing scroll handling jika tidak

3. Modify footer container:
   - Use `footerPaddingBottom` atau default 16

### `ProductDetailScreen.tsx`

1. Add animated header opacity:
   - `useSharedValue` atau `Animated.Value` untuk header opacity
   - `onScroll` handler yang update opacity based on scroll position

2. Modify header:
   - Remove fixed `bg-background`
   - Add animated background style dengan opacity

3. Pass props ke `ProductDetail`:
   - `footerPaddingBottom={insets.bottom}`

### `ReviewStep.tsx`

- No changes required
- `ProductDetail` akan pakai default `footerPaddingBottom: 16`
- Tidak ada header di ReviewStep, jadi `onScroll` tidak di-pass

---

## Implementation Notes

1. **Library:** Gunakan `react-native-reanimated` untuk smooth animation (sudah di project)

2. **Header z-index:** Pastikan header di atas gambar (`z-50`)

3. **Test devices:** 
   - iPhone dengan notch (safe area top/bottom)
   - Android tanpa notch

4. **Edge case:** Jika product tidak punya foto, header tetap solid dari awal
