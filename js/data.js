// ============================================================
//  data.js  —  게임 데이터와 수식
//  숫자 밸런스를 바꾸고 싶으면 이 파일만 고치면 됩니다.
//
//  컨셉: 지구의 신화와 역사에 이름을 남긴 존재들의 "화신"과 싸운다.
//        길을 떠나면 그 지역의 화신이 무작위로 나타난다.
//        보스는 길 끝의 정해진 자리에 늘 서 있다. 물러설 수 없다.
//        격(格)이 올라갈수록 더 오래되고 더 거대한 것이 나온다.
// ============================================================

// ---------- 기본 규칙 ----------
const RULES = {
  START_ENERGY: 30,       // 맨몸으로 시작할 때의 에너지.
                          // 이것만으로는 열다섯 개 지역을 절대 관통하지 못합니다.
                          // 『격을 삼키는 검』으로 격을 삼켜 적립해야 끝까지 갑니다
                          // (전부 삼키면 +91). 그게 그 검의 존재 이유입니다.
  TRAVEL_COST: 1,         // 길을 떠날 때 (그리고 보스에게 향할 때) 드는 에너지
  ZONE_MOVE_COST: 2,      // 다음 격으로 넘어갈 때 드는 에너지.
                          // 예전엔 공짜였습니다 — "이미 보스를 꺾어서 산 길" 이라는
                          // 이유였는데, 그러면 깊이 들어가는 데 아무 대가가 없어서
                          // 어디까지 갈지가 고민이 되지 않았습니다.
  LOSS_PENALTY: 2,        // 일반 화신에게 졌을 때 추가로 잃는 에너지
  BOSS_LOSS_PENALTY: 5,   // 보스에게 졌을 때 추가로 잃는 에너지 — 훨씬 아픕니다
  LOSS_PENALTY_ELITE: 3,  // 정예(중간보스)에게 졌을 때
  LUCK_POWER: 2.00,       // 행운에 몰아준 비율이 드롭 확률을 얼마나 밀어올리는가 (game.js 의 luckMult 참고)
  LUCK_CAP: 2.5,          // 행운으로 늘릴 수 있는 배수의 한계
  DROP_CAP: 0.92,         // 아무리 올려도 확실한 드롭은 없습니다
  // 격이 한 단계 오를 때마다 드롭 확률에 곱해지는 값.
  // 일반 화신은 한 회차에 몇 번이고 다시 만나므로 인색하게 굴어도 굴림이 쌓입니다.
  // 정예·보스는 회차당 한 번뿐인 데다 거기까지 가는 데 회차를 통째로 써야 해서,
  // 같은 비율로 깎으면 희소성이 아니라 벌이 됩니다. 거의 안 깎습니다.
  // 격이 열다섯으로 늘면서 둘 다 조금 풀었습니다. 마지막 격의 인색함이
  // 격이 열한 개이던 때의 마지막 격과 같아지도록 (일반 ×0.39 · 정예 ×0.82).
  RANK_DROP_FALLOFF: 0.93,
  RANK_DROP_FALLOFF_ONCE: 0.986,
  // 낮은 격일수록 얹어주는 보너스. 제1격에서 ×2.2, 제5격이면 ×1.24, 제11격은 ×1.11.
  // 첫 회차에 장비를 갈아끼우고 강화해보는 걸 겪어봐야 게임이 뭔지 알게 됩니다.
  // 예전엔 제1격도 31% 라 에너지가 바닥날 때까지 일곱 개밖에 못 모았고,
  // 그래서 첫 회차가 제1격 안에서 끝났습니다.
  RANK_DROP_EARLY: 1.2,
  // 경험치 쪽 초반 보너스. 1 + 값/격² 이라 훨씬 빨리 사그라듭니다 —
  // 제1격 ×3.0, 제2격 ×1.5, 제3격 ×1.22, 제5격 이후로는 사실상 없습니다.
  // 제1격에서 보스를 잡을 힘이 붙는 게 24번째 싸움이었는데 에너지가 30뿐이라,
  // 첫 회차가 제1격 하나로 다 갔습니다. 그 지점을 앞으로 당기는 값입니다.
  RANK_XP_EARLY: 2.0,
  AURA_CHANCE: 0.22,      // 화신이 이상한 기운을 두르고 나타날 확률
  // 골드 — 싸워서 이기면 떨어집니다. 회차가 끝나도 남습니다 (떠돌이 상인에게서 씁니다).
  // 한 번 이길 때 = GOLD_BASE × GOLD_GROWTH^(격−1) × 종류(일반 1 · 정예 4 · 히든 5 · 보스 10) × 기운 × 골드 배수
  // 골드 배수 = 행운 배수(분배) × (1 + 장비의 골드 획득)
  GOLD_BASE: 5,
  GOLD_GROWTH: 1.9,
  // 떠돌이 상인의 물건 값 = 그 격 일반 화신 한 번 몫의 이만큼 배.
  // 제1격에서 한 회차에 하나쯤 살 수 있는 값입니다 (일반 25번 · 정예 둘 · 보스 하나 ≈ 215골드). 무엇을 팔지는 아직 — 구조만.
  WARE_PRICE: 30,
  // 떠돌이 상인의 강화석 값 — 강화석 1개에 몇 골드. 1~6지역 어디에 나타나든 같은 상인이라 값도 같습니다.
  STONE_PRICE: 2,
  BOSS_XP_MULT: 1.04      // 지금까지 꺾어본 보스 한 명당 경험치 배수 (영구히 이월)
                          //
                          // 이게 게임 전체 길이를 정하는 손잡이입니다. 시뮬 실측
                          // (한 판씩만 돌린 값이라 앞뒤로 흔들립니다):
                          //   성장 장비 없이  1.20 → 40회차   1.13 → 54회차   1.08 → 70회차
                          //   성장 장비 쓰면  1.08 → 54회차   1.04 → 69~74회차
                          //   1.00 (끔) → 영원히 못 깸
                          //
                          // 성장·행운 전리품을 92개에서 34개로 줄여도 길이는 그대로였습니다
                          // (72 → 69회차, 시드 오차 범위). 세트 최대치가 ×3.00 에서
                          // ×2.62 로 내려간 폭이 작아서입니다.
                          //
                          // 『성장』 장비로 갈아입어 가며 놀면 4분의 1쯤 빨라집니다.
                          // 그만큼 낮춰 잡은 값입니다.
                          //
                          // **끄면 안 됩니다.** 영웅의 경험치 수입은 "이길 수 있는
                          // 가장 센 적" 이 상한인데, 아자토스(Lv.100억)는 못 이기고
                          // 나머지는 다 그 아래입니다. 그래서 배수가 없으면 레벨이
                          // 보스의 0.88배에서 멈춰버립니다 — 100회차를 돌려도 한 칸도
                          // 안 올랐습니다. 이 배수가 그 천장을 들어올립니다.
                          //
                          // 보스가 열다섯 명이라 1.5 로 두면 ×437 이 되어 반대로 무너집니다.
                          // (1.04 면 전부 꺾었을 때 ×1.80)

};

// ---------- 기운(aura) ----------
// 가끔 화신이 이상한 기운을 두르고 나타납니다.
// Resolute Hero 의 보너스 몬스터 + Inflation RPG 의 폭발적인 레벨업을 합친 것 —
// 이 게임에서 도파민을 담당하는 장치입니다.
// color 는 양피지 위의 잉크색입니다 — 알림 띠의 바탕과 이름 글씨에 그대로 씁니다.
const AURAS = [
  { id: 'gold',   name: '황금빛', color: '#8a6400', desc: '경험치 ×2',            weight: 38, xpMult: 2,  dropMult: 1 },
  { id: 'violet', name: '보랏빛', color: '#6a2c8f', desc: '전리품 ×2',            weight: 26, xpMult: 1,  dropMult: 2 },
  { id: 'burn',   name: '불타는', color: '#b03a12', desc: '경험치 ×5',            weight: 20, xpMult: 5,  dropMult: 1 },
  { id: 'omen',   name: '전조의', color: '#1f5a96', desc: '경험치 ×3 · 전리품 ×2', weight: 11, xpMult: 3,  dropMult: 2 },
  { id: 'myth',   name: '신화의', color: '#2a6e27', desc: '경험치 ×10 · 전리품 ×3', weight: 5,  xpMult: 10, dropMult: 3 }
];

const AURA_TOTAL_WEIGHT = AURAS.reduce((s, a) => s + a.weight, 0);

function rollAura() {
  if (Math.random() >= RULES.AURA_CHANCE) return null;
  let r = Math.random() * AURA_TOTAL_WEIGHT;
  for (const a of AURAS) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return AURAS[0];
}

// ============================================================
//  전투 수식
// ============================================================

// 실제로 들어가는 피해량.
//   공격력 = 방어력  →  50% 감소
//   방어력이 공격력의 2배  →  66.7% 감소
// 방어력이 아무리 높아도 0이 되진 않는 수확체감 곡선.
function damageFormula(attack, defense) {
  return (attack * attack) / (attack + defense);
}

// ---------- 민첩에서 파생되는 것들 ----------
//
// 승률이 100% 아니면 0% 로만 나오면 게임이 재미없습니다. 긴 전투에서는
// 피해량 편차(±15%)가 평균으로 수렴해서 시작 전에 승패가 정해지기 때문입니다.
// 그래서 원작(Resolute Hero)처럼 **확률 발동** 요소를 넣습니다.
// 빗나가느냐, 크리가 터지느냐 — 이 두 개가 판을 뒤집습니다.

// 크리티컬 확률. 로그 스케일이라 스탯을 열 배 올려야 몇 %p 오릅니다.
// 민첩이 주력이고 행운은 그 절반 이하입니다 — 행운은 전리품이 본업이니까요.
// 장비의 '크리 확률' 특수 능력치가 여기 그대로 더해집니다.
// num() 은 적처럼 특수 능력치가 아예 없는 쪽을 위한 안전망입니다.
// 하나라도 undefined 가 새면 NaN 이 전투식 전체를 먹어치웁니다.
function num(v) { return Number.isFinite(v) ? v : 0; }

function critChance(dex, luck, bonus) {
  const raw = 0.10
    + 0.035 * Math.log10(Math.max(1, num(dex)))
    + 0.015 * Math.log10(Math.max(1, num(luck)))
    + num(bonus);
  return Math.min(0.75, raw);
}

// 크리티컬 배수. 기본 2배에서 시작해 민첩 열 배마다 +0.15.
function critDamage(dex) {
  return 2.0 + 0.15 * Math.log10(Math.max(1, num(dex)));
}

// 회피율. 민첩이 같으면 29%, 아무리 앞서도 58%를 넘지 않습니다.
// (크리 일부를 행운에 넘겨준 대신 민첩은 회피를 더 가져갑니다.)
function dodgeChance(myDex, foeDex) {
  return 0.58 * myDex / (myDex + foeDex);
}

// 명중률 = 1 − 상대 회피율. 민첩이 같으면 71%.
function hitChance(attackerDex, defenderDex) {
  return 1 - dodgeChance(defenderDex, attackerDex);
}

// 관통은 상대 방어력을 그만큼 깎고 때립니다.
function piercedDefense(def, pierce) {
  return def * (1 - Math.min(0.9, num(pierce)));
}

// 한 턴에 기대되는 평균 피해량. 승률 예측의 지름길 판정에 씁니다.
// a = 때리는 쪽, d = 맞는 쪽 (둘 다 스탯 객체)
function expectedTurnDamage(a, d) {
  const base = damageFormula(a.damage, piercedDefense(d.defense, a.pierce));
  const hit = hitChance(a.dex, d.dex) * (1 - Math.min(0.9, num(d.block)));
  const c = critChance(a.dex, a.luck, a.critRate);
  const multi = 1 + Math.min(0.9, num(a.doubleHit));   // 이중타격은 평균 타수를 늘립니다
  // 일격은 그 한 방만 10배이고 크리가 안 터집니다 — 한 방의 기댓값을 둘로 나눠 섞습니다
  const h = Math.min(1, num(a.harmTouch));
  const perSwing = (1 - h) * (1 + c * (critDamage(a.dex) - 1)) + h * HARM_TOUCH_MULT;
  const turns = 1 + Math.min(0.9, num(a.doubleTurn));  // 연속 턴은 한 턴에 움직이는 횟수를 늘립니다
  return base * hit * multi * perSwing * turns;
}

// 일격 한 방의 배수 (원작 Resolute Hero 의 Harm Touch 와 같습니다)
const HARM_TOUCH_MULT = 10;

// ---------- 스탯 곡선 ----------

// 장비를 제외한, 레벨에서 오는 영웅의 순수 스탯.
// 상수항은 Lv.1 근처에서만 의미가 있습니다. 이게 없으면 첫 조우부터 확정 패배라
// 시작이 너무 험합니다. 레벨이 조금만 올라도 곧 무시됩니다.
// 네 스탯 전부 레벨에 **선형**입니다. 이게 승률이 0%/100% 로만 갈리지 않는
// 가장 큰 이유라, 지수를 함부로 올리면 안 됩니다.
//
//   생명 지수 > 공격 지수  →  레벨이 오를수록 전투가 길어집니다.
//   길어지면 운이 평균으로 수렴해서 승패가 시작 전에 결정됩니다.
//   (지수를 1.85 / 1.5 로 뒀을 때 Lv.10억 전투가 1,800턴이었습니다.)
//
// 전부 같은 지수로 맞추면 전투 길이가 전 구간 아홉 턴 안팎으로 고정되고,
// 빗나감과 크리 한 방이 실제로 판을 뒤집습니다.
//
// 숫자가 작아 보일까 걱정할 필요는 없습니다 — 레벨이 100억까지 가므로
// 최종 구간 생명은 1,800억이 됩니다.
// 레벨에서 저절로 오르는 부분은 **절반뿐**입니다.
// 나머지 절반은 아래 분배 포인트로 직접 찍습니다.
function heroBaseStats(level) {
  return {
    life:    Math.round(60 + 9   * level),
    damage:  Math.round(10 + 1.6 * level),
    defense: Math.round( 4 + 1.0 * level),
    dex:     Math.round( 4 + 1.3 * level),
    luck:    Math.round( 4 + 0.8 * level)
  };
}

// ---------- 스탯 분배 ----------
// 레벨당 10 포인트. 레벨이 억 단위까지 가므로 포인트도 수십억이 됩니다
// (Inflation RPG 에서 한 번에 수천 포인트씩 찍는 그 감각).
//
// **한 번 찍은 건 그대로 남습니다.** 비율은 "앞으로 들어올 포인트를 어떻게
// 나눌지" 를 정하는 규칙일 뿐이고, 이미 찍힌 스탯을 건드리지 않습니다.
// 레벨업으로 새 포인트가 생기면 그때 그 비율대로 들어갑니다.
const POINTS_PER_LEVEL = 10;

// 포인트 하나가 주는 양. 네 곳에 고르게 찍으면 예전 곡선과 정확히 같아집니다
// (생명 18L · 공격 3.2L · 방어 2.0L · 민첩 2.6L).
// 한 곳에 몰면 그 스탯만 최대 4배까지 갑니다 — 대신 나머지는 절반만 남습니다.
const POINT_VALUE = { life: 3.6, damage: 0.64, defense: 0.40, dex: 0.52, luck: 0.32 };

const STAT_KEYS = ['life', 'damage', 'defense', 'dex', 'luck'];

// desc 는 분배 창에 이름 밑으로 붙습니다. 이름만으로 무엇을 하는지 알 수 없는 것에만 적습니다.
const STAT_INFO = [
  { id: 'life',    name: '생명',   desc: '' },
  { id: 'damage',  name: '공격력', desc: '' },
  { id: 'defense', name: '방어력', desc: '' },
  { id: 'dex',     name: '민첩',   desc: '회피 · 명중 · 크리티컬' },
  { id: 'luck',    name: '행운',   desc: '전리품 · 약간의 크리티컬' }
];

// 적 스탯. 영웅과 거의 같되 조금씩 약합니다.
// → 같은 레벨이면 영웅이 유리합니다. 다만 확정은 아닙니다 (대략 75%).
function enemyStats(level, lifeMult = 1) {
  return {
    life:    Math.round((40 + 17  * level) * lifeMult),
    damage:  Math.round( 6 +  3.0 * level),
    defense: Math.round( 2 +  1.9 * level),
    dex:     Math.round( 2 +  2.4 * level),
    luck:    Math.round( 2 +  1.6 * level)   // 전리품 생성의 기준값으로만 씁니다
  };
}

// ---------- 격이 높을수록 단단하다 ----------
// 화신 구간(제7격 설화)부터는 레벨이 같아도 격이 높을수록 생명·공격·방어가 더 높습니다.
//
// 이게 없으면 전리품이 레벨을 따라 같이 커져서, 한 번 앞서기 시작하면
// 위쪽 격이 힘으로는 전혀 막지 못합니다. 『격을 삼키는 검』으로 에너지가 붙은 뒤로는
// 한 회차에 한 지역씩 그냥 지나갑니다 (시뮬에서 제7격~제15격을 여섯 회차 만에 통과).
// 격을 넷이나 늘렸는데도 게임이 길어지지 않았던 이유가 이것이었습니다.
//
// **전리품 성능에는 곱하지 않습니다** (makeItemStats 는 enemyStats 를 그대로 씁니다).
// 그래야 위로 갈수록 부위 강화와 레벨이 더 필요해집니다.
// 민첩은 건드리지 않습니다 — 명중·회피가 흔들리면 승률 곡선이 통째로 바뀝니다.
// 행운은 전리품 생성의 기준값이라 역시 그대로 둡니다.
//
// 앞의 여섯 격(마물 구간)은 건드리지 않습니다. 거기까지 보정을 걸었더니
// 『격을 삼키는 검』을 얻기 전인 마족·마왕에서 수십 회차씩 막혔습니다.
// 아자토스도 빼고 FINAL_BOSS_MULT 로 따로 맞춥니다.
//
// 시뮬 8판 (부위 강화 · 격 15개):
//   격 하나당  0       → 평균 40회차 클리어 (제7격부터 전력 질주)
//              0.10    → 60회차
//              0.15    → 96회차 (88~104)
//   0.15 그대로, +11~+15 를 비싸고 세게 바꾼 뒤 → 85회차 (77~94)
//   특수장비 칸 넷을 더한 뒤 0.15 → 65회차 (61~72) — 위쪽 격 유물이 세서 후반이 빨라졌습니다
//                            0.18 → 82회차 (74~86)
//                            0.19 → 따로 재지 않았습니다 (앞뒤 값으로 보아 90회차 안팎)
//                            0.20 → 102회차, 다만 제13·14격에서 열몇 회차씩 막힙니다
//   정예·히든·보스 전리품 배수를 1.4·1.6·1.8 로 낮춘 뒤
//                            0.19 → 136회차 (124~145, 4판) — 제12→13격에서 25회차씩 막힘
//                            0.16 → 104회차 (95~110, 4판) — 후반 벽이 지역당 10회차 안팎으로
//                            0.17 + 초반(제3~6격) 10% 약하게 → 101회차 (99~104, 4판)   ← 지금
//   (그 뒤 세트 · 도감 · 새 능력치가 들어오면서 줄어든 만큼은 경험치 계수로 되돌렸습니다 — enemyBaseXp)
const RANK_TOUGHNESS = 0.17;
const TOUGH_FROM_RANK = 7;     // 제7격 ×1.17, 제10격 ×1.68, 제15격 ×2.53

// 앞쪽은 거꾸로 — 제3~6격(마수 · 환수 · 마족 · 마왕)은 같은 레벨이어도 10% 약합니다.
// 정예·보스 전리품 배수를 낮춘 뒤로 초반에 끼울 만한 장비가 약해져서,
// 제3격 보스 앞에서 열몇 회차씩 막혔습니다 (제4격 도착 7 → 23회차).
// 그 구간만 풀었습니다. 처음 두 격은 원래 쉬워서 건드리지 않습니다.
//   10% → 제4격 15회차 · 제6격 33회차   15% → 13 · 28회차 (대신 제12→13격이 19회차로 막힘)
//   (경험치 계수를 0.8 로 낮춘 뒤 초반이 다시 느려져서 15% 로 올렸습니다.
//    4판: 제4격 17회차 · 제6격 32회차 · 클리어 90회차 — 대신 제12→13격이 15회차로 길어짐)
const EARLY_SOFTEN = 0.15;
const SOFT_RANKS = [3, 6];

function rankToughness(n) {
  if (n >= SOFT_RANKS[0] && n <= SOFT_RANKS[1]) return 1 - EARLY_SOFTEN;
  return 1 + RANK_TOUGHNESS * Math.max(0, n - TOUGH_FROM_RANK + 1);
}

function toughen(s, rankN, isFinal) {
  if (isFinal) return s;
  const t = rankToughness(rankN);
  s.life    = Math.round(s.life    * t);
  s.damage  = Math.round(s.damage  * t);
  s.defense = Math.round(s.defense * t);
  return s;
}

// ---------- 마지막 하나만은 다릅니다 ----------
// 아자토스도 원래는 다른 보스와 똑같은 식(생명 ×1.3)을 썼습니다. 그랬더니
// 최강 장비를 갖춘 Lv.100억 영웅이 **0.7턴에** 눕혀서 승률이 어느 레벨에서든
// 100% 였습니다. 한 턴에 끝나니 빗나감도 크리도 개입할 틈이 없었습니다.
// (맨몸이면 보스 레벨에서도 28% 였으니, 전투식이 아니라 장비가 문제였습니다.)
//
// 이 값을 정할 때 함정이 하나 있습니다. **아자토스 본인이 떨구는 전리품**
// (만물을 가르는 칼날 · 무(無)의 갑주 · 백치의 왕관) 이 게임에서 제일 좋은데,
// 그건 그를 이겨야 얻습니다. 그걸 낀 영웅으로 재면 승률이 두 배 넘게 부풀어
// 실제로는 닿을 수 없는 난이도가 나옵니다. 아래 숫자는 **그 셋을 빼고** 잰 값입니다.
//
// 그리고 이 싸움을 가르는 건 장비가 아니라 **레벨**입니다. 그의 스탯은 고정인데
// 영웅은 레벨로 계속 자라서, 강화를 몇까지 올렸느냐보다 그를 얼마나 넘어섰느냐가
// 승패를 정합니다. 시뮬에서는 그의 레벨을 1.4~1.9배 넘어선 즈음에 쓰러뜨립니다.
//
// 격이 열다섯으로 늘면서 제15격 화신들이 ×2.35~2.62 로 단단해졌습니다 (RANK_TOUGHNESS).
// 그 탓에 마지막 지역에서 레벨을 올리기가 훨씬 어려워져서, 옛 값
// (생명 5 · 공격 1.6 · 방어 3.0) 그대로는 마지막 벽이 백 회차를 넘겼습니다.
// 생명·공격·방어를 0.8배로 낮춘 지금 값에서 마지막 지역 도착 → 클리어가 약 11회차입니다.
//   아자토스 ×1.00 → 마지막 벽 무한  ·  ×0.85 → 26회차  ·  ×0.80 → 18회차
//   (여기까지는 +11~+15 가 지금보다 약하던 때. 그 구간을 세게 바꾼 뒤 ×0.80 → 11회차,
//    특수장비를 더하고 격 보정을 0.18 로 올린 지금 → 약 8회차)
const FINAL_BOSS_MULT = { life: 4, damage: 1.28, defense: 2.4, dex: 1.5 };

function finalBossStats(level, lifeMult) {
  const s = enemyStats(level, lifeMult);
  s.life    = Math.round(s.life    * FINAL_BOSS_MULT.life);
  s.damage  = Math.round(s.damage  * FINAL_BOSS_MULT.damage);
  s.defense = Math.round(s.defense * FINAL_BOSS_MULT.defense);
  s.dex     = Math.round(s.dex     * FINAL_BOSS_MULT.dex);
  return s;   // 행운은 그대로 — 전리품 생성의 기준값이라 건드리면 드롭이 뒤틀립니다
}

// ---------- 경험치 곡선 ----------
//
// 레벨 상한이 1,000만입니다. 한 번에 한 레벨씩 오르면 평생 못 갑니다.
// 그래서 요구치 곡선을 아주 완만하게(L^0.9) 깔았습니다.
//
//   한 레벨당 요구치   xpToNext(L) = 100 * L^0.9
//   L 까지의 누적      ≈ 52.6 * L^1.9        (위 식을 적분한 값)
//   적이 주는 경험치   enemyBaseXp(L) = 11.5 * L^1.9
//
// 누적과 지수를 1.9 로 똑같이 맞춘 게 핵심입니다. 그래서
// "내 레벨의 적 한 마리 = 지금까지 모은 경험치의 11.5/52.6 ≈ 22%" 가
// 게임 전 구간에서 일정하게 유지됩니다.
//
// 그 22% 가 레벨로는 몇 칸이냐 하면 — 레벨은 누적의 1/1.9 제곱이므로
// 한 마리당 약 +11%. 즉 Lv.1,000 에서는 +110, Lv.100,000 에서는 +11,000.
// 레벨이 높아질수록 한 방에 오르는 칸수가 저절로 불어납니다.
// 레벨이 억 단위까지 가므로 한 칸씩 빼는 반복문으로는 감당이 안 됩니다.
// 누적 경험치 ↔ 레벨을 닫힌 식으로 바로 환산합니다.
//   누적(L) = (100 / 1.9) * L^1.9   →   L = (누적 * 1.9 / 100)^(1/1.9)
const XP_COEF = 100;
const XP_EXP = 1.9;

function totalXpFor(level) {
  return (XP_COEF / XP_EXP) * Math.pow(level, XP_EXP);
}

function levelFromTotalXp(total) {
  return Math.max(1, Math.floor(Math.pow(total * XP_EXP / XP_COEF, 1 / XP_EXP)));
}

// 레벨은 누적 경험치에서 역산하므로(totalXpFor / levelFromTotalXp),
// 표시용 요구치도 반드시 같은 식에서 뽑아야 합니다.
// 예전엔 여기만 따로 100*L^0.9 로 적어둬서 Lv.1 에 100 이라고 떠 있었는데
// 실제로 필요한 건 143 이었습니다 — 경험치 바가 거짓말을 하고 있었습니다.
function xpToNext(level) {
  return Math.round(totalXpFor(level + 1) - totalXpFor(level));
}

// 계수가 게임 길이를 모든 구간에 고르게 늘리고 줄이는 손잡이입니다.
// (격 보정 RANK_TOUGHNESS 는 위쪽 격만 늘리고, 올리면 특정 격에 벽이 생깁니다.)
// 격 11개 시절 기록:
//   1.0 → 25회차 클리어, 전리품 309/328
//   0.7 → 30회차에 7지역 (40회차쯤 클리어할 속도)
// 격 15개 · 부위 강화 · 특수장비 · 세트 · 도감까지 넣은 뒤 (시뮬 4판, 도감 격당 +1%):
//   1.0  → 75회차 안팎 (도감 +2% 일 때는 64)
//   0.85 → 87회차 (75~100)
//   0.8  → 지금 값 (사이)
//   0.75 → 107회차, 다만 제5→6격 · 제12→13격이 20회차씩 막힘
// 상수항 25 는 초반에만 의미가 있습니다.
//
// 이게 없으면 Lv.1 슬라임이 1 EXP 인데 Lv.2 까지 143 이 필요해서,
// 첫 판에 스물몇 마리를 잡아도 레벨이 한 번도 안 오릅니다.
// Lv.1000 에서는 50만 EXP 에 25 가 붙는 셈이라 아무 영향이 없습니다 —
// 영웅 기본 스탯의 상수항(60/10/4)과 똑같은 역할입니다.
function enemyBaseXp(level) {
  return Math.round(0.8 * Math.pow(level, 1.9) + 25);
}

// 나보다 강한 적을 잡으면 경험치 배수.
//   레벨차 3.6배에서 최대 3배, 그 아래로는 선형 감소, 최소 1배.
function underlevelBonus(heroLevel, enemyLevel) {
  const ratio = enemyLevel / Math.max(1, heroLevel);
  const mult = 1 + (ratio - 1) * (2 / 2.6);
  return Math.min(3, Math.max(1, mult));
}

// ============================================================
//  착용 부위
// ============================================================
// 부위마다 성격이 다릅니다. 무기는 공격, 갑옷은 생명, 신발·반지는 민첩.
// 여덟 자리를 전부 채우면 그 구간 적 스탯 기준으로
// 공격 ×1.25 / 방어 ×1.20 / 생명 ×1.55 / 민첩 ×1.05 정도가 붙습니다.
const SLOTS = [
  { id: 'weapon',   name: '무기' },
  { id: 'offhand',  name: '보조무기' },
  { id: 'helm',     name: '투구' },
  { id: 'armor',    name: '갑옷' },
  { id: 'shoulder', name: '견갑' },
  { id: 'gloves',   name: '장갑' },
  { id: 'belt',     name: '허리띠' },
  { id: 'greaves',  name: '각반' },
  { id: 'boots',    name: '신발' },
  { id: 'cloak',    name: '망토' },
  { id: 'ring',     name: '반지' },
  { id: 'necklace', name: '목걸이' },
  { id: 'bracelet', name: '팔찌' }
];

// 값이 클수록 전투가 짧아지고, 짧아지면 다시 승률이 0/100 으로 굳습니다.
// 열두 자리를 다 채웠을 때 그 구간 적 스탯의 0.6~0.8배가 붙는 선으로 잡았습니다.
// (부위 강화가 최대 ×2.8, 정예 등급이면 ×1.4 가 더 곱해집니다.)
//
// 부위마다 맡는 스탯이 다릅니다 — 신발·팔찌는 민첩, 반지·목걸이는 행운,
// 갑옷·허리띠는 생명, 무기·장갑은 공격. 그래서 어느 부위를 비워두느냐가
// 곧 빌드가 됩니다.
const SLOT_PROFILE = {
  weapon:   { damage: 0.26, dex: 0.04 },
  offhand:  { damage: 0.10, defense: 0.10 },
  helm:     { defense: 0.10, life: 0.09 },
  armor:    { life: 0.24, defense: 0.14 },
  // 견갑은 무기에서 덜어온 자리입니다. 그래서 순수 방어구가 아니라
  // 공격을 조금 남겨뒀습니다 — 어깨로 밀어붙이는 쪽에 가깝습니다.
  shoulder: { defense: 0.12, life: 0.08, damage: 0.05 },
  gloves:   { damage: 0.08, defense: 0.04, dex: 0.06 },
  belt:     { life: 0.12, defense: 0.08 },
  greaves:  { defense: 0.10, life: 0.10 },
  boots:    { life: 0.06, dex: 0.18 },
  cloak:    { defense: 0.06, life: 0.08, dex: 0.08 },
  ring:     { damage: 0.06, dex: 0.06, luck: 0.10 },
  // 목걸이·팔찌에는 생명이 없습니다. 체력과 인연이 있는 화신이 남긴 것만 아래
  // VITAL_SLOT_PROFILE 로 생명이 붙습니다. 빠진 생명 몫(목걸이 .06 · 팔찌 .05)은
  // 다른 스탯으로 나눠서 부위의 총량(.28 · .27)은 그대로 둡니다.
  necklace: { damage: 0.08, defense: 0.08, dex: 0.05, luck: 0.07 },
  bracelet: { damage: 0.06, dex: 0.12, luck: 0.09 }
};

// 체력과 인연이 있는 화신의 목걸이·팔찌. 생명이 .10 으로 붙고, 그만큼 다른 스탯이 줄어
// 총량은 위 SLOT_PROFILE 과 같습니다. (예전엔 모든 목걸이·팔찌에 생명이 .05~.06 씩 있었습니다.)
const VITAL_SLOT_PROFILE = {
  necklace: { damage: 0.05, defense: 0.05, life: 0.10, dex: 0.04, luck: 0.04 },
  bracelet: { damage: 0.03, life: 0.10, dex: 0.08, luck: 0.06 }
};

// 재생 · 불사 · 치유 · 다산 — 설화나 생김새가 생명력 그 자체인 화신들.
// 목걸이·팔찌를 남기는 화신만 의미가 있습니다. 늘리고 싶으면 id 만 더하면 됩니다.
const VITAL_FOES = new Set([
  'trollking',    // 잘라도 아무는 재생력
  'hydra',        // 머리를 베면 둘이 돋는다
  'unicorn',      // 정화와 치유
  'phoenix',      // 재에서 되살아난다
  'vampire',      // 피로 연명하는 불사자
  'lichking',     // 불사의 왕
  'worldworm',    // 세계수를 갉아먹고 사는 것
  'yeongsa',      // 백 년을 모은 내단
  'sansam',       // 천 년 묵은 산삼
  'gumiho',       // 사람의 정기를 빨아들이는 여우 구슬
  'gilgamesh',    // 영생초를 찾아 헤맨 왕
  'raphael',      // 이름 자체가 "신이 고치신다"
  'isis',         // 앙크 — 되살리는 여신
  'shubniggurath',// 천의 새끼를 낳는 숲의 검은 염소
  'abhoth'        // 끝없이 새끼를 낳는 샘
]);

// ---------- 특수 능력치 ----------
// 핵심 스탯(생명·공격·방어·민첩·행운)과 달리, 이건 **퍼센트**입니다.
// 레벨을 타지 않고 장비에서만 나옵니다. 장비의 "성격"을 만드는 재료입니다.
// base 는 한 칸이 주는 값(%)입니다. 작게 잡았습니다 —
// 이건 장비의 **성격**을 드러내는 양념이지, 위력의 본체가 아닙니다.
// 위력은 공격·생명·방어·민첩이 담당하고, 그쪽만 부위 강화 배수를 받습니다.
// 한 성격으로 서너 칸을 맞춰야 비로소 체감이 나도록 한 크기입니다.
const SPECIALS = [
  { id: 'critRate',  name: '크리 확률', side: 'atk', unit: '%', base: 1.5, cap: 0.40, desc: '치명타가 터질 확률' },
  { id: 'doubleHit', name: '이중타격',  side: 'atk', unit: '%', base: 1.5, cap: 0.40, desc: '한 턴에 두 번 때릴 확률' },
  { id: 'pierce',    name: '관통',      side: 'atk', unit: '%', base: 2.0, cap: 0.60, desc: '상대 방어력을 무시하는 비율' },
  { id: 'lifesteal', name: '흡혈',      side: 'def', unit: '%', base: 1.0, cap: 0.30, desc: '준 피해의 일부를 회복' },
  { id: 'block',     name: '막기',      side: 'def', unit: '%', base: 1.5, cap: 0.40, desc: '피해를 통째로 흘릴 확률' },
  { id: 'reflect',   name: '반사',      side: 'def', unit: '%', base: 2.5, cap: 0.80, desc: '받은 피해의 일부를 되돌려줌' },
  // 유일하게 싸움과 무관한 능력치입니다. 전리품 확률에 그대로 곱해집니다.
  // 값이 큰 대신, 이걸 주는 장비는 핵심 스탯을 깎고 옵니다 (lucky 성격 참고).
  // 다른 특수 능력치보다 값이 큽니다. 이건 싸움에 아무 도움이 안 되고,
  // 세 자리 정도 갈아끼워야 "갈아입을 만하다" 는 느낌이 나야 하기 때문입니다.
  { id: 'findRate',  name: '전리품 확률', side: 'get', unit: '%', base: 15, cap: 1.50, desc: '전리품이 떨어질 확률' },
  // 전리품 확률과 짝입니다. 이쪽은 **회차 안에서** 값이 변합니다 —
  // 약한 것을 썰어 레벨을 올리는 초반에 제일 크고, 한 대가 아쉬워지는
  // 후반에는 벗어야 합니다. 그 갈아입는 순간이 이 능력치의 존재 이유입니다.
  { id: 'xpRate',    name: '경험치',     side: 'get', unit: '%', base: 18, cap: 2.00, desc: '얻는 경험치' },
  // 특수장비(유물)에서만 나옵니다. 이미 가진 것을 분해할 때 나오는 강화석에 곱해집니다.
  { id: 'stoneRate', name: '강화석',     side: 'get', unit: '%', base: 30, cap: 1.50, desc: '분해할 때 나오는 강화석' },
  // 이긴 판마다 떨어지는 골드에 곱해집니다. 돈 · 보물 · 탐욕과 어울리는 장비에만 붙습니다 (GOLD_ITEMS).
  { id: 'goldRate',  name: '골드 획득',  side: 'get', unit: '%', base: 20, cap: 3.00, desc: '이길 때 얻는 골드' },

  // ── 원작(Resolute Hero)에 있고 여기엔 없던 넷 ──
  // 유물과 세트 효과로만 얻습니다. 일반 장비의 성격은 이걸 붙여주지 않습니다.
  { id: 'regen',      name: '재생',    side: 'def', unit: '%', base: 2,  cap: 0.10, desc: '내 턴마다 생명의 일부를 회복' },
  { id: 'survive',    name: '생존',    side: 'def', unit: '%', base: 15, cap: 0.60, desc: '쓰러질 한 방을 생명 1로 버틸 확률 (전투당 한 번)' },
  { id: 'harmTouch',  name: '일격',    side: 'atk', unit: '%', base: 3,  cap: 0.15, desc: '10배 피해를 줄 확률 (그 한 방은 크리가 안 터짐)' },
  { id: 'doubleTurn', name: '연속 턴', side: 'atk', unit: '%', base: 8,  cap: 0.35, desc: '상대가 움직이기 전에 한 번 더 움직일 확률' }
];

const SPECIAL_KEYS = SPECIALS.map(s => s.id);
const SPECIAL_INFO = Object.fromEntries(SPECIALS.map(s => [s.id, s]));

// ---------- 장비 성격 ----------
// 성격은 **떨어뜨린 적**이 정합니다. 토르의 것은 크리 몰빵, 아이언 골렘의 것은
// 방어와 막기, 뱀파이어의 것은 흡혈 — 그래야 "잡은 놈과 어울리는" 전리품이 됩니다.
//
// tilt 는 핵심 스탯을 기울이는 배수입니다. 하나를 키우면 하나가 줄어듭니다.
// gives 는 그 성격이 붙여주는 특수 능력치입니다.
//
// 같은 부위라도 성격이 다르면 갈아끼울 이유가 생깁니다 — 방어형 신발과
// 신속형 신발 중 뭐가 나은지는 내 스탯 분배에 달렸으니까요.
//
// color 는 꼬리표의 밀랍색입니다. 위에 크림색 글씨가 얹히므로 진하게 잡았습니다.
const ARCHETYPES = {
  fierce: { name: '흉포', color: '#9b2226', tilt: { damage: 1.40, life: 0.65 },                 gives: ['critRate'],            desc: '공격과 치명타에 몰빵' },
  guard:  { name: '수호', color: '#1f5a96', tilt: { defense: 1.40, life: 1.20, damage: 0.60 },  gives: ['block'],               desc: '방어와 생명, 막기' },
  leech:  { name: '흡혈', color: '#6a2c8f', tilt: { damage: 1.20, defense: 0.75 },              gives: ['lifesteal'],           desc: '때린 만큼 회복' },
  swift:  { name: '신속', color: '#2a6e27', tilt: { dex: 1.55, damage: 0.90, life: 0.85 },      gives: ['doubleHit'],           desc: '민첩과 이중타격' },
  pierce: { name: '관통', color: '#5b6470', tilt: { damage: 1.25, defense: 0.80 },              gives: ['pierce'],              desc: '단단한 상대를 뚫는다' },
  thorn:  { name: '반격', color: '#b04a14', tilt: { defense: 1.30, life: 1.15, damage: 0.65 },  gives: ['reflect'],             desc: '맞은 만큼 돌려준다' },
  // 싸움을 포기하고 전리품을 캐는 성격입니다. 공격과 생명을 확실히 깎는 대신
  // 전리품 확률을 올려줍니다 — 꼭 얻어야 할 것이 있는 판에만 갈아끼우는 물건입니다.
  lucky:  { name: '행운', color: '#7d630c', tilt: { luck: 1.90, damage: 0.70, life: 0.80 },     gives: ['findRate'],            desc: '싸움은 약해지고 전리품이 늘어난다' },
  // 행운과 똑같은 거래입니다. 저쪽은 싸움을 팔아 전리품을 사고, 이쪽은 경험치를 삽니다.
  //
  // 쓰는 법은 하나뿐입니다 — 회차를 새로 시작하면 Lv.1 로 돌아가는데, 장비는 그대로
  // 남아 있어서 초반 화신들은 뭘 입든 이깁니다. 그 구간에서 이걸 입고 경험치를
  // 두 배 넘게 빨아들이다가, 상대가 버거워지면 벗고 싸움 장비로 돌아갑니다.
  growth: { name: '성장', color: '#1f6f7a', tilt: { damage: 0.65, life: 0.80, defense: 0.85 }, gives: ['xpRate'],              desc: '싸움은 약해지고 경험치를 더 얻는다' },
  brutal: { name: '분쇄', color: '#7a2e3a', tilt: { damage: 1.30, dex: 0.80 },                  gives: ['critRate', 'pierce'],  desc: '느리지만 한 방이 무겁다' },
  ward:   { name: '보호', color: '#356b4e', tilt: { life: 1.35, defense: 1.10, dex: 0.85 },     gives: ['block', 'lifesteal'],  desc: '오래 버틴다' }
};

const SLOT_NAMES = Object.fromEntries(SLOTS.map(s => [s.id, s.name]));
const SLOT_IDS   = SLOTS.map(s => s.id);

// ---------- 특수장비 ----------
// 열세 부위와 따로 노는 칸입니다. 처음엔 하나도 없고, 숨어 있는 넷
// (제3·5·7·9격의 히든)을 처음 꺾을 때마다 하나씩 열려 최대 넷까지 생깁니다.
// 특수장비라면 어느 칸에든 끼울 수 있습니다 — 보석이든 유물이든.
// 부위 강화는 받지 않습니다. 대신 하나하나가 일반 장비 한 부위보다 뾰족합니다.
const SPECIAL_SLOT_MAX = 4;
const SPECIAL_SLOT_IDS = Array.from({ length: SPECIAL_SLOT_MAX }, (_, i) => `special${i + 1}`);
const ALL_SLOT_IDS = SLOT_IDS.concat(SPECIAL_SLOT_IDS);
const SPECIAL_NUM = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
SLOT_NAMES.special = '특수장비';
SPECIAL_SLOT_IDS.forEach((id, i) => { SLOT_NAMES[id] = `특수장비 ${SPECIAL_NUM[i]}`; });

function isSpecialSlot(slot) { return SPECIAL_SLOT_IDS.includes(slot); }

// 보석 — 핵심 스탯 하나만, 크게. 떨어뜨린 화신의 레벨을 따라 커집니다.
//   그 레벨 화신 스탯의 0.12배 × 등급 배수 (일반 1 · 히든 1.6 · 보스 1.8)
//   무기 한 자루가 공격 0.26배라, 보스 보석 하나(0.22배)가 일반 무기 하나에 조금 못 미칩니다.
// 유물 — 특수 능력치 하나. 레벨이 아니라 **격**을 탑니다. 제5격이 기준값이고
//   격 하나당 +8% (제3격 ×0.84 · 제9격 ×1.32 · 제15격 ×1.80). 정예 ×1.15 · 히든·보스 ×1.3
//   일반 장비 성격이 붙여주는 특수 능력치(1~2%)보다 몇 배 큽니다 — 이 칸의 존재 이유입니다.
const GEM_POWER = 0.12;
const RELIC_BASE = { critRate: 6, doubleHit: 6, pierce: 10, lifesteal: 4, block: 6, reflect: 10,
                     findRate: 40, xpRate: 50, stoneRate: 30,
                     regen: 2, survive: 15, harmTouch: 3, doubleTurn: 8 };
const RELIC_GRADE = { normal: 1, elite: 1.15, hidden: 1.3, boss: 1.3 };

function relicScale(rankN) { return 0.6 + 0.08 * rankN; }

//   opt = { gem: '스탯' }  또는  { relic: ['특수 능력치', …] }
function makeSpecialStats(opt, level, kind, rankN) {
  const out = {};
  if (opt.gem) {
    const e = enemyStats(level);
    out[opt.gem] = Math.max(1, Math.round(GEM_POWER * e[opt.gem] * KINDS[kind].mult));
  }
  for (const key of opt.relic || []) {
    out[key] = +(RELIC_BASE[key] * relicScale(rankN) * RELIC_GRADE[kind] / 100).toFixed(4);
  }
  return out;
}

// 떨어뜨리는 화신의 스탯에 비례해서 성능이 정해집니다.
// 초반 장비든 후반 장비든 그 구간에서의 체감이 같아집니다.
// gradeMult 는 화신의 종류 — 정예는 1.4배, 보스는 1.8배짜리를 남깁니다.
// (예전엔 정예 1.8 · 히든 2.2 · 보스 2.6 이었습니다. 정해진 자리 하나만 잡으면 그 지역
//  일반 화신의 것이 전부 쓸모없어져서, 플레이 타임을 늘리는 쪽으로 낮췄습니다.)
function makeItemStats(slot, level, gradeMult = 1, archetype = null, vital = false) {
  const e = enemyStats(level);
  const p = (vital && VITAL_SLOT_PROFILE[slot]) || SLOT_PROFILE[slot] || {};
  const A = archetype ? ARCHETYPES[archetype] : null;
  const tilt = (A && A.tilt) || {};
  const out = {};

  for (const k of STAT_KEYS) {
    if (!p[k]) continue;
    out[k] = Math.max(1, Math.round(p[k] * e[k] * gradeMult * (tilt[k] ?? 1)));
  }

  // 특수 능력치는 성격에서만 나옵니다. 등급이 높을수록 더 붙습니다.
  if (A) for (const key of A.gives) {
    const s = SPECIAL_INFO[key];
    out[key] = +(s.base * gradeMult / 100).toFixed(4);
  }
  return out;
}

// ============================================================
//  화신의 종류와 전리품 등급
// ============================================================
// 일반 — 길에서 무작위로 만납니다. 몇 번이고 다시 만날 수 있습니다.
// 정예 — 지역마다 둘. 정해진 자리에 서 있고, 안 잡아도 진행에 지장 없습니다.
// 보스 — 지역마다 하나. 꺾어야 다음 지역이 열립니다.
//
// 정예와 보스는 **한 회차에 한 번뿐**입니다. 꺾고 나면 그 여정에선 다시 못 만납니다.
// 대신 훨씬 좋은 걸 남깁니다 — 그래서 그 자리에 갈지 말지가 매번 고민이 됩니다.
const KINDS = {
  // dropChance 는 **전리품 하나하나에 따로** 굴리는 확률입니다.
  // 세 종류를 가진 일반 적이라면 22% 를 세 번 굴리므로
  // 아무것도 못 얻을 확률이 47% 입니다 — 빈손으로 돌아서는 날이 있어야
  // 행운에 투자할 이유가 생깁니다.
  normal: { id: 'normal', name: '일반', mult: 1.0, lifeMult: 1.0,  penalty: 'LOSS_PENALTY',       once: false, energy: 0, dropChance: 0.22, gold: 1 },
  elite:  { id: 'elite',  name: '정예', mult: 1.4, lifeMult: 1.2,  penalty: 'LOSS_PENALTY_ELITE', once: true,  energy: 2, dropChance: 0.32, gold: 4 },
  hidden: { id: 'hidden', name: '히든', mult: 1.6, lifeMult: 1.25, penalty: 'LOSS_PENALTY_ELITE', once: true,  energy: 3, dropChance: 1.00, gold: 5 },
  boss:   { id: 'boss',   name: '격',   mult: 1.8, lifeMult: 1.3,  penalty: 'BOSS_LOSS_PENALTY',  once: true,  energy: 4, dropChance: 0.40, gold: 10 }
};

function lossPenaltyFor(kind) { return RULES[KINDS[kind].penalty]; }

// ============================================================
//  부위 강화
// ============================================================
// 이미 가진 전리품이 또 나오면 **자동으로 분해되어** 그 부위의 강화석이 됩니다.
// 무기가 겹치면 무기 강화석, 팔찌가 겹치면 팔찌 강화석.
// (예전엔 같은 전리품이 겹쳐 쌓였습니다 — 겹당 +15%, 최대 10겹.)
//
// 강화는 장비가 아니라 **부위**에 붙습니다. 무기 칸을 +5 로 올려두면 그 칸에
// 무엇을 끼든 핵심 스탯이 그만큼 커집니다. 회차가 끝나도, 세트를 바꿔도 남습니다.
// 겹은 새 장비로 갈아타면 1겹부터 다시였지만, 강화는 그대로 따라옵니다.
//
// 특수 능력치(크리·막기 …)는 키우지 않습니다. 겹치기 때와 같은 이유로,
// 그쪽까지 키우면 상한에 그냥 닿아서 특수가 주인공이 됩니다.
//
// 표 한 줄이 한 단계입니다. **실패하면 강화석만 사라지고 단계는 그대로**입니다.
//   cost  — 한 번 시도하는 데 드는 강화석
//   rate  — 성공 확률
//   bonus — 그 단계에 닿았을 때 핵심 스탯 증가량 (누적)
//
// +10 까지는 강화석이 넉넉하게 모여서 거의 매번 시도할 수 있습니다. 한 단계에 +5~7%.
// +11 부터는 따로 노는 구간입니다 — 비용이 네 배로 뛰고 확률이 40% 아래로 떨어지는 대신,
// 한 단계에 +20~30% 씩 크게 오릅니다. 실패해도 확률이 오르지 않습니다.
// 시뮬에서는 마지막 지역에 닿을 즈음 평균 +12, 클리어할 때 +12~14 — +15 는 드뭅니다.
const ENHANCE_TABLE = [
  { cost:    30, rate: 1.00, bonus: 0.05 },   // +1
  { cost:    60, rate: 1.00, bonus: 0.10 },   // +2
  { cost:   100, rate: 0.95, bonus: 0.15 },   // +3
  { cost:   150, rate: 0.90, bonus: 0.20 },   // +4
  { cost:   220, rate: 0.85, bonus: 0.25 },   // +5
  { cost:   320, rate: 0.80, bonus: 0.32 },   // +6
  { cost:   450, rate: 0.75, bonus: 0.39 },   // +7
  { cost:   620, rate: 0.70, bonus: 0.46 },   // +8
  { cost:   850, rate: 0.65, bonus: 0.53 },   // +9
  { cost:  1150, rate: 0.60, bonus: 0.60 },   // +10
  { cost:  5000, rate: 0.40, bonus: 0.80 },   // +11
  { cost:  6500, rate: 0.35, bonus: 1.00 },   // +12
  { cost:  8500, rate: 0.30, bonus: 1.25 },   // +13
  { cost: 11000, rate: 0.25, bonus: 1.50 },   // +14
  { cost: 14000, rate: 0.20, bonus: 1.80 }    // +15
];
const ENHANCE_MAX = ENHANCE_TABLE.length;

// ---------- 강화석 바꾸기 ----------
// 다른 부위의 강화석을 모자란 부위의 강화석으로 바꿀 수 있습니다. 대신 절반이 사라집니다.
// 특수장비를 분해한 「특수장비 강화석」도 이렇게 바꿔 씁니다 (특수장비 칸은 강화가 없으니까요).
// 손해가 크게 잡혀 있어야 "흔한 부위를 캐서 몰아주기" 가 정답이 되지 않습니다 —
// 부위마다 따로 모으는 게 기본이고, 이건 한 부위만 크게 뒤처졌을 때 쓰는 비상구입니다.
const STONE_EXCHANGE_RATE = 0.5;   // 2개를 주면 1개

function enhanceBonus(level) {
  return level > 0 ? ENHANCE_TABLE[Math.min(level, ENHANCE_MAX) - 1].bonus : 0;
}

// 분해하면 나오는 강화석 = 기본 × 등급 × 격 × 부위 희소성
//   등급 — 일반 1 · 정예 2 · 히든·보스 3
//   격   — 그 전리품의 격 번호. 제1격 하나보다 제8격 하나가 여덟 배입니다.
//          제1격 일반 화신의 드롭률이 제11격의 5.6배라, 양이 같으면
//          처음 지역에서 캐는 게 최선이 되어버립니다.
//   부위 — 흔한 부위는 덜, 드문 부위는 더 (아래 SLOT_SCARCITY)
const STONE_BASE = 10;
const STONE_GRADE = { normal: 1, elite: 2, hidden: 3, boss: 3 };

function stoneYield(item) {
  const scarce = (SLOT_SCARCITY[item.rank.n] || {})[item.slot] || 1;
  return Math.max(1, Math.round(STONE_BASE * STONE_GRADE[item.grade] * item.rank.n * scarce));
}

// ---------- 격을 삼키는 검 ----------
// 중반에 숨어 있는 「관측자」가 남기는 유일무이한 무기입니다.
//
// 이걸 들고 정예·보스를 처음 꺾으면 그 격의 에너지를 **삼켜서** 즉시 회복하고,
// 동시에 **영구히 적립**됩니다 — 다음 회차부터는 시작 에너지에 그냥 얹혀 있습니다.
//
// 그래서 후반에는 정예를 하나하나 다시 잡을 필요가 없습니다. 이미 내 것이니까.
// 곧장 더 깊은 보스로 직행해서 회차를 단축하는 게 이 검의 목적입니다.
//
// 대신 무기 자리를 잡아먹습니다. 전투력을 포기하고 에너지를 모을 것인가 —
// 그게 이 검이 만드는 선택입니다.
const DEVOURER_ID = 'observer_0';


// ============================================================
//  격(格)
// ============================================================
// 아래에서 위로 올라가는 열다섯 계단입니다.
// 앞의 여섯은 마물 — 던전에서 시작해 마왕까지.
// 뒤의 아홉은 화신 — 인간의 이야기에서 시작해 바깥의 것까지.
//   설화 → 무림 · 영물   사람의 이야기, 사람을 넘으려 한 자들, 그들이 쫓는 천 년 묵은 것
//   영웅 → 천사 · 악마   신의 피를 이은 자, 하늘의 뜻을 전하는 것, 하늘에 등을 돌린 것
//   신격 → 주신 → 외신
// minLevel 은 지역 데이터에서 자동으로 채워집니다.
const RANKS = [
  { n: 1,  name: '잡졸', hanja: '雜卒', desc: '이름조차 없는 것' },
  { n: 2,  name: '마물', hanja: '魔物', desc: '이름이 붙은 것' },
  { n: 3,  name: '마수', hanja: '魔獸', desc: '전설이 된 짐승' },
  { n: 4,  name: '환수', hanja: '幻獸', desc: '신화에 걸친 짐승' },
  { n: 5,  name: '마족', hanja: '魔族', desc: '스스로 생각하는 것' },
  { n: 6,  name: '마왕', hanja: '魔王', desc: '세계를 위협하는 것' },
  { n: 7,  name: '설화', hanja: '說話', desc: '이야기가 남은 인간' },
  { n: 8,  name: '무림', hanja: '武林', desc: '사람의 몸으로 하늘에 닿으려 한 자' },
  { n: 9,  name: '영물', hanja: '靈物', desc: '천 년을 묵어 하늘을 넘보는 것' },
  { n: 10, name: '영웅', hanja: '英雄', desc: '신의 피를 이은 자' },
  { n: 11, name: '천사', hanja: '天使', desc: '하늘의 뜻을 전하는 것' },
  { n: 12, name: '악마', hanja: '惡魔', desc: '하늘에 등을 돌린 것' },
  { n: 13, name: '신격', hanja: '神格', desc: '이름을 가진 신' },
  { n: 14, name: '주신', hanja: '主神', desc: '신들을 다스리는 자' },
  { n: 15, name: '외신', hanja: '外神', desc: '바깥에서 온 것' }
];

function rankOf(level) {
  let r = RANKS[0];
  for (const rank of RANKS) if (level >= rank.minLevel) r = rank;
  return r;
}

// ============================================================
//  레벨 사다리
// ============================================================
// 적의 레벨은 손으로 적지 않습니다. 등장 순서만 정하면 1 부터 상한까지
// 기하급수로 자동 배치됩니다.
//
// 그래서 적을 중간에 끼워 넣기만 해도 사다리가 저절로 촘촘해집니다.
// 촘촘할수록 "아슬아슬한 상대"가 많아지고, 승률이 0%/100% 로만 갈리지 않습니다.
// 지금은 183마리라 한 칸이 약 1.19배입니다.
//
// 격을 열한 개에서 열다섯 개로 늘리면서 상한도 100억에서 100조로 올렸습니다.
// 상한을 그대로 두고 쉰 마리를 끼워 넣으면 한 칸이 1.13배로 좁아질 뿐,
// 올라가야 할 거리는 그대로라 게임이 길어지지 않습니다.
// 한 칸의 폭(≈1.19배)을 지키고 사다리를 위로 늘려야 늘어난 격만큼 길이가 붙습니다.
const LEVEL_CAP = 1e14;  // 100조 — 아자토스의 레벨
const LADDER_FLAT = 8;          // 맨 아래 여덟 칸은 1,2,…,8 로 손으로 깝니다
                                // (안 그러면 저레벨이 전부 Lv.1 로 뭉개집니다)

// 읽기 좋게 유효숫자 세 자리로 자릅니다 — Lv.4,663 보다 Lv.4,660 이 낫습니다
function roundSig(n, digits = 3) {
  if (n < 100) return Math.round(n);
  const m = Math.pow(10, Math.floor(Math.log10(n)) - digits + 1);
  return Math.round(n / m) * m;
}

function buildLadder(total) {
  const steps = total - LADDER_FLAT;
  const r = Math.pow(LEVEL_CAP / LADDER_FLAT, 1 / steps);
  const out = [];
  for (let i = 0; i < total; i++) {
    out.push(i < LADDER_FLAT
      ? i + 1
      : roundSig(LADDER_FLAT * Math.pow(r, i - LADDER_FLAT + 1)));
  }
  return out;
}

// ============================================================
//  지역과 화신
// ============================================================
// 지역 하나가 격 하나이고, 지역마다 화신 열두 명 — 일반 아홉, 정예 둘, 보스 하나.
// 레벨은 1 에서 100조까지, 한 칸이 약 1.19배씩입니다.
// (칸이 촘촘할수록 "아슬아슬한 상대"가 많아집니다. 승률이 0/100 으로만
//  갈리지 않으려면 사다리도 촘촘해야 합니다.)
//
// d 는 떨어뜨리는 전리품: [부위, 이름] 을 1~3개.
// 화신마다 부위 조합이 다릅니다 — 알렉산드로스는 투구·신발·반지를 남기고,
// 손자는 병법서와 각반을 남기는 식으로.
const ZONES = [
  // ───────────────────────── 마물 구간 ─────────────────────────
  {
    id: 'sewer', rank: 1,
    name: '초심자의 지하수로',
    flavor: '누구나 여기서 시작한다. 여기서 끝나는 자도 많다.',
    enemies: [
      { id: 'slime', name: '슬라임', title: '가장 만만한 것', icon: '🟢',
        d: [['weapon', '녹슨 단검'], ['armor', '점액 묻은 천옷']] },
      { id: 'giantrat', name: '자이언트 랫', title: '수로에 사는 것', icon: '🐀',
        d: [['boots', '쥐가죽 신'], ['ring', '이빨 목걸이']] },
      { id: 'goblin', name: '고블린', title: '떼로 몰려다니는', icon: '👺',
        d: [['weapon', '고블린 손도끼'], ['helm', '찌그러진 투구']] },
      { id: 'kobold', name: '코볼트', title: '함정을 파는 것', icon: '🦎',
        d: [['gloves', '조잡한 덫'], ['greaves', '비늘 각반']] },
      { id: 'goblinchief', name: '고블린 족장', title: '제일 큰 몽둥이를 든 자', icon: '🪓', kind: 'elite',
        d: [['shoulder', '족장의 어깨뼈'], ['armor', '전리품 누더기'], ['necklace', '해골 목걸이']] },
      { id: 'skeleton', name: '스켈레톤', title: '부서져도 다시 모이는', icon: '☠️',
        d: [['shoulder', '갈비뼈 견갑'], ['helm', '해골 투구']] },
      { id: 'zombie', name: '좀비', title: '느리지만 멈추지 않는', icon: '🧟',
        d: [['armor', '썩은 가죽'], ['greaves', '무거운 발']] },
      { id: 'cavespider', name: '자이언트 스파이더', title: '천장에서 내려오는', icon: '🕷️',
        d: [['boots', '거미줄 신'], ['ring', '독니 반지']] },
      { id: 'mimic', name: '미믹', title: '보물인 척하는 것', icon: '🧰', kind: 'elite',
        d: [['gloves', '이빨 달린 상자'], ['necklace', '가짜 금화'], ['ring', '미끼 반지']] },
      { id: 'imp', name: '임프', title: '작고 귀찮은 악마', icon: '😈',
        d: [['offhand', '작은 삼지창'], ['necklace', '유황 조각']] },
      { id: 'darkwolf', name: '다크 울프', title: '어둠 속에서 눈만 보이는', icon: '🐕‍🦺',
        d: [['armor', '늑대가죽 갑옷'], ['boots', '발자국 없는 신']] },
      { id: 'dungeonguardian', name: '던전 가디언', title: '문을 지키라는 명령만 남은', icon: '🛡️', kind: 'boss',
        d: [['weapon', '수호자의 대검'], ['armor', '고철 판금'], ['necklace', '지하수로의 열쇠']] }
    ]
  },
  {
    id: 'forest', rank: 2,
    name: '이끼 낀 숲길',
    flavor: '길은 있다. 다만 누가 냈는지는 아무도 모른다.',
    enemies: [
      { id: 'orc', name: '오크 전사', title: '힘으로만 밀어붙이는', icon: '🐗',
        d: [['weapon', '오크 대검'], ['armor', '가죽 흉갑']] },
      { id: 'hobgoblin', name: '홉고블린', title: '줄을 맞춰 싸우는 고블린', icon: '👹',
        d: [['offhand', '군용 방패'], ['helm', '지휘관의 투구']] },
      { id: 'lizardman', name: '리저드맨', title: '늪에서 기어나온', icon: '🐊',
        d: [['weapon', '뼈 삼지창'], ['greaves', '늪지 각반']] },
      { id: 'harpy', name: '하피', title: '노래로 홀리는 것', icon: '🪽',
        d: [['boots', '깃털 신'], ['ring', '홀리는 목소리']] },
      { id: 'orcgeneral', name: '오크 장군', title: '천 명을 이끌었던', icon: '🪖', kind: 'elite',
        d: [['shoulder', '장군의 견장'], ['armor', '전장의 판금'], ['helm', '뿔 달린 투구']] },
      { id: 'ogre', name: '오우거', title: '나무를 뽑아 휘두르는', icon: '🪨',
        d: [['shoulder', '통나무 어깨받이'], ['greaves', '두꺼운 각반']] },
      { id: 'darkelf', name: '다크 엘프 자객', title: '뒤에서만 나타나는', icon: '🌑',
        d: [['weapon', '독 바른 단검'], ['boots', '그림자 신'], ['ring', '암살자의 인장']] },
      { id: 'treant', name: '트렌트', title: '걷는 나무', icon: '🌳',
        d: [['armor', '나무껍질 갑옷'], ['offhand', '뿌리 방패']] },
      { id: 'forestwitch', name: '숲의 마녀', title: '길 잃은 자만 만나는', icon: '🧙', kind: 'elite',
        d: [['weapon', '뒤틀린 지팡이'], ['necklace', '저주받은 부적'], ['ring', '마녀의 고리']] },
      { id: 'gargoyle', name: '가고일', title: '낮에는 돌인 것', icon: '🗿',
        d: [['armor', '석상 갑주'], ['helm', '돌 뿔']] },
      { id: 'basilisk', name: '바실리스크', title: '눈을 마주치면 끝', icon: '🐍',
        d: [['necklace', '석화의 눈'], ['greaves', '비늘 정강이']] },
      { id: 'trollking', name: '트롤 킹', title: '베어도 다시 붙는 자', icon: '🧌', kind: 'boss',
        d: [['weapon', '재생의 곤봉'], ['armor', '트롤가죽 갑주'], ['necklace', '숲의 심장']] }
    ]
  },
  {
    id: 'ruins', rank: 3,
    name: '무너진 왕국',
    flavor: '왕은 없고 왕관만 굴러다닌다.',
    enemies: [
      { id: 'minotaur', name: '미노타우로스', title: '미궁의 주인', icon: '🐂',
        d: [['weapon', '미궁의 전투도끼'], ['helm', '황소 투구']] },
      { id: 'wyvern', name: '와이번', title: '용은 아니지만 하늘을 나는', icon: '🦇',
        d: [['boots', '날개막 신'], ['armor', '와이번 가죽']] },
      { id: 'chimera', name: '키메라', title: '셋을 억지로 붙여놓은', icon: '🦁',
        d: [['shoulder', '세 짐승의 어깨'], ['necklace', '뒤섞인 심장']] },
      { id: 'manticore', name: '만티코어', title: '꼬리에 독침이 달린', icon: '🦂',
        d: [['weapon', '독침 채찍'], ['ring', '만티코어의 송곳니']] },
      { id: 'griffinlord', name: '그리핀 로드', title: '하늘의 왕관을 쓴', icon: '🦅', kind: 'elite',
        d: [['boots', '창공의 발톱'], ['armor', '깃털 흉갑'], ['necklace', '왕의 깃털']] },
      { id: 'stonegolem', name: '스톤 골렘', title: '명령 하나만 기억하는', icon: '🪆',
        d: [['armor', '화강암 갑주'], ['greaves', '돌기둥 각반']] },
      { id: 'irongolem', name: '아이언 골렘', title: '녹슬지 않는 병사', icon: '⚒️',
        d: [['offhand', '강철 방패'], ['helm', '무쇠 투구']] },
      { id: 'harpyqueen', name: '하피 퀸', title: '노래를 멈추지 않는', icon: '🎶',
        d: [['ring', '여왕의 깃털'], ['boots', '바람 타는 신']] },
      { id: 'hydra', name: '히드라', title: '하나 자르면 둘이 되는', icon: '🐲', kind: 'elite',
        d: [['weapon', '아홉 머리의 이빨'], ['armor', '재생하는 비늘'], ['necklace', '불멸의 독']] },
      { id: 'cockatrice', name: '코카트리스', title: '닭처럼 생겼지만', icon: '🐓',
        d: [['greaves', '석화 방지 각반'], ['ring', '볏의 고리']] },
      { id: 'darkknight', name: '다크 나이트', title: '투구 안이 비어 있는', icon: '🖤',
        d: [['shoulder', '흑철 견갑'], ['armor', '흑기사 판금'], ['helm', '빈 투구']] },
      // 특수장비 칸을 여는 히든 — 그 지역 보스를 한 번 꺾으면 모습을 드러냅니다
      { id: 'carbuncle', name: '카벙클', title: '무너진 왕국의 홍옥을 이마에 박은', icon: '💎', kind: 'hidden', opens: true,
        d: [['special', '카벙클의 홍옥', { gem: 'damage' }], ['special', '세공사의 돋보기', { relic: ['stoneRate'] }]] },
      { id: 'fallenking', name: '몰락한 왕', title: '아직도 옥좌에 앉아 있는', icon: '🤴', kind: 'boss',
        d: [['weapon', '왕의 세검'], ['helm', '녹슨 왕관'], ['necklace', '무너진 옥새']] }
    ]
  },
  {
    id: 'sanctuary', rank: 4,
    name: '잊혀진 성역',
    flavor: '신화에 이름이 실린 짐승들이 여기 숨어 있다.',
    enemies: [
      { id: 'unicorn', name: '유니콘', title: '순수한 자에게만 보이는', icon: '🦄',
        d: [['weapon', '일각수의 뿔'], ['necklace', '정화의 물방울']] },
      { id: 'pegasus', name: '페가수스', title: '땅을 딛지 않는 말', icon: '🐴',
        d: [['boots', '구름을 딛는 편자'], ['bracelet', '날개의 고리']] },
      { id: 'phoenix', name: '피닉스', title: '타 죽어야 사는 새', icon: '🔥',
        d: [['cloak', '재에서 난 깃옷'], ['necklace', '불멸의 잿불']] },
      { id: 'cerberus', name: '케르베로스', title: '문을 지키는 세 머리', icon: '🐕',
        d: [['helm', '세 머리의 투구'], ['greaves', '지옥문 각반']] },
      { id: 'sphinx', name: '스핑크스', title: '답하지 못하면 잡아먹는', icon: '🐈‍⬛', kind: 'elite',
        d: [['necklace', '풀리지 않는 수수께끼'], ['helm', '사자의 관'], ['bracelet', '정답의 고리']] },
      { id: 'leviathan', name: '리바이어던', title: '바다를 통째로 삼킨', icon: '🐋',
        d: [['armor', '심해 비늘 갑주'], ['shoulder', '해일의 지느러미']] },
      { id: 'behemoth', name: '베히모스', title: '땅을 통째로 눌러앉은', icon: '🦏',
        d: [['greaves', '대지의 각반'], ['offhand', '뿔 방패']] },
      { id: 'ziz', name: '지즈', title: '하늘을 가리는 날개', icon: '🕊️',
        d: [['boots', '하늘 덮는 신'], ['bracelet', '깃대의 고리']] },
      { id: 'kraken', name: '크라켄', title: '배를 통째로 끌고 내려가는', icon: '🦑', kind: 'elite',
        d: [['shoulder', '거대 촉수'], ['armor', '흡반 갑피'], ['necklace', '심연의 먹물']] },
      { id: 'salamander', name: '샐러맨더', title: '불 속에서만 사는', icon: '🦎',
        d: [['weapon', '불꽃 꼬리'], ['greaves', '용암 각반']] },
      { id: 'sylph', name: '실프', title: '만질 수 없는 것', icon: '💨',
        d: [['boots', '바람의 신'], ['bracelet', '공기의 고리']] },
      { id: 'sanctdragon', name: '성역의 수호룡', title: '천 년을 한 자리에서', icon: '🐉', kind: 'boss',
        d: [['weapon', '용의 송곳니 검'], ['armor', '고룡 비늘 갑주'], ['necklace', '성역의 인장']] }
    ]
  },
  {
    id: 'necropolis', rank: 5,
    name: '시체가 걷는 도시',
    flavor: '여기 사는 것들은 죽는 법을 잊었다.',
    enemies: [
      { id: 'ghoul', name: '구울', title: '무덤을 파헤치는', icon: '🧟‍♂️',
        d: [['gloves', '갈퀴손'], ['greaves', '흙투성이 각반']] },
      { id: 'wraith', name: '레이스', title: '만질 수 없는 원한', icon: '👻',
        d: [['cloak', '안개 수의'], ['bracelet', '원한의 고리']] },
      { id: 'vampire', name: '뱀파이어', title: '초대받아야 들어오는', icon: '🧛',
        d: [['weapon', '흡혈 레이피어'], ['cloak', '귀족의 망토'], ['necklace', '피의 성배']] },
      { id: 'banshee', name: '밴시', title: '죽음을 미리 알리는 울음', icon: '😱',
        d: [['helm', '통곡의 두건'], ['bracelet', '예고의 고리']] },
      { id: 'deathknight', name: '데스 나이트', title: '충성만 남은 시체', icon: '⚰️', kind: 'elite',
        d: [['weapon', '서약의 대검'], ['armor', '사자의 판금'], ['helm', '맹세의 투구']] },
      { id: 'bonedragon', name: '본 드래곤', title: '살이 없어도 나는', icon: '🦴',
        d: [['armor', '뼈 갑주'], ['boots', '해골 발톱']] },
      { id: 'succubus', name: '서큐버스', title: '꿈으로 들어오는', icon: '💋',
        d: [['ring', '유혹의 반지'], ['necklace', '훔친 꿈']] },
      { id: 'incubus', name: '인큐버스', title: '깨어나면 사라지는', icon: '🩸',
        d: [['shoulder', '악몽의 어깨'], ['boots', '꿈을 걷는 신']] },
      { id: 'lich', name: '리치', title: '심장을 항아리에 넣어둔', icon: '📕', kind: 'elite',
        d: [['weapon', '생명을 먹는 지팡이'], ['necklace', '성물함'], ['helm', '학자의 관']] },
      { id: 'demonlord', name: '데몬 로드', title: '계약서를 들고 오는', icon: '👿',
        d: [['shoulder', '계약의 낙인'], ['armor', '지옥 판금'], ['ring', '피로 쓴 서명']] },
      { id: 'balrog', name: '발록', title: '불과 그림자', icon: '🌋',
        d: [['weapon', '불꽃 채찍'], ['greaves', '용암 정강이'], ['offhand', '그림자 방패']] },
      // 특수장비 칸을 여는 히든
      { id: 'ravenking', name: '까마귀 왕', title: '반짝이는 것이면 죽은 자의 것이라도 물어 가는', icon: '🐦', kind: 'hidden', opens: true,
        d: [['special', '까마귀가 물어 온 청옥', { gem: 'defense' }], ['special', '검은 깃 부적', { relic: ['doubleHit'] }]] },
      { id: 'lichking', name: '불사의 왕', title: '죽음을 신하로 부리는', icon: '👑', kind: 'boss',
        d: [['weapon', '서리한'], ['armor', '불사의 판금'], ['necklace', '왕의 성물함']] }
    ]
  },
  {
    id: 'abyss', rank: 6,
    name: '마계의 왕좌',
    flavor: '세계를 끝내겠다고 말하는 것들이 여기 모여 있다.',
    enemies: [
      { id: 'archdemon', name: '아크데몬', title: '군단을 거느린 것', icon: '😈',
        d: [['weapon', '심연의 대검'], ['armor', '마계 판금']] },
      { id: 'titan', name: '타이탄', title: '신에게 진 자들', icon: '🗿',
        d: [['greaves', '거인의 각반'], ['offhand', '산을 깎은 방패']] },
      { id: 'elderdragon', name: '고대룡', title: '신화보다 오래된 비늘', icon: '🐲',
        d: [['weapon', '고룡의 송곳니'], ['armor', '고룡의 비늘'], ['necklace', '용의 심장']] },
      { id: 'abysstentacle', name: '심연의 촉수', title: '바닥이 없는 곳에서 올라온', icon: '🦑',
        d: [['shoulder', '끝없는 촉수'], ['boots', '바닥 없는 신']] },
      { id: 'sinpride', name: '칠죄종 · 오만', title: '무릎 꿇는 법을 모르는', icon: '🪞', kind: 'elite',
        d: [['helm', '오만의 관'], ['armor', '굽히지 않는 갑주'], ['ring', '자만의 고리']] },
      { id: 'sinwrath', name: '칠죄종 · 분노', title: '식지 않는 것', icon: '🔥',
        d: [['shoulder', '분노의 견갑'], ['greaves', '타오르는 각반']] },
      { id: 'singreed', name: '칠죄종 · 탐욕', title: '가져도 모자란 것', icon: '💰',
        d: [['ring', '탐욕의 반지'], ['necklace', '끝없는 자루']] },
      { id: 'demongeneral', name: '마신장', title: '마왕의 왼팔', icon: '⚔️',
        d: [['weapon', '마신의 창'], ['armor', '흑요석 판금'], ['helm', '마장의 투구']] },
      // 관측자는 이 검 하나만 남깁니다. 그래서 분해될 일도 없습니다.
      // 검에는 공격력이 아예 없습니다 — 이걸 들면 보스가 확실히 더 어려워져야
      // "에너지를 모을 것인가, 싸울 것인가" 가 진짜 선택이 되니까요.
      { id: 'observer', name: '관측자', title: '처음부터 당신을 보고 있던 것', icon: '👁️', kind: 'hidden',
        d: [['weapon', '격을 삼키는 검', 'none']] },
      { id: 'worldworm', name: '세계수를 먹는 벌레', title: '뿌리부터 갉아먹는', icon: '🐛', kind: 'elite',
        d: [['weapon', '갉는 턱'], ['armor', '마디 갑각'], ['necklace', '세계수의 파편']] },
      { id: 'apocalypsebeast', name: '종말의 짐승', title: '뿔이 일곱 개인', icon: '🐏',
        d: [['helm', '일곱 뿔의 관'], ['greaves', '짓밟는 각반']] },
      { id: 'voidlord', name: '공허의 군주', title: '아무것도 아닌 것의 왕', icon: '🕳️',
        d: [['weapon', '공허의 낫'], ['armor', '없음의 갑주'], ['bracelet', '빈 고리']] },
      { id: 'demonking', name: '마왕', title: '세계를 끝내러 온 자', icon: '💀', kind: 'boss',
        d: [['weapon', '마왕의 검'], ['armor', '마왕의 갑주'], ['necklace', '마왕의 관']] }
    ]
  },

  // ───────────────────────── 화신 구간 ─────────────────────────
  {
    id: 'rank1', rank: 7,
    name: '알렉산드리아 대도서관',
    flavor: '불탄 줄 알았던 두루마리들이 아직 여기서 숨을 쉰다.',
    enemies: [
      { id: 'storyteller', name: '이름 없는 이야기꾼', title: '가장 오래된 목소리', icon: '📖',
        d: [['weapon', '닳아버린 붓'], ['cloak', '이야기꾼의 해진 외투']] },
      { id: 'scribe', name: '필경사의 화신', title: '베껴 쓰다 눈이 먼', icon: '🪶',
        d: [['offhand', '마르지 않는 뿔병'], ['boots', '필경사의 낡은 샌들']] },
      { id: 'archimedes', name: '아르키메데스의 화신', title: '지렛대를 든 자', icon: '⚙️',
        d: [['weapon', '움직이지 않는 지렛대'], ['ring', '유레카의 원']] },
      { id: 'hypatia', name: '히파티아의 화신', title: '마지막 도서관장', icon: '🔭',
        d: [['offhand', '천구의'], ['necklace', '아스트롤라베']] },
      { id: 'sunzi', name: '손자의 화신', title: '싸우지 않고 이기는 법', icon: '📜', kind: 'elite',
        d: [['weapon', '병법의 죽간'], ['greaves', '그림자 각반'], ['helm', '허를 찌르는 투구']] },
      { id: 'davinci', name: '레오나르도 다 빈치의 화신', title: '다 그리지 못한 설계도', icon: '🎨',
        d: [['offhand', '날개 설계도'], ['boots', '비행 장치']] },
      { id: 'herodotos', name: '헤로도토스의 화신', title: '처음으로 기록한 자', icon: '🗺️',
        d: [['helm', '기록자의 두건'], ['necklace', '역사의 첫 장']] },
      { id: 'joan', name: '잔 다르크의 화신', title: '불타는 오를레앙의 처녀', icon: '⚜️',
        d: [['shoulder', '성녀의 견갑'], ['armor', '오를레앙의 흰 갑주'], ['necklace', '재가 되지 않는 심장']] },
      { id: 'spartacus', name: '스파르타쿠스의 화신', title: '사슬을 끊은 검투사', icon: '⛓️', kind: 'elite',
        d: [['weapon', '부러진 글라디우스'], ['offhand', '검투사의 방패'], ['bracelet', '끊어진 족쇄']] },
      { id: 'genghis', name: '칭기즈 칸의 화신', title: '지평선을 국경으로 삼은', icon: '🏇',
        d: [['shoulder', '초원의 어깨가리개'], ['boots', '천리마의 등자'], ['ring', '칸의 인장']] },
      { id: 'alexander', name: '알렉산드로스의 화신', title: '온 세계가 좁았던 자', icon: '🐎',
        d: [['helm', '정복자의 투구'], ['armor', '마케도니아 흉갑'], ['ring', '고르디우스의 매듭']] },
      // 특수장비 칸을 여는 히든
      { id: 'trismegistus', name: '헤르메스 트리스메기스투스의 화신', title: '위에서와 같이 아래에서도', icon: '⚗️', kind: 'hidden', opens: true,
        d: [['special', '에메랄드 서판', { relic: ['xpRate'] }], ['special', '현자의 돌', { gem: 'luck' }]] },
      { id: 'yisunsin', name: '이순신의 화신', title: '아직 열두 척이 남았다', icon: '⚓', kind: 'boss',
        d: [['weapon', '쌍룡검'], ['armor', '두정갑'], ['necklace', '난중일기']] }
    ]
  },
  // ───────────────────────── 무림 · 영물 ─────────────────────────
  // 설화(이야기가 남은 인간) 다음 계단. 사람의 몸으로 하늘에 닿으려 한 자들과,
  // 그들이 평생을 걸고 쫓는 천 년 묵은 것들.
  {
    id: 'murim', rank: 8,
    name: '천하제일 비무대',
    flavor: '강호에 이름 석 자를 남기려는 자들이 오른다. 걸어서 내려간 자는 손에 꼽는다.',
    enemies: [
      { id: 'nangin', name: '흑도 낭인', title: '값만 맞으면 누구든 벤다', icon: '🗡️',
        d: [['weapon', '이 빠진 박도'], ['boots', '떠돌이 짚신']] },
      { id: 'gaebang', name: '개방 장로', title: '천하의 소문은 거지가 먼저 안다', icon: '🥢',
        d: [['weapon', '타구봉'], ['belt', '아홉 매듭 띠']] },
      { id: 'emei', name: '아미파 사태', title: '자비로운 얼굴, 자비 없는 비수', icon: '📿',
        d: [['offhand', '아미자'], ['bracelet', '백팔 염주']] },
      { id: 'shaolin', name: '소림 나한', title: '쇠를 두드려 몸을 만든', icon: '🙏',
        d: [['gloves', '금강 권갑'], ['armor', '철포삼']] },
      { id: 'dalma', name: '달마의 화신', title: '벽을 보고 아홉 해', icon: '🧘', kind: 'elite',
        d: [['offhand', '세수경'], ['necklace', '면벽의 염주'], ['cloak', '갈대 한 줄기 가사']] },
      { id: 'wudang', name: '무당 도사', title: '부드러움이 굳셈을 이긴다', icon: '☯️',
        d: [['weapon', '송문고검'], ['cloak', '태극 도포']] },
      { id: 'tangga', name: '사천당가 독수', title: '손끝마다 다른 독', icon: '🧪',
        d: [['ring', '독침 반지'], ['shoulder', '암기 견대']] },
      { id: 'hwasan', name: '화산파 매화검수', title: '검 끝에 매화가 핀다', icon: '🌸',
        d: [['helm', '매화 두건'], ['boots', '암향 신']] },
      { id: 'zhangsanfeng', name: '장삼봉의 화신', title: '태극을 처음 그린 자', icon: '⛰️', kind: 'elite',
        d: [['weapon', '진무검'], ['bracelet', '태극 팔찌'], ['greaves', '구름 위를 걷는 각반']] },
      { id: 'namgung', name: '남궁세가 가주', title: '창공을 가르는 세가의 검', icon: '🏯',
        d: [['necklace', '세가의 옥패'], ['greaves', '창궁 각반']] },
      { id: 'bukhae', name: '북해빙궁 무사', title: '얼음 궁에서 내려온', icon: '🧊',
        d: [['armor', '한빙 갑의'], ['helm', '서리 투구']] },
      { id: 'cheonma', name: '천마', title: '하늘 아래 마(魔)는 하나뿐', icon: '🌑', kind: 'boss',
        d: [['weapon', '천마검'], ['armor', '천마흑포'], ['helm', '천마관']] }
    ]
  },
  {
    id: 'yeongmul', rank: 9,
    name: '만년설 덮인 천산',
    flavor: '무림인이 평생을 걸고 찾는 내단의 주인들이 산다. 대개는 찾는 쪽이 먹힌다.',
    enemies: [
      { id: 'yeongsa', name: '백년 영사', title: '내단을 품고 똬리를 튼', icon: '🐍',
        d: [['necklace', '영사의 내단'], ['boots', '허물 벗은 신']] },
      { id: 'geumjam', name: '금잠고', title: '독충을 다 잡아먹고 남은 하나', icon: '🐛',
        d: [['ring', '금잠 반지'], ['gloves', '금사 장갑']] },
      { id: 'geumseom', name: '세 발 금두꺼비', title: '물고 있던 동전을 뱉으면 복이 온다', icon: '🐸',
        d: [['bracelet', '금섬 팔찌'], ['offhand', '금전표']] },
      { id: 'sansam', name: '천년 산삼 동자', title: '사람 꼴을 하고 산을 뛰어다니는 뿌리', icon: '🌱',
        d: [['belt', '산삼 뿌리 띠'], ['bracelet', '천년 삼 팔찌']] },
      { id: 'gumiho', name: '구미호', title: '천 년을 채우면 사람이 된다', icon: '🦊', kind: 'elite',
        d: [['necklace', '여우 구슬'], ['ring', '홀리는 반지'], ['cloak', '아홉 꼬리 목도리']] },
      { id: 'bingjam', name: '빙잠', title: '만년설 속에서 실을 토하는 누에', icon: '🪱',
        d: [['armor', '천잠보의'], ['cloak', '빙잠사 망토']] },
      { id: 'ungnyeo', name: '웅녀', title: '쑥과 마늘로 백 일을 버틴 곰', icon: '🐻',
        d: [['helm', '쑥 화관'], ['greaves', '곰 발 각반']] },
      { id: 'sangun', name: '산군', title: '감히 이름으로 부르지 못하는 호랑이', icon: '🐅',
        d: [['shoulder', '산군의 어깨'], ['weapon', '호랑이 발톱']] },
      { id: 'geumsijo', name: '금시조', title: '용을 잡아먹는 금빛 날개', icon: '🦚', kind: 'elite',
        d: [['weapon', '용을 찢는 발톱'], ['shoulder', '금빛 깃 견갑'], ['boots', '바람을 딛는 발']] },
      { id: 'hwarin', name: '화린', title: '불을 밟고 다니는 기린', icon: '🦌',
        d: [['weapon', '화린 뿔창'], ['boots', '불을 밟는 신']] },
      { id: 'yeonggu', name: '금강영구', title: '만 년을 등에 지고 걷는 거북', icon: '🐢',
        d: [['offhand', '만년 귀갑'], ['helm', '거북 등 투구']] },
      // 특수장비 칸을 여는 히든 — 대나무 열매만 먹고 태평한 세상에만 내려앉습니다
      { id: 'bonghwang', name: '봉황', title: '태평한 세상에만 내려앉는 새', icon: '🎋', kind: 'hidden', opens: true,
        d: [['special', '봉황의 비취', { gem: 'dex' }], ['special', '태평의 깃', { relic: ['findRate'] }]] },
      { id: 'imugi', name: '이무기', title: '천 년을 기다려 하늘로 오르려는', icon: '🐉', kind: 'boss',
        d: [['weapon', '승천하지 못한 뿔'], ['armor', '역린 갑주'], ['necklace', '여의주']] }
    ]
  },
  {
    id: 'rank2', rank: 10,
    name: '엘리시온 평원',
    flavor: '죽어서도 영웅인 자들만 이 들판을 걷는다.',
    enemies: [
      { id: 'theseus', name: '테세우스의 화신', title: '돌아오는 길을 아는', icon: '🧵',
        d: [['shoulder', '아테네의 견갑'], ['necklace', '아리아드네의 실타래']] },
      { id: 'perseus', name: '페르세우스의 화신', title: '보지 않고 벤 자', icon: '🪞',
        d: [['offhand', '거울 방패'], ['boots', '날개 달린 신']] },
      { id: 'odysseus', name: '오디세우스의 화신', title: '열 해를 헤매고도 돌아간', icon: '⛵',
        d: [['gloves', '열두 도끼를 꿰뚫은 손'], ['cloak', '거지 행색의 누더기']] },
      { id: 'atalanta', name: '아탈란테의 화신', title: '누구보다 빨랐던', icon: '🏹',
        d: [['weapon', '칼리돈의 활'], ['boots', '멈추지 않는 발'], ['ring', '황금 사과']] },
      { id: 'enkidu', name: '엔키두의 화신', title: '흙으로 빚어진 벗', icon: '🌿',
        d: [['armor', '들짐승의 가죽'], ['greaves', '야생의 각반']] },
      { id: 'gilgamesh', name: '길가메시의 화신', title: '영생을 놓친 왕', icon: '🗿', kind: 'elite',
        d: [['shoulder', '하늘 황소의 어깨'], ['helm', '우루크의 왕관'], ['necklace', '시들어버린 영생초']] },
      { id: 'hector', name: '헥토르의 화신', title: '질 것을 알고도 나선', icon: '🏛️',
        d: [['offhand', '트로이의 방패'], ['greaves', '성벽의 각반']] },
      { id: 'achilles', name: '아킬레우스의 화신', title: '발뒤꿈치 하나만 사람인', icon: '🛡️',
        d: [['weapon', '펠리온의 물푸레 창'], ['armor', '불멸의 청동 갑주'], ['boots', '테티스가 잡았던 발목']] },
      { id: 'cuchulainn', name: '쿠 훌린의 화신', title: '빛의 아이', icon: '🔱',
        d: [['weapon', '게 불그'], ['greaves', '뒤틀림의 각반']] },
      { id: 'beowulf', name: '베오울프의 화신', title: '맨손으로 괴물을 찢은', icon: '🐻', kind: 'elite',
        d: [['gloves', '그렌델의 팔'], ['helm', '곰가죽 투구'], ['bracelet', '흐룬팅의 고리']] },
      { id: 'arjuna', name: '아르주나의 화신', title: '과녁의 눈만 보이는', icon: '🎯',
        d: [['weapon', '간디바'], ['bracelet', '집중의 고리'], ['boots', '전차의 발판']] },
      { id: 'siegfried', name: '지그프리트의 화신', title: '용의 피를 뒤집어쓴 자', icon: '🗡️',
        d: [['weapon', '마검 그람'], ['armor', '용피 갑주'], ['necklace', '파프니르의 심장']] },
      { id: 'heracles', name: '헤라클레스의 화신', title: '열두 번 죽고 열두 번 돌아온', icon: '🦁', kind: 'boss',
        d: [['weapon', '올리브 몽둥이'], ['armor', '네메아 사자의 가죽'], ['necklace', '열두 과업의 증표']] }
    ]
  },
  // ───────────────────────── 천사 · 악마 ─────────────────────────
  // 영웅(신의 피를 이은 자) 다음 계단. 하늘의 뜻을 전하는 것들과,
  // 그 하늘에 등을 돌린 것들. 이 둘을 넘어야 이름을 가진 신들이 나온다.
  {
    id: 'heaven', rank: 11,
    name: '일곱 번째 하늘',
    flavor: '노래가 한 번도 멈춘 적 없는 곳. 아홉 겹의 성가대가 문을 지킨다.',
    enemies: [
      { id: 'guardianangel', name: '수호천사', title: '한 사람 곁에 하나씩', icon: '😇',
        d: [['cloak', '깃털 한 장의 망토'], ['ring', '지켜보는 반지']] },
      { id: 'principality', name: '권천사', title: '나라 하나를 맡은', icon: '🛐',
        d: [['helm', '나라를 맡은 관'], ['belt', '홀을 찬 띠']] },
      { id: 'powerangel', name: '능천사', title: '악을 쫓는 첫 번째 칼', icon: '🔆',
        d: [['weapon', '악을 쫓는 창'], ['shoulder', '능천사의 견갑']] },
      { id: 'trumpetangel', name: '나팔의 천사', title: '일곱 나팔 중 첫째를 부는', icon: '🎺',
        d: [['offhand', '첫째 나팔'], ['boots', '구름 디딤 신']] },
      { id: 'raphael', name: '라파엘의 화신', title: '신이 고치신다', icon: '⚕️', kind: 'elite',
        d: [['bracelet', '치유의 팔찌'], ['necklace', '토비트의 물고기'], ['belt', '나그네의 띠']] },
      { id: 'virtueangel', name: '역천사', title: '기적을 맡은', icon: '✨',
        d: [['bracelet', '기적의 팔찌'], ['gloves', '기적을 행하는 손']] },
      { id: 'dominion', name: '주천사', title: '천사들을 다스리는 천사', icon: '🕊️',
        d: [['armor', '다스림의 흉갑'], ['necklace', '주권의 목걸이']] },
      { id: 'throneangel', name: '좌천사', title: '눈으로 가득한 바퀴', icon: '🛞',
        d: [['greaves', '바퀴 속의 바퀴'], ['helm', '눈으로 가득한 관']] },
      { id: 'gabriel', name: '가브리엘의 화신', title: '소식을 전하러 내려온', icon: '📯', kind: 'elite',
        d: [['offhand', '마지막 나팔'], ['ring', '백합 반지'], ['helm', '전령의 관']] },
      { id: 'cherub', name: '지품천사', title: '에덴의 동쪽에서 불칼을 든', icon: '🦁',
        d: [['weapon', '두루 도는 불칼'], ['shoulder', '네 얼굴의 견갑']] },
      { id: 'seraph', name: '치품천사', title: '여섯 날개로 얼굴을 가린', icon: '🌞',
        d: [['cloak', '여섯 날개'], ['gloves', '숯불 집게']] },
      { id: 'michael', name: '미카엘의 화신', title: '용을 하늘에서 떨어뜨린', icon: '⚖️', kind: 'boss',
        d: [['weapon', '용을 떨어뜨린 검'], ['armor', '천군의 갑주'], ['offhand', '영혼의 저울']] }
    ]
  },
  {
    id: 'hell', rank: 12,
    name: '얼어붙은 코키토스',
    flavor: '지옥의 맨 밑바닥은 불이 아니라 얼음이다. 등을 돌린 자들이 거기 얼어 있다.',
    enemies: [
      { id: 'legion', name: '레기온', title: '우리의 이름은 군대, 우리는 많다', icon: '👥',
        d: [['armor', '이천 마리 돼지가죽'], ['ring', '많은 이름의 반지']] },
      { id: 'moloch', name: '몰록의 화신', title: '불타는 제단 위의 황소', icon: '🐂',
        d: [['helm', '황소 머리 투구'], ['gloves', '제단 불에 그을린 손']] },
      { id: 'baphomet', name: '바포메트의 화신', title: '녹이고 굳히는 염소 머리 우상', icon: '🐐',
        d: [['offhand', '염소 머리 우상'], ['bracelet', '녹이고 굳히는 팔찌']] },
      { id: 'azazel', name: '아자젤의 화신', title: '사람에게 칼 벼리는 법을 가르친', icon: '⚒️',
        d: [['weapon', '처음 벼린 칼'], ['shoulder', '감시자의 견갑']] },
      { id: 'beelzebub', name: '벨제부브의 화신', title: '파리 떼의 왕', icon: '🪰', kind: 'elite',
        d: [['helm', '파리 떼의 관'], ['armor', '파리 날개 갑의'], ['gloves', '배를 채우지 못하는 손']] },
      { id: 'mephisto', name: '메피스토펠레스의 화신', title: '영혼을 값으로 쳐주는 상인', icon: '🎩',
        d: [['necklace', '피로 쓴 계약서'], ['cloak', '진홍 외투']] },
      { id: 'astaroth', name: '아스타로트의 화신', title: '독사를 타고 오는 공작', icon: '🦎',
        d: [['boots', '독사를 탄 신'], ['belt', '독사 허리띠']] },
      { id: 'belial', name: '벨리알의 화신', title: '불의 전차를 탄 무가치한 자', icon: '🕯️',
        d: [['weapon', '무가치의 검'], ['greaves', '불의 전차 각반']] },
      { id: 'asmodeus', name: '아스모데우스의 화신', title: '솔로몬의 반지를 빼앗은', icon: '💍', kind: 'elite',
        d: [['ring', '솔로몬의 반지'], ['necklace', '세 머리의 목걸이'], ['boots', '불타는 발굽']] },
      { id: 'paimon', name: '파이몬의 화신', title: '서쪽을 다스리는 지옥의 왕', icon: '🐪',
        d: [['helm', '파이몬의 왕관'], ['offhand', '모든 학문의 책']] },
      { id: 'lilith', name: '릴리스의 화신', title: '에덴을 먼저 떠난 자', icon: '🌒',
        d: [['necklace', '밤의 목걸이'], ['bracelet', '첫 아내의 팔찌']] },
      { id: 'lucifer', name: '루시퍼의 화신', title: '가장 빛나던 별, 가장 깊이 떨어진', icon: '🌠', kind: 'boss',
        d: [['weapon', '새벽별의 검'], ['armor', '얼어붙은 날개 갑주'], ['cloak', '빛을 잃은 여섯 날개']] }
    ]
  },
  {
    id: 'rank3', rank: 13,
    name: '이그드라실의 가지',
    flavor: '아홉 세계가 이 나무 하나에 매달려 있다. 어느 신화든 여기서 만난다.',
    enemies: [
      { id: 'hermes', name: '헤르메스의 화신', title: '경계를 넘나드는 전령', icon: '🪽',
        d: [['boots', '날개 달린 샌들'], ['offhand', '카두케우스']] },
      { id: 'bastet', name: '바스테트의 화신', title: '집과 전쟁을 함께 지키는', icon: '🐈',
        d: [['ring', '고양이의 눈'], ['greaves', '소리 없는 각반']] },
      { id: 'anubis', name: '아누비스의 화신', title: '심장의 무게를 재는 자', icon: '🐺',
        d: [['shoulder', '방부사의 어깨띠'], ['helm', '재칼의 가면'], ['necklace', '마아트의 저울']] },
      { id: 'artemis', name: '아르테미스의 화신', title: '달과 사냥의 주인', icon: '🌙',
        d: [['weapon', '초승달 활'], ['boots', '사슴가죽 신']] },
      { id: 'loki', name: '로키의 화신', title: '묶여서도 웃는 자', icon: '🦊', kind: 'elite',
        d: [['offhand', '거짓의 단검'], ['bracelet', '뒤바뀐 반지'], ['necklace', '슬레이프니르의 갈기']] },
      { id: 'susanoo', name: '스사노오의 화신', title: '쫓겨나서 영웅이 된', icon: '🌪️',
        d: [['weapon', '아메노하바키리'], ['cloak', '폭풍의 겉옷']] },
      { id: 'thor', name: '토르의 화신', title: '천둥을 손에 쥔 자', icon: '⚡',
        d: [['weapon', '묠니르'], ['gloves', '야른그레이프르'], ['belt', '메긴교르드']] },
      { id: 'ares', name: '아레스의 화신', title: '전쟁 그 자체', icon: '⚔️',
        d: [['shoulder', '전화(戰禍)의 견갑'], ['armor', '전화(戰禍)의 갑주'], ['helm', '포보스의 투구']] },
      { id: 'poseidon', name: '포세이돈의 화신', title: '땅을 흔드는 자', icon: '🌊', kind: 'elite',
        d: [['weapon', '삼지창'], ['boots', '파도를 딛는 신'], ['necklace', '심해의 진주']] },
      { id: 'amaterasu', name: '아마테라스의 화신', title: '동굴에서 나온 해', icon: '🌅',
        d: [['cloak', '하늘 옷'], ['helm', '야타의 관'], ['ring', '야사카니의 곡옥']] },
      { id: 'isis', name: '이시스의 화신', title: '흩어진 것을 다시 모으는', icon: '🪬',
        d: [['gloves', '생명의 매듭'], ['belt', '아마포 감개'], ['necklace', '앙크']] },
      { id: 'hades', name: '하데스의 화신', title: '돌아온 자가 없는 문의 주인', icon: '💀', kind: 'boss',
        d: [['weapon', '명계의 이지창'], ['helm', '보이지 않게 하는 투구'], ['necklace', '케르베로스의 사슬']] }
    ]
  },
  {
    id: 'rank4', rank: 14,
    name: '올림포스 정상',
    flavor: '어느 신화의 주신이든, 결국 정상에서는 마주치게 된다.',
    enemies: [
      { id: 'osiris', name: '오시리스의 화신', title: '찢겨서도 다시 맞춰진', icon: '🏺',
        d: [['offhand', '갈고리 홀'], ['greaves', '아마포 각반']] },
      { id: 'izanagi', name: '이자나기의 화신', title: '황천에서 돌아온 자', icon: '🗾',
        d: [['shoulder', '황천의 견갑'], ['boots', '황천을 밟은 신']] },
      { id: 'ra', name: '라의 화신', title: '매일 세계를 다시 켜는 자', icon: '☀️',
        d: [['shoulder', '태양의 견갑'], ['armor', '황금 태양원반'], ['ring', '우라에우스의 뱀']] },
      { id: 'vishnu', name: '비슈누의 화신', title: '열 번 세상에 내려온', icon: '🪷',
        d: [['offhand', '수다르샤나 원반'], ['necklace', '연꽃의 씨']] },
      { id: 'indra', name: '인드라의 화신', title: '천 개의 눈으로 보는 자', icon: '🐘', kind: 'elite',
        d: [['weapon', '금강저 바즈라'], ['armor', '아이라바타의 비늘'], ['helm', '천 개의 눈']] },
      { id: 'hwanin', name: '환인의 화신', title: '하늘에서 내려다본 자', icon: '🏔️',
        d: [['helm', '천부인의 관'], ['greaves', '태백의 각반'], ['necklace', '신단수의 가지']] },
      { id: 'jadeemperor', name: '옥황상제의 화신', title: '하늘 관청의 주인', icon: '🐲',
        d: [['cloak', '자미원의 곤룡포'], ['ring', '옥새']] },
      { id: 'shiva', name: '시바의 화신', title: '춤 한 번에 세계를 끝내는', icon: '🕉️',
        d: [['weapon', '트리슐라'], ['greaves', '재를 밟는 각반'], ['necklace', '제3의 눈']] },
      { id: 'odin', name: '오딘의 화신', title: '한쪽 눈으로 모든 것을 본', icon: '🦅', kind: 'elite',
        d: [['weapon', '빗나가지 않는 창 궁니르'], ['cloak', '회색 나그네의 망토'], ['necklace', '미미르의 눈']] },
      { id: 'quetzalcoatl', name: '케찰코아틀의 화신', title: '깃털 달린 뱀', icon: '🐍',
        d: [['offhand', '깃털 방패'], ['boots', '창공을 딛는 신'], ['greaves', '깃털 각반']] },
      { id: 'ahuramazda', name: '아후라 마즈다의 화신', title: '꺼지지 않는 불', icon: '🔥',
        d: [['helm', '성화의 관'], ['cloak', '빛의 겉옷'], ['bracelet', '진리의 고리']] },
      { id: 'zeus', name: '제우스의 화신', title: '올림포스의 마지막 말', icon: '⛈️', kind: 'boss',
        d: [['weapon', '케라우노스'], ['offhand', '아이기스'], ['necklace', '올림포스의 인장']] }
    ]
  },
  {
    id: 'rank5', rank: 15,
    name: '궁극의 혼돈',
    flavor: '여기엔 위도 아래도 없다. 신화도 없다. 신화는 인간의 것이니까.',
    enemies: [
      { id: 'dagon', name: '다곤의 화신', title: '깊은 곳의 아버지', icon: '🐟',
        d: [['greaves', '심해 비늘 각반'], ['boots', '물갈퀴 신']] },
      { id: 'yig', name: '이그의 화신', title: '뱀들의 아버지', icon: '🐍',
        d: [['belt', '방울뱀 허리띠'], ['ring', '저주의 고리']] },
      { id: 'ithaqua', name: '이타콰의 화신', title: '바람을 타고 걷는 자', icon: '❄️',
        d: [['boots', '눈을 밟지 않는 신'], ['necklace', '얼어붙은 발자국']] },
      { id: 'chaugnar', name: '차우그나르 파우근의 화신', title: '피를 빠는 코끼리 신', icon: '🦣',
        d: [['shoulder', '상아 어깨뼈'], ['armor', '돌가죽 갑주']] },
      { id: 'shubniggurath', name: '슈브니구라스의 화신', title: '천 마리 새끼를 거느린 검은 염소', icon: '🐐',
        d: [['helm', '뿔난 관'], ['bracelet', '새끼의 고리'], ['greaves', '검은 털 각반']] },
      { id: 'hastur', name: '하스터의 화신', title: '세 번 부르면 오는 황의 왕', icon: '👑', kind: 'elite',
        d: [['weapon', '황색 징표의 검'], ['cloak', '누더기 황의'], ['necklace', '카르코사의 열쇠']] },
      { id: 'tsathoggua', name: '츠아토구아의 화신', title: '움직이기 싫어하는 두꺼비 신', icon: '🦥',
        d: [['offhand', '잠의 부적'], ['boots', '늪을 걷는 신']] },
      { id: 'glaaki', name: '글라아키의 화신', title: '가시로 꿈을 꿰는 자', icon: '🪲',
        d: [['shoulder', '꿰뚫는 금속 가시'], ['helm', '녹슨 관'], ['greaves', '호수 바닥의 각반']] },
      { id: 'cthulhu', name: '크툴루의 화신', title: '죽지 않고 잠들어 있을 뿐인', icon: '🐙',
        d: [['weapon', '르뤼에의 촉수'], ['armor', '심해의 갑각'], ['helm', '촉수관']] },
      { id: 'yogsothoth', name: '요그소토스의 화신', title: '문이자 열쇠이며 문지기인', icon: '🔮', kind: 'elite',
        d: [['offhand', '열리는 문'], ['ring', '모든 문의 열쇠'], ['necklace', '구체 속의 구체']] },
      { id: 'abhoth', name: '아브호스의 화신', title: '끝없이 새것을 게워내는 웅덩이', icon: '🫧',
        d: [['armor', '끓는 진흙 갑주'], ['boots', '녹아내리는 신'], ['bracelet', '갓 태어난 고리']] },
      { id: 'nyarlathotep', name: '니알라토텝의 화신', title: '천 개의 가면을 쓴 기어오는 혼돈', icon: '🎭',
        d: [['weapon', '천 개째의 가면'], ['cloak', '검은 파라오의 의복'], ['greaves', '기어오는 각반']] },
      { id: 'azathoth', name: '아자토스', title: '중심에서 잠든 눈먼 백치 신 · 화신을 갖지 못한 유일한 것',
        icon: '🌀', kind: 'boss', final: true,
        d: [['weapon', '만물을 가르는 칼날'], ['armor', '무(無)의 갑주'], ['necklace', '백치의 왕관']] }
    ]
  }
];

// ============================================================
//  적마다의 성격
// ============================================================
// 그 적이 남기는 전리품의 성격입니다. 생김새·설화와 어울리게 붙였습니다.
// 이웃한 적끼리는 일부러 다른 성격을 줬습니다 — 바로 윗레벨에서 같은 부위가
// 또 나와도 "갈아끼울까 말까" 가 고민이 되도록.
// 『행운』과 『성장』은 **일부러 드뭅니다.** 싸움을 포기하고 갈아입는 물건이라
// 흔하면 갈아입는 일이 특별하지 않게 됩니다. 격마다 하나씩만 두세요.
//   행운(전리품) — 미믹 · 하피퀸 · 서큐버스 · 이야기꾼 · 개방 장로 · 금두꺼비
//                  · 역천사 · 메피스토펠레스 · 로키 · 요그소토스
//   성장(경험치) — 임프 · 피닉스 · 아르키메데스 · 달마 · 웅녀 · 가브리엘
//                  · 바포메트 · 이시스 · 글라아키
const ENEMY_ARCHETYPE = {
  // 1격 잡졸 — 지하수로
  slime: 'ward',        giantrat: 'swift',     goblin: 'fierce',     kobold: 'guard',
  goblinchief: 'brutal', skeleton: 'pierce',   zombie: 'ward',       cavespider: 'leech',
  mimic: 'lucky',       imp: 'growth',         darkwolf: 'swift',    dungeonguardian: 'guard',

  // 2격 마물 — 숲길
  orc: 'brutal',        hobgoblin: 'guard',    lizardman: 'pierce',  harpy: 'swift',
  orcgeneral: 'fierce', ogre: 'brutal',        darkelf: 'leech',     treant: 'thorn',
  forestwitch: 'leech', gargoyle: 'guard',     basilisk: 'pierce',   trollking: 'ward',

  // 3격 마수 — 무너진 왕국
  minotaur: 'brutal',   wyvern: 'swift',       chimera: 'fierce',    manticore: 'pierce',
  griffinlord: 'swift', stonegolem: 'guard',   irongolem: 'thorn',   harpyqueen: 'lucky',
  hydra: 'ward',        cockatrice: 'pierce',  darkknight: 'fierce', fallenking: 'guard',

  // 4격 환수 — 잊혀진 성역
  unicorn: 'ward',      pegasus: 'swift',      phoenix: 'growth',    cerberus: 'fierce',
  sphinx: 'ward',       leviathan: 'brutal',   behemoth: 'guard',    ziz: 'swift',
  kraken: 'leech',      salamander: 'fierce',  sylph: 'swift',       sanctdragon: 'thorn',

  // 5격 마족 — 시체가 걷는 도시
  ghoul: 'leech',       wraith: 'swift',       vampire: 'leech',     banshee: 'fierce',
  deathknight: 'guard', bonedragon: 'pierce',  succubus: 'lucky',    incubus: 'leech',
  lich: 'pierce',       demonlord: 'brutal',   balrog: 'fierce',     lichking: 'ward',

  // 6격 마왕 — 마계의 왕좌
  archdemon: 'fierce',  titan: 'guard',        elderdragon: 'brutal', abysstentacle: 'leech',
  sinpride: 'thorn',    sinwrath: 'fierce',    singreed: 'leech',    demongeneral: 'pierce',
  observer: 'swift',    worldworm: 'leech',    apocalypsebeast: 'brutal', voidlord: 'pierce',
  demonking: 'fierce',

  // 7격 설화 — 알렉산드리아 대도서관
  storyteller: 'lucky', scribe: 'swift',       archimedes: 'growth', hypatia: 'swift',
  sunzi: 'guard',       davinci: 'swift',      herodotos: 'ward',    joan: 'fierce',
  spartacus: 'brutal',  genghis: 'swift',      alexander: 'fierce',  yisunsin: 'guard',

  // 8격 무림 — 천하제일 비무대
  nangin: 'fierce',     gaebang: 'lucky',      emei: 'pierce',       shaolin: 'guard',
  dalma: 'growth',      wudang: 'ward',        tangga: 'leech',      hwasan: 'swift',
  zhangsanfeng: 'thorn', namgung: 'brutal',    bukhae: 'guard',      cheonma: 'fierce',

  // 9격 영물 — 만년설 덮인 천산
  yeongsa: 'leech',     geumjam: 'pierce',     geumseom: 'lucky',    sansam: 'ward',
  gumiho: 'leech',      bingjam: 'guard',      ungnyeo: 'growth',    sangun: 'fierce',
  geumsijo: 'swift',    hwarin: 'pierce',      yeonggu: 'guard',     imugi: 'brutal',

  // 10격 영웅 — 엘리시온 평원
  theseus: 'pierce',    perseus: 'swift',      odysseus: 'pierce',   atalanta: 'swift',    enkidu: 'ward',
  gilgamesh: 'brutal',  hector: 'guard',       achilles: 'fierce',   cuchulainn: 'brutal',
  beowulf: 'thorn',     arjuna: 'pierce',      siegfried: 'leech',   heracles: 'brutal',

  // 11격 천사 — 일곱 번째 하늘
  guardianangel: 'ward', principality: 'guard', powerangel: 'fierce', trumpetangel: 'swift',
  raphael: 'ward',      virtueangel: 'lucky',  dominion: 'brutal',   throneangel: 'thorn',
  gabriel: 'growth',    cherub: 'guard',       seraph: 'fierce',     michael: 'brutal',

  // 12격 악마 — 얼어붙은 코키토스
  legion: 'brutal',     moloch: 'fierce',      baphomet: 'growth',   azazel: 'pierce',
  beelzebub: 'leech',   mephisto: 'lucky',     astaroth: 'swift',    belial: 'thorn',
  asmodeus: 'fierce',   paimon: 'guard',       lilith: 'leech',      lucifer: 'pierce',

  // 13격 신격 — 이그드라실의 가지
  hermes: 'swift',      bastet: 'swift',       anubis: 'pierce',     artemis: 'swift',
  loki: 'lucky',        susanoo: 'fierce',     thor: 'brutal',       ares: 'fierce',
  poseidon: 'brutal',   amaterasu: 'ward',     isis: 'growth',       hades: 'thorn',

  // 14격 주신 — 올림포스 정상
  osiris: 'leech',      izanagi: 'pierce',     ra: 'fierce',         vishnu: 'ward',
  indra: 'brutal',      hwanin: 'guard',       jadeemperor: 'guard', shiva: 'pierce',
  odin: 'pierce',       quetzalcoatl: 'swift', ahuramazda: 'thorn',  zeus: 'fierce',

  // 15격 외신 — 궁극의 혼돈
  dagon: 'leech',       yig: 'thorn',          ithaqua: 'swift',      chaugnar: 'leech',    shubniggurath: 'ward',
  hastur: 'thorn',      tsathoggua: 'ward',    glaaki: 'growth',     cthulhu: 'brutal',
  yogsothoth: 'lucky',  abhoth: 'leech',       nyarlathotep: 'swift', azathoth: 'brutal'
};

// ============================================================
//  덧붙이는 전리품
// ============================================================
// 허리띠·망토·장갑·팔찌를 나중에 추가하면서 부위만 만들고 아이템을 못 채웠습니다.
// (허리띠 2종, 장갑 6종뿐이었습니다.)
// 위의 ZONES 를 다시 건드리면 실수가 나기 쉬워서, 여기서 id 로 덧붙입니다.
//
// ⚠ 여기 덧붙인다고 그 화신의 전리품이 네 종류가 되지는 않습니다.
//   한 화신은 **최대 세 종류**까지만 남기고, 넘치면 흔한 부위부터 잘라냅니다
//   (아래 trimDrops 참고). 드롭은 종류마다 따로 굴리기 때문에, 네 종류를
//   허용하면 그 화신만 한 번에 떨어지는 양이 3분의 1 많아집니다.
const EXTRA_DROPS = {
  // 1격 잡졸
  goblin: [['gloves', '고블린 손싸개']],   kobold: [['belt', '코볼트 허리끈']],
  skeleton: [['belt', '뼈 허리띠']],       zombie: [['gloves', '썩은 손']],
  darkwolf: [['gloves', '늑대발 장갑']],   dungeonguardian: [['belt', '수호자의 띠']],

  // 2격 마물
  orc: [['gloves', '오크 손등가리개']],    hobgoblin: [['belt', '군용 허리띠']],
  darkelf: [['gloves', '암살자의 장갑']],  treant: [['belt', '덩굴 허리띠']],
  trollking: [['gloves', '재생하는 손']],

  // 3격 마수
  minotaur: [['belt', '미궁의 허리띠']],   stonegolem: [['belt', '화강암 띠']],
  irongolem: [['gloves', '무쇠 손']],      darkknight: [['gloves', '흑철 건틀릿']],
  fallenking: [['belt', '왕의 허리띠']],

  // 4격 환수
  phoenix: [['gloves', '불티 장갑']],      behemoth: [['belt', '대지의 허리띠']],
  kraken: [['gloves', '흡반 장갑']],       salamander: [['gloves', '화염 손']],
  sanctdragon: [['belt', '용비늘 허리띠']],

  // 5격 마족
  vampire: [['gloves', '귀족의 흰 장갑']], deathknight: [['belt', '서약의 허리띠']],
  lich: [['gloves', '마른 손']],           balrog: [['belt', '불꽃 허리띠']],
  lichking: [['gloves', '서리 건틀릿']],

  // 6격 마왕
  titan: [['belt', '거인의 허리띠']],      elderdragon: [['gloves', '고룡 발톱 장갑']],
  singreed: [['belt', '탐욕의 전대']],     demongeneral: [['gloves', '마장의 건틀릿']],
  demonking: [['belt', '마왕의 허리띠']],

  // 7격 설화
  scribe: [['gloves', '잉크 물든 장갑']],  sunzi: [['belt', '병법가의 띠']],
  joan: [['gloves', '성녀의 장갑']],       genghis: [['belt', '초원의 허리띠']],
  yisunsin: [['gloves', '수군의 손싸개']],

  // 10격 영웅
  theseus: [['belt', '미궁의 실 허리띠']], gilgamesh: [['belt', '우루크의 띠']],
  achilles: [['gloves', '청동 손목받이']], beowulf: [['gloves', '맨손의 장갑']],
  heracles: [['belt', '히폴리테의 띠']],

  // 13격 신격
  hermes: [['belt', '전령의 띠']],         anubis: [['gloves', '방부사의 장갑']],
  ares: [['belt', '전쟁의 허리띠']],       amaterasu: [['gloves', '해의 장갑']],
  hades: [['belt', '명계의 띠']],

  // 14격 주신
  osiris: [['belt', '아마포 허리띠']],     ra: [['gloves', '태양의 장갑']],
  shiva: [['belt', '재의 허리띠']],        odin: [['gloves', '룬 새긴 장갑']],
  zeus: [['belt', '올림포스의 띠']],

  // 15격 외신
  dagon: [['gloves', '물갈퀴 장갑']],      hastur: [['belt', '황색 허리띠']],
  cthulhu: [['gloves', '촉수 장갑']],      nyarlathotep: [['belt', '가면의 띠']],
  azathoth: [['gloves', '무(無)의 장갑']],

  // ── 망토와 팔찌 ──
  // 1격
  imp: [['cloak', '박쥐날개 망토']],           goblinchief: [['cloak', '족장의 털가죽 망토']],
  cavespider: [['bracelet', '거미줄 팔찌']],   mimic: [['bracelet', '가짜 보석 팔찌']],
  // 2격
  harpy: [['cloak', '깃털 망토']],             forestwitch: [['cloak', '마녀의 검은 망토']],
  basilisk: [['bracelet', '석화의 팔찌']],     gargoyle: [['bracelet', '돌 팔찌']],
  // 3격
  wyvern: [['cloak', '와이번 가죽 망토']],     manticore: [['cloak', '만티코어 망토']],
  harpyqueen: [['bracelet', '여왕의 팔찌']],   hydra: [['bracelet', '재생의 팔찌']],
  // 4격
  ziz: [['cloak', '하늘 덮는 망토']],          sphinx: [['cloak', '수수께끼의 베일']],
  unicorn: [['bracelet', '정화의 팔찌']],      sylph: [['bracelet', '바람 팔찌']],
  // 5격
  banshee: [['cloak', '통곡의 망토']],         demonlord: [['cloak', '지옥 망토']],
  succubus: [['bracelet', '유혹의 팔찌']],     bonedragon: [['bracelet', '뼈 팔찌']],
  // 6격
  archdemon: [['cloak', '군단장의 망토']],     voidlord: [['cloak', '공허 망토']],
  sinpride: [['bracelet', '오만의 팔찌']],     worldworm: [['bracelet', '갉는 팔찌']],
  // 7격
  herodotos: [['cloak', '여행자의 망토']],     alexander: [['cloak', '정복자의 자줏빛 망토']],
  hypatia: [['bracelet', '천문 팔찌']],        spartacus: [['bracelet', '끊어진 쇠고랑']],
  // 10격
  perseus: [['cloak', '보이지 않는 망토']],    arjuna: [['cloak', '전차병의 망토']],
  enkidu: [['bracelet', '흙으로 빚은 팔찌']],  cuchulainn: [['bracelet', '뒤틀림의 팔찌']],
  // 13격
  artemis: [['cloak', '달빛 망토']],           loki: [['cloak', '변신의 망토']],
  bastet: [['bracelet', '고양이 팔찌']],       susanoo: [['bracelet', '폭풍 팔찌']],
  // 14격
  izanagi: [['cloak', '황천의 망토']],         vishnu: [['cloak', '열 화신의 망토']],
  indra: [['bracelet', '천둥 팔찌']],          ahuramazda: [['bracelet', '불의 팔찌']],
  // 15격
  ithaqua: [['cloak', '바람의 망토']],         yogsothoth: [['cloak', '문 너머의 장막']],
  tsathoggua: [['bracelet', '잠의 팔찌']],     chaugnar: [['bracelet', '상아 팔찌']],

  // ── 지역마다 빠진 부위 채우기 ──
  // 강화석은 부위마다 따로 모입니다. 어느 지역의 일반 화신이 그 부위를 하나도
  // 안 남기면, 그 지역에서 오래 머무는 동안 그 부위만 강화가 멈춥니다.
  // 그래서 지역마다 일반 화신만으로 열세 부위가 다 나오게 채웠습니다.
  // (빈자리가 없던 영웅·외신 지역에는 오디세우스·이그를 새로 세웠습니다.)
  cerberus: [['ring', '세 목줄의 고리']],       // 4격 — 반지
  ghoul: [['belt', '수의 허리끈']],             // 5격 — 허리띠
  sinwrath: [['gloves', '식지 않는 주먹']],     // 6격 — 장갑
  storyteller: [['belt', '천 하룻밤의 띠']],    // 7격 — 허리띠
  davinci: [['greaves', '설계도 각반']],        // 7격 — 각반
  hector: [['helm', '빛나는 투구']],            // 10격 — 투구
  jadeemperor: [['gloves', '옥황의 장갑']]      // 14격 — 장갑
};

// ============================================================
//  특수장비를 남기는 화신
// ============================================================
// 칸을 여는 히든 넷 말고도 몇몇 일반 화신과 보스가 특수장비를 남깁니다.
// 한 화신이 남기는 건 그대로 세 종류까지라, **원래 남기던 것 하나를 빼고** 그 자리에 넣습니다.
//   replace — 빼는 부위. 일반 화신은 그 지역의 다른 일반 화신이 같은 부위를 남기는 것만 뺐습니다
//             (지역마다 열세 부위가 다 나와야 강화석이 고르게 모입니다).
// 빠진 전리품을 이미 가진 저장본은 불러올 때 그 부위의 강화석으로 돌려받습니다 (RETIRED_ITEMS).
const SPECIAL_DROPS = {
  sanctdragon: { replace: 'necklace', item: ['special', '성역의 수호석',   { relic: ['block'] }] },     // 4격 보스
  vampire:     { replace: 'necklace', item: ['special', '흡혈귀의 송곳니', { relic: ['lifesteal'] }] }, // 5격
  elderdragon: { replace: 'necklace', item: ['special', '고룡의 심장석',   { gem: 'life' }] },          // 6격
  alexander:   { replace: 'ring',     item: ['special', '칼로 끊은 매듭',  { relic: ['pierce'] }] },    // 7격 — 고르디우스의 매듭을 풀지 않고 베어버린
  cheonma:     { replace: 'helm',     item: ['special', '천마의 비급',     { relic: ['critRate'] }] },  // 8격 보스
  imugi:       { replace: 'necklace', item: ['special', '이무기의 여의주', { gem: 'luck' }] },          // 9격 보스
  siegfried:   { replace: 'necklace', item: ['special', '파프니르의 피',   { gem: 'life' }] },          // 10격
  michael:     { replace: 'offhand',  item: ['special', '미카엘의 저울',   { relic: ['reflect'] }] },   // 11격 보스
  lucifer:     { replace: 'armor',    item: ['special', '새벽별 조각',     { relic: ['critRate'] }] },  // 12격 보스
  thor:        { replace: 'belt',     item: ['special', '메긴교르드의 고리', { gem: 'damage' }] },      // 13격 — 힘을 두 배로 만드는 띠의 고리
  shiva:       { replace: 'necklace', item: ['special', '시바의 셋째 눈',  { relic: ['pierce'] }] },    // 14격
  cthulhu:     { replace: 'helm',     item: ['special', '잠든 신의 우상',  { relic: ['doubleHit'] }] }, // 15격

  // ── 원작의 네 능력치 (재생 · 생존 · 일격 · 연속 턴) — 이른 격 하나, 늦은 격 하나씩 ──
  trollking:   { replace: 'necklace', item: ['special', '트롤의 심장',        { relic: ['regen'] }] },      // 2격 보스 — 베어도 다시 붙는
  minotaur:    { replace: 'belt',     item: ['special', '미궁의 뿔',          { relic: ['harmTouch'] }] },  // 3격
  wyvern:      { replace: 'cloak',    item: ['special', '와이번의 날개막',    { relic: ['doubleTurn'] }] }, // 3격
  phoenix:     { replace: 'necklace', item: ['special', '다시 타오르는 잿불', { relic: ['regen'] }] },      // 4격 — 타 죽어야 사는 새
  lichking:    { replace: 'necklace', item: ['special', '죽지 않는 성물함',   { relic: ['survive'] }] },    // 5격 보스
  heracles:    { replace: 'necklace', item: ['special', '네메아를 꺾은 주먹', { relic: ['harmTouch'] }] },  // 10격 보스
  hermes:      { replace: 'belt',     item: ['special', '전령의 날개',        { relic: ['doubleTurn'] }] }, // 13격
  izanagi:     { replace: 'cloak',    item: ['special', '황천의 복숭아',      { relic: ['survive'] }] }     // 14격 — 황천에서 도망치며 던진
};

// 특수장비에 자리를 내준 전리품. 저장본에 남아 있으면 그 부위의 강화석으로 바꿔 드립니다.
const RETIRED_ITEMS = {};

// 특수장비가 떨어지는 가장 낮은 격. 그 아래(1~3격)의 화신은 특수장비를 남기지 않습니다 —
// 3격의 숨은 것(카벙클)은 특수장비 칸을 열고 떠돌이 상인을 불러올 뿐입니다.
const SPECIAL_MIN_RANK = 4;

// ============================================================
//  세트 효과 · 도감 보상
// ============================================================
// 같은 성격의 장비를 여러 부위에 끼면 그 성격의 특수 능력치가 더 붙습니다.
// 일반 부위 열세 칸만 셉니다 (특수장비에는 성격이 없습니다).
// 값은 그 단계의 합계입니다 — 6부위가 되면 3부위 값 대신 6부위 값이 붙습니다.
// 분쇄·보호 세트는 원작의 일격·재생을 붙여줍니다 (그 둘은 원래 유물로만 나옵니다).
const SET_STEPS = [3, 6];
const SET_BONUS = {
  fierce: { critRate:  [0.03, 0.07] },
  guard:  { block:     [0.03, 0.07] },
  leech:  { lifesteal: [0.02, 0.05] },
  swift:  { doubleHit: [0.03, 0.07] },
  pierce: { pierce:    [0.05, 0.12] },
  thorn:  { reflect:   [0.05, 0.12] },
  lucky:  { findRate:  [0.20, 0.50] },
  growth: { xpRate:    [0.25, 0.60] },
  brutal: { harmTouch: [0.015, 0.04] },
  ward:   { regen:     [0.01, 0.03] }
};

// 한 격의 전리품을 전부 모으면 영구히 핵심 스탯(생명 · 공격 · 방어 · 민첩 · 행운)이 오릅니다.
// 정예 · 히든 · 보스의 것까지 다 모아야 합니다. 열다섯 격을 다 채우면 +15%.
// 레벨 · 분배 · 장비를 다 합친 뒤에 곱해서 생각보다 셉니다 — 격당 +2% 로 뒀더니
// 초반 격 도감이 일찍 차면서 게임이 101 → 64회차로 줄었습니다.
const COLLECTION_BONUS = 0.01;

// ============================================================
//  위 데이터를 펼쳐서 실제로 쓰는 배열 만들기
// ============================================================
const ENEMIES = [];
const ITEMS = [];

// 등장 순서대로 레벨을 깔아줍니다. 적을 몇 마리 추가하든 알아서 다시 배분됩니다.
const TOTAL_FOES = ZONES.reduce((n, z) => n + z.enemies.length, 0);
const LADDER = buildLadder(TOTAL_FOES);

// ---------- 한 화신이 남기는 전리품은 최대 세 종류 ----------
// EXTRA_DROPS 를 덧붙이면서 쉰한 마리가 네 종류가 됐습니다.
// 위 EXTRA_DROPS 주석에 "개수를 늘려도 한 번에 떨어지는 양은 그대로" 라고
// 적혀 있었는데 **틀린 말이었습니다.** 드롭은 종류마다 따로 굴리므로
// 네 종류는 곧 한 번 잡을 때 떨어지는 양이 3분의 1 늘어난다는 뜻입니다.
//
// 버릴 것은 **나중에 덧댄 것(EXTRA_DROPS)부터** 고릅니다.
// 처음엔 "흔한 부위부터" 버리게 했는데, 무기가 전체에서 제일 흔한 부위라
// **열한 보스가 전부 무기를 잃었습니다** — 아자토스의 『만물을 가르는 칼날』까지요.
// 손으로 쓴 e.d 목록은 그 화신의 정체이고 EXTRA_DROPS 는 부위 수를 채우려고
// 덧댄 것이니, 양보해야 하는 쪽은 덧댄 쪽입니다.
// 덧댄 것끼리는 흔한 부위부터, 같은 부위가 두 번 붙은 것은 무조건 먼저 버립니다.
const MAX_DROPS_PER_ENEMY = 3;

const SLOT_TALLY = {};
for (const z of ZONES) {
  for (const e of z.enemies) {
    for (const [slot] of e.d.concat(EXTRA_DROPS[e.id] || [])) {
      SLOT_TALLY[slot] = (SLOT_TALLY[slot] || 0) + 1;
    }
  }
}

// 남길 것들을 **원래 자리 번호와 함께** 돌려줍니다.
// 전리품 id 가 `적id_순번` 이라, 잘라내고 번호를 다시 매기면 저장해둔
// 전리품이 엉뚱한 물건으로 바뀝니다. 그래서 번호는 원래 것을 그대로 씁니다.
// (특수장비에 자리를 내준 것은 넘어오기 전에 이미 빠져 있습니다 — 번호만 비워둡니다.)
function trimDrops(withIdx, enemyId, baseCount) {
  if (withIdx.length <= MAX_DROPS_PER_ENEMY) return withIdx;

  const seen = new Set();
  const scored = withIdx.map(({ spec, idx }) => {
    const slot = spec[0];
    const dupe = seen.has(slot);
    seen.add(slot);
    let score = (dupe ? 100000 : 0)                    // 같은 부위 중복이 가장 먼저
              + (idx >= baseCount ? 1000 : 0)          // 그다음이 덧댄 것
              + (SLOT_TALLY[slot] || 0);               // 같은 조건이면 흔한 부위부터
    if (`${enemyId}_${idx}` === DEVOURER_ID) score = -1;   // 격을 삼키는 검은 절대 안 버립니다
    if (slot === 'special') score = -1;                    // 특수장비도 — 이미 하나를 빼고 넣은 자리입니다
    return { spec, idx, score };
  });
  scored.sort((a, b) => a.score - b.score || a.idx - b.idx);
  return scored.slice(0, MAX_DROPS_PER_ENEMY).sort((a, b) => a.idx - b.idx);
}

let ladderIndex = 0;
ZONES.forEach((zone, zi) => {
  const rank = RANKS.find(r => r.n === zone.rank);

  zone.enemies.forEach((e, ei) => {
    const kind = e.kind || 'normal';
    const K = KINDS[kind];
    const level = LADDER[ladderIndex++];
    const arch = e.a || ENEMY_ARCHETYPE[e.id] || 'guard';

    // 각 격의 시작 레벨 = 그 지역 첫 적의 레벨
    if (ei === 0) rank.minLevel = level;

    ENEMIES.push({
      id: e.id,
      name: e.name,
      title: e.title,
      level,
      icon: e.icon,
      kind,                       // normal | elite | hidden | boss
      arch,                       // 이 적이 남기는 전리품의 성격
      boss: kind === 'boss',
      once: K.once,               // 한 회차에 한 번만 만날 수 있는가
      opens: !!e.opens,           // 처음 꺾으면 특수장비 칸이 하나 열리는가
      final: !!e.final,
      zoneIndex: zi,
      zoneId: zone.id,
      zoneName: zone.name,
      rank,
      ...toughen(e.final ? finalBossStats(level, K.lifeMult) : enemyStats(level, K.lifeMult), rank.n, !!e.final),
      xp: enemyBaseXp(level)
    });

    // [부위, 이름] 뒤에 숫자를 붙이면 그 전리품만 성능 배수를 따로 줍니다.
    // 세 번째가 'none' 이면 성격 없이 맨 스탯만 (격을 삼키는 검처럼 특별한 것).
    // 부위가 'special' 이면 특수장비 — 세 번째에 { gem } 또는 { relic } 이 옵니다.
    // 특수장비는 4격부터만 떨어집니다 (SPECIAL_MIN_RANK). 그 아래 격에 붙어 있던 특수장비는 빼고,
    // 이미 가진 저장본은 특수장비 강화석으로 돌려받습니다 (RETIRED_ITEMS).
    const low = rank.n < SPECIAL_MIN_RANK;
    const sp = low ? null : SPECIAL_DROPS[e.id];
    let list = e.d.concat(EXTRA_DROPS[e.id] || []);
    if (low && SPECIAL_DROPS[e.id]) {
      RETIRED_ITEMS[`${e.id}_${list.length}`] = { slot: 'special', grade: kind, rank, name: SPECIAL_DROPS[e.id].item[1] };
    }
    if (low) list.forEach(([slot, name], i) => {
      if (slot === 'special') RETIRED_ITEMS[`${e.id}_${i}`] = { slot: 'special', grade: kind, rank, name };
    });
    let retired = -1;
    if (sp) {
      retired = list.findIndex(x => x[0] === sp.replace);
      if (retired >= 0) {
        RETIRED_ITEMS[`${e.id}_${retired}`] = { slot: sp.replace, grade: kind, rank, name: list[retired][1] };
      }
      list = list.concat([sp.item]);   // 번호는 맨 뒤에 새로 받습니다 — 빠진 것의 번호를 물려받지 않게
    }
    const cands = list.map((spec, idx) => ({ spec, idx }))
      .filter(c => c.idx !== retired && !(low && c.spec[0] === 'special'));
    const drops = trimDrops(cands, e.id, e.d.length);
    drops.forEach(({ spec: [slot, name, opt], idx: i }) => {
      const noArch = opt === 'none';
      const isSpecial = slot === 'special';
      const id = `${e.id}_${i}`;
      const stats = noArch ? {}
        : isSpecial ? makeSpecialStats(opt, level, kind, rank.n)
        : makeItemStats(slot, level, (typeof opt === 'number' ? opt : K.mult), arch, VITAL_FOES.has(e.id));
      ITEMS.push({
        id,
        name,
        slot,
        grade: kind,              // 전리품 등급 = 떨어뜨린 화신의 종류
        arch: (noArch || isSpecial) ? null : arch,
        special: isSpecial ? (opt.gem ? 'gem' : 'relic') : null,   // 특수장비라면 보석인가 유물인가
        unique: id === DEVOURER_ID,   // 단 하나뿐인 물건 — 다시 나오지 않습니다
        note: id === DEVOURER_ID
          ? '정예·보스를 처음 꺾을 때마다 그 격을 삼켜 에너지로 바꾼다. 삼킨 에너지는 다음 회차부터 시작과 함께 주어진다. 싸움에는 아무 도움이 되지 않는다.'
          : null,
        level,
        rank,
        from: e.id,
        fromName: e.name,
        fromIcon: e.icon,         // 전리품 아이콘 = 떨어뜨린 적의 아이콘
        ...stats
      });
    });
  });
});

// ---------- 부위 희소성 ----------
// 부위마다 전리품 가짓수가 다릅니다 (무기가 허리띠의 서너 배). 그대로 두면
// 무기 강화석이 허리띠 강화석보다 몇 배 빨리 모입니다.
//
// **격마다 따로** 셉니다. 회차 대부분을 지금 격 안에서 보내기 때문에,
// 게임 전체로는 고르게 맞춰도 마지막 격에 허리띠가 하나뿐이면 거기서
// 오래 머무는 동안 허리띠만 강화가 멈춥니다 (시뮬에서 실제로 +7 에 묶였습니다).
//
// 한 회차에 몇 번이고 만나는 일반 화신의 것을 1, 회차당 한 번뿐인 정예·보스의
// 것을 0.3 으로 쳐서 그 격에서 부위별로 얼마나 자주 떨어지는지 어림하고,
// 그 역수만큼 분해량을 보정합니다. 전리품을 추가하면 알아서 다시 계산됩니다.
//   SLOT_SCARCITY[격 번호][부위]
const SLOT_SCARCITY = (() => {
  const out = {};
  for (const r of RANKS) {
    const supply = Object.fromEntries(SLOT_IDS.map(s => [s, 0]));
    for (const it of ITEMS) {
      if (it.unique || it.rank.n !== r.n) continue;
      supply[it.slot] += it.grade === 'normal' ? 1 : 0.3;
    }
    const have = SLOT_IDS.filter(s => supply[s] > 0);
    const mean = have.reduce((n, s) => n + supply[s], 0) / Math.max(1, have.length);
    out[r.n] = Object.fromEntries(SLOT_IDS.map(s =>
      [s, supply[s] > 0 ? Math.min(3, Math.max(0.4, mean / supply[s])) : 1]));
  }
  return out;
})();

// 격마다 전리품 id — 도감 완성을 셀 때 씁니다 (떠돌이 상인의 물건은 아래에서 따로 들어가므로 안 셉니다)
const RANK_ITEMS = Object.fromEntries(RANKS.map(r => [r.n, ITEMS.filter(i => i.rank.n === r.n).map(i => i.id)]));

// ---------- 골드 획득이 붙는 장비 ----------
// 돈 · 보물 · 탐욕 · 거래와 어울리는 것들에만. 값은 %.
// 행운 분배로도 골드가 늘어납니다 (game.js 의 goldMult).
const GOLD_ITEMS = {
  '가짜 금화': 20, '미끼 반지': 15,                               // 미믹 — 보물인 척하는 것
  '무너진 옥새': 20,                                               // 몰락한 왕
  '탐욕의 반지': 30, '끝없는 자루': 35, '탐욕의 전대': 30,         // 칠죄종 · 탐욕
  '금섬 팔찌': 30, '금전표': 30,                                   // 세 발 금두꺼비 — 동전을 뱉으면 복이 온다
  '칸의 인장': 25, '황금 사과': 30,
  '피로 쓴 계약서': 40,                                            // 메피스토펠레스 — 영혼을 값으로 쳐주는 상인
  '황금 태양원반': 35, '옥새': 40
};
for (const it of ITEMS) {
  if (GOLD_ITEMS[it.name]) it.goldRate = +(GOLD_ITEMS[it.name] / 100).toFixed(4);
}

// 한 번 이겼을 때 떨어지는 골드 (기운 · 골드 배수를 곱하기 전)
function goldFor(foe) {
  const r = foe && foe.rank ? foe.rank.n : 1;
  return RULES.GOLD_BASE * Math.pow(RULES.GOLD_GROWTH, r - 1) * KINDS[foe ? foe.kind : 'normal'].gold;
}
// 떠돌이 상인에게서 강화석 n 개를 사는 값 — 어느 지역에서든 같습니다
function stonePriceFor(n) { return Math.max(1, Math.ceil(RULES.STONE_PRICE * n)); }
// 그 격 일반 화신 한 번 몫을 n 배 한 값 — 상인의 물건 값
function priceFor(rank, n) { return Math.round(RULES.GOLD_BASE * Math.pow(RULES.GOLD_GROWTH, rank - 1) * n / 10) * 10; }

// ---------- 떠돌이 상인 ----------
// 그 공간 어딘가를 떠도는 숨은 것. 칸을 열지도, 싸우지도 않습니다 — 물건을 팝니다.
// 3지역의 숨은 것(카벙클)을 처음 꺾은 뒤부터, 회차마다 1~6지역 중 한 곳에 나타납니다.
// 누구인지 · 무엇을 왜 파는지는 말하지 않습니다.
// 무엇을 팔지는 아직 정하지 않았습니다 — 구조만 있습니다. 여기에 한 줄씩 넣으면 상점에 나옵니다.
//   [id, 이름, 부위, 아이콘, 격, 성격, 골드 획득 %(없으면 생략)]
//   성능은 그 격 지역의 가장 센 일반 화신 것만큼, 값은 priceFor(격, WARE_PRICE).
//   예: ['ware_hardhat', '안전모', 'helm', '⛑️', 2, 'guard']
const MERCHANT_ID = 'merchant';
const MERCHANT_UNLOCK = 'carbuncle';
const MERCHANT_WARES = [];
for (const [id, name, slot, icon, r, arch, gold] of MERCHANT_WARES) {
  const zone = ZONES.findIndex(z => z.rank === r);
  const level = Math.max(...ENEMIES.filter(e => e.zoneIndex === zone && e.kind === 'normal').map(e => e.level));
  const rank = RANKS.find(x => x.n === r);
  ITEMS.push({
    id, name, slot,
    grade: 'normal', arch, special: null, unique: false, note: null,
    level, rank,
    from: MERCHANT_ID, fromName: '떠돌이 상인', fromIcon: icon,
    ware: true,
    price: priceFor(r, RULES.WARE_PRICE),
    ...makeItemStats(slot, level, 1.2, arch, false),
    ...(gold ? { goldRate: gold / 100 } : {})
  });
}

// id 로 바로 찾습니다 — 스탯을 셀 때마다 수백 개를 훑지 않게
const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map(e => [e.id, e]));
const ITEM_BY_ID  = Object.fromEntries(ITEMS.map(i => [i.id, i]));
function getEnemy(id) { return ENEMY_BY_ID[id]; }
function getItem(id)  { return id ? ITEM_BY_ID[id] : undefined; }
function dropTable(enemyId) { return ITEMS.filter(i => i.from === enemyId); }

// 부위별 전리품 목록 (낮은 격부터) — 전리품 도감에 씁니다
function itemsInSlot(slot) { return ITEMS.filter(i => i.slot === slot); }

// 지역별 조회
function zoneRoster(zi)   { return ENEMIES.filter(e => e.zoneIndex === zi); }
function zoneNormals(zi)  { return ENEMIES.filter(e => e.zoneIndex === zi && e.kind === 'normal'); }
function zoneBoss(zi)     { return ENEMIES.find(e => e.zoneIndex === zi && e.kind === 'boss'); }
// 정예 + 히든 + 보스 — 정해진 자리에 서 있는 것들
function zonePosts(zi)    { return ENEMIES.filter(e => e.zoneIndex === zi && e.once); }
