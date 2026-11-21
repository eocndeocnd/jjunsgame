// ============================================================
//  지도 몬스터 도트 — 격마다 찍은 그림(rankNN-*.js)을 모아 게임이 쓰는 js/mobsprites.js 로
//
//    node design/mobs/make.js
//      → js/mobsprites.js                 (게임이 읽는 글자 격자 + 팔레트 — 손으로 고치지 않음)
//      → design/mobs/preview-rankNN.png   (확대 A · B + 실제 크기) · .html (풀밭 위를 걸어 다니는 모습)
//
//  한 칸 = 16×16 (2칸 몬스터 32×32 · 3칸 48×48). 프레임 A · B 두 장, 오른쪽을 봄 — 왼쪽으로 갈 땐 게임이 뒤집어 그립니다.
//  1칸짜리는 손으로 5단계(a 가장 어두움 … e 가장 밝음)를 찍고, 큰 것은 lib2.js 로 부위마다 입체 명암을 입힌 뒤 세부를 손으로.
//  사용자 결정 2026-11-20: 대각선(앞을 비스듬히) 또는 옆모습 · 연한 테두리 · 명암 4~5단계 · 작은 눈 · 어둑한 색
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const RANKS = { 1: ['./rank01-small.js', './rank01-big.js'], 2: ['./rank02-small.js', './rank02-big.js'], 3: ['./rank03-small.js', './rank03-mid.js'] };
// 걸음 박자 — 둔한 몬스터일수록 프레임이 천천히 바뀜 (1 = 반 칸마다 A · B, 0.5 = 한 칸마다). 서 있는 정예 · 보스의 숨도 같은 박자
// (사용자 결정 2026-11-20). 없으면 1
// 흔들림 — 서 있을 때도 A · B 가 바뀌는 몬스터 (트렌트 잎이 바람에 흔들림, 사용자 요청 2026-11-20). 걸음 박자로 천천히
const SWAY = { treant: 1 };
const PACE = {
  slime: 0.7, giantrat: 1.3, goblin: 1, kobold: 1.1, goblinchief: 0.8, skeleton: 0.9, zombie: 0.6, cavespider: 1.2, mimic: 0.7, imp: 1.2, darkwolf: 1.4, dungeonguardian: 0.5,
  orc: 0.9, hobgoblin: 1, lizardman: 1, harpy: 1.3, orcgeneral: 0.8, ogre: 0.5, darkelf: 1.3, treant: 0.5, forestwitch: 0.7, gargoyle: 0.7, basilisk: 0.8, trollking: 0.5,
  minotaur: 0.8, wyvern: 1.2, chimera: 1.1, manticore: 1.1, stonegolem: 0.5, irongolem: 0.6, harpyqueen: 1.2, cockatrice: 1.3, darkknight: 0.9, carbuncle: 1.3
};

const all = {}, byRank = {};
for (const [rank, files] of Object.entries(RANKS)) {
  byRank[rank] = [];
  for (const f of files) for (const [id, s] of Object.entries(require(f))) {
    if (all[id]) throw new Error(`${id} — 두 번 그림`);
    const n = s.a.length;
    for (const fr of ['a', 'b']) {
      if (s[fr].length !== n || s[fr].some(r => r.length !== n)) throw new Error(`${id}.${fr} — ${n}×${n} 이 아님`);
      for (const r of s[fr]) for (const c of r) if (c !== '.' && !s.pal[c]) throw new Error(`${id}.${fr} — 모르는 색 ${c}`);
    }
    all[id] = { pal: s.pal, a: s.a, b: s.b, pace: PACE[id] || 1, sway: SWAY[id] || 0 };
    byRank[rank].push(id);
  }
}

const body = Object.entries(all).map(([id, s]) =>
  `  ${id}: {\n    pace: ${s.pace},${s.sway ? ' sway: 1,' : ''}\n    pal: ${JSON.stringify(s.pal)},\n    a: [\n${s.a.map(r => `      '${r}'`).join(',\n')}\n    ],\n    b: [\n${s.b.map(r => `      '${r}'`).join(',\n')}\n    ]\n  }`).join(',\n');
fs.writeFileSync(path.join(ROOT, 'js', 'mobsprites.js'),
`// ============================================================
//  지도 몬스터 도트 — design/mobs/make.js 가 만듦 (손으로 고치지 않음)
//  몬스터 id → 걸음 박자(pace — 클수록 프레임이 빨리 바뀜) · sway(서 있을 때도 흔들림) + 팔레트(글자 → 색, '.' 은 투명) + 프레임 A · B (글자 격자, 한 칸 = 16픽셀). 오른쪽을 봄
// ============================================================
const MOB_SPRITES = {
${body}
};
if (typeof module !== 'undefined') module.exports = { MOB_SPRITES };
`);

for (const [rank, ids] of Object.entries(byRank)) {
  const tmp = path.join(__dirname, `.rank${rank}.tmp.js`);
  fs.writeFileSync(tmp, `module.exports = ${JSON.stringify(Object.fromEntries(ids.map(id => [id, all[id]])))};`);
  try { execFileSync(process.execPath, [path.join(__dirname, 'view.js'), tmp, path.join(__dirname, `preview-rank${String(rank).padStart(2, '0')}.png`)]); }
  finally { fs.unlinkSync(tmp); }
}
console.log(`지도 몬스터 도트 ${Object.keys(all).length}마리 → js/mobsprites.js`);
