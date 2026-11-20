// 1격 1칸 8마리 — 손으로 5단계 (a 가장 어두움 … e 가장 밝음), 눈 1픽셀, 어둑한 색
const { ramp } = require('./lib2.js');
const L = require('./lib.js');
const K = '#35263f';
const auto = rows => L.toRows(L.outline(L.fromRows(rows)));
const tones = (r, ks = 'abcde') => Object.fromEntries([...ks].map((k, i) => [k, r[i]]));
const out = {};

// 슬라임 — 앞
{
  const A = [
    '................', '................', '................', '................', '................',
    '......KKKK......',
    '....KKdeedKK....',
    '...KdeedcccbK...',
    '..KdedccccccbK..',
    '..KdccccccccbK..',
    '.KccKcccccKcbbK.',
    '.KcccccccccbbbK.',
    '.KcccccccbbbbaK.',
    '.KbccccbbbbbaaK.',
    '..KabbbbbbaaaK..',
    '...KKKKKKKKKK...'
  ];
  const B = [
    '................', '................', '................', '................', '................', '................',
    '................',
    '.....KKKKKK.....',
    '...KKdeeddcKK...',
    '..KdeedccccccbK.',
    '.KdedcccccccbbK.',
    'KccKccccccKccbbK',
    'KccccccccccbbbbK',
    'KbcccccccbbbbaaK',
    '.KabbbbbbbbaaaK.',
    '..KKKKKKKKKKKK..'
  ];
  out.slime = { view: '앞', pal: { K, ...tones(ramp('#3f9440')) }, a: A, b: B };
}

// 자이언트 랫 — 옆모습
{
  const A = [
    '................', '................', '................', '................', '................', '................', '................',
    '....KKKKK.KqK...',
    '...KdeeddKKqKK..',
    '..KdedccccccdcK.',
    '..KdcccccccccRcK',
    'qqKcccccccccccbp',
    'q.KbccccccbbbKK.',
    '..KabbbbbbbbaK..',
    '...KqK.KqK.KqK..',
    '...KK..KK..KK...'
  ];
  const B = A.slice(0, 11).concat(['.qKcccccccccccbp', 'qKKbccccccbbbKK.', '..KabbbbbbbbaK..', '..KqK.KqK.KqK...', '..KK..KK..KK....']);
  const pink = ramp('#b87880');
  out.giantrat = { view: '옆모습', pal: { K, ...tones(ramp('#74665c')), q: pink[2], p: pink[1], R: '#c8302a' }, a: A, b: B };
}

// 고블린 — 대각선
{
  const A = [
    '................',
    '.....KKKKKK.....',
    'KKK.KeddccbK.KK.',
    'KdcKedddcccbKcbK',
    '.KdcccKKccKKcbK.',
    '..KccKRKcbRKbK..',
    '..KbcccKKKcbbK..',
    '...KabcccccbKKmK',
    '..KKKKaabbaKKwmK',
    '.KdcKedccccKKwnK',
    '.KccKcccccbKcwK.',
    '.KcbKKqqqqKKbwK.',
    '..KKKbKqpKbKKw..',
    '...KdcKppKdcK...',
    '..KdcbK..KdcbK..',
    '..KKKKK..KKKKK..'
  ];
  const B = ['................'].concat(A.slice(0, 13), ['..KdcbK.KdcbK...', '..KKKKK.KKKKK...']);
  const cloth = ramp('#7c4c34'), metal = ramp('#a8b0c0', { step: 0.12 });
  out.goblin = { view: '대각선', pal: { K, ...tones(ramp('#5a9030')), p: cloth[1], q: cloth[2], m: metal[4], n: metal[2], w: ramp('#80583a')[2], R: '#c8302a' }, a: A, b: B };
}

// 코볼트 — 대각선 (테두리 자동)
{
  const A = [
    '................', '................', '................',
    '......b.b.......',
    '.....deedddc....',
    '.....dKYdccccccb',
    '.....ccccccccbb.',
    '......cbKKKKKb..',
    '.......ccbb.....',
    '....dcvvvvbb....',
    '...dcKwvvvKcb...',
    '.bcccKvvvvKbc...',
    'bb...ccKcbb.....',
    '.....cb..cb.....',
    '.....ab..ab.....',
    '................'
  ];
  const B = A.slice(0, 13).concat(['......cbcb......', '......abab......', '................']);
  const belly = ramp('#c0a066');
  out.kobold = { view: '대각선', pal: { K, ...tones(ramp('#a05a30')), v: belly[2], w: belly[3], Y: '#d8b838' }, a: auto(A), b: auto(B) };
}

// 해골 — 대각선
{
  const A = [
    '................',
    '.....KKKKKK.....',
    '....KeeddccK....',
    '...KeddddcccK...',
    '...KdKKddKKcK...',
    '...KdKRdcKRbK...',
    '...KcccKcccbK...',
    '....KcKcKcKK....',
    '....KKKbbKKK....',
    '..KdKdddccbKcK..',
    '..KbKKKbKKKKbK..',
    '..KdKcccbbaKcK..',
    '..KcKKKbKKKKbK..',
    '...KKKcbbaKKK...',
    '....KcK..KbK....',
    '...KdcK..KcbK...'
  ];
  const B = ['................', '................'].concat(A.slice(1, 14), ['....KdcKKcbK....']);
  out.skeleton = { view: '대각선', pal: { K, ...tones(ramp('#b4ac96', { step: 0.12 })), R: '#c8302a' }, a: A, b: B };
}

// 좀비 — 대각선, 두 팔을 앞으로 (테두리 자동)
{
  const A = [
    '................', '................',
    '.....edddc......',
    '....eddddcb.....',
    '....dKRdKRb.....',
    '....dddccbb.....',
    '.....cKKKb......',
    '....yyxxww......',
    '...yyxxxwwdddcb.',
    '...yxxdxxwccbba.',
    '...xxxxxww......',
    '...xxwxxxv......',
    '....qqqpp.......',
    '....qp.qp.......',
    '...dcb.dcb......',
    '................'
  ];
  const B = A.slice();
  B[8] = '...yyxxxww......'; B[9] = '...yxxdxxwdddcb.'; B[10] = '...xxxxxwwccbba.';
  B[13] = '...qp...qp......'; B[14] = '..dcb...dcb.....';
  const shirt = ramp('#4a5878'), pants = ramp('#5a4a40');
  out.zombie = { view: '대각선', pal: { K, ...tones(ramp('#788a60')), v: shirt[0], w: shirt[1], x: shirt[2], y: shirt[3], p: pants[1], q: pants[2], R: '#c8302a' }, a: auto(A), b: auto(B) };
}

// 임프 — 대각선, 박쥐 날개 · 꼬리 · 작은 삼지창 (테두리 자동)
{
  const A = [
    '................',
    '............m.m.',
    '....n...n...mmm.',
    '....eddddc...M..',
    'vw..dKYdKYc..M..',
    'vwwwdddccbbwvM..',
    '.vwwwcKKKbwwvM..',
    '..vw.dddcb.vdMd.',
    '....ddcccbbdcM..',
    '....dccccbb..M..',
    '....ccccccb..M..',
    '...b.cb.cb......',
    '..bb.cb.cb......',
    '.bbb.ab.ab......',
    '................',
    '................'
  ];
  const B = L.shiftRows(A, 1, 10, 1);
  B[4] = '....eddddc...M..'; B[5] = '....dKYdKYc..M..'; B[6] = 'vwwwdddccbb..M..'; B[7] = 'vwwwwcKKKbwwvM..';
  B[11] = '...b.ccccbb..M..'; B[12] = '..bb.cb..cb.....'; B[13] = '.bbb.ab..ab.....';
  const wing = ramp('#4c2648'), metal = ramp('#9aa0b0');
  out.imp = { view: '대각선', pal: { K, ...tones(ramp('#a8343a')), v: wing[1], w: wing[2], n: '#c0b090', m: metal[3], M: metal[1], Y: '#d8b030' }, a: auto(A), b: auto(B) };
}

// 다크 울프 — 옆모습 (테두리 자동)
{
  const A = [
    '................', '................', '................', '................', '................', '................',
    '..........d.d...',
    'd........dcdcc..',
    'dd..eeddddcccYc.',
    '.dddcccccccccccK',
    '..dcccccccccbbb.',
    '..cbcvvvvcbb....',
    '...bcb...bcb....',
    '...bc.....bc....',
    '...ab.....ab....',
    '................'
  ];
  const B = A.slice();
  B[7] = '.........dcdcc..'; B[8] = 'd...eeddddcccYc.'; B[9] = 'ddddcccccccccccK';
  B[12] = '..bcb....bcb....'; B[13] = '..bc.......bc...'; B[14] = '..ab.......ab...';
  out.darkwolf = { view: '옆모습', pal: { K, ...tones(ramp('#46445e')), v: '#666478', Y: '#d0a830' }, a: auto(A), b: auto(B) };
}
module.exports = out;
