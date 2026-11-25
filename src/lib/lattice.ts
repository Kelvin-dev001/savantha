/**
 * Geometry of the lattice motif, shared by <Lattice /> and the generated Open Graph cards
 * (src/lib/og.ts), so the motif is drawn the same way on the page and in a link preview.
 */

const r = (n: number) => Math.round(n * 100) / 100;

/**
 * Eight-point star outline (two interlaced squares, outline only), centred in a tile.
 * Outer points at R = tile/2 touch the tile edges, so neighbouring stars meet point-to-point
 * and the gaps between them resolve into crosses: the classic star-and-cross lattice.
 */
export function starPath(size: number): string {
  const c = size / 2;
  const R = size / 2;
  const inner = R * (Math.SQRT1_2 / Math.cos(Math.PI / 8)); // ≈ 0.765 R
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : inner;
    pts.push(`${r(c + rad * Math.cos(a))} ${r(c + rad * Math.sin(a))}`);
  }
  return `M${pts.join('L')}Z`;
}

/** The fine octagon drawn inside each star when `detail` is on. */
export function octagonPath(size: number): string {
  const c = size / 2;
  const rad = (size / 2) * 0.42;
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8 - Math.PI / 2;
    pts.push(`${r(c + rad * Math.cos(a))} ${r(c + rad * Math.sin(a))}`);
  }
  return `M${pts.join('L')}Z`;
}

export const round2 = r;
