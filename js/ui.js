// ============================================================
//  ui.js  —  화면 그리기와 버튼 연결
//  게임 규칙은 여기 없습니다. game.js 의 함수를 부르기만 합니다.
// ============================================================

const $ = id => document.getElementById(id);

// ---------- 전체 다시 그리기 ----------
// 길을 떠나 상대를 마주한 때부터 싸움(다시 보기)이 끝날 때까지 — 차림 · 스탯 분배는 손댈 수 없습니다.
// 눈앞의 상대를 보고 갈아입는 건 마주하기 전까지만, 싸우는 도중에 바꿀 수 있으면 승패가 정해진 뒤에도 뒤집어 버립니다.
function fightLocked() {
  return !!((State.run && State.run.encounter) || battle);
}

// 장비 아이콘 — 그림(assets/items/<id>.png, js/itemart.js 의 목록)이 있으면 그림, 없으면 이모티콘.
// 그림은 글자 크기(1em)에 맞춰 이모티콘이 있던 자리 그대로 들어갑니다 (css 의 .item-img)
function itemArt(item) {
  const src = item && typeof ITEM_ART !== 'undefined' && ITEM_ART[item.id];
  return src ? `<img class="item-img" src="${src}" alt="" draggable="false">` : (item ? item.fromIcon : '');
}

function render() {
  const locked = fightLocked();
  document.body.classList.toggle('fight-locked', locked);
  if (locked) {
    if (isSlotModalOpen()) closeSlotModal();
    if (isSwapModalOpen()) closeSwapModal();
    if (isAvatarModalOpen()) closeAvatarModal();
    enhMode = false;      // 슬롯 강화 중이었다면 칸이 도로 장비 칸으로
    if (document.body.dataset.tab !== 'journey') showTab('journey');   // 메뉴 서랍은 닫고 지도 위의 창만
  }
  withHeldSpoils(renderRecords);
  withHeldSpoils(renderHero);      // 레벨 · 경험치 · 스탯도 전투가 끝난 뒤에
  withHeldSpoils(renderJourney);
  withHeldSpoils(renderGear);
  renderLog();
  renderSettings();
  renderOverlay();
  withHeldSpoils(renderTabBadges);
  atmosphere();        // 배경음이 분위기를 따라가므로 먼저
  syncMusic();
  renderShop();
  renderSwap();
  if (isAdminOpen()) renderAdmin();
  if (window.innerWidth > 860) maybeNamelessTalk();   // 넓은 화면에는 탭이 없습니다
  maybeCityWake();
  maybeGuideNote();
}

// ---------- 벽 너머의 분위기 ----------
// 마왕이 쓰러지면 그 회차는 벽 너머다 — 잿빛 종이, 보랏빛 잉크, 찢어진 틈으로 별이 보이는 지도, 다른 배경음.
// 그 공간은 회차마다 되돌아가므로, 다음 회차는 다시 이쪽에서 시작해 마왕을 다시 꺾어야 다시 너머로 간다.
//
// 바뀌는 순간은 연출 뒤로 미룹니다 — 마왕과 싸우는 동안, 그리고 결과가 뜬 뒤 벽이 무너지는 연출의
// 가장 어두운 때까지는 아직 이쪽입니다 (wallPending).
let wallPending = false;
// 지금 화면이 벽 너머의 모습이어야 하는가 — 분위기와 사람 그림(해진 옷)이 같이 따릅니다
function beyondLook() {
  if (!State.run || !beyondWall() || wallPending) return false;
  return !(battle && battle.r.enemy.id === WALL_BOSS);
}
function atmosphere() {
  const titleUp = !$('title').classList.contains('hidden');
  let on = !titleUp && beyondLook();
  document.body.classList.toggle('beyond', on);
  if (typeof Backdrop !== 'undefined') Backdrop.mode(on ? 'beyond' : 'map');
}

// 벽이 무너지는 순간 — 하얗게 번쩍 · 금이 간다 · 어두워진다 · 눈 하나가 깜빡 · 걷히면 다른 세상.
// 글로 설명하지 않습니다. 결과 화면의 「나가는 길도 열렸다.」 한 줄과 이 연출이 전부입니다.
const WALL_FX_DELAY = 600;   // 결과가 뜨고 승리 소리가 한 번 울린 뒤
const WALL_FX_DARK = 900;    // 연출 시작부터 가장 어두운 때까지 — 여기서 분위기가 바뀝니다
const WALL_FX_LEN = 2400;
const wallMoments = new WeakSet();
function wallMoment(r) {
  if (!r.win || r.enemy.id !== WALL_BOSS || wallMoments.has(r)) return;
  wallMoments.add(r);
  wallPending = true;
  const turn = () => { wallPending = false; atmosphere(); syncMusic(); };
  if (calmMotion()) { setTimeout(turn, WALL_FX_DELAY); return; }
  setTimeout(() => {
    const fx = document.createElement('div');
    fx.className = 'wall-break';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = `<div class="wb-flash"></div>${wallCracks()}<div class="wb-dark"></div><div class="wb-eye">${guideEye()}</div>`;
    document.body.appendChild(fx);
    const stage = document.querySelector('.stage');
    if (stage) stage.animate(
      [{ transform: 'none' }, { transform: 'translate(-6px, 3px)' }, { transform: 'translate(5px, -4px)' },
       { transform: 'translate(-3px, 2px)' }, { transform: 'none' }],
      { duration: 420, easing: 'steps(5)' });
    setTimeout(turn, WALL_FX_DARK);
    setTimeout(() => fx.remove(), WALL_FX_LEN);
  }, WALL_FX_DELAY);
}

// 화면 한가운데서 뻗어 나가는 금 — 매번 조금씩 다르게. 각진 도트 선으로.
function wallCracks() {
  const W = 400, H = 700, cx = W / 2 + (Math.random() - 0.5) * 60, cy = H * 0.42 + (Math.random() - 0.5) * 60;
  let paths = '';
  const n = 9;
  for (let k = 0; k < n; k++) {
    let a = (k / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    let x = cx, y = cy, d = `M${x.toFixed(0)} ${y.toFixed(0)}`;
    const steps = 5 + Math.floor(Math.random() * 4);
    for (let s = 0; s < steps; s++) {
      a += (Math.random() - 0.5) * 0.9;
      const len = 30 + Math.random() * 45;
      x += Math.cos(a) * len; y += Math.sin(a) * len;
      d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    paths += `<path d="${d}" pathLength="1"/>`;
  }
  return `<svg class="wb-cracks" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${paths}</svg>`;
}

// ---------- 레벨이 올라가는 모습 ----------
// 경험치는 「맞선다」를 누르는 순간 들어오지만, 전투를 보여주는 동안은 싸우기 전 값으로 그립니다 (withHeldSpoils).
// 결과가 뜨면 싸우기 전 레벨에서 숫자가 굴러 올라가고, 경험치 막대가 차오르고(오른 만큼 몇 바퀴),
// 다 올라가면 「레벨 업」이 한 번 튑니다. 여정 창(폰에서도 보이는 곳)과 「나」 창이 같이 움직입니다.
const LEVEL_ANIM = 1000;     // 레벨이 올랐을 때 숫자가 다 올라가기까지
const XP_ANIM = 500;         // 레벨은 그대로이고 막대만 찰 때
const levelMoments = new WeakSet();
// 마왕을 꺾은 결과면 벽이 무너지는 연출이 걷힌 뒤에 시작합니다
function levelWait(r) {
  return r.enemy.id === WALL_BOSS && r.openedPath && !wallMoments.has(r) && !calmMotion()
    ? WALL_FX_DELAY + WALL_FX_LEN - 300 : 150;
}
// 막대는 굴러가는 동안 폭(width) 대신 transform 으로 늘립니다 — 폭을 바꾸면 매 프레임 화면 배치를 다시 잡아서 버벅입니다
let lastLvText = '';
function paintLevel(lv, pct, done) {
  const txt = fmtLevel(lv);
  if (txt !== lastLvText) {        // 숫자는 바뀔 때만 씁니다
    lastLvText = txt;
    const a = $('heroLevel'); if (a) a.textContent = 'Lv.' + txt;
    const b = $('jeLv'); if (b) b.textContent = txt;
  }
  const c = $('resLv'); if (c) c.textContent = done ? c.dataset.final : 'Lv.' + txt;   // 결과의 레벨 줄 — 굴러가다 끝나면 「A → B」
  const p = Math.max(0, Math.min(100, pct));
  for (const id of ['xpFill', 'jeXpFill', 'resXpFill']) {
    const el = $(id);
    if (!el) continue;
    if (done) { el.style.transform = ''; el.style.width = p + '%'; }
    else { el.style.width = '100%'; el.style.transform = `scaleX(${p / 100})`; }
  }
}
function levelMoment(r) {
  if (!r.win || !r.pre || levelMoments.has(r)) return;
  const wait = levelWait(r);
  levelMoments.add(r);
  const run = State.run;
  const from = r.pre.level, to = run.level, gained = to - from;
  const fromPct = r.pre.xp / xpToNext(from) * 100;
  const toPct = run.xp / xpToNext(to) * 100;
  if (calmMotion()) { if (gained > 0) levelPop(); return; }
  lastLvText = '';
  document.body.classList.add('lv-rolling');   // 막대의 짧은 전환 효과를 끕니다 — 매 프레임 직접 그리니까
  paintLevel(from, fromPct);
  setTimeout(() => {
    const dur = gained > 0 ? LEVEL_ANIM : XP_ANIM;
    const t0 = performance.now();
    const ease = t => t * t * (3 - 2 * t);     // 천천히 시작해 천천히 끝나는 곡선 — 숫자가 고르게 넘어갑니다
    const frame = now => {
      const t = Math.min(1, (now - t0) / dur);
      const e = ease(t);
      if (t >= 1) {
        paintLevel(to, toPct, true);
        document.body.classList.remove('lv-rolling');
        if (gained > 0) levelPop();
        return;
      }
      if (gained > 0) {
        // 막대는 한 바퀴만 — 앞 55% 동안 끝까지 차고, 뒤 45% 동안 새 레벨에서 지금 자리까지
        const pct = e < 0.55 ? fromPct + (100 - fromPct) * (e / 0.55) : toPct * ((e - 0.55) / 0.45);
        paintLevel(from + Math.floor(gained * e), pct);
      } else paintLevel(to, fromPct + (toPct - fromPct) * e);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, wait);
}
// 다 올라갔을 때 — 레벨 숫자가 한 번 튀고, 그 위로 「레벨 업」이 떠올랐다 사라집니다
function levelPop() {
  for (const el of [$('heroLevel'), document.querySelector('.je-lv')]) {
    if (!el) continue;
    el.classList.remove('lv-pop');
    void el.offsetWidth;
    el.classList.add('lv-pop');
  }
  const host = document.querySelector('.hud-lv');   // 지도 위 왼쪽 아래의 레벨 위로
  if (!host || calmMotion()) return;
  const pop = document.createElement('span');
  pop.className = 'lv-up-pop';
  pop.textContent = '레벨 업!';
  host.appendChild(pop);
  setTimeout(() => pop.remove(), 1500);
}

// ---------- 소리 ----------
// 지금 마주하거나 싸우고 있는 상대 — 결과 화면이나 갈림길이면 null
function facingFoe() {
  const run = State.run;
  if (!run) return null;
  if (battle && battle.r === run.lastResult) return run.lastResult.enemy;
  if (!run.lastResult && !run.over && run.encounter) return getEnemy(run.encounter);
  return null;
}

// 배경음 — 초기 화면 · 여정 · 보스(히든 포함)와 마주하거나 싸우는 동안. 여정이 끝나면 멈춥니다.
function syncMusic() {
  if (!$('title').classList.contains('hidden')) { Sound.music('title'); return; }
  const run = State.run;
  if (!run) return;
  if (run.over && !run.lastResult) { Sound.music(null); return; }
  const foe = facingFoe();
  if (foe && (foe.kind === 'boss' || foe.kind === 'hidden')) { Sound.music('boss'); return; }
  // 벽 너머에서는 여정의 노래가 바뀝니다
  Sound.music(document.body.classList.contains('beyond') ? 'beyond' : 'field');
}

// 상대가 나타났을 때 — 정예는 세 음, 보스 · 히든은 무겁게. 기운을 둘렀으면 반짝임을 덧붙입니다
function soundEncounter() {
  const run = State.run;
  if (!run || !run.encounter) return;
  const kind = getEnemy(run.encounter).kind;
  Sound.play(kind === 'normal' ? 'encounter' : kind === 'elite' ? 'encounterElite' : 'encounterBoss');
  if (run.aura) Sound.play('aura', { delay: 0.2 });
}

// 누르는 소리. 저마다 소리가 따로 있는 버튼은 뺍니다 (겹치면 지저분합니다)
const OWN_SOUND = '#engageBtn, #warpBtn, #retreatBtn, #commitBtn, '
  + '[data-enhslot], [data-equip], [data-unequip], [data-swap], [data-setpick], [data-jset]';
function wireClickSound() {
  document.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b || b.disabled || b.matches(OWN_SOUND)) return;
    Sound.play('tick');
  }, true);
}

// ---------- 설정 ----------
// 화면에 남긴 건 포인트 자동 분배 하나입니다.
// 알아서 갈아끼우기 · 결과 자동 넘기기는 뺐습니다 (꺼진 채로 고정 — game.js 의 FIXED_SETTINGS).
// 소리 둘은 기기에 저장합니다(device) — 저장 칸을 바꿔도, 초기 화면에서도 그대로입니다.
const SETTINGS_UI = [
  { group: '반복 줄이기' },
  { id: 'autoAlloc', type: 'toggle', name: '포인트 자동 분배', meta: true,
    desc: '레벨이 오를 때마다 정해둔 비율대로 알아서 찍습니다.' },

  { group: '소리' },
  { id: 'sfx', type: 'toggle', name: '효과음', device: true,
    desc: '전투 · 전리품 · 강화 같은 소리.' },
  { id: 'bgm', type: 'toggle', name: '배경음', device: true,
    desc: '초기 화면 · 여정 · 보스전 음악.' }
];

// 관리자 창에서만 바꾸는 보기 설정 — 화면 설정에는 그리지 않습니다 (아래 「관리자」)
const ADMIN_SETTINGS_UI = [
  { id: 'battleSpeed', type: 'choice', name: '전투 보기',
    desc: '싸우는 과정을 체력 바와 글로 보여줍니다.',
    options: [[0, '끔'], [1, '빠르게'], [2, '보통']] },
  { id: 'dropFx', type: 'toggle', name: '전리품 등장 연출',
    desc: '빼앗은 것이 잠깐 뒤에 하나씩 튀어나옵니다.' },
  { id: 'showLocked', type: 'toggle', name: '못 얻은 것 펼쳐두기',
    desc: '부위 창을 열 때 아직 못 얻은 ???? 도 처음부터 보여줍니다.' }
];
const ALL_SETTINGS = [...SETTINGS_UI, ...ADMIN_SETTINGS_UI];

function settingValue(s) {
  if (s.device) return Sound.get(s.id);
  return s.meta ? State.meta[s.id] : State.meta.settings[s.id];
}

// 설정 줄들 — 화면 설정과 관리자 창이 같은 모양을 씁니다.
// 화면에는 이름만 둡니다(설명은 마우스를 올렸을 때만). 관리자 창은 설명까지 적습니다(withDesc).
function settingRowsHTML(list, withDesc) {
  return list.map(s => {
    if (s.group) return `<div class="set-group">${s.group}</div>`;
    const v = settingValue(s);
    const control = s.type === 'toggle'
      ? `<button class="btn tiny set-toggle ${v ? 'on' : ''}" data-set="${s.id}">${v ? '켜짐' : '꺼짐'}</button>`
      : `<div class="set-choice">${s.options.map(([val, label]) =>
          `<button class="btn tiny ${v === val ? 'on' : ''}" data-set="${s.id}" data-val="${val}">${label}</button>`).join('')}</div>`;
    return `
      <div class="set-row" title="${s.desc}">
        <div class="set-body">
          <span class="set-name">${s.name}</span>
          ${withDesc ? `<span class="set-desc">${s.desc}</span>` : ''}
        </div>
        ${control}
      </div>`;
  }).join('');
}

function wireSettingButtons(el) {
  for (const b of el.querySelectorAll('[data-set]')) {
    b.addEventListener('click', () => {
      const s = ALL_SETTINGS.find(x => x.id === b.dataset.set);
      if (s.type === 'choice') setSetting(s, Number(b.dataset.val));
      else setSetting(s, !settingValue(s));
    });
  }
}

function renderSettings() {
  const el = $('settings');
  if (!el) return;
  el.innerHTML = settingRowsHTML(SETTINGS_UI) + `
    <div class="set-group">저장</div>
    <div class="set-row">
      <div class="set-body">
        <span class="set-name">이 저장을 지웁니다</span>
        <span class="set-desc">되돌릴 수 없다</span>
      </div>
      <button class="btn tiny danger${wipeArmed ? ' armed' : ''}" id="wipeBtn">${wipeArmed ? '정말 지웁니다' : '초기화'}</button>
    </div>`;
  wireSettingButtons(el);
  const wipe = $('wipeBtn');
  if (wipe) wipe.addEventListener('click', confirmWipe);
}

function setSetting(s, value) {
  if (s.device) Sound.set(s.id, value);
  else if (s.meta) State.meta[s.id] = value;
  else State.meta.settings[s.id] = value;
  if (s.id === 'showLocked') showLocked = value;
  save();
  render();
}

// 지우기는 한 번 더 묻습니다 — 되돌릴 수 없으니까요.
let wipeArmed = false;
function confirmWipe() {
  const b = $('wipeBtn');
  if (!wipeArmed) {
    wipeArmed = true;
    b.textContent = '정말 지웁니다';
    b.classList.add('armed');
    setTimeout(() => {
      if (!wipeArmed) return;
      wipeArmed = false;
      if ($('wipeBtn')) { $('wipeBtn').textContent = '초기화'; $('wipeBtn').classList.remove('armed'); }
    }, 4000);
    return;
  }
  wipeArmed = false;
  blockSaving();            // 새로고침하며 닫힐 때 「서 있던 칸 저장」이 방금 지운 저장을 다시 쓰지 않게
  wipeSlot(currentSlot);    // 하던 회차까지 같이 지웁니다
  location.reload();
}

// ---------- 최고 기록 ----------
function renderRecords() {
  const m = State.meta;
  const deepest = ZONES[Math.min(m.bestZone, ZONES.length) - 1];
  const bm = bossXpMult();
  // 분모는 아는 데까지만 — 마왕 너머가 몇이나 남았는지 숫자로도 새지 않게 (game.js 의 knownZoneCount)
  const known = knownZoneCount();
  $('records').innerHTML = `
    ${m.heroName ? record('이름', m.heroName) : ''}
    ${m.cityOpen ? record('헌터 등급', hunterGrade() ? `${gradeName()}급` : '미등록') : ''}
    ${m.guild ? record('길드', `${m.guild.name || '내 길드'} · ${m.guild.level}단계`) : ''}
    ${(m.allies || []).length ? record('동료', `${m.allies.length}명 · 함께 감: ${allyNow() ? `${allyNow().name}(${ALLY_KINDS[allyNow().kind].name})` : '없음'}`) : ''}
    ${record('회차', m.runCount)}
    ${record('최고 레벨', fmtLevel(m.bestLevel))}
    ${record('최심 도달', `${m.bestZone}지역 · ${deepest.name}`)}
    ${record('빼앗은 격', `${m.bossesBeaten.length}/${known}`, bm > 1.01 ? 'boost' : '')}
    ${bm > 1.01 ? record('영구 경험치', `×${bm.toFixed(1)}`, 'boost') : ''}
    ${record('골드', fmt(num(m.gold)))}
    ${m.cityOpen ? record('돈', pxIcon('won') + fmtWon(num(m.won))) : ''}
    ${record('전리품', `${ownedIds().length}/${knownItems().length}`)}
    ${record('도감 완성', `${completedRanks()}/${known}`, completedRanks() ? 'boost' : '')}
    ${m.cleared ? record('', '클리어', 'cleared') : ''}
  `;
}

function record(label, value, cls = '') {
  return `<div class="record ${cls}">
    <span class="record-label">${label}</span>
    <span class="record-value">${value}</span>
  </div>`;
}

// ---------- 나 ----------
function renderHero() {
  const run = State.run;
  const base = heroBaseStats(run.level);
  const total = heroStats();

  $('heroLevel').textContent = 'Lv.' + fmtLevel(run.level);
  // 회차는 바로 아래 기록 칸에 있습니다 — 여기 또 적으면 한 패널에 같은 숫자가 두 번 찍힙니다

  // 내 격 — 레벨이 올라가면 격이 바뀝니다.
  // 아직 모르는 격(마왕 너머)은 이름도, 다음 단계가 있다는 것도 보이지 않습니다.
  const rank = rankOf(run.level);
  const next = RANKS.find(r => r.minLevel > run.level);
  const av = activeAvatar();
  $('heroRank').innerHTML = `
    ${av ? `<span class="avatar-tag">${avatarTitle(av)}</span>` : ''}
    ${knownRank(rank.n)
      ? `<span class="rank-chip r${rank.n}">제${rank.n}격 · ${rank.name}</span>`
      : `<span class="rank-chip unknown">???</span>`}
    ${next && knownRank(next.n) ? `<span class="rank-next">제${next.n}격까지 Lv.${fmtLevel(next.minLevel - run.level)}</span>` : ''}
  `;

  // 경험치 바
  const need = xpToNext(run.level);
  $('xpText').textContent = `${fmt(run.xp)} / ${fmt(need)}`;
  $('xpFill').style.width = Math.min(100, (run.xp / need) * 100) + '%';

  // 에너지 — 숫자로만 (지도 위 왼쪽 위와 같은 값 · 같은 최대치)
  $('energyText').textContent = run.energy;
  $('energyMax').textContent = `/${startEnergy()}`;
  $('energyBlock').classList.toggle('low', run.energy <= 5);

  // 스탯 — 레벨에서 온 기본값 위에 분배와 전리품이 얼마나 얹혔는지
  $('heroStats').innerHTML = `
    ${statRow('생명', total.life, total.life - base.life)}
    ${statRow('공격력', total.damage, total.damage - base.damage)}
    ${statRow('방어력', total.defense, total.defense - base.defense)}
    ${statRow('민첩', total.dex, total.dex - base.dex)}
    ${statRow('행운', total.luck, total.luck - base.luck)}
    ${statRow('크리티컬', `${Math.round(critChance(total.dex, total.luck, total.critRate) * 100)}% · ×${critDamage(total.dex).toFixed(1)}`
        + (total.critRate > 0 ? ` <span class="stat-note">(장비 +${pctTxt(total.critRate)})</span>` : ''), 0)}
    ${statRow('명중', `${Math.round(hitChance(total.dex, enemyStats(run.level).dex) * 100)}% <span class="stat-note">(같은 레벨 상대에게)</span>`, 0)}
    ${completedRanks() ? statRow('도감 완성', `${completedRanks()}격 · 핵심 스탯 +${Math.round(completedRanks() * COLLECTION_BONUS * 100)}%`, 0) : ''}
    <li class="stat-head">특수 능력치</li>
    ${['doubleHit', 'pierce', 'lifesteal', 'block', 'reflect', 'regen', 'survive', 'harmTouch', 'doubleTurn']
      .map(k => specialRow(k, total[k])).join('')}
    <li class="stat-head">얻는 것</li>
    ${statRow('전리품 확률', total.findRate > 0
        ? `×${findPower(total).toFixed(2)} <span class="stat-note">(행운 ×${luckMult().toFixed(2)} · 장비 · 화신 +${Math.round(total.findRate * 100)}%)</span>`
        : `×${luckMult().toFixed(2)}`, 0)}
    ${statRow('경험치', total.xpRate !== 0
        ? `×${xpGearMult(total).toFixed(2)} <span class="stat-note">(장비 · 화신 ${total.xpRate > 0 ? "+" : "−"}${Math.round(Math.abs(total.xpRate) * 100)}%)</span>`
        : '×1.00', 0)}
    ${statRow('골드', total.goldRate > 0
        ? `×${goldMult(total).toFixed(2)} <span class="stat-note">(행운 ×${luckMult().toFixed(2)} · 장비 · 화신 +${Math.round(total.goldRate * 100)}%)</span>`
        : `×${luckMult().toFixed(2)}`, 0)}
    ${statRow('강화석', `+${Math.round(total.stoneRate * 100)}%`, 0)}
    ${statRow('꺾은 것', run.kills, 0)}
  `;

  renderAvatars();

  renderAlloc(run);
}

// ---------- 스탯 분배 ----------
// 직접 분배(기본) — 스탯마다 단위 넷(남은 포인트의 자릿수에 맞춰 커짐, game.js 의 allocSteps)을 눌러 찍습니다.
//   단위보다 적게 남았으면 남은 것을 다 찍고, 꾹 누르면 계속 찍힙니다 (사용자 결정).
// 자동 분배 — 비율(칸)을 정해 두면 레벨이 오를 때마다 그 비율대로 알아서 찍힙니다 (예전 방식).
// 큰 수의 단위 이름 — 1 · 10 · 100 · 1000 · 1만 · 10만 · … · 1억 · … · 1조 · … · 1경
function unitLabel(n) {
  const k = Math.round(Math.log10(n)), names = ['', '만', '억', '조', '경'];
  const big = Math.floor(k / 4);
  return big >= names.length ? `1e${k}` : `${Math.pow(10, k % 4)}${names[big]}`;
}
// ---------- 패시브 — 골드로 사는 영구 능력 (data.js 의 PASSIVES · game.js 의 buyPassive) ----------
// 값은 이번 회차를 시작할 때의 격으로 매김 — 한 판 벌어 하나 살까 말까. 골드는 회차가 끝나면 사라지니 그 안에 씀
function passiveEffect(p, lv) { return p.flat ? `${p.what} +${lv * p.step}` : `${p.what} +${Math.round(lv * p.step * 100)}%`; }
function renderPassives() {
  const el = $('passives');
  if (!el) return;
  const gold = num(State.meta.gold), live = State.run && !State.run.over;
  $('passiveGold').innerHTML = `골드 ${fmt(gold)}`;
  el.innerHTML = PASSIVES.map(p => {
    const lv = passiveLevel(p.id), price = passivePrice(p.id), can = live && price !== null && gold >= price;
    return `
      <div class="passive-row ${lv ? 'has' : ''}">
        <span class="passive-ic">${p.icon}</span>
        <span class="passive-body">
          <span class="passive-name">${p.name} <small>${lv}/${p.max}</small></span>
          <span class="passive-eff">${lv ? passiveEffect(p, lv) : `${p.what} 그대로`}${price !== null ? ` → <b>${passiveEffect(p, lv + 1)}</b>` : ''}</span>
        </span>
        ${price === null ? '<span class="passive-max">끝까지 올렸다</span>'
          : `<button class="btn tiny ${can ? 'primary' : ''}" data-passive="${p.id}" ${can ? '' : 'disabled'}>${fmt(price)} 골드</button>`}
      </div>`;
  }).join('') + `<p class="hint alloc-note">한 번 산 패시브는 영원히 남는다<br><b>골드는 회차가 끝나면 사라진다</b> — 쓰고 나오자</p>`;
  for (const b of el.querySelectorAll('[data-passive]')) b.addEventListener('click', () => {
    if (!buyPassive(b.dataset.passive)) return;
    Sound.play('rankUp');
    render();
  });
}

function renderAlloc(run) {
  renderPassives();
  const auto = State.meta.autoAlloc;
  $('pointCount').textContent = run.unspent > 0 ? `${fmt(run.unspent)}P 남음` : '';
  const alloc = allocatedStats();
  const spentSum = STAT_KEYS.reduce((n, k) => n + run.spent[k], 0);
  const top = `
    <div class="alloc-top">
      <div class="alloc-pool ${run.unspent > 0 ? 'ready' : ''}">
        <span class="pool-k">안 찍은 포인트</span>
        <span class="pool-v">${fmt(run.unspent)}</span>
      </div>
      <div class="alloc-mode">
        <button class="btn tiny ${auto ? '' : 'on'}" data-mode="manual">직접</button>
        <button class="btn tiny ${auto ? 'on' : ''}" data-mode="auto">자동</button>
      </div>
    </div>`;
  if (!auto) {
    const steps = allocSteps(run.unspent), none = run.unspent <= 0;
    $('alloc').innerHTML = top + STAT_INFO.map(s => {
      const held = spentSum > 0 ? run.spent[s.id] / spentSum * 100 : 0;
      return `
      <div class="alloc-row manual ${run.spent[s.id] > 0 ? 'has' : ''}">
        <div class="alloc-head">
          <span class="alloc-name">${s.name}</span>
          <span class="alloc-slots">${run.spent[s.id] > 0 ? `${fmt(run.spent[s.id])}P` : ''}</span>
          <span class="alloc-share">+${fmt(alloc[s.id])}</span>
        </div>
        <div class="alloc-bar"><div class="alloc-fill" style="width:${held}%"></div></div>
        <div class="alloc-steps">
          ${steps.map((n, i) => `<button class="btn tiny alloc-step" data-stat="${s.id}" data-step="${i}" ${none ? 'disabled' : ''}>+${unitLabel(n)}</button>`).join('')}
        </div>
        ${s.desc ? `<div class="alloc-foot"><span class="alloc-desc">${s.desc}</span></div>` : ''}
      </div>`;
    }).join('') + `
      <p class="hint alloc-note">꾹 누르면 계속 찍힌다 · 단위보다 적게 남으면 남은 것을 다 찍는다<br>찍은 포인트는 되돌릴 수 없다</p>`;
    for (const b of document.querySelectorAll('.alloc-step')) {
      b.addEventListener('pointerdown', ev => { if (ev.button === 0 || ev.pointerType !== 'mouse') { ev.preventDefault(); allocPress(b.dataset.stat, +b.dataset.step); } });
      b.addEventListener('click', ev => { if (ev.detail === 0) { allocStep(b.dataset.stat, +b.dataset.step); allocRelease(false); } });   // 키보드로 누른 것
      b.addEventListener('contextmenu', ev => ev.preventDefault());                 // 폰에서 꾹 누를 때 메뉴가 안 뜨게
    }
  } else {
    // 자동 — 행을 누를 때마다 그 스탯이 한 칸 차지하고, 비율은 칸 수대로 나뉩니다. 굵은 막대 = 이미 찍힌 것, 빗금 = 비율
    const w = State.meta.weights, sum = STAT_KEYS.reduce((n, k) => n + (w[k] || 0), 0);
    $('alloc').innerHTML = top + STAT_INFO.map(s => {
      const n = w[s.id] || 0, share = sum > 0 ? Math.round(n / sum * 100) : 0;
      const held = spentSum > 0 ? run.spent[s.id] / spentSum * 100 : 0;
      return `
      <button class="alloc-row ${n ? 'has' : ''}" data-add="${s.id}">
        <div class="alloc-head">
          <span class="alloc-name">${s.name}</span>
          <span class="alloc-slots">${n ? `${n}칸 · ${share}%` : ''}</span>
          <span class="alloc-share">+${fmt(alloc[s.id])}</span>
        </div>
        <div class="alloc-bar">
          <div class="alloc-fill" style="width:${held}%"></div>
          <div class="alloc-next" style="width:${share}%"></div>
        </div>
        <div class="alloc-foot">
          ${s.desc ? `<span class="alloc-desc">${s.desc}</span>` : ''}
          ${n ? `<span class="alloc-sub" data-sub="${s.id}">−</span>` : ''}
        </div>
      </button>`;
    }).join('') + `
      ${sum === 0 ? '<p class="hint alloc-empty">눌러서 비율을 정한다 — 레벨이 오를 때마다 이 비율대로 알아서 찍힌다</p>' : '<p class="hint alloc-note">레벨이 오를 때마다 이 비율대로 알아서 찍힌다<br>찍은 포인트는 되돌릴 수 없다</p>'}
      <div class="alloc-presets">
        <button class="btn tiny" data-preset="1,1,1,1,1">균형</button>
        <button class="btn tiny" data-preset="1,4,1,2,0">공격</button>
        <button class="btn tiny" data-preset="4,1,3,1,0">방어</button>
        <button class="btn tiny" data-preset="1,2,1,5,1">민첩</button>
        <button class="btn tiny" data-preset="1,1,1,1,4">행운</button>
        <button class="btn tiny" data-preset="0,0,0,0,0">비움</button>
      </div>`;
    for (const b of document.querySelectorAll('[data-add]')) {
      b.addEventListener('click', ev => {
        const minus = ev.target.closest('[data-sub]');                              // 행 안의 − 를 눌렀으면 빼기
        if (minus) addWeight(minus.dataset.sub, -1); else addWeight(b.dataset.add, 1);
        commitPoints();                                                            // 비율이 생기면 남은 포인트도 바로
        render();
      });
    }
    for (const b of document.querySelectorAll('[data-preset]')) {
      b.addEventListener('click', () => { setWeights(...b.dataset.preset.split(',').map(Number)); commitPoints(); render(); });
    }
  }
  for (const b of document.querySelectorAll('[data-mode]')) {
    b.addEventListener('click', () => { setAutoAlloc(b.dataset.mode === 'auto'); render(); });
  }
}

// 직접 분배 — 누르면 한 번 찍고, 꾹 누르고 있으면 잠깐 뒤부터 계속 찍힘. 손을 떼면(어디서든) 멈추고 저장 · 화면 전체를 다시 그림.
// 누르는 동안엔 분배 칸만 다시 그립니다 (단위가 남은 포인트에 맞춰 바뀌어도 같은 자리의 단추로 이어서)
const ALLOC_HOLD_DELAY = 350, ALLOC_HOLD_EVERY = 60;
let allocHold = null;
function allocStep(stat, idx) {
  const run = State.run;
  if (!run) return 0;
  const got = spendPoints(stat, allocSteps(run.unspent)[idx]);
  if (got) renderAlloc(run);
  return got;
}
function allocPress(stat, idx) {
  allocRelease(true);
  if (!allocStep(stat, idx)) return;
  Sound.play('tick');
  allocHold = { stat, idx, timer: setTimeout(function again() {
    if (!allocHold) return;
    if (!allocStep(stat, idx)) { allocRelease(); return; }
    allocHold.timer = setTimeout(again, ALLOC_HOLD_EVERY);
  }, ALLOC_HOLD_DELAY) };
}
function allocRelease(quiet) {
  const was = !!allocHold;
  if (allocHold) clearTimeout(allocHold.timer);
  allocHold = null;
  if (quiet) return;
  save();
  if (was || quiet === false) render();
}
for (const t of ['pointerup', 'pointercancel', 'blur']) window.addEventListener(t, () => { if (allocHold) allocRelease(); });

// value 가 문자열이면 그대로 씁니다 (크리티컬처럼 "27% · ×2.5" 같은 값)
// 0.078 → "7.8%"
function pctTxt(v) { return `${(num(v) * 100).toFixed(1)}%`; }
// 특수 능력치의 값 — 대부분 %, 생존만 횟수 (1회 · 2회)
function specialTxt(key, v) {
  return SPECIAL_INFO[key] && SPECIAL_INFO[key].unit === '회' ? `${Math.round(num(v))}회` : pctTxt(v);
}

// 특수 능력치 한 줄 — 지금 값과 상한. 상한에 닿았으면 눈에 띄게.
// 0 이어도 보여줍니다 — 무엇을 더 모을 수 있는지가 보여야 하니까요.
function specialRow(key, value) {
  const info = SPECIAL_INFO[key];
  const v = num(value);
  const capped = v >= info.cap - 1e-9;
  return `<li class="${v > 0 ? '' : 'zero'} ${capped ? 'capped' : ''}" title="${info.desc}">
    <span class="stat-name">${info.name}</span>
    <span class="stat-value">${specialTxt(key, v)}<span class="stat-cap">${capped ? '상한' : `/ ${info.unit === '회' ? `${info.cap}회` : `${Math.round(info.cap * 100)}%`}`}</span></span>
  </li>`;
}

function statRow(name, value, bonus) {
  const bonusText = bonus > 0 ? `<span class="stat-bonus">+${fmt(bonus)}</span>` : '';
  const shown = typeof value === 'string' ? value : fmt(value);
  return `<li>
    <span class="stat-name">${name}</span>
    <span class="stat-value">${shown}${bonusText}</span>
  </li>`;
}

// ---------- 화신 ----------
// 화신 창에서 고릅니다 (전리품 탭 맨 위의 화신 단추). 한 번에 하나만 삼고, 언제든 바꿉니다 (싸우는 중에는 못 바꿈).
// 화신마다 무엇이 오르고(▲) 무엇이 깎이는지(▼) 그대로 보여줍니다 — 그걸 보고 고르는 게 이 칸의 재미입니다.
function avatarEffectHTML(foe) {
  const p = avatarProfile(foe);
  const name = k => (STAT_INFO.find(s => s.id === k) || SPECIAL_INFO[k] || { name: k }).name;
  const parts = [];
  for (const [k, v] of Object.entries(p.mul)) parts.push({ up: v > 1, t: `${name(k)} ×${v.toFixed(2)}` });
  for (const [k, v] of Object.entries(p.add)) parts.push({ up: v > 0, t: `${name(k)} ${v > 0 ? '+' : '−'}${specialTxt(k, Math.abs(v))}` });
  parts.sort((a, b) => b.up - a.up);
  return parts.map(x => `<span class="${x.up ? 'up' : 'down'}">${x.up ? '▲' : '▼'} ${x.t}</span>`).join('');
}
function renderAvatars() { renderAvatarModal(); }   // 화신 목록은 화신 창(사람 그림의 화신 칸)에만 있습니다
function fillAvatars(el) {
  const list = (State.meta.avatars || []).map(getEnemy).filter(Boolean);
  if (!list.length) { el.innerHTML = ''; return; }
  const cur = State.meta.avatar;
  el.innerHTML = `<div class="av-head">화신 <span class="count">${list.length}</span></div>` + list.map(f => `
    <div class="av-row ${f.id === cur ? 'on' : ''}">
      <div class="av-top">
        <span class="av-ic">${f.icon}</span>
        <span class="avatar-tag">${avatarTitle(f)}</span>
        ${AVATAR_POWERS[f.id] ? `<span class="av-power">${AVATAR_POWERS[f.id].name}</span>` : ''}
        ${f.id === cur
          ? '<button class="btn tiny" data-avatar="">벗는다</button>'
          : `<button class="btn tiny" data-avatar="${f.id}" ${battle || fightLocked() ? 'disabled' : ''}>삼는다</button>`}
      </div>
      ${AVATAR_POWERS[f.id] ? `<div class="av-power-desc">${AVATAR_POWERS[f.id].desc}</div>` : ''}
      <div class="av-fx">${avatarEffectHTML(f)}</div>
    </div>`).join('');
  for (const b of el.querySelectorAll('[data-avatar]')) {
    b.addEventListener('click', () => {
      if (battle || fightLocked()) return;
      setAvatar(b.dataset.avatar || null);
      Sound.play(b.dataset.avatar ? 'equip' : 'unequip');
      render();
    });
  }
}

// ---------- 화신이 되었을 때 ----------
// 싸움이 끝나 결과가 뜨면 그 위에 한 번 — 화신의 그림(지금은 이모티콘)과 한마디, 무엇이 달라지는지.
const avatarShown = new WeakSet();
function avatarMoment(r) {
  const el = $('avatarGain');
  if (!el || !r || !r.avatarGained || avatarShown.has(r)) return;
  const f = getEnemy(r.avatarGained);
  if (!f) return;
  avatarShown.add(r);
  $('agArt').textContent = f.icon;
  $('agName').textContent = avatarTitle(f);
  $('agLine').textContent = `「${avatarLine(f)}」`;
  $('agFx').innerHTML = avatarEffectHTML(f);
  el.classList.remove('hidden');
}

// ---------- 화신 칸 · 화신 창 ----------
// 마왕을 꺾은 뒤(벽 너머를 본 뒤)부터 사람 그림 왼쪽 위에 화신 칸이 생깁니다 — 화신은 7격부터 얻기 때문입니다.
// 지금 삼은 화신이 보이고, 누르면 화신 창에서 고릅니다.
// 창 맨 위에 길게 — 나중에 화신 그림이 들어올 자리라 크게 잡았습니다 (왼쪽 그림 칸 = 지금은 이모티콘)
function renderAvatarBar() {
  const el = $('avatarBar');
  if (!el) return;
  if (!wallSeen()) { el.innerHTML = ''; return; }
  const f = getEnemy(State.meta.avatar);
  el.innerHTML = `<button class="avatar-bar ${f ? 'worn' : 'empty'}" id="dollAvatarBtn">
      <span class="ab-ic">${f ? f.icon : ''}</span>
      <span class="ab-txt"><span class="ab-k">화신</span><span class="ab-n">${f ? avatarTitle(f) : '비어 있음'}</span></span>
    </button>`;
}
function openAvatarModal() { $('avatarModal').classList.remove('hidden'); renderAvatarModal(); }
function closeAvatarModal() { const m = $('avatarModal'); if (m) m.classList.add('hidden'); }
function isAvatarModalOpen() { const m = $('avatarModal'); return !!m && !m.classList.contains('hidden'); }
function renderAvatarModal() {
  if (!isAvatarModalOpen()) return;
  const body = $('avatarBody');
  if (!(State.meta.avatars || []).length) { body.innerHTML = '<p class="hint">아직 얻은 화신이 없다</p>'; return; }
  fillAvatars(body);
}

// ---------- 지도 위의 것들 ----------
// 화면 틀을 지도 가득으로 바꾸며(UI 시안 C, 사용자 결정) 예전 지역 창(격 · 지역 이름 · 도감 · 에너지 · 레벨 · 차림)을 지도 위로 흩었습니다.
//   에너지 — 왼쪽 위의 큰 숫자. 칸으로 그리면 에너지가 늘수록 칸이 잘아져 숫자로만 (적으면 붉게 깜빡)
//   세트 1 2 3 · 도감 · 스탯 분배(안 찍은 포인트가 있을 때만) — 오른쪽 위
//   레벨 — 왼쪽 아래, 경험치 — 맨 아래 가장자리의 줄 (싸운 뒤 굴러 올라가는 동안은 paintLevel 이 그림)
//   지역 이름 — 다른 지역 · 다른 지도에 들어설 때만 가운데 위에 잠깐
let bannerShown = '', bannerTimer = 0;
function renderHud(zone) {
  const run = State.run;
  $('hudEnergy').classList.toggle('low', run.energy <= 5);
  $('hudEn').textContent = run.energy;
  $('hudEnMax').textContent = `/${startEnergy()}`;
  if (!document.body.classList.contains('lv-rolling')) {
    $('jeLv').textContent = fmtLevel(run.level);
    $('jeXpFill').style.width = `${Math.min(100, run.xp / xpToNext(run.level) * 100)}%`;
  }
  // 여정 한복판에서 차림을 바꿉니다 — 눈앞의 상대를 보고 정하는 일이라, 서랍을 오가게 만들면 아무도 안 씁니다.
  // 저장 · 덮어쓰기는 전리품 서랍에 그대로 두고, 여기서는 입기만 합니다. 마주한 때부터 싸움이 끝날 때까지는 숨습니다.
  $('hudRight').innerHTML = fightLocked() ? '' : `
    <div class="hud-sets">${Array.from({ length: SET_COUNT }, (_, n) => {
      const on = isSetActive(n);
      return `<button class="hud-set ${on ? 'on' : ''}" data-jset="${n}" ${on ? 'disabled' : ''} title="세트 ${n + 1}">${n + 1}</button>`;
    }).join('')}</div>
    ${inTown() ? `<span class="hud-chip hud-glass hud-won" title="가진 돈 — 도시에서 씁니다">${pxIcon('won')}${fmtWon(num(State.meta.won))}</span>`
      : `<button class="hud-chip hud-glass hud-gold ${PASSIVES.some(p => { const c = passivePrice(p.id); return c !== null && num(State.meta.gold) >= c; }) ? 'ready' : ''}" id="hudGoldBtn" title="가진 골드 — 회차가 끝나면 사라집니다. 누르면 패시브">골드 ${fmt(num(State.meta.gold))}</button>`}
    <button class="hud-chip hud-glass" id="rosterBtn" title="이 지역에 있는 것">도감 ${run.zoneIndex + 1} / ${knownZoneCount()}</button>
    ${run.unspent > 0 ? '<button class="hud-chip hud-glass ready" id="jAllocBtn">스탯 분배<span class="alloc-pip on"></span></button>' : ''}`;
  // 지역 이름 — 게임에 들어선 뒤 처음 그릴 때와, 다른 지역이나 지역이 없는 지도(문의 광장)에 들어설 때
  const name = placeName(zone), key = `${currentSlot}|${State.meta.runCount}|${name}`;
  if (key !== bannerShown && !fightLocked() && $('title').classList.contains('hidden')) {
    bannerShown = key;
    const rank = RANKS.find(r => r.n === zone.rank);
    $('zbName').textContent = name;
    $('zbRank').innerHTML = name !== zone.name ? ''
      : `<span class="rank-chip r${rank.n}">제${rank.n}격 · ${rank.name}<span class="hanja">${rank.hanja}</span></span>`;
    $('zoneBanner').classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => $('zoneBanner').classList.remove('show'), 2600);
  }
}

// ---------- 여정 ----------
function renderJourney() {
  const run = State.run;
  const zone = ZONES[run.zoneIndex];
  const hero = heroStats();
  renderHud(zone);

  // ----- 무대: 결과 · 조우 중 하나 — 지도 위에 뜬 창 -----
  // 지도를 걷다가 닿으면 조우 · 싸움 · 결과를 지도 위 창에서 봅니다. 아무도 마주하지 않으면 창 없이 지도만.
  const onMap = onMapZone();
  let stage = '';
  // 결과 화면이 먼저입니다. 마지막 에너지로 잡은 전리품도 보고 나서 끝나야 하니까요.
  // (여정이 끝났어도 결과를 닫기 전까지는 종료 화면을 띄우지 않습니다 — renderOverlay 참고)
  // 마주한 동안 · 싸우는 동안은 창이 화면 위아래를 다 씁니다 (css 의 body.meeting · body.battling) —
  // 상대는 가운데에 크게, 마주할 때와 싸울 때 같은 자리 같은 크기라 「맞선다」를 눌러도 튀지 않습니다.
  // 싸울 때는 상대 체력이 위, 나의 체력 · 기록은 아래에 붙습니다.
  const fighting = !!battle && battle.r === run.lastResult;
  document.body.classList.toggle('battling', fighting);
  document.body.classList.toggle('meeting', !fighting && !run.lastResult && !run.over && !!run.encounter);
  if (fighting) {
    stage = battleCard(battle);
  } else if (run.lastResult) {
    stage = resultCard(run.lastResult, run);
    resultSounds(run.lastResult, run);
    avatarMoment(run.lastResult);
    wallMoment(run.lastResult);
    levelMoment(run.lastResult);
  } else if (run.over) {
    stage = `<p class="stage-msg">여정이 끝났다.</p>`;
  } else if (run.encounter) {
    stage = encounterCard(getEnemy(run.encounter), hero, run.aura, run.noRetreat);
  } else if (!onMap) {
    // 모든 지역이 지도 위에 있어서 여기엔 오지 않습니다 — 지도 파일(js/maps.js)을 못 읽었을 때만
    stage = `<p class="stage-msg">지도를 읽지 못했다. 새로 고쳐 주세요.</p>`;
  }
  // 정예 · 보스 · 히든과 마주하거나 싸우는 동안은 무대 창의 테두리가 그 색이 됩니다
  const facing = facingFoe();
  const frame = stage ? `<div class="frame stage ${facing && facing.kind !== 'normal' ? `k-${facing.kind}` : ''}">${stage}</div>` : '';

  renderMapLayer(onMap, frame);
  renderRoster();
  wireJourney();
  if (battle) { paintBattle(); return; }   // 전투가 끝나야 전리품이 튀어나오고 자동 넘기기가 돕니다
  revealDrops();
  scheduleAutoContinue();
}

// ---------- 이 지역에 있는 것 (도감) ----------
// 예전엔 여정 맨 아래에 길게 깔려 있어서, 누가 나오는지 보려면 스크롤을 한참
// 내려야 했습니다. 지역 이름 옆의 「1 / 11」 을 눌러 창으로 띄웁니다.
// 지금 지역만 볼 것인가, 열한 격 전부를 볼 것인가
let rosterAll = false;

function rosterRow(foe, hero, sims) {
  const chance = winChanceMemo(hero, foe, sims);
  const down = foe.once && isDowned(foe.id);
  const seen = isSeen(foe.id);
  return `
    <div class="roster-item ${foe.kind} ${down ? 'down' : ''} ${seen ? '' : 'unseen'}">
      <span class="r-icon">${seen ? foeIcon(foe) : '·'}</span>
      <span class="r-name">
        ${foe.kind !== 'normal' ? `<span class="grade-tag ${foe.kind}">${KINDS[foe.kind].name}</span>` : ''}
        ${seen ? foe.name : '???'}<span class="lv">Lv.${fmtLevel(foe.level)}</span>
      </span>
      ${rosterDrops(foe)}
      <span class="r-chance ${down ? '' : winFeelClass(chance)}">${down ? '꺾음' : winFeel(chance)}</span>
    </div>`;
}

function renderRoster() {
  const el = $('roster');
  if (!el) return;
  const run = State.run;
  const hero = heroStats();
  const title = $('rosterTitle');
  const sub = $('rosterSub');
  const btn = $('rosterAllBtn');
  if (btn) {
    btn.textContent = rosterAll ? '이 지역' : '전체 도감';
    btn.classList.toggle('on', rosterAll);
  }

  if (!rosterAll) {
    const zone = ZONES[run.zoneIndex];
    const rank = RANKS.find(r => r.n === zone.rank);
    if (title) title.textContent = zone.name;
    const col = rankCollection(rank.n), box = rankChests(rank.n);
    if (sub) sub.textContent = `제${rank.n}격 · ${rank.name} · 전리품 ${col.have}/${col.total}${col.have >= col.total ? ' · 완성' : ''}`
      + (box.total ? ` · 보물상자 ${box.opened}/${box.total}` : '');
    el.innerHTML = zoneRoster(run.zoneIndex).map(f => rosterRow(f, hero)).join('');
    return;
  }

  // 전체 — 격마다 묶어서 보여줍니다. 아는 지역까지만 (마왕 너머는 닿은 데까지만).
  // 승률 계산을 줄여 잡습니다(40판). 전부 제대로 돌리면 2만 판이 넘습니다.
  const zones = ZONES.slice(0, knownZoneCount());
  const known = ENEMIES.filter(f => f.zoneIndex < zones.length);
  const seenCount = known.filter(f => isSeen(f.id)).length;
  if (title) title.textContent = '전체 도감';
  if (sub) sub.textContent = `${seenCount}/${known.length} 마주침`;

  el.innerHTML = zones.map((zone, zi) => {
    const rank = RANKS.find(r => r.n === zone.rank);
    const list = zoneRoster(zi);
    const got = list.filter(f => isSeen(f.id)).length;
    const col = rankCollection(rank.n);
    const done = col.have >= col.total;
    return `
      <div class="roster-zone ${zi === run.zoneIndex ? 'here' : ''}">
        <span class="rank-chip r${rank.n}">제${rank.n}격 · ${rank.name}</span>
        <span class="rz-name">${zone.name}</span>
        <span class="rz-col ${done ? 'done' : ''}" title="이 격의 전리품을 다 모으면 핵심 스탯 +${Math.round(COLLECTION_BONUS * 100)}%">${done ? '완성' : `전리품 ${col.have}/${col.total}`}</span>
        <span class="rz-count">${got}/${list.length}</span>
      </div>
      ${list.map(f => rosterRow(f, hero, 40)).join('')}`;
  }).join('');
}

// 그 격의 보물상자 — 모든 지도에서 (연 수 / 전체). 지역 도감 머리에 씁니다
function rankChests(n) {
  initMap();
  const all = maps ? Object.values(maps).flatMap(m => m.chests.filter(c => Number(c.rank) === n)) : [];
  return { opened: all.filter(c => chestOpened(c.chest)).length, total: all.length };
}

// 도감 줄에 끼워 넣는 전리품 칩.
// 이름은 뺐습니다 — 한 줄에 셋씩 들어가야 해서 자리가 없고,
// **뭘 아직 못 얻었는지**만 보면 되는 자리라 그림과 부위면 충분합니다.
function rosterDrops(foe) {
  const table = dropTable(foe.id), mat = MATERIALS[foe.mat];
  if (!table.length) return '<span class="r-drops"></span>';
  // 재료를 주는 몬스터 — 재료 칸이 먼저, 그 뒤가 그 재료로 만드는 것
  const matChip = mat ? `<span class="rd mat" title="${mat.name} — 가진 것 ${fmt(matsOf(mat.id))}개"><span class="rd-ic">${mat.icon}</span><span class="rd-k">재료 ${fmt(matsOf(mat.id))}</span></span>` : '';
  return `<span class="r-drops">${matChip}${table.map(it => {
    const have = owns(it.id);
    return `<span class="rd ${have ? 'have' : 'miss'}" title="${SLOT_NAMES[it.slot]} · ${have ? it.name : '아직 못 얻음'}">
              <span class="rd-ic">${have ? itemArt(it) : '?'}</span>
              <span class="rd-k">${SLOT_NAMES[it.slot]}</span>
            </span>`;
  }).join('')}</span>`;
}

function openRosterModal() {
  renderRoster();
  const m = $('rosterModal');
  if (m) m.classList.remove('hidden');
}
function closeRosterModal() {
  const m = $('rosterModal');
  if (m) m.classList.add('hidden');
}
function isRosterModalOpen() {
  const m = $('rosterModal');
  return !!m && !m.classList.contains('hidden');
}

// ---------- 전리품 등장 ----------
// 0.45초 뒤부터 하나씩 튀어나옵니다.
// 결과 화면이 그려지는 순간 같이 떠 있으면 그냥 글자 한 줄인데,
// 한 박자 늦게 나오면 "떨어졌다" 가 됩니다. 그 한 박자를 위한 장치입니다.
// 예전엔 0.2초 · 0.14초 간격 · 0.34초 연출이라 무엇이 나왔는지 보기도 전에 끝났습니다.
// 연출 길이(DROP_ANIM)는 style.css 의 drop-pop · art-drop 과 맞춥니다.
const DROP_DELAY = 450;    // 첫 전리품까지
const DROP_STEP  = 450;    // 그다음부터 하나씩
const DROP_ANIM  = 1400;   // 하나가 다 튀어나오기까지 (빛살이 다 돌 때까지)

const dropsShown = new WeakMap();   // 결과 → 이미 튀어나온 전리품 수
let dropTimers = [];
function revealDrops() {
  for (const t of dropTimers) clearTimeout(t);
  dropTimers = [];
  const r = State.run && State.run.lastResult;
  // 마왕을 꺾은 결과면, 벽이 무너지는 연출이 걷힌 뒤에 튀어나옵니다 — 어둠 속에서 나와 버리면 못 보니까요
  const wait = r && r.enemy.id === WALL_BOSS && wallPending
    ? WALL_FX_DELAY + (calmMotion() ? 0 : WALL_FX_LEN - 300) : 0;
  const veiled = document.querySelectorAll('.res-drop.veiled');
  veiled.forEach((el, i) => {
    dropTimers.push(setTimeout(() => {
      el.classList.remove('veiled');
      el.classList.add('pop');
      if (r) dropsShown.set(r, Math.max(dropsShown.get(r) || 0, Number(el.dataset.drop) + 1));
      // 새 것은 반짝, 이미 가진 것(분해)은 짤랑
      Sound.play(el.classList.contains('is-new') ? 'drop' : 'stone');
    }, wait + DROP_DELAY + i * DROP_STEP));
  });
}

// ---------- 결과 자동 넘기기 ----------
// 시뮬에서 전투 2339번 중 패배는 71번(3%)뿐이었습니다. 나머지는 결과를 보고
// "계속한다" 만 누르고 지나갑니다. 그 반복을 덜어주되,
// **진 판은 절대 자동으로 넘기지 않습니다** — 그때는 멈춰서 봐야 하니까요.
let autoContinueTimer = null;
function scheduleAutoContinue() {
  if (autoContinueTimer) { clearTimeout(autoContinueTimer); autoContinueTimer = null; }
  const ms = State.meta.settings.autoContinue;
  const r = State.run && State.run.lastResult;
  if (!ms || !r || !r.win || State.run.over) return;

  // 전리품이 다 나온 뒤에 넘겨야 뭘 얻었는지 보입니다
  const shown = (r.drops && r.drops.length && State.meta.settings.dropFx)
    ? DROP_DELAY + (r.drops.length - 1) * DROP_STEP + DROP_ANIM
    : 0;
  autoContinueTimer = setTimeout(() => {
    autoContinueTimer = null;
    if (!State.run || !State.run.lastResult || !State.run.lastResult.win) return;
    dismissResult();
    render();
  }, ms + shown);
}

// ============================================================
//  전투 화면 — 싸우는 과정을 한 방씩 다시 틀어줍니다
// ============================================================
// 승패와 전리품은 「맞선다」를 누르는 순간 이미 정해져 있습니다 (engage).
// 여기서는 그 전투의 기록(lastResult.replay)을 보고 초상 · 체력 바 · 글로 다시 보여줄 뿐입니다.
// 초상은 지금은 이모지입니다 — 나중에 그림이 들어올 자리.
//
// 한 줄마다 화면 전체를 다시 그리지 않습니다 — 도감까지 다시 그리면 승률을 수백 번 다시 잽니다.
// 체력 바와 기록 줄만 바꿉니다.
// 건너뛰기는 없습니다 — 나중에 상대와 내 그림, 효과 연출이 들어올 자리라 끝까지 봅니다.
let battle = null;                       // { r: 그 결과, i: 지금까지 보여준 줄 수, step: 줄 간격(ms), timer }
const BATTLE_PACE = { 1: 90, 2: 260 };   // 빠르게 · 보통 — 한 줄에 몇 ms
const BATTLE_MAX_MS = 6000;              // 긴 전투도 이 안에 끝나게 줄 간격을 줄입니다
// 길어지는 싸움은 점점 빠르게 — 시작하고 3초가 지나면 ×2, 6초가 지나면 ×3 (사용자 결정). 빨라지면 싸움 칸 구석에 「×2」
const BATTLE_RAMP = [[6000, 3], [3000, 2]];
const battleRamp = () => { const t = performance.now() - battle.t0; for (const [ms, k] of BATTLE_RAMP) if (t >= ms) return k; return 1; };
// 기록은 최근 여섯 줄만 — 위에 초상이 들어와서 줄였습니다. 폰은 한 화면에 들어오게 다섯 줄.
const battleLines = () => (window.innerWidth <= 860 ? 5 : 6);

// logFrom — engage 직전 기록의 마지막 번호. 그 뒤의 줄(이 전투가 남긴 것)은 전투가 끝날 때까지 숨깁니다.
function startBattle(r, logFrom) {
  stopBattle();
  const speed = State.meta.settings.battleSpeed;
  const log = r && r.replay && r.replay.log;
  if (!speed || !log || !log.length) return;
  const step = Math.max(30, Math.min(BATTLE_PACE[speed] || 260, BATTLE_MAX_MS / log.length));
  battle = { r, i: 0, step, logFrom: logFrom || 0, held: heldSpoils(r), t0: performance.now() };
  battle.timer = setTimeout(tickBattle, step);
}

// ---------- 전투가 끝나기 전엔 전리품을 보여주지 않습니다 ----------
// 승패와 전리품은 「맞선다」를 누르는 순간 이미 정해지고 저장됩니다. 그대로 그리면 싸움이 다 보이기도 전에
// 전리품 탭에 NEW · 새 물건 · 늘어난 강화석(▲강화)이 먼저 떠 버립니다.
// 그래서 전투를 보여주는 동안에는, 이 전투에서 얻은 것을 뺀 모습(held)으로 전리품 · 기록 쪽을 그립니다.
function heldSpoils(r) {
  const m = State.meta;
  const held = {
    owned: { ...m.owned },
    stones: { ...m.stones },
    fresh: Object.fromEntries(Object.entries(m.fresh).map(([k, v]) => [k, v.slice()])),
    gold: num(m.gold) - num(r && r.gold),
    avatars: (m.avatars || []).filter(id => !(r && id === r.avatarGained)),
    avatar: r && r.avatarGained && m.avatar === r.avatarGained ? null : m.avatar,
    run: r && r.pre ? { ...r.pre } : null
  };
  for (const d of (r && r.win && r.drops) || []) {
    if (d.isNew) {
      delete held.owned[d.item.id];
      const f = held.fresh[d.item.slot];
      if (f) held.fresh[d.item.slot] = f.filter(id => id !== d.item.id);
    } else if (d.stones) {
      held.stones[d.item.slot] = (held.stones[d.item.slot] || 0) - d.stones;
    }
  }
  return held;
}

// 전투 중이면 그 전투의 전리품을 잠깐 빼 둔 채로 fn 을 그립니다 (끝나면 바로 되돌립니다)
function withHeldSpoils(fn) {
  if (!battle || !battle.held) return fn();
  const m = State.meta, run = State.run, h = battle.held;
  const real = { owned: m.owned, stones: m.stones, fresh: m.fresh, gold: m.gold, avatars: m.avatars, avatar: m.avatar };
  const realRun = h.run ? Object.fromEntries(Object.keys(h.run).map(k => [k, run[k]])) : null;
  Object.assign(m, { owned: h.owned, stones: h.stones, fresh: h.fresh, gold: h.gold, avatars: h.avatars, avatar: h.avatar });
  if (h.run) Object.assign(run, h.run);
  try { return fn(); } finally {
    Object.assign(m, real);
    if (realRun) Object.assign(run, realRun);
  }
}

function stopBattle() {
  if (battle && battle.timer) clearTimeout(battle.timer);
  battle = null;
}

// 다 보여줬으면 결과 화면으로
function finishBattle() { stopBattle(); render(); }

function tickBattle() {
  if (!battle) return;
  const n = battle.r.replay.log.length;
  battle.i = Math.min(n, battle.i + 1);
  paintBattle();
  // 방금 보여준 줄의 연출과 소리. 마지막 줄 뒤에는 쓰러진 쪽이 바래고 승패를 알리는 소리
  const e = battle.r.replay.log[battle.i - 1];
  battleFx(e);
  const s = battleSound(e);
  if (s) Sound.play(s);
  if (battle.i >= n) {
    fxDown(battle.r.win ? $('btFoe') : $('btHero'));
    Sound.play(battle.r.win ? 'win' : 'lose', { delay: 0.15 });
    jingled.add(battle.r);
  }
  // 마지막 줄을 보여준 뒤 잠깐 멈췄다가 결과로 (길어진 싸움은 그 멈춤도 빨라진 만큼 짧게)
  const k = battleRamp(), tag = $('btSpeed');
  if (tag) { tag.textContent = k > 1 ? `×${k}` : ''; tag.classList.toggle('on', k > 1); }
  battle.timer = setTimeout(battle.i >= n ? finishBattle : tickBattle, battle.i >= n ? 700 / k : battle.step / k);
}

// 기록 한 줄 → 효과음 이름
function battleSound(e) {
  if (!e) return null;
  if (e.who === 'hero') {
    switch (e.k) {
      case 'hit':     return e.harm ? 'harm' : e.crit ? 'crit' : 'hit';
      case 'reflect': return 'hit';
      case 'miss':    return 'miss';
      case 'regen':
      case 'steal':   return 'heal';
      case 'extra':
      case 'survive': return 'special';
      case 'power':   return e.p === 'zeus' || e.p === 'hades' ? 'harm' : 'special';
    }
  } else if (e.who === 'ally') {
    return e.k === 'hit' ? 'hit' : e.k === 'heal' ? 'heal' : 'miss';
  } else {
    switch (e.k) {
      case 'hit':   return e.crit ? 'foeCrit' : 'foeHit';
      case 'miss':  return 'miss';
      case 'block': return 'block';
    }
  }
  return null;
}

// 결과 화면이 처음 뜰 때 한 번. 전투 보기를 껐으면 승패 소리도 여기서 냅니다.
const jingled = new WeakSet();         // 전투 화면 끝에서 이미 승패 소리를 낸 결과
const soundedResults = new WeakSet();  // 결과 화면 소리를 이미 낸 결과
function resultSounds(r, run) {
  if (soundedResults.has(r)) return;
  soundedResults.add(r);
  if (!jingled.has(r)) Sound.play(r.win ? 'win' : 'lose');
  if (!r.win) return;
  if (r.levelsGained > 0) {
    const rankUp = rankOf(r.levelBefore).n !== rankOf(run.level).n;
    Sound.play(rankUp ? 'rankUp' : 'levelUp', { delay: (levelWait(r) + LEVEL_ANIM) / 1000 });   // 숫자가 다 올라간 때
  }
  // 마왕이면 길이 열리는 소리 대신 벽이 무너지는 소리 (연출과 같은 때 — wallMoment)
  if (r.openedPath) Sound.play(r.enemy.id === WALL_BOSS ? 'wallBreak' : 'pathOpen', { delay: r.enemy.id === WALL_BOSS ? WALL_FX_DELAY / 1000 : 0.9 });
  if (r.openedSpecial) Sound.play('unlock', { delay: 1.2 });
  if (r.avatarGained) Sound.play('rankUp', { delay: 0.5 });
}

// 기록 한 줄 → 글. 이름이 길어도 한 줄에 들어가게 짧게 씁니다.
// 보스 화신의 고유 능력이 터진 줄
function powerLine(e, foeName, v) {
  const n = (AVATAR_POWERS[e.p] || {}).name || '';
  switch (e.p) {
    case 'yisunsin': return `${n} — 물러설 곳이 없다`;
    case 'cheonma':  return `${n} —`;
    case 'imugi':    return `${n} — 용이 되었다`;
    case 'heracles': return `${n} — 다시 일어섰다 (${e.n}/12)`;
    case 'michael':  return `${n} — 큰 상대다`;
    case 'lucifer':  return `${n} — 지금이 가장 빛난다`;
    case 'hades':    return `${n} — ${foeName}${josa(foeName, '을', '를')} 데려갔다`;
    case 'zeus':     return `${n}! ${foeName}에게 ${v}`;
    case 'arthur':      return `${n} — 검이 빗나가지 않는다`;
    case 'merlin':      return `${n} — 상대의 눈이 흐려졌다`;
    case 'sanctdragon': return `${n} — 비늘이 피해를 받아 낸다`;
    case 'tiamat':      return `${n} — 바다가 차오른다`;
    case 'cthulhu':     return `${n} — 다시 깨어났다`;
  }
  return n;
}
function battleLine(e, foeName) {
  const v = fmt(e.v);
  if (e.who === 'hero') {
    switch (e.k) {
      case 'hit': return { cls: e.harm ? 'b-harm' : e.crit ? 'b-crit' : 'b-hero',
        text: `${e.second ? '이중타격 — ' : ''}${e.harm ? '일격! ' : e.crit ? '치명타! ' : ''}${foeName}에게 ${v}` };
      case 'miss':    return { cls: 'b-miss', text: e.second ? '두 번째 공격이 빗나갔다' : '내 공격이 빗나갔다' };
      case 'regen':   return { cls: 'b-heal', text: `재생 — 생명 +${v}` };
      case 'steal':   return { cls: 'b-heal', text: `흡혈 — 생명 +${v}` };
      case 'reflect': return { cls: 'b-hero', text: `반사 — ${foeName}에게 ${v}` };
      case 'extra':   return { cls: 'b-special', text: '연속 턴 — 한 번 더 움직인다' };
      case 'survive': return { cls: 'b-special', text: '생존 — 생명 1을 남기고 버텼다' };
      case 'power':   return { cls: 'b-power', text: powerLine(e, foeName, v) };
    }
  } else if (e.who === 'ally') {
    const an = (allyNow() || {}).name || '동료';
    return e.k === 'hit' ? { cls: 'b-hero', text: `${an}의 추가타 — ${foeName}에게 ${v}` } : e.k === 'heal' ? { cls: 'b-heal', text: `${an}의 회복 — 생명 +${v}` } : { cls: 'b-miss', text: `${an}의 공격이 빗나갔다` };
  } else {
    switch (e.k) {
      case 'hit':   return { cls: e.crit ? 'b-foecrit' : 'b-foe', text: `${e.crit ? '치명타! ' : ''}${foeName}의 공격 — ${v}` };
      case 'miss':  return { cls: 'b-miss', text: `${foeName}의 공격이 빗나갔다` };
      case 'block': return { cls: 'b-special', text: `${foeName}의 공격을 막았다` };
    }
  }
  return { cls: 'b-miss', text: '' };
}

function hpPct(hp, max) { return `${Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100))}%`; }

// 내 모습 — 지도에서 걷는 그 그림(assets/hero/walk.png)의 뒷모습 서기 칸. 위에 선 상대를 마주 봅니다 (사용자 결정)
const heroSprite = () => `<span class="portrait-ic hero-sprite" style="background-image:url('${MapView.heroSheet()}')"></span>`;
// 함께 가는 동료 — 그림이 생기기 전까지 이모지 (data.js 의 ALLIES 의 icon)
const allySprite = (id = State.meta.ally || 'hayun') => `<span class="ally-sprite">${(ALLIES[id] || {}).icon || '🧑'}</span>`;

// 전투 카드 — 처음 그릴 때. 그다음부터는 paintBattle 이 바 · 숫자 · 줄만 바꿉니다.
// 위에서부터 상대 체력 · 상대 초상(크게) · 내 초상(작게) · 내 체력 · 기록.
function battleCard(b) {
  const { r } = b;
  const foe = r.enemy;
  return `
    <div class="battle k-${foe.kind}" id="battle">
      <div class="bt-side foe">
        <div class="bt-top"><span class="bt-name">${foe.kind !== 'normal' ? `<span class="grade-tag ${foe.kind}">${KINDS[foe.kind].name}</span>` : ''}${foe.name}<span class="lv">Lv.${fmtLevel(foe.level)}</span></span>
          <span class="bt-hp" id="btFoeHp"></span></div>
        <div class="bt-bar"><div class="bt-fill foe" id="btFoeFill"></div></div>
      </div>
      <div class="bt-arena" id="btArena">
        <span class="bt-speed" id="btSpeed"></span>
        <div class="portrait bt-foe" id="btFoe"><span class="portrait-ic">${foeIcon(foe)}</span></div>
        <div class="portrait bt-hero" id="btHero">${heroSprite()}${allyNow() ? `<span class="bt-ally" id="btAlly">${allySprite()}</span>` : ''}</div>
      </div>
      <div class="bt-side hero">
        <div class="bt-top"><span class="bt-name">${activeAvatar() ? `<span class="avatar-tag">${avatarTitle(activeAvatar())}</span>` : ''}${heroName()}<span class="lv">Lv.${fmtLevel(r.levelBefore || State.run.level)}</span></span>
          <span class="bt-hp" id="btHeroHp"></span></div>
        <div class="bt-bar"><div class="bt-fill hero" id="btHeroFill"></div></div>
      </div>
      <div class="bt-log" id="btLog"></div>
    </div>`;
}

// ---------- 전투 연출 ----------
// 기록 한 줄마다 — 때리는 쪽이 앞으로 튀어나가고, 맞는 쪽이 하얗게 번쩍이며 흔들리고, 그 위로 숫자가 떠오릅니다.
// 치명타 · 일격은 숫자가 커지고, 일격과 아픈 치명타는 화면째 흔들립니다. 끝나면 쓰러진 쪽이 깜빡이며 바랩니다.
// 기기에서 「움직임 줄이기」를 켰으면 흔들림 · 튀어나감은 빼고 숫자만 띄웁니다.
const calmMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const FX_SHAKE = [
  { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' },
  { transform: 'translateX(-3px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }
];

function fxAnim(el, frames, ms, easing) {
  if (!el || !el.animate || calmMotion()) return;
  el.animate(frames, { duration: ms, easing: easing || 'ease-out' });
}

// 맞음 — 흔들리며 하얗게 번쩍
function fxHit(el, hard) {
  if (!el) return;
  fxAnim(el, FX_SHAKE, hard ? 320 : 240, 'steps(5, end)');
  fxAnim(el.querySelector('.portrait-ic'), [{ filter: 'brightness(2.4) saturate(0)' }, { filter: 'none' }], 220, 'steps(2, end)');
}

// 때림 — 상대 쪽으로 한 번 튀어나갔다 돌아옴 (dir: 위로 -1, 아래로 1)
function fxLunge(el, dir) {
  fxAnim(el, [{ transform: 'translateY(0)' }, { transform: `translateY(${dir * 14}px)` }, { transform: 'translateY(0)' }], 220);
}

// 초상 위로 떠오르는 숫자 · 글자.
// 내 초상은 작고 바로 위에 상대 그림이 있어서, 위로 띄우면 상대가 맞은 것처럼 보입니다 — 오른쪽 옆에 띄웁니다.
function fxFloat(el, text, cls) {
  if (!el) return;
  const side = el.classList.contains('bt-hero');
  const f = document.createElement('span');
  f.className = `bt-float ${side ? 'side' : ''} ${cls || ''}`;
  f.textContent = text;
  // 연달아 떠도 겹치지 않게 조금씩 비껴서
  if (side) f.style.top = `${8 + Math.random() * 34}%`;
  else f.style.left = `${50 + Math.random() * 24 - 12}%`;
  el.appendChild(f);
  if (!f.animate) { setTimeout(() => f.remove(), 800); return; }
  const x = side ? '0' : '-50%';
  const rise = side ? 18 : 38;
  f.animate([
    { transform: `translate(${x}, 0) scale(0.8)`, opacity: 0 },
    { transform: `translate(${x}, ${-rise * 0.26}px) scale(1.1)`, opacity: 1, offset: 0.2 },
    { transform: `translate(${x}, ${-rise * 0.74}px) scale(1)`, opacity: 1, offset: 0.7 },
    { transform: `translate(${x}, ${-rise}px) scale(1)`, opacity: 0 }
  ], { duration: 800, easing: 'ease-out' }).onfinish = () => f.remove();
}

// 두 초상 사이에 잠깐 뜨는 띠 — 연속 턴 · 생존 같은 특수 능력치
function fxBanner(text) {
  const arena = $('btArena');
  if (!arena) return;
  const b = document.createElement('span');
  b.className = 'bt-banner';
  b.textContent = text;
  arena.appendChild(b);
  if (!b.animate) { setTimeout(() => b.remove(), 900); return; }
  b.animate([
    { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.05)', opacity: 1, offset: 0.2 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.75 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 }
  ], { duration: 900, easing: 'ease-out' }).onfinish = () => b.remove();
}

// 쓰러짐 — 깜빡이다 바랜 채로 남습니다
function fxDown(el) {
  if (!el) return;
  fxAnim(el, [{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0.3 }], 600, 'steps(6, end)');
  el.classList.add('down');
}

// 그림 이펙트 길이 — 전투 빠르기에 맞춥니다 (빠르게면 짧게, 보통이면 0.4초 남짓)
function fxMs() { return Math.max(220, Math.min(480, ((battle && battle.step) || 260) * 1.6)); }

// 그림 이펙트 (fx.js) — 내 공격은 상대 초상 가운데, 상대 공격은 내 초상 위.
// 기기에서 「움직임 줄이기」를 켰으면 띄우지 않습니다.
// 그림 이펙트는 기기의 「움직임 줄이기」가 켜져 있어도 보여줍니다 — 맞고 때리는 걸 알아보는 핵심이라서요.
// (안드로이드의 「애니메이션 삭제」 · 절전 모드가 이걸 켜서 폰에서만 이펙트가 사라졌습니다.) 흔들림 · 튀어나감은 그대로 뺍니다.
function fxSprite(sheet, anim, el, scale) {
  if (typeof FX === 'undefined') return;
  FX.play(sheet, anim, el, { ms: fxMs(), scale });
}

// 기록 한 줄 → 연출
function battleFx(e) {
  if (!e) return;
  const foeEl = $('btFoe'), heroEl = $('btHero'), box = $('battle');
  const v = fmt(e.v);
  if (e.who === 'hero') {
    switch (e.k) {
      case 'hit':
        fxLunge(heroEl, -1);
        // 보통은 베기, 치명타는 초승달, 일격은 별빛 폭발, 이중타격의 두 번째는 세로 번개
        fxSprite('hero', e.harm ? 'star' : e.crit ? 'crescent' : e.second ? 'bolt' : 'slash', foeEl,
          e.harm ? 1.5 : e.crit ? 1.35 : 1.15);
        fxHit(foeEl, e.harm || e.crit);
        fxFloat(foeEl, e.harm ? `일격 ${v}` : e.crit ? `${v}!` : v, e.harm ? 'harm' : e.crit ? 'crit' : '');
        if (e.harm) fxAnim(box, FX_SHAKE, 360, 'steps(6, end)');
        break;
      case 'reflect':
        fxSprite('hero', 'ring', foeEl, 1.2);
        fxHit(foeEl, false); fxFloat(foeEl, `반사 ${v}`, 'reflect');
        break;
      case 'miss':    fxLunge(heroEl, -1); fxFloat(foeEl, '빗나감', 'miss'); break;
      case 'regen':
      case 'steal':   fxFloat(heroEl, `+${v}`, 'heal'); break;
      case 'extra':   fxBanner('연속 턴!'); break;
      case 'survive': fxHit(heroEl, false); fxBanner('버텼다!'); break;
      case 'power': {
        const n = (AVATAR_POWERS[e.p] || {}).name || '';
        if (e.p === 'zeus') {
          fxSprite('hero', 'bolt', foeEl, 1.5);
          fxHit(foeEl, true); fxFloat(foeEl, `벼락 ${v}`, 'harm');
          fxAnim(box, FX_SHAKE, 300, 'steps(5, end)');
        } else if (e.p === 'hades') {
          fxHit(foeEl, true); fxAnim(box, FX_SHAKE, 360, 'steps(6, end)');
        } else if (e.p === 'heracles' || e.p === 'cthulhu') {
          fxFloat(heroEl, '다시', 'heal');
        }
        fxBanner(`${n}!`);
        break;
      }
    }
  } else if (e.who === 'ally') {                          // 함께 가는 동료 — 내 옆에서 한 번 더
    const allyEl = $('btAlly');
    if (e.k === 'hit') { fxLunge(allyEl, -1); fxSprite('hero', 'slash', foeEl, 0.9); fxHit(foeEl, false); fxFloat(foeEl, v, 'ally'); }
    else if (e.k === 'heal') fxFloat(heroEl, `+${v}`, 'heal');
    else { fxLunge(allyEl, -1); fxFloat(foeEl, '빗나감', 'miss'); }
  } else {
    switch (e.k) {
      case 'hit':
        fxLunge(foeEl, 1);
        // 상대의 성격에 따라 할퀴기 · 타격 · 바위 · 흙먼지 · 반짝임 · 수정 가시 (fx.js 의 FOE_BY_ARCH)
        // 내 초상은 작아서 이펙트를 초상보다 크게 (폭의 2.4배, 치명타면 2.8배) 띄웁니다
        fxSprite('foe', typeof FX === 'undefined' ? '' : FX.foeAnimFor(battle && battle.r.enemy), heroEl, e.crit ? 2.8 : 2.4);
        fxHit(heroEl, e.crit);
        fxFloat(heroEl, e.crit ? `${v}!` : v, e.crit ? 'crit hurt' : 'hurt');
        if (e.crit) fxAnim(box, FX_SHAKE, 300, 'steps(5, end)');
        break;
      case 'miss':  fxLunge(foeEl, 1); fxFloat(heroEl, '빗나감', 'miss'); break;
      case 'block': fxLunge(foeEl, 1); fxFloat(heroEl, '막음', 'block'); break;
    }
  }
}

function paintBattle() {
  if (!battle) return;
  // 그 사이 결과를 닫았거나 다른 회차로 넘어갔으면 그만둡니다
  if (!State.run || State.run.lastResult !== battle.r) { stopBattle(); return; }
  if (!$('battle')) { renderJourney(); return; }     // 화면만 다시 그려졌으면 카드부터 다시
  const { r, i } = battle;
  const log = r.replay.log;
  const last = i > 0 ? log[i - 1] : null;
  const heroHp = last ? last.hp : r.replay.heroMax;
  const foeHp = last ? last.fhp : r.replay.foeMax;
  $('btFoeFill').style.width = hpPct(foeHp, r.replay.foeMax);
  $('btHeroFill').style.width = hpPct(heroHp, r.replay.heroMax);
  $('btFoeHp').textContent = `${fmt(Math.max(0, foeHp))} / ${fmt(r.replay.foeMax)}`;
  $('btHeroHp').textContent = `${fmt(Math.max(0, heroHp))} / ${fmt(r.replay.heroMax)}`;

  // 최근 몇 줄. 턴이 바뀌는 줄 앞에는 턴 번호를 붙입니다.
  const from = Math.max(0, i - battleLines());
  let html = '';
  for (let k = from; k < i; k++) {
    const e = log[k];
    const { cls, text } = battleLine(e, r.enemy.name);
    const newTurn = k === 0 || log[k - 1].t !== e.t;
    html += `<div class="bt-line ${cls} ${k === i - 1 ? 'fresh' : ''}">
      <span class="bt-turn">${newTurn ? `${e.t}턴` : ''}</span>${text}</div>`;
  }
  if (i >= log.length) {
    html += `<div class="bt-line ${r.win ? 'b-win' : 'b-lose'}"><span class="bt-turn"></span>${r.win
      ? `${r.enemy.name}${josa(r.enemy.name, '이', '가')} 쓰러졌다`
      : '쓰러졌다…'}</div>`;
  }
  $('btLog').innerHTML = html;
}

// ---------- 전투 결과 ----------
function resultCard(r, run) {
  const foe = r.enemy;
  const K = KINDS[foe.kind];

  // 경험치가 어디서 얼마나 불었는지
  const mults = [];
  if (r.gap > 1.01)   mults.push(`격차 ×${r.gap.toFixed(2)}`);
  if (r.auraXp > 1)   mults.push(`${r.aura.name} ×${r.auraXp}`);
  if (r.bossM > 1.01) mults.push(`삼킨 격 ×${r.bossM.toFixed(1)}`);

  const lines = [];
  if (r.win) {
    lines.push(row('경험치', `+${fmt(r.xp)}`, mults.length ? mults.join(' · ') : ''));
    if (r.gold) lines.push(row('골드', `+${fmt(r.gold)}`));
    // 들고 나갈 것 — 그 격의 핵(모든 몬스터), 짐승이면 제 재료도. 오른쪽에 가진 수
    if (r.mats && r.mats.length) lines.push(row('재료', r.mats.map(m => `${m.mat.icon} ${m.mat.core ? '핵' : m.mat.name} +${fmt(m.n)}`).join(' · '), `가진 것 ${r.mats.map(m => fmt(matsOf(m.mat.id))).join(' · ')}`));
    const lvFinal = r.levelsGained > 0 ? `Lv.${fmtLevel(r.levelBefore)} → Lv.${fmtLevel(run.level)}` : `Lv.${fmtLevel(run.level)}`;
    lines.push(row('레벨', `<span id="resLv" data-final="${lvFinal}">${lvFinal}</span>`, r.levelsGained > 0 ? `+${fmtLevel(r.levelsGained)}` : ''));
    // 경험치 바 — 위쪽 지역 창이 빠진 대신 여기서 차오릅니다 (paintLevel 이 resXpFill 도 움직입니다)
    lines.push(`<div class="je-xp res-xp"><div class="je-xp-fill" id="resXpFill" style="width:${Math.min(100, run.xp / xpToNext(run.level) * 100)}%"></div></div>`);
    // 설명 글은 뺐습니다 — 값만 보고 알 수 있게 적습니다 (삼킨 격은 다음 회차부터 붙으니 「시작 에너지」)
    if (r.devoured > 0) lines.push(row('삼킨 격', `시작 에너지 +${r.devoured}`));
    if (r.refund > 0) lines.push(row('에너지', `+${r.refund}`));
    if (r.openedSpecial) lines.push(row('특수장비 칸', `열렸다 ${r.openedSpecial}/${SPECIAL_SLOT_MAX}`));
  } else {
    lines.push(row('에너지', `−${r.penalty}`, `남은 ${run.energy}`));
  }

  // 전리품은 **결과가 뜬 다음에** 하나씩 튀어나옵니다.
  // 같이 떠버리면 그냥 글자 줄이지만, 한 박자 늦게 나오면 "뭔가 떨어졌다" 가 됩니다.
  // 늦추는 시간은 renderJourney 가 끝난 뒤 revealDrops() 가 붙여줍니다.
  // 이미 튀어나온 것은 결과 화면을 다시 그려도(분배 창을 열 때 등) 다시 튀지 않습니다.
  //
  // 글자만으로는 뭘 얻었는지 한눈에 안 들어와서 물건의 모습을 함께 둡니다 —
  // 전리품 탭과 같은 아이콘입니다 (지금은 이모지, 나중에 그림이 들어올 자리).
  // 조우 화면의 남은 전리품 칸처럼 가로로 늘어놓습니다 (한 번에 많아야 둘 — game.js 의 DROP_MAX).
  // 「빼앗은 것 N」 제목 줄은 뺐습니다 — 칸이 보이니 없어도 알고, 폰에서 「낀다」까지 스크롤 없이 보이게 (사용자 결정).
  const fx = State.meta.settings.dropFx;
  const shown = dropsShown.get(r) || 0;
  const drops = r.win && r.drops.length
    ? `<div class="res-drops">
         <div class="res-drop-list" style="grid-template-columns:repeat(${Math.min(3, r.drops.length)}, minmax(0, 1fr))">
         ${r.drops.map((d, i) => dropCard(d, i, fx && i >= shown)).join('')}
         </div>
       </div>`
    : '';

  return `
    <div class="result ${r.win ? 'win' : 'lose'} ${run.over ? '' : 'has-alloc'}">
      <div class="res-head">${r.win ? '승리' : '패배'}</div>
      ${run.over ? '' : `<button id="toAllocBtn" class="btn tiny res-alloc">스탯 분배${run.unspent > 0 ? '<span class="alloc-pip on"></span>' : ''}</button>`}
      <div class="res-foe">
        <span class="res-icon">${foeIcon(foe)}</span>
        ${r.aura ? `<span class="aura-tag" style="--aura:${r.aura.color}">${r.aura.name}</span>` : ''}
        ${foe.kind !== 'normal' ? `<span class="grade-tag ${foe.kind}">${K.name}</span>` : ''}
        ${foe.name}<span class="lv">Lv.${fmtLevel(foe.level)}</span>
        <span class="res-turns">${r.turns}턴</span>
      </div>
      ${r.avatarGained ? `<div class="res-avatar"><span class="avatar-tag">${avatarTitle(foe)}</span>${josa(avatarTitle(foe), '이', '가')} 되었다</div>` : ''}
      ${r.openedPath && foe.id === WALL_BOSS
        ? `<div class="res-path exit ${wallMoments.has(r) ? '' : 'late'}">나가는 길도 열렸다.</div>` : ''}
      <div class="res-lines">${lines.join('')}</div>
      ${drops}
      <div class="res-actions">
        <button id="continueBtn" class="btn primary thumb">${run.over ? '여정을 마친다' : '계속한다'}${KEY_HINT}</button>
        ${gearJumpButton(r)}
      </div>
    </div>`;
}

// 처음 보는 것을 얻었을 때만 나오는 버튼.
// 분해된 것은 이미 아는 물건이라 확인하러 갈 이유가 없으니 뺍니다
// (NEW! 표시를 켜는 기준과 같습니다 — rollDrops 의 isNew).
//
// 한 부위만 새로 얻었으면 그 부위 이름을 그대로 적어줍니다.
// 어디로 가는지 알고 누르는 편이, 눌러보고 아는 것보다 낫습니다.
// 결과의 새 전리품 — 지금 그 부위에 낀 것과 견준 ▲▼ 와 「낀다」 한 번 (부위 창까지 가지 않고 그 자리에서, 사용자 결정).
// 알아서 갈아끼우지는 않습니다 — 고르는 건 내 몫. 이미 끼고 있으면 「끼는 중」.
// 특수장비는 열린 빈 칸이 있을 때만 (어느 칸에 낄지 고를 일이 없을 때) — 아니면 아래 「보러 간다」로.
// 얻은 것 한 칸 — 물건의 모습 · 이름 · 부위 · 얻은 방식, 새것이면 「낀다」 (결과 창 · 보물상자 창이 같이 씀)
function dropCard(d, i, veiled) {
  return `
           <div class="res-drop ${veiled ? 'veiled' : ''} ${d.isNew ? 'is-new' : 'is-stone'}" data-drop="${i}">
             <span class="res-art ${d.item.grade !== 'normal' ? `g-${d.item.grade}` : ''}"><span class="res-art-ic">${itemArt(d.item)}</span></span>
             <span class="res-body">
               <span class="res-name">${d.item.grade !== 'normal' ? `<span class="grade-tag ${d.item.grade}">${KINDS[d.item.grade].name}</span>` : ''}${d.item.name}</span>
               <span class="res-meta">
                 <span class="res-slot">${SLOT_NAMES[d.item.slot]}</span>
                 <span class="res-tag">${d.isNew ? '새로 얻음' : `분해 · ${pxIcon('stone')}강화석 +${fmt(d.stones)}`}</span>
                 ${d.autoWorn ? '<span class="res-tag worn-now">바로 착용</span>' : ''}
               </span>
               ${d.isNew && !d.autoWorn ? dropWear(d.item) : ''}
             </span>
           </div>`;
}

// ---------- 보물상자 창 — 지도의 상자에 닿으면 (game.js 의 openChest) ----------
// 골드 · 강화석(어느 부위로 들어갔는지) · 상자 전용 장비(결과 창과 같은 칸 — 「낀다」). 닫으면 지도로
let chestShown = null;
function showChest(r) {
  chestShown = r;
  const lines = [];
  if (r.gold) lines.push(row('골드', `+${fmt(r.gold)}`));
  if (r.stones) lines.push(row(`${pxIcon('stone')}강화석`, `+${fmt(r.stones.n)}`, SLOT_NAMES[r.stones.slot]));
  $('chestBody').innerHTML = `
    <div class="res-lines">${lines.join('')}</div>
    ${r.drop ? `<div class="res-drop-list" style="grid-template-columns:minmax(0, 1fr)">${dropCard(r.drop, 0, false)}</div>` : ''}
    <div class="chest-actions"><button class="btn primary" id="chestOkBtn">닫는다</button></div>`;
  $('chestOkBtn').addEventListener('click', closeChest);
  for (const b of $('chestBody').querySelectorAll('[data-wear]')) {
    b.addEventListener('click', () => {
      const item = getItem(b.dataset.wear);
      if (!item) return;
      equip(item.id, b.dataset.wslot);
      unfreshItem(item);
      Sound.play('equip');
      render();
      showChest(chestShown);                                 // 「끼는 중」으로
    });
  }
  $('chestModal').classList.remove('hidden');
}
function closeChest() {
  chestShown = null;
  const m = $('chestModal');
  if (m) m.classList.add('hidden');
  render();
}
function isChestOpen() {
  const m = $('chestModal');
  return !!m && !m.classList.contains('hidden');
}

// ---------- 도시로 나가기 — 지하수로 첫 공간의 이상한 게이트에 닿으면 ----------
// 나가면 이번 회차가 끝나므로(game.js 의 leaveSpace) 한 번 묻습니다. 그만두면 그 자리에서 다시 걷습니다
function askLeave() {
  const m = $('leaveModal');
  const g = Math.floor(num(State.meta.gold)), lg = $('leaveGold');
  if (lg) lg.innerHTML = g > 0 ? `가진 <b>골드 ${fmt(g)}</b>은(는) 사라진다 — 패시브를 사고 나가자 (스탯 창)` : '';
  if (m) m.classList.remove('hidden');
}
function closeLeave() {
  const m = $('leaveModal');
  if (m) m.classList.add('hidden');
  render();
}
function isLeaveOpen() {
  const m = $('leaveModal');
  return !!m && !m.classList.contains('hidden');
}
function confirmLeave() {
  $('leaveModal').classList.add('hidden');
  fadeThrough(() => { leaveSpace(); });     // 화면이 까매졌다가 끝 화면 (다음 회차는 도시에서)
}

// 결과 창에서는 달라지는 능력치를 앞의 둘까지만 — 나머지는 「…」 (다 보려면 부위 창). 「낀다」가 스크롤 없이 보이게
const RES_DIFF_MAX = 2;
function dropWear(item) {
  if (equippedSlotOf(item.id)) return '<span class="res-tag worn-now">끼는 중</span>';
  const to = item.slot === 'special' ? SPECIAL_SLOT_IDS.find(s => isSlotOpen(s) && !State.meta.equipped[s]) : item.slot;
  if (!to || !isSlotOpen(to)) return '';
  const worn = getItem(State.meta.equipped[to]);
  return `<span class="res-diff">${itemDiffText(item, worn, slotMult(to), RES_DIFF_MAX)}</span>
    <button class="btn tiny res-wear" data-wear="${item.id}" data-wslot="${to}">낀다</button>`;
}

function gearJumpButton(r) {
  if (!r.win || !r.drops) return '';
  const fresh = r.drops.filter(d => d.isNew);
  if (!fresh.length) return '';

  const slots = [...new Set(fresh.map(d => d.item.slot))];
  const label = slots.length === 1
    ? `새 ${SLOT_NAMES[slots[0]]} 보러 간다`
    : `새 전리품 ${fresh.length}개 보러 간다`;
  // 특수장비는 칸이 넷이라 열린 첫 칸으로 데려갑니다 (아직 하나도 안 열렸으면 첫 칸 — 닫힌 채로 보입니다)
  const go = slots[0] === 'special' ? (SPECIAL_SLOT_IDS.find(isSlotOpen) || SPECIAL_SLOT_IDS[0]) : slots[0];
  return `<button id="toGearBtn" class="btn" data-goslot="${go}">${label}</button>`;
}

function row(k, v, note) {
  return `<div class="res-row">
    <span class="res-k">${k}</span>
    <span class="res-v">${v}</span>
    <span class="res-note">${note || ''}</span>
  </div>`;
}

// 이 적에게서 뭘 더 빼앗을 게 남았는지.
// 승률 바로 아래에 가로로 늘어놓습니다 — 셋이면 3등분, 둘이면 2등분.
// 그림과 이름만 둡니다. 능력치는 어차피 전리품 탭에서 보니까요.
//
// "다 모았다" 를 알 수 있어야 **이 녀석을 또 잡을 이유가 있는지** 판단이 섭니다.
function dropStrip(foe) {
  const table = dropTable(foe.id), mat = MATERIALS[foe.mat];
  if (!table.length) return '';
  const left = table.filter(i => !owns(i.id)).length;
  // 글자로 설명하지 않습니다 — ???? 칸이 남아 있는지만 보면 됩니다.
  // 재료를 주는 몬스터는 맨 앞에 재료 칸(가진 수) — 그 뒤의 칸은 그 재료로 만드는 것입니다
  const matCell = mat ? `
            <div class="ed-item mat">
              <span class="ed-ic">${mat.icon}</span>
              <span class="ed-name">${mat.name} ${fmt(matsOf(mat.id))}</span>
            </div>` : '';
  return `
    <div class="enc-drops ${left === 0 ? 'done' : ''}">
      <div class="ed-list" style="grid-template-columns:repeat(${table.length + (mat ? 1 : 0)}, minmax(0, 1fr))">
        ${matCell}${table.map(it => {
          const have = owns(it.id);
          return `
            <div class="ed-item ${have ? 'have' : 'miss'}">
              <span class="ed-ic">${have ? itemArt(it) : '?'}</span>
              <span class="ed-name">${have ? it.name : '????'}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

// 마주한 적 카드 — 위에서부터 이름 · 레벨 · 느낌 한 줄, 초상(큰 그림), 남은 전리품, 맞선다 / 물러선다.
// 설명은 레벨과 「잡기 쉬울 것 같다」 같은 한 줄만 둡니다 — 스탯 · 경험치 · 전리품 확률 · 졌을 때의 에너지는 뺐습니다.
// 초상은 지금은 이모지입니다. 나중에 그림이 들어올 자리.
// noRetreat — 몬스터가 먼저 덤벼든 조우: 「물러선다」 없이 맞서기만 (사용자 결정)
function encounterCard(foe, hero, aura, noRetreat) {
  const chance = winChance(hero, foe);
  const style = aura ? `style="--aura:${aura.color}"` : '';

  return `
    ${aura ? `<div class="aura-banner" ${style}>✦ ${aura.name} 기운 — ${aura.desc} ✦</div>` : ''}
    <div class="encounter k-${foe.kind} ${aura ? 'auraed' : ''}" ${style}>
      <div class="enc-desc">
        <div class="enc-name">
          ${aura ? `<span class="aura-tag">${aura.name}</span>` : ''}${foe.kind !== 'normal' ? `<span class="grade-tag ${foe.kind}">${KINDS[foe.kind].name}</span>` : ''}${foe.name}<span class="lv">Lv.${fmtLevel(foe.level)}</span>
        </div>
        <div class="enc-chance chance-value ${winFeelClass(chance)}">${winFeel(chance)}</div>
      </div>
      <!-- 상대와, 그 아래 상대를 마주 본 나 — 싸움 화면(battleCard)과 같은 늘어놓음이라 「맞선다」를 눌러도 튀지 않습니다 -->
      <div class="enc-arena">
        <div class="portrait enc-portrait"><span class="portrait-ic">${foeIcon(foe)}</span></div>
        <div class="portrait enc-hero">${heroSprite()}${allyNow() ? `<span class="bt-ally">${allySprite()}</span>` : ''}</div>
      </div>
      ${dropStrip(foe)}
    </div>
    <!-- 넓은 화면에서는 맞선다 위 · 물러선다 아래로 쌓고,
         폰에서는 화면 아래 붙박인 띠에 물러선다(왼쪽 작게) · 맞선다(오른쪽 크게)를 나란히 둡니다 -->
    <div class="enc-actions thumb-bar ${noRetreat ? 'solo' : ''}">
      <button id="engageBtn" class="btn primary big"><span class="btn-line">맞선다${KEY_HINT}</span></button>
      ${noRetreat ? '' : '<button id="retreatBtn" class="btn">물러선다</button>'}
    </div>`;
}

// 승률을 한 번 재면 같은 상대 · 같은 몸(스탯이 그대로)인 동안은 다시 굴리지 않습니다.
// 정예 묶음이 들어오며 한 지역의 정해진 자리가 열셋까지 늘어, 그릴 때마다 자리마다 200판씩 돌리면 폰이 버벅입니다.
const chanceMemo = new Map();
function winChanceMemo(hero, foe, samples) {
  const key = `${foe.id}|${samples || 200}|${JSON.stringify(hero)}`;
  if (chanceMemo.has(key)) return chanceMemo.get(key);
  if (chanceMemo.size > 400) chanceMemo.clear();
  const c = winChance(hero, foe, samples);
  chanceMemo.set(key, c);
  return c;
}

// 화신이 데려다 준다 — 맨 처음 1격에서만, 무명의 화신이 아닌 진짜 화신을 삼았을 때 (갈림길 · 지도 위 둘 다)
function warpButton() {
  const av = canAvatarWarp() ? getEnemy(State.meta.avatar) : null;
  if (!av) return '';
  const zone = ZONES[warpZoneIndex()];
  return `
      <button id="warpBtn" class="btn warp-btn">
        <span class="btn-line">${avatarTitle(av)}${josa(avatarTitle(av), '이', '가')} 데려다 준다</span>
        <span class="cost">제${zone.rank}격 · ${zone.name} — 에너지 0</span>
      </button>`;
}

// ============================================================
//  월드맵 — 걷다가 닿으면 조우 · 싸움 · 결과 창이 지도 위에 뜹니다
// ============================================================
// 지도 캔버스는 index.html 의 #mapStage 에 화면 가득 늘 붙어 있고(다시 그릴 때 지워지지 않게), 창만 #mapOverlay 에 그립니다.
// 지도는 여러 장(maps/*.tmj) — 1~6격의 overworld, 문의 광장(hub), 7격부터의 일곱 장. 장 사이는 문(ports)으로 오갑니다.
// 스무 지역이 모두 어느 한 장 위에 있습니다 (tests/map.test.js 가 지킵니다).
let mapView = null, maps = null, zoneMap = null;   // 읽은 지도들(id → 지도), 지역 id → 그 지역이 있는 지도 id
let mapKey = '', mapZone = -1, mapShown = null;    // 지금 걷는 세계가 어느 칸 · 여정 · 지역 · 지도 것인가
let closedSaidAt = 0;

function initMap() {
  if (mapView || typeof MAP_FILES === 'undefined' || !$('mapCanvas')) return;
  maps = {};
  zoneMap = {};
  for (const [id, tmj] of Object.entries(MAP_FILES)) {
    maps[id] = MapRules.parseTiled(tmj, id);
    for (const a of maps[id].areas) if (a.zone) zoneMap[a.zone] = id;
  }
  mapView = MapView.create({
    canvas: $('mapCanvas'),
    stick: $('mapStick'),
    hooks: MapView.gameHooks(),
    tag: MapView.gameTag,
    paused: mapPaused,
    marks: mapMarks,
    onEvents: onMapEvents,
    hideActors: () => document.body.classList.contains('facing')   // 조우 · 싸움 · 결과 창이 떠 있으면 땅만
  });
}

// 지금 걷는 지도 (null 이면 지도를 못 읽은 것)
// 회차에 적힌 지도를 따르되, 걷지 않고 지역이 바뀌었으면(화신이 데려다 줌 · 관리자) 그 지역이 있는 지도로 바꿉니다.
function currentMapId() {
  initMap();
  const run = State.run;
  if (!run || !maps) return null;
  const same = mapKey === `${currentSlot}|${State.meta.runCount}`;
  // 불러온 회차의 지도에 지금 지역이 없으면 그 지역이 있는 지도로 (지역이 없는 문의 광장은 그대로) —
  // 1격이 지하수로(sewer) 지도로 옮겨 가기 전, overworld 의 1격에서 저장한 회차
  const zoneId = ZONES[run.zoneIndex].id, saved = maps[run.mapId];
  const stale = !same && saved && saved.areas.some(a => a.zone) && !saved.areas.some(a => a.zone === zoneId);
  if ((same && run.zoneIndex !== mapZone) || !saved || stale) run.mapId = zoneMap[zoneId] || null;
  return run.mapId;
}
function onMapZone() { return !!currentMapId(); }
// 도시에 서 있나 — 옛 동네 · 헌터들의 도시(props.city) · 가게 안(props.store). 도시에서는 머리 위에 가진 돈이 보입니다
function inTown() {
  const id = currentMapId(), p = id && maps[id] && maps[id].props;
  return !!p && !!(p.city || p.store);
}

// 지역 머리의 이름 — 지역이 없는 지도(문의 광장)에서는 그 지도의 이름
function placeName(zone) {
  const id = currentMapId();
  return (id && maps[id].props.title) || zone.name;
}

// 창이 떠 있는 동안은 지도도 멈춥니다 — 쫓아오던 것도 그 자리에
function mapPaused() {
  const run = State.run;
  const up = id => { const el = $(id); return !!el && !el.classList.contains('hidden'); };
  return !run || run.over || !!run.encounter || !!run.lastResult || !!battle || fading || !onMapZone()
    || document.body.dataset.tab !== 'journey'   // 메뉴 서랍이 열려 있는 동안
    || isAnyModalOpen() || up('title') || up('talk');
}

// 그 지도에서 그 지역의 들머리 — 가장 약한 일반의 구역 들머리(구역 한가운데, map.js 의 areaMid). 첫 지역이거나 지역이 없는 지도(문의 광장)면 그 지도의 시작점.
function mapEntrance(data, zi) {
  const weakest = zi > 0 && ENEMIES.find(e => e.zoneIndex === zi && e.kind === 'normal');
  const a = weakest && data.areas.find(x => x.monster === weakest.id);
  return a ? { x: a.mid.x, y: a.mid.y } : data.start;
}

// 저장해 둔 칸 — 지도 안의 걸을 수 있는 칸이고, 그 칸의 지역이 지금 지역과 맞을 때만 (구역 밖 길 위면 그대로 믿습니다).
// 정해진 자리 안이면 버림 — 지도를 다시 뽑아 자리가 커졌을 때 그 몸 안에서 시작해 걸을 때마다 부딪히지 않게
function savedMapAt(run, data) {
  const at = run.mapAt;
  if (!at || !(at.x >= 0 && at.y >= 0 && at.x < data.w && at.y < data.h)) return null;
  const k = at.y * data.w + at.x;
  if (data.solid[k] || MapRules.postAt({ map: data, hooks: { postAlive: () => true } }, at.x, at.y)) return null;
  const a = data.areaAt[k] >= 0 ? data.areas[data.areaAt[k]] : null;
  const zi = a ? (a.zone ? ZONES.findIndex(z => z.id === a.zone) : 0) : run.zoneIndex;
  return zi === run.zoneIndex ? { x: at.x, y: at.y } : null;
}

// 새 여정 · 불러오기면 서 있던 칸에서(없으면 들머리), 걷지 않고 지역이 바뀌었으면(관리자) 그 지역 들머리에서 다시 세웁니다
function syncMap() {
  const run = State.run, id = currentMapId(), data = maps[id];
  const key = `${currentSlot}|${State.meta.runCount}`;
  if (key === mapKey && id === mapShown && run.zoneIndex === mapZone) return;
  enterMap(data, (key !== mapKey && savedMapAt(run, data)) || mapEntrance(data, run.zoneIndex));
  mapKey = key;
}

// 몬스터는 회차에 한 번 정해집니다 — 떠나는 지도(같은 회차일 때만)의 몬스터를 회차에 적어 두고, 들어서는 지도는 적어 둔 것으로 되살립니다.
// 처음 들어서는 지도면 모든 구역에 새로 섭니다. 코앞에 선 것은 map.js 가 제 구역의 먼 칸으로 옮깁니다.
function enterMap(data, at) {
  const run = State.run, w0 = mapView.world;
  if (w0 && mapKey === `${currentSlot}|${State.meta.runCount}`) {
    run.mapMobs = { ...(run.mapMobs || {}), [w0.map.id]: packMobs(w0.mobs, w0.encounter && w0.encounter.mob) };
  }
  const keep = unpackMobs(run.mapMobs && run.mapMobs[data.id]);
  if (keep && !run.encounter) for (const k of keep) k.fighting = false;   // 조우가 끝난 뒤라면 그냥 서 있는 몬스터
  mapView.start(data, at, undefined, keep);
  mapShown = data.id;
  mapZone = run.zoneIndex;
}

// 저장할 때 지금 걷는 지도의 몬스터 (game.js 의 saveRun) — 화면의 지도가 이 회차 · 이 지도 것일 때만
liveMapMobs = () => {
  const w = mapView && mapView.world, run = State.run;
  if (!w || !run || mapKey !== `${currentSlot}|${State.meta.runCount}` || w.map.id !== run.mapId) return null;
  return { id: w.map.id, mobs: w.mobs, fighting: w.encounter && w.encounter.mob };
};

// 문으로 다른 지도에 — 닿는 곳은 그 지도의 같은 이름 문 바로 앞 (예: hub.overworld = 문의 광장의 「마왕의 성으로」 문 앞).
// 그 지도가 없으면(손으로 지운 경우 등) 문에 적힌 지역(zone)으로 건너가 그 지역이 있는 지도의 들머리에 섭니다.
function goThroughPort(port) {
  const run = State.run;
  const [id, door] = port.to.split('.');
  const data = maps[id];
  Sound.play('zoneMove');
  if (!data) {
    run.mapId = null;
    walkIntoZone(ZONES.findIndex(z => z.id === port.zone));
    mapZone = run.zoneIndex;
    mapShown = null;
    return;
  }
  const target = data.ports.find(p => p.name === door);
  const at = target ? doorStep(data, target) : data.start;
  // 닿는 칸이 어느 지역의 구역이면(그 장의 어귀) 곧바로 그 지역 — 한 발짝 걷기 전에도 지역 머리가 맞게
  const k = data.areaAt[at.y * data.w + at.x], a = k >= 0 ? data.areas[k] : null;
  if (a && a.zone) walkIntoZone(ZONES.findIndex(z => z.id === a.zone));
  run.mapId = id;
  enterMap(data, at);                  // 떠나온 지도의 몬스터를 회차에 적은 뒤에 저장하도록 먼저
  rememberMapAt(at.x, at.y, true);
}

// 지도를 옮길 때 — 화면을 까맣게 덮고(FADE_MS) 그동안 옮긴 뒤 다시 밝힘. 덮여 있는 동안 지도는 멈춥니다 (mapPaused)
const FADE_MS = 260;
let fading = false;
function fadeThrough(fn) {
  const el = $('fade');
  if (!el || fading) { fn(); return; }
  fading = true;
  el.classList.add('on');
  setTimeout(() => {
    fn();
    render();
    requestAnimationFrame(() => { el.classList.remove('on'); fading = false; });
  }, FADE_MS);
}

// 문 바로 앞의 걸을 수 있는 칸 (아래 · 위 · 오른쪽 · 왼쪽 순) — 들어서자마자 도로 나가지 않게 문 위가 아니라 그 앞.
// 아직 서 있는 정예 · 보스의 몸 위는 빼고 (보스 뒤 구멍으로 거꾸로 들어오면 — 그런 칸이 없으면 그 지도의 시작점)
function doorStep(data, port) {
  const inRect = (p, x, y) => x >= p.x && y >= p.y && x < p.x + (p.w || 1) && y < p.y + (p.h || 1);
  const alive = MapView.gameHooks().postAlive;
  const inPort = (x, y) => data.ports.some(p => inRect(p, x, y));
  const free = (x, y) => x >= 0 && y >= 0 && x < data.w && y < data.h && !data.solid[y * data.w + x] && !inPort(x, y)
    && !data.posts.some(p => inRect(p, x, y) && alive(p.enemy));
  // 지도 가장자리 통로(옛 동네 ⇄ 도시)는 통로 안쪽(arrive 쪽) 가운데 줄부터 — 넘어오자마자 도로 넘어가지 않게
  if (port.arrive === 'left' || port.arrive === 'right') {
    const x = port.arrive === 'left' ? port.x - 1 : port.x + port.w, mid = port.y + (port.h >> 1);
    for (const y of [mid, ...Array.from({ length: port.h }, (_, i) => port.y + i)]) if (free(x, y)) return { x, y };
  }
  for (let x = port.x; x < port.x + port.w; x++) {
    if (free(x, port.y + port.h)) return { x, y: port.y + port.h };
    if (free(x, port.y - 1)) return { x, y: port.y - 1 };
  }
  for (let y = port.y; y < port.y + port.h; y++) {
    if (free(port.x + port.w, y)) return { x: port.x + port.w, y };
    if (free(port.x - 1, y)) return { x: port.x - 1, y };
  }
  return data.start;
}

function onMapEvents(evs) {
  const run = State.run, p = mapView.world.player;
  let changed = false;
  for (const e of evs) {
    if (e.type === 'area') {
      const zi = e.area.zone ? ZONES.findIndex(z => z.id === e.area.zone) : 0;   // 첫 공간은 1격 자리
      const moved = zi >= 0 && zi !== run.zoneIndex;
      rememberMapAt(p.x, p.y, !moved);   // 지역이 바뀌면 walkIntoZone 이 같이 저장합니다
      if (moved) { walkIntoZone(zi); changed = true; }
    } else if (e.type === 'contact') {
      rememberMapAt(p.x, p.y, false);    // meetOnMap 이 같이 저장합니다
      const id = e.mob ? e.mob.monster : e.post.enemy;
      if (meetOnMap(id, e.mob ? e.mob.aura : null, e.first)) soundEncounter();
      else mapView.resolve('retreat');   // 에너지가 모자라 여정이 끝났다
      changed = true;
    } else if (e.type === 'merchant') {
      // 와 있는 떠돌이 상인에게 닿으면 상점 — 상인 자리가 구역 밖 길 위라 지역이 아직 안 바뀌었으면 그 지역으로
      if (run.merchant && run.zoneIndex !== run.merchant.zone) walkIntoZone(run.merchant.zone);
      Sound.play('encounter');
      openShop();
      changed = true;
    } else if (e.type === 'shop' && e.npc.shop === 'ally') {
      if (allyWaiting() && !isTalkOpen()) playTalk(ALLY_MEET, () => { if (joinAlly('hayun')) Sound.play('rankUp'); render(); }, { end: '같이 가자' });
      changed = true;
    } else if (e.type === 'shop') {
      Sound.play('encounter');           // 가게 점원에게 닿으면 그 매장의 상점 창 (헌터백화점)
      openShop(e.npc.shop);
      changed = true;
    } else if (e.type === 'chest') {
      const got = openChest(e.chest);
      if (got) { Sound.play('drop'); showChest(got); }
      changed = true;
    } else if (e.type === 'port' && e.port.to && e.port.needsCity) {
      askLeave();                          // 그 공간에서 도시로 나가는 게이트 — 나가면 회차가 끝나므로 한 번 묻습니다
      changed = true;
      break;
    } else if (e.type === 'port' && e.port.to) {
      fadeThrough(() => goThroughPort(e.port));   // 화면이 까매졌다가 다음 지도의 문(구멍) 앞에서 밝아짐
      changed = true;
      break;                             // 남은 일은 떠나온 지도의 것
    } else if (e.type === 'closed' && e.port.unlock === 'guild') {
      if (Date.now() - closedSaidAt > 2000) {
        closedSaidAt = Date.now();
        if (guildLevel() >= 4) pushLog('info', '옛 사무실 — 문을 잠가 두었다. 길드는 이제 헌터들의 도시 한가운데에 있다.');
        else if (guildForSale()) { if (!isShopOpen()) { Sound.play('encounter'); openShop('guild'); } }
        else pushLog('info', '빈 건물 — 셔터가 내려져 있다. 바랜 「임대」 종이가 붙어 있다.');
      }
      changed = true;
    } else if (e.type === 'closed' && e.port.unlock === 'guildCity') {   // 미래 도시 가운데 빈터 — 4단계 전
      if (Date.now() - closedSaidAt > 2000) {
        closedSaidAt = Date.now();
        pushLog('info', guildOwned() ? '가림막 친 빈터 — 길드를 4단계로 올리면 여기에 새 건물을 짓는다.' : '가림막 친 빈터다. 「공사 예정」.');
      }
      changed = true;
    } else if (e.type === 'closed' && Date.now() - closedSaidAt > 2000 && e.port.unlock === 'armor') {
      closedSaidAt = Date.now();
      const boss = zoneBoss(ZONES.findIndex(z => z.rank === 1));
      pushLog('info', `${e.port.label} — 아직 줄이 쳐져 있다. 「준비 중」. ${boss ? `제1격의 보스 ${boss.name}${josa(boss.name, '을', '를')} 꺾으면 열린다고 한다.` : ''}`);
      changed = true;
    } else if (e.type === 'closed' && Date.now() - closedSaidAt > 2000) {
      closedSaidAt = Date.now();
      const boss = getEnemy(e.port.opensAfter);
      pushLog('info', `${e.port.label || e.port.name} — 닫혀 있다. ${boss.name}${josa(boss.name, '을', '를')} 꺾어야 열린다.`);
      changed = true;
    }
  }
  mapZone = run.zoneIndex;
  if (changed) render();
}

// 지도 위에 얹는 사람들 — 떠돌이 상인이 서 있는 칸(지금 지도에 그 지역이 있으면) · 가게 점원. 닿으면 상점 (map.js 의 merchant · shop 사건)
function mapMarks() {
  const npcs = mapView.world.map.npcs, out = [];
  const m = State.run && State.run.merchant;
  const z = m && ZONES[m.zone];
  const spot = z && npcs.find(n => n.name === 'merchant' && n.zone === z.id);
  if (spot) out.push({ x: spot.x, y: spot.y, icon: '🎒', label: '상인' });
  for (const n of npcs) {
    if (n.name === 'seat') {                       // 내 길드의 사무 자리 — 앉은 동료만
      const id = State.meta.guild && State.meta.guild.seats[n.seat];
      if (id && ALLIES[id]) out.push({ x: n.x, y: n.y, icon: ALLIES[id].icon, label: ALLIES[id].name });
      continue;
    }
    if (!deskHere(n.shop)) continue;
    const sec = n.shop && (DEPT_SECTIONS[n.shop] || CLERK_DESKS[n.shop]);
    if (sec) out.push({ x: n.x, y: n.y, icon: sec.icon, label: n.label || sec.name });
  }
  return out;
}

// 지도는 늘 화면 가득 — 창(조우 · 싸움 · 결과)이 뜨면 body.facing 으로 지도가 뒤로 물러나고 지도 위의 것들이 숨습니다.
// 지도를 못 읽었을 때(onMap 이 아님)도 무대의 글은 같은 자리에 뜹니다.
function renderMapLayer(onMap, frame) {
  document.body.classList.toggle('facing', !!frame);
  if (typeof MapArt !== 'undefined' && MapArt.setGuild) MapArt.setGuild(guildLevel());   // 내 길드의 겉모습 · 안의 빛깔 (단계가 바뀌면 다시 그림)
  if (onMap) syncMap();
  if (onMap && mapView.world) mapView.world.player.speedMul = passiveMult('stride');   // 패시브 「발걸음」
  // 아무도 마주하지 않으면 창 없이 지도만 — 화신 문이 있으면 위에 작게 (떠돌이 상인은 지도 위 🎒 에 닿으면 상점 — 예전 「들른다」 단추는 뺌)
  const hud = onMap && !frame ? warpButton() : '';
  $('mapOverlay').innerHTML = frame || (hud ? `<div class="map-hud">${hud}</div>` : '');
}

// 화면을 닫거나 다른 앱으로 넘어갈 때 — 서 있던 칸을 바로 저장합니다 (폰은 그 뒤로 말없이 꺼질 수 있어서)
function storeMapAt() {
  if (!mapView || !mapView.world || !State.run || mapKey !== `${currentSlot}|${State.meta.runCount}`) return;
  if (!$('title').classList.contains('hidden') || !onMapZone()) return;
  if (mapView.world.map.id !== State.run.mapId) return;   // 화면의 지도가 회차와 어긋나 있으면(다시 그리기 전) 적지 않습니다
  rememberMapAt(mapView.world.player.x, mapView.world.player.y, true);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) storeMapAt(); });
window.addEventListener('pagehide', storeMapAt);

// ---------- 승률은 숫자로 보여주지 않습니다 ----------
// 정확한 확률 대신 "느낌" 을 한 문장으로. 20% 구간마다 하나씩이고,
// 80% 위쪽만 둘로 나눴습니다 — 거의 이기는 싸움과 확실히 이기는 싸움은 갈려야 하니까요.
// 숫자가 보이면 계산을 하게 되고, 문장이 보이면 판단을 하게 됩니다.
// 속으로는 그대로 winChance 로 재고, 색(초록·노랑·빨강)도 그대로 갈립니다.
//   from — 이 값 이상이면 이 문장 (다음 줄의 from 미만까지)
//   cls  — 문장마다 다른 잉크 (빨강 → 주황 → 황토 → 올리브 → 초록 → 파랑). css 의 .feel-0 ~ .feel-5
const WIN_FEELS = [
  { from: 0.0, text: '불가능할 것 같다',     cls: 'feel-0' },   //  0~20%
  { from: 0.2, text: '이기기 힘들 것 같다',  cls: 'feel-1' },   // 20~40%
  // 40~80% 는 예전 문장(해볼 만하다 · 이길 수 있을 것 같다)이 확률에 비해 너무 쉬워 보여 한 칸씩 내렸습니다
  { from: 0.4, text: '쉽지 않을 것 같다',    cls: 'feel-2' },   // 40~60%
  { from: 0.6, text: '해볼 만하다',          cls: 'feel-3' },   // 60~80%
  { from: 0.8, text: '이길 수 있을 것 같다', cls: 'feel-4' },   // 80~90%
  { from: 0.9, text: '잡기 쉬울 것 같다',    cls: 'feel-5' }    // 90~100%
];

function winFeelOf(c) {
  const v = num(c);
  let feel = WIN_FEELS[0];
  for (const f of WIN_FEELS) if (v >= f.from) feel = f;
  return feel;
}
// 관리자 창에서 「정확한 승률」을 켜면 문장 뒤에 숫자가 붙습니다
function winFeel(c)      { return winFeelOf(c).text + (Admin.showOdds ? ` · ${Math.round(num(c) * 100)}%` : ''); }
function winFeelClass(c) { return winFeelOf(c).cls; }

function wireJourney() {
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  for (const b of document.querySelectorAll('[data-jset]')) {
    b.addEventListener('click', () => { if (fightLocked()) return; switchSet(Number(b.dataset.jset)); Sound.play('equip'); render(); });
  }
  on('rosterBtn',    openRosterModal);
  on('jAllocBtn',    openAlloc);       // 「스탯」 칸의 분배판으로
  on('hudGoldBtn',   () => { if (fightLocked()) return; showTab('stats'); render(); const f = $('passives'); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); });   // 골드 → 패시브
  const rab = $('rosterAllBtn');
  if (rab && !rab.dataset.wired) {
    rab.dataset.wired = '1';
    rab.addEventListener('click', () => {
      rosterAll = !rosterAll;
      renderRoster();
      const el = $('roster');
      if (el) el.scrollTop = 0;
    });
  }
  for (const b of document.querySelectorAll('[data-closeroster]')) {
    if (b.dataset.wired) continue;
    b.dataset.wired = '1';
    b.addEventListener('click', closeRosterModal);
  }
  on('warpBtn',      () => { if (fightLocked()) return; if (avatarWarp()) { Sound.play('zoneMove'); render(); } });
  on('engageBtn',    () => {
    // 싸우기 직전의 레벨 · 경험치 · 에너지 — 전투를 보여주는 동안은 이 값으로 그리고, 끝나면 여기서부터 올라가는 모습을 보여줍니다
    const run = State.run;
    const pre = { level: run.level, xp: run.xp, unspent: run.unspent, spent: { ...run.spent }, energy: run.energy, kills: run.kills };
    const from = logSeq;
    const r = engage();
    if (r) r.pre = pre;
    // 지도 위라면 이긴 상대는 사라지고(그 구역에 새로 하나), 지면 한 칸 밀려납니다 (보여 주는 건 싸움 창이 닫힌 뒤).
    // 곧바로 한 번 더 저장 — 다시 열었을 때 잡은 몬스터가 되살아나지 않게
    if (r && mapView) { mapView.resolve(r.win ? 'win' : 'lose'); save(); }
    startBattle(r, from);
    render();
  });   // 소리는 전투 화면이 한 줄씩 냅니다
  on('retreatBtn',   () => { if (!retreat()) return; if (mapView) mapView.resolve('retreat'); Sound.play('retreat'); render(); });
  on('continueBtn',  () => { dismissResult();  render(); });
  on('toAllocBtn',   openAlloc);       // 결과는 그대로 두고 서랍의 분배판만
  // 결과의 「낀다」 — 새로 얻은 물건을 그 자리에서 끼고, 그 물건의 NEW 표시도 끕니다
  for (const b of document.querySelectorAll('[data-wear]')) {
    b.addEventListener('click', () => {
      const item = getItem(b.dataset.wear);
      if (fightLocked() || !item) return;
      equip(item.id, b.dataset.wslot);
      unfreshItem(item);
      Sound.play('equip');
      render();
    });
  }
  on('toGearBtn',    () => {
    const slot = $('toGearBtn').dataset.goslot;
    dismissResult(); render(); spotlightGear(slot);
  });
}

// 스탯 분배 — 서랍의 「스탯」 칸을 열고 맨 위 분배판을 한 번 반짝입니다.
// 지도 위 · 결과의 「스탯 분배」가 부릅니다. 결과는 그대로 둔 채 서랍만 열리고, 닫으면 결과로 돌아옵니다.
// (예전엔 따로 창을 띄웠는데 서랍 칸 안에 바로 펼쳐 두는 쪽으로 바꿨습니다 — 사용자 결정)
function openAlloc() {
  if (fightLocked()) return;
  showTab('stats');
  render();
  const frame = $('allocFrame'), el = $('alloc');
  if (!frame || !el) return;
  frame.scrollIntoView({ block: 'start', behavior: 'smooth' });
  el.classList.remove('spotlight');
  void el.offsetWidth;            // 애니메이션 재시작용
  el.classList.add('spotlight');
}

// 방금 얻은 전리품이 있는 부위의 창을 바로 열어줍니다.
// clearFresh 는 창을 닫을 때 일어나므로, 열린 목록에는 NEW! 가 그대로 붙어 있습니다.
function spotlightGear(slot) {
  showTab('gear');
  openSlotModal(slot || selectedSlot);
  const inv = $('inventory');
  if (!inv) return;
  inv.classList.remove('spotlight');
  void inv.offsetWidth;
  inv.classList.add('spotlight');
}

// ============================================================
//  단축키 — 스페이스 하나로 루프를 돌립니다
// ============================================================
// 「닿는다 → 맞선다 → 계속한다」가 수십 번 반복되는 게임이라,
// 마우스로 매번 다른 자리를 찾아 누르는 건 손이 아픕니다.
// 그래서 **지금 화면에서 해야 할 주 행동**을 스페이스 하나에 몰았습니다.
//
// 「물러선다」와 정예·보스로 향하는 버튼에는 일부러 안 걸었습니다.
// 그건 고민해서 눌러야 하는 것들이라, 연타로 잘못 누르면 안 되니까요.
// 싸우는 동안에는 걸리는 버튼이 없어 스페이스가 아무 일도 하지 않습니다 (건너뛰기 없음).
const PRIMARY_ORDER = ['agOk', 'talkNext', 'continueBtn', 'engageBtn', 'newRunBtn'];

function primaryButton() {
  if (!$('title').classList.contains('hidden')) return null;   // 초기화면에서는 안 씁니다
  for (const id of PRIMARY_ORDER) {
    const el = $(id);
    if (!el || el.disabled) continue;
    // 지금 화면에 없는 버튼은 건너뜁니다. offsetParent 로 재면 좁은 화면에서 아래에 붙박인
    // (position: fixed) 버튼까지 없는 걸로 쳐서 스페이스가 안 먹혔습니다.
    if (!el.getClientRects().length) continue;
    return el;
  }
  return null;
}

function wireKeys() {
  document.addEventListener('keydown', ev => {
    if (ev.repeat) return;                                     // 꾹 눌러 연타는 막습니다

    // 창이 떠 있으면 Esc 로 닫고, 스페이스는 먹히지 않게 합니다 —
    // 장비를 고르거나 포인트를 찍는 중에 길을 떠나버리면 곤란하니까요.
    if (isAnyModalOpen()) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        if (isSaveModalOpen()) closeSaveModal();
        else if (isAdminOpen()) closeAdmin();
        else if (isAvatarModalOpen()) closeAvatarModal();
        else if (isSwapModalOpen()) closeSwapModal();    // 교환 창은 강화 창 위에도 뜹니다
        else if (isChestOpen()) closeChest();
        else if (isLeaveOpen()) closeLeave();
        else if (isBuyOpen()) closeBuy();                // 구매 창은 상점 창 위에 뜹니다
        else if (isShopOpen()) closeShop();
        else if (isSlotModalOpen()) closeSlotModal();
        else if (isRosterModalOpen()) closeRosterModal();
      } else if (ev.code === 'Space') {
        // 세이브 코드 칸처럼 글을 쓰는 곳에서는 막지 않습니다
        const t = ev.target;
        if (!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'))) ev.preventDefault();
      }
      return;
    }

    if (ev.code !== 'Space' && ev.key !== 'Enter') return;
    const t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    const btn = primaryButton();
    if (!btn) return;
    ev.preventDefault();          // 스페이스로 화면이 내려가는 것도 같이 막습니다
    btn.click();
  });
}

const KEY_HINT = '<kbd>Space</kbd>';

// ---------- 메뉴 서랍의 칸 ----------
// 'journey' 는 지도(서랍 닫힘), 'stats' · 'gear' · 'hero' · 'settings' 는 메뉴 서랍의 스탯 · 전리품 · 나 · 설정 칸
// — 서랍이 열려 있는 동안 지도는 멈춥니다 (mapPaused)
let drawerTab = 'stats';   // 손잡이로 다시 열 때 마지막에 본 칸
function showTab(name) {
  // 탭을 옮기면 열려 있던 부위 창은 닫습니다 (NEW! 도 그때 꺼집니다)
  if (name !== 'gear' && isSlotModalOpen()) closeSlotModal();
  const was = document.body.dataset.tab;
  document.body.dataset.tab = name;
  document.body.classList.toggle('drawer-open', name !== 'journey');
  if (name !== 'journey') drawerTab = name;
  if (name === 'gear') maybeNamelessTalk();
  for (const b of document.querySelectorAll('#mobileTabs button')) {
    b.classList.toggle('on', b.dataset.tab === name);
  }
  const body = $('drawerBody');
  if (body && name !== was) body.scrollTop = 0;
}

// 서랍이 닫혀 있어도 새 전리품이 생긴 걸 알 수 있게 점을 찍습니다 (서랍의 전리품 칸과 메뉴 손잡이)
function renderTabBadges() {
  const fresh = totalFresh() > 0;
  const gear = document.querySelector('#mobileTabs [data-tab="gear"]');
  if (gear) gear.classList.toggle('has-new', fresh);
  const handle = $('drawerBtn');
  if (handle) handle.classList.toggle('has-new', fresh);
}

function wireTabs() {
  for (const b of document.querySelectorAll('#mobileTabs button')) {
    b.addEventListener('click', () => showTab(b.dataset.tab));
  }
  // 메뉴 손잡이로 열고(새 전리품이 있으면 전리품 칸으로), ✕ · 서랍 밖(어두워진 지도) · Esc 로 닫습니다
  $('drawerBtn').addEventListener('click', () => { if (!fightLocked()) showTab(totalFresh() > 0 ? 'gear' : drawerTab); });
  $('drawerX').addEventListener('click', () => showTab('journey'));
  $('drawerBack').addEventListener('click', () => showTab('journey'));
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && document.body.dataset.tab !== 'journey' && !isAnyModalOpen()) showTab('journey');
  });
  showTab('journey');
}

// ---------- 전리품 ----------
// 부위를 누르면 그 부위의 전리품 도감이 아래에 펼쳐집니다.
// 아직 못 얻은 것은 ???? 로만 보입니다 — 어느 격의 것인지만 알 수 있게.
let selectedSlot = 'weapon';
let showLocked = false;      // 못 얻은 ???? 를 펼쳐 볼 것인가

// ---------- 장비 세트 ----------
// 세 벌을 각각 입혀두고 갈아입습니다. 저장·덮어쓰기 버튼은 없습니다 —
// 번호를 누르면 그 세트로 갈아입고, 지금 입은 세트를 고치면 그 세트가 곧 그렇게 됩니다.
// 사람 그림 왼쪽 위(renderDoll)에 숫자만 놓습니다 — 눌러 보면 무슨 기능인지 압니다.

// ---------- 사람 위의 열두 칸 ----------
// 예전엔 2열 격자로 그냥 나열했습니다. 어디가 어느 부위인지는 글자를 읽어야 알았고,
// 열두 줄이 똑같이 생겨서 훑기 어려웠습니다.
//
// 지금은 실루엣 위에 **그 부위의 자리**에 칸을 얹습니다. 칸은 반투명이라
// 몸을 가리지 않고, 위치 자체가 "여기가 투구 자리"라고 말해줍니다.
//
// 기둥마다 넉 장씩 나눠 담았습니다. 가운데에 다섯 장을 쌓으면 그것만으로
// 430px 이 되어 아래 목록이 한참 밀립니다. 각반을 오른쪽으로 보내 4·4·4 로
// 맞추니 173px 이 줄었습니다.
// 왼쪽 4 · 가운데 5 · 오른쪽 4.
// 견갑이 들어오면서 목걸이가 가운데 기둥의 갑옷 위로 올라갔습니다 —
// 목이 가슴 위라 해부학적으로도 이쪽이 맞고, 비어 있던 어깨 자리를 견갑이 받습니다.
//
//   왼쪽        가운데        오른쪽
//   망토        투구          견갑
//   팔찌        목걸이        반지
//   장갑        갑옷          허리띠
//   무기        각반          보조무기
//               신발
//
// 각반이 가운데로 온 건 정강이가 몸의 한가운데 선 위에 있어서입니다 —
// 갑옷과 신발 사이에 놓이니 다리가 이어져 보입니다.
// 허리띠는 갑옷과 나란히 놓여 허리 높이에 맞고,
// 무기와 보조무기는 같은 줄에서 좌우로 마주 봅니다 — 양손이니까요.
const DOLL_MID   = ['helm', 'necklace', 'armor', 'greaves', 'boots'];
const DOLL_LEFT  = ['cloak', 'bracelet', 'gloves', 'weapon'];
const DOLL_RIGHT = ['shoulder', 'ring', 'belt', 'offhand'];

const DOLL_CELL = 86;   // 칸 높이 (아이콘 58 + 한 줄 + 여백)
const DOLL_GAP  = 10;
const DOLL_SIDE = 6.5;  // 옆 기둥이 바깥 가장자리에서 떨어진 %. 가운데 칸(36.5~63.5%)과의 틈이 3%만 남게 안쪽으로 붙입니다
const DOLL_W    = 27;   // 칸 폭 %. 가운데 칸과 옆 칸이 맞닿지 않는 한계가 32% 입니다
                        // (옆 칸 오른끝 2+w, 가운데 칸 왼끝 50−w/2).

function dollCell(slotId, style) {
  if (enhMode) return dollEnhCell(slotId, style);
  const s = SLOTS.find(x => x.id === slotId);
  const id = State.meta.equipped[slotId];
  const item = id ? getItem(id) : null;
  const nf = freshCount(slotId);
  // 강화 단계는 부위 이름 옆에. 올릴 수 있는 칸이 있다는 표시는 「슬롯 강화」 버튼에 뜹니다.
  const lv = enhanceLevel(slotId);
  // 강화 단계는 그림 칸 오른쪽 위 모서리에 +3 으로 — 부위 이름은 적지 않습니다 (자리가 곧 부위입니다)
  const enh = lv > 0 ? `<span class="doll-badge">+${lv}</span>` : '';
  return `
    <button class="doll-slot ${selectedSlot === slotId ? 'sel' : ''} ${item ? 'worn' : 'empty'}"
            data-slot="${slotId}" style="${style}" title="${s.name}">
      ${nf ? `<span class="new-dot">${nf}</span>` : ''}
      <span class="doll-icw"><span class="doll-ic">${item ? itemArt(item) : ''}</span>${enh}</span>
      <span class="doll-txt">
        <span class="doll-item">${item ? item.name : '비어 있음'}</span>
      </span>
    </button>`;
}

// ---------- 슬롯 강화 ----------
// 사람 그림 오른쪽 위 「슬롯 강화」를 누르면 그림은 그대로, 칸들이 강화 버튼으로 바뀝니다 —
// 칸을 누를 때마다 그 부위를 한 번 강화합니다. 부위 창 · 강화 창을 오가지 않고 열두 칸을 한 화면에서.
// 이때만 왼쪽 위에 「강화석 교환」이 생깁니다 (교환은 전부 그 창 하나에서 — renderSwap).
let enhMode = false;
let dollFx = null;      // 방금 누른 칸의 결과 — 한 번 그리고 지웁니다 (다시 그릴 때마다 번쩍이지 않게)

function dollEnhCell(slotId, style) {
  const s = SLOTS.find(x => x.id === slotId);
  const item = getItem(State.meta.equipped[slotId]);
  const lv = enhanceLevel(slotId);
  const nx = nextEnhance(slotId);
  const st = stonesOf(slotId);
  const ready = canEnhance(slotId);
  const fx = dollFx && dollFx.slot === slotId ? dollFx : null;
  const sub = nx ? `${pxIcon('stone')}${fmt(st)}/${fmt(nx.cost)} · ${Math.round(enhanceChance(slotId) * 100)}%` : '끝까지 올랐다';
  return `
    <button class="doll-slot enh-cell ${item ? 'worn' : 'empty'} ${ready ? 'ready' : ''} ${nx ? '' : 'maxed'} ${fx ? (fx.success ? 'fx-ok' : 'fx-fail') : ''}"
            data-enhslot="${slotId}" style="${style}" ${ready ? '' : 'disabled'}>
      ${fx ? `<span class="enh-float">${fx.success ? `성공 +${fx.level}` : '실패'}</span>` : ''}
      <span class="doll-icw"><span class="doll-ic">${item ? itemArt(item) : ''}</span>${lv > 0 || nx ? `<span class="doll-badge">+${lv}</span>` : ''}</span>
      <span class="doll-txt">
        <span class="doll-k">${nx ? `<em>▶</em> +${lv + 1}` : '최대'}</span>
        <span class="doll-item">${sub}</span>
      </span>
    </button>`;
}

function renderDoll() {
  const top = i => 6 + i * (DOLL_CELL + DOLL_GAP);
  // 옆 기둥은 반 칸 내려 어긋나게 둡니다 — 몸이 덜 가려집니다
  const sideTop = i => 6 + Math.round((DOLL_CELL + DOLL_GAP) * 0.55) + i * (DOLL_CELL + DOLL_GAP);
  const h = Math.max(top(DOLL_MID.length - 1),
                     sideTop(Math.max(DOLL_LEFT.length, DOLL_RIGHT.length) - 1)) + DOLL_CELL + 8;
  const C = 'left:50%;transform:translateX(-50%)';

  // 사람 자리의 그림 — 마왕을 지난 여정에서는 해진 옷. 그림이 아직 안 만들어졌으면 예전 실루엣을 깝니다
  const figName = beyondLook() ? 'worn' : 'fresh';
  const figURL = FX.heroPortrait(figName, () => { if (!battle) renderDoll(); });
  let html = `<div class="doll-body">${figURL
    ? `<img class="doll-fig" src="${figURL}" alt="" draggable="false">`
    : dollSilhouette()}</div>`;
  DOLL_MID.forEach((id, i)   => html += dollCell(id, `${C};top:${top(i)}px;width:${DOLL_W}%`));
  DOLL_LEFT.forEach((id, i)  => html += dollCell(id, `left:${DOLL_SIDE}%;top:${sideTop(i)}px;width:${DOLL_W}%`));
  DOLL_RIGHT.forEach((id, i) => html += dollCell(id, `right:${DOLL_SIDE}%;top:${sideTop(i)}px;width:${DOLL_W}%`));

  // 옆 기둥이 반 칸 내려앉아 생긴 위쪽 빈자리 — 오른쪽은 「슬롯 강화」, 왼쪽은 세트 1 2 3 (슬롯 강화 중이면 「강화석 교환」)
  const btnH = sideTop(0) - 6 - DOLL_GAP;
  // 지금 올릴 수 있는 칸이 몇 개인지 — 올릴 게 있다는 표시는 여기 하나에만 뜹니다
  const readyN = SLOT_IDS.filter(canEnhance).length;
  html += `<button class="doll-mode ${enhMode ? 'on' : ''} ${!enhMode && readyN ? 'ready' : ''}" id="dollModeBtn"
             style="right:${DOLL_SIDE}%;top:6px;width:${DOLL_W}%;height:${btnH}px">${enhMode ? '강화 끝' : `${readyN ? `<span class="mode-n">${readyN}</span>` : ''}슬롯 강화`}</button>`;
  if (enhMode) {
    html += `<button class="doll-mode swap" id="dollSwapBtn"
               style="left:${DOLL_SIDE}%;top:6px;width:${DOLL_W}%;height:${btnH}px">강화석 교환</button>`;
  } else {
    html += `<div class="doll-sets" style="left:${DOLL_SIDE}%;top:6px;width:${DOLL_W}%;height:${btnH}px">${
      Array.from({ length: SET_COUNT }, (_, n) => {
        const on = isSetActive(n);
        return `<button class="doll-set ${on ? 'on' : ''}" data-setpick="${n}" ${on ? 'disabled' : ''} title="세트 ${n + 1}">${n + 1}</button>`;
      }).join('')}</div>`;
  }

  const el = $('equipSlots');
  el.style.height = h + 'px';
  el.classList.toggle('enh-mode', enhMode);
  el.innerHTML = html;
  dollFx = null;
}

// 선으로만 그린 사람. 칸 뒤에 깔려 배경 노릇을 합니다.
function dollSilhouette() {
  return `<svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <g class="fig-fill">
      <ellipse cx="50" cy="24" rx="13.5" ry="15"/>
      <path d="M34 50 Q50 43 66 50 L72 108 L28 108 Z"/>
      <path d="M32 52 L19 96 L15 124 L23 126 L27 98 L37 60 Z"/>
      <path d="M68 52 L81 96 L85 124 L77 126 L73 98 L63 60 Z"/>
      <path d="M30 108 L34 152 L31 186 L43 186 L45 152 L50 120 L55 152 L57 186 L69 186 L66 152 L70 108 Z"/>
    </g>
    <g class="fig">
      <circle cx="50" cy="24" r="14"/>
      <path d="M50 38 L50 50"/>
      <path d="M34 50 Q50 43 66 50"/>
      <path d="M34 50 L28 108 L72 108 L66 50"/>
      <path d="M32 52 L19 96 L15 124"/>
      <path d="M68 52 L81 96 L85 124"/>
      <circle cx="14" cy="132" r="8"/>
      <circle cx="86" cy="132" r="8"/>
      <path d="M34 108 L31 152 L30 186"/>
      <path d="M66 108 L69 152 L70 186"/>
      <path d="M50 108 L50 120"/>
      <path d="M24 190 L38 190 M62 190 L76 190"/>
      <path d="M30 186 Q24 189 24 190"/>
      <path d="M70 186 Q76 189 76 190"/>
    </g>
  </svg>`;
}

// ---------- 특수장비 칸 ----------
// 사람 그림 아래에 네 칸을 한 줄로 둡니다. 닫힌 칸은 자물쇠만 보이고,
// 어디서 여는지는 알려주지 않습니다 — 숨어 있는 것을 찾아내는 것까지가 재미니까요.
// (그 지역 보스를 꺾으면 로그에 "숨어 있던 것이 눈을 떴다" 가 뜹니다.)
function renderSpecialSlots() {
  const open = specialOpenCount();
  const nf = freshCount('special');
  $('specialSlots').innerHTML = `
    <div class="sp-head">특수장비 <span class="count">${open}/${SPECIAL_SLOT_MAX}</span></div>
    <div class="sp-row">${SPECIAL_SLOT_IDS.map((id, i) => {
      if (i >= open) {
        return `<div class="sp-slot locked" title="숨어 있는 것을 꺾으면 열린다">
                  <span class="sp-ic">🔒</span>
                  <span class="sp-item">닫혀 있음</span></div>`;
      }
      const item = getItem(State.meta.equipped[id]);
      return `<button class="sp-slot ${selectedSlot === id ? 'sel' : ''} ${item ? 'worn' : 'empty'}" data-slot="${id}">
                ${i === 0 && nf ? `<span class="new-dot">${nf}</span>` : ''}
                <span class="sp-ic">${item ? itemArt(item) : ''}</span>
                <span class="sp-item">${item ? item.name : '비어 있음'}</span>
              </button>`;
    }).join('')}</div>`;
}

// ---------- 세트 효과 ----------
// 사람 그림 아래, 특수장비 줄 밑. 두 부위 이상 낀 성격만 보여줍니다 —
// 하나뿐인 건 세트라고 하기 어렵고, 다 보여주면 열 줄이 넘습니다.
// 해당하는 게 없으면 칸째로 비웁니다 (설명 글을 두지 않습니다).
function renderSetBonus() {
  const el = $('setBonus');
  if (!el) return;
  const counts = Object.entries(setCounts()).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  if (!counts.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="sb-head">세트 효과</div>` + counts.map(([arch, n]) => {
    const a = ARCHETYPES[arch];
    const bonus = SET_BONUS[arch] || {};
    const step = setStep(n);
    const next = SET_STEPS[step];
    const text = Object.entries(bonus).map(([k, vals]) => {
      const now = step ? `${SPECIAL_INFO[k].name} +${specialTxt(k, vals[step - 1])}` : `${SPECIAL_INFO[k].name} 없음`;
      return next ? `${now} <em>· ${next}부위면 +${specialTxt(k, vals[step])}</em>` : now;
    }).join(' ');
    return `<div class="sb-row ${step ? 'on' : ''}">
      <span class="arch-tag" style="--arch:${a.color}">${a.name}</span>
      <span class="sb-n">${n}부위</span>
      <span class="sb-text">${text}</span>
    </div>`;
  }).join('');
}

// 특수장비 칸을 열었을 때 맨 위 — 강화 대신 열린 칸 수와 특수장비 강화석
function specialPanel(slot) {
  const open = isSlotOpen(slot);
  return `<div class="enh-panel sp-panel ${open ? '' : 'locked'}">
    <div class="enh-head"><span class="enh-title">${SLOT_NAMES[slot]}${open ? '' : ' · 닫혀 있음'}</span>
      <span class="enh-now">${specialOpenCount()}/${SPECIAL_SLOT_MAX} 열림</span></div>
    <div class="enh-info"><span>특수장비 ${pxIcon('stone')}강화석 <b>${fmt(stonesOf('special'))}</b></span></div>
  </div>`;
}

function renderGear() {
  renderAvatarBar();
  renderDoll();
  renderSpecialSlots();
  renderSetBonus();

  // 고른 부위에 끼운 것 — 여기만 능력치를 전부 펼칩니다.
  const special = isSpecialSlot(selectedSlot);
  const wornId = State.meta.equipped[selectedSlot];
  const wornItem = wornId ? getItem(wornId) : null;
  $('equipDetail').innerHTML = (special ? specialPanel(selectedSlot) : '') + (wornItem
    ? `<div class="worn-card">
         <span class="worn-icon">${itemArt(wornItem)}</span>
         <div class="worn-body">
           <div class="worn-name">${itemTag(wornItem)}${wornItem.name}</div>
           <div class="worn-stats">${itemStatText(wornItem) || '—'}</div>
           ${itemSpecialText(wornItem) ? `<div class="inv-spec">${itemSpecialText(wornItem)}</div>` : ''}
           ${wornItem.note ? `<div class="inv-note">${wornItem.note}</div>` : ''}
         </div>
         ${fightLocked() ? '' : `<button class="btn" data-unequip="${selectedSlot}">해제</button>`}
       </div>`
    : `<p class="hint worn-empty">비어 있음</p>`);

  // 아래쪽: 고른 부위의 도감
  $('collectionTitle').textContent = SLOT_NAMES[selectedSlot];
  $('ownedCount').textContent = `${ownedIds().length}/${knownItems().length}`;

  // 목록이 길어지면 새로 얻은 게 저 밑에 묻힙니다.
  // NEW → 착용중 → 나머지는 높은 격부터. 못 얻은 ???? 는 맨 아래로 접어둡니다.
  // 특수장비 칸 넷은 같은 목록(특수장비 전부)을 봅니다.
  const fk = freshKey(selectedSlot);
  // 못 얻은 것 목록도 아는 격까지만 — 마왕 너머의 전리품은 몇 개인지조차 보이지 않습니다
  const all = itemsInSlot(special ? 'special' : selectedSlot).filter(i => owns(i.id) || (knownRank(i.rank.n) && !(i.ware || i.chest || i.store)));
  const have = all.filter(i => owns(i.id));
  const lockedCount = all.length - have.length;

  have.sort((a, b) => {
    const fa = isFresh(a.id, fk) ? 1 : 0, fb = isFresh(b.id, fk) ? 1 : 0;
    if (fa !== fb) return fb - fa;                                   // 새 것 먼저
    const ea = equippedSlotOf(a.id) ? 1 : 0;
    const eb = equippedSlotOf(b.id) ? 1 : 0;
    if (ea !== eb) return eb - ea;                                   // 착용중 다음
    return b.level - a.level;                                        // 그다음 높은 격부터
  });
  const canWear = isSlotOpen(selectedSlot) && !fightLocked();

  const lockedBlock = lockedCount
    ? `<button class="btn tiny locked-toggle span2" id="lockedToggle">
         아직 못 얻은 것 ${lockedCount}종 ${showLocked ? '숨기기' : '보기'}
       </button>` + (showLocked ? all.filter(i => !owns(i.id)).map(item => `
        <div class="inv-item locked">
          <span class="inv-art">?</span>
          <div class="inv-body">
            <div class="inv-head">
              <span class="rank-dot r${item.rank.n}" title="제${item.rank.n}격 · ${item.rank.name}"></span>
              ${item.grade !== 'normal' ? `<span class="grade-tag ${item.grade}">${KINDS[item.grade].name}</span>` : ''}
              <span class="inv-name">????</span>
            </div>
            <div class="inv-stats">제${item.rank.n}격 · ${item.rank.name}</div>
          </div>
        </div>`).join('') : '')
    : '';

  // 지금 이 칸에 낀 것과 견줍니다 (비어 있으면 전부 오르는 쪽)
  const slotM = slotMult(special ? 'special' : selectedSlot);
  $('inventory').innerHTML = (have.length ? have.map(item => {
    const at = equippedSlotOf(item.id);
    const on = at === selectedSlot;
    const spec = itemSpecialText(item);
    const fresh = isFresh(item.id, fk);
    const diff = on ? '' : itemDiffText(item, wornItem, slotM);
    // 버튼은 없습니다 — 칸을 누르면 끼우고, 낀 것은 테두리로만 보입니다.
    // 특수장비는 다른 특수장비 칸에 끼워져 있을 수 있습니다 — 누르면 이리로 옮깁니다 (작은 글로 어디 끼웠는지만)
    const wearable = canWear && !on;
    const where = at && !on ? `<div class="inv-where">${SLOT_NAMES[at]}에 끼움</div>` : '';
    return `
      <div class="inv-item ${on ? 'on' : ''} ${fresh ? 'fresh' : ''} ${wearable ? 'pick' : ''}" ${wearable ? `data-equip="${item.id}"` : ''}>
        <span class="inv-art">${itemArt(item)}</span>
        <div class="inv-body">
          <div class="inv-head">
            ${fresh ? '<span class="new-badge">NEW</span>' : ''}${itemTag(item)}${item.grade !== 'normal' ? `<span class="grade-tag ${item.grade}">${KINDS[item.grade].name}</span>` : ''}
            <span class="inv-name">${item.name}</span>
          </div>
          <div class="inv-stats">${itemStatText(item) || '—'}${spec ? ` <span class="inv-spec">${spec}</span>` : ''}</div>
          ${diff ? `<div class="inv-diff">${diff}</div>` : ''}
          ${item.note ? `<div class="inv-note">${item.note}</div>` : ''}
          ${where}
        </div>
      </div>`;
  }).join('') : `<p class="hint span2">얻은 것이 없다</p>`) + lockedBlock;

  const lt = $('lockedToggle');
  if (lt) lt.addEventListener('click', () => { showLocked = !showLocked; render(); });

  for (const el of document.querySelectorAll('[data-slot]')) {
    el.addEventListener('click', () => openSlotModal(el.dataset.slot));
  }
  // 칸을 누르면 끼웁니다. 창은 열어 둡니다 — 테두리가 옮겨 가는 걸로 무엇을 꼈는지 보입니다.
  for (const row of document.querySelectorAll('#inventory [data-equip]')) {
    row.addEventListener('click', () => { if (fightLocked()) return; equip(row.dataset.equip, selectedSlot); Sound.play('equip'); render(); });
  }
  // 해제는 창을 열어둡니다. 벗은 김에 다른 걸 끼우려는 흐름이 자연스럽습니다.
  for (const btn of document.querySelectorAll('[data-unequip]')) {
    btn.addEventListener('click', ev => { ev.stopPropagation(); if (fightLocked()) return; unequip(btn.dataset.unequip); Sound.play('unequip'); render(); });
  }
  // 슬롯 강화 — 칸을 누를 때마다 한 번
  for (const btn of document.querySelectorAll('[data-enhslot]')) {
    btn.addEventListener('click', () => {
      if (fightLocked()) return;
      const slot = btn.dataset.enhslot;
      const r = tryEnhance(slot);
      if (r) {
        dollFx = { slot, ...r };
        Sound.play(r.success ? 'enhanceOk' : 'enhanceFail');
      }
      render();
    });
  }
  const mb = $('dollModeBtn');
  if (mb) mb.addEventListener('click', () => { if (fightLocked()) return; enhMode = !enhMode; render(); });
  const sb = $('dollSwapBtn');
  if (sb) sb.addEventListener('click', () => openSwapModal(null));
  const ab = $('dollAvatarBtn');
  if (ab) ab.addEventListener('click', openAvatarModal);
  for (const b of document.querySelectorAll('[data-setpick]')) {
    b.addEventListener('click', () => { if (fightLocked()) return; switchSet(Number(b.dataset.setpick)); Sound.play('equip'); render(); });
  }
  for (const b of document.querySelectorAll('[data-closeslot]')) {
    b.addEventListener('click', closeSlotModal);
  }
}

// ---------- 강화석 교환 ----------
// 창 하나에서 전부 합니다 — 내는 것과 받는 것을 고르고, 모자란 만큼 · 절반 · 전부.
// 다른 부위(또는 특수장비)의 강화석을 받는 부위의 강화석으로 — 절반이 사라집니다.
// 아래 목록은 열세 부위의 강화석과 다음 강화에 드는 수 — 누르면 그 부위가 받는 쪽이 됩니다.
let swapFrom = null;    // 내는 것. 창을 새로 열면 다시 고릅니다
let swapTo = null;      // 받는 것
let lastSwap = null;    // 방금 바꾼 결과 — 창을 보는 동안만 남겨둡니다

function swapSources(slot) {
  return ['special'].concat(SLOT_IDS)
    .filter(s => s !== slot && stonesOf(s) >= exchangeCost(1))
    .sort((a, b) => stonesOf(b) - stonesOf(a));
}

function openSwapModal(to) {
  if (fightLocked()) return;
  // 받는 쪽 — 강화 창에서 열면 그 부위, 사람 그림에서 열면 다음 강화까지 가장 덜 모자란 부위
  const lackOf = s => { const nx = nextEnhance(s); return nx ? Math.max(0, nx.cost - stonesOf(s)) : Infinity; };
  swapTo = SLOT_IDS.includes(to) ? to : SLOT_IDS.slice().sort((a, b) => lackOf(a) - lackOf(b))[0];
  swapFrom = null;
  lastSwap = null;
  $('swapModal').classList.remove('hidden');
  render();
}
function closeSwapModal() {
  const m = $('swapModal');
  if (m) m.classList.add('hidden');
  render();
}
function isSwapModalOpen() {
  const m = $('swapModal');
  return !!m && !m.classList.contains('hidden');
}

function renderSwap() {
  if (!isSwapModalOpen()) return;
  const to = swapTo;
  const src = swapSources(to);
  if (!src.includes(swapFrom)) swapFrom = src.includes('special') ? 'special' : (src[0] || null);
  $('swapRate').textContent = `${Math.round(1 / STONE_EXCHANGE_RATE)}개 → 1개`;

  const nx = nextEnhance(to);
  const lack = nx ? Math.max(0, nx.cost - stonesOf(to)) : 0;
  const have = swapFrom ? stonesOf(swapFrom) : 0;
  const gainOf = pay => Math.floor(pay * STONE_EXCHANGE_RATE);
  // 모자란 만큼 — 다음 강화에 딱 맞게. 내는 것이 모자라면 가진 만큼.
  const needPay = lack > 0 ? Math.min(have, exchangeCost(lack)) : 0;
  const halfPay = Math.floor(have / 2);
  const opts = (list, cur) => list.map(s =>
    `<option value="${s}" ${s === cur ? 'selected' : ''}>${SLOT_NAMES[s]} · ${fmt(stonesOf(s))}</option>`).join('');
  const last = lastSwap
    ? `<div class="swap-last">${SLOT_NAMES[lastSwap.from]} ${fmt(lastSwap.paid)} → ${SLOT_NAMES[lastSwap.to]} +${fmt(lastSwap.gain)}</div>`
    : '';

  const pick = `<div class="swap-pick">
      <label><span>내는 것</span>${src.length
        ? `<select class="swap-from" id="swapFromSel">${opts(src, swapFrom)}</select>`
        : '<div class="swap-none">바꿀 강화석이 없다</div>'}</label>
      <span class="swap-arrow">▶</span>
      <label><span>받는 것</span><select class="swap-from" id="swapToSel">${opts(SLOT_IDS, to)}</select></label>
    </div>
    <div class="swap-need">${SLOT_NAMES[to]} +${enhanceLevel(to)} · ${nx
      ? `다음 강화에 ${fmt(nx.cost)} · ${lack > 0 ? `<b>${fmt(lack)}</b> 모자라다` : '<b class="enough">모자라지 않다</b>'}`
      : '끝까지 올랐다'}</div>
    <div class="swap-btns three">
      <button class="btn" data-swap="${needPay}" ${gainOf(needPay) > 0 ? '' : 'disabled'}>
        <b>모자란 만큼</b><span>${lack > 0 ? `${fmt(needPay)} → +${fmt(gainOf(needPay))}` : '—'}</span></button>
      <button class="btn" data-swap="${halfPay}" ${gainOf(halfPay) > 0 ? '' : 'disabled'}>
        <b>절반</b><span>${fmt(halfPay)} → +${fmt(gainOf(halfPay))}</span></button>
      <button class="btn" data-swap="${have}" ${gainOf(have) > 0 ? '' : 'disabled'}>
        <b>전부</b><span>${fmt(have)} → +${fmt(gainOf(have))}</span></button>
    </div>
    ${last}`;

  // 열세 부위와 특수장비 강화석 한눈에 — 부위 줄을 누르면 받는 것이 됩니다
  const rows = SLOT_IDS.map(s => {
    const n = nextEnhance(s);
    const item = getItem(State.meta.equipped[s]);
    return `<button class="swap-row ${s === to ? 'to' : ''} ${s === swapFrom ? 'from' : ''} ${canEnhance(s) ? 'ready' : ''}" data-swapto="${s}">
      <span class="swap-ic">${item ? itemArt(item) : ''}</span>
      <span class="swap-k">${SLOT_NAMES[s]} <b>+${enhanceLevel(s)}</b></span>
      <span class="swap-n">${pxIcon('stone')}${fmt(stonesOf(s))}${n ? ` / ${fmt(n.cost)}` : ' · 최대'}</span>
    </button>`;
  }).join('') + `<div class="swap-row sp ${swapFrom === 'special' ? 'from' : ''}">
      <span class="swap-ic">✦</span><span class="swap-k">${SLOT_NAMES.special}</span>
      <span class="swap-n">${pxIcon('stone')}${fmt(stonesOf('special'))}</span></div>`;

  $('swapBody').innerHTML = pick + `<div class="swap-list">${rows}</div>`;

  const fs = $('swapFromSel');
  if (fs) fs.addEventListener('change', () => { swapFrom = fs.value; renderSwap(); });
  const ts = $('swapToSel');
  ts.addEventListener('change', () => { swapTo = ts.value; renderSwap(); });
  for (const b of document.querySelectorAll('#swapBody [data-swapto]')) {
    b.addEventListener('click', () => { swapTo = b.dataset.swapto; renderSwap(); });
  }
  for (const b of document.querySelectorAll('#swapBody [data-swap]')) {
    b.addEventListener('click', () => {
      const r = exchangeStones(swapFrom, swapTo, Number(b.dataset.swap));
      if (r) { lastSwap = r; Sound.play('stone'); }
      render();
    });
  }
}

// ---------- 부위 창 ----------
// 예전엔 칸을 누르면 화면 아래 목록으로 스크롤해서 골랐습니다.
// 열두 칸을 오가며 비교할 때마다 화면이 위아래로 튀어서 창으로 바꿨습니다.
function openSlotModal(slotId) {
  selectedSlot = slotId;
  lastSwap = null;
  swapFrom = null;
  showLocked = !!State.meta.settings.showLocked;   // 설정을 따릅니다
  render();
  const m = $('slotModal');
  if (m) m.classList.remove('hidden');
}

function closeSlotModal() {
  const m = $('slotModal');
  if (m) m.classList.add('hidden');
  // 창을 닫을 때 비로소 NEW! 를 끕니다 — 열어보는 동안에는 남아 있어야
  // 어느 것이 새것인지 보입니다.
  // 전투를 보는 중에 열었다 닫았으면, 아직 보여주지 않은 이번 전투의 새것은 NEW 를 남겨 둡니다.
  const key = freshKey(selectedSlot);
  const keep = battle && battle.held ? (State.meta.fresh[key] || []).filter(id => !(battle.held.fresh[key] || []).includes(id)) : [];
  clearFresh(key);
  if (keep.length) { State.meta.fresh[key] = keep; save(); }
  render();
}

function isSlotModalOpen() {
  const m = $('slotModal');
  return !!m && !m.classList.contains('hidden');
}

// ---------- 상점 창 — 떠돌이 상인 · 헌터백화점의 매장이 같이 씁니다 ----------
// 떠돌이 상인: 소지품 셋까지 + 강화석 (부위를 고르고 10 · 100 · 1,000개 묶음으로. 어느 지역에서든 같은 상인, 같은 값).
// 헌터백화점(shopKind 가 매장 이름 — data.js 의 DEPT_SECTIONS): 점원의 한마디 · 들어와 있는 물건. 다음 격 물건은 들어오기 전까지 보여 주지 않습니다 (사용자 결정). 강화석은 안 팝니다.
let shopSlot = null;   // 강화석을 살 부위. 창을 열 때 지금 고른 부위로 맞춥니다
let shopKind = 'merchant';   // 'merchant' 또는 백화점 매장 이름
let shopSay = '';            // 점원의 한마디 — 창을 열 때 한 번 고릅니다 (사고 나서 다시 그려도 그대로)
const isDeptShop = () => shopKind !== 'merchant';
// 지금 연 상점이 아직 그 자리에 있나 (상인이 떠났거나 도시가 아니면 닫습니다)
function shopHere() { return shopKind === 'assoc' ? !!State.meta.cityOpen : shopKind === 'hire' || shopKind === 'gate' ? gatesOpen() : shopKind === 'guild' ? guildForSale() || guildOwned() : isDeptShop() ? !!State.meta.cityOpen && !!DEPT_SECTIONS[shopKind] : merchantHere(); }
// 점원은 등록증도 없는 손님을 수상쩍어하지만 묻지 않습니다
const CLERK_TALK = {
  noLicense: ['「헌터 등록증 먼저 보여 주시겠어요? …없으시면 팔 수가 없어요. 협회는 길 건너 큰 건물이에요.」', '「등록 안 된 분께는 무기를 못 팔아요. 규정이라서요. 협회에서 시험부터 보고 오세요.」'],
  first: ['「등록증 확인했습니다. …갓 등록하신 분 손이 이렇게 거칠던가요? 아니에요, 천천히 보세요.」', '「처음 뵙는 분인데 손이… 아니에요. 천천히 보세요.」'],
  again: ['「지난번 건 잘 쓰셨어요? …어디서 쓰셨는지는 안 물어볼게요.」', '「또 오셨네요. 협회엔 말 안 했어요. 말할 것도 없고요.」'],
  empty: ['「지금 있는 건 다 가져가셨어요. 새 물건이 들어오면… 또 오시겠죠.」']
};
const MAT_TALK = {
  none: ['「오늘은 빈손이시네요. 핵이든 가죽이든 돌조각이든 가져오시면 봐 드려요.」'],
  first: ['「이건… 어디서 구하셨어요? 아뇨, 대답 안 하셔도 돼요. 상태는 좋네요.」', '「등록 헌터 납품만 받는 게 원칙인데… 뭐, 원칙은 원칙이고요.」'],
  again: ['「또 가져오셨네요. 장부엔 \'개인 소장품\'이라고 적어 둘게요.」', '「이 정도 양이면 보통은 길드 단위인데. …혼자세요?」']
};
function clerkLine(kind) {
  const pick = list => list[Math.floor(Math.random() * list.length)];
  if (kind === 'mats') {
    const any = Object.keys(State.meta.mats || {}).some(id => matsOf(id) > 0), made = ITEMS.some(i => i.craft && owns(i.id));
    return pick(!any ? MAT_TALK.none : made ? MAT_TALK.again : MAT_TALK.first);
  }
  if (kind === 'assoc') return pick(!hunterGrade() ? ASSOC_TALK.none : canTakeTest() ? ASSOC_TALK.again : ASSOC_TALK.done);
  if (kind === 'hire') return pick(HIRE_TALK);
  if (kind === 'guild') return pick(guildOwned() ? GUILD_TALK.own : GUILD_TALK.sale);
  if (kind === 'gate') return pick(gatesDoneCount() ? GATE_TALK.back : GATE_TALK.idle);
  if (!hunterGrade()) return pick(CLERK_TALK.noLicense);
  const owned = ITEMS.some(i => i.store === kind && owns(i.id));
  return pick(!deptWares(kind).length ? CLERK_TALK.empty : owned ? CLERK_TALK.again : CLERK_TALK.first);
}
function openShop(kind = 'merchant') {
  shopKind = kind;
  if (!shopHere()) return;
  shopSay = isDeptShop() ? clerkLine(kind) : '';
  assocResult = null;
  shopSlot = SLOT_IDS.includes(selectedSlot) ? selectedSlot : SLOT_IDS[0];
  $('shopModal').classList.remove('hidden');
  renderShop();
}
function closeShop() {
  closeBuy();
  const m = $('shopModal');
  if (m) m.classList.add('hidden');
}
function isShopOpen() {
  const m = $('shopModal');
  return !!m && !m.classList.contains('hidden');
}
function renderShop() {
  if (!isShopOpen()) return;
  if (!shopHere()) { closeShop(); return; }
  if (shopKind === 'assoc') { renderAssoc(); return; }
  if (shopKind === 'hire') { renderHire(); return; }
  if (shopKind === 'gate') { renderGates(); return; }
  if (shopKind === 'guild') { renderGuild(); return; }
  if (shopKind === 'mats') { renderMatShop(); return; }
  const dept = isDeptShop();
  // 지갑 — 백화점(도시)은 돈(원), 떠돌이 상인(그 공간)은 골드
  const gold = num(dept ? State.meta.won : State.meta.gold);
  const cost = n => dept ? fmtWon(n) : `${fmt(n)} 골드`;
  $('shopTitle').textContent = dept ? `헌터백화점 · ${DEPT_SECTIONS[shopKind].name}` : '떠돌이 상인';
  $('shopGold').innerHTML = dept ? `${pxIcon('won')}돈 ${fmtWon(gold)}` : `골드 ${fmt(gold)}`;
  // 물건 한 줄
  const card = item => {
    const can = gold >= item.price && (!dept || hunterGrade() > 0);   // 백화점은 헌터 등록부터
    const worn = getItem(State.meta.equipped[item.slot]);
    const diff = itemDiffText(item, worn, slotMult(item.slot));
    const spec = itemSpecialText(item);
    return `
      <div class="inv-item ware">
        <span class="inv-art">${itemArt(item)}</span>
        <div class="inv-body">
          <div class="inv-head">${itemTag(item)}<span class="inv-name">${item.name}</span></div>
          <div class="inv-stats">${SLOT_NAMES[item.slot]} · ${itemStatText(item) || '—'}${spec ? ` <span class="inv-spec">${spec}</span>` : ''}</div>
          ${diff ? `<div class="inv-diff">${diff}</div>` : ''}
          ${item.note ? `<div class="inv-note">${item.note}</div>` : ''}
        </div>
        <div class="inv-act"><button class="btn" data-buy="${item.id}" ${can ? '' : 'disabled'}>${cost(item.price)}</button></div>
      </div>`;
  };
  // 산 물건은 상점에서 사라집니다
  const list = dept
    ? deptWares(shopKind).sort((a, b) => a.rank.n - b.rank.n || SLOT_IDS.indexOf(a.slot) - SLOT_IDS.indexOf(b.slot))
    : State.run.merchant.wares.map(getItem).filter(i => i && !State.run.merchant.bought.includes(i.id) && !owns(i.id));
  const cards = list.map(card).join('');
  if (dept) {
    $('shopBody').innerHTML = `<div class="shop-say">${DEPT_SECTIONS[shopKind].icon} ${shopSay}</div>`
      + (hunterGrade() ? '' : '<div class="license-note">🪪 헌터 등록증이 있어야 살 수 있다 — 헌터들의 도시 위쪽 가운데, <b>헌터 협회</b>에서 시험을 본다</div>')
      + (cards ? `<div class="inventory shop-wares">${cards}</div>` : '<div class="adm-note">지금 들어와 있는 물건은 모두 샀다</div>');
    for (const b of document.querySelectorAll('[data-buy]')) b.addEventListener('click', () => openBuy(b.dataset.buy));
    return;
  }
  // 강화석 — 부위를 고르면 그 부위의 지금 강화석 · 강화 단계와 다음 강화에 드는 수가 보입니다
  const nx = nextEnhance(shopSlot);
  const stones = `
    <div class="shop-stones">
      <div class="swap-head">${pxIcon('stone')}강화석</div>
      <select class="swap-from" id="shopSlot">${SLOT_IDS.map(s =>
        `<option value="${s}" ${s === shopSlot ? 'selected' : ''}>${SLOT_NAMES[s]} +${enhanceLevel(s)} · 강화석 ${fmt(stonesOf(s))}${nextEnhance(s) ? ` / ${fmt(nextEnhance(s).cost)}` : ' · 최대'}</option>`).join('')}</select>
      <div class="shop-packs">${STONE_PACKS.map(n => {
        const price = stonePriceFor(n);
        return `<button class="btn" data-stones="${n}" ${gold >= price ? '' : 'disabled'}><b>${fmt(n)}개</b><span>${fmt(price)} 골드</span></button>`;
      }).join('')}</div>
      ${nx ? '' : '<div class="adm-note">이 부위는 강화가 끝까지 올라 있다</div>'}
    </div>`;
  // 장비가 먼저, 강화석은 그 아래 — 산 물건은 사라집니다 (머리글 · 다 팔렸다는 글은 뺐습니다, 사용자 결정)
  const wares = cards ? `<div class="inventory shop-wares">${cards}</div>` : '';
  $('shopBody').innerHTML = wares + stones;
  const sel = $('shopSlot');
  if (sel) sel.addEventListener('change', () => { shopSlot = sel.value; renderShop(); });
  for (const b of document.querySelectorAll('[data-stones]')) {
    b.addEventListener('click', () => {
      if (buyStones(shopSlot, Number(b.dataset.stones))) { Sound.play('stone'); render(); }
    });
  }
  for (const b of document.querySelectorAll('[data-buy]')) b.addEventListener('click', () => openBuy(b.dataset.buy));
}

// ---------- 재료 창구 (헌터백화점 1층) — 재료로 만들기 · 강화석으로 바꾸기 · 팔기 ----------
// 재료마다 한 묶음: 머리에 재료 이름 · 가진 수 · 팔기 단추(1개 · 모두), 아래에 그 재료로 만드는 장비.
// 아직 없는 장비는 「만든다」(재료 + 돈 — 만들면 「지금 낄까요?」), 이미 가진 장비는 「강화석」(재료 → 그 부위 강화석 — 예전에 겹쳐 주웠을 때와 같은 양).
// 보이는 재료는 한 번이라도 손에 넣어 본 것 — 가진 것이 있거나, 그 재료로 만든 장비가 있는 것 (아직 못 본 몬스터의 재료는 숨김)
// 맨 위는 핵 — 모든 몬스터가 남기는 팔 것 (격마다 한 가지). 가진 격만 한 줄씩, 「모두 판다」 한 번으로 다 팝니다. 만드는 데는 쓰지 않습니다.
// ---------- 헌터 협회 · 등록 창구 (상점 창을 같이 씀 — shopKind 'assoc') ----------
// 지금의 나(도시의 Lv.1 그대로)로 F 시험관부터 차례로 싸워, 이긴 데까지가 등급. 회차에 한 번 · 내려가지 않음 (game.js 의 takeHunterTest)
const CLERK_DESKS = { assoc: { name: '등록 창구', icon: '🧑‍💼' }, ally: { name: '???', icon: ALLIES.hayun.icon }, hire: { name: '동료 모집', icon: '👩‍💼' }, gate: { name: '게이트 창구', icon: '🧑‍✈️' }, guild: { name: '길드 장부', icon: '📒' } };   // 백화점 매장이 아닌 창구 — 지도 위 이름표
const ASSOC_TALK = {
  none: ['「신규 등록이세요? 시험은 간단해요. 시험관과 한 번씩 붙어 보시면 돼요. F급부터요.」', '「등록증 없이 게이트 근처를 돌아다니시면 곤란해요. …시험 보시게요?」'],
  again: ['「재심사요? 좋아요. 지난번보다 나아지셨는지 볼까요.」', '「등급은 한 번 받으면 안 내려가요. 부담 없이 보세요.」'],
  done: ['「오늘 심사는 끝났어요. 다음에 다시 오세요. …다음 게이트 다녀오시고요.」']
};
let assocResult = null;     // 이번에 본 시험 — 창을 다시 열면 비웁니다
function renderAssoc() {
  $('shopTitle').textContent = '헌터 협회 · 등록 창구';
  $('shopGold').innerHTML = hunterGrade() ? `🪪 ${gradeName()}급 헌터` : '🪪 미등록';
  const can = canTakeTest(), r = assocResult;
  const ladder = HUNTER_GRADES.map((g, i) => {
    const n = i + 1, bout = r && r.bouts.find(b => b.g === n);
    const cls = n <= hunterGrade() ? 'have' : '', res = bout ? (bout.win ? 'win' : 'lose') : '';
    return `<div class="grade-row ${cls} ${res}">
      <span class="grade-id">${g.id}</span>
      <span class="grade-k">${g.id}급 시험관 <small>Lv.${fmtLevel(g.level)}</small></span>
      <span class="grade-r">${bout ? (bout.win ? `이김 · ${bout.turns}턴` : `짐 · ${bout.turns}턴`) : n <= hunterGrade() ? '통과' : ''}</span>
    </div>`;
  }).join('');
  const head = !r ? '' : r.grade > r.before
    ? `<div class="assoc-result up">${r.before ? `등급이 올랐다 — <b>${gradeName(r.before)}급 → ${gradeName(r.grade)}급</b>` : `<b>${gradeName(r.grade)}급 헌터</b>로 등록했다! 이제 백화점에서 살 수 있다`}</div>`
    : r.grade ? `<div class="assoc-result">그대로 <b>${gradeName(r.grade)}급</b> — 더 세져서 다시 오자</div>`
    : `<div class="assoc-result down">불합격 — F급 시험관도 못 이겼다. 장비를 갖추고 강해져서 다시 오자</div>`;
  $('shopBody').innerHTML = `<div class="shop-say">${CLERK_DESKS.assoc.icon} ${shopSay}</div>
    ${head}
    <div class="grade-ladder">${ladder}</div>
    <p class="hint">지금 그대로(도시의 Lv.${fmtLevel(State.run ? State.run.level : 1)}) 시험관과 F급부터 차례로 싸운다 — 지면 거기서 끝, 이긴 데까지가 등급.<br>등급은 내려가지 않는다 · 시험은 회차마다 한 번</p>
    <div class="assoc-actions"><button class="btn primary" id="assocTestBtn" ${can ? '' : 'disabled'}>${can ? (hunterGrade() ? '재심사를 받는다' : '시험을 본다') : '이번 회차엔 이미 봤다'}</button></div>`;
  const b = $('assocTestBtn');
  if (b) b.addEventListener('click', () => {
    const res = takeHunterTest();
    if (!res) return;
    assocResult = res;
    Sound.play(res.grade > res.before ? 'rankUp' : res.grade ? 'equip' : 'retreat');
    render();
  });
}

// ---------- 헌터 협회 · 동료 모집 · 게이트 창구 (도시 계획 5번 — 제5격 보스 뒤. 상점 창을 같이 씀) ----------
const HIRE_TALK = ['「동료 찾으세요? 등급에 맞는 분들만 소개해 드려요. 계약금은 한 번이고요.」', '「요즘 혼자 다니는 헌터 드물어요. …혼자서 그만큼 오르신 것도 드물고요.」'];
const GATE_TALK = {
  idle: ['「게이트 공략 대행 접수예요. 동료분을 보내 두시면 시간 맞춰 돌아와요.」', '「등급보다 높은 게이트는 접수 못 해 드려요. 규정이에요.」'],
  back: ['「돌아온 분이 계세요. 전리품 정산해 뒀어요.」']
};
const allyName = a => `<b>${a.name}</b> <small>${a.grade}급</small>`;
function renderHire() {
  const won = num(State.meta.won);
  $('shopTitle').textContent = '헌터 협회 · 동료 모집';
  $('shopGold').innerHTML = `${pxIcon('won')}돈 ${fmtWon(won)}`;
  const list = hireList();
  const rows = list.map(a => {
    const own = allyOwned(a.id), price = hirePrice(a);
    return `<div class="ally-row${own ? ' own' : ''}">
      <span class="ally-ic">${a.icon}</span>
      <div class="ally-body"><div>${allyName(a)}</div><div class="ally-what">${allyWhat(a)}</div></div>
      ${own ? '<span class="ally-state">동료</span>' : `<button class="btn primary" data-hire="${a.id}" ${won >= price ? '' : 'disabled'}><b>맞는다</b><span>${fmtWon(price)}</span></button>`}
    </div>`;
  }).join('');
  const next = Object.values(ALLIES).find(a => a.hire && allyGradeN(a) === hunterGrade() + 1);
  $('shopBody').innerHTML = `<div class="shop-say">${CLERK_DESKS.hire.icon} ${shopSay}</div>
    ${rows || '<p class="hint">아직 소개해 줄 사람이 없다 — 헌터 등록부터.</p>'}
    <p class="hint">내 등급(${hunterGrade() ? `${gradeName()}급` : '미등록'})까지의 헌터만 와 있다.${next ? ` 재심사로 등급이 오르면 ${next.grade}급 헌터도.` : ''}<br>함께 갈 동료 · 게이트에 보내기는 오른쪽 <b>게이트 창구</b>에서.</p>`;
  $('shopBody').querySelectorAll('[data-hire]').forEach(b => b.addEventListener('click', () => {
    if (hireAlly(b.dataset.hire)) Sound.play('rankUp');
    render();
  }));
}
// 남은 시간 — 「2시간 13분」 · 「40분」 · 「1분 안」
function timeLeft(ms) {
  const m = Math.ceil(ms / 60000);
  return m <= 1 ? '1분 안' : m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}`;
}
let gateTicker = null;      // 게이트 창이 열려 있는 동안 남은 시간을 다시 그림
function renderGates() {
  const now = Date.now(), m = State.meta;
  $('shopTitle').textContent = '헌터 협회 · 게이트 창구';
  $('shopGold').innerHTML = `${(m.allies || []).length}명`;
  const rows = (m.allies || []).map(id => {
    const a = ALLIES[id], g = gateOf(id);
    let act;
    if (g && gateDone(id, now)) act = `<span class="ally-state">${g.gate}급 게이트에서 돌아옴</span><button class="btn primary" data-claim="${id}">받는다</button>`;
    else if (g) act = `<span class="ally-state">${g.gate}급 게이트 · 남은 ${timeLeft(g.end - now)}</span>`;
    else if (seatedAlly(id)) act = `<span class="ally-state">길드 사무 중 — 길드 장부에서 일으킬 수 있음</span>`;
    else if (m.ally === id) act = `<span class="ally-state on">함께 가는 중</span><button class="btn tiny" data-comp="">빼기</button>`;
    else act = `<button class="btn tiny" data-comp="${id}">함께 간다</button>
      <span class="gate-btns"><span class="gate-lbl">게이트에 보낸다 →</span>${HUNTER_GRADES.filter((x, i) => i + 1 <= allyGradeN(a)).map(x => {
        const info = gateInfo(x.id);
        return `<button class="btn tiny" data-gate="${id}:${x.id}" title="${info.hours}시간 · 제${info.rank}격의 핵 ${info.cores}개 · 강화석 ${fmt(info.stones)}개">${x.id}급 · ${info.hours}시간</button>`;
      }).join('')}</span>`;
    return `<div class="ally-row${m.ally === id ? ' own' : ''}">
      <span class="ally-ic">${a.icon}</span>
      <div class="ally-body"><div>${allyName(a)}</div><div class="ally-what">${allyWhat(a)}</div><div class="ally-act">${act}</div></div>
    </div>`;
  }).join('');
  const table = HUNTER_GRADES.map(x => { const i = gateInfo(x.id); return `${x.id} ${i.hours}시간 — 제${i.rank}격의 핵 ${i.cores} · 강화석 ${fmt(i.stones)}`; }).join('<br>');
  $('shopBody').innerHTML = `<div class="shop-say">${CLERK_DESKS.gate.icon} ${shopSay}</div>
    ${rows || '<p class="hint">아직 동료가 없다 — 왼쪽 <b>동료 모집</b>에서.</p>'}
    <p class="hint">그 공간에 함께 가는 동료는 한 명 — 함께 가는 동안에는 게이트에 못 간다.<br>게이트는 동료 등급까지 · 게임을 꺼 둬도 시간이 흐른다 · 돌아오면 받을 때까지 기다린다.</p>
    <details class="gate-table"><summary>게이트마다 걸리는 시간 · 가져오는 것</summary><p class="hint">${table}</p></details>`;
  const body = $('shopBody');
  body.querySelectorAll('[data-comp]').forEach(b => b.addEventListener('click', () => { if (setCompanion(b.dataset.comp || null)) Sound.play('equip'); render(); }));
  body.querySelectorAll('[data-gate]').forEach(b => b.addEventListener('click', () => {
    const [id, gid] = b.dataset.gate.split(':');
    if (sendToGate(id, gid)) Sound.play('encounter');
    render();
  }));
  body.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', () => { if (claimGate(b.dataset.claim)) Sound.play('drop'); render(); }));
  startShopTicker();
}
// 시간이 흐르는 창(게이트 · 길드)이 열려 있는 동안 남은 시간 · 쌓인 돈을 다시 그림
function startShopTicker() {
  if (!gateTicker) gateTicker = setInterval(() => {
    if (isShopOpen() && (shopKind === 'gate' || shopKind === 'guild')) renderShop();
    else { clearInterval(gateTicker); gateTicker = null; }
  }, 20000);
}

// ---------- 내 길드 (도시 계획 6번) — 옛 동네의 빈 건물을 사는 창 · 안의 길드 장부 (상점 창을 같이 씀 — shopKind 'guild') ----------
const GUILD_TALK = {
  sale: ['(셔터에 새 종이가 붙어 있다. 「매물 — 급매」. 아래에 전화번호가 적혀 있다.)'],
  own: ['(장부를 펼쳤다. 아직은 얇다.)', '(책상마다 서류가 쌓여 간다. 나쁘지 않다.)']
};
const GUILD_NAME_TALK = [
  { who: 'guide', text: '…진짜 샀네? 셔터 올리니까 먼지가 장난 아니다.' },
  { who: 'guide', text: '그래도 여기가 이제 네 길드야. 동료들 책상 놓고 앉혀 두면, 네가 없는 동안에도 일감이 들어올 거야. 벌어서 조금씩 고치면 돼.' },
  { who: 'guide', ask: 'guild', text: '간판에 걸 이름은 있어야지. 뭐라고 할래?' },
  { who: 'me', text: () => `(오늘부터 「${(State.meta.guild && State.meta.guild.name) || '내 길드'}」.)` }
];
// 4단계 — 길드가 미래 도시 가운데 빈터의 새 건물로 (사용자 결정 2026-11-19). 옛 동네 건물은 「옛 사무실」로 남음
const GUILD_MOVE_TALK = [
  { who: 'guide', text: '…이제 옛 동네엔 다 안 들어가겠다. 도시 한가운데 가림막 친 빈터 있지? 거기에 새로 지었대.' },
  { who: 'guide', text: '이제 길드는 <b>헌터들의 도시</b>에 있어. 장부도 책상도 다 그리로 옮겼고.' },
  { who: 'me', text: '(옛 사무실은 그대로 두자. 처음 시작한 곳이니까.)' }
];
function renderGuild() {
  const won = num(State.meta.won), g = State.meta.guild, now = Date.now();
  $('shopGold').innerHTML = `${pxIcon('won')}돈 ${fmtWon(won)}`;
  if (!g) {                                                  // 아직 안 산 빈 건물 — 문 앞에서
    const price = guildPrice();
    $('shopTitle').textContent = '옛 동네 · 빈 건물';
    $('shopBody').innerHTML = `<div class="shop-say">🏚️ ${shopSay}</div>
      <p class="hint">사들이면 <b>내 길드</b>가 된다 — 이름을 짓고, 사무 자리에 동료를 앉히면 시간마다 돈이 들어온다.<br>단계를 올리면 자리 · 벌이가 늘고 건물이 바뀐다 (5단계까지).</p>
      <div class="assoc-actions"><button class="btn primary" id="guildBuyBtn" ${won >= price ? '' : 'disabled'}><b>사들인다</b><span>${fmtWon(price)}</span></button></div>`;
    $('guildBuyBtn').addEventListener('click', () => {
      if (!buyGuild()) return;
      Sound.play('rankUp');
      closeShop();
      playTalk(GUILD_NAME_TALK, () => render(), { end: '들어가 보자' });
      render();
    });
    return;
  }
  $('shopTitle').textContent = `${g.name || '내 길드'} · 길드 장부`;
  const L = g.level, rate = guildSeatRate(), pend = guildPending(now);
  const idle = (State.meta.allies || []).filter(id => State.meta.ally !== id && !gateOf(id) && !g.seats.includes(id));
  const seats = Array.from({ length: L }, (_, i) => {
    const id = g.seats[i];
    if (id) {
      const a = ALLIES[id], p = guildSeatPending(id, now), full = now - num(g.since[id]) >= RULES.GUILD_CAP_HOURS * 3600e3;
      return `<div class="ally-row own">
        <span class="ally-ic">${a.icon}</span>
        <div class="ally-body"><div>${allyName(a)} <small>사무 자리 ${i + 1}</small></div>
          <div class="ally-what">한 시간에 +${fmtWon(rate)} · 쌓인 것 ${fmtWon(p)}${full ? ' <b>(가득 — 받아야 다시 쌓임)</b>' : ''}</div>
          <div class="ally-act"><button class="btn tiny" data-unseat="${id}">일으킨다</button></div></div>
      </div>`;
    }
    return `<div class="ally-row">
      <span class="ally-ic">🪑</span>
      <div class="ally-body"><div><b>빈 자리</b> <small>사무 자리 ${i + 1}</small></div>
        <div class="ally-act">${idle.length ? idle.map(x => `<button class="btn tiny" data-seat="${x}">${ALLIES[x].icon} ${ALLIES[x].name} 앉힌다</button>`).join('') : '<span class="ally-state">앉힐 동료가 없다 — 함께 가거나 게이트에 간 동료는 못 앉힘</span>'}</div></div>
    </div>`;
  }).join('');
  const up = guildPrice();
  $('shopBody').innerHTML = `<div class="shop-say">${CLERK_DESKS.guild.icon} ${shopSay}</div>
    <div class="assoc-result">${L}단계 · <b>${GUILD_LEVELS[L - 1]}</b> — 사무 자리 ${L}개</div>
    <div class="assoc-actions"><button class="btn primary" id="guildCollectBtn" ${pend > 0 ? '' : 'disabled'}><b>받는다</b><span>+${fmtWon(pend)}</span></button></div>
    ${seats}
    <div class="assoc-actions">${up === null ? '<span class="ally-state">다 올렸다 — 도시에서 가장 멋진 길드</span>'
      : `<button class="btn" id="guildUpBtn" ${won >= up ? '' : 'disabled'}><b>${L + 1}단계로 — ${GUILD_LEVELS[L]}</b><span>${fmtWon(up)} · 자리 ${L + 1}개 · 벌이 ×${(1 + 0.5 * L).toFixed(1)}</span></button>`}</div>
    <p class="hint">사무 자리의 동료는 시간마다 돈을 번다 (게임을 꺼 둬도) — 자리마다 ${RULES.GUILD_CAP_HOURS}시간 몫까지 쌓이고, 받으면 다시 쌓인다.<br>앉은 동료는 그동안 함께 가거나 게이트에 못 간다. 벌이는 이번 회차를 시작할 때의 내 격을 따른다.</p>`;
  const body = $('shopBody');
  $('guildCollectBtn').addEventListener('click', () => { if (collectGuild()) Sound.play('drop'); render(); });
  const ub = $('guildUpBtn');
  if (ub) ub.addEventListener('click', () => {
    if (!upgradeGuild()) return;
    Sound.play('rankUp');
    if (guildLevel() === 4) { closeShop(); playTalk(GUILD_MOVE_TALK, () => render(), { end: '가 보자' }); }   // 4단계 — 미래 도시로
    render();
  });
  body.querySelectorAll('[data-seat]').forEach(b => b.addEventListener('click', () => { if (seatAlly(b.dataset.seat)) Sound.play('equip'); render(); }));
  body.querySelectorAll('[data-unseat]').forEach(b => b.addEventListener('click', () => { if (unseatAlly(b.dataset.unseat)) Sound.play('equip'); render(); }));
  startShopTicker();
}

function renderMatShop() {
  const won = num(State.meta.won);      // 도시의 돈 — 판 값도 만드는 값도 원
  $('shopTitle').textContent = `헌터백화점 · ${DEPT_SECTIONS.mats.name}`;
  $('shopGold').innerHTML = `${pxIcon('won')}돈 ${fmtWon(won)}`;
  const cores = Object.values(CORES).filter(c => matsOf(c.id) > 0);
  const coreSum = cores.reduce((s, c) => s + c.sell * matsOf(c.id), 0);
  const coreBlock = cores.length ? `
    <div class="mat-block core-block">
      <div class="mat-head">
        <span class="mat-name">💠 핵 <b>${fmt(cores.reduce((s, c) => s + matsOf(c.id), 0))}개</b></span>
        <span class="mat-sell"><button class="btn primary" id="sellCoresBtn">모두 판다 +${fmtWon(coreSum)}</button></span>
      </div>
      <div class="core-list">${cores.map(c => `
        <div class="core-row">
          <span class="core-name">${c.name} <b>${fmt(matsOf(c.id))}개</b></span>
          <span class="core-worth">1개 ${fmtWon(c.sell)}</span>
          <button class="btn tiny" data-sellmat="${c.id}" data-n="${matsOf(c.id)}">판다 +${fmtWon(c.sell * matsOf(c.id))}</button>
        </div>`).join('')}</div>
    </div>` : '';
  const blocks = Object.values(MATERIALS).map(mat => {
    const have = matsOf(mat.id), items = ITEMS.filter(i => i.craft && i.craft.mat === mat.id);
    if (!have && !items.some(i => owns(i.id))) return '';
    const cards = items.map(item => {
      const c = item.craft, owned = owns(item.id);
      const worn = getItem(State.meta.equipped[item.slot]);
      const diff = owned ? '' : itemDiffText(item, worn, slotMult(item.slot));
      const spec = itemSpecialText(item);
      const act = owned
        ? `<button class="btn" data-matstone="${item.id}" ${have >= c.n ? '' : 'disabled'}><b>강화석 +${fmt(matStoneYield(item))}</b><span>재료 ${c.n}개</span></button>`
        : `<button class="btn primary" data-craft="${item.id}" ${have >= c.n && won >= c.won && hunterGrade() ? '' : 'disabled'}><b>만든다</b><span>재료 ${c.n}개 · ${fmtWon(c.won)}</span></button>`;
      return `
      <div class="inv-item ware${owned ? ' made' : ''}">
        <span class="inv-art">${itemArt(item)}</span>
        <div class="inv-body">
          <div class="inv-head">${itemTag(item)}<span class="inv-name">${item.name}</span>${owned ? '<span class="mat-have">가짐</span>' : ''}</div>
          <div class="inv-stats">${SLOT_NAMES[item.slot]} · ${itemStatText(item) || '—'}${spec ? ` <span class="inv-spec">${spec}</span>` : ''}</div>
          ${diff ? `<div class="inv-diff">${diff}</div>` : ''}
        </div>
        <div class="inv-act mat-act">${act}</div>
      </div>`;
    }).join('');
    return `
    <div class="mat-block">
      <div class="mat-head">
        <span class="mat-name">${mat.icon} ${mat.name} <b>${fmt(have)}개</b></span>
        <span class="mat-sell">
          <button class="btn tiny" data-sellmat="${mat.id}" data-n="1" ${have ? '' : 'disabled'}>1개 판다 +${fmtWon(mat.sell)}</button>
          <button class="btn tiny" data-sellmat="${mat.id}" data-n="${have}" ${have > 1 ? '' : 'disabled'}>모두 +${fmtWon(mat.sell * have)}</button>
        </span>
      </div>
      <div class="inventory shop-wares">${cards}</div>
    </div>`;
  }).join('');
  $('shopBody').innerHTML = `<div class="shop-say">${DEPT_SECTIONS.mats.icon} ${shopSay}</div>`
    + (hunterGrade() ? '' : '<div class="license-note">🪪 만들기는 헌터 등록증이 있어야 한다 — 팔기 · 강화석으로 바꾸기는 그대로</div>')
    + coreBlock
    + (blocks || (coreBlock ? '' : '<div class="adm-note">가져온 것이 없다 — 몬스터를 꺾으면 핵이, 장비를 지니지 않는 짐승을 꺾으면 재료도 나온다</div>'));
  const all = $('sellCoresBtn');
  if (all) all.addEventListener('click', () => { if (sellAllCores()) { Sound.play('stone'); render(); } });
  for (const b of $('shopBody').querySelectorAll('[data-craft]')) b.addEventListener('click', () => {
    const id = b.dataset.craft;
    if (!craftItem(id)) return;
    Sound.play('equip');
    render();
    askWear(id);
  });
  for (const b of $('shopBody').querySelectorAll('[data-matstone]')) b.addEventListener('click', () => {
    if (matToStones(b.dataset.matstone)) { Sound.play('stone'); render(); }
  });
  for (const b of $('shopBody').querySelectorAll('[data-sellmat]')) b.addEventListener('click', () => {
    if (sellMats(b.dataset.sellmat, Number(b.dataset.n))) { Sound.play('stone'); render(); }
  });
}

// ---------- 장비 사기 — 능력치를 다 보여 주고 묻습니다 ----------
// 상점 목록의 값 단추를 누르면 뜹니다 (상점 창 위에 한 겹). 핵심 스탯은 이 부위 강화를 반영한 값, 그 아래 지금 낀 것과 견준 ▲▼ 전부
let buyId = null;
function openBuy(id) {
  const item = getItem(id);
  if (!item || !shopHere()) return;
  buyId = id;
  // 지갑 — 백화점은 돈(원), 떠돌이 상인은 골드
  const dept = isDeptShop(), gold = num(dept ? State.meta.won : State.meta.gold), m = slotMult(item.slot);
  const cost = n => dept ? fmtWon(n) : `${fmt(n)} 골드`, left = n => dept ? fmtWon(n) : fmt(n);
  const worn = getItem(State.meta.equipped[item.slot]);
  const stats = [
    ...STAT_INFO.filter(s => item[s.id]).map(s => `<li><span>${s.name}</span><b>+${fmt(item[s.id] * m)}</b></li>`),
    ...SPECIAL_KEYS.filter(k => item[k]).map(k => `<li class="sp"><span>${SPECIAL_INFO[k].name}</span><b>+${specialTxt(k, item[k])}</b></li>`)
  ].join('');
  $('buyBody').innerHTML = `
    <div class="buy-item">
      <span class="inv-art">${itemArt(item)}</span>
      <div>
        <div class="inv-head">${itemTag(item)}<span class="inv-name">${item.name}</span></div>
        <div class="buy-slot">${SLOT_NAMES[item.slot]}</div>
      </div>
    </div>
    <ul class="buy-stats">${stats || '<li><span>능력치 없음</span></li>'}</ul>
    <div class="buy-cmp">
      <div class="buy-k">${worn ? `지금 낀 『${worn.name}』${josa(worn.name, '과', '와')} 견주면` : '지금 이 부위는 비어 있음'}</div>
      <div class="inv-diff">${itemDiffText(item, worn, m)}</div>
    </div>
    <div class="buy-price"><span>${cost(item.price)}</span><span class="buy-left">가진 ${dept ? '돈' : '골드'} ${left(gold)} → ${left(gold - item.price)}</span></div>
    <div class="buy-ask">구매하시겠습니까?</div>
    <div class="buy-actions">
      <button class="btn" data-closebuy>그만둔다</button>
      <button class="btn primary" id="buyOkBtn" ${gold >= item.price ? '' : 'disabled'}>구매한다</button>
    </div>`;
  for (const b of $('buyBody').querySelectorAll('[data-closebuy]')) b.addEventListener('click', closeBuy);
  $('buyOkBtn').addEventListener('click', () => {
    const got = buyId, ok = isDeptShop() ? buyDept(got) : buyWare(got);
    closeBuy();
    if (!ok) return;
    Sound.play('equip');
    render();
    askWear(got);
  });
  $('buyModal').classList.remove('hidden');
}
// 산 직후 — 「지금 낄까」를 한 번 묻습니다 (사 놓고 안 낀 채 들어가는 일이 없게). 이미 꼈거나 낄 수 없는 것이면 묻지 않습니다
function askWear(id) {
  const item = getItem(id);
  if (!item || !owns(id) || item.slot === 'special' || !isSlotOpen(item.slot) || equippedSlotOf(id)) return;
  const m = slotMult(item.slot), worn = getItem(State.meta.equipped[item.slot]);
  buyId = id;
  $('buyBody').innerHTML = `
    <div class="buy-item">
      <span class="inv-art">${itemArt(item)}</span>
      <div>
        <div class="inv-head">${itemTag(item)}<span class="inv-name">${item.name}</span></div>
        <div class="buy-slot">${SLOT_NAMES[item.slot]} — 샀다</div>
      </div>
    </div>
    <div class="buy-cmp">
      <div class="buy-k">${worn ? `지금 낀 『${worn.name}』${josa(worn.name, '과', '와')} 견주면` : '지금 이 부위는 비어 있음'}</div>
      <div class="inv-diff">${itemDiffText(item, worn, m)}</div>
    </div>
    <div class="buy-ask">지금 낄까요?</div>
    <div class="buy-actions">
      <button class="btn" data-closebuy>나중에</button>
      <button class="btn primary" id="wearOkBtn">낀다</button>
    </div>`;
  for (const b of $('buyBody').querySelectorAll('[data-closebuy]')) b.addEventListener('click', closeBuy);
  $('wearOkBtn').addEventListener('click', () => {
    equip(id);
    closeBuy();
    Sound.play('equip');
    render();
  });
  $('buyModal').classList.remove('hidden');
}
function closeBuy() {
  buyId = null;
  const m = $('buyModal');
  if (m) m.classList.add('hidden');
}
function isBuyOpen() {
  const m = $('buyModal');
  return !!m && !m.classList.contains('hidden');
}

function isAnyModalOpen() { return isAvatarModalOpen() || isSlotModalOpen() || isSwapModalOpen() || isShopOpen() || isBuyOpen() || isChestOpen() || isLeaveOpen() || isRosterModalOpen() || isSaveModalOpen() || isAdminOpen(); }

// 그 부위의 강화를 반영한 실제 수치를 보여줍니다 — 장부상 수치가 아니라 몸에 붙는 값.
// 강화는 부위에 붙으므로, 목록에 있는 것 무엇을 끼든 이 값이 됩니다.
function itemStatText(item) {
  const m = slotMult(item.slot);
  const parts = [];
  for (const s of STAT_INFO) {
    if (item[s.id]) parts.push(`${s.name} +${fmt(item[s.id] * m)}`);
  }
  return parts.join(' · ');
}

// 특수 능력치는 따로 보여줍니다 — 이게 장비의 성격이니까요.
// 강화를 타지 않습니다 (heroStats 와 같습니다).
// 예전엔 여기만 겹 배수를 곱해서 실제보다 크게 보였습니다.
function itemSpecialText(item) {
  return SPECIAL_KEYS
    .filter(k => item[k])
    .map(k => `${SPECIAL_INFO[k].name} +${specialTxt(k, item[k])}`)
    .join(' · ');
}

// ---------- 장비 비교 ----------
// 목록의 물건을 지금 이 칸에 낀 것과 견줘서, 무엇이 얼마나 오르고 내리는지 ▲▼ 로 보여줍니다.
// 핵심 스탯은 이 부위의 강화가 반영된 값끼리 견줍니다 (어느 쪽을 끼든 같은 강화를 받으니까요).
// 승률이 어떻게 바뀌는지는 일부러 보여주지 않습니다 — 그건 직접 판단할 몫입니다.
// max — 그만큼만 적고 남으면 「…」 (없으면 다)
function itemDiffText(item, worn, m, max = Infinity) {
  const parts = [];
  for (const s of STAT_INFO) {
    const d = (num(item[s.id]) - num(worn && worn[s.id])) * m;
    if (Math.abs(d) < 0.5) continue;
    parts.push(`<span class="${d > 0 ? 'up' : 'down'}">${s.name} ${d > 0 ? '▲' : '▼'}${fmt(Math.abs(d))}</span>`);
  }
  for (const k of SPECIAL_KEYS) {
    const d = num(item[k]) - num(worn && worn[k]);
    if (Math.abs(d) < 0.0005) continue;
    parts.push(`<span class="${d > 0 ? 'up' : 'down'}">${SPECIAL_INFO[k].name} ${d > 0 ? '▲' : '▼'}${specialTxt(k, Math.abs(d))}</span>`);
  }
  if (!parts.length) return '<span class="same">차이 없음</span>';
  return parts.slice(0, max).join('') + (parts.length > max ? '<span class="more">…</span>' : '');
}

// 일반 장비는 성격 꼬리표, 특수장비는 보석/유물 꼬리표
function itemTag(item) {
  if (item.special) return `<span class="sp-tag ${item.special}">${item.special === 'gem' ? '보석' : '유물'}</span>`;
  return archTag(item);
}

function archTag(item) {
  if (!item.arch) return '';
  const a = ARCHETYPES[item.arch];
  return `<span class="arch-tag" style="--arch:${a.color}" title="${a.desc}">${a.name}</span>`;
}

// ---------- 기록 ----------
// 회차를 돌수록 길어져서 기본으로 접어둡니다. 「보기」를 눌러야 펼쳐집니다 (펼친 건 저장하지 않습니다).
let logOpen = false;

function renderLog() {
  const el = $('log');
  const btn = $('logToggle');
  if (btn) {
    btn.textContent = logOpen ? '접기' : '보기';
    btn.classList.toggle('on', logOpen);
  }
  el.hidden = !logOpen;
  // 접혀 있을 때는 그리지도 않습니다 — 200줄을 매번 다시 만들 이유가 없습니다
  if (!logOpen) { el.innerHTML = ''; return; }
  // CSS 가 column-reverse 라서, 오래된 것부터 넣으면 최신이 위에 보입니다.
  // 전투를 보여주는 동안엔 그 전투가 남긴 줄(획득 · 레벨업 …)을 아직 숨깁니다
  const cut = battle ? battle.logFrom : Infinity;
  el.innerHTML = State.log
    .filter(l => !(l.n > cut))
    .map(l => `<div class="log-line ${l.kind}">${l.text}</div>`)
    .join('');
}

// ---------- 여정 종료 화면 ----------
function renderOverlay() {
  const run = State.run;
  // 아직 안 본 전투 결과가 있으면 종료 화면을 미룹니다.
  // 마지막 한 방으로 얻은 전리품을 못 보고 넘어가면 허무하니까요.
  if (!run.over || run.lastResult) {
    $('overlay').classList.add('hidden');
    return;
  }
  const r = rankOf(run.level);
  const zone = ZONES[run.zoneIndex];
  const card = $('overlay').querySelector('.overlay-card');

  card.classList.toggle('victory', !!run.victory);
  // 마왕 너머를 본 뒤로는, 격이 무너지는 화면 구석에 눈 하나가 아주 옅게 스칩니다 (말은 없습니다)
  card.classList.toggle('watched', wallSeen() && !run.victory);
  if (wallSeen()) { guideEye(); card.style.setProperty('--eye', `url("${guideEyeSrc}")`); }
  $('overTitle').textContent = run.victory ? '모든 격을 넘어섰다' : run.walkedOut ? '도시로 나왔다' : '격이 무너졌다';
  // 깼을 때는 제목이 곧 사연이라 아래 줄을 비웁니다 (비면 CSS 가 숨깁니다)
  $('overReason').textContent = run.victory ? '' : run.walkedOut ? '격은 그 공간에 두고 나왔다.' : run.reason;
  // 다음 회차는 도시에서 — 쓰러졌으면 눈을 뜨고, 걸어 나왔으면 그대로 도시로 (도시가 열리기 전의 저장본만 「다시 오른다」)
  $('newRunBtn').firstChild.textContent = !State.meta.cityOpen ? '다시 오른다' : run.walkedOut ? '도시로 간다' : '도시에서 눈을 뜬다';

  $('overStats').innerHTML = `
    <li><span class="k">도달한 지역</span><span class="v">${run.zoneIndex + 1}지역 · ${zone.name}</span></li>
    <li><span class="k">도달한 격</span><span class="v">${knownRank(r.n) ? `제${r.n}격 · ${r.name}` : '???'}</span></li>
    <li><span class="k">최종 레벨</span><span class="v">Lv.${fmtLevel(run.level)}</span></li>
    <li><span class="k">꺾은 화신</span><span class="v">${run.kills}</span></li>
    <li><span class="k">전리품</span><span class="v">${ownedIds().length}/${knownItems().length}</span></li>
    <li><span class="k">영구 경험치</span><span class="v">×${bossXpMult().toFixed(1)}</span></li>
    ${num(run.goldLost) > 0 ? `<li><span class="k">사라진 골드</span><span class="v">${fmt(run.goldLost)}</span></li>` : ''}
  `;
  // 끝을 알리는 소리는 그 회차에 한 번만
  if (soundedOver !== run) {
    soundedOver = run;
    Sound.play(run.victory ? 'victory' : run.walkedOut ? 'zoneMove' : 'gameOver');
  }
  $('overlay').classList.remove('hidden');
}
let soundedOver = null;

// ============================================================
//  초기 화면
// ============================================================
function showTitle() {
  $('title').classList.remove('hidden');
  atmosphere();
  renderTitle();
  Sound.music('title');
}

function renderTitle() {
  const slots = [];
  for (let n = 1; n <= SAVE_SLOTS; n++) {
    const s = slotSummary(n);
    slots.push(`
      <div class="save-slot ${s ? 'used' : ''}">
        <div class="ss-head">
          <span class="ss-n">저장 ${n}</span>
          ${s && s.cleared ? '<span class="ss-clear">클리어</span>' : ''}
        </div>
        ${s
          ? `<div class="ss-info">
               <span>${s.runCount}회차</span>
               <span>${s.bestZone}지역까지</span>
               <span>전리품 ${s.owned}</span>
             </div>
             ${s.run ? `<div class="ss-run">진행 중 — ${s.run.zone}지역 · Lv.${fmtLevel(s.run.level)} · 에너지 ${s.run.energy}</div>` : ''}`
          : `<div class="ss-info empty">비어 있음</div>`}
        <div class="ss-actions">
          ${s ? `<button class="btn primary" data-continue="${n}">이어하기</button>` : ''}
          ${s
            ? `<button class="btn danger" data-wipe="${n}">초기화</button>`      // 「새로 시작」과 같은 일이라 하나만 둡니다
            : `<button class="btn primary" data-new="${n}">새 게임 시작</button>`}
        </div>
        <div class="ss-actions ss-transfer">
          ${s ? `<button class="btn small" data-export="${n}">내보내기</button>` : ''}
          <button class="btn small" data-import="${n}">가져오기</button>
        </div>
      </div>`);
  }
  $('titleMenu').innerHTML = slots.join('');

  for (const b of document.querySelectorAll('[data-export]')) {
    b.addEventListener('click', () => openExport(Number(b.dataset.export)));
  }
  for (const b of document.querySelectorAll('[data-import]')) {
    b.addEventListener('click', () => openImport(Number(b.dataset.import)));
  }

  for (const b of document.querySelectorAll('[data-continue]')) {
    b.addEventListener('click', () => enterGame(Number(b.dataset.continue), false));
  }
  for (const b of document.querySelectorAll('[data-new]')) {
    b.addEventListener('click', () => {
      const n = Number(b.dataset.new);
      if (slotSummary(n) && !confirm(`저장 ${n}의 기록을 지우고 새로 시작합니다. 계속할까요?`)) return;
      enterGame(n, true);
    });
  }
  for (const b of document.querySelectorAll('[data-wipe]')) {
    b.addEventListener('click', () => {
      const n = Number(b.dataset.wipe);
      if (!armTwice(b, '정말 지운다')) return;
      wipeSlot(n);
      renderTitle();
    });
  }
}

// ---------- 세이브 내보내기 / 가져오기 ----------
// 초기 화면의 저장 칸마다 버튼이 있습니다. 코드는 game.js 의 exportSaveCode · parseSaveCode 가 만듭니다.
// 복사가 막힌 환경(파일로 연 html 등)도 있어서, 코드 칸을 직접 길게 눌러 복사할 수도 있게 둡니다.
function openSaveModal(title, body) {
  $('saveModalTitle').textContent = title;
  $('saveModalBody').innerHTML = body;
  $('saveModal').classList.remove('hidden');
}
function closeSaveModal() { $('saveModal').classList.add('hidden'); }
function isSaveModalOpen() { return !$('saveModal').classList.contains('hidden'); }
function saveStatus(text, kind = '') {
  const el = $('saveStatus');
  if (el) { el.textContent = text; el.className = `save-status ${kind}`; }
}
function summaryText(s) { return `${s.runCount}회차 · ${s.bestZone}지역까지 · 전리품 ${s.owned}${s.cleared ? ' · 클리어' : ''}`; }

async function openExport(n) {
  const code = await exportSaveCode(n);
  if (!code) return;
  openSaveModal(`저장 ${n} 내보내기`, `
    <p class="hint">다른 기기의 「가져오기」에 붙여넣는다</p>
    <textarea class="save-code" id="saveCode" readonly>${code}</textarea>
    <div class="save-actions">
      <button class="btn primary" id="saveCopy">복사</button>
      <button class="btn" id="saveDownload">파일로 저장</button>
    </div>
    <div class="save-status" id="saveStatus">${summaryText(slotSummary(n))} · ${fmt(code.length)}자</div>`);

  const ta = $('saveCode');
  ta.addEventListener('focus', () => ta.select());
  $('saveCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      saveStatus('복사했습니다.', 'ok');
    } catch (e) {
      // 클립보드가 막힌 곳 — 선택해 두고 옛 방식으로 한 번 더 시도합니다
      ta.focus(); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) {}
      saveStatus(ok ? '복사했습니다.' : '자동 복사가 막혀 있습니다. 선택된 글자를 길게 눌러 복사해 주세요.', ok ? 'ok' : 'warn');
    }
  });
  $('saveDownload').addEventListener('click', () => {
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    a.download = `jjunsgame-save${n}-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    saveStatus('파일로 저장했습니다.', 'ok');
  });
}

function openImport(n) {
  openSaveModal(`저장 ${n}에 가져오기`, `
    ${slotSummary(n) ? `<p class="hint"><b>저장 ${n}의 기록은 덮어써진다</b></p>` : ''}
    <textarea class="save-code" id="saveInput" placeholder="JJG1. 로 시작하는 코드"></textarea>
    <div class="save-actions">
      <button class="btn" id="saveFile">파일에서 불러오기</button>
      <button class="btn primary" id="saveImport">가져온다</button>
    </div>
    <input type="file" id="saveFileInput" accept=".txt,.json,text/plain" hidden>
    <div class="save-status" id="saveStatus"></div>`);

  const fileInput = $('saveFileInput');
  $('saveFile').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    $('saveInput').value = (await f.text()).trim();
    saveStatus(`「${f.name}」을(를) 읽었습니다. 「가져온다」를 누르세요.`);
  });
  $('saveImport').addEventListener('click', async () => {
    let meta;
    try { meta = await parseSaveCode($('saveInput').value); }
    catch (e) { saveStatus(e.message, 'warn'); return; }

    const incoming = summaryText(summarizeMeta(meta));
    const had = slotSummary(n);
    if (had && !armTwice($('saveImport'), '덮어쓴다')) {
      saveStatus(`저장 ${n}의 기록(${summaryText(had)})을 지우고 가져온 기록(${incoming})으로 바꿉니다. 맞으면 한 번 더 누르세요.`, 'warn');
      return;
    }
    importSave(n, meta);
    renderTitle();
    saveStatus(`가져왔습니다 — ${incoming}`, 'ok');
    setTimeout(closeSaveModal, 1200);
  });
}

// 되돌릴 수 없는 단추는 두 번 누르게 합니다 — 처음 누르면 글자가 바뀌고 빨개지며, 4초 안에 한 번 더 눌러야 true.
// 브라우저 확인 창(confirm)은 쓰지 않습니다 — 앱 안 브라우저 등에서는 창 없이 곧바로 「취소」가 돼서 단추가 안 먹는 것처럼 보였음.
function armTwice(b, label) {
  if (b.dataset.armed) { delete b.dataset.armed; return true; }
  const was = b.textContent;
  b.dataset.armed = '1';
  b.textContent = label;
  b.classList.add('armed');
  setTimeout(() => {
    if (!b.dataset.armed) return;
    delete b.dataset.armed;
    b.textContent = was;
    b.classList.remove('armed');
  }, 4000);
  return false;
}

function enterGame(slot, fresh) {
  openSlot(slot, fresh);
  $('title').classList.add('hidden');
  showTab('journey');
  render();
  if (fresh || !State.meta.tutorialDone) playOpening();
}

// ============================================================
//  무명의 화신 — 마왕을 처음 꺾은 뒤 전리품 창에 들어서면 말을 걸어옵니다
// ============================================================
// 화신 시스템을 알려주고, 진짜 화신을 얻을 때까지 대신 화신이 되어 줍니다 (game.js 의 meetNameless).
// 누구인지는 말하지 않습니다. 넓은 화면에는 탭이 없으니 마왕을 지난 뒤 처음 그리는 때에 뜹니다.
const NAMELESS_TALK = [
  '…들리나. 벽이 깨졌으니 이쪽 말도 닿는 모양이군.',
  '여기까지 올라온 자는 오랜만이다. 이제부터는 이름을 가진 것들이 길을 막는다. 그중 몇은 — 너를 마음에 들어 할지도 모르지.',
  '꺾은 상대가 너를 자기 몫으로 삼는 것. 그걸 <b>화신</b>이라 부른다.',
  '다만 쉽게 오지 않는다. <b>서른 번을 꺾어도 한 번 올까 말까</b> — 보스라면 그보다 조금 더 드물지. 눈에 드는 놈이 있거든 <b>몇 번이고 다시 꺾어라.</b> 여정이 끝나도 그것들은 제자리에 다시 선다.',
  '삼은 화신의 이름이 네 이름 앞에 붙는다. 얻는 것도 잃는 것도 한쪽으로 크게 기운다. <b>한 번에 하나</b>만 삼을 수 있고, 싸우는 동안에는 못 바꾼다. 고르는 건 이 창 맨 위의 칸에서 한다.',
  '아직 아무도 너를 고르지 않았으니, 그때까지는 <b>내가 대신 맡아 주지.</b> 이름은 묻지 마라. 없다.'
];
function maybeNamelessTalk() {
  const m = State.meta;
  if (!State.run || m.namelessMet || !wallSeen() || wallPending || fightLocked()) return;
  if (!$('title').classList.contains('hidden') || isTalkOpen()) return;
  if ((m.avatars || []).length) { m.namelessMet = true; save(); return; }   // 이미 곁에 누가 있다
  playTalk(NAMELESS_TALK.map(text => ({ who: 'nameless', text })), () => { meetNameless(); Sound.play('equip'); }, { end: '…알겠다' });
}

// ============================================================
//  대화창 — 주인공의 혼잣말 · 눈동자 길잡이 · 무명의 화신
// ============================================================
// 줄 하나 = { who: 'me' | 'guide' | 'nameless', text: 글 또는 글을 돌려주는 함수, ask: 'name' (이름을 묻는 줄) }.
// 길잡이는 눈동자입니다 (docs/CITY-PLAN.md — 1-라). 누가 보냈는지는 말하지 않고, 이름도 「???」 입니다.

// 눈동자 길잡이 — 16×16 도트. 글자 하나가 한 칸 (o 테두리 · w 흰자 · s 그늘 · I · i 홍채 · p 눈동자 · h 빛)
const GUIDE_EYE = [
  '................', '.....oooooo.....', '...oowwwwwwoo...', '..owwwwwwwwwwo..',
  '..owwwwoooowwo..', '.owwwwoIIIIowwo.', '.owwwoIiiiiIowo.', '.owwwoIiphpIoso.',
  '.owwwoIipppIoso.', '.owwwoIiiiiIoso.', '.owwwwoIIIIosso.', '..owwwwoooosso..',
  '..owwwwsssssso..', '...oowsssssoo...', '.....oooooo.....', '................'
];
const GUIDE_PAL = { o: '#2a1a10', w: '#f4ecd8', s: '#c4b69c', I: '#783e12', i: '#d68c2e', p: '#120a06', h: '#ffffff' };
let guideEyeSrc = null;
function guideEye(cls = '') {
  if (!guideEyeSrc) guideEyeSrc = pixelSprite(GUIDE_EYE, GUIDE_PAL);
  return `<span class="guide-eye ${cls}" style="background-image:url('${guideEyeSrc}')"></span>`;
}

// 글자 그림(한 글자 = 한 칸, 팔레트에 없는 글자는 빈칸)을 SVG 데이터 주소로 — 눈동자 · 돈 · 강화석이 씁니다
function pixelSprite(rows, pal) {
  const w = rows[0].length, h = rows.length;
  const rects = rows.flatMap((row, y) => [...row].map((c, x) => pal[c] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[c]}"/>` : '')).join('');
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`);
}

// 돈(원) — 초록 지폐 16×10 · 강화석 — 보랏빛 결정 12×12. 글자 옆에 글자 크기로 붙습니다 (pxIcon)
const PIXEL_ICONS = {
  won: { pal: { o: '#1f3a22', l: '#c9eaa8', g: '#79b862', d: '#4c8a40', c: '#2f5f2a', w: '#eef8dc' }, rows: [
    'oooooooooooooooo',
    'olllllllllllllgo',
    'olggggggggggggdo',
    'olgdggwwwwggdgdo',
    'olggggwccwggggdo',
    'olggggwccwggggdo',
    'olgdggwwwwggdgdo',
    'olggggggggggggdo',
    'ogdddddddddddddo',
    'oooooooooooooooo'] },
  stone: { pal: { o: '#1d1840', h: '#ece8ff', b: '#9a90f2', a: '#6253d6', d: '#3b2f9e' }, rows: [
    '....oooo....',
    '...ohhbbo...',
    '..ohhbbaao..',
    '.ohhbbbaaao.',
    'ohbbbbaaaado',
    'obbbbbaaaddo',
    'obbbbaaaaddo',
    '.obbbaaaddo.',
    '..obbaaddo..',
    '...obaddo...',
    '....oddo....',
    '.....oo.....'] }
};
const pixelIconSrc = {};
function pxIcon(name) {
  const def = PIXEL_ICONS[name];
  if (!def) return '';
  const src = pixelIconSrc[name] || (pixelIconSrc[name] = pixelSprite(def.rows, def.pal));
  return `<img class="px-ic px-${name}" src="${src}" alt="" aria-hidden="true">`;
}

// 주인공의 이름 — 정하기 전에는 「나」
function heroName() { return State.meta.heroName || '나'; }

const TALK_WHO = { me: () => heroName(), guide: () => '???', nameless: () => '무명의 화신', stranger: () => '???', ally: () => ALLIES.hayun.name };
let talkScript = [], talkIndex = 0, talkDone = null, talkOpts = {};
function isTalkOpen() { const t = $('talk'); return !!t && !t.classList.contains('hidden'); }
// 대사를 차례로 보여 줍니다. 다 보면 done(). opts.skip — 건너뛰기 단추(이름을 묻는 줄은 건너뛰지 않음), opts.end — 마지막 단추 글
function playTalk(script, done, opts = {}) {
  talkScript = script; talkIndex = 0; talkDone = done || null; talkOpts = opts;
  $('talk').classList.remove('hidden');
  renderTalk();
}
function renderTalk() {
  const line = talkScript[talkIndex], last = talkIndex === talkScript.length - 1, ask = line.ask === 'name' || line.ask === 'guild';
  $('talk').dataset.who = line.who;
  $('talkWho').textContent = TALK_WHO[line.who]();
  $('talkFace').innerHTML = line.who === 'guide' ? guideEye('bob') : line.who === 'me' ? heroSprite() : line.who === 'stranger' || line.who === 'ally' ? allySprite('hayun') : '';
  $('talkFace').classList.toggle('hidden', line.who === 'nameless');
  $('talkBody').innerHTML = typeof line.text === 'function' ? line.text() : line.text;
  $('talkName').classList.toggle('hidden', !ask);
  $('talkNext').classList.toggle('hidden', ask);
  $('talkSkip').classList.toggle('hidden', !talkOpts.skip || ask);
  if (ask) {
    const inp = $('talkNameInput');
    inp.value = (line.ask === 'guild' ? State.meta.guild && State.meta.guild.name : State.meta.heroName) || '';
    checkName();
    setTimeout(() => inp.focus(), 60);
  } else {
    $('talkNext').innerHTML = (last ? (talkOpts.end || '알겠다') : '다음') + KEY_HINT;
  }
}
function nextTalk() {
  if (talkScript[talkIndex] && talkScript[talkIndex].ask) return;
  if (talkIndex < talkScript.length - 1) { talkIndex++; renderTalk(); return; }
  endTalk();
}
function endTalk() {
  $('talk').classList.add('hidden');
  const done = talkDone;
  talkDone = null;
  if (done) done();
  render();
}
function skipTalk() {
  const k = talkScript.findIndex((l, i) => i > talkIndex && l.ask);
  if (k >= 0) { talkIndex = k; renderTalk(); return; }
  endTalk();
}
// 이름 — 1~8글자. 꺾쇠 · 따옴표처럼 화면을 깨뜨릴 수 있는 글자는 뺍니다
function cleanName(s) { return String(s || '').replace(/[<>&"'`\\]/g, '').trim().slice(0, 8); }
function checkName() { $('talkNameOk').disabled = !cleanName($('talkNameInput').value); }
function submitName() {
  const n = cleanName($('talkNameInput').value);
  if (!n) return;
  if (talkScript[talkIndex] && talkScript[talkIndex].ask === 'guild') setGuildName(n);   // 길드 이름
  else State.meta.heroName = n;
  save();
  Sound.play('commit');
  if (talkIndex < talkScript.length - 1) { talkIndex++; renderTalk(); } else endTalk();
}

// ---------- 맨 처음 — 혼잣말과 눈동자 길잡이 (설명 카드 넉 장을 대신합니다) ----------
const OPENING = [
  { who: 'me', text: '게이트 뒷정리. 헌터들이 다 털고 나간 자리에서 부스러기를 줍는 일이다. 등록증도 없는 사람한테 들어오는 일은 그런 것뿐이다.' },
  { who: 'me', text: '그날은 달랐다. 닫히던 게이트에서 무언가 쏟아져 나왔고, 다들 반대로 뛰었다. …나는 왜인지 그쪽으로 뛰어들었다.' },
  { who: 'me', text: '눈을 뜨니 축축한 수로다. 하수구라기엔 너무 넓고, 너무 조용하다.' },
  { who: 'guide', text: '어, 일어났네? 여기 떨어지는 것들은 대개 다시 안 일어나는데.' },
  { who: 'guide', text: '겁먹지 마, 난 안 물어. 여기서 오래 굴러다녀서 길은 좀 알아. 따라오면서 들어.' },
  { who: 'guide', text: '걷다가 <b>몬스터에 닿으면 싸움</b>이야. 폰은 아래 조이스틱, 키보드는 방향키. 보자마자 쫓아오는 놈도, 달아나는 놈도 있어. <b>정예랑 보스는 정해진 자리</b>에 서 있고, 한 번 들어와서는 한 번만 만나. 대신 좋은 걸 남기지.' },
  { who: 'guide', text: '맞서기 전에 <b>이길 만한지 예감</b>이 와. 에너지는 <b>맞설 때만</b> 줄어 — 물러서면 그대로야. 근데 <b>먼저 덤벼든 놈</b>한테서는 못 물러서.' },
  { who: 'guide', text: '에너지가 다하면 쓰러져. 몸은 처음으로 돌아가지만, <b>빼앗은 건 그대로 남아.</b> 다음엔 더 센 채로 시작하는 거지.' },
  { who: 'guide', text: '같은 걸 또 주우면 저절로 부서져서 <b>그 부위의 강화석</b>이 돼. 강화석으로 그 칸을 올리면, 거기에 뭘 끼든 세져.' },
  { who: 'me', text: '…말하는 눈알한테 길을 배우게 될 줄은 몰랐다.' }
];
function playOpening() {
  playTalk(OPENING, () => { State.meta.tutorialDone = true; save(); }, { skip: true, end: '가 본다' });
}

// ---------- 도시에서 처음 눈을 뜰 때 — 이상한 느낌과 이름 (docs/CITY-PLAN.md 1-라) ----------
// 첫 회차가 끝난 뒤, 도시(옛 동네)에 처음 서면 한 번. 이름을 정하기 전까지는 도시에 설 때마다 다시 뜹니다
const CITY_WAKE = [
  { who: 'me', text: '…천장이다. 우리 집 천장.' },
  { who: 'me', text: '분명히 쓰러졌는데, 몸은 멀쩡하다. 주머니에는 거기서 주운 것들이 그대로 들어 있다.' },
  { who: 'me', text: '이상한 기분이다. 무언가가 나를 붙잡아 이쪽으로 밀어 올린 것 같은. …기분 탓이겠지.' },
  { who: 'guide', text: '여기가 네가 사는 데구나. 시끄럽고 밝네. …아 참, 너 이름이 뭐였지?' },
  { who: 'guide', ask: 'name', text: '이름 정도는 알아야 부르지.' },
  { who: 'guide', text: () => `<b>${heroName()}</b>. 좋아, 기억해 둘게.` },
  { who: 'guide', text: '가져온 <b>핵이랑 가죽</b>은 저쪽 큰 도시의 <b>헌터백화점 재료 창구</b>에서 돈으로 바꿔 줄 거야.' },
  { who: 'guide', text: '장비를 사려면 <b>헌터 등록증</b>이 있어야 한대. 도시 위쪽 큰 건물 — <b>헌터 협회</b>에서 시험을 보면 돼. 지금 그대로 싸워서.' },
  { who: 'guide', text: '그리고 다시 들어가는 길은 — 네 집 바로 옆 틈의 그 이상한 게이트. 너한테만 보일걸.' }
];
function maybeCityWake() {
  const m = State.meta, run = State.run;
  if (!run || run.over || !m.cityOpen || m.heroName || battle || fightLocked() || !inTown()) return;
  if (!$('title').classList.contains('hidden') || isTalkOpen() || isAnyModalOpen()) return;
  playTalk(CITY_WAKE, null);
}

// 관측자를 그리는 자리 — 길잡이와 같은 눈동자 (사용자 결정: 마왕 뒤의 늦은 힌트). 다른 몬스터는 제 아이콘
function foeIcon(foe) { return foe && foe.id === 'observer' ? guideEye('foe-eye') : foe.icon; }

// 길잡이의 한마디 — 도시에 섰을 때 새로 열린 것을 한 번씩 (대사는 제안). 본 것은 meta.guideSaw 에 적어 다시 말하지 않습니다
// 첫 동료와의 만남 (협회 로비 — 제4격 보스 뒤). 대사는 제안 (가칭 하윤 — D급)
const ALLY_MEET = [
  { who: 'stranger', text: '잠깐만요. …등록한 지 얼마 안 됐죠? 그런데 벌써 등급이 몇 번이나 올랐어요.' },
  { who: 'stranger', text: '측정기는 「반응 없음」이었다면서요. 창구 직원이 이상하다고 하는 걸 들었어요.' },
  { who: 'me', text: '(…들켰나.)' },
  { who: 'stranger', text: '캐묻지는 않을게요. 대신 — 데려가 줘요. 어디로 가는지는 몰라도, 거기서 강해지는 거잖아요.' },
  { who: 'guide', text: '…한 명쯤은 같이 들어갈 수 있을지도 몰라. 네 곁에 딱 붙어 있으면.' },
  { who: 'ally', text: () => `하윤이에요. D급이고요. ${heroName()} 씨 옆에서 한 번씩 더 칠게요 — 그 정도는 해요.` },
  { who: 'me', text: '(동료가 생겼다.)' }
];
const GUIDE_NOTES = [
  { id: 'guildSale', when: () => guildForSale(), key: () => 1,
    text: () => '집 옆 빈 건물 있잖아. 셔터에 <b>「매물」</b> 종이가 새로 붙었어. 이제 너도 살 수 있을걸 — <b>네 길드</b>로.' },
  { id: 'guildFull', when: () => guildFull(), key: () => Math.floor(Date.now() / (RULES.GUILD_CAP_HOURS * 3600e3)),
    text: () => `${State.meta.guild.name || '네 길드'} 장부가 꽉 찼대. 가서 <b>받아</b> 줘야 다시 쌓여.` },
  { id: 'gates', when: () => gatesOpen(), key: () => 1,
    text: () => '협회에 창구 둘이 새로 열렸대. 왼쪽은 <b>동료 모집</b>, 오른쪽은 <b>게이트 창구</b> — 동료를 게이트에 보내 두면, 네가 없는 동안에도 벌어 온대.' },
  { id: 'gateBack', when: () => gatesDoneCount() > 0, key: () => Math.max(...Object.values(State.meta.gates).filter(g => Date.now() >= g.end).map(g => g.end)),
    text: () => `게이트에 간 동료가 돌아왔어${gatesDoneCount() > 1 ? ` — ${gatesDoneCount()}명` : ''}. 협회 <b>게이트 창구</b>에서 받아.` },
  { id: 'ally', when: () => allyWaiting(), key: () => 1,
    text: () => '협회 로비에 누가 너를 기다리는 것 같아. 아까부터 이쪽을 보고 있던데.' },
  { id: 'armor', when: () => armorOpen(), key: () => 1,
    text: () => '백화점 <b>2층</b>이 열렸대. 1층 에스컬레이터 위 — <b>방어구 매장</b>. 투구 · 갑옷 · 장갑 · 신발이래.' },
  { id: 'dept', when: () => deptOpenRank() > 1, key: () => deptOpenRank(),
    text: () => `백화점에 새 물건이 들어왔대. <b>제${deptOpenRank()}격</b> 것. 보스를 꺾었다는 소문이 벌써 돌았나 봐.` },
  { id: 'regrade', when: () => hunterGrade() > 0 && hunterGrade() < Math.min(HUNTER_GRADES.length, deptOpenRank() - 1) && canTakeTest(), key: () => deptOpenRank() - 1,
    text: () => `제${deptOpenRank() - 1}격 보스까지 꺾었는데 아직 <b>${gradeName()}급</b>이야? 협회에서 <b>재심사</b>를 받아 봐.` }
];
function maybeGuideNote() {
  const m = State.meta, run = State.run;
  if (!run || run.over || !m.cityOpen || !m.heroName || battle || fightLocked() || !inTown()) return;
  if (!$('title').classList.contains('hidden') || isTalkOpen() || isAnyModalOpen()) return;
  const saw = m.guideSaw && typeof m.guideSaw === 'object' ? m.guideSaw : (m.guideSaw = {});
  const note = GUIDE_NOTES.find(n => n.when() && num(saw[n.id]) < n.key());
  if (!note) return;
  saw[note.id] = note.key();
  save();
  playTalk([{ who: 'guide', text: note.text() }], null, { end: '알았어' });
}
// ============================================================
//  관리자 — 왼쪽 위 이름표(제목 명패)를 빠르게 다섯 번 누르면 열립니다
// ============================================================
// 화면 설정에서 뺀 보기 설정 셋, 정확한 승률, 소리 시험, 그리고 그림 · 효과 · 맵을 시험할 때 쓸 도구들.
// 진행을 바꾸는 도구는 「시험 모드」를 켜야 눌립니다. 시험 모드에서는 아무것도 저장되지 않아서
// 다시 불러오면 원래대로 돌아갑니다 — 실제 저장을 망가뜨리지 않으려는 안전장치입니다.
const Admin = { testMode: false, showOdds: false };
let brandTaps = [];

const SFX_LABELS = {
  tick: '누르기', encounter: '조우', encounterElite: '조우 · 정예', encounterBoss: '조우 · 보스', aura: '기운',
  retreat: '물러섬', zoneMove: '지역 이동', hit: '때림', crit: '치명타', harm: '일격', foeHit: '맞음',
  foeCrit: '크게 맞음', miss: '빗나감', block: '막기', heal: '회복', special: '특수', win: '승리', lose: '패배',
  drop: '새 전리품', stone: '분해', levelUp: '레벨업', rankUp: '격 상승', pathOpen: '길 열림', unlock: '칸 열림',
  enhanceOk: '강화 성공', enhanceFail: '강화 실패', equip: '장착', unequip: '해제', commit: '분배',
  gameOver: '여정의 끝', victory: '모두 깸'
};
const SONG_LABELS = { title: '초기 화면', field: '여정', boss: '보스' };

function wireAdmin() {
  const brand = document.querySelector('.topbar .brand');
  if (brand) {
    brand.addEventListener('click', () => {
      const now = Date.now();
      brandTaps = brandTaps.filter(t => now - t < 2500);
      brandTaps.push(now);
      if (brandTaps.length >= 5) { brandTaps = []; openAdmin(); }
    });
  }
  for (const b of document.querySelectorAll('[data-closeadmin]')) b.addEventListener('click', closeAdmin);
}

function openAdmin() {
  renderAdmin();
  $('adminModal').classList.remove('hidden');
}
function closeAdmin() {
  $('adminModal').classList.add('hidden');
  render();          // 소리 시험으로 바꾼 배경음도 제자리로
}
function isAdminOpen() {
  const m = $('adminModal');
  return !!m && !m.classList.contains('hidden');
}

function renderAdmin() {
  const el = $('adminBody');
  const run = State.run;
  if (!el || !run) return;
  const t = Admin.testMode;
  const off = t ? '' : 'disabled';
  const st = Sound.status();
  const zoneOpts = ZONES.map((z, i) =>
    `<option value="${i}" ${i === run.zoneIndex ? 'selected' : ''}>${i + 1}. ${z.name}</option>`).join('');
  const foeOpts = zoneRoster(run.zoneIndex).map(f =>
    `<option value="${f.id}">${f.kind !== 'normal' ? `[${KINDS[f.kind].name}] ` : ''}${f.name} · Lv.${fmtLevel(f.level)}</option>`).join('');

  el.innerHTML = `
    <section class="adm-sec">
      <div class="adm-k">시험 모드</div>
      ${t
        ? `<p class="adm-note warn">켜져 있다 — 지금부터 바꾼 것은 저장되지 않는다.</p>
           <div class="adm-row"><button class="btn small" data-adm="reload">끝내기 · 다시 불러오기</button></div>`
        : `<p class="adm-note">아래 도구는 시험 모드에서만 눌린다. 켜면 이 판은 저장되지 않고, 다시 불러오면 원래대로 돌아간다.</p>
           <div class="adm-row"><button class="btn small primary" data-adm="test">시험 모드 켜기</button></div>`}
    </section>

    <section class="adm-sec">
      <div class="adm-k">보기</div>
      <div class="settings">${settingRowsHTML(ADMIN_SETTINGS_UI, true)}</div>
      <div class="adm-row">
        <button class="btn tiny ${Admin.showOdds ? 'on' : ''}" data-adm="odds">정확한 승률 ${Admin.showOdds ? '켜짐' : '꺼짐'}</button>
      </div>
    </section>

    <section class="adm-sec">
      <div class="adm-k">회차 <span>Lv.${fmtLevel(run.level)} · 에너지 ${run.energy}</span></div>
      <div class="adm-row">
        <button class="btn tiny" data-adm="lv10" ${off}>레벨 +10</button>
        <button class="btn tiny" data-adm="lv2x" ${off}>레벨 ×2</button>
        <button class="btn tiny" data-adm="lv10x" ${off}>레벨 ×10</button>
      </div>
      <div class="adm-row">
        <button class="btn tiny" data-adm="en10" ${off}>에너지 +10</button>
        <button class="btn tiny" data-adm="en99" ${off}>에너지 99</button>
        <button class="btn tiny danger" data-adm="end" ${off}>회차 끝내기</button>
      </div>
    </section>

    <section class="adm-sec">
      <div class="adm-k">지역 · 상대</div>
      <div class="adm-row">
        <select class="swap-from" id="admZone" ${off}>${zoneOpts}</select>
        <button class="btn tiny" data-adm="zone" ${off}>이동</button>
      </div>
      <div class="adm-row">
        <select class="swap-from" id="admFoe" ${off}>${foeOpts}</select>
        <button class="btn tiny" data-adm="foe" ${off}>부르기</button>
      </div>
    </section>

    <section class="adm-sec">
      <div class="adm-k">주기</div>
      <div class="adm-row">
        <button class="btn tiny" data-adm="itemsZone" ${off}>이 지역 전리품</button>
        <button class="btn tiny" data-adm="itemsAll" ${off}>모든 전리품</button>
        <button class="btn tiny" data-adm="stones" ${off}>강화석 +1,000</button>
        <button class="btn tiny" data-adm="gold" ${off}>골드 +10,000</button>
        <button class="btn tiny" data-adm="won" ${off}>돈 +1,000만 원</button>
        <button class="btn tiny" data-adm="merchant" ${off}>떠돌이 상인을 여기로</button>
        <button class="btn tiny" data-adm="avatar" ${off}>화신 하나 얻기</button>
        <button class="btn tiny" data-adm="special" ${off}>특수장비 칸 모두</button>
      </div>
    </section>

    <section class="adm-sec">
      <div class="adm-k">소리 <span>효과음 ${st.prefs.sfx ? '켜짐' : '꺼짐'} · 배경음 ${st.prefs.bgm ? '켜짐' : '꺼짐'}</span></div>
      <div class="adm-row">${Sound.names().sfx.map(n =>
        `<button class="btn tiny" data-sfx="${n}">${SFX_LABELS[n] || n}</button>`).join('')}</div>
      <div class="adm-row">${Sound.names().songs.map(n =>
        `<button class="btn tiny" data-song="${n}">♪ ${SONG_LABELS[n] || n}</button>`).join('')}
        <button class="btn tiny" data-song="">■ 멈춤</button>
      </div>
    </section>`;

  wireSettingButtons(el);
  for (const b of el.querySelectorAll('[data-adm]')) b.addEventListener('click', () => adminAction(b.dataset.adm));
  for (const b of el.querySelectorAll('[data-sfx]')) b.addEventListener('click', () => Sound.play(b.dataset.sfx));
  for (const b of el.querySelectorAll('[data-song]')) b.addEventListener('click', () => Sound.music(b.dataset.song || null));
}

function adminAction(a) {
  const run = State.run;
  const meta = State.meta;
  switch (a) {
    case 'test':
      Admin.testMode = true;
      blockSaving();
      document.body.classList.add('test-mode');
      break;
    case 'reload': location.reload(); return;
    case 'odds': Admin.showOdds = !Admin.showOdds; break;
    case 'lv10':  adminLevelTo(run.level + 10); break;
    case 'lv2x':  adminLevelTo(run.level * 2); break;
    case 'lv10x': adminLevelTo(run.level * 10); break;
    case 'en10': run.energy += 10; break;
    case 'en99': run.energy = 99; break;
    case 'end':
      stopBattle();
      run.lastResult = null;
      run.encounter = null;
      endRun('관리자가 끝냈다');
      break;
    case 'zone': adminJumpZone(Number($('admZone').value)); break;
    case 'foe':
      adminSummon($('admFoe').value);
      closeAdmin();
      showTab('journey');
      soundEncounter();
      return;
    case 'itemsZone': {
      const rank = ZONES[run.zoneIndex].rank;
      for (const it of ITEMS) if (it.rank.n === rank) meta.owned[it.id] = 1;
      for (const f of zoneRoster(run.zoneIndex)) if (!meta.seen.includes(f.id)) meta.seen.push(f.id);
      break;
    }
    case 'itemsAll':
      for (const it of ITEMS) meta.owned[it.id] = 1;
      for (const f of ENEMIES) if (!meta.seen.includes(f.id)) meta.seen.push(f.id);
      break;
    case 'stones':
      for (const k of Object.keys(meta.stones)) meta.stones[k] += 1000;
      break;
    case 'special':
      meta.specialOpened = ENEMIES.filter(f => f.opens).map(f => f.id);
      break;
    case 'gold':
      meta.gold = num(meta.gold) + 10000;
      break;
    case 'won':
      meta.won = num(meta.won) + 10000000;
      break;
    case 'avatar': {
      // 아직 없는 화신 하나를 무작위로 — 처음이면 바로 삼습니다
      const pool = ENEMIES.filter(f => canBecomeAvatar(f) && !meta.avatars.includes(f.id));
      if (!pool.length) break;
      const f = pool[Math.floor(Math.random() * pool.length)];
      meta.avatars.push(f.id);
      if (!meta.avatar) meta.avatar = f.id;
      break;
    }
    case 'merchant': {
      // 조건(3지역 숨은 것)과 상관없이 지금 지역에 세웁니다. 파는 것은 아직 안 가진 것 중 셋
      const pool = ITEMS.filter(i => i.ware && !owns(i.id));
      run.merchant = { zone: run.zoneIndex, wares: pool.slice(0, 3).map(i => i.id), bought: [] };
      break;
    }
  }
  render();            // 관리자 창도 render 가 다시 그립니다
}

// 경험치를 부어 그 레벨까지 — 레벨업 포인트도 정상적으로 받습니다
function adminLevelTo(target) {
  const run = State.run;
  const goal = Math.min(LEVEL_CAP, Math.max(run.level + 1, Math.floor(target)));
  const need = totalXpFor(goal) - (totalXpFor(run.level) + run.xp);
  if (need > 0) gainXp(need * (1 + 1e-9) + 1);
}

function adminJumpZone(i) {
  const run = State.run;
  if (!ZONES[i]) return;
  stopBattle();
  run.zoneIndex = i;
  run.progress = 0;
  run.zoneCleared = false;
  run.encounter = null;
  run.onBoss = false;
  run.aura = null;
  run.lastResult = null;
}

// 고른 상대와 바로 마주합니다. 이미 꺾은 정예 · 보스도 다시 부를 수 있습니다.
function adminSummon(id) {
  const foe = getEnemy(id);
  if (!foe) return;
  const run = State.run;
  stopBattle();
  run.lastResult = null;
  run.downed = run.downed.filter(x => x !== foe.id);
  beginEncounter(foe, !!foe.once);
  render();
}

// ---------- 시작 ----------
function init() {
  wireTabs();
  wireKeys();
  wireClickSound();
  wireAdmin();

  $('newRunBtn').addEventListener('click', () => { startRun(); showTab('journey'); render(); });
  $('logToggle').addEventListener('click', () => { logOpen = !logOpen; renderLog(); });
  $('toTitleBtn').addEventListener('click', () => { currentSlot = 0; showTitle(); });
  for (const b of document.querySelectorAll('[data-closesave]')) b.addEventListener('click', closeSaveModal);
  for (const b of document.querySelectorAll('[data-closeswap]')) b.addEventListener('click', closeSwapModal);
  for (const b of document.querySelectorAll('[data-closeavatar]')) b.addEventListener('click', closeAvatarModal);
  for (const b of document.querySelectorAll('[data-closeshop]')) b.addEventListener('click', closeShop);
  for (const b of document.querySelectorAll('#buyModal > [data-closebuy], #buyModal .modal-head [data-closebuy]')) b.addEventListener('click', closeBuy);
  for (const b of document.querySelectorAll('[data-closechest]')) b.addEventListener('click', closeChest);
  for (const b of document.querySelectorAll('[data-closeleave]')) b.addEventListener('click', closeLeave);
  $('leaveOkBtn').addEventListener('click', confirmLeave);

  const ago = $('agOk');
  if (ago) ago.addEventListener('click', () => $('avatarGain').classList.add('hidden'));
  $('talkNext').addEventListener('click', nextTalk);
  $('talkSkip').addEventListener('click', skipTalk);
  $('talkNameOk').addEventListener('click', submitName);
  $('talkNameInput').addEventListener('input', checkName);
  $('talkNameInput').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); submitName(); } });

  // 아직 슬롯을 고르지 않았으므로 빈 상태로 한 번 그려두고 초기화면을 띄웁니다
  startRun();
  render();
  showTitle();
}

init();
