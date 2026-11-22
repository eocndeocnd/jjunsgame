// 6격 마지막 셋 — 세계수를 먹는 벌레(정예 4칸, 64) · 관측자(히든 3칸, 48) · 마왕(보스 4칸, 64). 5단계 입체 명암 + 손 세부, 어둑한 색, 반복 무늬 없이
const { Sprite, pair, mRect, mEll, mLine, mPoly, mTube, mLimb, noise } = require('./lib2.js');
const K = '#35263f';
const out = {};
const at = (b, list) => list.map(([x, y]) => [x, y + b]);
const mottle = (S, mat, seed, cell = 2.6, hi = 0.7, lo = 0.22) => { const nz = noise(seed, cell); S.each(mat, (x, y, t) => t + (nz(x, y) > hi ? 1 : nz(x, y) < lo ? -1 : 0)); };

// ---------- 세계수를 먹는 벌레 (4칸) — 옆모습, 뿌리부터 갉아먹는: 꼬리에서 머리로 굵어지는 마디 몸(등은 짙은 갑각, 배는 무른 살) · 둥근 입을 두른 갈고리 턱 넷 · 갉아 먹던 세계수 뿌리(갉은 자리에서 빛나는 속) ----------
function worldworm(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(64).mat('c', '#544a5e', { step: 0.12 }).mat('y', '#a8987c', { step: 0.1 }).mat('w', '#5e4632').mat('x', '#9ac47a', { mood: false, step: 0.1 }).mat('n', '#cabca0', { step: 0.12 }).mat('j', '#7a6658', { step: 0.12 }).color('void', '#100a10').color('eye', '#e8e070').color('glow', '#e4f4a8');
  // 세계수 뿌리 — 아래를 가로지름, 굵고 구불구불, 옆뿌리 하나
  S.part('w', m => { mTube(m, [[22, 63], [32, 59], [42, 54], [52, 52], [63, 54]], 5, 3.4); mTube(m, [[40, 56], [36, 51], [37, 47]], 1.8, 0.7); }, { round: 3 });
  S.part('w', m => mTube(m, [[56, 53], [60, 58], [63, 60]], 2, 1.2), { round: 2, bias: -1 });
  mottle(S, 'w', 211, 1.8, 0.7, 0.3);
  S.tone([[30, 58], [31, 59], [35, 57], [45, 53], [46, 54], [58, 53]], 0);              // 껍질 골 (길이 · 자리가 다름)
  // 갉은 자리 — 껍질이 패여 빛나는 속살, 떨어진 부스러기
  S.part('x', m => { mEll(m, 49, 51.5, 4, 2.4); mEll(m, 45.5, 53, 1.6, 1.2); }, { round: 2, line: 'K', cast: false });
  S.pts([[48, 51], [50, 51], [49, 52]], 'glow');
  S.pts([[43, 59], [52, 58], [53, 59]], 'x2');
  // 마디 몸 — 꼬리(작게)에서 머리 쪽(크게)으로, 마디마다 크기 · 간격이 조금씩 다름. 뒤 마디부터 그려 앞 마디가 덮음
  const path = [[4, 56], [7, 49], [12, 43], [19, 37], [27, 32], [35, 29], [42, 28], [48, 30]];
  const segs = [[0, 2.6], [0.9, 3.4], [1.8, 4.2], [2.7, 4.8], [3.5, 5.6], [4.3, 6.2], [5.1, 6.8], [5.9, 7.4], [6.6, 7.8]];
  const P = t => { const i = Math.min(path.length - 2, Math.floor(t)), u = t - i; return [path[i][0] + (path[i + 1][0] - path[i][0]) * u, path[i][1] + (path[i + 1][1] - path[i][1]) * u]; };
  segs.forEach(([t, r], k) => {
    const [x, y] = P(t), lift = k % 3 === (f ? 1 : 0) ? -0.6 : 0;                     // 꿈틀 — 마디 몇 개가 한 점 들림 (A · B 가 다름)
    S.part('y', m => mEll(m, x + 0.4, y + r * 0.35 + lift, r * 0.95, r * 0.8), { round: 2 });          // 무른 배
    S.part('c', m => mEll(m, x, y - r * 0.12 + lift, r, r * 0.78), { round: 3 });                     // 등 갑각
    if (k > 2 && k % 2) S.px(Math.round(x + 1), Math.round(y + r * 0.95 + lift), 'c0');                 // 짧은 배다리 (몇 마디에만)
  });
  // 갑각 위 빛 · 상처 (자리 · 길이가 다름)
  S.tone([[27, 28], [28, 27], [36, 25], [37, 25], [44, 24]], 4);
  S.tone([[33, 29], [34, 30], [21, 33]], 0);
  // 머리 — 앞으로 숙여 뿌리를 갉음 (B 는 한 점 내려 물어뜯음)
  const hx = 51, hy = 38 + b;
  S.part('c', m => mEll(m, hx, hy, 7.4, 6.6), { round: 4 });
  // 둥근 입 — 아래로 열림, 안쪽에 고리 이빨 (크기가 다름)
  S.part('y', m => mEll(m, hx + 1, hy + 6, 4.4, 2.6), { round: 1, line: 'K' });
  for (let y = hy + 5; y <= hy + 7; y++) for (let x = hx - 2; x <= hx + 4; x++) if (((x + 0.5 - hx - 1) / 3.2) ** 2 + ((y + 0.5 - hy - 6) / 1.5) ** 2 <= 1) S.px(x, y, 'void');
  S.pts([[hx - 1, hy + 5], [hx + 2, hy + 5], [hx + 4, hy + 6], [hx, hy + 7]], 'n3');
  // 갈고리 턱 넷 — 입가에서 뿌리 쪽으로 굽음 (길이 · 굵기가 다름, B 는 오므림)
  const jaw = f
    ? [[[hx - 4, hy + 4], [hx - 5, hy + 8], [hx - 3, hy + 11]], [[hx + 6, hy + 4], [hx + 7, hy + 8], [hx + 5, hy + 10]], [[hx - 2, hy + 7], [hx - 1, hy + 10]], [[hx + 4, hy + 7], [hx + 4, hy + 10]]]
    : [[[hx - 4, hy + 4], [hx - 6, hy + 8], [hx - 5, hy + 11]], [[hx + 6, hy + 4], [hx + 8, hy + 8], [hx + 7, hy + 11]], [[hx - 2, hy + 7], [hx - 2, hy + 10]], [[hx + 4, hy + 7], [hx + 5, hy + 10]]];
  jaw.forEach((pts, k) => S.part('j', m => mTube(m, pts, k < 2 ? 1.5 : 1, 0.5), { line: 'K', round: 1, cast: false }));
  for (const pts of jaw) S.px(pts[pts.length - 1][0], pts[pts.length - 1][1], 'n3');          // 턱 끝만 밝게
  // 눈 — 작은 눈 셋이 모여 있음 (크기가 다름)
  S.pts([[hx + 2, hy - 2], [hx + 4, hy - 1], [hx + 3, hy - 3]], 'eye');
  S.tone([[hx - 2, hy - 4], [hx - 1, hy - 5], [hx + 1, hy - 5]], 4);
  // 갑각에 박힌 세계수 파편 — 등에 하나, 은은히 빛남
  S.part('x', m => mPoly(m, [[38, 23], [40, 20], [41, 24]]), { round: 1, line: 'K', cast: false });
  S.px(40, 22, 'glow');
  return S.outline();
}
out.worldworm = pair(worldworm(0), worldworm(1), K, { view: '옆모습' });

// ---------- 관측자 (3칸) — 앞, 처음부터 당신을 보고 있던 것: 허공에 세로로 찢어진 틈 · 들쭉날쭉한 보랏빛 가장자리 · 틈 속 어둠의 작은 별빛 · 그 안에서 내다보는 큰 눈 하나 (B 는 눈동자가 한 점 움직임) ----------
function observer(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(48).mat('r', '#5a3a7a', { step: 0.12 }).mat('e', '#bab09a', { step: 0.1 }).mat('i', '#6a46a0', { step: 0.12 }).color('void', '#07050c').color('deep', '#120c1e').color('star', '#c8c0e8').color('slit', '#000000');
  // 틈 — 위아래가 뾰족한 세로 틈, 가장자리는 들쭉날쭉 (튀어나온 자리 · 길이가 다름, B 는 몇 자리가 바뀜)
  const edge = f
    ? [[24, 1], [27, 6], [31, 9], [33, 14], [37, 17], [35, 22], [38, 27], [34, 31], [33, 36], [29, 40], [26, 45], [22, 41], [17, 37], [15, 32], [11, 28], [13, 23], [10, 18], [15, 14], [17, 9], [21, 6]]
    : [[24, 1], [28, 5], [30, 10], [34, 13], [36, 18], [36, 23], [37, 28], [33, 32], [32, 37], [28, 41], [25, 45], [21, 40], [16, 36], [14, 31], [12, 27], [12, 22], [11, 17], [16, 13], [18, 8], [21, 5]];
  S.part('r', m => mPoly(m, edge), { round: 2, cast: false });
  // 속 — 가장자리를 남기고 어둠
  S.part('r', m => mPoly(m, edge.map(([x, y]) => [24 + (x - 24) * 0.8, 23 + (y - 23) * 0.9])), { fixed: 0, line: false, cast: false });
  S.each('r', (x, y, t) => {
    const inner = edge.map(([ex, ey]) => [24 + (ex - 24) * 0.72, 23 + (ey - 23) * 0.86]);
    let c = false; for (let i = 0, j = inner.length - 1; i < inner.length; j = i++) { const [xi, yi] = inner[i], [xj, yj] = inner[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi) + xi) c = !c; }
    return c ? null : t;
  });
  const n = noise(223, 3);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    if (S.g[y][x]) continue;
    const inner = edge.map(([ex, ey]) => [24 + (ex - 24) * 0.72, 23 + (ey - 23) * 0.86]);
    let c = false; for (let i = 0, j = inner.length - 1; i < inner.length; j = i++) { const [xi, yi] = inner[i], [xj, yj] = inner[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi) + xi) c = !c; }
    if (c) S.px(x, y, n(x, y) > 0.62 ? 'deep' : 'void');
  }
  // 틈 속 별빛 — 몇 점만, 자리가 흩어짐 (B 는 하나가 꺼짐)
  S.pts(f ? [[20, 9], [27, 38], [17, 29]] : [[20, 9], [27, 38], [17, 29], [29, 13]], 'star');
  // 눈 — 흰자(누렇게 바램) · 보랏빛 홍채 · 세로로 갈라진 동공
  const ex = 24, ey = 23;
  S.part('e', m => mPoly(m, [[ex - 9, ey], [ex - 5, ey - 5], [ex, ey - 6.5], [ex + 5, ey - 5], [ex + 9, ey], [ex + 5, ey + 4.5], [ex, ey + 5.5], [ex - 5, ey + 4.5]]), { round: 3, line: 'K' });
  S.tone([[ex - 6, ey - 3], [ex - 5, ey - 4], [ex - 7, ey - 1]], 4);
  S.tone([[ex + 4, ey + 3], [ex + 6, ey + 2], [ex - 3, ey + 4]], 0);
  const ix = ex + (f ? 1 : 0);
  S.part('i', m => mEll(m, ix, ey, 4.3, 4.6), { round: 2, line: 'K', cast: false });
  for (let y = ey - 3; y <= ey + 3; y++) S.px(ix, y, 'slit');
  S.pts([[ix, ey - 2], [ix, ey + 2]], 'slit');
  S.pts([[ix - 2, ey - 2]], 'i4');                                                         // 홍채의 빛 한 점
  // 눈꺼풀 — 위가 무겁게 덮음, 핏줄 둘 (길이가 다름)
  S.pts([[ex - 8, ey - 1], [ex - 7, ey - 2], [ex - 6, ey - 3], [ex + 6, ey - 3], [ex + 7, ey - 2]], 'K');
  S.pts([[ex - 7, ey + 1], [ex - 6, ey + 1], [ex + 6, ey - 1]], 'r1');
  return S.outline();
}
out.observer = pair(observer(0), observer(1), K, { view: '앞' });

// ---------- 마왕 (4칸) — 앞, 세계를 끝내러 온 자: 하늘로 휜 큰 두 뿔의 해골 투구 · 금테 두른 검은 갑주 · 가시 돋친 큰 어깨받이 · 너덜한 검붉은 망토 · 땅에 꽂은 큰 검 위에 두 손을 얹음 ----------
function demonking(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(64).mat('a', '#4c4460', { step: 0.13 }).mat('g', '#b0903c', { step: 0.12 }).mat('c', '#5a1e2a').mat('l', '#2a1420').mat('e', '#807e90', { step: 0.13 }).mat('o', '#8a8070', { step: 0.1 }).mat('n', '#3e3240', { step: 0.12 }).color('eye', '#ff4a3a').color('core', '#ffd0a0').color('void', '#0a0610').color('rune', '#d03a3a');
  // 망토 — 어깨에서 땅까지 넓게, 아래 끝이 너덜너덜 (B 는 끝자락이 흔들림)
  S.part('c', m => mPoly(m, f
    ? [[14, 18], [50, 18], [57, 46], [60, 61], [54, 58], [50, 63], [44, 59], [38, 63], [26, 63], [20, 59], [15, 63], [9, 58], [5, 61], [8, 46]]
    : [[14, 18], [50, 18], [57, 46], [61, 60], [55, 59], [51, 63], [45, 60], [38, 63], [26, 63], [19, 60], [14, 63], [10, 59], [4, 60], [8, 46]]), { round: 6 });
  S.part('l', m => mPoly(m, [[20, 44], [44, 44], [48, 62], [16, 62]]), { round: 3 });    // 망토 안쪽 (다리 뒤 그늘)
  // 다리 — 벌려 선 판금 다리 · 쇠신
  S.part('a', m => { mRect(m, 20, 44, 7, 15); mRect(m, 37, 44, 7, 15); }, { round: 3 });
  S.part('a', m => { mPoly(m, [[18, 58], [28, 58], [29, 62], [17, 62]]); mPoly(m, [[36, 58], [46, 58], [47, 62], [35, 62]]); }, { round: 1, bias: -1 });
  S.pts([[22, 48], [23, 49], [40, 47]], 'g2');                                            // 무릎 금장 (자리가 다름)
  // 큰 검 — 두 다리 사이 땅에 꽂음: 날 · 날 가운데 붉은 틈(끊긴 자리가 있음)
  S.part('e', m => mPoly(m, [[29.5, 40], [34.5, 40], [34, 58], [32, 63], [30, 58]]), { round: 2, line: 'K' });
  for (const y of [42, 43, 44, 46, 47, 50, 51, 52, 55]) S.px(32, y, 'rune');
  S.px(32, 45, 'core');
  // 몸 — 가슴판 · 허리, 금테 · 가운데 붉은 보석
  S.part('a', m => mPoly(m, [[19, 18 + b], [45, 18 + b], [44, 30 + b], [41, 44], [23, 44], [20, 30 + b]]), { round: 7 });
  S.part('g', m => { mLine(m, 21, 20 + b, 32, 27 + b, 1); mLine(m, 43, 20 + b, 32, 27 + b, 1); }, { line: false, cast: false, fixed: 2 });
  S.part('g', m => mRect(m, 22, 38, 20, 3), { round: 1, line: 'K' });
  S.part('n', m => mEll(m, 32, 29 + b, 2.4, 2.2), { round: 1, line: 'K' });
  S.pts(at(b, [[32, 29], [31, 28]]), 'eye');
  S.tone(at(b, [[24, 22], [25, 23], [39, 22], [26, 33], [38, 34], [40, 33]]), 1);
  S.tone(at(b, [[22, 21], [23, 20], [27, 24]]), 4);
  // 어깨받이 — 크고 둥글게, 위로 솟은 가시 (길이 · 굽음이 다름)
  S.part('a', m => mEll(m, 16, 21 + b, 8, 6), { round: 4 });
  S.part('a', m => mEll(m, 48, 21 + b, 8, 6), { round: 4, bias: -1 });
  S.part('g', m => { mTube(m, [[11, 22 + b], [13, 18 + b], [16, 16 + b]], 0.5, 0.5); mTube(m, [[53, 22 + b], [51, 18 + b], [48, 16 + b]], 0.5, 0.5); }, { fixed: 2, line: false, cast: false });
  for (const [pts, r] of [[[[12, 17], [9, 12], [9, 9]], 1.6], [[[52, 17], [55, 13], [55, 11]], 1.4]]) S.part('n', m => mTube(m, pts.map(([x, y]) => [x, y + b]), r, 0.4), { line: 'K', round: 1 });
  // 팔 — 두 손을 검 손잡이 위에 얹음
  S.part('a', m => mLimb(m, [[13, 26 + b, 3.6], [15, 32 + b, 3], [27, 36, 2.6]]), { bias: -1 });
  S.part('a', m => mLimb(m, [[51, 26 + b, 3.6], [49, 32 + b, 3], [37, 36, 2.6]]), { bias: -1 });
  S.part('g', m => { mEll(m, 22, 35, 1.6, 1.8); mEll(m, 42, 35, 1.6, 1.8); }, { round: 1, line: 'K' });   // 팔목 금 토시
  S.part('g', m => { mEll(m, 14.5, 30 + b, 1.8, 1.6); mEll(m, 49.5, 30 + b, 1.8, 1.6); }, { round: 1, line: 'K' });   // 팔꿈치 금장
  // 손잡이 · 코등이 — 굽은 끝, 둥근 머리
  S.part('g', m => mPoly(m, [[22, 38], [26, 37], [32, 39], [38, 37], [42, 38], [40, 41], [32, 41], [24, 41]]), { round: 1, line: 'K' });
  S.part('n', m => mRect(m, 31, 30 + b, 2, 8 - b), { line: 'K' });
  S.part('g', m => mEll(m, 32, 29.5 + b, 1.8, 1.6), { round: 1, line: 'K' });
  S.part('a', m => { mEll(m, 28.5, 35, 2.6, 2.2); mEll(m, 35.5, 35, 2.6, 2.2); }, { round: 2 });   // 장갑 낀 두 손
  S.pts([[27, 36], [37, 36]], 'a4');
  // 뿔 — 해골 뒤에서 (눈구멍을 덮지 않게 먼저 그림) 머리 양옆에서 밖으로 나갔다 하늘로 휨 (왼쪽이 조금 길고, 결 몇 줄)
  S.part('n', m => { mTube(m, [[26, 10 + b], [21, 8 + b], [18, 4 + b], [18, 0]], 2.2, 0.6); mTube(m, [[38, 10 + b], [43, 8 + b], [45, 4 + b], [44, 1]], 2, 0.6); }, { line: 'K', round: 2 });
  S.tone(at(b, [[21, 7], [19, 4], [43, 7]]), 3);
  // 머리 — 해골 투구, 눈구멍 속 붉은 불 · 이를 드러낸 턱
  S.part('o', m => { mEll(m, 32, 11 + b, 6.2, 6.4); mRect(m, 28, 14 + b, 9, 4); }, { round: 3 });
  S.pts(at(b, [[28, 10], [29, 10], [30, 10], [29, 11], [30, 11], [34, 10], [35, 10], [36, 10], [34, 11], [35, 11]]), 'void');
  S.pts(at(b, [[29, 10], [35, 10]]), 'eye');                                   // 두 눈 — 눈구멍 안 같은 자리 (앞을 봄)
  S.pts(at(b, [[32, 13], [31, 14]]), 'void');
  for (const x of [28, 30, 31, 33, 35, 36]) S.px(x, 17 + b, 'K');
  S.tone(at(b, [[28, 7], [29, 6], [31, 6]]), 3);
  // 관 — 이마를 두른 금띠, 끝 높이가 다름
  S.part('g', m => mPoly(m, [[26, 7 + b], [27, 4 + b], [29, 6 + b], [31, 3 + b], [33, 5 + b], [35, 2 + b], [36, 6 + b], [38, 4 + b], [38, 8 + b], [26, 9 + b]]), { round: 1, line: 'K' });
  S.px(32, 7 + b, 'eye');
  mottle(S, 'c', 227, 3, 0.76, 0.22);
  return S.outline();
}
out.demonking = pair(demonking(0), demonking(1), K, { view: '앞' });

module.exports = out;
