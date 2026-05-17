import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Gift, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/hooks/useSupabase';
import { isWithinSchedule, toNumber } from '@/lib/popupSchedule';

export type SpinSegment = {
  label: string;
  short: string;
  color: string;
  code: string;
  weight: number;
  win: boolean;
};

export const DEFAULT_SPIN_SEGMENTS: SpinSegment[] = [
  { label: '10% OFF',       short: '10%',            color: '#F472B6', code: 'LUCKY10',  weight: 38, win: true },
  { label: '20% OFF',       short: '20%',            color: '#A78BFA', code: 'LUCKY20',  weight: 6,  win: true },
  { label: 'FREE DELIVERY', short: 'FREE\nDELIVERY', color: '#34D399', code: 'FREESHIP', weight: 30, win: true },
  { label: '40% OFF',       short: '40%',            color: '#FBBF24', code: 'LUCKY40',  weight: 2,  win: true },
  { label: 'BETTER LUCK',   short: 'TRY\nAGAIN',     color: '#94A3B8', code: '',         weight: 18, win: false },
  { label: '70% OFF',       short: '70%',            color: '#F87171', code: 'MEGA70',   weight: 1,  win: true },
  { label: '15% OFF',       short: '15%',            color: '#60A5FA', code: 'LUCKY15',  weight: 5,  win: true },
];

const STORAGE_KEY = 'spin_wheel_seen_v1';
const SPUN_KEY = 'spin_wheel_spun_v1';
const RESULT_KEY = 'spin_wheel_result_v1';

// Only these prizes are ever awarded (matched by label keywords, case-insensitive)
const ALLOWED_WIN_PATTERNS = [/10\s*%/i, /15\s*%/i, /free\s*delivery/i];
const isAllowedWinner = (s: SpinSegment) =>
  s.win && ALLOWED_WIN_PATTERNS.some(rx => rx.test(s.label));

type Props = {
  embedded?: boolean;
  segmentsOverride?: SpinSegment[];
  titleOverride?: string;
  subtitleOverride?: string;
};

const SpinWheelPopup = ({ embedded = false, segmentsOverride, titleOverride, subtitleOverride }: Props) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { data: settings } = useStoreSettings();

  const scheduleOk = embedded ? true : isWithinSchedule(settings?.spin_wheel_start_at, settings?.spin_wheel_end_at);
  const enabled = embedded ? true : (settings?.spin_wheel_enabled !== 'false' && scheduleOk);
  const delaySec = toNumber(settings?.spin_wheel_delay_seconds, 1);
  const autoCloseSec = toNumber(settings?.spin_wheel_auto_close_seconds, 5);
  const title = titleOverride ?? settings?.spin_wheel_title ?? 'UP TO 70% OFF';
  const subtitle = subtitleOverride ?? settings?.spin_wheel_subtitle ?? 'Try your luck — spin the wheel!';

  const segments = useMemo<SpinSegment[]>(() => {
    if (segmentsOverride && segmentsOverride.length >= 2) return segmentsOverride;
    const raw = settings?.spin_wheel_segments;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
      } catch {}
    }
    return DEFAULT_SPIN_SEGMENTS;
  }, [settings?.spin_wheel_segments, segmentsOverride]);

  const SEG_COUNT = segments.length;
  const SEG_ANGLE = 360 / SEG_COUNT;

  const slicePath = (i: number, r = 100) => {
    const start = (i * SEG_ANGLE - 90) * (Math.PI / 180);
    const end = ((i + 1) * SEG_ANGLE - 90) * (Math.PI / 180);
    const x1 = r * Math.cos(start);
    const y1 = r * Math.sin(start);
    const x2 = r * Math.cos(end);
    const y2 = r * Math.sin(end);
    const large = SEG_ANGLE > 180 ? 1 : 0;
    return `M0 0 L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  const pickWinnerIndex = () => {
    // Force winner among allowed prizes only (10%, 15%, Free Delivery)
    const allowedIdx = segments
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => isAllowedWinner(s));
    if (allowedIdx.length === 0) {
      // Fallback to any win segment, else random
      const wins = segments.map((s, i) => ({ s, i })).filter(({ s }) => s.win);
      const pool = wins.length ? wins : segments.map((s, i) => ({ s, i }));
      return pool[Math.floor(Math.random() * pool.length)].i;
    }
    const total = allowedIdx.reduce((sum, x) => sum + (x.s.weight || 1), 0);
    let r = Math.random() * total;
    for (const { s, i } of allowedIdx) {
      r -= s.weight || 1;
      if (r <= 0) return i;
    }
    return allowedIdx[0].i;
  };

  const [open, setOpen] = useState(embedded);
  const [mini, setMini] = useState(false);
  const [hidden, setHidden] = useState(false);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinSegment | null>(null);
  const [copied, setCopied] = useState(false);
  const miniTimer = useRef<number | null>(null);

  // Restore previous spin result (locks the wheel until an order is placed)
  useEffect(() => {
    if (embedded) return;
    if (typeof window === 'undefined') return;
    try {
      const spun = localStorage.getItem(SPUN_KEY);
      const saved = localStorage.getItem(RESULT_KEY);
      if (spun && saved) {
        const parsed = JSON.parse(saved) as SpinSegment;
        setResult(parsed);
      }
    } catch {}
  }, [embedded]);

  useEffect(() => {
    if (embedded) return;
    if (isAdmin) return;
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) {
      setMini(true);
      return;
    }
    const t = setTimeout(() => {
      setOpen(true);
      if (autoCloseSec > 0) {
        miniTimer.current = window.setTimeout(() => {
          setOpen(false);
          setMini(true);
          sessionStorage.setItem(STORAGE_KEY, '1');
        }, autoCloseSec * 1000);
      }
    }, Math.max(0, delaySec * 1000));
    return () => {
      clearTimeout(t);
      if (miniTimer.current) clearTimeout(miniTimer.current);
    };
  }, [isAdmin, enabled, embedded, delaySec, autoCloseSec]);

  const cancelAutoMinimize = () => {
    if (miniTimer.current) {
      clearTimeout(miniTimer.current);
      miniTimer.current = null;
    }
  };

  const openModal = () => {
    cancelAutoMinimize();
    setMini(false);
    setOpen(true);
  };

  const closeModal = () => {
    if (embedded) return;
    cancelAutoMinimize();
    setOpen(false);
    setMini(true);
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  const dismissMini = () => {
    setMini(false);
    setHidden(true);
  };

  const handleSpin = () => {
    if (spinning || result) return;
    cancelAutoMinimize();
    setSpinning(true);
    const idx = pickWinnerIndex();
    const sliceCenter = idx * SEG_ANGLE + SEG_ANGLE / 2;
    const extraSpins = 6;
    const target = rotation + extraSpins * 360 + (360 - sliceCenter) - (rotation % 360);
    setRotation(target);
    setTimeout(() => {
      const won = segments[idx];
      setResult(won);
      setSpinning(false);
      if (!embedded) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        try {
          localStorage.setItem(SPUN_KEY, '1');
          localStorage.setItem(RESULT_KEY, JSON.stringify(won));
        } catch {}
      }
    }, 4500);
  };

  const handleCopy = async () => {
    if (!result?.code) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      toast.success('Coupon copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  if (!embedded && (isAdmin || hidden || !enabled)) return null;

  const wheelInner = (
    <div
      className={
        embedded
          ? 'relative w-full max-w-[280px] bg-gradient-to-br from-background via-background to-muted shadow-md rounded-2xl overflow-hidden'
          : 'relative w-full max-w-[280px] sm:max-w-[300px] bg-gradient-to-br from-background via-background to-muted shadow-2xl rounded-2xl overflow-hidden animate-scale-in max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'
      }
      onClick={(e) => e.stopPropagation()}
    >
      {!embedded && (
        <button
          onClick={closeModal}
          aria-label="Close"
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-background/90 border border-border rounded-full flex items-center justify-center hover:bg-muted"
        >
          <X size={14} />
        </button>
      )}

      <div className="px-4 pt-4 text-center">
        <div className="text-[9px] tracking-[0.2em] uppercase font-bold text-pink-600">
          Exclusive Offer
        </div>
        <h3 className="luxury-heading text-base sm:text-lg mt-1 tracking-wider">{title}</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <div className="relative mx-auto my-2 w-[180px] h-[180px] sm:w-[210px] sm:h-[210px]">
        <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-foreground drop-shadow" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 p-[6px] shadow-2xl">
          <div className="w-full h-full rounded-full bg-background p-[4px]">
            <svg
              viewBox="-110 -110 220 220"
              className="w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4.4s cubic-bezier(0.17, 0.67, 0.21, 0.99)' : 'none',
              }}
            >
              {segments.map((s, i) => {
                const mid = i * SEG_ANGLE + SEG_ANGLE / 2 - 90;
                const rad = (mid * Math.PI) / 180;
                const tx = 62 * Math.cos(rad);
                const ty = 62 * Math.sin(rad);
                return (
                  <g key={i}>
                    <path d={slicePath(i)} fill={s.color} stroke="#fff" strokeWidth={1.5} />
                    <g transform={`translate(${tx} ${ty}) rotate(${mid + 90})`}>
                      {(s.short || '').split('\n').map((line, li, arr) => (
                        <text
                          key={li}
                          x={0}
                          y={(li - (arr.length - 1) / 2) * 11}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="800"
                          fill="#fff"
                          style={{ fontFamily: 'system-ui, sans-serif' }}
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  </g>
                );
              })}
              <circle cx={0} cy={0} r={14} fill="#fff" stroke="#e5e7eb" strokeWidth={2} />
            </svg>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        {!result ? (
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white font-bold tracking-wider text-xs sm:text-sm shadow-lg hover:opacity-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {spinning ? 'SPINNING...' : 'SPIN NOW'}
          </button>
        ) : result.win ? (
          <div className="text-center animate-fade-in">
            <p className="text-[11px] tracking-[0.2em] uppercase text-pink-600 font-bold">Congratulations!</p>
            <h4 className="text-base font-bold mt-0.5">You won {result.label}</h4>
            {result.code && (
              <div className="mt-2 border-2 border-dashed border-foreground/30 p-2.5 bg-muted/40 rounded-lg">
                <p className="text-[9px] text-muted-foreground tracking-wider uppercase mb-0.5">Your Coupon Code</p>
                <p className="text-base font-mono font-bold tracking-[0.2em]">{result.code}</p>
              </div>
            )}
            {result.code && (
              <button
                onClick={handleCopy}
                className="mt-2 w-full py-2.5 rounded-xl bg-foreground text-background font-bold tracking-wider text-xs sm:text-sm hover:opacity-90 inline-flex items-center justify-center gap-2"
              >
                {copied ? <><Check size={14} /> COPIED</> : <><Copy size={14} /> COPY CODE</>}
              </button>
            )}
            <p className="text-[9px] text-muted-foreground mt-1.5">Apply at checkout. Valid for limited time.</p>
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <h4 className="text-base font-bold">Better luck next time!</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Don't worry — explore our latest collection.</p>
            {!embedded && (
              <button
                onClick={closeModal}
                className="mt-2 w-full py-2.5 rounded-xl bg-foreground text-background font-bold tracking-wider text-xs sm:text-sm hover:opacity-90"
              >
                CONTINUE SHOPPING
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return wheelInner;

  return (
    <>
      {mini && !open && (
        <button
          onClick={openModal}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] group"
          aria-label="Open spin to win"
        >
          <div className="relative bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 text-white shadow-2xl rounded-r-2xl pl-2 pr-3 py-3 flex items-center gap-2 animate-fade-in">
            <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Gift size={16} className="animate-pulse" />
            </div>
            <div className="text-[10px] font-bold tracking-wider leading-tight">
              SPIN<br />& WIN
            </div>
            <span
              onClick={(e) => { e.stopPropagation(); dismissMini(); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center shadow"
              role="button"
              aria-label="Dismiss"
            >
              <X size={10} className="text-foreground" />
            </span>
          </div>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          {wheelInner}
        </div>
      )}
    </>
  );
};

export default SpinWheelPopup;
