import { useEffect, useState, useRef } from 'react';
import { Play, X, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useStoreSettings } from '@/hooks/useSupabase';
import { MOCK_HOMEPAGE_VIDEOS } from '@/data/mockData';

export type HomepageVideo = {
  youtubeId: string;
  title: string;
  date?: string;
  thumbnail?: string;
};

const getYouTubeId = (urlOrId: string): string => {
  if (!urlOrId) return '';
  if (!urlOrId.includes('http') && !urlOrId.includes('/')) return urlOrId;
  const m = urlOrId.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : urlOrId;
};

const VideoCarousel = () => {
  const { data: settings = {} } = useStoreSettings();
  const raw = settings['homepage_videos'];
  const parsed: HomepageVideo[] = raw ? JSON.parse(raw) : [];
  const videos = parsed.length > 0 ? parsed : MOCK_HOMEPAGE_VIDEOS;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center', skipSnaps: false });
  const [activeIdx, setActiveIdx] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const autoplayRef = useRef<number | null>(null);

  // Track active slide
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIdx(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi]);

  // Auto-slide (pause when modal open)
  useEffect(() => {
    if (!emblaApi || playingId) return;
    autoplayRef.current = window.setInterval(() => emblaApi.scrollNext(), 4000);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [emblaApi, playingId]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (playingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [playingId]);

  if (videos.length === 0) return null;

  return (
    <section className="w-full bg-background pt-0 sm:pt-2 pb-2 sm:pb-6">
      <div className="relative max-w-7xl mx-auto">
        <div className="overflow-hidden pt-2 sm:pt-4" ref={emblaRef}>
          <div className="flex">
            {videos.map((v, i) => {
              const id = getYouTubeId(v.youtubeId);
              const thumb = v.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
              const isActive = i === activeIdx;
              return (
                <div
                  key={i}
                  className="flex-[0_0_85%] sm:flex-[0_0_60%] lg:flex-[0_0_42%] min-w-0 px-2 sm:px-3"
                >
                  <div
                    className={`bg-card rounded-2xl shadow-sm overflow-hidden transition-all duration-500 ${
                      isActive ? 'opacity-100 scale-100 shadow-xl' : 'opacity-60 scale-[0.95]'
                    }`}
                  >
                    {/* Thumbnail with custom play button */}
                    <button
                      onClick={() => setPlayingId(id)}
                      className="relative w-full aspect-video group block overflow-hidden rounded-2xl bg-muted"
                      aria-label={`Play ${v.title}`}
                    >
                      <img
                        src={thumb}
                        alt={v.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Mute/volume corner icon (decorative) */}
                      <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Volume2 size={14} className="text-white" />
                      </span>
                      {/* Center play button */}
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-[hsl(var(--announce))] shadow-lg group-hover:scale-110 transition-transform">
                          <Play size={26} className="text-white ml-1" fill="currentColor" />
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arrows (desktop) */}
        {videos.length > 1 && (
          <>
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 border border-border shadow items-center justify-center hover:bg-background"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 border border-border shadow items-center justify-center hover:bg-background"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dots */}
        {videos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIdx ? 'w-6 bg-foreground' : 'w-1.5 bg-foreground/30'
                }`}
                aria-label={`Go to video ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* YouTube Player Modal */}
      {playingId && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPlayingId(null)}
        >
          <button
            onClick={() => setPlayingId(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div
            className="w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${playingId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title="YouTube video player"
              className="w-full h-full rounded-lg"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoCarousel;
