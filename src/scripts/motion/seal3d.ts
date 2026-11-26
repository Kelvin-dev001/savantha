/**
 * The 3D seal: the hero's khatam medallion rendered as real gold metalwork in WebGL.
 *
 * Two interlaced square bands (they weave over and under at every crossing) inside two
 * rims, extruded with a faceted profile so the edges catch the light. Raw WebGL 1, no
 * library: a few kilobytes, loaded only after the page has finished loading and gone idle.
 *
 * The inscription and the "S" stay as the SVG text they already are. Each frame they get
 * the same CSS perspective + rotation as the WebGL model, so the whole seal moves as one
 * object. At rest the model lies flat and matches the SVG seal line for line, so the
 * swap from SVG strokes to metal is a cross-fade with no jump.
 *
 * Modes (data-seal3d on .seal, or ?seal= in the URL while we choose):
 *   turn   slow sway, the star turns inside its rims
 *   tilt   the medallion turns to face the cursor; the lattice shifts a little behind it
 *   sweep  nearly still; a band of light passes across the metal, a warm light drifts
 *          through the lattice
 *
 * Never runs under reduced motion (the loader returns first), with Save-Data, or where the
 * browser reports WebGL as slow (software rendering): the SVG seal simply stays.
 */

type Mode = 'turn' | 'tilt' | 'sweep';
type V3 = [number, number, number];

const VIEW = 320; // the SVG seal's viewBox; geometry is in these units, centred on 0
const DEG = Math.PI / 180;

// ---------- geometry ----------

/** Faceted bar profile: a flattened octagon, half-width a, half-height b, chamfer c. */
function profile(a: number, b: number, c: number): [number, number][] {
  return [
    [a, -b + c],
    [a, b - c],
    [a - c, b],
    [-a + c, b],
    [-a, b - c],
    [-a, -b + c],
    [-a + c, -b],
    [a - c, -b],
  ];
}

/** Extrude a closed path (x, y, z) with a profile (across, depth). Flat-shaded facets. */
function extrude(path: V3[], prof: [number, number][], out: number[]) {
  const n = path.length;
  const dir = (i: number) => {
    const p = path[i]!;
    const q = path[(i + 1) % n]!;
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const l = Math.hypot(dx, dy);
    return [dx / l, dy / l] as const;
  };
  // In-plane mitre offset at each point (so corners stay sharp)
  const mitre: [number, number][] = path.map((_, i) => {
    const [ax, ay] = dir((i - 1 + n) % n);
    const [bx, by] = dir(i);
    let mx = -ay - by;
    let my = ax + bx;
    const ml = Math.hypot(mx, my);
    mx /= ml;
    my /= ml;
    const k = 1 / (mx * -by + my * bx);
    return [mx * k, my * k];
  });
  const m = prof.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [tx, ty] = dir(i);
    const px = -ty; // segment perpendicular, for facet normals
    const py = tx;
    for (let k = 0; k < m; k++) {
      const [u0, v0] = prof[k]!;
      const [u1, v1] = prof[(k + 1) % m]!;
      let nu = v1 - v0;
      let nv = -(u1 - u0);
      const nl = Math.hypot(nu, nv);
      nu /= nl;
      nv /= nl;
      const nx = px * nu;
      const ny = py * nu;
      const nz = nv;
      const at = (idx: number, u: number, v: number) => {
        const p = path[idx]!;
        const mm = mitre[idx]!;
        out.push(p[0] + mm[0] * u, p[1] + mm[1] * u, p[2] + v, nx, ny, nz);
      };
      at(i, u0, v0);
      at(j, u0, v0);
      at(j, u1, v1);
      at(i, u0, v0);
      at(j, u1, v1);
      at(i, u1, v1);
    }
  }
}

function ring(r: number, segs = 160): V3[] {
  return Array.from({ length: segs }, (_, i) => {
    const a = (i / segs) * Math.PI * 2;
    return [r * Math.cos(a), r * Math.sin(a), 0] as V3;
  });
}

/**
 * One square of the khatam, corners at radius R starting from angle a0, walked clockwise.
 * z = amp·sin(2πt) along each edge: over at the first crossing, under at the second. Both
 * squares are walked the same way, so wherever they cross one is up while the other is down.
 */
function square(R: number, a0: number, amp: number, per = 28): V3[] {
  const pts: V3[] = [];
  for (let e = 0; e < 4; e++) {
    const a = a0 + e * 90 * DEG;
    const b = a + 90 * DEG;
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const x = R * ((1 - t) * Math.cos(a) + t * Math.cos(b));
      const y = R * ((1 - t) * Math.sin(a) + t * Math.sin(b));
      pts.push([x, y, amp * Math.sin(2 * Math.PI * t)]);
    }
  }
  return pts;
}

function buildGeometry() {
  // Matches the SVG seal: rims at r 157 and 120; the monogram's star has R ≈ 95.
  const rims: number[] = [];
  extrude(ring(156), profile(2.8, 2.2, 1.2), rims);
  extrude(ring(120), profile(1.7, 1.5, 0.8), rims);
  const star: number[] = [];
  const R = 95.2;
  extrude(square(R, -90 * DEG, 2.6), profile(3, 1.8, 1), star);
  extrude(square(R, -45 * DEG, 2.6), profile(3, 1.8, 1), star);
  return { rims: new Float32Array(rims), star: new Float32Array(star) };
}

// ---------- maths (CSS conventions: x right, y down, z toward the viewer) ----------

type M3 = number[]; // row-major 3×3
const mul = (a: M3, b: M3): M3 => {
  const o = new Array<number>(9);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      o[r * 3 + c] = a[r * 3]! * b[c]! + a[r * 3 + 1]! * b[3 + c]! + a[r * 3 + 2]! * b[6 + c]!;
  return o;
};
const rotX = (t: number): M3 => [
  1,
  0,
  0,
  0,
  Math.cos(t),
  -Math.sin(t),
  0,
  Math.sin(t),
  Math.cos(t),
];
const rotY = (t: number): M3 => [
  Math.cos(t),
  0,
  Math.sin(t),
  0,
  1,
  0,
  -Math.sin(t),
  0,
  Math.cos(t),
];
const rotZ = (t: number): M3 => [
  Math.cos(t),
  -Math.sin(t),
  0,
  Math.sin(t),
  Math.cos(t),
  0,
  0,
  0,
  1,
];
/** GLSL mat3 is column-major. */
const toGL = (m: M3) =>
  new Float32Array([m[0]!, m[3]!, m[6]!, m[1]!, m[4]!, m[7]!, m[2]!, m[5]!, m[8]!]);

// ---------- shaders ----------

const VS = `
attribute vec3 aP;
attribute vec3 aN;
uniform mat3 uR;
uniform float uS;
uniform float uD;
uniform vec2 uHalf;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 p = uR * (aP * uS);
  vW = p;
  vN = uR * aN;
  float w = (uD - p.z) / uD;
  gl_Position = vec4(p.x / uHalf.x, -p.y / uHalf.y, -p.z / uD * w, w);
}`;

const FS = `
precision mediump float;
uniform vec3 uGold;
uniform vec3 uSoft;
uniform vec3 uInk;
uniform float uCam; // = uD (a uniform shared across stages must match precision)
uniform vec3 uL;
uniform vec3 uBandN;
uniform float uBandOff;
uniform float uBandK;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vec3(0.0, 0.0, uCam) - vW);
  vec3 R = reflect(-V, N);
  // A studio lit from the upper left: ink below, warm light above, a softbox near the top.
  float up = -R.y - 0.25 * R.x;
  float e = mix(0.1, 0.95, smoothstep(-0.3, 0.5, up)) + 0.45 * exp(-pow((up - 0.62) * 5.0, 2.0));
  float band = exp(-pow((dot(R, uBandN) - uBandOff) * 6.5, 2.0));
  vec3 H = normalize(uL + V);
  float spec = pow(max(dot(N, H), 0.0), 70.0);
  float diff = max(dot(N, uL), 0.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  // Gold tints what it reflects; the brightest reflections wash towards gold-soft.
  vec3 col = uGold * (e + 0.18 * diff) + uInk * 0.5 * (1.0 - min(e, 1.0));
  col += uSoft * (max(e - 0.8, 0.0) * 0.9 + spec * 0.9 + band * uBandK + fres * 0.1);
  gl_FragColor = vec4(min(col, vec3(1.0)) * uAlpha, uAlpha);
}`;

// ---------- setup ----------

function hexToRgb(value: string): [number, number, number] {
  const h = value.trim().replace('#', '');
  const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext) {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

function pickMode(seal: HTMLElement): Mode {
  const q = new URLSearchParams(location.search).get('seal');
  const m = (q || seal.dataset.seal3d || 'tilt') as Mode;
  return m === 'turn' || m === 'sweep' ? m : 'tilt';
}

export function initSeal3D() {
  const seal = document.querySelector<HTMLElement>('[data-seal3d]');
  if (!seal) return;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'seal__gl';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    failIfMajorPerformanceCaveat: true, // no software rendering on weak devices
    powerPreference: 'low-power',
  });
  if (!ctx) return;
  const gl: WebGLRenderingContext = ctx;
  const prog = compile(gl);
  if (!prog) return;

  const mode = pickMode(seal);
  const hero = seal.closest<HTMLElement>('.hero');
  const lattice = hero?.querySelector<HTMLElement>('.hero__lattice') ?? null;
  const overlays = [...seal.querySelectorAll<HTMLElement>('.seal__ring, .seal__mark')];

  // Geometry + buffers
  const geo = buildGeometry();
  const buf = (data: Float32Array) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { b, count: data.length / 6 };
  };
  const rims = buf(geo.rims);
  const star = buf(geo.star);

  gl.useProgram(prog);
  const aP = gl.getAttribLocation(prog, 'aP');
  const aN = gl.getAttribLocation(prog, 'aN');
  const u = (name: string) => gl.getUniformLocation(prog, name);
  const uR = u('uR');
  const uS = u('uS');
  const uD = u('uD');
  const uCam = u('uCam');
  const uHalf = u('uHalf');
  const uBandOff = u('uBandOff');
  const uBandK = u('uBandK');
  const uAlpha = u('uAlpha');

  // Colours come from the brand tokens, never hard-coded here.
  const css = getComputedStyle(document.documentElement);
  gl.uniform3fv(u('uGold'), hexToRgb(css.getPropertyValue('--color-gold')));
  gl.uniform3fv(u('uSoft'), hexToRgb(css.getPropertyValue('--color-gold-soft')));
  gl.uniform3fv(u('uInk'), hexToRgb(css.getPropertyValue('--color-ink')));
  const L = [-0.45, -0.7, 0.55];
  const ll = Math.hypot(...L);
  gl.uniform3fv(
    u('uL'),
    L.map((v) => v / ll),
  );
  const B = [0.62, -0.5, 0.6];
  const bl = Math.hypot(...B);
  gl.uniform3fv(
    u('uBandN'),
    B.map((v) => v / bl),
  );
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  seal.prepend(canvas);

  // Size: the canvas overhangs the seal so a tilted rim is never clipped.
  const OVER = 0.16;
  let half = [1, 1];
  let scale = 1;
  let persp = 1000;
  const resize = () => {
    const w = seal.clientWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = w * (1 + 2 * OVER);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(cw * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    half = [cw / 2, cw / 2];
    scale = w / VIEW;
    persp = w * 3;
    for (const el of overlays) el.style.transformOrigin = '50% 50%';
  };
  resize();
  new ResizeObserver(resize).observe(seal);

  // Pointer (tilt mode, fine pointers only)
  let px = 0;
  let py = 0;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (mode === 'tilt' && fine) {
    window.addEventListener(
      'pointermove',
      (e) => {
        px = (e.clientX / window.innerWidth) * 2 - 1;
        py = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => {
      px = 0;
      py = 0;
    });
  }

  if (mode === 'sweep') hero?.setAttribute('data-light', 'on');

  // Visibility: render only while the hero is on screen and the tab is visible.
  let onScreen = true;
  let raf = 0;
  const io = new IntersectionObserver(([e]) => {
    onScreen = !!e?.isIntersecting;
    schedule();
  });
  io.observe(seal);
  document.addEventListener('visibilitychange', schedule);

  const t0 = performance.now();
  let last = t0;
  let rx = 0;
  let ry = 0;

  function frame(now: number) {
    raf = 0;
    const t = (now - t0) / 1000;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const ease = Math.min(t / 2.4, 1); // motion eases in after the cross-fade
    const ramp = ease * ease * (3 - 2 * ease);

    let tx: number;
    let ty: number;
    let spin = 0;
    let bandOff = 0.35;
    let bandK = 0.25;
    if (mode === 'turn') {
      ty = 16 * Math.sin((t * 2 * Math.PI) / 18);
      tx = 6 * Math.sin((t * 2 * Math.PI) / 13 + 0.8);
      spin = (t / 120) * 360;
    } else if (mode === 'tilt') {
      if (fine) {
        ty = px * 16;
        tx = -py * 11;
      } else {
        ty = 8 * Math.sin((t * 2 * Math.PI) / 16);
        tx = 4 * Math.sin((t * 2 * Math.PI) / 11);
      }
    } else {
      ty = 3 * Math.sin((t * 2 * Math.PI) / 20);
      tx = 2 * Math.sin((t * 2 * Math.PI) / 15);
      // A pass of light every 7 s: 2.2 s across, then rest.
      const c = (t % 7) / 2.2;
      bandOff = c < 1 ? -1.3 + 2.6 * (c * c * (3 - 2 * c)) : 1.3;
      bandK = c < 1 ? 1.1 : 0;
    }
    // Critically damped follow, so the cursor never yanks the seal.
    const k = 1 - Math.exp(-dt * 4);
    rx += (tx * ramp - rx) * k;
    ry += (ty * ramp - ry) * k;

    const base = mul(rotX(rx * DEG), rotY(ry * DEG));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(uS, scale);
    gl.uniform1f(uD, persp);
    gl.uniform1f(uCam, persp);
    gl.uniform2fv(uHalf, half);
    gl.uniform1f(uBandOff, bandOff);
    gl.uniform1f(uBandK, bandK);
    gl.uniform1f(uAlpha, 1);
    const draw = (b: { b: WebGLBuffer; count: number }, m: M3) => {
      gl.uniformMatrix3fv(uR, false, toGL(m));
      gl.bindBuffer(gl.ARRAY_BUFFER, b.b);
      gl.enableVertexAttribArray(aP);
      gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(aN);
      gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 24, 12);
      gl.drawArrays(gl.TRIANGLES, 0, b.count);
    };
    draw(rims, base);
    draw(star, mul(base, rotZ(spin * DEG)));

    // The SVG inscription and "S" ride on the same transform; the S floats a little forward.
    const tf = `perspective(${persp}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    overlays[0]!.style.transform = tf;
    overlays[1]!.style.transform = `${tf} translateZ(${(10 * scale).toFixed(1)}px)`;
    if (lattice && mode === 'tilt') {
      lattice.style.transform = `translate3d(${(-ry * 0.7).toFixed(2)}px, ${(rx * 0.7).toFixed(2)}px, 0)`;
    }
    schedule();
  }

  function schedule() {
    if (raf || !onScreen || document.hidden) return;
    raf = requestAnimationFrame(frame);
  }

  // First frame flat (matches the SVG), then cross-fade the SVG strokes out.
  requestAnimationFrame((now) => {
    frame(now);
    seal.setAttribute('data-3d', 'on');
  });
}
