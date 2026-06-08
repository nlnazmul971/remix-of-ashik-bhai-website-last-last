import { Link } from 'react-router-dom';
import { Check, Star, Quote, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export type LandingBlock = { type: string; data: any };

const Hero = ({ data }: { data: any }) => (
  <section className="relative overflow-hidden min-h-[70vh] md:min-h-[85vh] flex items-center justify-center px-4 py-20 md:py-28">
    {data.image ? (
      <>
        <img
          src={data.image}
          alt={data.image_alt || data.headline || 'Hero background'}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/40 to-foreground/70" />
      </>
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20" />
    )}

    <div className="relative max-w-5xl mx-auto text-center">
      {data.eyebrow && (
        <p className={`inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase mb-5 px-4 py-1.5 rounded-full ${data.image ? 'bg-background/15 backdrop-blur text-background border border-background/20' : 'bg-primary/10 text-primary'}`}>
          <Sparkles className="w-3 h-3" /> {data.eyebrow}
        </p>
      )}
      <h1 className={`luxury-heading text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6 leading-[1.05] ${data.image ? 'text-background drop-shadow-lg' : ''}`}>
        {data.headline}
      </h1>
      {data.subheadline && (
        <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-9 ${data.image ? 'text-background/90' : 'text-muted-foreground'}`}>
          {data.subheadline}
        </p>
      )}
      {data.cta_text && (
        <Button asChild size="lg" className="text-base px-10 h-12 rounded-full shadow-xl hover:scale-105 transition-transform">
          <Link to={data.cta_link || '/'}>{data.cta_text} →</Link>
        </Button>
      )}
    </div>
  </section>
);

const TextBlock = ({ data }: { data: any }) => (
  <section className="py-16 px-4">
    <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert prose-headings:luxury-heading" dangerouslySetInnerHTML={{ __html: data.html || '' }} />
  </section>
);

const Features = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4 bg-background">
    <div className="max-w-6xl mx-auto">
      {data.heading && (
        <div className="text-center mb-14">
          <h2 className="luxury-heading text-3xl md:text-4xl mb-3">{data.heading}</h2>
          <div className="w-12 h-px bg-primary mx-auto" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(data.items || []).map((item: any, i: number) => (
          <div key={i} className="group text-center p-8 rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all bg-card">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonials = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-muted/40 to-background">
    <div className="max-w-6xl mx-auto">
      {data.heading && (
        <div className="text-center mb-14">
          <h2 className="luxury-heading text-3xl md:text-4xl mb-3">{data.heading}</h2>
          <div className="w-12 h-px bg-primary mx-auto" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(data.items || []).map((t: any, i: number) => (
          <div key={i} className="bg-background rounded-2xl p-7 border border-border shadow-sm hover:shadow-md transition-shadow">
            <Quote className="w-8 h-8 text-primary/30 mb-3" />
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.rating || 5 }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-5 text-foreground/90">"{t.quote}"</p>
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold">{t.name}</p>
              {t.role && <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTA = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)' }} />
    <div className="relative max-w-3xl mx-auto text-center text-primary-foreground">
      <h2 className="luxury-heading text-3xl md:text-5xl mb-4 leading-tight">{data.headline}</h2>
      {data.subheadline && <p className="text-lg opacity-90 mb-9">{data.subheadline}</p>}
      {data.cta_text && (
        <Button asChild size="lg" variant="secondary" className="text-base px-10 h-12 rounded-full shadow-xl hover:scale-105 transition-transform">
          <Link to={data.cta_link || '/'}>{data.cta_text} →</Link>
        </Button>
      )}
    </div>
  </section>
);

const FAQ = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4">
    <div className="max-w-3xl mx-auto">
      {data.heading && (
        <div className="text-center mb-12">
          <h2 className="luxury-heading text-3xl md:text-4xl mb-3">{data.heading}</h2>
          <div className="w-12 h-px bg-primary mx-auto" />
        </div>
      )}
      <Accordion type="single" collapsible className="w-full space-y-3">
        {(data.items || []).map((f: any, i: number) => (
          <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl px-5 bg-card">
            <AccordionTrigger className="text-left hover:no-underline font-medium">{f.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

const Stats = ({ data }: { data: any }) => (
  <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {(data.items || []).map((s: any, i: number) => (
        <div key={i} className="p-4">
          <p className="text-4xl md:text-6xl luxury-heading font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">{s.value}</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-2 tracking-wider uppercase">{s.label}</p>
        </div>
      ))}
    </div>
  </section>
);

const Trust = ({ data }: { data: any }) => (
  <section className="py-14 px-4 border-y border-border bg-muted/20">
    <div className="max-w-6xl mx-auto">
      {data.heading && <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground text-center mb-8">{data.heading}</p>}
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-20">
        {(data.items || []).map((t: any, i: number) =>
          t.image ? (
            <img key={i} src={t.image} alt={t.image_alt || t.name || 'Brand logo'} className="h-10 md:h-12 object-contain opacity-80 hover:opacity-100 transition-opacity" />
          ) : (
            <span key={i} className="text-base md:text-lg font-semibold tracking-wider text-foreground/70 hover:text-foreground transition-colors">{t.name}</span>
          )
        )}
      </div>
    </div>
  </section>
);

const Newsletter = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-secondary/30 to-muted/40">
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="luxury-heading text-3xl md:text-4xl mb-4">{data.headline || 'Stay in the loop'}</h2>
      {data.subheadline && <p className="text-muted-foreground mb-8">{data.subheadline}</p>}
      <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
        <input type="email" required placeholder="your@email.com" className="luxury-input flex-1 rounded-full px-5" />
        <Button type="submit" className="rounded-full px-8">Subscribe</Button>
      </form>
    </div>
  </section>
);

const Gallery = ({ data }: { data: any }) => (
  <section className="py-16 px-4">
    <div className="max-w-7xl mx-auto">
      {data.heading && (
        <div className="text-center mb-12">
          <h2 className="luxury-heading text-3xl md:text-4xl mb-3">{data.heading}</h2>
          <div className="w-12 h-px bg-primary mx-auto" />
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {(data.images || []).filter(Boolean).map((src: string, i: number) => (
          <div key={i} className="aspect-square overflow-hidden rounded-xl bg-muted group">
            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const renderBlock = (block: LandingBlock, key: number) => {
  switch (block.type) {
    case 'hero': return <Hero key={key} data={block.data} />;
    case 'text': return <TextBlock key={key} data={block.data} />;
    case 'features': return <Features key={key} data={block.data} />;
    case 'testimonials': return <Testimonials key={key} data={block.data} />;
    case 'cta': return <CTA key={key} data={block.data} />;
    case 'faq': return <FAQ key={key} data={block.data} />;
    case 'stats': return <Stats key={key} data={block.data} />;
    case 'trust': return <Trust key={key} data={block.data} />;
    case 'newsletter': return <Newsletter key={key} data={block.data} />;
    case 'gallery': return <Gallery key={key} data={block.data} />;
    default: return null;
  }
};

export const BLOCK_TYPES: { type: string; label: string; defaultData: any }[] = [
  { type: 'hero', label: 'Hero Banner', defaultData: { eyebrow: 'NEW', headline: 'Your headline here', subheadline: 'Supporting tagline that sells.', cta_text: 'Shop Now', cta_link: '/', image: '' } },
  { type: 'text', label: 'Text / Content', defaultData: { html: '<p>Add your content here.</p>' } },
  { type: 'features', label: 'Features / USP', defaultData: { heading: 'Why choose us', items: [{ title: 'Premium Quality', description: 'Crafted with care.' }, { title: 'Fast Shipping', description: 'Delivered quickly.' }, { title: 'Easy Returns', description: '30-day guarantee.' }] } },
  { type: 'testimonials', label: 'Testimonials', defaultData: { heading: 'What our customers say', items: [{ name: 'Customer Name', role: 'Verified Buyer', quote: 'Amazing product!', rating: 5 }] } },
  { type: 'cta', label: 'CTA Banner', defaultData: { headline: 'Ready to start?', subheadline: 'Join thousands of happy customers.', cta_text: 'Get Started', cta_link: '/' } },
  { type: 'faq', label: 'FAQ Accordion', defaultData: { heading: 'Frequently asked questions', items: [{ question: 'How long does shipping take?', answer: '3-5 business days.' }] } },
  { type: 'stats', label: 'Stats / Numbers', defaultData: { items: [{ value: '10k+', label: 'Happy Customers' }, { value: '4.9★', label: 'Avg Rating' }, { value: '24h', label: 'Fast Shipping' }, { value: '100%', label: 'Guaranteed' }] } },
  { type: 'trust', label: 'Trust Badges', defaultData: { heading: 'As seen in', items: [{ name: 'Vogue' }, { name: 'Elle' }, { name: 'Harper\'s' }] } },
  { type: 'newsletter', label: 'Newsletter Signup', defaultData: { headline: 'Join our newsletter', subheadline: 'Get 10% off your first order.' } },
  { type: 'gallery', label: 'Image Gallery', defaultData: { heading: 'Gallery', images: [] } },
];
