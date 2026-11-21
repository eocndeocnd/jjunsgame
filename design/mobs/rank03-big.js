// 3격 큰 몬스터 — 그리핀 로드 (정예 · 3칸 48) · 몰락한 왕 (보스 · 3칸 48) · 히드라 (정예 · 4칸 64)
// 5단계 입체 명암 + 손 세부, 눈 작게, 어둑한 색. 반복 무늬 없이 (깃털 · 비늘 · 장식은 자리마다 다르게)
const { Sprite, pair, mRect, mEll, mLine, mPoly, mTube, noise } = require('./lib2.js');
const K = '#35263f';
const out = {};
const at = (b, list) => list.map(([x, y]) => [x, y + b]);

// ---------- 그리핀 로드 (정예 · 3칸) — 옆모습, 독수리 앞몸 · 사자 뒷몸 · 펼친 큰 날개 · 금관 ----------
function griffinlord(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(48).mat('l', '#a07a44').mat('w', '#6a5038').mat('h', '#d0c8b4', { step: 0.12 }).mat('y', '#c8a040', { step: 0.12 }).mat('k', '#5a4a3a')
    .color('eye', '#e0b030').color('gem', '#b8203a');
  // 뒤 날개 (멀리, 어둡게)
  S.part('w', m => mPoly(m, f ? [[18, 20], [26, 12], [32, 10], [30, 18], [26, 22]] : [[16, 20], [14, 6], [18, 1], [21, 8], [24, 20]]), { bias: -1, round: 3 });
  // 꼬리 — 사자 꼬리, 끝 술
  S.part('l', m => mTube(m, [[10, 28 + b], [5, 30 + b], [3, 26 + b], [4, 22 + b]], 1.6, 1), { round: 1 });
  S.part('k', m => mEll(m, 4, 21 + b, 2, 2.4), { round: 2 });
  // 다리 — 뒤는 사자 다리, 앞은 새 발 (B 는 걸음)
  S.part('l', m => { mLine(m, 12, 32, f ? 11 : 10, 43, 4); mLine(m, 17, 32, f ? 18 : 19, 43, 4); }, { round: 2 });
  S.part('k', m => { mEll(m, f ? 11 : 10, 44, 2.6, 1.6); mEll(m, f ? 18 : 19, 44, 2.6, 1.6); }, { round: 1 });
  S.part('y', m => { mLine(m, 28, 33, f ? 28 : 27, 43, 2); mLine(m, 33, 33, f ? 33 : 34, 43, 2); }, { round: 1 });
  S.part('y', m => { mRect(m, f ? 26 : 25, 43, 5, 2); mRect(m, f ? 32 : 33, 43, 5, 2); }, { line: 'K', round: 1 });
  // 몸 — 사자 허리에서 깃털 가슴으로
  S.part('l', m => mEll(m, 17, 29 + b, 10, 6.5));
  S.part('h', m => mEll(m, 29, 27 + b, 7.5, 7.5));
  // 목 · 머리 — 흰 깃털 머리, 휜 금빛 부리
  S.part('h', m => { mTube(m, [[30, 24 + b], [34, 17 + b], [36, 13 + b]], 4.2, 3.4); mEll(m, 37.5, 11 + b, 5, 4.4); });
  S.part('y', m => mPoly(m, [[41, 9 + b], [46, 11 + b], [45, 14 + b], [42, 15 + b], [42, 12 + b]]), { line: 'K', round: 1 });
  // 금관 — 높이가 다른 끝 넷 · 가운데 홍옥
  S.part('y', m => { mRect(m, 33, 6 + b, 8, 2); mRect(m, 33, 4 + b, 1, 2); mRect(m, 35, 3 + b, 1, 3); mRect(m, 38, 2 + b, 1, 4); mRect(m, 40, 4 + b, 1, 2); }, { line: 'K', round: 1 });
  S.pts(at(b, [[37, 6]]), 'gem');
  // 앞 날개 (가까이) — 겹친 깃 세 줄 (끝 길이가 다름). B 는 내리침
  const wing = f
    ? [[24, 22], [36, 22], [44, 26], [41, 28], [43, 31], [38, 31], [39, 34], [30, 31], [24, 28]]
    : [[22, 24], [20, 12], [22, 2], [26, 1], [26, 6], [30, 5], [29, 11], [32, 12], [30, 18], [28, 25]];
  S.part('w', m => mPoly(m, wing), { round: 3 });
  const nz = noise(11, 2.2);
  S.each('w', (x, y, t) => t + (nz(x, y) > 0.68 ? 1 : nz(x, y) < 0.22 ? -1 : 0));
  // 깃 끝 줄 (짙게) — 자리마다 길이가 다른 줄 셋
  if (!f) { for (const [x0, y0, x1, y1] of [[22, 20, 23, 4], [24, 21, 27, 8], [26, 23, 30, 14]]) S.part('w', m => mLine(m, x0, y0, x1, y1, 1), { fixed: 0, line: false, cast: false }); }
  else { for (const [x0, y0, x1, y1] of [[27, 24, 40, 27], [27, 26, 37, 30], [28, 28, 34, 31]]) S.part('w', m => mLine(m, x0, y0, x1, y1, 1), { fixed: 0, line: false, cast: false }); }
  // 눈 · 깃털 가슴 결
  S.pts(at(b, [[38, 10]]), 'eye');
  S.tone(at(b, [[37, 9], [38, 9], [39, 9]]), 0);
  S.tone(at(b, [[27, 28], [30, 30], [25, 31], [32, 26], [29, 33]]), 1);
  S.tone(at(b, [[33, 15], [35, 14], [31, 22]]), 4);
  S.tone(at(b, [[12, 27], [15, 25], [20, 24], [22, 33]]), 1);
  return S.outline();
}
out.griffinlord = pair(griffinlord(0), griffinlord(1), K, { view: '옆모습' });

// ---------- 몰락한 왕 (보스 · 3칸) — 앞, 금이 간 옥좌에 앉은 마른 왕 · 기운 왕관 · 해진 보라 망토 · 홀 ----------
function fallenking(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(48).mat('t', '#6a6458', { step: 0.12 }).mat('g', '#b08a3a', { step: 0.12 }).mat('r', '#4e3460').mat('s', '#a89c84').mat('c', '#6a2030').mat('i', '#5c6274')
    .color('eye', '#80e0d0').color('void', '#140e14').color('gem', '#b8203a');
  // 옥좌 — 높은 등받이(금 간 돌 · 금테), 팔걸이
  S.part('t', m => { mPoly(m, [[11, 4], [16, 1], [24, 0], [32, 1], [37, 4], [36, 30], [12, 30]]); }, { round: 5 });
  S.part('g', m => { mLine(m, 12, 5, 16, 2, 1); mLine(m, 16, 2, 32, 2, 1); mLine(m, 32, 2, 36, 5, 1); mLine(m, 12, 5, 12, 29, 1); mLine(m, 36, 5, 36, 29, 1); }, { fixed: 2, line: false, cast: false });
  S.pts([[24, 0], [23, 1], [25, 1]], 'g3');
  for (const [x, y] of [[20, 6], [21, 7], [21, 8], [22, 9], [29, 10], [28, 11], [28, 12], [15, 18], [16, 19], [33, 22], [32, 23]]) S.px(x, y, 't0');   // 금 (길이 · 방향이 다름)
  S.part('t', m => { mRect(m, 7, 26, 8, 6); mRect(m, 33, 26, 8, 6); mRect(m, 9, 31, 30, 10); }, { round: 3 });   // 팔걸이 · 자리
  S.part('t', m => { mRect(m, 9, 40, 30, 6); }, { round: 2, bias: -1 });
  // 망토 — 자리에 늘어져 아래가 해짐
  S.part('r', m => mPoly(m, [[14, 16 + b], [34, 16 + b], [37, 40], [33, 42], [30, 39], [26, 43], [21, 40], [17, 42], [11, 40]]), { round: 4 });
  // 마른 몸 · 녹슨 가슴 갑옷
  S.part('i', m => mPoly(m, [[18, 17 + b], [30, 17 + b], [29, 29 + b], [19, 29 + b]]), { round: 3 });
  // 무릎 · 정강이 (앉음)
  S.part('r', m => { mEll(m, 19, 33, 4, 3); mEll(m, 29, 33, 4, 3); }, { round: 2 });
  S.part('s', m => { mRect(m, 17, 35, 3, 9); mRect(m, 28, 35, 3, 9); }, { round: 1 });
  // 팔 — 왼손은 팔걸이에, 오른손은 홀
  S.part('s', m => { mLine(m, 17, 19 + b, 12, 26, 2); mEll(m, 11.5, 26.5, 2, 1.6); }, { round: 1 });
  S.part('s', m => { mLine(m, 31, 19 + b, 35, 25, 2); mEll(m, 35.5, 25.5, 1.8, 1.6); }, { round: 1, bias: -1 });
  S.part('g', m => { mLine(m, 36, 34, 36, 14 + b, 1); mEll(m, 36, 12 + b, 2.2, 2.2); }, { line: 'K', round: 1 });
  S.pts(at(b, [[36, 12]]), 'gem');
  // 머리 — 해골 같은 얼굴 · 텅 빈 눈 속 희미한 빛 · 기운 왕관
  S.part('s', m => { mEll(m, 24, 12 + b, 4.6, 5); mRect(m, 22, 16 + b, 5, 2); }, { round: 2 });
  S.pts(at(b, [[22, 11], [23, 11], [26, 11], [27, 11], [22, 12], [27, 12]]), 'void');
  S.pts(at(b, [[22, 11], [26, 11]]), 'eye');
  S.pts(at(b, [[24, 14], [22, 16], [24, 16], [26, 16]]), 'void');
  S.part('g', m => mPoly(m, [[18, 8 + b], [29, 6 + b], [29, 8 + b], [19, 10 + b]]), { line: 'K', round: 1 });
  S.pts(at(b, [[19, 6], [23, 5], [26, 4], [28, 5]]), 'g3');   // 왕관 끝 — 높이가 다름 (기울어 짐)
  S.pts(at(b, [[19, 7], [23, 6], [26, 5], [28, 6]]), 'g2');
  // 망토 깃 (붉은 안감) · 해진 자리 · 갑옷 녹
  S.pts(at(b, [[15, 16], [16, 17], [32, 16], [33, 17]]), 'c2');
  S.tone([[13, 38], [22, 41], [31, 40], [16, 33], [32, 31]], 0);
  S.tone(at(b, [[21, 21], [26, 24], [20, 26]]), 1);
  S.tone(at(b, [[19, 18], [20, 18], [17, 13]]), 4);
  return S.outline();
}
out.fallenking = pair(fallenking(0), fallenking(1), K, { view: '앞 · 옥좌' });

// ---------- 히드라 (정예 · 4칸 64) — 대각선, 웅크린 몸에서 길이 · 굵기가 다른 목 다섯, 머리마다 다른 방향 ----------
function hydra(f) {
  const S = new Sprite(64).mat('g', '#3e5a48').mat('v', '#a89a62').mat('d', '#2a3a30').mat('h', '#c8bca0', { step: 0.12, shift: 6 }).color('eye', '#e0c040').color('tongue', '#a03028');
  // 꼬리 — 뒤로 휘어 감김
  S.part('g', m => mTube(m, [[16, 52], [8, 54], [3, 49], [6, 43], [11, 44]], 4, 1.2), { round: 3 });
  // 몸 — 웅크린 큰 덩어리 · 배
  S.part('g', m => mEll(m, 31, 49, 17, 10));
  S.part('v', m => mEll(m, 34, 54, 11, 4.5), { round: 2 });
  // 다리 — 짧고 굵게, 발톱
  S.part('g', m => { mRect(m, 18, 54, 6, 7); mRect(m, 40, 54, 6, 7); }, { round: 3 });
  S.part('h', m => { mRect(m, 17, 61, 8, 1); mRect(m, 39, 61, 8, 1); }, { line: 'K' });
  // 목 다섯 — 뒤에서 앞으로 (길이 · 굵기 · 휜 방향이 다름). B 는 엇갈려 흔듦 (짝수는 왼쪽, 홀수는 오른쪽으로)
  const sw = i => (f ? (i % 2 ? 1 : -1) : 0);
  const necks = [
    { pts: [[22, 44], [17, 34], [13, 24], [10, 16]], r: [3.4, 2.6], head: [8, 13], dir: -1 },
    { pts: [[40, 42], [46, 32], [50, 22], [52, 14]], r: [3.4, 2.6], head: [54, 11], dir: 1 },
    { pts: [[28, 42], [26, 30], [24, 20], [22, 9]], r: [3.8, 2.8], head: [22, 6], dir: -1 },
    { pts: [[35, 42], [38, 32], [40, 22], [41, 14]], r: [3.8, 2.8], head: [43, 11], dir: 1 },
    { pts: [[31, 45], [33, 37], [36, 29], [39, 24]], r: [4.2, 3.2], head: [42, 21], dir: 1 }
  ];
  necks.forEach((n, i) => {
    const s = sw(i), p = n.pts.map(([x, y], k) => [x + s * (k / 3) * 2, y]);
    const [hx, hy] = [n.head[0] + s * 2, n.head[1]];
    S.part('g', m => mTube(m, p, n.r[0], n.r[1]), { round: 3, bias: i < 2 ? -1 : 0 });
    S.part('g', m => { mEll(m, hx, hy, 4.2, 3.2); mPoly(m, [[hx + n.dir * 2, hy - 1], [hx + n.dir * 6.5, hy + 0.5], [hx + n.dir * 6, hy + 2.5], [hx + n.dir * 1, hy + 2.5]]); }, { round: 2, bias: i < 2 ? -1 : 0 });
    S.part('h', m => { mLine(m, hx - n.dir * 1, hy - 2, hx - n.dir * 4, hy - 5 - (i % 3), 1); }, { line: 'K' });   // 뿔 — 길이가 머리마다 다름
    S.px(Math.round(hx + n.dir * 1), Math.round(hy - 1), 'eye');
    S.px(Math.round(hx + n.dir * 1), Math.round(hy - 2), 'd0');
    if (i === 4 || (f && i === 2)) { S.px(Math.round(hx + n.dir * 7), Math.round(hy + 2), 'tongue'); S.px(Math.round(hx + n.dir * 8), Math.round(hy + 3), 'tongue'); }   // 혀 (가운데 머리 · B 의 다른 머리)
    for (let x = 0; x < 4; x++) S.px(Math.round(hx + n.dir * (2 + x)), Math.round(hy + 1.5), x === 3 ? 'h4' : 'K');   // 입
  });
  // 비늘 얼룩 · 등 가시 (자리마다 다르게)
  const nz = noise(23, 3.1);
  S.each('g', (x, y, t) => t + (nz(x, y) > 0.72 ? 1 : nz(x, y) < 0.2 ? -1 : 0));
  S.pts([[22, 40], [27, 39], [33, 38], [39, 39], [44, 41]], 'h3');
  S.pts([[23, 39], [34, 37], [43, 40]], 'h2');
  return S.outline();
}
out.hydra = pair(hydra(0), hydra(1), K, { view: '대각선 · 다섯 머리' });

module.exports = out;
