# Sell Wizard Backtrackable Refactor - Design Spec

**Date:** 2026-05-22
**Status:** Draft

## Problem

The current sell wizard is not natively backtrackable:
- Step state lives in React memory (`useState`), not in the URL
- Hardware/gesture back button closes the wizard instead of navigating to previous step
- No deep linking support to specific steps
- Users cannot freely navigate back and forth through the flow

## Solution

Refactor the wizard to use URL-based routing with one route per step. Each step becomes its own route under `/sell/`, with form data held in a React Context provider that wraps all step routes.

## Architecture

### Route Structure

```
app/(protected)/sell/
  _layout.tsx       # SellFormProvider wrapper, shared UI
  foto.tsx          # Step 1: Photo upload
  kategori.tsx      # Step 2: Category selection  
  info.tsx          # Step 3: Product details
  review.tsx        # Step 4: Review & publish
  success.tsx       # Post-publish success screen
```

### State Management

**SellFormContext** holds:
- `formData`: All form data (photos, category, condition, name, price, description)
- `updateFormData(data)`: Update form fields
- `resetForm()`: Clear all data
- `hasData`: Computed check if any form data exists (for discard confirmation)

Step state is derived from the current route path, not stored separately.

### Component Structure

**Existing step components** (unchanged):
- `PhotoUploadStep.tsx`
- `CategoryStep.tsx`
- `ProductInfoStep.tsx`
- `ProductInfoStep.tsx`
- `ReviewStep.tsx`
- `SuccessScreen.tsx`

**New/Modified:**
- `features/sell/context/SellFormContext.tsx` - New context + provider
- `app/(protected)/sell/_layout.tsx` - New layout wrapping all steps
- Step route files (`foto.tsx`, etc.) - New minimal route components
- `hooks/useSellForm.ts` - Simplified, step navigation removed

## Navigation Behavior

### Back Button

| Current Route | Back Action |
|---------------|-------------|
| `/sell/foto` | Close wizard, navigate to home |
| `/sell/kategori` | Navigate to `/sell/foto` |
| `/sell/info` | Navigate to `/sell/kategori` |
| `/sell/review` | Navigate to `/sell/info` |
| `/sell/success` | Blocked (no back navigation) |

### Close Button (X)

When user taps close button:
1. Check if form has any data (`hasData`)
2. If empty → close wizard immediately (`router.replace('/(tabs)')`)
3. If has data → show confirmation dialog:
   - "Yakin ingin membatalkan? Data yang sudah diisi akan hilang."
   - "Ya, batalkan" → clear form, close wizard
   - "Tidak" → dismiss dialog, stay on step

### Edit from Review Screen

"Edit" buttons on Review screen navigate to edit steps:
- "Edit Foto" → `router.push('/sell/foto')`
- "Edit Info" → `router.push('/sell/info')`

User can back out of edit normally (native back button works).

### Publish Flow

1. User taps "Terbitkan" on Review step
2. Show loading state
3. On success → `router.replace('/sell/success')`
4. Success screen shows:
   - "Produk berhasil diterbitkan!"
   - "Lihat Produk" button → navigate to product page
   - "Jual Lagi" button → reset form, navigate to `/sell/foto`
   - "Kembali ke Beranda" button → navigate to home

## Step Indicator

The `StepIndicator` component derives current step from route:

```typescript
const routeToStep: Record<string, WizardStep> = {
  'foto': 1,
  'kategori': 2,
  'info': 3,
  'review': 4,
};

// In StepIndicator or layout
const pathname = usePathname();
const currentStep = routeToStep[pathname.split('/').pop()] ?? 1;
```

## Entry Point

Modified in `app/(tabs)/_layout.tsx`:
- Jual tab button navigates to `/(protected)/sell/foto` (instead of `/(protected)/sell`)

## Data Flow

```
_layout.tsx (SellFormProvider)
    ├── StepIndicator (derives step from route)
    ├── Close button (checks hasData, shows confirm if needed)
    └── {children} (current route's step component)
            └── Reads/writes to SellFormContext
```

## Files to Create

1. `features/sell/context/SellFormContext.tsx` - Context provider
2. `app/(protected)/sell/_layout.tsx` - Layout with provider
3. `app/(protected)/sell/foto.tsx` - Step 1 route
4. `app/(protected)/sell/kategori.tsx` - Step 2 route
5. `app/(protected)/sell/info.tsx` - Step 3 route
6. `app/(protected)/sell/review.tsx` - Step 4 route
7. `app/(protected)/sell/success.tsx` - Success screen route

## Files to Modify

1. `features/sell/hooks/useSellForm.ts` - Remove step navigation logic
2. `features/sell/components/SellWizard.tsx` - Delete (obsolete)
3. `app/(protected)/sell/index.tsx` - Delete (replaced by route files)
4. `app/(tabs)/_layout.tsx` - Update Jual button navigation
5. Step components - Minor props updates (receive data from context instead of props)

## Files to Delete

1. `features/sell/components/SellWizard.tsx`
2. `app/(protected)/sell/index.tsx`

## Out of Scope

- Draft persistence (AsyncStorage) - rejected in favor of simpler in-memory state
- Deep linking to specific steps - not needed for current use case
- Form validation beyond current implementation

## Success Criteria

- [ ] Native back button navigates between steps
- [ ] Close button shows confirmation when form has data
- [ ] Edit buttons on Review push to edit steps (backable)
- [ ] Success screen blocks back navigation
- [ ] Form data persists across step navigation
- [ ] Form data cleared when wizard is closed/cancelled
