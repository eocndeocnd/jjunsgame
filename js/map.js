// ============================================================
//  map.js — 월드맵 걷기의 규칙 (docs/MAP-REFERENCE-PLAN.md)
//
//  이동 · 벽 · 스폰과 다시 스폰 · 선공/후공/중립의 움직임 · 닿음 판정만 다룹니다.
//  화면도 게임 상태(State)도 모릅니다 — 몬스터 성격 · 기운 · 정예가 살아 있는지 같은 것은 hooks 로 받습니다.
//  그래서 node --test 로 시험할 수 있습니다 (tests/map.test.js).
//
//  지도는 Tiled(무료 지도 편집기)가 바로 여는 JSON(.tmj)입니다 — parseTiled 가 읽습니다.
//    ground   타일 층 — 타일셋에서 solid 속성이 붙은 타일은 지나갈 수 없습니다 (벽 · 물)
//    areas    사각형 — 구역. 속성 rank · monster(적 id) · zone(지역 id). monster 가 없으면 이름뿐인 곳(첫 공간)
//    posts    점 — 정예 · 보스 · 히든 자리. 속성 enemy · blocks(길을 막는가)
//    ports    사각형 — 드나드는 문. 속성 to(행선지) · opensAfter(꺾어야 열리는 보스 id)
//    secrets  사각형 — 숨은 입구. 벽으로 그려져 있어도 지나갈 수 있습니다
//    npc      점 — start(시작점) · merchant(상인 자리) · avatarDoor(화신 문)
// ============================================================
(function (root) {
  'use strict';

  const RULES = {
    SIGHT: 8,            // 보이는 범위 — 나를 중심으로 가로 · 세로 이만큼 (폰 화면쯤)
    RESPAWN_DIST: 10,    // 구역이 이보다 멀어지면 남은 것을 지우고, 다시 보일 때 새로 세웁니다
    SPAWN_MIN: 3,
    SPAWN_MAX: 4,
    SPAWN_GAP: 2,        // 같이 선 몬스터끼리는 이만큼 떨어지게 (바로 옆 칸 금지)
    SPAWN_CLEAR: 3,      // 내 코앞에는 세우지 않습니다
    PLAYER_SPEED: 5,     // 초당 칸
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
    const m = { id, w, h, tile: new Int16Array(w * h), solid: new Uint8Array(w * h), secret: new Uint8Array(w * h) };
    for (let i = 0; i < w * h; i++) {
      const gid = ground[i] & 0x1fffffff;                 // 위쪽 세 비트는 Tiled 의 뒤집기 표시
      m.tile[i] = gid ? gid - ts.firstgid : -1;
      m.solid[i] = !gid || solidTiles.has(m.tile[i]) ? 1 : 0;
    }
    const rect = o => ({ x: Math.floor(o.x / tw), y: Math.floor(o.y / th),
                         w: Math.max(1, Math.round((o.width || 0) / tw)), h: Math.max(1, Math.round((o.height || 0) / th)) });
    const cell = o => ({ x: Math.floor(o.x / tw), y: Math.floor(o.y / th) });

    for (const o of objects('secrets')) eachCell(m, rect(o), (x, y) => { m.secret[y * w + x] = 1; m.solid[y * w + x] = 0; });
    m.areas = objects('areas').map((o, i) => ({ index: i, name: o.name, ...rect(o), ...props(o) }));
    m.areaAt = new Int16Array(w * h).fill(-1);
    for (const a of m.areas) eachCell(m, a, (x, y) => { m.areaAt[y * w + x] = a.index; });
    m.posts = objects('posts').map(o => ({ name: o.name, ...cell(o), ...props(o) }));
    m.ports = objects('ports').map(o => ({ name: o.name, ...rect(o), ...props(o) }));
    m.npcs = objects('npc').map(o => ({ name: o.name, ...cell(o), ...props(o) }));
    const start = m.npcs.find(n => n.name === 'start');
    m.start = start ? { x: start.x, y: start.y } : { x: 1, y: 1 };
    return m;
  }

  // ---------- 세계 (한 지도 위의 지금 상태) ----------
  // hooks
  //   temper(monsterId)  → 'aggro' | 'passive' | 'shy'
  //   rollAura(monsterId) → 기운(없으면 null) — 스폰할 때마다 굴립니다
  //   postAlive(enemyId) → 그 자리에 아직 서 있는가 (이 여정에서 꺾었거나 아직 안 나타난 히든이면 false)
  //   portOpen(port)     → 그 문이 열렸는가
  function mulberry(seed) {
    return () => {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function createWorld(map, hooks, seed) {
    const w = {
      map,
      rng: seed == null ? Math.random : mulberry(seed),
      hooks: { temper: () => 'passive', rollAura: () => null, postAlive: () => true, portOpen: () => true, ...hooks },
      time: 0,
      player: { x: map.start.x, y: map.start.y, fromX: map.start.x, fromY: map.start.y, dir: null, wait: 0, needRelease: false },
      mobs: [],
      nextMob: 1,
      live: map.areas.map(() => false),   // 구역마다 — 지금 몬스터가 세워져 있는가
      encounter: null                     // 닿아서 싸움 화면이 떠 있는 동안 { mob | post, first }
    };
    updateAreas(w, []);
    return w;
  }

  // 누르고 있는 방향 (null = 뗐다). 닿은 뒤에는 한 번 떼야 다시 걷습니다 — 누른 채로 또 부딪히지 않게.
  function setInput(w, dir) {
    const p = w.player;
    if (p.needRelease) { if (!dir) p.needRelease = false; return; }
    p.dir = DIRS[dir] ? dir : null;
  }

  const cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
  const manh = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
  function gap(r, x, y) {   // 사각형 바깥으로 얼마나 떨어졌나 (안이면 0, 0)
    return { dx: Math.max(r.x - x, 0, x - (r.x + r.w - 1)), dy: Math.max(r.y - y, 0, y - (r.y + r.h - 1)) };
  }
  const outside = (r, x, y) => { const g = gap(r, x, y); return g.dx + g.dy; };

  function areaAt(w, x, y) {
    const i = w.map.areaAt[y * w.map.w + x];
    return i >= 0 ? w.map.areas[i] : null;
  }
  function mobAt(w, x, y) { return w.mobs.find(m => m.x === x && m.y === y) || null; }
  function postAt(w, x, y) { return w.map.posts.find(p => p.x === x && p.y === y && w.hooks.postAlive(p.enemy)) || null; }
  function portAt(w, x, y) { return w.map.ports.find(p => inRect(p, x, y)) || null; }
  function wall(w, x, y) {
    if (x < 0 || y < 0 || x >= w.map.w || y >= w.map.h || w.map.solid[y * w.map.w + x]) return true;
    const port = portAt(w, x, y);
    return !!port && !w.hooks.portOpen(port);             // 닫힌 문은 벽과 같습니다
  }
  // 몬스터가 들어설 수 있는 칸 — 벽 · 다른 몬스터 · 정예 자리 · 문 · 나는 안 됩니다
  function freeForMob(w, x, y) {
    return !wall(w, x, y) && !mobAt(w, x, y) && !postAt(w, x, y) && !portAt(w, x, y)
      && !(w.player.x === x && w.player.y === y);
  }

  // ---------- 스폰 ----------
  function updateAreas(w, ev) {
    const p = w.player;
    for (const a of w.map.areas) {
      if (!a.monster) continue;                            // 몬스터 없는 이름뿐인 곳 (첫 공간 같은)
      const g = gap(a, p.x, p.y), d = Math.max(g.dx, g.dy);
      if (!w.live[a.index] && d <= RULES.SIGHT) {
        spawn(w, a);
        w.live[a.index] = true;
        ev.push({ type: 'spawn', area: a });
      } else if (w.live[a.index] && d > RULES.RESPAWN_DIST) {
        w.mobs = w.mobs.filter(m => m.area !== a.index);   // 잡다 남은 것도 지웁니다 — 다시 보일 때 새로 섭니다
        w.live[a.index] = false;
        ev.push({ type: 'despawn', area: a });
      }
    }
  }

  function spawn(w, a) {
    const p = w.player;
    const n = RULES.SPAWN_MIN + Math.floor(w.rng() * (RULES.SPAWN_MAX - RULES.SPAWN_MIN + 1));
    const free = [];
    eachCell(w.map, a, (x, y) => { if (freeForMob(w, x, y) && cheb(x, y, p.x, p.y) > RULES.SPAWN_CLEAR) free.push({ x, y }); });
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(w.rng() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
    const placed = [];
    for (const c of free) {
      if (placed.length >= n) break;
      if (placed.some(q => cheb(q.x, q.y, c.x, c.y) < RULES.SPAWN_GAP)) continue;
      placed.push(c);
    }
    for (const c of placed) {
      w.mobs.push({
        id: w.nextMob++, monster: a.monster, area: a.index, x: c.x, y: c.y,
        temper: w.hooks.temper(a.monster), aura: w.hooks.rollAura(a.monster) || null,
        mode: 'wander', wait: w.rng() * RULES.WANDER_EVERY, frozen: 0, angry: 0
      });
    }
  }

  // ---------- 한 틱 ----------
  // dt 초만큼 시간을 흘립니다. 일어난 일을 돌려줍니다:
  //   { type: 'contact', mob | post, first: 'player' | 'foe' }  닿았다 — 싸움 화면 (resolve 로 끝낼 때까지 세계는 멈춤)
  //   { type: 'port', port }    열린 문에 들어섰다
  //   { type: 'closed', port }  닫힌 문에 부딪혔다
  //   { type: 'spawn' | 'despawn', area }
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
    p.fromX = p.x; p.fromY = p.y;
    p.x = nx; p.y = ny;
    updateAreas(w, ev);
    if (port && port.to) ev.push({ type: 'port', port });
  }

  // 지금 무엇을 할지 — 어슬렁(wander) · 쫓기(chase) · 달아나기(flee) · 제 구역으로 돌아가기(return)
  function think(w, m) {
    const p = w.player, a = w.map.areas[m.area];
    const d = manh(m.x, m.y, p.x, p.y), out = outside(a, m.x, m.y);
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
    const p = w.player, a = w.map.areas[m.area];
    if (m.mode === 'chase') {
      const s = toward(w, m, p.x, p.y);
      if (s && s.x === p.x && s.y === p.y) return meet(w, ev, { mob: m, first: 'foe' });
      if (s) { m.x = s.x; m.y = s.y; }
      m.wait = 1 / RULES.CHASE_SPEED;
    } else if (m.mode === 'flee') {
      const s = away(w, m);
      if (s) { m.x = s.x; m.y = s.y; }
      m.wait = 1 / RULES.FLEE_SPEED;
    } else if (m.mode === 'return') {
      const tx = Math.min(Math.max(m.x, a.x), a.x + a.w - 1), ty = Math.min(Math.max(m.y, a.y), a.y + a.h - 1);
      const s = toward(w, m, tx, ty);
      if (s) { m.x = s.x; m.y = s.y; }
      m.wait = 1 / RULES.CHASE_SPEED;
    } else {
      const opts = STEPS.map(([dx, dy]) => ({ x: m.x + dx, y: m.y + dy }))
        .filter(c => inRect(a, c.x, c.y) && freeForMob(w, c.x, c.y));
      if (opts.length && w.rng() < 0.75) { const c = opts[Math.floor(w.rng() * opts.length)]; m.x = c.x; m.y = c.y; }
      m.wait = RULES.WANDER_EVERY * (0.6 + w.rng() * 0.8);
    }
  }

  // 목표에 걸어서 한 칸 더 가까워지는 칸 (내 칸이면 닿음). 가까워질 수 없으면 null — 벽 앞에서 멈춥니다.
  function toward(w, m, tx, ty) {
    const d0 = manh(m.x, m.y, tx, ty);
    let best = null, bestScore = -1;
    for (const [dx, dy] of STEPS) {
      const x = m.x + dx, y = m.y + dy;
      if (manh(x, y, tx, ty) >= d0) continue;
      const isPlayer = x === w.player.x && y === w.player.y;
      if (!isPlayer && !freeForMob(w, x, y)) continue;
      const score = (dx ? Math.abs(tx - m.x) : Math.abs(ty - m.y)) + w.rng() * 0.5;   // 많이 벌어진 쪽부터 좁힙니다
      if (score > bestScore) { best = { x, y }; bestScore = score; }
    }
    return best;
  }

  // 제 구역 안에서 나와 더 멀어지는 칸. 더 멀어질 데가 없으면(구석) null — 몰면 잡힙니다.
  function away(w, m) {
    const a = w.map.areas[m.area], p = w.player;
    let best = null, bestD = manh(m.x, m.y, p.x, p.y);
    for (const [dx, dy] of STEPS) {
      const x = m.x + dx, y = m.y + dy;
      if (!inRect(a, x, y) || !freeForMob(w, x, y)) continue;
      const d = manh(x, y, p.x, p.y) + w.rng() * 0.1;
      if (d > bestD) { best = { x, y }; bestD = d; }
    }
    return best;
  }

  // ---------- 싸움이 끝나면 ----------
  // outcome: 'win' (그 몬스터는 사라짐) · 'retreat' (물러섬) · 'lose' (짐)
  // 물러서거나 지면 나는 한 칸 뒤로 밀려나고, 그 몬스터는 잠깐 멈춥니다. 후공은 물러선 나에게 화가 납니다.
  function resolve(w, outcome) {
    const enc = w.encounter;
    if (!enc) return;
    w.encounter = null;
    if (outcome === 'win') {
      if (enc.mob) w.mobs = w.mobs.filter(m => m !== enc.mob);
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
    let best = null, bestScore = -1;
    for (const [dx, dy] of STEPS) {
      const x = p.x + dx, y = p.y + dy;
      if (wall(w, x, y) || mobAt(w, x, y) || postAt(w, x, y) || (portAt(w, x, y) || {}).to) continue;
      const score = manh(x, y, foe.x, foe.y) + (x === p.fromX && y === p.fromY ? 0.5 : 0);   // 걸어온 칸이면 그쪽으로
      if (score > bestScore) { best = { x, y }; bestScore = score; }
    }
    if (!best) return;
    p.fromX = p.x; p.fromY = p.y;
    p.x = best.x; p.y = best.y;
    updateAreas(w, []);
  }

  const api = { RULES, TEMPER_BY_ARCH, DIRS, temperOf, parseTiled, createWorld, setInput, tick, resolve, areaAt, mobAt, postAt, portAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MapRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
