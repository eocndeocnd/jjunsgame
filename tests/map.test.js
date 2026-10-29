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

test('구역이 시야에 들어오면 3~4마리 — 서로 붙지 않고, 내 코앞엔 없다', () => {
  const m = mapOf([
    '##########################',
    '#@...............aaaaaaaa#',
    '#................aaaaaaaa#',
    '#................aaaaaaaa#',
    '##########################'
  ]);
  for (let seed = 1; seed <= 20; seed++) {
    const w = M.createWorld(m, {}, seed);
    assert.equal(w.mobs.length, 0, '멀리 있을 때는 아직 없음');
    M.setInput(w, 'right');
    run(w, 3);
    const p = w.player;
    assert.ok(w.live[0], `시드 ${seed} — 구역이 보이면 세워짐`);
    assert.ok(w.mobs.length >= R.SPAWN_MIN && w.mobs.length <= R.SPAWN_MAX, `시드 ${seed} — ${w.mobs.length}마리`);
  }
  // 세워지는 순간만 따로 — 서로 떨어져 있고 내 코앞이 아님
  const w = M.createWorld(m, {}, 7);
  w.player.x = 17 - R.SIGHT; w.player.y = 2;
  M.tick(w, 0.001);
  M.setInput(w, 'right');
  for (let i = 0; i < 30 && !w.live[0]; i++) M.tick(w, 0.2);
  for (const a of w.mobs) {
    assert.ok(Math.max(Math.abs(a.x - w.player.x), Math.abs(a.y - w.player.y)) > R.SPAWN_CLEAR);
    for (const b of w.mobs) if (a !== b) assert.ok(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) >= R.SPAWN_GAP);
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

test('멀리(10칸 넘게) 갔다가 돌아오면 남은 것을 지우고 새로 선다', () => {
  const m = mapOf([
    '##################################',
    '#aaaaaaa.........................#',
    '#aaaaaaa........................@#',
    '#aaaaaaa.........................#',
    '##################################'
  ]);
  const w = M.createWorld(m, {}, 3);
  assert.equal(w.live[0], false);
  M.setInput(w, 'left');
  run(w, 4);                                      // 구역에서 5칸 앞까지
  assert.ok(w.live[0] && w.mobs.length >= R.SPAWN_MIN);
  w.mobs.pop();                                   // 하나 잡았다 치고
  const before = new Set(w.mobs.map(x => x.id));
  M.setInput(w, 'right');
  run(w, 5);
  assert.equal(w.live[0], false, '멀어지면 지워짐');
  assert.equal(w.mobs.length, 0);
  M.setInput(w, 'left');
  run(w, 4);
  assert.ok(w.live[0], '다시 보이면 섬');
  assert.ok(w.mobs.length >= R.SPAWN_MIN);
  assert.ok(w.mobs.every(x => !before.has(x.id)), '전부 새것');
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
  M.setInput(w, 'right');                        // 달아난다 (나는 초당 5칸, 쫓는 것은 3칸)
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
  M.setInput(w, 'right');                        // 누른 채 그대로
  run(w, 1);
  assert.equal(w.player.x, 1, '안 걸음');
  M.setInput(w, null);
  M.setInput(w, 'right');
  run(w, 0.1);
  assert.equal(w.player.x, 2, '떼었다 누르면 걸음');
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

// ---------- 실제 임시 지도 (maps/overworld.tmj) ----------
function loadData() {
  const text = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
  // JSON 으로 한 번 거쳐 이쪽 배열로 — vm 안에서 만든 배열은 deepEqual 이 다른 것으로 봅니다
  return JSON.parse(vm.runInNewContext(`${text}\n;JSON.stringify({ ENEMIES, ZONES })`, {}));
}
function walk(m, sources, blocked) {
  const d = new Int32Array(m.w * m.h).fill(-1), q = [];
  for (const i of sources) { d[i] = 0; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % m.w, y = (i / m.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = (y + dy) * m.w + x + dx;
      if (d[j] >= 0 || m.solid[j] || (blocked && blocked.has(j))) continue;
      d[j] = d[i] + 1; q.push(j);
    }
  }
  return d;
}
const cellsOf = (m, a) => { const out = []; for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) out.push(y * m.w + x); return out; };

test('overworld — 1~6격 몬스터가 모두 한 번씩, 구역 48개', () => {
  const data = loadData();
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const foes = data.ENEMIES.filter(e => e.rank.n <= 6);
  const areaMonsters = m.areas.filter(a => a.monster).map(a => a.monster).sort();
  assert.deepEqual(areaMonsters, foes.filter(e => e.kind === 'normal').map(e => e.id).sort());
  assert.deepEqual(m.posts.map(p => p.enemy).sort(), foes.filter(e => e.kind !== 'normal').map(e => e.id).sort());
  assert.equal(areaMonsters.length, 48);
  assert.deepEqual(m.ports.map(p => [p.to, p.opensAfter]), [['hub.overworld', 'demonking']]);
  // 길을 막는 것은 다음 격으로 가는 틈의 보스 셋과 세계수를 먹는 벌레뿐, 그리고 그것들은 3×3 (숲과 왕국은 한 땅이라 트롤 킹은 막지 않음)
  const blockers = m.posts.filter(p => p.blocks);
  assert.deepEqual(blockers.map(p => p.enemy).sort(), ['dungeonguardian', 'giantking', 'lichking', 'worldworm']);
  assert.ok(blockers.every(p => p.w === 3 && p.h === 3));
});

test('overworld — 같은 격 구역끼리는 보스 없이 걸어서 이어지고, 숲 · 고원은 넓게 트였다', () => {
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const posts = new Set(m.posts.flatMap(p => cellsOf(m, p)));
  for (let rank = 1; rank <= 6; rank++) {
    const mine = m.areas.filter(a => a.rank === rank), first = mine[0];
    const d = walk(m, [(first.y + (first.h >> 1)) * m.w + first.x + (first.w >> 1)], posts);
    for (const a of mine) assert.ok(cellsOf(m, a).some(i => d[i] >= 0), `${rank}격 ${a.name} 구역`);
  }
  // 덩어리 숲 — 땅(바닥 · 길 · 나무 · 바위) 가운데 나무 · 바위는 적게
  const [FLOOR, , , TREE, ROCK, ROAD] = [0, 1, 2, 3, 4, 5];
  for (const rank of [2, 4]) {
    const land = m.areas.filter(a => a.rank === rank).flatMap(a => cellsOf(m, a)).filter(i => [FLOOR, TREE, ROCK, ROAD].includes(m.tile[i]));
    const open = land.filter(i => m.tile[i] === FLOOR || m.tile[i] === ROAD).length / land.length;
    assert.ok(open >= 0.7, `${rank}격 트인 칸 ${Math.round(open * 100)}%`);
  }
});

test('overworld — 한 줄로 열린다: 1격 → 2 · 3 · 4격(던전 가디언) · 5격(거인왕) · 6격(불사의 왕) · 왕좌의 방(벌레)', () => {
  const m = M.parseTiled(JSON.parse(fs.readFileSync(path.join(ROOT, 'maps/overworld.tmj'), 'utf8')), 'overworld');
  const start = m.start.y * m.w + m.start.x;
  const allPosts = new Set(m.posts.flatMap(p => cellsOf(m, p)));   // 3×3 보스는 아홉 칸 다
  const but = (...ids) => {
    const gone = new Set(m.posts.filter(p => ids.includes(p.enemy)).flatMap(p => cellsOf(m, p)));
    return new Set([...allPosts].filter(i => !gone.has(i)));
  };
  const ranks = blocked => {                                       // 그 격의 구역 하나라도 닿는 격들
    const d = walk(m, [start], blocked);
    return [1, 2, 3, 4, 5, 6].filter(r => m.areas.filter(a => a.rank === r).some(a => cellsOf(m, a).some(i => d[i] >= 0)));
  };
  assert.deepEqual(ranks(allPosts), [1], '처음에는 1격만 — 지하수로에서 4격으로 새는 길 없음');
  assert.deepEqual(ranks(but('dungeonguardian')), [1, 2, 3, 4], '수문 너머 숲, 숲에서 그대로 왕국 · 4격');
  assert.deepEqual(ranks(but('dungeonguardian', 'giantking')), [1, 2, 3, 4, 5], '아치 너머 5격');
  assert.deepEqual(ranks(but('dungeonguardian', 'giantking', 'lichking')), [1, 2, 3, 4, 5, 6], '묘실 너머 6격');
  // 문의 광장 문 — 세계수를 먹는 벌레가 막은 굴 너머 왕좌의 방
  const port = cellsOf(m, m.ports.find(p => p.name === 'hub'));
  const reaches = blocked => { const d = walk(m, [start], blocked); return port.some(i => d[i] >= 0); };
  assert.ok(!reaches(but('dungeonguardian', 'giantking', 'lichking')), '벌레가 막음');
  assert.ok(reaches(but('dungeonguardian', 'giantking', 'lichking', 'worldworm', 'demonking')), '벌레를 꺾으면 문까지');
  // 지도 전체가 이어져 있다
  const all = walk(m, [start]);
  assert.ok(m.areas.every(a => cellsOf(m, a).filter(i => !m.solid[i]).every(i => all[i] >= 0)), '모든 구역의 걸을 수 있는 칸에 닿음');
  // 들머리(첫 구역 한가운데) · 상인 자리는 걸을 수 있는 칸
  for (const a of m.areas.filter(x => x.monster)) {
    const first = m.areas.find(x => x.zone === a.zone && x.monster);
    assert.ok(!m.solid[(first.y + (first.h >> 1)) * m.w + first.x + (first.w >> 1)], `${a.zone} 들머리`);
  }
  for (const n of m.npcs) assert.ok(!m.solid[n.y * m.w + n.x], `${n.name} 자리`);
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
