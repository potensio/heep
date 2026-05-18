# Mulai Jual - Step-by-Step Wizard Design

**Date:** 2025-05-18  
**Status:** Approved  
**Approach:** A - Step-by-Step Wizard (3 steps)

---

## 1. Overview

Flow wizard untuk user yang ingin mulai berjualan produk fisik di marketplace. Design prioritaskan simplicity dan guiding experience untuk first-time seller.

---

## 2. User Flow

```
Tab Jual (Entry Point)
    ↓
Step 1: Upload Foto
    ├── Pilih dari galeri (primary)
    ├── Reorder foto (drag)
    └── Hapus foto
    ↓
Step 2: Info Dasar
    ├── Nama produk (text, required)
    ├── Harga (number format rupiah, required)
    └── Deskripsi (textarea, optional)
    ↓
Step 3: Review & Publish
    ├── Preview card lengkap
    ├── Edit masing-masing section
    └── Tombol Publish
    ↓
Success → Halaman Produk Detail
```

---

## 3. Screen Specifications

### Screen 1: Upload Foto

**Header:**
- Title: "Jual Produk"
- Progress indicator: "1/3 - Foto"

**Main Content:**
- **Photo Grid:** 2x3 grid layout
  - Max 6 photos
  - Tap empty slot → open gallery picker
  - Tap existing photo → view fullscreen dengan tombol hapus
  - Long-press atau drag handle untuk reorder (MVP: tap delete & re-upload)

- **Empty State:**
  - Icon camera/image
  - Text: "Tap untuk tambah foto produk"
  - Subtext: "Minimal 1 foto, maksimal 6"

**Footer:**
- CTA "Lanjut" (disabled gray state sampai ada min 1 foto)

**Validation:**
- Error toast: "Tambahkan minimal 1 foto untuk melanjutkan"

---

### Screen 2: Info Dasar

**Header:**
- Title: "Info Produk"
- Progress indicator: "2/3 - Informasi"
- Back button → kembali ke Step 1

**Main Content (Form fields):**

1. **Nama Produk**
   - Label: "Nama Produk *"
   - Input: single line text
   - Max: 100 characters
   - Placeholder: "Contoh: Sepatu Sneakers Nike Air Max 90"
   - Validation: required

2. **Harga**
   - Label: "Harga *"
   - Input: numeric dengan prefix "Rp "
   - Placeholder: "0"
   - Keyboard: number-pad
   - Format: Rupiah dengan thousand separator (auto-format saat type)
   - Validation: required, min 1000

3. **Deskripsi** (optional)
   - Label: "Deskripsi"
   - Input: multi line textarea
   - Max: 500 characters
   - Height: ~100px (4 lines)
   - Placeholder: "Jelaskan kondisi barang, ukuran, warna, atau informasi penting lainnya (opsional)"
   - Character counter: "0/500"

**Footer:**
- CTA "Lanjut ke Review" (enabled kalau nama & harga valid)

**Validation:**
- Real-time inline error di bawah field
- Shake animation kalau coba submit invalid

---

### Screen 3: Review & Publish

**Header:**
- Title: "Review Produk"
- Progress indicator: "3/3 - Review"
- Back button → kembali ke Step 2

**Main Content:**

1. **Product Preview Card**
   - Hero image: foto pertama (cover)
   - Thumbnail strip: swipeable/dots indicator untuk semua foto
   - Product name (bold, large)
   - Price (larger, bold, green color)
   - Description (kalau ada, truncated dengan "...baca selengkapnya")

2. **Edit Actions**
   - Button row: "Edit Foto" | "Edit Info"
   - Tap → navigate ke step terkait

3. **Disclaimer**
   - Small text: "Produk akan langsung terlihat oleh pembeli setelah dipublish"

**Footer:**
- CTA Primary: "Publish Sekarang" (full width, prominent)
- CTA Secondary: "Simpan Draft" (text button, optional untuk MVP)

**Loading State:**
- Button text: "Mempublish..."
- Disable button + show spinner

---

### Screen: Success

**State:** Full screen modal/overlay

**Content:**
- Large success icon (checkmark atau celebration)
- Title: "Produk Berhasil Dijual! 🎉"
- Subtext: "Produk kamu sekarang aktif dan bisa dilihat pembeli"

**Actions:**
- CTA Primary: "Lihat Produk" → navigate ke `/product/[id]` screen
- CTA Secondary: "Jual Lagi" → reset wizard, navigate ke Step 1

---

## 4. State Management

### Form State Interface

```typescript
interface SellFormData {
  photos: string[];        // Array of image URIs from gallery
  name: string;            // Product name
  price: number;           // Price in IDR
  description: string;     // Optional description
}

interface SellWizardState {
  currentStep: 1 | 2 | 3;
  formData: SellFormData;
  isSubmitting: boolean;
  error: string | null;
}
```

### Persistence Strategy
- Local state dengan React useState/useReducer
- Auto-save draft ke AsyncStorage (optional untuk MVP)
- Clear state setelah publish sukses

---

## 5. Validation Rules

| Field | Required | Validation | Error Message |
|-------|----------|------------|---------------|
| photos | Yes | min 1, max 6 | "Tambahkan minimal 1 foto" |
| name | Yes | min 3, max 100 chars | "Nama produk minimal 3 karakter" |
| price | Yes | >= 1000 | "Harga minimal Rp 1.000" |
| description | No | max 500 chars | "Deskripsi maksimal 500 karakter" |

---

## 6. Technical Note: Images

- Image picker: `expo-image-picker`
- Selection mode: gallery (multiple select)
- Image processing: compress before upload (opsional)
- Storage: Firebase Storage / Supabase Storage (tergantung backend)

---

## 7. Navigation & Back Behavior

| Context | Action | Result |
|---------|--------|--------|
| Step 1 | Back button / gesture | Exit wizard, kembali ke tab sebelumnya |
| Step 2 | Back button / gesture | Kembali ke Step 1 (state tetap) |
| Step 3 | Back button / gesture | Kembali ke Step 2 (state tetap) |
| Any step | Hardware back (Android) | Same as back button |
| Step 2+ | Exit with data | Confirm dialog: "Yakin keluar? Progress akan hilang" |

---

## 8. Edge Cases

1. **Image picker cancelled** → Stay di Step 1, no error
2. **Publish network error** → Show error toast, stay di Step 3, enable retry
3. **Price typing "0"** → Normalize ke empty string atau validasi min 1000
4. **Very long product name** → Truncate di preview dengan ellipsis
5. **No description** → Hide description section di preview

---

## 9. Responsive Considerations

- Design untuk mobile portrait (primary)
- Step form scrollable kalau content melebihi screen height
- Safe area insets untuk notch devices

---

## 10. Future Enhancements (Post-MVP)

- [ ] Drag-to-reorder foto
- [ ] Draft auto-save
- [ ] Kategori selection
- [ ] Stock quantity
- [ ] Varian (warna/ukuran)
- [ ] Lokasi/ongkir
- [ ] AI auto-generate deskripsi dari foto

---

## Approved By

Ready for implementation 🚀
