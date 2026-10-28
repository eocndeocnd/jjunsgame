// ============================================================
//  맵 시안 — 1~6격 한 장 (게임에는 안 들어감)
//
//    node design/map-concept/render.js
//      → design/map-concept/overworld.png      (한 칸 16px, 전체)
//      → design/map-concept/zoom-*.png         (격마다 두 배로 확대)
//
//  「미스터리하지만 친근한」 — 어둠 속에 떠 있는 땅. 첫 공간과 1~3격은 따뜻하고 밝게,
//  남동쪽으로 내려갈수록(4 → 5 → 6격) 어둡고 이상하게. 군데군데 빛나는 것(수정 · 버섯 · 등불 · 룬)이 「저기 뭐가 있지」를 만듭니다.
//
//  구조는 docs/MAP-REFERENCE-PLAN.md 그대로 — 첫 공간에서 1격과 4격(강 건너로 보이기만, 걸어서는 멀리 돌아감),
//  1격 보스 너머 갈림목에서 2 · 3격, 4격 보스(거인왕)의 고개 너머에서 5 · 6격. 6격은 칠죄종 홀 · 세계수 벌레 · 마왕 · 관측자 · 문의 광장 문.
//
//  그림은 전부 이 코드가 칸마다 직접 그립니다 (그림 생성 AI 없음). 경계가 격자처럼 보이지 않게
//  픽셀마다 좌표를 살짝 흔들어(도메인 워핑) 어느 칸의 땅인지 고릅니다.
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const { encodePng } = require('../../tools/map-gen.js');

const W = 176, H = 112, T = 16, PW = W * T, PH = H * T;
const OUT = __dirname;

// ---------- 색 · 잡음 ----------
const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, f) => [a[0] * f, a[1] * f, a[2] * f];
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

// ---------- 캔버스 (밑그림 · 빛 따로) ----------
const base = new Float32Array(PW * PH * 3);
const emis = new Uint8Array(PW * PH);              // 스스로 빛나는 픽셀 (용암) — 어두운 격에서도 안 어두워짐
const glowBuf = new Float32Array(PW * PH * 3);
function put(x, y, c, a = 1) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= PW || y >= PH) return;
  const i = (y * PW + x) * 3;
  base[i] += (c[0] - base[i]) * a; base[i + 1] += (c[1] - base[i + 1]) * a; base[i + 2] += (c[2] - base[i + 2]) * a;
}
function get(x, y) { const i = (y * PW + x) * 3; return [base[i], base[i + 1], base[i + 2]]; }
function darken(x, y, f) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= PW || y >= PH) return;
  const i = (y * PW + x) * 3;
  base[i] *= f; base[i + 1] *= f; base[i + 2] *= f;
}
function rect(x, y, w, h, c, a = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c, a); }
function ellipse(cx, cy, rx, ry, c, a = 1) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    if (d <= 1) put(x, y, c, a);
  }
}
function shadow(cx, cy, rx, ry, f = 0.62) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    if (d <= 1 && (d < 0.75 || (x + y) % 2 === 0)) darken(x, y, f);    // 가장자리는 체크무늬로 흐리게
  }
}
function line(x0, y0, x1, y1, c, a = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let k = 0; k <= n; k++) put(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c, a);
}
function glow(cx, cy, r, c, s = 1) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    if (x < 0 || y < 0 || x >= PW || y >= PH) continue;
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
    if (d >= 1) continue;
    const f = (1 - d) ** 2 * s, i = (y * PW + x) * 3;
    glowBuf[i] += c[0] * f; glowBuf[i + 1] += c[1] * f; glowBuf[i + 2] += c[2] * f;
  }
}

// ---------- 땅 (칸 단위) ----------
const VOID = 0, GRASS = 1, DIRT = 2, COBBLE = 3, TILES = 4, WATER = 5, LAVA = 6, OBSID = 7, SNOW = 8, ROCKY = 9, PAVE = 10, CANAL = 11;
const CRISP = new Set([CANAL]);                     // 수로 — 경계를 흔들지 않음
const BUILT = new Set([COBBLE, TILES, PAVE]);       // 사람이 깐 바닥 — 경계를 조금만 흔듦
// 격 — 0 첫 공간 · 들 / 1 지하수로 / 2 숲 / 3 무너진 왕국 / 4 거인의 고개 / 5 시체의 도시 / 6 마계
const ter = new Uint8Array(W * H), bio = new Uint8Array(W * H), hgt = new Uint8Array(W * H);
const idx = (x, y) => y * W + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const T_ = (x, y) => (inMap(x, y) ? ter[idx(x, y)] : VOID);
function paint(x, y, t, b, h) {
  if (!inMap(x, y)) return;
  const i = idx(x, y);
  ter[i] = t;
  if (b !== undefined) bio[i] = b;
  if (h !== undefined) hgt[i] = h;
}
function blob(cx, cy, rx, ry, t, b, h, amp = 0.35, seed = 1) {
  for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++) for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (fbm(x * 0.18, y * 0.18, seed) - 0.5) * amp * 2;
    if (d < 1) paint(x, y, t, b, h);
  }
}
function box(x0, y0, x1, y1, t, b, h) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) paint(x, y, t, b, h); }
// 굵은 길 — 점들을 이은 선에서 width/2 안쪽 (잡음으로 조금 흔들림)
function road(pts, width, t, b, h, wob = 0.8, seed = 3) {
  for (let s = 0; s < pts.length - 1; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
    const minx = Math.min(ax, bx) - width, maxx = Math.max(ax, bx) + width, miny = Math.min(ay, by) - width, maxy = Math.max(ay, by) + width;
    for (let y = Math.floor(miny); y <= maxy; y++) for (let x = Math.floor(minx); x <= maxx; x++) {
      const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
      const k = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
      const d = Math.hypot(x - (ax + vx * k), y - (ay + vy * k)) + (vnoise(x * 0.3, y * 0.3, seed) - 0.5) * wob * 2;
      if (d <= width / 2) paint(x, y, t, b, h);
    }
  }
}

// 흙길은 칸이 아니라 픽셀로 — 길 선에서의 거리로 그려 대각선도 계단이 안 지게 (칸에는 「길 있음」 표시만)
const ROADS = [];                                   // { ax, ay, bx, by, hw(픽셀 반폭), b(격) }
const pathMask = new Uint8Array(W * H);
function trail(pts, width, b) {
  for (let s = 0; s < pts.length - 1; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
    ROADS.push({ ax: ax * T + 8, ay: ay * T + 8, bx: bx * T + 8, by: by * T + 8, hw: width * T / 2, b });
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
    for (let k = 0; k <= n; k++) {
      const x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inMap(Math.round(x) + dx, Math.round(y) + dy)) pathMask[idx(Math.round(x) + dx, Math.round(y) + dy)] = 1;
    }
  }
}

// ============================================================
//  구성 — 어디에 무엇이 있나 (칸 좌표, 지도 176×112)
// ============================================================
// 강 — 숲 북서쪽 폭포에서 내려와, 숲을 나서면 어두운 협곡 사이로만 흐르다가(둑 없음 — 숲과 첫 공간이 이어지지 않게)
// 첫 공간 남쪽에서 강가 풀밭이 되고, 동쪽 끝 호수에서 어둠 속으로 떨어집니다. 호수 둘레도 어둠이라 강 양쪽이 이어지지 않습니다.
const RIVER = [[9, 1], [11, 9], [15, 20], [13, 31], [17, 44], [22, 56], [32, 66], [50, 67], [70, 66], [88, 67], [100, 65]];
road(RIVER.slice(5, 10), 11, GRASS, 0, 0, 1.2, 5);
// 2격 이끼 낀 숲길 (북서)
blob(29, 21, 25, 20, GRASS, 2, 0, 0.3, 11);
blob(8, 38, 6, 4, GRASS, 2, 0, 0.3, 27);          // 트롤 킹의 굴 — 숲길 끝, 다리 건너 서쪽 강둑
// 3격 무너진 왕국 (북동)
blob(137, 20, 36, 18, GRASS, 3, 0, 0.3, 12);
box(104, 6, 170, 34, GRASS, 3, 0);
// 갈림목 (1격 보스 너머) 과 양쪽 길
blob(76, 18, 7, 4, GRASS, 0, 0, 0.25, 13);
road([[70, 18], [62, 17], [52, 15], [46, 12]], 5, GRASS, 2, 0, 0.6);
road([[82, 18], [92, 17], [104, 15]], 5, GRASS, 3, 0, 0.6);
// 1격 초심자의 지하수로 — 어둠 위에 떠 있는 돌 구역. 수로가 가로세로로 가르는 아홉 구역
box(54, 26, 97, 49, COBBLE, 1, 0);
// 첫 공간 — 모닥불 야영지
blob(72, 57, 12, 7, GRASS, 0, 0, 0.3, 14);
// 첫 공간에서 서쪽으로 — 어둠 위 능선길을 따라 강가로, 다리 건너 4격
road([[61, 58], [50, 60], [40, 61], [34, 63]], 5, GRASS, 0, 0, 0.7);
// 4격 거인의 고개 — 강 남쪽 고원. 서쪽은 눈 덮인 봉우리(더 높은 단)
blob(56, 90, 42, 19, ROCKY, 4, 1, 0.3, 15);
blob(30, 93, 13, 9, SNOW, 4, 2, 0.35, 16);
blob(46, 100, 9, 6, ROCKY, 4, 2, 0.4, 17);
blob(86, 80, 7, 3.5, ROCKY, 4, 2, 0.4, 23);        // 바위 단 — 옆면이 보이는 높은 자리들 (길과 겹치지 않게)
blob(91, 106, 6, 3, ROCKY, 4, 2, 0.4, 24);
blob(26, 80, 6, 3, ROCKY, 4, 2, 0.4, 25);
// 고개 너머 갈림목 → 5격(남동) · 6격(동)
blob(104, 88, 6, 4, ROCKY, 4, 1, 0.3, 18);
road([[96, 88], [104, 88]], 4, ROCKY, 4, 1, 0.3);
// 5격 시체가 걷는 도시
blob(137, 97, 35, 13, GRASS, 5, 0, 0.25, 19);     // 시든 풀밭 — 묘비가 잘 보이게 바닥은 어둡고 고르게
road([[106, 90], [114, 94], [122, 96]], 4, GRASS, 5, 0, 0.5);
blob(142, 95, 6, 3.5, PAVE, 5, 0, 0.3, 26);       // 네 말의 기사 광장
box(157, 93, 170, 104, PAVE, 5, 0);               // 대성당 앞뜰
road([[106, 90], [114, 94], [120, 95]], 2, PAVE, 5, 0, 0.4);   // 묘지 어귀의 포장길
// 6격 마계의 왕좌 — 흑요석 대지
blob(150, 62, 25, 15, OBSID, 6, 0, 0.28, 20);
road([[106, 86], [114, 80], [124, 74], [132, 68]], 5, OBSID, 6, 0, 0.6);
// ---- 물 ----
road(RIVER, 5, WATER, undefined, 0, 0.9, 6);
blob(108, 63, 8, 3.5, WATER, 0, 0, 0.35, 22);
// 숲 속 작은 시내 (강으로 합류)
road([[44, 4], [40, 12], [33, 18], [25, 22], [16, 24]], 2.2, WATER, 2, 0, 0.5, 7);

// ---- 1격 수로 — 가로 둘, 세로 둘 (폭 2). 바깥 둘레는 돌 테두리 ----
for (let x = 55; x <= 96; x++) for (const y of [33, 34, 41, 42]) paint(x, y, CANAL, 1);
for (let y = 27; y <= 48; y++) for (const x of [66, 67, 84, 85]) paint(x, y, CANAL, 1);
// 첫 공간 → 지하수로 남쪽 들머리 계단, 지하수로 북쪽 → 1격 보스(던전 가디언)의 수문 → 갈림목
box(70, 49, 74, 51, COBBLE, 0, 0);
box(73, 22, 78, 26, COBBLE, 1, 0);
// 지하수로 둘레는 군데군데 무너져 — 반듯한 네모가 아니게 (수문 · 들머리 계단 쪽은 남김)
for (let y = 26; y <= 49; y++) for (let x = 54; x <= 97; x++) {
  const e = Math.min(x - 54, 97 - x, y - 26, 49 - y);
  if (e > 1 || (x >= 68 && x <= 81)) continue;
  if (fbm(x * 0.35, y * 0.35, 35) > 0.56 + e * 0.1) paint(x, y, VOID);
}

// ---- 길 (흙 — 픽셀로 그림) ----
trail([[72, 51], [72, 56], [67, 58], [61, 58]], 2.2, 0);
trail([[61, 58], [50, 60], [40, 61], [34, 63]], 2, 0);
trail([[76, 21], [76, 17], [70, 18]], 2, 0);
trail([[70, 18], [62, 17], [52, 15], [46, 12], [40, 9], [32, 10], [26, 15], [24, 24], [20, 30], [14, 36], [9, 38]], 2.2, 2);
trail([[34, 70], [36, 76], [44, 80], [58, 83], [70, 86], [84, 88], [96, 88]], 2.2, 4);
trail([[44, 80], [40, 88], [36, 92]], 1.8, 4);
trail([[58, 83], [60, 92], [68, 98], [76, 98]], 1.8, 4);

// ---- 3격 왕국 — 깨진 포석 광장 · 큰길 · 성 ----
road([[104, 15], [118, 16], [132, 19], [146, 18], [158, 19]], 3, COBBLE, 3, 0, 0.4);   // 옛 큰길
blob(126, 22, 7, 5, TILES, 3, 0, 0.5, 31);       // 옛 광장 (마른 분수)
blob(145, 12, 5, 4, TILES, 3, 0, 0.5, 32);
box(158, 9, 170, 29, TILES, 3, 0);               // 몰락한 왕의 성 안뜰
blob(138, 30, 5, 3, WATER, 3, 0, 0.4, 33);       // 물에 잠긴 안뜰 (히드라)
blob(117, 8, 4, 2.5, WATER, 3, 0, 0.4, 34);      // 북쪽 절벽 폭포 밑 웅덩이 (카벙클이 숨은 곳)

// ---- 5격 — 묘지 사이 진흙길 ----
trail([[106, 90], [114, 94], [122, 96], [134, 95], [148, 98], [162, 99]], 2.2, 5);

// ---- 6격 — 용암 강 · 칠죄종 홀 · 벌레의 굴 · 왕좌 ----
road([[128, 50], [134, 56], [132, 66], [138, 74], [146, 77]], 2.4, LAVA, 6, 0, 0.8, 41);
box(136, 55, 157, 68, TILES, 6, 0);              // 칠죄종 홀 바닥
box(158, 60, 163, 63, OBSID, 6, 0);              // 벌레가 막은 굴
box(164, 53, 173, 70, TILES, 6, 0);              // 왕좌의 방

// ---- 보스가 막는 길목은 정말 좁게 — 돌아갈 틈이 없게 ----
// 4격 고개: 거인왕(쐐기돌 아치)이 선 3칸 협곡만 남기고 양옆은 어둠
for (let y = 78; y <= 100; y++) for (let x = 92; x <= 100; x++) if (y < 87 || y > 89) paint(x, y, VOID);
// 6격 왕좌의 방: 어둠 속 섬 — 세계수를 먹는 벌레의 굴로만 들어감
for (let y = 48; y <= 76; y++) for (let x = 158; x <= 175; x++) {
  const room = x >= 164 && x <= 173 && y >= 53 && y <= 70, tunnel = x <= 163 && y >= 60 && y <= 63;
  if (!room && !tunnel && x >= 161) paint(x, y, VOID);
}
// ---- 지역 사이는 어둠으로 확실히 가름 (숲 | 지하수로, 지하수로 | 왕국) ----
road([[53, 24], [53, 48]], 2.5, VOID, 0, 0, 0.5);
road([[98, 22], [100, 48]], 3, VOID, 0, 0, 0.5);

// ============================================================
//  칸 → 픽셀
// ============================================================
// 픽셀마다 좌표를 흔들어 고르는 땅 — 부드러운 땅끼리의 경계가 격자처럼 안 보이게
function sample(X, Y) {
  const tx = Math.floor(X / T), ty = Math.floor(Y / T), t0 = T_(tx, ty);
  if (CRISP.has(t0)) return { t: t0, tx, ty };
  const nx = vnoise(X * 0.09, Y * 0.09, 91) - 0.5, ny = vnoise(X * 0.09, Y * 0.09, 92) - 0.5;
  const ux = Math.floor((X + nx * 14) / T), uy = Math.floor((Y + ny * 14) / T), t1 = T_(ux, uy);
  if (CRISP.has(t1)) return { t: t0, tx, ty };
  if (BUILT.has(t0) || BUILT.has(t1)) {                        // 깐 바닥의 가장자리는 덜 흔들어 반듯함을 남김
    const vx = Math.floor((X + nx * 6) / T), vy = Math.floor((Y + ny * 6) / T), t2 = T_(vx, vy);
    return CRISP.has(t2) ? { t: t0, tx, ty } : { t: t2, tx: vx, ty: vy };
  }
  return { t: t1, tx: ux, ty: uy };
}

// 돌 하나하나 — 흔든 격자의 가장 가까운 점으로 나눈 칸 (보로노이). 테두리까지 거리와 돌 안에서의 위치
function stoneCell(X, Y, size, seed) {
  const gx = Math.floor(X / size), gy = Math.floor(Y / size);
  let d1 = 1e9, d2 = 1e9, id = 0, ox = 0, oy = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const cx = (gx + dx + 0.15 + hash(gx + dx, gy + dy, seed) * 0.7) * size, cy = (gy + dy + 0.15 + hash(gx + dx, gy + dy, seed + 1) * 0.7) * size;
    const d = (X - cx) ** 2 + (Y - cy) ** 2;
    if (d < d1) { d2 = d1; d1 = d; id = hash(gx + dx, gy + dy, seed + 2); ox = X - cx; oy = Y - cy; } else if (d < d2) d2 = d;
  }
  return { id, edge: Math.sqrt(d2) - Math.sqrt(d1), ox, oy };
}
function stones(X, Y, size, seed, pal, mortar) {
  const s = stoneCell(X, Y, size, seed);
  if (s.edge < 1.2) return hex(mortar);
  let c = hex(pal[s.id < 0.3 ? 1 : s.id < 0.85 ? 0 : 2]);
  const lit = (s.ox + s.oy) / size;
  if (s.edge < 2.4 && lit < -0.15) c = mix(c, [255, 255, 255], 0.22);       // 돌 왼쪽 위 모서리는 밝게
  else if (s.edge < 2.4 && lit > 0.15) c = mul(c, 0.78);                     // 오른쪽 아래는 그늘
  return c;
}

// 물 깊이 — 칸마다 잰 거리를 픽셀 사이에서 부드럽게 이어 (칸 모양 계단이 안 보이게)
function depthAt(X, Y) {
  const fx = X / T - 0.5, fy = Y / T - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const g = (x, y) => (inMap(x, y) ? Math.min(waterDist[idx(x, y)], 5) : 0);
  const a = g(x0, y0), b = g(x0 + 1, y0), c = g(x0, y0 + 1), d = g(x0 + 1, y0 + 1);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

const C = {
  grass: [['#6fa04a', '#5d8e3e', '#86b65a', '#4b7a34'],      // 0 들
          ['#6c9a4c', '#5a8840', '#7fae5c', '#4a7436'],      // 1 지하수로 둘레
          ['#4f8a3e', '#3f7534', '#629f4a', '#2f5e2a'],      // 2 숲 (짙고 축축)
          ['#7a9a4e', '#687f42', '#8fae5e', '#566c36'],      // 3 왕국 (바랜 풀)
          ['#8a9a5c', '#76854e', '#a0ae70', '#5f6c40'],      // 4 고원
          ['#5f6b5a', '#525c4e', '#6e7a68', '#434c40'],      // 5 시체의 도시
          ['#4a3a44', '#3e303a', '#58464f', '#30252d']],     // 6 마계 (그을린 땅)
  dirt: ['#b48a5a', '#a07a4c', '#c49c6a', '#8a6a42'],
  rocky: ['#8e8a70', '#7c785f', '#a09c82', '#66634d'],
  snow: ['#e8eef4', '#d4dee8', '#f6fafc', '#b8c6d6'],
  cobble: ['#8d8a82', '#7a7770', '#a19e95', '#5e5b55'],
  tiles: ['#b9ad94', '#a39880', '#cfc4aa', '#857b66'],
  tilesDark: ['#3c3346', '#322a3b', '#4a4055', '#241e2c'],
  pave: ['#6e6c78', '#5f5d69', '#807e8a', '#4a4954'],
  obsid: ['#2c2232', '#231b29', '#3a2d42', '#18121d'],
  waterShallow: hex('#5fb0c0'), waterDeep: hex('#1e5a7a'), foam: hex('#d8f0f0'),
  lava: hex('#c2301a'), lavaHot: hex('#ffb040'),
  void: hex('#0c0a12'), voidEdge: hex('#16121f')
};
const shadeOf = (pal, v) => hex(pal[v < 0.3 ? 3 : v < 0.55 ? 1 : v < 0.82 ? 0 : 2]);

// 물 깊이 — 땅에서 몇 칸 떨어졌나
const waterDist = new Float32Array(W * H).fill(99);
{
  const q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ter[idx(x, y)] !== WATER && ter[idx(x, y)] !== CANAL) { waterDist[idx(x, y)] = 0; q.push(idx(x, y)); }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!inMap(x + dx, y + dy)) continue;
      const j = idx(x + dx, y + dy);
      if (waterDist[j] > waterDist[i] + 1) { waterDist[j] = waterDist[i] + 1; q.push(j); }
    }
  }
}

function texture(t, b, X, Y) {
  const v = fbm(X * 0.07, Y * 0.07, 3) * 0.6 + hash(X, Y, 1) * 0.4;   // 큰 얼룩 + 픽셀 디더
  switch (t) {
    case GRASS: {
      let c = shadeOf(C.grass[b], v);
      const h = hash(X, Y, 2);
      if (h < 0.035) c = hex(C.grass[b][3]);                          // 풀잎 그림자
      else if (h < 0.05 && hash(X, Y + 1, 2) < 0.035) c = hex(C.grass[b][2]);
      if (b === 0 && hash(X >> 1, Y >> 1, 4) < 0.004) c = hex(['#f4d35e', '#ee8fb0', '#ffffff', '#9fc5ff'][(hash(X >> 1, Y >> 1, 5) * 4) | 0]);   // 들꽃
      return c;
    }
    case DIRT: {
      if (b === 5) { let c = shadeOf(['#5a5248', '#4c453c', '#6a6156', '#3a342d'], v); if (hash(X, Y, 6) < 0.02) c = hex('#7a7266'); return c; }   // 묘지의 진흙길
      let c = shadeOf(C.dirt, v); if (hash(X, Y, 6) < 0.02) c = hex('#d8b484'); if (hash(X, Y, 7) < 0.015) c = hex('#6e5434'); return c;
    }
    case ROCKY: { let c = shadeOf(C.rocky, v); if (fbm(X * 0.05, Y * 0.05, 8) > 0.62) c = mix(c, hex('#7f9a52'), 0.6); if (hash(X, Y, 9) < 0.02) c = hex('#55513f'); return c; }
    case SNOW: { let c = shadeOf(C.snow, v * 0.7 + 0.3); if (hash(X, Y, 10) < 0.004) c = [255, 255, 255]; return c; }
    case COBBLE: case CANAL: {
      // 둥근 자갈돌 — 크기도 모양도 제각각, 물가 가까이는 젖어 짙게, 군데군데 이끼
      let c = stones(X, Y, 7, 11, C.cobble, '#4e4b46');
      if (fbm(X * 0.04, Y * 0.04, 14) > 0.58 && hash(X, Y, 15) < 0.6) c = mix(c, hex('#5f8a42'), 0.5);
      if (fbm(X * 0.03, Y * 0.03, 16) < 0.3) c = mul(c, 0.86);
      return c;
    }
    case TILES: {
      // 판석 — 줄마다 어긋나게 깐 네모 돌. 왕국은 빠진 돌 사이로 풀, 마계는 검보라
      const pal = b === 6 ? C.tilesDark : C.tiles;
      const row = Math.floor(Y / 8), off = row % 2 ? 5 : 0, lx = ((X + off) % 10 + 10) % 10, ly = ((Y % 8) + 8) % 8;
      const tid = hash(Math.floor((X + off) / 10), row, 16);
      let c = hex(pal[tid < 0.25 ? 1 : tid < 0.9 ? 0 : 2]);
      if (lx === 0 || ly === 0) c = hex(pal[3]);
      else if (lx === 1 || ly === 1) c = mix(c, [255, 255, 255], 0.12);
      if (b === 3 && hash(Math.floor((X + off) / 10), row, 17) < 0.14) c = shadeOf(C.grass[3], v);   // 빠진 돌 사이로 풀
      if (b === 3 && Math.abs(vnoise(X * 0.08, Y * 0.08, 18) - 0.5) < 0.015) c = hex(pal[3]);           // 금
      return c;
    }
    case PAVE: {
      // 묘지의 납작돌 — 크고 어둡게, 이끼와 얼룩
      let c = stones(X, Y, 10, 19, C.pave, '#3a3942');
      if (fbm(X * 0.06, Y * 0.06, 22) > 0.6) c = mix(c, hex('#56634e'), 0.45);
      return c;
    }
    case OBSID: {
      let c = shadeOf(C.obsid, v);
      if (hash(X, Y, 23) < 0.006) c = hex('#8a6aa8');                                         // 보랏빛 반짝
      const crack = Math.abs(vnoise(X * 0.05, Y * 0.05, 24) - 0.5);
      if (crack < 0.01 && fbm(X * 0.02, Y * 0.02, 27) > 0.55) c = hex('#e0501e');           // 군데군데만 금 사이로 열기
      return c;
    }
    case LAVA: {
      // 굳어 가는 검붉은 껍질 위로 가는 불줄기가 흐름
      const r = Math.abs(fbm(X * 0.035, Y * 0.05, 25) - 0.5);
      if (r < 0.025) return mix(C.lavaHot, [255, 244, 190], 0.5);
      if (r < 0.06) return C.lavaHot;
      if (r < 0.1) return hex('#e0501e');
      return mix(hex('#8a2414'), hex('#4a120e'), fbm(X * 0.08, Y * 0.08, 26));
    }
    default: return C.void;
  }
}

// 땅 아래로 떨어지는 옆면 (어둠 쪽) — 위 칸의 땅에 따라 흙 · 돌 · 벽돌 · 흑요석
function faceColor(b, t, X, Y, depth) {
  const n = hash(X, Y, 30);
  let c;
  if (t === COBBLE || t === CANAL || (t === TILES && b !== 6)) {               // 벽돌
    const row = Math.floor(Y / 4), off = row % 2 ? 4 : 0, brick = ((X + off) % 8 + 8) % 8;
    c = hex('#6d655c'); if (brick === 0 || Y % 4 === 0) c = hex('#3e3833'); else if (n < 0.2) c = hex('#5c554d');
  } else if (b === 6 || t === OBSID || t === TILES) {
    c = hex('#1e1624'); if (n < 0.15) c = hex('#2c2034'); if (Math.abs(vnoise(X * 0.1, Y * 0.3, 31) - 0.5) < 0.02) c = hex('#c0401a');
  } else if (b === 5 || t === PAVE) {
    c = hex('#3e3c46'); if ((X % 5) === 0) c = hex('#2e2d35'); if (n < 0.1) c = hex('#4c4a56');
  } else if (t === SNOW || t === ROCKY || b === 4) {
    c = hex('#7a7462'); if ((X + ((Y / 3) | 0)) % 6 === 0) c = hex('#5a5546'); if (n < 0.12) c = hex('#8e8874');
  } else {                                                                      // 흙과 뿌리
    c = hex('#6a4a30'); if ((X + (Y >> 2)) % 7 === 0) c = hex('#4e3622'); if (n < 0.08) c = hex('#86603e');
    if (Math.abs(vnoise(X * 0.3, Y * 0.08, 32) - 0.5) < 0.03) c = hex('#3a5a2a');      // 늘어진 덩굴
  }
  return mul(c, 1 - depth * 0.55);
}

// 칸마다 가까운 길 조각 (픽셀마다 모든 길을 재지 않게)
const roadNear = new Array(W * H).fill(null);
ROADS.forEach((r, k) => {
  const pad = r.hw + 10;
  for (let ty = Math.floor((Math.min(r.ay, r.by) - pad) / T); ty <= (Math.max(r.ay, r.by) + pad) / T; ty++)
    for (let tx = Math.floor((Math.min(r.ax, r.bx) - pad) / T); tx <= (Math.max(r.ax, r.bx) + pad) / T; tx++)
      if (inMap(tx, ty)) (roadNear[idx(tx, ty)] = roadNear[idx(tx, ty)] || []).push(k);
});
// 길 가장자리까지의 거리 (안쪽이면 음수) — 가장자리는 잡음으로 흔들림
function roadAt(X, Y) {
  const list = roadNear[idx(Math.min(W - 1, (X / T) | 0), Math.min(H - 1, (Y / T) | 0))];
  if (!list) return null;
  let best = 1e9, b = 0;
  for (const k of list) {
    const r = ROADS[k], vx = r.bx - r.ax, vy = r.by - r.ay, l2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((X - r.ax) * vx + (Y - r.ay) * vy) / l2));
    const d = Math.hypot(X - (r.ax + vx * t), Y - (r.ay + vy * t)) - r.hw;
    if (d < best) { best = d; b = r.b; }
  }
  return { d: best + (vnoise(X * 0.07, Y * 0.07, 96) - 0.5) * 7, b };
}

// 1) 바닥
for (let Y = 0; Y < PH; Y++) for (let X = 0; X < PW; X++) {
  const s = sample(X, Y);
  let c;
  if (s.t === WATER) {
    const d = Math.min(1, Math.max(0, depthAt(X, Y) - 0.6) / 2.2);
    c = mix(C.waterShallow, C.waterDeep, sm(Math.min(1, d * 0.85 + vnoise(X * 0.05, Y * 0.05, 40) * 0.15)));
    if (d < 0.08 && hash(X, Y, 39) < 0.35) c = mix(c, C.foam, 0.5);                       // 물가 거품
    if (hash(X >> 2, Y, 41) < 0.03 && (X & 3) !== 0) c = mix(c, [220, 245, 250], 0.35);   // 물결
  } else if (s.t === CANAL) {
    // 수로 — 돌 테두리 안쪽 물
    const tx = Math.floor(X / T), ty = Math.floor(Y / T), lx = X % T, ly = Y % T;
    const edgeL = T_(tx - 1, ty) !== CANAL && lx < 3, edgeR = T_(tx + 1, ty) !== CANAL && lx > 12;
    const edgeU = T_(tx, ty - 1) !== CANAL && ly < 3, edgeD = T_(tx, ty + 1) !== CANAL && ly > 12;
    if (edgeL || edgeR || edgeU || edgeD) c = hex((lx + ly) % 4 === 0 ? '#4e4a44' : '#6d6960');
    else c = mix(hex('#3f8aa0'), hex('#2a6a82'), vnoise(X * 0.06, Y * 0.06, 42));
    if (!(edgeL || edgeR || edgeU || edgeD) && hash(X >> 2, Y, 43) < 0.04) c = mix(c, [200, 235, 240], 0.3);
  } else if (s.t === VOID) {
    c = mix(C.void, C.voidEdge, vnoise(X * 0.02, Y * 0.02, 44) * 0.6);
    if (hash(X, Y, 45) < 0.0012) c = hex('#3a3456');                                  // 어둠 속 먼지 같은 별
  } else {
    c = texture(s.t, bio[idx(s.tx, s.ty)], X, Y);
    if (s.t === LAVA) emis[Y * PW + X] = 1;
    const r = roadAt(X, Y);                                    // 흙길 — 가장자리는 짙게, 바깥은 밟혀 바랜 풀
    if (r && r.d < 0) { c = texture(DIRT, r.b, X, Y); if (r.d > -1.6) c = mul(c, 0.8); }
    else if (r && r.d < 2) c = mul(c, 0.88);
  }
  const i = (Y * PW + X) * 3;
  base[i] = c[0]; base[i + 1] = c[1]; base[i + 2] = c[2];
}

// 2) 어둠 쪽 옆면 — 땅 바로 아래 어둠 칸에 위 땅의 두께가 보이게 (떠 있는 땅)
for (let ty = 1; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
  if (T_(tx, ty) !== VOID) continue;
  const up = T_(tx, ty - 1);
  if (up === VOID || up === WATER) continue;
  const b = bio[idx(tx, ty - 1)];
  for (let ly = 0; ly < T + 14; ly++) for (let lx = 0; lx < T; lx++) {
    const X = tx * T + lx, Y = ty * T + ly;
    if (Y >= PH || sample(X, Y).t !== VOID) continue;                            // 아래가 다른 땅이면 덮지 않음
    const bottom = 19 + (vnoise(X * 0.15, ty * 3.1, 46) - 0.5) * 14;              // 아래 끝은 들쭉날쭉 (흙 · 바위가 매달린 듯)
    if (ly > bottom) { if (ly < bottom + 6 && (X + Y) % 2 === 0) darken(X, Y, 0.65); continue; }
    const s = sample(X, (ty - 1) * T + 15);
    if (s.t === VOID) continue;
    const c = faceColor(b, up, X, Y, ly / Math.max(1, bottom));
    put(X, Y, ly === 0 ? mix(c, [255, 255, 255], 0.12) : c);
  }
}

// 용암 둘레가 붉게 물듦
for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) if (ter[idx(tx, ty)] === LAVA && (tx + ty) % 2 === 0) glow(tx * T + 8, ty * T + 8, 30, [255, 80, 30], 0.18);

// 3) 고원 단(4격) — 높은 칸 바로 아래 낮은 칸 위쪽에 바위 옆면
for (let ty = 1; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
  const i = idx(tx, ty), up = idx(tx, ty - 1);
  if (ter[i] === VOID || ter[up] === VOID || hgt[up] <= hgt[i]) continue;
  for (let ly = 0; ly < 11; ly++) for (let lx = 0; lx < T; lx++) {
    const X = tx * T + lx, Y = ty * T + ly;
    const edge = 9 + (vnoise(X * 0.2, ty * 1.7, 47) - 0.5) * 5;
    if (ly > edge) { if (ly < edge + 3) darken(X, Y, 0.75); continue; }
    put(X, Y, faceColor(4, ter[up] === SNOW ? SNOW : ROCKY, X, Y, ly / 14));
  }
}

// 4) 땅 가장자리 — 어둠과 맞닿은 곳에 밝은 테두리와 그 바깥 그늘 (동굴 지도처럼)
for (let Y = 1; Y < PH - 1; Y++) for (let X = 1; X < PW - 1; X++) {
  const here = sample(X, Y).t;
  if (here === VOID) continue;
  let n = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) if (sample(X + dx * 2, Y + dy * 2).t === VOID) n++;
  if (n) put(X, Y, [238, 232, 214], 0.35);
}

// ============================================================
//  얹을 것 — 나무 · 바위 · 폐허 · 묘비 · 불빛 … (아래쪽 것이 앞에 오게 y 순서로)
// ============================================================
const objs = [];
const add = (y, fn) => objs.push({ y, fn });
const P = (tx, ty, ox = 8, oy = 8) => [tx * T + ox, ty * T + oy];

// 길 · 물에서 얼마나 떨어졌나 (나무가 길을 막지 않게)
const openDist = new Float32Array(W * H).fill(99);
{
  const q = [];
  for (let i = 0; i < W * H; i++) if ([DIRT, WATER, COBBLE, TILES, CANAL, LAVA].includes(ter[i]) || pathMask[i]) { openDist[i] = 0; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!inMap(x + dx, y + dy)) continue;
      const j = idx(x + dx, y + dy);
      if (openDist[j] > openDist[i] + 1) { openDist[j] = openDist[i] + 1; q.push(j); }
    }
  }
}
const voidNear = (tx, ty, r) => { for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (T_(x, y) === VOID) return true; return false; };
const reserved = [];   // 나무가 피해야 할 자리 (빈터 · 큰 것들)
const keepClear = (tx, ty, r) => reserved.push([tx, ty, r]);
const isReserved = (tx, ty) => reserved.some(([x, y, r]) => Math.hypot(tx - x, ty - y) < r);

// ---------- 그림 조각 ----------
function canopy(cx, cy, r, pal, lobes, seed) {
  // 몇 개의 둥근 덩어리를 겹친 잎. 왼쪽 위가 밝게, 잎 뭉치는 잡음으로, 가장자리는 짙은 테두리
  const pts = [[0, 0, r]];
  for (let k = 0; k < lobes; k++) {
    const a = hash(k, seed, 50) * Math.PI * 2, d = r * (0.35 + hash(k, seed, 51) * 0.35);
    pts.push([Math.cos(a) * d, Math.sin(a) * d * 0.8, r * (0.55 + hash(k, seed, 52) * 0.3)]);
  }
  const inside = (x, y) => pts.some(([px, py, pr]) => (x - px) ** 2 + (y - py) ** 2 <= pr * pr);
  const R = Math.ceil(r * 1.8);
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    if (!inside(x, y)) continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    const lit = (-x - y) / (r * 2) + (vnoise((cx + x) * 0.25, (cy + y) * 0.25, seed) - 0.5) * 0.9;
    let c = hex(pal[lit > 0.35 ? 2 : lit > -0.05 ? 0 : lit > -0.4 ? 1 : 3]);
    if (edge) c = hex(pal[4]);
    put(cx + x, cy + y, c);
  }
}
function tree(tx, ty, kind, seed) {
  const [x, y] = P(tx, ty, 8 + ((hash(tx, ty, 53) - 0.5) * 8) | 0, 12);
  add(y, () => {
    if (kind === 'dead') {                                   // 마른 나무 — 5격
      shadow(x + 3, y + 2, 9, 4);
      rect(x - 2, y - 18, 4, 20, hex('#4a4440')); rect(x - 2, y - 18, 1, 20, hex('#6a625a'));
      for (const [dx, dy, ex, ey] of [[0, -14, -9, -24], [0, -12, 8, -22], [-5, -20, -8, -27], [5, -18, 10, -26], [0, -18, 1, -28]]) line(x + dx, y + dy, x + ex, y + ey, hex('#4a4440'));
      return;
    }
    if (kind === 'pine') {                                   // 전나무 — 4격
      shadow(x + 3, y + 2, 8, 4);
      rect(x - 1, y - 6, 3, 8, hex('#5a3e26'));
      for (let k = 0; k < 4; k++) {
        const w = 9 - k * 2, top = y - 8 - k * 6;
        for (let j = 0; j < 9; j++) for (let i = -w + (j >> 1); i <= w - (j >> 1); i++) {
          const c = i < -1 ? '#4e7a46' : i > 2 ? '#24402a' : '#35583a';
          put(x + i, top - j + 6, hex(j === 0 || Math.abs(i) === w - (j >> 1) ? '#1c3220' : c));
        }
      }
      return;
    }
    // 둥근 활엽수 — 숲 · 들 · 왕국
    const r = kind === 'big' ? 15 : 11;
    shadow(x + 4, y + 2, r, r * 0.42);
    rect(x - 2, y - 10, 5, 12, hex('#5c3c24')); rect(x + 2, y - 10, 1, 12, hex('#3e2818')); rect(x - 2, y - 10, 1, 12, hex('#7a5232'));
    const pal = kind === 'mossy' ? ['#3f7a3a', '#2f6230', '#5a9a48', '#244e26', '#1a3a1c'] : ['#4f8e3c', '#3c7430', '#6eae4c', '#2c5a26', '#1c3e1a'];
    canopy(x, y - 14 - (r - 11), r, pal, 4, seed);
  });
}
function bush(tx, ty, ox, oy, seed, flowers) {
  const [x, y] = P(tx, ty, ox, oy);
  add(y, () => {
    shadow(x + 2, y + 2, 7, 3);
    canopy(x, y - 4, 6, ['#4f8e3c', '#3c7430', '#6eae4c', '#2c5a26', '#1c3e1a'], 2, seed);
    if (flowers) for (let k = 0; k < 4; k++) put(x - 4 + (hash(k, seed, 54) * 9 | 0), y - 8 + (hash(k, seed, 55) * 7 | 0), hex(flowers));
  });
}
function rock(px, py, r, tint = '#8a867c') {
  add(py, () => {
    shadow(px + 2, py + 2, r + 1, r * 0.5);
    const c0 = hex(tint);
    for (let y = -r; y <= r * 0.7; y++) for (let x = -r; x <= r; x++) {
      if ((x / r) ** 2 + (y / (r * 0.8)) ** 2 > 1) continue;
      const lit = (-x - y) / (r * 2);
      const edge = (((x + 1) / r) ** 2 + (y / (r * 0.8)) ** 2 > 1) || (((x - 1) / r) ** 2 + (y / (r * 0.8)) ** 2 > 1) || ((x / r) ** 2 + ((y + 1) / (r * 0.8)) ** 2 > 1);
      put(px + x, py + y, edge ? mul(c0, 0.45) : mul(c0, lit > 0.25 ? 1.2 : lit > -0.2 ? 1 : 0.78));
    }
  });
}
function crystal(px, py, col, h = 12) {
  add(py, () => {
    const c = hex(col);
    for (const [ox, hh, w] of [[0, h, 3], [-4, h * 0.6, 2], [4, h * 0.7, 2]]) {
      for (let j = 0; j < hh; j++) for (let i = -w; i <= w; i++) {
        if (Math.abs(i) > w * (1 - j / hh) + 0.5) continue;
        put(px + ox + i, py - j, i < 0 ? mix(c, [255, 255, 255], 0.45) : i > 0 ? mul(c, 0.7) : c);
      }
    }
    glow(px, py - h / 2, h * 2.2, mul(c, 0.55));
  });
}
function mushroom(px, py, col) {
  add(py, () => {
    rect(px, py - 3, 1, 3, hex('#e8e0cc'));
    ellipse(px + 0.5, py - 4, 2.6, 1.6, hex(col));
    put(px - 1, py - 5, [255, 255, 255], 0.7);
    glow(px, py - 4, 9, mul(hex(col), 0.5));
  });
}
function lantern(px, py, col = '#ffc864') {
  add(py, () => {
    shadow(px + 1, py + 1, 3, 1.5);
    rect(px, py - 14, 2, 14, hex('#3a2c22'));
    rect(px - 2, py - 18, 6, 5, hex('#2a2018'));
    rect(px - 1, py - 17, 4, 3, hex(col));
    glow(px + 1, py - 15, 34, mul(hex(col), 0.55));
  });
}
function campfire(px, py) {
  add(py, () => {
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; rect(px + Math.cos(a) * 7 - 1, py + Math.sin(a) * 4 - 1, 3, 2, hex('#7a746a')); }
    rect(px - 5, py - 1, 10, 2, hex('#5a3a22')); rect(px - 1, py - 4, 2, 6, hex('#5a3a22'));
    for (let j = 0; j < 10; j++) for (let i = -4; i <= 4; i++) if (Math.abs(i) < 4 - j * 0.35 && hash(i, j, 56) < 0.85) put(px + i, py - 2 - j, hex(j < 3 ? '#ff6a1a' : j < 6 ? '#ffb030' : '#ffe890'));
    glow(px, py - 4, 70, [255, 150, 60], 0.75);
  });
}
function tent(px, py, col) {
  add(py, () => {
    shadow(px + 4, py + 2, 16, 4);
    for (let j = 0; j < 16; j++) for (let i = -14 + j * 0.85; i <= 14 - j * 0.85; i++) put(px + i, py - j, i < 0 ? mix(hex(col), [255, 255, 255], 0.18) : mul(hex(col), 0.82));
    for (let j = 0; j < 9; j++) for (let i = -3 + j * 0.3; i <= 3 - j * 0.3; i++) put(px + i, py - j, hex('#2a1c14'));
    line(px, py - 16, px, py - 20, hex('#5a3a22'));
  });
}
function sign(px, py) {
  add(py, () => {
    shadow(px + 1, py + 1, 4, 2);
    rect(px, py - 12, 2, 12, hex('#5a3c24'));
    rect(px - 7, py - 14, 9, 4, hex('#a8784a')); rect(px + 2, py - 10, 8, 4, hex('#a8784a'));
    rect(px - 7, py - 14, 9, 1, hex('#c99a64')); rect(px + 2, py - 10, 8, 1, hex('#c99a64'));
  });
}
function cart(px, py) {
  add(py, () => {
    shadow(px + 3, py + 2, 14, 4);
    rect(px - 12, py - 12, 22, 8, hex('#8a5a32')); rect(px - 12, py - 12, 22, 2, hex('#b07a46'));
    for (const [cx, col] of [[-8, '#c8402a'], [-2, '#e8c040'], [4, '#4a7ac8']]) rect(px + cx, py - 17, 5, 5, hex(col));
    for (let j = 0; j < 8; j++) for (let i = -13; i <= 11; i++) if (j < 2 || (i + j) % 7 === 0) put(px + i, py - 26 + j, hex(j < 2 ? '#e8dcc0' : '#d8ccb0'));
    rect(px - 12, py - 24, 1, 12, hex('#5a3a22')); rect(px + 10, py - 24, 1, 12, hex('#5a3a22'));
    ellipse(px - 7, py - 3, 3.5, 3.5, hex('#4a3020')); ellipse(px + 5, py - 3, 3.5, 3.5, hex('#4a3020'));
  });
}
function well(px, py) {
  add(py, () => {
    shadow(px + 2, py + 2, 10, 4);
    ellipse(px, py - 4, 9, 5, hex('#8a867c')); ellipse(px, py - 5, 6, 3, hex('#1e3a4a'));
    rect(px - 9, py - 20, 2, 16, hex('#5a3c24')); rect(px + 7, py - 20, 2, 16, hex('#5a3c24'));
    for (let i = -11; i <= 11; i++) rect(px + i, py - 23 + Math.abs(i) * 0.25, 1, 3, hex('#8a3a2a'));
  });
}
function bridge(tx0, ty0, len, vertical) {
  // 다리 — 판자와 난간. 물 위에 그림자
  const [x0, y0] = P(tx0, ty0, 0, 0);
  add(y0 + (vertical ? len * T : T), () => {
    const L = len * T;
    for (let k = 0; k < L; k++) {
      for (let j = 0; j < 14; j++) {
        const X = vertical ? x0 + 1 + j : x0 + k, Y = vertical ? y0 + k : y0 + 1 + j;
        const plank = Math.floor(k / 4);
        let c = hex(hash(plank, tx0, 57) < 0.3 ? '#8a6038' : '#a8784a');
        if (k % 4 === 0) c = hex('#5e3e22');
        if (j === 0 || j === 13) c = hex('#4a2e18');
        put(X, Y, c);
      }
      if (vertical) { darken(x0 + 15, y0 + k, 0.6); darken(x0 + 16, y0 + k, 0.7); } else { darken(x0 + k, y0 + 15, 0.6); darken(x0 + k, y0 + 16, 0.7); }
    }
    for (let k = 0; k < L; k += 8) {                                         // 난간 기둥
      if (vertical) { rect(x0, y0 + k, 2, 3, hex('#3e2614')); rect(x0 + 14, y0 + k, 2, 3, hex('#3e2614')); }
      else { rect(x0 + k, y0 - 2, 2, 4, hex('#3e2614')); rect(x0 + k, y0 + 13, 2, 4, hex('#3e2614')); }
    }
  });
}
function stairs(tx, ty, w) {
  const [x0, y0] = P(tx, ty, 0, 0);
  add(y0 + T, () => {
    for (let s = 0; s < 4; s++) for (let i = 0; i < w * T; i++) {
      rect(x0 + i, y0 + s * 4, 1, 3, hex('#a8a292'));
      put(x0 + i, y0 + s * 4 + 3, hex('#5e5a50'));
    }
  });
}
function ruinWall(tx, ty, w, h = 14) {
  const [x0, y0] = P(tx, ty, 0, 12);
  add(y0, () => {
    shadow(x0 + w * T / 2 + 3, y0 + 2, w * T / 2 + 2, 4);
    for (let i = 0; i < w * T; i++) {
      const top = h - Math.floor(vnoise(i * 0.12, tx, 60) * 9);
      for (let j = 0; j < top; j++) {
        const row = Math.floor(j / 4), brick = ((i + (row % 2) * 4) % 8);
        let c = hex('#a49a86');
        if (brick === 0 || j % 4 === 0) c = hex('#6e6656');
        if (j === top - 1) c = hex('#c8bea8');
        if (hash(i, j, 61) < 0.05) c = hex('#6a8a48');
        put(x0 + i, y0 - j, c);
      }
    }
  });
}
function column(px, py, fallen) {
  add(py, () => {
    if (fallen) {
      shadow(px + 8, py + 2, 16, 3);
      for (let i = 0; i < 28; i++) for (let j = 0; j < 7; j++) put(px - 6 + i, py - 6 + j, hex(j < 2 ? '#e0d6c0' : j > 5 ? '#8a8270' : '#c4baa2'));
      for (let i = 0; i < 28; i += 6) rect(px - 6 + i, py - 6, 1, 7, hex('#9a927e'));
      return;
    }
    shadow(px + 3, py + 2, 7, 3);
    rect(px - 6, py - 3, 13, 3, hex('#9a927e'));
    for (let j = 0; j < 22; j++) for (let i = -4; i <= 4; i++) put(px + i, py - 3 - j, hex(i < -1 ? '#e8dec8' : i > 2 ? '#a0977f' : '#cec4ac'));
    for (let i = -4; i <= 4; i += 3) rect(px + i, py - 25, 1, 22, hex('#b0a690'));
    rect(px - 6, py - 28, 13, 3, hex('#d8ceb6'));
  });
}
function statue(px, py, col = '#9aa0a0', glowCol) {
  add(py, () => {
    shadow(px + 3, py + 2, 9, 3);
    rect(px - 7, py - 6, 14, 6, hex('#7e786a')); rect(px - 7, py - 6, 14, 1, hex('#a49c8a'));
    const c = hex(col);
    rect(px - 3, py - 22, 6, 16, c); rect(px - 5, py - 18, 10, 6, c); ellipse(px, py - 25, 3, 3, c);
    rect(px - 3, py - 22, 2, 16, mix(c, [255, 255, 255], 0.25));
    if (glowCol) { put(px - 1, py - 26, hex(glowCol)); put(px + 1, py - 26, hex(glowCol)); glow(px, py - 25, 14, mul(hex(glowCol), 0.6)); }
  });
}
function tomb(px, py, kind) {
  // 묘비 — 밝은 돌에 짙은 테두리, 앞에 흙무덤 (어두운 땅에서도 줄이 읽히게)
  add(py, () => {
    shadow(px + 3, py + 1, 6, 2.4);
    ellipse(px, py + 3, 5, 2.4, hex('#4a4238'));                                      // 흙무덤
    if (kind === 'cross') {
      rect(px - 2, py - 15, 4, 15, hex('#1e1c24')); rect(px - 6, py - 12, 12, 4, hex('#1e1c24'));
      rect(px - 1, py - 14, 2, 13, hex('#b8b6c2')); rect(px - 5, py - 11, 10, 2, hex('#b8b6c2'));
      return;
    }
    for (let j = 0; j < 13; j++) for (let i = -6; i <= 6; i++) {
      const w = j > 9 ? 6 - (j - 9) * 1.8 : 6;
      if (Math.abs(i) > w) continue;
      const rim = Math.abs(i) > w - 1 || j === 12 || j === 0;
      put(px + i, py - j, hex(rim ? '#23212a' : i < -2 ? '#c4c2cc' : i > 3 ? '#787682' : '#a2a0ac'));
    }
    rect(px - 3, py - 8, 7, 1, hex('#5e5c68')); rect(px - 3, py - 5, 7, 1, hex('#5e5c68'));
    if (hash(px, py, 62) < 0.4) { put(px - 5, py - 1, hex('#6a8a58')); put(px - 4, py - 2, hex('#6a8a58')); }
  });
}
function candle(px, py) {
  add(py, () => { rect(px, py - 4, 2, 4, hex('#e8e0d0')); put(px, py - 5, hex('#ffd070')); glow(px + 1, py - 5, 16, [255, 190, 110], 0.6); });
}
function mausoleum(tx, ty) {
  const [x, y] = P(tx, ty, 8, 14);
  add(y, () => {
    shadow(x + 6, y + 2, 26, 5);
    rect(x - 22, y - 26, 44, 26, hex('#5e5c68'));
    for (let i = -22; i < 22; i++) for (let j = -26; j < 0; j++) if ((i + 22) % 9 === 0 || (j + 26) % 6 === 0) put(x + i, y + j, hex('#46444f'));
    for (let j = 0; j < 12; j++) for (let i = -26 + j * 2; i <= 26 - j * 2; i++) put(x + i, y - 26 - j, hex(j === 0 ? '#3a3844' : '#4e4c58'));
    rect(x - 6, y - 16, 12, 16, hex('#1a1820'));
    for (let i = -6; i < 6; i += 3) rect(x + i, y - 16, 1, 16, hex('#4a4855'));
    glow(x, y - 8, 22, [140, 120, 220], 0.5);
  });
}
function fence(px0, py, n) {
  add(py, () => { for (let k = 0; k < n; k++) { rect(px0 + k * 6, py - 10, 2, 10, hex('#2e2c36')); put(px0 + k * 6, py - 11, hex('#2e2c36')); } rect(px0, py - 7, n * 6 - 4, 1, hex('#2e2c36')); rect(px0, py - 3, n * 6 - 4, 1, hex('#2e2c36')); });
}
function ribcage(px, py, scale, col = '#e8e2d0') {
  // 땅에 누운 뼈대 — 위에서 보면 등뼈 하나에 갈비뼈가 양쪽으로 휘어 나감 (가운데가 가장 길고 끝으로 갈수록 짧게)
  add(py, () => {
    const c = hex(col), dark = mul(c, 0.62), len = 26 * scale;
    const bone = (x, y) => { put(x, y, c); put(x + 1, y + 1, dark); darken(x + 2, y + 3, 0.8); };
    for (let i = -len; i <= len; i++) { bone(px + i, py); if ((i | 0) % 4 === 0) { put(px + i, py - 1, c); put(px + i, py + 1, c); } }   // 등뼈 마디
    for (let k = 0; k < 7; k++) {
      const bx = px - len * 0.75 + k * len * 0.25, reach = (11 - Math.abs(k - 3) * 2) * scale;
      for (const side of [-1, 1]) for (let t = 0; t <= 1; t += 0.03) {
        const x = bx + Math.sin(t * Math.PI * 0.9) * 4 * scale, y = py + side * reach * Math.sin(t * Math.PI * 0.55);
        bone(x, y);
      }
    }
  });
}
function skull(px, py, s) {
  add(py, () => {
    shadow(px + 3, py + 2, 12 * s, 4 * s);
    ellipse(px, py - 8 * s, 11 * s, 8 * s, hex('#e2dccb'));
    rect(px - 9 * s, py - 4 * s, 18 * s, 4 * s, hex('#d0c8b4'));
    ellipse(px - 4 * s, py - 8 * s, 2.6 * s, 2.6 * s, hex('#1a1418')); ellipse(px + 4 * s, py - 8 * s, 2.6 * s, 2.6 * s, hex('#1a1418'));
    for (let k = -3; k <= 3; k++) rect(px + k * 2.4 * s, py - 1 * s, 1.4 * s, 2 * s, hex('#f0ead8'));
    glow(px - 4 * s, py - 8 * s, 10 * s, [120, 200, 255], 0.35); glow(px + 4 * s, py - 8 * s, 10 * s, [120, 200, 255], 0.35);
  });
}
function monolith(px, py, col) {
  add(py, () => {
    shadow(px + 4, py + 2, 8, 3);
    for (let j = 0; j < 30; j++) for (let i = -5; i <= 5; i++) {
      if (j > 26 && Math.abs(i) > 5 - (j - 26)) continue;
      put(px + i, py - j, hex(i < -2 ? '#9a968a' : i > 2 ? '#5e5a52' : '#7e7a70'));
    }
    for (let j = 6; j < 24; j += 5) { put(px - 1, py - j, hex(col)); put(px + 1, py - j - 2, hex(col)); put(px, py - j - 1, hex(col)); }
    glow(px, py - 15, 26, mul(hex(col), 0.6));
  });
}
function pedestal(px, py, col) {
  add(py, () => {
    shadow(px + 2, py + 2, 8, 3);
    rect(px - 6, py - 8, 12, 8, hex('#3a2e44')); rect(px - 6, py - 8, 12, 1, hex('#5e4e6e')); rect(px - 7, py - 10, 14, 2, hex('#4a3c56'));
    const c = hex(col);
    for (let j = 0; j < 12; j++) for (let i = -4; i <= 4; i++) if (Math.abs(i) < 4.5 - j * 0.4 && hash(i, j + px, 63) < 0.9) put(px + i, py - 11 - j, j < 4 ? mul(c, 0.8) : j < 8 ? c : mix(c, [255, 255, 255], 0.5));
    glow(px, py - 16, 34, mul(c, 0.75));
  });
}
function throne(px, py) {
  add(py, () => {
    shadow(px + 4, py + 3, 22, 6);
    rect(px - 20, py - 6, 40, 6, hex('#2a2030')); rect(px - 16, py - 10, 32, 4, hex('#3a2c42'));
    rect(px - 12, py - 44, 24, 34, hex('#1e1624'));
    for (const sx of [-14, 12]) for (let j = 0; j < 14; j++) rect(px + sx, py - 58 + j, 3, 1, hex('#1e1624')), put(px + sx + 1, py - 60 + j * 0.2, hex('#1e1624'));
    rect(px - 9, py - 40, 18, 28, hex('#7a1a24')); rect(px - 9, py - 40, 18, 2, hex('#a02a30'));
    rect(px - 12, py - 46, 24, 3, hex('#c8a040'));
    glow(px, py - 30, 60, [200, 40, 50], 0.6);
  });
}
function worm(cx, cy) {
  add(cy + 20, () => {
    // 세계수를 먹는 벌레 — 굴을 가득 메운 마디 몸뚱이
    const segs = [];
    for (let k = 0; k < 16; k++) { const a = k * 0.55; segs.push([cx - 30 + k * 4.5, cy + Math.sin(a) * 9, 11 - Math.abs(k - 8) * 0.35]); }
    for (const [x, y, r] of segs) {
      shadow(x + 3, y + 6, r, r * 0.4, 0.7);
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        if (i * i + j * j > r * r) continue;
        const lit = (-i - j) / (r * 2);
        put(x + i, y + j, hex(i * i + j * j > (r - 1.5) ** 2 ? '#2a1a14' : lit > 0.25 ? '#b08060' : lit > -0.2 ? '#8a5e44' : '#5e3e2e'));
      }
      for (let j = -r + 2; j < r - 2; j++) put(x + Math.round(r * 0.3), y + j, hex('#4a2e22'));
    }
    const [hx, hy] = segs[segs.length - 1];
    ellipse(hx + 6, hy, 7, 8, hex('#2a0e12'));
    for (let k = -3; k <= 3; k++) { put(hx + 9, hy + k * 2, hex('#f0e8d8')); put(hx + 10, hy + k * 2, hex('#f0e8d8')); }
    glow(hx + 6, hy, 18, [255, 90, 60], 0.4);
  });
}
function eye(px, py) {
  add(py, () => {
    // 관측자 — 어둠 속의 커다란 눈
    for (let j = -10; j <= 10; j++) for (let i = -20; i <= 20; i++) {
      const lens = Math.abs(j) <= 10 * Math.sqrt(Math.max(0, 1 - (i / 20) ** 2));
      if (!lens) continue;
      const r = Math.hypot(i, j);
      put(px + i, py + j, hex(r < 3 ? '#0a0410' : r < 8 ? '#a06ae0' : r < 9 ? '#4a2a70' : '#e8e0f0'));
    }
    put(px - 4, py - 4, [255, 255, 255]); put(px - 3, py - 4, [255, 255, 255]);
    glow(px, py, 60, [150, 90, 230], 0.7);
  });
}
function portal(px, py) {
  add(py, () => {
    // 문의 광장으로 가는 문
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.02) for (let r = 12; r <= 15; r++) put(px + Math.cos(a) * r, py - 14 + Math.sin(a) * r, hex('#c8a040'));
    rect(px - 15, py - 14, 3, 14, hex('#c8a040')); rect(px + 13, py - 14, 3, 14, hex('#c8a040'));
    for (let j = -26; j < 0; j++) for (let i = -12; i <= 12; i++) {
      if (j < -14 && i * i + (j + 14) ** 2 > 144) continue;
      const sw = Math.sin(Math.hypot(i, j + 10) * 0.6 - Math.atan2(j + 10, i) * 2);
      put(px + i, py + j, mix(hex('#5a2a9a'), hex('#7ae0f0'), (sw + 1) / 2 * 0.7));
    }
    glow(px, py - 12, 50, [120, 160, 255], 0.7);
  });
}
function waterfall(px, py, w, h) {
  add(py, () => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const s = hash(i, Math.floor((j + i * 3) / 3), 64);
      put(px + i, py - h + j, s < 0.3 ? [235, 250, 255] : s < 0.7 ? hex('#9ad4e4') : hex('#6ab4cc'));
    }
    for (let k = 0; k < 40; k++) put(px - 3 + hash(k, 1, 65) * (w + 6), py - 2 + hash(k, 2, 65) * 5, [240, 252, 255]);
    glow(px + w / 2, py - h / 2, h, [120, 200, 240], 0.25);
  });
}
function gate(tx, ty) {
  // 1격 보스의 자리 — 지하수로 북쪽 끝의 수문
  const [x, y] = P(tx, ty, 8, 14);
  add(y, () => {
    shadow(x + 4, y + 3, 30, 5);
    rect(x - 30, y - 34, 60, 34, hex('#6d655c'));
    for (let i = -30; i < 30; i++) for (let j = -34; j < 0; j++) { const row = Math.floor((j + 34) / 5); if ((i + 30 + (row % 2) * 5) % 10 === 0 || (j + 34) % 5 === 0) put(x + i, y + j, hex('#4a443d')); }
    rect(x - 30, y - 37, 60, 3, hex('#8e867a'));
    rect(x - 12, y - 26, 24, 26, hex('#141018'));
    for (let i = -12; i < 12; i += 4) rect(x + i, y - 26, 2, 26, hex('#5a5048'));
    for (let j = -26; j < 0; j += 6) rect(x - 12, y + j, 24, 1, hex('#5a5048'));
    ellipse(x, y - 30, 4, 3, hex('#c8a040')); glow(x, y - 30, 20, [255, 200, 90], 0.5);
  });
}
function keystoneArch(tx, ty) {
  // 4격 보스(거인왕)가 막고 선 고개 — 「고개의 쐐기돌」이 박힌 거대한 아치
  const [x, y] = P(tx, ty, 8, 14);
  add(y, () => {
    shadow(x + 6, y + 4, 34, 7);
    for (const sx of [-30, 18]) { rect(x + sx, y - 44, 12, 44, hex('#8a8470')); rect(x + sx, y - 44, 3, 44, hex('#a8a28c')); rect(x + sx + 9, y - 44, 3, 44, hex('#5e5a4a')); }
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.01) for (let r = 24; r <= 34; r++) put(x + Math.cos(a) * r, y - 44 + Math.sin(a) * r * 0.55, hex(r > 32 ? '#5e5a4a' : '#8a8470'));
    rect(x - 5, y - 66, 10, 10, hex('#c8a040')); rect(x - 5, y - 66, 10, 2, hex('#f0d070'));
    glow(x, y - 61, 30, [255, 210, 110], 0.6);
  });
}
function giantSilhouette(px, py) {
  // 강 건너 4격 들판 — 「언젠가 저걸 잡아야 하는구나」 (외눈 거인이 앉아 있음)
  add(py, () => {
    shadow(px + 6, py + 3, 20, 5);
    const c = hex('#7a6e62');
    ellipse(px, py - 18, 16, 18, c); ellipse(px, py - 42, 10, 9, c);
    rect(px - 22, py - 30, 8, 22, mul(c, 0.85)); rect(px + 14, py - 30, 8, 22, mul(c, 0.85));
    ellipse(px, py - 43, 3.5, 3, hex('#f0e8d0')); put(px, py - 43, hex('#1a1010'));
    glow(px, py - 43, 12, [255, 230, 160], 0.3);
  });
}
function horse(px, py, col) {
  add(py, () => {
    shadow(px + 3, py + 2, 12, 3);
    rect(px - 10, py - 6, 20, 6, hex('#4a4855'));
    const c = hex(col);
    rect(px - 8, py - 18, 14, 7, c); rect(px + 4, py - 26, 4, 10, c); rect(px + 6, py - 28, 6, 4, c);
    for (const lx of [-7, -3, 2, 5]) rect(px + lx, py - 11, 2, 5, mul(c, 0.8));
    rect(px - 6, py - 25, 4, 7, mul(c, 0.7));                                    // 탄 기사
    glow(px + 9, py - 27, 10, [180, 220, 255], 0.35);
  });
}
function barrel(px, py) {
  add(py, () => {
    shadow(px + 2, py + 1, 5, 2);
    for (let j = 0; j < 11; j++) for (let i = -4; i <= 4; i++) {
      if (Math.abs(i) === 4 && (j === 0 || j === 10)) continue;
      put(px + i, py - j, hex(j === 2 || j === 8 ? '#4a4a50' : i < -1 ? '#b07a46' : i > 2 ? '#6a4426' : '#8e5e34'));
    }
    ellipse(px + 0.5, py - 10.5, 3.6, 1.4, hex('#a8784a'));
  });
}
function crate(px, py) {
  add(py, () => {
    shadow(px + 3, py + 1, 7, 2);
    rect(px - 5, py - 10, 11, 10, hex('#a8784a')); rect(px - 5, py - 10, 11, 1, hex('#c99a64'));
    rect(px - 5, py - 10, 1, 10, hex('#6a4426')); rect(px + 5, py - 10, 1, 10, hex('#6a4426')); rect(px - 5, py - 1, 11, 1, hex('#6a4426'));
    line(px - 4, py - 9, px + 4, py - 2, hex('#7a5232'));
  });
}
function log(px, py, len = 18) {
  add(py, () => {
    shadow(px + len / 2, py + 2, len / 2 + 2, 3);
    for (let i = 0; i < len; i++) for (let j = 0; j < 6; j++) put(px + i, py - 5 + j, hex(j === 0 ? '#9a6a3e' : j === 5 ? '#4a3020' : (i + j) % 5 === 0 ? '#5e3e26' : '#7a5232'));
    ellipse(px + len, py - 2.5, 2.4, 3, hex('#c8a070')); put(px + len, py - 3, hex('#8a6040'));
  });
}
function stump(px, py) {
  add(py, () => { shadow(px + 2, py + 1, 5, 2); rect(px - 4, py - 5, 9, 5, hex('#6a4a2e')); ellipse(px + 0.5, py - 5, 4.5, 2, hex('#c8a070')); put(px, py - 5, hex('#8a6a42')); });
}
function fern(px, py, col = '#5a9a48') {
  add(py, () => {
    for (let k = -2; k <= 2; k++) for (let s = 0; s < 6; s++) put(px + k * s * 0.6, py - s + Math.abs(k) * s * 0.15, hex(s > 3 ? col : '#3a6a30'));
  });
}
function rubble(px, py, n = 5, col = '#b0a690') {
  for (let k = 0; k < n; k++) rock(px - 8 + hash(k, px, 66) * 16, py - 3 + hash(k, py, 66) * 6, 2 + hash(k, 1, 66) * 2.5, col);
}
function woodFence(px0, py, n, vertical) {
  add(py + (vertical ? n * 6 : 0), () => {
    for (let k = 0; k < n; k++) {
      const x = vertical ? px0 : px0 + k * 6, y = vertical ? py + k * 6 : py;
      rect(x, y - 9, 2, 9, hex('#7a5232')); put(x, y - 10, hex('#9a6a3e'));
    }
    if (!vertical) { rect(px0, py - 7, n * 6 - 4, 1, hex('#9a6a3e')); rect(px0, py - 4, n * 6 - 4, 1, hex('#7a5232')); }
    else rect(px0, py - 7, 2, n * 6, hex('#9a6a3e'));
  });
}
function steppingStone(px, py) { add(py - 6, () => { ellipse(px, py, 4, 2.6, hex('#9a958a')); ellipse(px - 1, py - 1, 2.5, 1.4, hex('#b4afa4')); }); }
function spout(px, py, h) {
  // 벽 구멍에서 수로로 떨어지는 물
  add(py, () => { rect(px - 3, py - h - 4, 7, 5, hex('#3a3632')); rect(px - 2, py - h - 3, 5, 3, hex('#141214')); for (let j = 0; j < h; j++) for (let i = -1; i <= 1; i++) put(px + i, py - h + j, hash(i, j, 67) < 0.4 ? [230, 250, 255] : hex('#8ad0e0')); });
}
function coffin(px, py) {
  add(py, () => { shadow(px + 2, py + 1, 6, 2); for (let j = 0; j < 14; j++) { const w = j < 4 ? 3 + j * 0.6 : 5 - (j - 4) * 0.2; for (let i = -w; i <= w; i++) put(px + i, py - 14 + j, hex(i < -w + 1.5 ? '#7a5a3e' : '#5a3e28')); } rect(px - 1, py - 11, 2, 7, hex('#c8b08a')); rect(px - 3, py - 9, 6, 2, hex('#c8b08a')); });
}
function spike(px, py, h) {
  add(py, () => { shadow(px + 2, py + 1, 4, 2); for (let j = 0; j < h; j++) { const w = Math.max(0, 3.5 * (1 - j / h)); for (let i = -w; i <= w; i++) put(px + i, py - j, hex(i < 0 ? '#5a4a6e' : '#2a2034')); } put(px, py - h, hex('#c890ff')); });
}
function vent(px, py) {
  add(py, () => {
    ellipse(px, py - 1, 5, 2.4, hex('#1a1016')); ellipse(px, py - 1, 3, 1.4, hex('#ff7a2a'));
    for (let k = 0; k < 18; k++) put(px + Math.sin(k * 0.9) * (2 + k * 0.25), py - 3 - k * 1.3, [140, 120, 130], 0.5 - k * 0.02);
    glow(px, py - 2, 18, [255, 110, 50], 0.5);
  });
}
function cat(px, py) {
  // 모닥불 곁에서 자는 고양이 — 첫 공간의 친근함
  add(py, () => { ellipse(px, py - 2, 4, 2.4, hex('#e8a050')); ellipse(px + 3.5, py - 3.5, 2, 1.8, hex('#e8a050')); put(px + 3, py - 5.5, hex('#e8a050')); put(px + 5, py - 5.5, hex('#e8a050')); line(px - 4, py - 1, px - 6, py - 3, hex('#c88040')); put(px + 3, py - 4, hex('#4a2a18')); });
}
function ruinWallV(tx, ty, len) {
  // 세로로 선 성벽 조각 (위에서 내려다본 두께)
  const [x0, y0] = P(tx, ty, 5, 0);
  add(y0 + len * T, () => {
    shadow(x0 + 8, y0 + len * T / 2 + 2, 5, len * T / 2);
    for (let j = 0; j < len * T; j++) {
      const top = 6 - Math.floor(vnoise(j * 0.15, tx, 68) * 4);
      for (let i = 0; i < 6; i++) put(x0 + i, y0 + j, hex(i < top ? (j % 4 === 0 ? '#8a8270' : '#c8bea8') : '#6e6656'));
    }
  });
}
function ruinBlock(tx, ty, w, h, seed) {
  // 무너진 집터 — 네 벽 중 몇 군데가 끊김
  for (let k = 0; k < w; k += 2) if (hash(k, seed, 69) < 0.75) ruinWall(tx + k, ty, Math.min(2, w - k), 10 + (hash(k, seed, 70) * 6 | 0));
  for (let k = 0; k < w; k += 2) if (hash(k, seed, 71) < 0.6) ruinWall(tx + k, ty + h, Math.min(2, w - k), 8);
  if (hash(seed, 1, 72) < 0.8) ruinWallV(tx, ty + 1, h - 1);
  if (hash(seed, 2, 72) < 0.6) ruinWallV(tx + w, ty + 1, h - 1);
  rubble(...P(tx + (w >> 1), ty + (h >> 1)), 4);
}
function footprint(px, py, s = 1) {
  // 거인의 발자국에 고인 물 — 땅바닥이라 다른 것보다 먼저 그림
  add(py - 400, () => {
    const pool = (cx, cy, rx, ry) => {
      ellipse(cx, cy, rx + 1.5, ry + 1.5, hex('#6a6450'));
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        if (d <= 1) put(x, y, mix(C.waterShallow, C.waterDeep, d < 0.5 ? 0.7 : 0.3));
      }
    };
    pool(px, py, 12 * s, 8 * s);
    for (let k = -2; k <= 2; k++) pool(px + k * 6 * s, py - 12 * s - Math.abs(k) * 1.5 * s, 2.6 * s, 2.2 * s);
  });
}
function tower(px, py, r = 13) {
  // 성의 모서리 탑 — 꼭대기가 무너진 둥근 탑
  add(py + 2, () => {
    shadow(px + 6, py + 4, r + 4, r * 0.5);
    const top = 34;
    for (let j = 0; j < top; j++) for (let i = -r; i <= r; i++) {
      if (j > top - Math.floor(vnoise(i * 0.3, px * 0.01, 97) * 9)) continue;
      const f = i / r;
      put(px + i, py - j, hex(j % 6 === 0 ? '#8a8270' : f < -0.45 ? '#d4caaf' : f > 0.5 ? '#7a7264' : '#aaa08a'));
    }
    for (let i = -r + 2; i <= r - 2; i += 4) rect(px + i, py - 14, 2, 4, hex('#1e1a16'));   // 창
  });
}
function crow(px, py) { add(py, () => { line(px - 3, py - 1, px, py, hex('#14121a')); line(px, py, px + 3, py - 1, hex('#14121a')); }); }
function firefly(px, py) { add(py, () => { put(px, py, hex('#fff6a0')); glow(px, py, 8, [255, 240, 150], 0.5); }); }
function hut(tx, ty) {
  // 숲의 마녀(정예)의 오두막 — 보랏빛 창
  const [x, y] = P(tx, ty, 8, 14);
  add(y, () => {
    shadow(x + 5, y + 3, 22, 5);
    rect(x - 16, y - 20, 32, 20, hex('#6a4a30'));
    for (let j = -20; j < 0; j += 4) rect(x - 16, y + j, 32, 1, hex('#4e3622'));
    for (let j = 0; j < 16; j++) for (let i = -20 + j * 1.2; i <= 20 - j * 1.2; i++) put(x + i, y - 20 - j, hex((i + j) % 5 === 0 ? '#3e4a2a' : '#56663a'));
    rect(x - 4, y - 12, 8, 12, hex('#2a1a12'));
    rect(x + 8, y - 15, 5, 5, hex('#c890ff')); glow(x + 10, y - 13, 22, [190, 120, 255], 0.6);
    rect(x + 10, y - 40, 3, 6, hex('#5a4a40')); for (let k = 0; k < 4; k++) put(x + 11 + k, y - 42 - k * 2, hex('#b8b0c0'), 0.6);
  });
}
function orcCamp(tx, ty) {
  const [x, y] = P(tx, ty, 8, 12);
  add(y, () => {
    rect(x - 1, y - 30, 2, 30, hex('#4a3020'));
    for (let j = 0; j < 10; j++) rect(x + 1, y - 30 + j, 12 - j, 1, hex('#9a2a20'));
    put(x + 4, y - 26, hex('#e8d8a0')); put(x + 5, y - 26, hex('#e8d8a0'));
  });
  tent(x - 24, y + 6, '#7a6a4a'); tent(x + 26, y + 10, '#6a5a3e');
}

// ---------- 놓기 ----------
// 첫 공간 — 모닥불 · 천막 · 상인 수레 · 우물 · 표지판 · 등불
campfire(...P(72, 57)); keepClear(72, 57, 4);
tent(...P(67, 54, 8, 12), '#c8b088'); tent(...P(77, 54, 8, 12), '#a8c0c8');
cart(...P(80, 59, 8, 10)); well(...P(64, 59, 8, 10)); sign(...P(70, 52, 4, 12)); sign(...P(61, 58, 8, 12));
for (const [x, y] of [[66, 60], [78, 61], [72, 50]]) lantern(...P(x, y, 8, 12));
for (const [x, y, c] of [[63, 54, '#f4d35e'], [80, 52, '#ee8fb0'], [67, 62, '#ffffff'], [76, 62, '#9fc5ff']]) bush(x, y, 8, 12, x * y, c);
// 모닥불 둘레 통나무 의자 · 자는 고양이 · 상인 수레 곁 짐 · 강가 울타리 · 디딤돌
log(...P(69, 56, 4, 12), 16); log(...P(73, 58, 4, 12), 16); log(...P(70, 59, 0, 8), 14);
cat(...P(74, 56, 2, 12));
crate(...P(82, 58, 2, 12)); crate(...P(82, 59, 6, 6)); barrel(...P(83, 60, 2, 12)); barrel(...P(79, 61, 10, 10));
woodFence(...P(62, 63, 0, 10), 12); woodFence(...P(76, 63, 0, 12), 10);
for (const [x, y] of [[72, 53], [72, 54], [71, 55], [65, 58], [63, 58]]) steppingStone(...P(x, y, 8, 10));
for (let k = 0; k < 18; k++) { const x = 60 + hash(k, 1, 77) * 24, y = 51 + hash(k, 2, 77) * 12; if (ter[idx(x | 0, y | 0)] === GRASS) add(y * T, () => { for (let f = 0; f < 6; f++) put(x * T + hash(k, f, 78) * 10, y * T + hash(f, k, 78) * 6, hex(['#f4d35e', '#ee8fb0', '#ffffff', '#c890ff'][(k + f) % 4])); }); }
keepClear(72, 56, 9);
for (const [x, y, k] of [[60, 53, 'big'], [84, 55, 'round'], [59, 61, 'round'], [85, 62, 'big'], [65, 51, 'round'], [80, 50, 'round'], [62, 56, 'round']]) tree(x, y, k, x * 13 + y);

// 1격 지하수로 — 아홉 구역의 등불 · 하수 쇠창살 · 이끼 낀 돌 · 작은 다리 (수로를 건너는 곳)
for (const by of [29, 37, 45]) for (const bx of [60, 75, 90]) lantern(...P(bx, by, 4, 12), '#ffd890');
for (const [x, y] of [[57, 30], [80, 36], [92, 46], [62, 46], [72, 28]]) add(y * T + 10, () => { const [px, py] = P(x, y, 2, 4); rect(px, py, 12, 8, hex('#2a2a2e')); for (let i = 1; i < 12; i += 3) rect(px + i, py, 1, 8, hex('#5a5a60')); });
for (const [x, y, v] of [[59, 33, true], [75, 33, true], [91, 33, true], [59, 41, true], [75, 41, true], [91, 41, true]]) bridge(x, y, 2, v);
for (const [x, y] of [[66, 30], [84, 30], [66, 38], [84, 38], [66, 46], [84, 46]]) bridge(x, y, 2, false);
gate(75, 24);                                                                 // 던전 가디언의 수문
for (const [x, y] of [[56, 44], [95, 28], [88, 47], [57, 27]]) crystal(...P(x, y, 8, 12), '#7ae0f0', 9);
statue(...P(70, 37, 8, 12), '#8a9298', '#7ae0f0');                            // 고블린 족장이 지키는 석상 (정예 자리)
// 미믹 — 수로 구석에 놓인, 너무 반짝이는 보물상자 (정예 자리)
add(46 * T + 12, () => { const [x, y] = P(93, 46, 8, 12); shadow(x + 2, y + 1, 7, 2); rect(x - 6, y - 8, 12, 8, hex('#8a5a32')); rect(x - 6, y - 11, 12, 4, hex('#a8784a')); rect(x - 6, y - 8, 12, 1, hex('#c8a040')); rect(x - 1, y - 9, 2, 3, hex('#f0d070')); glow(x, y - 6, 16, [255, 210, 110], 0.5); });
// 통 · 상자 · 고사리 · 무너진 돌 — 사람이 쓰던 곳
for (const [x, y] of [[57, 29], [62, 36], [92, 37], [88, 29], [70, 45], [80, 44], [57, 45]]) barrel(...P(x, y, 4 + (x % 3) * 3, 12));
for (const [x, y] of [[58, 29], [93, 38], [81, 44], [63, 30]]) crate(...P(x, y, 8, 12));
for (let k = 0; k < 40; k++) { const x = 55 + hash(k, 1, 79) * 42 | 0, y = 27 + hash(k, 2, 79) * 22 | 0; if (ter[idx(x, y)] === COBBLE && [CANAL, VOID].some(t => [T_(x - 1, y), T_(x + 1, y), T_(x, y - 1), T_(x, y + 1)].includes(t))) fern(...P(x, y, 2 + hash(k, 3, 79) * 12 | 0, 14)); }
// 벽 구멍에서 떨어지는 물, 수로 끝에서 어둠으로 쏟아지는 물
for (const x of [61, 79, 91]) spout(...P(x, 27, 8, 4), 8);
for (const [x, y] of [[54, 33], [97, 41]]) waterfall(...P(x, y + 2, 0, 14), 16, 30);

// 갈림목 — 표지판
sign(...P(76, 18, 8, 12)); lantern(...P(73, 16, 8, 12)); lantern(...P(79, 16, 8, 12));

// 2격 숲 — 빈터 아홉 (구역), 오크 장군의 야영지 · 숲의 마녀 오두막, 트롤 킹은 서쪽 끝 다리 밑
const clearings = [[44, 10], [34, 12], [27, 18], [22, 28], [16, 34], [40, 26], [32, 34], [48, 32], [12, 14]];
for (const [x, y] of clearings) keepClear(x, y, 3.2);
hut(40, 26); keepClear(40, 26, 4);
orcCamp(32, 34); keepClear(32, 34, 4.5);
bridge(14, 37, 2, false); keepClear(12, 38, 5);
statue(...P(9, 38, 8, 12), '#5a6a4a', '#ff5a3a');                          // 트롤 킹이 지키는 끝 — 이끼 낀 우상
waterfall(...P(8, 1, 4, 14), 28, 22);
for (let k = 0; k < 60; k++) { const x = 6 + hash(k, 1, 70) * 50, y = 4 + hash(k, 2, 70) * 36; if (ter[idx(x | 0, y | 0)] === GRASS && bio[idx(x | 0, y | 0)] === 2) mushroom(...P(x | 0, y | 0, 4 + hash(k, 3, 70) * 8 | 0, 10), hash(k, 4, 70) < 0.5 ? '#7ad0ff' : '#c890ff'); }
for (let k = 0; k < 50; k++) { const x = 6 + hash(k, 5, 71) * 50, y = 4 + hash(k, 6, 71) * 36; if (bio[idx(x | 0, y | 0)] === 2) firefly(x * T, y * T); }

// 3격 무너진 왕국 — 무너진 성벽 · 기둥 줄 · 석상 · 성, 물에 잠긴 안뜰(히드라), 북쪽 폭포 뒤 숨은 굴(카벙클)
for (const [x, y, w] of [[106, 10, 5], [120, 6, 3], [142, 6, 5]]) ruinWall(x, y, w);
// 무너진 집터들 — 큰길 남북으로 줄지어
for (const [x, y, w, h, s] of [[106, 22, 6, 4, 1], [114, 24, 5, 5, 2], [133, 24, 6, 4, 3], [148, 22, 7, 5, 4], [110, 4, 6, 4, 5], [134, 6, 5, 4, 6], [150, 4, 5, 4, 7], [122, 28, 6, 4, 8]]) ruinBlock(x, y, w, h, s);
for (let k = 0; k < 9; k++) column(...P(108 + k * 6, k % 2 ? 13 : 20, 8, 12), hash(k, 0, 72) < 0.3);
for (const [x, y] of [[118, 20], [140, 15], [130, 12], [154, 16], [112, 18]]) rubble(...P(x, y), 6);
statue(...P(126, 21, 8, 12), '#c8c0a8', '#f0d070');                          // 옛 광장의 왕 석상
// 몰락한 왕의 성 — 두꺼운 성벽 · 모서리 탑 · 서쪽 성문(큰길이 들어옴) · 붉은 융단 · 왕좌
ruinWall(157, 8, 15, 26);
ruinWallV(157, 9, 8); ruinWallV(157, 22, 8);
ruinWallV(171, 9, 21);
for (const k of [0, 3, 9, 12]) ruinWall(157 + k, 30, 3, 16);
for (const [x, y] of [[157, 8], [171, 8], [157, 30], [171, 30], [157, 17], [157, 22]]) tower(...P(x, y, 8, 12), y === 17 || y === 22 ? 9 : 13);
add(17 * T, () => { const [x, y] = P(158, 19, 0, 3); for (let i = 0; i < 7 * T; i++) for (let j = 0; j < 10; j++) put(x + i, y + j, hex(j === 0 || j === 9 ? '#c8a040' : (i + j) % 9 === 0 ? '#8a2028' : '#a02a30')); });
for (const [x, y] of [[160, 9], [168, 9]]) add(9 * T + 13, () => { const [px, py] = P(x, y, 6, 0); rect(px, py, 6, 14, hex('#a02a30')); rect(px, py + 14, 2, 2, hex('#a02a30')); rect(px + 4, py + 14, 2, 2, hex('#a02a30')); put(px + 2, py + 5, hex('#c8a040')); put(px + 3, py + 5, hex('#c8a040')); });
for (const [x, y] of [[162, 12], [168, 26], [160, 25]]) rubble(...P(x, y), 6);
throne(...P(166, 19, 8, 12));                                                 // 몰락한 왕
waterfall(...P(116, 5, 2, 12), 20, 26); crystal(...P(118, 5, 8, 6), '#ffd0ff', 8);
add(35 * T, () => { for (let k = 0; k < 5; k++) put(...P(138 + k * 0.7, 30, 4 + k * 2, 6), [210, 250, 255]); });
for (const [x, y] of [[134, 28], [141, 31]]) rock(...P(x, y, 8, 10), 5, '#7a8a8a');
statue(...P(145, 11, 8, 12), '#b0b8c8', '#9fc5ff');                           // 그리핀 로드의 탑 자리

// 강 — 첫 공간 서쪽 능선길 끝의 다리 (4격으로), 호수의 배 · 동쪽 끝 어둠으로 떨어지는 물
bridge(33, 64, 6, true);
add(66 * T, () => { const [x, y] = P(105, 63, 0, 6); for (let i = 0; i < 26; i++) for (let j = 0; j < 7; j++) if (Math.abs(i - 13) < 13 - j * 0.6) put(x + i, y + j, hex(j < 2 ? '#a8784a' : '#7a5232')); });
waterfall(...P(116, 66, 0, 14), 10, 12);

// 4격 거인의 고개 — 전나무 · 큰 바위 · 거인 갈비뼈 · 원소 거인 넷의 돌 고리 · 쐐기돌 아치 · 강 건너 외눈 거인
for (const [x, y, r] of [[40, 78, 11], [62, 92, 9], [80, 82, 12], [24, 86, 8], [70, 104, 10], [88, 96, 9], [52, 76, 7]]) rock(...P(x, y, 8, 10), r, '#8e8878');
ribcage(...P(60, 96, 8, 12), 2); skull(...P(68, 95, 8, 12), 1.8);           // 쓰러진 거인의 뼈
for (const [x, y, s] of [[50, 86, 1], [54, 90, 1.1], [49, 94, 1]]) footprint(...P(x, y, 8, 8), s);
const ring = [[78, 96, '#a8a49a'], [84, 98, '#7ad0ff'], [78, 101, '#ff7a3a'], [72, 98, '#e8f0ff']];      // 돌 · 서리 · 불 · 구름
for (const [x, y, c] of ring) monolith(...P(x, y, 8, 12), c);
keepClear(78, 98, 6);
keystoneArch(95, 88);
giantSilhouette(...P(72, 75, 8, 12)); keepClear(72, 75, 4);
stairs(28, 102, 2);                                                           // 눈 덮인 봉우리로 오르는 돌계단
for (let k = 0; k < 18; k++) { const x = 18 + hash(k, 1, 73) * 76, y = 72 + hash(k, 2, 73) * 34; if (ter[idx(x | 0, y | 0)] === SNOW) crystal(...P(x | 0, y | 0, 8, 12), '#c8f0ff', 7); }

// 5격 시체가 걷는 도시 — 쇠울타리로 두른 묘지 구획(묘비가 줄지어) · 영묘 · 본 드래곤 · 네 말의 기사 석상 · 까마귀 · 불사의 왕의 대성당
for (const [x0, y0, w, h] of [[108, 86, 10, 5], [122, 101, 12, 5], [148, 102, 10, 5], [154, 86, 9, 5], [130, 88, 7, 3]]) {
  fence(...P(x0, y0, 0, 4), w * 2 + 3); fence(...P(x0, y0 + h, 0, 14), w * 2 + 3);
  for (let y = y0 + 1; y < y0 + h; y += 1.5) for (let x = x0 + 0.5; x < x0 + w; x += 1.2) {
    if (hash(x * 10, y * 10, 73) < 0.15) continue;                          // 빈 자리 몇 군데 — 파헤쳐진 무덤
    tomb(x * T, y * T + 10, hash(x * 7, y * 3, 74) < 0.25 ? 'cross' : 'stone');
    if (hash(x * 3, y * 7, 75) < 0.12) candle(x * T + 6, y * T + 10);
  }
}
for (const [x, y] of [[112, 96], [140, 106], [160, 94]]) coffin(...P(x, y, 8, 12));
for (const [x, y] of [[116, 88], [128, 104], [152, 90], [160, 106]]) mausoleum(x, y);
fence(...P(132, 86, 0, 12), 14); fence(...P(110, 104, 0, 12), 10);
skull(...P(118, 100, 8, 12), 1.6); ribcage(...P(126, 101, 8, 12), 1.5, '#d8d2c2');
const horses = [[138, 92, '#f0ece0'], [146, 92, '#b0302a'], [138, 98, '#2a2830'], [146, 98, '#a8c0a0']];
for (const [x, y, c] of horses) horse(...P(x, y, 8, 12), c);
keepClear(142, 95, 5);
for (let k = 0; k < 14; k++) crow(...P(108 + hash(k, 1, 75) * 60 | 0, 84 + hash(k, 2, 75) * 24 | 0, 8, 4));
add(98 * T, () => { const [x, y] = P(164, 98, 8, 14); shadow(x + 6, y + 3, 30, 6); rect(x - 24, y - 40, 48, 40, hex('#4e4c58')); for (let j = 0; j < 22; j++) for (let i = -10 + j * 0.45; i <= 10 - j * 0.45; i++) put(x + i, y - 40 - j, hex('#3a3844')); rect(x - 7, y - 24, 14, 24, hex('#120e18')); for (const sx of [-18, 12]) { rect(x + sx, y - 32, 6, 10, hex('#6a5ac8')); glow(x + sx + 3, y - 27, 20, [120, 100, 240], 0.6); } glow(x, y - 12, 30, [100, 220, 160], 0.5); });
for (const [x, y] of [[112, 108]]) add(y * T, () => { const [px, py] = P(x, y, 8, 12); rect(px - 8, py - 10, 16, 10, hex('#2a2830')); rect(px - 5, py - 8, 10, 8, hex('#0a0810')); glow(px, py - 4, 14, [180, 120, 255], 0.35); });   // 까마귀 왕이 숨은 지하 묘실 (숨은 입구)

// 6격 마계의 왕좌 — 칠죄종 일곱 받침 · 세계수를 먹는 벌레 · 마왕의 왕좌 · 뒤의 눈(관측자) · 문의 광장 문
const sins = [['#c8a040', 138, 57], ['#6ac040', 145, 57], ['#e070b0', 152, 57], ['#8a5a30', 141, 66], ['#a070ff', 148, 66], ['#ff4a2a', 155, 66], ['#40c0c0', 156, 61]];   // 탐욕 질투 색욕 폭식 오만 분노 나태
for (const [c, x, y] of sins) pedestal(...P(x, y, 8, 12), c);
for (const [x, y] of [[136, 55], [157, 55], [136, 68], [157, 68]]) column(...P(x, y, 8, 12));
worm(160 * T + 8, 61 * T + 6);
throne(...P(169, 61, 8, 12));
eye(...P(174, 61, 4, 8));
portal(...P(171, 69, 0, 12));
for (const [x, y] of [[166, 55], [172, 55], [166, 67]]) pedestal(...P(x, y, 8, 12), '#ff3a2a');
for (let k = 0; k < 30; k++) { const x = 128 + hash(k, 1, 76) * 46, y = 48 + hash(k, 2, 76) * 30; if (ter[idx(x | 0, y | 0)] === OBSID && openDist[idx(x | 0, y | 0)] > 1) crystal(...P(x | 0, y | 0, 8, 12), '#c050ff', 10); }
for (let k = 0; k < 60; k++) { const x = 126 + hash(k, 3, 76) * 48 | 0, y = 46 + hash(k, 4, 76) * 34 | 0; if (ter[idx(x, y)] === OBSID && openDist[idx(x, y)] > 0.5 && !isReserved(x, y)) spike(...P(x, y, 2 + hash(k, 5, 76) * 12 | 0, 12), 8 + hash(k, 6, 76) * 10 | 0); }
for (const [x, y] of [[131, 60], [134, 72], [160, 72], [150, 50]]) vent(...P(x, y, 8, 10));
keepClear(146, 61, 12); keepClear(168, 61, 7);

// ---------- 나무 · 덤불 · 바위를 땅마다 흩뿌림 ----------
for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
  const i = idx(tx, ty), t = ter[i], b = bio[i];
  if (isReserved(tx, ty) || openDist[i] < 1.5 || voidNear(tx, ty, 1)) continue;
  const r = hash(tx, ty, 80);
  const grove = fbm(tx * 0.16, ty * 0.16, 83);            // 숲덩이 — 높은 곳은 빽빽, 낮은 곳은 빈터
  if (t === GRASS && b === 2) {
    if ((tx + ty) % 2 === 0 && r < 0.35 + grove * 0.6) tree(tx, ty, hash(tx, ty, 81) < 0.3 ? 'big' : 'mossy', tx * 31 + ty);   // 빽빽한 숲 — 길가 · 빈터만 트임
    else if (r < 0.1) fern(...P(tx, ty, 2 + hash(tx, ty, 84) * 12 | 0, 12));
    else if (r < 0.13) stump(...P(tx, ty, 8, 12));
    else if (r < 0.15) log(...P(tx, ty, 0, 12), 14);
  } else if (t === GRASS && b === 0) {
    if (grove > 0.55 && r < 0.3) tree(tx, ty, 'round', tx * 31 + ty);
    else if (r < 0.06) bush(tx, ty, 8, 12, tx * ty, hash(tx, ty, 82) < 0.5 ? '#f4d35e' : null);
  } else if (t === GRASS && b === 3) {
    if (grove > 0.55 && r < 0.28) tree(tx, ty, 'round', tx * 31 + ty);
    else if (r < 0.06) bush(tx, ty, 8, 12, tx * ty, '#ee8fb0');
    else if (r < 0.08) fern(...P(tx, ty, 8, 12), '#7a9a4e');
  } else if ((t === ROCKY || t === SNOW) && b === 4) {
    if (grove > 0.52 && r < 0.32) tree(tx, ty, 'pine', tx * 31 + ty);
    else if (r < 0.05) rock(...P(tx, ty, 8, 10), 3 + hash(tx, ty, 85) * 3, t === SNOW ? '#c8d0dc' : '#8e8878');
  } else if ((t === PAVE || t === GRASS) && b === 5) {
    if (grove > 0.55 && r < 0.12) tree(tx, ty, 'dead', tx * 31 + ty);
  } else if (t === GRASS && b === 1 && r < 0.08) bush(tx, ty, 8, 12, tx * ty, null);
}

objs.sort((a, b) => a.y - b.y);
for (const o of objs) o.fn();

// ============================================================
//  빛 · 안개 · 마무리
// ============================================================
// 격마다 바탕 빛 — 남동쪽(5 · 6격)으로 갈수록 어둡고 차갑거나 붉게
const AMB = [[1, 1, 1], [0.96, 0.98, 1.02], [0.9, 0.98, 0.9], [1.02, 0.98, 0.9], [0.95, 0.96, 1.02], [0.66, 0.68, 0.82], [0.62, 0.5, 0.58]];
const out = new Uint8Array(PW * PH * 4);
for (let Y = 0; Y < PH; Y++) for (let X = 0; X < PW; X++) {
  const tx = Math.min(W - 1, Math.max(0, Math.floor((X + (vnoise(X * 0.01, Y * 0.01, 90) - 0.5) * 120) / T)));
  const ty = Math.min(H - 1, Math.max(0, Math.floor((Y + (vnoise(X * 0.01, Y * 0.01, 93) - 0.5) * 120) / T)));
  const b = ter[idx(tx, ty)] === VOID ? 0 : bio[idx(tx, ty)];
  const a = emis[Y * PW + X] ? [1, 1, 1] : AMB[b];
  const i = (Y * PW + X) * 3;
  let r = base[i] * a[0], g = base[i + 1] * a[1], bl = base[i + 2] * a[2];
  // 안개 — 5격 · 6격, 그리고 어둠과 맞닿은 곳 가까이
  if (b === 5 || b === 6) {
    const f = Math.max(0, fbm(X * 0.006, Y * 0.01, 95) - 0.45) * (b === 5 ? 0.9 : 0.5);
    const fc = b === 5 ? [150, 160, 190] : [120, 60, 90];
    r += (fc[0] - r) * f; g += (fc[1] - g) * f; bl += (fc[2] - bl) * f;
  }
  // 가장자리 어둡게 (지도 바깥이 깊은 어둠으로 녹아들게)
  const ex = Math.min(X, PW - 1 - X) / 240, ey = Math.min(Y, PH - 1 - Y) / 240, v = Math.min(1, Math.min(ex, ey));
  const vig = 0.55 + 0.45 * sm(v);
  r = r * vig + glowBuf[i]; g = g * vig + glowBuf[i + 1]; bl = bl * vig + glowBuf[i + 2];
  const o = (Y * PW + X) * 4;
  out[o] = Math.max(0, Math.min(255, r)); out[o + 1] = Math.max(0, Math.min(255, g)); out[o + 2] = Math.max(0, Math.min(255, bl)); out[o + 3] = 255;
}
fs.writeFileSync(path.join(OUT, 'overworld.png'), encodePng(PW, PH, out));

// 격마다 두 배로 확대한 그림
const ZOOMS = [
  ['camp', '첫 공간 · 1격 초심자의 지하수로', 50, 14, 100, 66],
  ['forest', '2격 이끼 낀 숲길', 2, 0, 58, 44],
  ['ruins', '3격 무너진 왕국', 100, 0, 176, 40],
  ['giants', '4격 거인의 고개', 14, 62, 100, 112],
  ['necro', '5격 시체가 걷는 도시', 100, 78, 176, 112],
  ['abyss', '6격 마계의 왕좌', 124, 44, 176, 80]
];
for (const [name, , x0, y0, x1, y1] of ZOOMS) {
  const zw = (x1 - x0) * T * 2, zh = (y1 - y0) * T * 2, z = new Uint8Array(zw * zh * 4);
  for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) {
    const sx = x0 * T + (x >> 1), sy = y0 * T + (y >> 1), s = (sy * PW + sx) * 4, d = (y * zw + x) * 4;
    z[d] = out[s]; z[d + 1] = out[s + 1]; z[d + 2] = out[s + 2]; z[d + 3] = 255;
  }
  fs.writeFileSync(path.join(OUT, `zoom-${name}.png`), encodePng(zw, zh, z));
}
console.log(`지도 시안 — ${PW}×${PH}px (${W}×${H}칸) · 확대 ${ZOOMS.length}장 → ${path.relative(process.cwd(), OUT)}`);
