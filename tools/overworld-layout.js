// ============================================================
//  overworld-layout.js — 1~6격 한 장(overworld)의 배치
//
//  시안 그림(design/map-concept/render.js)과 게임 지도(tools/map-gen.js 의 overworld)가 같이 씁니다 —
//  여기서 고치면 둘 다 바뀝니다.
//
//  좌표는 모두 시안 칸(176×112) 단위로 적습니다. build(S) 가 S 배 촘촘한 칸으로 짜서 돌려줍니다 —
//  시안 그림은 1배, 게임 지도는 더 크게. 칸마다 「그 칸 가운데가 시안의 어디인가」로 땅을 정하므로
//  모양은 배율과 상관없이 같고, 보스(3×3)가 막는 틈만은 어느 배율에서도 세 칸입니다.
//    ter(땅의 종류) · bio(격 — 그림의 빛과 색) · hgt(높이) · ROADS · pathMask(흙길) · BRIDGES(다리)
//    wallMask(게임에서 못 지나가는 성벽 · 수로 벽) · zoneAt(그 칸이 몇 격인가) · GATES(보스가 막고 서는 자리)
// ============================================================
'use strict';

const CW = 176, CH = 112, T = 16;   // 시안 칸 수 · 시안 한 칸의 픽셀

// ---------- 잡음 ----------
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

// ---------- 땅의 종류 ----------
const VOID = 0, GRASS = 1, DIRT = 2, COBBLE = 3, TILES = 4, WATER = 5, LAVA = 6, OBSID = 7, SNOW = 8, ROCKY = 9, PAVE = 10, CANAL = 11;
// 격 — 0 첫 공간 · 들 / 1 지하수로 / 2 숲 / 3 무너진 왕국 / 4 거인의 고개 / 5 시체의 도시 / 6 마계
// 높이(hgt): 지하수로 · 처음의 방 0 / 숲 · 고개 · 묘지 · 마계 1 / 왕국 · 처음 둘레 바위 2 / 등성이 · 벼랑 3

// ---- 지하수로 다리 (두 칸 폭) — 가로 수로는 세로로, 세로 수로는 가로로 건넘 (시안 칸) ----
const BRIDGES = [
  ...[20, 38, 56].flatMap(x => [72, 82].map(y => ({ x, y, len: 2, vertical: true, wide: 2 }))),
  ...[29, 46].flatMap(x => [67, 77, 87].map(y => ({ x, y, len: 2, vertical: false, wide: 2 })))
];
// ---- 몰락한 왕의 성 — 성벽 (동쪽 성문 세 칸 · 남쪽 무너진 틈 둘) · 큰 방의 기둥 (시안 칸) ----
const CASTLE = {
  walls: [[10, 4, 22, 4], [10, 5, 10, 20], [22, 5, 22, 12], [22, 16, 22, 20], [11, 20, 15, 20], [18, 20, 20, 20]],   // [x0, y0, x1, y1]
  columns: [15, 17, 19, 21].flatMap(x => [[x, 10], [x, 17]])
};

function build(S = 1) {
  const W = Math.round(CW * S), H = Math.round(CH * S);
  const ter = new Uint8Array(W * H), bio = new Uint8Array(W * H), hgt = new Uint8Array(W * H);
  const wallMask = new Uint8Array(W * H);           // 게임에서 못 지나가는 벽 (시안은 이 자리에 성벽 그림 조각을 그림)
  const idx = (x, y) => y * W + x;
  const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const T_ = (x, y) => (inMap(x, y) ? ter[idx(x, y)] : VOID);
  const R = Math.round;
  const toC = f => (f + 0.5) / S - 0.5;             // 칸 → 시안 좌표 (칸 가운데)
  const fc = c => (c + 0.5) * S - 0.5;              // 시안 좌표 → 칸 (실수)
  const gap3 = c => R(fc(c)) - 1;                   // 시안 c 를 가운데로 한 세 칸 틈의 첫 칸
  const inGap = (f, c) => f >= gap3(c) && f <= gap3(c) + 2;
  // 시안 칸 a~b (끝 포함)를 덮는 칸 [첫 칸, 끝 칸]
  const span = (a, b) => [Math.ceil(a * S - 0.5), Math.ceil((b + 1) * S - 0.5) - 1];
  const spot1 = (x, y) => [R(fc(x)), R(fc(y))];     // 시안 칸 하나 → 그 가운데 칸
  const spot3 = (x, y) => [R(fc(x)) - 1, R(fc(y)) - 1];   // 시안 칸을 가운데로 한 3×3 의 왼쪽 위

  function paint(x, y, t, b, h) {
    if (!inMap(x, y)) return;
    const i = idx(x, y);
    ter[i] = t;
    if (b !== undefined) bio[i] = b;
    if (h !== undefined) hgt[i] = h;
  }
  // 시안 좌표 사각형 둘레를 덮는 칸들을 돌며 fn(칸 x, 칸 y, 시안 x, 시안 y)
  function each(x0, y0, x1, y1, fn) {
    const a = Math.max(0, Math.floor(fc(x0)) - 1), b = Math.min(W - 1, Math.ceil(fc(x1)) + 1);
    const c = Math.max(0, Math.floor(fc(y0)) - 1), d = Math.min(H - 1, Math.ceil(fc(y1)) + 1);
    for (let fy = c; fy <= d; fy++) for (let fx = a; fx <= b; fx++) fn(fx, fy, toC(fx), toC(fy));
  }
  function blob(cx, cy, rx, ry, t, b, h, amp = 0.35, seed = 1) {
    each(cx - rx - 3, cy - ry - 3, cx + rx + 3, cy + ry + 3, (fx, fy, x, y) => {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (fbm(x * 0.18, y * 0.18, seed) - 0.5) * amp * 2;
      if (d < 1) paint(fx, fy, t, b, h);
    });
  }
  function box(x0, y0, x1, y1, t, b, h) {
    each(x0, y0, x1, y1, (fx, fy, x, y) => { if (R(x) >= x0 && R(x) <= x1 && R(y) >= y0 && R(y) <= y1) paint(fx, fy, t, b, h); });
  }
  // 굵은 길 — 점들을 이은 선에서 width/2 안쪽 (잡음으로 조금 흔들림)
  function road(pts, width, t, b, h, wob = 0.8, seed = 3) {
    for (let s = 0; s < pts.length - 1; s++) {
      const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
      each(Math.min(ax, bx) - width, Math.min(ay, by) - width, Math.max(ax, bx) + width, Math.max(ay, by) + width, (fx, fy, x, y) => {
        const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
        const k = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
        const d = Math.hypot(x - (ax + vx * k), y - (ay + vy * k)) + (vnoise(x * 0.3, y * 0.3, seed) - 0.5) * wob * 2;
        if (d <= width / 2) paint(fx, fy, t, b, h);
      });
    }
  }
  // 흙길은 칸이 아니라 픽셀로 — 길 선에서의 거리로 그려 대각선도 계단이 안 지게 (칸에는 「길 있음」 표시만)
  const ROADS = [];                                 // { ax, ay, bx, by, hw(시안 픽셀 반폭), b(격) } — 시안 픽셀 좌표
  const pathC = new Uint8Array(CW * CH);            // 길 있음 — 시안 칸
  function trail(pts, width, b) {
    for (let s = 0; s < pts.length - 1; s++) {
      const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
      ROADS.push({ ax: ax * T + 8, ay: ay * T + 8, bx: bx * T + 8, by: by * T + 8, hw: width * T / 2, b });
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
      for (let k = 0; k <= n; k++) {
        const x = R(ax + (bx - ax) * k / n), y = R(ay + (by - ay) * k / n);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < CW && y + dy < CH) pathC[(y + dy) * CW + x + dx] = 1;
      }
    }
  }
  // 둥근 네모 땅덩이 — 가장자리는 낮은 잡음으로 크게 출렁임
  function mass(x0, y0, x1, y1, r, amp, seed) {
    each(x0 - amp - 1, y0 - amp - 1, x1 + amp + 1, y1 + amp + 1, (fx, fy, x, y) => {
      const qx = Math.max(x0 + r - x, 0, x - (x1 - r)), qy = Math.max(y0 + r - y, 0, y - (y1 - r));
      if (Math.hypot(qx, qy) - r + (fbm(x * 0.07, y * 0.07, seed) - 0.5) * amp * 2 < 0) paint(fx, fy, GRASS);
    });
  }

  // ============================================================
  //  구성 — 어디에 무엇이 있나 (시안 칸 좌표, 176×112)
  // ============================================================
  // 하나로 이어진 땅 — 왼쪽 기둥(아래부터 처음 · 1격 지하수로 · 2격 숲 · 3격 왕국), 가운데 고원(4격 고개), 오른쪽 덩이(아래 5격 묘지 · 위 6격 마계).
  // 격 사이를 어둠으로 끊지 않고 땅 위의 것으로 가름 — 성벽 · 수로 벽 · 바위 등성이 · 흑요석 벼랑, 그리고 그 틈을 막고 선 보스.

  // 왼쪽 기둥 — 왕국 · 숲 · 지하수로가 조금씩 다른 폭이라, 성벽 · 수로 벽 자리에서 땅 가장자리도 꺾임
  mass(9, 2, 64, 31, 9, 4, 11);
  mass(6, 28, 67, 62, 9, 4, 12);
  mass(9, 60, 65, 92, 9, 4, 13);
  box(8, 2, 24, 22, GRASS);                         // 성 자리는 깎이지 않게
  blob(40, 99, 21, 10, GRASS, 0, 0, 0.3, 14);       // 맨 아래 — 처음을 품은 바위
  const colMask = ter.map(t => (t !== VOID ? 1 : 0));   // 왼쪽 기둥 자리 (격 나누기에 씀)
  // 가운데 — 숲과 맞닿는 띠, 그리고 위아래로 크게 부푼 거인의 고원
  mass(62, 33, 118, 62, 6, 4, 15);
  mass(68, 22, 114, 74, 22, 4, 16);
  const neckMask = ter.map((t, i) => (t !== VOID && !colMask[i] ? 1 : 0));
  mass(113, 5, 168, 89, 14, 5, 19);                 // 오른쪽 덩이
  // 오른쪽 덩이의 왼쪽 아래는 고원 밑에서 비스듬히 비어 있음
  each(106, 60, 135, CH - 1, (fx, fy, x, y) => {
    if (R(x) < 106 || R(x) > 135 || R(y) < 60) return;
    if (!neckMask[idx(fx, fy)] && y > 76 + (x - 113) * 0.9 + (fbm(x * 0.12, y * 0.12, 18) - 0.5) * 4) paint(fx, fy, VOID);
  });
  // 고원은 숲 쪽으로만 트이고, 왕국 · 지하수로와는 낭떠러지로 떨어짐
  const reach = R(3 * S);
  each(60, 0, 79, CH - 1, (fx, fy, x, y) => {
    if (R(x) < 60 || R(x) > 79 || !neckMask[idx(fx, fy)] || (R(y) >= 32 && R(y) <= 61)) return;
    for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++)
      if (inMap(fx + dx, fy + dy) && colMask[idx(fx + dx, fy + dy)]) { paint(fx, fy, VOID); return; }
  });

  // ---- 격 나누기 ----
  const wob = (v, s, a) => (vnoise(v * 0.15, 0.5, s) - 0.5) * a;
  const RIDGE = y => (R(y) >= 45 && R(y) <= 51 ? 112 : 112 + wob(y, 52, 4));   // 4격 | 5 · 6격 바위 등성이 (쐐기돌 아치 자리는 곧게)
  const CLIFF = x => (R(x) >= 126 && R(x) <= 146 ? 42 : 42 + wob(x, 53, 3));  // 5격 | 6격 흑요석 벼랑 (대성당 자리는 곧게)
  function zoneAt(fx, fy) {
    const x = toC(fx), y = toC(fy), ry = R(y);
    if (colMask[idx(fx, fy)]) return ry >= 93 ? 7 : ry >= 62 ? 1 : ry >= 31 ? 2 : 3;
    if (x < RIDGE(y)) return 4;
    return y < CLIFF(x) ? 6 : 5;
  }
  const ZONE = { 1: [COBBLE, 1, 0], 2: [GRASS, 2, 1], 3: [GRASS, 3, 2], 4: [GRASS, 4, 1], 5: [GRASS, 5, 1], 6: [OBSID, 6, 1], 7: [ROCKY, 7, 2] };
  for (let fy = 0; fy < H; fy++) for (let fx = 0; fx < W; fx++) {
    if (ter[idx(fx, fy)] === VOID) continue;
    const z = zoneAt(fx, fy), [t, b, h] = ZONE[z];
    paint(fx, fy, z === 4 && toC(fx) > 76 + wob(toC(fy), 54, 6) ? ROCKY : t, b, h);   // 4격은 숲에서 높은 풀밭으로, 동쪽으로 갈수록 바위
  }

  // ---- 격 사이 — 보스는 3×3 이라 막는 틈은 모두 세 칸 ----
  // 2격 | 3격: 왕국의 바깥 성벽 (두 줄, 한 단 높음). 가운데 무너진 성문 — 트롤 킹이 막고 섬
  each(0, 29, 70, 30, (fx, fy, x, y) => {
    if (R(x) > 70 || (R(y) !== 29 && R(y) !== 30) || ter[idx(fx, fy)] === VOID) return;
    const gate = inGap(fx, 44);
    paint(fx, fy, gate ? TILES : COBBLE, 3, 2);
    wallMask[idx(fx, fy)] = gate ? 0 : 1;
  });
  // 1격 | 2격: 지하수로 북쪽 벽 (숲 높이) — 가운데 수문 (던전 가디언) 세 칸은 지하수로 높이
  each(0, 62, 70, 62, (fx, fy, x, y) => {
    if (R(x) > 70 || R(y) !== 62 || ter[idx(fx, fy)] === VOID || zoneAt(fx, fy) !== 1) return;
    const gate = inGap(fx, 38);
    paint(fx, fy, COBBLE, 1, gate ? 0 : 1);
    wallMask[idx(fx, fy)] = gate ? 0 : 1;
  });
  // 처음 | 1격: 바위 속 둥근 방 — 북쪽 계단으로만 지하수로에 닿음
  blob(39, 101, 9, 6, COBBLE, 7, 0, 0.3, 13);
  box(37, 92, 41, 96, COBBLE, 7, 0);
  // 4격 | 5 · 6격: 바위 등성이 — 쐐기돌 아치(거인왕)가 선 세 칸 고개만 트임
  each(104, 0, 122, CH - 1, (fx, fy, x, y) => {
    if (R(x) < 104 || R(x) > 122 || ter[idx(fx, fy)] === VOID || Math.abs(x - RIDGE(y)) > 2.5) return;
    paint(fx, fy, ROCKY, 4, inGap(fy, 48) ? 1 : 3);
  });
  // 5격 | 6격: 흑요석 벼랑 — 대성당 뒤 세 칸 묘실 통로(불사의 왕이 막음)로만 지나감
  each(100, 36, CW - 1, 48, (fx, fy, x, y) => {
    if (R(x) < 100 || R(y) < 36 || R(y) > 48 || ter[idx(fx, fy)] === VOID || x < RIDGE(y) || Math.abs(y - CLIFF(x)) > 1.6 || inGap(fx, 136)) return;
    paint(fx, fy, OBSID, 6, 3);
  });

  // ---- 물 ----
  blob(22, 25, 5, 2.4, WATER, 3, 2, 0.4, 33);                                              // 물에 잠긴 안뜰 (히드라) — 넘친 물이 성벽 밑 배수구로
  road([[22, 32], [25, 38], [23, 45], [26, 52], [29.5, 61]], 2.2, WATER, 2, 1, 0.5, 7);    // 숲 시내 — 왕국 성벽 밑에서 나와 지하수로 벽의 배수구로
  blob(60, 4, 7, 2.2, ROCKY, 3, 3, 0.4, 34);                                               // 왕국 북쪽 끝 바위턱
  blob(60, 8, 3.5, 2, WATER, 3, 2, 0.4, 35);                                               // 바위턱 폭포 밑 웅덩이 (카벙클이 숨은 곳)

  // ---- 1격 수로 — 가로 둘, 세로 둘 (폭 2) ----
  each(0, 72, 70, 83, (fx, fy, x, y) => {
    if (R(x) <= 70 && [72, 73, 82, 83].includes(R(y)) && ter[idx(fx, fy)] !== VOID && zoneAt(fx, fy) === 1) paint(fx, fy, CANAL, 1);
  });
  each(29, 64, 47, 91, (fx, fy, x, y) => {
    if (R(y) >= 64 && R(y) <= 91 && [29, 30, 46, 47].includes(R(x))) paint(fx, fy, CANAL, 1);
  });

  // ---- 길 (흙 — 픽셀로 그림) ----
  trail([[38, 61], [38, 56], [38, 51], [39, 45], [42, 39], [44, 34], [44, 32]], 2.2, 2);                          // 수문 → 숲 → 왕국 성문
  trail([[38, 51], [46, 50], [54, 51], [62, 49], [70, 50], [78, 48], [86, 49], [94, 48], [102, 48], [116, 48]], 1.0, 2);   // 숲 동쪽 길 → 4격 고원 → 쐐기돌 아치
  trail([[38, 51], [31, 48], [25, 46.5], [19, 46], [15, 45]], 1.4, 2);                                           // 서쪽 — 통나무 다리 건너 오크 야영지
  trail([[46, 50], [50, 45], [54, 42]], 1.1, 2);                                                                 // 마녀의 오두막으로 가는 좁은 길
  trail([[88, 48.5], [88, 37]], 1.3, 4);                                                                         // 눈 덮인 봉우리 돌계단
  trail([[96, 48], [98, 44]], 1.3, 4);                                                                           // 돌 고리
  trail([[116, 48], [118, 52], [126, 55], [132, 52], [136, 49]], 2.2, 5);                                         // 아치 → 대성당
  trail([[126, 55], [124, 64], [128, 72], [134, 78]], 1.5, 5);
  trail([[132, 52], [142, 60], [152, 64], [158, 70]], 1.5, 5);

  // ---- 3격 왕국 — 성문에서 북서쪽 성까지 옛 큰길 · 깨진 포석 광장 · 성 ----
  road([[44, 28], [41, 22], [33, 17], [23, 14]], 3, COBBLE, 3, 2, 0.4);
  blob(36, 9, 5, 3.5, TILES, 3, 2, 0.5, 31);        // 옛 광장 (마른 분수)
  box(11, 5, 21, 19, TILES, 8, 2);                  // 몰락한 왕의 성 — 어둑한 돌바닥의 큰 방 (격 3 의 일부, 빛만 따로)

  // ---- 4격 — 눈 덮인 봉우리 · 바위 단 ----
  blob(88, 31, 11, 5.5, SNOW, 4, 2, 0.35, 16);
  blob(84, 64, 7, 3.5, ROCKY, 4, 2, 0.4, 23);
  blob(100, 60, 5, 3, ROCKY, 4, 2, 0.4, 24);

  // ---- 5격 — 네 말의 기사 광장 · 대성당 앞뜰 ----
  blob(130, 61, 4.5, 2.8, PAVE, 5, 1, 0.3, 26);
  box(128, 44, 144, 49, PAVE, 5, 1);

  // ---- 6격 — 용암 강 · 칠죄종 홀 · 벌레의 굴 · 왕좌 ----
  road([[117, 32], [118, 24], [123, 14], [134, 9], [146, 8]], 2.4, LAVA, 6, 1, 0.8, 41);
  box(124, 19, 143, 32, TILES, 6, 1);               // 칠죄종 홀 바닥
  each(144, 24, 149, 26, (fx, fy, x, y) => {        // 벌레가 막은 굴 (세 칸 — 벌레가 막고 섬)
    if (R(x) >= 144 && R(x) <= 149 && inGap(fy, 25)) paint(fx, fy, OBSID, 6, 1);
  });
  box(150, 15, 159, 32, TILES, 6, 1);               // 왕좌의 방
  // 왕좌의 방은 어둠으로 내민 끝 — 세계수를 먹는 벌레의 굴로만 들어감
  each(147, 0, CW - 1, 37, (fx, fy, x, y) => {
    if (R(x) < 147 || R(y) > 37) return;
    const room = R(x) >= 150 && R(x) <= 159 && R(y) >= 15 && R(y) <= 32, tunnel = R(x) <= 149 && inGap(fy, 25);
    if (!room && !tunnel) paint(fx, fy, VOID);
  });

  // ---- 성벽 · 길 표시를 이 배율의 칸으로 ----
  for (const [x0, y0, x1, y1] of CASTLE.walls) {
    const [a, b] = span(x0, x1), [c, d] = span(y0, y1);
    for (let fy = c; fy <= d; fy++) for (let fx = a; fx <= b; fx++) if (inMap(fx, fy)) wallMask[idx(fx, fy)] = 1;
  }
  const pathMask = new Uint8Array(W * H);
  for (let fy = 0; fy < H; fy++) for (let fx = 0; fx < W; fx++) {
    const x = R(toC(fx)), y = R(toC(fy));
    if (x >= 0 && y >= 0 && x < CW && y < CH && pathC[y * CW + x]) pathMask[idx(fx, fy)] = 1;
  }

  // ---- 보스가 막고 서는 자리 (3×3 의 왼쪽 위 칸) — 틈 세 칸을 이 배율에서 막음 ----
  const rowsOf = r => { const out = []; for (let fy = 0; fy < H; fy++) if (R(toC(fy)) === r) out.push(fy); return out; };
  const rim = rowsOf(62), wall = rowsOf(30);
  let cliffEnd = 0; while (toC(cliffEnd) <= CLIFF(136) + 1.6) cliffEnd++;
  let bayStart = 0; while (R(toC(bayStart)) < 147) bayStart++;
  const GATES = {
    dungeonguardian: [gap3(38), rim[0] + Math.floor((rim.length - 3) / 2)],   // 지하수로 수문 — 벽 두께를 가운데로
    trollking: [gap3(44), wall[wall.length - 1] - 1],                         // 왕국 성문 — 숲 쪽 끝
    giantking: [R(fc(RIDGE(48))) - 1, gap3(48)],                              // 쐐기돌 아치 — 등성이 한가운데
    lichking: [gap3(136), cliffEnd],                                          // 대성당 — 벼랑 바로 아래, 묘실 통로 들머리
    worldworm: [bayStart - 2, gap3(25)]                                       // 벌레의 굴 — 어둠으로 내민 곳의 첫 칸까지
  };

  return {
    S, W, H, T, ter, bio, hgt, idx, inMap, T_, toC, fc, span, spot1, spot3, ROADS, pathMask, wallMask, zoneAt, GATES, BRIDGES, CASTLE,
    VOID, WATER, CANAL, LAVA, ROCKY, hash, fbm
  };
}

module.exports = {
  CW, CH, T, hash, sm, vnoise, fbm,
  VOID, GRASS, DIRT, COBBLE, TILES, WATER, LAVA, OBSID, SNOW, ROCKY, PAVE, CANAL,
  BRIDGES, CASTLE, build
};
