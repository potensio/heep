# Edit Product — Design Spec

**Date:** 2026-06-02  
**Status:** Approved

---

## Overview

User dapat mengedit produk milik mereka sendiri melalui wizard 4 step yang identik dengan sell flow, tapi pre-filled dengan data produk yang sudah ada. Entry point adalah tombol edit di header `ProductDetailScreen`, yang hanya muncul jika produk milik user yang sedang login.

---

## Routes & Struktur Folder

```
app/(protected)/edit/[id]/
├── _layout.tsx      — provider + StepIndicator + tombol tutup
├── foto.tsx
├── kategori.tsx
├── info.tsx
├── review.tsx
└── success.tsx

features/edit/
├── context/
│   └── EditFormContext.tsx
└── types.ts
```

### Layout Behavior (`_layout.tsx`)

1. Fetch data produk via `useProduct(id)` — tampilkan loading state sementara data belum tersedia
2. Validasi `user?.id === product.seller.id` — kalau bukan owner, redirect ke halaman detail
3. Wrap children dengan `EditFormProvider` yang diinisialisasi dari data produk
4. Tampilkan `StepIndicator` dan tombol tutup (X) seperti sell flow
5. Tombol tutup: kalau ada perubahan (`hasChanges`), tampilkan konfirmasi sebelum keluar

---

## Model Data

### `EditPhoto`

```typescript
// features/edit/types.ts
export type EditPhoto =
  | { kind: 'existing'; url: string }  // sudah di server, tidak di-upload ulang
  | { kind: 'new'; uri: string }       // file lokal, perlu di-upload ke R2
```

### `EditFormData`

```typescript
export interface EditFormData {
  productId: string;
  photos: EditPhoto[];
  category: CategoryId | '';
  subcategory: SubcategoryId | '';
  attributes: Record<string, string | number>;
  name: string;
  price: number;
  description: string;
  location: Location | null;
}
```

### Inisialisasi dari API

```typescript
// Di EditFormProvider, diinisialisasi dari ProductDetailItem:
{
  productId: product.id,
  photos: product.photos
    .sort((a, b) => a.position - b.position)
    .map(p => ({ kind: 'existing', url: p.url })),
  category: product.category as CategoryId,
  subcategory: product.subcategory as SubcategoryId,
  attributes: product.attributes,
  name: product.name,
  price: product.price,
  description: product.description,
  location: product.location,
}
```

---

## Strategi Komponen

### Dipakai ulang tanpa modifikasi

| Komponen | Alasan |
|---|---|
| `CategoryStep` | Interface generik, tidak ada foto |
| `ProductInfoStep` | Terima `formData` + `onFormChange`, sudah cocok |
| `ReviewStep` | Terima `formData`, cocok dengan `EditFormData` (minus `EditPhoto` — lihat catatan) |
| `StepIndicator` | Sama persis |
| `PriceInput`, `PhotoGrid` | Komponen primitif |

### Komponen baru di `features/edit/`

**`EditPhotoUploadStep`** — Menggantikan `PhotoUploadStep` untuk edit flow:
- Menampilkan foto `existing` (render dari URL) dan foto `new` (render dari URI lokal) dalam satu grid
- Tombol hapus tersedia untuk kedua jenis foto
- Tombol tambah foto baru tetap ada (membuka image picker)
- Minimal 1 foto, maksimal sesuai batas yang sama dengan sell flow

**`EditSuccessScreen`** — Layar konfirmasi setelah update berhasil:
- Pesan: "Produk berhasil diperbarui!"
- Dua tombol: "Lihat Produk" (→ detail produk) dan "Kembali ke Beranda" (→ home)

### Catatan `ReviewStep`

`ReviewStep` menerima `formData: SellFormData` yang punya `photos: string[]`. Untuk edit, normalisasi `EditPhoto[]` → `string[]` sebelum passing ke `ReviewStep`: `existing` → `url`, `new` → `uri`. `ReviewStep` hanya menampilkan foto (tidak memutasi), jadi ini aman.

---

## Perubahan Entry Point

**File:** `features/product/ProductDetailScreen.tsx`

```typescript
const { user } = useAuth();
const isOwner = !!user && product.seller.id === user.id;
```

Di header:
- **Jika `isOwner`:** Tampilkan ikon pensil (edit). Tombol Share tetap ada. Bookmark tidak ditampilkan (tidak relevan untuk produk sendiri).
- **Jika bukan owner:** Tampilkan Share + Bookmark seperti sekarang.

Tap ikon pensil → `router.push(`/edit/${id}/foto` as any)`

---

## Perubahan API (`lib/api.ts`)

Tambahkan fungsi baru:

```typescript
export async function updateProduct(
  token: string,
  productId: string,
  photos: EditPhoto[],
  payload: {
    name: string;
    price: number;
    description: string;
    category: string;
    subcategory: string;
    attributes: Record<string, string | number>;
    location: { name: string; placeId: string; lat: number; lng: number };
    listingStatus: 'active' | 'draft';
  },
): Promise<void>
```

**Logika internal:**
1. Pisahkan: `newPhotos = photos.filter(p => p.kind === 'new')`
2. Kalau ada `newPhotos` → presign + upload ke R2, ambil keys
3. Susun foto final dalam urutan asli: `existing` → URL, `new` → key dari R2
4. Kirim `PATCH /products/:id` dengan seluruh payload + array foto final

**Asumsi backend:** `PATCH /products/:id` menerima payload yang sama dengan `POST /products`. Array foto boleh berisi URL lama (existing) maupun key baru (uploaded). **Perlu dikonfirmasi dengan backend sebelum implementasi.**

---

## Alur Navigasi

```
ProductDetailScreen (isOwner)
  → tap ikon pensil
  → /edit/[id]/foto     (EditPhotoUploadStep, pre-filled)
  → /edit/[id]/kategori (CategoryStep, pre-filled)
  → /edit/[id]/info     (ProductInfoStep, pre-filled)
  → /edit/[id]/review   (EditReviewStep, tampilkan semua perubahan)
  → submit (PATCH /products/:id)
  → /edit/[id]/success  (EditSuccessScreen)
  → "Lihat Produk" → /product/[id]
  → "Kembali ke Beranda" → /(tabs)
```

---

## Yang Tidak Termasuk Scope

- Hapus produk (delete listing)
- Ubah status listing (aktif/nonaktif)
- Reorder foto via drag-and-drop (urutan = urutan di array)
