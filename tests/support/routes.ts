import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Every route = every index.html in the static build output (dist/client with the adapter). */
export function routes(dir = 'dist/client', root = 'dist/client'): string[] {
  let out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(routes(full, root));
    else if (name === 'index.html') {
      const rel = relative(root, dir).replaceAll('\\', '/');
      out.push(rel ? `/${rel}` : '/');
    }
  }
  return out;
}
