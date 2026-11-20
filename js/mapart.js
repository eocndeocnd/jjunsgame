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
  // ---------- 숲의 마녀의 오두막 (2격 숲 — tools/map-gen.js 의 BUILDINGS witchhut, 사용자 결정 2026-11-20) ----------
  // 이끼 덮인 볏짚 지붕(층마다 들쭉날쭉한 처마 · 짚 결 · 이끼 얼룩) · 굽은 돌 굴뚝 · 굵기가 저마다 다른 통나무 벽(끝이 삐죽 나옴) ·
  // 처마 밑 그늘 · 둥근 창과 덧문 창의 초록 불빛 · 아치 나무 문(살짝 열려 초록빛이 샘) · 초록 등 · 빗자루 · 약초 다발 · 빛은 왼쪽 위에서
  const HUT_C = {
    thatch: ['#2c241c', '#3f3428', '#544531', '#68583a', '#7c6a44'], moss: ['#3a4826', '#4a5a2e', '#5c6c36'],
    log: ['#2e2119', '#3e2c21', '#4f392a', '#614835', '#765a41'], seam: '#1c1411', end: ['#5e4630', '#7a5d3e', '#94754e'],
    stone: ['#57534c', '#4a4640', '#635f56'], mortar: '#272421', door: ['#2a1e17', '#36271d', '#433024'], iron: ['#232327', '#3e3e45'],
    glow: ['#4f9a3a', '#7ed05a', '#c6f59a'], line: '#1a120e'
  };
  // ---------- 오크 부락 (2격 — tools/map-gen.js 의 ORC_VILLAGE, 사용자 결정 2026-11-20) ----------
  // 지도 속성 blds 의 소품 하나하나: stake 울타리 한 칸(굵기 · 키가 저마다 다른 뾰족한 통나무, 묶은 밧줄) · tent 가죽 천막(조각 가죽을 기운 자국 · 엇갈린 장대) ·
  // orchut 족장 움막(둥근 가죽 지붕 · 붉은 전쟁 칠 · 엄니 둘 · 짐승 해골) · totem 토템 · fire 모닥불 · rack 무기 걸이 · hide 가죽 말림대.
  // 빛은 왼쪽 위 — 오른쪽 면은 그늘, 그림자는 오른쪽 아래 땅에
  const ORC_KINDS = { stake: 1, tent: 1, orchut: 1, totem: 1, fire: 1, rack: 1, hide: 1 };
  const ORC_C = {
    hide: ['#3a2a20', '#4c3727', '#5e4530', '#71553a', '#846646'], seam: '#22170f', stitch: '#a08a62',
    bone: ['#6e6452', '#a39780', '#d4c8ac'], paint: '#8a2a22', rope: ['#5e5038', '#8a7a5a'], line: '#1a120e'
  };
  function orcPix(B, px, py, X, Y) {
    const K = ORC_C, L = HUT_C.log, line = c3(K.line), W = B.w * P, H = B.h * P, v = B.v | 0;
    const ground = () => (B.kind === 'stake' ? texture(GRASS, 2, X, Y) : texture(DIRT, 2, X, Y));
    const shadow = (c, k = 0.66) => mul(c, k);
    if (B.kind === 'stake') {
      // 통나무 둘~셋 — 자리마다 폭 4~7 · 꼭대기 높이가 다름. 밑동에 그림자, 허리에 밧줄
      let x0 = -Math.floor(hash(B.x0, B.y0, 700) * 3), i = 0;
      while (x0 < W) {
        const w = 4 + Math.floor(hash(B.x0 * 5 + i, B.y0, 701) * 4), top = 1 + Math.floor(hash(B.x0 + i, B.y0 * 3, 702) * 5);
        if (px >= x0 && px < x0 + w) {
          const lx = px - x0, mid = (w - 1) / 2, tip = top + Math.ceil(mid);
          if (py < top) return ground();
          if (py < tip && Math.abs(lx - mid) > (py - top) + 0.5) return py > top + 1 && lx > mid ? shadow(ground(), 0.8) : ground();   // 뾰족한 끝
          if (py >= 14) return py === 15 ? shadow(ground(), 0.6) : c3(L[0]);                          // 밑동 · 땅 그늘
          if (lx === 0 || lx === w - 1) return line;
          const rope = 8 + (hash(B.x0, B.y0, 703) < 0.5 ? 0 : 1);
          if (py === rope || py === rope + 1) return c3(K.rope[py === rope ? 1 : 0]);
          let k = lx === 1 ? 4 : lx >= w - 2 ? 1 : 2;
          if (py < tip) k = Math.min(4, k + 1);                                                       // 깎은 끝 — 밝은 속살
          if (k === 2 && vnoise(px * 0.5, py * 0.3, 704 + i) > 0.64) k = 3;
          return mul(c3(L[k]), 0.95 - (py / 16) * 0.12);
        }
        x0 += w; i++;
      }
      return ground();
    }
    if (B.kind === 'tent') {
      // 가죽 천막 — 앞에서 본 세모, 꼭대기에 엇갈린 장대, 가운데 아래 벌어진 입구
      const ax = W / 2 - 0.5 + (hash(v, 0, 705) < 0.5 ? -1 : 1), ay = 4, by = H - 3, hw = W / 2 - 2;
      const half = y => (y - ay) / (by - ay) * hw;
      for (const s of [-1, 1]) {                                                                       // 장대 — 꼭대기 위로 엇갈려 삐죽
        const t = py - 0, xx = ax + s * (4 - t * 0.9);
        if (py < ay + 2 && Math.abs(px - xx) < 0.7) return c3(L[s < 0 ? 3 : 1]);
      }
      const dx = px - ax, hh = half(py);
      if (py >= ay && py <= by && Math.abs(dx) <= hh + 0.5) {
        if (Math.abs(dx) > hh - 0.5 || py === by) return line;
        const door = (by - py) < 13 && Math.abs(dx) < (13 - (by - py)) * 0.42;
        if (door) return Math.abs(dx) > (13 - (by - py)) * 0.42 - 1 ? c3(K.hide[4]) : c3('#120c09');   // 입구 — 젖힌 가죽 끝 · 안의 어둠
        let c = stones(X, Y, 9, 706 + v, [K.hide[2], K.hide[1], K.hide[3]], K.seam);
        if (c[0] === c3(K.seam)[0] && hash(X, Y, 707) < 0.35) c = c3(K.stitch);                     // 기운 자국
        c = mul(c, dx < 0 ? 1.08 - (py - ay) / (by - ay) * 0.1 : 0.78);                            // 왼쪽 빛 · 오른쪽 그늘
        return c;
      }
      if (py > by - 4 && py <= by + 2 && px > ax && px < ax + hw + 4) return shadow(ground());     // 오른쪽 아래 그림자
      return ground();
    }
    if (B.kind === 'orchut') {
      // 족장 움막 — 둥근 가죽 지붕(조각 가죽 · 붉은 전쟁 칠), 꼭대기 연기 구멍의 장대, 문 양옆 엄니 둘, 문 위 짐승 해골
      const cx = W / 2 - 0.5, cy = H - 6, rx = W / 2 - 3, ry = H - 9, dx = px - cx, dy = py - cy;
      const r = Math.hypot(dx / rx, dy / ry);
      if (py < 7 && py >= 0) for (const s of [-1, 0.4, 1.3]) {                                       // 장대 — 저마다 기울기가 다름
        const xx = cx + s * 3 + (7 - py) * s * 0.5;
        if (Math.abs(px - xx) < 0.7) return c3(L[s < 0 ? 3 : 1]);
      }
      // 엄니 — 문 양옆에서 위로 휘어 오름
      for (const s of [-1, 1]) {
        const t = (H - 2 - py) / 18;
        if (t >= 0 && t <= 1) { const xx = cx + s * (10 + Math.sin(t * 2.4) * 5); if (Math.abs(px - xx) < 1.6 - t) return c3(K.bone[Math.abs(px - xx) < 0.5 ? 2 : s < 0 ? 1 : 0]); }
      }
      if (r < 1 && py <= H - 3) {
        if (r > 0.96 || py === H - 3) return line;
        const ddx = Math.abs(dx);
        if (py >= H - 14 && ddx < 5.5 - Math.max(0, H - 11 - py) * 0.6) return ddx > 4.5 - Math.max(0, H - 11 - py) * 0.6 ? c3(K.hide[4]) : c3('#0e0907');   // 문
        // 해골 — 문 위
        const sx = dx, sy = py - (H - 19);
        if (Math.hypot(sx, sy * 1.15) < 3.6) return (Math.abs(Math.abs(sx) - 1.4) < 0.8 && sy > -1.5 && sy < 0.5) ? c3('#120c09') : sx < 0 ? c3(K.bone[2]) : c3(K.bone[1]);
        if (sy >= 3 && sy < 5 && Math.abs(sx) < 2.2) return (Math.round(sx) & 1) && sy === 4 ? c3('#120c09') : c3(K.bone[1]);
        if (sy > -3 && sy < 1 && Math.abs(sx) > 3.4 && Math.abs(sx) < 6 - (sy + 3) * 0.6) return c3(K.bone[0]);   // 뿔
        let c = stones(X, Y, 11, 708, [K.hide[2], K.hide[1], K.hide[3]], K.seam);
        if (c[0] === c3(K.seam)[0] && hash(X, Y, 709) < 0.35) c = c3(K.stitch);
        const lit = (-dx / rx) * 0.5 + (-dy / ry) * 0.5;                                            // 둥근 지붕 — 왼쪽 위가 밝음
        c = mul(c, 0.82 + lit * 0.3);
        const band = py - (H - 26) - Math.round(Math.sin(px * 0.35 + 1) * 1.5);                      // 붉은 전쟁 칠 — 물결 띠, 군데군데 벗겨짐
        if ((band === 0 || band === 1) && fbm(X * 0.2, Y * 0.2, 710) > 0.42) c = mix(c, c3(K.paint), 0.75);
        return c;
      }
      if (py >= H - 4 && px > cx && px < cx + rx + 5) return shadow(ground());
      return ground();
    }
    if (B.kind === 'totem') {
      // 토템 — 깎은 기둥에 얼굴 둘(붉은 칠 눈), 꼭대기에 뿔 달린 해골, 오른쪽 아래 그림자
      const dx = px - 7.5;
      if (py < 5) {
        if (Math.hypot(dx, py - 2.5) < 2.6) return Math.abs(Math.abs(dx) - 1) < 0.6 && py === 2 ? c3('#120c09') : dx < 0 ? c3(K.bone[2]) : c3(K.bone[1]);
        if (py < 3 && Math.abs(dx) > 2.4 && Math.abs(dx) < 5 - py) return c3(K.bone[0]);
        return ground();
      }
      if (Math.abs(dx) < 2.5 && py < 15) {
        if (Math.abs(dx) > 1.8) return line;
        if ((py === 7 || py === 11) && Math.abs(dx) < 1.2) return c3(K.paint);                      // 눈
        if (py === 9 || py === 13) return c3(L[0]);                                                 // 입 · 마디
        return c3(L[dx < 0 ? 4 : dx < 1 ? 2 : 1]);
      }
      if (py >= 13 && dx > 1 && dx < 6) return shadow(ground());
      return ground();
    }
    if (B.kind === 'fire') {
      // 모닥불 — 돌 둘레(돌마다 크기가 다름) · 엇갈린 장작 · 불꽃 (가운데가 밝음)
      const dx = px - 7.5, dy = py - 10.5, rr = Math.hypot(dx / 6.5, dy / 4);
      if (rr < 1 && rr > 0.68) return stones(X * 1.4, Y * 1.4, 4, 711, HUT_C.stone, HUT_C.mortar);
      const fl = 9 - Math.abs(dx) * 1.6 + (hash(px, 0, 712) - 0.5) * 3;
      if (Math.abs(dx) < 4 && py >= 10.5 - fl && py < 11) return c3(py > 9 - Math.abs(dx) * 0.3 ? '#e0702a' : Math.abs(dx) < 1.5 && py > 4 ? '#ffd070' : '#ffb040');
      if (rr <= 0.68) return c3(Math.abs(dx - dy) < 1 || Math.abs(dx + dy) < 1 ? L[1] : '#2a1a12');   // 장작 · 재
      const g = ground(), gl = Math.hypot(dx, dy * 1.3);
      return gl < 9 ? mix(g, c3('#ff9a40'), 0.25 * (1 - gl / 9)) : g;
    }
    if (B.kind === 'rack' || B.kind === 'hide') {
      // 걸이 — 기둥 둘 · 가로대. rack 엔 거친 도끼 · 창이 기대 있고, hide 엔 펼친 가죽이 묶여 있음
      const posts = [3, W - 4];
      for (const q of posts) if (Math.abs(px - q) < 1.5 && py >= 2 && py < 15) return Math.abs(px - q) > 0.6 ? line : c3(L[px < q ? 3 : 1]);
      if (py >= 3 && py <= 4 && px > 2 && px < W - 3) return c3(L[py === 3 ? 3 : 1]);
      if (B.kind === 'hide') {
        if (px > 5 && px < W - 6 && py > 5 && py < 14 - Math.abs(Math.sin(px * 0.6)) * 2) {
          if ((px === 6 || px === W - 7) && (py & 1)) return c3(K.rope[1]);
          return mul(c3(K.hide[(hash(px >> 2, py >> 2, 713) * 3 + 1) | 0]), px < W / 2 ? 1.05 : 0.85);
        }
      } else {
        const items = [[7, 0.25, 'axe'], [13, -0.2, 'spear'], [20, 0.15, 'axe'], [25, -0.1, 'spear']];
        for (const [x0, lean, kind] of items) {
          const xx = x0 + (py - 14) * lean;
          if (py >= 2 && py < 15 && Math.abs(px - xx) < 0.6) return c3(L[3]);
          if (kind === 'axe' && py >= 3 && py <= 7 && px > xx && px < xx + 4 - Math.abs(py - 5) * 0.6) return c3(px > xx + 2 ? '#8a8a90' : '#5a5a60');
          if (kind === 'spear' && py >= 0 && py < 3 && Math.abs(px - xx) < (py + 0.5) * 0.5) return c3('#9a9aa0');
        }
      }
      if (py >= 14 && px > 3) return shadow(ground(), 0.75);
      return ground();
    }
    return ground();
  }
  function hutGeom(B) {
    const pw = B.w * P, ph = B.h * P, d0 = (B.door.x - B.x0) * P, d1 = d0 + B.door.w * P;
    const G = { pw, ph, d0, d1, WL: 10, WR: pw - 10, wTop: ph - 34, fTop: ph - 7, cx: pw / 2, logs: [] };
    for (let y = G.wTop, i = 0; y < G.fTop; i++) {                                 // 통나무 — 굵기 5~7점, 양끝이 저마다 다르게 삐죽
      const h = Math.min(G.fTop - y, 5 + Math.floor(hash(i, 0, 610) * 3));
      G.logs.push({ y0: y, h, eL: 2 + Math.floor(hash(i, 1, 611) * 4), eR: 2 + Math.floor(hash(i, 2, 612) * 4), i });
      y += h;
    }
    G.top = x => 12 + Math.round(((x - G.cx) / (pw / 2 - 3)) ** 4 * 16 + (vnoise(x * 0.2, 0, 613) - 0.5) * 2);   // 지붕 위 끝 — 가운데는 판판, 양끝으로 둥글게
    G.eave = x => G.wTop + 2 + Math.round((vnoise(x * 0.11, 3, 614) - 0.5) * 3 + (hash(x, 0, 609) < 0.35 ? 1 : 0) - (hash(x, 1, 609) < 0.15 ? 1 : 0) + Math.abs((x - G.cx) / (pw / 2)) ** 3 * 3);   // 처마 — 짚 가닥마다 들쭉날쭉, 양끝이 처짐
    G.roof = (x, y) => x >= 3 && x < pw - 3 && y >= G.top(x) && y <= G.eave(x);
    return G;
  }
  function hutPix(G, px, py, X, Y) {
    const { pw, ph, d0, d1, WL, WR, wTop, fTop, cx } = G, K = HUT_C, line = c3(K.line);
    // 굴뚝 — 지붕 오른쪽 뒤, 살짝 기울어진 돌 굴뚝 (지붕 앞면이 아랫부분을 가림)
    const lean = Math.round((16 - py) * 0.18), chx0 = 78 + lean, chx1 = chx0 + 9;
    if (py < 17 && px >= chx0 && px < chx1 && !(G.roof(px, py) && py > G.top(px) + 1)) {
      if (px === chx0 || px === chx1 - 1 || py === 0) return line;
      if (py < 3) return py === 1 ? c3('#6a655c') : c3('#14100e');                 // 굴뚝 머리 · 안의 그을음
      const c = stones(X * 1.3, Y * 1.3, 5, 621, K.stone, K.mortar);
      return mul(c, px > chx0 + 5 ? 0.78 : 1);
    }
    // 지붕
    if (G.roof(px, py)) {
      const t0 = G.top(px), eb = G.eave(px), t = (py - t0) / Math.max(1, eb - t0);
      const edge = !G.roof(px - 1, py) || !G.roof(px + 1, py) || !G.roof(px, py - 1) || !G.roof(px, py + 1);
      if (edge) return line;
      if (py >= eb - 1) return c3(K.thatch[0]);                                     // 처마 밑면 — 짚 끝의 그늘
      let lum = 0.16 - t * 0.12 - (px - cx) / pw * 0.22;                            // 왼쪽 위가 밝음 (층 안의 밝기에 더함)
      const end = Math.min(px - 3, pw - 4 - px);
      if (end < 10) lum += px < cx ? 0.1 * (1 - end / 10) : -0.22 * (1 - end / 10); // 둥근 양끝 — 왼쪽은 빛, 오른쪽은 그늘
      const k = py - t0;
      if (k < 4) {                                                                  // 용마루 — 묶은 짚 (묶은 자리가 들쭉날쭉)
        const tie = hash(px >> 1, 0, 618) < 0.22;
        return c3(K.thatch[tie ? 0 : k === 1 ? 3 : k === 3 ? 1 : 2]);
      }
      // 짚 층 — 층마다 두께가 다르고(5~8점), 층 끝은 짚 가닥마다 길이가 달라 아래층에 들쭉날쭉 드리움.
      // 위층 끝 바로 밑은 그늘, 층 아래로 갈수록 밝아져 짚 끝이 빛을 받음. 가닥마다 밝고 어두운 세로 결
      let s0 = 4, ci = 0, q = 0, len = 1;
      for (; ci < 12; ci++) {
        const hgt = 5 + Math.floor(hash(ci, 1, 615) * 4), fr = Math.floor(hash(px, ci, 616) * 3.2) - (hash(px >> 1, ci, 617) < 0.3 ? 1 : 0);
        if (k < s0 + hgt + fr) { q = k - s0; len = hgt + fr; break; }
        s0 += hgt;
      }
      lum += q < 1 ? 0.12 : q < 2 ? 0.3 : 0.48 + (q / len) * 0.3;
      const st = hash(px, ci, 619);
      if (st < 0.22) lum -= 0.16; else if (st > 0.86) lum += 0.12;               // 짚 가닥
      if (q >= len - 1 && hash(px, ci, 620) < 0.5) lum += 0.1;                     // 짚 끝
      let c = c3(K.thatch[Math.max(0, Math.min(4, Math.floor(lum * 5)))]);
      // 이끼 — 층 위에 얹힌 작은 덩이 (위쪽 · 왼쪽에 더). 덩이 위 끝은 밝고 아래 끝은 그늘
      const moss = (x, y) => fbm(x * 0.13, y * 0.13, 621) + (1 - t) * 0.1 > 0.66;
      if (moss(X, Y)) c = c3(K.moss[!moss(X, Y - 1) ? 2 : !moss(X, Y + 1) ? 0 : 1]);
      else if (moss(X, Y - 1) && hash(px, py, 622) < 0.6) c = mul(c, 0.7);          // 이끼 밑 그늘
      return c;
    }
    const grassOr = () => mul(stones(X, Y, 5, 626, K.stone, K.mortar), 0.92);
    const grass = () => {
      let g = texture(GRASS, 2, X, Y);
      if (py > wTop && px >= WR && px < WR + 9 - (py - wTop) * 0.1) g = mul(g, 0.68);   // 오른쪽으로 지는 그림자
      if (py >= ph - 3 && px >= WL - 6 && px < WR + 6) g = mul(g, 0.8);
      return g;
    };
    // 통나무 끝 — 벽 양옆으로 삐죽 (나이테)
    const lg = G.logs.find(l => py >= l.y0 && py < l.y0 + l.h);
    if (lg && ((px < WL && px >= WL - lg.eL) || (px >= WR && px < WR + lg.eR))) {
      const left = px < WL, r = lg.h / 2, ex = left ? WL - lg.eL : WR + lg.eR - 1, dx = px + 0.5 - (ex + (left ? r * 0.6 : -r * 0.6) + 0.5), dy = py + 0.5 - (lg.y0 + r);
      const d = Math.hypot(dx * 1.4, dy);
      if (d > r - 0.4 || dy > r - 1) return line;
      if (px === ex) return d < r * 0.45 ? c3(K.end[0]) : c3(K.end[d < r * 0.75 ? 2 : 1]);   // 자른 면
      return c3(K.log[dy < -r + 1.5 ? 4 : dy > r - 2 ? 1 : 3 - (left ? 0 : 1)]);
    }
    if (px < WL || px >= WR || py < wTop) return grass();
    // 벽 테두리
    if (px === WL || px === WR - 1) return line;
    const shade = py < G.eave(px) + 3 + (hash(px, 0, 623) < 0.4 ? 1 : 0) ? 0.55 : 1;   // 처마 밑 그늘 — 짚 끝을 따라 들쭉날쭉
    // 문 — 아치 나무 문, 오른쪽이 살짝 열려 초록빛
    const dc = (d0 + d1) / 2, aTop = wTop + 9, acy = aTop + 7, dx = px + 0.5 - dc;
    const inD = py >= acy ? Math.abs(dx) < 6.5 : Math.hypot(dx, py + 0.5 - acy) < 6.5;
    const inF = py >= acy ? Math.abs(dx) < 8.5 : Math.hypot(dx, py + 0.5 - acy) < 8.5;
    if (inD) {
      const ix = Math.floor(dx + 6.5);
      if (ix >= 11) return mix(c3(K.glow[ix === 12 ? 2 : 1]), c3('#0e140c'), (ph - py) / 40);   // 열린 틈
      if (ix === 4 || ix === 8) return c3(K.door[0]);                              // 널 사이 (폭 4 · 4 · 3)
      if (py === acy + 3 || py === acy + 4 || py === ph - 6 || py === ph - 5) return c3(K.iron[py === acy + 3 || py === ph - 6 ? 1 : 0]);   // 쇠띠
      if (ix === 9 && (py === acy + 9 || py === acy + 11)) return c3(K.iron[1]);  // 문고리
      if (ix === 10 && py === acy + 10) return c3(K.iron[1]);
      let c = c3(K.door[1 + (hash(ix > 8 ? 2 : ix > 4 ? 1 : 0, 0, 624) < 0.5 ? 1 : 0)]);
      if (vnoise(px * 0.4, py * 0.25, 625) > 0.68) c = mul(c, 0.82);               // 나뭇결
      return mul(c, py < acy - 2 ? 0.7 : 1);
    }
    if (inF) return (py >= acy ? Math.abs(dx) >= 7.5 : Math.hypot(dx, py + 0.5 - acy) >= 7.5) ? line : mul(c3(K.log[1]), shade);   // 문틀
    // 빗자루 — 문 왼쪽 벽에 비스듬히 기댐 (자루 · 묶은 끈 · 땅에 닿는 짚 솔)
    const bTop = wTop + 5, bBot = ph - 9, bxs = d0 - 4 - (py - bTop) * 0.2;
    if (py >= bTop && py < bBot) { const d = px + 0.5 - bxs; if (d > -1 && d <= 0) return c3('#a07e52'); if (d > 0 && d <= 1) return c3('#5e4630'); }
    if (py >= bBot && py < ph) {
      const k = py - bBot, bc = d0 - 4 - (bBot - bTop) * 0.2, d = px + 0.5 - bc, half = 1.2 + k * 0.5;
      if (Math.abs(d) < half) return k === 0 ? c3('#3a2c1a') : k === ph - bBot - 1 && hash(px, 0, 627) < 0.5 ? mul(grassOr(), 1) : c3(hash(px, 0, 627) < 0.35 ? '#6e5c36' : hash(px, 1, 627) < 0.5 ? '#8e7a48' : '#a8925a');
    }
    // 주춧돌
    if (py >= fTop) return py === fTop ? line : mul(stones(X, Y, 5, 626, K.stone, K.mortar), 0.92);
    // 둥근 창 (왼쪽) — 초록 불빛, 십자 살
    const wx = WL + 16, wy = wTop + 13, rw = Math.hypot(px + 0.5 - wx, py + 0.5 - wy);
    if (rw < 6.5) {
      if (rw >= 5.5) return line;
      if (rw >= 4.3) return c3(K.log[rw > 5 ? 1 : 3]);
      if (Math.abs(px + 0.5 - wx) < 0.6 || Math.abs(py + 0.5 - wy) < 0.6) return c3(K.door[0]);
      return c3(rw < 2 ? K.glow[2] : K.glow[(px < wx && py < wy) ? 1 : 0]);
    }
    // 덧문 창 (오른쪽) — 네모 창, 오른쪽 덧문이 열림. 창턱 아래 약병 하나
    const qx0 = WR - 27, qx1 = qx0 + 10, qy0 = wTop + 8, qy1 = qy0 + 10;
    if (px >= qx0 - 1 && px <= qx1 + 5 && py >= qy0 - 1 && py <= qy1) {
      if (px > qx1) return px === qx1 + 5 || py === qy0 - 1 || py === qy1 ? line : c3(K.door[(px - qx1) % 3 === 0 ? 0 : 2]);   // 열린 덧문
      if (px === qx0 - 1 || px === qx1 || py === qy0 - 1 || py === qy1) return line;
      if (py === qy1 - 1) return c3(K.log[4]);                                     // 창턱
      if (px === qx0 + 4 || py === qy0 + 4) return c3(K.door[0]);
      if (px >= qx0 + 6 && px <= qx0 + 8 && py >= qy1 - 5 && py < qy1 - 1) return py === qy1 - 5 ? c3('#c8b090') : c3('#6a3a8a');   // 창가의 약병
      return c3(K.glow[py < qy0 + 4 ? 1 : 0]);
    }
    // 초록 등 — 문 오른쪽 처마에 매달림
    const lx = d1 + 4;
    if (px === lx + 1 && py >= G.eave(lx + 1) && py < wTop + 9) return c3(K.iron[0]);
    if (px >= lx && px <= lx + 3 && py >= wTop + 9 && py <= wTop + 14) {
      if (py === wTop + 9 || py === wTop + 14 || px === lx || px === lx + 3) return c3(K.iron[py === wTop + 9 ? 1 : 0]);
      return c3(K.glow[py === wTop + 11 ? 2 : 1]);
    }
    // 약초 다발 — 오른쪽 처마 끝에 매달림
    const hx = WR - 6;
    if (Math.abs(px - hx) <= 2 && py >= G.eave(hx) && py < G.eave(hx) + 9) {
      const k = py - G.eave(hx);
      if (k < 3) return px === hx ? c3('#8a7a5a') : logPix();
      if (Math.abs(px - hx) <= (k < 6 ? 1 : 2) && hash(px, py, 628) < 0.85) return c3(hash(px, py, 629) < 0.5 ? '#5a6a32' : '#7a7a3a');
    }
    return logPix();
    // 통나무 벽면 — 위는 빛, 아래는 그늘, 맨 아래 이음 줄 (이끼 · 진흙이 군데군데), 나뭇결 · 옹이. 둥근 창 아래로 초록빛이 번짐
    function logPix() {
      if (!lg) return line;
      const ly = py - lg.y0;
      let c;
      if (ly === lg.h - 1) c = hash(px >> 2, lg.i, 630) < 0.18 ? c3(K.moss[0]) : c3(K.seam);
      else {
        let k = ly === 0 ? 4 : ly === 1 ? 3 : ly >= lg.h - 2 ? 1 : 2;
        if (k === 2 && vnoise(px * 0.18, lg.i * 3.7, 631) > 0.62) k = 3;            // 나뭇결
        if (k >= 2 && hash(px >> 1, lg.i, 632) < 0.025) k = 0;                     // 옹이
        c = c3(K.log[k]);
      }
      c = mul(c, (1 - (px - WL) / (WR - WL) * 0.18) * shade);
      const gl = Math.hypot(px - wx, (py - wy - 4) * 0.8);
      if (gl < 11 && py > wy) c = mix(c, c3(K.glow[0]), 0.22 * (1 - gl / 11));
      return c;
    }
  }

  // 건물 칸의 점 — 덩어리를 그릴 때 그 자리만 (한 채를 한꺼번에 그리면 120ms 쯤 멈칫해서, 땅처럼 덩어리마다 나눠 그림)
  function buildingPixel(A, e, X, Y) {
    const B = A.buildings[e.b];
    if (STORE_KINDS[B.kind]) return storeProp(B, X - B.x0 * P, Y - B.y0 * P, X, Y);   // 가게 안의 가구
    if (ORC_KINDS[B.kind]) return orcPix(B, X - B.x0 * P, Y - B.y0 * P, X, Y);   // 오크 부락
    if (B.kind) return cityBuilding(B, X - B.x0 * P, Y - B.y0 * P, X, Y);   // 도시의 건물
    if (B.door && B.door.name === 'witchhut') { if (!B.G) B.G = hutGeom(B); return hutPix(B.G, X - B.x0 * P, Y - B.y0 * P, X, Y); }   // 숲의 마녀의 오두막
    if (!B.G) B.G = castleGeom(B);
    return castlePix(B.G, X - B.x0 * P, Y - B.y0 * P, X, Y);
  }

  // ---------- 가게 안 (지도 속성 store — 헌터백화점 1층, tools/map-gen.js 의 DEPT) ----------
  // 바깥 백화점과 같은 빛깔 — 상아색 벽 · 금테 · 포도주색, 거기에 청록 빛줄. 위 벽(세 칸 높이)은 지도 속성 wall 의 구역마다 다르게:
  //   rack 무기 진열 벽 · esc 2층으로 가는 에스컬레이터 · mats 재료 창구(선반에 재료가 놓인 창 셋). 가구(blds 의 kind)는 storeProp 이 칸 안에 납작하게 (윗면 + 앞면)
  const STC_DEPT = {
    ivory: ['#ece6d8', '#e4ddcd', '#f3eee2', '#d8d0bf'], seam: '#c9c0ad', dark: ['#3b3542', '#342f3b', '#443d4c', '#2a2630'],
    carpet: ['#6f1a26', '#661722', '#7a2030', '#59131d'],
    gold: '#c9a24a', goldDim: '#8a6d2c', wine: '#6f1a26', red: '#b0202e', glow: '#62e6ee', line: '#12141a', wall: '#ebe4d4', velvet: '#2a1c26',
    steel: ['#dfe6ee', '#aeb8c4', '#ffffff', '#7d8794']
  };
  // 헌터 협회 안 (지도 속성 theme 'hq') — 바깥 협회와 같은 빛깔: 흰 돌 · 남색 깔개 · 은빛 테 · 청록 빛줄. 이름은 그대로 두고 값만 바꿔 씁니다 (gold 자리 = 은빛)
  const STC_HQ = {
    ivory: ['#dfe6ee', '#d6dee8', '#e8eef4', '#c9d2de'], seam: '#b4bfcd', dark: ['#1d2533', '#19202c', '#222b3a', '#141a24'],
    carpet: ['#1f3a61', '#1b3456', '#24426c', '#172d4b'],
    gold: '#a9e4f2', goldDim: '#5b8aa0', wine: '#1f3a61', red: '#2c7fb8', glow: '#62e6ee', line: '#0b0f16', wall: '#dfe6ee', velvet: '#16263f',
    steel: ['#dfe6ee', '#aeb8c4', '#ffffff', '#7d8794']
  };
  // 내 길드 안 (지도 속성 theme 'guild') — 단계마다: 1 허름(잿빛 · 바랜 깔개) · 2 치움 · 3 간판 단 사무실(따뜻한 나무 · 초록 깔개) · 4 번듯(흰 돌 · 청록) · 5 가장 멋짐(흰 대리석 · 금 · 짙은 청록)
  const STC_GUILD = [
    { ivory: ['#9c978c', '#938e83', '#a5a095', '#827d72'], seam: '#7a756b', dark: ['#3a3733', '#34312d', '#403d38', '#2c2a26'], carpet: ['#5a4a3e', '#524337', '#614f42', '#4a3d32'],
      gold: '#8f897c', goldDim: '#6a655a', wine: '#5a4a3e', red: '#7a4a3a', glow: '#8aa0a0', line: '#1c1b18', wall: '#a8a294', velvet: '#2e2a26', steel: ['#b8b4ac', '#8f8b84', '#d6d2ca', '#6a675f'] },
    { ivory: ['#c9c4b8', '#c0bbaf', '#d2cdc1', '#b0ab9f'], seam: '#a6a195', dark: ['#3b3a3f', '#35343a', '#424147', '#2c2b30'], carpet: ['#4a5a66', '#43525d', '#52636f', '#3b4852'],
      gold: '#b8b2a4', goldDim: '#7f7a6e', wine: '#4a5a66', red: '#6a7a86', glow: '#9fd8dc', line: '#16161a', wall: '#d6d0c2', velvet: '#2a2e34', steel: ['#dfe6ee', '#aeb8c4', '#ffffff', '#7d8794'] },
    { ivory: ['#d8c6a4', '#cfbd9b', '#e0cfae', '#bfae8c'], seam: '#b29f7c', dark: ['#3f3326', '#382d21', '#47392b', '#30271c'], carpet: ['#2f5a3a', '#2a5234', '#356541', '#244a2e'],
      gold: '#c9a24a', goldDim: '#8a6d2c', wine: '#2f5a3a', red: '#b0402e', glow: '#7fe3b0', line: '#14120e', wall: '#e8dcc2', velvet: '#2a2218', steel: ['#dfe6ee', '#aeb8c4', '#ffffff', '#7d8794'] },
    { ivory: ['#dfe6ee', '#d6dee8', '#e8eef4', '#c9d2de'], seam: '#b4bfcd', dark: ['#1d2533', '#19202c', '#222b3a', '#141a24'], carpet: ['#1d4a52', '#1a434a', '#22545d', '#163b41'],
      gold: '#a9e4f2', goldDim: '#5b8aa0', wine: '#1d4a52', red: '#2c8f98', glow: '#62e6ee', line: '#0b0f16', wall: '#e2e8ee', velvet: '#13262a', steel: ['#dfe6ee', '#aeb8c4', '#ffffff', '#7d8794'] },
    { ivory: ['#f4f1ea', '#ece8df', '#faf8f2', '#dcd6c8'], seam: '#c9c0ad', dark: ['#132a2e', '#102428', '#173236', '#0c1d20'], carpet: ['#0f4a4f', '#0d4247', '#125459', '#0a3a3e'],
      gold: '#e0b850', goldDim: '#9a7a2c', wine: '#0f4a4f', red: '#c9a24a', glow: '#7ff0f4', line: '#0b0f12', wall: '#f6f2e8', velvet: '#0e2426', steel: ['#fff7dc', '#e0c870', '#ffffff', '#9a7a2c'] }
  ];
  // 우리 집 (theme 'home') — 나무 바닥(plank) · 크림빛 벽지 · 해진 자줏빛 깔개 · 바랜 놋쇠 테
  const STC_HOME = {
    plank: true, ivory: ['#b98a5a', '#ad7f50', '#c49463', '#9a7046'], seam: '#7a5634', dark: ['#3a2c22', '#33261d', '#423226', '#2a2018'],
    carpet: ['#7a4a5a', '#704352', '#845264', '#623a48'], gold: '#c8b48a', goldDim: '#8a7a5a', wine: '#7a4a5a', red: '#c0504a', glow: '#ffd98a',
    line: '#1a140f', wall: '#e6dcc4', velvet: '#2a2018', steel: ['#e8e4dc', '#b8b2a6', '#ffffff', '#7a7468']
  };
  // 암시장 (theme 'bm') — 젖은 콘크리트 바닥 · 어둑한 벽 · 자줏빛 등
  const STC_BM = {
    ivory: ['#4a4650', '#44404a', '#524e58', '#3c3842'], seam: '#2e2b33', dark: ['#1e1a22', '#1a161e', '#241f28', '#141016'],
    carpet: ['#3a2440', '#34203a', '#42284a', '#2c1a32'], gold: '#9a86b0', goldDim: '#5a4a6a', wine: '#3a2440', red: '#a04a6a', glow: '#c08aff',
    line: '#0e0c10', wall: '#6a6470', velvet: '#1a1420', steel: ['#c8c4cc', '#9a94a2', '#e8e4ee', '#5e5866']
  };
  // 새 집 (theme 'home2') — 밝은 나무 마루 · 흰 벽 · 짙은 남색 깔개 · 금빛 테
  const STC_HOME2 = {
    plank: true, ivory: ['#d9b98a', '#cfae7e', '#e2c497', '#c09e70'], seam: '#9a7a52', dark: ['#2a2f3a', '#252a34', '#30364a', '#1e222c'],
    carpet: ['#2c3a5a', '#283452', '#324266', '#22304a'], gold: '#e0c070', goldDim: '#9a8048', wine: '#2c3a5a', red: '#c05a4a', glow: '#ffe0a0',
    line: '#14161c', wall: '#f2efe8', velvet: '#1e222c', steel: ['#eef0f4', '#c4c8d0', '#ffffff', '#8a909c']
  };
  // 새 집 아파트 (미래 도시 오른쪽 빈터) — 따뜻한 베이지 유리 · 금빛 띠
  const APT_TONE = { glass: '#2a2f3a', glass2: '#3c4252', accent: '#f0c890', light: '#fff0d0', roof: '#cfc6b4' };
  // 게이트 안 (theme 'gate') — 검푸른 바위 바닥 · 보랏빛 균열 빛
  const STC_GATE = {
    ivory: ['#3a3448', '#342e42', '#423a52', '#2c2638'], seam: '#221c2c', dark: ['#18141f', '#14111b', '#1d1825', '#100d16'],
    carpet: ['#4a2a6a', '#42265e', '#543078', '#3a2052'], gold: '#a080d0', goldDim: '#604a80', wine: '#4a2a6a', red: '#c04aa0', glow: '#c890ff',
    line: '#0c0a10', wall: '#2a2434', velvet: '#16121c', steel: ['#b8b0c8', '#8a82a0', '#d8d0ec', '#5a5270']
  };
  // 하늘의 금 너머 (theme 'void') — 검푸른 허공 · 보랏빛 · 별빛
  const STC_VOID = {
    ivory: ['#1c1f3a', '#181b34', '#222644', '#14162c'], seam: '#0c0e1e', dark: ['#08091a', '#060716', '#0a0c20', '#040510'],
    carpet: ['#3a2a70', '#342664', '#44327e', '#2c205a'], gold: '#b8a0ff', goldDim: '#5a4a9a', wine: '#3a2a70', red: '#e06ad0', glow: '#d8c8ff',
    line: '#020208', wall: '#141630', velvet: '#0a0b1c', steel: ['#c8c8f0', '#9a9ad0', '#ececff', '#5a5a90']
  };
  // 카이로 게이트 안 (theme 'sand') — 누런 모래 바위 · 금빛
  const STC_SAND = {
    ivory: ['#8a7048', '#806640', '#967a50', '#745c38'], seam: '#5a4628', dark: ['#3a2c18', '#342814', '#40301c', '#2c2010'],
    carpet: ['#a0662a', '#965e26', '#ac7030', '#8a5420'], gold: '#f0c060', goldDim: '#a07a30', wine: '#a0662a', red: '#d0582a', glow: '#ffd890',
    line: '#1c140a', wall: '#6a5434', velvet: '#2c2010', steel: ['#e0d0b0', '#b8a888', '#f8ecd0', '#806c50']
  };
  // 광장 위기 게이트 안 (theme 'raid') — 검붉은 바위 · 타오르는 빛
  const STC_RAID = {
    ivory: ['#40282a', '#3a2426', '#4a2e30', '#321e20'], seam: '#241416', dark: ['#1c1012', '#180d0f', '#211315', '#120a0b'],
    carpet: ['#6a1e22', '#5e1a1e', '#782428', '#521618'], gold: '#e0704a', goldDim: '#80402a', wine: '#6a1e22', red: '#e04030', glow: '#ff9060',
    line: '#0e0808', wall: '#34201f', velvet: '#1a0e0f', steel: ['#c8b0a8', '#a08880', '#ecd0c8', '#6a5048']
  };
  let APT = false;                                                                 // 새 집을 샀나 — 게임이 setHome2 로 알려 줌. 그 전엔 오른쪽 빈터 그대로
  let BMO = false;                                                                 // 암시장 셔터가 올라가 있나 — 게임이 setMarket 으로 알려 줌 (회차마다 반반)
  let GLV = 0;                                                                     // 내 길드의 단계 (0 = 아직 안 삼) — 게임이 setGuild 로 알려 줌. 바뀌면 그 길드가 나오는 지도를 다시 그림
  // 마녀의 오두막 안 (theme 'witch') — 어두운 널마루 · 통나무 벽(logs) · 헝겊을 꼬아 짠 깔개(rag) · 바랜 놋쇠 · 초록 약 빛 · 자줏빛 이불
  const STC_WITCH = {
    plank: true, logs: true, rag: true, ivory: ['#4a3828', '#423220', '#54402e', '#36291b'], seam: '#1e150e', dark: ['#2a2018', '#241b14', '#30251c', '#1c150f'],
    carpet: ['#3e3a26', '#36321f', '#48442c', '#2c2919'], gold: '#7a6a42', goldDim: '#4e432a', wine: '#3e3a26', red: '#8a3a52', glow: '#7ed05a',
    line: '#140e0a', wall: '#4a3628', velvet: '#1e1610', steel: ['#c8c4b8', '#9a968a', '#e0dccf', '#6a665c'], quilt: ['#3e2a4a', '#4e365a']
  };
  let STC = STC_DEPT;                                                              // 덩어리를 그릴 때마다 그 지도의 것으로 (chunk)
  const STORE_KINDS = { counter: 1, case: 1, rope: 1, plant: 1, bench: 1, pillar: 1, kiosk: 1, desk: 1, bed: 1, fridge: 1, cauldron: 1, books: 1, shroom: 1 };
  const storeZones = (m, A) => A.storeZones || (A.storeZones = JSON.parse((m.props && m.props.wall) || '[]'));
  // 큰 상아색 판 — 서른두 점마다 줄눈, 은은한 결, 군데군데 비스듬한 윤
  function storeTile(X, Y) {
    const sx = ((X % 32) + 32) % 32, sy = ((Y % 32) + 32) % 32;
    if (sx === 0 || sy === 0) return c3(STC.seam);
    let c = shadeOf(STC.ivory, fbm(X * 0.035, Y * 0.035, 373) * 0.75 + hash(X >> 5, Y >> 5, 374) * 0.25);
    if (Math.abs(vnoise(X * 0.05, Y * 0.02, 375) - 0.5) < 0.008) c = mul(c, 0.975);   // 돌결 — 금 간 것처럼 보이지 않게 아주 옅게
    if (hash(X >> 5, Y >> 5, 376) < 0.35 && Math.abs(sx - sy) < 2 && sx > 6 && sx < 22) c = mix(c, WHITE, 0.4);
    return c;
  }
  // 나무 마루 (우리 집) — 엇갈린 널빤지, 결 · 이음매
  function plankTile(X, Y) {
    const row = Math.floor(Y / 6), off = (row * 23) % 40, bx = ((X + off) % 40 + 40) % 40;
    if (Y % 6 === 0 || bx === 0) return c3(STC.seam);
    const id = hash(Math.floor((X + off) / 40), row, 377);
    let c = shadeOf(STC.ivory, id * 0.7 + fbm(X * 0.15, Y * 0.6, 378) * 0.3);
    if (Math.abs(vnoise(X * 0.08, Y * 0.5, 379 + row) - 0.5) < 0.03) c = mul(c, 0.9);   // 나뭇결
    return c;
  }
  function storeFloor(m, e, X, Y, lx) {
    if (e.ter !== PAVE) return STC.plank ? plankTile(X, Y) : storeTile(X, Y);
    if (STC.rag) return ragRug(m, X, Y, lx);
    // 가운데 통로 — 포도주색 깔개, 양 가장자리에 금빛 줄, 안에 금빛 마름모 (문간의 깔개와 이어짐)
    const tx = Math.floor(X / P), ty = Math.floor(Y / P);
    const aisle = x => x >= 0 && x < m.w && m.tile[ty * m.w + x] === FLOOR && (m.look[ty * m.w + x] & 15) === PAVE;
    const L = !aisle(tx - 1), R = !aisle(tx + 1);
    if ((L && lx === 1) || (R && lx === P - 2)) return c3(STC.gold);
    if ((L && lx === 0) || (R && lx === P - 1)) return c3(STC.goldDim);
    let c = shadeOf(STC.carpet, fbm(X * 0.06, Y * 0.06, 371) * 0.6 + hash(X, Y, 372) * 0.4);
    if ((L && lx === 3) || (R && lx === P - 4)) return c3(STC.goldDim);
    const dx = Math.abs(((X % 32) + 32) % 32 - 16), dy = Math.abs(((Y % 32) + 32) % 32 - 16);
    if (dx + dy === 11) c = mix(c, c3(STC.gold), 0.55);
    return c;
  }
  // 나가는 문간 — 금빛 문틀 사이로 포도주색 깔개, 밖에서 드는 빛 (아래로 갈수록 밝게)
  function storeDoorway(e, X, Y, lx, ly) {
    const R = P - 1;
    if ((!e.dL && lx < 3) || (!e.dR && lx > R - 3)) { const k = !e.dL && lx < 3 ? lx : R - lx; return k === 0 ? c3(STC.line) : c3(k === 1 ? STC.gold : STC.goldDim); }
    const c = ly === 2 || ly === 12 ? c3(STC.gold) : ly < 2 ? c3(STC.dark[0]) : ((X + Y) & 3) === 0 ? c3('#7d2230') : c3(STC.wine);
    return mix(c, c3('#fff3cf'), 0.08 + ly / P * 0.45);
  }
  // 진열 벽의 무기 한 자루 — 칸 가운데가 wx = 0, 위가 wy = 0 (세로 27점). 없으면 null
  function rackWeapon(kind, wx, wy) {
    const ax = Math.abs(wx), st = c3(wx < 0 ? STC.steel[2] : wx > 0 ? STC.steel[1] : STC.steel[0]);
    if (kind === 0) {                                                               // 장검 — 긴 날 · 금빛 가드 · 손잡이
      if (wy < 18) return ax <= (wy < 2 ? 0 : 1) ? st : null;
      if (wy < 20) return ax <= 4 ? c3(STC.gold) : null;
      if (wy < 25) return ax <= 1 ? c3(wy % 2 ? '#3a2a22' : '#55402f') : null;
      return wy === 25 && ax <= 1 ? c3(STC.gold) : null;
    }
    if (kind === 1) {                                                               // 창 — 마름모 날 · 긴 자루
      if (wy < 8) return ax <= Math.min(wy, 7 - wy) * 0.7 + 0.3 ? st : null;
      if (wy === 8) return ax <= 2 ? c3(STC.gold) : null;
      return wy <= 26 && ax === 0 ? c3('#8a6a42') : null;
    }
    if (kind === 2) {                                                               // 도끼 — 자루 오른쪽에 반달 날
      if (wy >= 3 && wy <= 11 && wx >= 1 && wx <= 5 - Math.abs(wy - 7) * 0.6) return wx >= 4 - Math.abs(wy - 7) * 0.6 ? c3(STC.steel[2]) : c3(STC.steel[1]);
      if (wy >= 2 && wy <= 26 && ax === 0) return c3(wy < 13 ? '#55402f' : '#8a6a42');
      return null;
    }
    if (wy >= 5 && wy < 19) return ax <= 1 ? (ax === 0 ? c3('#e9fbfd') : c3(STC.glow)) : ax === 2 ? mix(c3(STC.velvet), c3(STC.glow), 0.35) : null;   // 빛나는 날의 단검
    if (wy === 19) return ax <= 3 ? c3('#3b3f4a') : null;
    return wy > 19 && wy < 25 && ax <= 1 ? c3('#22252c') : null;
  }
  // 헝겊 깔개 (마녀의 오두막) — 폭이 저마다 다른 가로 줄(바랜 빛깔 헝겊을 꼬아 짬), 양끝 술, 군데군데 해짐
  function ragRug(m, X, Y, lx) {
    const tx = Math.floor(X / P), ty = Math.floor(Y / P);
    const rug = x => x >= 0 && x < m.w && m.tile[ty * m.w + x] === FLOOR && (m.look[ty * m.w + x] & 15) === PAVE;
    if ((!rug(tx - 1) && lx < 2) || (!rug(tx + 1) && lx > P - 3)) return mul(plankTile(X, Y), 0.85);   // 깔개 밖 — 그늘진 마루
    if ((!rug(tx - 1) && lx === 2) || (!rug(tx + 1) && lx === P - 3)) return hash(X, Y >> 1, 640) < 0.5 ? c3('#8a7a5a') : c3('#6a5a40');   // 술
    const band = Math.floor((Y + vnoise(X * 0.05, Y * 0.02, 641) * 9) / 4.3), pal = ['#5a3a3a', '#3e4a2e', '#6a5a3a', '#4a3a52', '#3a3a30', '#704a34'];
    let c = c3(pal[Math.floor(hash(band, 0, 642) * pal.length)]);
    if (((X + band) & 1) === 0) c = mul(c, 0.86);                                   // 꼰 결
    if (fbm(X * 0.09, Y * 0.09, 643) > 0.7) c = mix(c, plankTile(X, Y), 0.5);       // 해진 곳
    return c;
  }
  // 마녀의 오두막 위 벽 — 통나무 벽에 약병 선반(potions) · 말린 약초와 해골(herbs). fy 는 벽 위에서 잰 점 (0~47)
  function witchWall(m, A, X, fy, lx) {
    const tx = Math.floor(X / P), K = HUT_C;
    if (fy < 4) return fy === 3 ? c3(STC.line) : c3(K.log[fy === 0 ? 0 : 1]);      // 서까래
    if (fy >= 44) return fy === 44 ? c3(STC.line) : c3(K.log[1]);                   // 굽도리
    const z = storeZones(m, A).find(q => tx >= q.x && tx < q.x + q.w);
    const zx = z ? X - z.x * P : 0, ZW = z ? z.w * P : 0;
    if (z && z.kind === 'potions') {
      for (const sh of [22, 39]) {
        if (fy === sh || fy === sh + 1) return zx < 2 || zx >= ZW - 2 ? wallLog() : c3(fy === sh ? '#7a5c40' : '#3e2c20');   // 선반
        if (fy === sh + 2 && zx > 2 && zx < ZW - 3 && hash(zx >> 2, sh, 644) < 0.5) return c3(STC.line);   // 선반 밑 그늘
        // 병 — 자리마다 폭 · 키 · 생김새가 다름 (둥근 플라스크 · 긴 병 · 작은 단지)
        let x = 3 + Math.floor(hash(z.x, sh, 645) * 3);
        for (let i = 0; x < ZW - 6; i++) {
          const r = hash(z.x * 7 + i, sh, 646), w = 4 + Math.floor(r * 4), hgt = 5 + Math.floor(hash(z.x * 7 + i, sh, 647) * 8);
          if (r < 0.14) { x += w + 2; continue; }                                    // 빈 자리
          const bx = zx - x, by = sh - 1 - fy;                                      // 병 안의 자리 (by 는 바닥에서 위로)
          if (bx >= 0 && bx < w && by >= 0 && by < hgt) {
            const col = ['#4f9a3a', '#6a3a8a', '#9a2e3a', '#b07a2a', '#3a6a9a', '#7ed05a'][Math.floor(hash(z.x * 7 + i, sh, 648) * 6)];
            const kind = Math.floor(hash(z.x * 7 + i, sh, 649) * 3), mid = (w - 1) / 2, neck = kind === 1 ? Math.max(3, hgt * 0.45) : kind === 0 ? hgt * 0.4 : 1.5;
            const bodyH = hgt - neck, inBody = by < bodyH && (kind === 0 ? Math.hypot((bx - mid) / (w / 2), (by - bodyH / 2) / (bodyH / 2)) < 1.05 : true);
            const inNeck = by >= bodyH && Math.abs(bx - mid) < (kind === 2 ? w / 2 : 1);
            if (inBody || inNeck) {
              if (by >= hgt - 1 && kind !== 2) return c3('#a08a62');                   // 코르크
              if (inNeck && kind === 2) return c3('#5a4a3a');                           // 단지 뚜껑
              let c = c3(col);
              if (bx <= mid - 1 && by > 1 && by < bodyH - 1) c = mix(c, WHITE, 0.35);  // 유리 윤
              else if (bx >= w - 1 || by === 0) c = mul(c, 0.6);
              if (inNeck) c = mix(c3('#8a9a8a'), c, 0.3);                               // 빈 목 — 흐린 유리
              return c;
            }
          }
          x += w + 1 + Math.floor(hash(i, z.x, 650) * 3);
        }
      }
      return wallLog();
    }
    if (z && z.kind === 'herbs') {
      if (fy === 7 && zx >= 2 && zx < ZW - 2) return c3('#5e4630');                 // 막대
      if (fy === 6 && (zx === 2 || zx === ZW - 3)) return c3(K.iron[1]);
      // 약초 다발 — 자리 · 길이 · 빛깔이 저마다 (끈 · 아래로 퍼지는 잎줄기)
      for (let i = 0, x = 4; x < ZW - 4; i++) {
        const len = 9 + Math.floor(hash(i, z.x, 651) * 9), hw = 1.5 + hash(i, z.x, 652) * 2, col = ['#4a5a2e', '#6a6a34', '#5a3a2a', '#3e5a3a', '#7a6a4a'][Math.floor(hash(i, z.x, 653) * 5)];
        const k = fy - 8, ax = Math.abs(zx - x);
        if (k >= 0 && k < 2 && ax < 1) return c3('#a08a62');
        if (k >= 2 && k < len && ax <= 0.6 + (k - 2) / len * hw && hash(zx, fy, 654 + i) < 0.85) return hash(zx, fy, 655) < 0.3 ? mul(c3(col), 0.7) : c3(col);
        x += 4 + Math.floor(hash(i, z.x, 656) * 4);
      }
      // 해골 하나와 녹은 초 — 아래 작은 선반
      const sx = zx - ZW / 2 + 0.5, sy = fy - 33;
      if (fy === 38 && Math.abs(sx) < 10) return c3('#7a5c40');
      if (fy === 39 && Math.abs(sx) < 9) return c3('#3e2c20');
      if (Math.hypot(sx, (sy + 0.5) * 1.1) < 4 && sy < 3) return (Math.abs(sx + 1.5) < 1 || Math.abs(sx - 1.5) < 1) && sy > -1.5 && sy < 0.5 ? c3('#1a120e') : sx < 0 ? c3('#d8ccb0') : c3('#a89c80');   // 해골 (눈구멍)
      if (sy >= 2 && sy < 5 && Math.abs(sx) < 2.6) return sy === 3 && Math.abs(sx) < 1.6 && (Math.round(sx) & 1) ? c3('#1a120e') : c3('#b8ac90');   // 턱 · 이
      if (Math.abs(sx - 7) < 1 && fy >= 31 && fy < 38) return fy === 31 ? c3('#ffd070') : fy === 32 ? c3('#2a1e14') : c3('#d8ccb0');   // 초
      return wallLog();
    }
    return wallLog();
    // 통나무 벽 — 굵기가 저마다 다른 가로 통나무 (위 빛 · 아래 그늘 · 이음 줄), 나뭇결 · 옹이, 위로 갈수록 어둑
    function wallLog() {
      let y = 4, i = 0;
      while (true) { const h = 6 + Math.floor(hash(i, 0, 657) * 3); if (fy < y + h || y + h >= 44) break; y += h; i++; }
      const h = Math.min(6 + Math.floor(hash(i, 0, 657) * 3), 44 - y), ly = fy - y;
      if (ly === h - 1) return hash(X >> 2, i, 658) < 0.15 ? c3(K.moss[0]) : c3(K.seam);
      let k = ly === 0 ? 4 : ly === 1 ? 3 : ly >= h - 2 ? 1 : 2;
      if (k === 2 && vnoise(X * 0.18, i * 3.7, 659) > 0.62) k = 3;
      if (k >= 2 && hash(X >> 1, i, 660) < 0.02) k = 0;
      return mul(c3(K.log[k]), 0.78 + fy / 44 * 0.12);
    }
  }
  function storeWall(m, A, e, X, Y, lx, ly) {
    if (e.up && STC.logs) return witchWall(m, A, X, (3 - e.up) * P + ly, lx);
    if (e.up) {
      const fy = (3 - e.up) * P + ly, tx = Math.floor(X / P);
      if (fy === 0) return c3(STC.line);
      if (fy <= 2) return c3(STC.gold);
      if (fy === 3) return c3(STC.goldDim);
      const z = storeZones(m, A).find(q => tx >= q.x && tx < q.x + q.w);
      let wall = mul(c3(STC.wall), 1 - fy / 48 * 0.1);
      if (fy >= 42) wall = fy === 42 ? c3(STC.goldDim) : fy === 47 ? c3('#6a614f') : c3('#c2b8a2');   // 아랫단
      if (!z) {                                                                     // 구역 사이 — 벽기둥과 따뜻한 벽등
        const ax = Math.abs(lx - 7.5);
        if (fy < 42 && ax < 4) wall = ax > 3 ? c3('#cfc6b0') : mix(wall, WHITE, 0.3);
        if (ax < 4 && (fy === 6 || fy === 7 || fy === 39 || fy === 40)) return c3(STC.gold);
        const g = Math.hypot(lx - 7.5, fy - 18);
        if (g < 2.2) return c3('#fff6d8');
        if (g < 9 && fy < 42) wall = mix(wall, c3('#ffd98a'), 0.45 * (1 - g / 9));
        return wall;
      }
      const zx = X - z.x * P, ZW = z.w * P;
      if (z.kind === 'rack') {                                                      // 무기 진열 벽 — 금테 두른 어두운 벽감, 위에 청록 빛줄, 무기가 줄지어 걸림
        if (zx < 3 || zx >= ZW - 3 || fy < 6 || fy > 40) return wall;
        if (zx === 3 || zx === ZW - 4 || fy === 6 || fy === 40) return c3(STC.gold);
        if (fy === 7 || fy === 8) return c3(fy === 7 ? '#e9fbfd' : STC.glow);
        let c = mix(c3(STC.velvet), c3(STC.glow), Math.max(0, 0.3 * (1 - (fy - 9) / 12)));
        const ix = zx - 6, slot = Math.floor(ix / 14), wx = ix - slot * 14 - 7, wy = fy - 12;
        if (ix >= 0 && slot < Math.floor((ZW - 12) / 14)) {
          const wpn = rackWeapon(slot % 4, wx, wy);
          if (wpn) return wpn;
          if (wy === -1 && Math.abs(wx) <= 2) return c3(STC.goldDim);               // 걸이
          if (wx === -7 && fy > 9) c = mul(c, 0.8);                                 // 칸 사이 줄
        }
        if (fy >= 38) c = mix(c, c3(STC.glow), 0.18);
        return c;
      }
      if (z.kind === 'esc') {                                                       // 에스컬레이터 — 위로 멀어지는 계단, 양옆 유리 난간, 위에 올라가는 화살표
        const mx = zx - ZW / 2 + 0.5;
        if (fy < 8) return fy >= 4 && fy <= 6 && Math.abs(mx) <= (fy - 4) + 0.5 ? c3(STC.glow) : wall;
        if (zx < 2 || zx >= ZW - 2) return wall;
        if (zx === 2 || zx === ZW - 3 || fy === 8) return c3(STC.gold);
        const sy = 47 - fy, hw = 19 - sy * 0.2, ax = Math.abs(mx);
        if (ax > hw + 3) return mix(c3('#17141c'), c3('#fff3cf'), 0.08 + sy / 39 * 0.1);
        if (ax > hw + 2) return c3('#0d0e12');                                      // 손잡이
        if (ax > hw) return mix(c3('#274b55'), c3(STC.glow), 0.25 + 0.2 * (sy / 39));   // 유리 난간
        const step = Math.floor(Math.sqrt(sy) * 2.4);
        let c = c3(step % 2 ? '#5d626e' : '#3d414b');
        if (Math.floor(Math.sqrt(sy + 1) * 2.4) !== step) c = c3('#8d939f');        // 디딤판 앞 모서리
        if (ax < 0.6) c = mul(c, 0.8);
        return mix(c, c3('#fff3cf'), sy / 39 * 0.28);                               // 위층에서 내려오는 빛
      }
      if (z.kind === 'armor') {                                                     // 방어구 진열 벽 — 금테 벽감 안에 투구 · 갑옷 · 장갑 · 신발이 차례로 걸림
        if (zx < 3 || zx >= ZW - 3 || fy < 6 || fy > 40) return wall;
        if (zx === 3 || zx === ZW - 4 || fy === 6 || fy === 40) return c3(STC.gold);
        if (fy === 7 || fy === 8) return c3(fy === 7 ? '#e9fbfd' : STC.glow);
        let c = mix(c3(STC.velvet), c3(STC.glow), Math.max(0, 0.25 * (1 - (fy - 9) / 14)));
        const ix = zx - 6, slot = Math.floor(ix / 17), ax = ix - slot * 17 - 8, ay = fy - 24;
        if (ix >= 0 && slot < Math.floor((ZW - 12) / 17)) {
          const kind = (slot + (z.x >> 2)) % 4, steel = c3(['#c9d2dc', '#9aa6b4', '#e8eef4'][(Math.abs(ax) + ay) % 3 === 0 ? 2 : ay > 2 ? 1 : 0]);
          const edge = c3('#3a404a');
          if (kind === 0 && Math.hypot(ax * 1.0, (ay + 3) * 1.15) < 7.5 && ay < 4) return ay === 0 && Math.abs(ax) < 5 ? c3('#1a1e26') : Math.hypot(ax, (ay + 3) * 1.15) > 6.6 ? edge : steel;   // 투구
          if (kind === 1 && ay > -11 && ay < 9 && Math.abs(ax) < (ay < -6 ? 8 : 6.5 - Math.max(0, ay - 4) * 0.4)) return Math.abs(ax) === 0 ? c3('#7d8794') : steel;                  // 갑옷
          if (kind === 2 && ((Math.abs(ax + 3) < 2.6 && ay > -6 && ay < 6) || (Math.abs(ax - 3) < 2.6 && ay > -4 && ay < 7))) return ay < -2 && ay > -5 ? c3(STC.gold) : steel;  // 장갑 한 켤레
          if (kind === 3 && ((ax > -7 && ax < -1 && ay > -6 && ay < 8) || (ax > 1 && ax < 7 && ay > -4 && ay < 8) || (ay >= 6 && ay < 8 && ax > -9 && ax < 9))) return ay >= 6 ? c3('#2a2e36') : c3('#6a4a2c');   // 신발
          if (ay === -13 && Math.abs(ax) <= 2) return c3(STC.goldDim);              // 걸이
        }
        if (fy >= 38) c = mix(c, c3(STC.glow), 0.18);
        return c;
      }
      if (z.kind === 'mirror') {                                                    // 큰 거울 — 금테, 비스듬한 빛줄 둘
        if (zx < 4 || zx >= ZW - 4 || fy < 5 || fy > 41) return wall;
        if (zx === 4 || zx === ZW - 5 || fy === 5 || fy === 41) return c3(STC.gold);
        const d = ((zx - fy) % 40 + 40) % 40;
        if (d < 3 || (d > 8 && d < 10)) return c3('#f4faff');
        return mix(c3('#b8c8d6'), c3('#e8f0f6'), (fy - 5) / 40);
      }
      if (z.kind === 'board') {                                                     // 의뢰 게시판 — 은빛 테 안의 코르크 판에 의뢰 종이가 핀으로 꽂힘 (협회)
        if (zx < 3 || zx >= ZW - 3 || fy < 6 || fy > 39) return wall;
        if (zx === 3 || zx === ZW - 4 || fy === 6 || fy === 39) return c3(STC.gold);
        if (fy === 7) return c3(STC.glow);
        const ix = zx - 6, iy = fy - 10, col = Math.floor(ix / 15), row = Math.floor(iy / 14);
        const px = ix - col * 15, py = iy - row * 14, h = hash(col, row, 385 + z.x);
        const ox = (h * 3) | 0, oy = (hash(col, row, 386 + z.x) * 2) | 0;
        if (ix >= 0 && iy >= 0 && col < Math.floor((ZW - 12) / 15) && row < 2 && h > 0.12) {
          const qx = px - ox, qy = py - oy;
          if (qx >= 0 && qx < 11 && qy >= 0 && qy < 11) {
            if (qy === 0 && (qx === 5)) return c3(h < 0.5 ? '#e0524a' : STC.glow);   // 핀
            const paper = c3(['#f4f1e8', '#e9f2f6', '#f6ecd2', '#eef0f2'][(h * 4) | 0]);
            if (qy >= 3 && qy <= 8 && qx >= 2 && qx <= 8 && qy % 2 === 1) return mix(paper, c3('#4a5568'), qx > 6 && qy === 7 ? 0.2 : 0.55);   // 글줄
            if (qy === 10 || qx === 10) return mul(paper, 0.82);
            return paper;
          }
        }
        return mix(c3('#8a6a42'), c3('#a7845a'), hash(zx >> 1, fy >> 1, 387) * 0.6);   // 코르크
      }
      if (z.kind === 'window') {                                                    // 창 (우리 집) — 흰 창틀 · 십자 살, 밖으로 하늘과 옛 동네 지붕 · 물탱크, 양옆 커튼
        const mx = zx - ZW / 2 + 0.5, ax = Math.abs(mx), hw = ZW / 2 - 7;
        if (fy < 8 || fy > 36) return wall;
        if (ax > hw && ax <= hw + 4) return (Math.floor(zx / 2) & 1) ? c3('#b0504a') : c3('#c46a5a');   // 커튼
        if (ax > hw + 4) return wall;
        if (ax > hw - 2 || fy < 10 || fy > 34 || ax < 1 || fy === 22) return c3('#f4f0e6');   // 창틀 · 십자 살
        const sx = zx, roofLine = 26 + Math.round(Math.sin(sx * 0.35) * 1.5) + ((sx >> 3) & 1) * 3;
        if (fy >= roofLine) {                                                       // 옛 동네 지붕들
          if ((sx % 11) < 4 && fy >= roofLine - 4 && fy < roofLine) return c3('#6eb0d2');   // 물탱크
          return (sx >> 3) & 1 ? c3('#8a6a5a') : c3('#6f9a78');
        }
        if (fy >= roofLine - 4 && (sx % 11) < 4) return c3('#6eb0d2');
        return mix(c3('#9ccbe8'), c3('#e8f4fa'), (fy - 10) / 20);                   // 하늘
      }
      if (z.kind === 'gbanner') {                                                   // 내 길드 깃발 — 3단계부터 (그 전엔 빛바랜 네모 자국)
        const mx = zx - ZW / 2 + 0.5, ax = Math.abs(mx);
        if (GLV < 3) return ax < 14 && fy > 8 && fy < 38 ? mix(wall, WHITE, 0.12) : wall;
        if (fy === 6 && ax < 17) return c3(STC.gold);                               // 깃대
        const bottom = 38 - Math.max(0, ax - 4) * 0.5;                              // 아래가 제비 꼬리처럼
        if (ax < 14 && fy > 6 && fy < bottom) {
          const ey = fy - 20, star = ax + Math.abs(ey) < 5 || (ax < 1.6 && Math.abs(ey) < 10) || (Math.abs(ey) < 1.6 && ax < 10);
          if (ax > 12) return c3(STC.gold);
          return star ? c3(GLV >= 5 ? '#fff4c8' : STC.glow) : c3(STC.wine);
        }
        return wall;
      }
      if (z.kind === 'screen') {                                                    // 게이트 현황판 (협회) — 은빛 테 두른 검은 화면에 등급 칸 · 남은 시간 막대가 줄지어 깜빡임
        if (zx < 3 || zx >= ZW - 3 || fy < 6 || fy > 39) return wall;
        if (zx === 3 || zx === ZW - 4 || fy === 6 || fy === 39) return c3(STC.gold);
        if (fy === 7) return c3(STC.glow);
        const ix = zx - 6, iy = fy - 10, row = Math.floor(iy / 5), ry = iy - row * 5;
        if (ix < 0 || zx >= ZW - 6 || iy < 0 || row > 5 || ry > 2) return c3('#0a1220');
        const grade = ['#e0524a', '#f0a33a', '#f3dc5a', '#62e6ee', '#5a8ef0', '#b07af0'][(row + z.x) % 6];
        if (ix < 5) return c3(grade);                                               // 등급 칸
        if (ix === 5) return c3('#0a1220');
        const len = 8 + Math.floor(hash(row, z.x, 388) * (ZW - 26));
        if (ix - 6 < len) return ry === 1 ? mix(c3(STC.glow), WHITE, 0.25) : c3(STC.glow);   // 남은 시간 막대
        return (ix % 3 === 0 && ry === 1) ? c3('#1d3348') : c3('#0a1220');
      }
      if (z.kind === 'crest') {                                                     // 협회 문장 — 남색 판 위 방패(흰 테 · H), 양옆으로 흐르는 청록 빛줄
        const mx = zx - ZW / 2 + 0.5, sy = fy - 5;
        const half = y => (y < 0 || y >= 34 ? -1 : y < 19 ? 15 : 15 - (y - 19) * 1.0);
        const ax = Math.abs(mx);
        if (ax <= half(sy)) {
          if (ax > half(sy) - 2 || sy < 2 || ax > half(sy + 2)) return c3('#eafcff');
          if ((ax >= 4.5 && ax <= 6.5 && sy >= 7 && sy <= 23) || (ax <= 6.5 && sy >= 14 && sy <= 16)) return c3('#eafcff');
          return c3('#0f1f38');
        }
        if (fy >= 3 && fy < 41 && (ax === 20.5 || ax === 21.5)) return ax === 20.5 ? mix(c3(STC.glow), WHITE, 0.4) : c3(STC.glow);
        if (zx >= 2 && zx < ZW - 2 && fy >= 3 && fy < 41) return mix(c3('#16263f'), c3(STC.glow), 0.05 + 0.08 * (1 - Math.abs(fy - 22) / 22));
        return wall;
      }
      if (z.kind === 'mats') {                                                      // 재료 창구 — 금테 창 셋, 말아 올린 셔터 아래로 따뜻한 불빛 · 선반마다 재료(가죽 · 깃털 · 돌조각 · 비늘 …)
        const ix = zx - 5, k = Math.floor(ix / 35), wx = ix - k * 35;
        if (ix < 0 || k > 2 || wx >= 32 || fy < 9 || fy > 38) return fy === 39 || fy === 40 ? c3('#d8cfbb') : wall;
        if (wx === 0 || wx === 31 || fy === 9 || fy === 38) return c3(STC.gold);
        if (fy <= 12) return c3(fy === 12 ? '#5a5f69' : (fy & 1) ? '#a4aab3' : '#8b919b');   // 말아 올린 셔터
        const back = mix(c3('#3a2a22'), c3('#ffd98a'), 0.18 + 0.1 * Math.sin(wx / 31 * Math.PI));
        for (const shelf of [20, 29, 37]) {
          if (fy === shelf) return c3('#8a6a42');                                   // 선반
          const h = shelf - fy, slot = Math.floor((wx - 2) / 5), sx = (wx - 2) - slot * 5;
          if (h < 1 || h > 6 || wx < 2 || wx > 29 || sx === 4) continue;
          const r = hash(k * 16 + slot, shelf, 383), tall = 2 + Math.floor(hash(k * 16 + slot, shelf, 384) * 5);
          if (r < 0.2 || h > tall) continue;                                        // 빈 자리 · 그 물건의 키
          const pal = ['#9a6a3c', '#e3e8ee', '#8fc4dc', '#8d939f', '#4f9f6a', '#6a4a2a', '#b98a54'];
          const c = c3(pal[Math.floor(r * 97) % pal.length]);
          return h === tall ? mix(c, WHITE, 0.3) : sx === 3 ? mul(c, 0.8) : c;
        }
        return back;
      }
      return wall;
    }
    if (!e.rim) return c3('#17141c');
    let c = mul(c3(STC.logs ? '#33251b' : '#2c2832'), 0.9 + hash(X >> 2, Y >> 2, 380) * 0.2);              // 옆 · 아래 벽의 윗면 — 바닥 쪽 가장자리에 금빛 줄
    const R = P - 1, d = Math.min(e.rim.l ? lx : 99, e.rim.r ? R - lx : 99, e.rim.u ? ly : 99, e.rim.d ? R - ly : 99);
    if (d === 0) return c3(STC.line);
    if (d === 1) return c3(STC.gold);
    if (d < 4) c = mix(c, c3('#c2b8a2'), 0.35);
    return c;
  }
  const storeGround = (m, A, e, X, Y, lx, ly) => (e.t === WALL || e.t < 0 ? storeWall(m, A, e, X, Y, lx, ly) : storeFloor(m, e, X, Y, lx));
  // 계산대 몸 — 흰 돌 윗면(0~8) · 금빛 줄 · 포도주색 앞면에 금빛 세로 살과 청록 빛줄
  function counterBody(px, py, W) {
    if (px === 0 || px === W - 1 || py === 0 || py === 15) return c3(STC.line);
    if (py < 8) return mix(c3('#f6f2e8'), c3('#d9d2c2'), (hash(px >> 1, py >> 1, 381) < 0.25 ? 0.5 : 0) + py * 0.03);
    if (py === 8) return c3(STC.gold);
    if (py === 13) return c3(STC.glow);
    return px % 12 === 6 ? c3(STC.goldDim) : mul(c3(STC.wine), py === 9 ? 0.75 : 1);
  }
  function storeProp(B, px, py, X, Y) {
    const W = B.w * P, floor = STC.logs ? plankTile(X, Y) : storeTile(X, Y), k = B.kind;
    if (k === 'cauldron') {                                                        // 가마솥 (마녀의 오두막) — 검은 쇠솥 · 끓는 초록 약 · 거품 · 밑의 장작불
      const H = B.h * P, cx = W / 2 - 0.5, rx = W / 2 - 3, ry = 7, rimY = 11, dx = px - cx;
      const half = y => rx * Math.sqrt(Math.max(0, 1 - ((y - rimY) / (H - 6 - rimY)) ** 2 * 0.55));
      const r = Math.hypot(dx / rx, (py - rimY) / ry);
      if (r < 1) {
        if (r > 0.86) return r > 0.95 ? c3(STC.line) : dx < 0 && py < rimY ? c3('#5a5a62') : c3('#2e2e34');   // 솥 테
        let c = mix(c3('#3e7a2e'), c3('#9ae070'), Math.max(0, 1 - r) * 0.9);                                         // 약
        const b = hash(Math.floor(px / 2), Math.floor(py / 2), 661);
        if (b < 0.1) c = c3('#c6f59a'); else if (b < 0.16) c = c3('#2e5a22');                                          // 거품 · 그늘
        return c;
      }
      if (py >= rimY && py < H - 6 && Math.abs(dx) < half(py)) {
        const shade = dx / rx;
        if (Math.abs(dx) > half(py) - 1 || py === H - 7) return c3(STC.line);
        if (py < rimY + 3 && Math.abs(dx) < rx * 0.9) return c3('#141418');                                           // 테 밑 그늘
        return c3(shade < -0.55 ? '#4a4a52' : shade < 0.1 ? '#323238' : shade < 0.6 ? '#26262b' : '#1c1c20');
      }
      if (py >= H - 7) {                                                                                               // 장작 · 불
        const fx = Math.abs(dx);
        if (fx < 8 && py >= H - 4 && py < H - 1) return (py === H - 4 && fx < 6) ? c3('#ffb040') : c3(hash(px, py, 662) < 0.5 ? '#5e4630' : '#3e2c20');
        if (fx < 6 && py >= H - 7 && py < H - 4 && hash(px, py, 663) < 0.7) return c3(py === H - 5 ? '#ffd070' : '#e0702a');
        if (fx < 11 && py === H - 1) return mul(floor, 0.7);
      }
      const gl = Math.hypot(dx, (py - H + 4) * 1.4);
      return gl < 16 ? mix(floor, c3('#ff9a40'), 0.22 * (1 - gl / 16)) : floor;                                     // 바닥에 비친 불빛
    }
    if (k === 'books') {                                                           // 책 더미 (마녀의 오두막) — 두께 · 빛깔이 다른 책 넷, 위에 녹은 초
      const rows = [[3, 13, 15, '#5a2a2a', 2], [4, 12, 12, '#2e3e4e', 3], [2, 11, 8, '#4a3a22', 2], [5, 10, 5, '#3e2e4a', 2]];
      for (const [x0, w, y1, col, th] of rows) {
        const y0 = y1 - th;
        if (px >= x0 && px < x0 + w && py >= y0 && py <= y1) return px === x0 || px === x0 + w - 1 || py === y1 ? c3(STC.line) : py === y0 ? mix(c3(col), WHITE, 0.2) : px === x0 + w - 2 ? c3('#d8ccb0') : c3(col);
      }
      if (px === 9 && py >= 0 && py < 3) return py === 0 ? c3('#ffd070') : py === 1 ? c3('#2a1e14') : c3('#d8ccb0');
      if (py === 15 && px > 2 && px < 15) return mul(floor, 0.75);
      return floor;
    }
    if (k === 'shroom') {                                                          // 버섯 무리 (마녀의 오두막) — 크기가 다른 자줏빛 갓 셋, 흰 점, 은은한 빛
      for (const [mx, my, r] of [[6, 9, 4.2], [11, 12, 2.8], [3.5, 13, 2]]) {
        const dx = px + 0.5 - mx, dy = py + 0.5 - my;
        if (dy <= 0.5 && Math.hypot(dx, dy * 1.6) < r) return Math.hypot(dx, dy * 1.6) > r - 0.9 ? c3(STC.line) : hash(px, py, 664) < 0.16 ? c3('#e8dcd0') : dx < -0.5 ? c3('#9a4a6a') : c3('#6a2a4a');
        if (dy > 0.5 && dy < r * 0.9 + 1 && Math.abs(dx) < r * 0.28 + 0.4) return dx < 0 ? c3('#e0d4c0') : c3('#b0a490');
      }
      const gl = Math.hypot(px - 7, py - 10);
      return gl < 9 ? mix(floor, c3('#c890ff'), 0.12 * (1 - gl / 9)) : floor;
    }
    if (k === 'counter') {
      if (px >= 5 && px <= 13 && py >= 2 && py <= 6) return px === 5 || px === 13 || py === 2 || py === 6 ? c3('#22252c') : mix(c3(STC.glow), WHITE, py === 3 ? 0.5 : 0.1);   // 계산 단말
      if (px >= W - 12 && px <= W - 6 && py >= 3 && py <= 5) return c3(py === 4 ? '#f3ede4' : STC.gold);                                                                   // 놓인 쟁반
      return counterBody(px, py, W);
    }
    if (k === 'case') {                                                             // 유리 진열장 — 어두운 깔개 위에 무기(왼쪽 매장) · 방패(오른쪽), 유리의 비스듬한 윤, 아래는 빛줄 두른 받침
      if (px === 0 || px === W - 1 || py === 0 || py === 15) return c3(STC.line);
      if (py === 10) return c3(STC.gold);
      if (py > 10) return py === 12 ? c3(STC.glow) : mul(c3(STC.dark[0]), px % 8 === 0 ? 0.8 : 1);
      if (px === 1 || px === W - 2 || py === 1) return c3('#bfe9ee');
      let c = mix(c3(STC.velvet), c3(STC.wine), 0.25);
      const t = B.tone | 0;
      if (t < 4) {                                                                  // 눕힌 칼 — 날 · 가드 · 손잡이
        const blade = t === 3 ? [c3('#e9fbfd'), c3(STC.glow)] : [c3(STC.steel[2]), c3(STC.steel[1])];
        if (px >= 5 && px <= 21 && (py === 5 || py === 6) && !(px === 5 && py === 6)) c = blade[py - 5];
        else if (px === 22 && py >= 3 && py <= 8) c = c3(STC.gold);
        else if (px >= 23 && px <= 27 && (py === 5 || py === 6)) c = c3(px % 2 ? '#3a2a22' : '#55402f');
        else if (t === 1 && px >= 6 && px <= 9 && py >= 3 && py <= 8 && Math.abs(py - 5.5) <= (px - 5) * 0.8) c = c3(STC.steel[1]);   // 넓은 날
        else if (t === 2 && px >= 5 && px <= 21 && (py === 4 || py === 7) && px % 3 === 0) c = c3(STC.steel[3]);                    // 톱니
      } else {                                                                      // 둥근 방패 · 네모 방패
        const dx = px - 15.5, dy = (py - 5.5) * 1.6, r = Math.hypot(dx, dy), tone = ['#2f5f9a', '#9a2f3a', '#3a7d5a', '#7a5fa8'][t - 4];
        if (t % 2 === 0) { if (r < 7.2) c = r > 5.8 ? c3(STC.steel[1]) : r < 1.8 ? c3(STC.gold) : c3(tone); }
        else if (Math.abs(dx) < 7 && py >= 2 && py <= 8) c = Math.abs(dx) > 5.5 || py === 2 || py === 8 ? c3(STC.steel[1]) : Math.abs(dx) < 1 || py === 5 ? c3(STC.gold) : c3(tone);
      }
      return ((px + py * 2) % 19) < 2 ? mix(c, WHITE, 0.4) : c;
    }
    if (k === 'rope') {                                                             // 막아 둔 줄 — 금빛 기둥 사이로 늘어진 붉은 줄 (바닥이 비침)
      const posts = [4, W >> 1, W - 5];
      for (const q of posts) {
        const ax = Math.abs(px - q);
        if (py >= 12 && py <= 14 && ax <= 3) return py === 14 ? c3(STC.line) : c3(STC.goldDim);
        if (py >= 2 && py < 12 && ax <= 1) return py <= 3 ? c3('#f3dc8a') : ax === 0 ? c3(STC.gold) : c3(STC.goldDim);
      }
      for (let i = 0; i < posts.length - 1; i++) {
        const a = posts[i], b = posts[i + 1];
        if (px <= a + 1 || px >= b - 1) continue;
        const y = 5 + Math.sin((px - a) / (b - a) * Math.PI) * 3.5;
        if (py >= y - 0.5 && py < y + 1.5) return c3(py < y + 0.5 ? STC.red : '#7d1622');
        if (py === 14 && px % 2 === 0) return mul(floor, 0.85);                     // 줄 그림자
      }
      return floor;
    }
    if (k === 'bed') {                                                              // 침대 (우리 집) — 나무 머리판 · 흰 베개 · 남색 이불(접힌 끝) · 나무 틀
      const H = B.h * P;
      if (px === 0 || px === W - 1 || py === 0 || py === H - 1) return c3(STC.line);
      if (py < 6) return py === 1 ? mix(c3('#8a6440'), WHITE, 0.25) : c3(py % 2 ? '#7a5634' : '#8a6440');   // 머리판
      if (px < 2 || px > W - 3) return c3('#7a5634');                               // 틀
      if (py < 15) { const pw = (W - 4) / 2, ix = (px - 2) % pw; return ix < 1 || ix > pw - 2 || py === 6 || py === 14 ? c3('#d8d2c4') : c3('#f6f2ea'); }   // 베개 둘
      if (py < 19) return py === 15 ? c3('#e8e2d4') : c3('#f4f0e6');                // 접은 이불 끝 (흰 홑청)
      const qu = STC.quilt || ['#3a4a7a', '#4a5c90'];
      let c = mix(c3(qu[0]), c3(qu[1]), ((px >> 2) + (py >> 2)) % 2 ? 0.6 : 0.2);   // 이불
      if (py > H - 6) c = mul(c, 0.85);
      return c;
    }
    if (k === 'fridge') {                                                           // 냉장고 (우리 집) — 흰 몸 · 위아래 문 · 손잡이 · 자석 메모
      const H = B.h * P;
      if (px < 2 || px > W - 3 || py < 1 || py > H - 3) return py >= H - 2 && px > 1 && px < W - 2 ? mul(floor, 0.8) : floor;
      if (px === 2 || px === W - 3 || py === 1 || py === H - 3 || py === 11) return c3('#8f8b84');
      if (px === W - 5 && (py > 4 && py < 9 || py > 14 && py < 22)) return c3('#b8b2a6');   // 손잡이
      if (px >= 5 && px <= 8 && py >= 15 && py <= 19) return py === 15 ? c3('#c0504a') : c3('#f4e8b0');   // 자석 메모
      return px < 5 ? c3('#f6f4ee') : c3('#e6e2da');
    }
    if (k === 'desk') {                                                             // 사무 책상 (내 길드) — 나무 윗면 · 모니터 · 서류 더미 · 머그
      if (py < 2 || py > 13) return py === 14 && px > 1 && px < W - 2 ? mul(floor, 0.82) : floor;
      if (px === 0 || px === W - 1 || py === 2 || py === 13) return c3(STC.line);
      if (py >= 10) return mul(c3(STC.dark[0]), px % 10 === 0 ? 0.8 : 1);            // 앞판
      if (px >= 6 && px <= 15 && py >= 3 && py <= 7) return px === 6 || px === 15 || py === 3 || py === 7 ? c3('#22252c') : mix(c3(STC.glow), WHITE, py === 4 ? 0.45 : 0.1);   // 모니터
      if (px >= W - 10 && px <= W - 4 && py >= 4 && py <= 8) return (py & 1) ? c3('#f4f1e8') : c3('#d8d2c4');   // 서류
      if (Math.hypot(px - 3, py - 6) < 1.8) return c3(STC.red);                    // 머그
      return mix(c3('#8a6a42'), c3('#a7845a'), ((px >> 2) + py) % 3 === 0 ? 0.6 : 0.2);   // 나무 윗면
    }
    if (k === 'pillar') {                                                           // 기둥 (협회) — 위에서 본 흰 돌 기둥, 은빛 테 둘 · 가운데 청록 빛, 아래로 그림자
      const dx = px - 7.5, dy = py - 7, r = Math.max(Math.abs(dx), Math.abs(dy));
      if (r > 6.5) return py > 12 && Math.abs(dx) < 7 ? mul(floor, 0.8) : floor;
      if (r > 5.5) return c3(STC.line);
      if (r > 4.5) return c3(STC.gold);
      if (r < 1.6) return c3(STC.glow);
      return mix(c3(STC.ivory[2]), c3(STC.ivory[3]), dx + dy > 0 ? 0.6 : 0);
    }
    if (k === 'kiosk') {                                                            // 번호표 단말 (협회) — 어두운 몸에 기울어진 청록 화면 · 번호표가 나오는 곳
      if (px < 3 || px > 12 || py < 2 || py > 14) return py === 15 && px > 3 && px < 12 ? mul(floor, 0.8) : floor;
      if (px === 3 || px === 12 || py === 2 || py === 14) return c3(STC.line);
      if (py >= 4 && py <= 8 && px >= 5 && px <= 10) return py === 4 || px === 5 ? mix(c3(STC.glow), WHITE, 0.5) : c3(STC.glow);
      if (py === 11 && px >= 6 && px <= 9) return c3('#f4f1e8');
      return c3(py < 10 ? '#26324a' : '#1d2533');
    }
    if (k === 'plant') {                                                            // 화분 — 흰 도기에 금빛 띠, 둥글게 퍼진 잎
      const dx = px - 7.5, r = Math.hypot(dx, (py - 5.5) * 1.1);
      if (py >= 9 && Math.abs(dx) <= 4.5 - (py - 9) * 0.4) return py === 14 ? c3('#8f8777') : py === 10 ? c3(STC.gold) : mix(c3('#f6f2e8'), c3('#cfc6b0'), dx > 1 ? 0.6 : 0);
      if (r < 6.2) { const h = hash(px, py, 382); return r > 5.3 ? c3('#1f5f38') : h < 0.3 ? c3('#4faf6a') : h < 0.7 ? c3('#3f9a5c') : c3('#2f7d4a'); }
      if (py === 15 && Math.abs(dx) <= 5) return mul(floor, 0.82);
      return floor;
    }
    if (k === 'bench') {                                                            // 긴 의자 — 포도주색 가죽, 금빛 다리
      if (py < 3 || py > 13) return py === 14 && px > 1 && px < W - 2 ? mul(floor, 0.84) : floor;
      if (px === 0 || px === W - 1 || py === 3 || py === 13) return c3(STC.line);
      if (px <= 2 || px >= W - 3) return c3(STC.gold);
      const deep = STC === STC_HQ ? '#0f1f38' : '#4a0f18', soft = STC === STC_HQ ? '#2f5a8a' : '#8a2433';   // 협회는 남색 가죽
      if (py >= 11) return c3(deep);
      return px % 8 === 4 && py === 7 ? c3(deep) : mix(c3(soft), c3(STC.wine), py > 7 ? 0.7 : 0.1);
    }
    return floor;
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
  // 길 위로 늘린 옥상 (건물을 당겨 길을 좁힘 — tools/map-gen.js 의 over) — 건물마다 그 줄만 따로 그려 둠
  function hangSprite(B) {
    if (B.hangCv !== undefined) return B.hangCv;
    if (!B.hang || typeof document === 'undefined') return (B.hangCv = null);
    const W = B.w * P, H = B.hang * P, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const c = cityBuilding(B, px, py, B.x0 * P + px, B.y0 * P + py), i = (py * W + px) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return (B.hangCv = cv);
  }
  function drawOver(ctx, m, ox, oy, T, x0, y0, x1, y1, me) {
    if (!m.look) return;
    const A = prep(m);
    ctx.imageSmoothingEnabled = false;
    for (const B of A.buildings) {                                                 // 그 줄을 지나는 동안만 그 건물을 반쯤 비침 (사용자 결정 2026-11-19)
      if (!B.hang || B.x0 > x1 || B.y0 > y1 || B.x0 + B.w < x0 || B.y0 + B.hang < y0) continue;
      const cv = hangSprite(B);
      if (!cv) continue;
      const under = me && me.x + 1 > B.x0 && me.x < B.x0 + B.w && me.y + 1 > B.y0 && me.y < B.y0 + B.hang;
      if (under) ctx.globalAlpha = 0.4;
      ctx.drawImage(cv, Math.round(ox + B.x0 * T), Math.round(oy + B.y0 * T), B.w * T, B.hang * T);
      ctx.globalAlpha = 1;
    }
    const s = gateSprite(A, m);
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
    const A0 = prepared.get(m.look);
    if (A0 && (!A0.mine || A0.glv === GLV) && (!A0.bm || A0.bmo === BMO) && (!A0.apt || A0.aptOn === APT)) return A0;
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
      // 내 길드(문 myguild) — 단계마다 다른 건물로: 0 · 1 허름한 빈 건물(1은 「임대」를 떼고 불을 켬) · 2 · 3 고친 옛 건물(mine) · 4 · 5 미래 건물(mineNew)
      // 미래 도시 가운데 빈터(mineCity · overLot) — 4단계부터 미래 건물(4 청록 · 5 흰 · 금). 그 전엔 칸이 빈터 그대로 (cellOf 가 건물로 안 봄)
      const my = !!door && (door.name === 'myguild' || door.name === 'myguild2');
      const kind = b.kind === 'mineCity' ? 'mineNew' : b.kind === 'aptCity' ? 'apt' : my ? (GLV <= 1 ? 'shabby' : 'mine') : b.kind;
      buildings.push({ x0: b.x, y0: b.y, w: b.w, h: b.h, door, kind, roof: b.roof, tone: b.tone, v: b.v, roofOnly: !!b.roofOnly, f: b.f, G: null, my, glv: b.kind === 'mineCity' ? GLV : Math.min(3, GLV), over: b.overLot ? (b.kind === 'aptCity' ? 'home' : 'guild') : false, hang: b.over | 0,
                       bmo: !!door && door.name === 'blackmarket' && BMO });
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
    const A = { dist, chunks: new Map(), bAt, buildings, noProp, pv, pb, ps, run, glv: GLV, bmo: BMO, bm: buildings.some(b => b.door && b.door.name === 'blackmarket'), apt: buildings.some(b => b.over === 'home'), aptOn: APT,
                mine: (m.props && m.props.theme === 'guild') || buildings.some(b => b.my) };
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
    const ob = A.bAt[k] >= 0 ? A.buildings[A.bAt[k]] : null;
    if (raw === BUILD || (ob && (ob.over === 'guild' ? GLV >= 4 : ob.over === 'home' ? APT : false))) { e.b = A.bAt[k]; return e; }   // 빈터 위의 내 길드(4단계부터) · 새 집(산 뒤)
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
      // (가게 안의 가구 칸은 막힌 칸이지만 벽은 아님 — 그 위의 벽면이 한 칸 밀리지 않게 열린 칸으로 침)
      const open = (x, y) => { const u = at(x, y); return (u !== WALL && u >= 0) || (lookAt(x, y) & 15) === BUILD; };
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

  // ---------- 도시 (지도 속성 city · 격 번호 CITY) ----------
  // 헌터들이 몬스터라는 새 자원으로 훨씬 미래로 자란 서울 (사용자 결정 — 보여 준 그림의 느낌에, 더 미래로):
  // 매끈한 찻길 가장자리의 빛 띠, 큰 판 보도, 빛줄이 박힌 광장, 몬스터 핵으로 빛나는 가로등, 벚나무,
  // 짙은 유리에 빛 기둥이 흐르는 빌딩 — 가장 큰 것이 헌터 협회(방패 문장), 4대 길드는 저마다 빛깔과 문장, 헌터백화점은 따뜻한 진열창.
  // 옛 동네만 개발에서 비켜난 낡은 건물들(빨간 벽돌 빌라 · 허름한 빈 건물 · 네온 간판의 낡은 가게).
  // 칸의 겉모습(tools/map-gen.js 의 CITY): DIRT 찻길 · COBBLE 횡단보도 · PAVE 보도 · TILES 광장 · GRASS 잔디 · ROCKY 옛 동네 바닥 ·
  //   벽 + DIRT 찻길 끝 막음 · 벽 + SNOW 가림막 친 빈터. 바위 칸은 가로등.
  const CITY = 10;
  const CYC = {
    asphalt: ['#2f3239', '#2a2d33', '#363940', '#24262b'],
    slab: ['#c6cad1', '#bcc0c8', '#d0d4da', '#aeb3bb'], seam: '#9aa0a9',
    plaza: ['#dfe3e8', '#d5dae0', '#e8ecf0', '#c5cbd3'],
    glow: '#62e6ee', glowDim: '#2f8f9a', paint: '#e6eaee', tactile: '#e0b93a',
    concrete: ['#77746f', '#6e6b66', '#807d77', '#5f5c57'], lawnEdge: '#d5d9de',
    lot: ['#8f8777', '#857d6e', '#999182', '#766f61']
  };
  const ROADISH = t => t === DIRT || t === COBBLE;
  // 찻길(아스팔트 · 횡단보도) 칸마다 가로 · 세로로 이어진 길이와 시작 칸 — 짧은 쪽이 찻길의 폭 (차선 · 횡단보도 무늬의 방향)
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
    const c = shadeOf(CYC.asphalt, fbm(X * 0.04, Y * 0.04, 301) * 0.7 + hash(X, Y, 302) * 0.3);
    // (맨홀은 없앰 — 미래 도시엔 하수구가 안 보이게, 사용자 결정 2026-11-19)
    return hash(X, Y, 303) < 0.02 ? c3('#42454d') : c;
  }
  // 찻길 무늬 — 가장자리를 따라 흐르는 빛 띠 · 가운데 흰 두 줄 · 흰 점선 차선, 횡단보도는 길을 가로지르는 굵은 줄(양끝은 빛). 네거리 한가운데는 무늬 없음
  function roadMark(m, A, X, Y, cross) {
    const k = Math.floor(Y / P) * m.w + Math.floor(X / P), R = A.city, hr = R.hr[k], vr = R.vr[k];
    const horiz = vr <= 6 && hr > vr, vert = hr <= 6 && vr > hr;
    if (!horiz && !vert) return null;
    const a = horiz ? Y - R.vy[k] * P : X - R.hx[k] * P, Wd = (horiz ? vr : hr) * P, along = horiz ? X : Y;
    if (cross) {
      if (a < 3 || a >= Wd - 3 || ((along % 8) + 8) % 8 >= 4) return null;
      return a < 5 || a >= Wd - 5 ? c3(CYC.glow) : c3(CYC.paint);
    }
    const mid = Wd >> 1;
    if (a === mid - 2 || a === mid + 1) return c3(CYC.paint);
    // 차선마다 아홉 칸에 한 번 — 가는 쪽을 가리키는 화살표 (오른쪽 통행: 가로는 아래 차선이 오른쪽 · 세로는 왼쪽 차선이 아래로). 오래돼 조금 닳음
    if (Wd >= 4 * P) {
      const lc = a < mid ? Wd >> 2 : Wd - (Wd >> 2), v = a - lc, dir = horiz ? (a < mid ? -1 : 1) : (a < mid ? 1 : -1);
      const cell = Math.floor(along / P), ua = ((along % (P * 9)) + P * 9) % (P * 9) - P * 4;
      if (ua >= 0 && ua < 15 && Math.abs(v + 0.5) <= 5) {
        const w = dir > 0 ? ua : 14 - ua;
        if ((w < 9 && (v === -1 || v === 0)) || (w >= 9 && Math.abs(v + 0.5) <= (14 - w) * 0.8)) return mix(c3(CYC.paint), c3(CYC.asphalt[0]), 0.35 + hash(cell, a, 495) * 0.15);
      }
    }
    // (빗물받이는 없앰 — 미래 도시엔 하수구가 안 보이게, 사용자 결정 2026-11-19)
    if (Wd >= 4 * P && (a === (Wd >> 2) || a === Wd - (Wd >> 2)) && ((along % 20) + 20) % 20 < 10) return mix(c3(CYC.paint), c3(CYC.asphalt[0]), 0.3);
    if (a === 1 || a === Wd - 2) return c3(CYC.glow);
    if (a === 2 || a === Wd - 3) return mix(c3(CYC.glowDim), c3(CYC.asphalt[0]), 0.45);
    return null;
  }
  // 보도 — 16점 큰 판, 가는 이음매
  function slab(X, Y) {
    const sx = X & 15, sy = Y & 15, id = hash(X >> 4, Y >> 4, 320);
    if (sx === 0 || sy === 0) return c3(CYC.seam);
    let c = c3(CYC.slab[id < 0.3 ? 1 : id < 0.88 ? 0 : 2]);
    if (sx === 1 || sy === 1) c = mix(c, WHITE, 0.14);
    else if (sx === 15 || sy === 15) c = mul(c, 0.94);
    return hash(X, Y, 321) < 0.03 ? mul(c, 0.97) : c;
  }
  // 광장 — 32점 흰 판에, 네 칸마다 빛줄이 가로세로로 박혀 있고 만나는 곳은 밝은 점
  function plazaPix(X, Y) {
    const gx = ((X % 64) + 64) % 64, gy = ((Y % 64) + 64) % 64;
    if (gx < 2 && gy < 2) return c3('#f4feff');
    if (gx < 2 || gy < 2) return gx === 0 || gy === 0 ? c3(CYC.glow) : mix(c3(CYC.glow), c3(CYC.plaza[0]), 0.5);
    const sx = X & 31, sy = Y & 31, id = hash(X >> 5, Y >> 5, 324);
    if (sx === 0 || sy === 0) return c3('#b4bbc4');
    const c = c3(CYC.plaza[id < 0.3 ? 1 : id < 0.88 ? 0 : 2]);
    return sx === 1 || sy === 1 ? mix(c, WHITE, 0.2) : c;
  }
  function cityGround(m, A, e, X, Y, lx, ly) {
    const tx = Math.floor(X / P), ty = Math.floor(Y / P);
    const terAt = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? -1 : m.look[y * m.w + x] & 15);
    const tileAt = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? WALL : m.tile[y * m.w + x]);
    const t = e.ter;
    if (e.t === WALL && t === SNOW) {                                              // 빈터 — 다진 흙, 둘레에 빛 가림막 · 안에 자재 더미
      let c = shadeOf(CYC.lot, fbm(X * 0.05, Y * 0.05, 360) * 0.6 + hash(X, Y, 361) * 0.4);
      if (Math.abs(vnoise(X * 0.03, Y * 0.11, 362) - 0.5) < 0.012) c = mul(c, 0.8);  // 바퀴 자국
      const h = hash(tx, ty, 363), bx = lx - 4, by = ly - 5;
      if (h < 0.1 && bx >= 0 && bx < 9 && by >= 0 && by < 7) c = bx === 0 || by === 0 || bx === 8 || by === 6 ? c3('#4a3c24') : by % 2 ? c3('#c9a860') : c3('#b0904c');   // 자재 더미
      else if (h > 0.93 && Math.abs(lx - 8) <= (ly - 5) * 0.5 && ly >= 5 && ly < 12) c = ly % 3 === 0 ? c3('#f2efe6') : c3('#f07a2a');                                      // 고깔
      const out = (dx, dy) => { const u = terAt(tx + dx, ty + dy); return u !== SNOW || tileAt(tx + dx, ty + dy) !== WALL; };
      const fence = s => (s % 16 < 2 ? c3('#1d4f57') : (((s >> 2) & 1) ? mix(c, c3(CYC.glow), 0.6) : mix(c, c3('#e9fbfd'), 0.6)));
      if (out(0, 1) && ly >= 8) return ly === 8 ? c3('#e9fbfd') : ly === 15 ? c3('#1d4f57') : fence(X);                   // 남쪽 가림막은 앞면이 보임
      if (out(0, -1) && ly < 3) return ly === 0 ? c3('#1d4f57') : fence(X);
      if (out(-1, 0) && lx < 2) return lx === 0 ? c3('#1d4f57') : fence(Y);
      if (out(1, 0) && lx > 13) return lx === 15 ? c3('#1d4f57') : fence(Y);
      return c;
    }
    if (e.t === WALL && ROADISH(t)) {                                              // 찻길 끝 막음 — 빛 가림막 (보도 · 옛 동네 바닥의 막힌 칸은 자잘한 것이 놓인 자리 — 바닥 그대로)
      let c = asphalt(X, Y);
      const across = tileAt(tx - 1, ty) !== WALL || tileAt(tx + 1, ty) !== WALL;   // 옆이 찻길이면 세로로 선 가림막
      const a = across ? lx : ly, s = across ? Y : X;
      if (a >= 5 && a <= 10) c = a === 5 || a === 10 ? c3('#1d4f57') : ((s >> 2) & 1) ? c3(CYC.glow) : c3('#e9fbfd');
      else if (a === 11) c = mul(c, 0.6);
      return c;
    }
    if (ROADISH(t)) return roadMark(m, A, X, Y, t === COBBLE) || asphalt(X, Y);
    if (t === PAVE || t === TILES) {
      const r = Math.hypot(lx - 7.5, ly - 7.5);
      if (e.t === TREE && r < 6.6) return r > 5.4 ? c3('#8b9199') : (lx + ly) % 3 === 0 ? c3('#3a3029') : mul(c3('#5a4632'), 0.85 + hash(X, Y, 322) * 0.3);   // 나무 둘레 — 둥근 테와 흙
      if (e.t === ROCK && r < 6.2) return r > 5 ? c3(CYC.glow) : r > 4 ? c3('#20262e') : c3('#3a4250');                                                     // 가로등 받침 — 빛 테
      if (t === TILES) return plazaPix(X, Y);
      const c = slab(X, Y);
      // 연석 — 찻길과 닿은 가장자리, 횡단보도 앞엔 노란 점자 블록 한 줄
      const road = (dx, dy) => ROADISH(terAt(tx + dx, ty + dy));
      const d = Math.min(road(0, 1) ? P - 1 - ly : 99, road(0, -1) ? ly : 99, road(1, 0) ? P - 1 - lx : 99, road(-1, 0) ? lx : 99);
      if (d === 0) return c3('#6c727a');
      if (d <= 2) return c3('#e4e7ea');
      if (d === 3) return mul(c3('#e4e7ea'), 0.86);
      const cw = (dx, dy) => terAt(tx + dx, ty + dy) === COBBLE;
      if ((cw(0, 1) && ly >= 7 && ly <= 10) || (cw(0, -1) && ly >= 5 && ly <= 8) || (cw(1, 0) && lx >= 7 && lx <= 10) || (cw(-1, 0) && lx >= 5 && lx <= 8))
        return (X + Y) & 1 ? c3(CYC.tactile) : mul(c3(CYC.tactile), 0.8);
      return c;
    }
    if (t === GRASS) {                                                             // 손질된 잔디 — 가장자리엔 낮은 경계석
      let c = texture(GRASS, 0, X, Y);
      const edge = (dx, dy) => { const u = terAt(tx + dx, ty + dy); return u !== -1 && u !== GRASS && u !== BUILD; };
      const d = Math.min(edge(0, 1) ? P - 1 - ly : 99, edge(0, -1) ? ly : 99, edge(1, 0) ? P - 1 - lx : 99, edge(-1, 0) ? lx : 99);
      if (d <= 1) c = d === 0 ? mul(c3(CYC.lawnEdge), 0.8) : c3(CYC.lawnEdge);
      else if (d === 2) c = mul(c, 0.82);
      return c;
    }
    if (t === ROCKY) {                                                             // 옛 동네 — 낡은 콘크리트 · 금 · 물기, 양옆 건물 그늘
      let c = shadeOf(CYC.concrete, fbm(X * 0.05, Y * 0.05, 330) * 0.6 + hash(X, Y, 331) * 0.4);
      if (Math.abs(vnoise(X * 0.07, Y * 0.07, 332) - 0.5) < 0.008) c = c3('#4a4844');
      if (fbm(X * 0.03, Y * 0.03, 333) > 0.63) c = mix(c, c3('#3e4a52'), hash(X, Y, 334) < 0.08 ? 0.15 : 0.35);
      if (e.t === ROCK && Math.hypot(lx - 7.5, ly - 7.5) < 6.2) { const r = Math.hypot(lx - 7.5, ly - 7.5); return r > 5 ? c3(CYC.glow) : r > 4 ? c3('#20262e') : c3('#3a4250'); }
      if (terAt(tx, ty - 1) === BUILD && (ly === 3 || ly === 5)) c = mix(c, c3('#d9b43a'), hash(X >> 2, ty, 500) < 0.15 ? 0.25 : 0.7);   // 건물 앞 노란 이중선 — 주정차 금지 (군데군데 닳음)
      if (terAt(tx, ty + 1) === BUILD && (ly === 10 || ly === 12)) c = mix(c, c3('#d9b43a'), hash(X >> 2, ty, 501) < 0.15 ? 0.25 : 0.7);
      if (hash(tx, ty, 502) < 0.006 && terAt(tx, ty - 1) !== BUILD && terAt(tx, ty + 1) !== BUILD) {           // 작은 맨홀 — 녹슨 테 · 격자 (2026-11-19 셋에 하나로 줄임 — 사용자 결정)
        const r = Math.hypot(lx - 7.5, ly - 7.5);
        if (r < 4.6) return r > 3.7 ? c3('#2a2826') : ((X + Y) & 3) === 0 ? c3('#4a4440') : c3('#5c5650');
      }
      if (terAt(tx - 1, ty) === BUILD && lx < 6) c = mul(c, 0.6 + lx * 0.06);
      if (terAt(tx + 1, ty) === BUILD && lx > 10) c = mul(c, 1 - (lx - 10) * 0.05);
      return c;
    }
    return slab(X, Y);
  }

  // ---------- 도시의 건물 — 옥상(위)과 남쪽 벽면(아래)이 보이게 ----------
  // F 벽면 높이(점) · cut 깎은 모서리(미래 건물) · old 옛 동네의 낡은 건물(벽 · 옥상 · 띠 색)
  const CB = {
    hq:     { F: 112, cut: 8 },
    dept:   { F: 84 },
    guild:  { F: 90, cut: 6 },
    tower:  { F: 96, cut: 5 },
    // 옛 동네 건물은 벽면을 조금 높이고 깊이를 줄여 옥상이 덜 보이게 (2026-11-18 사용자 결정)
    villa:  { F: 50, old: true, roof: '#6f9a78', wall: '#a35f48', trim: '#e3ddd2' },   // 빨간 벽돌 빌라 — 초록 방수 옥상 · 1층은 필로티
    shabby: { F: 58, old: true, roof: '#7d786f', wall: '#8d8679', trim: '#a39c8f' },   // 허름한 빈 건물 — 막아 둔 창 · 녹 · 「임대」
    mine:   { F: 62, old: true, roof: '#8f949a', wall: '#d2c9b6', trim: '#ece6d8' },   // 내 길드 2 · 3단계 — 고친 창 · 새 칠 · (3) 간판 · 차양 · 꽃상자
    mineNew: { F: 92, cut: 4 },
    apt:    { F: 92, cut: 4 },                                                        // 새 집 — 고급 아파트 (층마다 발코니)                                                       // 내 길드 4 · 5단계 — 미래 건물 (4 청록 유리 · 5 흰 · 금 · 별 문장)
    store:  { F: 44, old: true, roof: '#938d83', wall: '#bdb6a8', trim: '#d8d2c4' },   // 낡은 가게 — 네온 간판
    back:   { F: 44, old: true, roof: '#8a867e', wall: '#8f8b84', trim: '#a8a49c' }    // 낡은 뒤 건물
  };
  // 빛깔 — 유리 · 더 밝은 유리 · 빛 띠 · 불 켜진 창 · 옥상. 길드 넷(붉은 불꽃 · 푸른 파도 · 금빛 왕관 · 보랏빛 달) · 둘레의 빌딩 셋 · 협회
  const GUILD_TONE = [
    { glass: '#3d1d24', glass2: '#57262e', accent: '#ff5a3c', light: '#ffb8a4', roof: '#33262a' },
    { glass: '#17314c', glass2: '#1f4568', accent: '#3fc0ff', light: '#bfeaff', roof: '#232d38' },
    { glass: '#3d3319', glass2: '#574823', accent: '#ffc93c', light: '#fff0b4', roof: '#33301f' },
    { glass: '#2b1d47', glass2: '#3d2a63', accent: '#b678ff', light: '#e6d2ff', roof: '#2a2535' }
  ];
  const TOWER_TONE = [
    { glass: '#1d2f45', glass2: '#284260', accent: '#62e6ee', light: '#c8f4f8', roof: '#262d38' },
    { glass: '#24333a', glass2: '#31474f', accent: '#7fe3b0', light: '#d2f6e4', roof: '#272f30' },
    { glass: '#2a2d3d', glass2: '#3a3f56', accent: '#9fb4ff', light: '#dbe3ff', roof: '#292b36' }
  ];
  const HQ_TONE = { glass: '#16263f', glass2: '#1f3a61', accent: '#62e6ee', light: '#d6f8fb', roof: '#232c3b' };
  const MY_TONE = [
    { glass: '#14353a', glass2: '#1d4a52', accent: '#62e6ee', light: '#d2f8fa', roof: '#24323a' },   // 4단계 — 번듯한 청록 유리
    { glass: '#1c2a36', glass2: '#e8e2d0', accent: '#f0c850', light: '#fff4c8', roof: '#e6e0d2' }    // 5단계 — 흰 돌 · 금 테 (4대 길드보다)
  ];
  const DEPT_TONE = { accent: '#c9a24a', roof: '#cfc6b4' };
  const EMBLEM = [
    ['...#....', '..##....', '..###.#.', '.####.##', '.#######', '########', '.######.', '..####..'],   // 불꽃
    ['........', '..##....', '.#..#..#', '#....##.', '..##....', '.#..#..#', '#....##.', '........'],   // 파도
    ['........', '#..##..#', '#.####.#', '########', '########', '.######.', '.######.', '........'],   // 왕관
    ['..####..', '.###....', '###.....', '###.....', '###.....', '###....#', '.###..##', '..#####.']    // 달
  ];
  const emblemAt = (n, ix, iy, k) => ix >= 0 && iy >= 0 && ix < 8 * k && iy < 8 * k && EMBLEM[n][(iy / k) | 0][(ix / k) | 0] === '#';
  function cityGeom(B) {
    const S = CB[B.kind] || CB.back, W = B.w * P, Hh = B.h * P, F = B.roofOnly ? 0 : B.f ? Math.min(B.f * P, Hh - 14) : Math.min(S.F, Hh - 14), roofH = Hh - F;   // roofOnly — 지도 아래 끝의 건물: 옥상만 (벽면은 지도 밖)
    const G = { S, W, Hh, F, roofH, old: !!S.old, cut: S.cut || 0, items: [], tone: null, step: null, mid: null,
      door: B.door ? { x0: (B.door.x - B.x0) * P, x1: (B.door.x - B.x0 + B.door.w) * P } : null };
    if (B.kind === 'hq') {                                                         // 가운데 탑이 양 날개보다 높음
      const a = Math.round(W * 0.3), b = W - a, up = Math.max(0, Math.min(36, roofH - 30));
      G.tone = HQ_TONE; G.mid = [a, b]; G.step = px => (px >= a && px < b ? roofH - up : roofH);
    } else if (B.kind === 'guild') G.tone = GUILD_TONE[(B.tone || 0) % 4];
    else if (B.kind === 'tower') G.tone = TOWER_TONE[(B.tone || 0) % 3];
    else if (B.kind === 'mineNew') G.tone = MY_TONE[B.glv >= 5 ? 1 : 0];
    else if (B.kind === 'apt') G.tone = APT_TONE;
    else if (B.kind === 'dept') G.tone = DEPT_TONE;
    if (!G.old) return G;
    G.pal = oldPal(B);
    const items = G.items, rnd = n => hash(B.x0 * 7 + n, B.y0 * 13 + n, 340);
    if (B.roof === 'tank') items.push({ type: 'tank', x: W - 19, y: 6, w: 11, h: 13 });
    const free = it => items.every(q => it.x + it.w + 2 < q.x || q.x + q.w + 2 < it.x || it.y + it.h + 2 < q.y || q.y + q.h + 2 < it.y);
    for (let n = 0; n < 8 && items.filter(q => q.type === 'ac').length < (B.kind === 'back' ? 1 : 3); n++) {
      const it = { type: 'ac', x: 5 + ((rnd(n) * Math.max(1, W - 18)) | 0), y: 5 + ((rnd(n + 20) * Math.max(1, roofH - 16)) | 0), w: 8, h: 6 };
      if (it.x + it.w < W - 4 && it.y + it.h < roofH - 4 && free(it)) items.push(it);
    }
    return G;
  }
  function roofItem(G, rx, ry, base) {
    for (const it of G.items) {
      if (rx >= it.x && rx < it.x + it.w && ry >= it.y && ry < it.y + it.h) {
        const ix = rx - it.x, iy = ry - it.y;
        if (it.type === 'tank') {                                                  // 물탱크 — 둥근 뚜껑 · 몸통 · 다리
          if (iy >= it.h - 2) return ix === 1 || ix === it.w - 2 ? c3('#3a3a40') : base;
          if (iy < 3) return iy === 0 ? c3('#9cd0e8') : c3('#6eb0d2');
          if (ix === 0 || ix === it.w - 1) return c3('#2f6688');
          return ix < 3 ? c3('#79bbdc') : iy % 4 === 1 ? c3('#3f7fa6') : c3('#4c8fb5');
        }
        if (iy === 0) return c3('#e2e0da');                                         // 실외기 — 위는 밝게 · 가운데 둥근 팬
        if (Math.hypot(ix - 2.5, iy - 3) < 2) return c3('#5a5852');
        return ix === it.w - 1 || iy === it.h - 1 ? c3('#8f8d87') : c3('#c8c6c0');
      }
      if ((rx === it.x + it.w && ry > it.y && ry <= it.y + it.h) || (ry === it.y + it.h && rx > it.x && rx <= it.x + it.w)) return mul(base, 0.72);
    }
    return null;
  }
  function cityBuilding(B, px, py, X, Y) {
    const G = B.G || (B.G = cityGeom(B)), W = G.W, Hh = G.Hh;
    if (G.cut) {                                                                    // 깎은 위 모서리 — 그 밖은 보도가 보임
      const dl = px + py, dr = W - 1 - px + py;
      if (dl < G.cut || dr < G.cut) return slab(X, Y);
      if (dl === G.cut || dr === G.cut) return c3('#12141a');
    }
    if (px === 0 || px === W - 1 || py === 0) return c3(G.old ? '#24222b' : '#12141a');   // 둘레 한 점 테두리
    if (py === Hh - 1) return c3('#1c1d22');
    if (G.old) return oldBuilding(B, G, px, py, X, Y);
    const rh = G.step ? G.step(px) : G.roofH;
    if (G.step && py >= rh && py < Math.max(G.step(px - 1), G.step(px + 1))) return c3('#12141a');   // 가운데 탑이 날개 위로 솟은 세로 모서리
    if (py < rh) return futureRoof(B, G, px, py, rh, X, Y);
    const fy = py - rh, F = Hh - rh;
    let c;
    if (fy >= F - 2) c = fy === F - 1 ? c3('#15161b') : c3('#2c2f38');             // 바닥 턱
    else c = B.kind === 'hq' ? hqFace(B, G, px, fy, F) : B.kind === 'dept' ? deptFace(B, G, px, fy, F) : towerFace(B, G, px, fy, F);
    if (px <= 1) c = mix(c, WHITE, 0.07); else if (px >= W - 2) c = mul(c, 0.84);
    return c;
  }
  // 미래 건물의 옥상 — 밝은 난간 · 둘레를 도는 빛 띠 · 판 이음매, 그 위에 착륙장(협회 H · 길드 문장) · 태양 유리 · 옥상 정원
  function futureRoof(B, G, px, py, rh, X, Y) {
    const T = G.tone, W = G.W, dept = B.kind === 'dept', trim = c3(dept ? '#efe6d2' : '#9aa6b8');
    if (py >= rh - 3) return py === rh - 3 ? trim : mul(trim, py === rh - 1 ? 0.6 : 0.8);        // 앞쪽 처마
    let l = px, r = W - 1 - px, x0 = 0, x1 = W;                                     // 이 옥상 조각의 왼쪽 · 오른쪽 끝
    if (G.mid) {
      if (px >= G.mid[0] && px < G.mid[1]) { x0 = G.mid[0]; x1 = G.mid[1]; l = px - x0; r = x1 - 1 - px; }
      else if (px < G.mid[0]) { x1 = G.mid[0]; r = 99; } else { x0 = G.mid[1]; l = 99; }
    }
    const d = Math.min(l, r, py);
    if (d <= 2) return d === 1 ? trim : mul(trim, 0.8);                             // 난간
    const base = c3(T.roof);
    if (!dept) { if (d === 4) return c3(T.accent); if (d === 5) return mix(base, c3(T.accent), 0.3); }
    let c = mul(base, 0.94 + vnoise(X * 0.07, Y * 0.07, 341) * 0.12);
    if (px % 12 === 0 || py % 12 === 0) c = mul(c, 0.9);
    if (G.mid && px >= G.mid[1] && px < G.mid[1] + 7) c = mul(c, 0.72);             // 탑이 오른쪽 날개에 드리운 그늘
    const cw = x1 - x0, cx = (x0 + x1) / 2, cy = rh / 2 + 1;
    if (dept) {                                                                     // 백화점 — 옥상 정원 · 파라솔 · 유리 지붕
      if (px > 10 && px < W * 0.42 && py > 9 && py < rh - 10) {                     // 정원
        const gx = px - 10, gy = py - 9;
        if (gx < 2 || gy < 2 || px > W * 0.42 - 3 || py > rh - 13) return c3('#d9d2c0');
        if (Math.hypot((gx % 18) - 9, (gy % 16) - 8) < 4.2) return (gx + gy) % 3 === 0 ? c3('#2f6a34') : c3('#3f8a44');
        return texture(GRASS, 0, X, Y);
      }
      if (px > W * 0.46 && px < W * 0.56 && py > 8 && py < rh - 9) return (px + py) % 8 === 0 || px % 10 === 0 ? c3('#e9f6fa') : c3('#8fc6dc');   // 유리 지붕
      if (px > W * 0.6 && py > 9 && py < rh - 10) {                                 // 파라솔 놓인 테라스
        const qx = ((px - W * 0.6) % 22) - 11, qy = ((py - 9) % 20) - 10, rr = Math.hypot(qx, qy);
        if (rr < 6) return rr < 1.2 ? c3('#5a4632') : (Math.floor((Math.atan2(qy, qx) + Math.PI) / (Math.PI / 4)) & 1) ? c3('#c0392b') : c3('#f3ede4');
        if (rr < 7 && qx > 0 && qy > 0) return mul(c, 0.78);
      }
      return c;
    }
    const R = Math.min(cw, rh) / 2 - 10;
    if (B.kind === 'tower' || B.kind === 'apt') {                                   // 둘레의 빌딩 · 새 집 — 옥상 정원이거나 태양 유리
      const kind = hash(B.x0, B.y0, 352);
      if (px > x0 + 8 && px < x1 - 9 && py > 8 && py < rh - 9) {
        if (kind < 0.5) {
          const gx = px - x0 - 8, gy = py - 8;
          if (Math.hypot((gx % 16) - 8, (gy % 14) - 7) < 3.6) return (gx + gy) % 3 === 0 ? c3('#2f6a34') : c3('#3f8a44');
          return gx % 16 === 0 || gy % 14 === 0 ? c3('#aeb6c2') : texture(GRASS, 0, X, Y);
        }
        const gx = (px - x0 - 8) % 11, gy = (py - 8) % 7;
        return gx === 10 || gy === 6 ? c3('#39465c') : (gx + gy) % 9 === 0 ? c3('#4c6ea8') : c3('#1b2f52');
      }
      return c;
    }
    if (R >= 9 && !(B.kind === 'hq' && (px < G.mid[0] || px >= G.mid[1]))) {        // 착륙장 — 빛나는 두 겹 고리, 가운데에 협회는 H · 길드는 문장 (협회의 날개는 태양 유리)
      const dd = Math.hypot(px - cx, py - cy);
      if (Math.abs(dd - R) < 1.3) return c3(T.accent);
      if (Math.abs(dd - R * 0.66) < 0.8) return mix(c, c3(T.accent), 0.55);
      if (dd < R) {
        c = mul(c, 1.14);
        if (B.kind === 'hq') {
          const hx = Math.round(px - cx) + 5, hy = Math.round(py - cy) + 6;
          if (hx >= 0 && hx < 10 && hy >= 0 && hy < 12 && (hx < 3 || hx > 6 || hy === 5 || hy === 6)) return c3('#eafcff');
        } else if (B.kind === 'mineNew') {                                          // 내 길드 — 네 갈래 별
          const ax = Math.abs(px - cx), ay = Math.abs(py - cy), s = R * 0.55;
          if (ax + ay < s * 0.45 || (ax < 1.6 && ay < s) || (ay < 1.6 && ax < s)) return mix(c3(T.accent), WHITE, B.glv >= 5 ? 0.15 : 0.3);
        } else {
          const k = R >= 16 ? 2 : 1;
          if (emblemAt((B.tone || 0) % 4, Math.round(px - cx) + 4 * k, Math.round(py - cy) + 4 * k, k)) return mix(c3(T.accent), WHITE, 0.3);
        }
      }
    }
    if (B.kind === 'hq' && (px < G.mid[0] || px >= G.mid[1]) && px > x0 + 8 && px < x1 - 9 && py > 8 && py < rh - 9) {   // 날개 — 태양 유리
      const gx = (px - x0 - 8) % 11, gy = (py - 8) % 7;
      return gx === 10 || gy === 6 ? c3('#39465c') : (gx + gy) % 9 === 0 ? c3('#4c6ea8') : c3('#1b2f52');
    }
    return c;
  }
  // 유리 벽면의 바탕 — 세로 창살 · 층 줄 · 비친 하늘 · 군데군데 불 켜진 창
  // pw — 유리 한 칸의 너비(점). 둘레 빌딩은 16 (한 칸에 유리 하나 — 잘리는 유리 없이, 7칸이어도 한 줄에 7개), 길드는 8 그대로
  function glassWall(T, fx, fy, seed, pw = 8) {
    const gx = Math.floor(fx / pw);
    if (fx % pw === 0) return mul(c3(T.glass), 0.72);
    if (fy % 7 === 3) return mul(c3(T.glass), 0.8);
    let c = c3((gx + ((fy / 7) | 0)) % 5 === 0 ? T.glass2 : T.glass);
    if ((((fx * 0.6 + fy) % 46) + 46) % 46 < 7) c = mix(c, c3(T.light), 0.22);
    if (hash(gx, (fy / 7) | 0, seed) < 0.16) c = mix(c, c3(T.light), 0.55);
    return c;
  }
  // 빛나는 문 — 틀과 가운데 이음은 빛 띠, 안은 환한 유리
  function glowDoor(T, door, fx, fy, top) {
    if (fy === top) return c3(T.accent);
    if (fx === door.x0 + 1 || fx === door.x1 - 2 || fx === Math.round((door.x0 + door.x1) / 2)) return c3(T.accent);
    return mix(c3(T.light), c3(T.glass2), Math.min(0.6, 0.2 + (fy - top) * 0.03));
  }
  // 길드 · 둘레 빌딩의 벽면 — 짙은 유리에 빛 기둥 둘(몬스터 핵의 빛이 흐르는 줄), 길드는 위쪽 가운데에 문장 판, 1층은 어두운 로비와 빛나는 문
  function towerFace(B, G, fx, fy, F) {
    const T = G.tone, W = G.W, door = G.door, base = F - 16;
    if (fy <= 1) return c3('#9aa6b8');
    if (fy === 2) return mul(c3(T.glass), 0.6);
    if (fy >= base) {
      if (door && fx >= door.x0 + 1 && fx < door.x1 - 1) return glowDoor(T, door, fx, fy, base);
      if (fy === base) return c3('#0f1116');
      if (fx % 16 < 2) return c3('#3a3f4a');
      return mix(c3(T.glass), c3('#0b0d12'), (fx + fy) % 9 === 0 ? 0.25 : 0.45);
    }
    const q1 = W >> 2, q3 = W - (W >> 2) - 2;
    if (fx === q1 || fx === q3) return c3(T.accent);
    if (fx === q1 + 1 || fx === q3 + 1) return mix(c3(T.accent), WHITE, 0.4);
    if (fx === q1 - 1 || fx === q3 + 2) return mix(c3(T.glass), c3(T.accent), 0.35);
    if (B.kind === 'apt') {                                                         // 새 집 — 층마다 밝은 발코니 판 · 난간, 창은 따뜻한 불빛
      const fl = (fy - 3) % 12;
      if (fy >= 3 && fl === 0) return c3('#ece4d4');
      if (fy >= 3 && fl === 1) return c3('#b8ae9c');
      if (fy >= 3 && (fl === 9 || fl === 10) && fx % 4 !== 0) return c3('#d8d0c0');
      if (fy >= 3 && fl >= 3 && fl <= 8 && fx % 12 > 2 && fx % 12 < 10) return mix(c3(T.light), c3('#f0b060'), hash(Math.floor(fx / 12), Math.floor(fy / 12), 905) * 0.5);
    }
    if (B.kind === 'mineNew') {                                                     // 내 길드 — 가운데 별 문장 (5단계는 금빛 테 · 빛나는 별)
      const ex = fx - (W >> 1) + 0.5, ey = fy - 22, ax = Math.abs(ex), ay = Math.abs(ey);
      if (ax <= 12 && ay <= 12) {
        const star = ax + ay < 5 || (ax < 1.6 && ay < 11) || (ay < 1.6 && ax < 11);
        if (ax > 11 || ay > 11) return c3(T.accent);
        return star ? mix(c3(T.accent), WHITE, B.glv >= 5 ? 0.55 : 0.3) : c3('#0e1016');
      }
      if (B.glv >= 5 && (fx === 2 || fx === W - 3)) return c3(T.accent);                // 5단계 — 양쪽 끝 금빛 기둥
    }
    if (B.kind === 'guild') {
      const k = 2, ex = fx - ((W >> 1) - 4 * k), ey = fy - 8;
      if (ex >= -3 && ex < 8 * k + 3 && ey >= -3 && ey < 8 * k + 3) {
        if (ex === -3 || ey === -3 || ex === 8 * k + 2 || ey === 8 * k + 2) return c3(T.accent);
        return emblemAt((B.tone || 0) % 4, ex, ey, k) ? mix(c3(T.accent), WHITE, 0.35) : c3('#0e1016');
      }
    }
    return glassWall(T, fx, fy, 350 + B.x0 * 3 + B.y0, B.kind === 'tower' ? 16 : 8);
  }
  // 헌터 협회 — 가운데 탑엔 위에서 아래로 흐르는 빛줄과 방패 문장(H), 양 날개엔 가로 빛 띠, 아래는 넓은 계단과 환한 문
  function hqFace(B, G, fx, fy, F) {
    const T = G.tone, W = G.W, door = G.door, mid = fx >= G.mid[0] && fx < G.mid[1], cx = W >> 1;
    if (fy <= 1) return c3('#b6c2d2');
    if (fy === 2) return mul(c3(T.glass), 0.6);
    const base = F - (mid ? 26 : 16);
    if (fy >= base) {
      if (mid) {
        if (fy >= F - 8) return ((fy - (F - 8)) >> 1) & 1 ? c3('#aab3bf') : c3('#d6dde5');                 // 계단
        if (door && fx >= door.x0 + 1 && fx < door.x1 - 1) return glowDoor(T, door, fx, fy, base);
        if (fy === base) return c3(T.accent);
        if ((fx - G.mid[0]) % 20 < 3) return c3('#c2ccd8');                                                 // 흰 기둥
        return mix(c3(T.glass2), c3(T.light), (fx + fy) % 11 === 0 ? 0.5 : 0.18);
      }
      if (fy === base) return c3('#0f1116');
      if (fx % 16 < 2) return c3('#3a3f4a');
      return mix(c3(T.glass), c3('#0b0d12'), (fx + fy) % 9 === 0 ? 0.25 : 0.45);
    }
    if (mid) {
      const sx = fx - cx, sy = fy - 12;                                              // 방패 문장 — 흰 테 · 남색 바탕 · H
      const half = y => (y < 0 || y >= 36 ? -1 : y < 20 ? 16 : 16 - (y - 20) * 1.06);
      if (Math.abs(sx) <= half(sy)) {
        if (Math.abs(sx) > half(sy) - 2 || sy < 2 || Math.abs(sx) > half(sy + 2)) return c3('#eafcff');
        if ((Math.abs(sx) >= 5 && Math.abs(sx) <= 7 && sy >= 7 && sy <= 24) || (Math.abs(sx) <= 7 && sy >= 14 && sy <= 16)) return c3('#eafcff');
        return c3('#0f1f38');
      }
      if (Math.abs(sx) <= 1) return mix(c3(T.accent), WHITE, 0.5);                   // 가운데 빛줄
      if (Math.abs(sx) <= 3) return c3(T.accent);
      if (Math.abs(sx) === 4) return mix(c3(T.glass2), c3(T.accent), 0.4);
      const c = glassWall({ glass: T.glass2, glass2: '#28497a', light: T.light }, fx, fy, 351);
      return c;
    }
    const b1 = Math.round(F * 0.3), b2 = Math.round(F * 0.58);                       // 날개 — 가로 빛 띠 둘
    if (fy === b1 || fy === b2) return c3(T.accent);
    if (fy === b1 + 1 || fy === b2 + 1) return mix(c3(T.glass), c3(T.accent), 0.45);
    return glassWall(T, fx, fy, 353);
  }
  // 헌터백화점 — 금테 두른 상아색 벽, 층마다 따뜻하게 빛나는 진열창(마네킹), 붉은 깃발, 금빛 문장의 간판, 1층 줄무늬 차양과 환한 문
  function deptFace(B, G, fx, fy, F) {
    const W = G.W, door = G.door, cx = door ? Math.round((door.x0 + door.x1) / 2) : W >> 1;
    const nW = Math.floor((W - 2) / 24), oW = Math.floor((W - (nW * 24 - 4)) / 2), rx = fx - oW, inW = rx >= 0 && rx < nW * 24 - 4;   // 진열창 — 다 들어가는 것만 가운데로 (잘린 창 없게)
    const gold = c3('#c9a24a'), ivory = c3('#ebe4d4');
    if (fy <= 1) return gold;
    if (fy === 2) return mul(ivory, 0.7);
    if (fy < 15) {                                                                  // 간판 띠
      if (fy === 3 || fy === 14) return gold;
      const sx = fx - cx, sy = fy - 8.5;
      if (Math.abs(sx) + Math.abs(sy) * 1.6 <= 9) {                                 // 가운데 금빛 마름모 안의 H
        if (Math.abs(sx) + Math.abs(sy) * 1.6 > 7.4) return gold;
        return (Math.abs(sx) >= 2 && Math.abs(sx) <= 3 && Math.abs(sy) <= 3) || (Math.abs(sx) <= 3 && Math.abs(sy) < 1) ? c3('#ffe9a8') : c3('#4a0f18');
      }
      const m = ((fx - cx) % 26 + 26) % 26 - 13;
      return Math.abs(m) + Math.abs(sy) * 1.4 <= 3 && Math.abs(sx) > 16 ? gold : c3('#6f1a26');
    }
    const ground = F - 29;
    const inDoor = door && fx >= door.x0 + 1 && fx < door.x1 - 1;
    if (fy >= ground) {                                                             // 1층
      if (inDoor) {
        if (fy < ground + 4) return fy === ground + 3 ? mul(gold, 0.7) : gold;      // 문 위 금빛 캐노피
        if (fy >= F - 4) return c3('#b0202e');                                      // 붉은 깔개
        if (fx === door.x0 + 1 || fx === door.x1 - 2 || fx === cx || (fx - door.x0) % 16 === 0) return gold;
        return mix(c3('#fff3cf'), c3('#f2c26a'), (fy - ground) * 0.02);
      }
      if (fy < ground + 4) return ((fx >> 2) & 1) ? c3('#b0202e') : c3('#f3ede4');  // 줄무늬 차양
      if (fy === ground + 4) return mul(c3('#3a2c1c'), 0.9);
      const bx = inW ? ((rx % 24) + 24) % 24 : 21;
      if (bx >= 20) return fy > F - 8 ? mul(ivory, 0.9) : ivory;                    // 창 사이 기둥
      if (bx === 0 || bx === 19 || fy >= F - 5) return gold;
      let c = mix(c3('#ffe9b0'), c3('#f5b860'), (fy - ground) / 29);
      const mx = bx - 10, my = fy - (ground + 10);                                   // 마네킹
      if ((Math.abs(mx) <= 1 && my >= 0 && my <= 1) || (Math.abs(mx) <= 2 && my >= 3 && my <= 12)) c = mix(c, c3('#6a4a2c'), 0.75);
      return c;
    }
    const fl = (fy - 15) % 20, bx = inW ? ((rx % 24) + 24) % 24 : 21;                // 위 두 층
    if (bx >= 20) {                                                                 // 기둥 — 셋에 하나는 붉은 깃발
      if (inW && Math.floor(rx / 24) % 3 === 1 && bx >= 21 && bx <= 22 && fy < ground - 3) return fy % 20 === 14 ? gold : c3('#b0202e');
      return bx === 20 || bx === 23 ? mul(ivory, 0.9) : ivory;
    }
    if (fl < 2 || fl > 17) return fl === 18 ? gold : ivory;                          // 층 사이 띠
    const arch = fl < 5 && (bx < 5 - fl || bx > 14 + fl);                            // 둥근 창 머리
    if (arch) return ivory;
    if (bx === 0 || bx === 19 || fl === 2 || (fl < 6 && (bx === 5 - fl + 0 || bx === 14 + fl))) return gold;
    let c = mix(c3('#fff0c4'), c3('#f7c476'), fl / 18);
    const mx = bx - 10, my = fl - 8;
    if ((Math.abs(mx) <= 1 && my >= 0 && my <= 1) || (Math.abs(mx) <= 2 && my >= 3 && my <= 9)) c = mix(c, c3('#6a4a2c'), 0.7);
    return c;
  }
  // 옛 동네의 낡은 건물 — 옥상(난간 · 실외기 · 물탱크)과 벽면
  function oldBuilding(B, G, px, py, X, Y) {
    const S = G.pal, W = G.W, F = G.F;
    if (py < G.roofH) {
      const roof = c3(S.roof);
      if (py >= G.roofH - 3) return py === G.roofH - 3 ? c3(S.trim) : py === G.roofH - 1 ? mul(c3(S.trim), 0.72) : mul(c3(S.trim), 0.88);
      if (py <= 2 || px <= 2 || px >= W - 3) return py === 1 || px === 1 ? c3(S.trim) : mul(c3(S.trim), 0.86);
      if (py === 3 || px === 3) return mul(roof, 0.78);
      const it = roofItem(G, px, py, roof);
      if (it) return it;
      let c = mul(roof, 0.94 + vnoise(X * 0.08, Y * 0.08, 341) * 0.12);
      if ((px % 16 === 0 || py % 16 === 0) && B.kind !== 'villa') c = mul(c, 0.9);
      if (B.kind === 'shabby' && fbm(X * 0.05, Y * 0.05, 354) > 0.6) c = mix(c, c3('#4a5258'), 0.4);   // 고인 물 자국
      return hash(X, Y, 342) < 0.03 ? mul(c, 0.9) : c;
    }
    const fx = px, fy = py - G.roofH;
    let c;
    if (fy >= F - 2) c = fy === F - 1 ? c3('#3a373f') : c3('#55515a');
    else if (fy <= 1) c = c3(S.trim);
    else if (fy === 2) c = mul(c3(S.wall), 0.7);
    else c = oldFace(B, G, fx, fy, X, Y);
    if (fx <= 1) c = mix(c, WHITE, 0.08); else if (fx >= W - 2) c = mul(c, 0.86);
    return c;
  }
  // 옛 동네 건물의 빛깔 · 창 모양 — 건물마다 번호 v(tools/map-gen.js 가 종류마다 차례로 매김)로 골라, 한 지도 안의 건물이 모두 다르게 보이게 (사용자 결정)
  const OLD_PAL = {
    villa: { wall: [['#a35f48', '#984f3c', '#ad6a52', '#7e4535'], ['#8a5a3c', '#7f5034', '#956445', '#63402a'], ['#c9b28a', '#bea67c', '#d3bd97', '#9c8762'],
                    ['#9a948c', '#8f8981', '#a59f97', '#726d66'], ['#d8d2c6', '#cdc6b8', '#e2dcd0', '#a9a294']],
             roof: ['#6f9a78', '#5f86a8', '#8a8a84', '#b5866a'], glass: ['#8db4cc', '#9cc4b8', '#a8b8d8'] },
    store: { wall: ['#bdb6a8', '#a8b4b8', '#c4b08e', '#b0a0a8', '#a9b39a'],
             neon: [['#ff4fa3', '#7ef2e0'], ['#ffd23a', '#7cf27e'], ['#ff4a4a', '#f4f4f4'], ['#4aa3ff', '#ffa04a'], ['#c06bff', '#c8ff5a']],
             awn: ['#7a3a44', '#2f5f7a', '#3f6a3a', '#7a6a2a'], roof: ['#938d83', '#8a9090', '#9a8a78', '#86807a'] },
    back: { wall: ['#8f8b84', '#7f8a8c', '#9a8f80', '#8a8072', '#a09a90'], roof: ['#8a867e', '#7e8486', '#928a7e', '#857c70', '#9a948a'] }
  };
  function oldPal(B) {
    const S = CB[B.kind] || CB.back, v = B.v | 0, P5 = Math.floor(v / 5);
    if (B.kind === 'villa') {
      const w = OLD_PAL.villa.wall[v % 5];
      return { wall: w[0], bricks: w.slice(0, 3), mortar: w[3], roof: OLD_PAL.villa.roof[(v + P5) % 4], trim: S.trim, win: P5 % 3, glass: OLD_PAL.villa.glass[(v + P5 * 2) % 3] };
    }
    if (B.kind === 'store') return { wall: OLD_PAL.store.wall[v % 5], neon: OLD_PAL.store.neon[(v * 2 + P5) % 5], awn: OLD_PAL.store.awn[(v + P5) % 4], roof: OLD_PAL.store.roof[(v + P5 * 3) % 4], trim: S.trim };
    if (B.kind === 'back') return { wall: OLD_PAL.back.wall[v % 5], roof: OLD_PAL.back.roof[(v + P5 * 2) % 5], trim: S.trim, poster: P5 % 3 === 1, tag: P5 % 3 === 2 };
    return { wall: S.wall, roof: S.roof, trim: S.trim };
  }
  // 창을 줄지어 놓을 때 — 다 들어가는 것만, 가운데로 모아서 (잘린 창이 없게). 첫 창의 왼쪽 끝 · 개수
  function windowRow(W, ww, pitch, margin) {
    const n = Math.max(0, Math.floor((W - 2 * margin - ww) / pitch) + 1);
    return { n, x0: Math.floor((W - ((n - 1) * pitch + ww)) / 2) };
  }
  function oldFace(B, G, fx, fy, X, Y) {
    const S = G.pal, W = G.W, F = G.F, wall = c3(S.wall), k = B.kind, door = G.door;
    const inDoor = door && fx >= door.x0 + 2 && fx < door.x1 - 2;
    const glass = (wx, wy, ww, wh, tint) => {
      if (wx === 0 || wy === 0 || wx === ww - 1 || wy === wh - 1) return c3('#e6e1d7');
      return (wx + wy) % 6 === 0 ? mix(c3(tint), WHITE, 0.55) : wy < 2 ? mul(c3(tint), 0.82) : c3(tint);
    };
    if (k === 'store') {                                                            // 낡은 가게 — 네온 간판(빛깔은 가게마다), 차양, 흐린 진열창
      const signTop = F - 24, signBot = F - 18, awn = F - 17;
      if (fy >= signTop && fy < signBot) {
        if (fy === signTop || fy === signBot - 1) return c3(S.neon[0]);
        const gx = fx % 9, on = hash(Math.floor(fx / 9), B.x0, 355) < 0.75;
        return on && gx >= 2 && gx <= 6 && (fy - signTop) >= 2 && (fy - signTop) <= 3 ? c3(S.neon[1]) : c3('#241a2c');
      }
      if (fy >= awn && fy < awn + 3) return ((fx >> 2) & 1) ? c3(S.awn) : c3('#cfc6b8');
      if (fy >= awn + 3) {
        if (fy === awn + 3) return c3('#34343c');
        if (fx % 12 === 0) return c3('#2d3a46');
        const c = c3('#4f6878');
        return ((fx + fy * 2) % 22 + 22) % 22 < 4 ? mix(c, WHITE, 0.25) : c;
      }
      const R = windowRow(W, 10, 14, 4), rows = signTop >= 12 ? Math.floor((signTop - 12) / 11) + 1 : 0;
      const ix = fx - R.x0, wx = ((ix % 14) + 14) % 14, wy = (fy - 4) % 11, j = Math.floor((fy - 4) / 11);
      if (ix >= 0 && ix < R.n * 14 && wx < 10 && fy >= 4 && j < rows && wy >= 1 && wy < 8) return glass(wx, wy - 1, 10, 7, '#7d9bb0');
      return fbm(X * 0.05, Y * 0.05, 356) > 0.6 ? mul(wall, 0.88) : wall;
    }
    if (k === 'villa') {                                                            // 빌라 — 1층은 필로티(어두운 주차 칸 · 기둥) · 문, 위층은 벽돌에 창 (창 모양은 셋 중 하나)
      if (fy >= F - 13) {
        if (inDoor) {
          if (fy === F - 13) return c3('#c94b3c');
          return fx === door.x0 + 2 || fx === door.x1 - 3 ? c3('#cfc9be') : fy % 4 === 0 ? c3('#6b8a9e') : c3('#3d5566');
        }
        if (((fx % 18) + 18) % 18 < 3) return fy === F - 13 ? c3('#cfc8bb') : c3('#bdb6aa');
        return fy === F - 13 ? c3('#1c1b20') : c3('#26252b');
      }
      const row = fy >> 2, off = row & 1 ? 4 : 0;
      let c = (fy & 3) === 3 || ((fx + off) & 7) === 0 ? c3(S.mortar) : c3(S.bricks[(hash((fx + off) >> 3, row, 345) * 3) | 0]);
      const ww = S.win === 1 ? 10 : 8, R = windowRow(W, ww, 13, 4), rows = F >= 24 ? Math.floor((F - 24) / 10) + 1 : 0;
      const ix = fx - R.x0, wx = ((ix % 13) + 13) % 13, wy = (fy - 3) % 10, j = Math.floor((fy - 3) / 10);
      if (ix < 0 || ix >= R.n * 13 || wx >= ww || fy < 3 || j >= rows) return c;
      if (S.win === 1) {                                                            // 넓은 창 + 발코니 난간
        if (wy >= 1 && wy < 6) return glass(wx, wy - 1, 10, 5, S.glass);
        if (wy === 6) return c3('#3a3a40');
        if (wy === 7) return wx % 3 === 0 ? c3('#3a3a40') : c;
        return c;
      }
      if (S.win === 2) {                                                            // 작은 창 둘
        if (wy >= 1 && wy < 7 && (wx < 3 || wx > 4)) return glass(wx < 3 ? wx : wx - 5, wy - 1, 3, 6, S.glass);
        if (wy === 7 && (wx < 3 || wx > 4)) return c3('#d8d2c6');
        return c;
      }
      if (wy >= 1 && wy < 7) return wx === 4 ? c3('#e6e1d7') : glass(wx, wy - 1, 8, 6, S.glass);
      if (wy === 7) return c3('#d8d2c6');
      return c;
    }
    if (k === 'mine') {                                                             // 내 길드 2 · 3단계 — 고친 창(불 켜짐) · 새 칠 · 유리문 · (3) 간판 띠 · 차양 · 꽃상자
      const L = B.glv, gf = F - 15;
      if (fy >= gf) {
        if (fy < gf + 3) {                                                          // 간판 띠 — 3단계는 청록 테 두른 남색 간판
          if (L < 3) return c3(fy === gf ? '#8f897c' : '#bdb6a8');
          if (fx < 2 || fx > W - 3 || fy === gf) return c3('#62e6ee');
          return fy === gf + 1 && fx > 4 && fx < W - 5 && fx % 5 < 3 ? c3('#f4f1e8') : c3('#1d3348');
        }
        if (L >= 3 && fy === gf + 3) return (fx >> 2) & 1 ? c3('#2f6a5a') : c3('#e8e2d4');   // 차양
        if (inDoor) return fx === door.x0 + 2 || fx === door.x1 - 3 ? c3('#3a3f4a') : mix(c3('#ffe6a8'), c3('#f5b860'), (fy - gf) / 15);   // 유리문 · 따뜻한 불빛
        if (fx % 24 < 2) return c3('#7b7468');
        return (fx + fy) % 7 === 0 ? c3('#e2eef2') : c3(L >= 3 ? '#9cc4d0' : '#8fa8b4');   // 진열창
      }
      let c = mul(c3(L >= 3 ? '#e2d4b4' : S.wall), 0.95 + vnoise(X * 0.1, Y * 0.1, 347) * 0.08);
      const R = windowRow(W, 9, 13, 4), rows = gf >= 12 ? Math.floor((gf - 12) / 10) + 1 : 0;
      const ix = fx - R.x0, cx = Math.floor(ix / 13), wx = ((ix % 13) + 13) % 13, wy = (fy - 4) % 10, cy = Math.floor((fy - 4) / 10), h = hash(cx, cy, 359 + B.x0);
      if (ix >= 0 && cx < R.n && fy >= 4 && cy < rows && wx < 9) {
        if (wy >= 1 && wy < 8) {
          if (wx === 0 || wx === 8 || wy === 1 || wy === 7) return c3('#f0ebe0');
          const lit = L >= 3 || h < 0.5;
          return lit ? mix(c3('#ffe6a8'), c3('#f5c46e'), wy / 8) : (wx + wy) % 6 === 0 ? c3('#cfe0ea') : c3('#7f9cae');
        }
        if (L >= 3 && wy === 8) return wx % 2 ? c3('#3f8a44') : c3(['#e05a6a', '#f0d040', '#f4f1e8'][(wx >> 1) % 3]);   // 꽃상자
      }
      return c;
    }
    if (k === 'shabby') {                                                           // 허름한 빈 건물 — 막아 둔 창 · 깨진 창 · 녹 자국 · 내린 셔터 · 「임대」 종이
      const gf = F - 15;
      if (fy >= gf) {
        if (fy < gf + 3) return hash(Math.floor(fx / 5), 0, 357) < 0.45 ? c3('#8f8778') : c3('#6f685c');   // 글자가 떨어져 나간 간판
        if (B.glv >= 1 && inDoor && fy >= gf + 7) return mix(c3('#ffd98a'), c3('#f5b860'), (fy - gf - 7) / 8);   // 1단계 — 셔터를 반쯤 올리고 불을 켬
        if (!B.glv && inDoor && fy >= gf + 5 && fy < gf + 11 && fx >= door.x0 + 6 && fx < door.x1 - 6) return (fx + fy) % 3 === 0 ? c3('#c0392b') : c3('#f2efe6');   // 「임대」 종이
        if (fx % 24 < 2) return c3('#7b7468');
        return fy % 2 ? c3('#6b6259') : c3('#5a5249');                              // 내린 셔터
      }
      let c = mul(wall, 0.9 + vnoise(X * 0.1, Y * 0.1, 347) * 0.16);
      if (fbm(X * 0.04, Y * 0.04, 348) > 0.58) c = mul(c, 0.84);
      if (hash(fx, 0, 358) < 0.07) c = mix(c, c3('#7a4a2c'), 0.5 * Math.max(0, 1 - fy / (gf * 0.8)));       // 흘러내린 녹
      const R = windowRow(W, 9, 13, 4), rows = gf >= 12 ? Math.floor((gf - 12) / 10) + 1 : 0;
      const ix = fx - R.x0, cx = Math.floor(ix / 13), wx = ((ix % 13) + 13) % 13, wy = (fy - 4) % 10, cy = Math.floor((fy - 4) / 10), h = hash(cx, cy, 359 + B.x0);
      if (ix >= 0 && cx < R.n && fy >= 4 && cy < rows && wx < 9 && wy >= 1 && wy < 8) {
        if (wx === 0 || wx === 8 || wy === 1 || wy === 7) return c3('#9a9488');
        if (h < 0.4) return wy % 2 ? c3('#7a5c3c') : c3('#64482c');                 // 판자로 막음
        if (h < 0.65) return (wx * 3 + wy) % 7 === 0 ? c3('#aab4ba') : c3('#1e2026');   // 깨진 창
        return (wx + wy) % 6 === 0 ? c3('#8f9ca4') : c3('#66747c');
      }
      return c;
    }
    // 뒤 건물 — 낡은 벽, 드문드문 작은 창 · 실외기 · 세로 배관 (어떤 것은 빛바랜 광고지). 문이 있으면(암시장이 들어설 자리) 내린 셔터
    if (door && fx >= door.x0 + 3 && fx < door.x1 - 3 && fy >= 4) {
      const mid = 4 + Math.floor((F - 4) * 0.45);
      if (B.bmo && fy >= mid && fx > door.x0 + 3 && fx < door.x1 - 4) return mix(c3('#2a1830'), c3('#7a4a9a'), Math.min(1, (fy - mid) / Math.max(1, F - mid)));   // 암시장 — 셔터를 반쯤 올림, 아래로 자줏빛
      return fx === door.x0 + 3 || fx === door.x1 - 4 ? c3('#3c3a40') : fy % 2 ? c3('#5d5a55') : c3('#4c4945');
    }
    if (!door && (fx === (W >> 2) || fx === (W >> 2) + 1)) return fx === (W >> 2) ? c3('#6d6a64') : c3('#8a8780');
    if (!door && S.poster) {                                                        // 빛바랜 광고지 — 가운데 위, 찢긴 귀퉁이
      const px0 = (W >> 1) - 7, py0 = 5, qx = fx - px0, qy = fy - py0;
      if (qx >= 0 && qx < 14 && qy >= 0 && qy < 11 && !(qx > 10 && qy > 7)) {
        if (qy < 3) return c3('#c46a5a');
        return (qy % 3 === 1 && qx > 1 && qx < 12) ? c3('#7a6f66') : c3('#e2d8c4');
      }
    }
    if (!door && S.tag && fy > F - 16 && fy < F - 5 && fx > 4 && fx < W - 5) {    // 아래쪽 벽의 낙서 — 굵은 색 줄이 구불구불
      const wave = Math.sin(fx * 0.35 + B.x0) * 2.2 + Math.sin(fx * 0.9) * 1.1, band = fy - (F - 11) - wave;
      if (Math.abs(band) < 1.6) return c3(['#e05a9a', '#4ac0e0', '#f0d040'][Math.floor(fx / 11) % 3]);
    }
    const nx = Math.floor((W - 2) / 9), ny = Math.max(0, Math.floor((F - 6) / 8)), cx = Math.floor(fx / 9), cy = Math.floor((fy - 3) / 8), ix = fx % 9, iy = (fy - 3) % 8, h = hash(cx, cy, 346 + B.x0);
    const full = cx < nx && fy >= 3 && cy < ny;                                     // 다 들어가는 칸에만 창 · 실외기
    if (!door && full && h < 0.22 && ix >= 2 && ix < 7 && iy >= 2 && iy < 6) return ix === 2 || iy === 2 ? c3('#4a5560') : c3('#5c6b78');
    if (!door && full && h > 0.86 && ix >= 1 && ix < 8 && iy >= 1 && iy < 7) return iy === 1 ? c3('#e2e0da') : Math.hypot(ix - 3, iy - 4) < 2 ? c3('#5a5852') : c3('#c8c6c0');
    let c = mul(wall, 0.92 + vnoise(X * 0.1, Y * 0.1, 347) * 0.14);
    if (fbm(X * 0.04, Y * 0.04, 348) > 0.62) c = mul(c, 0.86);
    return c;
  }

  // 가로등 — 몬스터 핵(빛나는 결정)을 얹은 기둥. 바위 칸(도시)에 나무처럼 따로 그림, 빛은 liveAir 가 숨 쉬듯
  const PYL_W = 12, PYL_H = 34;
  let pylonCv = null;
  function pylonSprite() {
    if (pylonCv) return pylonCv;
    const cv = document.createElement('canvas');
    cv.width = PYL_W; cv.height = PYL_H;
    const g = cv.getContext('2d'), img = g.createImageData(PYL_W, PYL_H), d = img.data;
    const put = (x, y, h) => { const c = c3(h), i = (y * PYL_W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    for (let y = 0; y < 12; y++) {                                                  // 결정 — 위아래로 뾰족한 마름모
      const hw = y < 6 ? y * 0.6 : (11 - y) * 0.6;
      for (let x = 0; x < PYL_W; x++) { const dx = Math.abs(x - 5.5); if (dx <= hw + 0.5) put(x, y, dx > hw - 0.6 ? '#2fa6b4' : x < 6 ? '#e9fdff' : '#8ef0f6'); }
    }
    for (let y = 12; y < PYL_H; y++) {                                              // 받침 고리 · 기둥 · 밑동
      const hw = y < 14 ? 3 : y > PYL_H - 4 ? 3 : 1;
      for (let x = 5 - hw + 1; x <= 5 + hw; x++) put(x, y, y < 14 ? '#aeb8c6' : x <= 5 ? '#5d6878' : '#39424f');
    }
    g.putImageData(img, 0, 0);
    return (pylonCv = cv);
  }

  // ---------- 이상한 게이트 — 옛 동네 집 옆 틈 · 지하수로 첫 공간 (나에게만 보임) ----------
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
  function drawRift(ctx, cx, by, T, t, k = 1) {                                    // k — 크기 (광장 위기 게이트는 크게 · 붉은 빛을 더함)
    const u = T / P * k;
    if (k > 1) {
      const rg = ctx.createRadialGradient(cx, by - RIFT_H * u * 0.45, 4 * u, cx, by - RIFT_H * u * 0.45, 34 * u);
      rg.addColorStop(0, `rgba(255,70,40,${(0.35 + 0.15 * Math.sin(t * 3)).toFixed(2)})`); rg.addColorStop(1, 'rgba(255,70,40,0)');
      ctx.fillStyle = rg; ctx.fillRect(cx - 34 * u, by - RIFT_H * u * 0.45 - 34 * u, 68 * u, 68 * u);
    }
    const spr = riftSprite(Math.floor(t * 8) % 8), gy = by - RIFT_H * u * 0.45, pulse = 0.75 + 0.25 * Math.sin(t * 2.3);
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
    if (e.raw === DOORWAY) return m.props && m.props.store ? storeDoorway(e, X, Y, lx, ly) : doorwayPix(e, X, Y, lx, ly);
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
    if (m.props && m.props.store) return storeGround(m, A, e, X, Y, lx, ly);   // 가게 안 (헌터백화점)
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
    const th = m.props && m.props.theme;
    STC = th === 'hq' ? STC_HQ : th === 'home' ? STC_HOME : th === 'home2' ? STC_HOME2 : th === 'bm' ? STC_BM : th === 'gate' ? STC_GATE : th === 'raid' ? STC_RAID : th === 'sand' ? STC_SAND : th === 'void' ? STC_VOID : th === 'witch' ? STC_WITCH : th === 'guild' ? STC_GUILD[Math.max(0, Math.min(4, GLV - 1))] : STC_DEPT;   // 가게 안의 빛깔 — 헌터백화점 · 헌터 협회 · 내 길드(단계마다)
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
    cherry:   { leaf: ['#a8456e', '#cf6f95', '#e99ab7', '#fbd0de'], line: '#5a2440', trunk: ['#3a2414', '#5a3a20', '#7a5530'] },   // 도시의 벚나무
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
    if (bio === CITY) return [h < 0.34 ? 'A' : h < 0.67 ? 'B' : 'C', (ter === GRASS || ter === TILES) && hash(x, y, 64) < 0.6 ? 'cherry' : 'kingdom'];   // 도시 — 잔디 · 광장의 나무는 벚나무가 섞임
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
  // ---------- 거리의 자잘한 것 (지도 속성 clutter — tools/map-gen.js 의 OLDTOWN · CITY 의 clutter) ----------
  // 헌터들의 도시: 버스 정류장(bus) · 자판기(vend) · 홀로그램 안내판(holo) · 벤치(bench) · 분리수거함(bin) · 볼라드(bollard) · 전기자전거(bikes)
  // 불법주차한 낡은 차(가로 · 세로 두 칸) · 라바콘 · 종량제 봉투 더미 · 스티로폼 화분 · 세워 둔 오토바이. 칸은 막혀 있고(지나갈 수 없음) 그림은 그 칸 안에.
  // 낡은 차 — 빛바랜 칠 · 먼지 · 앞뒤 유리 · 옆 거울 · 바퀴 끝이 살짝 보임. 앞이 오른쪽(가로) · 아래(세로)
  const OLD_CAR = ['#b8b2a6', '#6a7f94', '#8a3a34', '#4f5d48', '#c9a25a', '#9a9aa0'];
  const clutterSprites = {};
  function clutterSprite(it) {
    const key = `${it.kind}|${it.tone | 0}|${it.w}x${it.h}`;
    if (clutterSprites[key]) return clutterSprites[key];
    const W = it.w * P, H = it.h * P, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    const put = (x, y, c, a = 255) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a; };
    const rect = (x0, y0, w, h, c, a) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(x, y, c, a); };
    const ink = c3('#17161a'), seed = (it.x * 31 + it.y * 17) | 0;
    if (it.kind === 'car') {
      const vert = it.h > it.w, L = 30, Wd = 13, body = c3(OLD_CAR[(it.tone | 0) % OLD_CAR.length]);
      // 가로로 그린 뒤 세로면 돌려 놓음
      const pts = [];
      const P2 = (x, y, c, a) => pts.push([x, y, c, a]);
      for (let x = 1; x < L + 1; x++) P2(x, Wd + 1, [0, 0, 0], 70);                                   // 그림자
      for (const wx of [6, 22]) for (let x = wx; x < wx + 5; x++) { P2(x, 0, ink); P2(x, Wd, ink); }   // 바퀴
      for (let y = 1; y < Wd; y++) for (let x = 1; x < L; x++) {
        const edge = y === 1 || y === Wd - 1 || x === 1 || x === L - 1;
        let c = edge ? ink : body;
        if (!edge) {
          if (x >= 19 && x <= 21) c = y === 2 ? c3('#6f8aa0') : c3('#2c3a48');                     // 앞 유리
          else if (x >= 6 && x <= 7) c = c3('#33404c');                                             // 뒷유리
          else if (x >= 8 && x <= 18) c = mul(body, y === 2 ? 1.08 : 0.9);                           // 지붕
          else if (x > 21) c = mul(body, 1.04);                                                     // 보닛
          if (hash(x + seed, y, 497) < 0.08) c = mix(c, c3('#7a7468'), 0.35);                       // 먼지 · 빛바램
        }
        P2(x, y, c);
      }
      P2(L - 1, 3, c3('#f2e6a0')); P2(L - 1, Wd - 3, c3('#f2e6a0'));                                // 전조등
      P2(1, 3, c3('#b23a32')); P2(1, Wd - 3, c3('#b23a32'));                                        // 미등
      P2(19, 0, ink); P2(19, Wd, ink);                                                              // 옆 거울
      const ox = ((it.w * P - (vert ? Wd + 2 : L + 2)) / 2) | 0, oy = ((it.h * P - (vert ? L + 2 : Wd + 2)) / 2) | 0;
      for (const [x, y, c, a] of pts) vert ? put(ox + (Wd + 1 - y), oy + x, c, a) : put(ox + x, oy + y, c, a);
    } else if (it.kind === 'cone') {                                                                // 라바콘 둘 — 주황 원뿔에 흰 띠, 검은 받침
      for (const [cx, by] of [[5, 13], [11, 10]]) {
        rect(cx - 4, by + 1, 9, 2, [0, 0, 0], 60);
        rect(cx - 3, by - 1, 7, 2, c3('#2a2a2e'));
        for (let k = 0; k < 9; k++) { const hw = Math.max(0, 3 - (k / 3) | 0); rect(cx - hw, by - 2 - k, hw * 2 + 1, 1, k === 3 || k === 4 ? c3('#f4f1ea') : k > 6 ? c3('#ff8a3a') : c3('#f06a20')); }
      }
    } else if (it.kind === 'trash') {                                                               // 종량제 봉투 더미 — 흰 · 하늘빛 봉투, 묶은 매듭
      rect(1, 13, 14, 2, [0, 0, 0], 60);
      for (const [cx, cy, r, c] of [[5, 10, 4, '#e8eef2'], [11, 10, 4, '#cfe3f0'], [8, 6, 4, '#e8eef2']]) {
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 1) put(cx + x, cy + y, x + y > 2 ? mul(c3(c), 0.82) : c3(c));
        put(cx, cy - r - 1, c3('#9aa8b2')); put(cx - 1, cy - r - 2, c3('#9aa8b2')); put(cx + 1, cy - r - 2, c3('#9aa8b2'));
      }
    } else if (it.kind === 'planter') {                                                             // 스티로폼 화분 — 흰 상자에 상추 · 고추
      rect(2, 13, 13, 2, [0, 0, 0], 60);
      rect(2, 8, 12, 5, c3('#f2f0ea')); rect(2, 12, 12, 1, c3('#c9c6be')); rect(2, 8, 12, 1, c3('#ffffff'));
      for (let x = 3; x < 13; x++) for (let y = 3; y < 9; y++) if (hash(x + seed, y, 498) < 0.55 - (8 - y) * 0.05) put(x, y, (x + y) % 3 ? c3('#4f9a3a') : c3('#2f6a28'));
      put(5, 5, c3('#d03a2a')); put(10, 4, c3('#d03a2a')); put(8, 6, c3('#d03a2a'));
    } else if (it.kind === 'scooter') {                                                             // 세워 둔 오토바이 — 위에서 본 몸통 · 안장 · 핸들 · 앞뒤 바퀴
      rect(2, 12, 13, 2, [0, 0, 0], 60);
      rect(1, 7, 3, 3, ink); rect(12, 7, 3, 3, ink);                                                 // 바퀴
      rect(3, 6, 10, 5, c3(OLD_CAR[((it.tone | 0) + 2) % OLD_CAR.length])); rect(3, 6, 10, 1, c3('#e8e4dc'));
      rect(5, 7, 5, 3, c3('#2a2628'));                                                               // 안장
      rect(12, 3, 1, 11, c3('#3a3a40')); put(12, 3, c3('#9aa0a8')); put(12, 13, c3('#9aa0a8'));    // 핸들
      put(14, 8, c3('#f2e6a0'));
    } else if (it.kind === 'vend') {                                                                // 자판기 — 흰 몸통, 빛나는 화면 · 물건 칸 · 꺼내는 곳
      rect(2, 14, 12, 2, [0, 0, 0], 60);
      rect(3, 1, 10, 13, c3('#e8ecf0')); rect(3, 1, 10, 2, c3('#ffffff')); rect(3, 13, 10, 1, c3('#9aa3ad'));
      rect(4, 4, 6, 6, c3('#1a2433'));
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) put(5 + x * 2, 5 + y * 2, c3(['#ff6a6a', '#62e6ee', '#ffd23a', '#7cf27e'][(x + y * 3 + (it.tone | 0)) % 4]));
      rect(10, 4, 2, 3, c3('#62e6ee')); rect(4, 11, 6, 1, c3('#2a2e36'));
    } else if (it.kind === 'holo') {                                                                // 홀로그램 안내판 — 어두운 기둥 위로 떠 있는 청록 화면
      rect(4, 14, 8, 2, [0, 0, 0], 60);
      rect(6, 9, 4, 6, c3('#232a36')); rect(5, 8, 6, 1, c3('#62e6ee'));
      for (let y = 1; y < 8; y++) for (let x = 2; x < 14; x++) {
        const edge = y === 1 || y === 7 || x === 2 || x === 13;
        put(x, y, edge ? c3('#bff8fc') : (y === 3 || y === 5) && x > 3 && x < 11 + (y === 5 ? -3 : 0) ? c3('#e9fdff') : c3('#62e6ee'), edge ? 230 : 140);
      }
    } else if (it.kind === 'bench') {                                                               // 미래형 벤치 — 흰 곡면 의자, 밑에 청록 빛줄
      rect(1, 12, it.w * P - 2, 2, [0, 0, 0], 60);
      rect(2, 3, it.w * P - 4, 3, c3('#aab4c0')); rect(2, 6, it.w * P - 4, 4, c3('#e4e9ef')); rect(2, 6, it.w * P - 4, 1, c3('#ffffff'));
      rect(3, 10, it.w * P - 6, 1, c3('#62e6ee'));
      rect(4, 10, 2, 2, c3('#5a6270')); rect(it.w * P - 6, 10, 2, 2, c3('#5a6270'));
    } else if (it.kind === 'bus') {                                                                 // 버스 정류장 — 유리 지붕 · 뒤 유리벽 · 긴 의자 · 끝에 홀로그램 노선 표지
      const Wp = it.w * P;
      rect(1, 13, Wp - 2, 3, [0, 0, 0], 50);
      rect(1, 1, Wp - 2, 3, c3('#9aa6b8')); rect(1, 3, Wp - 2, 1, c3('#62e6ee'));
      for (let y = 4; y < 12; y++) for (let x = 2; x < Wp - 8; x++) put(x, y, (x + y) % 9 === 0 ? c3('#e9fbfd') : c3('#8fc6dc'), 120);
      rect(4, 9, Wp - 16, 2, c3('#e4e9ef'));
      rect(1, 4, 1, 9, c3('#5a6270')); rect(Wp - 8, 4, 1, 9, c3('#5a6270'));
      rect(Wp - 6, 2, 4, 10, c3('#1a2433')); for (let y = 3; y < 11; y += 2) rect(Wp - 5, y, 2, 1, c3(y % 4 === 1 ? '#ffd23a' : '#62e6ee'));
    } else if (it.kind === 'bin') {                                                                 // 분리수거함 둘 — 파랑 · 초록 둥근 통, 위에 투입구
      rect(1, 13, 14, 2, [0, 0, 0], 60);
      for (const [x0, col] of [[2, '#3a7bd5'], [9, '#3f9a5a']]) {
        rect(x0, 4, 5, 9, c3(col)); rect(x0, 3, 5, 2, mix(c3(col), WHITE, 0.4)); rect(x0 + 1, 3, 3, 1, c3('#1a1c20'));
        rect(x0, 12, 5, 1, mul(c3(col), 0.6));
      }
    } else if (it.kind === 'bollard') {                                                             // 볼라드 둘 — 낮은 기둥, 위에 청록 빛
      rect(1, 13, 14, 2, [0, 0, 0], 50);
      for (const x0 of [3, 10]) { rect(x0, 6, 3, 7, c3('#5a6270')); rect(x0, 5, 3, 2, c3('#62e6ee')); put(x0 + 1, 4, c3('#e9fdff')); }
    } else if (it.kind === 'bikes') {                                                               // 전기자전거 거치대 — 받침대에 자전거 둘 (가는 몸통 · 둥근 바퀴 · 청록 배터리)
      const Wp = it.w * P;
      rect(1, 13, Wp - 2, 2, [0, 0, 0], 50);
      rect(2, 11, Wp - 4, 1, c3('#9aa3ad'));
      for (const x0 of [3, 17]) {
        for (const wx of [x0 + 2, x0 + 10]) for (let a = 0; a < 16; a++) { const t2 = a / 16 * Math.PI * 2; put((wx + Math.cos(t2) * 2.6) | 0, (8 + Math.sin(t2) * 2.6) | 0, c3('#2a2e36')); }
        rect(x0 + 2, 6, 9, 1, c3(OLD_CAR[((it.tone | 0) + x0) % OLD_CAR.length])); rect(x0 + 5, 5, 3, 2, c3('#62e6ee')); put(x0 + 10, 4, c3('#2a2e36')); put(x0 + 3, 5, c3('#2a2e36'));
      }
    }
    g.putImageData(img, 0, 0);
    return (clutterSprites[key] = cv);
  }
  function drawClutter(ctx, m, A, ox, oy, T, x0, y0, x1, y1) {
    if (!A.clutter) A.clutter = JSON.parse((m.props && m.props.clutter) || '[]');
    for (const it of A.clutter) {
      if (it.x + it.w < x0 - 1 || it.x > x1 + 1 || it.y + it.h < y0 - 1 || it.y > y1 + 1) continue;
      ctx.drawImage(clutterSprite(it), Math.round(ox + it.x * T), Math.round(oy + it.y * T), it.w * T, it.h * T);
    }
  }
  function drawTrees(ctx, m, ox, oy, T, x0, y0, x1, y1) {
    ctx.imageSmoothingEnabled = false;
    if (m.props && m.props.clutter) drawClutter(ctx, m, prep(m), ox, oy, T, x0, y0, x1, y1);   // 옛 동네의 자잘한 것 — 불법주차 차 · 라바콘 …
    const sw = TW / P * T, sh = TH / P * T;
    for (let y = Math.max(0, y0 - 1); y < Math.min(m.h, y1 + 3); y++) for (let x = Math.max(0, x0 - 3); x < Math.min(m.w, x1 + 1); x++) {   // 왼쪽은 세 칸 더 (폭 세 칸 기둥)
      const k = y * m.w + x;
      if (m.tile[k] === ROCK && (m.look[k] >> 4) === CITY) {                // 도시의 가로등 — 결정을 얹은 기둥
        const pw = PYL_W / P * T, ph = PYL_H / P * T;
        ctx.drawImage(pylonSprite(), Math.round(ox + (x + 0.5) * T - pw / 2), Math.round(oy + (y + 1) * T - ph - T * 0.16), pw, ph);
        continue;
      }
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
  // ---------- 도시가 살아 있게 (지도 속성 city — 옛 동네 · 헌터들의 도시) ----------
  // 찻길: 떠서 다니는 차가 차선을 따라 오가고(오른쪽 통행), 가장자리 빛 띠에 빛이 흐름 · 빌딩: 창 몇 개가 켜졌다 꺼짐, 협회 탑의 빛줄이 위에서 아래로 흐름 ·
  // 옛 동네: 낡은 가게 네온 간판이 가끔 깜빡이고, 빌라 창에 불이 켜졌다 꺼짐. 땅 그림(덩어리)은 그대로 두고 그 위에 덧그립니다.
  // 찻길 띠 — 가로 띠(위 칸 · 폭)와 세로 띠(왼 칸 · 폭)마다 처음과 끝. 막음 벽(bar)도 찻길로 세어 차는 화면 끝까지 지나감
  function cityLanes(m, A) {
    if (A.lanes) return A.lanes;
    const W = m.w, H = m.h, rd = k => ROADISH(m.look[k] & 15) && (m.look[k] >> 4) === CITY;
    const run = (k, dx, dy) => { let x = k % W, y = (k / W) | 0, n = 0; while (x >= 0 && y >= 0 && x < W && y < H && rd(y * W + x)) { n++; x += dx; y += dy; } return n; };
    const bands = new Map();
    for (let k = 0; k < W * H; k++) {
      if (!rd(k) || (m.look[k] & 15) === COBBLE) continue;
      const x = k % W, y = (k / W) | 0;
      const up = run(k, 0, -1) - 1, down = run(k, 0, 1) - 1, left = run(k, -1, 0) - 1, right = run(k, 1, 0) - 1;
      const vr = up + down + 1, hr = left + right + 1;
      if (vr <= 6 && hr > vr) { const key = `h${y - up},${vr}`, b = bands.get(key) || { horiz: true, at: y - up, wd: vr, from: x, to: x }; b.from = Math.min(b.from, x); b.to = Math.max(b.to, x); bands.set(key, b); }
      else if (hr <= 6 && vr > hr) { const key = `v${x - left},${hr}`, b = bands.get(key) || { horiz: false, at: x - left, wd: hr, from: y, to: y }; b.from = Math.min(b.from, y); b.to = Math.max(b.to, y); bands.set(key, b); }
    }
    return (A.lanes = [...bands.values()].filter(b => b.to - b.from >= 6));
  }
  function liveCity(ctx, m, A, ox, oy, T, x0, y0, x1, y1, t) {
    const u = T / P, vx0 = x0 * P - 40, vx1 = x1 * P + 40, vy0 = y0 * P - 40, vy1 = y1 * P + 40;
    ctx.imageSmoothingEnabled = false;
    for (const [bi, b] of cityLanes(m, A).entries()) {
      const L = (b.to - b.from + 1) * P, Wd = b.wd * P, base = b.at * P, start = b.from * P;
      if (b.horiz ? base + Wd < vy0 || base > vy1 : base + Wd < vx0 || base > vx1) continue;
      // 가장자리 빛 띠에 흐르는 빛 — 위(왼) 띠는 차를 따라 한쪽으로, 아래(오른) 띠는 반대로
      ctx.fillStyle = 'rgba(220,255,255,0.75)';
      for (const [line, sgn] of [[1, -1], [Wd - 2, 1]]) {
        const off = (((sgn * t * 48) % 120) + 120) % 120;
        for (let p = start - 120 + off; p < start + L; p += 120) {
          if (p < start - 10) continue;
          if (b.horiz) ctx.fillRect(ox + p * u, oy + (base + line) * u, 10 * u, u);
          else ctx.fillRect(ox + (base + line) * u, oy + p * u, u, 10 * u);
        }
      }
      // (다니는 차는 없앰 — 사용자 결정 2026-11-19)
    }
    // 건물 — 창 몇 개에 불이 켜졌다 꺼짐 · 협회 탑의 빛줄 · 낡은 가게의 네온 깜빡임
    for (const B of A.buildings) {
      if (!B.kind || (B.x0 + B.w) * P < vx0 || B.x0 * P > vx1 || (B.y0 + B.h) * P < vy0 || B.y0 * P > vy1) continue;
      const G = B.G || (B.G = cityGeom(B)), FX = B.x0 * P, FY = B.y0 * P + G.roofH, F = G.F, W = G.W;
      if (B.kind === 'tower' || B.kind === 'guild') {
        const pw = B.kind === 'tower' ? 16 : 8, top = F - 16, T2 = G.tone;
        for (let i = 0; i * pw < W; i++) for (let j = 0; 7 * j + 9 < top; j++) {
          const hc = hash(B.x0 * 31 + i, B.y0 * 17 + j, 480);
          if (hc > 0.1) continue;
          const bt = beat(i + B.x0 * 7, j + B.y0 * 5, 481, t, 7 + hc * 60, 2.5 + hash(i, j, 482) * 3);
          if (!bt) continue;
          const cx = i * pw + 1, cy = 7 * j + 4;
          if (B.kind === 'guild') { const ex = (W >> 1) - 8; if (cx + pw > ex - 4 && cx < ex + 20 && cy < 30) continue; }   // 문장 판 위는 빼고
          const lc = c3(T2.light);
          ctx.fillStyle = `rgba(${lc[0]},${lc[1]},${lc[2]},${(0.5 * Math.sin(bt.a * Math.PI)).toFixed(2)})`;
          ctx.fillRect(ox + (FX + cx) * u, oy + (FY + cy) * u, (pw - 1) * u, 6 * u);
        }
      } else if (B.kind === 'hq') {
        const cx = W >> 1, up = G.step ? G.roofH - G.step(cx) : 0, Y0 = FY - up, len = F - 26;
        for (let k = 0; k < 2; k++) {
          const p = ((t * 26 + k * len / 2) % len) | 0;
          for (let s = 0; s < 10; s++) {
            const fy = p - s;
            if (fy < 2 || (fy >= 11 && fy <= 48) || fy >= len) continue;
            ctx.fillStyle = `rgba(234,252,255,${(0.9 - s * 0.08).toFixed(2)})`;
            ctx.fillRect(ox + (FX + cx - 1) * u, oy + (Y0 + fy) * u, 3 * u, u);
          }
        }
      } else if (B.kind === 'store' && F > 0) {
        const bt = beat(B.x0, B.y0, 483, t, 5 + hash(B.x0, B.y0, 484) * 6, 0.7);
        if (bt && ((t * 18) | 0) % 2 === 0) {                                       // 네온이 잠깐 꺼졌다 켜짐
          ctx.fillStyle = 'rgba(28,16,36,0.75)';
          ctx.fillRect(ox + FX * u, oy + (FY + F - 24) * u, W * u, 6 * u);
        }
      } else if (B.kind === 'villa' && F > 0) {
        const ww = G.pal.win === 1 ? 10 : 8, R = windowRow(W, ww, 13, 4), rows = F >= 24 ? Math.floor((F - 24) / 10) + 1 : 0;
        for (let i = 0; i < R.n; i++) for (let j = 0; j < rows; j++) {
          const hc = hash(B.x0 * 13 + i, B.y0 * 11 + j, 485);
          if (hc > 0.3) continue;
          const bt = beat(i + B.x0 * 3, j + B.y0 * 9, 486, t, 9 + hc * 40, 3 + hash(i, j, 487) * 5);
          if (!bt) continue;
          ctx.fillStyle = `rgba(255,214,120,${(0.45 * Math.min(1, Math.sin(bt.a * Math.PI) * 3)).toFixed(2)})`;
          ctx.fillRect(ox + (FX + R.x0 + 13 * i + 1) * u, oy + (FY + 3 + 10 * j + 2) * u, (ww - 2) * u, 4 * u);
        }
      }
    }
  }
  function liveGround(ctx, m, ox, oy, T, x0, y0, x1, y1, t) {
    const A = prep(m), u = T / P, dot = (X, Y) => ctx.fillRect(ox + X * u, oy + Y * u, u, u);
    if (m.props && m.props.city) liveCity(ctx, m, A, ox, oy, T, x0, y0, x1, y1, t);
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
    // 가게 안 — 에스컬레이터 디딤판 모서리가 위로 흘러감 (위 벽의 esc 구역 — storeWall 과 같은 셈)
    if (m.props && m.props.store) for (const z of storeZones(m, A)) {
      if (z.kind !== 'esc' || z.x + z.w < x0 - 1 || z.x > x1 + 1) continue;
      let fr = 0;
      while (fr < m.h && m.tile[fr * m.w + z.x] === WALL && (m.look[fr * m.w + z.x] & 15) !== BUILD) fr++;
      const Y0 = (fr - 3) * P, mid = (z.x + z.w / 2) * P, fl = (t * 1.1) % 1;
      for (let k = 0; k < 15; k++) {
        const s = (k + fl) / 2.4, sy = s * s;
        if (sy > 38) break;
        const hw = 19 - sy * 0.2;
        ctx.fillStyle = `rgba(214,238,246,${(0.5 - sy / 39 * 0.3).toFixed(2)})`;
        ctx.fillRect(ox + (mid - hw) * u, oy + (Y0 + 47 - sy) * u, hw * 2 * u, u);
      }
    }
    if (m.props && m.props.interior && !m.props.store) torchesOf(m, A).forEach(([X, Y], i) => {
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
      } else if (tl === ROCK && (m.look[k] >> 4) === CITY) {
        // 가로등의 빛 — 결정 둘레가 숨 쉬듯 밝아졌다 어두워짐
        const gx = ox + (x + 0.5) * T, gy = oy + (y + 1) * T - (PYL_H - 6) * u - T * 0.16, pulse = 0.7 + 0.3 * Math.sin(t * 1.7 + x * 1.3 + y);
        const gr = ctx.createRadialGradient(gx, gy, u, gx, gy, 16 * u);
        gr.addColorStop(0, `rgba(120,240,250,${(0.42 * pulse).toFixed(2)})`); gr.addColorStop(1, 'rgba(120,240,250,0)');
        ctx.fillStyle = gr; ctx.fillRect(gx - 16 * u, gy - 16 * u, 32 * u, 32 * u);
      } else if (tl === TREE && (m.look[k] >> 4) === CITY && treeOf(m, k, x, y)[1] === 'cherry') {
        // 벚꽃잎 — 나무 위에서 하나씩 떨어져 좌우로 흔들리며 내려앉음 (잎마다 빛깔 · 흔들림이 조금씩 다름)
        for (let s = 0; s < 3; s++) {
          const b = beat(x * 3 + s, y, 490, t, 2.6 + hash(x, y, 491 + s) * 2.4, 2.2);
          if (!b) continue;
          const q = b.n * 7 + s, X = x * P + 2 + hash(x, y, q + 492) * 12 + Math.sin(t * 2.4 + q) * 3 + b.tau * 4, Y = y * P - 14 + hash(x, y, q + 493) * 6 + b.tau * 11;
          ctx.fillStyle = `rgba(${hash(x, y, q + 494) < 0.5 ? '255,200,220' : '255,228,238'},${(1 - b.a * 0.6).toFixed(2)})`;
          dot(X | 0, Y | 0);
          if (((t * 3 + q) | 0) % 2) dot((X | 0) + 1, Y | 0);                     // 뒤집히며 넓어 보였다 좁아 보였다
        }
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

  const setGuild = n => { GLV = n | 0; };
  const setMarket = b => { BMO = !!b; };
  const setHome2 = b => { APT = !!b; };
  const api = { setGuild, setMarket, setHome2, has: m => !!(m && m.look), drawGround, drawTrees, drawOver, liveGround, liveAir, drawRift, paintTree, texture, bake, propOf, TW, TH, TREE_STYLES, TREE_PAL, cached: m => (prepared.get(m.look) || { chunks: new Map() }).chunks.size, P, CH, VOID, GRASS, DIRT, COBBLE, TILES, WATER, LAVA, OBSID, SNOW, ROCKY, PAVE, CANAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MapArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
