import { Link } from 'react-router-dom';
import { Check, Star, Quote } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export type LandingBlock = { type: string; data: any };

const Hero = ({ data }: { data: any }) => (
  <section className="relative bg-muted/30 py-20 md:py-32 px-4">
    {data.image && (
      <div className="absolute inset-0 -z-10 opacity-30">
        <img src={data.image} alt={data.image_alt || data.headline || ''} className="w-full h-full object-cover" />
      </div>
    )}
    <div className="max-w-5xl mx-auto text-center">
      {data.eyebrow && <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">{data.eyebrow}</p>}
      <h1 className="luxury-heading text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6">{data.headline}</h1>
      {data.subheadline && <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">{data.subheadline}</p>}
      {data.cta_text && (
        <Button asChild size="lg" className="text-base px-8">
          <Link to={data.cta_link || '/'}>{data.cta_text}</Link>
        </Button>
      )}
    </div>
  </section>
);

const TextBlock = ({ data }: { data: any }) => (
  <section className="py-16 px-4">
    <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert" dangerouslySetInnerHTML={{ __html: data.html || '' }} />
  </section>
);

const Features = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4 bg-background">
    <div className="max-w-6xl mx-auto">
      {data.heading && <h2 className="luxury-heading text-3xl md:text-4xl text-center mb-12">{data.heading}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(data.items || []).map((item: any, i: number) => (
          <div key={i} className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonials = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4 bg-muted/30">
    <div className="max-w-6xl mx-auto">
      {data.heading && <h2 className="luxury-heading text-3xl md:text-4xl text-center mb-12">{data.heading}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(data.items || []).map((t: any, i: number) => (
          <div key={i} className="bg-background rounded-lg p-6 border border-border">
            <Quote className="w-6 h-6 text-muted-foreground mb-3" />
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: t.rating || 5 }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm mb-4">"{t.quote}"</p>
            <p className="text-sm font-semibold">{t.name}</p>
            {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTA = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4 bg-primary text-primary-foreground">
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="luxury-heading text-3xl md:text-5xl mb-4">{data.headline}</h2>
      {data.subheadline && <p className="text-lg opacity-90 mb-8">{data.subheadline}</p>}
      {data.cta_text && (
        <Button asChild size="lg" variant="secondary" className="text-base px-8">
          <Link to={data.cta_link || '/'}>{data.cta_text}</Link>
        </Button>
      )}
    </div>
  </section>
);

const FAQ = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4">
    <div className="max-w-3xl mx-auto">
      {data.heading && <h2 className="luxury-heading text-3xl md:text-4xl text-center mb-12">{data.heading}</h2>}
      <Accordion type="single" collapsible className="w-full">
        {(data.items || []).map((f: any, i: number) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{f.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

const Stats = ({ data }: { data: any }) => (
  <section className="py-16 px-4 bg-muted/30">
    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {(data.items || []).map((s: any, i: number) => (
        <div key={i}>
          <p className="text-3xl md:text-5xl luxury-heading font-bold text-primary">{s.value}</p>
          <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
        </div>
      ))}
    </div>
  </section>
);

const Trust = ({ data }: { data: any }) => (
  <section className="py-12 px-4 border-y border-border">
    <div className="max-w-6xl mx-auto">
      {data.heading && <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground text-center mb-8">{data.heading}</p>}
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
        {(data.items || []).map((t: any, i: number) =>
          t.image ? (
            <img key={i} src={t.image} alt={t.name || ''} className="h-8 md:h-10 object-contain" />
          ) : (
            <span key={i} className="text-sm font-semibold tracking-wider">{t.name}</span>
          )
        )}
      </div>
    </div>
  </section>
);

const Newsletter = ({ data }: { data: any }) => (
  <section className="py-16 md:py-24 px-4 bg-muted/30">
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="luxury-heading text-3xl md:text-4xl mb-4">{data.headline || 'Stay in the loop'}</h2>
      {data.subheadline && <p className="text-muted-foreground mb-8">{data.subheadline}</p>}
      <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
        <input type="email" required placeholder="your@email.com" className="luxury-input flex-1" />
        <Button type="submit">Subscribe</Button>
      </form>
    </div>
  </section>
);

const Gallery = ({ data }: { data: any }) => (
  <section className="py-16 px-4">
    <div className="max-w-7xl mx-auto">
      {data.heading && <h2 className="luxury-heading text-3xl md:text-4xl text-center mb-12">{data.heading}</h2>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(data.images || []).map((src: string, i: number) => (
          <div key={i} className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
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
