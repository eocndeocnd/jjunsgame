// 3격 2칸 몬스터 (32) — 5단계 입체 명암 + 손 세부, 눈 작게(1점), 어둑한 색. 앞 부위가 뒤 부위에 그림자를 드리움 (lib2 의 part)
const { Sprite, pair, mRect, mEll, mLine, mPoly, mTube, noise } = require('./lib2.js');
const K = '#35263f';
const out = {};
const at = (b, list) => list.map(([x, y]) => [x, y + b]);

// ---------- 미노타우로스 (2칸) — 대각선, 소 머리 · 휜 뿔 · 굵은 몸 · 양날 도끼 ----------
function minotaur(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('f', '#6a4630').mat('d', '#4a3226').mat('h', '#c8bca0', { step: 0.12, shift: 6 }).mat('s', '#8a909c', { step: 0.12 })
    .mat('w', '#5a4030').mat('l', '#5e4a36').color('eye', '#d84a2a').color('ring', '#c8a040');
  // 다리 (발굽)
  if (!f) { S.part('f', m => mRect(m, 10, 22, 5, 7)); S.part('f', m => mRect(m, 18, 22, 5, 7)); }
  else { S.part('f', m => mRect(m, 11, 22, 5, 6)); S.part('f', m => mRect(m, 17, 22, 5, 7)); }
  S.part('d', m => { mRect(m, f ? 11 : 10, f ? 27 : 28, 5, 2); mRect(m, f ? 17 : 18, 28, 5, 2); }, { round: 1 });
  // 도끼 (오른손 — 자루는 몸 뒤로)
  S.part('w', m => mLine(m, 27, 3 + b, 24, 26 + b, 2), { line: 'K', round: 1 });
  S.part('s', m => { mPoly(m, [[26, 2 + b], [31, 0 + b], [31, 10 + b], [26, 8 + b]]); mPoly(m, [[25, 3 + b], [20, 1 + b], [20, 9 + b], [25, 7 + b]]); }, { line: 'K', round: 2 });
  // 몸통 — 넓은 가슴 · 허리 천
  S.part('f', m => mPoly(m, [[8, 11 + b], [24, 11 + b], [22, 23 + b], [10, 23 + b]]), { round: 5 });
  S.part('l', m => mPoly(m, [[10, 21 + b], [22, 21 + b], [21, 26 + b], [17, 24 + b], [14, 26 + b], [11, 24 + b]]), { round: 2 });
  // 팔
  S.part('f', m => { mLine(m, 8, 13 + b, 5, 21 + b, 4); mEll(m, 5, 22 + b, 2.6, 2.3); });
  S.part('f', m => { mLine(m, 23, 13 + b, 25, 17 + b, 4); mEll(m, 25.5, 17.5 + b, 2.5, 2.3); }, { bias: -1 });
  // 머리 — 길쭉한 소 얼굴 · 주둥이
  S.part('f', m => { mEll(m, 16, 8 + b, 5, 4.5); mEll(m, 16.5, 11 + b, 3.6, 2.8); });
  S.part('d', m => mEll(m, 16.5, 12 + b, 2.8, 1.8), { round: 1 });   // 주둥이 (짙게)
  // 뿔 — 양옆으로 휘어 오름 (좌우 길이가 다름)
  S.part('h', m => mTube(m, [[12, 6 + b], [8, 5 + b], [6, 2 + b], [7, 0 + b]], 1.6, 0.6), { round: 1 });
  S.part('h', m => mTube(m, [[20, 6 + b], [24, 5 + b], [26, 3 + b], [25, 1 + b]], 1.6, 0.6), { round: 1, bias: -1 });
  // 얼굴 — 작은 눈 · 콧구멍 · 코뚜레
  S.pts(at(b, [[14, 8], [19, 8]]), 'eye');
  S.tone(at(b, [[13, 7], [14, 7], [18, 7], [19, 7]]), 0);
  S.pts(at(b, [[15, 12], [18, 12]]), 'K');
  S.pts(at(b, [[16, 14], [17, 14]]), 'ring');
  // 가슴 근육 · 털 결 (드문드문)
  S.tone(at(b, [[11, 14], [12, 15], [20, 14], [19, 15], [16, 17], [16, 18], [12, 19], [21, 19]]), 1);
  S.tone(at(b, [[10, 12], [11, 12], [9, 15], [13, 13]]), 4);
  S.tone(at(b, [[22, 2], [22, 3], [29, 3], [30, 5]]), 4);
  return S.outline();
}
out.minotaur = pair(minotaur(0), minotaur(1), K, { view: '대각선' });

// ---------- 와이번 (2칸) — 옆모습, 날개 팔 · 두 다리 · 가시 꼬리 ----------
function wyvern(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('g', '#4a5e4a').mat('m', '#8a6258').mat('v', '#a8946a').mat('h', '#c8bca0', { step: 0.12, shift: 6 }).color('eye', '#e0b030');
  // 뒤 날개 (멀리)
  S.part('m', m => mPoly(m, f ? [[13, 13], [18, 6], [21, 8], [19, 14]] : [[13, 13], [16, 3], [19, 5], [19, 14]]), { bias: -1, round: 2 });
  // 꼬리 — 뒤로 길게, 끝 가시
  S.part('g', m => mTube(m, [[10, 19 + b], [6, 21 + b], [3, 19 + b], [1, 15 + b]], 2.4, 0.7), { round: 2 });
  S.part('h', m => mPoly(m, [[0, 13 + b], [3, 14 + b], [1, 17 + b]]), { round: 1, line: 'K' });
  // 다리
  S.part('g', m => { mLine(m, 13, 20, f ? 12 : 11, 27, 3); mLine(m, 19, 20, f ? 20 : 21, 27, 3); });
  S.part('h', m => { mRect(m, f ? 10 : 9, 28, 4, 1); mRect(m, f ? 19 : 20, 28, 4, 1); }, { line: 'K', round: 1 });
  // 몸통 · 배
  S.part('g', m => mEll(m, 16, 18 + b, 7, 4.5));
  S.part('v', m => mEll(m, 17, 20 + b, 5, 2.2), { round: 1 });
  // 목 · 머리 — 앞으로 길게, 뿔 둘
  S.part('g', m => mTube(m, [[20, 16 + b], [23, 12 + b], [25, 9 + b]], 2.4, 1.8), { round: 2 });
  S.part('g', m => { mEll(m, 26.5, 8.5 + b, 3.4, 2.4); mPoly(m, [[27, 8 + b], [31, 9 + b], [31, 11 + b], [27, 11 + b]]); });
  S.part('h', m => { mLine(m, 25, 7 + b, 22, 5 + b, 1); mLine(m, 27, 6 + b, 25, 3 + b, 1); }, { line: 'K' });
  // 앞 날개 (가까이) — 날개뼈 · 막 (B 는 내리침)
  // 막은 날개뼈 사이로 오목하게 — 끝이 손가락처럼 갈라짐
  if (!f) S.part('m', m => mPoly(m, [[15, 14], [21, 4], [24, 2], [23, 7], [26, 6], [24, 11], [26, 13], [19, 15]]), { round: 2 });
  else S.part('m', m => mPoly(m, [[15, 14], [24, 16], [27, 17], [24, 19], [25, 21], [21, 20], [17, 18]]), { round: 2 });
  S.part('g', m => f ? (mLine(m, 15, 14, 27, 17, 1), mLine(m, 20, 16, 25, 21, 1)) : (mLine(m, 15, 14, 24, 2, 1), mLine(m, 19, 9, 26, 6, 1)), { line: 'K' });
  // 눈 · 콧구멍 · 이빨
  S.pts(at(b, [[27, 8]]), 'eye');
  S.tone(at(b, [[26, 7], [27, 7]]), 0);
  S.pts(at(b, [[30, 9]]), 'K');
  S.pts(at(b, [[28, 11], [30, 11]]), 'h4');
  // 배 비늘 줄 · 등 가시 (드문드문)
  S.tone(at(b, [[15, 21], [18, 21], [20, 20]]), 1);
  S.pts(at(b, [[12, 13], [15, 13], [17, 14]]), 'h3');
  return S.outline();
}
out.wyvern = pair(wyvern(0), wyvern(1), K, { view: '옆모습' });

// ---------- 키메라 (2칸) — 옆모습, 사자 몸 · 등에 염소 머리 · 뱀 꼬리 ----------
function chimera(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('l', '#9a7a44').mat('n', '#6a4428').mat('a', '#8a847a').mat('h', '#c8bca0', { step: 0.12, shift: 6 }).mat('e', '#4a6a3a')
    .color('eye', '#e0b030').color('eye2', '#c83a2a');
  // 뱀 꼬리 — 뒤로 휘어 올라 머리
  S.part('e', m => mTube(m, [[8, 19 + b], [4, 18 + b], [2, 13 + b], [4, 9 + b]], 1.8, 1.2), { round: 1 });
  S.part('e', m => mEll(m, 5, 8 + b, 2.4, 1.7), { round: 1 });
  // 다리 (뒤쪽 · 앞쪽 — B 는 걸음)
  S.part('l', m => { mLine(m, 10, 20, f ? 9 : 8, 27, 3); mLine(m, 21, 20, f ? 22 : 23, 27, 3); }, { bias: -1 });
  S.part('l', m => { mLine(m, 12, 20, f ? 13 : 12, 28, 3); mLine(m, 23, 20, f ? 23 : 24, 28, 3); });
  // 몸통
  S.part('l', m => mEll(m, 16, 18 + b, 9, 5));
  // 등의 염소 머리 — 목이 솟고 휜 뿔
  S.part('a', m => { mTube(m, [[14, 15 + b], [13, 10 + b]], 2, 1.8); mEll(m, 12.5, 8.5 + b, 2.6, 2.2); mEll(m, 10.5, 10 + b, 1.6, 1.3); }, { round: 2 });
  S.part('h', m => mTube(m, [[13, 7 + b], [15, 4 + b], [17, 5 + b], [17, 7 + b]], 1.1, 0.5), { round: 1 });
  // 사자 머리 · 갈기
  S.part('n', m => mEll(m, 24, 12.5 + b, 5.5, 5.8));
  S.part('l', m => { mEll(m, 25.5, 13 + b, 3.4, 3.2); mEll(m, 28, 14.5 + b, 2.2, 1.8); });
  // 눈 · 코 · 입
  S.pts(at(b, [[26, 12]]), 'eye');
  S.tone(at(b, [[25, 11], [26, 11]]), 0);
  S.pts(at(b, [[30, 14], [28, 16], [29, 16]]), 'K');
  S.pts(at(b, [[11, 8]]), 'eye2');
  S.pts(at(b, [[4, 7]]), 'eye');
  // 갈기 결 · 털 (드문드문)
  S.tone(at(b, [[21, 9], [20, 12], [22, 16], [21, 15], [19, 10]]), 0);
  S.tone(at(b, [[11, 21], [15, 22], [19, 21]]), 1);
  S.tone(at(b, [[12, 15], [13, 14], [17, 14]]), 4);
  return S.outline();
}
out.chimera = pair(chimera(0), chimera(1), K, { view: '옆모습' });

// ---------- 만티코어 (2칸) — 옆모습, 붉은 사자 몸 · 사람 같은 얼굴 · 등 위로 휜 전갈 꼬리 ----------
function manticore(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('l', '#8a4a34').mat('n', '#4a2a2a').mat('t', '#5a3a3e').mat('s', '#c8a85a').mat('k', '#a0806a').color('eye', '#e0c040');
  // 전갈 꼬리 — 마디가 크기가 다르게, 등 위로 휘어 앞을 겨눔 (B 는 침이 한 점 앞으로)
  const segs = [[8, 18, 2.4], [5, 15, 2.2], [4, 11, 2.1], [5, 7, 1.9], [8, 4, 1.8], [12, 3, 1.6], [15, 4 + b, 1.4]];
  segs.forEach(([x, y, r], i) => S.part('t', m => mEll(m, x, y + (i ? 0 : b), r, r * 0.9), { round: 2 }));
  S.part('s', m => mPoly(m, [[16 + b, 3 + b], [20 + b, 5 + b], [16 + b, 6 + b]]), { line: 'K', round: 1 });
  // 다리
  S.part('l', m => { mLine(m, 10, 20, f ? 9 : 8, 27, 3); mLine(m, 21, 20, f ? 22 : 23, 27, 3); }, { bias: -1 });
  S.part('l', m => { mLine(m, 12, 20, f ? 13 : 12, 28, 3); mLine(m, 23, 20, f ? 23 : 24, 28, 3); });
  // 몸통
  S.part('l', m => mEll(m, 16, 18 + b, 9, 5));
  // 갈기 · 사람 같은 얼굴
  S.part('n', m => mEll(m, 24, 12.5 + b, 5.6, 6));
  S.part('k', m => { mEll(m, 26, 13 + b, 3, 3.4); });
  S.pts(at(b, [[27, 12]]), 'eye');
  S.tone(at(b, [[26, 11], [27, 11], [28, 11]]), 0);
  S.tone(at(b, [[28, 13], [28, 14]]), 1);
  for (let x = 25; x <= 28; x++) S.px(x, 15 + b, 'K');
  S.pts(at(b, [[26, 16], [28, 16]]), 's4');   // 송곳니
  // 마디 사이 · 갈기 결 · 몸 털
  S.tone(at(b, [[6, 13], [4, 9], [6, 6], [10, 3]]), 0);
  S.tone(at(b, [[21, 9], [20, 13], [22, 17], [19, 11]]), 0);
  S.tone(at(b, [[11, 21], [15, 22], [19, 21]]), 1);
  S.tone(at(b, [[12, 15], [13, 14]]), 4);
  return S.outline();
}
out.manticore = pair(manticore(0), manticore(1), K, { view: '옆모습' });

// ---------- 스톤 골렘 (2칸) — 앞, 쌓아 올린 돌덩이 몸 · 이끼 · 금 사이 주황 빛 ----------
function stonegolem(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('r', '#7c7a70', { step: 0.12 }).mat('m', '#4e6236').color('glow', '#e0903a').color('core', '#ffd070');
  // 다리 — 짧고 굵은 돌기둥
  S.part('r', m => { mRect(m, 9, 22, 6, f ? 6 : 7); mRect(m, 17, 22, 6, 7); }, { round: 3 });
  // 몸 — 크기가 다른 돌덩이 셋
  S.part('r', m => mPoly(m, [[8, 13 + b], [24, 12 + b], [23, 23 + b], [9, 24 + b]]), { round: 5 });
  S.part('r', m => mEll(m, 11, 20 + b, 3.6, 3), { round: 3 });
  // 팔 — 어깨 돌 · 큰 주먹 (오른팔이 더 큼)
  S.part('r', m => { mEll(m, 6, 13 + b, 3.6, 3); mLine(m, 5, 14 + b, 4, 21 + b, 4); mEll(m, 4.5, 23 + b, 3.4, 3); });
  S.part('r', m => { mEll(m, 26, 12.5 + b, 4, 3.2); mLine(m, 27, 14 + b, 28, 21 + b, 5); mEll(m, 28, 23.5 + b, 3.8, 3.4); }, { bias: -1 });
  // 머리 — 몸에 박힌 작은 돌
  S.part('r', m => mPoly(m, [[13, 6 + b], [20, 7 + b], [19, 12 + b], [12, 12 + b]]), { round: 3 });
  // 금 — 길이 · 방향이 다른 금, 사이로 주황 빛 (가운데는 밝게)
  for (const [x, y] of [[15, 15], [16, 16], [16, 17], [17, 18], [18, 18], [11, 17], [12, 18], [21, 14], [21, 15], [20, 20], [27, 18], [5, 19]]) S.px(x, y + b, 'glow');
  S.pts(at(b, [[16, 17]]), 'core');
  // 눈 — 가는 틈에 빛
  S.pts(at(b, [[14, 9], [18, 9]]), 'glow');
  S.tone(at(b, [[13, 9], [15, 9], [17, 9], [19, 9]]), 0);
  // 이끼 — 어깨 · 머리 위에 몇 덩어리
  S.pts(at(b, [[5, 11], [6, 11], [7, 11], [25, 10], [26, 10], [14, 6], [15, 6], [22, 12]]), 'm2');
  S.pts(at(b, [[6, 10], [25, 9]]), 'm3');
  // 돌 이음 (드문드문 짙게)
  S.tone(at(b, [[9, 18], [10, 17], [22, 17], [23, 16], [14, 22], [19, 22]]), 0);
  S.tone(at(b, [[9, 13], [10, 13], [13, 7]]), 4);
  return S.outline();
}
out.stonegolem = pair(stonegolem(0), stonegolem(1), K, { view: '앞' });

// ---------- 아이언 골렘 (2칸) — 앞, 쇠판을 덧댄 몸 · 리벳 · 가슴 화로 · 붉은 눈 틈 ----------
function irongolem(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('i', '#6a707c', { step: 0.12 }).mat('x', '#7a4a32').color('eye', '#e04030').color('fire', '#e8803a').color('hot', '#ffd070');
  S.part('i', m => { mRect(m, 10, 22, 5, f ? 6 : 7); mRect(m, 17, 22, 5, 7); }, { round: 2 });
  S.part('i', m => { mRect(m, 9, 27, 7, 2); mRect(m, 16, 28, 7, 2); }, { round: 1 });
  S.part('i', m => mPoly(m, [[8, 12 + b], [24, 12 + b], [22, 24 + b], [10, 24 + b]]), { round: 4 });
  // 팔 — 둥근 어깨 · 통 팔 · 네모 주먹
  S.part('i', m => { mEll(m, 6.5, 13 + b, 3.4, 3); mRect(m, 4, 15 + b, 4, 7); mRect(m, 3, 21 + b, 6, 4); });
  S.part('i', m => { mEll(m, 25.5, 13 + b, 3.4, 3); mRect(m, 24, 15 + b, 4, 7); mRect(m, 23, 21 + b, 6, 4); }, { bias: -1 });
  // 머리 — 투구 같은 통, 가로 눈 틈
  S.part('i', m => { mRect(m, 12, 5 + b, 8, 7); mRect(m, 13, 4 + b, 6, 1); }, { round: 3 });
  for (let x = 13; x <= 18; x++) S.px(x, 8 + b, 'K');
  S.pts(at(b, [[14, 8], [17, 8]]), 'eye');
  // 가슴 화로 — 쇠살 사이로 불빛
  for (let y = 15; y <= 19; y++) for (let x = 13; x <= 18; x++) S.px(x, y + b, (x === 13 || x === 18 || y === 15 || y === 19) ? 'K' : (x === 15 || x === 16) && y >= 16 ? (y === 18 ? 'hot' : 'fire') : (y === 17 ? 'fire' : 'K'));
  // 리벳 — 자리가 들쭉날쭉
  for (const [x, y] of [[10, 13], [21, 14], [11, 21], [20, 22], [9, 17], [23, 19], [5, 16], [26, 17], [13, 6], [18, 10]]) { S.px(x, y + b, 'i4'); S.px(x + 1, y + 1 + b, 'i0'); }
  // 녹 · 판 이음
  S.pts(at(b, [[22, 20], [22, 21], [11, 15], [4, 22]]), 'x2');
  S.tone(at(b, [[16, 12], [16, 13], [16, 21], [16, 22], [16, 23]]), 1);
  S.tone(at(b, [[9, 12], [10, 12], [5, 11]]), 4);
  return S.outline();
}
out.irongolem = pair(irongolem(0), irongolem(1), K, { view: '앞' });

// ---------- 카벙클 (히든 · 2칸) — 대각선, 작은 여우 같은 짐승 · 큰 꼬리 · 이마에 박힌 홍옥 ----------
function carbuncle(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('c', '#5e7a78').mat('w', '#b0b8a8').color('gem', '#b8203a').color('gemL', '#ff7080').color('gemD', '#6a1020').color('eye', '#1a1418');
  // 큰 꼬리 — 뒤로 말려 올라감 (B 는 한 점 흔듦)
  S.part('c', m => mTube(m, [[12, 22], [7, 21], [4, 16 - b], [6, 10 - b], [10, 9 - b]], 3.4, 2.4), { round: 3 });
  S.part('w', m => mEll(m, 9.5, 9 - b, 2.4, 1.8), { round: 2 });
  // 다리
  S.part('c', m => { mRect(m, 13, 24, 3, f ? 4 : 5); mRect(m, 20, 24, 3, 5); });
  // 몸 · 가슴 털
  S.part('c', m => mEll(m, 17, 21 + b, 6.5, 4.5));
  S.part('w', m => mEll(m, 20, 22 + b, 3, 2.6), { round: 2 });
  // 머리 · 큰 귀
  S.part('c', m => mEll(m, 21, 14 + b, 5.2, 4.4));
  S.part('c', m => { mPoly(m, [[17, 12 + b], [16, 5 + b], [20, 10 + b]]); mPoly(m, [[22, 10 + b], [25, 4 + b], [26, 11 + b]]); }, { round: 1 });
  S.pts(at(b, [[17, 8], [17, 9], [25, 7], [25, 8]]), 'w1');   // 귀 안쪽
  S.part('w', m => mEll(m, 23.5, 16 + b, 2.6, 1.9), { round: 1 });   // 주둥이
  // 이마의 홍옥
  S.pts(at(b, [[21, 11], [22, 11], [21, 12], [22, 12]]), 'gem');
  S.pts(at(b, [[21, 11]]), 'gemL');
  S.pts(at(b, [[22, 12]]), 'gemD');
  // 눈 · 코
  S.pts(at(b, [[19, 14], [24, 14]]), 'eye');
  S.pts(at(b, [[26, 16]]), 'eye');
  // 털 결 (드문드문)
  S.tone(at(b, [[13, 19], [15, 18], [6, 15], [5, 13]]), 4);
  S.tone(at(b, [[14, 23], [17, 24], [8, 19]]), 1);
  return S.outline();
}
out.carbuncle = pair(carbuncle(0), carbuncle(1), K, { view: '대각선' });

module.exports = out;
