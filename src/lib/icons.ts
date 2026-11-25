/**
 * The favicon set, rasterised at build time from public/brand/monogram.svg, so swapping in
 * Savantho's final monogram regenerates every icon. The monogram's letterform is outlined
 * (a path, not <text>), so rasterising needs no installed fonts.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { site } from '@/config/site';

const source = () => readFile(join(process.cwd(), 'public', 'brand', 'monogram.svg'));

/**
 * A square PNG. `inset` is the share of the canvas the monogram fills; the rest is ink,
 * which is what maskable and Apple icons need (they are cropped or rounded by the system).
 */
export async function iconPng(size: number, inset = 1): Promise<Buffer> {
  const mark = await sharp(await source(), { density: 72 * Math.ceil((size * 4) / 64) })
    .resize(Math.round(size * inset), Math.round(size * inset))
    .png()
    .toBuffer();
  if (inset === 1) return sharp(mark).png({ compressionLevel: 9 }).toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: site.themeColor },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** favicon.ico holding PNG images (supported by every browser since IE Vista era). */
export async function faviconIco(sizes = [16, 32, 48]): Promise<Buffer> {
  const images = await Promise.all(sizes.map((s) => iconPng(s)));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * images.length;
  images.forEach((img, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(sizes[i]! % 256, 0);
    e.writeUInt8(sizes[i]! % 256, 1);
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(img.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.length;
    entries.push(e);
  });
  return Buffer.concat([header, ...entries, ...images]);
}

export const png = (buf: Buffer) =>
  new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/png' } });
