// 월드맵 규칙 시험 — node --test tests/
// 작은 글자 지도로 규칙(js/map.js)을, 실제 임시 지도(maps/overworld.tmj)로 배치 규칙(docs/MAP-REFERENCE-PLAN.md 2-2)을 봅니다.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const M = require('../js/map.js');
const gen = require('../tools/map-gen.js');

const ROOT = path.join(__dirname, '..');
const R = M.RULES;

// 글자 지도: # 벽 · ~ 물 · ? 숨은 통로 · . 바닥 · @ 시작 · E 정예 자리 · D 문 · 소문자 = 구역(같은 글자를 감싸는 사각형)
function mapOf(rows) {
  const h = rows.length, w = rows[0].length;
  const tiles = [], boxes = {}, posts = [], ports = [], secrets = [], npcs = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    tiles.push(c === '#' || c === '?' ? gen.WALL : c === '~' ? gen.WATER : gen.FLOOR);
    if (/[a-z]/.test(c)) {
      const b = boxes[c] || (boxes[c] = { x0: x, y0: y, x1: x, y1: y });
      b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y);
    }
    if (c === '@') npcs.push({ name: 'start', x, y });
    if (c === 'E') posts.push({ name: 'E', x, y, enemy: 'elite', blocks: true });
    if (c === 'D') ports.push({ name: 'door', x, y, w: 1, h: 1, to: 'next', opensAfter: 'boss' });
    if (c === '?') secrets.push({ x, y, w: 1, h: 1 });
  }));
  const areas = Object.entries(boxes).map(([k, b]) => ({ name: k, x: b.x0, y: b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1, rank: 1, monster: k }));
  return M.parseTiled(gen.buildTmj({ w, h, tiles, areas, posts, ports, secrets, npcs }), 'test');
}

// 스폰을 거치지 않고 몬스터를 직접 세웁니다 (규칙 하나만 보려고)
function mob(w, x, y, temper, area = 0) {
  const m = { id: w.nextMob++, monster: 'm', area, x, y, temper, aura: null, mode: 'wander', wait: 0, frozen: 0, angry: 0 };
  w.mobs.push(m);
  return m;
}
function run(w, secs, each) {
  const events = [];
  for (let t = 0; t < secs && !w.encounter; t += 0.05) {
    for (const e of M.tick(w, 0.05)) events.push(e);
    if (each) each();
  }
  return events;
}
const contact = events => events.find(e => e.type === 'contact');
const manh = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

test('지도 읽기 — 벽 · 물은 막히고 숨은 통로는 지나간다', () => {
  const m = mapOf([
    '#####',
    '#@?~#',
    '#####'
  ]);
  assert.deepEqual(m.start, { x: 1, y: 1 });
  assert.equal(m.solid[1 * 5 + 2], 0, '숨은 통로');
  assert.equal(m.secret[1 * 5 + 2], 1);
  assert.equal(m.solid[1 * 5 + 3], 1, '물');
  assert.equal(m.solid[0], 1, '벽');
});

// 구역 둘 — 왼쪽 a(1~7칸) · 오른쪽 b(25~32칸), 나는 한가운데(16칸)라 둘 다 시야(8칸) 밖
const twoAreas = () => mapOf([
  '#'.repeat(34),
  '#' + 'a'.repeat(7) + '.'.repeat(17) + 'b'.repeat(8) + '#',
  '#' + 'a'.repeat(7) + '.'.repeat(8) + '@' + '.'.repeat(8) + 'b'.repeat(8) + '#',
  '#' + 'a'.repeat(7) + '.'.repeat(17) + 'b'.repeat(8) + '#',
  '#'.repeat(34)
]);

test('세계가 서면 몬스터가 있는 모든 구역에 3~4마리 — 서로 붙지 않고, 내 코앞엔 없다', () => {
  const m = twoAreas();
  for (let seed = 1; seed <= 20; seed++) {
    const w = M.createWorld(m, {}, seed);
    for (const a of m.areas) {
      const mine = w.mobs.filter(x => x.area === a.index);
      assert.ok(mine.length >= R.SPAWN_MIN && mine.length <= R.SPAWN_MAX, `시드 ${seed} ${a.name} — ${mine.length}마리`);
      assert.ok(mine.every(x => x.x >= a.x && x.x < a.x + a.w && x.y >= a.y && x.y < a.y + a.h), '제 구역 안');
    }
    for (const a of w.mobs) {
      assert.ok(Math.max(Math.abs(a.x - w.player.x), Math.abs(a.y - w.player.y)) > R.SPAWN_CLEAR);
      for (const b of w.mobs) if (a !== b) assert.ok(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) >= R.SPAWN_GAP);
    }
  }
});

test('다른 구역에 들어서면 알린다 — 구역 밖 길 위는 그대로', () => {
  const m = mapOf([
    '############',
    '#aaa@...bbb#',
    '############'
  ]);
  const w = M.createWorld(m, {}, 11);
  w.mobs = [];
  M.setInput(w, 'right');
  const ev = run(w, 1.2).filter(e => e.type === 'area');
  assert.equal(ev.length, 1, '길 위로 나선 것은 알리지 않음');
  assert.equal(ev[0].area.name, 'b');
});

test('멀리 갔다 와도 그대로 — 잡으면 그 구역에 하나가 새로 서고, 기운도 그때 새로 굴린다', () => {
  let rolls = 0;
  const w = M.createWorld(twoAreas(), { rollAura: () => ({ id: `기운${++rolls}` }) }, 3);
  assert.equal(rolls, w.mobs.length, '처음 설 때 한 마리에 한 번씩 굴림');
  const ids = () => w.mobs.map(x => x.id).sort((p, q) => p - q).join();
  const before = ids(), lastId = Math.max(...w.mobs.map(x => x.id));
  for (const x of [9, 24, 16]) { w.player.x = x; run(w, 1); }   // a 앞 · b 앞 · 한가운데
  assert.equal(ids(), before, '지우지도 새로 세우지도 않음');
  assert.equal(rolls, w.mobs.length, '기운도 그대로');

  const foe = w.mobs.find(x => x.area === 0), n = w.mobs.filter(x => x.area === 0).length;
  w.encounter = { mob: foe, first: 'player' };
  M.resolve(w, 'win');
  const now = w.mobs.filter(x => x.area === 0), fresh = now.find(x => x.id > lastId);
  assert.ok(!w.mobs.includes(foe), '잡은 것은 사라짐');
  assert.equal(now.length, n, '그 구역의 수는 그대로');
  assert.ok(fresh, '새로 하나');
  assert.equal(fresh.aura.id, `기운${rolls}`, '기운을 새로 굴림');
  for (const b of now) if (b !== fresh) assert.ok(Math.max(Math.abs(b.x - fresh.x), Math.abs(b.y - fresh.y)) >= R.SPAWN_GAP);
});

test('적어 둔 몬스터로 되살린다 — 지도와 안 맞는 것은 버리고 빈 구역은 새로, 마주하던 것은 그 조우로, 코앞에 선 것은 먼 칸으로', () => {
  const keep = [
    { monster: 'a', area: 0, x: 2, y: 1, aura: { id: '황금' } },
    { monster: 'a', area: 0, x: 6, y: 3, aura: null, fighting: true },
    { monster: 'b', area: 0, x: 4, y: 2, aura: null },   // 구역과 몬스터가 안 맞음
    { monster: 'a', area: 7, x: 4, y: 2, aura: null }    // 없는 구역
  ];
  const w = M.createWorld(twoAreas(), {}, 5, keep);
  const a = w.mobs.filter(x => x.area === 0);
  assert.equal(a.length, 2, 'a 구역은 적어 둔 둘만');
  assert.deepEqual([a[0].x, a[0].y, a[0].aura.id], [2, 1, '황금']);
  assert.ok(w.mobs.filter(x => x.area === 1).length >= R.SPAWN_MIN, '적어 둔 것이 없는 b 구역은 새로');
  assert.equal(w.encounter && w.encounter.mob, a[1], '마주하던 것으로 조우');
  assert.equal(M.tick(w, 1).length, 0, '조우 중에는 멈춤');
  M.resolve(w, 'win');
  assert.ok(!w.mobs.includes(a[1]), '이기면 사라짐');
  assert.equal(w.mobs.filter(x => x.area === 0).length, 2, '그 구역에 새로 하나');

  const big = mapOf([
    '############',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '#aaaa@aaaaa#',
    '#aaaaaaaaaa#',
    '############'
  ]);
  const w2 = M.createWorld(big, {}, 6, [{ monster: 'a', area: 0, x: 6, y: 3, aura: null }]);
  assert.equal(w2.mobs.length, 1);
  assert.ok(manh(w2.mobs[0], w2.player) > R.AGGRO_SIGHT + 1, `코앞에서 먼 칸으로 (${manh(w2.mobs[0], w2.player)}칸)`);
});

test('선공은 나를 보면 쫓아와 부딪힌다 — 몬스터가 먼저 닿음', () => {
  const m = mapOf([
    '############',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '#aaaa@aaaaa#',
    '#aaaaaaaaaa#',
    '############'
  ]);
  const w = M.createWorld(m, {}, 1);
  w.mobs = [];
  mob(w, 9, 3, 'aggro');                          // 4칸 떨어짐
  const e = contact(run(w, 5));
  assert.ok(e, '닿음');
  assert.equal(e.first, 'foe');
  assert.ok(w.encounter);
});

test('선공은 제 구역 밖으로 3칸 넘게는 쫓지 않고 돌아간다', () => {
  const m = mapOf([
    '#################',
    '#aaaa...........#',
    '#aaaa..@........#',
    '#aaaa...........#',
    '#################'
  ]);
  const w = M.createWorld(m, {}, 2);
  w.mobs = [];
  const a = mob(w, 4, 2, 'aggro');
  const area = m.areas[0];
  let farthest = 0;
  M.setInput(w, 'right');                        // 달아난다 (나는 초당 12칸, 쫓는 것은 3칸)
  const ev = run(w, 1.6, () => { farthest = Math.max(farthest, a.x - (area.x + area.w - 1)); });
  M.setInput(w, null);
  run(w, 8, () => { farthest = Math.max(farthest, a.x - (area.x + area.w - 1)); });
  assert.ok(!contact(ev));
  assert.ok(farthest > 0, '쫓아 나오긴 함');
  assert.ok(farthest <= R.LEASH + 1, `구역 밖 ${farthest}칸까지`);
  assert.ok(a.x <= area.x + area.w - 1, '제 구역으로 돌아옴');
});

test('후공은 쫓아오지 않는다 — 물러서면 멈췄다가 화가 나서 쫓아온다', () => {
  const m = mapOf([
    '############',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '#aaa@aaaaaa#',
    '#aaaaaaaaaa#',
    '############'
  ]);
  const w = M.createWorld(m, {}, 4);
  w.mobs = [];
  const a = mob(w, 6, 3, 'passive');
  assert.ok(!contact(run(w, 6)), '가만히 있으면 안 닿음');
  // 내가 다가가 닿는다
  a.x = 6; a.y = 3; w.player.x = 4; w.player.y = 3;
  M.setInput(w, 'right');
  const e = contact(run(w, 2));
  assert.ok(e);
  assert.equal(e.first, 'player');
  const at = { x: w.player.x, y: w.player.y };
  M.resolve(w, 'retreat');
  assert.equal(manh(w.player, a) > manh(at, a), true, '한 칸 뒤로 밀려남');
  M.setInput(w, null);
  assert.ok(!contact(run(w, R.FREEZE_SECS - 0.1)), '멈춰 있는 동안은 안 닿음');
  const e2 = contact(run(w, 6));
  assert.ok(e2, '화가 나서 쫓아옴');
  assert.equal(e2.first, 'foe');
});

test('중립은 달아나고, 구석으로 몰면 잡힌다', () => {
  const m = mapOf([
    '############',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '#aaaa@aaaaa#',
    '#aaaaaaaaaa#',
    '############'
  ]);
  const w = M.createWorld(m, {}, 5);
  w.mobs = [];
  const a = mob(w, 7, 3, 'shy');
  run(w, 1);
  assert.ok(manh(w.player, a) > 2, '멀어짐');

  const dead = mapOf([
    '#########',
    '#@..bbbb#',
    '#########'
  ]);
  const w2 = M.createWorld(dead, {}, 6);
  w2.mobs = [];
  mob(w2, 7, 1, 'shy');
  M.setInput(w2, 'right');
  const e = contact(run(w2, 5));
  assert.ok(e, '막다른 끝에서 잡힘');
  assert.equal(e.first, 'player');
});

test('물 건너편의 선공은 물가에서 멈춘다', () => {
  const m = mapOf([
    '###########',
    '#....~aaaa#',
    '#...@~aaaa#',
    '#....~aaaa#',
    '###########'
  ]);
  const w = M.createWorld(m, {}, 8);
  w.mobs = [];
  const a = mob(w, 7, 2, 'aggro');
  assert.ok(!contact(run(w, 10)));
  assert.equal(a.x, 6, '물가까지 와서 노려봄');
});

test('닿은 뒤에는 한 번 떼야 다시 걷는다', () => {
  const m = mapOf([
    '#########',
    '#@.aaaa.#',
    '#########'
  ]);
  const w = M.createWorld(m, {}, 9);
  w.mobs = [];
  mob(w, 3, 1, 'passive');
  M.setInput(w, 'right');
  assert.ok(contact(run(w, 1)));
  M.resolve(w, 'retreat');
  const at = w.player.x;                         // 밀려난 칸 (몬스터가 어슬렁거려 닿은 칸은 시드마다 다름)
  M.setInput(w, 'right');                        // 누른 채 그대로
  run(w, 1);
  assert.equal(w.player.x, at, '안 걸음');
  M.setInput(w, null);
  M.setInput(w, 'right');
  run(w, 0.05);
  assert.equal(w.player.x, at + 1, '떼었다 누르면 걸음');
});

test('정예 자리 — 닿으면 싸움, 꺾으면 지나간다 · 닫힌 문은 막고 열리면 들어선다', () => {
  const m = mapOf([
    '########',
    '#@.E..D#',
    '########'
  ]);
  const downed = new Set();
  let open = false;
  const w = M.createWorld(m, { postAlive: id => !downed.has(id), portOpen: () => open }, 10);
  M.setInput(w, 'right');
  const e = contact(run(w, 1));
  assert.ok(e && e.post && e.post.enemy === 'elite');
  M.resolve(w, 'win');
  downed.add('elite');
  M.setInput(w, null); M.setInput(w, 'right');
  const ev = run(w, 2);
  assert.ok(ev.some(x => x.type === 'closed'), '닫힌 문');
  assert.equal(w.player.x, 5);
  open = true;
  const ev2 = run(w, 0.5);
  assert.ok(ev2.some(x => x.type === 'port' && x.port.to === 'next'), '열린 문으로 들어섬');
});

// ---------- 큰 몬스터 (n × n 칸) ----------
// 몸 둘 사이의 체비쇼프 거리 (맞닿으면 1) · 몸이 그 칸을 덮는가
const apart = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h)) + 1;
const covers = (a, x, y) => x >= a.x && y >= a.y && x < a.x + a.w && y < a.y + a.h;
function bigMob(w, x, y, n, temper) { const m = mob(w, x, y, temper); m.w = m.h = n; return m; }

test('큰 몬스터 — 몸이 다 들어가는 곳에만 서고, 서로 붙지 않고, 내 코앞엔 없다', () => {
  const m = mapOf([
    '##################',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#.......@........#',
    '##################'
  ]);
  const a = m.areas[0];
  for (let seed = 1; seed <= 20; seed++) {
    const w = M.createWorld(m, { size: () => 3 }, seed);
    assert.ok(w.mobs.length >= R.SPAWN_MIN, `시드 ${seed} — ${w.mobs.length}마리`);
    for (const x of w.mobs) {
      assert.equal(x.w, 3); assert.equal(x.h, 3);
      assert.ok(x.x >= a.x && x.y >= a.y && x.x + 3 <= a.x + a.w && x.y + 3 <= a.y + a.h, '몸이 다 제 구역 안');
      assert.ok(apart(x, { x: w.player.x, y: w.player.y, w: 1, h: 1 }) > R.SPAWN_CLEAR, '내 코앞엔 없음');
      for (const y of w.mobs) if (x !== y) assert.ok(apart(x, y) >= R.SPAWN_GAP, '서로 붙지 않음');
    }
  }
});

test('큰 몬스터 — 몸 어느 칸에 닿아도 싸움, 쫓아와 몸이 닿으면 몬스터가 먼저', () => {
  const m = mapOf([
    '############',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '#....@.....#',
    '############'
  ]);
  const w = M.createWorld(m, {}, 1);
  w.mobs = [];
  const foe = bigMob(w, 3, 2, 2, 'passive');
  for (const [x, y] of [[3, 2], [4, 2], [3, 3], [4, 3]]) assert.equal(M.mobAt(w, x, y), foe, `몸 (${x},${y})`);
  assert.equal(M.mobAt(w, 5, 2), null);
  // 오른쪽 아래 칸으로 — 옆에서 걸어 들어가면 싸움
  w.player.x = 5; w.player.y = 3;
  M.setInput(w, 'left');
  const e = contact(run(w, 0.5));
  assert.ok(e && e.mob === foe && e.first === 'player', '옆 칸에서 들어감');
  M.resolve(w, 'retreat');
  assert.ok(!covers(foe, w.player.x, w.player.y), '밀려나 몸 밖으로');

  // 선공 3×3 — 쫓아와 몸이 닿음 (내 칸을 덮지는 않음 — 닿는 걸음에서 멈춰 싸움)
  w.mobs = [];
  w.encounter = null;
  w.player.x = 9; w.player.y = 6; w.player.needRelease = false; w.player.dir = null;
  const big = bigMob(w, 5, 2, 3, 'aggro');                       // 몸에서 내 칸까지 가로 2 · 세로 2 — 알아보는 거리 안
  const ev = contact(run(w, 6));
  assert.ok(ev && ev.mob === big && ev.first === 'foe', '몬스터가 먼저 닿음');
  assert.ok(!covers(big, w.player.x, w.player.y), '내 칸과 겹쳐 서지 않음');
  assert.equal(apart(big, { x: w.player.x, y: w.player.y, w: 1, h: 1 }), 1, '맞닿은 채');
});

test('큰 몬스터 — 몸이 안 들어가는 좁은 길로는 쫓아오지 못하고, 어슬렁대도 몸이 제 구역 · 벽 · 서로를 넘지 않는다', () => {
  const m = mapOf([
    '############',
    '#aaaaaaa####',
    '#aaaaaaa####',
    '#aaaaaaa...@',
    '#aaaaaaa####',
    '#aaaaaaa####',
    '############'
  ]);
  const w = M.createWorld(m, {}, 2);
  w.mobs = [];
  const big = bigMob(w, 5, 2, 3, 'aggro');                       // 몸 오른쪽 끝이 좁은 길 들머리 — 내 칸까지 4칸
  assert.ok(!contact(run(w, 5)), '한 칸 길에는 3×3 이 못 들어감');
  assert.ok(big.x + 3 <= 8, '구역 밖 벽으로 몸이 나가지 않음');

  const field = mapOf([
    '##############',
    '#aaaaaaaaaaaa#',
    '#aaaaaaaaaaaa#',
    '#aaaa##aaaaaa#',
    '#aaaa##aaaaaa#',
    '#aaaaaaaaaaaa#',
    '#aaaaaaaaaaaa#',
    '#aaaaaaaaaaaa#',
    '#.....@......#',
    '##############'
  ]);
  const w2 = M.createWorld(field, {}, 4);
  w2.mobs = [];
  const herd = [bigMob(w2, 1, 1, 2, 'passive'), bigMob(w2, 8, 1, 3, 'passive'), bigMob(w2, 2, 5, 2, 'shy')];
  const a = field.areas[0];
  run(w2, 30, () => {
    for (const x of herd) {
      assert.ok(x.x >= a.x && x.y >= a.y && x.x + x.w <= a.x + a.w && x.y + x.h <= a.y + a.h, '몸이 제 구역 안');
      for (let j = x.y; j < x.y + x.h; j++) for (let i = x.x; i < x.x + x.w; i++) assert.equal(field.solid[j * field.w + i], 0, '벽 위에 서지 않음');
      for (const y of herd) if (x !== y) assert.ok(apart(x, y) >= 1, '서로 겹치지 않음');
    }
  });
});

// ---------- 실제 임시 지도 (maps/overworld.tmj) ----------
function loadData() {
  const text = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
  // JSON 으로 한 번 거쳐 이쪽 배열로 — vm 안에서 만든 배열은 deepEqual 이 다른 것으로 봅니다
  return JSON.parse(vm.runInNewContext(`${text}\n;JSON.stringify({ ENEMIES, ZONES, ITEMS, CORES, RANKS })`, {}));
}
function walk(m, sources, blocked) {
  const d = new Int32Array(m.w * m.h).fill(-1), q = [];
  for (const i of sources) { d[i] = 0; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % m.w, y = (i / m.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (x + dx < 0 || y + dy < 0 || x + dx >= m.w || y + dy >= m.h) continue;   // 지도 밖 (도시는 가장자리까지 걸을 수 있음)
      const j = (y + dy) * m.w + x + dx;
      if (d[j] >= 0 || m.solid[j] || (blocked && blocked.has(j))) continue;
      d[j] = d[i] + 1; q.push(j);
    }
  }
  return d;
}
const cellsOf = (m, a) => { const out = []; for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) out.push(y * m.w + x); return out; };
// 구역의 칸 — 다각형 구역은 감싸는 네모가 아니라 그 안에 드는 칸만
const areaCells = (m, a) => cellsOf(m, a).filter(i => m.areaAt[i] === a.index);

test('overworld — 2~5격 몬스터가 모두 한 번씩(지하 묘실의 것 · 6격 마계는 따로), 구역 32개 · 숲 남쪽 끝 구멍으로 지하수로에 · 대성당 앞뜰 묘실 문으로 지하에', () => {
  const data = loadData();
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const under = new Set(gen.UNDERS.flatMap(u => u.rooms));                               // 지하 묘실에만 사는 일반 몬스터
  const foes = data.ENEMIES.filter(e => e.rank.n >= 2 && e.rank.n <= 5);
  const areaMonsters = m.areas.filter(a => a.monster).map(a => a.monster).sort();
  assert.deepEqual(areaMonsters, foes.filter(e => e.kind === 'normal' && !under.has(e.name)).map(e => e.id).sort());
  const elsewhere = [...gen.SECRET_ROOMS.map(r => r.hidden), ...gen.BUILDINGS.map(b => b.boss), ...gen.UNDERS.map(u => u.boss)]   // 숨은 굴의 히든 · 건물 안 보스 · 지하의 보스
    .map(name => data.ENEMIES.find(e => e.name === name).id);
  assert.deepEqual(m.posts.map(p => p.enemy).sort(), foes.filter(e => e.kind !== 'normal' && !elsewhere.includes(e.id)).map(e => e.id).sort());
  assert.equal(areaMonsters.length, 32);
  assert.deepEqual(m.ports.map(p => [p.to, p.opensAfter, !!p.hole]),
    [['sewer.out', undefined, true], ['castle.out', undefined, false], ['witchhut.out', undefined, false], ['giantcave.out', undefined, false], ['crypt.in', undefined, false]]);
  assert.ok(!m.areas.some(a => a.rank === 6) && !m.posts.some(p => data.ENEMIES.find(e => e.id === p.enemy).rank.n === 6), '6격은 따로 뽑는 지도(abyss)');
  const hole = m.ports.find(p => p.name === 'sewer');
  assert.ok(!m.solid[(hole.y - 1) * m.w + hole.x + 1] && m.solid[(hole.y + 1) * m.w + hole.x + 1], '구멍 위는 걸을 수 있는 숲, 아래는 어둠');
  assert.ok(Math.abs(m.start.x - (hole.x + 1)) <= 1 && m.start.y === hole.y - 1, '지도의 시작점은 구멍 바로 위');
  // 길을 막는 것은 다음 격으로 가는 틈의 거인왕 · 트롤 부락의 골짜기를 막는 트롤 킹뿐 — 크기는 data.js 그대로
  const blockers = m.posts.filter(p => p.blocks);
  assert.deepEqual(blockers.map(p => p.enemy).sort(), ['giantking', 'trollking']);
  const sizeOf = id => data.ENEMIES.find(e => e.id === id).size;
  assert.ok(blockers.every(p => p.w === sizeOf(p.enemy) && p.h === sizeOf(p.enemy)));
  assert.ok(blockers.some(p => p.w > 3), '큰 보스가 막는 틈은 그만큼 넓음');
});

test('overworld — 같은 격 구역끼리는 보스 없이 걸어서 이어지고, 숲 · 고원은 넓게 트였다', () => {
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const posts = new Set(m.posts.flatMap(p => cellsOf(m, p)));
  for (let rank = 2; rank <= 5; rank++) {
    const mine = m.areas.filter(a => a.rank === rank), first = mine[0];
    const d = walk(m, [first.mid.y * m.w + first.mid.x], posts);
    for (const a of mine) assert.ok(areaCells(m, a).some(i => d[i] >= 0), `${rank}격 ${a.name} 구역`);
  }
  // 덩어리 숲 — 땅(바닥 · 길 · 나무 · 바위) 가운데 나무 · 바위는 적게
  const [FLOOR, , , TREE, ROCK, ROAD] = [0, 1, 2, 3, 4, 5];
  for (const rank of [2, 4]) {
    const land = m.areas.filter(a => a.rank === rank).flatMap(a => areaCells(m, a)).filter(i => [FLOOR, TREE, ROCK, ROAD].includes(m.tile[i]));
    const open = land.filter(i => m.tile[i] === FLOOR || m.tile[i] === ROAD).length / land.length;
    assert.ok(open >= 0.7, `${rank}격 트인 칸 ${Math.round(open * 100)}%`);
  }
});

test('overworld — 한 줄로 열린다: 구멍 앞에서 2 · 3 · 4격 → 5격(거인왕) → 대성당 앞뜰 묘실 문(지하로)', () => {
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const start = m.start.y * m.w + m.start.x;
  const allPosts = new Set(m.posts.flatMap(p => cellsOf(m, p)));   // 큰 자리는 몸 칸 다
  const but = (...ids) => {
    const gone = new Set(m.posts.filter(p => ids.includes(p.enemy)).flatMap(p => cellsOf(m, p)));
    return new Set([...allPosts].filter(i => !gone.has(i)));
  };
  const ranks = blocked => {                                       // 그 격의 구역 하나라도 닿는 격들
    const d = walk(m, [start], blocked);
    return [2, 3, 4, 5].filter(r => m.areas.filter(a => a.rank === r).some(a => areaCells(m, a).some(i => d[i] >= 0)));
  };
  assert.deepEqual(ranks(allPosts), [2, 3, 4], '구멍 앞 숲에서 그대로 왕국 · 4격');
  assert.deepEqual(ranks(but('giantking')), [2, 3, 4, 5], '아치 너머 5격');
  // 지하 묘실로 내려가는 문 — 5격 대성당 앞뜰, 거인왕을 꺾어야 닿음
  const port = cellsOf(m, m.ports.find(p => p.name === 'crypt'));
  const reaches = blocked => { const d = walk(m, [start], blocked); return port.some(i => d[i] >= 0); };
  assert.ok(!reaches(allPosts), '거인왕이 막음');
  assert.ok(reaches(but('giantking')), '거인왕을 꺾으면 묘실 문까지');
  // 지도 전체가 이어져 있다
  const all = walk(m, [start]);
  assert.ok(m.areas.every(a => areaCells(m, a).filter(i => !m.solid[i]).every(i => all[i] >= 0)), '모든 구역의 걸을 수 있는 칸에 닿음');
  // 들머리(첫 구역 한가운데) · 상인 자리는 걸을 수 있는 칸
  for (const a of m.areas.filter(x => x.monster)) {
    const first = m.areas.find(x => x.zone === a.zone && x.monster);
    assert.ok(!m.solid[first.mid.y * m.w + first.mid.x] && m.areaAt[first.mid.y * m.w + first.mid.x] === first.index, `${a.zone} 들머리`);
  }
  for (const n of m.npcs) assert.ok(!m.solid[n.y * m.w + n.x], `${n.name} 자리`);
});

test('지하수로(sewer) — 첫 공간에서 위로 1 → 9번 방이 레벨 순, 이웃 방끼리 다 이어지고, 맨 위 보스 방의 구멍은 던전 가디언이 꼭 맞게 막음', () => {
  const data = loadData();
  const m = loadMap('sewer');
  const zi = data.ZONES.findIndex(z => z.rank === 1);
  const normals = data.ENEMIES.filter(e => e.zoneIndex === zi && e.kind === 'normal');
  const fields = m.areas.filter(a => a.monster);
  assert.deepEqual(fields.map(a => a.monster), normals.map(e => e.id), '약한 것부터 차례대로');
  assert.deepEqual(m.posts.map(p => p.enemy).sort(), data.ENEMIES.filter(e => e.zoneIndex === zi && e.kind !== 'normal').map(e => e.id).sort());
  // 스케치의 자리 — 방 번호 n 의 (칸, 줄). 방은 모두 같은 크기, 위로 갈수록 센 것
  const where = gen.SEWER.order.map(k => k.split(',').map(Number));
  const ox = Math.min(...fields.map(a => a.x)), oy = Math.min(...fields.map(a => a.y));
  fields.forEach((a, i) => {
    assert.deepEqual([a.w, a.h], [fields[0].w, fields[0].h], `${i + 1}번 방 크기`);
    assert.deepEqual([Math.round((a.x - ox) / (a.w + 4)), Math.round((a.y - oy) / (a.h + 4)) + 1], where[i], `${i + 1}번 방 자리`);
  });
  const plaza = m.areas.find(a => !a.monster);
  assert.ok(fields.every(a => a.y < plaza.y), '첫 공간이 맨 아래');
  assert.equal(plaza.zone, data.ZONES[zi].id);
  // 이웃한 방끼리는 정해진 자리 없이도 서로 걸어서 닿음 — 다른 방을 거치지 않고 (그 둘 말고 다른 방 칸은 막고 잼)
  const rooms = [...fields, plaza];
  const cellsSet = a => new Set(areaCells(m, a));
  const posts = new Set(m.posts.flatMap(p => cellsOf(m, p)));
  const neighbor = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= Math.max(a.w, a.h) + 4 && (a.x === b.x || a.y === b.y);
  for (const a of rooms) for (const b of rooms) {
    if (a === b || !neighbor(a, b)) continue;
    const others = new Set([...posts, ...rooms.filter(r => r !== a && r !== b).flatMap(r => areaCells(m, r))]);
    const d = walk(m, [a.mid.y * m.w + a.mid.x], others);
    assert.ok([...cellsSet(b)].some(i => d[i] >= 0), `${a.name} → ${b.name}`);
  }
  // 보스 방 — 구멍(바깥으로)은 막다른 틈 맨 안쪽, 던전 가디언의 몸이 그 앞을 꼭 맞게 막음
  const out = m.ports.find(p => p.name === 'out'), boss = m.posts.find(p => p.enemy === 'dungeonguardian');
  assert.ok(out.hole && out.to === 'overworld.sewer');
  assert.ok(boss.blocks && boss.w === out.w && boss.x === out.x && boss.y === out.y + 1, '구멍 바로 앞, 같은 폭');
  const start = m.start.y * m.w + m.start.x;
  const reach = blocked => { const d = walk(m, [start], blocked); return cellsOf(m, out).some(i => d[i] >= 0); };
  assert.ok(!reach(posts), '던전 가디언이 막음');
  assert.ok(reach(new Set([...posts].filter(i => !cellsOf(m, boss).includes(i)))), '꺾으면 구멍까지');
  assert.ok(fields.every(a => a.y > boss.y), '보스 방이 맨 위');
});

test('보물상자 — 그 칸은 막히고, 닫힌 상자에 닿으면 선 채로 열고(한 번 떼야 다시 걷는다), 연 상자는 그냥 막힌 칸 · 몬스터도 못 선다', () => {
  const m = mapOf([
    '#######',
    '#@.aaa#',
    '#######'
  ]);
  m.chests.push({ name: '보물상자', x: 3, y: 1, chest: 'box' });   // 구역 a 의 첫 칸
  const opened = new Set();
  const w = M.createWorld(m, { chestOpen: id => opened.has(id) }, 1);
  w.mobs = [];
  M.setInput(w, 'right');
  const ev = run(w, 0.5).filter(e => e.type === 'chest');
  assert.equal(ev.length, 1, '닿으면 한 번');
  assert.equal(ev[0].chest.chest, 'box');
  assert.equal(w.player.x, 2, '상자 앞에 선 채로');
  opened.add('box');
  M.setInput(w, null); M.setInput(w, 'right');
  const ev2 = run(w, 0.5);
  assert.ok(!ev2.some(e => e.type === 'chest'), '연 상자는 다시 안 열림');
  assert.equal(w.player.x, 2, '그래도 막힘');
  assert.equal(M.chestAt(w, 3, 1).chest, 'box');
  const foe = mob(w, 5, 1, 'passive');
  run(w, 10, () => assert.ok(!(foe.x === 3 && foe.y === 1), '몬스터는 상자 칸에 안 섬'));
});

test('떠돌이 상인 — 와 있으면 그 자리는 막히고 닿으면 상점(선 채로), 안 와 있으면 그냥 땅 · 몬스터는 상인 자리에 안 선다', () => {
  const m = mapOf([
    '#######',
    '#@.aaa#',
    '#######'
  ]);
  m.npcs.push({ name: 'merchant', x: 3, y: 1, zone: 'z' });
  let here = false;
  const w = M.createWorld(m, { merchantHere: n => here && n.zone === 'z' }, 1);
  w.mobs = [];
  M.setInput(w, 'right');
  assert.ok(!run(w, 0.4).some(e => e.type === 'merchant'), '안 와 있으면 지나감');
  assert.ok(w.player.x > 3);
  here = true;
  w.player.x = 1; w.player.wait = 0;
  const ev = run(w, 0.4).filter(e => e.type === 'merchant');
  assert.equal(ev.length, 1, '와 있으면 닿을 때 한 번');
  assert.equal(w.player.x, 2, '상인 앞에 선 채로');
  const foe = mob(w, 5, 1, 'passive');
  run(w, 10, () => assert.ok(!(foe.x === 3 && foe.y === 1), '몬스터는 상인 자리에 안 섬'));
});

test('중립은 예전보다 못 달아난다 — 초당 2칸 · 가끔 멈칫, 트인 곳에서도 쫓으면 금방 잡힌다', () => {
  assert.ok(R.FLEE_SPEED < R.CHASE_SPEED && R.FLEE_STUMBLE > 0);
  const m = mapOf([
    '##################',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#@aaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaa#',
    '##################'
  ]);
  let caught = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const w = M.createWorld(m, {}, seed);
    w.mobs = [];
    const foe = mob(w, 5, 4, 'shy');
    // 몬스터 쪽으로 한 칸씩 — 가로가 더 벌어졌으면 가로로, 아니면 세로로
    for (let t = 0; t < 6 && !w.encounter; t += 0.05) {
      const dx = foe.x - w.player.x, dy = foe.y - w.player.y;
      M.setInput(w, null);
      M.setInput(w, Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      M.tick(w, 0.05);
    }
    if (w.encounter) caught++;
  }
  assert.ok(caught >= 8, `10번 가운데 ${caught}번 잡음 (6초 안)`);
});

test('보물상자 — 격마다 작은 상자 둘 · 큰 상자 하나(1격은 작은 것 셋), 큰 상자마다 그 격의 상자 전용 장비 하나 · 번호는 겹치지 않음', () => {
  const data = loadData();
  const all = allMapNames().flatMap(name => loadMap(name).chests.map(c => ({ ...c, map: name })));
  const ids = all.map(c => c.chest);
  assert.equal(new Set(ids).size, ids.length, '상자 번호가 겹치지 않음');
  const chestItems = data.ITEMS.filter(i => i.chest);
  for (const z of data.ZONES) {
    const mine = all.filter(c => Number(c.rank) === z.rank);
    const big = mine.filter(c => c.big), small = mine.filter(c => !c.big);
    assert.equal(big.length, 1, `${z.rank}격 큰 상자`);
    assert.equal(small.length, z.rank === 1 ? 3 : 2, `${z.rank}격 작은 상자`);
    const item = chestItems.find(i => i.id === big[0].item);
    assert.ok(item && item.rank.n === z.rank, `${z.rank}격 큰 상자의 장비 ${big[0].item}`);
    assert.ok(small.every(c => !c.item), `${z.rank}격 작은 상자엔 장비 없음`);
  }
  assert.deepEqual(all.filter(c => c.big).map(c => c.item).sort(), chestItems.map(i => i.id).sort(), '상자 전용 장비는 저마다 한 상자에');
});

test('보물상자 — 지도마다 바닥 위 · 정해진 자리 · 문 · 상인과 안 겹치고, 길막을 꺾으면 걸어서 닿고, 길을 막지 않는다', () => {
  for (const name of allMapNames()) {
    const m = loadMap(name);
    if (!m.chests.length) continue;
    const box = new Set(m.chests.map(c => c.y * m.w + c.x));
    const still = new Set(m.posts.filter(p => !p.blocks).flatMap(p => cellsOf(m, p)));   // 길막은 다 꺾었다고 침
    const start = m.start.y * m.w + m.start.x;
    const d = walk(m, [start], new Set([...box, ...still]));
    for (const c of m.chests) {
      const k = c.y * m.w + c.x;
      assert.ok(!m.solid[k], `${name} ${c.chest} — 바닥 위`);
      assert.ok(!m.posts.some(p => cellsOf(m, p).includes(k)), `${name} ${c.chest} — 정해진 자리와 안 겹침`);
      assert.ok(!m.ports.some(p => c.x >= p.x && c.y >= p.y && c.x < p.x + p.w && c.y < p.y + p.h), `${name} ${c.chest} — 문과 안 겹침`);
      assert.ok(!m.npcs.some(n => n.x === c.x && n.y === c.y), `${name} ${c.chest} — 상인 · 시작점과 안 겹침`);
      assert.ok([k - 1, k + 1, k - m.w, k + m.w].some(i => d[i] >= 0), `${name} ${c.chest} — 걸어서 닿음`);
    }
    // 상자를 다 벽으로 쳐도, 상자 없이 닿던 구역 칸에는 다 닿음 (길을 막지 않음)
    const without = walk(m, [start], still), withBox = d;
    for (const a of m.areas) {
      const lost = areaCells(m, a).filter(i => !box.has(i) && without[i] >= 0 && withBox[i] < 0);
      assert.equal(lost.length, 0, `${name} ${a.name} — 상자 때문에 못 가는 칸 ${lost.length}`);
    }
  }
});

test('열리기 전엔 없는 문(appears) — 보이지도 막히지도 않는 땅이다가, 열리면 들어서는 문', () => {
  const m = mapOf([
    '#######',
    '#@....#',
    '#######'
  ]);
  m.ports.push({ name: 'secret', x: 3, y: 1, w: 1, h: 1, to: 'grotto.out', opensAfter: 'boss', appears: true });
  let open = false;
  const w = M.createWorld(m, { portOpen: p => !p.opensAfter || open }, 1);
  w.mobs = [];
  assert.equal(M.portAt(w, 3, 1), null, '열리기 전엔 문이 없음');
  M.setInput(w, 'right');
  const ev = run(w, 0.35);
  assert.ok(!ev.some(e => e.type === 'closed' || e.type === 'port'), '부딪히지도 들어서지도 않고');
  assert.ok(w.player.x > 3, '그냥 지나감');
  open = true;
  w.player.x = 1; w.player.y = 1; w.player.wait = 0;
  assert.ok(M.portAt(w, 3, 1), '열리면 문');
  const ev2 = run(w, 0.35);
  assert.ok(ev2.some(e => e.type === 'port' && e.port.name === 'secret'), '들어섬');
});

// 문 칸에서 겉모습이 건물인 칸을 따라 이어지는 한 덩어리
function buildingBlob(m, door) {
  const seen = new Set(), st = [door.y * m.w + door.x];
  while (st.length) {
    const k = st.pop();
    if (seen.has(k) || (m.look[k] & 15) !== gen.BUILD) continue;
    seen.add(k);
    const x = k % m.w;
    if (x > 0) st.push(k - 1);
    if (x < m.w - 1) st.push(k + 1);
    if (k >= m.w) st.push(k - m.w);
    if (k < m.w * (m.h - 1)) st.push(k + m.w);
  }
  return [...seen];
}

test('건물 — 2격 숲의 마녀는 바깥에 서 있지 않고 오두막 안에: 문 하나 난 닫힌 오두막, 안은 통나무 방 안쪽에 마녀 · 나가면 숲의 그 문 앞', () => {
  const over = loadMap('overworld'), h = loadMap('witchhut'), data = loadData();
  const witch = data.ENEMIES.find(e => e.name === '숲의 마녀');
  assert.ok(!over.posts.some(p => p.enemy === witch.id), '바깥 지도엔 마녀가 없음');
  const door = over.ports.find(p => p.name === 'witchhut');
  assert.ok(door.door && door.to === 'witchhut.out' && door.w === 1 && door.h === 1);
  const cells = buildingBlob(over, door);
  const xs = cells.map(k => k % over.w), ys = cells.map(k => (k / over.w) | 0);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  assert.equal(cells.length, (x1 - x0 + 1) * (y1 - y0 + 1), '오두막 자리는 네모 한 덩어리');
  assert.deepEqual([x1 - x0 + 1, y1 - y0 + 1], [7, 5]);
  assert.ok(cells.every(k => k === door.y * over.w + door.x ? !over.solid[k] : over.solid[k]), '문 칸만 걸을 수 있음');
  assert.ok(door.y === y1 && door.x === (x0 + x1) / 2, '문은 정면 한가운데');
  const d = walk(over, [over.start.y * over.w + over.start.x]);
  const dk = door.y * over.w + door.x;
  assert.ok(d[dk] >= 0 && d[dk + over.w] >= 0, '문과 그 앞까지 걸어서 닿음');
  // 안 — 마녀 하나(정예 크기 그대로) · 나가는 문은 바깥 그 문으로 · 도시가 아님(wild) · 마녀까지 걸어서 닿음
  assert.deepEqual(h.posts.map(p => [p.enemy, p.w]), [[witch.id, witch.size]]);
  assert.equal(h.props.title, '마녀의 오두막');
  assert.ok(h.props.interior && h.props.wild && h.props.theme === 'witch');
  const out = h.ports.find(p => p.name === 'out');
  assert.ok(out.door && out.to === 'overworld.witchhut');
  const dh = walk(h, [h.start.y * h.w + h.start.x]);
  assert.ok(cellsOf(h, h.posts[0]).some(i => dh[i] >= 0), '마녀에게 걸어서 닿음');
});

test('건물 — 3격 몰락한 왕의 성은 바깥 지도에선 남쪽 정면 가운데에 문 하나 난 닫힌 건물, 들어가면 깔개 끝에 보스 · 양옆에 기둥인 성 안', () => {
  const over = loadMap('overworld'), c = loadMap('castle');
  const door = over.ports.find(p => p.name === 'castle');
  assert.ok(door.door && door.to === 'castle.out' && door.w === 4 && door.h === 1);
  // 건물 자리 — 겉모습이 건물인 칸 덩어리(문이 든 덩어리). 문 칸만 걸을 수 있고 나머지는 모두 막힘, 문은 그 아래 가장자리 한가운데
  const cells = buildingBlob(over, door);
  const xs = cells.map(k => k % over.w), ys = cells.map(k => (k / over.w) | 0);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  assert.equal(cells.length, (x1 - x0 + 1) * (y1 - y0 + 1), '건물 자리는 네모 한 덩어리');
  const doorCells = cellsOf(over, door);
  assert.ok(cells.every(k => doorCells.includes(k) ? !over.solid[k] : over.solid[k]), '문 칸만 걸을 수 있음');
  assert.equal(door.y, y1, '문은 정면(아래 가장자리)');
  assert.ok(Math.abs((door.x + door.w / 2) - (x0 + x1 + 1) / 2) <= 1, '정면 가운데');
  const d = walk(over, [over.start.y * over.w + over.start.x]);
  assert.ok(doorCells.every(i => d[i] >= 0) && doorCells.every(i => d[i + over.w] >= 0), '문과 그 앞까지 걸어서 닿음');
  // 성 안 — 몰락한 왕 · 기둥 · 나가는 문(바깥 그 문 앞으로), 지역 없음 · 이름은 성
  assert.deepEqual(c.posts.map(p => p.enemy), ['fallenking']);
  assert.equal(c.areas.length, 0);
  assert.equal(c.props.title, '몰락한 왕의 성');
  assert.ok(c.props.interior);
  const out = c.ports.find(p => p.name === 'out');
  const hall = gen.BUILDINGS.find(b => b.id === 'castle').hall;
  assert.ok(out.door && out.to === 'overworld.castle' && out.w === hall.aisle);
  assert.ok(Math.abs(c.start.x - (out.x + out.w / 2)) <= 1 && c.start.y === out.y - 1, '성 안 시작점은 나가는 문 바로 위');
  // 기둥은 깔개 양옆에 마주 보게 — 가운데 줄을 두고 좌우가 꼭 맞음, 한쪽에 넷씩
  const mid = (c.w - 1) / 2;
  let left = 0, right = 0;
  for (let k = 0; k < c.w * c.h; k++) if (c.tile[k] === 4) {
    const x = k % c.w, y = (k / c.w) | 0;
    assert.equal(c.tile[y * c.w + (c.w - 1 - x)], 4, '기둥 좌우가 꼭 맞음');
    if (x < mid) left++; else right++;
  }
  assert.equal(left, 4 * hall.pillar * hall.pillar);
  assert.equal(right, 4 * hall.pillar * hall.pillar);
  // 깔개 — 나가는 문간에서 곧장 위로 보스 발밑의 단까지, 보스는 그 끝 가운데
  const king = c.posts[0];
  assert.equal(king.x + (king.w - 1) / 2, mid, '보스는 가운데 줄');
  assert.equal(out.x + (out.w - 1) / 2, mid, '나가는 문도 가운데 줄');
  for (let y = king.y + king.h + 1; y < out.y; y++) for (let x = out.x; x < out.x + out.w; x++)
    assert.equal(c.look[y * c.w + x] & 15, gen.CARPET, `깔개 (${x}, ${y})`);
  const dc = walk(c, [c.start.y * c.w + c.start.x]);
  const near = [];
  for (let x = king.x; x < king.x + king.w; x++) near.push((king.y + king.h) * c.w + x);
  assert.ok(near.some(i => dc[i] >= 0), '들어서서 몰락한 왕에게 닿음');
});

test('숨은 굴 — 3격 보스(몰락한 왕)를 꺾으면 성 안 바로 뒤에 구멍이 나타나고, 그 굴에는 카벙클만 · 굴의 구멍은 다시 그 앞으로', () => {
  const data = loadData();
  const over = loadMap('castle'), g = loadMap('grotto');
  const king = over.posts.find(p => p.enemy === 'fallenking'), hole = over.ports.find(p => p.name === 'grotto');
  assert.ok(hole.appears && hole.hole && hole.opensAfter === 'fallenking' && hole.to === 'grotto.out');
  assert.ok(hole.x === king.x && hole.w === king.w && hole.y === king.y - 2, '보스 바로 뒤 (위로 한 칸 띄워, 보스 폭만큼)');
  assert.ok(Math.max(Math.abs(hole.x - king.x), Math.abs(hole.y - king.y)) <= R.SIGHT, '보스를 꺾은 자리에서 보임');
  const cells = cellsOf(over, hole);
  assert.ok(cells.every(i => !over.solid[i]), '구멍 자리는 걸을 수 있는 땅');
  const d = walk(over, [over.start.y * over.w + over.start.x]);
  assert.ok(cells.some(i => d[i] >= 0), '걸어서 닿음');
  // 굴 — 카벙클 하나, 지역 없음(들어가도 3격 그대로), 나가는 구멍은 overworld 의 그 구멍으로
  const carb = data.ENEMIES.find(e => e.name === '카벙클');
  assert.deepEqual(g.posts.map(p => p.enemy), [carb.id]);
  assert.equal(g.posts[0].w, carb.size);
  assert.equal(g.areas.length, 0);
  assert.equal(g.props.title, '숨은 굴');
  const out = g.ports.find(p => p.name === 'out');
  assert.ok(out.hole && out.to === 'castle.grotto');
  const dg = walk(g, [g.start.y * g.w + g.start.x]);
  const post = g.posts[0], near = [];
  for (let x = post.x; x < post.x + post.w; x++) near.push((post.y + post.h) * g.w + x, (post.y - 1) * g.w + x);
  assert.ok(near.some(i => dg[i] >= 0), '굴 들머리에서 카벙클에게 닿음');
  assert.ok(Math.abs(g.start.x - (out.x + 1)) <= 1 && g.start.y === out.y - 1, '굴의 시작점은 나가는 구멍 바로 위');
});

// ---------- 지도 전부 · 7격부터 격 하나에 한 장 ----------
const loadMap = name => M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, `maps/${name}.tmj`), 'utf8')), name);
const allMapNames = () => fs.readdirSync(path.join(ROOT, 'maps')).filter(f => f.endsWith('.tmj')).map(f => f.replace(/\.tmj$/, ''));

test('지도 전부 — 스무 지역이 저마다 한 장에만, 296마리가 모두 한 번씩 (하나뿐인 일반은 구역 대신 정해진 자리에)', () => {
  const data = loadData();
  const zoneMaps = {}, normals = [], posts = [];
  for (const name of allMapNames()) {
    const m = loadMap(name);
    for (const a of m.areas) if (a.zone && !a.extra && !gen.UNDERS.some(u => u.id === name)) (zoneMaps[a.zone] = zoneMaps[a.zone] || new Set()).add(name);   // 지하 묘실은 5격의 둘째 장 (그 지역의 지도는 바깥 지도)
    normals.push(...m.areas.filter(a => a.monster && !a.extra).map(a => a.monster));   // extra — 동굴에 한 번 더 둔 구역
    posts.push(...m.posts.map(p => p.enemy));
  }
  for (const z of data.ZONES) assert.equal(zoneMaps[z.id] && zoneMaps[z.id].size, 1, `${z.rank}격 ${z.name}`);
  assert.deepEqual(normals.sort(), data.ENEMIES.filter(e => e.kind === 'normal' && !e.solo).map(e => e.id).sort());
  assert.deepEqual(posts.sort(), data.ENEMIES.filter(e => e.kind !== 'normal' || e.solo).map(e => e.id).sort(), '정해진 자리 — 정예 · 히든 · 보스 · 하나뿐인 일반');
});

test('지도 전부 — 정해진 자리는 그 적의 크기만큼, 걸을 수 있는 칸에 서로 겹치지 않고 닿을 수 있게 · 큰 몬스터도 구역마다 3마리 넘게', () => {
  const data = loadData();
  const foe = id => data.ENEMIES.find(e => e.id === id);
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const name of allMapNames()) {
    const m = loadMap(name);
    for (const p of m.posts) {
      const n = foe(p.enemy).size;
      assert.ok(p.w === n && p.h === n, `${name} ${p.name} — ${n}×${n} 인데 ${p.w}×${p.h}`);
      assert.ok(cellsOf(m, p).every(i => !m.solid[i]), `${name} ${p.name} — 벽 위에 섬`);
      for (const q of m.posts) if (q !== p) assert.ok(!overlap(p, q), `${name} ${p.name} · ${q.name} 겹침`);
      for (const q of m.ports) assert.ok(!overlap(p, q), `${name} ${p.name} · 문 겹침`);
    }
    // 길막을 다 꺾었다면 — 길을 막지 않는 자리는 그대로 두고도 모든 자리에 다가가 닿을 수 있음 (홀의 묶음 정예가 서로를 가두지 않음)
    const still = new Set(m.posts.filter(p => !p.blocks).flatMap(p => cellsOf(m, p)));
    const d = walk(m, [m.start.y * m.w + m.start.x], still);
    for (const p of m.posts) {
      const near = [];
      for (let x = p.x; x < p.x + p.w; x++) near.push((p.y - 1) * m.w + x, (p.y + p.h) * m.w + x);
      for (let y = p.y; y < p.y + p.h; y++) near.push(y * m.w + p.x - 1, y * m.w + p.x + p.w);
      assert.ok(near.some(i => d[i] >= 0), `${name} ${p.name} 에 닿음`);
    }
    for (const a of m.areas) assert.ok(cellsOf(m, a).some(i => d[i] >= 0), `${name} ${a.name} 구역에 닿음`);
    // 크기대로 세워 봄 — 몸이 다 들어가는 곳이 구역마다 넉넉
    const w = M.createWorld(m, { size: id => foe(id).size }, 1);
    for (const a of m.areas.filter(x => x.monster)) {
      const mine = w.mobs.filter(x => x.area === a.index);
      assert.ok(mine.length >= R.SPAWN_MIN, `${name} ${a.name}(${foe(a.monster).size}×${foe(a.monster).size}) — ${mine.length}마리`);
    }
  }
});

test('지도 전부 — 구역마다 걸을 수 있는 칸이 한 덩어리 (나무 · 물 · 벼랑이 구역을 가르지 않음) · overworld 구역은 땅 모양대로(다각형) · 들머리는 그 구역 안 걸을 수 있는 칸', () => {
  for (const name of allMapNames()) {
    const m = loadMap(name);
    for (const a of m.areas.filter(x => x.monster)) {
      const cells = areaCells(m, a).filter(i => !m.solid[i]), mine = new Set(cells);
      const seen = new Set([cells[0]]), q = [cells[0]];
      while (q.length) {
        const i = q.pop();
        for (const j of [i - 1, i + 1, i - m.w, i + m.w]) if (mine.has(j) && !seen.has(j) && Math.abs((j % m.w) - (i % m.w)) <= 1) { seen.add(j); q.push(j); }
      }
      assert.equal(seen.size, cells.length, `${name} ${a.name} — ${cells.length}칸 가운데 ${seen.size}칸만 이어짐`);
      const k = a.mid.y * m.w + a.mid.x;
      assert.ok(m.areaAt[k] === a.index && !m.solid[k], `${name} ${a.name} 들머리`);
      if (name === 'overworld') assert.ok(a.poly, `${a.name} — 다각형`);
    }
  }
});

test('다각형 구역 — 칸 가운데가 안에 드는 칸만, 들머리는 무게중심에 가장 가까운 걸을 수 있는 칸', () => {
  // ㄱ자 구역 (칸 단위 꼭짓점 → 픽셀) — 가로 0~6 × 세로 0~2, 그 아래 세로 줄 0~2 × 2~6
  const tmj = gen.buildTmj({ w: 8, h: 8, tiles: new Array(64).fill(gen.FLOOR),
    areas: [{ name: 'L', x: 0, y: 0, polygon: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 6 }, { x: 0, y: 6 }], monster: 'm', rank: 1 }] });
  const m = M.parseTiled(tmj, 'L');
  const a = m.areas[0], inA = (x, y) => m.areaAt[y * m.w + x] === 0;
  assert.deepEqual([a.x, a.y, a.w, a.h], [0, 0, 6, 6]);
  assert.equal(areaCells(m, a).length, 6 * 2 + 2 * 4);
  assert.ok(inA(5, 1) && inA(1, 5) && !inA(3, 3) && !inA(6, 0) && !inA(0, 6));
  assert.ok(inA(a.mid.x, a.mid.y));
  // 구역 밖으로 나가지 않고 어슬렁 — 꺾인 모양 그대로
  const w = M.createWorld(m, {}, 3);
  w.mobs = [];
  const foe = mob(w, 4, 0, 'passive');
  run(w, 20, () => assert.ok(inA(foe.x, foe.y), `구역 안 (${foe.x},${foe.y})`));
});

test('7격부터 — 격 하나에 한 장, 마왕성 왕좌 뒤 문에서 20격까지 보스 뒤 문으로 한 줄로 이어짐 (되돌아 걷지 않음) · 문의 광장 없음', () => {
  const data = loadData();
  const bossOf = rank => data.ENEMIES.find(e => e.rank.n === rank && e.kind === 'boss').id;
  assert.ok(!allMapNames().includes('hub'), '문의 광장 없음');
  const castle = loadMap('demoncastle');
  const out = castle.ports.find(p => p.name === 'next');
  assert.equal(out.to, 'library.in');
  assert.equal(out.opensAfter, 'demonking');
  assert.ok(!castle.ports.some(p => p.name === 'hub'));
  for (const spec of gen.RANK_MAPS) {
    const m = loadMap(spec.id), zone = data.ZONES.find(z => z.rank === spec.rank);
    assert.ok(m.areas.every(a => a.zone === zone.id), `${spec.id} — ${spec.rank}격 한 격뿐`);
    const back = m.ports.find(p => p.name === 'in');
    assert.equal(back.to, `${spec.rank === 7 ? 'demoncastle' : gen.rankMapId(spec.rank - 1)}.next`, `${spec.id} 들머리 문`);
    const next = m.ports.find(p => p.name === 'next');
    if (spec.rank === 20) { assert.ok(!next, '20격 — 마지막, 다음 문 없음'); continue; }
    assert.equal(next.to, `${gen.rankMapId(spec.rank + 1)}.in`);
    assert.equal(next.opensAfter, bossOf(spec.rank));
    // 들머리에서 — 보스 몸을 지나지 못하면 다음 격 문에 못 닿고, 보스를 꺾으면 닿음
    const boss = m.posts.find(p => p.enemy === bossOf(spec.rank));
    assert.ok(boss.blocks, `${spec.id} 보스가 길을 막음`);
    const from = [m.start.y * m.w + m.start.x];
    const near = p => { const out = []; for (let x = p.x; x < p.x + p.w; x++) out.push((p.y + p.h) * m.w + x); return out; };
    const all = new Set(m.posts.flatMap(p => cellsOf(m, p)));
    assert.ok(!near(next).some(i => walk(m, from, all)[i] >= 0), `${spec.id} — 보스를 꺾기 전엔 다음 문에 못 닿음`);
    const noBoss = new Set(m.posts.filter(p => p !== boss).flatMap(p => cellsOf(m, p)));
    assert.ok(near(next).some(i => walk(m, from, noBoss)[i] >= 0), `${spec.id} — 보스를 꺾으면 다음 문까지`);
  }
});

test('7격부터 — 장소로 나눔: 장소가 바뀌는 문(마왕성 왕좌 뒤 · 그 장소 마지막 격의 보스 뒤)에만 다음 장소 이름, 한 장소 안은 이름 없이 바로', () => {
  const ranks = gen.PLACES.flatMap(p => p.ranks);
  assert.deepEqual(ranks, Array.from({ length: 14 }, (_, i) => i + 7), '7~20격이 차례대로 한 번씩');
  assert.equal(loadMap('demoncastle').ports.find(p => p.name === 'next').place, '인간의 땅');
  for (const spec of gen.RANK_MAPS) {
    const m = loadMap(spec.id), next = m.ports.find(p => p.name === 'next');
    assert.equal(m.props.place, gen.placeOf(spec.rank).name, `${spec.id} 장소`);
    if (!next) continue;
    const changes = gen.placeOf(spec.rank) !== gen.placeOf(spec.rank + 1);
    assert.equal(next.place, changes ? gen.placeOf(spec.rank + 1).name : undefined, `${spec.rank}격 → ${spec.rank + 1}격`);
  }
});

test('7격부터 — 하나뿐인 일반은 2칸 넘게 · 가운데 흙길에서 2칸 넘게 떨어진 벽감 · 정예의 곁방은 문 둘(고리 — 한 문을 막아도 다른 문으로)', () => {
  const data = loadData();
  const foe = id => data.ENEMIES.find(e => e.id === id);
  for (const e of data.ENEMIES.filter(x => x.solo)) assert.ok(e.rank.n >= 7 && e.size >= 2, `${e.name} — ${e.rank.n}격 · ${e.size}칸`);
  for (const spec of gen.RANK_MAPS) {
    const m = loadMap(spec.id);
    for (const p of m.posts.filter(q => foe(q.enemy).solo)) {
      assert.ok(!p.blocks, `${spec.id} ${p.name} — 길을 막지 않음`);
      for (let y = p.y - 2; y < p.y + p.h + 2; y++) for (let x = p.x - 2; x < p.x + p.w + 2; x++)
        assert.notEqual(m.tile[y * m.w + x], gen.ROAD, `${spec.id} ${p.name} — 흙길 (${x}, ${y}) 이(가) 2칸 안`);
    }
    if (m.props.loops === undefined) continue;                 // 손으로 짠 지도(7격 알렉산드리아)는 곁방 대신 트인 땅에
    const loops = String(m.props.loops || '').split('|').filter(Boolean).map(t => { const [id, ds] = t.split(':'); return { id, doors: ds.split(';').map(d => { const [x, y, w, h] = d.split(',').map(Number); return { x, y, w, h }; }) }; });
    assert.deepEqual(loops.map(l => l.id).sort(), m.posts.filter(q => foe(q.enemy).kind === 'elite').map(q => q.enemy).sort(), `${spec.id} — 정예마다 곁방`);
    const from = [m.start.y * m.w + m.start.x], bodies = m.posts.flatMap(q => cellsOf(m, q));
    for (const l of loops) {
      const p = m.posts.find(q => q.enemy === l.id);
      const nearP = []; for (let x = p.x - 1; x <= p.x + p.w; x++) for (let y = p.y - 1; y <= p.y + p.h; y++) nearP.push(y * m.w + x);
      for (const [i, d] of l.doors.entries()) {
        assert.ok(cellsOf(m, d).every(k => !m.solid[k]), `${spec.id} ${p.name} 곁방 문 ${i + 1}`);
        const shut = walk(m, from, new Set([...bodies, ...cellsOf(m, d)]));   // 이 문을 막아도 다른 문으로 닿음
        assert.ok(nearP.some(k => shut[k] >= 0), `${spec.id} ${p.name} — 문 ${i + 1} 을 막아도 닿음`);
      }
    }
  }
});

test('7격 알렉산드리아 — 파벌마다 상징 공간에, 파벌 안에서는 북쪽(뒤)으로 갈수록 셈 · 세 갈래 큰길이 대항구에서 만나 둑길의 이순신 · 이름난 사람은 트인 땅(손자만 언덕 구석)', () => {
  const data = loadData();
  const m = loadMap('library');
  const sec = name => m.areas.find(a => a.section && a.name === name);
  const post = name => m.posts.find(p => p.name === name);
  const inside = (p, a) => p.x >= a.x && p.y >= a.y && p.x + p.w <= a.x + a.w && p.y + p.h <= a.y + a.h;
  const lv = name => data.ENEMIES.find(e => e.name === name).level;
  const factions = {
    '서쪽 반란자 → 정복자': [['잔 다르크', '원형극장'], ['스파르타쿠스', '원형극장'], ['칭기즈 칸', '소마 — 알렉산드로스의 무덤'], ['알렉산드로스', '소마 — 알렉산드로스의 무덤']],
    '가운데 학자': [['아르키메데스', '무세이온'], ['히파티아', '무세이온'], ['레오나르도 다 빈치', '대도서관'], ['헤로도토스', '대도서관']],
    '동쪽 촉한': [['관우', '촉한 진영'], ['장비', '촉한 진영'], ['조운', '촉한 진영'], ['마초', '촉한 진영'], ['황충', '촉한 진영']]
  };
  for (const [f, list] of Object.entries(factions)) {
    list.forEach(([name, where], i) => {
      assert.ok(inside(post(name), sec(where)), `${name} 은(는) ${where}`);
      if (i) {
        const [prev] = list[i - 1];
        assert.ok(lv(name) > lv(prev) && post(name).y < post(prev).y, `${f}: ${prev} → ${name} (셀수록 북쪽)`);
      }
    });
  }
  assert.ok(inside(post('손자'), sec('세라페움 언덕')), '손자는 세라페움 언덕');
  assert.ok(inside(post('헤르메스 트리스메기스투스'), sec('파로스 등대 섬')), '헤르메스는 등대 섬 — 보스 곁');
  // 장비는 운하 다리 위 — 다리 양옆이 물
  const z = post('장비');
  assert.ok(m.solid[(z.y) * m.w + z.x - 1] && m.tile[(z.y) * m.w + z.x - 1] === gen.WATER, '장비 — 장판교 위');
  // 이름난 사람은 구석이 아님 — 몸 둘레 세 칸 안 벽이 한쪽 면에만 몰려 있지 않음 (손자 · 보스 · 히든 빼고)
  for (const p of m.posts.filter(q => !['손자', '이순신', '헤르메스 트리스메기스투스'].includes(q.name))) {
    let open = 0, all = 0;
    for (let y = p.y - 3; y < p.y + p.h + 3; y++) for (let x = p.x - 3; x < p.x + p.w + 3; x++) { all++; if (!m.solid[y * m.w + x]) open++; }
    assert.ok(open / all > 0.75, `${p.name} — 트인 땅 (${Math.round(open / all * 100)}%)`);
  }
  // 지나가며 닿지 않게 — 보스 말고는 몸 둘레 두 칸 안에 흙길 없음
  for (const p of m.posts.filter(q => q.name !== '이순신')) for (let y = p.y - 2; y < p.y + p.h + 2; y++) for (let x = p.x - 2; x < p.x + p.w + 2; x++)
    assert.notEqual(m.tile[y * m.w + x], gen.ROAD, `${p.name} — 흙길 (${x}, ${y}) 이(가) 2칸 안`);
  // 세 갈래 — 서 · 가운데 · 동 큰길 가운데 둘을 막아도 남은 하나로 이순신 앞 부두까지
  const boss = post('이순신'), front = []; for (let x = boss.x; x < boss.x + boss.w; x++) front.push((boss.y + boss.h) * m.w + x);
  const bodies = m.posts.flatMap(q => cellsOf(m, q)), from = [m.start.y * m.w + m.start.x];
  const band = (x0, x1) => { const out = []; for (let y = 32; y < 112; y++) for (let x = x0; x < x1; x++) out.push(y * m.w + x); return out; };
  const lanes = { 서: band(0, 60), 가운데: band(60, 88), 동: band(88, m.w) };
  for (const [keep] of Object.entries(lanes)) {
    const shut = new Set([...bodies, ...Object.entries(lanes).filter(([k]) => k !== keep).flatMap(([, c]) => c)]);
    assert.ok(front.some(k => walk(m, from, shut)[k] >= 0), `${keep}쪽 길만으로 이순신 앞까지`);
  }
  // 비밀 서고 — 숨은 샛길로만, 큰 상자
  const vault = sec('비밀 서고'), big = m.chests.find(c => c.big);
  assert.ok(inside({ x: big.x, y: big.y, w: 1, h: 1 }, vault), '큰 상자는 비밀 서고');
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  assert.ok(secretCells.length && !(walk(m, from, new Set([...bodies, ...secretCells]))[(big.y + 1) * m.w + big.x] >= 0), '샛길 없이는 못 감');
});

test('8격 카멜롯 — 남쪽 나루 → 바위의 검 광장 · 마상 시합장 → 세 갈래(서쪽 숲 · 가운데 성 · 동쪽 고개와 해안)가 원탁의 홀 앞에서 만나 왕좌의 아서왕 → 호숫가(호수의 여인 · 아발론으로 가는 배) · 로빈 후드 뒤 은신처', () => {
  const data = loadData();
  const m = loadMap('camelot');
  const sec = name => m.areas.find(a => a.section && a.name === name);
  const post = name => m.posts.find(p => p.name === name);
  const spot = name => post(name) || (a => ({ x: a.x, y: a.y + a.h / 2, w: 1, h: 1 }))(m.areas.find(a => a.monster === data.ENEMIES.find(e => e.name === name).id));
  const inside = (p, a) => p.x >= a.x && p.y >= a.y && p.x + p.w <= a.x + a.w && p.y + p.h <= a.y + a.h;
  const lv = name => data.ENEMIES.find(e => e.name === name).level;
  const routes = {
    '서쪽 숲': ['광전사', '녹색 기사', '퍼시벌', '로빈 후드'],
    '가운데 성': ['템플 기사', '가웨인', '갤러해드'],
    '동쪽 고개 · 해안': ['용기사', '트리스탄', '롤랑', '엘 시드'],
    '원탁의 홀로': ['랜슬롯', '베디비어', '모드레드', '아서왕']
  };
  for (const [r, list] of Object.entries(routes)) for (let i = 1; i < list.length; i++)
    assert.ok(lv(list[i]) > lv(list[i - 1]) && spot(list[i]).y < spot(list[i - 1]).y, `${r}: ${list[i - 1]} → ${list[i]} (셀수록 북쪽)`);
  const where = { '랜슬롯': '마상 시합장', '갤러해드': '성배 예배당', '모드레드': '원탁의 홀', '아서왕': '원탁의 홀', '호수의 여인': '호숫가', '롤랑': '롤랑의 고개', '트리스탄': '동쪽 해안 절벽', '엘 시드': '동문 밖 들판' };
  for (const [name, a] of Object.entries(where)) assert.ok(inside(post(name), sec(a)), `${name} 은(는) ${a}`);
  // 이름난 기사는 트인 땅 (로빈 후드 — 숲에 숨은 의적, 아서왕 · 호수의 여인 빼고) · 지나가는 흙길에서 두 칸 넘게
  for (const p of m.posts.filter(q => !['로빈 후드', '아서왕', '호수의 여인'].includes(q.name))) {
    let open = 0, all = 0;
    for (let y = p.y - 3; y < p.y + p.h + 3; y++) for (let x = p.x - 3; x < p.x + p.w + 3; x++) { all++; if (!m.solid[y * m.w + x]) open++; }
    assert.ok(open / all > 0.75, `${p.name} — 트인 땅 (${Math.round(open / all * 100)}%)`);
    for (let y = p.y - 2; y < p.y + p.h + 2; y++) for (let x = p.x - 2; x < p.x + p.w + 2; x++) assert.notEqual(m.tile[y * m.w + x], gen.ROAD, `${p.name} — 흙길 2칸 안`);
  }
  // 세 갈래 — 둘을 막아도 남은 하나로 원탁의 홀 문(베디비어 앞)까지
  const bodies = m.posts.flatMap(q => cellsOf(m, q)), from = [m.start.y * m.w + m.start.x];
  const hall = sec('원탁의 홀'), door = []; for (let x = 67; x < 74; x++) door.push((hall.y + hall.h) * m.w + x);
  const band = (x0, x1) => { const out = []; for (let y = 62; y < 130; y++) for (let x = x0; x < x1; x++) out.push(y * m.w + x); return out; };
  const lanes = { 서: band(0, 44), 가운데: band(44, 96), 동: band(96, m.w) };
  for (const keep of Object.keys(lanes)) {
    const shut = new Set([...bodies, ...Object.entries(lanes).filter(([k]) => k !== keep).flatMap(([, c]) => c)]);
    assert.ok(door.some(k => walk(m, from, shut)[k] >= 0), `${keep}쪽 길만으로 원탁의 홀 문까지`);
  }
  // 은신처 — 숨은 샛길로만, 큰 상자 (부자에게서 턴 보물)
  const big = m.chests.find(c => c.big);
  assert.ok(inside({ x: big.x, y: big.y, w: 1, h: 1 }, sec('로빈 후드의 은신처')), '큰 상자는 은신처');
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  assert.ok(secretCells.length && !(walk(m, from, new Set([...bodies, ...secretCells]))[(big.y + 1) * m.w + big.x] >= 0), '샛길 없이는 못 감');
  // 9격 아발론으로 — 호수의 배, 장소는 그대로(인간의 땅)
  const next = m.ports.find(p => p.name === 'next');
  assert.ok(inside(next, sec('호숫가')) && next.to === `${gen.rankMapId(9)}.in` && !next.place);
});

test('9격 아발론 — 안개 나루 · 마탑 마을 → 시내로 갈린 세 갈래(서쪽 원소의 길 · 가운데 금지된 지식 · 동쪽 마녀의 숲)가 사과 과수원에서 만나 모르간의 궁 → 수정 동굴의 멀린 → 동방으로 가는 문 · 노움 뒤 보물방', () => {
  const data = loadData();
  const m = loadMap('avalon');
  const sec = name => m.areas.find(a => a.section && a.name === name);
  const post = name => m.posts.find(p => p.name === name);
  const spot = name => post(name) || (a => ({ x: a.x, y: a.y + a.h / 2, w: 1, h: 1 }))(m.areas.find(a => a.monster === data.ENEMIES.find(e => e.name === name).id));
  const inside = (p, a) => p.x >= a.x && p.y >= a.y && p.x + p.w <= a.x + a.w && p.y + p.h <= a.y + a.h;
  const lv = name => data.ENEMIES.find(e => e.name === name).level;
  const routes = {
    '서쪽 원소의 길': ['샐러맨더', '소환술사', '운디네', '실프', '노움'],
    '가운데 금지된 지식': ['룬 마법사', '연금술사', '파우스트', '흑마법사'],
    '동쪽 마녀의 숲': ['드루이드', '바바 야가', '키르케'],
    '과수원 너머': ['모르간 르 페이', '멀린']
  };
  for (const [r, list] of Object.entries(routes)) for (let i = 1; i < list.length; i++)
    assert.ok(lv(list[i]) > lv(list[i - 1]) && spot(list[i]).y < spot(list[i - 1]).y, `${r}: ${list[i - 1]} → ${list[i]} (셀수록 북쪽)`);
  const where = { '샐러맨더': '불의 제단', '운디네': '물의 샘', '실프': '바람 절벽', '노움': '노움의 땅굴', '파우스트': '파우스트의 서재', '바바 야가': '바바 야가의 숲', '키르케': '키르케의 섬', '모르간 르 페이': '모르간의 궁', '멀린': '멀린의 수정 동굴' };
  for (const [name, a] of Object.entries(where)) assert.ok(inside(post(name), sec(a)), `${name} 은(는) ${a}`);
  for (const p of m.posts.filter(q => !['바바 야가', '노움', '멀린'].includes(q.name))) {   // 숲의 마녀 · 땅속 정령 · 갇힌 멀린 빼고 트인 땅
    let open = 0, all = 0;
    for (let y = p.y - 3; y < p.y + p.h + 3; y++) for (let x = p.x - 3; x < p.x + p.w + 3; x++) { all++; if (!m.solid[y * m.w + x]) open++; }
    assert.ok(open / all > 0.75, `${p.name} — 트인 땅 (${Math.round(open / all * 100)}%)`);
  }
  // 세 갈래 — 둘을 막아도 남은 하나로 궁 남문까지
  const bodies = m.posts.flatMap(q => cellsOf(m, q)), from = [m.start.y * m.w + m.start.x];
  const pal = sec('모르간의 궁'), gate = []; for (let x = 66; x < 75; x++) gate.push((pal.y + pal.h) * m.w + x);
  const band = (x0, x1) => { const out = []; for (let y = 66; y < 130; y++) for (let x = x0; x < x1; x++) out.push(y * m.w + x); return out; };
  const lanes = { 서: band(0, 47), 가운데: band(47, 97), 동: band(97, m.w) };
  for (const keep of Object.keys(lanes)) {
    const shut = new Set([...bodies, ...Object.entries(lanes).filter(([k]) => k !== keep).flatMap(([, c]) => c)]);
    assert.ok(gate.some(k => walk(m, from, shut)[k] >= 0), `${keep}쪽 길만으로 궁 남문까지`);
  }
  const big = m.chests.find(c => c.big);
  assert.ok(inside({ x: big.x, y: big.y, w: 1, h: 1 }, sec('노움의 보물방')), '큰 상자는 노움의 보물방');
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  assert.ok(secretCells.length && !(walk(m, from, new Set([...bodies, ...secretCells]))[(big.y + 1) * m.w + big.x] >= 0), '샛길 없이는 못 감');
  const next = m.ports.find(p => p.name === 'next');
  assert.equal(next.place, '동방', '멀린 뒤 문 — 장소가 동방으로');
});

test('10격 천하제일 비무대 — 객잔 마을 → 바위 등성이로 갈린 세 갈래(서쪽 불가 · 가운데 세가 거리 · 동쪽 도가)가 비무대 앞 관전석에서 만나 비무대 위의 천마 → 천산 눈길 · 능선 절벽의 기연 동굴', () => {
  const data = loadData();
  const m = loadMap('murim');
  const sec = name => m.areas.find(a => a.section && a.name === name);
  const post = name => m.posts.find(p => p.name === name);
  const spot = name => post(name) || (a => ({ x: a.x, y: a.y + a.h / 2, w: 1, h: 1 }))(m.areas.find(a => a.monster === data.ENEMIES.find(e => e.name === name).id));
  const inside = (p, a) => p.x >= a.x && p.y >= a.y && p.x + p.w <= a.x + a.w && p.y + p.h <= a.y + a.h;
  const lv = name => data.ENEMIES.find(e => e.name === name).level;
  const routes = {
    '서쪽 불가': ['아미파 사태', '소림 나한', '달마'],
    '가운데 세가 거리': ['남궁세가 가주', '사천당가 독수', '모용세가 공자', '제갈세가 군사', '하북팽가 도객'],
    '동쪽 도가': ['무당 도사', '화산파 매화검수', '장삼봉', '북해빙궁 무사'],
    '마을 → 산꼭대기': ['흑도 낭인', '천마']
  };
  for (const [r, list] of Object.entries(routes)) for (let i = 1; i < list.length; i++)
    assert.ok(lv(list[i]) > lv(list[i - 1]) && spot(list[i]).y < spot(list[i - 1]).y, `${r}: ${list[i - 1]} → ${list[i]} (셀수록 북쪽)`);
  const where = { '달마': '달마의 면벽 동굴', '남궁세가 가주': '남궁세가', '사천당가 독수': '사천당가', '모용세가 공자': '모용세가', '제갈세가 군사': '제갈세가 진법 정원', '하북팽가 도객': '하북팽가', '장삼봉': '태극 마당', '천마': '천하제일 비무대' };
  for (const [name, a] of Object.entries(where)) assert.ok(inside(post(name), sec(a)), `${name} 은(는) ${a}`);
  for (const p of m.posts.filter(q => !['달마', '제갈세가 군사', '천마'].includes(q.name))) {   // 면벽한 달마 · 진법 속 군사 · 보스 빼고 트인 땅
    let open = 0, all = 0;
    for (let y = p.y - 3; y < p.y + p.h + 3; y++) for (let x = p.x - 3; x < p.x + p.w + 3; x++) { all++; if (!m.solid[y * m.w + x]) open++; }
    assert.ok(open / all > 0.75, `${p.name} — 트인 땅 (${Math.round(open / all * 100)}%)`);
  }
  // 흙길은 건물(객잔 · 장원 · 절) 안을 지나지 않음 — 담 안 칸에 흙길 없음
  for (const name of ['객잔', '남궁세가', '사천당가', '모용세가', '제갈세가 진법 정원', '하북팽가']) {
    const a = sec(name);
    for (let y = a.y + 1; y < a.y + a.h - 1; y++) for (let x = a.x + 1; x < a.x + a.w - 1; x++) assert.notEqual(m.tile[y * m.w + x], gen.ROAD, `${name} 안에 흙길 (${x}, ${y})`);
  }
  // 세 갈래 — 둘을 막아도 남은 하나로 비무대 앞 관전석까지
  const bodies = m.posts.flatMap(q => cellsOf(m, q)), from = [m.start.y * m.w + m.start.x];
  const plaza = sec('비무대 앞 관전석'), goal = []; for (let x = plaza.x; x < plaza.x + plaza.w; x++) goal.push((plaza.y + 2) * m.w + x);
  const band = (x0, x1) => { const out = []; for (let y = 64; y < 132; y++) for (let x = x0; x < x1; x++) out.push(y * m.w + x); return out; };
  const lanes = { 서: band(0, 47), 가운데: band(47, 95), 동: band(95, m.w) };
  for (const keep of Object.keys(lanes)) {
    const shut = new Set([...bodies, ...Object.entries(lanes).filter(([k]) => k !== keep).flatMap(([, c]) => c)]);
    assert.ok(goal.some(k => walk(m, from, shut)[k] >= 0), `${keep}쪽 길만으로 관전석까지`);
  }
  const big = m.chests.find(c => c.big);
  assert.ok(inside({ x: big.x, y: big.y, w: 1, h: 1 }, sec('기연의 동굴')), '큰 상자는 기연의 동굴');
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  assert.ok(secretCells.length && !(walk(m, from, new Set([...bodies, ...secretCells]))[(big.y + 1) * m.w + big.x] >= 0), '샛길 없이는 못 감');
  const next = m.ports.find(p => p.name === 'next');
  assert.ok(!next.place && next.to === `${gen.rankMapId(11)}.in`, '천산으로 — 장소는 그대로 동방');
});

test('11격 천산 — 나선 길: 바깥 고리(기슭 → 동 청룡 → 북 구미호 → 서 백호 · 웅녀 · 산군)에서 한 단 올라 안쪽 고리(남 주작 → 금시조 → 화린 → 북 현무 → 금강영구) → 정상 천지의 이무기 · 사신수는 제 방위 · 얼음 동굴 지름길', () => {
  const data = loadData();
  const m = loadMap('tianshan');
  const sec = name => m.areas.find(a => a.section && a.name === name);
  const post = name => m.posts.find(p => p.name === name);
  const inside = (p, a) => p.x >= a.x && p.y >= a.y && p.x + p.w <= a.x + a.w && p.y + p.h <= a.y + a.h;
  const foe = name => data.ENEMIES.find(e => e.name === name);
  // 사신수는 제 방위 — 정상 한가운데에서 본 쪽
  const cx = m.w / 2, cy = m.h / 2, mid = p => ({ x: p.x + p.w / 2 - cx, y: p.y + p.h / 2 - cy });
  assert.ok(mid(post('청룡')).x > 0 && Math.abs(mid(post('청룡')).x) > Math.abs(mid(post('청룡')).y), '청룡은 동쪽');
  assert.ok(mid(post('백호')).x < 0 && Math.abs(mid(post('백호')).x) > Math.abs(mid(post('백호')).y), '백호는 서쪽');
  assert.ok(mid(post('주작')).y > 0 && Math.abs(mid(post('주작')).y) > Math.abs(mid(post('주작')).x), '주작은 남쪽');
  assert.ok(mid(post('현무')).y < 0 && Math.abs(mid(post('현무')).y) > Math.abs(mid(post('현무')).x), '현무는 북쪽');
  // 나선 — 숨은 샛길 없이 걸으면, 일반 · 정예를 레벨 순서대로 만남 (걸어서 닿는 거리가 레벨 순)
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  const from = [m.start.y * m.w + m.start.x], bodies = new Set(m.posts.flatMap(q => cellsOf(m, q)));
  const d = walk(m, from, new Set([...secretCells]));
  const reach = name => {
    const p = post(name);
    if (p) { let best = Infinity; for (let y = p.y - 1; y <= p.y + p.h; y++) for (let x = p.x - 1; x <= p.x + p.w; x++) { const k = y * m.w + x; if (!bodies.has(k) && d[k] >= 0) best = Math.min(best, d[k]); } return best; }
    const a = m.areas.find(q => q.monster === foe(name).id); return d[a.mid.y * m.w + a.mid.x];
  };
  const order = data.ENEMIES.filter(e => e.rank.n === 11 && (e.kind === 'normal' || e.kind === 'elite')).sort((p, q) => p.level - q.level).map(e => e.name);
  for (let i = 1; i < order.length; i++) assert.ok(reach(order[i]) > reach(order[i - 1]), `${order[i - 1]}(${reach(order[i - 1])}칸) → ${order[i]}(${reach(order[i])}칸)`);
  const where = { '웅녀': '웅녀의 곰 동굴', '이무기': '정상 천지', '봉황': '정상 천지', '구미호': '북쪽 산허리 — 여우 고개' };
  for (const [name, a] of Object.entries(where)) assert.ok(inside(post(name), sec(a)), `${name} 은(는) ${a}`);
  for (const p of m.posts.filter(q => !['웅녀', '금시조', '이무기'].includes(q.name))) {   // 곰 동굴의 웅녀 · 절벽 둥지의 금시조 · 보스 빼고 트인 땅
    let open = 0, all = 0;
    for (let y = p.y - 3; y < p.y + p.h + 3; y++) for (let x = p.x - 3; x < p.x + p.w + 3; x++) { all++; if (!m.solid[y * m.w + x]) open++; }
    assert.ok(open / all > 0.75, `${p.name} — 트인 땅 (${Math.round(open / all * 100)}%)`);
  }
  // 얼음 동굴 — 숨은 샛길로만, 큰 상자. 샛길로 바깥 서쪽에서 안쪽 북서쪽으로 건너뜀
  const big = m.chests.find(c => c.big), ice = sec('얼음 동굴');
  assert.ok(inside({ x: big.x, y: big.y, w: 1, h: 1 }, ice), '큰 상자는 얼음 동굴');
  assert.ok(!(d[(big.y + 1) * m.w + big.x] >= 0), '샛길 없이는 못 감');
  const all = walk(m, from, new Set());
  assert.ok(all[(ice.y + 6) * m.w + ice.x + ice.w + 1] < d[(ice.y + 6) * m.w + ice.x + ice.w + 1], '얼음 동굴로 지름길');
  assert.equal(m.ports.find(p => p.name === 'next').place, '신화의 땅', '이무기 뒤 — 장소가 신화의 땅으로');
});

test('12격 잊혀진 성역 — 구름 계단 끝 성스러운 숲 → 세 갈래(서쪽 바다의 과업 · 가운데 신성한 짐승 · 동쪽 땅의 과업)가 세상 끝 광장에서 만나 하데스의 문 · 헤스페리데스 정원 → 잊혀진 신전의 수호룡 · 크레타 섬의 다이달로스의 미궁', () => {
  const data = loadData();
  const m = loadMap('sanctuary');
  const sec = name => m.areas.find(a => a.section && a.name === name);
  const post = name => m.posts.find(p => p.name === name);
  const spot = name => post(name) || (a => ({ x: a.x, y: a.y + a.h / 2, w: 1, h: 1 }))(m.areas.find(a => a.monster === data.ENEMIES.find(e => e.name === name).id));
  const inside = (p, a) => p.x >= a.x && p.y >= a.y && p.x + p.w <= a.x + a.w && p.y + p.h <= a.y + a.h;
  const lv = name => data.ENEMIES.find(e => e.name === name).level;
  const routes = {
    '서쪽 바다의 과업': ['크레타의 황소', '크라켄', '게리온'],
    '가운데 신성한 짐승': ['유니콘', '페가수스', '스핑크스', '피닉스', '히포그리프'],
    '동쪽 땅의 과업': ['네메아의 사자', '케리네이아의 사슴', '에리만토스의 멧돼지', '스팀팔로스의 새', '디오메데스의 말'],
    '세상 끝': ['케르베로스', '라돈', '성역의 수호룡']
  };
  for (const [r, list] of Object.entries(routes)) for (let i = 1; i < list.length; i++)
    assert.ok(lv(list[i]) > lv(list[i - 1]) && spot(list[i]).y < spot(list[i - 1]).y, `${r}: ${list[i - 1]} → ${list[i]} (셀수록 북쪽)`);
  const where = { '크레타의 황소': '크레타 섬', '크라켄': '해협', '게리온': '에리테이아 — 세상 서쪽 끝 섬', '페가수스': '히포크레네 샘', '스핑크스': '테베 성문', '피닉스': '재의 제단',
    '네메아의 사자': '네메아의 사자 굴', '케리네이아의 사슴': '케리네이아 숲', '에리만토스의 멧돼지': '에리만토스 설산', '스팀팔로스의 새': '스팀팔로스 늪', '디오메데스의 말': '트라키아 마구간',
    '케르베로스': '하데스의 문', '라돈': '헤스페리데스의 정원', '성역의 수호룡': '잊혀진 신전' };
  for (const [name, a] of Object.entries(where)) assert.ok(inside(post(name), sec(a)), `${name} 은(는) ${a}`);
  // 게리온 · 라돈은 전설대로 세상 서쪽 끝 — 지도 서쪽 반에
  for (const name of ['게리온', '라돈']) assert.ok(post(name).x < m.w / 2, `${name} — 서쪽`);
  for (const p of m.posts.filter(q => !['네메아의 사자', '디오메데스의 말', '크라켄', '성역의 수호룡'].includes(q.name))) {   // 굴 · 마구간 · 모래톱 · 보스 빼고 트인 땅
    let open = 0, all = 0;
    for (let y = p.y - 3; y < p.y + p.h + 3; y++) for (let x = p.x - 3; x < p.x + p.w + 3; x++) { all++; if (!m.solid[y * m.w + x]) open++; }
    assert.ok(open / all > 0.75, `${p.name} — 트인 땅 (${Math.round(open / all * 100)}%)`);
  }
  const bodies = m.posts.flatMap(q => cellsOf(m, q)), from = [m.start.y * m.w + m.start.x];
  const temple = sec('잊혀진 신전'), door = []; for (let x = 70; x < 81; x++) door.push((temple.y + temple.h) * m.w + x);
  const band = (x0, x1) => { const out = []; for (let y = 56; y < 130; y++) for (let x = x0; x < x1; x++) out.push(y * m.w + x); return out; };
  const lanes = { 서: band(0, 48), 가운데: band(48, 100), 동: band(100, m.w) };
  for (const keep of Object.keys(lanes)) {
    const shut = new Set([...bodies, ...Object.entries(lanes).filter(([k]) => k !== keep).flatMap(([, c]) => c)]);
    assert.ok(door.some(k => walk(m, from, shut)[k] >= 0), `${keep}쪽 길만으로 신전 남문까지`);
  }
  const big = m.chests.find(c => c.big);
  assert.ok(inside({ x: big.x, y: big.y, w: 1, h: 1 }, sec('다이달로스의 미궁')), '큰 상자는 미궁 한가운데');
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  assert.ok(secretCells.length && !(walk(m, from, new Set([...bodies, ...secretCells]))[(big.y + 1) * m.w + big.x] >= 0), '샛길 없이는 못 감');
  assert.ok(walk(m, from, new Set(bodies))[(big.y + 1) * m.w + big.x] >= 0, '샛길로 미로를 지나 닿음');
  const next = m.ports.find(p => p.name === 'next');
  assert.ok(!next.place && next.to === `${gen.rankMapId(13)}.in`, '엘리시온으로 — 장소는 그대로 신화의 땅');
});

test('13격 엘리시온 평원 — 레테 강을 건너 세 갈래(서쪽 그리스 · 동쪽 우루크 · 가운데 트로이 평원)가 켈트의 여울을 건너 북쪽 먼 땅에서 만나 하늘로 오르는 계단의 헤라클레스 · 영웅 열 모두 하나뿐(돌아다니는 일반 없음) · 트로이 목마', () => {
  const data = loadData();
  const m = loadMap('elysium');
  const sec = name => m.areas.find(a => a.section && a.name === name);
  const post = name => m.posts.find(p => p.name === name);
  const inside = (p, a) => p.x >= a.x && p.y >= a.y && p.x + p.w <= a.x + a.w && p.y + p.h <= a.y + a.h;
  const lv = name => data.ENEMIES.find(e => e.name === name).level;
  assert.equal(m.areas.filter(a => a.monster).length, 0, '돌아다니는 일반 없음');
  const routes = {
    '서쪽 그리스': ['테세우스', '페르세우스', '오디세우스', '아탈란테'],
    '동쪽 우루크': ['엔키두', '길가메시'],
    '가운데 트로이': ['헥토르', '아킬레우스'],
    '북쪽 먼 땅': ['쿠 훌린', '베오울프', '아르주나', '지그프리트', '헤라클레스']
  };
  for (const [r, list] of Object.entries(routes)) for (let i = 1; i < list.length; i++)
    assert.ok(lv(list[i]) > lv(list[i - 1]) && post(list[i]).y < post(list[i - 1]).y, `${r}: ${list[i - 1]} → ${list[i]} (셀수록 북쪽)`);
  const where = { '테세우스': '미로 어귀', '페르세우스': '메두사 석상 정원', '오디세우스': '오디세우스의 바닷가', '아탈란테': '경주로', '엔키두': '삼나무 숲', '길가메시': '우루크',
    '헥토르': '트로이 평원', '아킬레우스': '그리스 진영', '쿠 훌린': '켈트의 여울', '베오울프': '헤오로트 연회장', '아르주나': '쿠루크셰트라 전장', '지그프리트': '용의 둥지', '헤라클레스': '하늘로 오르는 계단' };
  for (const [name, a] of Object.entries(where)) assert.ok(inside(post(name), sec(a)), `${name} 은(는) ${a}`);
  for (const p of m.posts.filter(q => !['지그프리트', '헤라클레스'].includes(q.name))) {   // 용의 둥지 · 보스 빼고 트인 땅
    let open = 0, all = 0;
    for (let y = p.y - 3; y < p.y + p.h + 3; y++) for (let x = p.x - 3; x < p.x + p.w + 3; x++) { all++; if (!m.solid[y * m.w + x]) open++; }
    assert.ok(open / all > 0.75, `${p.name} — 트인 땅 (${Math.round(open / all * 100)}%)`);
  }
  const bodies = m.posts.flatMap(q => cellsOf(m, q)), from = [m.start.y * m.w + m.start.x];
  const goal = [40 * m.w + 75];
  const band = (x0, x1) => { const out = []; for (let y = 72; y < 126; y++) for (let x = x0; x < x1; x++) out.push(y * m.w + x); return out; };
  const lanes = { 서: band(0, 48), 가운데: band(48, 98), 동: band(98, m.w) };
  for (const keep of Object.keys(lanes)) {
    const shut = new Set([...bodies, ...Object.entries(lanes).filter(([k]) => k !== keep).flatMap(([, c]) => c)]);
    assert.ok(goal.some(k => walk(m, from, shut)[k] >= 0), `${keep}쪽 길만으로 북쪽 먼 땅까지`);
  }
  const big = m.chests.find(c => c.big);
  assert.ok(inside({ x: big.x, y: big.y, w: 1, h: 1 }, sec('트로이 목마')), '큰 상자는 트로이 목마 속');
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  assert.ok(secretCells.length && !(walk(m, from, new Set([...bodies, ...secretCells]))[(big.y + 1) * m.w + big.x] >= 0), '샛길 없이는 못 감');
  assert.equal(m.ports.find(p => p.name === 'next').place, '하늘과 지옥', '헤라클레스 뒤 — 장소가 하늘과 지옥으로');
});

test('14격 일곱 번째 하늘 — 진주 문 섬에서 들쭉날쭉한 구름 섬을 하나씩 오름(반듯하게 쌓지 않음): 섬마다 대천사 하나(그 층에서 가장 셈, 섬의 뒤)와 낮은 품계부터 나눈 성가대 · 섬 사이 빛의 다리 두 줄 · 왕좌 섬 뒤 미카엘 · 따로 뜬 에덴동산', () => {
  const data = loadData();
  const m = loadMap('heaven');
  const H = gen.HEAVEN;
  const sec = name => m.areas.find(a => a.section && a.name === name);
  const inside = (p, a) => p.x >= a.x && p.y >= a.y && p.x + p.w <= a.x + a.w && p.y + p.h <= a.y + a.h;
  const foes = data.ENEMIES.filter(e => e.rank.n === 14);
  const spot = e => m.posts.find(p => p.enemy === e.id) || m.areas.find(a => a.monster === e.id);
  const tiers = H.islands.filter(t => t[5]);
  let below = -Infinity;
  for (const [name, cx, cy, rx, ry, angel] of tiers) {
    const t = sec(name), mine = foes.filter(e => e.kind !== 'boss' && inside({ ...spot(e), y: spot(e).y + (spot(e).h >> 1), h: 1 }, t));
    const a = mine.find(e => e.name === angel);
    assert.ok(a && a.kind === 'elite', `${name} — ${angel}`);
    assert.ok(mine.every(e => e === a || e.level < a.level), `${name} — ${angel} 이(가) 그 층에서 가장 셈`);
    assert.ok(Math.min(...mine.map(e => e.level)) > below, `${name} 은(는) 아래층보다 셈`);
    below = Math.max(...mine.map(e => e.level));
    assert.ok(spot(a).y < cy, `${angel} 은(는) 섬의 뒤(북쪽)`);
  }
  // 반듯하지 않음 — 섬마다 가운데 · 크기가 다르고, 대천사가 한 세로줄에 서지 않음
  assert.ok(new Set(tiers.map(t => t[1])).size >= 5 && new Set(tiers.map(t => t[3])).size >= 5, '섬이 엇갈리고 크기가 다름');
  assert.ok(new Set(tiers.map(t => Math.round(spot(foes.find(e => e.name === t[5])).x / 6))).size >= 4, '대천사가 한 줄에 서지 않음');
  // 빛의 다리 두 줄 — 층마다 왼쪽 다리만 막아도 · 오른쪽 다리만 막아도 미카엘 앞까지
  const bodies = m.posts.flatMap(q => cellsOf(m, q)), from = [m.start.y * m.w + m.start.x];
  const mi = m.posts.find(p => p.name === '미카엘'), front = []; for (let x = mi.x; x < mi.x + mi.w; x++) front.push((mi.y + mi.h) * m.w + x);
  const midCells = b => { const out = []; for (let k = 35; k <= 65; k++) { const t = k / 100, u = 1 - t; const x = u * u * b.p0[0] + 2 * u * t * b.c[0] + t * t * b.p1[0], y = u * u * b.p0[1] + 2 * u * t * b.c[1] + t * t * b.p1[1]; for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) out.push((Math.round(y) + j) * m.w + Math.round(x) + i); } return out; };
  for (const side of ['왼쪽', '오른쪽']) {
    const shut = new Set(bodies);
    for (const b of H.bridges) {
      const legs = H.bridges.filter(q => q.from === b.from);
      if (legs.length < 2) continue;
      const left = b.p0[0] === Math.min(...legs.map(q => q.p0[0]));
      if (left === (side === '왼쪽')) for (const k of midCells(b)) shut.add(k);
    }
    assert.ok(front.some(k => walk(m, from, shut)[k] >= 0), `${side} 다리를 다 막아도 다른 다리로 미카엘 앞까지`);
  }
  for (const p of m.posts.filter(q => q.name !== '미카엘')) {
    let open = 0, all = 0;
    for (let y = p.y - 3; y < p.y + p.h + 3; y++) for (let x = p.x - 3; x < p.x + p.w + 3; x++) { all++; if (!m.solid[y * m.w + x]) open++; }
    assert.ok(open / all > 0.75, `${p.name} — 트인 땅 (${Math.round(open / all * 100)}%)`);
  }
  const big = m.chests.find(c => c.big);
  assert.ok(inside({ x: big.x, y: big.y, w: 1, h: 1 }, sec('에덴동산')), '큰 상자는 에덴동산');
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  assert.ok(secretCells.length && !(walk(m, from, new Set([...bodies, ...secretCells]))[(big.y + 1) * m.w + big.x] >= 0), '보이지 않는 다리 없이는 못 감');
  const next = m.ports.find(p => p.name === 'next');
  assert.ok(!next.place && next.to === `${gen.rankMapId(15)}.in`, '하늘의 갈라진 틈으로 — 장소는 그대로 하늘과 지옥');
});

test('15격 얼어붙은 코키토스 — 깔때기로 꺼지는 원 일곱(안쪽일수록 셈, 단테의 죄마다 그 죄의 마신) · 원마다 좌우 어느 쪽으로 돌아도 다음 비탈 · 원 사이 벽은 끊기지 않음 · 한가운데 얼음 둑 끝의 루시퍼 · 숨은 고귀한 이교도들의 성', () => {
  const data = loadData();
  const m = loadMap('inferno');
  const I = gen.INFERNO;
  const areaName = p => { const k = m.areaAt[(p.y + (p.h >> 1)) * m.w + p.x + (p.w >> 1)]; return k >= 0 ? m.areas[k].name : null; };
  const post = name => m.posts.find(p => p.name === name);
  const ringOf = name => I.rings.findIndex(r => r[0] === areaName(post(name)));
  const sins = { '아스모데우스': '색욕', '벨제부브': '탐식', '아스타로트': '나태', '발람': '말레볼제', '자간': '말레볼제' };
  for (const [name, sin] of Object.entries(sins)) assert.ok(areaName(post(name)).includes(sin), `${name} 은(는) ${sin}의 원 (${areaName(post(name))})`);
  // 안쪽 원일수록 셈 — 원마다 가장 약한 자가 바깥 원의 가장 센 자보다 셈
  const byRing = I.rings.map(() => []);
  for (const e of data.ENEMIES.filter(x => x.rank.n === 15 && x.kind !== 'boss' && (x.kind !== 'normal' || x.solo))) { const k = ringOf(e.name); assert.ok(k >= 0, `${e.name} 은(는) 어느 원에`); byRing[k].push(e.level); }
  for (let k = 1; k < byRing.length; k++) assert.ok(Math.min(...byRing[k]) > Math.max(...byRing[k - 1]), `${I.rings[k][0]} 은(는) 바깥 원보다 셈`);
  // 원마다 좌우 — 원에 들어선 자리와 다음 비탈 사이, 한쪽 반을 끊어도 다른 쪽으로 루시퍼 앞까지
  const bodies = m.posts.flatMap(q => cellsOf(m, q)), from = [m.start.y * m.w + m.start.x];
  const lu = post('루시퍼'), front = []; for (let y = lu.y; y < lu.y + lu.h; y++) front.push(y * m.w + lu.x + lu.w);
  assert.ok(front.some(k => walk(m, from, new Set(bodies))[k] >= 0), '루시퍼 앞까지');
  const [cx, cy] = I.C;
  for (let k = 0; k < I.rings.length; k++) {
    const enter = k === 0 ? I.entry : I.rings[k - 1][3], leave = I.rings[k][3];
    const mid = (a, b, sgn) => { let d = ((b - a) % 360 + 360) % 360; if (sgn < 0) d -= 360; return a + d / 2; };
    for (const sgn of [1, -1]) {
      const cut = mid(enter, leave, sgn), shut = new Set(bodies);
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx, dy), d = Math.atan2(dy, dx) * 180 / Math.PI;
        const diff = Math.abs(((d - cut) % 360 + 540) % 360 - 180);
        if (r > I.rings[k][1] - 4 && r < I.rings[k][2] + 4 && diff < 4) shut.add(y * m.w + x);
      }
      assert.ok(front.some(q => walk(m, from, shut)[q] >= 0), `${I.rings[k][0]} — ${sgn > 0 ? '한쪽' : '다른 쪽'} 반을 끊어도 루시퍼 앞까지`);
    }
  }
  // 원 사이 벽은 끊기지 않음 — 비탈을 다 막으면 첫째 원 밖으로 못 내려감
  const shut = new Set(bodies);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const d = Math.atan2(y + 0.5 - cy, x + 0.5 - cx) * 180 / Math.PI;
    if (I.rings.some(r => Math.abs(((d - r[3]) % 360 + 540) % 360 - 180) < 6) && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < I.rings[0][1] + 2) shut.add(y * m.w + x);
  }
  const dd = walk(m, from, shut);
  assert.ok(!(dd[cy * m.w + cx + I.rings[1][2] - 5] >= 0) && !(dd[(cy - I.rings[1][2] + 5) * m.w + cx] >= 0), '비탈 말고는 둘째 원으로 못 내려감');
  // 숨은 성 · 다음 격
  const big = m.chests.find(c => c.big), castle = m.areas.find(a => a.name === '고귀한 이교도들의 성');
  assert.ok(big.x >= castle.x && big.x < castle.x + castle.w && big.y >= castle.y && big.y < castle.y + castle.h, '큰 상자는 숨은 성');
  const secretCells = []; for (let k = 0; k < m.w * m.h; k++) if (m.secret[k]) secretCells.push(k);
  assert.ok(secretCells.length && !(walk(m, from, new Set([...bodies, ...secretCells]))[(big.y + 1) * m.w + big.x] >= 0), '샛길 없이는 못 감');
  assert.equal(m.ports.find(p => p.name === 'next').place, '신들의 시대', '루시퍼 너머 — 장소가 신들의 시대로');
});

test('조이스틱이 향하는 쪽으로 — 비스듬히 밀면 대각선 · 곧은 걸음을 섞어 그 각도대로 곧게, 대각선도 같은 빠르기', () => {
  const rows = ['########################'];
  for (let y = 0; y < 14; y++) rows.push('#' + (y === 0 ? '@' : '.') + '.'.repeat(21) + '#');
  rows.push('########################');
  const w = M.createWorld(mapOf(rows), {}, 1);
  w.mobs = [];
  const a = Math.PI / 6, v = { x: Math.cos(a), y: Math.sin(a) }, o = { x: w.player.x, y: w.player.y };   // 30도 아래 오른쪽
  M.setInput(w, v);
  let worst = 0, diag = 0, straight = 0, last = { ...o };
  run(w, 1.2, () => {
    const p = w.player;
    if (p.x !== last.x || p.y !== last.y) { (p.x !== last.x && p.y !== last.y ? diag++ : straight++); last = { x: p.x, y: p.y }; }
    worst = Math.max(worst, Math.abs((p.x - o.x) * v.y - (p.y - o.y) * v.x));
  });
  assert.ok(diag > 0 && straight > 0, `대각선 ${diag} · 곧은 ${straight} 걸음을 섞음`);
  assert.ok(worst < 0.8, `그은 줄에서 한 칸 안쪽 (${worst.toFixed(2)})`);
  const ang = Math.atan2(w.player.y - o.y, w.player.x - o.x);
  assert.ok(Math.abs(ang - a) < 0.1, `간 쪽이 민 쪽 (${(ang * 180 / Math.PI).toFixed(1)}도)`);
  // 빠르기 — 같은 시간에 걸은 길이(대각선 한 걸음은 √2)가 곧게 걸은 것과 같음
  const walked = dir => {
    const w2 = M.createWorld(mapOf(rows), {}, 1);
    w2.mobs = [];
    M.setInput(w2, dir);
    run(w2, 0.8);
    return { dx: w2.player.x - o.x, dy: w2.player.y - o.y };
  };
  const d = walked({ x: 1, y: 1 }), s = walked('right');
  assert.equal(d.dx, d.dy, '곧은 대각선');
  assert.ok(Math.abs(Math.hypot(d.dx, d.dy) - s.dx) <= 1.5, `대각선 ${Math.hypot(d.dx, d.dy).toFixed(1)}칸 · 곧게 ${s.dx}칸`);
});

test('미끄러지듯 걷기 — 칸에 매이지 않고 고르게 나아가고, 떼면 그 자리(칸 사이)에 섬. 몸은 벽에 겹치지 않고, 비스듬히 밀면 벽을 따라 미끄러짐', () => {
  const m = mapOf([
    '##########',
    '#@.#.....#',
    '#........#',
    '#........#',
    '##########'
  ]);
  const w = M.createWorld(m, {}, 1);
  w.mobs = [];
  const p = w.player, at = () => ({ x: p.x + 0.5 + p.ox, y: p.y + 0.5 + p.oy });
  const clear = () => {                              // 몸 네모가 어떤 벽 칸과도 겹치지 않음
    const c = at(), r = R.PLAYER_R;
    for (let j = Math.floor(c.y - r); j <= Math.floor(c.y + r - 1e-9); j++) for (let i = Math.floor(c.x - r); i <= Math.floor(c.x + r - 1e-9); i++)
      assert.ok(!m.solid[j * m.w + i], `벽 (${i}, ${j}) 에 겹침`);
  };
  // 고르게 — 장면마다 초당 12칸 × 걸린 시간만큼
  w.player.x = 1; w.player.y = 2;
  M.setInput(w, 'right');
  let last = at();
  for (let k = 0; k < 6; k++) {
    M.tick(w, 0.02);
    const c = at();
    assert.ok(Math.abs(c.x - last.x - R.PLAYER_SPEED * 0.02) < 1e-6 && c.y === last.y, `고르게 (${(c.x - last.x).toFixed(3)})`);
    last = c;
  }
  // 떼면 그 자리 — 칸 가운데로 끌려가지 않음
  M.setInput(w, null);
  const stop = at();
  run(w, 0.3);
  assert.deepEqual(at(), stop, '뗀 자리 그대로');
  assert.ok(Math.abs(p.ox) > 0.05, '칸 사이에 섬');
  // 오른쪽 아래로 — 오른쪽(3, 1)이 벽이라 그 모서리를 깎지 않고 미끄러져 내려가 지나감
  p.x = 2; p.y = 1; p.ox = 0; p.oy = 0;
  M.setInput(w, { x: 1, y: 1 });
  run(w, 0.4, clear);
  assert.ok(p.x >= 3 && p.y >= 2, `벽 모서리를 돌아 오른쪽 아래로 (${p.x}, ${p.y})`);
  M.setInput(w, null);
  // 벽에 대고 비스듬히 위 오른쪽 — 위는 막혀 오른쪽으로만 미끄러지다 (3, 1) 벽 앞에서 섬
  p.x = 1; p.y = 1; p.ox = 0; p.oy = 0;
  M.setInput(w, { x: 0.5, y: -1 });
  run(w, 0.5, clear);
  assert.equal(p.y, 1);
  assert.ok(Math.abs(at().x - (3 - R.PLAYER_R)) < 1e-6, `벽 바로 앞까지 (${at().x.toFixed(3)})`);
  M.setInput(w, null);
  // 곧게 위로 — 벽이라 그대로
  p.x = 1; p.y = 1; p.ox = 0; p.oy = 0;
  M.setInput(w, 'up');
  run(w, 0.3);
  assert.deepEqual([p.x, p.y, +p.ox.toFixed(6), +p.oy.toFixed(6)], [1, 1, 0, 0]);
});

test('미끄러지듯 걷기 — 한 칸짜리 길 · 문 앞에서 조금 비껴 있어도 그 줄 가운데로 비켜 들어감', () => {
  const m = mapOf([
    '#######',
    '#.....#',
    '#@.....',
    '#.....#',
    '#######'
  ]);
  const w = M.createWorld(m, {}, 1);
  w.mobs = [];
  const p = w.player;
  p.x = 4; p.y = 2; p.oy = 0.3;                    // 한 칸 길(6, 2) 줄에서 0.3칸 아래로 비껴
  M.setInput(w, 'right');
  run(w, 0.5);
  assert.equal(p.y, 2);
  assert.equal(p.x, 6, '한 칸 길로 들어섬');
  assert.ok(Math.abs(p.oy) < 0.13, `줄 가운데로 비켜 (${p.oy.toFixed(3)})`);
});

// ---------- 도시 — 옛 동네 · 헌터들의 도시 (docs/CITY-PLAN.md 1-가) ----------
// 지도 속성 blds 의 건물 네모가 건물 칸(겉모습 BUILD)을 빠짐없이 · 겹치지 않게 덮고, 문은 그 건물 아래 줄 · 아직 닫힘
function checkTown(m, d) {
  const blds = JSON.parse(m.props.blds), BUILD = 12, owner = new Map(), area = b => b.w * b.h;
  for (const [n, b] of blds.entries()) for (const i of cellsOf(m, b)) {
    assert.ok(!owner.has(i), `${m.id} 건물 ${n} 겹침`);
    owner.set(i, n);
    const hang = ((i / m.w) | 0) < b.y + (b.over || 0);                         // over — 길 위로 늘린 옥상 (걷는 칸 그대로)
    if (hang) assert.ok(!m.solid[i], `${m.id} 건물 ${n} — 길 위로 늘린 옥상 밑은 걸을 수 있음`);
    else if (!b.overLot) assert.equal(m.look[i] & 15, BUILD, `${m.id} 건물 ${n} — 건물 칸이 아닌 곳을 덮음`);   // overLot — 빈터 위의 내 길드(4단계부터 그림만 건물)
  }
  for (let i = 0; i < m.w * m.h; i++) if ((m.look[i] & 15) === BUILD) assert.ok(owner.has(i), `${m.id} 건물 칸 ${i % m.w},${(i / m.w) | 0} 이(가) 어느 건물에도 안 듦`);
  for (const p of m.ports.filter(q => q.door)) {
    const b = blds[owner.get(p.y * m.w + p.x)];
    assert.ok(b && p.y === b.y + b.h - 1 && p.x >= b.x && p.x + p.w <= b.x + b.w, `${m.id} ${p.label || p.name} — 건물 아래 줄`);
    if (p.to) assert.ok(cellsOf(m, p).every(i => !m.solid[i] && d[i] >= 0), `${m.id} ${p.label || p.name} — 열린 문은 걸어 들어감`);
    else assert.ok(cellsOf(m, p).every(i => m.solid[i]), `${m.id} ${p.label || p.name} — 아직 닫힘`);
    assert.ok(d[(p.y + 1) * m.w + p.x] >= 0, `${m.id} ${p.label || p.name} 앞은 걸을 수 있음`);
  }
  // 건물끼리 붙지 않음 (골목 끝의 덧붙인 채 — 두 칸짜리 — 만 빼고)
  for (const [n, b] of blds.entries()) for (const [k, c] of blds.entries()) {
    if (k <= n || area(b) <= 4 || area(c) <= 4) continue;
    const gapX = Math.max(c.x - (b.x + b.w), b.x - (c.x + c.w)), gapY = Math.max(c.y - (b.y + b.h), b.y - (c.y + c.h));
    assert.ok(gapX >= 1 || gapY >= 1, `${m.id} 건물 ${n}(${b.kind}) · ${k}(${c.kind}) 사이가 뜸`);
  }
  assert.equal(m.areas.length, 0);
  assert.equal(m.posts.length, 0);
  assert.equal(m.chests.length, 0);
  return blds;
}

test('도시 — 옛 동네(집 앞에서 시작 · 골목 막다른 곳의 이상한 게이트 · 오른쪽 끝 통로) ⇄ 헌터들의 도시(왼쪽 끝 통로 · 협회 · 백화점 · 4대 길드 · 빈터)', () => {
  const old = loadMap('oldtown'), city = loadMap('city'), sewer = loadMap('sewer');
  const dOld = walk(old, [old.start.y * old.w + old.start.x]), dCity = walk(city, [city.start.y * city.w + city.start.x]);
  // 옛 동네 — 게이트는 지하수로 첫 공간의 게이트와 서로 이어짐
  const gate = old.ports.find(p => p.name === 'gate'), back = sewer.ports.find(p => p.name === 'city');
  assert.ok(gate && gate.rift && gate.to === 'sewer.city', '옛 동네 → 지하수로');
  assert.ok(back && back.rift && back.appears && back.needsCity && back.to === 'oldtown.gate', '지하수로 → 옛 동네 (도시가 열린 뒤에만)');
  assert.ok(cellsOf(old, gate).every(i => dOld[i] >= 0), '집 앞에서 게이트에 닿음');
  const plaza = sewer.areas.find(a => a.name === '첫 공간');
  assert.ok(back.x >= plaza.x && back.x + back.w <= plaza.x + plaza.w && back.y >= plaza.y && back.y < plaza.y + plaza.h, '지하수로 게이트는 첫 공간 안');
  const ds = walk(sewer, [sewer.start.y * sewer.w + sewer.start.x]);
  assert.ok(cellsOf(sewer, back).every(i => ds[i] >= 0), '지하수로 시작점에서 닿음');
  // 가장자리 통로 — 옛 동네 오른쪽 끝 ⇄ 도시 왼쪽 끝, 서로를 가리키고 걸어서 닿음
  const toCity = old.ports.find(p => p.name === 'city'), toOld = city.ports.find(p => p.name === 'oldtown');
  assert.ok(toCity && toCity.edge && toCity.to === 'city.oldtown' && toCity.arrive === 'left');
  assert.ok(toOld && toOld.edge && toOld.to === 'oldtown.city' && toOld.arrive === 'right');
  const walkBox = m => String(m.props.walk).split(',').map(Number);
  const [ox, , ow] = walkBox(old), [cx] = walkBox(city);
  assert.equal(toCity.x, ox + ow - 1, '옛 동네 걷는 곳의 오른쪽 끝');
  assert.equal(toOld.x, cx, '도시 걷는 곳의 왼쪽 끝');
  assert.ok(cellsOf(old, toCity).filter(i => !old.solid[i]).every(i => dOld[i] >= 0) && cellsOf(city, toOld).filter(i => !city.solid[i]).every(i => dCity[i] >= 0), '두 통로 다 걸어서 닿음 (가장자리 한 줄 전체 — 건물 칸 빼고)');
  assert.deepEqual([toCity.h, toOld.h], [walkBox(old)[3], walkBox(city)[3]], '통로는 가장자리 한 줄 전체 (사용자 결정 2026-11-19)');
  assert.ok(!old.solid[toCity.arriveY * old.w + toCity.x - 1] && !city.solid[toOld.arriveY * city.w + toOld.x + 1], '넘어와 서는 안쪽 칸이 트임');
  assert.equal(old.props.title, '옛 동네');
  assert.equal(city.props.title, '헌터들의 도시');
  // 있어야 하는 건물
  const oldBlds = checkTown(old, dOld), cityBlds = checkTown(city, dCity);
  assert.deepEqual(old.ports.filter(q => q.door).map(q => q.name).sort(), ['blackmarket', 'home', 'myguild']);
  assert.deepEqual(city.ports.filter(q => q.door).map(q => q.name).sort(), ['association', 'dept', 'guild1', 'guild2', 'guild3', 'guild4', 'home2', 'myguild2']);
  assert.deepEqual(city.ports.filter(q => q.door && q.to).map(q => q.name).sort(), ['association', 'dept', 'guild1', 'guild2', 'guild3', 'guild4', 'home2', 'myguild2'], '열린 문은 헌터 협회 · 헌터백화점 · 4대 길드(접수 창구) · 내 길드(4단계부터 — unlock guildCity) · 새 집(산 뒤 — unlock home2)');
  assert.deepEqual(old.ports.filter(q => q.door && q.to).map(q => q.name), ['home', 'myguild', 'blackmarket'], '옛 동네에서 열리는 문은 집 · 내 길드 · 암시장 (길드 · 암시장은 게임이 잠금 — unlock guild · bm)');
  const bmDoor = old.ports.find(q => q.name === 'blackmarket'), bm = loadMap('bm');
  assert.deepEqual([bmDoor.to, bmDoor.unlock, bm.ports.find(q => q.name === 'out').to], ['bm.out', 'bm', 'oldtown.blackmarket']);
  assert.deepEqual(bm.npcs.filter(n => n.shop).map(n => n.shop), ['bm']);
  const home = loadMap('home');
  assert.equal(home.ports.find(q => q.name === 'out').to, 'oldtown.home');
  assert.deepEqual(home.npcs.filter(n => n.shop).map(n => n.shop), ['bed']);
  const area = b => b.w * b.h, hq = cityBlds.find(b => b.kind === 'hq');
  assert.ok(cityBlds.every(b => b === hq || area(b) < area(hq)), '헌터 협회가 가장 큰 건물');
  assert.equal(cityBlds.filter(b => b.kind === 'guild').length, 4);
  assert.ok(!oldBlds.some(b => b.kind === 'hq' || b.kind === 'guild' || b.kind === 'dept' || b.kind === 'tower'), '옛 동네엔 미래 건물이 없음');
  // 가림막 친 빈터 셋 — 못 들어감 (도시)
  const SNOW = 8, lots = [];
  for (let i = 0; i < city.w * city.h; i++) if ((city.look[i] & 15) === SNOW) { assert.ok(city.solid[i], '빈터는 막힘'); lots.push(i); }
  assert.ok(lots.length >= 3 * 7 * 11, '빈터 셋');
});

test('헌터백화점 — 도시의 백화점 문으로 들어가면 1층, 무기 매장 점원에게 닿으면 상점(선 채로), 나가면 다시 도시의 문 앞 · 가구는 통로를 막지 않음', () => {
  const city = loadMap('city'), dept = loadMap('dept');
  const door = city.ports.find(p => p.name === 'dept'), out = dept.ports.find(p => p.name === 'out');
  assert.equal(door.to, 'dept.out', '도시의 백화점 문 → 백화점 안');
  assert.equal(out.to, 'city.dept', '백화점 안의 문 → 도시의 백화점 문');
  assert.ok(dept.props.interior && dept.props.store, '가게 안 지도');
  // 점원 — 무기 매장, 그 칸에는 못 서고 곁에는 설 수 있음
  const clerks = dept.npcs.filter(n => n.shop);
  assert.deepEqual(clerks.map(n => n.shop), ['weapon', 'mats'], '무기 매장 · 핵 창구');
  const blocked = new Set(clerks.map(n => n.y * dept.w + n.x));
  const d = walk(dept, [dept.start.y * dept.w + dept.start.x], blocked);
  for (const n of clerks) assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => d[(n.y + dy) * dept.w + n.x + dx] >= 0), '점원 곁에 설 수 있음');
  for (let i = 0; i < dept.w * dept.h; i++) if (!dept.solid[i] && !blocked.has(i)) assert.ok(d[i] >= 0, `갇힌 칸 없음 (${i % dept.w}, ${(i / dept.w) | 0})`);
  assert.ok(cellsOf(dept, out).every(i => d[i] >= 0), '나가는 문에 닿음');
  // 가구 — 막힌 칸, 통로(나가는 문 위로 곧게)는 비어 있음
  const blds = JSON.parse(dept.props.blds);
  for (const b of blds) for (const i of cellsOf(dept, b)) assert.ok(dept.solid[i], `${b.kind} 은 막힌 칸`);
  for (let y = clerks[0].y + 1; y < out.y; y++) for (let x = out.x; x < out.x + out.w; x++) assert.ok(!dept.solid[y * dept.w + x], '가운데 통로는 비어 있음');
  for (const kind of ['counter', 'case']) assert.ok(blds.some(b => b.kind === kind), `${kind} 이(가) 있음`);
  // 이름표만 있는 곳(2층)은 들어갈 수 없음
  // 에스컬레이터 앞 — 2층 방어구 매장으로 가는 문 (제1격 보스 전에는 잠김 — unlock 'armor'), 2층의 나가는 문은 1층 에스컬레이터 앞으로
  const up = dept.ports.find(q => q.name === 'up'), dept2 = loadMap('dept2'), down = dept2.ports.find(q => q.name === 'out');
  assert.ok(up && up.to === 'dept2.out' && up.unlock === 'armor', '1층 → 2층 문');
  assert.ok(down && down.to === 'dept.up', '2층 → 1층 문');
  assert.deepEqual(dept2.npcs.filter(n => n.shop).map(n => n.shop), ['armor']);
  // 점원에게 걸어가 닿으면 상점 사건 한 번, 그 앞에 선 채로
  const w = M.createWorld(dept, {}, 1);
  w.mobs = [];
  const c = clerks[0];
  w.player.x = c.x; w.player.y = c.y + 2; w.player.ox = 0; w.player.oy = 0;
  M.setInput(w, 'up');
  const ev = run(w, 1).filter(e => e.type === 'shop');
  assert.equal(ev.length, 1, '닿을 때 한 번');
  assert.equal(ev[0].npc.shop, 'weapon');
  assert.equal(w.player.y, c.y + 1, '점원 앞에 선 채로');
});

test('헌터백화점 물건 — 1~6격마다 무기 하나 · 보조무기 하나, 값은 격마다 오르고 몬스터 전리품과 번호가 안 겹침', () => {
  const { ITEMS } = loadData();
  const wares = ITEMS.filter(i => i.store === 'weapon');
  assert.equal(wares.length, 12);
  // 방어구 매장 (2층) — 격마다 투구 · 갑옷 · 장갑 · 신발, 값은 같은 격 무기의 절반
  const armor = ITEMS.filter(i => i.store === 'armor');
  assert.equal(armor.length, 24);
  for (let r = 1; r <= 6; r++) {
    assert.deepEqual(armor.filter(i => i.rank.n === r).map(i => i.slot).sort(), ['armor', 'boots', 'gloves', 'helm'], `${r}격 방어구`);
    assert.ok(Math.abs(armor.find(i => i.rank.n === r).price * 2 / wares.find(i => i.rank.n === r).price - 1) < 0.03, `${r}격 방어구 값 ≈ 무기의 절반`);
  }
  for (let r = 1; r <= 6; r++) assert.deepEqual(wares.filter(i => i.rank.n === r).map(i => i.slot).sort(), ['offhand', 'weapon'], `${r}격`);
  assert.ok(wares.every(i => i.store === 'weapon' && i.price > 0 && !i.ware && !i.chest));
  const price = r => wares.find(i => i.rank.n === r).price;
  for (let r = 2; r <= 6; r++) assert.ok(price(r) > price(r - 1), '격이 오르면 값도 오름');
  assert.equal(new Set(ITEMS.map(i => i.id)).size, ITEMS.length, '번호가 겹치지 않음');
});

test('재료 · 만들기는 없음 — 1~2격 짐승 일곱도 다시 제 장비를 떨어뜨림 (사용자 결정 2026-11-21)', () => {
  const { ENEMIES, ITEMS } = loadData();
  assert.ok(ENEMIES.every(e => !e.mat), '재료를 주는 몬스터 없음');
  assert.ok(ITEMS.every(i => !i.craft), '만드는 장비 없음');
  for (const id of ['giantrat', 'cavespider', 'darkwolf', 'harpy', 'treant', 'gargoyle', 'basilisk'])
    assert.equal(ITEMS.filter(i => i.from === id).length, 2, `${id} 는 장비 둘`);
});

test('핵 — 스무 격마다 한 가지, 격이 오르면 값도 오름', () => {
  const { CORES, RANKS } = loadData();
  const cores = Object.values(CORES);
  assert.equal(cores.length, RANKS.length);
  for (const r of RANKS) assert.ok(CORES[`core${r.n}`] && CORES[`core${r.n}`].rank.n === r.n && CORES[`core${r.n}`].core, `${r.n}격의 핵`);
  for (let n = 2; n <= RANKS.length; n++) assert.ok(CORES[`core${n}`].sell > CORES[`core${n - 1}`].sell, '격이 오르면 판 값도 오름');
});

// 규칙(js/game.js)까지 올린 판 — 저장 · 사고팔기처럼 화면 없이 볼 수 있는 것을 시험합니다. saves 는 미리 넣어 둘 저장(localStorage)
function loadGame(saves = {}) {
  const store = { ...saves };
  const ctx = { console, setTimeout, clearTimeout,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['js/data.js', 'js/game.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return code => JSON.parse(vm.runInContext(`JSON.stringify((() => { ${code} })())`, ctx));
}
const slotKey = n => `jjunsgame.rpg.v3.slot${n}`;

test('돈(원) — 도시는 돈으로 사고판다: 핵을 판 값은 돈, 백화점은 돈으로 (골드로는 못 삼) · 예전 저장의 짐승 재료는 돈으로', () => {
  const run = loadGame({ [slotKey(1)]: JSON.stringify({ runCount: 5, cityOpen: true, hunterGrade: 1, won: 0, gold: 5000000, owned: {}, mats: { core1: 200, giantrat: 3 } }) });
  const r = run(`
    currentSlot = 1; blockSaving(); load();
    const out = { start: [State.meta.gold, State.meta.won, matsOf('giantrat')] };
    out.legacy = Math.max(1, Math.round(goldFor(getEnemy('giantrat')))) * RULES.WON_SCALE * 3;
    State.meta.won = 0;
    out.noMoney = buyDept('dept_knife');
    out.sold = sellAllCores();
    out.afterSell = [State.meta.gold, State.meta.won, matsOf('core1')];
    out.bought = buyDept('dept_knife');
    out.end = [State.meta.gold, State.meta.won];
    out.owns = owns('dept_knife');
    out.v = { core: CORES.core1.sell, knife: getItem('dept_knife').price, scale: RULES.WON_SCALE };
    return out;`);
  const v = r.v;
  assert.deepEqual(r.start, [5000000, r.legacy, 0], '예전 저장의 쥐 가죽 셋은 불러올 때 돈으로 — 가방에서는 사라짐');
  assert.ok(r.legacy > 0);
  assert.equal(r.noMoney, false, '골드가 아무리 많아도 돈이 없으면 못 삼');
  assert.equal(r.sold, 200 * v.core);
  assert.deepEqual(r.afterSell, [5000000, 200 * v.core, 0], '핵을 판 값은 돈으로 — 골드는 그대로');
  assert.ok(r.bought && r.owns);
  assert.deepEqual(r.end, [5000000, 200 * v.core - v.knife], '값은 돈에서 빠지고 골드는 그대로');
  for (const n of [v.core, v.knife]) assert.ok(n > 0 && n % v.scale === 0, '도시의 값은 돈의 눈금(WON_SCALE)으로');
});

test('돈(원) — 돈이 생기기 전의 저장은 골드를 옮기지 않고 없앰 (가방은 그대로), 그 뒤의 저장은 골드 그대로', () => {
  const run = loadGame({
    [slotKey(1)]: JSON.stringify({ runCount: 5, cityOpen: true, gold: 4321, owned: {}, mats: { core1: 7 } }),                 // 예전 저장 — won 이 없음
    [slotKey(2)]: JSON.stringify({ runCount: 5, cityOpen: true, gold: 4321, won: 150000, owned: {}, mats: { core1: 7 } })
  });
  const r = run(`
    blockSaving();
    currentSlot = 1; load();
    const a = [State.meta.gold, State.meta.won, matsOf('core1')], saved = JSON.parse(JSON.stringify(State.meta));
    currentSlot = 2; load();
    const b = [State.meta.gold, State.meta.won, matsOf('core1')];
    return { a, b, again: saved.won, fresh: [freshMeta().gold, freshMeta().won] };`);
  assert.deepEqual(r.a, [0, 0, 7]);
  assert.equal(r.again, 0, '한 번 옮긴 저장에는 won 이 적혀 — 다음부터는 골드를 지우지 않음');
  assert.deepEqual(r.b, [4321, 150000, 7]);
  assert.deepEqual(r.fresh, [0, 0]);
});

test('돈 표기 — 5,000원 · 30만 원 · 123.4만 원 · 1.234억 원 (큰 단위는 네 자리까지, 아래는 버림)', () => {
  const run = loadGame();
  const r = run(`return [0, 5000, 10000, 18000, 300000, 1234000, 7430000, 99999000, 123400000, 56780000000000, -270000].map(fmtWon);`);
  assert.deepEqual(r, ['0원', '5,000원', '1만 원', '1.8만 원', '30만 원', '123.4만 원', '743만 원', '9,999만 원', '1.234억 원', '56.78조 원', '-27만 원']);
});

test('스탯 포인트 — 한 점만 찍어도 적어도 1 · 자동 분배는 2점씩 들어와도 비율대로 · 하던 회차는 포인트를 5로 나눠 옮김', () => {
  const run = loadGame();
  const r = run(`
    const out = { each: STAT_KEYS.map(k => POINT_VALUE[k]) };
    currentSlot = 0; State.meta = freshMeta(); startRun(); State.run.unspent = 0;
    // 1:1:1:1:1 로 레벨 하나(2점)씩 100번 — 한 스탯에 몰리지 않고 고르게 (각 40)
    setWeights(1, 1, 1, 1, 1);
    for (let i = 0; i < 100; i++) { State.run.unspent += POINTS_PER_LEVEL; commitPoints(); }
    out.even = STAT_KEYS.map(k => State.run.spent[k]);
    // 2:1 — 3점이 들어오면 2:1
    State.meta = freshMeta(); startRun(); State.run.unspent = 0;
    setWeights(2, 1, 0, 0, 0);
    for (let i = 0; i < 30; i++) { State.run.unspent += 1; commitPoints(); }
    out.twoOne = [State.run.spent.life, State.run.spent.damage, State.run.spent.defense];
    // 9천조(2^53)를 넘는 포인트도 멈추지 않고 다 들어감 (시뮬에서 Lv.3.8경에 멈췄던 것)
    setWeights(1, 1, 1, 1, 1); State.run.unspent = 7.6e16 + 3; commitPoints();
    out.huge = State.run.unspent === 0 && STAT_KEYS.every(k => State.run.spent[k] > 1e16);
    return out;
  `);
  assert.ok(r.each.every(v => v >= 1), '한 점이 1보다 작은 스탯이 있음: ' + r.each);
  assert.deepEqual(r.even, [40, 40, 40, 40, 40]);
  assert.deepEqual(r.twoOne, [20, 10, 0]);
  assert.ok(r.huge, '아주 큰 포인트도 끝까지 나눔');

  // 예전(v2) 회차 — 레벨당 10점일 때 찍은 생명 500 · 안 찍은 23 → 100 · 5 (힘은 그대로: 500×3.6 = 100×18)
  const runKey = 'jjunsgame.rpg.v3.slot1.run';
  const old = { v: 2, zoneIndex: 0, level: 50, xp: 0, energy: 20, unspent: 23, spent: { life: 500, damage: 0, defense: 0, dex: 0, luck: 0 } };
  const load = loadGame({ [slotKey(1)]: JSON.stringify({ runCount: 3 }), [runKey]: JSON.stringify(old) });
  const m = load(`currentSlot = 1; blockSaving(); load(); return [loadRun(), State.run.spent.life, State.run.unspent, allocatedStats().life];`);
  assert.deepEqual(m, [true, 100, 5, 1800]);
});

test('헌터 협회 — 등록해야 백화점에서 삼 · 시험은 회차에 한 번 · F 부터 이긴 데까지가 등급, 내려가지 않음 · 시험관은 등급마다 세짐', () => {
  const run = loadGame({ [slotKey(1)]: JSON.stringify({ runCount: 3, cityOpen: true, won: 999999999, owned: {} }) });
  const r = run(`
    currentSlot = 1; blockSaving(); load(); startRun();
    const out = { grade0: hunterGrade(), buy0: buyDept('dept_knife') };
    // 아주 센 나 — 다 이김 (S)
    const strong = { ...heroStats(), life: 1e12, damage: 1e11, defense: 1e10, dex: 1e10 };
    const _hs = heroStats; heroStats = () => strong;
    const t1 = takeHunterTest();
    out.t1 = [t1.passed, t1.grade, t1.bouts.length, gradeName()];
    out.again = takeHunterTest();                       // 같은 회차엔 다시 못 봄
    // 다음 회차 — 아주 약한 나: 다 짐, 등급은 그대로
    State.meta.runCount++; heroStats = () => ({ ..._hs(), life: 1, damage: 1 });
    const t2 = takeHunterTest();
    out.t2 = [t2.passed, t2.grade, t2.bouts.length];
    heroStats = _hs;
    out.buy1 = buyDept('dept_knife');
    out.lv = HUNTER_GRADES.map(g => g.level);
    out.ex = HUNTER_GRADES.map((g, i) => examinerStats(i + 1).life);
    return out;
  `);
  assert.equal(r.grade0, 0);
  assert.equal(r.buy0, false, '등록 전에는 못 삼');
  assert.deepEqual(r.t1, [7, 7, 7, 'S']);
  assert.equal(r.again, null);
  assert.deepEqual(r.t2, [0, 7, 1]);
  assert.equal(r.buy1, true);
  for (let i = 1; i < r.lv.length; i++) assert.ok(r.lv[i] > r.lv[i - 1] && r.ex[i] > r.ex[i - 1]);
});

test('헌터 협회 안 — 도시의 협회 문으로 들어가면 1층 로비, 등록 창구 직원(assoc), 나가면 협회 문 앞', () => {
  const city = loadMap('city'), assoc = loadMap('assoc');
  const door = city.ports.find(p => p.name === 'association'), out = assoc.ports.find(p => p.name === 'out');
  assert.equal(door.to, 'assoc.out');
  assert.equal(out.to, 'city.association');
  assert.equal(assoc.props.theme, 'hq');
  const desk = assoc.npcs.filter(n => n.shop);
  assert.deepEqual(desk.map(n => n.shop), ['ranking', 'gatefind', 'assoc', 'ally', 'hire', 'gate']);   // ranking — 길드 순위판 (10격 칸) · gatefind — 게이트 찾기 · ally — 제4격 보스 뒤에만 서 있는 첫 동료 · hire · gate — 제5격 보스 뒤
});

test('패시브 — 골드로 사면 영원히 · 값은 이번 회차를 시작할 때의 격 · 회차가 끝나면 골드는 사라짐', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const out = { p0: passivePrice('might'), lv0: passiveLevel('might') };
    out.noGold = buyPassive('might');
    State.meta.gold = out.p0;
    State.run.level = 1000; const life0 = heroStats().damage;
    out.bought = buyPassive('might');
    out.after = [passiveLevel('might'), State.meta.gold, heroStats().damage > life0, passivePrice('might') > out.p0];
    State.meta.gold = 999999999; const e0 = State.run.energy; buyPassive('breath'); out.breath = [passiveLevel('breath'), State.run.energy - e0, startEnergy() - RULES.START_ENERGY];
    // 회차 도중 새 격에 닿아도 이번 판 값은 그대로
    const p1 = passivePrice('grit'); State.meta.bestZone = ZONES.findIndex(z => z.rank === 5) + 1; out.sameRun = passivePrice('grit') === p1;
    State.meta.gold = 1234; endRun('시험'); out.end = [State.meta.gold, State.run.goldLost, passiveLevel('might')];
    startRun(); out.nextRun = passivePrice('grit') > p1;
    for (let i = 0; i < 20; i++) { State.meta.gold = 1e15; buyPassive('stride'); }
    out.max = [passiveLevel('stride'), passivePrice('stride')];
    return out;
  `);
  assert.ok(r.p0 > 0 && r.lv0 === 0);
  assert.equal(r.noGold, false);
  assert.equal(r.bought, true);
  assert.deepEqual(r.after, [1, 0, true, true]);
  assert.deepEqual(r.breath, [1, 1, 1]);
  assert.equal(r.sameRun, true);
  assert.deepEqual(r.end, [0, 1234, 1]);
  assert.equal(r.nextRun, true);
  assert.deepEqual(r.max, [5, null]);
});

test('첫 동료 — 제4격 보스 뒤 협회 로비에서 기다림 · 동료가 되면 싸움마다 추가타(기록에 ally) · 예감에도 들어감', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const out = { before: allyWaiting() };
    State.meta.bossesBeaten = [4].map(n => zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    out.waiting = allyWaiting();
    out.join = [joinAlly('hayun'), joinAlly('hayun'), allyWaiting(), heroStats().ally];
    const hero = { ...heroStats(), life: 1e6, damage: 100, defense: 0, dex: 50, luck: 0 }, foe = { life: 1e5, damage: 1, defense: 0, dex: 50, luck: 0 };
    const log = []; simulateBattle(hero, foe, Math.random, log);
    out.allyHits = log.filter(e => e.who === 'ally').length > 0;
    out.dmg = [expectedTurnDamage(hero, foe) > expectedTurnDamage({ ...hero, ally: 0 }, foe)];
    return out;
  `);
  assert.equal(r.before, false);
  assert.equal(r.waiting, true);
  assert.deepEqual(r.join, [true, false, false, 0.3]);
  assert.ok(r.allyHits);
  assert.deepEqual(r.dmg, [true]);
});

test('동료 여럿 · 게이트 — 제5격 보스 뒤 모집 · 함께 갈 한 명을 고름 · 게이트는 동료 등급까지, 실제 시간이 흐른 뒤 핵 · 강화석', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    beat(4); joinAlly('hayun');
    const out = { closed: [gatesOpen(), deskHere('hire'), hireAlly('seojin')] };
    beat(5); State.meta.hunterGrade = 2;
    out.list = hireList().map(a => a.id);
    out.poor = hireAlly('minjae');
    State.meta.won = 1e12;
    out.hire = [hireAlly('minjae'), hireAlly('minjae'), hireAlly('jiu'), State.meta.allies.slice(), State.meta.ally];
    // 내가 깬 등급만 (게이트 찾기 — 2026-11-19) · 함께 가는 동료는 게이트에 못 감 · E급 동료는 D급 게이트에 못 감
    out.locked = sendToGate('minjae', 'E', 0);
    State.meta.gateClear = ['F', 'E', 'D'];
    out.send = [sendToGate('hayun', 'F', 0), sendToGate('minjae', 'D', 0), sendToGate('minjae', 'E', 0), sendToGate('minjae', 'F', 0)];
    out.comp = [setCompanion('minjae'), setCompanion('hayun'), State.meta.ally];
    out.stats = [heroStats().ally, heroStats().allyHeal];
    setCompanion(null); out.alone = [heroStats().ally, heroStats().allyHeal, setCompanion('hayun'), heroStats().ally];
    const h = 3600e3, c0 = matsOf('core2'), s0 = SLOT_IDS.reduce((t, s) => t + stonesOf(s), 0);
    out.early = [gateDone('minjae', 2 * h - 1), claimGate('minjae', 2 * h - 1), gatesDoneCount(2 * h)];
    const got = claimGate('minjae', 50 * h);
    out.got = [got.cores, matsOf('core2') - c0, SLOT_IDS.reduce((t, s) => t + stonesOf(s), 0) - s0, gateOf('minjae'), claimGate('minjae', 99 * h)];
    // 막기 · 회복이 싸움에 듦
    const hero = { ...heroStats(), life: 1000, damage: 1, defense: 0, dex: 50, luck: 0, ally: 0 }, foe = { life: 1e9, damage: 100, defense: 0, dex: 50, luck: 0 };
    out.guard = expectedTurnDamage(foe, { ...hero, allyGuard: 0.2 }) < expectedTurnDamage(foe, hero);
    const log = []; simulateBattle({ ...hero, allyHeal: 0.05 }, foe, Math.random, log);
    out.heal = log.some(e => e.who === 'ally' && e.k === 'heal');
    // 저장 · 불러오기 — 동료 · 게이트가 남음
    sendToGate('minjae', 'E', 123);
    currentSlot = 3; save();
    State.meta = freshMeta(); load();
    out.load = [State.meta.allies.length, State.meta.ally, State.meta.gates.minjae && State.meta.gates.minjae.end === 123 + 2 * h];
    return out;
  `);
  assert.deepEqual(r.closed, [false, false, false]);
  assert.deepEqual(r.list, ['seojin', 'minjae']);
  assert.equal(r.poor, false);
  assert.deepEqual(r.hire, [true, false, false, ['hayun', 'minjae'], 'hayun']);
  assert.equal(r.locked, false, '안 깬 등급엔 못 보냄');
  assert.deepEqual(r.send, [false, false, true, false]);
  assert.deepEqual(r.comp, [false, true, 'hayun']);
  assert.deepEqual(r.stats, [0.3, 0]);
  assert.deepEqual(r.alone, [0, 0, true, 0.3]);
  assert.deepEqual(r.early, [false, null, 1]);
  assert.deepEqual(r.got, [8, 8, 40, null, null]);
  assert.ok(r.guard);
  assert.ok(r.heal);
  assert.deepEqual(r.load, [2, 'hayun', true]);
});

test('길드 — 제7격 보스 뒤 빈 건물이 매물 · 사서 이름 · 사무 자리(단계만큼)에 앉힌 동료가 시간마다 돈(8시간까지) · 단계 올리기', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    beat(4); beat(5); joinAlly('hayun'); State.meta.hunterGrade = 3; State.meta.won = 1e15; hireAlly('seojin'); hireAlly('minjae'); State.meta.gateClear = ['F', 'E', 'D'];
    const out = { before: [guildForSale(), buyGuild(), deskHere('guild')] };
    beat(7);
    out.sale = guildForSale();
    out.buy = [buyGuild(), guildLevel(), guildForSale(), deskHere('guild')];
    setGuildName('새벽'); out.name = State.meta.guild.name;
    const h = 3600e3, t0 = 1000;
    // 함께 가는 하윤은 못 앉힘 · 자리는 단계만큼
    out.seat = [seatAlly('hayun', t0), seatAlly('seojin', t0), seatAlly('minjae', t0), State.meta.guild.seats.slice()];
    out.busy = [setCompanion('seojin'), sendToGate('seojin', 'F', t0)];
    const rate = guildSeatRate();
    out.pend = [guildSeatPending('seojin', t0 + 2 * h) === Math.floor(rate * 2), guildSeatPending('seojin', t0 + 50 * h) === Math.floor(rate * 8), guildFull(t0 + 9 * h)];
    const w0 = State.meta.won; out.got = collectGuild(t0 + 3 * h); out.gotOk = [out.got === Math.floor(rate * 3), State.meta.won - w0 === out.got, guildPending(t0 + 3 * h)];
    out.up = [upgradeGuild(t0 + 3 * h), guildLevel(), guildSeatRate() > rate, seatAlly('minjae', t0 + 3 * h), State.meta.guild.seats.length];
    out.unseat = [unseatAlly('seojin', t0 + 4 * h), seatedAlly('seojin'), setCompanion('seojin')];
    for (let i = 0; i < 5; i++) upgradeGuild(t0 + 5 * h);
    out.max = [guildLevel(), guildPrice()];
    currentSlot = 3; save(); State.meta = freshMeta(); load();
    out.load = [State.meta.guild.name, State.meta.guild.level, State.meta.guild.seats.slice()];
    return out;
  `);
  assert.deepEqual(r.before, [false, false, false]);
  assert.equal(r.sale, true);
  assert.deepEqual(r.buy, [true, 1, false, true]);
  assert.equal(r.name, '새벽');
  assert.deepEqual(r.seat, [false, true, false, ['seojin']]);
  assert.deepEqual(r.busy, [false, false]);
  assert.deepEqual(r.pend, [true, true, true]);
  assert.ok(r.got > 0);
  assert.deepEqual(r.gotOk, [true, true, 0]);
  assert.deepEqual(r.up, [true, 2, true, true, 2]);
  assert.deepEqual(r.unseat, [true, false, true]);
  assert.deepEqual(r.max, [5, null]);
  assert.deepEqual(r.load, ['새벽', 5, ['minjae']]);
});

test('SS급 — S급 + 14격 보스 뒤 협회장실 · 부탁을 받으면 광장 위기 게이트, S급 넷이 밀린 뒤 나 혼자 · 이기면 SS(8), 지면 그 회차엔 끝', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    for (let n = 1; n <= 14; n++) beat(n);
    State.meta.hunterGrade = 6;
    const out = { notS: [chiefCalls(), deskHere('chief')] };
    State.meta.hunterGrade = 7;
    out.open = [chiefCalls(), deskHere('chief'), deskHere('chiefS0'), canRaid(), deskHere('raidboss')];
    // 진다 — 그 회차엔 다시 못 감
    out.accept = [acceptRaid(), acceptRaid(), deskHere('chiefS0'), deskHere('raidboss'), deskHere('raidS0'), deskHere('raidD0')];
    raidKnock(2);
    out.knock = [deskHere('raidS0'), deskHere('raidS1'), deskHere('raidS2'), deskHere('raidD0'), deskHere('raidD1'), deskHere('raidD2')];
    State.run.level = 1;
    const lose = fightRaid(() => 0.5);
    out.lose = [lose.raid, lose.win, hunterGrade(), State.meta.topLostRun === State.meta.runCount, !!raidNow(), canRaid(), deskHere('raidD3')];
    // 다음 회차 — 다시 · 이긴다
    startRun(); State.run.lastResult = null;
    out.again = [canRaid(), acceptRaid()];
    const _hs = heroStats; heroStats = () => Object.assign(_hs(), { life: 1e30, damage: 1e30, defense: 1e30 });
    const win = fightRaid();
    heroStats = _hs;
    out.win = [win.win, hunterGrade(), gradeName(), State.meta.topDone, chiefCalls(), canTakeTest(), guildScoreParts().grade];
    return out;
  `);
  assert.deepEqual(r.notS, [false, false]);
  assert.deepEqual(r.open, [true, true, true, true, false]);
  assert.deepEqual(r.accept, [true, false, false, true, true, false]);
  assert.deepEqual(r.knock, [false, false, true, true, true, false]);
  assert.deepEqual(r.lose, [true, false, 7, true, false, false, true]);
  assert.deepEqual(r.again, [true, true]);
  assert.deepEqual(r.win, [true, 8, 'SS', 1, false, false, 8 * 20]);
  // 저장 — SS 는 topDone 이 있어야 (없으면 S 까지 · 옛 이름 ssDone 도 읽음)
  const load = ss => loadGame({ [slotKey(1)]: JSON.stringify({ runCount: 30, cityOpen: true, hunterGrade: 8, ssDone: ss }) })(`currentSlot = 1; blockSaving(); load(); return [hunterGrade(), gradeName()];`);
  assert.deepEqual(load(true), [8, 'SS']);
  assert.deepEqual(load(false), [7, 'S']);
});

test('SSS급 — SS + 17격 보스 뒤 협회장실 다시 · 뉴욕 → 파리 → 카이로를 연달아 다 이겨야 SSS(9), 중간에 지면 다음 회차에 처음부터', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    for (let n = 1; n <= 17; n++) beat(n);
    State.meta.hunterGrade = 8; State.meta.topDone = 1;
    const strong = () => { const _hs = heroStats; heroStats = () => Object.assign(_hs(), { life: 1e30, damage: 1e30, defense: 1e30 }); return () => { heroStats = _hs; }; };
    const out = { open: [topTier(), chiefCalls(), deskHere('chiefS0'), canRaid()] };
    acceptRaid();
    out.first = [raidNow().tier, raidFoe().name, deskHere('raidS0'), deskHere('raidboss')];
    let undo = strong();
    const w1 = fightRaid();
    out.w1 = [w1.win, w1.last, w1.next, w1.nextCity, !!raidNow(), raidFoe().name, hunterGrade()];
    State.run.lastResult = null;
    undo();
    State.run.level = 1;
    const w2 = fightRaid(() => 0.5);
    out.lose = [w2.win, w2.city, !!raidNow(), canRaid(), State.meta.topLostRun === State.meta.runCount, hunterGrade()];
    startRun(); State.run.lastResult = null;
    acceptRaid(); undo = strong();
    const res = [fightRaid()]; State.run.lastResult = null; res.push(fightRaid()); State.run.lastResult = null; res.push(fightRaid());
    undo();
    out.win = [res.map(x => x.win).join(), res[2].last, hunterGrade(), gradeName(), State.meta.topDone, chiefCalls(), guildScoreParts().grade];
    return out;
  `);
  assert.deepEqual(r.open, [1, true, false, true]);
  assert.deepEqual(r.first, [1, '뉴욕 게이트의 주인', false, true]);
  assert.deepEqual(r.w1, [true, false, 'w2', '파리', true, '파리 게이트의 주인', 8]);
  assert.deepEqual(r.lose, [false, '파리', false, false, true, 8]);
  assert.deepEqual(r.win, ['true,true,true', true, 9, 'SSS', 2, false, 9 * 20]);
});

test('EX급 — SSS + 아자토스(20격) 뒤 협회장실 · 옛 동네 → 광장 → 하늘의 금 너머를 연달아 이기면 EX(10), 외신은 그 차례에만 섬, 나서면 없던 일', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    for (let n = 1; n <= 19; n++) beat(n);
    State.meta.hunterGrade = 9; State.meta.topDone = 2;
    const out = { notYet: chiefCalls() };
    beat(20);
    const strong = () => { const _hs = heroStats; heroStats = () => Object.assign(_hs(), { life: 1e30, damage: 1e30, defense: 1e30 }); return () => { heroStats = _hs; }; };
    out.open = [topTier(), deskHere('chiefS0'), deskHere('exboss0')];
    acceptRaid();
    out.first = [raidFight().map, raidFight().at, deskHere('exboss0'), deskHere('exboss1'), raidFoe().name];
    let undo = strong();
    const a = fightRaid(); State.run.lastResult = null;
    out.step = [a.win, a.nextAt, deskHere('exboss0'), deskHere('exboss1')];
    const b = fightRaid(); State.run.lastResult = null;
    const c = fightRaid();
    undo();
    out.win = [b.nextAt, c.last, hunterGrade(), gradeName(), State.meta.topDone, chiefCalls(), guildScoreParts().grade];
    return out;
  `);
  assert.equal(r.notYet, false);
  assert.deepEqual(r.open, [2, true, false]);
  assert.deepEqual(r.first, ['oldtown', 'oldtown.home', true, false, '슈브니구라스']);
  assert.deepEqual(r.step, [true, 'city.crisis', false, true]);
  assert.deepEqual(r.win, ['sky.out', true, 10, 'EX', 3, false, 10 * 20]);
});

test('SS급 게이트 — SS급이면 게이트 찾기에 SS 가 나옴 · 깨면 게이트 창구 SS 열림 · S급 동료는 단련 10단계로 SS, 핵은 일반 30% (정예 · 보스는 반드시)', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    for (let n = 1; n <= 14; n++) beat(n); State.meta.bestZone = 14;
    const out = { info: [gateInfo('SS').rank, gateInfo('SS').hours, gradeAt(8).id, gradeIndex('SS'), GATE_IDS.length] };
    State.meta.hunterGrade = 7;
    const day = Date.parse('2026-11-20T12:00:00');
    out.sGrades = [...new Set(Array.from({ length: 30 }, (_, k) => { State.meta.found = null; return foundGates(day, (() => { let x = k + 1; return () => (x = (x * 16807) % 2147483647) / 2147483647; })()).map(g => g.grade); }).flat())].sort().join();
    State.meta.hunterGrade = 8;
    out.ssGrades = [...new Set(Array.from({ length: 30 }, (_, k) => { State.meta.found = null; return foundGates(day + 864e5 * (k + 1), (() => { let x = k + 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })()).map(g => g.grade); }).flat())].sort().join();
    out.foe = (() => { const f = findFoe({ grade: 'SS', foe: ENEMIES.find(e => e.kind === 'normal').id }); return [f.level === TOP_GRADES[0].fights[0].level, f.name.startsWith('SS급')]; })();
    // 동료 — S급 루아를 SS 로
    State.meta.allies = ['rua']; State.meta.train = { rua: 9 }; State.meta.training = { rua: { start: 0, end: 1, to: 10 } };
    State.meta.guild = { name: '새벽', level: 2, seats: [], since: {} };
    beat(12); settleTraining(2);
    out.ally = [allyGradeId(ALLIES.rua), allyGradeN(ALLIES.rua), sendToGate('rua', 'SS', 0)];
    State.meta.gateClear = ['SS'];
    out.send = [gateUnlocked('S'), sendToGate('rua', 'SS', 0), gateOf('rua') && gateOf('rua').gate];
    // 핵 — 일반은 30%, 보스는 반드시
    const normal = ENEMIES.find(e => e.kind === 'normal' && e.rank && e.rank.n === 1), boss = zoneBoss(0);
    const _r = Math.random; let k = 0, got = 0;
    for (let i = 0; i < 100; i++) { Math.random = () => (i + 0.5) / 100; if (rollMats(normal.id).some(x => x.mat.core)) got++; }
    Math.random = () => 0.99; const bossGot = rollMats(boss.id).some(x => x.mat.core); Math.random = _r;
    out.core = [got, bossGot];
    return out;
  `);
  assert.deepEqual(r.info, [8, 10, 'SS', 8, 8]);
  assert.ok(!r.sGrades.includes('SS'), r.sGrades);
  assert.ok(r.ssGrades.split(',').includes('SS'), r.ssGrades);
  assert.deepEqual(r.foe, [true, true]);
  assert.deepEqual(r.ally, ['SS', 8, false]);
  assert.deepEqual(r.send, [true, true, 'SS']);
  assert.deepEqual(r.core, [30, true]);
});

test('훈련소 — 12격 뒤 · 길드가 있어야, 돈을 내면 단계만큼 시간이 흐른 뒤 능력 +10%, 10단계면 등급 한 번 · 단련 중엔 동행 · 게이트 · 사무 못 함', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    for (let n = 1; n <= 12; n++) beat(n);
    joinAlly('hayun');
    const out = { noGuild: [trainOpen(), deskHere('trainer')] };
    State.meta.guild = { name: '새벽', level: 2, seats: [], since: {} };
    State.meta.won = 1e15;
    const p0 = allyPower(ALLIES.hayun);
    out.busy = startTraining('hayun', 0);                 // 함께 가는 중이면 못 함
    setCompanion(null);
    out.start = [trainOpen(), trainPrice('hayun') > 0, startTraining('hayun', 0), startTraining('hayun', 0), setCompanion('hayun'), sendToGate('hayun', 'F', 0)];
    out.early = settleTraining(3599e3).length;
    out.done = [settleTraining(3600e3).length, trainLevel('hayun'), Math.round(allyPower(ALLIES.hayun) / p0 * 100)];
    for (let lv = 2; lv <= 10; lv++) { startTraining('hayun', 0); settleTraining(lv * 3600e3); }
    out.max = [trainLevel('hayun'), allyGradeId(ALLIES.hayun), trainPrice('hayun'), startTraining('hayun', 0)];
    return out;
  `);
  assert.deepEqual(r.noGuild, [false, false]);
  assert.equal(r.busy, false);
  assert.deepEqual(r.start, [true, true, true, false, false, false]);
  assert.equal(r.early, 0);
  assert.deepEqual(r.done, [1, 1, 110]);
  assert.deepEqual(r.max, [10, 'C', null, false]);
});

test('게이트 찾기 — 5격 뒤 · 하루에 셋(내 등급 근처) · 내가 깨면 보상 + 그 등급 자동사냥 열림, 지면 그 회차엔 못 들어감', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    const out = { closed: foundGates().length };
    for (let n = 1; n <= 5; n++) beat(n); State.meta.bestZone = 5; State.meta.hunterGrade = 4;
    const day1 = Date.parse('2026-11-19T12:00:00');
    const list = foundGates(day1);
    out.list = [list.length, list.every(g => { const n = gateInfo(g.grade).rank; return n >= 2 && n <= 5; }), list.every(g => getEnemy(g.foe).zoneIndex < 5)];
    out.same = foundGates(day1 + 3600e3) === list;
    // 진다 — 그 회차엔 못 들어감
    State.run.level = 1;
    out.enter = [enterFound(0, day1), enterFound(1, day1), !!gateInNow()];
    const lose = fightFound(() => 0.99);
    out.lose = [lose.gatein, lose.win, list[0].lostRun === State.meta.runCount, gateInNow(), canEnterFound(0, day1)];
    dismissResult(); leaveFound();
    // 이긴다 — 보상 · 자동사냥
    State.run.level = 1e9;
    const g1 = list[1], type = g1.reward.type, won0 = State.meta.won, gem0 = State.meta.bmGems;
    enterFound(1, day1);
    const win = fightFound(() => 0.5);
    out.win = [win.win, g1.cleared, gateUnlocked(g1.grade), win.opened, canEnterFound(1, day1), !!win.reward.text];
    out.below = [gateUnlocked('F'), gateUnlocked(HUNTER_GRADES[gateInfo(g1.grade).rank].id)];
    out.got = type === 'won' ? State.meta.won > won0 : type === 'gem' ? State.meta.bmGems > gem0 : true;
    dismissResult(); leaveFound();
    startRun(); out.retry = canEnterFound(0, day1);
    out.next = foundGates(day1 + 24 * 3600e3) !== list;
    return out;
  `);
  assert.equal(r.closed, 0);
  assert.deepEqual(r.list, [3, true, true]);
  assert.equal(r.same, true);
  assert.deepEqual(r.enter, [true, false, true]);
  assert.deepEqual(r.lose, [true, false, true, null, false]);
  assert.deepEqual(r.win, [true, true, true, true, false, true]);
  assert.equal(r.got, true);
  assert.deepEqual(r.below, [true, false], '깬 등급의 아래는 열리고 위는 안 열림');
  assert.equal(r.retry, true);
  assert.equal(r.next, true);
  const assoc = loadMap('assoc'), gi = loadMap('gatein');
  const link = assoc.ports.find(p => p.name === 'gatein');
  assert.deepEqual([link.to, link.unlock, gi.ports.find(p => p.name === 'out').to], ['gatein.out', 'gatein', 'assoc.gatein']);
  assert.deepEqual(gi.npcs.filter(n => n.shop).map(n => n.shop), ['gateboss']);
});

test('새 집 — 11격 보스 뒤 「분양」 · 돈으로 사면 원룸은 잠기고, 길잡이가 이상한 게이트를 새 집 안으로 · 그 뒤 회차는 새 집 안에서', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const out = { before: [home2ForSale(), buyHome2(), State.run.mapId] };
    State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === 11)).id);
    State.meta.won = 0;
    out.poor = [home2ForSale(), buyHome2()];
    State.meta.won = home2Price() + 5;
    out.buy = [buyHome2(), State.meta.won, State.meta.home2, home2ForSale(), State.meta.portalMoved];
    out.move = [movePortal(), movePortal(), State.meta.portalMoved];
    startRun(); out.start = State.run.mapId;
    return out;
  `);
  assert.deepEqual(r.before, [false, false, 'oldtown']);
  assert.deepEqual(r.poor, [true, false]);
  assert.deepEqual(r.buy, [true, 5, true, false, false]);
  assert.deepEqual(r.move, [true, false, true]);
  assert.equal(r.start, 'home2');
  const h2 = loadMap('home2'), old = loadMap('oldtown'), city = loadMap('city');
  const portal = h2.ports.find(p => p.name === 'portal');
  assert.deepEqual([portal.rift, portal.unlock, portal.to, h2.ports.find(p => p.name === 'out').to], [true, 'portal', 'sewer.city', 'city.home2']);
  assert.deepEqual([old.ports.find(p => p.name === 'gate').unlock, old.ports.find(p => p.name === 'home').unlock], ['portalOld', 'home1']);
  const door = city.ports.find(p => p.name === 'home2');
  assert.deepEqual([door.to, door.unlock], ['home2.out', 'home2']);
});

test('길드 순위 — 점수(단계 · 동료 등급 · 길드장 등급 · 게이트 실적), 달 < 크라운 < 청해 < 홍염 을 넘으면 상금(돈 · 원석) 한 번씩', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const out = { none: [guildScore(), rankPending().length, guildBoard().length, deskHere('ranking')] };
    State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === 10)).id);
    out.open = deskHere('ranking');
    State.meta.guild = { name: '새벽', level: 3, seats: [], since: {} };
    State.meta.allies = ['hayun', 'seojin']; State.meta.hunterGrade = 3; State.meta.gatePts = 7;
    out.score = [guildScore(), JSON.stringify(guildScoreParts())];
    out.pend = rankPending().map(B => B.id);
    State.meta.won = 0; State.meta.bmGems = 0;
    const p = claimRank('dal');
    out.claim = [!!p, State.meta.won === p.won && p.won > 0, State.meta.bmGems, claimRank('dal'), claimRank('crown'), rankPending().length];
    State.meta.guild.level = 5; State.meta.gatePts = 1000;
    out.all = [rankPending().map(B => B.id), guildBoard()[0].mine];
    // 게이트 실적 — 돌아오면 그 등급만큼
    State.meta.gatePts = 0; State.meta.gates = { hayun: { gate: 'D', start: 0, end: 1 } };
    claimGate('hayun', 2); out.gate = State.meta.gatePts;
    return out;
  `);
  assert.deepEqual(r.none, [0, 0, 4, false]);
  assert.equal(r.open, true);
  assert.deepEqual(r.score, [407, JSON.stringify({ level: 300, ally: 40, grade: 60, gate: 7 })]);
  assert.deepEqual(r.pend, ['dal']);
  assert.deepEqual(r.claim, [true, true, 1, null, null, 0]);
  assert.deepEqual(r.all, [['crown', 'cheonghae', 'hongyeom'], true]);
  assert.equal(r.gate, 3);
});

test('암시장 — 9격 보스 뒤 · 회차마다 반반, 검은 원석 1개 + 맡긴 돈 비율의 확률로 두 번 굴려 아직 없는 전리품(가 본 격까지), 거래는 회차에 한 번', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    State.run.bm = true;
    const out = { before: [bmUnlocked(), bmOpen(), rollBmGem(() => 0)] };
    beat(9); State.meta.bestZone = ZONES.findIndex(z => z.rank === 9) + 1;
    out.open = [bmUnlocked(), bmOpen(), deskHere('bm')];
    State.meta.won = 1000;
    out.noGem = bmDeal(500);
    out.gem = [rollBmGem(() => 0.99), rollBmGem(() => 0.1), State.meta.bmGems];
    const both = p => 1 - Math.pow(1 - p, 2);
    out.odds = [both(bmChance(1000)), bmChance(500) / bmChance(1000), bmChance(2000) === bmChance(1000)];
    State.run.priceRank = 20; out.odds20 = both(bmRollMax()); State.run.priceRank = 14; out.odds14 = both(bmRollMax()); State.run.priceRank = 9;
    const pool = bmPool();
    out.pool = [pool.length > 0, pool.every(id => !owns(id) && getItem(id).rank.n <= 9 && !getItem(id).store)];
    const miss = bmDeal(400, () => 0.9);
    out.miss = [miss.rolls, miss.item, State.meta.won, State.meta.bmGems, State.run.bmDone, deskHere('bm'), bmDeal(100)];
    State.run.bmDone = false; State.meta.bmGems = 1;
    let k = 0; const seq = [0.9, 0.1, 0];
    const hit = bmDeal(600, () => seq[k++]);
    out.hit = [hit.rolls, !!hit.item && owns(hit.item.id), State.meta.won];
    State.run.bm = false; State.run.bmDone = false; out.away = [bmOpen(), deskHere('bm')];
    return out;
  `);
  assert.deepEqual(r.before, [false, false, false]);
  assert.deepEqual(r.open, [true, true, true]);
  assert.equal(r.noGem, null);
  assert.deepEqual(r.gem, [false, true, 1]);
  assert.ok(Math.abs(r.odds[0] - 0.5) < 1e-9 && Math.abs(r.odds[1] - 0.5) < 1e-9 && r.odds[2], '9격 — 전부 맡기면 두 번 합쳐 50%, 절반이면 한 번 확률도 절반');
  assert.ok(Math.abs(r.odds20 - 0.2) < 1e-9, '20격 — 20%');
  assert.ok(r.odds14 < 0.5 && r.odds14 > 0.2, '사이는 고르게 내려감');
  assert.deepEqual(r.pool, [true, true]);
  assert.deepEqual(r.miss, [[false, false], null, 600, 0, true, false, null]);
  assert.deepEqual(r.hit, [[false, true], true, 0]);
  assert.deepEqual(r.away, [false, false]);
});

test('둘째 동료 단우 — 제8격 보스 뒤 · 내 길드가 있어야 사무실에서 기다림, 버티기는 한 싸움에 한 번', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    const beat = n => State.meta.bossesBeaten.push(zoneBoss(ZONES.findIndex(z => z.rank === n)).id);
    beat(8);
    const out = { noGuild: [ally2Waiting(), deskHere('ally2')] };
    State.meta.guild = { name: '새벽', level: 1, seats: [], since: 0 };
    out.waiting = [ally2Waiting(), deskHere('ally2')];
    out.join = [joinAlly('danwoo'), ally2Waiting(), allyPower(ALLIES.danwoo)];
    setCompanion('danwoo');
    const h = heroStats();
    out.stat = [h.allyEndure, h.ally, h.allyGuard];
    // 한 방에 쓰러지는 상대 — 버티기가 딱 한 번
    const hero = { ...h, life: 100, damage: 1, defense: 0, dex: 50, luck: 0 }, foe = { life: 1e9, damage: 1e6, defense: 0, dex: 1e6, luck: 0 };
    const log = []; const res = simulateBattle(hero, foe, () => 0.5, log);
    out.fight = [res.win, log.filter(e => e.who === 'ally' && e.k === 'endure').length, log.find(e => e.k === 'endure').v];
    return out;
  `);
  assert.deepEqual(r.noGuild, [false, false]);
  assert.deepEqual(r.waiting, [true, true]);
  assert.deepEqual(r.join, [true, false, 0.3]);
  assert.deepEqual(r.stat, [0.3, 0, 0]);
  assert.deepEqual(r.fight, [false, 1, 30]);
});

test('내 길드 안 — 옛 동네 빈 건물 문(잠김 · unlock guild) ↔ 길드 안, 길드 장부 · 사무 자리 다섯', () => {
  const town = loadMap('oldtown'), g = loadMap('guild');
  const door = town.ports.find(p => p.name === 'myguild'), out = g.ports.find(p => p.name === 'out');
  assert.equal(door.to, 'guild.out');
  assert.equal(door.unlock, 'guild');
  assert.equal(out.to, 'oldtown.myguild');
  assert.deepEqual(g.npcs.filter(n => n.shop).map(n => n.shop), ['guild', 'ally2', 'trainer']);
  assert.deepEqual(loadMap('guild2').npcs.filter(n => n.shop).map(n => n.shop), ['guild', 'ally2', 'trainer']);
  assert.equal(g.npcs.filter(n => n.name === 'seat').length, 5);
});

test('시험장 — 「시험을 본다」 → 시험관과 한 명씩 (결과는 싸움 결과 모양 · 경험치 · 에너지 그대로), 지면 끝 · 나가면 끝, 회차에 한 번', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true; startRun();
    State.run.level = 3000; const xp0 = State.run.xp, e0 = State.run.energy;
    const out = { start: [startHunterTest(), startHunterTest(), canTakeTest(), examinerNow().name] };
    const r1 = fightExaminer(() => 0.5);
    out.r1 = [r1.examiner, r1.win, r1.enemy.name, !!r1.replay.log.length, fightExaminer() === null];
    dismissResult();
    out.next = examinerNow() && examinerNow().name;
    let guard = 0; while (State.run.test && !State.run.test.done && guard++ < 10) { fightExaminer(); dismissResult(); }
    out.done = [State.run.test.done, hunterGrade() >= 1, deskHere('examiner'), State.run.xp === xp0, State.run.energy === e0];
    leaveArena(); out.left = [State.run.test, startHunterTest()];
    const lv1 = { ...freshMeta(), cityOpen: true }; State.meta = lv1; startRun();
    startHunterTest(); leaveArena(); out.forfeit = [State.run.test, hunterGrade(), canTakeTest()];
    return out;
  `);
  assert.deepEqual(r.start, [true, false, false, 'F급 시험관']);
  assert.deepEqual(r.r1, [true, true, 'F급 시험관', true, true]);
  assert.equal(r.next, 'E급 시험관');
  assert.deepEqual(r.done, [true, true, false, true, true]);
  assert.deepEqual(r.left, [null, false]);
  assert.deepEqual(r.forfeit, [null, 0, false]);
});

test('S급 시험 — A급을 넘으면 4대 길드의 S급 헌터가 옴 (시험마다 홍염 · 청해 · 크라운 · 달 차례로), 들어오기 전엔 못 맞섬', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; State.meta = freshMeta(); State.meta.cityOpen = true;
    const out = [];
    for (let i = 0; i < 5; i++) {
      startRun(); State.run.level = 1e9;
      startHunterTest();
      while (State.run.test.g < HUNTER_GRADES.length) { fightExaminer(() => 0.5); dismissResult(); }
      const t = State.run.test;
      out.push([examinerNow().name, sHunterComing(), deskHere('examiner')]);
      t.sArrived = true;
      const r = fightExaminer(() => 0.5);
      out.push([r.enemy.guild, sHunterComing()]);
      dismissResult(); leaveArena();
      State.meta.runCount += 1;
    }
    out.push(State.meta.sExams, examinerFoe(7).name);
    return out;
  `);
  assert.deepEqual(r[0], ['홍염 길드 · S급 헌터', true, true]);
  assert.deepEqual(r.filter((x, i) => i % 2 === 1 && i < 10).map(x => x[0]), [0, 1, 2, 3, 0]);
  assert.deepEqual(r.filter((x, i) => i % 2 === 0 && i < 10).map(x => x[0]), ['홍염 길드 · S급 헌터', '청해 길드 · S급 헌터', '크라운 길드 · S급 헌터', '달 길드 · S급 헌터', '홍염 길드 · S급 헌터']);
  assert.equal(r[10], 5);
  assert.equal(r[11], 'S급 시험관');
});

test('협회 로비 — 등록 창구 왼쪽 시험장 문(시험 중에만 열림) ↔ 시험장, 시험관 자리 하나', () => {
  const assoc = loadMap('assoc'), arena = loadMap('arena');
  const door = assoc.ports.find(p => p.name === 'arena'), out = arena.ports.find(p => p.name === 'out');
  assert.equal(door.to, 'arena.out'); assert.equal(door.unlock, 'arena');
  assert.equal(out.to, 'assoc.arena');
  assert.deepEqual(arena.npcs.filter(n => n.shop).map(n => n.shop), ['examiner']);
});

test('지도 몬스터 도트 — 있는 몬스터 · 크기(칸 × 16) · 1 · 2격은 모두 · 걸음 박자', () => {
  const { MOB_SPRITES } = require('../js/mobsprites.js');
  const { ENEMIES } = loadData();
  for (const [id, s] of Object.entries(MOB_SPRITES)) {
    const e = ENEMIES.find(x => x.id === id);
    assert.ok(e, `${id} — 없는 몬스터`);
    assert.equal(s.a.length, e.size * 16, `${id} — 크기 ${e.size}칸인데 ${s.a.length}픽셀`);
    for (const f of ['a', 'b']) {
      assert.equal(s[f].length, s.a.length);
      for (const r of s[f]) { assert.equal(r.length, s.a.length); for (const c of r) assert.ok(c === '.' || s.pal[c], `${id} — 모르는 색 ${c}`); }
    }
  }
  for (const e of ENEMIES.filter(x => x.rank.n <= 2)) assert.ok(MOB_SPRITES[e.id], `${e.rank.n}격 ${e.id} — 도트 없음`);
  for (const s of Object.values(MOB_SPRITES)) assert.ok(s.pace > 0 && s.pace <= 2);
});

test('오크 부락 — 오크 장군은 부락 한가운데, 오크 전사 구역이 부락 서쪽 반에 걸쳐 한두 마리는 부락 안에서 생겨남', () => {
  const data = loadData(), over = loadMap('overworld');
  const og = over.posts.find(p => p.enemy === data.ENEMIES.find(e => e.name === '오크 장군').id);
  const orc = over.areas.find(a => a.monster === 'orc');
  assert.ok(orc.camp, '오크 전사 구역에 부락 네모(camp)');
  const [cx, cy, cw, ch] = orc.camp.split(',').map(Number);
  assert.ok(og.x > cx && og.y > cy && og.x + og.w < cx + cw && og.y + og.h < cy + ch, '장군은 부락 안');
  assert.ok(cw <= 13 && ch <= 15, '부락은 작게 (13 × 15 칸 안)');
  const inCamp = (x, y) => x >= cx && y >= cy && x < cx + cw && y < cy + ch;
  let campCells = 0;
  for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) if (over.areaAt[y * over.w + x] === orc.index && !over.solid[y * over.w + x]) campCells++;
  assert.ok(campCells >= 15, `부락 안의 오크 전사 구역 칸 ${campCells}`);
  for (let seed = 1; seed <= 8; seed++) {
    const w = M.createWorld(over, {}, seed);
    const n = w.mobs.filter(m => m.area === orc.index && inCamp(m.x, m.y)).length;
    assert.ok(n >= 1 && n <= 2, `씨앗 ${seed} — 부락 안 오크 전사 ${n}마리`);
  }
});

test('2격 서쪽 통나무 다리 — 건너면 바로 트렌트 구역(듬성듬성한 나무 사이), 가고일은 그 뒤(남쪽)', () => {
  const over = loadMap('overworld');
  const treant = over.areas.find(a => a.monster === 'treant'), garg = over.areas.find(a => a.monster === 'gargoyle');
  // 다리 서쪽 끝 — 시냇물을 건너는 흙길 칸 중 가장 서쪽 (2격 숲 서쪽)
  let bx = Infinity, by = 0;
  for (let y = 100; y < 130; y++) for (let x = 40; x < 70; x++) {
    const k = y * over.w + x;
    if (over.tile[k] === 5 && (over.tile[k - over.w] === 2 || over.tile[k + over.w] === 2) && x < bx) { bx = x; by = y; }   // 위나 아래가 물인 흙길 = 다리
  }
  assert.ok(bx < Infinity, '다리를 찾음');
  const dist = a => Math.hypot(a.mid.x - bx, a.mid.y - by);
  assert.ok(dist(treant) < dist(garg) && garg.mid.y > treant.mid.y, '트렌트가 다리 쪽, 가고일이 그 뒤');
  let trees = 0;
  for (let k = 0; k < over.w * over.h; k++) if (over.areaAt[k] === treant.index && over.tile[k] === 3) trees++;
  assert.ok(trees >= 8, `트렌트 구역 안의 나무 ${trees}그루`);
});

test('트렌트는 뿌리 내린 나무 — 어슬렁거리는 걸음이 다른 몬스터보다 훨씬 드묾 (GAIT)', () => {
  const over = loadMap('overworld');
  const w = M.createWorld(over, {}, 5);
  const moves = id => {
    const mine = w.mobs.filter(m => m.monster === id);
    return { mine, last: mine.map(m => [m.x, m.y]), n: 0 };
  };
  const t = moves('treant'), g = moves('gargoyle');
  w.player.x = 300; w.player.y = 60;                         // 멀리 — 쫓거나 달아나지 않게
  for (let i = 0; i < 600; i++) {
    M.tick(w, 0.1);
    for (const s of [t, g]) s.mine.forEach((m, k) => { if (m.x !== s.last[k][0] || m.y !== s.last[k][1]) { s.n++; s.last[k] = [m.x, m.y]; } });
  }
  const perT = t.n / t.mine.length, perG = g.n / g.mine.length;
  assert.ok(t.mine.length && g.mine.length);
  assert.ok(perT * 5 < perG, `60초 동안 한 마리당 트렌트 ${perT.toFixed(1)}걸음 · 가고일 ${perG.toFixed(1)}걸음`);
});

test('트롤 부락 — 트롤 킹이 바위산 골짜기 들머리를 막고, 골짜기 끝에 2격 큰 상자. 트롤 킹을 꺾어야만 닿음 · 바실리스크는 부락에서 떨어져 오른쪽', () => {
  const over = loadMap('overworld');
  const tk = over.posts.find(p => p.enemy === 'trollking'), big = over.chests.find(c => c.chest === 'r2-big');
  assert.ok(tk.blocks, '트롤 킹은 길을 막음');
  assert.ok(big.y < tk.y && Math.abs(big.x - (tk.x + tk.w / 2)) <= 3, '큰 상자는 트롤 킹 바로 뒤 골짜기');
  const k0 = over.start.y * over.w + over.start.x, chestK = big.y * over.w + big.x;
  const near = d => [1, -1, over.w, -over.w].some(s => d[chestK + s] >= 0);
  const blockedKing = new Set(cellsOf(over, tk));
  assert.ok(!near(walk(over, [k0], blockedKing)), '트롤 킹이 서 있으면 큰 상자 곁에 못 감');
  assert.ok(near(walk(over, [k0])), '트롤 킹을 꺾으면 감');
  const bas = over.areas.find(a => a.monster === 'basilisk');
  assert.ok(bas.mid.x - (tk.x + tk.w) >= 8, `바실리스크 들머리가 트롤 킹 오른쪽으로 떨어짐 (${bas.mid.x})`);
  for (let y = tk.y - 2; y < tk.y + tk.h + 2; y++) for (let x = tk.x - 6; x < tk.x + tk.w + 3; x++) assert.notEqual(over.areaAt[y * over.w + x], bas.index, `(${x}, ${y}) 부락은 바실리스크 구역이 아님`);
});

test('높은 땅 — 그리핀 로드는 걸어 올라가는 둔덕 위, 바위 계단으로만 올라감 (지도 속성 high · stairs)', () => {
  const over = loadMap('overworld');
  const runs = s => { const a = new Set(); for (const r of String(s || '').split(';')) { if (!r) continue; const [x, y, n] = r.split(',').map(Number); for (let i = 0; i < n; i++) a.add(y * over.w + x + i); } return a; };
  const high = runs(over.props.high), stairs = runs(over.props.stairs);
  const g = over.posts.find(p => p.enemy === 'griffinlord');
  assert.ok(cellsOf(over, g).every(k => high.has(k)), '그리핀 로드는 높은 땅 위');
  assert.ok(stairs.size >= 3, '바위 계단');
  const k0 = over.start.y * over.w + over.start.x, gk = cellsOf(over, g);
  assert.ok(gk.some(k => walk(over, [k0])[k] >= 0), '계단으로 올라가 닿음');
  assert.ok(!gk.some(k => walk(over, [k0], stairs)[k] >= 0), '계단 말고는 못 올라감');
});

test('4격 정예 거인 넷 — 서리 거인은 눈밭 · 불의 거인은 남쪽 용암 곁 · 구름 거인은 계단으로 오르는 높은 둔덕 · 돌 거인은 언덕 거인 곁 큰 바위 사이', () => {
  const over = loadMap('overworld');
  const runs = s => { const a = new Set(); for (const r of String(s || '').split(';')) { if (!r) continue; const [x, y, n] = r.split(',').map(Number); for (let i = 0; i < n; i++) a.add(y * over.w + x + i); } return a; };
  const at = e => over.posts.find(p => p.enemy === e), near = (g, r, f) => { for (let y = g.y - r; y < g.y + r + 4; y++) for (let x = g.x - r; x < g.x + r + 4; x++) if (f(y * over.w + x)) return true; return false; };
  const frost = at('frostgiant'), fire = at('firegiant'), cloud = at('cloudgiant'), stone = at('stonegiant'), hill = over.areas.find(a => a.name === '언덕 거인');
  assert.ok(cellsOf(over, frost).every(k => (over.look[k] & 15) === 8), '서리 거인 발밑은 눈');
  assert.ok(fire.y > stone.y && fire.y > cloud.y && fire.y > frost.y, '불의 거인은 남쪽');
  assert.ok(near(fire, 8, k => over.tile[k] === 2 && (over.look[k] & 15) === 6), '불의 거인 곁에 용암');
  const high = runs(over.props.high), stairs = runs(over.props.stairs), k0 = over.start.y * over.w + over.start.x;
  assert.ok(cellsOf(over, cloud).every(k => high.has(k)), '구름 거인은 높은 땅 위');
  assert.ok(!cellsOf(over, cloud).some(k => walk(over, [k0], stairs)[k] >= 0), '구름 거인 둔덕도 계단으로만');
  assert.ok(stone.x > hill.x - 10 && stone.x < hill.x + hill.w + 10 && stone.y > hill.y - 10 && stone.y < hill.y + hill.h + 10, '돌 거인은 언덕 거인 구역 곁');
  const big = String(over.props.bigrocks || '').split(';').filter(Boolean).map(r => r.split(',').map(Number));
  assert.ok(big.filter(([x, y]) => Math.hypot(x - stone.x, y - stone.y) < 10).length >= 3, '돌 거인 둘레에 큰 바위');
  assert.ok(cellsOf(over, at('frostgiant')).concat(cellsOf(over, fire), cellsOf(over, stone)).every(k => walk(over, [k0])[k] >= 0), '모두 걸어서 닿음');
});

test('스탯 분배 미리 보기 — 비율을 바꾸거나 자동을 켜도 바로 안 찍힘 (planPoints · previewSpend 는 찍지 않음), 「이대로 찍기」(commitPoints) 때 그 계획대로', () => {
  const run = loadGame();
  const r = run(`
    currentSlot = 0; blockSaving(); State.meta = freshMeta(); startRun(); State.run.unspent = 50;
    setWeights(1, 1, 0, 0, 0); setAutoAlloc(true);
    const plan = planPoints(), before = { ...State.run.spent };
    const pv = previewSpend(plan.give);
    const untouched = [State.run.unspent, JSON.stringify(State.run.spent) === JSON.stringify(before)];
    commitPoints();
    return { untouched, give: plan.give, spent: State.run.spent, up: pv.after.life > pv.before.life, left: State.run.unspent };`);
  assert.deepEqual(r.untouched, [50, true], '미리 보기 · 자동 켜기만으로는 그대로');
  assert.deepEqual(r.spent, r.give, '찍으면 미리 본 그대로');
  assert.ok(r.up && r.left === 0);
});

test('거인의 동굴 — 4격 큰 상자는 4격 동쪽 깊은 곳 바위 턱의 굴 안 맨 안쪽, 설인 · 털매머드 방을 지나야 닿음 (사용자 결정 2026-11-22)', () => {
  const over = loadMap('overworld'), cave = loadMap('giantcave');
  assert.ok(!over.chests.some(c => c.chest === 'r4-big'), '바깥 지도엔 4격 큰 상자 없음');
  const door = over.ports.find(p => p.name === 'giantcave');
  assert.ok(door && door.cave && door.to === 'giantcave.out' && door.x > 255, '동쪽 깊은 곳의 굴 입구');
  assert.ok([0, 1, 2].every(i => over.solid[(door.y - 1) * over.w + door.x + i]), '입구 위는 바위 턱(절벽)');
  const k0 = over.start.y * over.w + over.start.x;
  assert.ok(walk(over, [k0])[door.y * over.w + door.x + 1] >= 0, '걸어서 닿음');
  const chest = cave.chests.find(c => c.chest === 'r4-big'), out = cave.ports.find(p => p.name === 'out');
  assert.ok(chest && chest.big && chest.item, '굴 안의 4격 큰 상자');
  assert.equal(out.to, 'overworld.giantcave');
  assert.deepEqual(cave.areas.map(a => a.monster), ['yeti', 'mammoth']);
  assert.ok(cave.areas.every(a => a.extra && a.zone === 'giantpass' && a.rank === 4));
  // 구역을 피해서는 상자에 못 닿음 — 구역 칸을 막고 걸으면 상자 곁에 못 감
  const blocked = new Set(); for (let k = 0; k < cave.w * cave.h; k++) if (cave.areaAt[k] >= 0) blocked.add(k);
  const s = out.y * cave.w + out.x + 1 - cave.w, d = walk(cave, [s], blocked);
  assert.ok(![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => d[(chest.y + dy) * cave.w + chest.x + dx] >= 0), '몬스터 방을 지나야 닿음');
  const d2 = walk(cave, [s]);
  assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => d2[(chest.y + dy) * cave.w + chest.x + dx] >= 0), '걸어서 닿음');
});

test('2~6격마다 처음 들어서는 자리(entry) 곁에 설 칸이 있고, 거기서 걸어 가장 먼저 닿는 구역이 그 격 (길잡이가 데려다 줄 때) — 2~5격은 바깥 지도 · 6격은 마계(abyss)', () => {
  const data = loadData();
  for (const [name, ranks] of [['overworld', [2, 3, 4, 5]], ['abyss', [6]]]) {
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, `maps/${name}.tmj`), 'utf8')), name);
  const entries = m.npcs.filter(n => n.name === 'entry');
  assert.deepEqual(entries.map(n => n.zone), data.ZONES.filter(z => ranks.includes(z.rank)).map(z => z.id));
  const inRect = (p, x, y) => x >= p.x && y >= p.y && x < p.x + (p.w || 1) && y < p.y + (p.h || 1);
  const blocked = new Set();
  for (const p of m.posts) for (const i of cellsOf(m, p)) blocked.add(i);
  for (const p of m.ports) for (const i of cellsOf(m, p)) blocked.add(i);
  for (const e of entries) {
    let spot = null;                                   // ui.js 의 freeNear 와 같은 셈
    for (let r = 0; r <= 6 && !spot; r++) {
      let bd = Infinity;
      for (let y = e.y - r; y <= e.y + r; y++) for (let x = e.x - r; x <= e.x + r; x++) {
        if (Math.max(Math.abs(x - e.x), Math.abs(y - e.y)) !== r || x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
        const i = y * m.w + x;
        if (m.solid[i] || m.ports.some(p => inRect(p, x, y)) || m.posts.some(p => inRect(p, x, y))) continue;
        const d = Math.hypot(x - e.x, y - e.y);
        if (d < bd) { bd = d; spot = { x, y }; }
      }
    }
    assert.ok(spot, `${e.zone} — 설 칸이 없음`);
    const d = walk(m, [spot.y * m.w + spot.x], blocked);
    let best = -1, bd = Infinity;
    m.areas.forEach((a, k) => { if (!a.zone) return; for (const i of areaCells(m, a)) if (d[i] >= 0 && d[i] < bd) { bd = d[i]; best = k; } });
    assert.ok(best >= 0 && m.areas[best].zone === e.zone, `${e.zone} — 가장 먼저 닿는 구역이 ${best >= 0 ? m.areas[best].zone : '없음'}`);
  }
  }
});

test('지하 묘실 — 들어온 계단에서 데몬 로드 · 발록의 방을 지나 신전의 불사의 왕까지, 뒤의 고딕 문은 불사의 왕을 꺾어야 열려 6격 마계로', () => {
  const m = loadMap('crypt');
  assert.deepEqual(m.areas.map(a => a.monster).sort(), ['balrog', 'demonlord']);
  const boss = m.posts.find(p => p.enemy === 'lichking');
  assert.ok(boss, '신전의 불사의 왕');
  const up = m.ports.find(p => p.name === 'up');
  assert.equal(up.to, 'abyss.in');
  assert.equal(up.opensAfter, 'lichking');
  const d = walk(m, [m.start.y * m.w + m.start.x], new Set(cellsOf(m, up)));          // 닫힌 문은 벽과 같음
  for (const a of m.areas) assert.ok(areaCells(m, a).some(i => d[i] >= 0), `${a.name} 방에 닿음`);
  const near = []; for (let x = boss.x; x < boss.x + boss.w; x++) near.push((boss.y + boss.h) * m.w + x);
  assert.ok(near.some(i => d[i] >= 0), '불사의 왕 앞에 닿음');
});

test('6격 마계(abyss) — 남쪽 묘실 문에서 북쪽으로 갈수록 센 상대 · 칠죄종은 턱 위(길을 막지 않음) · 벌레가 막은 마왕성 문 · 성 안에 마왕 · 관측자 · 문의 광장 문', () => {
  const data = loadData();
  const m = loadMap('abyss');
  const zi = data.ZONES.findIndex(z => z.rank === 6), foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
  assert.deepEqual(m.areas.map(a => a.monster).sort(), foes.filter(e => e.kind === 'normal').map(e => e.id).sort());
  const onMap = foes.filter(e => e.kind === 'elite').map(e => e.id).sort();
  assert.deepEqual(m.posts.map(p => p.enemy).sort(), onMap, '정예 여덟(칠죄종 · 벌레) — 마왕 · 관측자는 성 안');
  // 북쪽(위)으로 갈수록 셈 — 일반 구역 · 칠죄종 각각 세기 차례대로 위로
  const lv = id => data.ENEMIES.find(e => e.id === id).level;
  const midY = a => areaCells(m, a).reduce((s, i) => s + ((i / m.w) | 0), 0) / areaCells(m, a).length;
  const byLv = [...m.areas].sort((a, b) => lv(a.monster) - lv(b.monster));
  for (let i = 1; i < byLv.length; i++) assert.ok(midY(byLv[i]) < midY(byLv[i - 1]), `${byLv[i].name} 이(가) ${byLv[i - 1].name} 보다 북쪽`);
  const sins = m.posts.filter(p => p.enemy.startsWith('sin')).sort((a, b) => lv(a.enemy) - lv(b.enemy));
  for (let i = 1; i < sins.length; i++) assert.ok(sins[i].y < sins[i - 1].y, `${sins[i].name} 이(가) ${sins[i - 1].name} 보다 북쪽`);
  assert.ok(sins.every(p => !p.blocks), '칠죄종은 길을 막지 않음');
  // 들어서는 곳에서 — 칠죄종을 그대로 두고도 모든 구역 · 칠죄종 · 벌레 앞에 닿고, 마왕성 문은 벌레를 꺾어야 닿음
  const start = m.start.y * m.w + m.start.x, gate = m.ports.find(p => p.name === 'demoncastle'), worm = m.posts.find(p => p.enemy === 'worldworm');
  assert.ok(worm.blocks && worm.y === gate.y + 1 && worm.x === gate.x, '벌레가 마왕성 문 바로 앞을 막음');
  const posts = new Set(m.posts.flatMap(p => cellsOf(m, p)));
  const d = walk(m, [start], posts);
  for (const a of m.areas) assert.ok(areaCells(m, a).some(i => d[i] >= 0), `${a.name} 구역`);
  assert.ok(!cellsOf(m, gate).some(i => d[i] >= 0), '벌레를 꺾기 전엔 마왕성 문에 못 닿음');
  const d2 = walk(m, [start], new Set(m.posts.filter(p => p !== worm).flatMap(p => cellsOf(m, p))));
  assert.ok(cellsOf(m, gate).some(i => d2[i] >= 0), '벌레를 꺾으면 마왕성 문까지');
  assert.deepEqual(m.ports.find(p => p.name === 'in').to, 'crypt.up');
  // 마왕성 안 — 마왕 · 관측자, 왕좌 뒤 7격 대도서관으로 가는 문(마왕을 꺾어야 열림), 나가는 문은 마계로
  const c = loadMap('demoncastle');
  assert.deepEqual(c.posts.map(p => p.enemy).sort(), ['demonking', 'observer']);
  const next = c.ports.find(p => p.name === 'next');
  assert.equal(next.to, 'library.in');
  assert.equal(next.opensAfter, 'demonking');
  assert.equal(c.ports.find(p => p.name === 'out').to, 'abyss.demoncastle');
});
