export type Language = "en" | "bn";

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "bn", label: "Bangla", native: "বাংলা" },
];

type Dict = Record<string, string>;

export const translations: Record<Language, Dict> = {
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.blog": "Blog",
    "nav.cart": "Cart",
    "nav.wishlist": "Wishlist",
    "nav.account": "Account",
    "nav.search": "Search products...",
    "product.addToCart": "Add to Cart",
    "product.buyNow": "Buy Now",
    "product.outOfStock": "Out of Stock",
    "product.selectSize": "Select Size",
    "product.description": "Description",
    "product.reviews": "Reviews",
    "product.sizeChart": "Size Chart",
    "checkout.title": "Checkout",
    "checkout.placeOrder": "Place Order",
    "common.loading": "Loading...",
    "common.viewAll": "View All",
    "common.featured": "Featured",
    "common.newArrivals": "New Arrivals",
    "common.language": "Language",
  },
  bn: {
    "nav.home": "হোম",
    "nav.shop": "শপ",
    "nav.blog": "ব্লগ",
    "nav.cart": "কার্ট",
    "nav.wishlist": "উইশলিস্ট",
    "nav.account": "অ্যাকাউন্ট",
    "nav.search": "পণ্য খুঁজুন...",
    "product.addToCart": "কার্টে যোগ করুন",
    "product.buyNow": "এখনই কিনুন",
    "product.outOfStock": "স্টক শেষ",
    "product.selectSize": "সাইজ নির্বাচন করুন",
    "product.description": "বিবরণ",
    "product.reviews": "রিভিউ",
    "product.sizeChart": "সাইজ চার্ট",
    "checkout.title": "চেকআউট",
    "checkout.placeOrder": "অর্ডার করুন",
    "common.loading": "লোড হচ্ছে...",
    "common.viewAll": "সব দেখুন",
    "common.featured": "ফিচার্ড",
    "common.newArrivals": "নতুন এসেছে",
    "common.language": "ভাষা",
  },
};

export const localeMap: Record<Language, string> = {
  en: "en_US",
  bn: "bn_BD",
};
