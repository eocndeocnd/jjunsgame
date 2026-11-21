// 5격 (죽은 자의 도시) 1칸 몬스터 (16) — 부위마다 입체 명암(5단계) + 손 세부, 눈 1점, 어둑한 색, 반복 무늬 없이
const { Sprite, pair, mRect, mEll, mLine, mPoly, mTube } = require('./lib2.js');
const K = '#35263f';
const out = {};
const at = (b, list) => list.map(([x, y]) => [x, y + b]);

// ---------- 구울 — 옆모습, 잔뜩 웅크린 잿빛 몸 · 길게 늘어진 팔 · 갈고리 손톱 · 넝마 ----------
function ghoul(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(16).mat('s', '#7c8670').mat('r', '#4e4438').mat('c', '#cfc6ae', { step: 0.12 }).color('eye', '#d8dc50');
  // 뒷다리 · 앞다리 (B 는 걸음을 바꿈)
  S.part('s', m => { mTube(m, [[5, 10], [4, 13], [f ? 5 : 3, 15]], 1.2, 0.9); mTube(m, [[8, 10], [9, 13], [f ? 8 : 10, 15]], 1.2, 0.9); }, { round: 1 });
  // 등 — 앞으로 굽은 몸
  S.part('s', m => mPoly(m, [[3, 8], [6, 5 + b], [10, 5 + b], [12, 8 + b], [10, 11], [4, 11]]), { round: 2, min: 1 });
  // 넝마 — 허리에 걸침, 끝이 들쭉날쭉
  S.part('r', m => mPoly(m, [[3, 9], [9, 9], [10, 11], [8, 12], [7, 11], [5, 13], [4, 11]]), { round: 1 });
  // 머리 — 앞으로 쑥 내밂
  S.part('s', m => mEll(m, 12, 6 + b, 2.2, 2), { round: 1, min: 1 });
  // 팔 — 땅에 닿을 듯 늘어짐 · 갈고리 손톱
  S.part('s', m => mTube(m, [[10, 8 + b], [12, 11 + b], [13, 13 + b]], 1, 0.7), { bias: -1 });
  S.pts(at(b, [[14, 13], [14, 14], [13, 14]]), 'c2');
  S.pts(at(b, [[15, 14]]), 'c3');
  S.pts(at(b, [[13, 5]]), 'eye');
  S.pts(at(b, [[14, 7]]), 'K');                               // 벌린 입
  S.tone(at(b, [[6, 6], [8, 6]]), 3);                         // 드러난 등뼈
  S.tone(at(b, [[7, 7]]), 1);
  return S.outline();
}
out.ghoul = pair(ghoul(0), ghoul(1), K, { view: '옆모습' });

// ---------- 레이스 — 앞, 발 없이 떠 있는 두건 쓴 넝마 · 어둠 속 푸른 눈 둘 · 아래 끝이 바람에 흩날림 ----------
function wraith(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(16).mat('c', '#46506a').mat('w', '#7a98b0').color('void', '#0e0c16').color('eye', '#a0e8f4');
  // 넝마 자락 — 아래로 갈수록 갈라짐 (B 는 반대로 흩날림)
  S.part('c', m => mPoly(m, f
    ? [[4, 6], [12, 6], [13, 11], [12, 14], [10, 12], [9, 15], [7, 12], [5, 14], [4, 11]]
    : [[4, 6], [12, 6], [13, 11], [11, 15], [10, 12], [8, 14], [6, 12], [4, 15], [3, 11]]), { round: 2, min: 1 });
  // 팔 — 소매 끝이 길게 늘어짐
  S.part('c', m => { mTube(m, [[4, 7 + b], [2, 10 + b], [1, 12 + b]], 1.2, 0.6); mTube(m, [[12, 7 + b], [14, 9 + b], [15, 12 + b]], 1.2, 0.6); }, { bias: -1, round: 1 });
  // 두건
  S.part('c', m => mEll(m, 8, 4.5 + b, 3.4, 3.4), { round: 2, min: 1 });
  S.pts(at(b, [[7, 4], [8, 4], [9, 4], [7, 5], [8, 5], [9, 5], [8, 6]]), 'void');
  S.pts(at(b, [[7, 4], [9, 5]]), 'eye');
  // 넝마 속 푸른 빛 몇 줄기 (길이 · 자리가 다름)
  S.pts([[6, 9], [6, 10], [10, 8], [9, 11], [9, 12]], 'w1');
  S.pts([[5, 2 + b]], 'w3');
  return S.outline();
}
out.wraith = pair(wraith(0), wraith(1), K, { view: '앞' });

// ---------- 뱀파이어 — 대각선, 창백한 얼굴 · 넘긴 검은 머리 · 높은 깃의 망토(안은 검붉게) ----------
function vampire(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(16).mat('k', '#2e2836').mat('l', '#7a2232').mat('s', '#c4bcc0', { step: 0.1 }).mat('h', '#26202e').color('eye', '#e04848');
  // 망토 — 등 뒤로 넓게, 안감이 보임 (B 는 자락이 한 점 흔들림)
  S.part('k', m => mPoly(m, [[3, 5], [13, 5], [14, 14], [9, 13], [7, 15], [2, 14]]), { round: 2, min: 1 });
  S.part('l', m => mPoly(m, f ? [[4, 8], [6, 8], [6, 14], [3, 14]] : [[4, 8], [6, 8], [6, 13], [3, 13]]), { round: 1, min: 1 });
  // 다리
  S.part('k', m => { mRect(m, 7, 11, 2, f ? 3 : 4); mRect(m, 10, 11, 2, 4); }, { min: 1 });
  // 몸 — 조끼
  S.part('k', m => mPoly(m, [[6, 6 + b], [12, 6 + b], [12, 11 + b], [6, 11 + b]]), { round: 2, min: 1, cast: false });
  S.pts(at(b, [[9, 7], [9, 8]]), 's3');                         // 셔츠 깃
  // 높은 깃
  S.part('l', m => { mPoly(m, [[5, 3 + b], [7, 5 + b], [5, 6 + b]]); mPoly(m, [[13, 3 + b], [12, 6 + b], [11, 5 + b]]); }, { round: 1, min: 1 });
  // 머리 · 넘긴 머리칼 (이마가 뾰족)
  S.part('s', m => mEll(m, 9, 4 + b, 2.4, 2.4), { round: 1, min: 2 });
  S.part('h', m => { mRect(m, 7, 1 + b, 5, 2); mRect(m, 11, 2 + b, 1, 3); }, { round: 1, line: false });
  S.pts(at(b, [[9, 3]]), 'h1');
  S.pts(at(b, [[10, 4]]), 'eye');
  S.pts(at(b, [[10, 6]]), 'K');
  S.tone([[4, 10], [12, 12]], 0);
  S.tone([[4, 6]], 3);
  return S.outline();
}
out.vampire = pair(vampire(0), vampire(1), K, { view: '대각선' });

// ---------- 밴시 — 대각선, 떠 있는 가녀린 여인 · 뒤로 길게 흩날리는 흰 머리 · 크게 벌린 입 · 아래가 흐릿한 옷 ----------
function banshee(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(16).mat('d', '#6e8090').mat('h', '#c6ccd4', { step: 0.1 }).mat('s', '#aebcc6', { step: 0.1 }).color('eye', '#e8fcff').color('void', '#14101c');
  // 머리칼 — 뒤(왼쪽)로 길게 흩날림 (B 는 끝이 위로)
  S.part('h', m => mPoly(m, f ? [[7, 1], [11, 1], [11, 4], [8, 6], [5, 5], [2, 4], [0, 5], [2, 2], [5, 2]] : [[7, 1], [11, 1], [11, 4], [8, 6], [5, 6], [2, 6], [0, 8], [1, 5], [4, 3]]), { round: 1, min: 1 });
  // 옷 — 가는 몸, 아래로 퍼지며 갈라짐
  S.part('d', m => mPoly(m, [[7, 6], [10, 6], [12, 12], [11, 15], [10, 13], [8, 15], [7, 13], [5, 14], [6, 10]]), { round: 2, min: 1 });
  // 팔 — 앞(오른쪽)으로 뻗음
  S.part('s', m => mTube(m, [[10, 7 + b], [13, 6 + b], [15, 5 + b]], 0.8, 0.6), { round: 1 });
  S.part('s', m => mTube(m, [[7, 7 + b], [5, 9 + b]], 0.8, 0.6), { round: 1, bias: -1 });
  // 얼굴 — 울부짖는 입
  S.part('s', m => mEll(m, 9.5, 3.5 + b, 1.8, 2.2), { round: 1, min: 2 });
  S.pts(at(b, [[10, 3]]), 'eye');
  S.pts(at(b, [[10, 5], [10, 6]]), 'void');
  S.tone([[8, 11], [10, 9]], 0);
  return S.outline();
}
out.banshee = pair(banshee(0), banshee(1), K, { view: '대각선' });

// 서큐버스는 2칸으로 (rank05-mid.js — 사용자 요청 2026-11-22)

// ---------- 인큐버스 — 대각선, 굽은 큰 뿔 · 검붉은 살갗 · 어깨의 망토 · 접은 날개 · 금빛 눈 ----------
function incubus(f) {
  const b = f ? 1 : 0;
  const S = new Sprite(16).mat('w', '#4a2226').mat('s', '#8e5650').mat('c', '#2c2230').mat('n', '#c8b89a', { step: 0.12 }).mat('h', '#221a24').color('eye', '#f0b030');
  // 접은 날개 — 등 뒤로 위로 솟음 (B 는 한 점 펼침)
  S.part('w', m => mPoly(m, f ? [[5, 5], [2, 1], [1, 6], [4, 10]] : [[5, 5], [3, 0], [2, 5], [4, 10]]), { round: 1, min: 1, cast: false });
  // 망토
  S.part('c', m => mPoly(m, [[4, 6 + b], [12, 6 + b], [13, 14], [3, 14]]), { round: 2, min: 1 });
  // 다리 (B 는 걸음)
  S.part('c', m => { mRect(m, 6, 12, 2, f ? 3 : 4); mRect(m, 9, 12, 2, 4); }, { min: 1 });
  // 몸 — 드러난 가슴
  S.part('s', m => mPoly(m, [[6, 6 + b], [11, 6 + b], [10, 11 + b], [7, 11 + b]]), { round: 2, min: 1, cast: false });
  // 머리
  S.part('s', m => mEll(m, 9, 4 + b, 2.2, 2.2), { round: 1, min: 1 });
  S.part('h', m => mRect(m, 7, 1 + b, 4, 2), { line: false });
  // 뿔 — 뒤로 굽음 (크기가 다름)
  S.pts(at(b, [[7, 0], [6, 0], [5, 1]]), 'n2');
  S.pts(at(b, [[11, 0], [12, 0], [13, 1], [13, 2]]), 'n3');
  S.pts(at(b, [[10, 4]]), 'eye');
  S.tone(at(b, [[8, 8], [9, 9]]), 1);
  S.tone(at(b, [[7, 7]]), 3);
  return S.outline();
}
out.incubus = pair(incubus(0), incubus(1), K, { view: '대각선' });

module.exports = out;
