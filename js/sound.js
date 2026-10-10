// ============================================================
//  sound.js  —  효과음과 배경음
//  소리 파일이 없습니다. 옛 게임기처럼 네모파 · 세모파 · 잡음을 그 자리에서 만듭니다 (Web Audio).
//  그래서 한 파일 빌드에도 그대로 들어가고, 인터넷이 없어도 납니다.
//
//    Sound.play('hit')      효과음
//    Sound.music('field')   배경음 바꾸기 — 같은 곡이면 아무 일도 안 하고, null 이면 멈춥니다
//    Sound.get / Sound.set  효과음 · 배경음 켜고 끄기. 기기에 저장합니다 (저장 칸과 상관없음)
//
//  브라우저는 사용자가 한 번 누르기 전에는 소리를 못 내게 막습니다.
//  그래서 첫 터치 · 클릭 · 키를 기다렸다가 소리를 깨웁니다.
//  화면이 꺼지거나 다른 앱으로 가면 소리를 재우고, 돌아오면 다시 깨웁니다.
//
//  배경음을 직접 만든 곡으로 바꾸고 싶으면 SONGS 대신 소리 파일을 쓰도록 music 만 고치면 됩니다.
// ============================================================
const Sound = (() => {
  'use strict';

  const PREF_KEY = 'jjunsgame.audio';
  const prefs = { sfx: true, bgm: true };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { /* 저장소가 막힌 곳 */ }

  const SFX_LEVEL = 0.9;     // 효과음 전체 크기
  const BATTLE_LEVEL = 0.6;  // 그중 전투 중 한 줄마다 나는 소리 — 한 판에 수십 번 나서 따로 낮춥니다
  const BGM_LEVEL = 0.38;    // 배경음 전체 크기 — 효과음보다 한참 작게 깝니다 (전투 소리가 묻히지 않게)

  let ac = null;             // AudioContext — 첫 입력 때 만듭니다
  let eng = null;            // 그 위의 소리 엔진
  let want = null;           // 지금 틀어야 할 곡 (소리가 깨기 전에 정해질 수 있습니다)
  let cur = null;            // 지금 도는 곡 — { name, song, gain, step, next, timer }
  const lastPlayed = {};     // 같은 효과음이 한꺼번에 겹쳐 터지지 않게

  // ---------- 음 이름 → 높이 ----------
  const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const freqCache = new Map();
  function N(name) {
    if (freqCache.has(name)) return freqCache.get(name);
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
    let f = 0;
    if (m) {
      const k = NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
      const midi = (Number(m[3]) + 1) * 12 + k;
      f = 440 * Math.pow(2, (midi - 69) / 12);
    }
    freqCache.set(name, f);
    return f;
  }

  // ---------- 엔진 ----------
  // 스피커용 하나를 만들고, 크기를 재는 시험(OfflineAudioContext)에도 똑같이 만듭니다.
  function makeEngine(c) {
    const master = c.createGain();
    master.gain.value = 0.9;
    // 여러 소리가 한꺼번에 겹쳐도 찢어지지 않게 눌러주고, 너무 날카로운 윗소리는 깎습니다
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.15;
    const soft = c.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 9000;
    master.connect(comp);
    comp.connect(soft);
    soft.connect(c.destination);

    const sfx = c.createGain();
    const bgm = c.createGain();
    const battle = c.createGain();     // 전투 소리는 효과음 줄기에서 한 번 더 낮춥니다
    battle.gain.value = BATTLE_LEVEL;
    sfx.connect(master);
    bgm.connect(master);
    battle.connect(sfx);

    // 네모파 — 높은 칸이 1/8 · 1/4 · 1/2 인 세 가지. 옛 게임기 소리의 대부분이 이것입니다.
    const pulse = duty => {
      const n = 48;
      const real = new Float32Array(n), imag = new Float32Array(n);
      for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      return c.createPeriodicWave(real, imag);
    };
    // 잡음 — 북 · 타격 · 바람 소리의 재료
    const noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 1.0), c.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

    return { c, sfx, bgm, battle, noise: noiseBuf, waves: { p12: pulse(0.125), p25: pulse(0.25), p50: pulse(0.5) } };
  }

  // 음 하나. f 에서 f2 로 미끄러질 수 있습니다.
  // sus 가 있으면 음악처럼 조금 줄어든 채 버티다 끝에서 놓고, 없으면 톡 치고 사그라듭니다.
  function tone(e, out, t, o) {
    const c = e.c;
    const osc = c.createOscillator();
    if (o.wave === 'tri') osc.type = 'triangle';
    else if (o.wave === 'sine') osc.type = 'sine';
    else osc.setPeriodicWave(e.waves[o.wave] || e.waves.p25);
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.d);

    const g = c.createGain();
    const v = o.v, d = o.d;
    const a = Math.min(0.006, d * 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    if (o.sus) {
      const hold = Math.max(t + a + 0.001, t + d - 0.04);
      g.gain.exponentialRampToValueAtTime(v * o.sus, Math.min(hold, t + a + 0.08));
      g.gain.setValueAtTime(v * o.sus, hold);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + d + 0.03);
  }

  // 잡음 한 번. type 은 걸러낼 방식 — bandpass(가운데만) · lowpass(묵직하게) · highpass(찰랑하게)
  function noise(e, out, t, o) {
    const c = e.c;
    const src = c.createBufferSource();
    src.buffer = e.noise;
    const f = c.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.d);
    f.Q.value = o.q || 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(o.v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + o.d + 0.03);
  }

  // 음 여러 개를 차례로 — 마지막 음만 길게 끌 수 있습니다 (last)
  function arp(e, out, t, notes, step, o) {
    notes.forEach((n, i) => {
      const end = i === notes.length - 1 && o.last;
      tone(e, out, t + i * step, { wave: o.wave, f: N(n), d: end ? o.last : o.d, v: o.v, sus: end ? 0.75 : o.sus });
    });
  }

  // ---------- 효과음 ----------
  const SFX = {
    // 누르기 — 아주 짧고 작게
    tick: (e, o, t) => tone(e, o, t, { wave: 'p25', f: 1320, f2: 990, d: 0.035, v: 0.13 }),

    // 길 · 조우
    encounter: (e, o, t) => {
      tone(e, o, t, { wave: 'p25', f: N('A5'), d: 0.06, v: 0.16 });
      tone(e, o, t + 0.07, { wave: 'p25', f: N('E6'), d: 0.1, v: 0.16 });
    },
    encounterElite: (e, o, t) => arp(e, o, t, ['E5', 'A5', 'E6'], 0.08, { wave: 'p25', d: 0.07, v: 0.15, last: 0.18 }),
    encounterBoss: (e, o, t) => {
      tone(e, o, t, { wave: 'p50', f: N('E3'), d: 0.55, v: 0.12, sus: 0.7 });
      tone(e, o, t, { wave: 'p25', f: N('A#3'), d: 0.55, v: 0.08, sus: 0.7 });
      noise(e, o, t, { type: 'lowpass', f: 500, d: 0.5, v: 0.14 });
      tone(e, o, t + 0.25, { wave: 'tri', f: N('E2'), d: 0.55, v: 0.2, sus: 0.8 });
    },
    aura: (e, o, t) => arp(e, o, t, ['C6', 'E6', 'G6', 'C7'], 0.045, { wave: 'p12', d: 0.08, v: 0.12 }),
    retreat: (e, o, t) => tone(e, o, t, { wave: 'p25', f: 700, f2: 220, d: 0.16, v: 0.16 }),
    zoneMove: (e, o, t) => {
      tone(e, o, t, { wave: 'p25', f: 220, f2: 1320, d: 0.42, v: 0.07 });
      noise(e, o, t, { f: 800, f2: 3000, d: 0.4, v: 0.05 });
      tone(e, o, t + 0.42, { wave: 'tri', f: N('C5'), d: 0.3, v: 0.14, sus: 0.7 });
    },

    // 전투 — 내가 때림
    hit: (e, o, t) => {
      noise(e, o, t, { f: 2200, d: 0.06, v: 0.75 });
      tone(e, o, t, { wave: 'p50', f: 620, f2: 180, d: 0.07, v: 0.28 });
    },
    crit: (e, o, t) => {
      noise(e, o, t, { f: 3200, d: 0.1, v: 0.9 });
      tone(e, o, t, { wave: 'p25', f: 1400, f2: 260, d: 0.11, v: 0.34 });
      tone(e, o, t + 0.03, { wave: 'p12', f: N('E7'), d: 0.05, v: 0.14 });
    },
    harm: (e, o, t) => {                       // 일격 — 땅이 울리게
      tone(e, o, t, { wave: 'sine', f: 140, f2: 38, d: 0.32, v: 0.6 });
      noise(e, o, t, { type: 'lowpass', f: 1600, f2: 300, d: 0.3, v: 0.5 });
      tone(e, o, t, { wave: 'p50', f: 380, f2: 70, d: 0.22, v: 0.16 });
    },
    // 전투 — 내가 맞음 (둔하고 낮게)
    foeHit: (e, o, t) => {
      noise(e, o, t, { type: 'lowpass', f: 900, d: 0.09, v: 0.45 });
      tone(e, o, t, { wave: 'tri', f: 220, f2: 90, d: 0.11, v: 0.4 });
    },
    foeCrit: (e, o, t) => {
      noise(e, o, t, { type: 'lowpass', f: 1200, d: 0.16, v: 0.55 });
      tone(e, o, t, { wave: 'tri', f: 260, f2: 70, d: 0.2, v: 0.5 });
      tone(e, o, t, { wave: 'p50', f: 160, f2: 60, d: 0.18, v: 0.12 });
    },
    miss: (e, o, t) => noise(e, o, t, { f: 5000, f2: 900, q: 1.2, d: 0.14, v: 0.35 }),
    block: (e, o, t) => {
      tone(e, o, t, { wave: 'p25', f: 1900, d: 0.05, v: 0.16 });
      tone(e, o, t + 0.02, { wave: 'p25', f: 2600, d: 0.06, v: 0.14 });
      noise(e, o, t, { type: 'highpass', f: 6000, d: 0.04, v: 0.15 });
    },
    heal: (e, o, t) => arp(e, o, t, ['C6', 'E6', 'G6'], 0.05, { wave: 'tri', d: 0.09, v: 0.2 }),
    special: (e, o, t) => arp(e, o, t, ['G5', 'B5', 'D6', 'G6'], 0.04, { wave: 'p12', d: 0.08, v: 0.16 }),

    // 결과
    win: (e, o, t) => {
      const s = 0.09;
      for (let i = 0; i < 3; i++) tone(e, o, t + s * i, { wave: 'p25', f: N('G5'), d: s * 0.85, v: 0.1 });
      tone(e, o, t + s * 3, { wave: 'p25', f: N('C6'), d: 0.45, v: 0.11, sus: 0.8 });
      tone(e, o, t + s * 3, { wave: 'p12', f: N('E5'), d: 0.45, v: 0.06, sus: 0.8 });
      tone(e, o, t + s * 3, { wave: 'tri', f: N('C4'), d: 0.48, v: 0.16, sus: 0.8 });
    },
    lose: (e, o, t) => {
      ['G4', 'E4', 'C4'].forEach((n, i) => tone(e, o, t + i * 0.16, { wave: 'p25', f: N(n), d: 0.15, v: 0.09 }));
      tone(e, o, t + 0.48, { wave: 'p25', f: N('A3'), f2: N('G#3'), d: 0.6, v: 0.09, sus: 0.8 });
      tone(e, o, t + 0.48, { wave: 'tri', f: N('A2'), d: 0.7, v: 0.16, sus: 0.8 });
    },
    drop: (e, o, t) => {                       // 새 전리품 — 반짝
      tone(e, o, t, { wave: 'p12', f: N('E6'), d: 0.06, v: 0.14 });
      tone(e, o, t + 0.06, { wave: 'p12', f: N('B6'), d: 0.12, v: 0.14 });
      tone(e, o, t + 0.06, { wave: 'sine', f: N('E7'), d: 0.16, v: 0.07 });
    },
    stone: (e, o, t) => {                      // 분해되어 강화석 — 짤랑
      tone(e, o, t, { wave: 'tri', f: 1480, d: 0.05, v: 0.2 });
      tone(e, o, t + 0.015, { wave: 'p25', f: 2200, d: 0.03, v: 0.07 });
    },
    levelUp: (e, o, t) => arp(e, o, t, ['C5', 'E5', 'G5', 'C6', 'E6'], 0.06, { wave: 'p25', d: 0.09, v: 0.13, last: 0.32 }),
    rankUp: (e, o, t) => {
      arp(e, o, t, ['C5', 'E5', 'G5', 'C6'], 0.07, { wave: 'p25', d: 0.1, v: 0.09 });
      arp(e, o, t + 0.3, ['D5', 'F#5', 'A5', 'D6'], 0.07, { wave: 'p25', d: 0.1, v: 0.09 });
      tone(e, o, t + 0.6, { wave: 'p25', f: N('G6'), d: 0.55, v: 0.1, sus: 0.8 });
      tone(e, o, t + 0.6, { wave: 'p12', f: N('B5'), d: 0.55, v: 0.06, sus: 0.8 });
      tone(e, o, t + 0.6, { wave: 'tri', f: N('G3'), d: 0.6, v: 0.16, sus: 0.8 });
    },
    pathOpen: (e, o, t) => {
      arp(e, o, t, ['G5', 'C6', 'E6', 'G6'], 0.08, { wave: 'p25', d: 0.1, v: 0.09, last: 0.5 });
      tone(e, o, t + 0.24, { wave: 'tri', f: N('C4'), d: 0.6, v: 0.15, sus: 0.8 });
    },
    unlock: (e, o, t) => {                     // 특수장비 칸이 열림 — 신비하게
      arp(e, o, t, ['E6', 'B6', 'G#6', 'E7'], 0.07, { wave: 'p12', d: 0.12, v: 0.1, last: 0.5 });
      tone(e, o, t, { wave: 'tri', f: N('E4'), d: 0.8, v: 0.16, sus: 0.7 });
    },
    enhanceOk: (e, o, t) => {
      arp(e, o, t, ['G5', 'D6', 'G6'], 0.07, { wave: 'tri', d: 0.1, v: 0.16, last: 0.35 });
      noise(e, o, t + 0.14, { type: 'highpass', f: 7000, d: 0.25, v: 0.05 });
    },
    enhanceFail: (e, o, t) => {                // 깨지는 소리
      noise(e, o, t, { f: 1400, f2: 300, d: 0.3, v: 0.5 });
      tone(e, o, t, { wave: 'p50', f: 360, f2: 90, d: 0.25, v: 0.2 });
    },
    equip: (e, o, t) => {
      tone(e, o, t, { wave: 'p25', f: 760, d: 0.03, v: 0.16 });
      tone(e, o, t + 0.03, { wave: 'p25', f: 980, d: 0.04, v: 0.14 });
      noise(e, o, t, { type: 'highpass', f: 5000, d: 0.03, v: 0.12 });
    },
    unequip: (e, o, t) => tone(e, o, t, { wave: 'p25', f: 900, f2: 600, d: 0.06, v: 0.15 }),
    commit: (e, o, t) => {
      tone(e, o, t, { wave: 'tri', f: N('C6'), d: 0.06, v: 0.18 });
      tone(e, o, t + 0.06, { wave: 'tri', f: N('G6'), d: 0.12, v: 0.18 });
    },

    // 여정의 끝
    gameOver: (e, o, t) => {
      ['A4', 'G4', 'F4'].forEach((n, i) => tone(e, o, t + i * 0.28, { wave: 'p25', f: N(n), d: 0.26, v: 0.08, sus: 0.8 }));
      tone(e, o, t + 0.84, { wave: 'p25', f: N('E4'), d: 0.9, v: 0.08, sus: 0.8 });
      ['A2', 'F2', 'E2'].forEach((n, i) => tone(e, o, t + i * 0.42, { wave: 'tri', f: N(n), d: i === 2 ? 0.9 : 0.4, v: 0.16, sus: 0.85 }));
    },
    victory: (e, o, t) => {                    // 모든 격을 넘어섰다 — 올라가는 분산화음 끝에 길게
      const s = 0.12;
      // [음, 시작 칸, 길이(칸)]
      [['C5', 0, 1], ['G4', 1, 1], ['C5', 2, 1], ['E5', 3, 1], ['G5', 4, 2], ['E5', 6, 1], ['G5', 7, 1]]
        .forEach(([n, at, len]) => tone(e, o, t + s * at, { wave: 'p25', f: N(n), d: s * len * 0.85, v: 0.1 }));
      tone(e, o, t + s * 8, { wave: 'p25', f: N('C6'), d: 1.2, v: 0.11, sus: 0.8 });
      tone(e, o, t + s * 8, { wave: 'p12', f: N('E5'), d: 1.2, v: 0.06, sus: 0.8 });
      tone(e, o, t + s * 8, { wave: 'tri', f: N('C3'), d: 1.25, v: 0.17, sus: 0.85 });
    }
  };

  // 끝맺는 소리가 나는 동안은 배경음을 잠깐 낮춥니다 (초)
  const JINGLE = { win: 0.8, lose: 1.2, levelUp: 0.7, rankUp: 1.2, pathOpen: 1.0, unlock: 1.0, zoneMove: 0.8, gameOver: 2.0, victory: 2.6 };
  // 전투 중 한 줄마다 나는 소리 — BATTLE_LEVEL 로 따로 낮춥니다
  const BATTLE = new Set(['hit', 'crit', 'harm', 'foeHit', 'foeCrit', 'miss', 'block', 'heal', 'special']);
  const outFor = (e, name) => BATTLE.has(name) ? e.battle : e.sfx;

  // ---------- 배경음 ----------
  // 한 칸 = 16분음표. 음 이름은 그 칸에서 새로 치는 음, - 는 앞 음을 끄는 칸, . 은 쉼표, | 는 마디(읽기 편하라고).
  // 북은 k(큰북) · s(작은북) · h(닫힌 심벌) · o(열린 심벌).
  // 파트마다 길이가 달라도 됩니다 — 짧은 파트는 제 길이로 되풀이됩니다.
  const rep = (s, n) => Array.from({ length: n }, () => s).join(' | ');

  // --- 초기 화면 · 「낡은 지도」 — 가단조, 느리게. 흐르는 분산화음 위에 긴 선율 ---
  const T_AM = 'A3 C4 E4 A4 C5 A4 E4 C4 A3 C4 E4 A4 C5 A4 E4 C4';
  const T_F  = 'F3 A3 C4 F4 A4 F4 C4 A3 F3 A3 C4 F4 A4 F4 C4 A3';
  const T_C  = 'C4 E4 G4 C5 E5 C5 G4 E4 C4 E4 G4 C5 E5 C5 G4 E4';
  const T_G  = 'G3 B3 D4 G4 B4 G4 D4 B3 G3 B3 D4 G4 B4 G4 D4 B3';
  const T_E  = 'E3 G#3 B3 E4 G#4 E4 B3 G#3 E3 G#3 B3 E4 G#4 E4 B3 G#3';
  const bassWhole = n => `${n} - - - - - - - ${n} - - - - - - -`;

  // --- 여정 · 「떠나는 길」 — 다장조, 걷는 빠르기 ---
  const F_C  = 'C4 - E4 - G4 - E4 - C4 - E4 - G4 - E4 -';
  const F_AM = 'A3 - C4 - E4 - C4 - A3 - C4 - E4 - C4 -';
  const F_F  = 'F3 - A3 - C4 - A3 - F3 - A3 - C4 - A3 -';
  const F_G  = 'G3 - B3 - D4 - B3 - G3 - B3 - D4 - B3 -';
  const F_FG = 'F3 - A3 - C4 - A3 - G3 - B3 - D4 - B3 -';
  const F_EM = 'E3 - G3 - B3 - G3 - E3 - G3 - B3 - G3 -';
  const F_DM = 'D3 - F3 - A3 - F3 - D3 - F3 - A3 - F3 -';
  const B_C  = 'C3 - - - G2 - - - C3 - - - G2 - - -';
  const B_AM = 'A2 - - - E2 - - - A2 - - - E2 - - -';
  const B_F  = 'F2 - - - C3 - - - F2 - - - C3 - - -';
  const B_G  = 'G2 - - - D3 - - - G2 - - - D3 - - -';
  const B_FG = 'F2 - - - C3 - - - G2 - - - D3 - - -';
  const B_EM = 'E2 - - - B2 - - - E2 - - - B2 - - -';
  const B_DM = 'D3 - - - A2 - - - D3 - - - A2 - - -';
  const F_BEAT = 'k . h . s . h . k . h . s . h .';
  const F_FILL = 'k . h . s . h . k . h . s . s s';

  // --- 보스 · 「격」 — 마단조, 빠르게. 몰아치는 베이스 ---
  const X_EM = 'E2 - E2 - E3 - E2 - E2 - E3 - E2 - D3 -';
  const X_C  = 'C2 - C2 - C3 - C2 - C2 - C3 - C2 - B2 -';
  const X_D  = 'D2 - D2 - D3 - D2 - D2 - D3 - F#2 - D3 -';
  const X_B  = 'B1 - B1 - B2 - B1 - B1 - B2 - D#2 - F#2 -';
  const H_EM = 'G4 - - - - - - - B4 - - - - - - -';
  const H_C  = 'G4 - - - - - - - E4 - - - - - - -';
  const H_D  = 'F#4 - - - - - - - A4 - - - - - - -';
  const H_B  = 'F#4 - - - - - - - D#4 - - - - - - -';
  const X_BEAT = 'k . h k s . h . k k h . s . h h';
  const X_FILL = 'k . h . s . h . s . s s s s s s';

  const SONGS = {
    title: { bpm: 80, tracks: [
      { wave: 'p12', v: 0.032, sus: 0.5, notes: [T_AM, T_F, T_C, T_G, T_AM, T_F, T_E, T_E].join(' | ') },
      { wave: 'p25', v: 0.06, sus: 0.8, notes: [
        'E5 - - - - - - - D5 - - - C5 - - -',
        'C5 - - - - - - - - - - - A4 - - -',
        'G4 - - - - - - - C5 - - - E5 - - -',
        'D5 - - - - - - - - - - - - - - -',
        'E5 - - - - - - - F5 - - - E5 - - -',
        'C5 - - - - - - - A4 - - - - - - -',
        'B4 - - - - - - - G#4 - - - B4 - - -',
        'E5 - - - - - - - - - - - . . . .'
      ].join(' | ') },
      { wave: 'tri', v: 0.12, sus: 0.85, notes: ['A2', 'F2', 'C3', 'G2', 'A2', 'F2', 'E2', 'E2'].map(bassWhole).join(' | ') }
    ] },

    field: { bpm: 116, tracks: [
      { wave: 'p25', v: 0.065, sus: 0.75, notes: [
        'E5 - - - G5 - A5 - G5 - - - E5 - - -',
        'C5 - - - - - D5 - E5 - - - A4 - - -',
        'F5 - - - E5 - D5 - C5 - - - A4 - - -',
        'B4 - - - C5 - D5 - G4 - - - - - - -',
        'E5 - - - G5 - A5 - C6 - - - B5 - A5 -',
        'G5 - - - E5 - - - A5 - G5 - E5 - - -',
        'F5 - - - A5 - - - G5 - - - B4 - D5 -',
        'C5 - - - - - - - - - - - . . . .',
        'A5 - - - G5 - F5 - E5 - - - F5 - - -',
        'D5 - - - E5 - F5 - G5 - - - - - . .',
        'G5 - - - E5 - D5 - B4 - - - E5 - - -',
        'C5 - - - B4 - C5 - A4 - - - - - . .',
        'F5 - - - A5 - - - D5 - - - F5 - E5 -',
        'D5 - - - B4 - - - G4 - - - B4 - D5 -',
        'E5 - - - D5 - C5 - G5 - - - E5 - - -',
        'D5 - - - - - - - B4 - - - D5 - - -'
      ].join(' | ') },
      { wave: 'p12', v: 0.03, sus: 0.55, notes: [
        F_C, F_AM, F_F, F_G, F_C, F_AM, F_FG, F_C,
        F_F, F_G, F_EM, F_AM, F_DM, F_G, F_C, F_G
      ].join(' | ') },
      { wave: 'tri', v: 0.13, sus: 0.85, notes: [
        B_C, B_AM, B_F, B_G, B_C, B_AM, B_FG, B_C,
        B_F, B_G, B_EM, B_AM, B_DM, B_G, B_C, B_G
      ].join(' | ') },
      { drum: true, v: 0.55, notes: [rep(F_BEAT, 7), F_FILL, rep(F_BEAT, 7), F_FILL].join(' | ') }
    ] },

    boss: { bpm: 150, tracks: [
      { wave: 'p25', v: 0.07, sus: 0.75, notes: [
        'E5 - - . G5 - - . F#5 - E5 - D5 - B4 -',
        'E5 - - - - - - - . . B4 - D5 - E5 -',
        'G5 - - . F#5 - - . E5 - D5 - C5 - D5 -',
        'A4 - - - - - - - D5 - - - F#5 - - -',
        'E5 - - . G5 - - . B5 - A5 - G5 - F#5 -',
        'G5 - - - E5 - - - . . E5 - F#5 - G5 -',
        'A5 - - . G5 - - . F#5 - E5 - D5 - E5 -',
        'F#5 - - - - - - - D#5 - - - B4 - - -'
      ].join(' | ') },
      { wave: 'p12', v: 0.035, sus: 0.7, notes: [H_EM, H_EM, H_C, H_D, H_EM, H_EM, H_C, H_B].join(' | ') },
      { wave: 'tri', v: 0.14, sus: 0.8, notes: [X_EM, X_EM, X_C, X_D, X_EM, X_EM, X_C, X_B].join(' | ') },
      { drum: true, v: 0.6, notes: [rep(X_BEAT, 7), X_FILL].join(' | ') }
    ] }
  };

  // 악보 → 칸마다 { 음, 길이 }
  const compiled = {};
  function compile(name) {
    if (compiled[name]) return compiled[name];
    const def = SONGS[name];
    const tracks = def.tracks.map(tr => {
      const toks = tr.notes.split(/\s+/).filter(x => x && x !== '|');
      const ev = toks.map((tk, i) => {
        if (tk === '-' || tk === '.') return null;
        let len = 1;
        while (i + len < toks.length && toks[i + len] === '-') len++;
        return { n: tk, f: tr.drum ? 0 : N(tk), len };
      });
      return { ...tr, ev, steps: toks.length };
    });
    compiled[name] = { bpm: def.bpm, tracks, steps: Math.max(...tracks.map(t => t.steps)) };
    return compiled[name];
  }

  function drum(e, out, t, kind, v) {
    if (kind === 'k') tone(e, out, t, { wave: 'sine', f: 150, f2: 45, d: 0.16, v: v * 0.55 });
    else if (kind === 's') {
      noise(e, out, t, { f: 1900, q: 0.7, d: 0.13, v: v * 0.22 });
      tone(e, out, t, { wave: 'tri', f: 190, f2: 140, d: 0.07, v: v * 0.12 });
    }
    else if (kind === 'h') noise(e, out, t, { type: 'highpass', f: 7500, d: 0.035, v: v * 0.08 });
    else if (kind === 'o') noise(e, out, t, { type: 'highpass', f: 6500, d: 0.16, v: v * 0.07 });
  }

  // 한 칸을 칩니다 — 파트마다 제 길이로 되풀이
  function playStep(e, out, song, step, t, spb) {
    for (const tr of song.tracks) {
      const ev = tr.ev[step % tr.steps];
      if (!ev) continue;
      if (tr.drum) drum(e, out, t, ev.n, tr.v);
      else if (ev.f) tone(e, out, t, { wave: tr.wave, f: ev.f, d: ev.len * spb * 0.9, v: tr.v, sus: tr.sus });
    }
  }

  function startSong(name) {
    stopSong();
    if (!SONGS[name]) return;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(1, ac.currentTime + 0.6);
    g.connect(eng.bgm);
    cur = { name, song: compile(name), gain: g, step: 0, next: ac.currentTime + 0.1 };
    cur.timer = setInterval(pump, 25);
    pump();
  }

  // 조금 앞까지 미리 악보를 걸어둡니다 — 타이머가 늦게 깨도 박자가 흔들리지 않게
  function pump() {
    if (!cur || !ac || ac.state !== 'running') return;
    const spb = 60 / cur.song.bpm / 4;
    if (cur.next < ac.currentTime - 0.05) cur.next = ac.currentTime + 0.02;   // 한참 밀렸으면 지금부터
    while (cur.next < ac.currentTime + 0.15) {
      playStep(eng, cur.gain, cur.song, cur.step, cur.next, spb);
      cur.next += spb;
      cur.step = (cur.step + 1) % cur.song.steps;
    }
  }

  function stopSong() {
    if (!cur) return;
    clearInterval(cur.timer);
    const g = cur.gain, t = ac.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    setTimeout(() => { try { g.disconnect(); } catch (e) { /* 이미 끊김 */ } }, 700);
    cur = null;
  }

  // ---------- 켜고 끄기 ----------
  function applyPrefs() {
    if (!eng) return;
    eng.sfx.gain.value = prefs.sfx ? SFX_LEVEL : 0;
    eng.bgm.gain.value = prefs.bgm ? BGM_LEVEL : 0;
  }

  function duck(sec) {
    if (!eng || !prefs.bgm) return;
    const g = eng.bgm.gain, t = ac.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(BGM_LEVEL * 0.3, t + 0.05);
    g.setValueAtTime(BGM_LEVEL * 0.3, t + sec);
    g.linearRampToValueAtTime(BGM_LEVEL, t + sec + 0.5);
  }

  // 첫 입력에서 소리를 깨웁니다. 그 뒤로도 입력마다 불려서, 잠든 소리를 다시 깨웁니다.
  function wake() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC({ latencyHint: 'interactive' });
        eng = makeEngine(ac);
        applyPrefs();
      }
      if (ac.state === 'suspended' && !document.hidden) ac.resume();
      if (want && prefs.bgm && (!cur || cur.name !== want)) startSong(want);
    } catch (e) { /* 소리가 안 되는 환경 — 조용히 넘어갑니다 */ }
  }
  for (const ev of ['pointerdown', 'keydown', 'touchend']) document.addEventListener(ev, wake, true);

  // 화면을 끄거나 다른 앱으로 가면 재웁니다 — 주머니 속에서 음악이 흐르면 곤란하니까요
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend();
    else ac.resume();
  });

  function play(name, opts) {
    if (!prefs.sfx || !ac || ac.state !== 'running') return;
    const fn = SFX[name];
    if (!fn) return;
    const now = ac.currentTime;
    if (lastPlayed[name] && now - lastPlayed[name] < 0.03) return;
    lastPlayed[name] = now;
    const delay = (opts && opts.delay) || 0;
    try { fn(eng, outFor(eng, name), now + 0.01 + delay); } catch (e) { /* 한 소리가 실패해도 게임은 계속 */ }
    if (JINGLE[name]) duck(JINGLE[name] + delay);
  }

  function music(name) {
    want = name || null;
    if (!ac || !prefs.bgm) return;
    if (!want) { stopSong(); return; }
    if (cur && cur.name === want) return;
    startSong(want);
  }

  function get(key) { return !!prefs[key]; }

  function set(key, on) {
    prefs[key] = !!on;
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* 저장 못 해도 이번엔 적용 */ }
    if (!eng) return;
    applyPrefs();
    if (key === 'bgm') {
      if (on) music(want);
      else stopSong();
    }
  }

  // 시험용 — 실제로 소리를 내지 않고 계산만 해서 가장 큰 값과 평균 크기를 잽니다.
  // (소리가 찢어지지 않는지, 효과음과 배경음의 크기가 맞는지 확인할 때 씁니다)
  async function measure(kind, name, sec) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const c = new OAC(1, Math.ceil(44100 * sec), 44100);
    const e = makeEngine(c);
    e.sfx.gain.value = SFX_LEVEL;
    e.bgm.gain.value = BGM_LEVEL;
    if (kind === 'sfx') SFX[name](e, outFor(e, name), 0.01);
    else {
      const song = compile(name);
      const spb = 60 / song.bpm / 4;
      for (let s = 0, t = 0.01; t < sec; s++, t += spb) playStep(e, e.bgm, song, s % song.steps, t, spb);
    }
    const buf = await c.startRendering();
    const d = buf.getChannelData(0);
    let peak = 0, sum = 0;
    for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; }
    return { peak: Math.round(peak * 1000) / 1000, rms: Math.round(Math.sqrt(sum / d.length) * 10000) / 10000 };
  }

  return {
    play, music, get, set, measure,
    // 지금 상태 — 시험 · 관리자 도구용
    status: () => ({ ctx: ac ? ac.state : 'none', song: cur ? cur.name : null, want, prefs: { ...prefs } }),
    names: () => ({ sfx: Object.keys(SFX), songs: Object.keys(SONGS) }),
    songInfo: name => { const s = compile(name); return { bpm: s.bpm, steps: s.steps, tracks: s.tracks.map(t => t.steps), seconds: Math.round(s.steps * 60 / s.bpm / 4 * 10) / 10 }; }
  };
})();
