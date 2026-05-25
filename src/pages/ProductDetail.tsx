import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Minus, Plus, Star, Send, ZoomIn, X, ChevronDown, ChevronLeft, ChevronRight, Check, Facebook, Twitter, Linkedin } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProduct, useProductReviews, useRelatedProducts, useProductImages, useStoreSettings, useAllSizeStock } from '@/hooks/useSupabase';
import ProductCard from '@/components/ProductCard';
import { getProductImage } from '@/data/products';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import { pushViewItem } from '@/lib/gtm';
import { flyToCart } from '@/lib/flyToCart';

const ProductImageGallery = ({ mainImage, name, productId, discountPercent }: { mainImage: string; name: string; productId: string; discountPercent?: number | null }) => {
  const { data: additionalImages = [] } = useProductImages(productId);
  
  // Build images array: main image + additional images
  const images = [mainImage, ...additionalImages.map((img: any) => img.image_url)];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [mobileZoom, setMobileZoom] = useState(false);
  const [mobileZoomPos, setMobileZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  const touchStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < images.length - 1) setActiveIndex(activeIndex + 1);
      if (diff < 0 && activeIndex > 0) setActiveIndex(activeIndex - 1);
    }
  };

  const goPrev = () => setActiveIndex((activeIndex - 1 + images.length) % images.length);
  const goNext = () => setActiveIndex((activeIndex + 1) % images.length);

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      {/* Thumbnails - vertical left */}
      <div className="hidden sm:flex sm:flex-col gap-2.5 w-20 max-h-[600px] overflow-y-auto">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 w-20 h-20 overflow-hidden border transition-all ${
              i === activeIndex ? 'border-foreground' : 'border-border hover:border-foreground/40'
            }`}
          >
            <img src={img} alt={`${name} view ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image with arrows + zoom icon */}
      <div
        ref={imgRef}
        className="relative flex-1 aspect-square bg-secondary overflow-hidden cursor-crosshair group"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[activeIndex]}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-200"
          style={zoomed ? { transform: 'scale(2.2)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          draggable={false}
        />
        {/* Discount circle */}
        {discountPercent ? (
          <span className="absolute top-3 left-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[hsl(0,75%,52%)] text-white flex items-center justify-center text-[14px] sm:text-[16px] font-semibold shadow-md z-10">
            {discountPercent}%
          </span>
        ) : null}
        {/* Zoom icon top-right */}
        <button
          onClick={() => setMobileZoom(true)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          aria-label="Zoom image"
        >
          <ZoomIn size={16} />
        </button>
        {/* Prev/Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center transition-all"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Mobile fullscreen zoom overlay */}
      {mobileZoom && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" style={{ touchAction: 'pinch-zoom' }}>
          <button
            onClick={() => setMobileZoom(false)}
            className="fixed top-4 right-4 z-[101] p-2.5 bg-white/20 backdrop-blur-sm text-white rounded-full"
            aria-label="Close zoom"
          >
            <X size={20} />
          </button>
          <img src={images[activeIndex]} alt={name} className="w-full h-auto max-h-screen object-contain" draggable={false} />
        </div>
      )}

      {/* Mobile thumbnail strip */}
      <div className="flex sm:hidden items-center justify-start gap-1.5 overflow-x-auto py-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 w-14 h-14 overflow-hidden border transition-all ${
              i === activeIndex ? 'border-foreground' : 'border-border opacity-60'
            }`}
          >
            <img src={img} alt={`${name} view ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id || '');
  const { data: reviews = [] } = useProductReviews(id || '');
  const { data: relatedProducts = [] } = useRelatedProducts(product?.category || '', id || '');
  const { addItem, setShowPopup } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { addView } = useRecentlyViewed();
  const { data: storeSettings } = useStoreSettings();
  const { data: allSizeStock = [] } = useAllSizeStock();
  const baseMessageLink = storeSettings?.product_message_link || storeSettings?.footer_messenger || 'https://m.me/highlightbd';
  const buildMessageLink = () => {
    if (!product) return baseMessageLink;
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const text = `Hi! I'm interested in this product:\n${product.name}\n${productUrl}`;
    try {
      const u = new URL(baseMessageLink);
      const host = u.hostname.toLowerCase();
      if (host.includes('wa.me') || host.includes('whatsapp.com')) {
        u.searchParams.set('text', text);
      } else if (host.includes('m.me') || host.includes('messenger.com')) {
        u.searchParams.set('ref', productUrl);
      } else {
        u.searchParams.set('text', text);
      }
      return u.toString();
    } catch {
      return baseMessageLink;
    }
  };
  const messageLink = buildMessageLink();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showMobileDesc, setShowMobileDesc] = useState(false);
  const [isMessagePressed, setIsMessagePressed] = useState(false);

  useEffect(() => {
    if (product?.id) addView(product.id);
  }, [product?.id, addView]);

  useEffect(() => {
    if (!product) return;
    pushViewItem(product);
  }, [product?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <div className="pt-36 sm:pt-44 max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          <div className="aspect-[3/4] bg-muted animate-pulse" />
          <div className="space-y-4 py-4">
            <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background">
      <Header /><CartDrawer />
      <div className="pt-36 sm:pt-44 text-center">
        <p className="text-muted-foreground mb-4">Product not found.</p>
        <Link to="/" className="luxury-button-outline inline-block">Back to Shop</Link>
      </div>
    </div>
  );

  const size = selectedSize || product.sizes[0];
  const color = selectedColor || product.colors[0]?.name || '';
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  // Check sold out per size
  const productStock = allSizeStock.filter(s => s.product_id === product.id);
  const getSizeAvailable = (sz: string) => {
    const s = productStock.find(st => st.size === sz);
    if (!s) return product.stock > 0 ? 999 : 0; // fallback to product.stock if no size stock data
    return s.total_stock - s.sold_count + s.cancelled_count + s.returned_count;
  };
  const currentSizeAvailable = getSizeAvailable(size);
  const allSoldOut = productStock.length > 0
    ? product.sizes.every(sz => getSizeAvailable(sz) <= 0)
    : product.stock <= 0;

  const handleAddToCart = () => addItem(product, size, color, quantity);
  const handleBuyNow = () => {
    addItem(product, size, color, quantity);
    setShowPopup(false);
    window.location.href = '/checkout';
  };

  const productImg = (product as any).seo_og_image || getProductImage(product.image_url);
  const seoTitle = (product as any).seo_title || product.name;
  const seoDescription = (product as any).seo_description || (product.description || product.name).slice(0, 155);
  const seoKeywords = (product as any).seo_keywords || undefined;
  const seoSlug = (product as any).seo_slug;
  const productPath = seoSlug ? `/product/${seoSlug}` : `/product/${product.id}`;
  const seoFaq: Array<{ q: string; a: string }> = Array.isArray((product as any).seo_faq) ? (product as any).seo_faq : [];
  const customSchema = (product as any).seo_schema;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [productImg],
    description: product.description,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: product.brand || "Baby Store" },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: productPath,
      priceCurrency: "BDT",
      price: product.price,
      availability: allSoldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: product.category, item: `/?category=${product.category}` },
      { "@type": "ListItem", position: 3, name: product.name, item: productPath },
    ],
  };
  const faqJsonLd = seoFaq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seoFaq.filter(f => f.q && f.a).map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;
  const allLd: any[] = [productJsonLd, breadcrumbJsonLd];
  if (faqJsonLd) allLd.push(faqJsonLd);
  if (customSchema) allLd.push(customSchema);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={productPath}
        image={productImg}
        type="product"
        keywords={seoKeywords}
        noIndex={(product as any).seo_no_index}
        jsonLd={allLd}
      />

      <Header /><CartDrawer />
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20 sm:pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-4 sm:mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">🏠 Home</Link>
          <span>›</span>
          <Link to={`/?category=${product.category}`} className="hover:text-foreground transition-colors capitalize">{product.category}</Link>
          <span>›</span>
          <span className="text-foreground truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
          <div>
            <ProductImageGallery
              mainImage={getProductImage(product.image_url)}
              name={product.name}
              productId={product.id}
              discountPercent={product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null}
            />
          </div>

          <div className="py-0 lg:py-2">
            {/* Title */}
            <h1 className="text-[24px] sm:text-[28px] leading-tight font-bold text-foreground mb-4">
              {product.name}
            </h1>

            <hr className="border-border mb-4" />

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              {product.original_price && (
                <span className="text-[15px] text-muted-foreground line-through">{product.original_price.toLocaleString()}.00৳</span>
              )}
              <span className="text-[22px] font-bold text-[hsl(0,75%,50%)]">{product.price.toLocaleString()}.00৳</span>
            </div>

            {/* In stock pill */}
            {!allSoldOut && (
              <div className="inline-block mb-5">
                <span className="inline-block bg-[hsl(140,55%,92%)] text-[hsl(140,65%,28%)] text-[13px] font-semibold px-3 py-1.5 rounded">
                  {currentSizeAvailable || product.stock} in stock
                </span>
              </div>
            )}

            {/* Stock progress */}
            {!allSoldOut && (
              <div className="mb-5">
                <p className="text-[15px] font-bold text-foreground mb-2">Products are almost sold out</p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[hsl(0,75%,52%)] rounded-full"
                    style={{ width: `${Math.min(100, Math.max(4, ((currentSizeAvailable || product.stock) / Math.max(product.stock, currentSizeAvailable || 1)) * 12))}%` }}
                  />
                </div>
                <p className="text-[13px] text-muted-foreground mt-2">
                  the available products :{' '}
                  <span className="text-[hsl(0,75%,50%)] font-semibold">{currentSizeAvailable || product.stock}</span>
                </p>
              </div>
            )}

            {/* Size (only if multiple) */}
            {product.sizes.length > 1 && (
              <div className="mb-5">
                <p className="text-sm mb-2 text-foreground">
                  <span className="font-semibold">Size:</span> {size}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => {
                    const avail = getSizeAvailable(s);
                    const isSelected = size === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        disabled={avail <= 0}
                        className={`min-w-[56px] h-10 px-3 text-[13px] rounded border transition-all ${
                          avail <= 0
                            ? 'opacity-40 line-through border-border'
                            : isSelected
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background text-foreground border-border hover:border-foreground'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {allSoldOut ? (
              <div className="w-full py-3.5 text-center bg-destructive/10 text-destructive text-sm font-semibold tracking-wider uppercase rounded">SOLD OUT</div>
            ) : (
              <>
                {/* WhatsApp order */}
                <a
                  href={messageLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 h-11 bg-[#25D366] hover:bg-[#1ebe57] text-white text-[14px] font-semibold rounded mb-3 transition"
                >
                  Order on WhatsApp
                </a>

                {/* Qty + Add to cart */}
                <div className="flex items-stretch gap-3 mb-3">
                  <div className="flex items-center border border-border rounded overflow-hidden h-11 bg-background">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 h-full hover:bg-muted transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-[14px] font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(currentSizeAvailable || product.stock, quantity + 1))}
                      className="px-3 h-full hover:bg-muted transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      flyToCart((e.currentTarget as HTMLElement).closest('main')?.querySelector('img') || e.currentTarget, getProductImage(product.image_url, 400));
                      handleAddToCart();
                    }}
                    disabled={currentSizeAvailable <= 0}
                    className="flex-1 h-11 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-[14px] font-semibold rounded transition disabled:opacity-40"
                  >
                    Add to cart
                  </button>
                </div>

                {/* Buy Now - red full width */}
                <button
                  onClick={handleBuyNow}
                  disabled={currentSizeAvailable <= 0}
                  className="w-full h-12 bg-muted/40 hover:bg-muted/70 text-foreground border border-border text-[13px] font-medium tracking-[0.3em] uppercase rounded-none transition disabled:opacity-40 mb-4"
                >
                  Buy Now
                </button>

                {/* Wishlist + favorites count */}
                <div className="flex items-center gap-2 mb-5">
                  <button
                    onClick={() => toggleItem(product)}
                    className={`inline-flex items-center gap-1.5 text-[14px] font-semibold transition ${isInWishlist(product.id) ? 'text-destructive' : 'text-foreground'}`}
                  >
                    <Heart size={16} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                    Add to wishlist
                  </button>
                </div>


                {/* Categories */}
                <div className="py-3 border-t border-border text-[13px]">
                  <span className="text-muted-foreground">Categories: </span>
                  <Link to={`/?category=${product.category}`} className="text-[hsl(0,75%,50%)] hover:underline capitalize font-medium">
                    {product.category}
                  </Link>
                </div>


                {currentSizeAvailable > 0 && currentSizeAvailable <= 5 && (
                  <p className="text-[11px] text-destructive mt-2">Only {currentSizeAvailable} left in stock</p>
                )}
              </>
            )}

            <div className="lg:hidden mt-4 sm:mt-6">
              <button
                type="button"
                onClick={() => setShowMobileDesc(v => !v)}
                className="w-full flex items-center justify-between py-3 text-[11px] tracking-[0.15em] uppercase"
                aria-expanded={showMobileDesc}
              >
                <span>Description</span>
                <ChevronDown size={14} className={`transition-transform ${showMobileDesc ? 'rotate-180' : ''}`} />
              </button>
              {showMobileDesc && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line pt-3">{product.description}</p>
              )}
            </div>

            {/* Size Chart Section - Updated for better data handling */}
            {product.size_chart && (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6">
                <h3 className="luxury-heading text-base sm:text-lg tracking-[0.1em] mb-3 sm:mb-4">Size Chart</h3>
                <div className="overflow-x-auto">
                  {(() => {
                    let chartData: any[] = [];
                    try {
                      chartData = typeof product.size_chart === 'string' 
                        ? JSON.parse(product.size_chart) 
                        : product.size_chart;
                    } catch (e) {
                      console.error("Size chart error:", e);
                    }

                    if (!Array.isArray(chartData) || chartData.length === 0) return null;

                    return (
                      <table className="w-full text-xs sm:text-sm border border-border">
                        <thead>
                          <tr className="bg-muted/30">
                            {Object.keys(chartData[0]).map(key => (
                              <th key={key} className="px-3 py-2 text-left text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground border-b border-border font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10">
                              {Object.values(row).map((val: any, j: number) => (
                                <td key={j} className="px-3 py-2 text-foreground">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8">
              <h3 className="luxury-heading text-base sm:text-lg tracking-[0.1em] mb-4 sm:mb-6">Reviews ({reviews.length})</h3>
              
              <ReviewForm productId={product.id} />

              {reviews.length > 0 && (
                <div className="space-y-3 sm:space-y-4 mt-6">
                  {reviews.map(r => (
                    <div key={r.id} className="pb-3 sm:pb-4 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={11} fill={j < r.rating ? 'currentColor' : 'none'} className={j < r.rating ? 'text-foreground' : 'text-muted-foreground/30'} />)}</div>
                        <span className="text-[11px] font-medium">{r.name}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-12 sm:mt-20 mb-8 sm:mb-12">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="luxury-heading text-xl sm:text-3xl tracking-[0.15em]">You May Also Like</h2>
              <div className="w-12 h-px bg-foreground mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

const ReviewForm = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!comment.trim()) { toast.error('Please write a comment'); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user?.uid || null,
        name: name.trim(),
        rating,
        comment: comment.trim(),
      });
      if (error) throw error;
      toast.success('Review submitted!');
      setRating(0); setName(''); setComment('');
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border p-4 space-y-3 mb-4">
      <p className="text-xs tracking-wider uppercase text-muted-foreground font-medium">Write a Review</p>
      <div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i + 1)}
            >
              <Star
                size={18}
                fill={(hoverRating || rating) > i ? 'currentColor' : 'none'}
                className={(hoverRating || rating) > i ? 'text-foreground' : 'text-muted-foreground/30'}
              />
            </button>
          ))}
        </div>
      </div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your Name"
        className="luxury-input text-xs"
        maxLength={100}
        required
      />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Write your review..."
        className="luxury-input text-xs min-h-[60px]"
        maxLength={1000}
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="luxury-button-primary text-[10px] py-2 px-6 inline-flex items-center gap-1.5"
      >
        <Send size={12} />
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ProductDetail;