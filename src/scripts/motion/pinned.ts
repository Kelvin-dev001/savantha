/**
 * Pinned sections ([data-pin]). Vanilla, no GSAP: the layout is plain CSS `position: sticky`
 * (see HomeProcess.astro); this only reports progress through the section.
 *
 *   --p             0 → 1 across the pinned scroll distance (drives the rule and the drawing)
 *   data-step       index of the active step (data-pin-steps equal segments)
 *   [data-step-i]   descendants whose index matches the active step get [data-active]
 *
 * Work happens in one rAF per scroll frame, and only while the section is near the viewport.
 * When the CSS decides the section is not pinned (narrow, short, reduced motion) the values
 * are still set but nothing reads them.
 */
export function initPinned(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-pin]').forEach((el) => {
    if (el.dataset.pinBound) return;
    el.dataset.pinBound = 'true';

    const steps = Math.max(1, Number(el.dataset.pinSteps) || 1);
    const items = [...el.querySelectorAll<HTMLElement>('[data-step-i]')];
    let raf = 0;
    let active = -1;
    let near = false;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const distance = r.height - window.innerHeight;
      const p = distance > 0 ? Math.min(1, Math.max(0, -r.top / distance)) : 0;
      el.style.setProperty('--p', p.toFixed(4));
      const step = Math.min(steps - 1, Math.floor(p * steps));
      if (step === active) return;
      active = step;
      el.dataset.step = String(step);
      for (const item of items)
        item.toggleAttribute('data-active', Number(item.dataset.stepI) === step);
    };
    const schedule = () => {
      if (near && !raf) raf = requestAnimationFrame(update);
    };

    new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        schedule();
      },
      { rootMargin: '50% 0px' },
    ).observe(el);

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  });
}
