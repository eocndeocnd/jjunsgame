// ============================================================
//  UI 시안 — 함께 쓰는 엔진 (design/ui/*.html)
//
//  게임과 같은 규칙(data.js · game.js · map.js)과 그리기(mapview.js)로, 지도를 화면 가득 채워 걸어 봅니다.
//  화면 틀만 시안마다 다르고, 닿으면 싸움은 게임 규칙 그대로(meetOnMap · engage · retreat) — 전투 연출만 없습니다.
//  아무것도 저장하지 않습니다 (같은 주소의 게임 저장본은 건드리지 않음).
//
//  시안 쪽에서:
//    Proto.start({ canvas, stick, paused(), onEncounter(enc), onResult(r), onZone(zone), onChange() })
//    Proto.fight() · Proto.flee() · Proto.closeResult() · Proto.restart()
//    Proto.zone() · Proto.status() · Proto.encounterHTML(enc) · Proto.resultHTML(r) · statsHTML · gearHTML · logHTML · setsHTML
//    Proto.face(canvas) · Proto.minimap(canvas, 칸) · Proto.floatingStick(면, 조이스틱)
// ============================================================
const Proto = (function () {
  'use strict';
  blockSaving(); currentSlot = 0;
  State.meta = freshMeta();
  State.meta.tutorialDone = true;
  startRun();

  const map = MapRules.parseTiled(MAP_FILES.overworld, 'overworld');
  // 승률은 숫자 대신 느낌으로 (ui.js 의 WIN_FEELS 와 같은 구간)
  const FEELS = [[0, '불가능할 것 같다'], [0.2, '이기기 힘들 것 같다'], [0.4, '쉽지 않을 것 같다'],
                 [0.6, '해볼 만하다'], [0.8, '이길 수 있을 것 같다'], [0.9, '잡기 쉬울 것 같다']];
  const KIND = { normal: '일반', elite: '정예', boss: '보스', hidden: '히든' };
  let view = null, ui = {};

  function start(o) {
    ui = o;
    view = MapView.create({
      canvas: o.canvas, stick: o.stick || null, hooks: MapView.gameHooks(), tag: MapView.gameTag,
      paused: () => !State.run || State.run.over || !!State.run.encounter || !!State.run.lastResult || !!(o.paused && o.paused()),
      onEvents
    });
    view.start(map, map.start);
    changed();
    return view;
  }
  const changed = () => { if (ui.onChange) ui.onChange(); };

  function onEvents(evs) {
    const run = State.run;
    for (const e of evs) {
      if (e.type === 'area') {
        const zi = e.area.zone ? ZONES.findIndex(z => z.id === e.area.zone) : 0;
        if (zi >= 0 && zi !== run.zoneIndex) { walkIntoZone(zi); if (ui.onZone) ui.onZone(zone()); }
      } else if (e.type === 'contact') {
        const id = e.mob ? e.mob.monster : e.post.enemy;
        if (meetOnMap(id, e.mob ? e.mob.aura : null, e.first)) { if (ui.onEncounter) ui.onEncounter(encounter(e.first)); }
        else view.resolve('retreat');
      }
    }
    changed();
  }

  function encounter(first) {
    const run = State.run, foe = getEnemy(run.encounter);
    const chance = winChance(heroStats(), foe, 120);
    const f = FEELS.reduce((k, x, i) => (chance >= x[0] ? i : k), 0);
    return { foe, aura: run.aura, first, chance, feel: FEELS[f][1], feelIndex: f };
  }

  function fight() {
    const r = engage();
    if (!r) return null;
    view.resolve(r.win ? 'win' : 'lose');
    if (ui.onResult) ui.onResult(r);
    changed();
    return r;
  }
  function flee() { retreat(); view.resolve('retreat'); changed(); }
  function closeResult() { dismissResult(); changed(); }
  function restart() { startRun(); view.start(map, map.start); changed(); }

  // ---------- 보여 줄 것 ----------
  function zone() {
    const z = ZONES[State.run.zoneIndex], r = RANKS.find(x => x.n === z.rank);
    return { name: z.name, rank: r.n, rankName: r.name };
  }
  function status() {
    const run = State.run;
    return { level: fmtLevel(run.level), xp: Math.min(1, run.xp / xpToNext(run.level)), energy: run.energy, max: startEnergy(),
             gold: Math.round(num(State.meta.gold)), owned: Object.keys(State.meta.owned).length, over: run.over };
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function encounterHTML(e) {
    const f = e.foe;
    const aura = e.aura ? `<span class="aura-tag" style="color:${e.aura.color}">✦ ${esc(e.aura.name)} — ${esc(e.aura.desc)}</span>` : '';
    return `<div class="foe"><div class="foe-ic">${f.icon}</div><div>
      ${aura}<div class="foe-name">${esc(f.name)}</div>
      <div class="foe-sub">Lv.${fmtLevel(f.level)} · ${KIND[f.kind] || ''}${e.first === 'foe' ? ' · 덤벼들었다' : ''}</div>
      <div class="feel f${e.feelIndex}">${e.feel}</div></div></div>`;
  }
  function resultHTML(r) {
    if (!r.win) return `<div class="res-head lose">${r.enemy.icon} ${esc(r.enemy.name)}에게 졌다</div>
      <div class="res-line">에너지 -${r.penalty}${State.run.over ? ' · 여정이 끝났다' : ''}</div>`;
    const drops = (r.drops || []).map(d => `<li>${esc(SLOT_NAMES[d.item.slot] || '')} · ${esc(d.item.name)}${d.isNew ? '<span class="new">NEW</span>' : d.stones ? ` (강화석 +${d.stones})` : ''}</li>`).join('');
    return `<div class="res-head win">${r.enemy.icon} ${esc(r.enemy.name)}${josa(r.enemy.name, '을', '를')} 꺾었다</div>
      <div class="res-line">경험치 +${r.xp}${r.levelsGained ? ` · 레벨 업! Lv.${fmtLevel(State.run.level)}` : ''} · 골드 +${r.gold || 0}</div>
      ${drops ? `<ul class="drops">${drops}</ul>` : ''}`;
  }
  function statsHTML() {
    const h = heroStats();
    return `<div class="rows">${STAT_INFO.map(s => `<div><span class="k">${s.name}</span><span class="v">${Math.round(h[s.id])}</span></div>`).join('')}
      <div><span class="k">남은 스탯 점수</span><span class="v">${State.run.unspent || 0}</span></div></div>`;
  }
  function gearHTML() {
    return `<div class="gear-grid">${SLOTS.filter(s => s.id !== 'special' && !/^special/.test(s.id)).slice(0, 12).map(s => {
      const it = getItem(State.meta.equipped[s.id]);
      return `<div><div class="k">${s.name}</div><div class="v">${it ? esc(it.name) : '—'}</div></div>`;
    }).join('')}</div>`;
  }
  function logHTML(n = 12) {
    const lines = State.log.slice(-n).reverse();
    return lines.length ? `<div class="log">${lines.map(l => `<div>${esc(l.text)}</div>`).join('')}</div>` : '<div class="log"><div>아직 아무 일도 없었다.</div></div>';
  }
  function setsHTML() {
    return `<div class="sets">${Array.from({ length: SET_COUNT }, (_, n) => `<button class="btn ${isSetActive(n) ? 'on' : ''}" data-set="${n}">세트 ${n + 1}</button>`).join('')}</div>`;
  }
  // 세트 단추를 누르면 갈아입기 (시안 쪽에서 그린 뒤 부름)
  function wireSets(root) {
    for (const b of root.querySelectorAll('[data-set]')) b.addEventListener('click', () => { switchSet(Number(b.dataset.set)); changed(); });
  }

  // ---------- 주인공 얼굴 — 걷기 그림의 앞모습 서기에서 머리만 ----------
  const heroImg = new Image();
  heroImg.src = 'assets/hero/walk.png';
  function face(canvas) {
    const g = canvas.getContext('2d');
    const draw = () => { g.imageSmoothingEnabled = false; g.clearRect(0, 0, canvas.width, canvas.height); g.drawImage(heroImg, 4, 3, 24, 22, 0, 0, canvas.width, canvas.height); };
    if (heroImg.complete && heroImg.naturalWidth) draw(); else heroImg.addEventListener('load', draw, { once: true });
  }

  // ---------- 작은 지도 — 나를 가운데 둔 (2R+1)² 칸, 칸 하나 = 1픽셀 (CSS 로 키움) ----------
  const TILE_RGB = [[234, 214, 166], [63, 36, 15], [31, 90, 150], [74, 94, 42], [122, 112, 98], [242, 226, 184]];
  function minimap(canvas, R) {
    const w = view && view.world;
    if (!w) return;
    const m = w.map, p = w.player, N = 2 * R + 1;
    if (canvas.width !== N) { canvas.width = N; canvas.height = N; }
    const g = canvas.getContext('2d'), img = g.createImageData(N, N), d = img.data;
    const put = (x, y, c) => { const i = (y * N + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const mx = p.x - R + x, my = p.y - R + y;
      if (mx < 0 || my < 0 || mx >= m.w || my >= m.h) { put(x, y, [28, 16, 7]); continue; }
      put(x, y, TILE_RGB[m.tile[my * m.w + mx]] || [28, 16, 7]);
    }
    const near = (x, y) => Math.abs(x - p.x) <= R && Math.abs(y - p.y) <= R;
    for (const post of m.posts) if (w.hooks.postAlive(post.enemy) && near(post.x, post.y)) {
      const f = getEnemy(post.enemy);
      for (let y = 0; y < post.h; y++) for (let x = 0; x < post.w; x++) if (near(post.x + x, post.y + y)) put(post.x + x - p.x + R, post.y + y - p.y + R, f.kind === 'boss' ? [200, 30, 36] : [63, 109, 42]);
    }
    for (const mob of w.mobs) if (near(mob.x, mob.y)) put(mob.x - p.x + R, mob.y - p.y + R, mob.aura ? hex(mob.aura.color) : [150, 40, 30]);
    g.putImageData(img, 0, 0);
    g.fillStyle = '#fff'; g.fillRect(R - 1, R - 1, 3, 3);
    g.fillStyle = '#1c1007'; g.fillRect(R, R, 1, 1);
  }
  const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

  // ---------- 떠 있는 조이스틱 — 면 어디든 누르면 손가락 밑에 생기고, 떼면 사라짐 ----------
  function floatingStick(surface, stick) {
    const knob = stick.querySelector('.knob');
    let id = null, cx = 0, cy = 0, dir = null;
    const set = d => { if (d === dir || !view || !view.world) return; dir = d; MapRules.setInput(view.world, null); MapRules.setInput(view.world, d); };
    surface.addEventListener('pointerdown', ev => {
      if (id !== null) return;
      id = ev.pointerId; cx = ev.clientX; cy = ev.clientY;
      try { surface.setPointerCapture(id); } catch (e) { /* 가짜 포인터면 그냥 */ }
      stick.style.left = `${cx}px`; stick.style.top = `${cy}px`; stick.classList.add('on');
      knob.style.transform = '';
    });
    surface.addEventListener('pointermove', ev => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - cx, dy = ev.clientY - cy, len = Math.hypot(dx, dy), max = 40, k = len > max ? max / len : 1;
      knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      set(len < 10 ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    const end = ev => { if (ev.pointerId !== id) return; id = null; stick.classList.remove('on'); set(null); };
    surface.addEventListener('pointerup', end);
    surface.addEventListener('pointercancel', end);
  }

  return { start, fight, flee, closeResult, restart, zone, status, encounterHTML, resultHTML, statsHTML, gearHTML, logHTML, setsHTML, wireSets,
           face, minimap, floatingStick, view: () => view };
})();
