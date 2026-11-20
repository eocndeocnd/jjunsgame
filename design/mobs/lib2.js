// 도트 그리기 2판 — 부위마다 둥근 입체로 보고 왼쪽 위 빛으로 5단계 명암 (색은 어두울수록 푸른 · 보라, 밝을수록 노란 쪽으로 틂)
// 칸 값은 '재질+단계' 문자열 (예: 'g2' — g 재질의 2단계, 0 가장 어두움 ~ 4 가장 밝음) 또는 단색 이름 (예: 'K', 'eye')
// 끝에 out() 으로 글자 격자 + 팔레트로 바꿈
function hex2rgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
function rgb2hex(c) { return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
  return [f(0), f(8), f(4)];
}
// 기준색(가운데 = 2단계) → 5단계. 어두운 쪽은 색상을 240(푸른 보라) 쪽으로, 밝은 쪽은 60(노랑) 쪽으로
function ramp(base, opt = {}) {
  let [h, s, l] = rgb2hsl(hex2rgb(base));
  // 어둑하게 (사용자 결정 2026-11-20 — 색감을 좀 더 어둑어둑하게): 밝기 낮추고 채도 줄임
  if (opt.mood !== false) { l = Math.max(0.12, l - (opt.dim ?? 0.07)); s *= opt.sat ?? 0.82; }
  const step = opt.step || 0.11, shift = opt.shift ?? 14;
  const toward = (from, to, amt) => { let d = ((to - from + 540) % 360) - 180; return from + Math.sign(d) * Math.min(Math.abs(d), amt); };
  return [-2, -1, 0, 1, 2].map(k => {
    const hh = k < 0 ? toward(h, 250, shift * -k) : k > 0 ? toward(h, 55, shift * k * 0.8) : h;
    const ss = Math.min(1, s * (k < 0 ? 1 + 0.08 * -k : 1 - 0.06 * k));
    const ll = Math.max(0.04, Math.min(0.86, l + step * k * (k > 0 ? 0.9 : 1.1)));
    return rgb2hex(hsl2rgb(hh, ss, ll));
  });
}

function grid(n) { return Array.from({ length: n }, () => Array(n).fill(null)); }
const inside = (g, x, y) => y >= 0 && y < g.length && x >= 0 && x < g.length;
// 모양 — 마스크(true/false) 위에
function mask(n) { return Array.from({ length: n }, () => Array(n).fill(false)); }
function mRect(m, x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (inside(m, x + i, y + j)) m[y + j][x + i] = true; }
function mEll(m, cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1 && inside(m, x, y)) m[y][x] = true;
  }
}
function mLine(m, x0, y0, x1, y1, t = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
  for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); mRect(m, x - (t >> 1), y - (t >> 1), t, t); }
}
function mPoly(m, pts) {
  const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) {
    const yy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) if (inside(m, x, y)) m[y][x] = true;
  }
}
// 굵기가 변하는 관 — 점들을 따라 r0 에서 r1 로 (뿌리 · 가지처럼 끝이 가늘어짐)
function mTube(m, pts, r0, r1) {
  const n = pts.length;
  for (let i = 1; i < n; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], steps = Math.max(4, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
    for (let k = 0; k <= steps; k++) { const t = k / steps, r = r0 + (r1 - r0) * ((i - 1 + t) / (n - 1)); mEll(m, ax + (bx - ax) * t, ay + (by - ay) * t, Math.max(0.55, r), Math.max(0.55, r)); }
  }
}
// 값 잡음 — 격자 간격 cell 마다 정해 둔 값을 부드럽게 이음 (0~1). 일정한 무늬가 아니라 덩어리진 얼룩을 만들 때
function noise(seed, cell = 3) {
  const h = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return v - Math.floor(v); };
  return (x, y) => {
    const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = h(x0, y0) + (h(x0 + 1, y0) - h(x0, y0)) * sx, c = h(x0, y0 + 1) + (h(x0 + 1, y0 + 1) - h(x0, y0 + 1)) * sx;
    return a + (c - a) * sy;
  };
}
// 줄 문자열로 모양 — '#' 이 칠함
function mRows(m, x0, y0, rows) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.' && c !== ' ' && inside(m, x0 + i, y0 + j)) m[y0 + j][x0 + i] = true; })); }

// 입체 명암 — 마스크 안 거리(가장자리에서) → 둥근 높이 → 빛 방향과의 각도 → 5단계
const LIGHT = (() => { const v = [-0.55, -0.8, 0.75], l = Math.hypot(...v); return v.map(x => x / l); })();
function toneMap(m, opt = {}) {
  const n = m.length, INF = 1e9, d = m.map(r => r.map(v => v ? INF : 0));
  for (let pass = 0; pass < 2; pass++) for (let it = 0; it < n * n; it++) {
    const y = pass ? n - 1 - Math.floor(it / n) : Math.floor(it / n), x = pass ? n - 1 - it % n : it % n;
    if (!d[y][x]) continue;
    for (const [dx, dy, w] of pass ? [[1, 0, 1], [0, 1, 1], [1, 1, 1.41], [-1, 1, 1.41]] : [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.41], [1, -1, 1.41]]) {
      const nx = x + dx, ny = y + dy, v = inside(d, nx, ny) ? d[ny][nx] : 0;
      if (v + w < d[y][x]) d[y][x] = v + w;
    }
  }
  let R = 0; for (const r of d) for (const v of r) R = Math.max(R, v);
  R = Math.min(R, opt.round || 99);
  const h = d.map(r => r.map(v => { const t = Math.min(v, R); return Math.sqrt(Math.max(0, R * R - (R - t) * (R - t))); }));
  const H = (x, y) => inside(h, x, y) && m[y][x] ? h[y][x] : 0;
  const cuts = opt.cuts || [0.28, 0.5, 0.74, 0.93];
  const raw = m.map((r, y) => r.map((v, x) => {
    if (!v) return -1;
    const nx = -(H(x + 1, y) - H(x - 1, y)) / 2, ny = -(H(x, y + 1) - H(x, y - 1)) / 2, nz = opt.flat || 1.1;
    const l = Math.hypot(nx, ny, nz), dot = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / l;
    let t = 0; while (t < 4 && dot > cuts[t]) t++;
    return Math.max(opt.min ?? 0, Math.min(opt.max ?? 4, t + (opt.bias || 0)));
  }));
  // 외톨이 점 정리 — 같은 단계 이웃이 하나도 없으면 이웃에 가장 많은 단계로 (도트가 덩어리로 뭉치게)
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const t = raw[y][x]; if (t < 0) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => inside(raw, x + dx, y + dy) ? raw[y + dy][x + dx] : -1).filter(v => v >= 0);
    if (nb.length < 2 || nb.includes(t)) continue;
    const cnt = {}; for (const v of nb) cnt[v] = (cnt[v] || 0) + 1;
    raw[y][x] = +Object.entries(cnt).sort((a, b) => b[1] - a[1] || Math.abs(a[0] - t) - Math.abs(b[0] - t))[0][0];
  }
  return raw;
}

// 그림
class Sprite {
  constructor(n) { this.n = n; this.g = grid(n); this.mats = {}; this.solid = {}; }
  mat(id, base, opt) { this.mats[id] = ramp(base, opt); return this; }
  color(id, hex) { this.solid[id] = hex; return this; }
  // 부위 하나 — shape(m) 로 마스크를 만들고 명암을 입혀 올림. 이미 칠한 곳과 맞닿는 가장자리는 안쪽 선(재질의 0단계, line:'K' 면 테두리색)
  part(matId, shape, opt = {}) {
    const m = mask(this.n); shape(m);
    const t = toneMap(m, opt), g = this.g, n = this.n;
    // 드리운 그림자 — 새 부위(앞)가 이미 그린 부위(뒤)에 빛 반대쪽(오른쪽 아래)으로 그림자를 떨어뜨림. 가까울수록 진하게
    // (잎 아래 줄기 · 머리 밑 목 · 팔 밑 옆구리 · 몸 밑 다리 사이 — 사용자 지적 2026-11-20: 가려진 곳이 밝으면 틀림)
    if (opt.cast !== false) {
      const len = opt.cast || Math.max(2, Math.round(n / 16)), dark = new Map();
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (!m[y][x]) continue;
        for (let d = 1; d <= len; d++) {
          const tx = x + Math.floor(d / 2), ty = y + d;
          if (!inside(g, tx, ty) || m[ty][tx]) continue;
          const c = g[ty][tx]; if (!c || !/\d$/.test(c)) continue;
          const amt = d === 1 ? 2 : 1, k = ty * n + tx;
          if ((dark.get(k) || 0) < amt) dark.set(k, amt);
        }
      }
      for (const [k, amt] of dark) { const x = k % n, y = (k - x) / n, c = g[y][x]; g[y][x] = c.slice(0, -1) + Math.max(0, +c.slice(-1) - amt); }
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!m[y][x]) continue;
      const touch = opt.line !== false && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(m, x + dx, y + dy) && !m[y + dy][x + dx] && g[y + dy][x + dx] && g[y + dy][x + dx] !== 'K');
      g[y][x] = touch ? (opt.line === 'K' ? 'K' : `${matId}0`) : `${matId}${opt.fixed ?? t[y][x]}`;
    }
    return this;
  }
  px(x, y, v) { if (inside(this.g, x, y)) this.g[y][x] = v; return this; }
  pts(list, v) { for (const [x, y] of list) this.px(x, y, v); return this; }
  // 이미 칠한 칸의 단계만 바꿈 (재질은 그대로) — 근육 주름 · 반짝임
  tone(list, t) { for (const [x, y] of list) { const c = inside(this.g, x, y) && this.g[y][x]; if (c && /\d$/.test(c)) this.g[y][x] = c.slice(0, -1) + t; } return this; }
  shift(list, dt) { for (const [x, y] of list) { const c = inside(this.g, x, y) && this.g[y][x]; if (c && /\d$/.test(c)) this.g[y][x] = c.slice(0, -1) + Math.max(0, Math.min(4, +c.slice(-1) + dt)); } return this; }
  // 한 재질의 칸마다 fn(x, y, 단계) → 새 단계 (null 이면 지움)
  each(matId, fn) {
    const g = this.g;
    for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) {
      const c = g[y][x]; if (!c || c.slice(0, -1) !== matId || !/\d$/.test(c)) continue;
      const t = fn(x, y, +c.slice(-1));
      g[y][x] = t == null ? null : matId + Math.max(0, Math.min(4, t));
    }
    return this;
  }
  clear(list) { for (const [x, y] of list) if (inside(this.g, x, y)) this.g[y][x] = null; return this; }
  outline() {
    const g = this.g, src = g.map(r => r.slice());
    for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) if (!src[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(g, x + dx, y + dy) && src[y + dy][x + dx] && src[y + dy][x + dx] !== 'K')) g[y][x] = 'K';
    return this;
  }
  // 글자 격자 + 팔레트로
  out(K) {
    const ABC = 'ABCDEFGHIJLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=?!~^<>()[]{}', key = {}, pal = { K };
    let i = 0;
    const rows = this.g.map(r => r.map(c => {
      if (!c) return '.';
      if (c === 'K') return 'K';
      if (!(c in key)) {
        const ch = ABC[i++]; if (!ch) throw new Error('색이 너무 많음');
        key[c] = ch;
        const m = c.match(/^(.+?)(\d)$/);
        pal[ch] = m && this.mats[m[1]] ? this.mats[m[1]][+m[2]] : this.solid[c];
        if (!pal[ch]) throw new Error(`모르는 색 ${c}`);
      }
      return key[c];
    }).join(''));
    return { rows, pal };
  }
}
// 두 프레임을 같은 팔레트로
function pair(A, B, K, extra = {}) {
  const ABC = 'ABCDEFGHIJLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=?!~^<>()[]{}', key = {}, pal = { K };
  let i = 0;
  const enc = sp => sp.g.map(r => r.map(c => {
    if (!c) return '.';
    if (c === 'K') return 'K';
    if (!(c in key)) {
      const ch = ABC[i++]; if (!ch) throw new Error('색이 너무 많음');
      key[c] = ch;
      const m = c.match(/^(.+?)(\d)$/);
      pal[ch] = m && sp.mats[m[1]] ? sp.mats[m[1]][+m[2]] : sp.solid[c];
      if (!pal[ch]) throw new Error(`모르는 색 ${c}`);
    }
    return key[c];
  }).join(''));
  return { ...extra, pal, a: enc(A), b: enc(B) };
}
module.exports = { mTube, noise, pair, Sprite, ramp, mRect, mEll, mLine, mPoly, mRows, toneMap };
