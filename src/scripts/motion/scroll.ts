/**
 * Scroll-driven motion (GSAP + ScrollTrigger + SplitText). Loaded on demand by ./index.ts.
 *
 *   data-reveal="mask"     Headings. Lines rise out of a mask, once.
 *   data-reveal="fade"     Body copy. Opacity only, once (no "fade up from below" cliché).
 *   data-reveal="rule"     Hairlines. Draw left to right like a ledger rule, once.
 *   data-reveal="stagger"  Children fade in sequence (60 ms), once.
 *   data-reveal="draw"     <Lattice animate="view">: line-draws once when it scrolls in.
 *   data-parallax="16"     Drift up to N px (capped at 24) while in view. Scrubbed, never loops.
 *   data-reveal-delay="0.1" Optional extra delay in seconds.
 *
 * Elements already on screen when this runs are left exactly as they are, so there is
 * never a flash of hidden content and nothing depends on JS to be readable.
 * Nothing re-animates on scroll up.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Mirrors the CSS easing tokens in global.css. */
export const ease = {
  settle: 'expo.out', // ≈ cubic-bezier(0.16, 1, 0.3, 1)
  quiet: 'power2.out', // ≈ cubic-bezier(0.33, 1, 0.68, 1)
  ledger: 'power3.inOut', // ≈ cubic-bezier(0.77, 0, 0.175, 1)
} as const;

const START = 'top 86%';

function offscreen(el: Element) {
  return el.getBoundingClientRect().top > window.innerHeight;
}
function delayOf(el: HTMLElement) {
  return Number.parseFloat(el.dataset.revealDelay ?? '0') || 0;
}

function connectLenis(lenis: Lenis) {
  lenis.on('scroll', ScrollTrigger.update);
}

function reveal(el: HTMLElement) {
  const type = el.dataset.reveal;
  const delay = delayOf(el);
  const trigger = { trigger: el, start: START, once: true };

  switch (type) {
    case 'mask': {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'reveal-line',
        autoSplit: true,
        aria: 'auto',
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 105,
            duration: 1.1,
            ease: ease.settle,
            stagger: 0.08,
            delay,
            scrollTrigger: trigger,
          }),
      });
      break;
    }
    case 'rule':
      gsap.from(el, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.4,
        ease: ease.ledger,
        delay,
        scrollTrigger: trigger,
      });
      break;
    case 'stagger':
      gsap.from(el.children, {
        opacity: 0,
        clearProps: 'opacity', // hand opacity back to CSS (e.g. the pinned step cross-fade)
        duration: 0.9,
        ease: ease.quiet,
        stagger: 0.06,
        delay,
        scrollTrigger: trigger,
      });
      break;
    case 'draw':
      el.dataset.armed = 'true';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 72%',
        once: true,
        onEnter: () => (el.dataset.armed = 'play'),
      });
      break;
    case 'fade':
    default:
      gsap.from(el, {
        opacity: 0,
        clearProps: 'opacity',
        duration: 1,
        ease: ease.quiet,
        delay,
        scrollTrigger: trigger,
      });
  }
  el.dataset.revealBound = 'true';
}

function parallax(el: HTMLElement) {
  const px = Math.min(24, Math.abs(Number.parseFloat(el.dataset.parallax ?? '16') || 16));
  gsap.fromTo(
    el,
    { y: px / 2 },
    {
      y: -px / 2,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );
}

export function initScrollMotion(root: ParentNode = document) {
  const lenis = (window as Window & { __lenis?: Lenis }).__lenis;
  if (lenis) connectLenis(lenis);
  else
    window.addEventListener(
      'savantho:lenis-ready',
      (e) => connectLenis((e as CustomEvent<Lenis>).detail),
      { once: true },
    );

  const run = () => {
    root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-bound])').forEach((el) => {
      if (offscreen(el)) reveal(el);
      else el.dataset.revealBound = 'skipped';
    });
    root.querySelectorAll<HTMLElement>('[data-parallax]').forEach(parallax);
  };

  // Split lines only once the real fonts are in, so line breaks are final.
  void document.fonts.ready.then(run);
}

export { gsap, ScrollTrigger };
