// ============================================================
//  map.js — 월드맵 걷기의 규칙 (docs/MAP-REFERENCE-PLAN.md)
//
//  이동 · 벽 · 스폰과 다시 스폰 · 선공/후공/중립의 움직임 · 닿음 판정만 다룹니다.
//  화면도 게임 상태(State)도 모릅니다 — 몬스터 성격 · 기운 · 정예가 살아 있는지 같은 것은 hooks 로 받습니다.
//  그래서 node --test 로 시험할 수 있습니다 (tests/map.test.js).
//
//  지도는 Tiled(무료 지도 편집기)가 바로 여는 JSON(.tmj)입니다 — parseTiled 가 읽습니다.
//    ground   타일 층 — 타일셋에서 solid 속성이 붙은 타일은 지나갈 수 없습니다 (벽 · 물)
//    areas    사각형 또는 다각형 — 구역. 속성 rank · monster(적 id) · zone(지역 id). monster 가 없으면 이름뿐인 곳(첫 공간)
//             다각형이면 땅 모양을 따라 그린 구역 — 칸 가운데가 다각형 안에 드는 칸이 그 구역입니다
//    posts    점 또는 사각형 — 정예 · 보스 · 히든 자리. 속성 enemy · blocks(길을 막는가)
//    ports    사각형 — 드나드는 문. 이름 = 그 지도 안의 문 이름. 속성 to(「지도.문」 행선지) · opensAfter(꺾어야 열리는 보스 id)
//             · label(문 위에 쓰는 글) · zone(행선지 지도가 아직 없을 때 나설 지역) · hole(구멍으로 그림)
//             · appears(열리기 전엔 문이 없음 — 보이지도 막히지도 않는 그냥 땅. 보스를 꺾으면 그 곁에 나타나는 숨은 굴의 구멍)
//    (지도 자체의 속성 title — 지역이 없는 지도의 이름, 문의 광장 같은)
//    secrets  사각형 — 숨은 입구. 벽으로 그려져 있어도 지나갈 수 있습니다
//    npc      점 — start(시작점) · merchant(상인 자리) · avatarDoor(화신 문)
//    chests   점 — 보물상자. 속성 chest(상자 id — data.js 의 CHESTS). 그 칸은 막히고, 닫힌 상자에 닿으면 연다
// ============================================================
(function (root) {
  'use strict';

  const RULES = {
    SIGHT: 8,            // 보이는 범위 — 나를 중심으로 가로 · 세로 이만큼 (폰 화면쯤). 잡은 뒤 새로 서는 것은 되도록 이 밖에
    SPAWN_MIN: 3,        // 구역마다 처음에 세우는 수
    SPAWN_MAX: 4,
    SPAWN_GAP: 2,        // 같이 선 몬스터끼리는 이만큼 떨어지게 (바로 옆 칸 금지)
    SPAWN_CLEAR: 3,      // 내 코앞에는 세우지 않습니다
    PLAYER_SPEED: 10,    // 초당 칸
    CHASE_SPEED: 3,
    FLEE_SPEED: 3,
    WANDER_EVERY: 1,     // 어슬렁 — 대략 이 초마다 한 칸
    AGGRO_SIGHT: 4,      // 선공이 나를 알아보는 거리 (걸어서 칸 수)
    LEASH: 3,            // 쫓던 것이 제 구역 밖으로 이만큼 넘게 나가면 포기하고 돌아갑니다
    SHY_SIGHT: 3,        // 중립이 달아나기 시작하는 거리
    ENRAGE_SECS: 10,     // 후공 앞에서 물러서면 이만큼 화가 나서 쫓아옵니다
    FREEZE_SECS: 2       // 물러서거나 진 뒤 그 몬스터가 멈춰 있는 시간 — 곧바로 다시 닿지 않게
  };

  // 성격(ARCHETYPES)으로 정하는 기본값 — 선공(aggro) · 후공(passive) · 중립(shy). 어울리지 않는 것은 나중에 하나씩 고칩니다.
  const TEMPER_BY_ARCH = {
    fierce: 'aggro', brutal: 'aggro', leech: 'aggro', pierce: 'aggro',
    guard: 'passive', thorn: 'passive', ward: 'passive',
    swift: 'shy', lucky: 'shy', growth: 'shy'
  };
  function temperOf(arch) { return TEMPER_BY_ARCH[arch] || 'passive'; }

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const STEPS = Object.values(DIRS);

  // ---------- 지도 읽기 ----------
  function props(o) {
    const p = {};
    for (const q of o.properties || []) p[q.name] = q.value;
    return p;
  }
  function eachCell(m, r, fn) {
    for (let y = Math.max(0, r.y); y < Math.min(m.h, r.y + r.h); y++)
      for (let x = Math.max(0, r.x); x < Math.min(m.w, r.x + r.w); x++) fn(x, y);
  }
  function inRect(r, x, y) { return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h; }

  function parseTiled(tmj, id) {
    const w = tmj.width, h = tmj.height, tw = tmj.tilewidth, th = tmj.tileheight;
    const layer = name => tmj.layers.find(l => l.name === name);
    const objects = name => (layer(name) || {}).objects || [];
    const ts = tmj.tilesets[0];
    const solidTiles = new Set((ts.tiles || []).filter(t => props(t).solid).map(t => t.id));
    const ground = layer('ground').data;
    const m = { id, w, h, props: props(tmj), tile: new Int16Array(w * h), solid: new Uint8Array(w * h), secret: new Uint8Array(w * h) };
    for (let i = 0; i < w * h; i++) {
      const gid = ground[i] & 0x1fffffff;                 // 위쪽 세 비트는 Tiled 의 뒤집기 표시
      m.tile[i] = gid ? gid - ts.firstgid : -1;
      m.solid[i] = !gid || solidTiles.has(m.tile[i]) ? 1 : 0;
    }
    const rect = o => ({ x: Math.floor(o.x / tw), y: Math.floor(o.y / th),
                         w: Math.max(1, Math.round((o.width || 0) / tw)), h: Math.max(1, Math.round((o.height || 0) / th)) });
    const cell = o => ({ x: Math.floor(o.x / tw), y: Math.floor(o.y / th) });

    for (const o of objects('secrets')) eachCell(m, rect(o), (x, y) => { m.secret[y * w + x] = 1; m.solid[y * w + x] = 0; });
    // 구역 — x · y · w · h 는 다각형이면 그것을 감싸는 네모. 어느 칸이 어느 구역인지는 areaAt (겹치면 뒤의 것)
    m.areaAt = new Int16Array(w * h).fill(-1);
    m.areas = objects('areas').map((o, i) => {
      if (!o.polygon) return { index: i, name: o.name, ...rect(o), ...props(o) };
      const pts = o.polygon.map(q => ({ x: (o.x + q.x) / tw, y: (o.y + q.y) / th }));
      const x0 = Math.floor(Math.min(...pts.map(q => q.x))), y0 = Math.floor(Math.min(...pts.map(q => q.y)));
      return { index: i, name: o.name, x: x0, y: y0, w: Math.ceil(Math.max(...pts.map(q => q.x))) - x0,
               h: Math.ceil(Math.max(...pts.map(q => q.y))) - y0, poly: pts, ...props(o) };
    });
    for (const a of m.areas) {
      if (!a.poly) { eachCell(m, a, (x, y) => { m.areaAt[y * w + x] = a.index; }); continue; }
      for (let y = Math.max(0, a.y); y < Math.min(h, a.y + a.h); y++) {   // 줄마다 칸 가운데 높이에서 다각형 변과 만나는 곳 사이를 채움
        const Y = y + 0.5, xs = [];
        a.poly.forEach((q, k) => {
          const r = a.poly[(k + 1) % a.poly.length];
          if ((q.y <= Y) !== (r.y <= Y)) xs.push(q.x + (Y - q.y) * (r.x - q.x) / (r.y - q.y));
        });
        xs.sort((p1, p2) => p1 - p2);
        for (let k = 0; k + 1 < xs.length; k += 2)
          for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x < Math.min(w, Math.ceil(xs[k + 1] - 0.5)); x++) m.areaAt[y * w + x] = a.index;
      }
    }
    for (const a of m.areas) a.mid = areaMid(m, a);
    // 정해진 자리 — 점이면 한 칸, 사각형이면 그만큼 (큰 보스는 제 크기 n × n 으로 고갯길을 막고 섭니다)
    m.posts = objects('posts').map(o => ({ name: o.name, ...(o.point || !o.width ? { ...cell(o), w: 1, h: 1 } : rect(o)), ...props(o) }));
    m.ports = objects('ports').map(o => ({ name: o.name, ...rect(o), ...props(o) }));
    m.npcs = objects('npc').map(o => ({ name: o.name, ...cell(o), ...props(o) }));
    m.chests = objects('chests').map(o => ({ name: o.name, ...cell(o), ...props(o) }));
    const start = m.npcs.find(n => n.name === 'start');
    m.start = start ? { x: start.x, y: start.y } : { x: 1, y: 1 };
    return m;
  }

  // 구역의 들머리 — 네모면 한가운데 칸, 다각형이면 구역 칸들의 무게중심에 가장 가까운 걸을 수 있는 구역 칸
  // (가까운 것이 여럿이면 위 · 왼쪽 것). 불러오면 그 지역 첫 구역의 들머리에 섭니다. tools/map-gen.js 의 들머리와 같은 셈
  function areaMid(m, a) {
    let tx = a.x + (a.w >> 1), ty = a.y + (a.h >> 1);
    if (a.poly) {
      let sx = 0, sy = 0, n = 0;
      eachCell(m, a, (x, y) => { if (m.areaAt[y * m.w + x] === a.index) { sx += x; sy += y; n++; } });
      if (n) { tx = sx / n; ty = sy / n; }
    }
    let best = null, bestD = Infinity;
    eachCell(m, a, (x, y) => {
      const k = y * m.w + x;
      if (m.areaAt[k] !== a.index || m.solid[k]) return;
      const d = (x - tx) ** 2 + (y - ty) ** 2;
      if (d < bestD) { bestD = d; best = { x, y }; }
    });
    return best || { x: a.x + (a.w >> 1), y: a.y + (a.h >> 1) };
  }

  // ---------- 세계 (한 지도 위의 지금 상태) ----------
  // hooks
  //   temper(monsterId)  → 'aggro' | 'passive' | 'shy'
  //   rollAura(monsterId) → 기운(없으면 null) — 세계가 설 때 한 번, 그 뒤로는 잡혀서 새로 설 때마다 굴립니다
  //   postAlive(enemyId) → 그 자리에 아직 서 있는가 (이 여정에서 꺾었거나 아직 안 나타난 히든이면 false)
  //   portOpen(port)     → 그 문이 열렸는가
  //   size(monsterId)    → 지도에서 차지하는 n × n 칸 (없으면 1). 몬스터의 x · y 는 왼쪽 위 칸이고 w · h 가 그 크기
  //   chestOpen(chestId) → 그 보물상자를 이미 열었는가 (열린 상자는 그냥 막힌 칸)
  function mulberry(seed) {
    return () => {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // keep — 저장해 둔 몬스터 [{ monster, area, x, y, aura }] (없으면 모든 구역에 새로 세웁니다)
  function createWorld(map, hooks, seed, keep) {
    const w = {
      map,
      rng: seed == null ? Math.random : mulberry(seed),
      hooks: { temper: () => 'passive', rollAura: () => null, postAlive: () => true, portOpen: () => true, size: () => 1, chestOpen: () => false, ...hooks },
      time: 0,
      player: { x: map.start.x, y: map.start.y, fromX: map.start.x, fromY: map.start.y, dir: null, wait: 0, needRelease: false },
      mobs: [],
      nextMob: 1,
      encounter: null,                    // 닿아서 싸움 화면이 떠 있는 동안 { mob | post, first }
      lastArea: -1,                       // 마지막으로 서 있던 구역 (구역 밖 길 위에서는 그대로)
      fields: {}                          // 구역 · 몸 크기마다 「제 구역까지 몇 걸음」 (homeField)
    };
    const a = areaAt(w, map.start.x, map.start.y);
    if (a) w.lastArea = a.index;
    populate(w, keep);
    return w;
  }

  // 누르고 있는 방향 (null = 뗐다). 닿은 뒤에는 한 번 떼야 다시 걷습니다 — 누른 채로 또 부딪히지 않게.
  function setInput(w, dir) {
    const p = w.player;
    if (p.needRelease) { if (!dir) p.needRelease = false; return; }
    p.dir = DIRS[dir] ? dir : null;
  }

  const manh = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
  function gap(r, x, y) {   // 사각형 바깥으로 얼마나 떨어졌나 (안이면 0, 0)
    return { dx: Math.max(r.x - x, 0, x - (r.x + r.w - 1)), dy: Math.max(r.y - y, 0, y - (r.y + r.h - 1)) };
  }
  const outside = (r, x, y) => { const g = gap(r, x, y); return g.dx + g.dy; };
  // 큰 몬스터 — x · y 는 왼쪽 위 칸, 몸은 n × n 칸 (직접 세운 것은 w 가 없어 한 칸)
  const sizeOf = m => m.w || 1;
  const body = (x, y, n) => ({ x, y, w: n, h: n });
  const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  // 두 몸 사이의 체비쇼프 거리 (한 칸짜리끼리면 가로 · 세로 중 큰 차이 — 맞닿으면 1, 겹치면 0 이하)
  const apart = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h)) + 1;

  function areaAt(w, x, y) {
    const i = w.map.areaAt[y * w.map.w + x];
    return i >= 0 ? w.map.areas[i] : null;
  }
  function mobAt(w, x, y) { return w.mobs.find(m => x >= m.x && y >= m.y && x < m.x + sizeOf(m) && y < m.y + sizeOf(m)) || null; }
  function postAt(w, x, y) { return w.map.posts.find(p => inRect(p, x, y) && w.hooks.postAlive(p.enemy)) || null; }
  function chestAt(w, x, y) { return w.map.chests.find(c => c.x === x && c.y === y) || null; }
  function portAt(w, x, y) { return w.map.ports.find(p => inRect(p, x, y) && (!p.appears || w.hooks.portOpen(p))) || null; }
  function wall(w, x, y) {
    if (x < 0 || y < 0 || x >= w.map.w || y >= w.map.h || w.map.solid[y * w.map.w + x]) return true;
    const port = portAt(w, x, y);
    return !!port && !w.hooks.portOpen(port);             // 닫힌 문은 벽과 같습니다
  }
  // ---------- 제 구역 ----------
  // 몬스터가 「제 구역 안」이라는 것은 몸(n × n)의 모든 칸이 그 구역 칸이라는 것 — 구역이 네모가 아니어도 그대로.
  // 구역마다 몸의 왼쪽 위 칸이 어디에 있으면 제 구역까지 몇 걸음인지를 한 번 재 둡니다 (안이면 0 · 벽은 못 지나감).
  // 구역을 감싸는 네모에서 가장자리 밖 LEASH + 5칸까지만 잽니다 — 쫓다가도 그보다 멀리는 안 나가니까.
  // 몸 크기마다 따로 잽니다 (n — 그 구역 몬스터의 크기)
  function homeField(w, a, n) {
    const key = a.index * 8 + n;
    if (w.fields[key]) return w.fields[key];
    const m = w.map, P = RULES.LEASH + 5;
    const x0 = Math.max(0, a.x - P), y0 = Math.max(0, a.y - P);
    const fw = Math.min(m.w, a.x + a.w + P) - x0, fh = Math.min(m.h, a.y + a.h + P) - y0;
    const d = new Int16Array(fw * fh).fill(-1), q = [];
    const body = (x, y, ok) => {
      if (x + n > m.w || y + n > m.h) return false;
      for (let j = y; j < y + n; j++) for (let i = x; i < x + n; i++) if (!ok(j * m.w + i)) return false;
      return true;
    };
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++)
      if (body(x0 + i, y0 + j, k => m.areaAt[k] === a.index)) { d[j * fw + i] = 0; q.push(j * fw + i); }
    for (let k = 0; k < q.length; k++) {
      const i = q[k] % fw, j = (q[k] / fw) | 0;
      for (const [dx, dy] of STEPS) {
        const ni = i + dx, nj = j + dy, nk = nj * fw + ni;
        if (ni < 0 || nj < 0 || ni >= fw || nj >= fh || d[nk] >= 0 || !body(x0 + ni, y0 + nj, c => !m.solid[c])) continue;
        d[nk] = d[q[k]] + 1; q.push(nk);
      }
    }
    return (w.fields[key] = { x0, y0, fw, fh, d });
  }
  // 몸의 왼쪽 위 칸이 x · y 일 때 제 구역까지 몇 걸음 (안이면 0, 잰 곳 밖이거나 막혀 못 가면 Infinity)
  function homeDist(f, x, y) {
    const i = x - f.x0, j = y - f.y0;
    if (i < 0 || j < 0 || i >= f.fw || j >= f.fh) return Infinity;
    const v = f.d[j * f.fw + i];
    return v < 0 ? Infinity : v;
  }
  // 몸이 제 구역 안에 드는 왼쪽 위 칸마다 fn(x, y)
  function eachHome(w, a, n, fn) {
    const f = homeField(w, a, n);
    for (let j = 0; j < f.fh; j++) for (let i = 0; i < f.fw; i++) if (f.d[j * f.fw + i] === 0) fn(f.x0 + i, f.y0 + j);
  }

  // 몬스터(n × n, 왼쪽 위 x · y)가 들어설 수 있는가 — 몸이 닿는 칸 어디에도 벽 · 다른 몬스터 · 정예 자리 · 문 · 내가 없어야 합니다.
  // self 는 움직이려는 그 몬스터 (제 몸과는 안 부딪힘)
  function freeForMob(w, x, y, n = 1, self = null) {
    const b = body(x, y, n), p = w.player;
    for (let j = y; j < y + n; j++) for (let i = x; i < x + n; i++) if (wall(w, i, j)) return false;
    return !inRect(b, p.x, p.y)
      && !w.mobs.some(o => o !== self && overlaps(b, body(o.x, o.y, sizeOf(o))))
      && !w.map.posts.some(q => overlaps(b, q) && w.hooks.postAlive(q.enemy))
      && !w.map.ports.some(q => overlaps(b, q))
      && !w.map.chests.some(c => inRect(b, c.x, c.y));
  }

  // ---------- 스폰 ----------
  // 세계가 서면 몬스터가 있는 모든 구역에 3~4마리를 한 번 세웁니다 (기운도 이때 굴림). 멀리 가도 지우지 않고,
  // 잡으면 그 구역에 하나가 새로 섭니다(resolve). 저장해 둔 것(keep)은 지금 지도와 맞는 것만 되살리고, 하나도 안 남은 구역은 새로 세웁니다.
  // keep 의 fighting — 마주하던 중에 저장된 그 몬스터. 그 조우로 세계를 세웁니다 (resolve 로 끝낼 때까지 멈춤)
  function populate(w, keep) {
    for (const k of keep || []) {
      const a = w.map.areas[k.area];
      if (!a || a.monster !== k.monster || !freeForMob(w, k.x, k.y, w.hooks.size(a.monster) || 1)) continue;
      const m = newMob(w, a, k.x, k.y, k.aura || null);
      w.mobs.push(m);
      if (k.fighting && !w.encounter) w.encounter = { mob: m, first: 'player' };
    }
    for (const a of w.map.areas) if (a.monster && !w.mobs.some(m => m.area === a.index)) spawn(w, a);
    // 선공이 알아볼 만큼 가까이 선 것은 제 구역의 먼 칸으로 — 들어서자마자 덤벼들지 않게 (마주한 것은 그대로)
    const p = w.player;
    for (const m of w.mobs) {
      if (outside(m, p.x, p.y) > RULES.AGGRO_SIGHT + 1 || (w.encounter && w.encounter.mob === m)) continue;
      const c = freeSpot(w, w.map.areas[m.area], m);
      if (c) { m.x = c.x; m.y = c.y; }
    }
  }

  function newMob(w, a, x, y, aura) {
    const n = w.hooks.size(a.monster) || 1;
    return { id: w.nextMob++, monster: a.monster, area: a.index, x, y, w: n, h: n, temper: w.hooks.temper(a.monster), aura,
             mode: 'wander', wait: w.rng() * RULES.WANDER_EVERY, frozen: 0, angry: 0 };
  }

  function spawn(w, a) {
    const p = w.player;
    const n = RULES.SPAWN_MIN + Math.floor(w.rng() * (RULES.SPAWN_MAX - RULES.SPAWN_MIN + 1));
    const s = w.hooks.size(a.monster) || 1, me = body(p.x, p.y, 1), free = [];
    eachHome(w, a, s, (x, y) => {
      if (freeForMob(w, x, y, s) && apart(body(x, y, s), me) > RULES.SPAWN_CLEAR) free.push(body(x, y, s));
    });
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(w.rng() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
    const placed = [];
    for (const c of free) {
      if (placed.length >= n) break;
      if (placed.some(q => apart(q, c) < RULES.SPAWN_GAP)) continue;
      placed.push(c);
    }
    for (const c of placed) w.mobs.push(newMob(w, a, c.x, c.y, w.hooks.rollAura(a.monster) || null));
  }

  // 구역 안의 빈 칸 하나 (self 는 옮기려는 그 몬스터) — 다른 몬스터와 SPAWN_GAP 떨어지고, 되도록 내 시야 밖.
  // 시야 밖이 없으면 나에게서 가장 먼 칸 (내 코앞이면 null)
  function freeSpot(w, a, self) {
    const p = w.player, me = body(p.x, p.y, 1), outOfSight = [], inSight = [];
    const s = w.hooks.size(a.monster) || 1;
    eachHome(w, a, s, (x, y) => {
      const b = body(x, y, s);
      if (!freeForMob(w, x, y, s, self) || w.mobs.some(m => m !== self && apart(body(m.x, m.y, sizeOf(m)), b) < RULES.SPAWN_GAP)) return;
      (apart(b, me) > RULES.SIGHT ? outOfSight : inSight).push({ x, y });
    });
    if (outOfSight.length) return outOfSight[Math.floor(w.rng() * outOfSight.length)];
    let best = null, bestD = RULES.SPAWN_CLEAR;
    for (const c of inSight) { const d = outside(body(c.x, c.y, s), p.x, p.y) + w.rng() * 0.5; if (d > bestD) { best = c; bestD = d; } }
    return best;
  }

  // ---------- 한 틱 ----------
  // dt 초만큼 시간을 흘립니다. 일어난 일을 돌려줍니다:
  //   { type: 'contact', mob | post, first: 'player' | 'foe' }  닿았다 — 싸움 화면 (resolve 로 끝낼 때까지 세계는 멈춤)
  //   { type: 'port', port }    열린 문에 들어섰다
  //   { type: 'closed', port }  닫힌 문에 부딪혔다
  //   { type: 'area', area }    다른 구역에 들어섰다 (밀려나 들어선 것도)
  //   { type: 'chest', chest }  닫힌 보물상자에 닿았다 — 그 자리에 선 채로 (연 뒤에는 그냥 막힌 칸)
  function tick(w, dt) {
    const ev = [];
    if (w.encounter) return ev;
    w.time += dt;
    const p = w.player;
    p.wait -= dt;
    if (p.dir && p.wait <= 0) {
      stepPlayer(w, p.dir, ev);
      p.wait = Math.max(0, p.wait + 1 / RULES.PLAYER_SPEED);
    } else if (!p.dir && p.wait < 0) p.wait = 0;

    for (const m of w.mobs) {
      if (w.encounter) break;
      if (m.frozen > 0) { m.frozen -= dt; continue; }
      if (m.angry > 0) m.angry -= dt;
      think(w, m);
      m.wait -= dt;
      if (m.wait <= 0) act(w, m, ev);
    }
    const a = areaAt(w, p.x, p.y);
    if (a && a.index !== w.lastArea) { w.lastArea = a.index; ev.push({ type: 'area', area: a }); }
    return ev;
  }

  function meet(w, ev, enc) {
    w.encounter = enc;
    w.player.dir = null;
    w.player.needRelease = true;
    ev.push({ type: 'contact', ...enc });
  }

  function stepPlayer(w, dir, ev) {
    const p = w.player, [dx, dy] = DIRS[dir];
    const nx = p.x + dx, ny = p.y + dy;
    const port = portAt(w, nx, ny);
    if (port && !w.hooks.portOpen(port)) { ev.push({ type: 'closed', port }); return; }
    if (wall(w, nx, ny)) return;
    const mob = mobAt(w, nx, ny);
    if (mob) return meet(w, ev, { mob, first: 'player' });
    const post = postAt(w, nx, ny);
    if (post) return meet(w, ev, { post, first: 'player' });
    const chest = chestAt(w, nx, ny);
    if (chest) {
      if (!w.hooks.chestOpen(chest.chest)) { p.dir = null; p.needRelease = true; ev.push({ type: 'chest', chest }); }
      return;
    }
    p.fromX = p.x; p.fromY = p.y;
    p.x = nx; p.y = ny;
    if (port && port.to) ev.push({ type: 'port', port });
  }

  // 지금 무엇을 할지 — 어슬렁(wander) · 쫓기(chase) · 달아나기(flee) · 제 구역으로 돌아가기(return)
  function think(w, m) {
    const p = w.player, n = sizeOf(m);
    const d = outside(body(m.x, m.y, n), p.x, p.y), out = homeDist(homeField(w, w.map.areas[m.area], n), m.x, m.y);   // 내 칸까지 · 제 구역 밖으로 — 몸 기준
    const before = m.mode;
    if (m.mode === 'return' && out > 0) return;
    if (m.temper === 'aggro' || m.angry > 0) {
      if (out > RULES.LEASH) { m.mode = 'return'; m.angry = 0; return; }
      m.mode = d <= (m.angry > 0 ? RULES.SIGHT : RULES.AGGRO_SIGHT) ? 'chase' : out > 0 ? 'return' : 'wander';
    } else if (m.temper === 'shy') {
      m.mode = d <= RULES.SHY_SIGHT && out === 0 ? 'flee' : out > 0 ? 'return' : 'wander';
    } else m.mode = out > 0 ? 'return' : 'wander';
    // 쫓기 · 달아나기로 바뀌면 어슬렁 대기를 기다리지 않고 곧바로 움직입니다
    if (m.mode !== before && (m.mode === 'chase' || m.mode === 'flee')) m.wait = Math.min(m.wait, 1 / RULES.CHASE_SPEED);
  }

  function act(w, m, ev) {
    const p = w.player, n = sizeOf(m), a = w.map.areas[m.area], f = homeField(w, a, n);
    if (m.mode === 'chase') {
      const s = toward(w, m, (x, y) => gap(body(x, y, n), p.x, p.y), true);
      if (s && inRect(body(s.x, s.y, n), p.x, p.y)) return meet(w, ev, { mob: m, first: 'foe' });
      if (s) { m.x = s.x; m.y = s.y; }
      m.wait = 1 / RULES.CHASE_SPEED;
    } else if (m.mode === 'flee') {
      const s = away(w, m);
      if (s) { m.x = s.x; m.y = s.y; }
      m.wait = 1 / RULES.FLEE_SPEED;
    } else if (m.mode === 'return') {
      const s = homeward(w, m, a, f);
      if (s) { m.x = s.x; m.y = s.y; }
      m.wait = 1 / RULES.CHASE_SPEED;
    } else {
      const opts = STEPS.map(([dx, dy]) => ({ x: m.x + dx, y: m.y + dy }))
        .filter(c => homeDist(f, c.x, c.y) === 0 && freeForMob(w, c.x, c.y, n, m));
      if (opts.length && w.rng() < 0.75) { const c = opts[Math.floor(w.rng() * opts.length)]; m.x = c.x; m.y = c.y; }
      m.wait = RULES.WANDER_EVERY * (0.6 + w.rng() * 0.8);
    }
  }

  // 목표에 걸어서 한 칸 더 가까워지는 칸. gapAt(x, y) — 몬스터가 x · y 에 서면 목표까지 가로 · 세로로 얼마나 남나.
  // toPlayer 면 몸이 내 칸에 닿는 걸음도 돌려줍니다(닿음). 가까워질 수 없으면 null — 벽 앞에서 멈춥니다.
  function toward(w, m, gapAt, toPlayer) {
    const n = sizeOf(m), g0 = gapAt(m.x, m.y), d0 = g0.dx + g0.dy;
    let best = null, bestScore = -1;
    for (const [dx, dy] of STEPS) {
      const x = m.x + dx, y = m.y + dy, g = gapAt(x, y);
      if (g.dx + g.dy >= d0) continue;
      const touch = toPlayer && inRect(body(x, y, n), w.player.x, w.player.y);
      if (!touch && !freeForMob(w, x, y, n, m)) continue;
      const score = (dx ? g0.dx : g0.dy) + w.rng() * 0.5;   // 많이 벌어진 쪽부터 좁힙니다
      if (score > bestScore) { best = { x, y }; bestScore = score; }
    }
    return best;
  }

  // 제 구역 쪽으로 한 걸음 — 잰 걸음 수가 줄어드는 칸으로. 잰 곳 밖까지 벗어났으면 구역을 감싸는 네모 쪽으로
  function homeward(w, m, a, f) {
    const here = homeDist(f, m.x, m.y);
    if (here === Infinity) return toward(w, m, (x, y) => gap(a, x, y), false);
    let best = null, bestScore = here;
    for (const [dx, dy] of STEPS) {
      const x = m.x + dx, y = m.y + dy, score = homeDist(f, x, y) + w.rng() * 0.5;
      if (score < bestScore && freeForMob(w, x, y, sizeOf(m), m)) { best = { x, y }; bestScore = score; }
    }
    return best;
  }

  // 제 구역 안에서 나와 더 멀어지는 칸. 더 멀어질 데가 없으면(구석) null — 몰면 잡힙니다.
  function away(w, m) {
    const p = w.player, n = sizeOf(m), f = homeField(w, w.map.areas[m.area], n);
    let best = null, bestD = outside(body(m.x, m.y, n), p.x, p.y);
    for (const [dx, dy] of STEPS) {
      const x = m.x + dx, y = m.y + dy;
      if (homeDist(f, x, y) !== 0 || !freeForMob(w, x, y, n, m)) continue;
      const d = outside(body(x, y, n), p.x, p.y) + w.rng() * 0.1;
      if (d > bestD) { best = { x, y }; bestD = d; }
    }
    return best;
  }

  // ---------- 싸움이 끝나면 ----------
  // outcome: 'win' (그 몬스터는 사라지고, 그 구역에 하나가 새로 섬 — 기운도 새로 굴림) · 'retreat' (물러섬) · 'lose' (짐)
  // 물러서거나 지면 나는 한 칸 뒤로 밀려나고, 그 몬스터는 잠깐 멈춥니다. 후공은 물러선 나에게 화가 납니다.
  function resolve(w, outcome) {
    const enc = w.encounter;
    if (!enc) return;
    w.encounter = null;
    if (outcome === 'win') {
      if (enc.mob) {
        w.mobs = w.mobs.filter(m => m !== enc.mob);
        const a = w.map.areas[enc.mob.area], c = a && freeSpot(w, a, null);
        if (c) w.mobs.push(newMob(w, a, c.x, c.y, w.hooks.rollAura(a.monster) || null));
      }
      return;
    }
    pushBack(w, enc.mob || enc.post);
    if (enc.mob) {
      enc.mob.frozen = RULES.FREEZE_SECS;
      enc.mob.mode = 'wander';
      if (outcome === 'retreat' && enc.mob.temper === 'passive') enc.mob.angry = RULES.ENRAGE_SECS;
    }
  }

  function pushBack(w, foe) {
    const p = w.player;
    const fx = foe.x + ((foe.w || 1) - 1) / 2, fy = foe.y + ((foe.h || 1) - 1) / 2;   // 큰 자리는 한가운데에서 멀어지게
    let best = null, bestScore = -1;
    for (const [dx, dy] of STEPS) {
      const x = p.x + dx, y = p.y + dy;
      if (wall(w, x, y) || mobAt(w, x, y) || postAt(w, x, y) || chestAt(w, x, y) || (portAt(w, x, y) || {}).to) continue;
      const score = manh(x, y, fx, fy) + (x === p.fromX && y === p.fromY ? 0.5 : 0);   // 걸어온 칸이면 그쪽으로
      if (score > bestScore) { best = { x, y }; bestScore = score; }
    }
    if (!best) return;
    p.fromX = p.x; p.fromY = p.y;
    p.x = best.x; p.y = best.y;
  }

  const api = { RULES, TEMPER_BY_ARCH, DIRS, temperOf, mulberry, parseTiled, createWorld, setInput, tick, resolve, areaAt, mobAt, postAt, portAt, chestAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MapRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
