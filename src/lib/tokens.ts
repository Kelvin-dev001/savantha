/**
 * Reads colour tokens straight from global.css (the single source of truth)
 * and computes WCAG 2.2 contrast ratios. Build-time only — used by /styleguide.
 */
import css from '@/styles/global.css?raw';

export interface ColorToken {
  name: string;
  value: string;
  rgb: [number, number, number];
  alpha: number;
  comment: string;
}

export function readColorTokens(): ColorToken[] {
  const theme = css.slice(css.indexOf('@theme'), css.indexOf('/* Type families'));
  const re =
    /--color-([a-z0-9-]+):\s*(#[0-9a-f]{6}|rgb\(\s*\d+\s+\d+\s+\d+(?:\s*\/\s*[\d.]+)?\s*\));\s*(?:\/\*\s*(.*?)\s*\*\/)?/gi;
  const out: ColorToken[] = [];
  for (const m of theme.matchAll(re)) {
    const [, name, value, comment = ''] = m;
    const { rgb, alpha } = parse(value);
    out.push({ name, value, rgb, alpha, comment });
  }
  return out;
}

function parse(value: string): { rgb: [number, number, number]; alpha: number } {
  if (value.startsWith('#')) {
    const n = parseInt(value.slice(1), 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const [r, g, b, a] = value.match(/[\d.]+/g)!.map(Number);
  return { rgb: [r, g, b], alpha: a ?? 1 };
}

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
export const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

/** Composite a translucent colour over an opaque background. */
export const over = (
  fg: [number, number, number],
  alpha: number,
  bg: [number, number, number],
): [number, number, number] =>
  fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as [number, number, number];

export function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export const toHex = (rgb: [number, number, number]) =>
  '#' +
  rgb
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
