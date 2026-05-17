// Fly-to-cart animation: clones the product image and animates it along a
// curved arc to the nearest visible [data-cart-target] with a smooth shrink,
// rotation, and fade. Uses Web Animations API for buttery motion.

export function flyToCart(sourceEl: Element | null | undefined, imageUrl?: string) {
  try {
    if (!sourceEl || typeof window === 'undefined') return;

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('[data-cart-target]')
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      return (
        r.bottom > 0 &&
        r.right > 0 &&
        r.top < window.innerHeight &&
        r.left < window.innerWidth
      );
    });
    if (targets.length === 0) return;

    const srcRect = (sourceEl as HTMLElement).getBoundingClientRect();
    const srcCenter = { x: srcRect.left + srcRect.width / 2, y: srcRect.top + srcRect.height / 2 };

    const target = targets.reduce((best, el) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(cx - srcCenter.x, cy - srcCenter.y);
      if (!best || d < best.d) return { el, d, r };
      return best;
    }, null as null | { el: HTMLElement; d: number; r: DOMRect })!;

    let url = imageUrl;
    if (!url) {
      const img = (sourceEl as HTMLElement).querySelector('img') as HTMLImageElement | null;
      url = img?.currentSrc || img?.src || '';
    }
    if (!url) return;

    const startSize = Math.min(160, Math.max(90, srcRect.width * 0.55));
    const endSize = 24;

    const startX = srcCenter.x - startSize / 2;
    const startY = srcCenter.y - startSize / 2;
    const endCx = target.r.left + target.r.width / 2;
    const endCy = target.r.top + target.r.height / 2;
    const endX = endCx - startSize / 2;
    const endY = endCy - startSize / 2;

    const dx = endX - startX;
    const dy = endY - startY;

    // Arc control: lift the path upward for a graceful curve
    const lift = Math.min(220, Math.max(80, Math.hypot(dx, dy) * 0.35));
    const midX = dx * 0.5;
    const midY = dy * 0.5 - lift;

    // Wrapper holds position; inner image rotates independently
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'fixed',
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${startSize}px`,
      height: `${startSize}px`,
      zIndex: '9999',
      pointerEvents: 'none',
      willChange: 'transform, opacity',
    } as CSSStyleDeclaration);

    const flyer = document.createElement('img');
    flyer.src = url;
    flyer.alt = '';
    Object.assign(flyer.style, {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '14px',
      boxShadow: '0 20px 45px -10px hsla(0,0%,0%,0.35), 0 8px 18px -6px hsla(0,0%,0%,0.25)',
      display: 'block',
      willChange: 'transform',
    } as CSSStyleDeclaration);

    wrapper.appendChild(flyer);
    document.body.appendChild(wrapper);

    const duration = 850;
    const scaleEnd = endSize / startSize;

    const wrapperAnim = wrapper.animate(
      [
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1, borderRadius: '14px' },
        { transform: `translate(${midX}px, ${midY}px) scale(0.75)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scaleEnd})`, opacity: 0.2 },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
        fill: 'forwards',
      }
    );

    flyer.animate(
      [
        { transform: 'rotate(0deg)', borderRadius: '14px' },
        { transform: 'rotate(180deg)', borderRadius: '50%', offset: 0.6 },
        { transform: 'rotate(360deg)', borderRadius: '50%' },
      ],
      { duration, easing: 'ease-in-out', fill: 'forwards' }
    );

    const cleanup = () => {
      wrapper.remove();
      const el = target.el;
      const bump = el.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.35)', offset: 0.4 },
          { transform: 'scale(0.92)', offset: 0.7 },
          { transform: 'scale(1)' },
        ],
        { duration: 480, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
      );
      bump.onfinish = () => {
        el.style.transform = '';
      };
    };

    wrapperAnim.onfinish = cleanup;
    window.setTimeout(() => { if (wrapper.isConnected) cleanup(); }, duration + 400);
  } catch {
    // no-op
  }
}
