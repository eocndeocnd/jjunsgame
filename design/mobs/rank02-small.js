// 2격 1칸 6마리 — 손으로 5단계 (a 가장 어두움 … e 가장 밝음, 둘째 재질 p … t), 눈 1픽셀, 어둑한 색. 바깥 테두리는 자동
const { ramp } = require('./lib2.js');
const L = require('./lib.js');
const K = '#35263f';
const auto = rows => L.toRows(L.outline(L.fromRows(rows)));
const tones = (r, ks = 'abcde') => Object.fromEntries([...ks].map((k, i) => [k, r[i]]));
const out = {};

// 오크 전사 — 대각선, 상투 · 엄니 · 가죽 흉갑 · 큰 칼
{
  const A = [
    '................',
    '......kk........',
    '.....kddck......',
    '....deeddcb.....',
    '...ddKKddKKb....',
    '...ddRcddRcb....',
    '...dccbbcccb..m.',
    '...cWKKKKKWb.mm.',
    '..ddccccccbbmm..',
    '.deqssssssqbwm..',
    '.dcsstsssrqcw...',
    '.ccssssssrqbc...',
    '.cbqqqqqqqqbb...',
    '...rrr..rrr.....',
    '...cbb..cbb.....',
    '................'
  ];
  const B = A.slice(0, 13).concat(['....rrr.rrr.....', '....cbb.cbb.....', '................']);
  const leather = ramp('#6a4630'), metal = ramp('#9aa2b0', { step: 0.12 });
  out.orc = { view: '대각선', pal: { K, ...tones(ramp('#6a7c46')), ...tones(leather, 'pqrst'), m: metal[3], w: ramp('#6a4a32')[2], k: '#2a2228', R: '#c8302a', W: '#d8d0b8' }, a: auto(A), b: auto(B) };
}

// 홉고블린 — 대각선, 투구 · 군용 방패 · 창
{
  const A = [
    '.............m..',
    '.....mmmmm..mmm.',
    '....mnnnnnm..w..',
    '...dmnnnnnnc.w..',
    '...dKRddKRcb.w..',
    '...dcccbcccb.w..',
    '....cKKKKcb..w..',
    '...mmmmmmnno.w..',
    '.ppqmmnnnnnocw..',
    '.ptqmnnnnnoocw..',
    '.pqqnnnnnnoobw..',
    '.pqq.nnnnooo.w..',
    '..p..hhhhhh..w..',
    '....cb...cb.....',
    '....ba...ba.....',
    '................'
  ];
  const B = A.slice(0, 13).concat(['.....cb.cb......', '.....ba.ba......', '................']);
  const metal = ramp('#7c8496'), shield = ramp('#6e4c30');
  out.hobgoblin = { view: '대각선', pal: { K, ...tones(ramp('#a65a36')), m: metal[3], n: metal[2], o: metal[1], ...tones(shield, 'pqrst'), h: ramp('#5a3a2a')[1], w: ramp('#6a4a32')[2], R: '#c8302a' }, a: auto(A), b: auto(B) };
}

// 리저드맨 — 옆모습, 주둥이 · 노란 배 · 꼬리
{
  const A = [
    '................',
    '................',
    '........ddc.....',
    '.......deedccc..',
    '.......dKRccccb.',
    '........cbKKKb..',
    '.......dcbb.....',
    '......dcvvb.....',
    '.....dcvwvcbcc..',
    '.....ccvvvcb....',
    '...bbccvvcb.....',
    '.bbb.ccccb......',
    'bb...cb.cb......',
    '.....cb..cb.....',
    '....bba..bba....',
    '................'
  ];
  const B = A.slice(0, 12).concat(['.bb..cb.cb......', 'b.....cbcb......', '.....bba.bba....', '................']);
  const belly = ramp('#b4a064');
  out.lizardman = { view: '옆모습', pal: { K, ...tones(ramp('#4c7a56')), v: belly[2], w: belly[3], R: '#d8b030' }, a: auto(A), b: auto(B) };
}

// 하피 — 앞, 헝클어진 머리 · 깃털 날개 · 새 다리
{
  const A = [
    '................',
    '......kkk.......',
    '.....kkkkk......',
    '....kkfgfkk.....',
    '....kfYfYfk.....',
    '....kkfffkk.....',
    '...k..fff..k....',
    'ppp..qrrrq..ppp.',
    'pqqp.qrsrq.pqqp.',
    'pqrqpqrsrqpqrqp.',
    '.pqrqqrrqqqrqp..',
    '..pqqqrrrqqqp...',
    '....qq...qq.....',
    '.....y...y......',
    '....yyy.yyy.....',
    '................'
  ];
  const B = [
    '................',
    '......kkk.......',
    '.....kkkkk......',
    '....kkfgfkk.....',
    '....kfYfYfk.....',
    'p...kkfffkk...p.',
    'pq.k..fff..k.qp.',
    'pqrp.qrrrq.prqp.',
    '.pqqqqrsrqqqqp..',
    '..pqqqrsrqqqp...',
    '...pqqrrqqqp....',
    '....pqrrrqp.....',
    '....qq...qq.....',
    '.....y...y......',
    '....yyy.yyy.....',
    '................'
  ];
  const skin = ramp('#b48c78'), feather = ramp('#6a5a7c'), leg = ramp('#a08a50');
  out.harpy = { view: '앞', pal: { K, f: skin[2], g: skin[3], k: ramp('#3c2c40')[1], ...tones(feather, 'pqrst'), y: leg[2], Y: '#d8b030' }, a: auto(A), b: auto(B) };
}

// 다크 엘프 자객 — 대각선, 두건 · 뾰족 귀 · 양손 단검
{
  const A = [
    '................',
    '......ppp.......',
    '.....pqqqp......',
    '....pqrqqqp.....',
    '...pqsssssqp....',
    '..sKpsYssYqps...',
    '....qsssssq.....',
    '.....qsKsq......',
    '....pqqrqqp.....',
    '..m.pqrtrqp.m...',
    '..msqqrrrqqsm...',
    '....pqqrqqp.....',
    '....pq.q.qp.....',
    '....qp...pq.....',
    '....kk...kk.....',
    '................'
  ];
  const B = A.slice(0, 12).concat(['.....pqqqp......', '.....qp.pq......', '.....kk.kk......', '................']);
  B[9] = '...m.pqrtrqpm...'; B[10] = '...msqqrrrqqsm..';
  const cloak = ramp('#3e3456'), skin = ramp('#70709a'), metal = ramp('#b0b8c8', { step: 0.12 });
  out.darkelf = { view: '대각선', pal: { K, ...tones(cloak, 'pqrst'), s: skin[2], m: metal[3], k: ramp('#2a2230')[2], Y: '#b8d040' }, a: auto(A), b: auto(B) };
}

// 가고일 — 대각선, 돌 피부 · 뿔 · 박쥐 날개 · 웅크림
{
  const A = [
    '................',
    '...n.......n....',
    '...nn.....nn....',
    'pp..dddddc...pp.',
    'ppp.deedccb.ppp.',
    'pqpddKRdKRbcpqp.',
    'pqqpdccbcccbqqp.',
    '.pqqcKKKKKcqqp..',
    '..pqdcccccbqp...',
    '...ddcccccbb....',
    '..dcdcbcbcbcb...',
    '..ccdccbcccbb...',
    '...ccbbbbbcb....',
    '...cbb...cbb....',
    '..cba.....cba...',
    '................'
  ];
  const B = A.slice();
  B[3] = '....dddddc......'; B[4] = 'pp..deedccb..pp.'; B[5] = 'pqpddKRdKRbcpqp.'; B[6] = 'pqqpdccbcccbpqqp'; B[7] = '.pqqcKKKKKcqqqp.';
  const stone = ramp('#7c7c84', { step: 0.12 }), wing = ramp('#5c5a68');
  out.gargoyle = { view: '대각선', pal: { K, ...tones(stone), ...tones(wing, 'pqrst'), n: ramp('#a09888')[3], R: '#d8402a' }, a: auto(A), b: auto(B) };
}
module.exports = out;
