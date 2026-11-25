/**
 * Lenis smooth scroll. Wheel only: touch, keyboard and assistive tech keep native scrolling.
 * Anchor links are left to the browser so the skip link still moves focus.
 */
import Lenis from 'lenis';
import { SCROLL_LOCK, type ScrollLockDetail } from './env';

let lenis: Lenis | undefined;

export function getLenis() {
  return lenis;
}

export function initSmoothScroll() {
  if (lenis) return lenis;
  lenis = new Lenis({
    lerp: 0.12, // a touch firmer than the default 0.1: quiet, not floaty
    smoothWheel: true,
    syncTouch: false,
    autoRaf: true,
    anchors: false,
    respectReducedMotion: true,
  });

  window.addEventListener(SCROLL_LOCK, (e) => {
    const { locked } = (e as CustomEvent<ScrollLockDetail>).detail;
    if (locked) lenis?.stop();
    else lenis?.start();
  });

  // Hand the instance to ScrollTrigger (./scroll) without importing Lenis into that chunk.
  (window as Window & { __lenis?: Lenis }).__lenis = lenis;
  window.dispatchEvent(new CustomEvent<Lenis>('savantho:lenis-ready', { detail: lenis }));
  return lenis;
}
