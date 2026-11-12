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
  return JSON.parse(vm.runInNewContext(`${text}\n;JSON.stringify({ ENEMIES, ZONES, ITEMS })`, {}));
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

test('overworld — 2~6격 몬스터가 모두 한 번씩, 구역 39개 · 숲 남쪽 끝 구멍으로 지하수로에', () => {
  const data = loadData();
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const foes = data.ENEMIES.filter(e => e.rank.n >= 2 && e.rank.n <= 6);
  const areaMonsters = m.areas.filter(a => a.monster).map(a => a.monster).sort();
  assert.deepEqual(areaMonsters, foes.filter(e => e.kind === 'normal').map(e => e.id).sort());
  const elsewhere = [...gen.SECRET_ROOMS.map(r => r.hidden), ...gen.BUILDINGS.map(b => b.boss)]   // 숨은 굴에 따로 선 히든 · 건물 안 보스
    .map(name => data.ENEMIES.find(e => e.name === name).id);
  assert.deepEqual(m.posts.map(p => p.enemy).sort(), foes.filter(e => e.kind !== 'normal' && !elsewhere.includes(e.id)).map(e => e.id).sort());
  assert.equal(areaMonsters.length, 39);
  assert.deepEqual(m.ports.map(p => [p.to, p.opensAfter, !!p.hole]),
    [['sewer.out', undefined, true], ['castle.out', undefined, false], ['hub.overworld', 'demonking', false]]);
  const hole = m.ports.find(p => p.name === 'sewer');
  assert.ok(!m.solid[(hole.y - 1) * m.w + hole.x + 1] && m.solid[(hole.y + 1) * m.w + hole.x + 1], '구멍 위는 걸을 수 있는 숲, 아래는 어둠');
  assert.ok(Math.abs(m.start.x - (hole.x + 1)) <= 1 && m.start.y === hole.y - 1, '지도의 시작점은 구멍 바로 위');
  // 길을 막는 것은 다음 격으로 가는 틈의 보스 둘과 세계수를 먹는 벌레뿐 (숲과 왕국은 한 땅이라 트롤 킹은 막지 않음) — 크기는 data.js 그대로
  const blockers = m.posts.filter(p => p.blocks);
  assert.deepEqual(blockers.map(p => p.enemy).sort(), ['giantking', 'lichking', 'worldworm']);
  const sizeOf = id => data.ENEMIES.find(e => e.id === id).size;
  assert.ok(blockers.every(p => p.w === sizeOf(p.enemy) && p.h === sizeOf(p.enemy)));
  assert.ok(blockers.some(p => p.w > 3), '큰 보스가 막는 틈은 그만큼 넓음');
});

test('overworld — 같은 격 구역끼리는 보스 없이 걸어서 이어지고, 숲 · 고원은 넓게 트였다', () => {
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const posts = new Set(m.posts.flatMap(p => cellsOf(m, p)));
  for (let rank = 2; rank <= 6; rank++) {
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

test('overworld — 한 줄로 열린다: 구멍 앞에서 2 · 3 · 4격 → 5격(거인왕) · 6격(불사의 왕) · 왕좌의 방(벌레)', () => {
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const start = m.start.y * m.w + m.start.x;
  const allPosts = new Set(m.posts.flatMap(p => cellsOf(m, p)));   // 큰 자리는 몸 칸 다
  const but = (...ids) => {
    const gone = new Set(m.posts.filter(p => ids.includes(p.enemy)).flatMap(p => cellsOf(m, p)));
    return new Set([...allPosts].filter(i => !gone.has(i)));
  };
  const ranks = blocked => {                                       // 그 격의 구역 하나라도 닿는 격들
    const d = walk(m, [start], blocked);
    return [2, 3, 4, 5, 6].filter(r => m.areas.filter(a => a.rank === r).some(a => areaCells(m, a).some(i => d[i] >= 0)));
  };
  assert.deepEqual(ranks(allPosts), [2, 3, 4], '구멍 앞 숲에서 그대로 왕국 · 4격');
  assert.deepEqual(ranks(but('giantking')), [2, 3, 4, 5], '아치 너머 5격');
  assert.deepEqual(ranks(but('giantking', 'lichking')), [2, 3, 4, 5, 6], '묘실 너머 6격');
  // 문의 광장 문 — 세계수를 먹는 벌레가 막은 굴 너머 왕좌의 방
  const port = cellsOf(m, m.ports.find(p => p.name === 'hub'));
  const reaches = blocked => { const d = walk(m, [start], blocked); return port.some(i => d[i] >= 0); };
  assert.ok(!reaches(but('giantking', 'lichking')), '벌레가 막음');
  assert.ok(reaches(but('giantking', 'lichking', 'worldworm', 'demonking')), '벌레를 꺾으면 문까지');
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

test('건물 — 3격 몰락한 왕의 성은 바깥 지도에선 남쪽 정면 가운데에 문 하나 난 닫힌 건물, 들어가면 깔개 끝에 보스 · 양옆에 기둥인 성 안', () => {
  const over = loadMap('overworld'), c = loadMap('castle');
  const door = over.ports.find(p => p.name === 'castle');
  assert.ok(door.door && door.to === 'castle.out' && door.w === 4 && door.h === 1);
  // 건물 자리 — 겉모습이 건물인 칸 덩어리. 문 칸만 걸을 수 있고 나머지는 모두 막힘, 문은 그 아래 가장자리 한가운데
  const cells = [];
  for (let k = 0; k < over.w * over.h; k++) if ((over.look[k] & 15) === gen.BUILD) cells.push(k);
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

test('문의 광장 — 일곱 장의 문은 그 앞 격 보스를 꺾어야 열리고, 마왕의 성으로 가는 문은 늘 열림 · 모두 걸어서 닿음', () => {
  const data = loadData();
  const hub = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/hub.tmj'), 'utf8')), 'hub');
  const over = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  assert.equal(hub.props.title, '문의 광장');
  assert.equal(hub.areas.length, 0, '몬스터 없음');
  const bossOf = rank => data.ENEMIES.find(e => e.rank.n === rank && e.kind === 'boss').id;
  for (const d of gen.HUB_DOORS) {
    const p = hub.ports.find(q => q.name === d.name);
    assert.ok(p, d.name);
    assert.equal(p.to, `${d.name}.in`);
    assert.equal(p.opensAfter, bossOf(d.after), `${d.label} — ${d.after}격 보스`);
    assert.equal(p.zone, data.ZONES.find(z => z.rank === d.first).id);
  }
  const back = hub.ports.find(p => p.name === 'overworld');
  assert.equal(back.to, 'overworld.hub');
  assert.equal(back.opensAfter, undefined);
  assert.ok(over.ports.some(p => p.name === 'hub'), '돌아갈 곳 — overworld 의 hub 문');
  // 시작점에서 모든 문의 바로 앞(아래 칸)까지 걸어서 닿음
  const d = walk(hub, [hub.start.y * hub.w + hub.start.x]);
  for (const p of hub.ports) {
    const near = [];
    for (let x = p.x; x < p.x + p.w; x++) near.push((p.y + p.h) * hub.w + x, (p.y - 1) * hub.w + x);
    assert.ok(near.some(i => d[i] >= 0), `${p.label} 앞에 닿음`);
  }
});

// ---------- 7~20격 일곱 장 ----------
const loadMap = name => M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, `maps/${name}.tmj`), 'utf8')), name);
const allMapNames = () => fs.readdirSync(path.join(ROOT, 'maps')).filter(f => f.endsWith('.tmj')).map(f => f.replace(/\.tmj$/, ''));

test('지도 전부 — 스무 지역이 저마다 한 장에만, 296마리가 모두 한 번씩', () => {
  const data = loadData();
  const zoneMaps = {}, normals = [], posts = [];
  for (const name of allMapNames()) {
    const m = loadMap(name);
    for (const a of m.areas) if (a.zone) (zoneMaps[a.zone] = zoneMaps[a.zone] || new Set()).add(name);
    normals.push(...m.areas.filter(a => a.monster).map(a => a.monster));
    posts.push(...m.posts.map(p => p.enemy));
  }
  for (const z of data.ZONES) assert.equal(zoneMaps[z.id] && zoneMaps[z.id].size, 1, `${z.rank}격 ${z.name}`);
  assert.deepEqual(normals.sort(), data.ENEMIES.filter(e => e.kind === 'normal').map(e => e.id).sort());
  assert.deepEqual(posts.sort(), data.ENEMIES.filter(e => e.kind !== 'normal').map(e => e.id).sort());
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

test('일곱 장 — 어귀의 문은 문의 광장의 그 장 문으로, 광장의 문은 그 장의 어귀로', () => {
  const hub = loadMap('hub');
  for (const r of gen.REALMS) {
    const m = loadMap(r.name);
    const back = m.ports.find(p => p.name === 'in');
    assert.ok(back, `${r.title} 어귀의 문`);
    assert.equal(back.to, `hub.${r.name}`);
    assert.ok(hub.ports.some(p => p.name === r.name && p.to === `${r.name}.in`), `광장의 ${r.title} 문`);
  }
});

test('일곱 장 — 같은 장의 다음 격은 앞 격 보스 너머, 먼 격은 처음부터 열렸지만 강 너머로 보이기만 (걸어서 8칸 넘게)', () => {
  const data = loadData();
  const bossOf = rank => data.ENEMIES.find(e => e.rank.n === rank && e.kind === 'boss').id;
  for (const r of gen.REALMS) {
    const m = loadMap(r.name);
    const back = m.ports.find(p => p.name === 'in');
    const from = [(back.y + back.h) * m.w + back.x, back.y * m.w + back.x + 1];   // 광장에서 들어와 서는 칸 근처
    const allPosts = new Set(m.posts.flatMap(p => cellsOf(m, p)));
    const without = ids => new Set([...allPosts].filter(i => !m.posts.filter(p => ids.includes(p.enemy)).some(p => cellsOf(m, p).includes(i))));
    const reach = (blocked, rank) => {
      const d = walk(m, from.filter(i => !m.solid[i]), blocked);
      return m.areas.filter(a => a.rank === rank).some(a => cellsOf(m, a).some(i => d[i] >= 0));
    };
    r.ranks.forEach((rank, i) => {
      const prev = rank - 1;
      if (i > 0 && r.ranks.includes(prev)) {
        assert.ok(!reach(allPosts, rank), `${r.title} ${rank}격은 ${prev}격 보스 너머`);
        assert.ok(reach(without(r.ranks.slice(0, i).map(bossOf)), rank), `${r.title} ${prev}격까지의 보스를 꺾으면 ${rank}격`);
      } else {
        assert.ok(reach(allPosts, rank), `${r.title} ${rank}격은 처음부터 열림`);
      }
    });
    // 먼 격 — 지금 격(그 장의 첫 격)의 길(어귀 + 첫 격 구역)에서 걸어서 8칸 넘게, 그래도 보임
    const far = r.ranks.filter((rank, i) => i > 0 && !r.ranks.includes(rank - 1));
    if (!far.length) continue;
    const walkable = cells => cells.filter(i => !m.solid[i]);
    const plaza = m.areas.find(a => !a.monster);
    const path0 = walkable([...cellsOf(m, plaza), ...m.areas.filter(a => a.rank === r.ranks[0]).flatMap(a => cellsOf(m, a))]);
    const d = walk(m, path0);
    for (const rank of far) {
      const fields = m.areas.filter(a => a.rank === rank);
      const nearest = Math.min(...fields.flatMap(a => walkable(cellsOf(m, a)).map(i => d[i])).filter(v => v >= 0));
      assert.ok(nearest > 8, `${r.title} ${rank}격 — 걸어서 ${nearest}칸`);
      const seen = fields.some(a => path0.some(i => {
        const x = i % m.w, y = (i / m.w) | 0;
        return Math.max(Math.max(a.x - x, 0, x - (a.x + a.w - 1)), Math.max(a.y - y, 0, y - (a.y + a.h - 1))) <= R.SIGHT;
      }));
      assert.ok(seen, `${r.title} ${rank}격이 보임`);
    }
  }
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

// ---------- 도시 (docs/CITY-PLAN.md 1-가) ----------
test('도시 — 집 앞 시작점에서 골목 막다른 곳의 이상한 게이트까지 걸어서 닿고, 그 게이트는 지하수로 첫 공간의 게이트와 서로 이어짐 · 건물 네모가 건물 칸을 빠짐없이', () => {
  const city = loadMap('city'), sewer = loadMap('sewer');
  const gate = city.ports.find(p => p.name === 'gate'), back = sewer.ports.find(p => p.name === 'city');
  assert.ok(gate && gate.rift && gate.to === 'sewer.city', '도시 → 지하수로');
  assert.ok(back && back.rift && back.appears && back.needsCity && back.to === 'city.gate', '지하수로 → 도시 (도시가 열린 뒤에만)');
  const d = walk(city, [city.start.y * city.w + city.start.x]);
  assert.ok(cellsOf(city, gate).every(i => d[i] >= 0), '시작점에서 게이트에 닿음');
  const plaza = sewer.areas.find(a => a.name === '첫 공간');
  assert.ok(back.x >= plaza.x && back.x + back.w <= plaza.x + plaza.w && back.y >= plaza.y && back.y < plaza.y + plaza.h, '지하수로 게이트는 첫 공간 안');
  const ds = walk(sewer, [sewer.start.y * sewer.w + sewer.start.x]);
  assert.ok(cellsOf(sewer, back).every(i => ds[i] >= 0), '지하수로 시작점에서 닿음');
  // 지역이 없는 지도 — 몬스터 · 정해진 자리 · 상자 없음, 이름은 지도 속성 title
  assert.equal(city.areas.length, 0);
  assert.equal(city.posts.length, 0);
  assert.equal(city.chests.length, 0);
  assert.equal(city.props.title, '헌터들의 도시');
  // 건물 — 네모끼리 안 겹치고 건물 칸(겉모습 BUILD)을 빠짐없이 덮음, 문은 그 건물 아래 줄 · 아직 닫힘(벽)
  const blds = JSON.parse(city.props.blds), BUILD = 12, owner = new Map();
  for (const [n, b] of blds.entries()) for (const i of cellsOf(city, b)) {
    assert.ok(!owner.has(i), `건물 ${n} 겹침`);
    owner.set(i, n);
    assert.equal(city.look[i] & 15, BUILD, `건물 ${n} — 건물 칸이 아닌 곳을 덮음`);
  }
  for (let i = 0; i < city.w * city.h; i++) if ((city.look[i] & 15) === BUILD) assert.ok(owner.has(i), `건물 칸 ${i % city.w},${(i / city.w) | 0} 이(가) 어느 건물에도 안 듦`);
  for (const p of city.ports.filter(q => q.door)) {
    const b = blds[owner.get(p.y * city.w + p.x)];
    assert.ok(b && p.y === b.y + b.h - 1 && p.x >= b.x && p.x + p.w <= b.x + b.w, `${p.label} — 건물 아래 줄`);
    assert.ok(cellsOf(city, p).every(i => city.solid[i]) && !p.to, `${p.label} — 아직 닫힘`);
    assert.ok(d[(p.y + 1) * city.w + p.x] >= 0, `${p.label || p.name} 앞은 걸을 수 있음`);
  }
  // 있어야 하는 건물 — 헌터 협회(가장 큼) · 헌터백화점 · 4대 길드 넷 · 집 · 내 길드가 될 빈 건물 · 암시장이 들어설 자리
  const doors = city.ports.filter(q => q.door).map(q => q.name).sort();
  assert.deepEqual(doors, ['association', 'blackmarket', 'dept', 'guild1', 'guild2', 'guild3', 'guild4', 'home', 'myguild']);
  const area = b => b.w * b.h, hq = blds.find(b => b.kind === 'hq');
  assert.ok(blds.every(b => b === hq || area(b) < area(hq)), '헌터 협회가 가장 큰 건물');
  assert.equal(blds.filter(b => b.kind === 'guild').length, 4);
  // 건물끼리 붙지 않음 (옛 동네 골목 끝의 덧붙인 채 — 두 칸짜리 — 만 빼고)
  for (const [n, b] of blds.entries()) for (const [k, c] of blds.entries()) {
    if (k <= n || area(b) <= 4 || area(c) <= 4) continue;
    const gapX = Math.max(c.x - (b.x + b.w), b.x - (c.x + c.w)), gapY = Math.max(c.y - (b.y + b.h), b.y - (c.y + c.h));
    assert.ok(gapX >= 1 || gapY >= 1, `건물 ${n}(${b.kind}) · ${k}(${c.kind}) 사이가 뜸`);
  }
  // 가림막 친 빈터 셋 — 못 들어감
  const SNOW = 8, lots = new Set();
  for (let i = 0; i < city.w * city.h; i++) if ((city.look[i] & 15) === SNOW) { assert.ok(city.solid[i], '빈터는 막힘'); lots.add(i); }
  assert.ok(lots.size >= 3 * 7 * 11, '빈터 셋');
});
