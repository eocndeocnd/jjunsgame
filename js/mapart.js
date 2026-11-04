// ============================================================
//  mapart.js — 지도 그림 (시안 design/map-concept/render.js 의 무늬를 게임 칸에)
//
//  지도의 「겉모습」 층(look — 칸마다 땅의 종류 · 격, tools/map-gen.js 가 적음)으로 칸마다 도트 무늬를 칠합니다.
//  막히는지는 그대로 바닥 층(ground)이 정합니다 — 그림이 겉모습을 따르더라도 벽 · 물 · 나무 · 바위 · 길은 바닥 층대로.
//  칸 하나를 그림 점 P×P(16×16) 로, CH×CH 칸씩 덩어리(캔버스)로 한 번 그려 두고 화면에 붙입니다 (js/mapview.js 가 씀).
//  큰 얼룩(풀빛이 짙고 옅은 자리 · 돌 크기)은 칸에 대해 시안과 같은 크기로, 잔결(풀잎 · 잔돌 · 줄눈 · 나뭇결 · 물결)은 한 점씩.
//  나무는 이웃 칸에 걸쳐 그려야 해서 덩어리에 넣지 않고 따로 그립니다 (treeSprite).
//  겉모습 층이 없는 지도(7~20격 — 아직)는 그리지 않습니다 (MapArt.has 가 false).
// ============================================================
(function (root) {
  'use strict';

  const P = 16;             // 칸 하나 = 그림 점 16×16 (8×8 의 점 하나를 2×2 로 나눠 더 세세하게 — 사용자 요청)
  const CH = 8;             // 덩어리 하나 = 8×8 칸 = 128×128 점 (점이 넷 배라 덩어리를 작게 — 한 번에 그리는 몫은 예전과 같게)
  const CACHE = 240;        // 덩어리를 이만큼까지 들고 있음 (그보다 많으면 오래 안 쓴 것부터 버림, 하나 64KB)
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
  const WHITE = [255, 255, 255];
  // 시안과 같은 색 (격마다 풀빛이 다름 — 0 들 · 1 지하수로 · 2 숲 · 3 왕국 · 4 고원 · 5 시체의 도시 · 6 마계 · 7 처음 · 8 성 안 · 9 성 그늘)
  const C = {
    grass: [['#6fa04a', '#5d8e3e', '#86b65a', '#4b7a34'], ['#6c9a4c', '#5a8840', '#7fae5c', '#4a7436'],
            ['#4f8a3e', '#3f7534', '#629f4a', '#2f5e2a'], ['#7a9a4e', '#687f42', '#8fae5e', '#566c36'],
            ['#8a9a5c', '#76854e', '#a0ae70', '#5f6c40'], ['#5f6b5a', '#525c4e', '#6e7a68', '#434c40'],
            ['#4a3a44', '#3e303a', '#58464f', '#30252d'], ['#6c9a4c', '#5a8840', '#7fae5c', '#4a7436'],
            ['#7a9a4e', '#687f42', '#8fae5e', '#566c36'], ['#45563a', '#3a4a31', '#536645', '#2a3624']],
    dirt: ['#b48a5a', '#a07a4c', '#c49c6a', '#8a6a42'],
    mud: ['#5a5248', '#4c453c', '#6a6156', '#3a342d'],
    rocky: ['#8e8a70', '#7c785f', '#a09c82', '#66634d'],
    cave: ['#3c3e43', '#33353a', '#484a50', '#27292d'],
    snow: ['#e8eef4', '#d4dee8', '#f6fafc', '#b8c6d6'],
    // 돌바닥은 차분하게 — 돌끼리 · 줄눈과의 밝기 차를 줄임 (사용자 요청 — 1격 돌바닥이 너무 쨍했음)
    cobble: ['#7c7972', '#726f69', '#86837b', '#5e5b55'],
    cobbleCave: ['#55595d', '#4d5155', '#5f6367', '#3a3d40'],
    tiles: ['#b9ad94', '#a39880', '#cfc4aa', '#857b66'],
    tilesDark: ['#3c3346', '#322a3b', '#4a4055', '#241e2c'],
    tilesHall: ['#6a6458', '#5a554a', '#7a7466', '#3a362e'],
    pave: ['#65636e', '#5d5b67', '#6f6d78', '#4a4954'],
    obsid: ['#2c2232', '#231b29', '#3a2d42', '#18121d'],
    waterShallow: hex('#5fb0c0'), waterDeep: hex('#1e5a7a'), foam: hex('#d8f0f0'),
    lavaHot: hex('#ffb040'), void: hex('#0c0a12')
  };
  const shadeOf = (pal, v) => c3(pal[v < 0.3 ? 3 : v < 0.55 ? 1 : v < 0.82 ? 0 : 2]);

  // 돌 하나하나 — 흔든 격자의 가장 가까운 점으로 나눈 칸 (시안의 stones). 가는 줄눈 · 빛 받는 모서리 · 그늘진 모서리 · 돌 표면의 잔결
  function stones(X, Y, size, seed, pal, mortar) {
    const gx = Math.floor(X / size), gy = Math.floor(Y / size);
    let d1 = 1e9, d2 = 1e9, id = 0, ox = 0, oy = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = (gx + dx + 0.15 + hash(gx + dx, gy + dy, seed) * 0.7) * size, cy = (gy + dy + 0.15 + hash(gx + dx, gy + dy, seed + 1) * 0.7) * size;
      const d = (X - cx) ** 2 + (Y - cy) ** 2;
      if (d < d1) { d2 = d1; d1 = d; id = hash(gx + dx, gy + dy, seed + 2); ox = X - cx; oy = Y - cy; } else if (d < d2) d2 = d;
    }
    const edge = Math.sqrt(d2) - Math.sqrt(d1);
    if (edge < 1.5) return hash(X, Y, seed + 4) < 0.15 ? mul(c3(mortar), 0.92) : c3(mortar);
    let c = c3(pal[id < 0.3 ? 1 : id < 0.85 ? 0 : 2]);
    const lit = (ox + oy) / size;
    if (edge < 3.2 && lit < -0.12) c = mix(c, WHITE, edge < 2.3 ? 0.11 : 0.05);
    else if (edge < 3.2 && lit > 0.12) c = mul(c, edge < 2.3 ? 0.86 : 0.93);
    else {
      const n = hash(X, Y, seed + 3);
      if (n < 0.07) c = mul(c, 0.95); else if (n > 0.975) c = mix(c, WHITE, 0.06);
    }
    return c;
  }

  // 땅 무늬 — 점 좌표 X · Y (칸 하나 = P 점). u · w 는 예전(칸 하나 8점) 좌표 — 큰 얼룩은 이걸로 셈해 칸에 대해 같은 크기
  function texture(t, b, X, Y) {
    const u = X / 2, w = Y / 2;
    const v = fbm(u * 0.07, w * 0.07, 3) * 0.55 + vnoise(X * 0.33, Y * 0.33, 5) * 0.2 + hash(X, Y, 1) * 0.25;
    switch (t) {
      case GRASS: {
        const pal = C.grass[b] || C.grass[0];
        let c = shadeOf(pal, v);
        // 풀잎 — 짙은 두 점 위에 밝은 끝 한 점 (끝은 한쪽으로 살짝 휨)
        const G = 0.02;
        if (hash(X, Y, 2) < G || hash(X, Y + 1, 2) < G) c = c3(pal[3]);
        else if ((hash(X + 1, Y + 2, 2) < G && hash(X + 1, Y + 2, 8) < 0.5) || (hash(X - 1, Y + 2, 2) < G && hash(X - 1, Y + 2, 8) >= 0.5)) c = c3(pal[2]);
        // 들꽃 (들에만) — 꽃잎 넷 · 가운데 꽃술 · 아래 줄기
        if (b === 0) {
          const fx = X >> 2, fy = Y >> 2;
          if (hash(fx, fy, 4) < 0.006) {
            const lx = X & 3, ly = Y & 3, petal = ['#f4d35e', '#ee8fb0', '#ffffff', '#9fc5ff'][(hash(fx, fy, 5) * 4) | 0];
            if (lx === 1 && ly === 1) c = c3(petal === '#f4d35e' ? '#b8742a' : '#f8e070');
            else if ((lx === 1 && (ly === 0 || ly === 2)) || (ly === 1 && (lx === 0 || lx === 2))) c = c3(petal);
            else if (lx === 1 && ly === 3) c = c3(pal[3]);
          }
        }
        return c;
      }
      case DIRT: {
        const mud = b === 5;
        let c = shadeOf(mud ? C.mud : C.dirt, v);
        // 잔돌 — 2×2 점, 왼쪽 위는 밝고 오른쪽 아래는 그늘
        const gx = (X / 3) | 0, gy = (Y / 3) | 0, lx = X - gx * 3, ly = Y - gy * 3;
        if (lx < 2 && ly < 2 && hash(gx, gy, 6) < 0.04) {
          const s = lx + ly;
          c = c3(mud ? (s === 0 ? '#8a8276' : s === 2 ? '#2e2924' : '#6a6156') : (s === 0 ? '#e2c496' : s === 2 ? '#7a5c3a' : '#c8a676'));
        } else if (hash(X, Y, 7) < 0.012) c = c3(mud ? '#2e2924' : '#6e5434');
        return c;
      }
      case ROCKY: {
        const cave = b === 7;
        let c = shadeOf(cave ? C.cave : C.rocky, v);
        // 가는 금 — 한쪽 가장자리는 빛을 받아 살짝 밝게
        const n = vnoise(u * 0.06, w * 0.06, 28) - 0.5, r = Math.abs(n);
        if (r < (cave ? 0.011 : 0.007)) c = c3(cave ? '#1a1b1f' : '#5a5644');
        else if (r < (cave ? 0.026 : 0.018) && n > 0) c = mix(c, WHITE, 0.1);
        else if (hash(X, Y, 30) < 0.012) c = c3(cave ? '#5e6168' : '#aaa68c');
        else if (hash(X, Y, 9) < 0.016) c = c3(cave ? '#27292d' : '#55513f');
        if (cave) { if (fbm(u * 0.04, w * 0.04, 31) > 0.62) c = mix(c, c3('#2e4a52'), 0.3); }
        else if (fbm(u * 0.05, w * 0.05, 8) > 0.62) c = mix(c, c3(hash(X, Y, 11) < 0.5 ? '#7f9a52' : '#6a8444'), 0.6);   // 이끼
        return c;
      }
      case SNOW: {
        let c = shadeOf(C.snow, v * 0.7 + 0.3);
        if (fbm(u * 0.05, w * 0.05, 12) < 0.36) c = mix(c, c3('#b8c6d6'), 0.25);      // 눈 더미 그늘
        if (hash(X, Y, 10) < 0.005) c = WHITE;                                          // 반짝
        return c;
      }
      case COBBLE: case CANAL: {
        let c = b === 7 ? stones(X, Y, 16, 12, C.cobbleCave, '#383c40') : stones(X, Y, 14, 11, C.cobble, '#5a5752');
        if (b === 7 && fbm(u * 0.05, w * 0.05, 17) > 0.62) c = mix(c, c3('#2e4a52'), 0.3);
        if (fbm(u * 0.04, w * 0.04, 14) > 0.58 && hash(X, Y, 15) < 0.6) c = mix(c, c3('#56703e'), 0.35);
        if (fbm(u * 0.03, w * 0.03, 16) < 0.3) c = mul(c, 0.9);
        return c;
      }
      case TILES: {
        // 판석 — 한 줄 16점, 한 장 20점 (줄마다 반 장 엇갈림). 줄눈 한 점 · 위 · 왼쪽 모서리는 밝게 · 아래 · 오른쪽은 그늘 · 몇 장엔 가는 금
        const pal = b === 6 ? C.tilesDark : b === 8 ? C.tilesHall : C.tiles;
        const row = Math.floor(Y / 16), off = row % 2 ? 10 : 0, col = Math.floor((X + off) / 20);
        const lx = ((X + off) % 20 + 20) % 20, ly = ((Y % 16) + 16) % 16;
        const tid = hash(col, row, 16);
        if (b === 3 && hash(col, row, 17) < 0.14) {                                     // 왕국 — 판석이 빠진 자리엔 풀
          if (lx === 0 || ly === 0) return c3(pal[3]);
          return texture(GRASS, 3, X, Y);
        }
        let c = c3(pal[tid < 0.25 ? 1 : tid < 0.9 ? 0 : 2]);
        if (lx === 0 || ly === 0) {
          c = c3(pal[3]);
          if (b === 3 && fbm(u * 0.05, w * 0.05, 19) > 0.6) c = c3('#566c36');            // 줄눈에 낀 이끼
          return c;
        }
        if (lx === 1 || ly === 1) c = mix(c, WHITE, 0.14);
        else if (lx === 19 || ly === 15) c = mul(c, 0.84);
        else if (hash(X, Y, 18) < 0.05) c = mul(c, 0.93);
        if (tid > 0.78 && Math.abs(vnoise(X * 0.18, Y * 0.18, 20 + (col & 7)) - 0.5) < 0.025) c = mul(c, 0.68);
        return c;
      }
      case PAVE: {
        let c = stones(X, Y, 20, 19, C.pave, '#46454e');
        if (fbm(u * 0.06, w * 0.06, 22) > 0.6) c = mix(c, c3('#56634e'), 0.32);
        return c;
      }
      case OBSID: {
        let c = shadeOf(C.obsid, v);
        if (hash(X, Y, 23) < 0.004) c = c3('#8a6aa8');                                   // 반짝이는 결
        else if (hash(X - 1, Y - 1, 23) < 0.004) c = c3('#5a4472');
        // 갈라진 틈의 불 — 가운데는 밝고 둘레는 검붉게
        if (fbm(u * 0.02, w * 0.02, 27) > 0.55) {
          const r = Math.abs(vnoise(u * 0.05, w * 0.05, 24) - 0.5);
          if (r < 0.005) c = c3('#ffb040'); else if (r < 0.011) c = c3('#e0501e'); else if (r < 0.018) c = mix(c, c3('#7a1e14'), 0.5);
        }
        return c;
      }
      default: return shadeOf(C.grass[0], v);
    }
  }

  // 땅 아래로 떨어지는 옆면 — 위 칸의 땅에 따라 벽돌 · 흑요석 · 묘지돌 · 바위 · 흙. fy 는 위 땅 가장자리에서 몇 점 아래 (내려갈수록 어둠)
  function faceColor(b, t, X, Y, fy) {
    const n = hash(X, Y, 30), depth = Math.min(1, fy / (2 * P));
    let c;
    if (t === COBBLE || t === CANAL || (t === TILES && b !== 6)) {                     // 벽돌
      const row = Math.floor(Y / 8), off = row % 2 ? 8 : 0, bx = ((X + off) % 16 + 16) % 16, by = ((Y % 8) + 8) % 8;
      const id = hash(Math.floor((X + off) / 16), row, 33);
      c = c3(id < 0.3 ? '#625a52' : id < 0.85 ? '#6d655c' : '#7a7268');
      if (bx === 0 || by === 0) c = c3('#3e3833');
      else if (by === 1) c = mix(c, WHITE, 0.12);
      else if (bx === 15 || by === 7) c = mul(c, 0.82);
      else if (n < 0.08) c = mul(c, 0.9);
    } else if (b === 6 || t === OBSID || t === TILES) {                                // 흑요석 — 세로결 · 흘러내린 불줄기
      c = c3('#1e1624');
      if (hash(X >> 1, Y >> 3, 34) < 0.25) c = c3('#271d2e');
      if (n < 0.04) c = c3('#3a2c46');
      const r = Math.abs(vnoise(X * 0.05, Y * 0.15, 31) - 0.5);
      if (r < 0.01) c = c3('#f07a2a'); else if (r < 0.022) c = c3('#a8361a');
    } else if (b === 5 || t === PAVE) {                                                // 묘지돌 — 큰 돌덩이를 쌓은 벽
      const row = Math.floor(Y / 12), off = row % 2 ? 6 : 0, bx = ((X + off) % 10 + 10) % 10, by = ((Y % 12) + 12) % 12;
      c = c3('#3e3c46');
      if (bx === 0 || by === 0) c = c3('#2a2930'); else if (by === 1) c = c3('#4c4a56'); else if (n < 0.1) c = c3('#46444f');
    } else if (t === SNOW || t === ROCKY || b === 4 || b === 7) {                      // 바위 — 비스듬한 켜
      c = c3('#7a7462');
      const s = ((X >> 1) + ((Y / 6) | 0)) % 6;
      if (s === 0) c = c3('#5a5546'); else if (s === 1) c = c3('#86806c');
      if (n < 0.1) c = c3('#8e8874');
      if (b === 7) c = mul(c, 0.6);
    } else {                                                                           // 흙 — 결 · 뿌리
      c = c3('#6a4a30');
      if (((X >> 1) + (Y >> 3)) % 7 === 0) c = c3('#4e3622');
      if (n < 0.07) c = c3('#86603e');
      if (Math.abs(vnoise(X * 0.15, Y * 0.04, 32) - 0.5) < 0.018) c = c3('#3a5a2a');
    }
    // 위 땅의 가장자리 — 풀은 몇 점 늘어지고, 그 밖은 한 점 밝은 턱
    if (t === GRASS && fy < 2 + ((hash(X >> 1, 0, 35) * 4) | 0)) return c3((C.grass[b] || C.grass[0])[fy < 2 ? 0 : 3]);
    if (fy === 0) c = mix(c, WHITE, 0.18);
    return mul(c, 1 - depth * 0.6);
  }

  // 물 — 물가에서 멀수록 짙게 (칸 사이는 부드럽게), 물가 거품 · 짧은 물결 · 반짝
  function water(m, A, X, Y) {
    const fx = X / P - 0.5, fy = Y / P - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
    const g = (x, y) => (x >= 0 && y >= 0 && x < m.w && y < m.h ? Math.min(A.dist[y * m.w + x], 5) : 0);
    const dep = (g(x0, y0) * (1 - ax) + g(x0 + 1, y0) * ax) * (1 - ay) + (g(x0, y0 + 1) * (1 - ax) + g(x0 + 1, y0 + 1) * ax) * ay;
    const d = Math.min(1, Math.max(0, dep - 0.6) / 2.2);
    let c = mix(C.waterShallow, C.waterDeep, sm(Math.min(1, d * 0.85 + vnoise(X * 0.025, Y * 0.025, 40) * 0.15)));
    const f = hash(X, Y, 39);
    if (d < 0.06 && f < 0.5) return mix(c, C.foam, 0.55);
    if (d < 0.14 && f < 0.14) return mix(c, C.foam, 0.3);
    // 물결 — 다섯 점짜리 가로줄 (줄마다 엇갈림), 그 바로 아래 줄은 살짝 짙게
    const sh = (Y * 5) & 7, p = (X + sh) & 7;
    if (p >= 1 && p <= 5 && hash((X + sh) >> 3, Y, 41) < 0.03) return mix(c, [220, 245, 250], 0.32);
    const sh2 = ((Y - 1) * 5) & 7, p2 = (X + sh2) & 7;
    if (p2 >= 2 && p2 <= 4 && hash((X + sh2) >> 3, Y - 1, 41) < 0.03) c = mul(c, 0.92);
    if (d > 0.3 && hash(X, Y, 42) < 0.0012) c = mix(c, WHITE, 0.6);
    return c;
  }

  // 용암 — 굳어 가는 검붉은 껍질 위 불줄기
  function lava(X, Y) {
    const u = X / 2, w = Y / 2, r = Math.abs(fbm(u * 0.035, w * 0.05, 25) - 0.5);
    if (r < 0.018) return mix(C.lavaHot, [255, 244, 190], 0.55);
    if (r < 0.045) return C.lavaHot;
    if (r < 0.085) return c3('#e0501e');
    const c = mix(c3('#8a2414'), c3('#4a120e'), fbm(u * 0.08, w * 0.08, 26));
    return hash(X, Y, 27) < 0.01 ? c3('#2a0a08') : c;
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
  // 겉모습 「땅이 아님」(어둠 · 물 · 용암)인데 바닥이 땅이면 풀로
  const terOf = raw => (raw === VOID || raw === WATER || raw === LAVA ? GRASS : raw);

  // 칸 하나를 칠하기 전에 한 번 — 그 칸의 종류와 이웃 (점마다 다시 안 살피게)
  function cellOf(m, tx, ty) {
    const k = ty * m.w + tx, t = m.tile[k], raw = m.look[k] & 15;
    const e = { t, raw, ter: terOf(raw), bio: m.look[k] >> 4 };
    const at = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? WALL : m.tile[y * m.w + x]);
    if (t === WALL || t < 0) {
      // 바로 위 두 칸 안에 땅이 있으면 그 땅의 옆면, 아니면 어둠
      e.face = null;
      for (let d = 1; d <= 2; d++) {
        const uy = ty - d;
        if (uy < 0) break;
        const u = m.tile[uy * m.w + tx];
        if (u === POOL) break;
        if (land(u)) { const lk = m.look[uy * m.w + tx]; e.face = { ter: terOf(lk & 15), bio: lk >> 4, top: (uy + 1) * P }; break; }
      }
    } else if (t === ROAD) {
      const off = (dx, dy) => at(tx + dx, ty + dy) !== ROAD;
      e.oL = off(-1, 0); e.oR = off(1, 0); e.oU = off(0, -1); e.oD = off(0, 1);
      e.bridge = raw === WATER || raw === CANAL;
      e.across = !e.oL || !e.oR;                                         // 가로로 건넘 → 판자는 세로
      // 길 밖으로 둥글린 자리에 칠할 땅 — 둘레에서 길이 아닌 첫 땅의 겉모습 (없으면 풀)
      e.gTer = GRASS; e.gBio = e.bio;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const u = at(tx + dx, ty + dy);
        if (u === FLOOR || u === TREE || u === ROCK) { const lk = m.look[(ty + dy) * m.w + tx + dx]; e.gTer = terOf(lk & 15); e.gBio = lk >> 4; break; }
      }
    } else if (t === ROCK) e.belowRock = at(tx, ty + 1) === ROCK;
    if (t === FLOOR || t === TREE) {                                     // 곁에 길이 있으면 길이 이 칸으로 둥글게 번져 들어옴
      e.nearRoad = false;
      for (let dy = -1; dy <= 1 && !e.nearRoad; dy++) for (let dx = -1; dx <= 1; dx++) if (at(tx + dx, ty + dy) === ROAD) { e.nearRoad = true; break; }
    }
    return e;
  }

  // 흙길 모양 — 칸 가운데마다 길이면 1 · 아니면 0 을 두고 그 사이를 부드럽게 이은 값. 잡음으로 흔든 0.5 언저리가 길 가장자리라,
  // 칸 모양(네모 계단)이 아니라 둥글고 비스듬히 이어진 길이 됨 (사용자 요청). 벽 · 물 쪽은 이 칸과 같은 값으로 쳐서 벼랑 · 물가까지 닿게.
  // 막히는지는 그대로 칸대로 (길 · 바닥은 둘 다 걸을 수 있어 그림만 번짐)
  function roadField(m, X, Y, self) {
    const fx = X / P - 0.5, fy = Y / P - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = sm(fx - x0), ay = sm(fy - y0);
    const v = (x, y) => {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) return self;
      const t = m.tile[y * m.w + x];
      return t === ROAD ? 1 : t === WALL || t === POOL || t < 0 ? self : 0;
    };
    return (v(x0, y0) * (1 - ax) + v(x0 + 1, y0) * ax) * (1 - ay) + (v(x0, y0 + 1) * (1 - ax) + v(x0 + 1, y0 + 1) * ax) * ay
      - 0.5 - (vnoise(X * 0.08, Y * 0.08, 81) - 0.5) * 0.3;           // 0 이상이면 길 (가장자리에서 얼마나 안쪽인지)
  }
  // 흙길 한 점 — 바닥과 확실히 다르게 (사용자 요청 — 길이 잘 안 보였음): 가장자리 한두 점은 짙게, 군데군데 패인 자리
  function roadPixel(bio, X, Y, g) {
    const c = texture(DIRT, bio, X, Y);
    if (g < 0.1) return mul(c, 0.56);
    if (g < 0.22) return mul(c, 0.76);
    return hash(X >> 1, Y >> 1, 77) < 0.025 ? mul(c, 0.86) : c;
  }

  // 다리 — 물을 건너는 길은 널판: 건너는 쪽과 엇갈린 판자, 판 사이 틈 · 나뭇결 · 못, 길 아닌 쪽엔 난간
  function bridge(e, X, Y, lx, ly) {
    const R = P - 1, along = e.across ? X : Y, side = e.across ? ly : lx;
    const lo = e.across ? e.oU : e.oL, hi = e.across ? e.oD : e.oR;
    if ((side <= 1 && lo) || (side >= R - 1 && hi)) return c3(side === 0 || side === R ? '#2e1e0e' : '#5a3a20');
    const a = ((along % 8) + 8) % 8;
    if (a === 0) return c3('#3e2814');
    const plank = hash(along >> 3, 0, 72);
    let c = c3(plank < 0.3 ? '#7a5232' : plank < 0.8 ? '#8a6038' : '#9a6e42');
    if (a === 1) c = mix(c, WHITE, 0.12); else if (a === 7) c = mul(c, 0.82);
    if (hash(along, side >> 2, 74) < 0.12) c = mul(c, 0.86);
    if (a === 4 && ((side === 3 && lo) || (side === R - 3 && hi))) c = c3('#2a1c10');
    return c;
  }

  // 점 하나의 색 — 칸 e 안의 (lx, ly) 번째 점, 지도 전체로는 (X, Y)
  function paint(m, A, e, X, Y, lx, ly) {
    const t = e.t;
    if (t === POOL) return e.raw === LAVA ? lava(X, Y) : water(m, A, X, Y);
    if (t === WALL || t < 0) {
      if (e.face) return faceColor(e.face.bio, e.face.ter, X, Y, Y - e.face.top);
      return vnoise(X * 0.03, Y * 0.03, 50) > 0.72 ? c3('#16121f') : C.void;
    }
    if (t === ROAD) {
      if (e.bridge) return bridge(e, X, Y, lx, ly);
      const g = roadField(m, X, Y, 1);
      return g >= 0 ? roadPixel(e.bio, X, Y, g) : texture(e.gTer, e.gBio, X, Y);
    }
    if (e.nearRoad) { const g = roadField(m, X, Y, 0); if (g >= 0) return roadPixel(e.bio, X, Y, g); }
    if (t === ROCK) {
      // 바위 — 그 땅의 바위빛, 위 가장자리는 빛 · 아래쪽은 그늘 (솟은 바위처럼)
      const rt = e.ter === OBSID || e.bio === 6 ? OBSID : ROCKY;
      let c = texture(rt, e.bio === 7 ? 7 : 0, X, Y);
      if (!e.belowRock && ly >= P - 3) c = mul(c, ly === P - 3 ? 0.72 : 0.52);
      else if (ly <= 1) c = mix(c, WHITE, ly === 0 ? 0.16 : 0.08);
      return c;
    }
    return texture(e.ter, e.bio, X, Y);                                   // 바닥 · 나무 밑
  }

  // 칸 [x0, x0+w) × [y0, y0+h) 를 점으로 — put(점 x, 점 y, [r, g, b]) (덩어리 · 미리보기 도구가 씀)
  function bake(m, x0, y0, w, h, put) {
    const A = prep(m);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const tx = x0 + i, ty = y0 + j;
      if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) continue;
      const e = cellOf(m, tx, ty);
      for (let ly = 0; ly < P; ly++) for (let lx = 0; lx < P; lx++) put(i * P + lx, j * P + ly, paint(m, A, e, tx * P + lx, ty * P + ly, lx, ly));
    }
  }

  // 덩어리 하나 (CH×CH 칸) — 캔버스에 한 번 그려 둠
  function chunk(m, cx, cy) {
    const w = Math.min(CH, m.w - cx * CH), h = Math.min(CH, m.h - cy * CH), pw = w * P;
    const cv = document.createElement('canvas');
    cv.width = pw; cv.height = h * P;
    const g = cv.getContext('2d'), img = g.createImageData(pw, h * P), d = img.data;
    bake(m, cx * CH, cy * CH, w, h, (x, y, c) => { const i = (y * pw + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; });
    g.putImageData(img, 0, 0);
    return cv;
  }

  // ---------- 나무 모양 (사용자가 고른 것 — A · B · C 활엽수, D · E 침엽수, F 시든 나무, G 마목) ----------
  // 그림 상자 TW×TH 점 (맨 아래 줄이 땅에 닿는 곳). put(x, y, [r, g, b]) 로 칠하고, rnd 는 그 나무만의 흔들림(0~1)
  // 모두 한 줄 테두리 · 왼쪽 위에서 오는 빛 · 잎 덩이마다 따로 빛을 받아 뭉게뭉게 · 덩이 안에도 잔 잎 뭉치
  const TW = 32, TH = 44;
  const TREE_PAL = {
    kingdom:  { leaf: ['#2f4e22', '#4b7a34', '#62963f', '#8cbc5c'], line: '#1b2e14', trunk: ['#3a2414', '#5a3a20', '#7a5530'] },
    forest:   { leaf: ['#1d3a1c', '#2c5a2a', '#3d7535', '#5c9a48'], line: '#11240f', trunk: ['#33200f', '#523519', '#6e4b28'] },
    snow:     { leaf: ['#1f3c30', '#2c5642', '#3c7056', '#eef4f8'], line: '#12241c', trunk: ['#33200f', '#523519', '#6e4b28'], snowy: true },
    necro:    { leaf: ['#2a2028', '#43363f', '#56464f', '#6e5c66'], line: '#161116', trunk: ['#241c20', '#3e3236', '#56484c'] },
    abyss:    { leaf: ['#1c1024', '#3a1e4a', '#5c2e74', '#c07cff'], line: '#0c0610', trunk: ['#1a1216', '#33262c', '#4a3a40'] }
  };
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // 잎 덩이 — lobes 는 [가운데 x, 가운데 y, 반지름] (앞에 적은 것이 뒤, 뒤에 적은 것이 앞).
  // 가장자리는 둥근 물결(잎 뭉치), 앞 덩이의 가장자리가 뒤 덩이 위에 오는 곳엔 짙은 잎빛 금 — 덩이가 따로 보이게.
  // 눈 덮인 나무(snowy)는 위로 드러난 가장자리 두세 점이 눈
  function canopy(put, lobes, pal, seed) {
    const L = lobes.map(q => [q[0], q[1], q[2], Math.max(5, Math.round(q[2] * 0.9))]);
    const reach = (x, y, q) => {
      const dx = x + 0.5 - q[0], dy = y + 0.5 - q[1];
      return Math.hypot(dx, dy) / (q[2] * (0.93 + 0.09 * Math.abs(Math.sin(Math.atan2(dy, dx) * q[3] / 2 + q[0] * 1.7 + seed))));
    };
    const owner = (x, y) => { for (let i = L.length - 1; i >= 0; i--) if (reach(x, y, L[i]) <= 1) return i; return -1; };
    const top = pal.snowy ? 2 : 3;
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const o = owner(x, y);
      if (o < 0) continue;
      if (N4.some(([dx, dy]) => owner(x + dx, y + dy) < 0)) { put(x, y, c3(pal.line)); continue; }
      if (pal.snowy && (owner(x, y - 2) < 0 || (owner(x, y - 3) < 0 && hash(x, y, 80) < 0.5))) { put(x, y, c3(pal.leaf[3])); continue; }
      const q = L[o], nx = (x + 0.5 - q[0]) / q[2], ny = (y + 0.5 - q[1]) / q[2];
      if (reach(x, y, q) > 1 - 1.3 / q[2]) {                              // 앞 덩이의 가장자리가 뒤 덩이 위 — 금
        let behind = false;
        for (let i = 0; i < o && !behind; i++) behind = reach(x, y, L[i]) <= 1;
        if (behind) { put(x, y, c3(pal.leaf[ny > -0.3 ? 0 : 1])); continue; }
      }
      let l = -(nx * 0.55 + ny * 0.75) - (y / TH) * 0.15
        + (vnoise(x * 0.45 + seed * 9.1, y * 0.45, 78) - 0.5) * 0.55 + (hash(x, y, 70) - 0.5) * 0.22 + ((x + y) & 1 ? 0.04 : -0.04);
      put(x, y, c3(pal.leaf[Math.min(top, l > 0.6 ? 3 : l > 0.1 ? 2 : l > -0.4 ? 1 : 0)]));
    }
  }

  // 줄기 · 가지 — pts 는 [왼쪽 끝 x, y, 굵기] 의 줄들. 둘레 한 점 테두리, 왼쪽은 빛 · 오른쪽은 그늘, 껍질엔 짧은 세로 금
  function ink(put, pts, pal) {
    const S = new Map(), key = (x, y) => (y + 64) * 256 + x + 64;
    for (const [x, y, w] of pts) for (let k = 0; k < w; k++) S.set(key(x + k, y), k === 0 ? 2 : k === w - 1 && w > 2 ? 0 : 1);
    for (const kk of S.keys()) {
      const x = (kk % 256) - 64, y = ((kk / 256) | 0) - 64;
      for (const [dx, dy] of N4) if (!S.has(key(x + dx, y + dy))) put(x + dx, y + dy, c3(pal.line));
    }
    for (const [kk, i] of S) {
      const x = (kk % 256) - 64, y = ((kk / 256) | 0) - 64;
      put(x, y, c3(pal.trunk[i === 1 && hash(x, y >> 1, 79) < 0.16 ? 0 : i]));
    }
  }
  function trunkPts(pts, x0, w, y0, y1) {                          // 곧은 줄기 — 밑동 두 줄은 한 점씩 퍼짐
    for (let y = y0; y <= y1; y++) { const f = y >= y1 - 1 ? 1 : 0; pts.push([x0 - f, y, w + 2 * f]); }
    return pts;
  }
  function trunk(put, x0, w, y0, y1, pal) { ink(put, trunkPts([], x0, w, y0, y1), pal); }
  // 시든 나무 가지 — 갈라지며 가늘어짐. 굵기 1 이 되는 잔가지는 테두리 없이 짙은 한 점 줄로 (twigs — 테두리를 두르면 끝이 뭉개짐)
  function branch(pts, twigs, x, y, ang, len, w, depth, rnd) {
    for (let s = 0; s < len; s++) {
      x += Math.cos(ang) * 0.9; y += Math.sin(ang) * 0.9;
      if (w > 1) pts.push([Math.round(x - (w - 1) / 2), Math.round(y), w]); else twigs.push([Math.round(x), Math.round(y)]);
    }
    if (depth <= 0) return;
    const spread = 0.45 + rnd * 0.3, nw = Math.max(1, w - 1);
    branch(pts, twigs, x, y, ang - spread, len * 0.62, nw, depth - 1, (rnd * 7.3) % 1);
    branch(pts, twigs, x, y, ang + spread * 0.9, len * 0.58, nw, depth - 1, (rnd * 3.7) % 1);
  }
  function limb(pts, x0, y0, x1, y1, w) {                         // 곧은 가지 하나 (마목 — 줄기에서 잎 덩이로)
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s <= n; s++) pts.push([Math.round(x0 + (x1 - x0) * s / n - (w - 1) / 2), Math.round(y0 + (y1 - y0) * s / n), w]);
  }
  // 전나무 한 단 — 끝이 처진 삼각형, 밑단은 톱니 · 바깥 끝은 한 점 더 처짐, 잎결은 가운데에서 아래 바깥으로 비스듬한 빗살
  function tier(put, apex, base, half, cx, pal, seed) {
    const widthAt = y => 1 + (Math.min(y, base) - apex) / Math.max(1, base - apex) * half;
    const inside = (x, y) => {
      if (y < apex || y > base + 1) return false;
      const hw = widthAt(y), dx = Math.abs(x + 0.5 - cx);
      if (dx > hw) return false;
      return y <= base - [0, 1, 2, 1][(((x + seed) % 4) + 4) % 4] + (dx > hw - 2 ? 1 : 0);
    };
    const top = pal.snowy ? 2 : 3;
    for (let y = apex; y <= base + 1; y++) for (let x = 0; x < TW; x++) {
      if (!inside(x, y)) continue;
      if (N4.some(([dx, dy]) => !inside(x + dx, y + dy))) { put(x, y, c3(pal.line)); continue; }
      if (pal.snowy && (!inside(x, y - 2) || (!inside(x, y - 3) && hash(x, y, 80) < 0.5))) { put(x, y, c3(pal.leaf[3])); continue; }
      const t = (y - apex) / Math.max(1, base - apex), hw = widthAt(y), dx = x + 0.5 - cx;
      const needle = ((((dx < 0 ? x + y : x - y) % 3) + 3) % 3) === 0;
      const l = -dx / Math.max(1, hw) * 0.75 + (1 - t) * 0.4 - 0.15 + (hash(x, y, 71) - 0.5) * 0.25 - (needle ? 0.32 : 0);
      put(x, y, c3(pal.leaf[Math.min(top, l > 0.62 ? 3 : l > 0.12 ? 2 : l > -0.38 ? 1 : 0)]));
    }
  }
  const TREE_STYLES = {
    // A 뭉게 나무 — 잎 덩이 여섯이 뭉친 활엽수 (뒤 셋 · 앞 셋)
    A: (put, pal, r) => {
      trunk(put, 14, 4, 28, TH - 1, pal);
      canopy(put, [[16, 10.5, 7.5], [10, 15.5, 6.5], [22, 15.5, 6.5], [16, 19, 8.5], [9.5 + 2 * r, 22.5, 6.6], [22.5 - 2 * r, 22.5, 6.6]], pal, r * 7);
    },
    // B 동그란 나무 — 큰 덩이 하나, 빛이 또렷
    B: (put, pal, r) => { trunk(put, 14, 4, 30, TH - 1, pal); canopy(put, [[16, 18 + 2 * r, 12.6]], pal, r * 7); },
    // C 키 큰 나무 — 길쭉한 잎 덩이 둘 · 줄기가 보임
    C: (put, pal, r) => { trunk(put, 14, 4, 24, TH - 1, pal); canopy(put, [[16 + (r - 0.5) * 2, 12, 8.6], [16, 20.5, 9.2]], pal, r * 7); },
    // D 3단 전나무 — 처진 세 단 (아래 단부터 — 위 단의 밑단이 아래 단 위에 옴)
    D: (put, pal, r) => {
      trunk(put, 14, 4, 36, TH - 1, pal);
      tier(put, 18, 36, 12.6 + 1.6 * r, 16, pal, 1); tier(put, 8, 25, 10, 16, pal, 2); tier(put, 0, 14, 7.2, 16, pal, 3);
    },
    // E 가는 측백 — 좁고 길쭉한 원뿔 (아래 덩이가 앞)
    E: (put, pal, r) => { trunk(put, 14, 4, 36, TH - 1, pal); canopy(put, [[16, 9, 5.2], [16, 17 + 2 * r, 6.8], [16, 26, 7.6], [16, 32.5, 6]], pal, r * 7); },
    // F 앙상한 나무 — 잎 없이 갈라진 가지 (줄기 중간에서 곁가지 하나)
    F: (put, pal, r) => {
      const pts = trunkPts([], 14, 4, 26, TH - 1), twigs = [];
      branch(pts, twigs, 15.5, 26, -Math.PI / 2 - 0.2 + r * 0.4, 12, 4, 4, r);
      branch(pts, twigs, r < 0.5 ? 14 : 17, 33, -Math.PI / 2 + (r < 0.5 ? -0.9 : 0.9), 6, 2, 2, (r * 5.1) % 1);
      for (const [x, y] of twigs) put(x, y, c3(pal.line));
      ink(put, pts, pal);
    },
    // G 뒤틀린 마목 — 휜 줄기에서 가지가 뻗어 듬성듬성 빛나는 잎, 둘레에 떠도는 빛 알갱이
    G: (put, pal, r) => {
      const xs = y => 14 + Math.sin(y * 0.28 + r * 3) * 3, pts = [];
      for (let y = 15; y < TH; y++) { const f = y >= TH - 2 ? 1 : 0; pts.push([Math.round(xs(y)) - f, y, 4 + 2 * f]); }
      const lobes = [[9 + r * 2, 13, 5.4], [23, 11 + r * 2, 5.8], [16.5, 6.5, 5]], tx = xs(15) + 1.5;
      for (const [lx, ly] of lobes) limb(pts, tx, 15, lx, ly, 2);
      ink(put, pts, pal);
      canopy(put, lobes, pal, r * 5);
      const s = 90 + ((r * 97) | 0);
      for (let i = 0; i < 7; i++) put((hash(i, 1, s) * TW) | 0, (hash(i, 2, s) * 24) | 0, c3(pal.leaf[3]));
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

  // 땅 그리기 — 보이는 칸 [x0, x1) × [y0, y1) 의 덩어리를 붙임. 아직 안 그린 덩어리는 이번엔 빼고 돌려줌 (부른 쪽이 옛 색칸으로 메움).
  // 보이는 것을 다 그리고도 몫이 남으면 화면 바로 바깥 한 겹을 미리 — 걸어 들어갈 때 색칸이 안 보이게
  function drawGround(ctx, m, ox, oy, T, x0, y0, x1, y1) {
    const A = prep(m);
    let budget = BUDGET;
    const missing = [];
    const cx0 = Math.floor(x0 / CH), cy0 = Math.floor(y0 / CH), cx1 = Math.ceil(x1 / CH), cy1 = Math.ceil(y1 / CH);
    ctx.imageSmoothingEnabled = false;
    for (let cy = cy0; cy < cy1; cy++) for (let cx = cx0; cx < cx1; cx++) {
      const key = cy * 4096 + cx;
      let cv = A.chunks.get(key);
      if (!cv && budget > 0) { cv = chunk(m, cx, cy); budget--; }
      if (!cv) { missing.push([cx, cy]); continue; }
      A.chunks.delete(key); A.chunks.set(key, cv);                     // 최근에 쓴 것으로 (오래 안 쓴 것부터 버림)
      ctx.drawImage(cv, ox + cx * CH * T, oy + cy * CH * T, cv.width / P * T, cv.height / P * T);
    }
    for (let cy = cy0 - 1; cy <= cy1 && budget > 0; cy++) for (let cx = cx0 - 1; cx <= cx1 && budget > 0; cx++) {
      if (cx < 0 || cy < 0 || cx * CH >= m.w || cy * CH >= m.h) continue;
      const key = cy * 4096 + cx;
      if (A.chunks.has(key)) continue;
      A.chunks.set(key, chunk(m, cx, cy)); budget--;
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

  const api = { has: m => !!(m && m.look), drawGround, drawTrees, paintTree, texture, bake, TW, TH, TREE_STYLES, TREE_PAL, cached: m => (prepared.get(m.look) || { chunks: new Map() }).chunks.size, P, CH, VOID, GRASS, DIRT, COBBLE, TILES, WATER, LAVA, OBSID, SNOW, ROCKY, PAVE, CANAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MapArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
