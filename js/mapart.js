// ============================================================
//  mapart.js — 지도 그림 (시안 design/map-concept/render.js 의 무늬를 게임 칸에)
//
//  지도의 「겉모습」 층(look — 칸마다 땅의 종류 · 격, tools/map-gen.js 가 적음)으로 칸마다 도트 무늬를 칠합니다.
//  막히는지는 그대로 바닥 층(ground)이 정합니다 — 그림이 겉모습을 따르더라도 벽 · 물 · 나무 · 바위 · 길은 바닥 층대로.
//  칸 하나를 그림 점 P×P 로, CH×CH 칸씩 덩어리(캔버스)로 한 번 그려 두고 화면에 붙입니다 (js/mapview.js 가 씀).
//  나무는 이웃 칸에 걸쳐 그려야 해서 덩어리에 넣지 않고 따로 그립니다 (treeSprite).
//  겉모습 층이 없는 지도(7~20격 — 아직)는 그리지 않습니다 (MapArt.has 가 false).
// ============================================================
(function (root) {
  'use strict';

  const P = 8;              // 칸 하나 = 그림 점 8×8
  const CH = 16;            // 덩어리 하나 = 16×16 칸
  const CACHE = 80;         // 덩어리를 이만큼까지 들고 있음 (그보다 많으면 오래 안 쓴 것부터 버림)
  const BUDGET = 2;         // 한 장면에 새로 그리는 덩어리 수 — 걷다가 멈칫하지 않게 (나머지는 다음 장면에)

  // 땅의 종류 · 격 — tools/overworld-layout.js 와 같은 번호
  const VOID = 0, GRASS = 1, DIRT = 2, COBBLE = 3, TILES = 4, WATER = 5, LAVA = 6, OBSID = 7, SNOW = 8, ROCKY = 9, PAVE = 10, CANAL = 11;
  // 바닥 층의 칸 (tools/map-gen.js)
  const FLOOR = 0, WALL = 1, POOL = 2, TREE = 3, ROCK = 4, ROAD = 5;

  // ---------- 잡음 (tools/overworld-layout.js 와 같은 셈 — 같은 무늬가 나오게) ----------
  function hash(x, y, s = 0) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  const sm = t => t * t * (3 - 2 * t);
  function vnoise(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), tx = sm(x - xi), ty = sm(y - yi);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  }
  const fbm = (x, y, s = 0) => vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.15;

  // ---------- 색 ----------
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const H = {};                                             // 색 글자 → [r, g, b] (한 번만 풂)
  const c3 = h => H[h] || (H[h] = hex(h));
  // 시안과 같은 색 (격마다 풀빛이 다름 — 0 들 · 1 지하수로 · 2 숲 · 3 왕국 · 4 고원 · 5 시체의 도시 · 6 마계 · 7 처음 · 8 성 안 · 9 성 그늘)
  const C = {
    grass: [['#6fa04a', '#5d8e3e', '#86b65a', '#4b7a34'], ['#6c9a4c', '#5a8840', '#7fae5c', '#4a7436'],
            ['#4f8a3e', '#3f7534', '#629f4a', '#2f5e2a'], ['#7a9a4e', '#687f42', '#8fae5e', '#566c36'],
            ['#8a9a5c', '#76854e', '#a0ae70', '#5f6c40'], ['#5f6b5a', '#525c4e', '#6e7a68', '#434c40'],
            ['#4a3a44', '#3e303a', '#58464f', '#30252d'], ['#6c9a4c', '#5a8840', '#7fae5c', '#4a7436'],
            ['#7a9a4e', '#687f42', '#8fae5e', '#566c36'], ['#45563a', '#3a4a31', '#536645', '#2a3624']],
    dirt: ['#b48a5a', '#a07a4c', '#c49c6a', '#8a6a42'],
    rocky: ['#8e8a70', '#7c785f', '#a09c82', '#66634d'],
    snow: ['#e8eef4', '#d4dee8', '#f6fafc', '#b8c6d6'],
    cobble: ['#8d8a82', '#7a7770', '#a19e95', '#5e5b55'],
    tiles: ['#b9ad94', '#a39880', '#cfc4aa', '#857b66'],
    tilesDark: ['#3c3346', '#322a3b', '#4a4055', '#241e2c'],
    tilesHall: ['#6a6458', '#5a554a', '#7a7466', '#3a362e'],
    pave: ['#6e6c78', '#5f5d69', '#807e8a', '#4a4954'],
    obsid: ['#2c2232', '#231b29', '#3a2d42', '#18121d'],
    waterShallow: hex('#5fb0c0'), waterDeep: hex('#1e5a7a'), foam: hex('#d8f0f0'),
    lavaHot: hex('#ffb040'), void: hex('#0c0a12')
  };
  const shadeOf = (pal, v) => c3(pal[v < 0.3 ? 3 : v < 0.55 ? 1 : v < 0.82 ? 0 : 2]);

  // 돌 하나하나 — 흔든 격자의 가장 가까운 점으로 나눈 칸 (시안의 stones)
  function stones(X, Y, size, seed, pal, mortar) {
    const gx = Math.floor(X / size), gy = Math.floor(Y / size);
    let d1 = 1e9, d2 = 1e9, id = 0, ox = 0, oy = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = (gx + dx + 0.15 + hash(gx + dx, gy + dy, seed) * 0.7) * size, cy = (gy + dy + 0.15 + hash(gx + dx, gy + dy, seed + 1) * 0.7) * size;
      const d = (X - cx) ** 2 + (Y - cy) ** 2;
      if (d < d1) { d2 = d1; d1 = d; id = hash(gx + dx, gy + dy, seed + 2); ox = X - cx; oy = Y - cy; } else if (d < d2) d2 = d;
    }
    const edge = Math.sqrt(d2) - Math.sqrt(d1);
    if (edge < 1.1) return c3(mortar);
    let c = c3(pal[id < 0.3 ? 1 : id < 0.85 ? 0 : 2]);
    const lit = (ox + oy) / size;
    if (edge < 2.2 && lit < -0.15) c = mix(c, [255, 255, 255], 0.22);
    else if (edge < 2.2 && lit > 0.15) c = mul(c, 0.78);
    return c;
  }

  // 땅 무늬 (시안의 texture — 점 좌표 X · Y)
  function texture(t, b, X, Y) {
    const v = fbm(X * 0.07, Y * 0.07, 3) * 0.6 + hash(X, Y, 1) * 0.4;
    switch (t) {
      case GRASS: {
        const pal = C.grass[b] || C.grass[0];
        let c = shadeOf(pal, v);
        const h = hash(X, Y, 2);
        if (h < 0.035) c = c3(pal[3]);
        else if (h < 0.05 && hash(X, Y + 1, 2) < 0.035) c = c3(pal[2]);
        if (b === 0 && hash(X >> 1, Y >> 1, 4) < 0.004) c = c3(['#f4d35e', '#ee8fb0', '#ffffff', '#9fc5ff'][(hash(X >> 1, Y >> 1, 5) * 4) | 0]);
        return c;
      }
      case DIRT: {
        if (b === 5) { let c = shadeOf(['#5a5248', '#4c453c', '#6a6156', '#3a342d'], v); if (hash(X, Y, 6) < 0.02) c = c3('#7a7266'); return c; }
        let c = shadeOf(C.dirt, v); if (hash(X, Y, 6) < 0.02) c = c3('#d8b484'); if (hash(X, Y, 7) < 0.015) c = c3('#6e5434'); return c;
      }
      case ROCKY: {
        if (b === 7) {
          let c = shadeOf(['#3c3e43', '#33353a', '#484a50', '#27292d'], v);
          if (Math.abs(vnoise(X * 0.05, Y * 0.05, 28) - 0.5) < 0.018) c = c3('#1a1b1f');
          else if (hash(X, Y, 30) < 0.01) c = c3('#5e6168');
          if (fbm(X * 0.04, Y * 0.04, 31) > 0.62) c = mix(c, c3('#2e4a52'), 0.3);
          return c;
        }
        let c = shadeOf(C.rocky, v); if (fbm(X * 0.05, Y * 0.05, 8) > 0.62) c = mix(c, c3('#7f9a52'), 0.6); if (hash(X, Y, 9) < 0.02) c = c3('#55513f'); return c;
      }
      case SNOW: { let c = shadeOf(C.snow, v * 0.7 + 0.3); if (hash(X, Y, 10) < 0.004) c = [255, 255, 255]; return c; }
      case COBBLE: case CANAL: {
        let c = b === 7 ? stones(X, Y, 8, 12, ['#5e6266', '#4e5256', '#70757a', '#3a3d40'], '#2a2c30') : stones(X, Y, 7, 11, C.cobble, '#4e4b46');
        if (b === 7 && fbm(X * 0.05, Y * 0.05, 17) > 0.62) c = mix(c, c3('#2e4a52'), 0.5);
        if (fbm(X * 0.04, Y * 0.04, 14) > 0.58 && hash(X, Y, 15) < 0.6) c = mix(c, c3('#5f8a42'), 0.5);
        if (fbm(X * 0.03, Y * 0.03, 16) < 0.3) c = mul(c, 0.86);
        return c;
      }
      case TILES: {
        const pal = b === 6 ? C.tilesDark : b === 8 ? C.tilesHall : C.tiles;
        const row = Math.floor(Y / 8), off = row % 2 ? 5 : 0, lx = ((X + off) % 10 + 10) % 10, ly = ((Y % 8) + 8) % 8;
        const tid = hash(Math.floor((X + off) / 10), row, 16);
        let c = c3(pal[tid < 0.25 ? 1 : tid < 0.9 ? 0 : 2]);
        if (lx === 0 || ly === 0) c = c3(pal[3]);
        else if (lx === 1 || ly === 1) c = mix(c, [255, 255, 255], 0.12);
        if (b === 3 && hash(Math.floor((X + off) / 10), row, 17) < 0.14) c = shadeOf(C.grass[3], v);
        return c;
      }
      case PAVE: {
        let c = stones(X, Y, 10, 19, C.pave, '#3a3942');
        if (fbm(X * 0.06, Y * 0.06, 22) > 0.6) c = mix(c, c3('#56634e'), 0.45);
        return c;
      }
      case OBSID: {
        let c = shadeOf(C.obsid, v);
        if (hash(X, Y, 23) < 0.006) c = c3('#8a6aa8');
        if (Math.abs(vnoise(X * 0.05, Y * 0.05, 24) - 0.5) < 0.01 && fbm(X * 0.02, Y * 0.02, 27) > 0.55) c = c3('#e0501e');
        return c;
      }
      default: return shadeOf(C.grass[0], v);
    }
  }

  // 땅 아래로 떨어지는 옆면 — 위 칸의 땅에 따라 벽돌 · 흑요석 · 묘지돌 · 바위 · 흙 (depth 0 → 1 로 어두워짐)
  function faceColor(b, t, X, Y, depth) {
    const n = hash(X, Y, 30);
    let c;
    if (t === COBBLE || t === CANAL || (t === TILES && b !== 6)) {
      const row = Math.floor(Y / 4), off = row % 2 ? 4 : 0, brick = ((X + off) % 8 + 8) % 8;
      c = c3('#6d655c'); if (brick === 0 || Y % 4 === 0) c = c3('#3e3833'); else if (n < 0.2) c = c3('#5c554d');
    } else if (b === 6 || t === OBSID || t === TILES) {
      c = c3('#1e1624'); if (n < 0.15) c = c3('#2c2034'); if (Math.abs(vnoise(X * 0.1, Y * 0.3, 31) - 0.5) < 0.02) c = c3('#c0401a');
    } else if (b === 5 || t === PAVE) {
      c = c3('#3e3c46'); if ((X % 5) === 0) c = c3('#2e2d35'); if (n < 0.1) c = c3('#4c4a56');
    } else if (t === SNOW || t === ROCKY || b === 4 || b === 7) {
      c = c3('#7a7462'); if ((X + ((Y / 3) | 0)) % 6 === 0) c = c3('#5a5546'); if (n < 0.12) c = c3('#8e8874');
      if (b === 7) c = mul(c, 0.6);
    } else {
      c = c3('#6a4a30'); if ((X + (Y >> 2)) % 7 === 0) c = c3('#4e3622'); if (n < 0.08) c = c3('#86603e');
      if (Math.abs(vnoise(X * 0.3, Y * 0.08, 32) - 0.5) < 0.03) c = c3('#3a5a2a');
    }
    return mul(c, 1 - depth * 0.6);
  }

  // ---------- 지도마다 한 번 — 물 깊이 (물가에서 몇 칸) · 그려 둔 덩어리 ----------
  // 지도에 들어설 때마다 세계가 지도를 새로 감싸므로(시작점만 바꿔), 겉모습 층(같은 배열)에 붙여 둡니다 — 오갈 때 다시 안 그리게
  const prepared = new WeakMap();
  function prep(m) {
    if (prepared.has(m.look)) return prepared.get(m.look);
    const dist = new Float32Array(m.w * m.h).fill(99), q = [];
    for (let k = 0; k < m.w * m.h; k++) if (m.tile[k] !== POOL) { dist[k] = 0; q.push(k); }
    for (let n = 0; n < q.length; n++) {
      const k = q[n], x = k % m.w, y = (k / m.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
        const j = ny * m.w + nx;
        if (dist[j] > dist[k] + 1) { dist[j] = dist[k] + 1; q.push(j); }
      }
    }
    const A = { dist, chunks: new Map() };
    prepared.set(m.look, A);
    return A;
  }

  const land = t => t === FLOOR || t === ROAD || t === TREE || t === ROCK;
  // 칸의 겉모습 — 땅의 종류(아래 네 비트) · 격(위 네 비트). 겉모습이 「땅이 아님」(어둠 · 물)인데 바닥이 땅이면 풀로
  function lookOf(m, k) {
    const lk = m.look[k], t = lk & 15;
    return { ter: t === VOID || t === WATER || t === LAVA ? GRASS : t, bio: lk >> 4 };
  }

  // 점 하나의 색
  function pixel(m, A, X, Y) {
    const tx = (X / P) | 0, ty = (Y / P) | 0, k = ty * m.w + tx, t = m.tile[k], lk = m.look[k];
    if (t === POOL) {
      if ((lk & 15) === LAVA) {                                          // 용암 — 굳어 가는 검붉은 껍질 위 불줄기
        const r = Math.abs(fbm(X * 0.035, Y * 0.05, 25) - 0.5);
        if (r < 0.025) return mix(C.lavaHot, [255, 244, 190], 0.5);
        if (r < 0.06) return C.lavaHot;
        if (r < 0.1) return c3('#e0501e');
        return mix(c3('#8a2414'), c3('#4a120e'), fbm(X * 0.08, Y * 0.08, 26));
      }
      // 물 — 물가에서 멀수록 짙게 (칸 사이는 부드럽게), 물가 거품 · 물결
      const fx = X / P - 0.5, fy = Y / P - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
      const g = (x, y) => (x >= 0 && y >= 0 && x < m.w && y < m.h ? Math.min(A.dist[y * m.w + x], 5) : 0);
      const dep = (g(x0, y0) * (1 - ax) + g(x0 + 1, y0) * ax) * (1 - ay) + (g(x0, y0 + 1) * (1 - ax) + g(x0 + 1, y0 + 1) * ax) * ay;
      const d = Math.min(1, Math.max(0, dep - 0.6) / 2.2);
      let c = mix(C.waterShallow, C.waterDeep, sm(Math.min(1, d * 0.85 + vnoise(X * 0.05, Y * 0.05, 40) * 0.15)));
      if (d < 0.08 && hash(X, Y, 39) < 0.35) c = mix(c, C.foam, 0.5);
      if (hash(X >> 2, Y, 41) < 0.03 && (X & 3) !== 0) c = mix(c, [220, 245, 250], 0.35);
      return c;
    }
    if (t === WALL || t < 0) {
      // 바로 위 두 칸 안에 땅이 있으면 그 땅의 옆면 (아래로 갈수록 어둠), 아니면 어둠
      for (let d = 1; d <= 2; d++) {
        const uy = ty - d;
        if (uy < 0) break;
        const u = m.tile[uy * m.w + tx];
        if (u === POOL) break;
        if (land(u)) { const L = lookOf(m, uy * m.w + tx); return faceColor(L.bio, L.ter, X, Y, Math.min(1, (Y - (uy + 1) * P) / (2 * P))); }
      }
      const n = vnoise(X * 0.06, Y * 0.06, 50);
      return n > 0.72 ? c3('#16121f') : C.void;
    }
    const L = lookOf(m, k);
    if (t === ROAD && ((lk & 15) === WATER || (lk & 15) === CANAL)) {
      // 다리 — 물을 건너는 길은 널판: 건너는 쪽과 엇갈린 판자, 판 사이 틈 · 양옆 난간은 어둡게
      const across = (tx > 0 && m.tile[k - 1] === ROAD) || (tx + 1 < m.w && m.tile[k + 1] === ROAD);   // 가로로 건넘 → 판자는 세로
      const lx = X - tx * P, ly = Y - ty * P, along = across ? X : Y, side = across ? ly : lx;
      const sideOff = (dx, dy) => { const x = tx + dx, y = ty + dy; return x < 0 || y < 0 || x >= m.w || y >= m.h || m.tile[y * m.w + x] !== ROAD; };
      const rail = across ? (ly === 0 && sideOff(0, -1)) || (ly === P - 1 && sideOff(0, 1)) : (lx === 0 && sideOff(-1, 0)) || (lx === P - 1 && sideOff(1, 0));
      if (rail) return c3('#3e2814');
      if (along % 4 === 0) return c3('#4e3420');
      const plank = hash(along >> 2, 0, 72);
      let c = c3(plank < 0.3 ? '#7a5232' : plank < 0.8 ? '#8a6038' : '#9a6e42');
      if (hash(X, Y, 73) < 0.08) c = mul(c, 0.82);
      if (side === 1) c = mix(c, [255, 255, 255], 0.1);
      return c;
    }
    if (t === ROAD) {
      // 흙길 — 바닥과 확실히 다르게: 흙빛에 가장자리 한 점은 어둡게 (사용자 요청 — 길이 잘 안 보였음)
      let c = texture(DIRT, L.bio, X, Y);
      const lx = X - tx * P, ly = Y - ty * P;
      const off = (x, y) => x < 0 || y < 0 || x >= m.w || y >= m.h || m.tile[y * m.w + x] !== ROAD;
      if ((lx === 0 && off(tx - 1, ty)) || (lx === P - 1 && off(tx + 1, ty)) || (ly === 0 && off(tx, ty - 1)) || (ly === P - 1 && off(tx, ty + 1))) c = mul(c, 0.62);
      return c;
    }
    if (t === ROCK) {
      // 바위 — 그 땅의 바위빛, 아래쪽 가장자리는 그늘 (솟은 바위처럼)
      const rt = L.ter === OBSID || L.bio === 6 ? OBSID : ROCKY;
      let c = texture(rt, L.bio === 7 ? 7 : 0, X, Y);
      const ly = Y - ty * P, below = ty + 1 < m.h ? m.tile[(ty + 1) * m.w + tx] : WALL;
      if (below !== ROCK && ly >= P - 2) c = mul(c, 0.55);
      else if (ly <= 1) c = mix(c, [255, 255, 255], 0.12);
      return c;
    }
    return texture(L.ter, L.bio, X, Y);                                   // 바닥 · 나무 밑
  }

  // 덩어리 하나 (CH×CH 칸) — 캔버스에 한 번 그려 둠
  function chunk(m, A, cx, cy) {
    const cv = document.createElement('canvas');
    const w = Math.min(CH, m.w - cx * CH) * P, h = Math.min(CH, m.h - cy * CH) * P;
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = pixel(m, A, cx * CH * P + x, cy * CH * P + y), i = (y * w + x) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }

  // ---------- 나무 모양 — 후보 A~G (사용자가 고르기 전) ----------
  // 그림 상자 TW×TH 점 (맨 아래 줄이 땅에 닿는 곳). put(x, y, [r, g, b]) 로 칠하고, rnd 는 그 나무만의 흔들림(0~1)
  // 모두 한 줄 테두리 · 왼쪽 위에서 오는 빛 · 잎 덩이마다 따로 빛을 받아 뭉게뭉게
  const TW = 16, TH = 22;
  const TREE_PAL = {
    kingdom:  { leaf: ['#2f4e22', '#4b7a34', '#62963f', '#8cbc5c'], line: '#1b2e14', trunk: ['#3a2414', '#5a3a20', '#7a5530'] },
    forest:   { leaf: ['#1d3a1c', '#2c5a2a', '#3d7535', '#5c9a48'], line: '#11240f', trunk: ['#33200f', '#523519', '#6e4b28'] },
    snow:     { leaf: ['#1f3c30', '#2c5642', '#3c7056', '#eef4f8'], line: '#12241c', trunk: ['#33200f', '#523519', '#6e4b28'] },
    necro:    { leaf: ['#2a2028', '#43363f', '#56464f', '#6e5c66'], line: '#161116', trunk: ['#241c20', '#3e3236', '#56484c'] },
    abyss:    { leaf: ['#1c1024', '#3a1e4a', '#5c2e74', '#c07cff'], line: '#0c0610', trunk: ['#1a1216', '#33262c', '#4a3a40'] }
  };
  function canopy(put, lobes, pal) {
    const inside = (x, y) => lobes.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r);
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      if (!inside(x, y)) continue;
      if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) { put(x, y, c3(pal.line)); continue; }
      let L = lobes[0], bd = 1e9;                                      // 이 점이 속한 덩이 — 가운데에서 가장 깊이 들어간 것
      for (const q of lobes) { const d = Math.hypot(x + 0.5 - q[0], y + 0.5 - q[1]) / q[2]; if (d < bd) { bd = d; L = q; } }
      const nx = (x + 0.5 - L[0]) / L[2], ny = (y + 0.5 - L[1]) / L[2];
      const l = -(nx * 0.6 + ny * 0.8) + (hash(x, y, 70) - 0.5) * 0.45;
      put(x, y, c3(pal.leaf[l > 0.62 ? 3 : l > 0.08 ? 2 : l > -0.42 ? 1 : 0]));
    }
  }
  function trunk(put, x0, w, y0, y1, pal) {
    for (let y = y0; y <= y1; y++) for (let x = x0 - 1; x <= x0 + w; x++) {
      const edge = x === x0 - 1 || x === x0 + w;
      put(x, y, c3(edge ? pal.line : pal.trunk[x === x0 ? 2 : x === x0 + w - 1 ? 0 : 1]));
    }
  }
  function tier(put, apex, base, half, cx, pal, jag) {           // 전나무 한 단 — 끝이 처진 삼각형
    for (let y = apex; y <= base; y++) {
      const t = (y - apex) / Math.max(1, base - apex), hw = 0.6 + t * half + (y === base ? jag : 0);
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const dx = x + 0.5 - cx;
        if (Math.abs(dx) > hw) continue;
        const edge = Math.abs(dx) > hw - 1 || y === base;
        const l = -dx / Math.max(1, hw) * 0.9 - t * 0.5 + 0.35 + (hash(x, y, 71) - 0.5) * 0.35;
        put(x, y, c3(edge ? pal.line : pal.leaf[l > 0.7 ? 3 : l > 0.15 ? 2 : l > -0.35 ? 1 : 0]));
      }
    }
  }
  function branch(put, x, y, ang, len, w, pal, depth, rnd) {     // 시든 나무 가지 — 갈라지며 가늘어짐
    for (let s = 0; s < len; s++) {
      x += Math.cos(ang); y += Math.sin(ang);
      for (let k = 0; k < w; k++) put(Math.round(x) + k, Math.round(y), c3(k === 0 ? pal.trunk[2] : pal.trunk[1]));
      put(Math.round(x) + w, Math.round(y), c3(pal.line));
    }
    if (depth <= 0) return;
    const spread = 0.5 + rnd * 0.3;
    branch(put, x, y, ang - spread, len * 0.62, Math.max(1, w - 1), pal, depth - 1, (rnd * 7.3) % 1);
    branch(put, x, y, ang + spread * 0.9, len * 0.58, Math.max(1, w - 1), pal, depth - 1, (rnd * 3.7) % 1);
  }
  const TREE_STYLES = {
    // A 뭉게 나무 — 잎 덩이 넷이 뭉친 활엽수
    A: (put, pal, r) => { trunk(put, 7, 2, 14, TH - 1, pal); canopy(put, [[8, 9.5, 5], [4.8 + r, 11, 3.8], [11.4 - r, 11, 3.8], [8 + (r - 0.5) * 2, 5.8, 4]], pal); },
    // B 동그란 나무 — 큰 덩이 하나, 빛이 또렷
    B: (put, pal, r) => { trunk(put, 7, 2, 15, TH - 1, pal); canopy(put, [[8, 9 + r, 6.6]], pal); },
    // C 키 큰 나무 — 길쭉한 잎 덩이 둘 · 줄기가 보임
    C: (put, pal, r) => { trunk(put, 7, 2, 12, TH - 1, pal); canopy(put, [[8 + (r - 0.5), 6, 4.3], [8, 10, 4.6]], pal); },
    // D 3단 전나무 — 처진 세 단
    D: (put, pal, r) => { trunk(put, 7, 2, 18, TH - 1, pal); tier(put, 0, 7, 3.6, 8, pal, 1); tier(put, 4, 12, 5, 8, pal, 1); tier(put, 9, 18, 6.6 + r, 8, pal, 1); },
    // E 가는 측백 — 좁고 길쭉한 원뿔
    E: (put, pal, r) => { trunk(put, 7, 2, 18, TH - 1, pal); canopy(put, [[8, 4.5, 2.6], [8, 8.5 + r, 3.4], [8, 13, 3.8], [8, 16.2, 3]], pal); },
    // F 앙상한 나무 — 잎 없이 갈라진 가지
    F: (put, pal, r) => { trunk(put, 7, 2, 13, TH - 1, pal); branch(put, 7.5, 13, -Math.PI / 2 - 0.2 + r * 0.4, 6, 2, pal, 3, r); },
    // G 뒤틀린 마목 — 휜 줄기에 듬성듬성 빛나는 잎
    G: (put, pal, r) => {
      for (let y = 8; y < TH; y++) { const x = Math.round(8 + Math.sin(y * 0.55 + r * 3) * 1.6); put(x - 1, y, c3(pal.line)); put(x, y, c3(pal.trunk[2])); put(x + 1, y, c3(pal.trunk[1])); put(x + 2, y, c3(pal.line)); }
      canopy(put, [[5 + r, 7, 2.6], [11, 6 + r, 2.8], [8.5, 3.2, 2.4]], pal);
    }
  };
  // 그림 상자에 나무 하나 (미리보기 도구도 씀 — design/trees)
  function paintTree(put, style, palName, rnd) { TREE_STYLES[style](put, TREE_PAL[palName], rnd); }

  // ---------- 땅마다 나무 (사용자 결정) ----------
  // 활엽수는 A · B · C 를 섞고 · 침엽수는 D · E 를 섞고 · 5격 시체의 도시는 F · 6격 마계는 G.
  // 2격 숲 · 4격 고원은 침엽수(눈밭이면 눈 덮인 빛), 나머지 들 · 왕국 · 성 그늘은 활엽수(성 그늘은 짙은 잎)
  const VARIANTS = 4;                                              // 같은 모양도 흔들림을 넷으로 — 숲이 한 그림의 되풀이로 안 보이게
  function treeOf(m, k, x, y) {
    const lk = m.look[k], bio = lk >> 4, ter = lk & 15, h = hash(x, y, 62);
    if (bio === 5) return ['F', 'necro'];
    if (bio === 6) return ['G', 'abyss'];
    if (bio === 2 || bio === 4) return [h < 0.5 ? 'D' : 'E', ter === SNOW ? 'snow' : 'forest'];
    return [h < 0.34 ? 'A' : h < 0.67 ? 'B' : 'C', bio === 9 ? 'forest' : 'kingdom'];
  }
  // 나무 그림 하나 — 그 모양 · 빛깔 · 흔들림마다 한 번 그려 둠
  const sprites = {};
  function treeSprite(style, pal, v) {
    const key = `${style}|${pal}|${v}`;
    if (sprites[key]) return sprites[key];
    const cv = document.createElement('canvas');
    cv.width = TW; cv.height = TH;
    const g = cv.getContext('2d'), img = g.createImageData(TW, TH), d = img.data;
    paintTree((x, y, c) => { if (x < 0 || y < 0 || x >= TW || y >= TH) return; const i = (y * TW + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }, style, pal, (v + 0.5) / VARIANTS);
    g.putImageData(img, 0, 0);
    return (sprites[key] = cv);
  }

  // 땅 그리기 — 보이는 칸 [x0, x1) × [y0, y1) 의 덩어리를 붙임. 아직 안 그린 덩어리는 이번엔 false (부른 쪽이 옛 색칸으로 메움)
  function drawGround(ctx, m, ox, oy, T, x0, y0, x1, y1) {
    const A = prep(m);
    let budget = BUDGET;
    const missing = [];
    ctx.imageSmoothingEnabled = false;
    for (let cy = Math.floor(y0 / CH); cy * CH < y1; cy++) for (let cx = Math.floor(x0 / CH); cx * CH < x1; cx++) {
      const key = cy * 4096 + cx;
      let cv = A.chunks.get(key);
      if (!cv && budget > 0) { cv = chunk(m, A, cx, cy); A.chunks.set(key, cv); budget--; }
      if (!cv) { missing.push([cx, cy]); continue; }
      A.chunks.delete(key); A.chunks.set(key, cv);                     // 최근에 쓴 것으로 (오래 안 쓴 것부터 버림)
      ctx.drawImage(cv, ox + cx * CH * T, oy + cy * CH * T, cv.width / P * T, cv.height / P * T);
    }
    while (A.chunks.size > CACHE) A.chunks.delete(A.chunks.keys().next().value);
    return missing;
  }

  // 나무 — 보이는 칸의 나무를 위에서 아래로 (아래 것이 위 것을 가리게). 밑동이 그 칸 아래 가장자리에 닿고, 발밑에 옅은 그림자
  function drawTrees(ctx, m, ox, oy, T, x0, y0, x1, y1) {
    ctx.imageSmoothingEnabled = false;
    const sw = TW / P * T, sh = TH / P * T;
    for (let y = Math.max(0, y0 - 1); y < Math.min(m.h, y1 + 3); y++) for (let x = Math.max(0, x0 - 1); x < Math.min(m.w, x1 + 1); x++) {
      const k = y * m.w + x;
      if (m.tile[k] !== TREE) continue;
      const [style, pal] = treeOf(m, k, x, y), v = (hash(x, y, 63) * VARIANTS) | 0;
      const j = (hash(x, y, 61) - 0.5) * 0.3 * T;                       // 줄 맞춰 선 것처럼 안 보이게 살짝 비킴
      const cx = ox + (x + 0.5) * T + j, by = oy + (y + 1) * T;
      ctx.fillStyle = 'rgba(16, 10, 6, 0.28)';
      ctx.beginPath(); ctx.ellipse(cx, by - T * 0.08, T * 0.62, T * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(treeSprite(style, pal, v), Math.round(cx - sw / 2), Math.round(by - sh), sw, sh);
    }
  }

  const api = { has: m => !!(m && m.look), drawGround, drawTrees, paintTree, texture, TW, TH, TREE_STYLES, TREE_PAL, cached: m => (prepared.get(m.look) || { chunks: new Map() }).chunks.size, P, CH, VOID, GRASS, DIRT, COBBLE, TILES, WATER, LAVA, OBSID, SNOW, ROCKY, PAVE, CANAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MapArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
