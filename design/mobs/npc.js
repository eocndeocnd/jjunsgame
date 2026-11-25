// 지도 위 사람 도트 (몬스터가 아닌 것) — 지금은 떠돌이 상인 하나 (사용자 결정 2026-11-25, 1~6격 픽셀 점검에서 이모지 🎒 를 바꿈).
// 24 × 24 점 (주인공처럼 한 칸 반 키), 오른쪽을 봄. 부위마다 칠한 뒤 바깥에 1점 테두리를 두름. A · B — 지팡이 끝 등불이 흔들리고 불빛이 깜빡임
'use strict';
const N = 24;
const pal = {
  K: '#35263f',
  a: '#2a2b26', b: '#3c3f33', c: '#535843', d: '#6b7253', e: '#868c66',     // 두건 · 망토 (어둑한 올리브)
  s: '#8c6a52', S: '#b08868',                                                // 얼굴 · 손
  l: '#3e2a1e', m: '#5a3e28', n: '#78563a', o: '#96704a',                    // 짐 가죽
  r: '#5a2a2e', R: '#7e3c3e',                                                // 말아 묶은 담요
  p: '#6a3e22', P: '#9a6232',                                                // 구리 냄비 · 버클
  w: '#4a3524', W: '#6a4c32',                                                // 지팡이
  i: '#2a2930', y: '#e8b850', Y: '#fff0a0',                                  // 등불 (쇠 틀 · 불빛)
  k: '#2a1f1a'                                                               // 신 · 바지
};
function frame(swing) {
  const g = [...Array(N)].map(() => Array(N).fill('.'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
  const rect = (x0, y0, x1, y1, f) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, typeof f === 'function' ? f(x, y) : f); };
  // 짐 — 등에 진 큰 가죽 짐 (왼쪽이 볕, 오른쪽 그늘) · 가운데 끈 · 놋 버클
  rect(3, 7, 10, 18, (x, y) => (y === 12 ? 'l' : x <= 4 ? 'o' : x >= 9 ? 'l' : (y - 7) % 4 === 0 && x === 6 ? 'm' : 'n'));
  put(7, 12, 'P'); put(6, 12, 'P');
  rect(4, 15, 8, 16, (x, y) => (y === 15 ? 'm' : 'l'));                            // 아래 주머니
  // 위에 말아 묶은 담요 — 양 끝은 감긴 소용돌이
  rect(2, 3, 11, 6, (x, y) => (x === 2 || x === 11 ? (y === 4 || y === 5 ? 'r' : 'R') : y === 3 ? 'R' : y === 6 ? 'r' : x % 3 === 1 ? 'r' : 'R'));
  rect(5, 3, 5, 6, 'p');                                                          // 묶은 끈
  // 옆에 매단 구리 냄비
  for (let y = 13; y <= 17; y++) for (let x = 0; x <= 3; x++) if (Math.hypot(x - 1.5, y - 15.2) < 2.3) put(x, y, x + y < 15 ? 'P' : 'p');
  put(1, 12, 'i'); put(2, 12, 'i');
  // 망토 몸 — 아래로 조금 넓어짐 (앞 가장자리 밝게, 뒤쪽 그늘)
  for (let y = 11; y <= 20; y++) { const x0 = 10 - (y > 16 ? 1 : 0), x1 = 16 + (y > 15 ? 1 : 0); for (let x = x0; x <= x1; x++) put(x, y, x === x0 ? 'b' : x === 12 ? 'd' : x >= x1 - 1 ? 'b' : 'c'); }
  rect(15, 16, 16, 17, (x, y) => (y === 16 ? 'o' : 'n'));                          // 허리 주머니
  // 두건 · 얼굴 (오른쪽을 봄 — 얼굴 구멍은 오른쪽, 끝이 뒤로 처진 고깔)
  for (let y = 4; y <= 11; y++) for (let x = 10; x <= 16; x++) { const inHood = (x - 13) ** 2 / 12 + (y - 8) ** 2 / 14 < 1; if (inHood) put(x, y, x <= 11 ? 'b' : y <= 5 ? 'e' : x <= 12 ? 'd' : 'c'); }
  put(10, 3, 'c'); put(9, 4, 'b'); put(9, 5, 'b');                               // 처진 고깔 끝
  rect(13, 7, 16, 10, (x, y) => (x === 16 && y === 9 ? 'S' : x === 13 ? 's' : 'S'));   // 얼굴
  put(15, 8, 'K');                                                               // 눈 (한 점)
  put(17, 9, 'S');                                                               // 코
  rect(13, 10, 15, 10, 's');                                                     // 턱 그늘
  // 앞으로 뻗은 팔 — 지팡이를 쥔 손
  rect(15, 12, 17, 13, (x, y) => (y === 12 ? 'd' : 'c'));
  put(18, 13, 'S'); put(18, 14, 's');
  // 지팡이
  for (let y = 4; y <= 22; y++) put(19, y, y < 10 ? 'W' : 'w');
  put(19, 3, 'W'); put(20, 4, 'w');                                              // 끝 — 갈고리
  // 등불 — 갈고리에 매달려 흔들림 (B 는 한 점 오른쪽, 불빛 깜빡)
  const lx = 20 + swing;
  put(lx + 1, 5, 'i');
  rect(lx, 6, lx + 2, 10, (x, y) => (y === 6 || y === 10 || x === lx || x === lx + 2 ? 'i' : swing ? 'y' : (y === 8 ? 'Y' : 'y')));
  // 다리 · 신
  rect(11, 21, 12, 22, (x, y) => (y === 22 ? 'k' : 'a'));
  rect(14, 21, 15, 22, (x, y) => (y === 22 ? 'k' : 'a'));
  put(16, 22, 'k'); put(13, 22, 'k');
  // 바깥 테두리 — 칠한 칸에 맞닿은 빈 칸을 1점 테두리로 (등불 빛은 테두리 없이 쇠 틀이 감쌈)
  const filled = (x, y) => x >= 0 && y >= 0 && x < N && y < N && g[y][x] !== '.' && g[y][x] !== 'K';
  const out = g.map(r => r.slice());
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (g[y][x] === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) out[y][x] = 'K';
  return out.map(r => r.join(''));
}
// 상인 앞(지도 아래쪽 한 줄, 가로 세 칸)에 펼쳐 둔 팔 물건 — 48 × 48 격자의 아래 16줄만 칠함 (지도가 상인 칸 바로 아래에 붙여, 상인보다 나중에 그림 · 막지 않음).
// 금 테 검붉은 깔개(양 끝 술) 위에 물약 셋(빨강 · 파랑 · 초록) · 두루마리 둘 · 금 자루 칼 · 작은 상자 · 둥근 방패 · 동전 자루 · 흩어진 동전. B 는 물약 반짝임이 옮겨 감 (사용자 결정 2026-11-25 — 뒤보다 앞)
const WPAL = { ...pal, g: '#a88232', G: '#d8b456', t: '#2e1218', T: '#4a1c26', u: '#62283a',
  1: '#8a2030', 2: '#c84050', 3: '#22407a', 4: '#4a74c0', 5: '#2a6a3a', 6: '#4aa060', 7: '#e8f0ff',
  q: '#8e8674', Q: '#b4ab94', v: '#5a5a66', V: '#9a9aa8', j: '#3a2a1a', J: '#5a4028', h: '#6e5a2a' };
function wares(glint) {
  const N2 = 48, g = [...Array(N2)].map(() => Array(N2).fill('.'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < N2 && y < N2) g[y][x] = c; };
  const rect = (x0, y0, x1, y1, f) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, typeof f === 'function' ? f(x, y) : f); };
  // 깔개 — 상인 발밑 바로 아래에 편 검붉은 천, 금 테, 양 끝 술. 물건은 낮게 (상인 발을 가리지 않게)
  rect(3, 33, 44, 46, (x, y) => (y === 34 || y === 45 || x === 4 || x === 43 ? 'g' : ((x * 7 + y * 3) % 13 === 0 ? 'u' : y < 39 ? 'T' : 't')));
  for (const y of [35, 38, 41, 44, 46]) { put(2, y, 'g'); put(45, y, 'g'); }
  // 왼쪽 — 물약 셋 (뒤 둘 · 앞 하나, 둥근 병 · 목 · 코르크 · 반짝임)
  for (const [cx, cy, c1, c2] of [[8, 38.5, '1', '2'], [13, 38.5, '3', '4'], [10, 42.5, '5', '6']]) {
    for (let y = Math.floor(cy) - 2; y <= Math.ceil(cy) + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) if (Math.hypot(x - cx, y - cy) < 2.4) put(x, y, x < cx ? c2 : c1);
    put(cx, Math.floor(cy) - 3, 'm'); put(cx, Math.floor(cy) - 2, 'Q');
    put(cx - 1 + (glint && cx === 13 ? 1 : 0), Math.floor(cy) - 1 + (glint && cx === 8 ? 1 : 0), '7');
  }
  // 가운데 — 두루마리 둘 (붉은 끈 · 파란 끈) · 가로로 눕힌 금 자루 칼
  rect(18, 37, 24, 38, (x, y) => (x === 21 ? '1' : y === 37 ? 'Q' : 'q'));
  rect(21, 40, 27, 41, (x, y) => (x === 24 ? '3' : y === 40 ? 'Q' : 'q'));
  for (let x = 16; x <= 31; x++) put(x, 43, x < 19 ? 'h' : x === 19 ? 'G' : 'V');
  put(19, 42, 'G'); put(19, 44, 'G'); put(31, 43, 'v');
  // 오른쪽 — 작은 나무 상자 · 둥근 방패(눕힘) · 동전 자루 · 흩어진 동전
  rect(29, 35, 34, 39, (x, y) => (x === 29 || x === 34 || y === 35 ? 'J' : y === 37 ? 'j' : 'J'));
  for (let y = 35; y <= 42; y++) for (let x = 35; x <= 43; x++) { const d = Math.hypot((x - 39) / 4, (y - 38.5) / 3.4); if (d < 1) put(x, y, d > 0.8 ? 'V' : d < 0.28 ? 'G' : x < 39 ? 'n' : 'm'); }
  for (let y = 41; y <= 45; y++) for (let x = 33; x <= 39; x++) if (Math.hypot((x - 36) / 3, (y - 43) / 2.2) < 1) put(x, y, x < 36 ? 'o' : 'n');
  put(36, 40, 'l'); put(35, 41, 'G');
  for (const [x, y] of [[28, 44], [40, 44], [15, 40], [30, 41]]) put(x, y, 'G');
  // 바깥 테두리 — 칠한 칸에 맞닿은 빈 칸
  const filled = (x, y) => x >= 0 && y >= 0 && x < N2 && y < N2 && g[y][x] !== '.' && g[y][x] !== 'K';
  const out = g.map(r => r.slice());
  for (let y = 0; y < N2; y++) for (let x = 0; x < N2; x++) if (g[y][x] === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) out[y][x] = 'K';
  return out.map(r => r.join(''));
}
module.exports = { merchant: { pal, a: frame(0), b: frame(1) }, merchantwares: { pal: WPAL, a: wares(0), b: wares(1) } };
