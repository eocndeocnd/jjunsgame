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
const lightBuf = new Float32Array(PW * PH);         // 어둠을 걷어 내는 빛 (곱하는 빛 — 더하는 glow 와 달리 색이 바래지 않음)
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
function lightUp(cx, cy, r, s) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    if (x < 0 || y < 0 || x >= PW || y >= PH) continue;
    const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.25) / r;
    if (d < 1) lightBuf[y * PW + x] += sm(1 - d) * s;
  }
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
// 「∩」자 배치 — 처음(왼쪽 아래)에서 1격 지하수로를 거쳐 위로 기어 올라가 2격 숲(처음 보는 바깥),
// 왼쪽 위 3격 왕국(막다른 곳) · 가운데 4격 고개(절벽 너머) → 오른쪽 위 5격 묘지 → 오른쪽 아래 6격 마계로 내려감.
// 다음 격이 늘 바로 옆 — 되돌아 걷는 곳은 3격에서 2격으로 나오는 길 하나뿐.

// 2격 이끼 낀 숲길 — 지하수로 수문 너머의 바깥
blob(52, 44, 18, 15, GRASS, 2, 0, 0.3, 11);
// 3격 무너진 왕국 — 왼쪽 위. 2격과는 낭떠러지로 갈리고 흔들다리 하나로만 이어짐
blob(25, 15, 22, 12, GRASS, 3, 0, 0.3, 12);
box(6, 5, 42, 23, GRASS, 3, 0);
// 1격 초심자의 지하수로 — 수로가 가로세로로 가르는 아홉 구역
box(30, 66, 70, 91, COBBLE, 1, 0);
// 처음 — 지하수로 맨 밑, 무너진 천장 아래의 둥근 방. 빛은 위에서 떨어지는 한 줄뿐
blob(50, 101, 9, 6.5, COBBLE, 7, 0, 0.3, 14);
// 4격 거인의 고개 — 가운데. 2격과는 절벽으로 갈리고, 남서쪽으로 내민 바위턱이 1격 북동쪽 끝에서 보임
blob(92, 45, 17, 13, ROCKY, 4, 1, 0.3, 15);
blob(82, 56, 6, 4, ROCKY, 4, 1, 0.3, 21);
blob(93, 36, 8, 4.5, SNOW, 4, 2, 0.35, 16);       // 눈 덮인 봉우리
blob(103, 53, 4.5, 2.6, ROCKY, 4, 2, 0.4, 23);     // 바위 단
blob(82, 50, 4, 2.4, ROCKY, 4, 2, 0.4, 24);
// 5격 시체가 걷는 도시 — 오른쪽 위
blob(130, 38, 16, 14, GRASS, 5, 0, 0.25, 19);
blob(126, 30, 5, 3, PAVE, 5, 0, 0.3, 26);         // 네 말의 기사 광장
box(125, 47, 135, 52, PAVE, 5, 0);                 // 대성당 앞뜰
// 6격 마계의 왕좌 — 오른쪽 아래, 묘지 밑으로 내려간 곳
blob(146, 85, 24, 17, OBSID, 6, 0, 0.28, 20);

// ---- 격 사이 — 이어지는 곳만 남기고 어둠으로 확실히 가름 ----
road([[26, 31], [58, 25]], 3.6, VOID, 0, 0, 0.6);   // 2격 | 3격 낭떠러지 (트롤 킹의 흔들다리가 걸림)
road([[72, 28], [72, 62]], 3.4, VOID, 0, 0, 0.6);   // 2격 | 4격 절벽 (숨은 통나무 다리가 걸림)
// 1격 → 2격: 지하수로 북쪽 수문 (던전 가디언)
box(47, 60, 53, 66, COBBLE, 1, 0);
// 처음 → 1격: 남쪽 계단
box(48, 92, 52, 95, COBBLE, 7, 0);
// 4격 → 5격: 거인왕이 막은 3칸 협곡
road([[107, 44], [116, 44]], 3, ROCKY, 4, 1, 0.2);
for (let y = 30; y <= 60; y++) for (let x = 108; x <= 114; x++) if (y < 43 || y > 45) paint(x, y, VOID);
// 5격 → 6격: 대성당 밑 묘실 계단 (불사의 왕이 막음) — 묘지에서 마계로 내려감
box(128, 52, 132, 59, PAVE, 5, 0);
box(128, 60, 132, 68, OBSID, 6, 0);
for (let y = 53; y <= 68; y++) for (let x = 118; x <= 142; x++) if (x < 128 || x > 132) paint(x, y, VOID);

// ---- 물 ----
road([[38, 33], [44, 40], [54, 46], [57, 53], [53, 59]], 2.2, WATER, 2, 0, 0.5, 7);   // 숲 시내 — 수문 옆 배수구로 흘러 지하수로로
road([[62, 39], [69, 40]], 1.6, WATER, 2, 0, 0.4, 8);                                  // 동쪽 끝 작은 폭포로 가는 물 (그 뒤로 숨은 샛길)
blob(23, 21, 4.5, 2.5, WATER, 3, 0, 0.4, 33);     // 물에 잠긴 안뜰 (히드라)
blob(27, 7, 3.5, 2, WATER, 3, 0, 0.4, 34);        // 북쪽 절벽 폭포 밑 웅덩이 (카벙클이 숨은 곳)

// ---- 1격 수로 — 가로 둘, 세로 둘 (폭 2) ----
for (let x = 31; x <= 69; x++) for (const y of [74, 75, 82, 83]) paint(x, y, CANAL, 1);
for (let y = 67; y <= 90; y++) for (const x of [43, 44, 56, 57]) paint(x, y, CANAL, 1);
// 지하수로 둘레는 군데군데 무너져 — 반듯한 네모가 아니게 (수문 · 들머리 계단 쪽은 남김)
for (let y = 66; y <= 91; y++) for (let x = 30; x <= 70; x++) {
  const e = Math.min(x - 30, 70 - x, y - 66, 91 - y);
  if (e > 1 || (x >= 45 && x <= 55)) continue;
  if (fbm(x * 0.35, y * 0.35, 35) > 0.56 + e * 0.1) paint(x, y, VOID);
}

// ---- 길 (흙 — 픽셀로 그림) ----
trail([[50, 60], [50, 54], [47, 48], [48, 42], [45, 36], [44, 32]], 2.2, 2);           // 수문 → 흔들다리
// (4격으로 가는 샛길은 흙길이 없음 — 빽빽한 나무 사이 한 칸 틈, 폭포 · 덩굴 뒤)
trail([[76, 42], [84, 44], [92, 46], [100, 45], [107, 44]], 2.2, 4);
trail([[88, 45], [91, 41]], 1.5, 4);
trail([[96, 46], [99, 50]], 1.5, 4);
trail([[116, 44], [122, 42], [128, 38], [134, 41], [133, 46], [130, 50]], 2.2, 5);

// ---- 3격 왕국 — 흔들다리에서 서쪽 끝 성까지 옛 큰길 · 깨진 포석 광장 · 성 ----
road([[43, 24], [36, 20], [28, 17], [19, 15]], 3, COBBLE, 3, 0, 0.4);
blob(33, 11, 5, 3.5, TILES, 3, 0, 0.5, 31);       // 옛 광장 (마른 분수)
box(6, 6, 16, 21, TILES, 8, 0);                   // 몰락한 왕의 성 — 어둑한 돌바닥의 큰 방 (격 3 의 일부, 빛만 따로)

// ---- 6격 — 용암 강 · 칠죄종 홀 · 벌레의 굴 · 왕좌 ----
road([[126, 72], [131, 77], [128, 86], [134, 94], [142, 99]], 2.4, LAVA, 6, 0, 0.8, 41);
box(134, 76, 154, 89, TILES, 6, 0);               // 칠죄종 홀 바닥
box(155, 80, 159, 84, OBSID, 6, 0);               // 벌레가 막은 굴
box(160, 74, 169, 91, TILES, 6, 0);               // 왕좌의 방
// 왕좌의 방은 어둠 속 섬 — 세계수를 먹는 벌레의 굴로만 들어감
for (let y = 68; y <= 100; y++) for (let x = 156; x <= 175; x++) {
  const room = x >= 160 && x <= 169 && y >= 74 && y <= 91, tunnel = x <= 159 && y >= 80 && y <= 84;
  if (!room && !tunnel && x >= 158) paint(x, y, VOID);
}

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
  const cave = bio[idx(tx, ty)] === 7;                         // 첫 공간 둘레는 동굴처럼 들쭉날쭉
  if (!cave && (BUILT.has(t0) || BUILT.has(t1))) {             // 깐 바닥의 가장자리는 덜 흔들어 반듯함을 남김
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
  tilesHall: ['#6a6458', '#5a554a', '#7a7466', '#3a362e'],      // 성 안 — 먼지 앉은 어두운 돌
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
      // 둥근 자갈돌 — 크기도 모양도 제각각, 물가 가까이는 젖어 짙게, 군데군데 이끼 (첫 공간은 더 짙고 축축)
      let c = b === 7 ? stones(X, Y, 8, 12, ['#5e6266', '#4e5256', '#70757a', '#3a3d40'], '#2a2c30') : stones(X, Y, 7, 11, C.cobble, '#4e4b46');
      if (b === 7 && fbm(X * 0.05, Y * 0.05, 17) > 0.62) c = mix(c, hex('#2e4a52'), 0.5);   // 고인 물 얼룩
      if (fbm(X * 0.04, Y * 0.04, 14) > 0.58 && hash(X, Y, 15) < 0.6) c = mix(c, hex('#5f8a42'), 0.5);
      if (fbm(X * 0.03, Y * 0.03, 16) < 0.3) c = mul(c, 0.86);
      return c;
    }
    case TILES: {
      // 판석 — 줄마다 어긋나게 깐 네모 돌. 왕국은 빠진 돌 사이로 풀, 마계는 검보라
      const pal = b === 6 ? C.tilesDark : b === 8 ? C.tilesHall : C.tiles;
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
function tent(px, py, col) {
  add(py, () => {
    shadow(px + 4, py + 2, 16, 4);
    for (let j = 0; j < 16; j++) for (let i = -14 + j * 0.85; i <= 14 - j * 0.85; i++) put(px + i, py - j, i < 0 ? mix(hex(col), [255, 255, 255], 0.18) : mul(hex(col), 0.82));
    for (let j = 0; j < 9; j++) for (let i = -3 + j * 0.3; i <= 3 - j * 0.3; i++) put(px + i, py - j, hex('#2a1c14'));
    line(px, py - 16, px, py - 20, hex('#5a3a22'));
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

function lightShaft(px, py) {
  // 무너진 천장 구멍에서 떨어지는 빛 한 줄 — 바닥에 둥글게 고이고, 빛 속에 먼지가 떠 있음
  lightUp(px, py, 92, 1.15);
  for (let k = 1; k <= 5; k++) lightUp(px, py - k * 26, 34 - k * 3, 0.32 - k * 0.04);   // 위로 올라가며 흐려지는 빛기둥
  glow(px, py - 6, 46, [160, 180, 215], 0.32);
  add(py + 40, () => { for (let k = 0; k < 26; k++) put(px - 34 + hash(k, 1, 98) * 68, py - 40 + hash(k, 2, 98) * 70, [230, 240, 255], 0.55); });
}
function slab(px, py, w, h, tilt) {
  // 무너져 내린 천장 돌판
  add(py, () => {
    shadow(px + 3, py + 2, w * 0.6, 3);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(px - w / 2 + i + j * tilt, py - j, hex(j === h - 1 ? '#8a8e92' : i === 0 ? '#3a3d40' : '#5e6266'));
  });
}
function tallyStone(px, py) {
  // 벽에 기대 선 돌 — 긁어서 센 줄들 (다섯씩 묶음)
  add(py, () => {
    shadow(px + 4, py + 2, 14, 3);
    rect(px - 13, py - 22, 26, 22, hex('#4e5256')); rect(px - 13, py - 22, 26, 2, hex('#70757a')); rect(px + 11, py - 22, 2, 22, hex('#2a2c30'));
    for (let g = 0; g < 7; g++) {
      const gx = px - 11 + (g % 4) * 6, gy = py - 19 + Math.floor(g / 4) * 9;
      for (let k = 0; k < 4; k++) rect(gx + k, gy, 1, 6, hex('#b8bcc0'));
      if (g < 6) line(gx - 1, gy + 5, gx + 4, gy, hex('#b8bcc0'));
    }
  });
}
function deadLantern(px, py) {
  // 꺼진 등
  add(py, () => { shadow(px + 1, py + 1, 3, 1.5); rect(px, py - 14, 2, 14, hex('#2a221c')); rect(px - 2, py - 18, 6, 5, hex('#1e1814')); rect(px - 1, py - 17, 4, 3, hex('#3a4044')); put(px + 2, py - 17, hex('#6a7074')); });
}
function oddLantern(px, py) { lantern(px, py, '#a8ffd0'); }   // 켠 사람이 없는데 켜져 있는 등 — 차가운 빛
function bag(px, py) {
  add(py, () => { shadow(px + 2, py + 1, 6, 2); ellipse(px, py - 4, 6, 4.5, hex('#6a5038')); ellipse(px - 1, py - 6, 4, 2, hex('#86684a')); rect(px - 5, py - 8, 3, 3, hex('#4a3626')); line(px + 3, py - 7, px + 7, py - 2, hex('#4a3626')); });
}
function nametag(px, py) {
  // 녹슨 명찰 — 아주 작게 반짝
  add(py - 2, () => { rect(px - 3, py - 2, 6, 3, hex('#8a7a5a')); rect(px - 3, py - 2, 6, 1, hex('#b0a07a')); rect(px - 2, py - 1, 4, 1, hex('#4a3e2e')); put(px + 2, py - 2, [255, 250, 220]); glow(px + 2, py - 2, 5, [255, 240, 200], 0.5); });
}
function bones(px, py) {
  add(py, () => {
    for (const [dx, dy, l, a] of [[0, 0, 9, 0.3], [-5, 3, 7, -0.8], [6, 2, 6, 1.2], [-2, -3, 5, 2]]) for (let k = 0; k < l; k++) put(px + dx + Math.cos(a) * k, py + dy + Math.sin(a) * k, hex(k === 0 || k === l - 1 ? '#e8e2d0' : '#c8c0aa'));
    ellipse(px + 8, py - 3, 3.2, 2.8, hex('#d8d0bc')); put(px + 7, py - 3, hex('#2a2420')); put(px + 9, py - 3, hex('#2a2420'));
  });
}
function eyesInDark(px, py, col) {
  // 어둠 속에서 이쪽을 보는 눈 둘
  add(py + 60, () => { const c = hex(col); put(px, py, c); put(px + 1, py, c); put(px + 5, py, c); put(px + 6, py, c); glow(px + 3, py, 9, mul(c, 0.5)); });
}
function sealedDoor(px, py) {
  // 벽돌로 막아 버린 옛 문
  add(py, () => {
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.03) for (let r = 9; r <= 11; r++) put(px + Math.cos(a) * r, py - 14 + Math.sin(a) * r, hex('#3e3833'));
    rect(px - 11, py - 14, 2, 14, hex('#3e3833')); rect(px + 9, py - 14, 2, 14, hex('#3e3833'));
    for (let j = -24; j < 0; j++) for (let i = -9; i < 9; i++) {
      if (j < -14 && i * i + (j + 14) ** 2 > 81) continue;
      const row = Math.floor(j / 3);
      put(px + i, py + j, hex(((i + 20 + (row % 2) * 3) % 6 === 0 || j % 3 === 0) ? '#3e3833' : '#5e5750'));
    }
  });
}
function puddle(px, py, rx) { add(py - 300, () => { ellipse(px, py, rx, rx * 0.5, hex('#2e4a58')); ellipse(px - rx * 0.3, py - 1, rx * 0.4, rx * 0.15, hex('#5a8090')); }); }
function drip(px, py) { add(py, () => { put(px, py, hex('#9ad4e4')); put(px, py - 3, hex('#6ab4cc'), 0.6); }); }

function troll(px, py) {
  // 트롤 킹 — 흔들다리 앞을 막고 선 이끼 덮인 거구
  add(py, () => {
    shadow(px + 4, py + 2, 14, 4);
    const c = hex('#5e7050'), d = hex('#3e4c36'), l = hex('#7e9068');
    ellipse(px, py - 14, 11, 12, c); ellipse(px - 3, py - 17, 6, 6, l);
    ellipse(px, py - 30, 7, 6, c);
    rect(px - 16, py - 22, 6, 18, d); rect(px + 10, py - 22, 6, 18, d);
    rect(px - 7, py - 4, 5, 5, d); rect(px + 2, py - 4, 5, 5, d);
    put(px - 3, py - 31, hex('#ff6a3a')); put(px + 2, py - 31, hex('#ff6a3a'));
    glow(px, py - 31, 10, [255, 110, 60], 0.4);
    for (let k = 0; k < 10; k++) put(px - 9 + hash(k, 1, 101) * 18, py - 24 + hash(k, 2, 101) * 18, hex('#4a6a3a'));
  });
}
function logBridge(tx0, ty, len) {
  // 쓰러진 통나무 다리 — 절벽 사이에 걸친 이끼 낀 나무 한 그루
  const [x0, y0] = P(tx0, ty, 0, 4);
  add(y0 + 10, () => {
    for (let i = 0; i < len * T; i++) {
      for (let j = 0; j < 8; j++) put(x0 + i, y0 + j, hex(j === 0 ? '#8a6038' : j === 7 ? '#3e2814' : (i + j * 3) % 7 === 0 ? '#5e3e22' : '#7a5232'));
      if (hash(i, 1, 102) < 0.3) put(x0 + i, y0 - 1, hex('#4a7a3a'));
      darken(x0 + i, y0 + 9, 0.6); darken(x0 + i, y0 + 10, 0.75);
    }
  });
}
function vines(px, py, h) {
  // 늘어진 덩굴 — 샛길 입구를 가림
  add(py + 4, () => { for (let k = 0; k < 7; k++) { const x = px - 8 + k * 2.5; for (let j = 0; j < h - (k % 3) * 3; j++) put(x + Math.sin(j * 0.5 + k) * 0.8, py - h + j, hex(j % 4 === 0 ? '#5a8a44' : '#3e6a32')); } });
}

// ---------- 놓기 ----------
// 처음 — 무너진 천장 구멍 아래. 빛 한 줄, 떨어져 내린 돌판, 그리고 누군가 두고 간 것들
lightShaft(...P(50, 101)); keepClear(50, 101, 9);
rubble(...P(48, 99), 7, '#70757a'); rubble(...P(53, 103), 6, '#70757a');
slab(...P(45, 102, 8, 12), 22, 5, 0.2); slab(...P(55, 99, 4, 12), 18, 4, -0.25);
tallyStone(...P(44, 98, 8, 12));
deadLantern(...P(44, 104, 8, 12)); deadLantern(...P(58, 97, 8, 12));
bag(...P(56, 104, 4, 12)); nametag(...P(52, 104, 2, 8));
bones(...P(42, 103, 4, 10)); bones(...P(58, 102, 2, 10));
puddle(...P(47, 105, 8, 8), 9); puddle(...P(57, 101, 4, 4), 6);
for (const [x, y] of [[41, 100], [59, 100], [48, 95], [40, 105]]) fern(...P(x, y, 8, 12), '#3e5a52');
for (let k = 0; k < 14; k++) drip(...P(39 + hash(k, 1, 99) * 22 | 0, 95 + hash(k, 2, 99) * 12 | 0, 8, 8));
// 빛 밖 어둠 속 — 이쪽을 보는 눈들, 그리고 아주 멀리 작은 보랏빛 한 점
for (const [x, y, c] of [[37, 99, '#ffd84a'], [63, 103, '#ff7a4a'], [40, 94, '#ffd84a'], [62, 96, '#c8ff6a'], [36, 105, '#ff7a4a']]) eyesInDark(...P(x, y, 4, 8), c);
add(0, () => { const [x, y] = P(74, 104, 4, 8); put(x, y, hex('#b88aff')); put(x + 3, y, hex('#b88aff')); glow(x + 1.5, y, 6, [150, 100, 230], 0.35); });

// 1격 지하수로 — 끝난 도시 밑의 수로. 등은 거의 꺼졌고, 켜진 두엇은 차가운 빛 · 쇠창살 · 막아 버린 문 · 작은 다리
for (const [x, y] of [[36, 70], [63, 78], [36, 87], [50, 87], [63, 87], [36, 78], [50, 70]]) deadLantern(...P(x, y, 4, 12));
for (const [x, y] of [[53, 78], [63, 70]]) oddLantern(...P(x, y, 4, 12));
for (const [x, y] of [[33, 71], [54, 77], [66, 89], [38, 89], [48, 68]]) add(y * T + 10, () => { const [px, py] = P(x, y, 2, 4); rect(px, py, 12, 8, hex('#2a2a2e')); for (let i = 1; i < 12; i += 3) rect(px + i, py, 1, 8, hex('#5a5a60')); });
for (const x of [37, 50, 63]) for (const y of [74, 82]) bridge(x, y, 2, true);
for (const x of [43, 56]) for (const y of [70, 79, 87]) bridge(x, y, 2, false);
gate(50, 64);                                                                 // 던전 가디언의 수문 — 그 너머가 처음 보는 바깥
for (const [x, y] of [[36, 67], [64, 67]]) sealedDoor(...P(x, y, 8, 10));
for (const [x, y] of [[32, 88], [68, 68]]) crystal(...P(x, y, 8, 12), '#7ae0f0', 8);
statue(...P(47, 79, 8, 12), '#6e767c', '#7ae0f0');                            // 고블린 족장이 지키는 석상 (정예 자리)
// 미믹 — 수로 구석에 놓인, 너무 반짝이는 보물상자 (정예 자리)
add(89 * T + 12, () => { const [x, y] = P(67, 89, 8, 12); shadow(x + 2, y + 1, 7, 2); rect(x - 6, y - 8, 12, 8, hex('#8a5a32')); rect(x - 6, y - 11, 12, 4, hex('#a8784a')); rect(x - 6, y - 8, 12, 1, hex('#c8a040')); rect(x - 1, y - 9, 2, 3, hex('#f0d070')); glow(x, y - 6, 16, [255, 210, 110], 0.5); });
for (const [x, y] of [[33, 68], [66, 78], [46, 89]]) barrel(...P(x, y, 4 + (x % 3) * 3, 12));
for (const [x, y] of [[34, 68], [58, 88]]) crate(...P(x, y, 8, 12));
for (const [x, y] of [[32, 79], [69, 88], [60, 68]]) rubble(...P(x, y), 6, '#7a7770');
for (const [x, y, r] of [[39, 77, 7], [60, 89, 6], [64, 72, 5], [50, 80, 6]]) puddle(...P(x, y, 8, 8), r);
for (let k = 0; k < 40; k++) { const x = 31 + hash(k, 1, 79) * 39 | 0, y = 67 + hash(k, 2, 79) * 24 | 0; if (ter[idx(x, y)] === COBBLE && [CANAL, VOID].some(t => [T_(x - 1, y), T_(x + 1, y), T_(x, y - 1), T_(x, y + 1)].includes(t))) fern(...P(x, y, 2 + hash(k, 3, 79) * 12 | 0, 14)); }
for (let k = 0; k < 30; k++) drip(...P(31 + hash(k, 1, 100) * 39 | 0, 67 + hash(k, 2, 100) * 24 | 0, 8, 8));
// 벽 구멍에서 떨어지는 물(숲 시내가 흘러드는 배수구 포함), 수로 끝에서 어둠으로 쏟아지는 물
for (const x of [40, 54, 60]) spout(...P(x, 67, 8, 4), 8);
for (const [x, y] of [[30, 74], [70, 82]]) waterfall(...P(x, y + 2, 0, 14), 16, 30);

// 2격 숲 — 수문 너머 처음 보는 바깥. 빈터 아홉(구역) · 숲의 마녀 오두막 · 오크 장군의 야영지
// 북서쪽 낭떠러지의 흔들다리는 트롤 킹이 막고, 동쪽 끝 작은 폭포 · 덩굴 뒤로 4격으로 가는 통나무 다리가 숨어 있음
for (const [x, y] of [[45, 50], [56, 47], [44, 39], [53, 35], [61, 53]]) keepClear(x, y, 2.2);
for (let x = 63; x <= 69; x++) keepClear(x, 42, 0.9);                         // 샛길 — 나무 사이 한 칸 틈만
hut(60, 50); keepClear(60, 50, 4);
orcCamp(40, 46); keepClear(40, 46, 4.5);
bridge(43, 24, 7, true); keepClear(44, 31, 3);
troll(...P(43, 32, 16, 12));
waterfall(...P(69, 42, 0, 14), 12, 30);
vines(...P(68, 42, 8, 12), 22); vines(...P(66, 41, 4, 12), 16);
logBridge(70, 42, 5);
for (const [x, y, c] of [[64, 42, null], [66, 43, '#c890ff'], [65, 40, null]]) bush(x, y, 8, 12, x * y, c);      // 샛길 끝을 덮은 수풀
for (let k = 0; k < 60; k++) { const x = 34 + hash(k, 1, 70) * 36, y = 29 + hash(k, 2, 70) * 30; if (ter[idx(x | 0, y | 0)] === GRASS && bio[idx(x | 0, y | 0)] === 2) mushroom(...P(x | 0, y | 0, 4 + hash(k, 3, 70) * 8 | 0, 10), hash(k, 4, 70) < 0.5 ? '#7ad0ff' : '#c890ff'); }
for (let k = 0; k < 50; k++) { const x = 34 + hash(k, 5, 71) * 36, y = 29 + hash(k, 6, 71) * 30; if (bio[idx(x | 0, y | 0)] === 2) firefly(x * T, y * T); }

// 3격 무너진 왕국 — 막다른 곳. 흔들다리에서 옛 큰길을 따라 서쪽 끝, 버려진 성에서 왕이 조용히 기다림
for (const [x, y, w, h, s] of [[34, 15, 4, 3, 1], [27, 19, 4, 3, 2], [21, 8, 5, 3, 3], [36, 5, 4, 3, 4], [22, 17, 3, 3, 5]]) ruinBlock(x, y, w, h, s);
for (let k = 0; k < 6; k++) column(...P(21 + k * 4, k % 2 ? 14 : 19, 8, 12), hash(k, 0, 72) < 0.3);
for (const [x, y] of [[30, 14], [38, 21], [25, 12]]) rubble(...P(x, y), 6);
statue(...P(33, 11, 8, 12), '#c8c0a8', '#f0d070');                            // 옛 광장의 왕 석상
statue(...P(39, 9, 8, 12), '#b0b8c8', '#9fc5ff');                             // 그리핀 로드의 탑 자리
waterfall(...P(26, 6, 2, 12), 20, 26); crystal(...P(28, 6, 8, 6), '#ffd0ff', 8);
add(23 * T, () => { for (let k = 0; k < 5; k++) put(...P(23 + k * 0.7, 21, 4 + k * 2, 6), [210, 250, 255]); });
// 몰락한 왕의 성 — 두꺼운 성벽 · 모서리 탑 · 동쪽 성문(큰길이 들어옴) · 붉은 융단 · 왕좌. 안은 어둑하고, 왕좌에만 빛 한 줄
ruinWall(5, 5, 12, 26);
ruinWallV(5, 6, 15);
ruinWallV(17, 6, 7); ruinWallV(17, 17, 4);
for (const k of [0, 3, 8]) ruinWall(5 + k, 21, 3, 16);
for (const [x, y, r] of [[5, 5, 13], [17, 5, 13], [5, 21, 13], [17, 21, 13], [17, 13, 9], [17, 17, 9]]) tower(...P(x, y, 8, 12), r);
add(13 * T, () => { const [x, y] = P(8, 15, 0, 3); for (let i = 0; i < 9 * T; i++) for (let j = 0; j < 10; j++) put(x + i, y + j, hex(j === 0 || j === 9 ? '#c8a040' : (i + j) % 9 === 0 ? '#8a2028' : '#a02a30')); });
for (const [x, y] of [[8, 6], [14, 6]]) add(6 * T + 13, () => { const [px, py] = P(x, y, 6, 0); rect(px, py, 6, 14, hex('#a02a30')); rect(px, py + 14, 2, 2, hex('#a02a30')); rect(px + 4, py + 14, 2, 2, hex('#a02a30')); put(px + 2, py + 5, hex('#c8a040')); put(px + 3, py + 5, hex('#c8a040')); });
for (const [x, y] of [[13, 9], [7, 19], [14, 19]]) rubble(...P(x, y), 6);
throne(...P(9, 14, 8, 12));                                                   // 몰락한 왕
// 고요하고 어둑한 안 — 성문에서 왕좌까지 기둥이 두 줄로 늘어선 큰 방, 왕좌에만 위에서 빛 한 줄 (먼지가 떠 있음)
for (const x of [10, 12, 14, 16]) for (const y of [11, 18]) column(...P(x, y, 8, 12), x === 14 && y === 18);
lightUp(...P(9, 14, 8, 4), 40, 0.85); glow(...P(9, 14, 8, 0), 30, [200, 190, 160], 0.25);
add(15 * T, () => { const [x, y] = P(9, 13, 8, 0); for (let k = 0; k < 14; k++) put(x - 12 + hash(k, 1, 103) * 24, y - 10 + hash(k, 2, 103) * 30, [240, 232, 210], 0.6); });

// 4격 거인의 고개 — 전나무 · 큰 바위 · 거인 뼈 · 발자국 웅덩이 · 원소 거인 넷의 돌 고리 · 동쪽 쐐기돌 아치
// 남서쪽 바위턱에 앉은 외눈 거인 — 1격 북동쪽 끝에서 절벽 너머로 보임
for (const [x, y, r] of [[84, 39, 9], [99, 40, 8], [90, 55, 8], [105, 48, 7], [79, 46, 6]]) rock(...P(x, y, 8, 10), r, '#8e8878');
ribcage(...P(87, 53, 8, 12), 1.6); skull(...P(93, 52, 8, 12), 1.4);
for (const [x, y, s] of [[80, 41, 1], [83, 43, 1.1], [79, 45, 1]]) footprint(...P(x, y, 8, 8), s);
for (const [x, y, c] of [[100, 48, '#a8a49a'], [103, 50, '#7ad0ff'], [100, 52, '#ff7a3a'], [97, 50, '#e8f0ff']]) monolith(...P(x, y, 8, 12), c);   // 돌 · 서리 · 불 · 구름
keepClear(100, 50, 4);
keystoneArch(111, 44);
giantSilhouette(...P(82, 58, 8, 12)); keepClear(82, 58, 3);
stairs(90, 40, 2);                                                            // 눈 덮인 봉우리로 오르는 돌계단
for (let k = 0; k < 18; k++) { const x = 75 + hash(k, 1, 73) * 34, y = 32 + hash(k, 2, 73) * 28; if (ter[idx(x | 0, y | 0)] === SNOW) crystal(...P(x | 0, y | 0, 8, 12), '#c8f0ff', 7); }

// 5격 시체가 걷는 도시 — 쇠울타리로 두른 묘지 구획(묘비가 줄지어) · 영묘 · 본 드래곤 · 네 말의 기사 석상 · 까마귀
// 남쪽 끝 대성당 밑 묘실 계단은 불사의 왕이 막음 — 그 아래가 6격
for (const [x0, y0, w, h] of [[115, 33, 7, 4], [134, 28, 8, 4], [116, 41, 6, 3], [136, 40, 7, 4]]) {
  fence(...P(x0, y0, 0, 4), w * 2 + 3); fence(...P(x0, y0 + h, 0, 14), w * 2 + 3);
  for (let y = y0 + 1; y < y0 + h; y += 1.5) for (let x = x0 + 0.5; x < x0 + w; x += 1.2) {
    if (hash(x * 10, y * 10, 73) < 0.15) continue;                          // 빈 자리 몇 군데 — 파헤쳐진 무덤
    tomb(x * T, y * T + 10, hash(x * 7, y * 3, 74) < 0.25 ? 'cross' : 'stone');
    if (hash(x * 3, y * 7, 75) < 0.12) candle(x * T + 6, y * T + 10);
  }
}
for (const [x, y] of [[121, 47], [141, 47], [124, 25]]) coffin(...P(x, y, 8, 12));
for (const [x, y] of [[121, 27], [142, 35], [118, 49]]) mausoleum(x, y);
skull(...P(139, 50, 8, 12), 1.5); ribcage(...P(134, 49, 8, 12), 1.3, '#d8d2c2');
for (const [x, y, c] of [[123, 29, '#f0ece0'], [129, 29, '#b0302a'], [123, 32, '#2a2830'], [129, 32, '#a8c0a0']]) horse(...P(x, y, 8, 12), c);
keepClear(126, 30, 4);
for (let k = 0; k < 14; k++) crow(...P(114 + hash(k, 1, 75) * 32 | 0, 23 + hash(k, 2, 75) * 30 | 0, 8, 4));
add(51 * T, () => { const [x, y] = P(130, 51, 8, 14); shadow(x + 6, y + 3, 30, 6); rect(x - 24, y - 40, 48, 40, hex('#4e4c58')); for (let j = 0; j < 22; j++) for (let i = -10 + j * 0.45; i <= 10 - j * 0.45; i++) put(x + i, y - 40 - j, hex('#3a3844')); rect(x - 7, y - 24, 14, 24, hex('#120e18')); for (const sx of [-18, 12]) { rect(x + sx, y - 32, 6, 10, hex('#6a5ac8')); glow(x + sx + 3, y - 27, 20, [120, 100, 240], 0.6); } glow(x, y - 12, 30, [100, 220, 160], 0.5); });
stairs(128, 56, 5);                                                           // 묘실로 내려가는 계단
add(26 * T, () => { const [px, py] = P(143, 26, 8, 12); rect(px - 8, py - 10, 16, 10, hex('#2a2830')); rect(px - 5, py - 8, 10, 8, hex('#0a0810')); glow(px, py - 4, 14, [180, 120, 255], 0.35); });   // 까마귀 왕이 숨은 지하 묘실 (숨은 입구)

// 6격 마계의 왕좌 — 칠죄종 일곱 받침 · 세계수를 먹는 벌레 · 마왕의 왕좌 · 뒤의 눈(관측자) · 문의 광장 문
keepClear(144, 82, 12); keepClear(165, 82, 7);
const sins = [['#c8a040', 137, 78], ['#6ac040', 143, 78], ['#e070b0', 149, 78], ['#8a5a30', 137, 87], ['#a070ff', 143, 87], ['#ff4a2a', 149, 87], ['#40c0c0', 152, 82]];   // 탐욕 질투 색욕 폭식 오만 분노 나태
for (const [c, x, y] of sins) pedestal(...P(x, y, 8, 12), c);
for (const [x, y] of [[134, 76], [154, 76], [134, 89], [154, 89]]) column(...P(x, y, 8, 12));
worm(157 * T - 4, 82 * T + 6);
throne(...P(166, 82, 8, 12));
eye(...P(172, 82, 4, 8));
portal(...P(167, 90, 0, 12));
for (const [x, y] of [[162, 76], [168, 76], [162, 88]]) pedestal(...P(x, y, 8, 12), '#ff3a2a');
for (let k = 0; k < 30; k++) { const x = 122 + hash(k, 1, 76) * 48, y = 68 + hash(k, 2, 76) * 34; if (ter[idx(x | 0, y | 0)] === OBSID && openDist[idx(x | 0, y | 0)] > 1) crystal(...P(x | 0, y | 0, 8, 12), '#c050ff', 10); }
for (let k = 0; k < 60; k++) { const x = 122 + hash(k, 3, 76) * 48 | 0, y = 68 + hash(k, 4, 76) * 34 | 0; if (ter[idx(x, y)] === OBSID && openDist[idx(x, y)] > 0.5 && !isReserved(x, y)) spike(...P(x, y, 2 + hash(k, 5, 76) * 12 | 0, 12), 8 + hash(k, 6, 76) * 10 | 0); }
for (const [x, y] of [[127, 80], [130, 96], [154, 96], [146, 71]]) vent(...P(x, y, 8, 10));

// ---------- 나무 · 덤불 · 바위를 땅마다 흩뿌림 ----------
for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
  const i = idx(tx, ty), t = ter[i], b = bio[i];
  if (isReserved(tx, ty) || openDist[i] < 1.5 || voidNear(tx, ty, 1)) continue;
  const r = hash(tx, ty, 80);
  const grove = fbm(tx * 0.16, ty * 0.16, 83);            // 숲덩이 — 높은 곳은 빽빽, 낮은 곳은 빈터
  if (t === GRASS && b === 2) {
    if (r < 0.3 + grove * 0.5) tree(tx, ty, hash(tx, ty, 81) < 0.3 ? 'big' : 'mossy', tx * 31 + ty);   // 빽빽한 숲 — 길가 · 빈터만 트임
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
const AMB = [[1, 1, 1], [0.6, 0.66, 0.8], [0.9, 0.98, 0.9], [1.02, 0.98, 0.9], [0.95, 0.96, 1.02], [0.66, 0.68, 0.82], [0.62, 0.5, 0.58], [0.34, 0.38, 0.5], [0.46, 0.45, 0.5]];
const out = new Uint8Array(PW * PH * 4);
for (let Y = 0; Y < PH; Y++) for (let X = 0; X < PW; X++) {
  const tx = Math.min(W - 1, Math.max(0, Math.floor((X + (vnoise(X * 0.01, Y * 0.01, 90) - 0.5) * 120) / T)));
  const ty = Math.min(H - 1, Math.max(0, Math.floor((Y + (vnoise(X * 0.01, Y * 0.01, 93) - 0.5) * 120) / T)));
  const b = ter[idx(tx, ty)] === VOID ? 0 : bio[idx(tx, ty)];
  const L = lightBuf[Y * PW + X], A = AMB[b];
  const a = emis[Y * PW + X] ? [1, 1, 1] : [A[0] + L, A[1] + L, A[2] + L * 1.05];   // 비추는 빛은 그 자리의 어둠을 걷어 냄
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
  ['camp', '처음 · 1격 초심자의 지하수로', 26, 58, 76, 110],
  ['forest', '2격 이끼 낀 숲길', 30, 24, 78, 62],
  ['ruins', '3격 무너진 왕국', 0, 0, 50, 32],
  ['giants', '4격 거인의 고개', 70, 28, 118, 64],
  ['necro', '5격 시체가 걷는 도시', 110, 18, 150, 70],
  ['abyss', '6격 마계의 왕좌', 118, 62, 176, 106]
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
