// packages/categories/index.ts

export interface CategoryAttribute {
  id: string
  label: string
  type: 'select' | 'number' | 'text'
  options?: string[]
  required: boolean
}

export interface SubcategoryDefinition {
  id: string
  label: string
  attributes: CategoryAttribute[]
}

export interface CategoryDefinition {
  id: string
  label: string
  icon: string
  subcategories: SubcategoryDefinition[]
  sharedAttributes: CategoryAttribute[]
}

export const CATEGORIES = [
  {
    id: 'kendaraan',
    label: 'Kendaraan',
    icon: 'Car',
    subcategories: [
      {
        id: 'mobil',
        label: 'Mobil',
        attributes: [
          {
            id: 'brand',
            label: 'Merk',
            type: 'select',
            options: [
              'Toyota', 'Honda', 'Daihatsu', 'Suzuki', 'Mitsubishi',
              'Nissan', 'Mazda', 'Isuzu', 'Wuling', 'BMW', 'Mercedes-Benz', 'Lainnya',
            ],
            required: true,
          },
        ],
      },
      {
        id: 'motor',
        label: 'Motor',
        attributes: [
          {
            id: 'brand',
            label: 'Merk',
            type: 'select',
            options: ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'Vespa', 'TVS', 'Royal Enfield', 'Lainnya'],
            required: true,
          },
        ],
      },
    ],
    sharedAttributes: [
      {
        id: 'condition',
        label: 'Kondisi',
        type: 'select',
        options: ['Baru', 'Bekas'],
        required: true,
      },
      {
        id: 'year',
        label: 'Tahun',
        type: 'number',
        required: true,
      },
      {
        id: 'mileage',
        label: 'Kilometer',
        type: 'number',
        required: true,
      },
      {
        id: 'model',
        label: 'Tipe',
        type: 'text',
        required: false,
      },
      {
        id: 'fuel',
        label: 'Bahan Bakar',
        type: 'select',
        options: ['Bensin', 'Solar', 'Listrik', 'Hybrid'],
        required: true,
      },
    ],
  },
  {
    id: 'properti',
    label: 'Properti',
    icon: 'Buildings',
    subcategories: [
      {
        id: 'rumah',
        label: 'Rumah',
        attributes: [
          { id: 'building_area', label: 'Luas Bangunan (m²)', type: 'number', required: true },
          { id: 'floors', label: 'Jumlah Lantai', type: 'number', required: true },
        ],
      },
      {
        id: 'tanah',
        label: 'Tanah',
        attributes: [],
      },
      {
        id: 'apartemen',
        label: 'Apartemen',
        attributes: [
          { id: 'building_area', label: 'Luas Bangunan (m²)', type: 'number', required: true },
          { id: 'floors', label: 'Jumlah Lantai', type: 'number', required: false },
        ],
      },
      {
        id: 'kantor',
        label: 'Kantor',
        attributes: [
          { id: 'building_area', label: 'Luas Bangunan (m²)', type: 'number', required: true },
          { id: 'floors', label: 'Jumlah Lantai', type: 'number', required: false },
        ],
      },
      {
        id: 'ruko',
        label: 'Ruko',
        attributes: [
          { id: 'building_area', label: 'Luas Bangunan (m²)', type: 'number', required: true },
          { id: 'floors', label: 'Jumlah Lantai', type: 'number', required: true },
        ],
      },
    ],
    sharedAttributes: [
      {
        id: 'listing_type',
        label: 'Status',
        type: 'select',
        options: ['Jual', 'Sewa'],
        required: true,
      },
      {
        id: 'certificate',
        label: 'Sertifikat',
        type: 'select',
        options: ['SHM', 'SHGB', 'HGB', 'Girik', 'Strata Title', 'Lainnya'],
        required: true,
      },
      {
        id: 'land_area',
        label: 'Luas Lahan (m²)',
        type: 'number',
        required: true,
      },
    ],
  },
  {
    id: 'handphone-tablet',
    label: 'Handphone & Tablet',
    icon: 'Smartphone',
    subcategories: [
      {
        id: 'handphone',
        label: 'Handphone',
        attributes: [
          { id: 'brand', label: 'Merk', type: 'text', required: true },
        ],
      },
      {
        id: 'tablet',
        label: 'Tablet',
        attributes: [
          { id: 'brand', label: 'Merk', type: 'text', required: true },
        ],
      },
      { id: 'aksesoris-gadget', label: 'Aksesoris Gadget', attributes: [] },
    ],
    sharedAttributes: [
      {
        id: 'condition',
        label: 'Kondisi',
        type: 'select',
        options: ['Baru', 'Bekas'],
        required: true,
      },
    ],
  },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']
// Note: SubcategoryId is a flat union across all categories — it does not enforce
// that a given subcategory belongs to a specific parent category. Use
// CATEGORIES.find(c => c.id === categoryId)?.subcategories to validate the pairing.
export type SubcategoryId = (typeof CATEGORIES)[number]['subcategories'][number]['id']
