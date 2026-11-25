/** Shared motion environment checks. Tiny on purpose: imported by the up-front loader. */

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Mouse/trackpad. Magnetic hover and wheel smoothing only make sense here. */
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function onIdle(fn: () => void, timeout = 1200) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout });
  else setTimeout(fn, 200);
}

/** Events other components use to talk to the scroll engine (e.g. the mobile menu). */
export const SCROLL_LOCK = 'savantho:scroll-lock';
export type ScrollLockDetail = { locked: boolean };

export function setScrollLock(locked: boolean) {
  window.dispatchEvent(new CustomEvent<ScrollLockDetail>(SCROLL_LOCK, { detail: { locked } }));
}
