// 4격 (거인의 고개) — 2칸 · 3칸 몬스터. 5단계 입체 명암 + 손 세부, 눈 작게(1점), 어둑한 색, 반복 무늬 없이
const { Sprite, pair, mRect, mEll, mLine, mPoly, mTube, mLimb, noise } = require('./lib2.js');
const K = '#35263f';
const out = {};
const at = (b, list) => list.map(([x, y]) => [x, y + b]);
const furry = (S, mat, seed, cell = 2.4, hi = 0.68, lo = 0.24) => { const nz = noise(seed, cell); S.each(mat, (x, y, t) => t + (nz(x, y) > hi ? 1 : nz(x, y) < lo ? -1 : 0)); };

// ---------- 골리앗 (2칸) — 대각선, 청동 투구 · 비늘 갑옷 · 둥근 방패 · 긴 창 (창은 몸 앞, 주먹이 쥠) ----------
function goliath(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('s', '#a07a5a').mat('z', '#8a6a3a', { step: 0.12 }).mat('l', '#5a4030').mat('w', '#6a4a32').mat('m', '#8a909c', { step: 0.12 }).color('eye', '#1a1418');
  S.part('s', m => { mRect(m, 11, 22, 4, f ? 5 : 6); mRect(m, 17, 22, 4, 6); });
  S.part('l', m => { mRect(m, f ? 11 : 10, f ? 26 : 27, 5, 2); mRect(m, 17, 27, 5, 2); }, { round: 1 });
  S.part('z', m => mPoly(m, [[9, 11 + b], [23, 11 + b], [24, 14 + b], [22, 19 + b], [21, 22 + b], [11, 22 + b], [10, 19 + b], [8, 14 + b]]), { round: 4 });
  S.part('l', m => mPoly(m, [[10, 20 + b], [22, 20 + b], [21, 25 + b], [11, 25 + b]]), { round: 2 });
  S.part('s', m => mLimb(m, [[23, 12 + b, 2.2], [24.5, 15 + b, 1.9], [25, 17 + b, 1.4], [25.5, 18.5 + b, 1.7]]), { bias: -1 });
  S.part('w', m => mLine(m, 27, 0 + b, 26, 28, 1), { line: 'K' });   // 창 — 몸 앞
  S.part('m', m => mPoly(m, [[27, 0 + b], [29, 3 + b], [27, 5 + b], [26, 3 + b]]), { line: 'K', round: 1 });
  S.part('s', m => mEll(m, 25.8, 19 + b, 1.9, 1.7), { bias: -1 });   // 창을 쥔 주먹
  S.part('s', m => mEll(m, 16, 8 + b, 3.6, 3.6), { min: 2 });
  S.part('l', m => mEll(m, 16, 10 + b, 3, 1.6), { round: 1 });
  S.part('z', m => { mEll(m, 16, 4.5 + b, 4.2, 2.2); mRect(m, 15, 0 + b, 2, 3); }, { round: 2 });
  S.pts(at(b, [[14, 7], [18, 7]]), 'eye');
  S.part('z', m => mEll(m, 7, 17 + b, 5, 5.5), { round: 3 });
  S.part('m', m => mEll(m, 7, 17 + b, 1.6, 1.6), { line: 'K', round: 1 });
  S.tone(at(b, [[12, 14], [15, 13], [19, 15], [13, 17], [17, 18], [20, 12], [11, 20]]), 1);
  S.tone(at(b, [[4, 14], [5, 13], [10, 21]]), 4);
  return S.outline();
}
out.goliath = pair(goliath(0), goliath(1), K, { view: '대각선' });

// ---------- 설인 (2칸) — 앞, 헝클어진 흰 털 · 어두운 얼굴 · 긴 팔 ----------
function yeti(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(32).mat('w', '#c4c8cc', { step: 0.12 }).mat('d', '#4a5068').color('eye', '#6ac0e0').color('tooth', '#e8e8d8');
  S.part('w', m => { mRect(m, 10, 22, 5, f ? 6 : 7); mRect(m, 18, 22, 5, 7); }, { round: 2 });
  S.part('d', m => { mRect(m, f ? 10 : 9, 28, 6, 1); mRect(m, 18, 28, 6, 1); }, { line: 'K' });
  S.part('w', m => mEll(m, 16, 17 + b, 9, 8));
  // 팔 — 길게 늘어뜨림 (B 는 한쪽을 들어 올림)
  S.part('w', m => { mTube(m, [[8, 12 + b], [4, 18 + b], [3, 25 + b]], 3, 2.6); });
  S.part('w', m => { mTube(m, f ? [[24, 12], [28, 9], [29, 4]] : [[24, 12 + b], [28, 18 + b], [29, 25 + b]], 3, 2.6); }, { bias: -1 });
  S.part('d', m => { mEll(m, 3, 26 + b, 2, 1.6); mEll(m, 29, f ? 3 : 26, 2, 1.6); }, { round: 1 });
  // 머리 · 얼굴
  S.part('w', m => mEll(m, 16, 8 + b, 5.5, 5));
  S.part('d', m => mEll(m, 16, 9.5 + b, 3.4, 3), { round: 2 });
  S.pts(at(b, [[14, 8], [18, 8]]), 'eye');
  for (let x = 14; x <= 18; x++) S.px(x, 11 + b, 'K');
  S.pts(at(b, [[14, 11], [18, 11]]), 'tooth');
  furry(S, 'w', 41, 2.2);
  return S.outline();
}
out.yeti = pair(yeti(0), yeti(1), K, { view: '앞' });

// ---------- 언덕 거인 (3칸) — 대각선, 뚱뚱한 몸 · 털가죽 허리 · 머리 위로 든 바위 ----------
function hillgiant(f) {
  const b = f ? 1 : 0, lift = f ? -2 : 0;
  const S = new Sprite(48).mat('s', '#9a845e').mat('h', '#5a4430').mat('r', '#7c7a70', { step: 0.12 }).mat('m', '#4e6236').color('eye', '#d8b030').color('tooth', '#d8d0b8');
  S.part('s', m => { mRect(m, 14, 33, 7, f ? 9 : 10); mRect(m, 27, 33, 7, 10); }, { round: 3 });
  S.part('h', m => { mRect(m, f ? 13 : 12, 42, 9, 3); mRect(m, 27, 42, 9, 3); }, { round: 1 });
  S.part('s', m => mEll(m, 24, 27 + b, 13, 10));
  S.part('h', m => mPoly(m, [[12, 31 + b], [36, 31 + b], [34, 38], [29, 36], [24, 39], [19, 36], [14, 38]]), { round: 2 });
  // 팔 — 둘 다 들어 바위를 머리 위로
  S.part('s', m => { mTube(m, [[13, 21 + b], [10, 14 + lift], [14, 7 + lift]], 3.6, 3); });
  S.part('s', m => { mTube(m, [[35, 21 + b], [38, 14 + lift], [34, 7 + lift]], 3.6, 3); }, { bias: -1 });
  S.part('s', m => mEll(m, 24, 15 + b, 5, 4.6));   // 머리 (어깨에 파묻힘)
  // 바위
  S.part('r', m => mPoly(m, [[13, 6 + lift], [18, 1 + lift], [29, 0 + lift], [35, 4 + lift], [33, 9 + lift], [16, 10 + lift]]), { round: 5 });
  S.pts([[19, 2 + lift], [20, 2 + lift], [21, 3 + lift], [28, 1 + lift]], 'm2');
  S.tone([[24, 4 + lift], [25, 5 + lift], [25, 6 + lift], [17, 7 + lift]], 0);
  // 얼굴
  S.tone(at(b, [[21, 13], [22, 13], [26, 13], [27, 13]]), 0);
  S.pts(at(b, [[22, 14], [26, 14]]), 'eye');
  for (let x = 22; x <= 27; x++) S.px(x, 17 + b, 'K');
  S.pts(at(b, [[23, 17], [26, 17]]), 'tooth');
  // 뱃살 · 털가죽 결
  S.tone(at(b, [[24, 28], [17, 24], [31, 24], [20, 30], [28, 30]]), 1);
  S.tone(at(b, [[15, 22], [16, 21], [17, 20]]), 4);
  furry(S, 'h', 52, 1.8);
  return S.outline();
}
out.hillgiant = pair(hillgiant(0), hillgiant(1), K, { view: '대각선' });

// ---------- 사이클롭스 (3칸) — 앞, 하나뿐인 큰 눈 · 넓은 어깨와 굵은 팔(이두 · 아래팔이 불룩) · 가죽 앞치마 · 대장장이 망치(몸 앞, 주먹이 쥠) ----------
function cyclops(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(48).mat('s', '#8a7a6a').mat('a', '#5a3e2a').mat('i', '#6a707c', { step: 0.12 }).mat('w', '#5e4632').color('eyeW', '#d8d0c0').color('iris', '#c84a2a').color('pupil', '#1a1418');
  S.part('s', m => { mLimb(m, [[18, 33, 4], [18, 38, 3.4], [18, 42, 3.6]]); mLimb(m, [[30, 33, 4], [30, 38, 3.4], [30, 42, 3.6]]); }, { round: 3 });
  S.part('a', m => { mRect(m, f ? 14 : 13, 42, 9, 3); mRect(m, 26, 42, 9, 3); }, { round: 1 });
  // 몸통 — 넓은 가슴 · 잘록한 허리 · 불룩한 배
  S.part('s', m => mPoly(m, [[13, 14 + b], [35, 14 + b], [38, 18 + b], [36, 25 + b], [33, 29 + b], [34, 34 + b], [14, 34 + b], [15, 29 + b], [12, 25 + b], [10, 18 + b]]), { round: 7 });
  S.part('a', m => mPoly(m, [[17, 22 + b], [31, 22 + b], [33, 38], [15, 38]]), { round: 3 });
  S.part('a', m => { mLine(m, 17, 22 + b, 14, 15 + b, 1); mLine(m, 31, 22 + b, 34, 15 + b, 1); }, { fixed: 0, line: false });
  // 팔 — 어깨 · 이두 · 팔꿈치 · 아래팔 · 손목
  S.part('s', m => { mEll(m, 11, 17 + b, 4.6, 3.8); mLimb(m, [[10, 18 + b, 4], [8, 23 + b, 3.6], [8, 26 + b, 2.6], [7, 29 + b, 3.2], [8, 32 + b, 2.4]]); mEll(m, 8, 34 + b, 3, 2.6); });
  S.part('s', m => { mEll(m, 37, 17 + b, 4.6, 3.8); mLimb(m, [[38, 18 + b, 4], [40, 23 + b, 3.6], [39, 26 + b, 2.6], [37, 28 + b, 3]]); }, { bias: -1 });
  // 망치 — 몸 앞 (B 는 내림), 주먹이 자루를 쥠
  S.part('w', m => mLine(m, 35, 30 + b, f ? 40 : 38, f ? 12 : 8, 2), { line: 'K' });
  S.part('i', m => f ? mRect(m, 36, 7, 9, 6) : mRect(m, 34, 3, 9, 6), { round: 2, line: 'K' });
  S.part('s', m => mEll(m, 36, 29.5 + b, 3, 2.6), { bias: -1 });
  // 머리 — 큰 눈 하나
  S.part('s', m => mEll(m, 24, 9 + b, 6.5, 6));
  S.pts(at(b, [[22, 8], [23, 8], [24, 8], [25, 8], [26, 8], [21, 9], [22, 9], [26, 9], [27, 9], [22, 10], [23, 10], [24, 10], [25, 10], [26, 10]]), 'eyeW');
  S.pts(at(b, [[23, 9], [25, 9]]), 'iris');
  S.pts(at(b, [[24, 9]]), 'pupil');
  S.tone(at(b, [[21, 7], [22, 6], [23, 6], [24, 6], [25, 6], [26, 6], [27, 7]]), 0);
  for (let x = 21; x <= 27; x++) S.px(x, 13 + b, 'K');
  // 가슴 아래 그늘 · 쇄골 · 팔 근육 결 · 그을음
  S.tone(at(b, [[16, 20], [17, 21], [18, 21], [30, 21], [31, 21], [32, 20], [24, 17], [24, 18]]), 1);
  S.tone(at(b, [[9, 24], [10, 25], [39, 24], [38, 25], [15, 15], [16, 15], [32, 15]]), 1);
  S.tone(at(b, [[12, 15], [13, 15], [8, 21], [36, 15]]), 4);
  S.pts(at(b, [[20, 28], [21, 29], [28, 26], [24, 33]]), 'a0');
  return S.outline();
}
out.cyclops = pair(cyclops(0), cyclops(1), K, { view: '앞' });

// ---------- 에틴 (3칸) — 앞, 머리 둘이 서로 마주 보고 다툼 · 굴곡진 몸과 팔 · 털가죽 · 몽둥이(몸 앞, 주먹이 쥠) ----------
function ettin(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(48).mat('s', '#8a8a6a').mat('h', '#6a4a32').mat('w', '#5e4632').color('eye', '#d8b030').color('tooth', '#d8d0b8');
  S.part('s', m => { mLimb(m, [[18, 33, 4], [18, 38, 3.3], [18, 42, 3.6]]); mLimb(m, [[30, 33, 4], [30, 38, 3.3], [30, 42, 3.6]]); }, { round: 3 });
  S.part('h', m => { mRect(m, f ? 14 : 13, 42, 9, 3); mRect(m, 26, 42, 9, 3); }, { round: 1 });
  S.part('s', m => mPoly(m, [[10, 14 + b], [38, 14 + b], [40, 19 + b], [37, 26 + b], [34, 30 + b], [35, 34 + b], [13, 34 + b], [14, 30 + b], [11, 26 + b], [8, 19 + b]]), { round: 7 });
  S.part('h', m => mPoly(m, [[12, 27 + b], [36, 27 + b], [35, 37], [28, 35], [22, 38], [16, 35], [12, 37]]), { round: 2 });
  S.part('s', m => { mEll(m, 9, 17 + b, 4.4, 3.8); mLimb(m, [[8, 18 + b, 4], [6, 23 + b, 3.5], [6, 26 + b, 2.5], [5, 29 + b, 3], [6, 32 + b, 2.3]]); mEll(m, 6, 33.5 + b, 3, 2.6); });
  S.part('s', m => { mEll(m, 39, 17 + b, 4.4, 3.8); mLimb(m, [[40, 18 + b, 4], [41, 23 + b, 3.5], [40, 26 + b, 2.5], [39, 29 + b, 2.8]]); }, { bias: -1 });
  S.part('w', m => mTube(m, [[39, 32 + b], [41, 20 + b], [42, 9 + b]], 1.6, 3.4), { round: 2, line: 'K' });   // 몽둥이 — 몸 앞
  S.part('s', m => mEll(m, 39, 30.5 + b, 2.8, 2.6), { bias: -1 });
  const d = f ? 1 : 0;
  S.part('s', m => mEll(m, 16 + d, 9 + b, 5.2, 5));
  S.part('s', m => mEll(m, 32 - d, 9 + b, 5.2, 5), { bias: -1 });
  S.pts(at(b, [[18 + d, 8], [30 - d, 8]]), 'eye');
  S.tone(at(b, [[17 + d, 7], [18 + d, 7], [19 + d, 6], [29 - d, 6], [30 - d, 7], [31 - d, 7]]), 0);
  for (let x = 16 + d; x <= 20 + d; x++) S.px(x, 12 + b, 'K');
  for (let x = 28 - d; x <= 32 - d; x++) S.px(x, 12 + b, 'K');
  S.pts(at(b, [[17 + d, 12], [31 - d, 12]]), 'tooth');
  S.pts(at(b, [[16 + d, 4], [33 - d, 4], [14 + d, 5]]), 'h1');
  furry(S, 'h', 63, 1.8);
  S.tone(at(b, [[16, 20], [17, 21], [18, 21], [30, 21], [31, 21], [32, 20], [24, 18], [24, 22], [24, 25]]), 1);
  S.tone(at(b, [[7, 24], [8, 25], [41, 24], [40, 25]]), 1);
  S.tone(at(b, [[11, 15], [12, 15], [7, 21]]), 4);
  return S.outline();
}
out.ettin = pair(ettin(0), ettin(1), K, { view: '앞 · 두 머리' });

// ---------- 로크 (3칸) — 옆모습, 거대한 독수리 · 펼친 날개 · 금빛 발톱 ----------
function roc(f) {
  const S = new Sprite(48).mat('b', '#6a4e34').mat('h', '#a8946a').mat('y', '#c8a040', { step: 0.12 }).color('eye', '#e0c040');
  // 뒤 날개
  S.part('b', m => mPoly(m, f ? [[18, 22], [10, 30], [4, 34], [8, 26], [16, 18]] : [[18, 20], [12, 8], [6, 2], [14, 4], [22, 16]]), { bias: -1, round: 3 });
  // 꼬리 깃
  S.part('b', m => mPoly(m, [[12, 26], [2, 30], [3, 33], [13, 31]]), { round: 2 });
  // 다리 · 발톱
  S.part('y', m => { mLine(m, 22, 32, 21, 41, 2); mLine(m, 27, 32, 28, 41, 2); });
  S.part('y', m => { mRect(m, 18, 41, 6, 2); mRect(m, 26, 41, 6, 2); }, { line: 'K', round: 1 });
  // 몸
  S.part('b', m => mEll(m, 22, 26, 11, 7));
  S.part('h', m => mEll(m, 26, 28, 6, 4), { round: 2 });
  // 목 · 머리 · 굽은 부리
  S.part('h', m => { mTube(m, [[29, 22], [33, 17], [35, 13]], 3.6, 3); mEll(m, 37, 11, 4.4, 3.6); });
  S.part('y', m => mPoly(m, [[40, 9], [45, 11], [44, 14], [41, 14], [41, 12]]), { line: 'K', round: 1 });
  // 앞 날개 (가까이) — 깃 끝 길이가 다르게
  const wing = f ? [[20, 22], [34, 26], [44, 32], [40, 34], [42, 37], [35, 36], [34, 40], [26, 34], [19, 29]]
                 : [[18, 22], [16, 10], [19, 1], [23, 1], [23, 6], [27, 5], [26, 11], [29, 13], [26, 18], [25, 26]];
  S.part('b', m => mPoly(m, wing), { round: 3 });
  furry(S, 'b', 77, 2.3, 0.7, 0.22);
  S.pts([[38, 10]], 'eye');
  S.tone([[37, 9], [38, 9], [39, 9]], 0);
  S.tone([[24, 29], [27, 31], [29, 27]], 1);
  return S.outline();
}
out.roc = pair(roc(0), roc(1), K, { view: '옆모습' });

// ---------- 털매머드 (3칸) — 옆모습, 늘어진 갈색 털 · 휜 상아 · 코 · 등에 실은 짐 ----------
function mammoth(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(48).mat('m', '#6a4a32').mat('d', '#3e2c22').mat('t', '#d8ccb0', { step: 0.12 }).mat('c', '#8a6a42').mat('r', '#7a3a2e').color('eye', '#1a1418');
  // 다리 (뒤 · 앞 — B 는 걸음)
  S.part('m', m => { mRect(m, 9, 30, 6, 12); mRect(m, f ? 30 : 31, 30, 6, 12); }, { bias: -1, round: 3 });
  S.part('m', m => { mRect(m, f ? 15 : 14, 30, 6, 13); mRect(m, f ? 36 : 35, 30, 6, 13); }, { round: 3 });
  S.part('d', m => { mRect(m, 9, 41, 6, 1); mRect(m, f ? 15 : 14, 42, 6, 1); mRect(m, f ? 30 : 31, 41, 6, 1); mRect(m, f ? 36 : 35, 42, 6, 1); }, { line: 'K' });
  // 몸 · 머리 혹
  S.part('m', m => mEll(m, 22, 24 + b, 16, 11));
  S.part('m', m => mEll(m, 37, 18 + b, 7.5, 8));
  // 코 — 아래로 늘어져 끝이 말림 (B 는 흔듦)
  S.part('m', m => mTube(m, f ? [[41, 22], [43, 30], [42, 37], [44, 39]] : [[41, 22], [44, 30], [45, 37], [43, 40]], 2.6, 1.4), { round: 2 });
  // 상아 — 앞으로 휘어 올라감
  S.part('t', m => mTube(m, [[39, 25 + b], [43, 30 + b], [46, 28 + b], [47, 24 + b]], 1.6, 0.8), { line: 'K', round: 1 });
  // 등의 짐 — 천 · 묶은 짐 · 붉은 밧줄
  S.part('c', m => mPoly(m, [[12, 10 + b], [30, 8 + b], [32, 18 + b], [11, 19 + b]]), { round: 3 });
  S.part('r', m => { mLine(m, 16, 9 + b, 15, 19 + b, 1); mLine(m, 26, 8 + b, 27, 18 + b, 1); }, { line: false, cast: false });
  S.part('c', m => mEll(m, 20, 7 + b, 4.2, 2.6), { round: 2 });
  // 눈 · 털 결 (늘어진 털 — 아래로 끝이 들쭉날쭉)
  S.pts(at(b, [[39, 16]]), 'eye');
  furry(S, 'm', 88, 2.1, 0.66, 0.24);
  for (const [x, y] of [[10, 33], [13, 34], [17, 35], [21, 34], [25, 35], [28, 34], [33, 33]]) S.px(x, y + b, 'm0');
  return S.outline();
}
out.mammoth = pair(mammoth(0), mammoth(1), K, { view: '옆모습' });

module.exports = out;
