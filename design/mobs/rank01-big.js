// 1격 큰 몬스터 — 5단계 입체 명암 + 손 세부, 눈 작게, 어둑한 색
const { Sprite, pair, mRect, mEll, mLine, mPoly, mRows } = require('./lib2.js');
const K = '#35263f';
const out = {};
const at = (b, list) => list.map(([x, y]) => [x, y + b]);

// ---------- 고블린 족장 (2칸 · 32) ----------
function chief(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32)
    .mat('g', '#5a9030').mat('b', '#6e4430').mat('w', '#74503a').mat('o', '#c8bea4', { step: 0.12, shift: 6 }).mat('i', '#8a8ea0')
    .color('eye', '#c8302a').color('tooth', '#d8d0b8');
  if (!f) {
    S.part('g', m => { mRect(m, 10, 24, 4, 5); mRect(m, 9, 28, 5, 2); });
    S.part('g', m => { mRect(m, 18, 24, 4, 5); mRect(m, 18, 28, 5, 2); });
  } else {
    S.part('g', m => { mRect(m, 11, 24, 4, 4); mRect(m, 10, 27, 5, 2); });
    S.part('g', m => { mRect(m, 17, 24, 4, 5); mRect(m, 17, 28, 5, 2); });
  }
  S.part('g', m => mEll(m, 15.5, 18 + b, 8.5, 6.8));
  S.part('b', m => mPoly(m, [[8, 21 + b], [23, 21 + b], [22, 27], [19, 25], [15, 28], [12, 25], [9, 27]]), { round: 2 });
  S.part('g', m => { mRect(m, 4, 16 + b, 4, 7); mEll(m, 6, 23.5 + b, 2.6, 2.3); });
  S.part('g', m => { mLine(m, 22, 15 + b, 25, 19 + b, 3); mEll(m, 25.5, 19.5 + b, 2.4, 2.2); });
  S.part('g', m => mPoly(m, [[9, 6 + b], [0, 2 + b], [2, 9 + b], [9, 12 + b]]), { round: 2 });
  S.part('g', m => mPoly(m, [[21, 6 + b], [26, 4 + b], [25, 9 + b], [21, 12 + b]]), { round: 2 });
  S.part('g', m => mEll(m, 15.5, 9 + b, 7.5, 6.6));
  S.part('o', m => mEll(m, 7.5, 15 + b, 4.5, 3.3));
  S.part('w', m => mLine(m, 26, 20 + b, 27, 11 + b, 2), { line: 'K' });
  S.part('w', m => mEll(m, 27.5, 7 + b, 4, 5.2), { round: 3, line: 'K' });
  S.part('g', m => mEll(m, 25.5, 19.5 + b, 2.4, 2.2), { line: 'K' });
  // 근육
  S.tone(at(b, [[11, 18], [12, 18], [13, 19], [14, 19], [17, 19], [18, 19], [19, 18], [20, 18], [15, 20], [16, 20], [15, 22], [16, 22], [5, 19], [5, 20], [23, 16]]), 1);
  S.tone(at(b, [[13, 21], [18, 21]]), 2);
  S.tone(at(b, [[12, 16], [13, 16], [17, 16]]), 4);
  // 얼굴 — 눈두덩 · 작은 눈 · 코 · 입 · 엄니
  S.tone(at(b, [[11, 7], [12, 7], [13, 7], [14, 7], [17, 7], [18, 7], [19, 7], [20, 7]]), 3);
  S.tone(at(b, [[12, 8], [13, 8], [14, 8], [17, 8], [18, 8], [19, 8], [12, 9], [14, 9], [17, 9], [19, 9]]), 0);
  S.pts(at(b, [[13, 9], [18, 9]]), 'eye');
  S.tone(at(b, [[16, 10], [16, 11]]), 1);
  S.tone(at(b, [[15, 10]]), 3);
  for (let x = 12; x <= 20; x++) S.px(x, 13 + b, 'K');
  S.tone(at(b, [[13, 14], [14, 14], [15, 14], [16, 14], [17, 14], [18, 14], [19, 14], [12, 11], [13, 11], [18, 11], [19, 11]]), 1);
  S.pts(at(b, [[12, 12], [20, 12], [12, 11], [20, 11]]), 'tooth');
  // 뼈 어깨 · 누더기 · 몽둥이 쇠징
  S.pts(at(b, [[6, 15], [8, 15]]), 'K'); S.tone(at(b, [[7, 16]]), 0); S.tone(at(b, [[7, 17], [8, 17]]), 1);
  S.tone([[11, 23 + b], [11, 24 + b], [16, 23 + b], [16, 24 + b], [16, 25], [20, 23 + b], [20, 24 + b]], 1);
  for (const [x, y] of [[25, 4], [28, 3], [29, 7], [26, 8], [28, 10]]) { S.px(x, y + b, 'i3'); S.px(x + 1, y + 1 + b, 'i1'); }
  S.tone(at(b, [[26, 3], [27, 3], [25, 5]]), 4);
  return S.outline();
}
out.goblinchief = pair(chief(0), chief(1), K, { view: '대각선' });

// ---------- 자이언트 스파이더 (2칸 · 32) ----------
function spider(f) {
  const b = f ? 1 : 0, S = new Sprite(32).mat('s', '#4a3a58').mat('l', '#3e3248').mat('r', '#8a2a36').mat('f', '#c8c0a8')
    .color('eye', '#d83a32');
  const hip = [19, 19 + b];
  const legs = [[[11, 8], [4, 15]], [[8, 12], [2, 22]], [[10, 18], [4, 28]], [[14, 21], [10, 30]], [[25, 9], [29, 15]], [[27, 13], [30, 22]], [[26, 19], [29, 28]], [[22, 23], [23, 30]]];
  legs.forEach(([k, ft], i) => {
    const up = (i % 2 === 0) === !!f ? -1 : 0;
    const far = i === 3 || i === 7;   // 몸 뒤쪽 다리는 더 어둡게
    S.part('l', m => { mLine(m, hip[0], hip[1], k[0], k[1] + up, 2); }, { line: 'K', fixed: far ? 1 : 2 });
    S.part('l', m => { mLine(m, k[0], k[1] + up, ft[0], ft[1] + up, 1); }, { line: false, fixed: far ? 0 : 1 });
    S.px(k[0], k[1] + up - 1, 'l3'); S.px(k[0], k[1] + up, 'l4');
  });
  S.part('s', m => mEll(m, 12, 12 + b, 9, 7.5));
  S.part('s', m => mEll(m, 20.5, 19.5 + b, 6, 5));
  // 배 — 털 결 · 붉은 모래시계
  S.tone(at(b, [[6, 9], [8, 7], [15, 7], [17, 10], [5, 13], [8, 16], [15, 16], [18, 13], [10, 18], [13, 6]]), 1);
  S.tone(at(b, [[7, 8], [9, 6], [6, 11], [10, 7]]), 4);
  S.part('r', m => mRows(m, 10, 9 + b, ['####', '.##.', '.##.', '####']), { line: false, round: 1 });
  // 작은 눈 무리 · 송곳니
  S.pts(at(b, [[21, 17], [23, 17], [22, 18], [24, 18]]), 'eye');
  S.tone(at(b, [[20, 18], [25, 18], [21, 19], [24, 19]]), 0);
  S.part('f', m => mRows(m, 20, 23 + b, ['#..#', '#..#']), { line: false, round: 1 });
  return S.outline();
}
out.cavespider = pair(spider(0), spider(1), K, { view: '대각선' });

// ---------- 미믹 (2칸 · 32) ----------
function mimic(f) {
  const b = f ? -1 : 0, lid = f ? 2 : 0;
  const S = new Sprite(32).mat('w', '#7a4c30').mat('y', '#b88a34').mat('t', '#d0c8b0').mat('p', '#a84058')
    .color('mouth', '#2e0e1e').color('eye', '#d8b838');
  S.part('w', m => mPoly(m, [[25, 17 + b], [29, 15 + b], [29, 26 + b], [25, 29 + b]]), { bias: -1, round: 2 });   // 옆면
  S.part('w', m => mPoly(m, [[8, 10 + lid + b], [27, 11 + lid + b], [28, 4 + lid + b], [10, 2 + lid + b]]), { round: 2 });   // 뚜껑
  S.part('w', m => mRect(m, 5, 17 + b, 20, 12), { round: 3 });   // 앞면
  // 입 안
  const mouth = [];
  { const mm = Array.from({ length: 32 }, () => Array(32).fill(false)); mPoly(mm, [[6, 17 + b], [25, 17 + b], [27, 10 + lid + b], [9, 10 + lid + b]]); mm.forEach((r, y) => r.forEach((v, x) => { if (v) mouth.push([x, y]); })); }
  S.pts(mouth, 'mouth');
  // 판자 결 · 금테 · 자물쇠
  for (let x = 6; x <= 23; x++) { S.px(x, 22 + b, 'w1'); if (x % 5 === 0) S.px(x, 25 + b, 'w1'); }
  for (let x = 5; x <= 24; x++) { S.px(x, 17 + b, x < 12 ? 'y3' : 'y2'); S.px(x, 28 + b, 'y0'); }
  for (let y = 17; y <= 28; y++) { S.px(5, y + b, 'y3'); S.px(24, y + b, 'y1'); S.px(14, y + b, 'y2'); S.px(15, y + b, 'y1'); }
  S.part('y', m => mRect(m, 13, 20 + b, 4, 4), { line: 'K', round: 2 });
  S.pts(at(b, [[14, 21], [14, 22]]), 'K');
  for (let x = 10; x <= 27; x++) S.px(x, 10 + lid + b + Math.round((x - 9) / 18), x < 16 ? 'y3' : 'y2');
  // 이빨
  for (let x = 7; x <= 24; x += 3) { S.px(x, 16 + b, 't3'); S.px(x + 1, 16 + b, 't1'); S.px(x, 15 + b, 't2'); }
  for (let x = 10; x <= 26; x += 3) { const y = 11 + lid + b + Math.round((x - 9) / 18); S.px(x, y, 't3'); S.px(x + 1, y, 't1'); S.px(x, y + 1, 't2'); }
  // 혀 · 안쪽의 작은 눈
  S.part('p', m => { mEll(m, 17, 18 + b, 3, 2.2); mRect(m, 16, 18 + b, 3, 6); }, { round: 2 });
  S.tone(at(b, [[17, 19], [17, 20], [17, 21]]), 1);
  S.pts([[12, 13 + lid + b], [21, 13 + lid + b]], 'eye');
  return S.outline();
}
out.mimic = pair(mimic(0), mimic(1), K, { view: '대각선' });

// ---------- 던전 가디언 (보스 · 3칸 · 48) ----------
function guardian(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(48).mat('i', '#6c768c').mat('s', '#a8b0bc', { step: 0.12 }).mat('y', '#b0843a').mat('x', '#8a4a30').mat('d', '#4a3a30')
    .color('glow', f ? '#a8f0ff' : '#48c8e0');
  S.part('i', m => { mRect(m, 14, 35, 7, 8); mRect(m, 12, 42, 10, 4); });
  S.part('i', m => { mRect(m, 27, 35, 7, 8); mRect(m, 26, 42, 10, 4); });
  S.part('s', m => { mRect(m, 22, 31 + b, 5, 15 - b); mRect(m, 23, 46, 3, 1); }, { round: 2 });
  S.part('i', m => mPoly(m, [[13, 15 + b], [35, 15 + b], [33, 29 + b], [15, 29 + b]]));
  S.part('i', m => mPoly(m, [[14, 28 + b], [34, 28 + b], [36, 36], [12, 36]]), { round: 3 });
  S.part('i', m => { mLine(m, 10, 20 + b, 13, 30 + b, 5); mLine(m, 13, 30 + b, 20, 27 + b, 4); });
  S.part('i', m => { mLine(m, 38, 20 + b, 35, 30 + b, 5); mLine(m, 35, 30 + b, 28, 27 + b, 4); }, { bias: -1 });
  S.part('i', m => mEll(m, 11, 17 + b, 6.5, 4.5));
  S.part('i', m => mEll(m, 37, 17 + b, 6.5, 4.5), { bias: -1 });
  S.part('y', m => mRect(m, 16, 29 + b, 17, 2), { round: 1 });
  S.part('d', m => mRect(m, 23, 22 + b, 3, 7), { round: 1 });
  S.part('y', m => mEll(m, 24.5, 21 + b, 2.2, 1.8), { round: 1 });
  S.part('i', m => { mRect(m, 18, 24 + b, 6, 5); }, { round: 2 });
  S.part('i', m => { mRect(m, 25, 24 + b, 6, 5); }, { round: 2, bias: -1 });
  S.part('i', m => { mEll(m, 24, 8.5 + b, 7, 7.5); mRect(m, 18, 11 + b, 13, 4); });
  S.part('x', m => mRect(m, 22, 0 + b, 4, 2), { round: 1 });
  // 눈 틈 · 빛 (작게) · 숨구멍
  for (let x = 19; x <= 30; x++) S.px(x, 9 + b, 'K');
  S.pts(at(b, [[23, 9], [28, 9]]), 'glow');
  for (const x of [24, 26, 28]) for (const y of [12, 13]) S.px(x, y + b, 'i0');
  // 리벳 · 반짝임 · 판 이음 · 손가락 마디
  S.tone(at(b, [[8, 15], [9, 14], [10, 14], [20, 4], [21, 3], [15, 17], [16, 17]]), 4);
  S.tone(at(b, [[34, 15], [35, 14]]), 3);
  for (let y = 16; y <= 23; y++) S.px(24, y + b, 'i0');
  for (let x = 15; x <= 33; x++) S.px(x, 21 + b, (x + y0()) % 2 ? 'i1' : 'i2');
  function y0() { return 0; }
  for (const [x, y] of [[16, 17], [32, 17], [16, 27], [32, 27], [13, 33], [35, 33], [8, 18], [40, 18]]) { S.px(x, y + b, 'i4'); S.px(x + 1, y + 1 + b, 'i0'); }
  for (const x of [19, 21, 26, 28]) S.px(x, 26 + b, 'i0');
  // 녹 · 패인 자국
  for (const [x, y] of [[17, 19], [18, 19], [18, 20], [30, 24], [31, 24], [31, 25], [9, 19], [10, 20], [15, 32], [16, 33], [30, 33], [16, 39], [17, 40], [30, 40], [21, 6], [27, 12], [36, 19], [37, 20]]) S.px(x, y + (y < 35 ? b : 0), (x + y) % 3 ? 'x2' : 'x1');
  S.tone([[13, 24 + b], [14, 25 + b], [33, 24 + b], [20, 38], [29, 37]], 0);
  // 열쇠
  S.part('y', m => { mRect(m, 33, 31 + b, 2, 2); mRect(m, 34, 33 + b, 1, 3); }, { line: 'K', round: 1 });
  return S.outline();
}
out.dungeonguardian = pair(guardian(0), guardian(1), K, { view: '대각선' });
module.exports = out;
