/**
 * Magnetic CTA: [data-magnetic] eases a few pixels toward the cursor.
 * Fine pointers only, no library, transform-only (no layout), and it stops
 * as soon as the pointer leaves. Strength is capped so it never feels like a gimmick.
 */
import { finePointer, prefersReducedMotion } from './env';

const MAX = 6; // px

export function initMagnetic(root: ParentNode = document) {
  if (!finePointer() || prefersReducedMotion()) return;
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    if (el.dataset.magneticBound) return;
    el.dataset.magneticBound = 'true';
    let raf = 0;
    let rect: DOMRect | undefined;

    const move = (e: PointerEvent) => {
      rect ??= el.getBoundingClientRect();
      const r = rect;
      const x = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * MAX;
      const y = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * (MAX * 0.66);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${x.toFixed(2)}px`);
        el.style.setProperty('--my', `${y.toFixed(2)}px`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      rect = undefined;
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    };

    el.addEventListener('pointerenter', () => (rect = el.getBoundingClientRect()));
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('blur', reset);
  });
}
