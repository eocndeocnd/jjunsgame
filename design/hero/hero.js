// ============================================================
//  주인공 — 사용자가 AI 로 그린 캐릭터를 원래 픽셀 격자(약 22×34)로 되살려 깨끗하게 다듬은 것
//
//    node design/hero/hero.js
//      → design/hero/hero.png          (네 방향 한 장 — 한 칸 32×40, 바탕 투명. 앞 · 뒤 · 왼쪽 · 오른쪽)
//      → design/hero/hero-preview.png  (8배 확대)
//
//  BASE 는 AI 그림의 픽셀 한 칸(약 7.25px)마다 가장 흔한 색을 재료로 나눠 적은 것입니다:
//    o 테두리 · 1~4 머리(어두움→밝음) · s t r 살(밝음→어두움) · c C 흰색 · 회색 · E 갈색 눈동자 · k K x 후드 · 바지 · 가방 · b 가방끈 장식
//  다듬기(clean)는 안쪽 구멍 메우기 · 끊긴 바깥 테두리 잇기 · 얼굴 밖 외톨이 한 칸 정리만 합니다.
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const { encodePng } = require('../../tools/map-gen.js');

// AI 그림에서 재료마다 평균 낸 색
const PALETTE = {
  o: '#0a080c',
  1: '#2b2120', 2: '#3d2f2e', 3: '#4a3936', 4: '#65504c',
  s: '#f5c3a8', t: '#ce8e7a', r: '#996558',
  c: '#edeaed', C: '#8f8c94', E: '#5e3e36',
  x: '#211d20', k: '#322f33', K: '#484347',
  b: '#aa8a68'
};

// AI 그림에서 뽑은 그대로 (다듬기 전)
const BASE = {
  front: [
    '.......ooooo.ooo......',
    '......232232oo33o.....',
    '....ooo133212121oo....',
    '...o23213321112133o...',
    '..o2213322111111331o..',
    '..o2213122211121223oo.',
    'o23423131222222321432o',
    '.o424144222222424322o.',
    '.o414144223222424332o.',
    '.o221312213443132323oo',
    'o12133331223321133111o',
    'o12133331323324132111o',
    'o1133211r232132111111o',
    'o1o13113rt331trt111ooo',
    'oorr21ooottsstooor113o.',
    '.otrsscxxsttsxxcssoto.',
    '..ot1scEEssssEEcs1to..',
    '...ootsssssssssstoo...',
    '....o1osssrtssso1o....',
    '.....oKkotsstokKo.....',
    '....oKKkottttokKKo....',
    '...oKkxxKCttCKxxkKo...',
    '...oKkbxkxCCxkxbkKo...',
    '..oKkxxkKxccxKkxxkKo..',
    '..oKkxxkkxccxkkxxkKo..',
    '..okkxxkkxccxkkxxkko..',
    '..otroxkkxCCxkkxorso..',
    '...orokkkoxxokkkoro...',
    '.....okkkxkkxkkko.....',
    '.....okKkkookKkko.....',
    '.....okkkxooxkkxo.....',
    '.....occccoocccco.....',
    '.....oCCCCooCCCCo.....',
    '......oooo..oooo......'
  ],
  back: [
    '.......ooo.oooo.......',
    '......o22kox2244......',
    '....ooo2221x212.oo....',
    '...o33212211211243o...',
    '..o2342222121223221o..',
    '..o2312122122223312oo.',
    'ooo32341322222431223oo',
    '.o331131r42424212433o.',
    '.o23113.142114212432o.',
    '.o323211121231232212oo',
    'ox1x23312212122232121o',
    'ox1123312212222222121o',
    'oxxx2123222222232.1.1o',
    'oot.1112222222311x1roo',
    '.ot.111222212211xx.ro.',
    '..ooxxxx.xxxxxx.xxoo..',
    '...ooxxx.x.....xxoo...',
    '....ooxxxxx...xxoo....',
    '.....ookokkkkox.o.....',
    '....okKxk433KxkKxo....',
    '....o.xk.x...xx.oo....',
    '...oKk3.KkkKKK.3kKo...',
    '...o4k4xkKssKKx4.Ko...',
    '..ooKx3xKKbbKKx3kKko..',
    '..oKkxkkx.xxxxxk.kKo..',
    '..o1kxkxkkkkkxxkokko..',
    '..osrok.kkkkkkxkorso..',
    '...oro.xxxxxxx.oo4o...',
    '.....oxo.x...xx.o.....',
    '.....okkxxooxxxxo.....',
    '.....o.kkxoo.xkxo.....',
    '.....ocCCCooCCKco.....',
    '......oooo..oooo......'
  ],
  left: [
    '.......ooooooo.......',
    '.....oo4222241oo.o...',
    '...oo2121122233ro....',
    '..oo3111113322123oo..',
    '.oo34321323222213r3o.',
    '.o2134322223223r1223o',
    'oo21144222222234222o.',
    '.o42113333232r21323o.',
    'oo133111122332332323o',
    'o3233321221332221323o',
    'o323242222232233432oo',
    'oo3133211123212.r13o.',
    '.o31122211222221t13o.',
    '.oo11321.1121.o.too..',
    '..o.x111st132c3cs....',
    '...oxxxsststssssso...',
    '....oo..osssssssso...',
    '.....oo...rtssst.....',
    '......okkk3rroo......',
    '....oxoKKKK3to.......',
    '...oKKkxkx.kKk.......',
    '...oKKk..KK4xKo......',
    '....13K.oK44.4o......',
    '..ooKKx.oK44.Co......',
    '...okKxxox44oCo......',
    '...okkk.xxkkxCo......',
    '...kkkxkootsoKo......',
    '...okkk..tts.........',
    '....ooooxkx1ko.......',
    '.......xkkkkxo.......',
    '.......okkkko........',
    '.......CKKCcoo.......',
    '......occCCCco.......',
    '.......oooooo........'
  ],
  right: [
    '.........ooooo.......',
    '......ooo13333oo.....',
    '.....o1413332113o2o..',
    '...oo321112232122oo..',
    '..o3232122322232121o.',
    'o.o3322222332232233o.',
    'o1243222222232432223o',
    '...323333r324123312o.',
    '.o422231123333212322o',
    '.o422233122333112234o',
    '.o223133221122121333o',
    '..o21o1323221123123o.',
    '..o32t1322221123123o.',
    '...o1too2121..2x21xo.',
    '.....s4c221.sxxxxxo..',
    '....ossssrostsx..o...',
    '....osssstsss1x..o...',
    '.....rssstrr.xoo.....',
    '......oorr3Kkkox.....',
    '........b333KKx.o....',
    '.......oK4xxkoxkKo...',
    '.......K1444xxkKKo...',
    '......o41444okkK4....',
    '......oC.444okxk.Ko..',
    '......oC.444okxk3ko..',
    '......oC.kkK.xxk3ko..',
    '......oC.sssokkKkko..',
    '.........sst.xxkxo...',
    '.......ok...kxooo....',
    '.......o.kkkkxo......',
    '........okkkkxo......',
    '.......ooCCCCCo......',
    '.......ocCCCCco......',
    '........oooooo.......'
  ]
};
const FACE = new Set(['s', 't', 'r', 'c', 'E']);
const NECK = { front: 21, back: 15, left: 18, right: 18 };      // 이 줄부터 아래는 몸
const BODY_OF_HAIR = { 1: 'x', 2: 'k', 3: 'K', 4: 'K' };

// ---------- 다듬기 ----------
function clean(rows) {
  const H = rows.length, W = Math.max(...rows.map(r => r.length));
  let g = rows.map(r => [...r.padEnd(W, '.')]);
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : '.');
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const mostOf = list => { const n = {}; for (const v of list) n[v] = (n[v] || 0) + 1; return Object.entries(n).sort((a, b) => b[1] - a[1])[0][0]; };
  // 1) 안쪽 구멍 — 사방 중 셋 이상이 칠해진 빈칸은 이웃(테두리 말고)의 흔한 색으로
  for (let pass = 0; pass < 2; pass++) {
    const next = g.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] !== '.') continue;
      const nb = N4.map(([dx, dy]) => at(x + dx, y + dy)).filter(v => v !== '.');
      if (nb.length < 3) continue;
      const inner = nb.filter(v => v !== 'o');
      next[y][x] = inner.length ? mostOf(inner) : 'o';
    }
    g = next;
  }
  // 2) 외톨이 한 칸 — 얼굴 밖에서 사방이 모두 다른 한 가지 색이면 그 색으로
  {
    const next = g.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = g[y][x];
      if (v === '.' || v === 'o' || FACE.has(v)) continue;
      const nb = N4.map(([dx, dy]) => at(x + dx, y + dy));
      if (nb.every(n => n === nb[0]) && nb[0] !== v && nb[0] !== '.' && nb[0] !== 'o') next[y][x] = nb[0];
    }
    g = next;
  }
  // 3) 바깥 테두리 — 칠한 칸이 바로 빈칸에 닿으면 그 빈칸을 테두리로
  {
    const next = g.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] !== '.') continue;
      if (N4.some(([dx, dy]) => { const n = at(x + dx, y + dy); return n !== '.' && n !== 'o'; })) next[y][x] = 'o';
    }
    g = next;
  }
  return g.map(r => r.join(''));
}

const VIEWS = ['front', 'back', 'left', 'right'];
const SPRITES = Object.fromEntries(VIEWS.map(v => [v, clean(BASE[v].map((r, y) => (y >= NECK[v] ? r.replace(/[1-4]/g, ch => BODY_OF_HAIR[ch]) : r)))]));

// ---------- 그림 파일 ----------
const FW = 32, FH = 40;
const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
function frame(rows) {                                    // 발끝이 칸 아래에서 셋째 줄에, 가운데 맞춤
  const px = new Uint8Array(FW * FH * 4), w = rows[0].length, ox = (FW - w) >> 1, oy = FH - 2 - rows.length;
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === '.') return;
    const i = ((oy + y) * FW + ox + x) * 4, c = hex(PALETTE[ch]);
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
  }));
  return px;
}
const FRAMES = VIEWS.map(v => frame(SPRITES[v]));
{
  const W = FW * 4, px = new Uint8Array(W * FH * 4);
  FRAMES.forEach((f, n) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) for (let k = 0; k < 4; k++) px[(y * W + n * FW + x) * 4 + k] = f[(y * FW + x) * 4 + k]; });
  fs.writeFileSync(path.join(__dirname, 'hero.png'), encodePng(W, FH, px));
}
{
  const Z = 8, GAP = 16, W = 4 * (FW * Z + GAP) + GAP, H = FH * Z + GAP * 2, px = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { px[i * 4] = 120; px[i * 4 + 1] = 118; px[i * 4 + 2] = 130; px[i * 4 + 3] = 255; }
  FRAMES.forEach((f, n) => {
    const ox = GAP + n * (FW * Z + GAP), oy = GAP;
    for (let y = 0; y < FH * Z; y++) for (let x = 0; x < FW * Z; x++) {
      const s = ((y / Z | 0) * FW + (x / Z | 0)) * 4;
      if (!f[s + 3]) continue;
      const d = ((oy + y) * W + ox + x) * 4; px[d] = f[s]; px[d + 1] = f[s + 1]; px[d + 2] = f[s + 2];
    }
  });
  fs.writeFileSync(path.join(__dirname, 'hero-preview.png'), encodePng(W, H, px));
}
if (process.argv.includes('--print')) for (const v of VIEWS) console.log(v + '\n' + SPRITES[v].map((r, i) => String(i).padStart(2) + ' ' + r).join('\n'));
console.log(`주인공 — ${VIEWS.join(' · ')} (${FW}×${FH}) → ${path.relative(process.cwd(), __dirname)}`);
