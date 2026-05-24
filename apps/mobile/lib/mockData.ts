export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  seller: string;
  sellerId: string;
  category: string;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Sepatu Sneakers Pria",
    price: 250000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    seller: "Andi",
    sellerId: "seller-1",
    category: "Fashion",
  },
  {
    id: "2",
    name: "Tas Ransel Laptop",
    price: 180000,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    seller: "Budi",
    sellerId: "seller-2",
    category: "Aksesoris",
  },
  {
    id: "3",
    name: "Kemeja Flannel",
    price: 150000,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop",
    seller: "Citra",
    sellerId: "seller-3",
    category: "Fashion",
  },
  {
    id: "4",
    name: "Jam Tangan Analog",
    price: 350000,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop",
    seller: "Dian",
    sellerId: "seller-4",
    category: "Aksesoris",
  },
  {
    id: "5",
    name: "Hoodie Oversized",
    price: 200000,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
    seller: "Eka",
    sellerId: "seller-5",
    category: "Fashion",
  },
  {
    id: "6",
    name: "Topi Baseball",
    price: 75000,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop",
    seller: "Fani",
    sellerId: "seller-6",
    category: "Aksesoris",
  },
  {
    id: "7",
    name: "Kaos Polos Premium",
    price: 85000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    seller: "Gina",
    sellerId: "seller-7",
    category: "Fashion",
  },
  {
    id: "8",
    name: "Dompet Kulit Pria",
    price: 120000,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop",
    seller: "Hadi",
    sellerId: "seller-8",
    category: "Aksesoris",
  },
  {
    id: "9",
    name: "Celana Jeans Slim",
    price: 175000,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
    seller: "Irma",
    sellerId: "seller-9",
    category: "Fashion",
  },
  {
    id: "10",
    name: "Kacamata Fashion",
    price: 95000,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
    seller: "Joko",
    sellerId: "seller-10",
    category: "Aksesoris",
  },
  {
    id: "11",
    name: "Jaket Denim Classic",
    price: 280000,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop",
    seller: "Kirana",
    sellerId: "seller-11",
    category: "Fashion",
  },
  {
    id: "12",
    name: "Ikat Pinggang Kulit",
    price: 65000,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    seller: "Leo",
    sellerId: "seller-12",
    category: "Aksesoris",
  },
];
