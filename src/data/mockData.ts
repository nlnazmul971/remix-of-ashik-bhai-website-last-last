// MOCK DATA — temporary fallback so the homepage/PLP shows something
// when the database is empty. Remove this file and its imports once
// real data is in place.
import type { Product } from './products';

export const MOCK_HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=90',
    mobileImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=90',
    title: 'SUMMER',
    topText: 'NEW SEASON\nSS 26 COLLECTION',
    bottomText: 'EFFORTLESS\nESSENTIALS',
  },
  {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=90',
    mobileImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=90',
    title: 'CLASSIC',
    topText: 'TIMELESS PIECES\nMODERN FIT',
    bottomText: 'CRAFTED FOR\nEVERYDAY',
  },
  {
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=90',
    mobileImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=90',
    title: 'WINTER',
    topText: 'WARM LAYERS\nCOZY KNITS',
    bottomText: 'COMFORT IN\nEVERY THREAD',
  },
];

export const MOCK_POSTERS = [
  {
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=90',
    title: 'MENSWEAR',
    subtitle: 'EXPLORE THE EDIT',
    link: '/?category=Shirts',
  },
  {
    image: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=1200&q=90',
    title: 'PANJABI',
    subtitle: 'TRADITION REIMAGINED',
    link: '/?category=Panjabi',
  },
];

export const MOCK_CATEGORY_BANNERS = [
  {
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&q=85',
    label: 'T-SHIRTS',
    link: '/?category=T-Shirt',
  },
  {
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600&q=85',
    label: 'KNIT POLOS',
    link: '/?category=Knit Polos',
  },
  {
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1600&q=85',
    label: 'WINTER',
    link: '/?category=Winter',
  },
];

const now = new Date().toISOString();

const mk = (
  id: string,
  name: string,
  price: number,
  original: number | null,
  category: string,
  image: string,
  isNew = false,
): Product => ({
  id,
  name,
  price,
  original_price: original,
  image_url: image,
  category,
  subcategory: null,
  description: 'Premium quality piece crafted with comfortable, breathable fabric for everyday wear.',
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  colors: [
    { name: 'Black', hex: '#0a0a0a' },
    { name: 'Sand', hex: '#c9b99a' },
    { name: 'Olive', hex: '#6b7050' },
  ],
  stock: 25,
  featured: true,
  is_new_drop: isNew,
  brand: 'HIGHLIGHTS',
  sku: `MOCK-${id}`,
  size_chart: [],
  created_at: now,
  updated_at: now,
});

export const MOCK_PRODUCTS: Product[] = [
  mk('m1',  'Oversized Cotton Tee — Sand',          899,  1299, 'T-Shirt',   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=85', true),
  mk('m2',  'Classic Crew Tee — Black',             749,  null, 'T-Shirt',   'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&q=85'),
  mk('m3',  'Linen Casual Shirt — Off White',      1899,  2499, 'Shirts',    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&q=85', true),
  mk('m4',  'Pinstripe Formal Shirt — Navy',       2199,  null, 'Shirts',    'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=900&q=85'),
  mk('m5',  'Knit Polo — Olive',                   1499,  1999, 'Knit Polos','https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=900&q=85'),
  mk('m6',  'Ribbed Knit Polo — Cream',            1599,  null, 'Knit Polos','https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=900&q=85', true),
  mk('m7',  'Slim Fit Chino Pant — Khaki',         1799,  2299, 'Pant',      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&q=85'),
  mk('m8',  'Tapered Cotton Pant — Charcoal',      1699,  null, 'Pant',      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=900&q=85'),
  mk('m9',  'Embroidered Panjabi — Ivory',         2999,  3699, 'Panjabi',   'https://images.unsplash.com/photo-1622445275576-721325763afe?w=900&q=85', true),
  mk('m10', 'Cotton Panjabi — Sage',               2599,  null, 'Panjabi',   'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&q=85'),
  mk('m11', 'Wool Blend Winter Sweater — Camel',   2899,  3499, 'Winter',    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&q=85'),
  mk('m12', 'Quilted Bomber Jacket — Black',       3499,  null, 'Winter',    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85', true),
];
