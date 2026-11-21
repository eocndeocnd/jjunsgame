// 3격 1칸 몬스터 (16) — 부위마다 입체 명암(5단계) + 손 세부, 눈 1점, 어둑한 색
const { Sprite, pair, mRect, mEll, mLine, mPoly, mTube } = require('./lib2.js');
const K = '#35263f';
const out = {};
const at = (b, list) => list.map(([x, y]) => [x, y + b]);

// ---------- 하피 퀸 — 앞, 금관 · 헝클어진 검은 머리 · 큰 보랏빛 날개 · 노래하는 입 ----------
function harpyqueen(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(16).mat('p', '#5e4a72').mat('k', '#4a3a50').mat('s', '#b0907a').mat('y', '#a08a50').mat('g', '#c8a040', { step: 0.12 }).color('eye', '#e0b030');
  // 날개 — 양옆 (B 는 한 점 들어 올림)
  S.part('p', m => { mPoly(m, [[6, 7 - b], [0, 5 - b], [0, 10 - b], [5, 12]]); }, { round: 2, min: 1, cast: false });
  S.part('p', m => { mPoly(m, [[10, 7 - b], [15, 5 - b], [15, 10 - b], [11, 12]]); }, { round: 2, min: 1, cast: false });
  // 다리 (새 다리)
  S.part('y', m => { mRect(m, 6, 12, 1, 3); mRect(m, 9, 12, 1, 3); mRect(m, 5, 15, 3, 1); mRect(m, 8, 15, 3, 1); }, { line: false });
  // 몸 — 깃털 치마 · 가슴
  S.part('p', m => mPoly(m, [[5, 8], [11, 8], [12, 13], [4, 13]]), { round: 2, min: 1, cast: false });
  S.part('s', m => mEll(m, 8, 8, 2.4, 1.6), { round: 1, min: 2, cast: false });
  // 머리 · 헝클어진 머리칼
  S.part('k', m => { mEll(m, 8, 4.5, 3.6, 3.4); mRect(m, 4, 5, 2, 4); mRect(m, 10, 5, 2, 3); }, { round: 2, min: 1, cast: false });
  S.part('s', m => mEll(m, 8, 5, 2, 2), { round: 1, min: 2, cast: false });
  // 금관 — 뾰족한 끝 셋 (높이가 다름)
  S.pts([[5, 1], [8, 0], [10, 1]], 'g3');
  S.pts([[5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [8, 1]], 'g2');
  S.pts([[6, 2]], 'g4');
  // 눈 · 노래하는 입
  S.pts([[7, 5], [9, 5]], 'eye');
  S.pts([[8, 6]], 'K');
  // 깃털 결
  S.tone([[2, 7 - b], [13, 8 - b], [6, 11], [10, 11]], 0);
  S.tone([[1, 6 - b], [12, 6 - b]], 4);
  return S.outline();
}
out.harpyqueen = pair(harpyqueen(0), harpyqueen(1), K, { view: '앞' });

// ---------- 코카트리스 — 옆모습, 수탉 몸 · 붉은 볏 · 박쥐 날개 · 뱀 꼬리 ----------
function cockatrice(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(16).mat('c', '#7a6a3a').mat('w', '#4e5a3a').mat('e', '#4a6a3a').mat('r', '#a03028').mat('y', '#c8a040', { step: 0.12 }).color('eye', '#e0d040');
  // 뱀 꼬리 — 뒤로 말려 올라감
  S.part('e', m => mTube(m, [[5, 9], [2, 9], [1, 6], [3, 4 + b]], 1.4, 0.6), { round: 1 });
  // 다리
  S.part('y', m => { mRect(m, 6, 12, 1, 3); mRect(m, f ? 9 : 8, 12, 1, 3); mRect(m, 5, 14, 3, 1); mRect(m, f ? 8 : 7, 14, 3, 1); }, { line: false });
  // 몸
  S.part('c', m => mEll(m, 7.5, 9.5, 3.8, 3), { min: 1, cast: false });
  // 날개 — 박쥐 같은 막 (B 는 펄럭)
  S.part('w', m => mPoly(m, f ? [[6, 8], [11, 6], [10, 10], [7, 11]] : [[6, 8], [10, 4], [11, 8], [7, 10]]), { round: 1, min: 1 });
  // 목 · 머리 · 부리 (B 는 머리를 한 점 숙임)
  S.part('c', m => { mLine(m, 10, 8, 11, 5 + b, 2); mEll(m, 11.5, 4 + b, 2, 1.8); }, { round: 1, min: 1 });
  S.part('y', m => mPoly(m, [[13, 3 + b], [15, 4 + b], [13, 5 + b]]), { line: 'K' });
  // 볏 · 턱볏
  S.pts(at(b, [[10, 1], [11, 2], [12, 1], [11, 1]]), 'r2');
  S.pts(at(b, [[13, 6]]), 'r1');
  // 눈
  S.pts(at(b, [[12, 4]]), 'eye');
  S.tone([[6, 11], [9, 11]], 1);
  return S.outline();
}
out.cockatrice = pair(cockatrice(0), cockatrice(1), K, { view: '옆모습' });

// ---------- 다크 나이트 — 대각선, 텅 빈 투구 (어둠 속 보랏빛 눈 둘) · 검은 갑옷 · 붉은 망토 · 장검 ----------
function darkknight(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(16).mat('a', '#5c6274', { step: 0.13 }).mat('c', '#7a2a32').mat('s', '#a8b0bc', { step: 0.12 }).color('eye', '#b070e0').color('void', '#100c14');
  // 망토 (뒤)
  S.part('c', m => mPoly(m, [[4, 5 + b], [10, 5 + b], [12, 14], [3, 14]]), { round: 2, min: 1 });
  // 다리 (B 는 걸음)
  S.part('a', m => { mRect(m, 5, 11, 2, f ? 3 : 4); mRect(m, 8, 11, 2, 4); }, { round: 1, min: 1 });
  // 몸 · 팔
  S.part('a', m => mPoly(m, [[4, 6 + b], [10, 6 + b], [9, 12 + b], [5, 12 + b]]), { round: 2, min: 1, cast: false, line: false });
  // 장검 — 오른손에 비스듬히
  S.part('s', m => mLine(m, 11, 11 + b, 15, 3 + b, 1), { line: 'K' });
  S.part('a', m => { mEll(m, 10.5, 10.5 + b, 1.6, 1.5); }, { min: 2 });
  S.part('a', m => mEll(m, 3.5, 10 + b, 1.5, 1.6), { min: 1 });
  // 투구 — 앞이 트인 투구 속은 어둠
  S.part('a', m => { mEll(m, 7, 3.5 + b, 3.2, 3); }, { round: 2, min: 1 });
  S.pts(at(b, [[6, 3], [7, 3], [8, 3], [6, 4], [7, 4], [8, 4]]), 'void');
  S.pts(at(b, [[6, 3], [8, 3]]), 'eye');
  S.pts(at(b, [[7, 0]]), 'c2');   // 투구 깃
  // 갑옷 판 이음 · 반짝임
  S.tone(at(b, [[7, 8], [7, 9], [5, 7]]), 1);
  S.tone(at(b, [[5, 2], [4, 3]]), 4);
  return S.outline();
}
out.darkknight = pair(darkknight(0), darkknight(1), K, { view: '대각선' });

module.exports = out;
