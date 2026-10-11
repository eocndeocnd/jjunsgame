// ============================================================
//  backdrop.js  —  맨 뒤 바탕: 헤진 지도 종이
//  그림 파일을 따로 두지 않고 열 때마다 그립니다. 씨앗이 같으니 늘 같은 지도입니다.
//  화면 크기에 맞춰 3~4px 짜리 도트로 찍은 뒤 CSS 배경(--backdrop)으로 깝니다.
//  게임 규칙과는 상관이 없습니다 — 이 파일이 없어도 게임은 돌아갑니다 (바탕만 민짜 종이색).
// ============================================================
(function () {
  'use strict';

  const SEED = 1984;

  // 종이 사다리 — 밝은 것부터 어두운 것까지. 얼룩 · 접힌 자국 · 잉크 · 그을음이
  // 전부 이 위에서 골라집니다. 색을 따로 섞지 않으니 도트가 지저분해지지 않습니다.
  const PAPER = [
    [0xe8, 0xd1, 0x9e],   // 0 가장 밝은 종이
    [0xdc, 0xc0, 0x89],   // 1 종이
    [0xcf, 0xaf, 0x76],   // 2 바랜 종이
    [0xbf, 0x9c, 0x63],   // 3 얼룩
    [0xaa, 0x85, 0x51],   // 4 옅은 잉크 · 짙은 얼룩
    [0x8e, 0x6b, 0x3e],   // 5 잉크
    [0x6f, 0x51, 0x2c],   // 6 진한 잉크 · 그을음
    [0x4e, 0x36, 0x1b],   // 7 탄 자리
    [0x33, 0x22, 0x10]    // 8 타서 검어진 가장자리
  ];
  const RED = [null, [0xa8, 0x50, 0x3a], [0x8f, 0x2e, 0x22]];   // 붉은 길(바랜) · 표시와 나침반 바늘(진한)

  // 벽 너머 — 같은 지도가 잿빛으로 식고, 붉은 잉크는 보랏빛이 됩니다. 종이는 더 찢기고,
  // 찢겨 나간 구멍 너머로 별이 보입니다 (마왕이 쓰러진 회차 — ui.js 의 atmosphere 가 Backdrop.mode 로 바꿉니다)
  const ASH = [
    [0xd6, 0xd0, 0xdc], [0xc6, 0xbf, 0xcf], [0xb4, 0xab, 0xc0], [0x9e, 0x94, 0xad], [0x86, 0x7a, 0x98],
    [0x6a, 0x5e, 0x7e], [0x4f, 0x44, 0x63], [0x34, 0x2b, 0x45], [0x1d, 0x17, 0x29]
  ];
  const VIOLET = [null, [0x7d, 0x4a, 0xa8], [0x5b, 0x2a, 0x86]];
  const STAR = [[0xe9, 0xe2, 0xff], [0x9d, 0x8f, 0xc9]];
  // 4×4 순서 디더 — 사다리 두 칸 사이를 바둑판 무늬로 섞습니다
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  // ---------- 잡음 ----------
  function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(SEED, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = x - xi, v = y - yi;
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  }
  function fbm(x, y, oct) {
    let s = 0, amp = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      s += noise(x, y) * amp;
      norm += amp;
      x = x * 2.03 + 17.1;
      y = y * 2.03 + 9.7;
      amp *= 0.5;
    }
    return s / norm;
  }

  // ---------- 지도 기호 ----------
  // # 잉크 · + 옅은 잉크(그늘) · - 밝힌 자리
  const MOUNTAIN = [
    '....#....',
    '...#+#...',
    '..#.++#..',
    '.#...++#.',
    '#.......#'
  ];
  const HILL = [
    '..#..',
    '.#+#.',
    '#..+#'
  ];
  const TREE = [
    '.#.',
    '###',
    '.+.'
  ];
  const WAVE = [
    '.##..',
    '#..##'
  ];
  const CROSS = [
    '#...#',
    '.#.#.',
    '..#..',
    '.#.#.',
    '#...#'
  ];
  const LETTER_N = [
    '#..#',
    '##.#',
    '#.##',
    '#..#'
  ];

  // ---------- 그리기 ----------
  let lastKey = '';
  let mode = 'map';            // 'map' 이쪽 · 'beyond' 벽 너머
  const cache = {};            // 한 번 그린 것은 다시 계산하지 않습니다 — 회차마다 오가니까요

  function apply(c) {
    const root = document.documentElement.style;
    root.setProperty('--backdrop', c.url);
    root.setProperty('--bd-size', c.size);
  }

  function draw() {
    const vw = window.innerWidth || 360;
    const vh = window.innerHeight || 640;
    const S = vw < 700 ? 3 : 4;                 // 도트 한 칸의 크기 (px)
    const W = Math.ceil(vw / S), H = Math.ceil(vh / S);
    const key = `${W}x${H}@${S}:${mode}`;
    if (key === lastKey) return;
    lastKey = key;
    if (cache[key]) { apply(cache[key]); return; }
    const far = mode === 'beyond';
    const PAL = far ? ASH : PAPER;
    const INK = far ? VIOLET : RED;

    const N = W * H;
    const tone = new Float32Array(N);           // 사다리 위의 자리 (실수)
    const alive = new Uint8Array(N);            // 종이가 남아 있는 칸
    const red = new Uint8Array(N);              // 붉은 잉크
    const minWH = Math.min(W, H);
    const burnDepth = S === 3 ? 5 : 7;          // 그을음이 안으로 번지는 깊이 (칸)
    const MARGIN = S === 3 ? 7 : 9;             // 종이 끝에서 지도 테두리선까지 (칸)

    const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? y * W + x : -1;
    const add = (x, y, v) => { const i = at(x, y); if (i >= 0 && alive[i]) tone[i] += v; };
    const stamp = (gx, gy, rows, ink) => {
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          const ch = rows[r][c];
          if (ch === '.') continue;
          add(gx + c, gy + r, ch === '#' ? ink : ch === '+' ? ink * 0.5 : -0.8);
        }
      }
    };

    // 접힌 자국 — 지도를 접어 들고 다녔던 자리. 세로로 긴 화면은 3단, 가로로 긴 화면은 3열.
    const cols = W > H * 1.2 ? 3 : 2;
    const rows = H > W * 1.2 ? 3 : 2;
    const foldX = [], foldY = [];
    for (let k = 1; k < cols; k++) foldX.push(Math.round(k * W / cols));
    for (let k = 1; k < rows; k++) foldY.push(Math.round(k * H / rows));

    // 1. 종이, 찢어진 가장자리, 그을음
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        // 접힌 자리가 가장자리와 만나는 곳은 더 깊이 찢어집니다
        let biteV = 0, biteH = 0;
        for (const fx of foldX) biteV = Math.max(biteV, 5 * Math.exp(-((x - fx) ** 2) / 6));
        for (const fy of foldY) biteH = Math.max(biteH, 5 * Math.exp(-((y - fy) ** 2) / 6));
        const rag = (far ? 2.4 : 1) + (far ? 6.5 : 3.2) * fbm(x * 0.12 + 31, y * 0.12 + 7, 3) + (hash(x, y) - 0.5) * 1.1;
        let e = Math.min(
          Math.min(y, H - 1 - y) - rag - biteV,
          Math.min(x, W - 1 - x) - rag - biteH);
        // 벽 너머 — 종이 한가운데도 군데군데 찢겨 나갑니다. 구멍 가장자리도 타서 검습니다
        if (far) e = Math.min(e, (0.66 - fbm(x * 0.05 + 300, y * 0.05 + 300, 3)) * 46);
        if (e < 0) continue;                    // 찢겨 나간 자리 — 밑의 어두운 바탕이 보입니다
        alive[i] = 1;

        let t = 1.3
          + (fbm(x * 0.03, y * 0.03, 4) - 0.5) * 3.2              // 크게 바랜 얼룩
          + (fbm(x * 0.21 + 40, y * 0.21 + 40, 2) - 0.5) * 0.9    // 잔 얼룩
          + (hash(x * 3 + 11, y * 5 + 3) - 0.5) * 0.35;           // 종이 결
        const burn = Math.max(0, 1 - e / burnDepth);
        t += burn * burn * 5.6;
        if (e < 1) t = Math.max(t, 7.2);        // 찢어진 끝은 타서 검습니다
        tone[i] = t;
      }
    }

    // 2. 지도 — 테두리선 안쪽에만
    const inMap = (x, y) => Math.min(x, y, W - 1 - x, H - 1 - y) > MARGIN + 1;
    const height = new Float32Array(N);
    const land = new Uint8Array(N);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!alive[i]) continue;
        const m = Math.min(x, y, W - 1 - x, H - 1 - y);
        // 지도 테두리 — 굵은 선 하나, 그 안에 점선 하나
        if (m === MARGIN) tone[i] += 2.3;
        else if (m === MARGIN + 2 && ((x + y) & 1)) tone[i] += 1.3;
        if (!inMap(x, y)) continue;
        const wx = (fbm(x * 0.018 + 5, y * 0.018 + 9, 2) - 0.5) * 3;
        const wy = (fbm(x * 0.018 + 21, y * 0.018 + 2, 2) - 0.5) * 3;
        const h = fbm(x * 0.026 + wx, y * 0.026 + wy, 5);
        height[i] = h;
        land[i] = h > 0.5 ? 1 : 0;
        // 경위선 — 아주 옅은 점선
        if ((((x - MARGIN) % 28 === 14) || ((y - MARGIN) % 28 === 14)) && ((x + y) & 1)) tone[i] += 0.8;
      }
    }

    // 해안선과 물결선 — 해안에서 바다 쪽으로 몇 칸씩 떨어진 선을 겹겹이
    const dist = new Int16Array(N).fill(-1);
    const queue = new Int32Array(N);
    let qh = 0, qt = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!alive[i] || !inMap(x, y)) continue;
        const nb = [at(x + 1, y), at(x - 1, y), at(x, y + 1), at(x, y - 1)];
        if (land[i]) {
          if (nb.some(j => j >= 0 && inMap(j % W, (j / W) | 0) && !land[j])) tone[i] += 3.2;
        } else {
          tone[i] += 0.4;                        // 바다는 한 톤 어둡게
          if (nb.some(j => j >= 0 && land[j])) { dist[i] = 1; queue[qt++] = i; }
        }
      }
    }
    while (qh < qt) {
      const i = queue[qh++];
      const d = dist[i];
      if (d >= 8) continue;
      const x = i % W, y = (i / W) | 0;
      for (const j of [at(x + 1, y), at(x - 1, y), at(x, y + 1), at(x, y - 1)]) {
        if (j < 0 || dist[j] >= 0 || land[j] || !alive[j]) continue;
        if (!inMap(j % W, (j / W) | 0)) continue;
        dist[j] = d + 1;
        queue[qt++] = j;
      }
    }
    for (let i = 0; i < N; i++) {
      const d = dist[i];
      if (d < 0) continue;
      const x = i % W, y = (i / W) | 0;
      if (d === 2 && (x * 7 + y * 3) % 6 !== 0) tone[i] += 1.6;
      else if (d === 4 && ((x + y) & 1)) tone[i] += 1.2;
      else if (d === 6 && (x + y) % 3 === 0) tone[i] += 0.9;
    }

    // 먼바다의 물결, 산, 숲 — 성긴 격자에 하나씩, 자리는 조금씩 흔들어서
    const openSea = i => i >= 0 && alive[i] && !land[i] && (dist[i] < 0 || dist[i] > 8) && height[i] > 0;
    for (let gy = 0; gy * 9 < H; gy++) {
      for (let gx = 0; gx * 13 < W; gx++) {
        const px = gx * 13 + Math.floor(hash(gx, gy + 500) * 7);
        const py = gy * 9 + Math.floor(hash(gx + 500, gy) * 5);
        if (hash(gx + 900, gy + 900) < 0.55 && openSea(at(px, py)) && openSea(at(px + 4, py + 1))) {
          stamp(px, py, WAVE, 1.7);
        }
      }
    }
    for (let gy = 0; gy * 7 < H; gy++) {
      for (let gx = 0; gx * 10 < W; gx++) {
        const px = gx * 10 + Math.floor(hash(gx + 31, gy + 77) * 4);
        const py = gy * 7 + Math.floor(hash(gx + 77, gy + 31) * 3);
        const i = at(px + 4, py + 4);
        if (i < 0 || !land[i]) continue;
        const h = height[i];
        if (h > 0.69) stamp(px, py, MOUNTAIN, 3.1);
        else if (h > 0.63) stamp(px + 2, py + 2, HILL, 2.8);
      }
    }
    for (let gy = 0; gy * 5 < H; gy++) {
      for (let gx = 0; gx * 6 < W; gx++) {
        const px = gx * 6 + Math.floor(hash(gx + 3, gy + 51) * 3);
        const py = gy * 5 + Math.floor(hash(gx + 51, gy + 3) * 2);
        const i = at(px + 1, py + 1);
        if (i < 0 || !land[i]) continue;
        const h = height[i];
        if (h < 0.53 || h > 0.61) continue;
        if (fbm(px * 0.05 + 70, py * 0.05 + 70, 3) < 0.56) continue;
        stamp(px, py, TREE, 2.6);
      }
    }

    // 3. 물에 젖었던 동그란 자국
    const rings = [
      { cx: 0.80 * W, cy: 0.16 * H, r: 0.11 * minWH + 5 },
      { cx: 0.14 * W, cy: 0.74 * H, r: 0.08 * minWH + 4 }
    ];
    for (const g of rings) {
      const R = Math.ceil(g.r + 3);
      for (let y = Math.floor(g.cy - R); y <= g.cy + R; y++) {
        for (let x = Math.floor(g.cx - R); x <= g.cx + R; x++) {
          const dx = x - g.cx, dy = y - g.cy;
          const d = Math.hypot(dx, dy);
          const gap = Math.abs(d - g.r);
          const a = Math.atan2(dy, dx);
          if (gap < 1.0 && noise(a * 3 + 10, g.r) > 0.3) add(x, y, 1.1);
          else if (d < g.r) add(x, y, g.r - d < 2.5 ? 0.6 : 0.25);
        }
      }
    }

    // 4. 접힌 자국 — 어두운 골 한 줄, 그 옆에 밝게 선 등성이 한 줄
    for (const fx of foldX) {
      for (let y = 0; y < H; y++) {
        const x = fx + Math.round((noise(y * 0.06, fx * 0.7) - 0.5) * 2.2);
        add(x, y, 1.2);
        add(x + 1, y, -0.7);
        if (hash(x, y * 3) > 0.75) add(x, y, -0.6);   // 닳아서 하얗게 일어난 자리
      }
    }
    for (const fy of foldY) {
      for (let x = 0; x < W; x++) {
        const y = fy + Math.round((noise(x * 0.06, fy * 0.7) - 0.5) * 2.2);
        add(x, y, 1.2);
        add(x, y + 1, -0.7);
        if (hash(x * 3, y) > 0.75) add(x, y, -0.6);
      }
    }

    // 5. 붉은 길 — 누군가 지나간 여정. 끝에 ✕
    const pts = [[0.10, 0.34], [0.27, 0.20], [0.46, 0.30], [0.66, 0.24], [0.76, 0.48], [0.60, 0.66], [0.84, 0.84]]
      .map(([u, v], k) => [
        Math.round(u * W + (hash(k, 7) - 0.5) * 6),
        Math.round(v * H + (hash(7, k) - 0.5) * 6)]);
    let step = 0;
    const plot = (x, y) => {
      const i = at(x, y);
      if (i >= 0 && alive[i] && inMap(x, y) && (step++ % 5) < 3) red[i] = 1;
    };
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
      // 곧게 긋지 않고 가운데를 한 번 휘게 합니다
      const mx = Math.round((x0 + x1) / 2 + (hash(k, 99) - 0.5) * 10);
      const my = Math.round((y0 + y1) / 2 + (hash(99, k) - 0.5) * 10);
      line(x0, y0, mx, my, plot);
      line(mx, my, x1, y1, plot);
    }
    const [ex, ey] = pts[pts.length - 1];
    for (let r = 0; r < CROSS.length; r++) {
      for (let c = 0; c < CROSS[r].length; c++) {
        const i = at(ex - 2 + c, ey - 2 + r);
        if (CROSS[r][c] === '#' && i >= 0 && alive[i]) red[i] = 2;
      }
    }

    // 6. 나침반 — 오른쪽 위 구석
    const R = S === 3 ? 6 : 9;
    const ccx = W - MARGIN - R - 5, ccy = MARGIN + R + 7;
    for (let y = ccy - R - 3; y <= ccy + R + 3; y++) {
      for (let x = ccx - R - 3; x <= ccx + R + 3; x++) {
        const i = at(x, y);
        if (i < 0 || !alive[i]) continue;
        const dx = x - ccx, dy = y - ccy;
        const d = Math.hypot(dx, dy);
        if (Math.abs(d - (R + 1.6)) < 0.55) { tone[i] += 2.4; continue; }
        if (Math.abs(d - R * 0.42) < 0.5) tone[i] += 1.4;
        const ax = Math.abs(dx), ay = Math.abs(dy);
        const vert = ay <= R && ax <= (1 - ay / R) * R * 0.24 + 0.2;
        const horz = ax <= R && ay <= (1 - ax / R) * R * 0.24 + 0.2;
        const u = Math.abs(dx + dy) / Math.SQRT2, v = Math.abs(dx - dy) / Math.SQRT2;
        const L = R * 0.62;
        const diag = (u <= L && v <= (1 - u / L) * L * 0.22 + 0.2) || (v <= L && u <= (1 - v / L) * L * 0.22 + 0.2);
        if (vert && dy < 0) red[i] = dx > 0 ? 1 : 2;           // 북쪽 바늘은 붉게
        else if (vert || horz) tone[i] += (dx + dy > 0) ? 3.6 : 1.6;   // 바늘마다 한쪽은 그늘
        else if (diag) tone[i] += 2.0;
      }
    }
    stamp(ccx - 1, ccy - R - 9, LETTER_N, 3.4);

    // 7. 사다리에 올려 도트로 찍습니다
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, H);
    const px = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let c;
        if (!alive[i]) {
          // 투명 — CSS 바탕색(가장 어두운 갈색)이 비칩니다. 벽 너머에서는 그 어둠에 별이 박힙니다
          if (!far) continue;
          const h = hash(x * 7 + 1, y * 13 + 5);
          if (h < 0.986) continue;
          c = STAR[h > 0.996 ? 0 : 1];
        } else if (red[i]) c = INK[red[i]];
        else {
          const t = tone[i] + BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5;
          c = PAL[Math.max(0, Math.min(PAL.length - 1, Math.round(t)))];
        }
        const o = i * 4;
        px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    cache[key] = { url: `url("${cv.toDataURL('image/png')}")`, size: `${W * S}px ${H * S}px` };
    apply(cache[key]);
  }

  // 브레젠험 — 두 점 사이를 칸 단위로 잇습니다
  function line(x0, y0, x1, y1, fn) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      fn(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // 화면 크기가 바뀌면(돌리기 · 주소창) 다시 그립니다. 같은 씨앗이라 그림은 그대로 이어집니다.
  let timer = null;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(draw, 180);
  });
  try { draw(); } catch (e) { /* 바탕을 못 그려도 게임은 돌아야 합니다 */ }

  // 바꿀 때만 다시 그립니다 (render 마다 불려도 같은 모드면 아무 일도 하지 않습니다)
  window.Backdrop = {
    mode(m) {
      if (m === mode) return;
      mode = m;
      try { draw(); } catch (e) { /* 그대로 둡니다 */ }
    }
  };
})();
