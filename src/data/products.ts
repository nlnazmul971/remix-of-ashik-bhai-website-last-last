// Product types matching the database schema
export type ProductColor = { name: string; hex: string };

export type Product = {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  category: string;
  subcategory?: string | null;
  description: string;
  sizes: string[];
  colors: ProductColor[];
  stock: number;
  featured: boolean;
  is_new_drop?: boolean;
  brand: string;
  sku: string;
  size_chart?: any[];
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export const categories = ['All', 'New Dropped', 'T-Shirt', 'Winter', 'Shirts', 'Knit Polos', 'Pant', 'Panjabi', 'Kafsu'];

/**
 * Returns the original full-HD image URL untouched.
 * (width/quality args are accepted but ignored to preserve original quality.)
 */
export const getProductImage = (imageUrl: string, _width?: number, _quality?: number): string => {
  return imageUrl;
};
