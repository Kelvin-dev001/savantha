import type { Page } from '@playwright/test';

/**
 * Wait until nothing on screen is mid-animation: no running finite CSS/Web animations, and
 * no element GSAP is still fading (an inline opacity between 0 and 1). axe measures colour
 * contrast as rendered, so text caught half-way through a fade reads as a false failure.
 * Designed partial opacities (in stylesheets) are left alone. Scroll-driven animations (the
 * article reading rail) are "running" for as long as the page is open, so only animations on
 * the document's clock are waited for.
 */
export async function settle(page: Page, timeout = 10_000) {
  await page.waitForFunction(
    () => {
      const running = document
        .getAnimations()
        .some(
          (a) =>
            a.playState === 'running' &&
            a.timeline === document.timeline &&
            a.effect?.getTiming().iterations !== Infinity,
        );
      if (running) return false;
      for (const el of document.querySelectorAll<HTMLElement | SVGElement>(
        '[data-reveal][style*="opacity"], [data-reveal] [style*="opacity"]',
      )) {
        if (el instanceof SVGElement) continue; // the lattice sets its own low opacity
        const o = Number(el.style.opacity);
        if (o > 0 && o < 1) return false;
      }
      return true;
    },
    undefined,
    { timeout, polling: 100 },
  );
}
