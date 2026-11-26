/**
 * Motion loader — the only motion code that ships up front (well under 1 KB gzipped).
 *
 * Everything heavier is a dynamic import, fetched only when a page actually needs it:
 *   - Lenis smooth scroll        → on idle, fine pointers only (touch keeps native scrolling)
 *   - GSAP + ScrollTrigger       → when a [data-reveal] / [data-parallax] element nears the viewport
 *   - pinned progress (./pinned)  → as soon as the page has a [data-pin] section (< 1 KB)
 *   - magnetic CTA               → inline below, fine pointers only
 *   - 3D seal (./seal3d)         → after load, once idle and the hero entry has played (≈ 4 KB)
 *
 * Reduced motion: nothing loads, nothing is hidden. Content never depends on this file
 * running — reveals only set a "from" state on elements that are still off-screen.
 */
import { prefersReducedMotion, finePointer, onIdle } from './env';
import { initMagnetic } from './magnetic';

function boot() {
  if (prefersReducedMotion()) return;

  if (finePointer()) {
    onIdle(() => void import('./smooth').then((m) => m.initSmoothScroll()));
    initMagnetic();
  }

  if (document.querySelector('[data-seal3d]')) {
    // Never competes with the first paint: after load, after the hero entry, when idle.
    const go = () => onIdle(() => void import('./seal3d').then((m) => m.initSeal3D()), 2000);
    const wait = () => setTimeout(go, Math.max(0, 2200 - performance.now()));
    if (document.readyState === 'complete') wait();
    else window.addEventListener('load', wait, { once: true });
  }

  if (document.querySelector('[data-pin]')) void import('./pinned').then((m) => m.initPinned());

  const targets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-parallax]');
  if (!targets.length) return;

  // client:visible, by hand: fetch GSAP when the first animated element is ~1 viewport away.
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      void import('./scroll').then((m) => m.initScrollMotion());
    },
    { rootMargin: '100% 0px' },
  );
  targets.forEach((el) => io.observe(el));
}

boot();
