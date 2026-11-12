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
  // 그림만 쓰는 겉모습 (tools/map-gen.js) — 건물(바깥 지도의 닫힌 건물 한 채를 통째로) · 문간(안 지도의 나가는 문)
  const BUILD = 12, DOORWAY = 13, CARPET = 14;   // CARPET — 건물 안 붉은 깔개
  const RUIN = 15;                                 // 무너진 옛 성벽 · 옛 성문 탑 (막힌 칸)
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
        // 풀잎 — 짙은 두 점 위에 밝은 끝 한 점 (끝은 한쪽으로 살짝 휨). 군데군데 풀잎이 촘촘한 풀 무리 (지도를 풍성하게)
        const G = 0.02 + Math.max(0, vnoise(X * 0.02, Y * 0.02, 130) - 0.5) * 0.3;
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
  function faceColor(b, t, X, Y, fy, hang = 4) {
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
    if (t === GRASS && fy < 2 + ((hash(X >> 1, 0, 35) * hang) | 0)) return c3((C.grass[b] || C.grass[0])[fy < 2 ? 0 : 3]);
    if (fy === 0) c = mix(c, WHITE, 0.18);
    return mul(c, 1 - depth * 0.6);
  }

  // 물 — 물가에서 멀수록 짙게 (칸 사이는 부드럽게), 물가 거품 · 짧은 물결 · 반짝.
  // s 는 물가 모양(poolField)으로 잰 물가에서의 거리 (물가 칸만 — 그 밖은 멀다고 봄). 거품은 이 둥근 물가를 따라
  function water(m, A, X, Y, s = 9) {
    const fx = X / P - 0.5, fy = Y / P - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
    const g = (x, y) => (x >= 0 && y >= 0 && x < m.w && y < m.h ? Math.min(A.dist[y * m.w + x], 5) : 0);
    const dep = (g(x0, y0) * (1 - ax) + g(x0 + 1, y0) * ax) * (1 - ay) + (g(x0, y0 + 1) * (1 - ax) + g(x0 + 1, y0 + 1) * ax) * ay;
    const d = Math.min(1, Math.max(0, dep - 0.6) / 2.2);
    let c = mix(C.waterShallow, C.waterDeep, sm(Math.min(1, d * 0.85 + vnoise(X * 0.025, Y * 0.025, 40) * 0.15)));
    const f = hash(X, Y, 39);
    if (s < 0.1 && f < 0.6) return mix(c, C.foam, 0.55);
    if (s < 0.22 && f < 0.2) return mix(c, C.foam, 0.3);
    // 물결 — 다섯 점짜리 가로줄 (줄마다 엇갈림), 그 바로 아래 줄은 살짝 짙게
    const sh = (Y * 5) & 7, p = (X + sh) & 7;
    if (p >= 1 && p <= 5 && hash((X + sh) >> 3, Y, 41) < 0.03) return mix(c, [220, 245, 250], 0.32);
    const sh2 = ((Y - 1) * 5) & 7, p2 = (X + sh2) & 7;
    if (p2 >= 2 && p2 <= 4 && hash((X + sh2) >> 3, Y - 1, 41) < 0.03) c = mul(c, 0.92);
    if (d > 0.3 && hash(X, Y, 42) < 0.0012) c = mix(c, WHITE, 0.6);
    return c;
  }

  // 용암 — 굳어 가는 검붉은 껍질 위 불줄기. 이 점이 용암이라고 적어 둠 (glowHit — 덩어리의 일렁이는 빛 판, chunk)
  let glowHit = false;
  function lava(X, Y) {
    glowHit = true;
    const u = X / 2, w = Y / 2, r = Math.abs(fbm(u * 0.035, w * 0.05, 25) - 0.5);
    if (r < 0.018) return mix(C.lavaHot, [255, 244, 190], 0.55);
    if (r < 0.045) return C.lavaHot;
    if (r < 0.085) return c3('#e0501e');
    const c = mix(c3('#8a2414'), c3('#4a120e'), fbm(u * 0.08, w * 0.08, 26));
    return hash(X, Y, 27) < 0.01 ? c3('#2a0a08') : c;
  }
  // 용암가 — 땅에 닿는 가장자리는 식어 굳은 검은 껍질 (s 는 water 와 같은 물가에서의 거리)
  function lavaPix(X, Y, s = 9) {
    if (s < 0.06) return c3('#1e0a08');
    if (s < 0.15 + vnoise(X * 0.2, Y * 0.2, 87) * 0.1) return hash(X, Y, 88) < 0.2 ? c3('#6a2214') : c3('#45140e');
    return lava(X, Y);
  }

  // ---------- 건물 — 몰락한 왕의 성 (바깥 지도의 닫힌 건물 한 채, 남쪽 정면 가운데 성문) ----------
  // 위에서 비스듬히 내려다본 성: 둘레 성벽(윗면엔 톱니 담 · 몇 개는 무너짐, 남쪽은 벽면이 보임) · 네 모서리 둥근 탑(고깔 지붕) ·
  // 성문 양옆 작은 탑 · 아치 성문(활짝 연 문짝 · 끌어올린 쇠창살) · 안뜰 한가운데 성채(기와 지붕 · 굴뚝 · 높은 창 · 버팀벽 · 앞 모서리 작은 탑) ·
  // 돌 깔린 안뜰과 성문에서 성채까지 판석 길 · 남쪽 벽면의 담쟁이 · 해진 붉은 깃발. 덩어리를 그릴 때 그 자리만 (buildingPixel)
  const CK = {
    face: ['#8e887c', '#837d72', '#99938a', '#676257'], mortar: '#4e4a43', line: '#241f1b',
    top: ['#a39d91', '#979185', '#aea89c', '#7d776c'],
    roof: ['#404a5b', '#38414f', '#4b5568', '#2a303c'], roofLine: '#191d26', ridge: '#5b6679',
    cone: ['#54496a', '#41395a', '#6c6088', '#2a2436'], spire: '#b8984a',
    wood: ['#4a2e18', '#5e3c20', '#74502c'], iron: '#2b2a2e',
    banner: ['#5e1a1e', '#7a2428', '#3e1013'], gold: '#c8a24a',
    win: '#141018', ivy: ['#2e4a24', '#3e5e2e', '#4f7438'], inner: '#26222c'
  };
  const pick4 = (pal, v) => c3(pal[v < 0.25 ? 3 : v < 0.55 ? 1 : v < 0.85 ? 0 : 2]);
  // 다듬은 돌을 쌓은 벽면 — 줄 rh 점 · 돌 bw 점 (줄마다 반 개 엇갈림), 잔결은 지도 좌표 X · Y
  function ashlar(sx, sy, rh, bw, seed, X, Y) {
    const row = Math.floor(sy / rh), off = row % 2 ? bw >> 1 : 0, col = Math.floor((sx + off) / bw);
    const lx = ((sx + off) % bw + bw) % bw, ly = ((sy % rh) + rh) % rh;
    if (lx === 0 || ly === 0) return c3(CK.mortar);
    let c = pick4(CK.face, hash(col, row, seed));
    if (ly === 1) c = mix(c, WHITE, 0.12); else if (ly === rh - 1 || lx === bw - 1) c = mul(c, 0.85);
    else if (hash(X, Y, seed + 1) < 0.06) c = mul(c, 0.92);
    if (Math.abs(vnoise(X * 0.06, Y * 0.06, seed + 2) - 0.5) < 0.008) c = mul(c, 0.6);   // 금
    return c;
  }
  // 성벽 윗면 — along 은 벽을 따라, across 는 바깥 가장자리에서 안으로 (0 ~ wt). 바깥엔 톱니 담, 안쪽 가장자리는 아래로 떨어지는 그늘
  function wallTop(along, across, wt, X, Y) {
    if (across >= wt - 2) return mul(c3(CK.top[3]), across === wt - 1 ? 0.5 : 0.7);
    const mi = Math.floor(along / 14), ma = ((along % 14) + 14) % 14;
    if (across < 8) {
      if (hash(mi, 0, 91) >= 0.14 && ma < 9) {                                  // 높은 돌 (몇 개는 무너져 빈자리)
        if (across === 0 || ma === 0 || ma === 8) return c3(CK.line);
        return across <= 2 ? mix(c3(CK.top[2]), WHITE, 0.12) : across >= 6 ? mul(c3(CK.top[0]), 0.8) : c3(CK.top[0]);
      }
      if (across === 0) return c3(CK.line);
    }
    const s = Math.floor(along / 12), ls = ((along % 12) + 12) % 12;            // 걷는 길 — 판석
    let c = c3(CK.top[hash(s, 1, 92) < 0.3 ? 1 : 0]);
    if (ls === 0) c = mul(c, 0.8);
    if (across === 8 || across === 9) c = mul(c, 0.82);
    if (hash(X, Y, 93) < 0.05) c = mul(c, 0.93);
    return c;
  }
  // 둥근 탑 — t = { cx, cy, r, body }. 고깔 지붕(둥근 기와 줄 · 꼭대기 쇠 장식) 아래 둥근 몸통(휘어 보이는 벽돌 · 왼쪽 빛 · 가운데 활 쏘는 틈)
  function towerPix(t, px, py) {
    const dx = px + 0.5 - t.cx, dy = py + 0.5 - t.cy, rr = t.r, ry = rr * 0.8;
    const q = (dx / rr) ** 2 + (dy / ry) ** 2;
    if (q <= 1) {
      if (q > 1 - 2.6 / rr) return c3(CK.roofLine);
      const d = Math.sqrt(q), nx = dx / rr, ny = dy / ry;
      if (d < 0.08) return c3(d < 0.04 ? '#e8d088' : CK.spire);
      const row = Math.floor(d * rr / 5), lr = (d * rr) % 5, ang = Math.atan2(ny, nx);
      const seg = Math.floor((ang / (2 * Math.PI) + 0.5) * (6 + row * 3) + (row % 2) * 0.5);
      const l = -(nx * 0.55 + ny * 0.75) / Math.max(0.35, d) * Math.min(1, d * 1.8) + (hash(seg, row, 94) - 0.5) * 0.3;
      const c = pick4(CK.cone, 0.55 + l * 0.42);
      return lr < 1 ? mul(c, 0.72) : c;
    }
    const bw = rr - 4;
    if (Math.abs(dx) > bw || dy < 0) return null;
    const bottom = t.body + Math.sqrt(Math.max(0, 1 - (dx / bw) ** 2)) * bw * 0.3;
    if (dy > bottom) return null;
    if (Math.abs(dx) > bw - 1.2 || dy > bottom - 1.2) return c3(CK.line);
    const u = Math.asin(Math.max(-1, Math.min(1, dx / bw))) / (Math.PI / 2), row = Math.floor(dy / 7), off = row % 2 ? 0.5 : 0;
    const fu = ((u * 6 + off) % 1 + 1) % 1;
    let c = (dy % 7 < 1 || fu < 0.07) ? c3(CK.mortar) : pick4(CK.face, hash(Math.floor(u * 6 + off), row, 95));
    c = mul(c, 1.08 - (u + 1) * 0.22 - (dy / bottom) * 0.1);
    if (Math.abs(dx) < 2 && dy > ry + 6 && dy < ry + 16) c = c3(CK.win);
    return c;
  }
  // 해진 깃발 — 왼쪽 위 (bx, by), 폭 bw · 길이 bh. 장대 · 금줄 · 작은 왕관 무늬 · 들쭉날쭉한 끝
  function bannerPix(bx, by, bw, bh, px, py) {
    const lx = px - bx, ly = py - by;
    if (lx < 0 || lx >= bw || ly < 0 || ly >= bh - 4 + ((lx * 7) % 5)) return null;
    if (ly < 2) return c3(CK.wood[0]);
    if (lx === 0 || lx === bw - 1) return c3(CK.banner[2]);
    let c = c3(CK.banner[lx < bw / 2 ? 1 : 0]);
    if (ly === 4 || ly === 5) c = c3(CK.gold);
    const cx = bw >> 1, dx = lx - cx;
    if (ly >= 10 && ly <= 14 && Math.abs(dx) <= 3 && (ly >= 12 || dx % 3 === 0)) c = c3(CK.gold);
    return hash(lx, ly, 98) < 0.05 ? mul(c, 0.8) : c;
  }
  // 담쟁이 — 벽면 윗변(top)에서 늘어진 덩굴 (자리마다 길이가 다름)
  function ivy(px, py, top) {
    const len = (vnoise(px * 0.07, top * 0.01, 103) - 0.56) * 110;
    if (len <= 0 || py - top > len || hash(px >> 1, py >> 1, 104) > 0.7) return null;
    return c3(CK.ivy[(hash(px, py, 105) * 3) | 0]);
  }

  function castleGeom(B) {
    const pw = B.w * P, ph = B.h * P, M = 14, WT = 26, FACE = 40;
    const d0 = B.door ? (B.door.x - B.x0) * P : (pw >> 1) - 32, d1 = B.door ? d0 + B.door.w * P : d0 + 64;
    const r = 32, rg = 22, kx0 = 92, kx1 = pw - 92;
    const G = { pw, ph, M, WT, FACE, d0, d1, kx0, kx1, ry0: 104, ryr: 122, ry1: 300, kyf: 368, rp0: kx0 + 64, rp1: kx1 - 64 };
    G.front = [{ cx: d0 - 16, cy: ph - 69, r: rg, body: 62 }, { cx: d1 + 16, cy: ph - 69, r: rg, body: 62 },
               { cx: r + 1, cy: ph - 71, r, body: 61 }, { cx: pw - r - 1, cy: ph - 71, r, body: 61 }];
    G.back = [{ cx: r + 1, cy: 28, r, body: 47 }, { cx: pw - r - 1, cy: 28, r, body: 47 }];
    G.turrets = [{ cx: kx0 + 2, cy: G.ry1 - 8, r: 18, body: G.kyf - (G.ry1 - 8) - 4 }, { cx: kx1 - 2, cy: G.ry1 - 8, r: 18, body: G.kyf - (G.ry1 - 8) - 4 }];
    return G;
  }
  function castlePix(G, px, py, X, Y) {
    const { pw, ph, M, WT, FACE, d0, d1 } = G;
    let c;
    for (const t of G.front) if ((c = towerPix(t, px, py))) return c;
    // 성문 위 성루 — 문 폭보다 조금 넓게, 성벽보다 높이 솟음 (윗면 톱니 담)
    const gx0 = d0 - 8, gx1 = d1 + 8, gTop = ph - FACE - 30;
    if (px >= gx0 && px < gx1 && py >= gTop) {
      const hw = (d1 - d0) / 2, cx = d0 + hw, cyA = ph - FACE - 14 + hw, dx = px + 0.5 - cx;
      const r2 = Math.hypot(dx, py + 0.5 - cyA), inArch = py >= cyA ? Math.abs(dx) < hw : r2 < hw;
      if (inArch) {
        const ix = px - d0;
        if (ix < 7 || ix >= d1 - d0 - 7) {                                     // 활짝 연 나무 문짝
          if (ix === 6 || ix === d1 - d0 - 7) return c3(CK.line);
          let w = c3(CK.wood[ix % 3 === 0 ? 0 : hash(ix, 0, 96) < 0.5 ? 1 : 2]);
          if ((py - cyA) % 12 === 4) w = c3(CK.iron);
          return w;
        }
        if (py < cyA - hw * 0.35 && (ix % 6) === 3) return c3(CK.iron);            // 끌어올린 쇠창살 끝
        const t = Math.min(1, (ph - py) / (ph - (cyA - hw)) * 1.3);
        return py >= ph - 6 ? mix(texture(COBBLE, 3, X, Y), c3('#0e0a0c'), 0.4) : mix(c3('#3a3230'), c3('#0e0a0c'), t);
      }
      const inRing = py >= cyA ? Math.abs(dx) < hw + 5 : r2 < hw + 5;
      if (inRing) {                                                             // 아치 돌 — 쐐기 모양
        if ((py >= cyA ? Math.abs(dx) >= hw + 4 : r2 >= hw + 4) || (py >= cyA ? Math.abs(dx) < hw + 1 : r2 < hw + 1)) return c3(CK.line);
        const seg = py >= cyA ? 100 + Math.floor((py - cyA) / 8) * 2 + (dx < 0 ? 0 : 1) : Math.floor((Math.atan2(py + 0.5 - cyA, dx) + Math.PI) / (Math.PI / 9));
        const s2 = py >= cyA ? ((py - cyA) % 8) === 0 : Math.abs(((Math.atan2(py + 0.5 - cyA, dx) + Math.PI) / (Math.PI / 9)) % 1) < 0.08;
        return s2 ? c3(CK.mortar) : pick4(CK.top, hash(seg, 0, 97) * 0.6 + 0.4);
      }
      if (py < gTop + 8) return wallTop(px, py - gTop, 9, X, Y) || c3(CK.top[0]);
      if (px === gx0 || px === gx1 - 1) return c3(CK.line);
      return mul(ashlar(px, py - gTop, 10, 20, 107, X, Y), 0.96);
    }
    // 깃발 — 성문 탑과 모서리 탑 사이 벽면
    for (const bx of [Math.round(pw * 0.25) - 7, Math.round(pw * 0.75) - 7]) if ((c = bannerPix(bx, ph - FACE + 4, 14, 32, px, py))) return c;
    // 남쪽 성벽 — 벽면 (담쟁이 · 활 쏘는 틈) · 윗면
    if (px >= M && px < pw - M && py >= ph - FACE) {
      const sy = py - (ph - FACE);
      if (px === M || px === pw - M - 1 || py === ph - 1 || sy === 0) return c3(CK.line);
      if (sy < 3) return mix(c3(CK.top[0]), WHITE, 0.1);
      const v = ivy(px, sy, 3);
      if (v) return v;
      const slit = ((px - 52) % 72 + 72) % 72;
      if (slit < 2 && sy > 12 && sy < 26) return c3(CK.win);
      return mul(ashlar(px, sy, 10, 20, 105, X, Y), 1 - sy / FACE * 0.25);
    }
    if (px >= M && px < pw - M && py >= ph - FACE - WT) return wallTop(px, ph - FACE - 1 - py, WT, X, Y);
    for (const t of G.back) if ((c = towerPix(t, px, py))) return c;
    // 서 · 동 · 북 성벽 윗면 · 북쪽 성벽 안쪽 벽면 (안뜰에서 보임)
    if (py >= M && px >= M && px < M + WT) return wallTop(py, px - M, WT, X, Y);
    if (py >= M && px < pw - M && px >= pw - M - WT) return wallTop(py, pw - M - 1 - px, WT, X, Y);
    if (px >= M && px < pw - M && py >= M && py < M + WT) return wallTop(px, py - M, WT, X, Y);
    const NF = 28, nTop = M + WT;
    if (px >= M + WT && px < pw - M - WT && py >= nTop && py < nTop + NF) {
      const sy = py - nTop;
      if (sy === NF - 1) return c3(CK.line);
      return mul(ashlar(px, sy, 10, 20, 108, X, Y), 0.82 - sy / NF * 0.12);
    }
    // 성채 — 앞 모서리 작은 탑 · 굴뚝 · 기와 지붕 · 앞 벽면
    for (const t of G.turrets) if ((c = towerPix(t, px, py))) return c;
    if ((c = keepPix(G, px, py, X, Y))) return c;
    // 안뜰 — 돌바닥 · 성문에서 성채 문까지 판석 길 · 벽 · 성채 그늘
    if (px >= M + WT && px < pw - M - WT && py >= nTop + NF && py < ph - FACE - WT) {
      const path = Math.abs(px + 0.5 - (d0 + d1) / 2) < 20 && py >= G.kyf;
      c = path ? texture(TILES, 3, X, Y) : texture(COBBLE, 3, X, Y);
      if (py < G.kyf + 8 && px >= G.kx0 - 6 && px < G.kx1 + 6) c = mul(c, 0.72);
      if (px < M + WT + 6 || py < nTop + NF + 6) c = mul(c, 0.8);
      return c;
    }
    return texture(GRASS, 3, X, Y);                                             // 성 둘레 — 풀
  }
  function keepPix(G, px, py, X, Y) {
    const { kx0, kx1, ry0, ryr, ry1, kyf, rp0, rp1 } = G, x0 = kx0 - 6, x1 = kx1 + 6;
    // 굴뚝 둘 — 뒤 지붕에 솟음
    for (const cx of [rp0 + 16, rp1 - 16]) if (px >= cx - 6 && px < cx + 6 && py >= ry0 - 12 && py < ryr + 2) {
      if (px === cx - 6 || px === cx + 5 || py === ry0 - 12 || py === ryr + 1) return c3(CK.line);
      if (py < ry0 - 8) return c3('#1a1618');
      return mul(ashlar(px, py, 6, 6, 109, X, Y), px < cx ? 1 : 0.8);
    }
    if (px >= x0 && px < x1 && py >= ry0 && py < ry1) {                            // 지붕 — 뒤 · 앞 · 왼쪽 · 오른쪽 면 (용마루는 rp0~rp1)
      if (px === x0 || px === x1 - 1 || py === ry0 || py === ry1 - 1) return c3(CK.roofLine);
      const xp = px + 0.5, yp = py + 0.5;
      const lx = yp <= ryr ? x0 + (rp0 - x0) * (yp - ry0) / (ryr - ry0) : x0 + (rp0 - x0) * (ry1 - yp) / (ry1 - ryr);
      const rx = yp <= ryr ? x1 - (x1 - rp1) * (yp - ry0) / (ryr - ry0) : x1 - (x1 - rp1) * (ry1 - yp) / (ry1 - ryr);
      const hipL = Math.abs(xp - lx) < 1.6, hipR = Math.abs(xp - rx) < 1.6, ridge = Math.abs(yp - ryr) < 1.6 && xp > rp0 - 1 && xp < rp1 + 1;
      if (hipL || hipR || ridge) return c3(CK.ridge);
      const base = xp < lx ? 0.88 : xp > rx ? 0.3 : yp < ryr ? 0.14 : 0.6;
      const rowH = 6, row = Math.floor((py - ry0) / rowH), off = row % 2 ? 4 : 0, col = Math.floor((px + off) / 8);
      const ly = (py - ry0) % rowH, sx = (px + off) % 8;
      let c = pick4(CK.roof, base + (hash(col, row, 99) - 0.5) * 0.3);
      if (ly === rowH - 1) c = mul(c, 0.72); else if (sx === 0) c = mul(c, 0.82); else if (ly === 0) c = mix(c, WHITE, 0.06);
      if (hash(col, row, 100) < 0.008) c = mul(c, 0.45);                           // 빠진 기와 (드물게)
      if (fbm(X * 0.02, Y * 0.02, 101) > 0.7) c = mix(c, c3('#4e5a3a'), 0.35);       // 이끼
      return c;
    }
    if (px < kx0 || px >= kx1 || py < ry1 || py >= kyf) return null;              // 앞 벽면
    if (px === kx0 || px === kx1 - 1 || py === kyf - 1) return c3(CK.line);
    const sx = px - kx0, sy = py - ry1, H = kyf - ry1, cx = (kx1 - kx0) / 2, ddx = sx + 0.5 - cx;
    // 문 — 가운데 큰 아치 문 (닫힘, 쇠띠)
    const dw = 15, dTop = H - 36;
    if (Math.abs(ddx) < dw + 3 && sy >= dTop - 3) {
      const r2 = Math.hypot(ddx, sy + 0.5 - (dTop + dw)), inD = sy >= dTop + dw ? Math.abs(ddx) < dw : r2 < dw;
      const inF = sy >= dTop + dw ? Math.abs(ddx) < dw + 3 : r2 < dw + 3;
      if (inD) { if (Math.abs(ddx) < 1) return c3(CK.line); let w = c3(CK.wood[(Math.floor(sx / 4) % 2) ? 1 : 2]); if ((sy - dTop) % 10 === 8) w = c3(CK.iron); return w; }
      if (inF) return pick4(CK.top, 0.7);
    }
    // 높고 끝이 둥근 창 · 사이마다 버팀벽
    const per = 40, wx = ((sx - 20) % per + per) % per - per / 2, bx = ((sx % per) + per) % per;
    if (bx < 6) return bx === 0 || bx === 5 ? c3(CK.line) : mul(c3(CK.top[bx < 3 ? 2 : 0]), sy < 4 ? 0.7 : 1);
    if (Math.abs(ddx) > dw + 8 && Math.abs(wx) < 5 && sy > 12 && sy < 42) {
      const top = 17;
      if (sy < top && Math.hypot(wx, sy - top) >= 5) return mul(ashlar(sx, sy, 9, 18, 110, X, Y), 0.9);
      if (Math.abs(wx) >= 4 || sy === 13 || sy === 41) return pick4(CK.top, 0.6);
      return wx === 0 ? c3('#2a2430') : c3(hash(sx >> 2, 0, 111) < 0.2 ? '#3a2e44' : CK.win);
    }
    let c = ashlar(sx, sy, 9, 18, 110, X, Y);
    if (sy < 5) c = mul(c, 0.55 + sy * 0.08);                                     // 처마 그늘
    const v = ivy(px, sy, 5);
    return v && Math.abs(ddx) > dw + 4 ? v : c;
  }
  // 건물 칸의 점 — 덩어리를 그릴 때 그 자리만 (한 채를 한꺼번에 그리면 120ms 쯤 멈칫해서, 땅처럼 덩어리마다 나눠 그림)
  function buildingPixel(A, e, X, Y) {
    const B = A.buildings[e.b];
    if (B.kind) return cityBuilding(B, X - B.x0 * P, Y - B.y0 * P, X, Y);   // 도시의 건물
    if (!B.G) B.G = castleGeom(B);
    return castlePix(B.G, X - B.x0 * P, Y - B.y0 * P, X, Y);
  }

  // ---------- 건물 안 (지도 속성 interior) — 벽 · 기둥 · 나가는 문간 ----------
  // 위 벽(바닥 바로 위 세 칸)은 벽돌 벽면 — 깃발과 횃불이 번갈아 걸림. 옆 · 아래 벽은 어두운 벽 윗면(바닥 쪽 가장자리만 살짝 밝게)
  function hallWall(m, e, X, Y, lx, ly) {
    if (e.up) {
      const fy = (3 - e.up) * P + ly, FH = 3 * P;
      if (fy < 5) return fy === 4 ? c3(CK.line) : c3(CK.inner);
      const sx = X - (m.w * P >> 1) + 48, ph = ((sx % 96) + 96) % 96, tx = ((sx + 48) % 96 + 96) % 96 - 48;   // 가운데(보스 위)에 깃발, 좌우로 마주 보게
      const b = bannerPix(41, 8, 14, 32, ph, fy);
      if (b) return b;
      // 횃불 — 쇠 받침 · 불꽃, 둘레 벽은 따뜻하게
      if (Math.abs(tx) <= 1 && fy >= 22 && fy < 30) return c3(CK.iron);
      if (Math.abs(tx) <= 2 && fy >= 13 && fy < 22 && Math.abs(tx) <= (fy - 12) * 0.5) return c3(Math.abs(tx) < 1 && fy > 16 ? '#fff0b0' : fy > 18 ? '#ffb040' : '#ff7a22');
      let c = mul(ashlar(X, fy, 10, 20, 106, X, Y), 0.8 - (fy / FH) * 0.15);
      if (fy >= FH - 3) c = mul(c, 0.7);
      const g = Math.hypot(tx, fy - 18);
      if (g < 18) c = mix(c, c3('#ffb060'), 0.28 * (1 - g / 18));
      return c;
    }
    if (!e.rim) return C.void;
    let c = mul(c3(CK.inner), 0.9 + hash(X >> 2, Y >> 2, 112) * 0.2);
    const R = P - 1, d = Math.min(e.rim.l ? lx : 99, e.rim.r ? R - lx : 99, e.rim.u ? ly : 99, e.rim.d ? R - ly : 99);
    if (d === 0) return c3(CK.line);
    if (d < 3) c = mix(c, c3(CK.top[3]), 0.5);
    return c;
  }
  // 돌기둥 — 덩어리(e.pb, 칸) 자리의 바닥은 기둥 그늘만 (오른쪽 · 아래로 짙게). 기둥 그림은 drawTrees 가 나무처럼 따로 — 칸 위로 솟게
  function pillarFloor(e, X, Y) {
    const b = e.pb, fx = (X - b.x0 * P) / ((b.x1 - b.x0) * P), fy = (Y - b.y0 * P) / ((b.y1 - b.y0) * P);
    return mul(texture(TILES, 8, X, Y), 0.9 - Math.max(0, fx - 0.4) * 0.35 - fy * 0.1);
  }
  // 기둥 그림 — 폭 BW · 높이 BH 점: 위는 네모난 기둥머리(윗면 · 판돌 · 둥근 받침), 아래는 받침돌, 사이는 세로 홈이 난 둥근 몸 (왼쪽 빛)
  function paintPillar(put, BW, BH) {
    const CAP = 14, BASE = 10, IN = 6, line = c3(CK.line);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const f = x / (BW - 1);
      if (y < CAP) {
        const ins = y >= CAP - 4 ? 3 : 0;
        if (x < ins || x >= BW - ins) continue;
        if (x === ins || x === BW - 1 - ins || y === 0 || y === CAP - 1 || y === CAP - 5) { put(x, y, line); continue; }
        put(x, y, y <= 4 ? mix(c3(CK.top[2]), WHITE, 0.1 - f * 0.1) : pick4(CK.top, 0.95 - f * 0.75));
      } else if (y >= BH - BASE) {
        const ins = y < BH - BASE + 3 ? 2 : 0;
        if (x < ins || x >= BW - ins) continue;
        if (x === ins || x === BW - 1 - ins || y === BH - 1 || y === BH - BASE || y === BH - BASE + 3) { put(x, y, line); continue; }
        put(x, y, mul(pick4(CK.top, 0.9 - f * 0.7), 0.92));
      } else {
        if (x < IN || x >= BW - IN) continue;
        if (x === IN || x === BW - 1 - IN) { put(x, y, line); continue; }
        const g = (x - IN) / (BW - 2 * IN - 1);
        let c = pick4(CK.face, 0.95 - g * 0.85);
        if ((x - IN) % 5 === 0) c = mul(c, 0.85);
        if (y < CAP + 3) c = mul(c, 0.68);
        if (y > BH - BASE - 7 && hash(x, y, 113) < 0.22) c = c3(CK.ivy[(hash(x, y, 114) * 3) | 0]);   // 밑동의 이끼
        put(x, y, c);
      }
    }
  }
  const pillarSprites = {};
  function pillarSprite(bw) {
    if (pillarSprites[bw]) return pillarSprites[bw];
    const W = bw * P, Hh = PILLAR_H, cv = document.createElement('canvas');
    cv.width = W; cv.height = Hh;
    const g = cv.getContext('2d'), img = g.createImageData(W, Hh), d = img.data;
    paintPillar((x, y, c) => { const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }, W, Hh);
    g.putImageData(img, 0, 0);
    return (pillarSprites[bw] = cv);
  }
  const PILLAR_H = 72;                                              // 기둥 높이 4.5칸 — 자리(2~3칸)보다 위로 솟음
  // 붉은 깔개 — 가장자리에 금줄, 가운데는 마름모 무늬, 군데군데 해짐
  function carpetPix(e, X, Y, lx) {
    const R = P - 1, edge = Math.min(e.cL ? 99 : lx, e.cR ? 99 : R - lx);
    if (edge === 0) return c3('#3e1013');
    if (edge === 1 || edge === 3) return c3('#c8a24a');
    if (edge === 2) return c3('#5e1a1e');
    const dx = Math.abs(((X % 16) + 16) % 16 - 8), dy = Math.abs(((Y % 16) + 16) % 16 - 8);
    let c = c3(dx + dy === 5 ? '#8a3a2a' : '#6e1e24');
    if (fbm(X * 0.04, Y * 0.04, 115) > 0.7) c = mix(c, c3('#9a6a58'), 0.3);           // 닳아 바랜 자리
    return hash(X, Y, 116) < 0.05 ? mul(c, 0.88) : c;
  }
  // 나가는 문간 — 바닥이 이어지고 밖에서 드는 빛(아래로 갈수록 밝게), 양끝은 문설주
  function doorwayPix(e, X, Y, lx, ly) {
    const R = P - 1;
    if ((!e.dL && lx < 4) || (!e.dR && lx > R - 4)) { const k = !e.dL && lx < 4 ? lx : R - lx; return k === 0 ? c3(CK.line) : c3(CK.top[k === 1 ? 2 : 0]); }
    return mix(texture(TILES, 8, X, Y), c3('#f0dca8'), 0.15 + ly / P * 0.45);
  }

  // ---------- 바위 (막힌 칸) — 이웃 바위 칸과 이어진 둥근 바위 덩어리 (예전엔 칸마다 납작한 줄처럼 보였음) ----------
  // 칸 가운데마다 바위면 1 · 아니면 0 을 부드럽게 이은 값의 0.5 언저리(잡음으로 흔듦)가 테두리 — 혼자 선 바위는 둥근 돌 하나, 이어지면 바위 무더기.
  // 안은 큰 돌덩이 무늬, 왼쪽 위 테두리는 빛 · 아래 테두리는 그늘진 앞면 · 한 점 검은 테. 테두리 밖은 그 칸의 땅
  const ROCK_PAL = { obsid: [['#4a3a56', '#3a2d46', '#5c4a6a', '#221a2a'], '#140e18'], cave: [['#4e5156', '#43464b', '#5c6066', '#2e3034'], '#1c1d20'],
                     rocky: [['#8a8571', '#787461', '#a29d86', '#5c5948'], '#3e3c30'] };
  function rockField(m, X, Y) {
    const fx = X / P - 0.5, fy = Y / P - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = sm(fx - x0), ay = sm(fy - y0);
    const v = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? 1 : m.tile[y * m.w + x] === ROCK ? 1 : m.tile[y * m.w + x] === WALL ? 0.6 : 0);
    return (v(x0, y0) * (1 - ax) + v(x0 + 1, y0) * ax) * (1 - ay) + (v(x0, y0 + 1) * (1 - ax) + v(x0 + 1, y0 + 1) * ax) * ay;
  }
  // 혼자 선 바위(이웃 네 칸에 바위가 없음) — 칸에는 땅과 발밑 그림자만, 바위는 나무처럼 따로 솟게 그림 (boulderSprite)
  const loneRock = (m, x, y) => m.tile[y * m.w + x] === ROCK && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const i = x + dx, j = y + dy; return i >= 0 && j >= 0 && i < m.w && j < m.h && m.tile[j * m.w + i] === ROCK;
  });
  const rockKind = (bio, ter) => (bio === 6 || ter === OBSID ? 'obsid' : bio === 7 ? 'cave' : ter === SNOW ? 'snow' : 'rocky');
  const BW = 22, BH = 20;
  function paintBoulder(put, kind, v) {
    const [pal, mortar] = ROCK_PAL[kind === 'snow' ? 'rocky' : kind], cx = 11, cy = 11.5, rx = 10 - v * 0.5, ry = 8 + (v % 2) * 0.6;
    const R = (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return Math.hypot(dx, dy) * (1 + (vnoise(Math.atan2(dy, dx) * 1.6 + v * 3, 0.5, 174) - 0.5) * 0.22); };
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const r = R(x, y);
      if (r > 1) continue;
      if (R(x - 1, y) > 1 || R(x + 1, y) > 1 || R(x, y - 1) > 1 || R(x, y + 1) > 1) { put(x, y, c3(kind === 'obsid' ? '#0c0810' : '#2a2620')); continue; }
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, lit = -(dx * 0.6 + dy * 0.8) + (hash(x, y, 175 + v) - 0.5) * 0.25;
      let c = c3(pal[lit > 0.45 ? 2 : lit > -0.1 ? 0 : lit > -0.5 ? 1 : 3]);
      if (dy > 0.45) c = mul(c, 0.72);                                   // 아래는 그늘진 앞면
      if (Math.abs(vnoise(x * 0.22 + v * 5, y * 0.22, 176) - 0.5) < 0.035 && r < 0.85) c = c3(mortar);   // 금
      if (kind === 'snow' && dy < -0.15 + vnoise(x * 0.3, v, 177) * 0.3) c = c3(dy < -0.5 ? '#f6fafc' : '#dfe8f0');
      else if (kind === 'rocky' && dy < -0.2 && vnoise(x * 0.3 + v, y * 0.3, 178) > 0.62) c = c3(hash(x, y, 179) < 0.5 ? '#7f9a52' : '#5f7a44');
      else if (kind === 'obsid' && hash(x, y, 180 + v) < 0.03) c = c3('#8a6aa8');
      put(x, y, c);
    }
  }
  const boulders = {};
  function boulderSprite(kind, v) {
    const key = `${kind}|${v}`;
    if (boulders[key]) return boulders[key];
    const cv = document.createElement('canvas');
    cv.width = BW; cv.height = BH;
    const g = cv.getContext('2d'), img = g.createImageData(BW, BH), d = img.data;
    paintBoulder((x, y, c) => { const i = (y * BW + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }, kind, v);
    g.putImageData(img, 0, 0);
    return (boulders[key] = cv);
  }
  function rockPix(m, e, X, Y) {
    if (e.lone) {                                                        // 혼자 선 바위 — 땅 + 발밑 그림자
      const g = texture(e.ter === OBSID || e.bio === 6 ? OBSID : e.ter, e.bio, X, Y), lx = X % P, ly = Y % P;
      return ((lx + 0.5 - 8) / 8.5) ** 2 + ((ly + 0.5 - 12.5) / 3.6) ** 2 <= 1 ? mul(g, 0.62) : g;
    }
    const th = 0.47 + (vnoise(X * 0.1, Y * 0.1, 170) - 0.5) * 0.22, f = rockField(m, X, Y) - th;
    if (f < 0) {                                                         // 테두리 밖 — 그 칸의 땅, 바위 바로 아래는 그림자
      const g = texture(e.ter === OBSID || e.bio === 6 ? OBSID : e.ter, e.bio, X, Y);
      return f > -0.16 && rockField(m, X, Y - 3) - th > f + 0.04 ? mul(g, 0.68) : g;
    }
    if (f < 0.035) return c3(e.bio === 6 ? '#0c0810' : '#2a2620');
    const [pal, mortar] = ROCK_PAL[e.bio === 6 || e.ter === OBSID ? 'obsid' : e.bio === 7 ? 'cave' : 'rocky'];
    let c = stones(X, Y, 18, 171, pal, mortar);
    if (f < 0.2) {                                                       // 테두리 — 빛 받는 쪽 · 그늘진 앞면
      const gx = rockField(m, X + 2, Y) - rockField(m, X - 2, Y), gy = rockField(m, X, Y + 2) - rockField(m, X, Y - 2), gl = Math.hypot(gx, gy) || 1;
      const nx = -gx / gl, ny = -gy / gl, lit = -(nx * 0.6 + ny * 0.8);
      if (ny > 0.45) c = mul(c, 0.55 + f * 1.2);
      else if (lit > 0.3) c = mix(c, WHITE, 0.2 * (1 - f / 0.2));
    }
    if (e.bio === 4 && fbm(X * 0.04, Y * 0.04, 172) > 0.62) c = mix(c, c3('#7f9a52'), 0.4);   // 고원 바위의 이끼
    if (e.ter === SNOW && f > 0.12 && vnoise(X * 0.08, Y * 0.08, 173) > 0.55) c = mix(c, c3('#eef4f8'), 0.75);   // 눈 덮인 윗면
    return c;
  }

  // ---------- 무너진 옛 성벽 · 옛 성문 (겉모습 RUIN — 사용자 그림대로) ----------
  // 성벽 조각은 그 칸 안에: 위 두 칸은 무너진 톱니 담이 남은 윗면, 그 아래는 다듬은 돌을 쌓은 앞면(이끼 · 금 · 빠진 돌), 위 가장자리와 양끝은 들쭉날쭉 허물어짐.
  // 옛 성문은 두 탑 사이 길 위에 아치를 걸고 위에 톱니 담 두 단 — 길로 지나가므로 나보다 위에 그림 (drawOver), 탑 밑동 양옆엔 흘러내린 돌무더기.
  function ruinPix(e, X, Y) {
    const b = e.ruin, sx = X - b.c0 * P, sy = Y - b.r0 * P, SW = (b.c1 - b.c0 + 1) * P, SH = (b.r1 - b.r0 + 1) * P, TOP = Math.min(2 * P, SH * 0.45) | 0;
    const ground = () => texture(GRASS, e.bio, X, Y);
    if (b.gate) return mul(stones(X, Y, 10, 152, CK.top, CK.mortar), 0.62);
    const cut = 2 + ((vnoise(X * 0.07, b.r0, 142) * 13) | 0);                                   // 위 가장자리 — 허물어진 만큼
    const endL = sx < 12 ? (vnoise(Y * 0.12, b.c0, 143) * 11) | 0 : 0, endR = SW - 1 - sx < 12 ? (vnoise(Y * 0.12, b.c1, 144) * 11) | 0 : 0;
    if (sy < cut || sx < endL || SW - 1 - sx < endR) return ground();
    if (sy === cut || sx === endL || SW - 1 - sx === endR || sy === SH - 1) return c3(CK.line);
    if (sy < TOP) {
      if (sy < cut + 7) {                                                                       // 남은 톱니 담
        const mi = Math.floor(sx / 14), ma = ((sx % 14) + 14) % 14;
        if (hash(mi, b.r0, 145) > 0.25 && ma < 9) return ma === 0 || ma === 8 ? c3(CK.line) : sy < cut + 3 ? mix(c3(CK.top[2]), WHITE, 0.1) : c3(CK.top[0]);
      }
      let c = c3(CK.top[hash(sx >> 3, sy >> 3, 146) < 0.3 ? 1 : 0]);                          // 윗면 — 판석 · 이끼 · 부스러기
      if (fbm(X * 0.04, Y * 0.04, 147) > 0.6) c = mix(c, c3('#5f7a44'), 0.45);
      if (sy >= TOP - 2) c = mul(c, 0.7);
      return hash(X, Y, 148) < 0.06 ? mul(c, 0.85) : c;
    }
    const fy = sy - TOP, FH = SH - TOP;
    if (fy < 2) return mix(c3(CK.top[0]), WHITE, 0.08);
    const v = ivy(X, fy, 2);
    if (v) return v;
    let c = mul(ashlar(sx, fy, 9, 18, 149, X, Y), 0.95 - fy / FH * 0.3);
    if (hash(Math.floor((sx + (Math.floor(fy / 9) % 2 ? 9 : 0)) / 18), Math.floor(fy / 9), 150) < 0.06) c = mul(c, 0.62);   // 깨져 움푹한 돌
    return c;
  }
  // 옛 성문 그림 — 폭 W · 높이 H 점, 두 탑은 가장자리에서 한 칸 안쪽 (M) 에 두 칸 폭. 투명한 곳은 null, 반투명은 [r, g, b, a]
  function gatePix(G, px, py, X, Y) {
    const { W, H, M } = G, tl0 = M - 4, tl1 = M + 2 * P + 4, tr0 = W - M - 2 * P - 4, tr1 = W - M + 4;
    const g0 = M + 2 * P, g1 = W - M - 2 * P, hw = (g1 - g0) / 2, acx = (g0 + g1) / 2, acy = H - 74;
    // 흘러내린 돌무더기 — 탑 밑동 바깥쪽
    const skirt = px < tl0 + 6 ? px / (tl0 + 6) : px >= tr1 - 6 ? (W - px) / (W - tr1 + 6) : -1;
    if (skirt >= 0 && (px < tl0 + 2 || px >= tr1 - 2 || py > H - 6)) {
      const hgt = 8 + skirt * 30 + (vnoise(px * 0.3, 1, 151) - 0.5) * 8;
      if (H - py < hgt) { const c = stones(X, Y, 6, 152, CK.top, CK.mortar); return H - py > hgt - 2 ? c3(CK.line) : mul(c, 0.8 + (H - py) / 60); }
      if (px < tl0 || px >= tr1) return null;
    }
    // 탑 — 허물어진 바깥 가장자리 · 톱니 꼭대기 · 가운데 활 쏘는 틈 · 밑동에 이끼
    for (const [a0, a1, outerLeft] of [[tl0, tl1, true], [tr0, tr1, false]]) {
      if (px < a0 || px >= a1 || py < 36) continue;
      const crum = (vnoise(py * 0.12, outerLeft ? 3 : 4, 141) * 7) | 0, lx = px - a0, ow = a1 - a0;
      if (outerLeft ? lx < crum : ow - 1 - lx < crum) return null;
      if (outerLeft ? lx === crum : ow - 1 - lx === crum) return c3(CK.line);
      if (py < 44) { const ma = lx % 10; return ma < 6 && hash((lx / 10) | 0, outerLeft ? 1 : 2, 153) > 0.2 ? (py === 36 || ma === 0 || ma === 5 ? c3(CK.line) : c3(CK.top[2])) : null; }
      if (py < 52) return py === 51 ? c3(CK.line) : c3(CK.top[0]);
      if (lx === 0 || lx === ow - 1) return c3(CK.line);
      const f = lx / ow;
      let c = mul(ashlar(lx, py - 52, 8, 14, 154, X, Y), 1.1 - f * 0.35 - (py - 52) / (H - 52) * 0.2);
      if (Math.abs(lx - ow / 2) < 1.5 && py > 92 && py < 112) c = c3(CK.win);
      if (py > H - 18 && hash(X, Y, 155) < 0.3) c = c3(CK.ivy[(hash(X, Y, 156) * 3) | 0]);
      return c;
    }
    const pa0 = tl0 + 2, pa1 = tr1 - 2;
    if (px < pa0 || px >= pa1) return null;
    // 위 두 단 — 가장자리는 허물어짐
    const edgeCut = (vnoise(py * 0.15, 5, 157) * 9) | 0;
    if (py < 68 && (px < pa0 + edgeCut || px >= pa1 - edgeCut)) return null;
    const merlon = (y0) => { const mi = Math.floor((px - pa0) / 14), ma = (px - pa0) % 14; return hash(mi, y0, 158) > 0.18 && ma < 9 ? ma : -1; };
    if (py < 20) {                                                                              // 뒤 담 (멀리 · 그늘)
      if (py < 7) { const ma = merlon(0); if (ma < 0) return null; return py === 0 || ma === 0 || ma === 8 ? c3(CK.line) : mul(c3(CK.top[0]), 0.85); }
      return py === 19 ? c3(CK.line) : mul(ashlar(px, py, 6, 12, 159, X, Y), 0.72);
    }
    if (py < 46) {                                                                              // 위 걷는 길 — 판석 · 이끼 · 부스러기
      let c = c3(CK.top[hash(px >> 3, py >> 3, 160) < 0.3 ? 1 : 0]);
      if (py < 24) c = mul(c, 0.7);
      if (fbm(X * 0.05, Y * 0.05, 161) > 0.6) c = mix(c, c3('#5f7a44'), 0.4);
      return hash(X, Y, 162) < 0.05 ? mul(c, 0.82) : c;
    }
    if (py < 68) {                                                                              // 앞 담
      if (py < 53) { const ma = merlon(1); if (ma < 0) return py < 50 ? null : c3(CK.top[1]); return py === 46 || ma === 0 || ma === 8 ? c3(CK.line) : py < 49 ? mix(c3(CK.top[2]), WHITE, 0.1) : c3(CK.top[0]); }
      if (py === 67) return c3(CK.line);
      const v = ivy(px, py - 53, 0);
      return v || mul(ashlar(px, py - 53, 7, 12, 163, X, Y), py < 55 ? 1.05 : 0.95);
    }
    // 앞면 — 아치 (열린 곳은 투명, 꼭대기 안쪽은 어두운 그늘) · 쐐기돌 테 · 다듬은 돌
    const dx = px + 0.5 - acx, r2 = Math.hypot(dx, py + 0.5 - acy);
    const inside = py >= acy ? Math.abs(dx) < hw : r2 < hw;
    if (inside) return null;                                                                   // 열린 곳 (안쪽 그늘 띠는 뺌 — 사용자 지적)
    const ring = py >= acy ? Math.abs(dx) < hw + 7 : r2 < hw + 7;
    if (ring) {
      const a = Math.atan2(py + 0.5 - acy, dx), k = (a + Math.PI) / (Math.PI / 11);
      if ((py >= acy ? Math.abs(dx) >= hw + 6 : r2 >= hw + 6) || (py < acy && Math.abs(k % 1) < 0.1) || (py >= acy && (py - acy) % 9 === 0)) return c3(CK.line);
      return pick4(CK.top, 0.45 + hash(Math.floor(k), py >= acy ? (py - acy) >> 3 : 0, 164) * 0.5);
    }
    if (py === H - 1) return c3(CK.line);
    let c = mul(ashlar(px, py - 68, 10, 20, 165, X, Y), 1 - (py - 68) / (H - 68) * 0.28);
    if (Math.abs(vnoise(px * 0.05, py * 0.05, 166) - 0.5) < 0.012) c = mul(c, 0.6);           // 금
    return c;
  }
  // 옛 성문 그림 한 장 (지도마다 한 번)
  function gateSprite(A, m) {
    if (A.gateSpr !== undefined) return A.gateSpr;
    const g = m.props && m.props.gate ? String(m.props.gate).split(',').map(Number) : null;
    if (!g || typeof document === 'undefined') return (A.gateSpr = null);
    const [gx, gy, gw, gh] = g, rows = gh + 9, G = { W: (gw + 2) * P, H: rows * P, M: P };
    const cv = document.createElement('canvas');
    cv.width = G.W; cv.height = G.H;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(G.W, G.H), d = img.data, X0 = (gx - 1) * P, Y0 = (gy + gh - rows) * P;
    for (let py = 0; py < G.H; py++) for (let px = 0; px < G.W; px++) {
      const c = gatePix(G, px, py, X0 + px, Y0 + py);
      if (!c) continue;
      const i = (py * G.W + px) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c.length > 3 ? c[3] * 255 : 255;
    }
    // 둘레 테두리 — 비어 있는 곳과 맞닿은 가장자리는 모두 한 점 검은 선 (뒤 담 양끝 · 허물어진 자리도 빠짐없이 — 사용자 지적). 맨 아래(땅에 닿는 곳)는 빼고
    const ink = c3(CK.line), solid = (x, y) => x >= 0 && y >= 0 && x < G.W && (y >= G.H || d[(y * G.W + x) * 4 + 3] > 0);
    const edge = [];
    for (let py = 0; py < G.H; py++) for (let px = 0; px < G.W; px++)
      if (solid(px, py) && (!solid(px - 1, py) || !solid(px + 1, py) || !solid(px, py - 1) || !solid(px, py + 1))) edge.push((py * G.W + px) * 4);
    for (const i of edge) { d[i] = ink[0]; d[i + 1] = ink[1]; d[i + 2] = ink[2]; d[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    return (A.gateSpr = { cv, x: gx - 1, y: gy + gh - rows, w: gw + 2, h: rows, base: gy });
  }
  // 나보다 위에 그리는 것 — 옛 성문 (아치 밑으로 지나감). 내가 성문 뒤(북쪽)에 서면 반쯤 비쳐 보이게
  function drawOver(ctx, m, ox, oy, T, x0, y0, x1, y1, me) {
    if (!m.look) return;
    const s = gateSprite(prep(m), m);
    if (!s || s.x > x1 || s.y > y1 || s.x + s.w < x0 || s.y + s.h < y0) return;
    const behind = me && me.x + 0.5 > s.x && me.x + 0.5 < s.x + s.w && me.y + 0.5 > s.y && me.y + 0.5 < s.base;
    ctx.imageSmoothingEnabled = false;
    if (behind) ctx.globalAlpha = 0.45;
    ctx.drawImage(s.cv, Math.round(ox + s.x * T), Math.round(oy + s.y * T), s.w * T, s.h * T);
    ctx.globalAlpha = 1;
  }

  // ---------- 땅 위 소품 — 걷는 데 안 막히는 작은 도트 그림 (사용자 요청 — 지도를 풍성하게, 1단계) ----------
  // 칸 하나 안에 들어가는 그림 (글자 하나 = 점 하나, '.' 은 비움). 땅 그림에 같이 칠해 두므로(덩어리) 그리는 부담은 그대로.
  // 소문자 a~d 는 그 격의 풀빛(짙음 → 밝음), z 는 밑의 땅을 어둡게(그림자), p · q · y 는 꽃잎 · 꽃잎 그늘 · 꽃술(꽃마다 다른 빛)
  const PROP_INK = {
    k: '#241c16', s: '#b4aea0', t: '#8e897e', u: '#615d55',
    w: '#7a5530', x: '#5a3a20', v: '#a07a48',
    r: '#c8402e', R: '#8a2a20', o: '#f4ecd8', m: '#e8dcc0', n: '#b8a888', h: '#8a5a34', H: '#5e3a1e',
    l: '#c8782a', L: '#9a4e1e', e: '#d8a040',
    B: '#e8e0cc', C: '#b8ae98', D: '#7a7262',
    i: '#c07cff', j: '#7a3ab0', J: '#f0d8ff',
    f: '#ffb040', F: '#e0501e', g: '#ffe8a0',
    S: '#f6fafc', T: '#d4dee8', U: '#a8b8c8',
    W: '#4a6a78', X: '#6a8a98', Y: '#a8c8d0',
    M: '#56703e', N: '#3e5a2c',
    E: '#9a8e68', Q: '#6e6448', O: '#b4a880'
  };
  const PROP_ART = {
    tuft: ['..d.d..', '.dc.c.d', '.cb.bc.', 'cbaabac', '.aaaaa.'],
    flowers: ['.p.....q.', 'pyp...qyq', '.p..p..q.', '.a.pyp.a.', '.a..p..a.', 'aa..a..aa', '..aaaa...'],
    pebbles: ['.st.....', 'sttu.st.', '.uuzsttu', '.zz..uuz'],
    redcap: ['..kkkk..', '.krorrk.', 'krrrrork', 'kRRrrRRk', '.kkmmkk.', '...mn...', '...mn...', '..zzzz..'],
    browncap: ['.kkk.....', 'khhHk.kk.', 'kHHHkkhhk', '.kmk.kHHk', '..m...km.', '..mn...mn', '.zzz..zzz'],
    fern: ['....c....', '.c..b..c.', '..cbabc..', '.cb.a.bc.', 'cb..a..bc', '....a....', '...aaa...'],
    stump: ['..kkkkkk..', '.kvvvvvvk.', 'kvwwwwwwvk', 'kvwvvvvwvk', 'kvwwwwwwvk', 'kxkvvvvkxk', 'kxxxxxxxxk', 'kxwxxxwxxk', '.kkkkkkkk.', '.zzzzzzzz.'],
    leaves: ['.l...e..', 'lLl.eLe.', '.l.l.e.l', '..lLl.lL', '...l...l'],
    bush: ['...kkkkk....', '..kcddcck...', '.kcdbccbckk.', 'kcbbcbbcbdck', 'kbbabbcbbcbk', 'kabaabbabbak', '.kaaabaaaak.', '..kkkkkkkk..', '..zzzzzzzz..'],
    rubble: ['..kkkk.....', '.ksssk.....', 'kssttuk.kk.', 'ktttuuk.kstk', 'kuuuuk.ktuuk', '.kkkk..kkkk.', '.zzz...zzzz.'],
    grave: ['..kkkk..', '.kssstk.', 'kssusstk', 'ksuuustk', 'kssusttk', 'kstuttuk', 'ksttttuk', 'kMttMtuk', 'kkkkkkkk', 'zzzzzzzz'],
    skull: ['.kkkkk.', 'kBBBBCk', 'kBkBkCk', 'kBBBBCk', '.kBkBk.', '..kkk..', '.zzzzz.'],
    bones: ['kk.....kk', 'kBkkkkkBk', 'kBBBBBBCk', '.kk...kk.', '.zz...zz.'],
    dry: ['..O.O..', '.OE.E.O', '.EQ.QE.', 'EQ..QQE', '.QQQQQ.'],
    crystal: ['..k.....', '.kJk..k.', '.kik.kJk', '.kijkkik', 'kJijkkij', 'kiijkiij', 'kijjkijk', '.kkkkkk.', '.zzzzzz.'],
    ember: ['.F......', '.fF..F..', '..gfFfF.', '.....Fgf'],
    snowlump: ['..kkkk...', '.kSSSTk..', 'kSSSTTUkk', 'kSTTTUUUk', '.zzzzzzz.'],
    mossy: ['..kkkk...', '.kMMNsk..', 'ksMstttk.', 'kstttuukk', 'kttuuuuuk', '.zzzzzzz.'],
    puddle: ['..WWWWW...', '.WXXYXXWW.', 'WXXXXXYXXW', '.WWXXXXWW.', '...WWWW...'],
    debris: ['.kkkk.....', 'kstttk.kk.', 'kttuuk.ksk', '.kkkk..kuk', '..zz....z.'],
    tallgrass: ['..d....d..d.', '.dc.d..cd.c.', '.cb.cd.bc.bd', 'cbb.bcdbb.bc', 'bab.babab.ab', 'bab.abbab.ab', 'aaabaaaaabaa', '.aaaaaaaaaa.', '..zzzzzzzz..'],
    flowerbed: ['..p....q.....', '.pyp..qyq..p.', '..pa...qa.pyp', '.cac.p.ac..pa', 'cbab.pyp.bcab', 'babcbapacbaba', 'aabaaaaabaaab', '.aaaaaaaaaaa.', '..zzzzzzzzz..'],
    rockpile: ['....kkk......', '...kssuk.kk..', '..ksstuukstk.', '.kkttuukkttuk', 'kstkuukssuukk', 'ktuuk.ktuuuuk', '.kkk...kkkkk.', '.zzz...zzzzz.'],
    bigbush: ['.....kkkkk.....', '...kkcddcckk...', '..kcddbdccdck..', '.kcdbccbcdbbck.', '.kcbbcbbccbcbk.', 'kcbbabbcbbcbbck', 'kbbabbabbabbabk', 'kbaabbaabaabbak', 'kaaabaaaabaaaak', '.kaaaaaaaaaaak.', '..kkkkkkkkkkk..', '..zzzzzzzzzzz..']
  };
  // 땅마다 소품 — [격, 땅의 종류(없으면 아무 땅)] → { 얼마나 자주(칸마다), 무엇을 얼마큼 }. 위에서부터 맞는 첫 줄
  const PROP_TABLE = [
    [[0, 7], GRASS, 0.42, { tuft: 2, tallgrass: 4, flowers: 2, flowerbed: 3, pebbles: 1, bush: 1.5, bigbush: 1.5 }],
    [[1, 7], null, 0.16, { puddle: 2, debris: 2, tuft: 2, pebbles: 1.5, rockpile: 1.2, bones: 0.5 }],
    [[2], GRASS, 0.45, { tuft: 2, tallgrass: 4, fern: 3.5, redcap: 1.2, browncap: 1.5, stump: 1, leaves: 1.5, bush: 1.5, bigbush: 1.8 }],
    [[3], GRASS, 0.38, { tuft: 2, tallgrass: 3.5, flowers: 2, flowerbed: 3, rubble: 1.2, rockpile: 0.8, bush: 1.5, bigbush: 1.5, pebbles: 0.8 }],
    [[3], COBBLE, 0.14, { debris: 2, tuft: 1.5, rubble: 1.2, rockpile: 0.8 }],
    [[3, 8], TILES, 0.06, { rubble: 1, debris: 1, tuft: 0.6 }],
    [[9], null, 0.38, { tuft: 2, tallgrass: 3, browncap: 2, fern: 2.5, leaves: 1.5, bigbush: 1.5 }],
    [[4], SNOW, 0.15, { snowlump: 3, pebbles: 1, rockpile: 1 }],
    [[4], ROCKY, 0.2, { pebbles: 2, mossy: 1.5, rockpile: 2, dry: 1 }],
    [[4], null, 0.32, { tuft: 2, tallgrass: 3, mossy: 2, pebbles: 1.5, flowers: 1, rockpile: 1.2, bush: 0.8 }],
    [[5], PAVE, 0.1, { leaves: 2, skull: 0.5, bones: 1 }],
    [[5], null, 0.3, { dry: 4, grave: 2.5, bones: 1, skull: 0.8, pebbles: 1, rockpile: 1 }],
    [[6], null, 0.2, { ember: 2, crystal: 2, pebbles: 1.5, rockpile: 1.2, skull: 0.6, bones: 0.8 }]
  ];
  const PETALS = { 0: ['#f4d35e', '#ee8fb0', '#ffffff', '#9fc5ff'], 3: ['#f4d35e', '#ee8fb0', '#ffffff', '#c8a0ff'], 4: ['#cfe0ff', '#ffffff', '#ffe8f0'], 7: ['#f4d35e', '#ffffff'] };
  const PROP_W = {}, PROP_H = {};
  for (const [k, rows] of Object.entries(PROP_ART)) { PROP_H[k] = rows.length; PROP_W[k] = Math.max(...rows.map(r => r.length)); }
  // 이 칸의 소품 (없으면 null) — 자리 · 뒤집기 · 꽃빛은 칸 자리로 정해져 늘 같음. 무리 지어 (낮은 잡음으로 짙고 옅게)
  function propOf(e, tx, ty) {
    const row = PROP_TABLE.find(([bios, ter]) => bios.includes(e.bio) && (ter === null || ter === e.ter));
    if (!row) return null;
    const [, , dens, mixw] = row, cl = 0.35 + 1.3 * vnoise(tx * 0.18, ty * 0.18, 125);
    if (hash(tx, ty, 121) > dens * cl) return null;
    const names = Object.keys(mixw), total = names.reduce((s, k) => s + mixw[k], 0);
    let pick = hash(tx, ty, 122) * total, name = names[0];
    for (const k of names) { pick -= mixw[k]; if (pick < 0) { name = k; break; } }
    const pw = PROP_W[name], ph = PROP_H[name], petals = PETALS[e.bio] || PETALS[0];
    const petal = c3(petals[(hash(tx, ty, 126) * petals.length) | 0]);
    return { name, ox: (hash(tx, ty, 123) * (P - pw + 1)) | 0, oy: (hash(tx, ty, 124) * (P - ph + 1)) | 0, flip: hash(tx, ty, 127) < 0.5,
             petal, petalShade: mul(petal, 0.75), grass: C.grass[e.bio] || C.grass[0] };
  }
  // 무너진 성벽 · 옛 성문 둘레 — 가까울수록 자주 깨진 돌 · 돌무더기 (가로로 다섯 칸, 아래로 두 칸까지)
  function rubbleOf(m, e, tx, ty) {
    let d = 99;
    for (let dy = -4; dy <= 2; dy++) for (let dx = -5; dx <= 5; dx++) {
      const x = tx + dx, y = ty + dy;
      if (x >= 0 && y >= 0 && x < m.w && y < m.h && (m.look[y * m.w + x] & 15) === RUIN) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
    }
    if (d > 5 || hash(tx, ty, 128) > 0.8 - d * 0.14) return null;
    const name = ['rockpile', 'rubble', 'debris', 'pebbles'][(hash(tx, ty, 129) * 4) | 0];
    return { name, ox: (hash(tx, ty, 123) * (P - PROP_W[name] + 1)) | 0, oy: (hash(tx, ty, 124) * (P - PROP_H[name] + 1)) | 0, flip: hash(tx, ty, 127) < 0.5,
             petal: WHITE, petalShade: WHITE, grass: C.grass[e.bio] || C.grass[0] };
  }
  function propPixel(pr, lx, ly, under) {
    const sx = lx - pr.ox, sy = ly - pr.oy, rows = PROP_ART[pr.name];
    if (sy < 0 || sy >= rows.length || sx < 0 || sx >= PROP_W[pr.name]) return under;
    const ch = rows[sy][pr.flip ? PROP_W[pr.name] - 1 - sx : sx];
    if (!ch || ch === '.') return under;
    if (ch === 'z') return mul(under, 0.72);
    if (ch === 'p') return pr.petal;
    if (ch === 'q') return pr.petalShade;
    if (ch === 'y') return c3('#f8e070');
    if (ch >= 'a' && ch <= 'd') return c3(pr.grass[{ a: 3, b: 1, c: 0, d: 2 }[ch]]);
    return c3(PROP_INK[ch] || '#ff00ff');
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
    // 건물 — 겉모습이 BUILD 인 칸 덩어리마다 한 채 (감싸는 네모 · 그 안의 문). 그림은 그 칸을 칠할 때 (buildingPixel)
    const bAt = new Int16Array(m.w * m.h).fill(-1), buildings = [];
    // 도시는 붙어 선 건물이 많아 덩어리가 아니라 지도 속성 blds 의 네모로 한 채씩 (tools/map-gen.js 의 CITY_BUILDINGS — 생김새 kind · 옥상 roof)
    if (m.props && m.props.blds) for (const b of JSON.parse(m.props.blds)) {
      const n = buildings.length;
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) bAt[y * m.w + x] = n;
      const door = (m.ports || []).find(p => p.door && p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h);
      buildings.push({ x0: b.x, y0: b.y, w: b.w, h: b.h, door, kind: b.kind, roof: b.roof, G: null });
    }
    for (let k = 0; k < m.w * m.h; k++) {
      if ((m.look[k] & 15) !== BUILD || bAt[k] >= 0) continue;
      const n = buildings.length, st = [k];
      let x0 = m.w, y0 = m.h, x1 = 0, y1 = 0;
      bAt[k] = n;
      while (st.length) {
        const j = st.pop(), x = j % m.w, y = (j / m.w) | 0;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, i = ny * m.w + nx;
          if (nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && bAt[i] < 0 && (m.look[i] & 15) === BUILD) { bAt[i] = n; st.push(i); }
        }
      }
      const door = (m.ports || []).find(p => p.door && p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1);
      buildings.push({ x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1, door, G: null });
    }
    // 소품을 안 놓는 칸 — 문 · 정예 자리 · 보물상자 · 시작점 · 상인 자리 (그 둘레 한 칸까지)
    const noProp = new Uint8Array(m.w * m.h), mark = (x0, y0, w, h) => {
      for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) if (x >= 0 && y >= 0 && x < m.w && y < m.h) noProp[y * m.w + x] = 1;
    };
    for (const q of [...(m.ports || []), ...(m.posts || [])]) mark(q.x, q.y, q.w || 1, q.h || 1);
    for (const q of [...(m.chests || []), ...(m.npcs || [])]) mark(q.x, q.y, 1, 1);
    // 물가 모양 (poolField) 의 칸 값 — 물 · 용암 1, 땅 0, 벽 · 다리 · 지도 밖은 0.5 (어느 쪽으로도 안 끌어당김)
    const pv = new Float32Array(m.w * m.h);
    for (let k = 0; k < m.w * m.h; k++) { const t = m.tile[k]; pv[k] = t === POOL ? 1 : t === WALL || t < 0 || isBridge(m, k) ? 0.5 : 0; }
    // 그 값을 둘레 칸과 고루 섞은 것 (1 2 1 무게) — 비스듬한 계단 물가가 곧게 펴지도록
    const pb = new Float32Array(m.w * m.h), pvAt = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? 0.5 : pv[y * m.w + x]);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      let a = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += pvAt(x + dx, y + dy) * (dx ? 1 : 2) * (dy ? 1 : 2);
      pb[y * m.w + x] = a / 16;
    }
    // 칸마다 얼마나 깎아도 되는지 — 같은 것(물끼리 · 땅끼리)으로 2×2 를 이루는 칸은 넉넉히, 한 칸 폭 물길 · 한 칸 땅은 조금만 (칸대로 막히는 것과 그림이 어긋나지 않게)
    // 물 칸은 아래로 물이 몇 칸 이어지는지도 (얕은 물은 옆면을 낮게)
    const ps = new Float32Array(m.w * m.h), run = new Uint8Array(m.w * m.h);
    const same = (x, y, v) => { const u = pvAt(x, y); return u === v || u === 0.5; };
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const k = y * m.w + x, v = pv[k];
      let thick = v === 0.5;
      for (const [ox, oy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) if (!thick && same(x + ox, y + oy, v) && same(x + ox + 1, y + oy, v) && same(x + ox, y + oy + 1, v) && same(x + ox + 1, y + oy + 1, v)) thick = true;
      ps[k] = thick ? POOL_SLACK : 0.12;
    }
    for (let y = m.h - 1; y >= 0; y--) for (let x = 0; x < m.w; x++) { const k = y * m.w + x; if (pv[k] === 1) run[k] = Math.min(9, 1 + (y + 1 < m.h ? run[k + m.w] : 0)); }
    const A = { dist, chunks: new Map(), bAt, buildings, noProp, pv, pb, ps, run };
    if (m.props && m.props.city) cityPrep(m, A);
    prepared.set(m.look, A);
    return A;
  }

  const land = t => t === FLOOR || t === ROAD || t === TREE || t === ROCK;
  // 겉모습 「땅이 아님」(어둠 · 물 · 용암)인데 바닥이 땅이면 풀로
  const terOf = raw => (raw === VOID || raw === WATER || raw === LAVA || raw === BUILD || raw === RUIN ? GRASS : raw === DOORWAY || raw === CARPET ? TILES : raw);

  // 칸 하나를 칠하기 전에 한 번 — 그 칸의 종류와 이웃 (점마다 다시 안 살피게)
  function cellOf(m, A, tx, ty) {
    const k = ty * m.w + tx, t = m.tile[k], raw = m.look[k] & 15;
    const e = { t, raw, ter: terOf(raw), bio: m.look[k] >> 4 };
    if (raw === BUILD) { e.b = A.bAt[k]; return e; }
    if (raw === RUIN) {                                                  // 무너진 성벽 조각 — 그 조각(이어진 RUIN 칸)의 칸 범위
      const isR = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && (m.look[y * m.w + x] & 15) === RUIN;
      let c0 = tx, c1 = tx, r0 = ty, r1 = ty;
      while (isR(c0 - 1, ty)) c0--; while (isR(c1 + 1, ty)) c1++;
      while (isR(tx, r0 - 1)) r0--; while (isR(tx, r1 + 1)) r1++;
      e.ruin = { c0, c1, r0, r1 };
      const g = m.props && m.props.gate ? String(m.props.gate).split(',').map(Number) : null;   // 옛 성문의 탑 — 위에 성문 그림이 덮이니 바닥은 돌 밑동만
      e.ruin.gate = !!g && tx >= g[0] && tx < g[0] + g[2] && ty >= g[1] && ty < g[1] + g[3];
      return e;
    }
    const at = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? WALL : m.tile[y * m.w + x]);
    const lookAt = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? 0 : m.look[y * m.w + x]);
    const pillar = (x, y) => at(x, y) === ROCK && (lookAt(x, y) >> 4) === 8;   // 성 안 돌기둥
    if (raw === DOORWAY) { e.dL = (lookAt(tx - 1, ty) & 15) === DOORWAY; e.dR = (lookAt(tx + 1, ty) & 15) === DOORWAY; return e; }
    if (raw === CARPET) { e.cL = (lookAt(tx - 1, ty) & 15) === CARPET; e.cR = (lookAt(tx + 1, ty) & 15) === CARPET; }
    if (m.props && m.props.interior && t === FLOOR && raw === TILES && e.bio === 6) {   // 성 안 보스 발밑의 단 — 가장자리 금테
      const not = (x, y) => lookAt(x, y) !== m.look[k] || at(x, y) !== FLOOR;
      e.dais = { l: not(tx - 1, ty), r: not(tx + 1, ty), u: not(tx, ty - 1), d: not(tx, ty + 1) };
    }
    if ((t === WALL || t < 0) && m.props && m.props.interior) {
      // 건물 안 — 바로 아래 세 칸 안에 바닥이 있으면 위 벽의 벽면(e.up = 바닥에서 몇 칸 위), 곁에 바닥이 있으면 벽 윗면의 가장자리
      const open = (x, y) => { const u = at(x, y); return u !== WALL && u >= 0; };
      for (let d = 1; d <= 3; d++) { if (!open(tx, ty + d)) continue; let wall = true; for (let j = 1; j < d; j++) if (open(tx, ty + j)) wall = false; if (wall) { e.up = d; break; } }
      if (!e.up && [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].some(([dx, dy]) => open(tx + dx, ty + dy)))
        e.rim = { l: open(tx - 1, ty), r: open(tx + 1, ty), u: open(tx, ty - 1), d: open(tx, ty + 1) };
      return e;
    }
    if (pillar(tx, ty)) {                                                // 기둥 덩어리의 칸 범위
      let x0 = tx, x1 = tx, y0 = ty, y1 = ty;
      while (pillar(x0 - 1, ty)) x0--; while (pillar(x1 + 1, ty)) x1++;
      while (pillar(tx, y0 - 1)) y0--; while (pillar(tx, y1 + 1)) y1++;
      e.pb = { x0, x1: x1 + 1, y0, y1: y1 + 1 };
      return e;
    }
    // 건물 · 기둥 바로 아래 칸은 위쪽이 그늘
    if (t !== WALL && t !== POOL && ((lookAt(tx, ty - 1) & 15) === BUILD || pillar(tx, ty - 1))) e.shadeTop = (lookAt(tx, ty - 1) & 15) === BUILD ? 9 : 6;
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
    } else if (t === ROCK) { e.belowRock = at(tx, ty + 1) === ROCK; e.lone = loneRock(m, tx, ty); }
    if (t === FLOOR || t === TREE) {                                     // 곁에 길이 있으면 길이 이 칸으로 둥글게 번져 들어옴
      e.nearRoad = false;
      for (let dy = -1; dy <= 1 && !e.nearRoad; dy++) for (let dx = -1; dx <= 1; dx++) if (at(tx + dx, ty + dy) === ROAD) { e.nearRoad = true; break; }
    }
    // 물가 — 곁(여덟 칸)에 땅이 있는 물 · 용암 칸, 곁에 물 · 용암이 있는 땅 칸 (그 칸의 점마다 poolField 로 물인지 땅인지)
    const onMap = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h;
    if (t === POOL) {
      e.bridgeAbove = onMap(tx, ty - 1) && isBridge(m, k - m.w);
      for (const [dx, dy] of SHORE8) {
        const x = tx + dx, y = ty + dy;
        if (!onMap(x, y) || !land(m.tile[y * m.w + x]) || isBridge(m, y * m.w + x)) continue;
        const lk = m.look[y * m.w + x];
        e.shore = true; e.gTer = terOf(lk & 15); e.gBio = lk >> 4; e.hot = raw === LAVA;   // 물 칸 안으로 둥글게 나온 땅은 이 이웃 땅의 무늬
        break;
      }
    } else if (land(t) && !e.bridge) {
      for (const [dx, dy] of SHORE8) {
        const x = tx + dx, y = ty + dy;
        if (!onMap(x, y) || m.tile[y * m.w + x] !== POOL) continue;
        e.shore = true; e.hot = (m.look[y * m.w + x] & 15) === LAVA;
        break;
      }
    }
    if (t === FLOOR && !e.dais && raw !== CARPET && !A.noProp[k] && !e.shore) e.prop = rubbleOf(m, e, tx, ty) || propOf(e, tx, ty);   // 길 곁 칸이면 길 위 점은 뺌 (paint)
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

  // ---------- 물가 · 용암가 — 물이 땅보다 한 단 낮게 (사용자 요청 — 모든 격) ----------
  // 물 · 용암 모양도 길처럼 칸 가운데 값(A.pv)을 부드럽게 이어 잡음으로 흔든 0.5 언저리를 물가로 — 칸 계단이 아니라 둥글게 이어진 물가.
  // 위(북쪽) 땅 가장자리 밑엔 그 땅의 옆면(벼랑)이 몇 점 보이고 그 밑이 물 · 용암 — 내려다보는 쪽에서 물이 한 단 낮아 보이게.
  // 옆 · 아래(남쪽) 물가는 옆면이 안 보이는 쪽이라 땅 가장자리 한 점 테두리만. 막히는지는 그대로 칸대로 (그림만 둥글게)
  const SHORE8 = [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];   // 위 땅을 먼저 (옆면 무늬)
  const isBridge = (m, k) => m.tile[k] === ROAD && ((m.look[k] & 15) === WATER || (m.look[k] & 15) === CANAL || (m.look[k] & 15) === LAVA);
  // 고루 섞은 값(A.pb)으로 모양을 잡되, 칸대로의 값(A.pv)에서 POOL_SLACK 넘게는 안 벗어나게 — 한 칸 폭 물길 · 한 칸 땅도 가운데는 남음
  const POOL_SLACK = 0.34;
  function poolField(A, m, X, Y) {                                     // 0 이상이면 물 · 용암 (가장자리에서 얼마나 안쪽인지)
    const fx = X / P - 0.5, fy = Y / P - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = sm(fx - x0), ay = sm(fy - y0), W = m.w;
    const i00 = y0 * W + x0, inX0 = x0 >= 0, inX1 = x0 + 1 < W, inY0 = y0 >= 0, inY1 = y0 + 1 < m.h;
    const bil = arr => {
      const v00 = inX0 && inY0 ? arr[i00] : 0.5, v10 = inX1 && inY0 ? arr[i00 + 1] : 0.5;
      const v01 = inX0 && inY1 ? arr[i00 + W] : 0.5, v11 = inX1 && inY1 ? arr[i00 + W + 1] : 0.5;
      return (v00 * (1 - ax) + v10 * ax) * (1 - ay) + (v01 * (1 - ax) + v11 * ax) * ay - 0.5;
    };
    const s = bil(A.pv), b = bil(A.pb), k = bil(A.ps) + 0.5;
    return Math.min(Math.max(b, s - k), s + k) - (vnoise(X * 0.05, Y * 0.05, 83) - 0.5) * 0.2;
  }
  // 물가 모양 안쪽의 점 — 바로 위 몇 점 안에 땅 가장자리가 있으면 그 땅의 옆면, 그 밑동 바로 아래는 물거품 한 줄 · 그늘 (용암은 달아오른 줄)
  function poolPixel(m, A, e, X, Y, s, ly) {
    // 옆면 높이 8~10 점 (물가를 따라 조금씩 다르게) — 아래로 한 칸뿐인 얕은 물은 4 점, 두 칸이면 6 점
    const tx = Math.floor(X / P), ty = Math.floor(Y / P), here = ty * m.w + tx;
    const r = A.run[here] || (ty + 1 < m.h ? A.run[here + m.w] : 0) || 1;
    const FH = r === 1 ? 4 : r === 2 ? 6 : 8 + Math.round(vnoise(X * 0.09, 0.5, 85) * 2);
    for (let k = 1; k <= FH + 3; k++) {
      const y = Y - k;
      if (y < 0) break;
      const ck = Math.floor(y / P) * m.w + tx, ct = m.tile[ck];
      if (ct === WALL || ct < 0 || isBridge(m, ck)) break;              // 벽 · 다리 밑엔 옆면 없음
      if (poolField(A, m, X, y) >= 0) continue;
      const fy = k - 1;                                                  // 땅 가장자리에서 몇 점 아래
      if (fy < FH) {
        const lk = m.look[ck], own = ct !== POOL;                       // 옆면 무늬는 그 위 땅 (물 칸 안으로 나온 땅이면 이 칸 곁의 땅)
        return shoreFace(own ? lk >> 4 : e.gBio !== undefined ? e.gBio : e.bio, own ? terOf(lk & 15) : e.gTer !== undefined ? e.gTer : e.ter, X, Y, fy, FH, e.hot);
      }
      const w = fy - FH, base = e.hot ? lava(X, Y) : water(m, A, X, Y, s);
      if (e.hot) return w === 0 ? mix(C.lavaHot, [255, 244, 190], 0.35) : mix(base, C.lavaHot, w === 1 ? 0.45 : 0.2);
      return w === 0 && hash(X, Y, 86) < 0.65 ? mix(base, C.foam, 0.5) : mul(base, w === 1 ? 0.76 : 0.88);
    }
    const c = e.hot ? lavaPix(X, Y, s) : water(m, A, X, Y, s);
    return e.bridgeAbove && ly < 3 ? mul(c, 0.62) : c;                   // 다리 바로 밑은 그늘
  }
  // 물가의 옆면 — 땅 아래로 떨어지는 옆면(faceColor)을 물가 높이로: 아래로 갈수록 어둡고, 물에 닿는 밑동은 젖어 짙게 · 용암 쪽은 달아오름
  function shoreFace(b, t, X, Y, fy, FH, hot) {
    let c = mul(faceColor(b, t, X, Y, fy, 2), 1 - 0.3 * fy / FH);   // 풀은 두세 점만 늘어짐
    if (fy === FH - 1) c = mul(c, 0.66);
    if (hot) c = mix(c, c3('#ff6a20'), 0.06 + 0.55 * (fy / FH) ** 2);
    return c;
  }
  // 물가 모양 바깥(땅)의 점 — 옆 · 위에 물 · 용암이 닿으면 한 점 테두리 (용암 곁은 달아오른 빛)
  function shoreRim(m, A, e, X, Y, c) {
    if (poolField(A, m, X - 1, Y) < 0 && poolField(A, m, X + 1, Y) < 0 && poolField(A, m, X, Y - 1) < 0) return c;
    return e.hot ? mix(c, c3('#ff7a2a'), 0.5) : mul(c, 0.58);
  }

  // ---------- 도시 (지도 속성 city · 격 번호 CITY) — 찻길 · 보도 · 잔디 · 공원 길 · 골목 · 찻길 끝 막음 · 건물 ----------
  // 사용자가 보여 준 그림(서울 — 헌터들의 도시)의 느낌: 짙은 아스팔트에 노란 중앙선 · 흰 차선 · 줄무늬 횡단보도, 밝은 보도블록과 연석,
  // 손질된 잔디, 옥상이 보이는 건물(빌라의 초록 방수 옥상 · 물탱크, 유리 빌딩의 헬기장). 칸의 겉모습(tools/map-gen.js 의 CITY_GRID):
  // DIRT 찻길 · COBBLE 횡단보도 · PAVE 보도 · GRASS 잔디 · TILES 공원 길 · ROCKY 골목 · 벽 + DIRT 찻길 끝 막음
  const CITY = 10;
  const CYC = {
    asphalt: ['#4a4d56', '#43464e', '#52555e', '#3a3c43'],
    walk: ['#bdb7ab', '#b2ac9f', '#c8c2b6', '#a29c90'], joint: '#8f897e',
    curb: '#d8d4ca', curbEdge: '#55534f', yellow: '#e2b93b', paint: '#dcdcd4', tactile: '#d6b03a',
    concrete: ['#77746f', '#6e6b66', '#807d77', '#5f5c57'],
    brick: ['#b5806a', '#a87561', '#c08a74'], brickJoint: '#8a6656', lawnEdge: '#c3bdb0'
  };
  const ROADISH = t => t === DIRT || t === COBBLE;
  // 찻길(아스팔트 · 횡단보도) 칸마다 가로 · 세로로 이어진 길이와 시작 칸 — 짧은 쪽이 찻길의 폭 (중앙선 · 차선 · 횡단보도 무늬의 방향)
  function cityPrep(m, A) {
    const W = m.w, Hm = m.h, rd = k => m.tile[k] !== WALL && ROADISH(m.look[k] & 15);
    const hr = new Int16Array(W * Hm), vr = new Int16Array(W * Hm), hx = new Int16Array(W * Hm), vy = new Int16Array(W * Hm);
    for (let y = 0; y < Hm; y++) for (let x = 0; x < W;) {
      if (!rd(y * W + x)) { x++; continue; }
      let e = x; while (e < W && rd(y * W + e)) e++;
      for (let i = x; i < e; i++) { hr[y * W + i] = e - x; hx[y * W + i] = x; }
      x = e;
    }
    for (let x = 0; x < W; x++) for (let y = 0; y < Hm;) {
      if (!rd(y * W + x)) { y++; continue; }
      let e = y; while (e < Hm && rd(e * W + x)) e++;
      for (let i = y; i < e; i++) { vr[i * W + x] = e - y; vy[i * W + x] = y; }
      y = e;
    }
    A.city = { hr, vr, hx, vy };
  }
  function asphalt(X, Y) {
    let c = shadeOf(CYC.asphalt, fbm(X * 0.04, Y * 0.04, 301) * 0.6 + hash(X, Y, 302) * 0.4);
    const h = hash(X, Y, 303);
    if (h < 0.035) c = c3('#6a6d75'); else if (h > 0.975) c = c3('#33353b');      // 자갈 알갱이
    if (fbm(X * 0.02, Y * 0.02, 304) > 0.66) c = mul(c, 0.9);                      // 덧씌운 자국
    if (Math.abs(vnoise(X * 0.05, Y * 0.05, 305) - 0.5) < 0.006) c = c3('#2c2e33'); // 가는 금
    return c;
  }
  // 찻길 무늬 — 노란 중앙선 두 줄 · 흰 점선 차선 · 가장자리 실선, 횡단보도는 길을 가로지르는 굵은 줄. 네거리 한가운데는 무늬 없음
  function roadMark(m, A, X, Y, cross) {
    const k = Math.floor(Y / P) * m.w + Math.floor(X / P), R = A.city, hr = R.hr[k], vr = R.vr[k];
    const horiz = vr <= 6 && hr > vr, vert = hr <= 6 && vr > hr;
    if (!horiz && !vert) return null;
    const a = horiz ? Y - R.vy[k] * P : X - R.hx[k] * P, Wd = (horiz ? vr : hr) * P, along = horiz ? X : Y;
    if (hash(X, Y, 310) < 0.1) return null;                                        // 닳은 자리
    if (cross) return a >= 3 && a < Wd - 3 && ((along % 8) + 8) % 8 < 4 ? c3(CYC.paint) : null;
    const mid = Wd >> 1;
    if (a === mid - 2 || a === mid + 1) return c3(CYC.yellow);
    if (Wd >= 4 * P && (a === (Wd >> 2) || a === Wd - (Wd >> 2)) && ((along % 20) + 20) % 20 < 10) return c3(CYC.paint);
    if (a === 2 || a === Wd - 3) return mix(c3(CYC.paint), c3(CYC.asphalt[0]), 0.35);
    return null;
  }
  function cityGround(m, A, e, X, Y, lx, ly) {
    const tx = Math.floor(X / P), ty = Math.floor(Y / P);
    const terAt = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? -1 : m.look[y * m.w + x] & 15);
    const tileAt = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? WALL : m.tile[y * m.w + x]);
    const t = e.ter;
    if (e.t === WALL) {                                                            // 찻길 끝 막음 — 주황 · 흰 줄무늬 가림막
      let c = asphalt(X, Y);
      const across = tileAt(tx - 1, ty) !== WALL || tileAt(tx + 1, ty) !== WALL;   // 옆이 찻길이면 세로로 선 가림막
      const a = across ? lx : ly, s = across ? Y : X;
      if (a >= 5 && a <= 10) c = a === 5 || a === 10 ? c3('#3a2a22') : ((s >> 2) & 1) ? c3('#e8742a') : c3('#f2efe6');
      else if (a === 11) c = mul(c, 0.6);
      return c;
    }
    if (ROADISH(t)) {
      const c = asphalt(X, Y), mk = roadMark(m, A, X, Y, t === COBBLE);
      return mk || c;
    }
    if (t === PAVE) {
      if (e.t === TREE && lx >= 2 && lx <= 13 && ly >= 2 && ly <= 13) {           // 가로수 둘레 — 쇠살 덮개와 흙
        if (lx === 2 || lx === 13 || ly === 2 || ly === 13) return c3('#5a5853');
        return (lx + ly) % 3 === 0 ? c3('#3a3029') : mul(c3('#5a4632'), 0.85 + hash(X, Y, 322) * 0.3);
      }
      // 보도블록 — 8점 네모, 줄마다 반 장 엇갈림 · 한 장마다 살짝 다른 색 · 위 · 왼쪽은 밝게
      const by = Math.floor(Y / 8), off = by & 1 ? 4 : 0, bx = Math.floor((X + off) / 8), jx = (X + off) & 7, jy = Y & 7;
      const id = hash(bx, by, 320);
      let c = c3(CYC.walk[id < 0.3 ? 1 : id < 0.85 ? 0 : 2]);
      if (jx === 0 || jy === 0) c = c3(CYC.joint);
      else if (jx === 1 || jy === 1) c = mix(c, WHITE, 0.12);
      else if (jx === 7 || jy === 7) c = mul(c, 0.9);
      if (fbm(X * 0.05, Y * 0.05, 321) > 0.64) c = mul(c, 0.94);
      // 연석 — 찻길과 닿은 가장자리, 횡단보도 앞엔 노란 점자 블록 한 줄
      const road = (dx, dy) => ROADISH(terAt(tx + dx, ty + dy));
      const d = Math.min(road(0, 1) ? P - 1 - ly : 99, road(0, -1) ? ly : 99, road(1, 0) ? P - 1 - lx : 99, road(-1, 0) ? lx : 99);
      if (d === 0) return c3(CYC.curbEdge);
      if (d <= 2) return c3(CYC.curb);
      if (d === 3) return mul(c3(CYC.curb), 0.84);
      const cw = (dx, dy) => terAt(tx + dx, ty + dy) === COBBLE;
      if ((cw(0, 1) && ly >= 7 && ly <= 10) || (cw(0, -1) && ly >= 5 && ly <= 8) || (cw(1, 0) && lx >= 7 && lx <= 10) || (cw(-1, 0) && lx >= 5 && lx <= 8))
        return (X + Y) & 1 ? c3(CYC.tactile) : mul(c3(CYC.tactile), 0.8);
      return c;
    }
    if (t === GRASS) {                                                             // 손질된 잔디 — 보도 · 길과 닿은 가장자리엔 낮은 경계석
      let c = texture(GRASS, 0, X, Y);
      const edge = (dx, dy) => { const u = terAt(tx + dx, ty + dy); return u !== -1 && u !== GRASS && u !== BUILD; };
      const d = Math.min(edge(0, 1) ? P - 1 - ly : 99, edge(0, -1) ? ly : 99, edge(1, 0) ? P - 1 - lx : 99, edge(-1, 0) ? lx : 99);
      if (d <= 1) c = d === 0 ? mul(c3(CYC.lawnEdge), 0.8) : c3(CYC.lawnEdge);
      else if (d === 2) c = mul(c, 0.82);
      return c;
    }
    if (t === TILES) {                                                             // 공원 길 — 붉은 벽돌 보도 (8×4, 줄마다 엇갈림)
      const row = Math.floor(Y / 4), off = row & 1 ? 4 : 0, col = Math.floor((X + off) / 8), jx = (X + off) & 7, jy = Y & 3;
      if (jx === 0 || jy === 0) return c3(CYC.brickJoint);
      const c = c3(CYC.brick[(hash(col, row, 323) * 3) | 0]);
      return jy === 1 ? mix(c, WHITE, 0.1) : c;
    }
    if (t === ROCKY) {                                                             // 골목 — 낡은 콘크리트 · 금 · 물기, 양옆 건물 그늘, 가운데 이음매
      let c = shadeOf(CYC.concrete, fbm(X * 0.05, Y * 0.05, 330) * 0.6 + hash(X, Y, 331) * 0.4);
      if (Math.abs(vnoise(X * 0.07, Y * 0.07, 332) - 0.5) < 0.008) c = c3('#4a4844');
      if (fbm(X * 0.03, Y * 0.03, 333) > 0.63) c = mix(c, c3('#3e4a52'), hash(X, Y, 334) < 0.08 ? 0.15 : 0.35);
      if (lx === P - 1 && terAt(tx + 1, ty) === ROCKY) c = c3('#4a4844');
      if (terAt(tx - 1, ty) === BUILD && lx < 6) c = mul(c, 0.6 + lx * 0.06);
      if (terAt(tx + 1, ty) === BUILD && lx > 10) c = mul(c, 1 - (lx - 10) * 0.05);
      return c;
    }
    return texture(t, 0, X, Y);
  }

  // 도시의 건물 — 옥상(위)과 남쪽 벽면(아래 F 점)이 보이게. 생김새(kind)마다 벽 · 창 · 1층이 다름, 옥상엔 실외기 · 물탱크 · 헬기장 · 태양판
  const CB = {
    villa:  { F: 36, roof: '#6f9a78', wall: '#a35f48', trim: '#e3ddd2' },   // 빨간 벽돌 빌라 — 초록 방수 옥상 · 1층은 필로티
    shop:   { F: 42, roof: '#8f8b84', wall: '#cbc5ba', trim: '#efeae2' },   // 가게 — 간판 · 차양 · 유리 진열창
    office: { F: 64, roof: '#5f6672', wall: '#4d6c8f', trim: '#a9bccf' },   // 유리 빌딩
    apt:    { F: 56, roof: '#a19c92', wall: '#ddd6c7', trim: '#f1ece2' },   // 아파트 — 층마다 베란다 창
    back:   { F: 22, roof: '#8a867e', wall: '#8f8b84', trim: '#a8a49c' },   // 뒤 건물 — 골목 쪽 낡은 벽
    store:  { F: 32, roof: '#938d83', wall: '#d6d0c4', trim: '#f0ebe2' }    // 상가 — 초록 간판
  };
  function cityGeom(B) {
    const S = CB[B.kind] || CB.back, W = B.w * P, Hh = B.h * P, F = Math.min(S.F, Hh - 12), roofH = Hh - F;
    const items = [], rnd = n => hash(B.x0 * 7 + n, B.y0 * 13 + n, 340);
    if (B.roof === 'heli' && W >= 40 && roofH >= 40) items.push({ type: 'heli', cx: W / 2, cy: roofH / 2 + 1, r: Math.min(W, roofH) / 2 - 7 });
    if (B.roof === 'solar') items.push({ type: 'solar', x: 6, y: 6, w: Math.max(12, (W >> 1) - 6), h: Math.max(8, Math.min(roofH - 14, 20)) });
    if (B.roof === 'tank') items.push({ type: 'tank', x: W - 19, y: 6, w: 11, h: 13 });
    if (B.kind === 'apt' || B.kind === 'office') items.push({ type: 'core', x: W - 22, y: Math.max(5, roofH - 20), w: 14, h: 11 });
    const free = it => items.every(q => it.x + it.w + 2 < (q.x || q.cx - q.r) || (q.x || q.cx - q.r) + (q.w || q.r * 2) + 2 < it.x
      || it.y + it.h + 2 < (q.y || q.cy - q.r) || (q.y || q.cy - q.r) + (q.h || q.r * 2) + 2 < it.y);
    for (let n = 0; n < 8 && items.filter(q => q.type === 'ac').length < (B.kind === 'back' ? 1 : 3); n++) {
      const it = { type: 'ac', x: 5 + ((rnd(n) * Math.max(1, W - 18)) | 0), y: 5 + ((rnd(n + 20) * Math.max(1, roofH - 16)) | 0), w: 8, h: 6 };
      if (it.x + it.w < W - 4 && it.y + it.h < roofH - 4 && free(it)) items.push(it);
    }
    const door = B.door ? { x0: (B.door.x - B.x0) * P, x1: (B.door.x - B.x0 + B.door.w) * P } : null;
    return { S, W, Hh, F, roofH, items, door };
  }
  function roofItem(G, rx, ry, base) {
    for (const it of G.items) {
      if (it.type === 'heli') {
        const d = Math.hypot(rx - it.cx, ry - it.cy);
        if (Math.abs(d - it.r) < 1.1) return c3('#e3c04a');
        const hx = rx - Math.round(it.cx) + 4, hy = ry - Math.round(it.cy) + 5;
        if (hx >= 0 && hx < 8 && hy >= 0 && hy < 10 && (hx < 2 || hx > 5 || hy === 4 || hy === 5)) return c3('#f2f0ea');
        if (d < it.r) return mul(base, 0.92);
        continue;
      }
      const inX = rx >= it.x && rx < it.x + it.w, inY = ry >= it.y && ry < it.y + it.h;
      if (inX && inY) {
        const ix = rx - it.x, iy = ry - it.y;
        if (it.type === 'solar') {
          if (ix % 7 === 6 || iy % 5 === 4) return c3('#c4c6ca');
          return (ix + iy) % 9 === 0 ? c3('#5d7cb0') : c3('#2c4774');
        }
        if (it.type === 'tank') {                                                  // 물탱크 — 둥근 뚜껑 · 몸통 · 다리
          if (iy >= it.h - 2) return ix === 1 || ix === it.w - 2 ? c3('#3a3a40') : base;
          if (iy < 3) return iy === 0 ? c3('#9cd0e8') : c3('#6eb0d2');
          if (ix === 0 || ix === it.w - 1) return c3('#2f6688');
          return ix < 3 ? c3('#79bbdc') : iy % 4 === 1 ? c3('#3f7fa6') : c3('#4c8fb5');
        }
        if (it.type === 'core') {                                                  // 계단실 — 지붕 · 남쪽 문
          if (iy < 3) return iy === 0 ? c3('#cfcac0') : c3('#b9b4aa');
          if (ix >= 5 && ix <= 8 && iy >= 5) return c3('#3c3a40');
          return ix === 0 || ix === it.w - 1 ? c3('#7d7972') : c3('#a29d94');
        }
        // 실외기 — 위는 밝게 · 가운데 둥근 팬
        if (iy === 0) return c3('#e2e0da');
        if (Math.hypot(ix - 2.5, iy - 3) < 2) return c3('#5a5852');
        return ix === it.w - 1 || iy === it.h - 1 ? c3('#8f8d87') : c3('#c8c6c0');
      }
      if ((rx === it.x + it.w && ry > it.y && ry <= it.y + it.h) || (ry === it.y + it.h && rx > it.x && rx <= it.x + it.w)) return mul(base, 0.72);   // 그림자
    }
    return null;
  }
  function cityBuilding(B, px, py, X, Y) {
    const G = B.G || (B.G = cityGeom(B)), S = G.S, W = G.W, Hh = G.Hh, F = G.F;
    if (px === 0 || px === W - 1 || py === 0) return c3('#24222b');                 // 둘레 한 점 테두리
    if (py === Hh - 1) return c3('#2c2a30');
    if (py < G.roofH) {                                                             // 옥상
      const roof = c3(S.roof);
      if (py >= G.roofH - 3) return py === G.roofH - 3 ? c3(S.trim) : py === G.roofH - 1 ? mul(c3(S.trim), 0.72) : mul(c3(S.trim), 0.88);   // 앞쪽 처마
      if (py <= 2 || px <= 2 || px >= W - 3) return py === 1 || px === 1 ? c3(S.trim) : mul(c3(S.trim), 0.86);   // 난간
      if (py === 3 || px === 3) return mul(roof, 0.78);                             // 난간 그늘
      const it = roofItem(G, px, py, roof);
      if (it) return it;
      let c = mul(roof, 0.94 + vnoise(X * 0.08, Y * 0.08, 341) * 0.12);
      if ((px % 16 === 0 || py % 16 === 0) && B.kind !== 'villa') c = mul(c, 0.9);  // 이음매
      if (hash(X, Y, 342) < 0.03) c = mul(c, 0.9);
      return c;
    }
    const fx = px, fy = py - G.roofH;                                               // 남쪽 벽면
    let c;
    if (fy >= F - 2) c = fy === F - 1 ? c3('#3a373f') : c3('#55515a');            // 바닥 턱
    else if (fy <= 1) c = c3(S.trim);
    else if (fy === 2) c = mul(c3(S.wall), 0.7);
    else c = cityFace(B, G, fx, fy, X, Y);
    if (fx <= 1) c = mix(c, WHITE, 0.08); else if (fx >= W - 2) c = mul(c, 0.86);
    return c;
  }
  // 벽면 한 점 — fy 는 벽면 위에서 몇 점 아래 (3 ~ F-3)
  function cityFace(B, G, fx, fy, X, Y) {
    const S = G.S, W = G.W, F = G.F, wall = c3(S.wall), k = B.kind, door = G.door;
    const inDoor = door && fx >= door.x0 + 2 && fx < door.x1 - 2;
    const glass = (wx, wy, ww, wh, tint) => {                                      // 창 하나 — 틀 · 유리 · 비친 빛
      if (wx === 0 || wy === 0 || wx === ww - 1 || wy === wh - 1) return c3('#e6e1d7');
      return (wx + wy) % 6 === 0 ? mix(c3(tint), WHITE, 0.55) : wy < 2 ? mul(c3(tint), 0.82) : c3(tint);
    };
    if (k === 'office') {                                                           // 유리 커튼월 — 세로 멀리언 · 층 줄 · 비친 하늘
      if (fy >= F - 12) {
        if (inDoor || (fx % 9 < 7 && fy > F - 11)) return fy === F - 11 ? c3('#22303f') : (fx + fy) % 7 === 0 ? c3('#5f7d9c') : c3('#2f4258');
        return c3('#1f2b38');
      }
      if (fx % 7 === 0) return c3('#2a3a50');
      if (fy % 9 === 3) return c3('#33475f');
      let c = wall;
      if (((fx * 0.5 + fy) % 30 + 30) % 30 < 6) c = mix(c, c3('#b7d0e6'), 0.45);
      if (hash(Math.floor(fx / 7), Math.floor(fy / 9), 343 + B.x0) < 0.12) c = mix(c, c3('#e8d8a0'), 0.3);
      return c;
    }
    if (k === 'shop' || k === 'store') {                                            // 가게 — 위층 창 · 간판 · 차양 · 진열창
      const signTop = F - 24, signBot = F - 18, awn = F - 17;
      if (fy >= signTop && fy < signBot) {
        if (fy === signTop || fy === signBot - 1) return c3(k === 'store' ? '#f2f0ea' : '#b23a2e');
        const bg = c3(k === 'store' ? '#2f8f5b' : '#2a2832');
        if (k === 'shop' && door) {                                                 // 무기점 간판 — 가운데 엇갈린 두 칼
          const cx = Math.round((door.x0 + door.x1) / 2), ix = fx - cx, iy = fy - signTop - 1;
          if (Math.abs(Math.abs(ix) - iy) <= 0 && Math.abs(ix) <= 3) return c3('#dfe4ea');
          if (iy === 3 && (ix === -3 || ix === 3)) return c3('#c9a24a');
        }
        if (k === 'store' && (fy - signTop) === 3 && fx % 10 < 6) return c3('#f2f0ea');
        return bg;
      }
      if (fy >= awn && fy < awn + 3) return ((fx >> 2) & 1) ? c3(k === 'store' ? '#2f8f5b' : '#c0392b') : c3('#f3ede4');   // 줄무늬 차양
      if (fy >= awn + 3) {                                                          // 진열창 · 문
        if (fy === awn + 3) return mul(c3('#3a3a42'), 0.9);
        if (inDoor) return fx === door.x0 + 2 || fx === door.x1 - 3 || fy === awn + 4 ? c3('#cfc9be') : (fx === Math.round((door.x0 + door.x1) / 2)) ? c3('#cfc9be') : c3('#40596b');
        if (fx % 12 === 0) return c3('#2d3a46');
        let c = c3('#5d7f98');
        if (((fx + fy * 2) % 22 + 22) % 22 < 4) c = mix(c, WHITE, 0.35);
        if (k === 'shop' && fx % 6 === 3 && fy > awn + 5 && fy < F - 4) c = c3('#c8d0d8');   // 진열한 칼
        return c;
      }
      const wx = (fx - 4) % 14, wy = (fy - 4) % 11;                                  // 위층
      if (fx >= 4 && fx <= W - 6 && wx >= 0 && wx < 10 && wy >= 1 && wy < 8) return glass(wx, wy - 1, 10, 7, '#8db4cc');
      if (wy === 8 && fx >= 4 && wx < 10) return c3('#bdb6aa');
      return hash(X, Y, 344) < 0.04 ? mul(wall, 0.95) : wall;
    }
    if (k === 'villa') {                                                            // 빨간 벽돌 빌라 — 1층은 필로티(어두운 주차 칸 · 기둥) · 문
      if (fy >= F - 13) {
        if (inDoor) {
          if (fy === F - 13) return c3('#c94b3c');                                  // 문 위 작은 차양
          return fx === door.x0 + 2 || fx === door.x1 - 3 ? c3('#cfc9be') : fy % 4 === 0 ? c3('#6b8a9e') : c3('#3d5566');
        }
        if (((fx % 18) + 18) % 18 < 3) return fy === F - 13 ? c3('#cfc8bb') : c3('#bdb6aa');
        return fy === F - 13 ? c3('#1c1b20') : c3('#26252b');
      }
      const row = fy >> 2, off = row & 1 ? 4 : 0;
      let c = (fy & 3) === 3 || ((fx + off) & 7) === 0 ? c3('#7e4535') : c3(['#a35f48', '#984f3c', '#ad6a52'][(hash((fx + off) >> 3, row, 345) * 3) | 0]);
      const wx = (fx - 5) % 13, wy = (fy - 3) % 10;
      if (fx >= 5 && fx <= W - 7 && wx >= 0 && wx < 8 && wy >= 1 && wy < 7) c = wx === 4 ? c3('#e6e1d7') : glass(wx, wy - 1, 8, 6, '#8db4cc');
      else if (fx >= 5 && wx >= 0 && wx < 8 && wy === 7) c = c3('#d8d2c6');        // 창턱
      return c;
    }
    if (k === 'apt') {                                                              // 아파트 — 층마다 베란다 창 · 난간
      if (fy >= F - 11) return ((fx % 16) + 16) % 16 < 3 ? c3('#cfc8bb') : fy === F - 11 ? c3('#1c1b20') : c3('#2e2c33');
      const ux = ((fx % 16) + 16) % 16, wy = (fy - 3) % 9;
      if (ux < 2) return mul(wall, 0.9);
      if (wy >= 1 && wy <= 5) return glass(ux - 2, wy - 1, 14, 5, '#86a7bf');
      if (wy === 6) return ux % 3 === 0 ? c3('#7f858d') : c3('#9aa0a8');
      if (wy === 7) return mul(wall, 0.84);
      return wall;
    }
    // 뒤 건물 — 낡은 벽, 드문드문 작은 창 · 실외기 · 세로 배관
    if (fx === (W >> 2) || fx === (W >> 2) + 1) return fx === (W >> 2) ? c3('#6d6a64') : c3('#8a8780');
    const cx = Math.floor(fx / 9), cy = Math.floor((fy - 3) / 8), ix = fx % 9, iy = (fy - 3) % 8, h = hash(cx, cy, 346 + B.x0);
    if (h < 0.22 && ix >= 2 && ix < 7 && iy >= 2 && iy < 6) return ix === 2 || iy === 2 ? c3('#4a5560') : c3('#5c6b78');
    if (h > 0.86 && ix >= 1 && ix < 8 && iy >= 1 && iy < 7) return iy === 1 ? c3('#e2e0da') : Math.hypot(ix - 3, iy - 4) < 2 ? c3('#5a5852') : c3('#c8c6c0');
    let c = mul(wall, 0.92 + vnoise(X * 0.1, Y * 0.1, 347) * 0.14);
    if (fbm(X * 0.04, Y * 0.04, 348) > 0.62) c = mul(c, 0.86);                       // 얼룩
    return c;
  }

  // ---------- 이상한 게이트 — 도시 골목 막다른 곳 · 지하수로 첫 공간 (나에게만 보임) ----------
  // 흔히 보는 파란 원 대신, 허공이 찢긴 듯한 세로 틈 — 검은 속에 소용돌이 · 별, 청록 · 보라로 번뜩이는 들쭉날쭉한 테, 둘레를 떠도는 조각.
  // 여덟 장을 미리 그려 두고 번갈아 붙임 (mapview 가 문 자리에 부름 — port.rift)
  const RIFT_W = 36, RIFT_H = 46, riftFrames = [];
  function riftSprite(f) {
    if (riftFrames[f]) return riftFrames[f];
    const cv = document.createElement('canvas');
    cv.width = RIFT_W; cv.height = RIFT_H;
    const g = cv.getContext('2d'), img = g.createImageData(RIFT_W, RIFT_H), d = img.data;
    const put = (x, y, c, a = 255) => { if (x < 0 || y < 0 || x >= RIFT_W || y >= RIFT_H) return; const i = (y * RIFT_W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a; };
    const cx = RIFT_W / 2 - 0.5, cy = RIFT_H / 2;
    // 테 밖으로 뻗은 짧은 금 (늘 같은 자리)
    for (let n = 0; n < 7; n++) {
      const ang = hash(n, 0, 408) * Math.PI * 2, len = 3 + hash(n, 1, 408) * 5;
      let x = cx + Math.cos(ang) * 10, y = cy + Math.sin(ang) * 18;
      for (let s = 0; s < len; s++) { put(Math.round(x), Math.round(y), c3('#2a1640')); x += Math.cos(ang) + (hash(n, s, 409) - 0.5); y += Math.sin(ang) * 1.3; }
    }
    for (let y = 0; y < RIFT_H; y++) {
      const s = (y - 2) / (RIFT_H - 5);
      if (s < 0 || s > 1) continue;
      const base = Math.pow(Math.sin(Math.PI * s), 0.8) * 12, lean = (vnoise(y * 0.15, 3.7, 401) - 0.5) * 6;
      for (let x = 0; x < RIFT_W; x++) {
        const hw = base + (vnoise(y * 0.5, f * 0.9 + (x < cx ? 0 : 50), 402) - 0.5) * 3.2 + (hash(x, y, 403 + f) - 0.5) * 1.2;
        const dx = Math.abs(x - cx - lean);
        if (dx > hw + 1.5) continue;
        if (dx > hw) { if (hash(x, y, 404 + f) < 0.45) put(x, y, c3('#6b3fa8'), 150); continue; }
        if (dx > hw - 1.2) { put(x, y, vnoise(y * 0.3, f * 0.6, 405) > 0.5 ? c3('#7ef2e0') : c3('#c79bff')); continue; }
        if (dx > hw - 2.6) { put(x, y, c3('#3b1868')); continue; }
        const ang = Math.atan2(y - cy, x - cx), r = Math.hypot(x - cx, (y - cy) * 0.45);
        let c = c3('#08040f');
        if (Math.sin(ang * 3 + r * 0.55 - f * 0.785) > 0.82) c = c3('#1e0f38');
        if (hash(x, y, 406 + f) < 0.018) c = c3('#d8ecff'); else if ((f & 1) && hash(x, y, 407) < 0.01) c = c3('#7ef2e0');
        put(x, y, c);
      }
    }
    g.putImageData(img, 0, 0);
    return (riftFrames[f] = cv);
  }
  // cx — 문 가운데(화면 픽셀), by — 문 아래 가장자리. t 는 초
  function drawRift(ctx, cx, by, T, t) {
    const u = T / P, spr = riftSprite(Math.floor(t * 8) % 8), gy = by - RIFT_H * u * 0.45, pulse = 0.75 + 0.25 * Math.sin(t * 2.3);
    const gr = ctx.createRadialGradient(cx, gy, 2 * u, cx, gy, 26 * u);
    gr.addColorStop(0, `rgba(150,110,255,${(0.32 * pulse).toFixed(2)})`); gr.addColorStop(1, 'rgba(150,110,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(cx - 26 * u, gy - 26 * u, 52 * u, 52 * u);
    ctx.fillStyle = 'rgba(10,6,20,0.45)';
    ctx.beginPath(); ctx.ellipse(cx, by - u, 9 * u, 2.4 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, Math.round(cx - RIFT_W / 2 * u), Math.round(by - RIFT_H * u + u), RIFT_W * u, RIFT_H * u);
    for (let i = 0; i < 4; i++) {                                                   // 둘레를 떠도는 조각
      const a = t * (0.6 + i * 0.13) + i * 1.7, x = cx + Math.cos(a) * (15 + i * 2) * u, y = gy + Math.sin(a * 1.3) * 18 * u;
      ctx.fillStyle = '#1a0d2e'; ctx.fillRect(x, y, 2 * u, 3 * u);
      ctx.fillStyle = i & 1 ? '#7ef2e0' : '#c79bff'; ctx.fillRect(x, y, u, u);
    }
  }

  // 점 하나의 색 — 칸 e 안의 (lx, ly) 번째 점, 지도 전체로는 (X, Y)
  function paint(m, A, e, X, Y, lx, ly) {
    if (e.b !== undefined) return buildingPixel(A, e, X, Y);
    if (e.ruin) return ruinPix(e, X, Y);
    if (e.raw === DOORWAY) return doorwayPix(e, X, Y, lx, ly);
    if (e.pb) return pillarFloor(e, X, Y);
    if (e.raw === CARPET && e.t === FLOOR) { const c = carpetPix(e, X, Y, lx); return e.shadeTop && ly < e.shadeTop ? mul(c, 0.62 + 0.38 * ly / e.shadeTop) : c; }
    if (e.shore) {                                                       // 물가 칸 — 이 점이 물가 모양 안쪽이면 물 · 용암 (옆면 포함)
      const s = poolField(A, m, X, Y);
      if (s >= 0) return poolPixel(m, A, e, X, Y, s, ly);
      if (e.t === POOL) return shoreRim(m, A, e, X, Y, texture(e.gTer, e.gBio, X, Y));   // 물 칸 안으로 둥글게 나온 땅
    }
    let c = paintGround(m, A, e, X, Y, lx, ly);
    if (e.prop && !(e.nearRoad && roadField(m, X, Y, 0) >= -0.08)) c = propPixel(e.prop, lx, ly, c);
    if (e.dais) {
      const R = P - 1, d = Math.min(e.dais.l ? lx : 99, e.dais.r ? R - lx : 99, e.dais.u ? ly : 99, e.dais.d ? R - ly : 99);
      if (d === 0) c = c3(CK.line); else if (d <= 2) c = mix(c, c3(CK.gold), d === 1 ? 0.5 : 0.25);
    }
    if (e.shore) c = shoreRim(m, A, e, X, Y, c);
    return e.shadeTop && ly < e.shadeTop ? mul(c, 0.62 + 0.38 * ly / e.shadeTop) : c;
  }
  function paintGround(m, A, e, X, Y, lx, ly) {
    const t = e.t;
    if (t === POOL) { const c = e.raw === LAVA ? lava(X, Y) : water(m, A, X, Y); return e.bridgeAbove && ly < 3 ? mul(c, 0.62) : c; }
    if (e.bio === CITY) return cityGround(m, A, e, X, Y, lx, ly);
    if ((t === WALL || t < 0) && m.props && m.props.interior) return hallWall(m, e, X, Y, lx, ly);
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
    if (t === ROCK) return rockPix(m, e, X, Y);
    return texture(e.ter, e.bio, X, Y);                                   // 바닥 · 나무 밑
  }

  // 칸 [x0, x0+w) × [y0, y0+h) 를 점으로 — put(점 x, 점 y, [r, g, b], 용암인가) (덩어리 · 미리보기 도구가 씀)
  function bake(m, x0, y0, w, h, put) {
    const A = prep(m);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const tx = x0 + i, ty = y0 + j;
      if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) continue;
      const e = cellOf(m, A, tx, ty);
      for (let ly = 0; ly < P; ly++) for (let lx = 0; lx < P; lx++) {
        glowHit = false;
        const c = paint(m, A, e, tx * P + lx, ty * P + ly, lx, ly);
        put(i * P + lx, j * P + ly, c, glowHit);
      }
    }
  }

  // 덩어리 하나 (CH×CH 칸) — 캔버스에 한 번 그려 둠. 용암이 있으면 용암 점만 칠한 빛 판(.glow)도 — 움직이는 것(liveGround)이 일렁이게 얹음
  function chunk(m, cx, cy) {
    const w = Math.min(CH, m.w - cx * CH), h = Math.min(CH, m.h - cy * CH), pw = w * P;
    const cv = document.createElement('canvas');
    cv.width = pw; cv.height = h * P;
    const g = cv.getContext('2d'), img = g.createImageData(pw, h * P), d = img.data;
    let hot = null;
    bake(m, cx * CH, cy * CH, w, h, (x, y, c, lit) => {
      const i = (y * pw + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      if (lit) (hot || (hot = new Uint8Array(pw * h * P)))[y * pw + x] = 1;
    });
    g.putImageData(img, 0, 0);
    if (hot) {
      const gc = document.createElement('canvas');
      gc.width = pw; gc.height = h * P;
      const gg = gc.getContext('2d'), gi = gg.createImageData(pw, h * P), gd = gi.data;
      for (let n = 0; n < hot.length; n++) if (hot[n]) { gd[n * 4] = 255; gd[n * 4 + 1] = 150; gd[n * 4 + 2] = 60; gd[n * 4 + 3] = 255; }
      gg.putImageData(gi, 0, 0);
      cv.glow = gc;
    }
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
    for (let y = Math.max(0, y0 - 1); y < Math.min(m.h, y1 + 3); y++) for (let x = Math.max(0, x0 - 3); x < Math.min(m.w, x1 + 1); x++) {   // 왼쪽은 세 칸 더 (폭 세 칸 기둥)
      const k = y * m.w + x;
      if (m.tile[k] === ROCK && (m.look[k] >> 4) !== 8 && loneRock(m, x, y)) {   // 혼자 선 바위 — 칸 아래 가장자리에 밑동이 닿게
        const kind = rockKind(m.look[k] >> 4, terOf(m.look[k] & 15)), spr = boulderSprite(kind, (hash(x, y, 181) * 3) | 0);
        const bw = BW / P * T, bh = BH / P * T;
        ctx.drawImage(spr, Math.round(ox + (x + 0.5) * T - bw / 2), Math.round(oy + (y + 1) * T - bh + T * 0.05), bw, bh);
        continue;
      }
      if (m.tile[k] === ROCK && (m.look[k] >> 4) === 8) {                 // 성 안 돌기둥 — 덩어리의 왼쪽 아래 칸에서 한 번
        const isP = (i, j) => i >= 0 && j >= 0 && i < m.w && j < m.h && m.tile[j * m.w + i] === ROCK && (m.look[j * m.w + i] >> 4) === 8;
        if (isP(x - 1, y) || isP(x, y + 1)) continue;
        let bw = 1; while (isP(x + bw, y)) bw++;
        const spr = pillarSprite(bw), h = PILLAR_H / P * T;
        ctx.drawImage(spr, Math.round(ox + x * T), Math.round(oy + (y + 1) * T - h), bw * T, h);
        continue;
      }
      if (m.tile[k] !== TREE) continue;
      const [style, pal] = treeOf(m, k, x, y), v = (hash(x, y, 63) * VARIANTS) | 0;
      const j = (hash(x, y, 61) - 0.5) * 0.3 * T;                       // 줄 맞춰 선 것처럼 안 보이게 살짝 비킴
      const cx = ox + (x + 0.5) * T + j, by = oy + (y + 1) * T;
      ctx.fillStyle = 'rgba(16, 10, 6, 0.28)';
      ctx.beginPath(); ctx.ellipse(cx, by - T * 0.08, T * 0.62, T * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(treeSprite(style, pal, v), Math.round(cx - sw / 2), Math.round(by - sh), sw, sh);
    }
  }

  // ---------- 움직이는 것 (사용자가 본 예시 그대로) ----------
  // 물결 반짝임 · 물결 줄 · 일렁이는 용암 빛 · 깜빡이는 횃불은 땅 바로 위(liveGround — 나무 · 기둥 밑), 날리는 불씨 · 반딧불은 나무 위(liveAir).
  // 하나하나 따로 들고 있지 않고 칸마다 정해진 박자(hash)로 — 걸어서 화면이 바뀌어도 같은 자리에서 같은 때에. t 는 초
  const FOREST = 2;
  // 물 · 용암의 겉 — 둥근 물가 안쪽 깊이 lo 이상이고, 바로 위 14 점 안에 땅 가장자리(옆면)가 없는 점
  const surf = (m, A, X, Y, lo) => poolField(A, m, X, Y) >= lo && poolField(A, m, X, Y - 14) >= 0;
  // 칸마다의 박자 — 주기 per 초 중 life 초만 살아 있음. 살아 있으면 { a: 0~1 지난 몫, n: 몇 번째 (자리를 바꿀 씨앗), tau: 지난 초 }
  function beat(x, y, s, t, per, life) {
    const ph = t / per + hash(x, y, s), n = Math.floor(ph), tau = (ph - n) * per;
    return tau < life ? { a: tau / life, n, tau } : null;
  }
  function torchesOf(m, A) {
    if (A.torches) return A.torches;
    // 위 벽 벽면의 횃불 자리 (hallWall 과 같은 셈 — 가운데 깃발에서 좌우로 48 점, 96 점마다) · 불꽃 가운데는 벽면 위에서 17 점
    const out = [], mid = (m.w * P) >> 1, open = (x, y) => { const u = m.tile[y * m.w + x]; return u !== WALL && u >= 0; };
    for (let X = (((mid - 48) % 96) + 96) % 96; X < m.w * P; X += 96) {
      const tx = X >> 4;
      for (let ty = 3; ty < m.h; ty++) if (open(tx, ty)) { if (!open(tx, ty - 1) && !open(tx, ty - 2) && !open(tx, ty - 3)) out.push([X, (ty - 3) * P + 17]); break; }
    }
    return (A.torches = out);
  }
  const FLAMES = [
    [[0, -5], [-1, -4], [0, -4], [1, -3], [-1, -3], [0, -3], [-2, -2], [-1, -2], [0, -2], [1, -2], [-1, -1], [0, -1], [1, -1]],
    [[1, -5], [0, -4], [1, -4], [-1, -3], [0, -3], [1, -3], [-1, -2], [0, -2], [1, -2], [2, -2], [-1, -1], [0, -1], [1, -1]],
    [[-1, -5], [-1, -4], [0, -4], [-1, -3], [0, -3], [1, -3], [-2, -2], [-1, -2], [0, -2], [1, -2], [-1, -1], [0, -1], [1, -1]]
  ];
  function liveGround(ctx, m, ox, oy, T, x0, y0, x1, y1, t) {
    const A = prep(m), u = T / P, dot = (X, Y) => ctx.fillRect(ox + X * u, oy + Y * u, u, u);
    // 용암 빛 — 숨 쉬듯 (덩어리마다 용암 점만 칠해 둔 빛 판)
    ctx.globalAlpha = 0.08 + 0.06 * Math.sin(t * 2.1);
    for (let cy = Math.floor(y0 / CH); cy < Math.ceil(y1 / CH); cy++) for (let cx = Math.floor(x0 / CH); cx < Math.ceil(x1 / CH); cx++) {
      const cv = A.chunks.get(cy * 4096 + cx);
      if (cv && cv.glow) ctx.drawImage(cv.glow, ox + cx * CH * T, oy + cy * CH * T, cv.width / P * T, cv.height / P * T);
    }
    ctx.globalAlpha = 1;
    // 물 — 한 점이 커졌다(십자) 사라지는 반짝임, 천천히 흐르는 짧은 물결 줄
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const k = y * m.w + x;
      if (m.tile[k] !== POOL || (m.look[k] & 15) === LAVA) continue;
      const g = beat(x, y, 202, t, 14 + hash(x, y, 201) * 12, 0.5 + hash(x, y, 203) * 0.4);
      if (g) {
        const X = x * P + 1 + ((hash(x, y, g.n * 3 + 204) * 14) | 0), Y = y * P + 1 + ((hash(x, y, g.n * 3 + 205) * 14) | 0);
        if (surf(m, A, X, Y, 0.12)) {
          const kk = Math.sin(g.a * Math.PI);
          ctx.fillStyle = `rgba(255,255,255,${(0.9 * kk).toFixed(2)})`; dot(X, Y);
          if (kk > 0.6) { ctx.fillStyle = `rgba(220,245,255,${(0.6 * kk).toFixed(2)})`; dot(X - 1, Y); dot(X + 1, Y); dot(X, Y - 1); dot(X, Y + 1); }
        }
      }
      const w = beat(x, y, 207, t, 40 + hash(x, y, 206) * 20, 1.5 + hash(x, y, 208));
      if (w) {
        const len = 3 + ((hash(x, y, w.n * 3 + 209) * 4) | 0), X = x * P + ((hash(x, y, w.n * 3 + 210) * 10) | 0), Y = y * P + 2 + ((hash(x, y, w.n * 3 + 211) * 12) | 0);
        if (surf(m, A, X, Y, 0.12) && surf(m, A, X + len + 4, Y, 0.12)) {
          ctx.fillStyle = `rgba(210,240,250,${(0.35 * Math.sin(w.a * Math.PI)).toFixed(2)})`;
          ctx.fillRect(ox + ((X + w.a * 4) | 0) * u, oy + Y * u, len * u, u);
        }
      }
    }
    // 횃불 (건물 안 위 벽) — 불꽃 모양이 바뀌며 흔들리고 둘레 빛이 커졌다 작아짐, 가끔 불똥
    if (m.props && m.props.interior) torchesOf(m, A).forEach(([X, Y], i) => {
      if (X < (x0 - 2) * P || X > (x1 + 2) * P || Y < (y0 - 2) * P || Y > (y1 + 2) * P) return;
      const fl = 0.75 + 0.25 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.3 + i), sx = ox + X * u, sy = oy + Y * u;
      const gr = ctx.createRadialGradient(sx, sy, u, sx, sy, 20 * fl * u);
      gr.addColorStop(0, `rgba(255,190,90,${(0.3 * fl).toFixed(2)})`); gr.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = gr; ctx.fillRect(sx - 22 * u, sy - 22 * u, 44 * u, 44 * u);
      for (const [dx, dy] of FLAMES[((t * 9 + i) | 0) % 3]) { ctx.fillStyle = dy <= -4 ? '#ff7a22' : dy <= -2 && Math.abs(dx) < 1 ? '#fff0b0' : '#ffb040'; dot(X + dx, Y + 4 + dy); }
      for (let s = 0; s < 2; s++) {
        const b = beat(i, s, 240, t, 1, 0.4 + hash(i, s, 241) * 0.4);
        if (b) { ctx.fillStyle = `rgba(255,200,100,${(1 - b.a).toFixed(2)})`; dot(X + (((hash(i, b.n, 242 + s) * 3) | 0) - 1), (Y - 2 - b.a * 8) | 0); }
      }
    });
  }
  function liveAir(ctx, m, ox, oy, T, x0, y0, x1, y1, t) {
    const A = prep(m), u = T / P, dot = (X, Y, n = 1) => ctx.fillRect(ox + X * u, oy + Y * u, n * u, n * u);
    for (let y = Math.max(0, y0 - 1); y < Math.min(m.h, y1 + 2); y++) for (let x = Math.max(0, x0 - 1); x < Math.min(m.w, x1 + 1); x++) {
      const k = y * m.w + x, tl = m.tile[k];
      if (tl === POOL && (m.look[k] & 15) === LAVA) {
        // 불씨 — 용암에서 솟아 흔들리며 오르다 식어 사라짐
        const life = 1 + hash(x, y, 220), b = beat(x, y, 222, t, life + 0.4 + hash(x, y, 221) * 1.2, life);
        if (!b) continue;
        const s = b.n * 5, X0 = x * P + ((hash(x, y, s + 223) * 16) | 0), Y0 = y * P + ((hash(x, y, s + 224) * 16) | 0);
        if (!surf(m, A, X0, Y0, 0.2)) continue;
        const X = X0 + (hash(x, y, s + 225) - 0.5) * 8 * b.tau + Math.sin(t * 4 + hash(x, y, s + 227) * 6) * 1.2, Y = Y0 - (8 + hash(x, y, s + 226) * 8) * b.tau;
        ctx.fillStyle = b.a < 0.35 ? '#ffe8a0' : b.a < 0.7 ? '#ffb040' : `rgba(224,80,30,${(1 - b.a).toFixed(2)})`;
        dot(X | 0, Y | 0);
      } else if ((tl === FLOOR || tl === TREE) && (m.look[k] >> 4) === FOREST && hash(x, y, 230) < 1 / 14) {
        // 반딧불 — 숲 위를 천천히 떠돌며 깜빡임 (가운데 한 점 · 둘레 은은한 빛)
        const ph = hash(x, y, 231) * 6.3, sp = 0.4 + hash(x, y, 232) * 0.5, r = 6 + hash(x, y, 233) * 8;
        const kk = Math.max(0, Math.sin(t * 2.2 + ph * 3)) ** 2;
        if (kk < 0.05) continue;
        const X = (x * P + 8 + Math.sin(t * sp + ph) * r) | 0, Y = (y * P + 4 + Math.sin(t * sp * 1.3 + ph * 2) * r * 0.6 - 6) | 0;
        ctx.fillStyle = `rgba(200,255,120,${(0.22 * kk).toFixed(2)})`; dot(X - 1, Y - 1, 3);
        ctx.fillStyle = `rgba(240,255,170,${(0.95 * kk).toFixed(2)})`; dot(X, Y);
      }
    }
  }

  const api = { has: m => !!(m && m.look), drawGround, drawTrees, drawOver, liveGround, liveAir, drawRift, paintTree, texture, bake, propOf, TW, TH, TREE_STYLES, TREE_PAL, cached: m => (prepared.get(m.look) || { chunks: new Map() }).chunks.size, P, CH, VOID, GRASS, DIRT, COBBLE, TILES, WATER, LAVA, OBSID, SNOW, ROCKY, PAVE, CANAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MapArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
