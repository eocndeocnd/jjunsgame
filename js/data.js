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
                          // 이것만으로는 스무 개 지역을 절대 관통하지 못합니다.
                          // 『격을 삼키는 검』으로 격을 삼켜 적립해야 끝까지 갑니다
                          // (전부 삼키면 +81 — 묶음 정예는 삼킬 격이 없습니다). 그게 그 검의 존재 이유입니다.
  TRAVEL_COST: 1,         // 길을 떠날 때 (그리고 보스에게 향할 때) 드는 에너지
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
  RANK_DROP_EARLY: 1.6,   // 격 재편 때 1.2 → 1.6 (격마다 전리품 가짓수가 줄어 초반 장비가 늦게 모여서)
  // 묶음 정예(칠죄종 · 일곱 대천사 …)의 전리품 확률. 그 존재를 대표하는 물건 하나뿐이라 잘 떨어지게 둡니다.
  SET_ELITE_DROP: 0.8,
  // 경험치 쪽 초반 보너스. 1 + 값/격² 이라 훨씬 빨리 사그라듭니다 —
  // 제1격 ×3.0, 제2격 ×1.5, 제3격 ×1.22, 제5격 이후로는 사실상 없습니다.
  // 제1격에서 보스를 잡을 힘이 붙는 게 24번째 싸움이었는데 에너지가 30뿐이라,
  // 첫 회차가 제1격 하나로 다 갔습니다. 그 지점을 앞으로 당기는 값입니다.
  RANK_XP_EARLY: 2.0,
  AURA_CHANCE: 0.12,      // 화신이 이상한 기운을 두르고 나타날 확률 — 지도에서는 빛나는 놈이 보여 골라 잡을 수 있어 0.22 에서 낮춤
  // 골드 — 싸워서 이기면 떨어집니다. 회차가 끝나도 남습니다 (떠돌이 상인에게서 씁니다).
  // 한 번 이길 때 = GOLD_BASE × GOLD_GROWTH^(격−1) × 종류(일반 1 · 정예 4 · 히든 5 · 보스 10) × 기운 × 골드 배수
  // 골드 배수 = 행운 배수(분배) × (1 + 장비의 골드 획득)
  GOLD_BASE: 5,
  GOLD_GROWTH: 1.9,
  // 떠돌이 상인의 물건 값 = 그 격 일반 화신 한 번 몫의 이만큼 배.
  // 소지품은 4~6격 기준이라 4격 약 2,000 · 5격 약 3,900 · 6격 약 7,400골드 — 몇 회차를 모아야 하나 살 수 있는 값입니다.
  WARE_PRICE: 60,
  // 회차마다 떠돌이 상인이 나타날 확률 (카벙클을 처음 꺾은 그 회차는 반드시 나타납니다)
  MERCHANT_CHANCE: 0.5,
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
const RANK_TOUGHNESS = 0.17;        // 제7격의 단단함 (×1.17)
const RANK_TOUGHNESS_LATE = 0.17;   // 제8격부터 한 격마다 더 붙는 단단함
const TOUGH_FROM_RANK = 7;

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
  if (n < TOUGH_FROM_RANK) return 1;
  return 1 + RANK_TOUGHNESS + RANK_TOUGHNESS_LATE * (n - TOUGH_FROM_RANK);
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
  'abhoth',       // 끝없이 새끼를 낳는 샘
  'galahad',      // 성배의 빛 — 상처를 낫게 하는 잔
  'ymir',         // 그 몸으로 세계가 지어진 거인
  'tiamat'        // 신들을 낳은 바다
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
  // 확률이 아니라 **횟수**입니다 — 수치가 1이면 쓰러질 한 방을 한 번, 2이면 두 번 생명 1로 버팁니다 (전투마다 새로).
  { id: 'survive',    name: '생존',    side: 'def', unit: '회', base: 1,  cap: 4,    desc: '쓰러질 한 방을 생명 1로 버티는 횟수 (전투마다)' },
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
                     regen: 2, harmTouch: 3, doubleTurn: 8 };   // 생존은 횟수라 여기 없습니다 (makeSpecialStats)
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
    // 생존은 횟수 — 영웅의 격부터 두 번, 그 아래는 한 번 (격 배수 · 등급 배수를 타지 않습니다)
    out[key] = key === 'survive' ? (rankN >= RANK_N['영웅'] ? 2 : 1)
      : +(RELIC_BASE[key] * relicScale(rankN) * RELIC_GRADE[kind] / 100).toFixed(4);
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
// energy 는 『격을 삼키는 검』으로 처음 꺾을 때 얻는 에너지 (정예 1 · 히든 2 · 보스 2). 칠죄종은 예외 — devourEnergy.
const KINDS = {
  // dropChance 는 **전리품 하나하나에 따로** 굴리는 확률입니다.
  // 두 종류를 가진 일반 적이라면 31% 를 두 번 굴리므로
  // 아무것도 못 얻을 확률이 48% 입니다 — 빈손으로 돌아서는 날이 있어야
  // 행운에 투자할 이유가 생깁니다.
  // (격 재편 때 몬스터마다 전리품이 대개 셋 → 둘로 줄어, 한 번 잡을 때 떨어지는 양이 같도록
  //  일반 22 → 31% · 정예 32 → 48% 로 올렸습니다. 묶음 정예는 RULES.SET_ELITE_DROP)
  normal: { id: 'normal', name: '일반', mult: 1.0, lifeMult: 1.0,  penalty: 'LOSS_PENALTY',       once: false, energy: 0, dropChance: 0.31, gold: 1 },
  elite:  { id: 'elite',  name: '정예', mult: 1.4, lifeMult: 1.2,  penalty: 'LOSS_PENALTY_ELITE', once: true,  energy: 1, dropChance: 0.48, gold: 4 },
  hidden: { id: 'hidden', name: '히든', mult: 1.6, lifeMult: 1.25, penalty: 'LOSS_PENALTY_ELITE', once: true,  energy: 2, dropChance: 1.00, gold: 5 },
  boss:   { id: 'boss',   name: '격',   mult: 1.8, lifeMult: 1.3,  penalty: 'BOSS_LOSS_PENALTY',  once: true,  energy: 2, dropChance: 0.40, gold: 10 }
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
// 아래에서 위로 올라가는 스무 계단입니다.
// 앞의 여섯은 마물 — 던전에서 시작해 마왕까지.
// 뒤의 열넷은 화신 — 인간의 이야기에서 시작해 바깥의 것까지.
//   설화 → 기사 · 마도 · 무림   이야기가 남은 인간, 그리고 사람을 넘는 세 갈래 (검 · 마법 · 내공)
//   영물 · 환수 → 영웅          하늘을 넘보는 짐승과 신화의 짐승, 그 짐승들을 꺾은 영웅
//   천사 · 악마 → 신격          하늘의 뜻을 전하는 것, 하늘에 등을 돌린 것, 이름을 가진 신
//   태초 → 주신                 신들이 세계를 얻으려 꺾은 것, 그것을 꺾고 왕이 된 신들
//   고신 → 외신                 별이 바로 서면 깨어나는 옛 지배자들, 그리고 바깥의 것
// 급은 「꺾은 쪽 · 세운 쪽이 위」로 정했습니다 (docs/RANK-PLAN.md).
// minLevel 은 지역 데이터에서 자동으로 채워집니다.
const RANKS = [
  { n: 1,  name: '잡졸', hanja: '雜卒', desc: '이름조차 없는 것' },
  { n: 2,  name: '마물', hanja: '魔物', desc: '이름이 붙은 것' },
  { n: 3,  name: '마수', hanja: '魔獸', desc: '전설이 된 짐승' },
  { n: 4,  name: '거인', hanja: '巨人', desc: '멀리서도 보이는 것' },
  { n: 5,  name: '마족', hanja: '魔族', desc: '스스로 생각하는 것' },
  { n: 6,  name: '마왕', hanja: '魔王', desc: '세계를 위협하는 것' },
  { n: 7,  name: '설화', hanja: '說話', desc: '이야기가 남은 인간' },
  { n: 8,  name: '기사', hanja: '騎士', desc: '검에 오러를 두른 자' },
  { n: 9,  name: '마도', hanja: '魔導', desc: '마나로 세계를 고쳐 쓰려 한 자' },
  { n: 10, name: '무림', hanja: '武林', desc: '사람의 몸으로 하늘에 닿으려 한 자' },
  { n: 11, name: '영물', hanja: '靈物', desc: '천 년을 묵어 하늘을 넘보는 것' },
  { n: 12, name: '환수', hanja: '幻獸', desc: '신화에 걸친 짐승' },
  { n: 13, name: '영웅', hanja: '英雄', desc: '신의 피를 이은 자' },
  { n: 14, name: '천사', hanja: '天使', desc: '하늘의 뜻을 전하는 것' },
  { n: 15, name: '악마', hanja: '惡魔', desc: '하늘에 등을 돌린 것' },
  { n: 16, name: '신격', hanja: '神格', desc: '이름을 가진 신' },
  { n: 17, name: '태초', hanja: '太初', desc: '신들이 세계를 얻으려 꺾은 것' },
  { n: 18, name: '주신', hanja: '主神', desc: '신들을 다스리는 자' },
  { n: 19, name: '고신', hanja: '古神', desc: '별이 제자리에 오면 깨어나는 것' },
  { n: 20, name: '외신', hanja: '外神', desc: '바깥에서 온 것' }
];
// 격 이름 → 번호. 격이 늘거나 순서가 바뀌어도 「영웅부터」 같은 기준이 따라가게 이름으로 찾습니다.
const RANK_N = Object.fromEntries(RANKS.map(r => [r.name, r.n]));

function rankOf(level) {
  let r = RANKS[0];
  for (const rank of RANKS) if (level >= rank.minLevel) r = rank;
  return r;
}

// ============================================================
//  레벨 사다리 — 격마다 폭을 정해 둡니다
// ============================================================
// 적의 레벨은 손으로 적지 않습니다. 격마다 레벨의 폭(그 격의 시작 ~ 다음 격의 시작)을 정해 두고,
// 그 격의 적을 등장 순서대로 폭 안에 고르게(기하급수로) 깝니다.
//
// 예전엔 191마리 전체를 한 줄로 세워 한 칸에 약 1.18배씩 깔았습니다. 그러면 적을 넣을 때마다
// 그 뒤 격이 전부 밀려 게임이 길어집니다 (7격에 정예 다섯을 넣으면 보스 이순신이 2.3배 세집니다).
// 이제 몬스터가 많은 격은 칸이 촘촘해질 뿐 길어지지 않습니다. 촘촘할수록 아슬아슬한 상대가 많아집니다.
// 게임 길이는 몬스터 수가 아니라 격 수로 정해집니다.
//
// 1~8격의 시작은 예전 사다리 그대로라, 지금 저장본의 1~7격 레벨은 거의 그대로입니다
// (명단이 그대로인 격은 똑같고, 정예가 늘어난 5 · 7격은 10% 안쪽으로만 달라집니다).
// 8격부터는 예전 화신 격들의 평균 폭(한 격에 약 8배)으로 이어 갑니다.
const OLD_LADDER_STEP = Math.pow(1e14 / 8, 1 / (191 - 8));   // 예전 사다리(191마리 · 상한 100조)의 한 칸
const LADDER_FLAT = 8;                                        // 맨 아래 여덟 칸은 1,2,…,8 (안 그러면 저레벨이 전부 Lv.1 로 뭉개집니다)
const OLD_RANK_START = [0, 12, 24, 37, 49, 62, 77, 90];      // 예전 사다리에서 1~8격 첫 적이 섰던 자리
const RANK_SPAN = 8;                                          // 8격부터 한 격의 폭

function oldLadderAt(i) {
  return i < LADDER_FLAT ? i + 1 : LADDER_FLAT * Math.pow(OLD_LADDER_STEP, i - LADDER_FLAT + 1);
}

// RANK_START[n] = 제n격 첫 적의 레벨 (반올림 전). RANK_START[격 수 + 1] 이 상한입니다.
const RANK_START = (() => {
  const out = [];
  for (let n = 1; n <= RANKS.length + 1; n++) {
    out[n] = n <= OLD_RANK_START.length ? oldLadderAt(OLD_RANK_START[n - 1]) : out[n - 1] * RANK_SPAN;
  }
  return out;
})();
const LEVEL_CAP = RANK_START[RANKS.length + 1];   // 아자토스 바로 위 (약 380경) — 관리자 도구가 씁니다

// 읽기 좋게 유효숫자 세 자리로 자릅니다 — Lv.4,663 보다 Lv.4,660 이 낫습니다
function roundSig(n, digits = 3) {
  if (n < 100) return Math.round(n);
  const m = Math.pow(10, Math.floor(Math.log10(n)) - digits + 1);
  return Math.round(n / m) * m;
}

// 제n격의 적 count 마리 중 i 번째(0부터)의 레벨
function rankLevel(n, i, count) {
  if (n === 1) return roundSig(oldLadderAt(i));   // 1격은 예전 사다리 그대로 (맨 아래 1,2,…,8 이 깔린 자리)
  const a = RANK_START[n], b = RANK_START[n + 1];
  return roundSig(a * Math.pow(b / a, i / count));
}

// ============================================================
//  지역과 화신
// ============================================================
// 지역 하나가 격 하나입니다. 격마다 대개 일반 아홉 · 정예 둘 · 보스 하나이고,
// 숫자 · 속성으로 묶이는 것(칠죄종 · 일곱 대천사 · 올림포스 12신 …)은 정예로 늘렸습니다 (아래 ELITE_SETS).
// 일반에서 정예로 올린 자리는 채우지 않아서, 그 격은 구역(일반 종류)이 적습니다.
//
// d 는 떨어뜨리는 전리품 [부위, 이름, 세 번째(선택)] — 대부분 둘, 종종 하나, 보스는 셋.
//   'retired' — 빠진 전리품. 자리(번호)만 남고 만들어지지 않으며, 가진 저장본은 강화석으로 돌려받습니다.
//   'none'    — 성격 없이 맨 스탯만 (격을 삼키는 검처럼 특별한 것).
//   { relic } · { gem } — 특수장비.
// 전리품 id 는 `적id_자리` 입니다 (itemKey 가 있으면 `itemKey_자리`). 자리를 옮기면 가진 사람의 장비가
// 몰래 바뀌므로, 빼는 것은 'retired' 로 자리를 지키고 새것은 맨 뒤에 붙입니다.
// 격을 옮긴 적(옛 4격 짐승들 · 8격 뒤로 밀린 화신들)은 itemKey 로 번호를 새로 받았습니다 — 옛 번호는 LEGACY_ITEMS.
// 격마다 열세 부위가 모두 나오고 한 부위는 많아야 셋입니다 (tools/loot-check.js 가 빌드할 때 검사합니다).
const ZONES = [
  // ───────────────────────── 마물 구간 ─────────────────────────
  {
    id: 'sewer', rank: 1,
    name: '초심자의 지하수로',
    flavor: '누구나 여기서 시작한다. 여기서 끝나는 자도 많다.',
    enemies: [
      { id: 'slime', name: '슬라임', title: '가장 만만한 것', icon: '🟢',
        d: [['weapon', '녹슨 단검'], ['armor', '점액 묻은 천옷', 'retired']] },
      { id: 'giantrat', name: '자이언트 랫', title: '수로에 사는 것', icon: '🐀',
        d: [['boots', '쥐가죽 신'], ['ring', '이빨 목걸이']] },
      { id: 'goblin', name: '고블린', title: '떼로 몰려다니는', icon: '👺',
        d: [['weapon', '고블린 손도끼'], ['helm', '찌그러진 투구'], ['gloves', '고블린 손싸개', 'retired']] },
      { id: 'kobold', name: '코볼트', title: '함정을 파는 것', icon: '🦎',
        d: [['gloves', '조잡한 덫', 'retired'], ['greaves', '비늘 각반'], ['belt', '코볼트 허리끈']] },
      { id: 'goblinchief', name: '고블린 족장', title: '제일 큰 몽둥이를 든 자', icon: '🪓', kind: 'elite',
        d: [['shoulder', '족장의 어깨뼈'], ['armor', '전리품 누더기'], ['necklace', '해골 목걸이', 'retired']] },
      { id: 'skeleton', name: '스켈레톤', title: '부서져도 다시 모이는', icon: '☠️',
        d: [['shoulder', '갈비뼈 견갑'], ['helm', '해골 투구'], ['belt', '뼈 허리띠', 'retired']] },
      { id: 'zombie', name: '좀비', title: '느리지만 멈추지 않는', icon: '🧟',
        d: [['armor', '썩은 가죽'], ['greaves', '무거운 발'], ['gloves', '썩은 손', 'retired']] },
      { id: 'cavespider', name: '자이언트 스파이더', title: '천장에서 내려오는', icon: '🕷️',
        d: [['boots', '거미줄 신', 'retired'], ['ring', '독니 반지'], ['bracelet', '거미줄 팔찌']] },
      { id: 'mimic', name: '미믹', title: '보물인 척하는 것', icon: '🧰', kind: 'elite',
        d: [['gloves', '이빨 달린 상자'], ['necklace', '가짜 금화'], ['ring', '미끼 반지', 'retired']] },
      { id: 'imp', name: '임프', title: '작고 귀찮은 악마', icon: '😈',
        d: [['offhand', '작은 삼지창'], ['necklace', '유황 조각', 'retired'], ['cloak', '박쥐날개 망토']] },
      { id: 'darkwolf', name: '다크 울프', title: '어둠 속에서 눈만 보이는', icon: '🐕‍🦺',
        d: [['armor', '늑대가죽 갑옷', 'retired'], ['boots', '발자국 없는 신'], ['gloves', '늑대발 장갑']] },
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
        d: [['weapon', '오크 대검', 'retired'], ['armor', '가죽 흉갑'], ['gloves', '오크 손등가리개']] },
      { id: 'hobgoblin', name: '홉고블린', title: '줄을 맞춰 싸우는 고블린', icon: '👹',
        d: [['offhand', '군용 방패'], ['helm', '지휘관의 투구', 'retired'], ['belt', '군용 허리띠']] },
      { id: 'lizardman', name: '리저드맨', title: '늪에서 기어나온', icon: '🐊',
        d: [['weapon', '뼈 삼지창', 'retired'], ['greaves', '늪지 각반']] },
      { id: 'harpy', name: '하피', title: '노래로 홀리는 것', icon: '🪽',
        d: [['boots', '깃털 신'], ['ring', '홀리는 목소리', 'retired'], ['cloak', '깃털 망토']] },
      { id: 'orcgeneral', name: '오크 장군', title: '천 명을 이끌었던', icon: '🪖', kind: 'elite',
        d: [['shoulder', '장군의 견장'], ['armor', '전장의 판금', 'retired'], ['helm', '뿔 달린 투구']] },
      { id: 'ogre', name: '오우거', title: '나무를 뽑아 휘두르는', icon: '🪨',
        d: [['shoulder', '통나무 어깨받이'], ['greaves', '두꺼운 각반']] },
      { id: 'darkelf', name: '다크 엘프 자객', title: '뒤에서만 나타나는', icon: '🌑',
        d: [['weapon', '독 바른 단검', 'retired'], ['boots', '그림자 신'], ['ring', '암살자의 인장']] },
      { id: 'treant', name: '트렌트', title: '걷는 나무', icon: '🌳',
        d: [['armor', '나무껍질 갑옷', 'retired'], ['offhand', '뿌리 방패'], ['belt', '덩굴 허리띠']] },
      { id: 'forestwitch', name: '숲의 마녀', title: '길 잃은 자만 만나는', icon: '🧙', kind: 'elite',
        d: [['weapon', '뒤틀린 지팡이'], ['necklace', '저주받은 부적', 'retired'], ['ring', '마녀의 고리']] },
      { id: 'gargoyle', name: '가고일', title: '낮에는 돌인 것', icon: '🗿',
        d: [['armor', '석상 갑주', 'retired'], ['helm', '돌 뿔'], ['bracelet', '돌 팔찌']] },
      { id: 'basilisk', name: '바실리스크', title: '눈을 마주치면 끝', icon: '🐍',
        d: [['necklace', '석화의 눈'], ['greaves', '비늘 정강이', 'retired'], ['bracelet', '석화의 팔찌']] },
      { id: 'trollking', name: '트롤 킹', title: '베어도 다시 붙는 자', icon: '🧌', kind: 'boss',
        d: [['weapon', '재생의 곤봉'], ['armor', '트롤가죽 갑주'], ['necklace', '숲의 심장'], ['gloves', '재생하는 손', 'retired'], ['special', '트롤의 심장', 'retired']] }
    ]
  },
  {
    id: 'ruins', rank: 3,
    name: '무너진 왕국',
    flavor: '왕은 없고 왕관만 굴러다닌다.',
    enemies: [
      { id: 'minotaur', name: '미노타우로스', title: '미궁의 주인', icon: '🐂',
        d: [['weapon', '미궁의 전투도끼'], ['helm', '황소 투구', 'retired'], ['belt', '미궁의 허리띠'], ['special', '미궁의 뿔', 'retired']] },
      { id: 'wyvern', name: '와이번', title: '용은 아니지만 하늘을 나는', icon: '🦇',
        d: [['boots', '날개막 신'], ['armor', '와이번 가죽', 'retired'], ['cloak', '와이번 가죽 망토'], ['special', '와이번의 날개막', 'retired']] },
      { id: 'chimera', name: '키메라', title: '셋을 억지로 붙여놓은', icon: '🦁',
        d: [['shoulder', '세 짐승의 어깨'], ['necklace', '뒤섞인 심장']] },
      { id: 'manticore', name: '만티코어', title: '꼬리에 독침이 달린', icon: '🦂',
        d: [['weapon', '독침 채찍', 'retired'], ['ring', '만티코어의 송곳니'], ['cloak', '만티코어 망토']] },
      { id: 'griffinlord', name: '그리핀 로드', title: '하늘의 왕관을 쓴', icon: '🦅', kind: 'elite',
        d: [['boots', '창공의 발톱'], ['armor', '깃털 흉갑'], ['necklace', '왕의 깃털', 'retired']] },
      { id: 'stonegolem', name: '스톤 골렘', title: '명령 하나만 기억하는', icon: '🪆',
        d: [['armor', '화강암 갑주', 'retired'], ['greaves', '돌기둥 각반'], ['belt', '화강암 띠']] },
      { id: 'irongolem', name: '아이언 골렘', title: '녹슬지 않는 병사', icon: '⚒️',
        d: [['offhand', '강철 방패'], ['helm', '무쇠 투구', 'retired'], ['gloves', '무쇠 손']] },
      { id: 'harpyqueen', name: '하피 퀸', title: '노래를 멈추지 않는', icon: '🎶',
        d: [['ring', '여왕의 깃털'], ['boots', '바람 타는 신', 'retired'], ['bracelet', '여왕의 팔찌']] },
      { id: 'hydra', name: '히드라', title: '하나 자르면 둘이 되는', icon: '🐲', kind: 'elite',
        d: [['weapon', '아홉 머리의 이빨'], ['armor', '재생하는 비늘'], ['necklace', '불멸의 독', 'retired']] },
      { id: 'cockatrice', name: '코카트리스', title: '닭처럼 생겼지만', icon: '🐓',
        d: [['greaves', '석화 방지 각반'], ['ring', '볏의 고리', 'retired']] },
      { id: 'darkknight', name: '다크 나이트', title: '투구 안이 비어 있는', icon: '🖤',
        d: [['shoulder', '흑철 견갑'], ['armor', '흑기사 판금', 'retired'], ['helm', '빈 투구']] },
      { id: 'carbuncle', name: '카벙클', title: '무너진 왕국의 홍옥을 이마에 박은', icon: '💎', kind: 'hidden', opens: true,
        d: [['special', '카벙클의 홍옥', 'retired'], ['special', '세공사의 돋보기', 'retired']] },
      { id: 'fallenking', name: '몰락한 왕', title: '아직도 옥좌에 앉아 있는', icon: '🤴', kind: 'boss',
        d: [['weapon', '왕의 세검'], ['helm', '녹슨 왕관'], ['necklace', '무너진 옥새']] }
    ]
  },
  // 짐승이 아니라 사람 꼴이라 첫 공간 옆에 있어도 어색하지 않고, 덩치만 봐도 아직 못 이긴다는 게 보입니다. 거인왕이 5 · 6격으로 가는 고개를 막습니다.
  {
    id: 'giantpass', rank: 4,
    name: '거인의 고개',
    flavor: '첫 들판에서도 저 너머로 머리가 보인다. 고개를 넘었다는 사람은 아직 없다.',
    enemies: [
      { id: 'hillgiant', name: '언덕 거인', title: '바위를 공깃돌 삼는', icon: '🪨',
        d: [['weapon', '뽑아 든 통바위'], ['shoulder', '바위를 지는 어깨받이']] },
      { id: 'cyclops', name: '사이클롭스', title: '눈이 하나뿐인 대장장이', icon: '🔨',
        d: [['helm', '외눈 투구'], ['gloves', '벼락을 벼리던 손']] },
      { id: 'stonegiant', name: '돌 거인', title: '가만히 있으면 바위산인', icon: '🗻', kind: 'elite', set: 'elementGiants',
        d: [['armor', '바위산 갑주']] },
      { id: 'ettin', name: '에틴', title: '머리 둘이 늘 서로 다투는', icon: '🗣️',
        d: [['offhand', '두 머리가 다투는 방패'], ['belt', '둘이 나눠 맨 허리띠']] },
      { id: 'frostgiant', name: '서리 거인', title: '숨만 쉬어도 서리가 내리는', icon: '🥶', kind: 'elite', set: 'elementGiants',
        d: [['greaves', '서리 내린 각반']] },
      { id: 'goliath', name: '골리앗', title: '아직 돌팔매를 맞지 않은', icon: '💪', itemKey: 'goliath2',
        d: [['weapon', '베틀채 같은 창'], ['armor', '청동 비늘 갑옷']] },
      { id: 'yeti', name: '설인', title: '눈보라 속에 발자국만 남기는', icon: '🦍',
        d: [['boots', '큰 발자국 털신'], ['cloak', '눈보라 털가죽']] },
      { id: 'firegiant', name: '불의 거인', title: '용암에 발을 담그고 사는', icon: '🔥', kind: 'elite', set: 'elementGiants',
        d: [['gloves', '용암을 주무르는 손']] },
      { id: 'roc', name: '로크', title: '코끼리를 채 가는 새', icon: '🦅',
        d: [['necklace', '로크의 알 껍데기']] },
      { id: 'cloudgiant', name: '구름 거인', title: '구름 위에 성을 짓는', icon: '☁️', kind: 'elite', set: 'elementGiants',
        d: [['ring', '구름 성의 열쇠고리']] },
      { id: 'mammoth', name: '털매머드', title: '거인들이 짐을 싣고 고개를 넘는', icon: '🦣',
        d: [['greaves', '눈길을 다지는 각반'], ['bracelet', '매머드 털 팔찌']] },
      { id: 'giantking', name: '거인왕', title: '고개를 막고 앉아 아무도 넘기지 않는', icon: '👑', kind: 'boss',
        d: [['weapon', '고개를 막은 대검'], ['helm', '산맥의 왕관'], ['special', '고개의 쐐기돌', { relic: ['block'] }]] }
    ]
  },
  {
    id: 'necropolis', rank: 5,
    name: '시체가 걷는 도시',
    flavor: '여기 사는 것들은 죽는 법을 잊었다.',
    enemies: [
      { id: 'ghoul', name: '구울', title: '무덤을 파헤치는', icon: '🧟‍♂️',
        d: [['gloves', '갈퀴손'], ['greaves', '흙투성이 각반', 'retired'], ['belt', '수의 허리끈']] },
      { id: 'wraith', name: '레이스', title: '만질 수 없는 원한', icon: '👻',
        d: [['cloak', '안개 수의'], ['bracelet', '원한의 고리']] },
      { id: 'vampire', name: '뱀파이어', title: '초대받아야 들어오는', icon: '🧛',
        d: [['weapon', '흡혈 레이피어', 'retired'], ['cloak', '귀족의 망토'], ['necklace', '피의 성배', 'retired'], ['gloves', '귀족의 흰 장갑', 'retired'], ['special', '흡혈귀의 송곳니', { relic: ['lifesteal'] }]] },
      { id: 'whitehorse', name: '흰 말의 기사', title: '이기고 또 이기려는', icon: '🏹', kind: 'elite', set: 'horsemen',
        d: [['helm', '승리의 면류관']] },
      { id: 'banshee', name: '밴시', title: '죽음을 미리 알리는 울음', icon: '😱',
        d: [['helm', '통곡의 두건'], ['bracelet', '예고의 고리'], ['cloak', '통곡의 망토', 'retired']] },
      { id: 'deathknight', name: '데스 나이트', title: '충성만 남은 시체', icon: '⚰️', kind: 'elite',
        d: [['weapon', '서약의 대검'], ['armor', '사자의 판금'], ['helm', '맹세의 투구', 'retired']] },
      { id: 'bonedragon', name: '본 드래곤', title: '살이 없어도 나는', icon: '🦴',
        d: [['armor', '뼈 갑주'], ['boots', '해골 발톱'], ['bracelet', '뼈 팔찌', 'retired']] },
      { id: 'redhorse', name: '붉은 말의 기사', title: '땅에서 평화를 거두는', icon: '🗡️', kind: 'elite', set: 'horsemen',
        d: [['weapon', '평화를 거두는 큰 칼']] },
      { id: 'succubus', name: '서큐버스', title: '꿈으로 들어오는', icon: '💋',
        d: [['ring', '유혹의 반지'], ['necklace', '훔친 꿈'], ['bracelet', '유혹의 팔찌', 'retired']] },
      { id: 'incubus', name: '인큐버스', title: '깨어나면 사라지는', icon: '🩸',
        d: [['shoulder', '악몽의 어깨'], ['boots', '꿈을 걷는 신', 'retired']] },
      { id: 'lich', name: '리치', title: '심장을 항아리에 넣어둔', icon: '📕', kind: 'elite',
        d: [['weapon', '생명을 먹는 지팡이', 'retired'], ['necklace', '성물함'], ['helm', '학자의 관']] },
      { id: 'blackhorse', name: '검은 말의 기사', title: '손에 저울을 든', icon: '⚖️', kind: 'elite', set: 'horsemen',
        d: [['offhand', '기근의 저울']] },
      { id: 'demonlord', name: '데몬 로드', title: '계약서를 들고 오는', icon: '👿',
        d: [['shoulder', '계약의 낙인'], ['armor', '지옥 판금', 'retired'], ['ring', '피로 쓴 서명']] },
      { id: 'balrog', name: '발록', title: '불과 그림자', icon: '🌋',
        d: [['weapon', '불꽃 채찍', 'retired'], ['greaves', '용암 정강이'], ['offhand', '그림자 방패']] },
      { id: 'palehorse', name: '창백한 말의 기사', title: '그 이름은 죽음', icon: '💀', kind: 'elite', set: 'horsemen',
        d: [['cloak', '죽음이 걸친 창백한 망토']] },
      { id: 'ravenking', name: '까마귀 왕', title: '반짝이는 것이면 죽은 자의 것이라도 물어 가는', icon: '🐦', kind: 'hidden', opens: true,
        d: [['special', '까마귀가 물어 온 청옥', { gem: 'defense' }], ['special', '검은 깃 부적', { relic: ['doubleHit'] }]] },
      { id: 'lichking', name: '불사의 왕', title: '죽음을 신하로 부리는', icon: '👑', kind: 'boss',
        d: [['weapon', '서리한'], ['armor', '불사의 판금'], ['necklace', '왕의 성물함', 'retired'], ['gloves', '서리 건틀릿', 'retired'], ['special', '죽지 않는 성물함', { relic: ['survive'] }]] }
    ]
  },
  {
    id: 'abyss', rank: 6,
    name: '마계의 왕좌',
    flavor: '세계를 끝내겠다고 말하는 것들이 여기 모여 있다.',
    enemies: [
      { id: 'archdemon', name: '아크데몬', title: '군단을 거느린 것', icon: '😈',
        d: [['weapon', '심연의 대검'], ['armor', '마계 판금', 'retired'], ['cloak', '군단장의 망토']] },
      { id: 'abysstentacle', name: '심연의 촉수', title: '바닥이 없는 곳에서 올라온', icon: '🦑',
        d: [['shoulder', '끝없는 촉수', 'retired'], ['boots', '바닥 없는 신']] },
      { id: 'sinsloth', name: '칠죄종 · 나태', title: '일어나기 싫은 것', icon: '😴', kind: 'elite', set: 'sins',
        d: [['boots', '끌려가는 신', 'retired'], ['offhand', '졸음의 방패'], ['bracelet', '멈춘 맥박의 고리', 'retired']] },
      { id: 'sinenvy', name: '칠죄종 · 질투', title: '남의 것이 더 좋아 보이는', icon: '💚', kind: 'elite', set: 'sins',
        d: [['gloves', '훔쳐 낀 장갑'], ['cloak', '남의 것을 두른 망토', 'retired'], ['bracelet', '질투의 팔찌', 'retired']] },
      { id: 'elderdragon', name: '고대룡', title: '신화보다 오래된 비늘', icon: '🐲',
        d: [['weapon', '고룡의 송곳니', 'retired'], ['armor', '고룡의 비늘'], ['necklace', '용의 심장', 'retired'], ['gloves', '고룡 발톱 장갑', 'retired'], ['special', '고룡의 심장석', { gem: 'life' }]] },
      { id: 'sinlust', name: '칠죄종 · 색욕', title: '눈을 떼지 못하게 하는', icon: '💋', kind: 'elite', set: 'sins',
        d: [['cloak', '비단 망토'], ['belt', '유혹의 허리띠', 'retired'], ['ring', '맹세를 깨는 고리', 'retired']] },
      { id: 'singluttony', name: '칠죄종 · 폭식', title: '먹어도 허기진 것', icon: '🍖', kind: 'elite', set: 'sins',
        d: [['belt', '부푼 허리띠'], ['gloves', '기름진 손', 'retired'], ['offhand', '바닥 없는 접시', 'retired']] },
      { id: 'sinpride', name: '칠죄종 · 오만', title: '무릎 꿇는 법을 모르는', icon: '🪞', kind: 'elite', set: 'sins',
        d: [['helm', '오만의 관'], ['armor', '굽히지 않는 갑주', 'retired'], ['ring', '자만의 고리', 'retired']] },
      { id: 'sinwrath', name: '칠죄종 · 분노', title: '식지 않는 것', icon: '🔥', kind: 'elite', set: 'sins',
        d: [['shoulder', '분노의 견갑'], ['greaves', '타오르는 각반', 'retired'], ['gloves', '식지 않는 주먹', 'retired']] },
      { id: 'singreed', name: '칠죄종 · 탐욕', title: '가져도 모자란 것', icon: '💰', kind: 'elite', set: 'sins',
        d: [['ring', '탐욕의 반지'], ['necklace', '끝없는 자루', 'retired'], ['belt', '탐욕의 전대', 'retired']] },
      { id: 'demongeneral', name: '마신장', title: '마왕의 왼팔', icon: '⚔️',
        d: [['weapon', '마신의 창', 'retired'], ['armor', '흑요석 판금', 'retired'], ['helm', '마장의 투구'], ['gloves', '마장의 건틀릿']] },
      { id: 'observer', name: '관측자', title: '처음부터 당신을 보고 있던 것', icon: '👁️', kind: 'hidden',
        d: [['weapon', '격을 삼키는 검', 'none']] },
      { id: 'worldworm', name: '세계수를 먹는 벌레', title: '뿌리부터 갉아먹는', icon: '🐛', kind: 'elite',
        d: [['weapon', '갉는 턱', 'retired'], ['armor', '마디 갑각', 'retired'], ['necklace', '세계수의 파편'], ['bracelet', '갉는 팔찌'], ['shoulder', '마디 갑각', 'retired']] },
      { id: 'apocalypsebeast', name: '종말의 짐승', title: '뿔이 일곱 개인', icon: '🐏',
        d: [['helm', '일곱 뿔의 관'], ['greaves', '짓밟는 각반']] },
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
        d: [['weapon', '닳아버린 붓', 'retired'], ['cloak', '이야기꾼의 해진 외투'], ['belt', '천 하룻밤의 띠']] },
      { id: 'scribe', name: '필경사의 화신', title: '베껴 쓰다 눈이 먼', icon: '🪶',
        d: [['offhand', '마르지 않는 뿔병'], ['boots', '필경사의 낡은 샌들', 'retired'], ['gloves', '잉크 물든 장갑']] },
      { id: 'guanyu', name: '관우의 화신', title: '다섯 관문을 지나 천 리를 홀로 간', icon: '🧔', kind: 'elite', set: 'tigers',
        d: [['weapon', '청룡언월도']] },
      { id: 'archimedes', name: '아르키메데스의 화신', title: '지렛대를 든 자', icon: '⚙️',
        d: [['weapon', '움직이지 않는 지렛대', 'retired'], ['ring', '유레카의 원']] },
      { id: 'hypatia', name: '히파티아의 화신', title: '마지막 도서관장', icon: '🔭',
        d: [['offhand', '천구의'], ['necklace', '아스트롤라베', 'retired'], ['bracelet', '천문 팔찌']] },
      { id: 'sunzi', name: '손자의 화신', title: '싸우지 않고 이기는 법', icon: '📜', kind: 'elite',
        d: [['weapon', '병법의 죽간'], ['greaves', '그림자 각반'], ['helm', '허를 찌르는 투구', 'retired']] },
      { id: 'davinci', name: '레오나르도 다 빈치의 화신', title: '다 그리지 못한 설계도', icon: '🎨',
        d: [['offhand', '날개 설계도', 'retired'], ['boots', '비행 장치'], ['greaves', '설계도 각반']] },
      { id: 'zhangfei', name: '장비의 화신', title: '다리 위의 호통 한 번으로 대군을 멈춘', icon: '🍶', kind: 'elite', set: 'tigers',
        d: [['belt', '술 호리병 허리띠']] },
      { id: 'herodotos', name: '헤로도토스의 화신', title: '처음으로 기록한 자', icon: '🗺️',
        d: [['helm', '기록자의 두건'], ['necklace', '역사의 첫 장', 'retired'], ['cloak', '여행자의 망토']] },
      { id: 'joan', name: '잔 다르크의 화신', title: '불타는 오를레앙의 처녀', icon: '⚜️',
        d: [['shoulder', '성녀의 견갑'], ['armor', '오를레앙의 흰 갑주', 'retired'], ['necklace', '재가 되지 않는 심장']] },
      { id: 'zhaoyun', name: '조운의 화신', title: '어린 주군을 품고 대군을 홀로 뚫은', icon: '🛡️', kind: 'elite', set: 'tigers',
        d: [['armor', '아두를 품은 흉갑']] },
      { id: 'spartacus', name: '스파르타쿠스의 화신', title: '사슬을 끊은 검투사', icon: '⛓️', kind: 'elite',
        d: [['weapon', '부러진 글라디우스', 'retired'], ['offhand', '검투사의 방패'], ['bracelet', '끊어진 족쇄']] },
      { id: 'genghis', name: '칭기즈 칸의 화신', title: '지평선을 국경으로 삼은', icon: '🏇',
        d: [['shoulder', '초원의 어깨가리개'], ['boots', '천리마의 등자'], ['ring', '칸의 인장', 'retired']] },
      { id: 'machao', name: '마초의 화신', title: '사자 투구를 쓴 서량의 금마초', icon: '🦁', kind: 'elite', set: 'tigers',
        d: [['helm', '사자 투구']] },
      { id: 'alexander', name: '알렉산드로스의 화신', title: '온 세계가 좁았던 자', icon: '🐎',
        d: [['helm', '정복자의 투구'], ['armor', '마케도니아 흉갑', 'retired'], ['ring', '고르디우스의 매듭', 'retired'], ['cloak', '정복자의 자줏빛 망토', 'retired'], ['special', '칼로 끊은 매듭', { relic: ['pierce'] }]] },
      { id: 'huangzhong', name: '황충의 화신', title: '일흔에도 활을 놓지 않은 노장', icon: '🏹', kind: 'elite', set: 'tigers',
        d: [['ring', '노장의 깍지']] },
      { id: 'trismegistus', name: '헤르메스 트리스메기스투스의 화신', title: '위에서와 같이 아래에서도', icon: '⚗️', kind: 'hidden', opens: true,
        d: [['special', '에메랄드 서판', { relic: ['xpRate'] }], ['special', '현자의 돌', { gem: 'luck' }]] },
      { id: 'yisunsin', name: '이순신의 화신', title: '아직 열두 척이 남았다', icon: '⚓', kind: 'boss',
        d: [['weapon', '쌍룡검'], ['armor', '두정갑'], ['necklace', '난중일기']] }
    ]
  },
  // 서양 RPG의 검 쪽 — 오러를 두른 기사와 원탁. 아서왕이 엑스칼리버를 남깁니다.
  {
    id: 'camelot', rank: 8,
    name: '원탁의 성 카멜롯',
    flavor: '검에 이름을 붙인 자들이 원탁에 모인다. 빈자리 하나는 아직 주인이 없다.',
    enemies: [
      { id: 'auraknight', name: '오러 기사', title: '검 끝에 오러를 세운', icon: '⚔️',
        d: [['gloves', '오러를 쥔 건틀릿'], ['armor', '오러가 밴 흉갑']] },
      { id: 'paladin', name: '성기사', title: '기도로 검을 벼린', icon: '🔆',
        d: [['offhand', '기도문을 새긴 방패'], ['necklace', '축성된 성표']] },
      { id: 'lancelot', name: '랜슬롯의 화신', title: '원탁에서 가장 뛰어났던', icon: '🗡️', kind: 'elite', set: 'roundTable',
        d: [['weapon', '아론다이트']] },
      { id: 'templar', name: '템플 기사', title: '성지를 지키다 이단이 된', icon: '🏰',
        d: [['helm', '붉은 십자 투구'], ['cloak', '흰 성전 망토']] },
      { id: 'dragonknight', name: '용기사', title: '용을 타고 내려오는', icon: '🐉',
        d: [['shoulder', '용비늘 견갑'], ['boots', '하늘을 딛는 용의 등자']] },
      { id: 'gawain', name: '가웨인의 화신', title: '해가 높을수록 세지는', icon: '☀️', kind: 'elite', set: 'roundTable',
        d: [['ring', '정오의 고리']] },
      { id: 'berserker', name: '광전사', title: '곰가죽을 쓰고 고통을 잊은', icon: '🐻',
        d: [['shoulder', '곰가죽 어깨덮개'], ['bracelet', '곰 발톱 팔찌']] },
      { id: 'galahad', name: '갤러해드의 화신', title: '성배에 닿은 단 한 사람', icon: '🏆', kind: 'elite', set: 'roundTable',
        d: [['necklace', '성배의 한 줄기 빛']] },
      { id: 'greenknight', name: '녹색 기사', title: '목을 베여도 제 머리를 주워 드는', icon: '🌿',
        d: [['belt', '초록 허리띠']] },
      { id: 'tristan', name: '트리스탄의 화신', title: '바다 건너 슬픈 사랑을 한', icon: '🎻', kind: 'elite', set: 'roundTable',
        d: [['bracelet', '이졸데의 팔찌']] },
      { id: 'roland', name: '롤랑의 화신', title: '뿔나팔을 너무 늦게 분', icon: '📯',
        d: [['weapon', '뒤랑달'], ['belt', '론세스바예스의 허리띠']] },
      { id: 'percival', name: '퍼시벌의 화신', title: '숲에서 자라 성배를 찾아 나선', icon: '🌲', kind: 'elite', set: 'roundTable',
        d: [['greaves', '숲에서 온 투박한 각반']] },
      { id: 'elcid', name: '엘 시드의 화신', title: '죽어서도 말에 올라 싸운', icon: '🏇',
        d: [['boots', '바비에카를 몬 박차'], ['greaves', '마지막 출정의 각반']] },
      { id: 'bedivere', name: '베디비어의 화신', title: '마지막까지 왕 곁에 남은', icon: '🌊', kind: 'elite', set: 'roundTable',
        d: [['gloves', '검을 호수에 던진 손']] },
      { id: 'robinhood', name: '로빈 후드의 화신', title: '부자의 것을 털어 숲에 숨은 명궁', icon: '🏹',
        d: [['cloak', '링컨 그린 두건'], ['ring', '화살을 가른 깍지']] },
      { id: 'mordred', name: '모드레드의 화신', title: '왕을 찌른 원탁의 마지막 자리', icon: '🩸', kind: 'elite', set: 'roundTable',
        d: [['helm', '배신자의 투구']] },
      { id: 'ladyofthelake', name: '호수의 여인', title: '엑스칼리버를 건네고 다시 받아 간', icon: '🧜‍♀️', kind: 'hidden',
        d: [['special', '아발론의 칼집', { relic: ['regen'] }]] },
      { id: 'arthur', name: '아서왕의 화신', title: '바위에서 검을 뽑은 왕', icon: '👑', kind: 'boss',
        d: [['weapon', '엑스칼리버'], ['armor', '펜드래건의 갑주'], ['offhand', '프리드웬']] }
    ]
  },
  // 서양 RPG의 마법 쪽 — 마나를 다루는 마법사들. 멀린이 아서를 왕으로 세웠으니 기사보다 위입니다.
  {
    id: 'avalon', rank: 9,
    name: '안개 너머의 아발론',
    flavor: '안개 너머의 사과 섬. 마나가 짙어 숨만 쉬어도 주문이 된다.',
    enemies: [
      { id: 'archmage', name: '대마법사', title: '마나로 별을 떨어뜨리는', icon: '☄️',
        d: [['weapon', '별을 부르는 지팡이'], ['helm', '마나가 고인 고깔모자']] },
      { id: 'elementalist', name: '원소술사', title: '불과 얼음을 한 손에 쥔', icon: '🪄',
        d: [['gloves', '네 원소를 쥔 손'], ['bracelet', '불과 얼음의 팔찌']] },
      { id: 'salamander', name: '샐러맨더', title: '불 속에서만 사는', icon: '🦎', kind: 'elite', set: 'elementals', itemKey: 'salamander2',
        d: [['gloves', '화염 손']] },
      { id: 'summoner', name: '소환술사', title: '이름을 불러 다른 세계의 것을 끌어오는', icon: '🌌',
        d: [['offhand', '이름을 적은 마도서'], ['ring', '계약의 인장']] },
      { id: 'runemage', name: '룬 마법사', title: '돌에 새긴 글자로 싸우는', icon: '💠',
        d: [['shoulder', '룬을 새긴 견갑'], ['necklace', '룬 뼈 목걸이']] },
      { id: 'undine', name: '운디네', title: '사랑을 잃으면 물로 돌아가는', icon: '💧', kind: 'elite', set: 'elementals',
        d: [['necklace', '사랑을 잃은 물방울']] },
      { id: 'alchemist', name: '연금술사', title: '납을 금으로 바꾸려다 자신을 바꾼', icon: '⚗️',
        d: [['armor', '얼룩진 연금 앞치마'], ['belt', '약병을 꽂은 허리띠']] },
      { id: 'druid', name: '드루이드', title: '떡갈나무에게 말을 거는', icon: '🍃',
        d: [['cloak', '겨우살이 두건'], ['greaves', '떡갈나무 껍질 각반']] },
      { id: 'faust', name: '파우스트의 화신', title: '악마에게 영혼을 걸고 모든 것을 안', icon: '📚', kind: 'elite',
        d: [['cloak', '박사의 검은 가운'], ['bracelet', '되찾은 젊음의 팔찌']] },
      { id: 'sylph', name: '실프', title: '만질 수 없는 것', icon: '💨', kind: 'elite', set: 'elementals', itemKey: 'sylph2',
        d: [['boots', '바람의 신']] },
      { id: 'warlock', name: '흑마법사', title: '금지된 책을 끝까지 읽은', icon: '🌘',
        d: [['offhand', '끝까지 읽은 금지된 책'], ['armor', '그림자 로브']] },
      { id: 'babayaga', name: '바바 야가의 화신', title: '닭다리 오두막에 사는 숲의 마녀', icon: '🛖',
        d: [['weapon', '절구공이'], ['belt', '해골 등불 허리띠']] },
      { id: 'gnome', name: '노움', title: '땅속을 헤엄치듯 다니는', icon: '⛏️', kind: 'elite', set: 'elementals',
        d: [['greaves', '땅속을 걷는 각반']] },
      { id: 'circe', name: '키르케의 화신', title: '사람을 돼지로 바꾸는 섬의 마녀', icon: '🐖',
        d: [['shoulder', '베틀에서 짠 숄']] },
      { id: 'morgan', name: '모르간 르 페이의 화신', title: '아발론을 다스리는 마녀', icon: '🍎', kind: 'elite',
        d: [['cloak', '아발론의 안개 망토'], ['ring', '요정 여왕의 반지']] },
      { id: 'merlin', name: '멀린의 화신', title: '왕을 만든 마법사', icon: '🧙', kind: 'boss',
        d: [['weapon', '꿈을 꾸는 지팡이'], ['helm', '은자의 두건'], ['necklace', '탑에 갇힌 수정']] }
    ]
  },
  {
    id: 'murim', rank: 10,
    name: '천하제일 비무대',
    flavor: '강호에 이름 석 자를 남기려는 자들이 오른다. 걸어서 내려간 자는 손에 꼽는다.',
    enemies: [
      { id: 'nangin', name: '흑도 낭인', title: '값만 맞으면 누구든 벤다', icon: '🗡️', itemKey: 'nangin2',
        d: [['boots', '떠돌이 짚신']] },
      { id: 'gaebang', name: '개방 장로', title: '천하의 소문은 거지가 먼저 안다', icon: '🥢', itemKey: 'gaebang2',
        d: [['belt', '아홉 매듭 띠'], ['offhand', '동냥 바가지']] },
      { id: 'namgung', name: '남궁세가 가주', title: '창공을 가르는 세가의 검', icon: '🏯', kind: 'elite', set: 'clans', itemKey: 'namgung2',
        d: [['necklace', '세가의 옥패']] },
      { id: 'emei', name: '아미파 사태', title: '자비로운 얼굴, 자비 없는 비수', icon: '📿', itemKey: 'emei2',
        d: [['ring', '아미자'], ['bracelet', '백팔 염주']] },
      { id: 'shaolin', name: '소림 나한', title: '쇠를 두드려 몸을 만든', icon: '🙏', itemKey: 'shaolin2',
        d: [['gloves', '금강 권갑'], ['armor', '철포삼']] },
      { id: 'tangga', name: '사천당가 독수', title: '손끝마다 다른 독', icon: '🧪', kind: 'elite', set: 'clans', itemKey: 'tangga2',
        d: [['shoulder', '암기 견대']] },
      { id: 'dalma', name: '달마의 화신', title: '벽을 보고 아홉 해', icon: '🧘', kind: 'elite', itemKey: 'dalma2',
        d: [['offhand', '세수경'], ['necklace', '면벽의 염주']] },
      { id: 'wudang', name: '무당 도사', title: '부드러움이 굳셈을 이긴다', icon: '☯️', itemKey: 'wudang2',
        d: [['weapon', '송문고검'], ['cloak', '태극 도포']] },
      { id: 'moyong', name: '모용세가 공자', title: '받은 수를 그대로 돌려주는', icon: '🪞', kind: 'elite', set: 'clans',
        d: [['gloves', '되돌리는 손']] },
      { id: 'hwasan', name: '화산파 매화검수', title: '검 끝에 매화가 핀다', icon: '🌸', itemKey: 'hwasan2',
        d: [['helm', '매화 두건'], ['boots', '암향 신']] },
      { id: 'jegal', name: '제갈세가 군사', title: '진법과 기관으로 싸우는', icon: '🪭', kind: 'elite', set: 'clans',
        d: [['offhand', '백우선']] },
      { id: 'zhangsanfeng', name: '장삼봉의 화신', title: '태극을 처음 그린 자', icon: '⛰️', kind: 'elite', itemKey: 'zhangsanfeng2',
        d: [['bracelet', '태극 팔찌'], ['greaves', '구름 위를 걷는 각반']] },
      { id: 'bukhae', name: '북해빙궁 무사', title: '얼음 궁에서 내려온', icon: '🧊', itemKey: 'bukhae2',
        d: [['armor', '한빙 갑의'], ['helm', '서리 투구']] },
      { id: 'paeng', name: '하북팽가 도객', title: '도 한 자루로 하북을 지킨', icon: '🔪', kind: 'elite', set: 'clans',
        d: [['weapon', '팽가의 대도']] },
      { id: 'cheonma', name: '천마', title: '하늘 아래 마(魔)는 하나뿐', icon: '🌑', kind: 'boss', itemKey: 'cheonma2',
        d: [['weapon', '천마검'], ['armor', '천마흑포'], ['special', '천마의 비급', { relic: ['critRate'] }]] }
    ]
  },
  {
    id: 'yeongmul', rank: 11,
    name: '만년설 덮인 천산',
    flavor: '무림인이 평생을 걸고 찾는 내단의 주인들이 산다. 대개는 찾는 쪽이 먹힌다.',
    enemies: [
      { id: 'yeongsa', name: '백년 영사', title: '내단을 품고 똬리를 튼', icon: '🐍', itemKey: 'yeongsa2',
        d: [['necklace', '영사의 내단'], ['boots', '허물 벗은 신']] },
      { id: 'geumjam', name: '금잠고', title: '독충을 다 잡아먹고 남은 하나', icon: '🐛', itemKey: 'geumjam2',
        d: [['ring', '금잠 반지'], ['gloves', '금사 장갑']] },
      { id: 'azuredragon', name: '청룡', title: '동쪽 하늘을 지키는 푸른 용', icon: '🐲', kind: 'elite', set: 'fourSymbols',
        d: [['belt', '청룡의 비늘 허리띠']] },
      { id: 'geumseom', name: '세 발 금두꺼비', title: '물고 있던 동전을 뱉으면 복이 온다', icon: '🐸', itemKey: 'geumseom2',
        d: [['bracelet', '금섬 팔찌'], ['offhand', '금전표']] },
      { id: 'sansam', name: '천년 산삼 동자', title: '사람 꼴을 하고 산을 뛰어다니는 뿌리', icon: '🌱', itemKey: 'sansam2',
        d: [['belt', '산삼 뿌리 띠'], ['bracelet', '천년 삼 팔찌']] },
      { id: 'gumiho', name: '구미호', title: '천 년을 채우면 사람이 된다', icon: '🦊', kind: 'elite', itemKey: 'gumiho2',
        d: [['necklace', '여우 구슬'], ['cloak', '아홉 꼬리 목도리']] },
      { id: 'bingjam', name: '빙잠', title: '만년설 속에서 실을 토하는 누에', icon: '🪱', itemKey: 'bingjam2',
        d: [['armor', '천잠보의'], ['cloak', '빙잠사 망토']] },
      { id: 'whitetiger', name: '백호', title: '서쪽 하늘을 지키는 흰 범', icon: '🐯', kind: 'elite', set: 'fourSymbols',
        d: [['gloves', '흰 범의 발톱']] },
      { id: 'ungnyeo', name: '웅녀', title: '쑥과 마늘로 백 일을 버틴 곰', icon: '🐻', itemKey: 'ungnyeo2',
        d: [['helm', '쑥 화관'], ['greaves', '곰 발 각반']] },
      { id: 'sangun', name: '산군', title: '감히 이름으로 부르지 못하는 호랑이', icon: '🐅', itemKey: 'sangun2',
        d: [['shoulder', '산군의 어깨']] },
      { id: 'vermilionbird', name: '주작', title: '남쪽 하늘을 지키는 붉은 새', icon: '🪶', kind: 'elite', set: 'fourSymbols',
        d: [['ring', '주작의 불씨 반지']] },
      { id: 'geumsijo', name: '금시조', title: '용을 잡아먹는 금빛 날개', icon: '🦚', kind: 'elite', itemKey: 'geumsijo2',
        d: [['weapon', '용을 찢는 발톱'], ['shoulder', '금빛 깃 견갑']] },
      { id: 'hwarin', name: '화린', title: '불을 밟고 다니는 기린', icon: '🦌', itemKey: 'hwarin2',
        d: [['weapon', '화린 뿔창'], ['boots', '불을 밟는 신']] },
      { id: 'blacktortoise', name: '현무', title: '북쪽 하늘을 지키는 거북과 뱀', icon: '🐢', kind: 'elite', set: 'fourSymbols',
        d: [['greaves', '뱀이 감긴 각반']] },
      { id: 'yeonggu', name: '금강영구', title: '만 년을 등에 지고 걷는 거북', icon: '🐢', itemKey: 'yeonggu2',
        d: [['offhand', '만년 귀갑'], ['helm', '거북 등 투구']] },
      { id: 'bonghwang', name: '봉황', title: '태평한 세상에만 내려앉는 새', icon: '🎋', kind: 'hidden', opens: true, itemKey: 'bonghwang2',
        d: [['special', '봉황의 비취', { gem: 'dex' }], ['special', '태평의 깃', { relic: ['findRate'] }]] },
      { id: 'imugi', name: '이무기', title: '천 년을 기다려 하늘로 오르려는', icon: '🐉', kind: 'boss', itemKey: 'imugi2',
        d: [['weapon', '승천하지 못한 뿔'], ['armor', '역린 갑주'], ['special', '이무기의 여의주', { gem: 'luck' }]] }
    ]
  },
  // 옛 4격 — 첫 공간 옆에 있기엔 신화의 짐승이라 영웅 바로 아래로 옮겼습니다. 헤라클레스(13격 보스)가 열두 과업에서 꺾은 짐승들이 모여 있습니다.
  {
    id: 'sanctuary', rank: 12,
    name: '잊혀진 성역',
    flavor: '신화에 이름이 실린 짐승들이 여기 숨어 있다.',
    enemies: [
      { id: 'unicorn', name: '유니콘', title: '순수한 자에게만 보이는', icon: '🦄', itemKey: 'unicorn2',
        d: [['weapon', '일각수의 뿔'], ['bracelet', '정화의 팔찌']] },
      { id: 'nemeanlion', name: '네메아의 사자', title: '어떤 칼도 들지 않는 가죽', icon: '🦁', kind: 'elite', set: 'labors',
        d: [['shoulder', '칼이 들지 않는 갈기']] },
      { id: 'pegasus', name: '페가수스', title: '땅을 딛지 않는 말', icon: '🐴', itemKey: 'pegasus2',
        d: [['boots', '구름을 딛는 편자'], ['bracelet', '날개의 고리']] },
      { id: 'ceryneianhind', name: '케리네이아의 사슴', title: '황금 뿔에 청동 발굽을 단', icon: '🦌', kind: 'elite', set: 'labors',
        d: [['boots', '청동 발굽']] },
      { id: 'sphinx', name: '스핑크스', title: '답하지 못하면 잡아먹는', icon: '🐈‍⬛', kind: 'elite', itemKey: 'sphinx2',
        d: [['necklace', '풀리지 않는 수수께끼'], ['helm', '사자의 관']] },
      { id: 'erymanthianboar', name: '에리만토스의 멧돼지', title: '산을 갈아엎고 내려온', icon: '🐗', kind: 'elite', set: 'labors',
        d: [['greaves', '멧돼지 엄니 각반']] },
      { id: 'phoenix', name: '피닉스', title: '타 죽어야 사는 새', icon: '🔥', itemKey: 'phoenix2',
        d: [['cloak', '재에서 난 깃옷'], ['special', '다시 타오르는 잿불', { relic: ['regen'] }]] },
      { id: 'stymphalianbirds', name: '스팀팔로스의 새', title: '청동 깃을 화살처럼 쏘는', icon: '🐦', kind: 'elite', set: 'labors',
        d: [['ring', '청동 깃 반지']] },
      { id: 'cretanbull', name: '크레타의 황소', title: '바다에서 올라와 섬을 짓밟은', icon: '🐂', kind: 'elite', set: 'labors',
        d: [['offhand', '황소 뿔 방패']] },
      { id: 'hippogriff', name: '히포그리프', title: '그리핀이 암말을 사랑해서 난', icon: '🐎',
        d: [['gloves', '그리핀의 앞발']] },
      { id: 'kraken', name: '크라켄', title: '배를 통째로 끌고 내려가는', icon: '🦑', kind: 'elite', itemKey: 'kraken2',
        d: [['shoulder', '거대 촉수'], ['armor', '흡반 갑피']] },
      { id: 'mares', name: '디오메데스의 말', title: '사람을 먹고 자란', icon: '🐴', kind: 'elite', set: 'labors',
        d: [['belt', '쇠사슬 고삐']] },
      { id: 'geryon', name: '게리온', title: '몸 셋이 한 허리에 붙은 거인', icon: '🐄', kind: 'elite', set: 'labors',
        d: [['armor', '세 몸을 두른 갑주']] },
      { id: 'cerberus', name: '케르베로스', title: '문을 지키는 세 머리', icon: '🐕', kind: 'elite', set: 'labors', itemKey: 'cerberus2',
        d: [['helm', '세 머리의 투구']] },
      { id: 'ladon', name: '라돈', title: '황금 사과나무를 감고 잠들지 않는', icon: '🐍', kind: 'elite', set: 'labors',
        d: [['necklace', '라돈의 비늘 목걸이']] },
      { id: 'sanctdragon', name: '성역의 수호룡', title: '천 년을 한 자리에서', icon: '🐉', kind: 'boss', itemKey: 'sanctdragon2',
        d: [['weapon', '용의 송곳니 검'], ['armor', '고룡 비늘 갑주'], ['special', '성역의 수호석', { relic: ['block'] }]] }
    ]
  },
  {
    id: 'rank2', rank: 13,
    name: '엘리시온 평원',
    flavor: '죽어서도 영웅인 자들만 이 들판을 걷는다.',
    enemies: [
      { id: 'theseus', name: '테세우스의 화신', title: '돌아오는 길을 아는', icon: '🧵', itemKey: 'theseus2',
        d: [['necklace', '아리아드네의 실타래'], ['belt', '미궁의 실 허리띠']] },
      { id: 'perseus', name: '페르세우스의 화신', title: '보지 않고 벤 자', icon: '🪞', itemKey: 'perseus2',
        d: [['offhand', '거울 방패'], ['cloak', '보이지 않는 망토']] },
      { id: 'odysseus', name: '오디세우스의 화신', title: '열 해를 헤매고도 돌아간', icon: '⛵', itemKey: 'odysseus2',
        d: [['gloves', '열두 도끼를 꿰뚫은 손']] },
      { id: 'atalanta', name: '아탈란테의 화신', title: '누구보다 빨랐던', icon: '🏹', itemKey: 'atalanta2',
        d: [['boots', '멈추지 않는 발'], ['ring', '황금 사과']] },
      { id: 'enkidu', name: '엔키두의 화신', title: '흙으로 빚어진 벗', icon: '🌿', itemKey: 'enkidu2',
        d: [['armor', '들짐승의 가죽'], ['greaves', '야생의 각반']] },
      { id: 'gilgamesh', name: '길가메시의 화신', title: '영생을 놓친 왕', icon: '🗿', kind: 'elite', itemKey: 'gilgamesh2',
        d: [['shoulder', '하늘 황소의 어깨'], ['helm', '우루크의 왕관']] },
      { id: 'hector', name: '헥토르의 화신', title: '질 것을 알고도 나선', icon: '🏛️', itemKey: 'hector2',
        d: [['offhand', '트로이의 방패'], ['helm', '빛나는 투구']] },
      { id: 'achilles', name: '아킬레우스의 화신', title: '발뒤꿈치 하나만 사람인', icon: '🛡️', itemKey: 'achilles2',
        d: [['armor', '불멸의 청동 갑주'], ['boots', '테티스가 잡았던 발목']] },
      { id: 'cuchulainn', name: '쿠 훌린의 화신', title: '빛의 아이', icon: '🔱', itemKey: 'cuchulainn2',
        d: [['greaves', '뒤틀림의 각반'], ['bracelet', '뒤틀림의 팔찌']] },
      { id: 'beowulf', name: '베오울프의 화신', title: '맨손으로 괴물을 찢은', icon: '🐻', kind: 'elite', itemKey: 'beowulf2',
        d: [['gloves', '그렌델의 팔'], ['bracelet', '흐룬팅의 고리']] },
      { id: 'arjuna', name: '아르주나의 화신', title: '과녁의 눈만 보이는', icon: '🎯', itemKey: 'arjuna2',
        d: [['weapon', '간디바'], ['cloak', '전차병의 망토']] },
      { id: 'siegfried', name: '지그프리트의 화신', title: '용의 피를 뒤집어쓴 자', icon: '🗡️', itemKey: 'siegfried2',
        d: [['weapon', '마검 그람'], ['special', '파프니르의 피', { gem: 'life' }]] },
      { id: 'heracles', name: '헤라클레스의 화신', title: '열두 번 죽고 열두 번 돌아온', icon: '🦁', kind: 'boss', itemKey: 'heracles2',
        d: [['weapon', '올리브 몽둥이'], ['armor', '네메아 사자의 가죽'], ['special', '네메아를 꺾은 주먹', { relic: ['harmTouch'] }]] }
    ]
  },
  {
    id: 'heaven', rank: 14,
    name: '일곱 번째 하늘',
    flavor: '노래가 한 번도 멈춘 적 없는 곳. 아홉 겹의 성가대가 문을 지킨다.',
    enemies: [
      { id: 'guardianangel', name: '수호천사', title: '한 사람 곁에 하나씩', icon: '😇', itemKey: 'guardianangel2',
        d: [['cloak', '깃털 한 장의 망토'], ['ring', '지켜보는 반지']] },
      { id: 'principality', name: '권천사', title: '나라 하나를 맡은', icon: '🛐', itemKey: 'principality2',
        d: [['helm', '나라를 맡은 관'], ['belt', '홀을 찬 띠']] },
      { id: 'raphael', name: '라파엘의 화신', title: '신이 고치신다', icon: '⚕️', kind: 'elite', set: 'archangels', itemKey: 'raphael2',
        d: [['necklace', '토비트의 물고기']] },
      { id: 'powerangel', name: '능천사', title: '악을 쫓는 첫 번째 칼', icon: '🔆', itemKey: 'powerangel2',
        d: [['weapon', '악을 쫓는 창'], ['shoulder', '능천사의 견갑']] },
      { id: 'trumpetangel', name: '나팔의 천사', title: '일곱 나팔 중 첫째를 부는', icon: '🎺', itemKey: 'trumpetangel2',
        d: [['offhand', '첫째 나팔'], ['boots', '구름 디딤 신']] },
      { id: 'uriel', name: '우리엘의 화신', title: '신의 불꽃이라는 이름의', icon: '🔥', kind: 'elite', set: 'archangels',
        d: [['gloves', '불꽃을 쥔 손']] },
      { id: 'virtueangel', name: '역천사', title: '기적을 맡은', icon: '✨', itemKey: 'virtueangel2',
        d: [['bracelet', '기적의 팔찌'], ['gloves', '기적을 행하는 손']] },
      { id: 'dominion', name: '주천사', title: '천사들을 다스리는 천사', icon: '🕊️', itemKey: 'dominion2',
        d: [['armor', '다스림의 흉갑'], ['necklace', '주권의 목걸이']] },
      { id: 'raguel', name: '라구엘의 화신', title: '천사들의 잘못을 따지는', icon: '⚖️', kind: 'elite', set: 'archangels',
        d: [['bracelet', '빛을 다스리는 팔찌']] },
      { id: 'throneangel', name: '좌천사', title: '눈으로 가득한 바퀴', icon: '🛞', itemKey: 'throneangel2',
        d: [['greaves', '바퀴 속의 바퀴'], ['helm', '눈으로 가득한 관']] },
      { id: 'gabriel', name: '가브리엘의 화신', title: '소식을 전하러 내려온', icon: '📯', kind: 'elite', set: 'archangels', itemKey: 'gabriel2',
        d: [['offhand', '마지막 나팔']] },
      { id: 'cherub', name: '지품천사', title: '에덴의 동쪽에서 불칼을 든', icon: '🦁', itemKey: 'cherub2',
        d: [['weapon', '두루 도는 불칼'], ['shoulder', '네 얼굴의 견갑']] },
      { id: 'sariel', name: '사리엘의 화신', title: '달의 길을 가르친', icon: '🌗', kind: 'elite', set: 'archangels',
        d: [['boots', '달의 길을 걷는 신']] },
      { id: 'seraph', name: '치품천사', title: '여섯 날개로 얼굴을 가린', icon: '🌞', itemKey: 'seraph2',
        d: [['cloak', '여섯 날개']] },
      { id: 'remiel', name: '레미엘의 화신', title: '다시 일어날 자들을 지키는', icon: '🌄', kind: 'elite', set: 'archangels',
        d: [['greaves', '일으켜 세우는 각반']] },
      { id: 'michael', name: '미카엘의 화신', title: '용을 하늘에서 떨어뜨린', icon: '⚖️', kind: 'boss', itemKey: 'michael2',
        d: [['weapon', '용을 떨어뜨린 검'], ['armor', '천군의 갑주'], ['special', '미카엘의 저울', { relic: ['reflect'] }]] }
    ]
  },
  {
    id: 'hell', rank: 15,
    name: '얼어붙은 코키토스',
    flavor: '지옥의 맨 밑바닥은 불이 아니라 얼음이다. 등을 돌린 자들이 거기 얼어 있다.',
    enemies: [
      { id: 'legion', name: '레기온', title: '우리의 이름은 군대, 우리는 많다', icon: '👥', itemKey: 'legion2',
        d: [['armor', '이천 마리 돼지가죽'], ['ring', '많은 이름의 반지']] },
      { id: 'bael', name: '바엘의 화신', title: '세 머리로 말하는 지옥의 첫 왕', icon: '🐸', kind: 'elite', set: 'goetiaKings',
        d: [['gloves', '보이지 않게 하는 손']] },
      { id: 'moloch', name: '몰록의 화신', title: '불타는 제단 위의 황소', icon: '🐂', itemKey: 'moloch2',
        d: [['helm', '황소 머리 투구'], ['gloves', '제단 불에 그을린 손']] },
      { id: 'baphomet', name: '바포메트의 화신', title: '녹이고 굳히는 염소 머리 우상', icon: '🐐', itemKey: 'baphomet2',
        d: [['offhand', '염소 머리 우상'], ['bracelet', '녹이고 굳히는 팔찌']] },
      { id: 'asmodeus', name: '아스모데우스의 화신', title: '솔로몬의 반지를 빼앗은', icon: '💍', kind: 'elite', set: 'goetiaKings', itemKey: 'asmodeus2',
        d: [['ring', '솔로몬의 반지']] },
      { id: 'azazel', name: '아자젤의 화신', title: '사람에게 칼 벼리는 법을 가르친', icon: '⚒️', itemKey: 'azazel2',
        d: [['weapon', '처음 벼린 칼'], ['shoulder', '감시자의 견갑']] },
      { id: 'beleth', name: '벨레트의 화신', title: '나팔 소리 속에 창백한 말을 타고 오는', icon: '🎺', kind: 'elite', set: 'goetiaKings',
        d: [['boots', '창백한 말의 박차']] },
      { id: 'beelzebub', name: '벨제부브의 화신', title: '파리 떼의 왕', icon: '🪰', kind: 'elite', itemKey: 'beelzebub2',
        d: [['helm', '파리 떼의 관'], ['armor', '파리 날개 갑의']] },
      { id: 'mephisto', name: '메피스토펠레스의 화신', title: '영혼을 값으로 쳐주는 상인', icon: '🎩', itemKey: 'mephisto2',
        d: [['necklace', '피로 쓴 계약서'], ['cloak', '진홍 외투']] },
      { id: 'paimon', name: '파이몬의 화신', title: '서쪽을 다스리는 지옥의 왕', icon: '🐪', kind: 'elite', set: 'goetiaKings', itemKey: 'paimon2',
        d: [['offhand', '모든 학문의 책']] },
      { id: 'astaroth', name: '아스타로트의 화신', title: '독사를 타고 오는 공작', icon: '🦎', itemKey: 'astaroth2',
        d: [['boots', '독사를 탄 신'], ['belt', '독사 허리띠']] },
      { id: 'purson', name: '푸르손의 화신', title: '사자 얼굴로 곰을 타고 오는', icon: '🐻', kind: 'elite', set: 'goetiaKings',
        d: [['shoulder', '곰을 탄 왕의 견갑']] },
      { id: 'belial', name: '벨리알의 화신', title: '불의 전차를 탄 무가치한 자', icon: '🕯️', kind: 'elite', set: 'goetiaKings', itemKey: 'belial2',
        d: [['greaves', '불의 전차 각반']] },
      { id: 'lilith', name: '릴리스의 화신', title: '에덴을 먼저 떠난 자', icon: '🌒', itemKey: 'lilith2',
        d: [['bracelet', '첫 아내의 팔찌']] },
      { id: 'vine', name: '바인의 화신', title: '폭풍을 부르고 탑을 허무는', icon: '🌩️', kind: 'elite', set: 'goetiaKings',
        d: [['greaves', '탑을 허무는 각반']] },
      { id: 'balam', name: '발람의 화신', title: '세 머리로 지나간 일과 올 일을 말하는', icon: '🐃', kind: 'elite', set: 'goetiaKings',
        d: [['necklace', '앞일을 말하는 목걸이']] },
      { id: 'zagan', name: '자간의 화신', title: '쇠를 금화로, 물을 포도주로 바꾸는', icon: '🍷', kind: 'elite', set: 'goetiaKings',
        d: [['belt', '쇠를 금화로 바꾸는 띠']] },
      { id: 'lucifer', name: '루시퍼의 화신', title: '가장 빛나던 별, 가장 깊이 떨어진', icon: '🌠', kind: 'boss', itemKey: 'lucifer2',
        d: [['weapon', '새벽별의 검'], ['cloak', '빛을 잃은 여섯 날개'], ['special', '새벽별 조각', { relic: ['critRate'] }]] }
    ]
  },
  {
    id: 'rank3', rank: 16,
    name: '이그드라실의 가지',
    flavor: '아홉 세계가 이 나무 하나에 매달려 있다. 어느 신화든 여기서 만난다.',
    enemies: [
      { id: 'bastet', name: '바스테트의 화신', title: '집과 전쟁을 함께 지키는', icon: '🐈', itemKey: 'bastet2',
        d: [['ring', '고양이의 눈'], ['greaves', '소리 없는 각반']] },
      { id: 'hera', name: '헤라의 화신', title: '신들의 여왕', icon: '👸', kind: 'elite', set: 'olympians',
        d: [['shoulder', '공작 깃 견갑']] },
      { id: 'anubis', name: '아누비스의 화신', title: '심장의 무게를 재는 자', icon: '🐺', itemKey: 'anubis2',
        d: [['shoulder', '방부사의 어깨띠'], ['helm', '재칼의 가면']] },
      { id: 'hermes', name: '헤르메스의 화신', title: '경계를 넘나드는 전령', icon: '🪽', kind: 'elite', set: 'olympians', itemKey: 'hermes2',
        d: [['special', '전령의 날개', { relic: ['doubleTurn'] }]] },
      { id: 'susanoo', name: '스사노오의 화신', title: '쫓겨나서 영웅이 된', icon: '🌪️', itemKey: 'susanoo2',
        d: [['cloak', '폭풍의 겉옷'], ['bracelet', '폭풍 팔찌']] },
      { id: 'athena', name: '아테나의 화신', title: '지혜와 싸움을 함께 쥔', icon: '🦉', kind: 'elite', set: 'olympians',
        d: [['offhand', '고르곤의 머리를 단 방패']] },
      { id: 'poseidon', name: '포세이돈의 화신', title: '땅을 흔드는 자', icon: '🌊', kind: 'elite', set: 'olympians', itemKey: 'poseidon2',
        d: [['weapon', '삼지창']] },
      { id: 'apollo', name: '아폴론의 화신', title: '빛과 음악과 활의 신', icon: '🎼', kind: 'elite', set: 'olympians',
        d: [['gloves', '리라를 켜는 손']] },
      { id: 'thor', name: '토르의 화신', title: '천둥을 손에 쥔 자', icon: '⚡', itemKey: 'thor2',
        d: [['weapon', '묠니르'], ['special', '메긴교르드의 고리', { gem: 'damage' }]] },
      { id: 'artemis', name: '아르테미스의 화신', title: '달과 사냥의 주인', icon: '🌙', kind: 'elite', set: 'olympians', itemKey: 'artemis2',
        d: [['boots', '사슴가죽 신']] },
      { id: 'aphrodite', name: '아프로디테의 화신', title: '바다 거품에서 태어난', icon: '🐚', kind: 'elite', set: 'olympians',
        d: [['belt', '케스토스']] },
      { id: 'amaterasu', name: '아마테라스의 화신', title: '동굴에서 나온 해', icon: '🌅', itemKey: 'amaterasu2',
        d: [['cloak', '하늘 옷'], ['ring', '야사카니의 곡옥']] },
      { id: 'loki', name: '로키의 화신', title: '묶여서도 웃는 자', icon: '🦊', kind: 'elite', itemKey: 'loki2',
        d: [['offhand', '거짓의 단검'], ['bracelet', '뒤바뀐 반지']] },
      { id: 'hephaestus', name: '헤파이스토스의 화신', title: '올림포스의 대장장이', icon: '⚒️', kind: 'elite', set: 'olympians',
        d: [['gloves', '불에 그을린 대장장이 손']] },
      { id: 'ares', name: '아레스의 화신', title: '전쟁 그 자체', icon: '⚔️', kind: 'elite', set: 'olympians', itemKey: 'ares2',
        d: [['armor', '전화(戰禍)의 갑주']] },
      { id: 'isis', name: '이시스의 화신', title: '흩어진 것을 다시 모으는', icon: '🪬', itemKey: 'isis2',
        d: [['necklace', '앙크']] },
      { id: 'demeter', name: '데메테르의 화신', title: '곡식과 대지의 어머니', icon: '🌾', kind: 'elite', set: 'olympians',
        d: [['greaves', '보리 이삭을 엮은 각반']] },
      { id: 'dionysus', name: '디오니소스의 화신', title: '포도주와 광기의 신', icon: '🍇', kind: 'elite', set: 'olympians',
        d: [['armor', '표범 가죽 옷']] },
      { id: 'hades', name: '하데스의 화신', title: '돌아온 자가 없는 문의 주인', icon: '💀', kind: 'boss', itemKey: 'hades2',
        d: [['weapon', '명계의 이지창'], ['helm', '보이지 않게 하는 투구'], ['necklace', '케르베로스의 사슬']] }
    ]
  },
  // 신들의 왕은 대개 이것들을 꺾고 왕이 됐습니다 — 그래서 주신(18격) 바로 아래입니다.
  {
    id: 'primordial', rank: 17,
    name: '태초의 바다',
    flavor: '신들이 처음으로 칼을 뽑은 곳. 여기서 진 것들의 몸으로 땅과 하늘이 지어졌다.',
    enemies: [
      { id: 'titanmyth', name: '타이탄', title: '신에게 진 자들', icon: '🗿', itemKey: 'titanmyth2',
        d: [['offhand', '산을 깎은 방패'], ['greaves', '거인의 각반']] },
      { id: 'behemoth', name: '베히모스', title: '땅을 통째로 눌러앉은', icon: '🦏', kind: 'elite', set: 'primordialBeasts', itemKey: 'behemoth2',
        d: [['greaves', '대지의 각반']] },
      { id: 'jormungandr', name: '요르문간드', title: '세계를 한 바퀴 감고 제 꼬리를 문', icon: '🐍',
        d: [['belt', '세계를 감은 비늘 띠'], ['ring', '제 꼬리를 문 고리']] },
      { id: 'fenrir', name: '펜리르', title: '끊어지지 않는 끈에 묶여 때를 기다리는', icon: '🐺',
        d: [['weapon', '신을 삼킬 송곳니'], ['bracelet', '글레이프니르 족쇄']] },
      { id: 'leviathan', name: '리바이어던', title: '바다를 통째로 삼킨', icon: '🐋', kind: 'elite', set: 'primordialBeasts', itemKey: 'leviathan2',
        d: [['shoulder', '해일의 지느러미']] },
      { id: 'apophis', name: '아포피스', title: '밤마다 해를 삼키려는 뱀', icon: '🌑',
        d: [['cloak', '해를 가리는 비늘 망토'], ['helm', '밤을 삼키는 뱀 머리']] },
      { id: 'typhon', name: '티폰', title: '괴물들의 아버지', icon: '🌋', kind: 'elite',
        d: [['helm', '백 개의 뱀 머리 투구'], ['gloves', '제우스의 힘줄을 끊은 손']] },
      { id: 'vritra', name: '브리트라', title: '세상의 물을 가둔 용', icon: '🐊',
        d: [['armor', '물을 가둔 비늘'], ['gloves', '강을 막은 발톱']] },
      { id: 'ziz', name: '지즈', title: '하늘을 가리는 날개', icon: '🕊️', kind: 'elite', set: 'primordialBeasts', itemKey: 'ziz2',
        d: [['boots', '하늘 덮는 신']] },
      { id: 'orochi', name: '야마타노오로치', title: '여덟 골짜기를 덮은 여덟 머리', icon: '🐉',
        d: [['weapon', '꼬리에서 나온 구사나기']] },
      { id: 'ymir', name: '이미르', title: '주검으로 세계가 지어진 거인', icon: '❄️', kind: 'elite',
        d: [['shoulder', '산맥이 된 어깨'], ['necklace', '서리 거인의 심장']] },
      { id: 'tiamat', name: '티아마트의 화신', title: '신들을 낳고 신들에게 갈라진 바다', icon: '🌊', kind: 'boss',
        d: [['armor', '갈라진 바다의 갑주'], ['necklace', '운명의 서판'], ['bracelet', '열한 괴물의 팔찌']] }
    ]
  },
  {
    id: 'rank4', rank: 18,
    name: '올림포스 정상',
    flavor: '어느 신화의 주신이든, 결국 정상에서는 마주치게 된다.',
    enemies: [
      { id: 'osiris', name: '오시리스의 화신', title: '찢겨서도 다시 맞춰진', icon: '🏺', itemKey: 'osiris2',
        d: [['offhand', '갈고리 홀'], ['belt', '아마포 허리띠']] },
      { id: 'brahma', name: '브라흐마의 화신', title: '네 얼굴로 세계를 지은', icon: '🌺', kind: 'elite', set: 'trimurti',
        d: [['gloves', '네 팔의 장갑']] },
      { id: 'izanagi', name: '이자나기의 화신', title: '황천에서 돌아온 자', icon: '🗾', itemKey: 'izanagi2',
        d: [['shoulder', '황천의 견갑'], ['special', '황천의 복숭아', { relic: ['survive'] }]] },
      { id: 'ra', name: '라의 화신', title: '매일 세계를 다시 켜는 자', icon: '☀️', itemKey: 'ra2',
        d: [['armor', '황금 태양원반'], ['ring', '우라에우스의 뱀']] },
      { id: 'vishnu', name: '비슈누의 화신', title: '열 번 세상에 내려온', icon: '🪷', kind: 'elite', set: 'trimurti', itemKey: 'vishnu2',
        d: [['offhand', '수다르샤나 원반']] },
      { id: 'indra', name: '인드라의 화신', title: '천 개의 눈으로 보는 자', icon: '🐘', kind: 'elite', itemKey: 'indra2',
        d: [['weapon', '금강저 바즈라'], ['helm', '천 개의 눈']] },
      { id: 'hwanin', name: '환인의 화신', title: '하늘에서 내려다본 자', icon: '🏔️', itemKey: 'hwanin2',
        d: [['helm', '천부인의 관'], ['necklace', '신단수의 가지']] },
      { id: 'shiva', name: '시바의 화신', title: '춤 한 번에 세계를 끝내는', icon: '🕉️', kind: 'elite', set: 'trimurti', itemKey: 'shiva2',
        d: [['special', '시바의 셋째 눈', { relic: ['pierce'] }]] },
      { id: 'jadeemperor', name: '옥황상제의 화신', title: '하늘 관청의 주인', icon: '🐲', itemKey: 'jadeemperor2',
        d: [['cloak', '자미원의 곤룡포'], ['ring', '옥새']] },
      { id: 'odin', name: '오딘의 화신', title: '한쪽 눈으로 모든 것을 본', icon: '🦅', kind: 'elite', itemKey: 'odin2',
        d: [['weapon', '빗나가지 않는 창 궁니르'], ['cloak', '회색 나그네의 망토']] },
      { id: 'quetzalcoatl', name: '케찰코아틀의 화신', title: '깃털 달린 뱀', icon: '🐍', itemKey: 'quetzalcoatl2',
        d: [['boots', '창공을 딛는 신'], ['greaves', '깃털 각반']] },
      { id: 'ahuramazda', name: '아후라 마즈다의 화신', title: '꺼지지 않는 불', icon: '🔥', itemKey: 'ahuramazda2',
        d: [['bracelet', '진리의 고리']] },
      { id: 'zeus', name: '제우스의 화신', title: '올림포스의 마지막 말', icon: '⛈️', kind: 'boss', itemKey: 'zeus2',
        d: [['weapon', '케라우노스'], ['offhand', '아이기스'], ['necklace', '올림포스의 인장']] }
    ]
  },
  // 옛 15격의 앞쪽 — 크툴루 같은 옛 지배자들. 그 위(20격)에 바깥의 신이 있습니다.
  {
    id: 'rlyeh', rank: 19,
    name: '가라앉은 르뤼에',
    flavor: '별이 제자리에 올 때까지 이 도시는 물 밑에서 꿈을 꾼다.',
    enemies: [
      { id: 'yig', name: '이그의 화신', title: '뱀들의 아버지', icon: '🐍', itemKey: 'yig2',
        d: [['belt', '방울뱀 허리띠'], ['ring', '저주의 고리']] },
      { id: 'dagon', name: '다곤의 화신', title: '깊은 곳의 아버지', icon: '🐟', kind: 'elite', set: 'elementalOldOnes', itemKey: 'dagon2',
        d: [['gloves', '물갈퀴 장갑']] },
      { id: 'ithaqua', name: '이타콰의 화신', title: '바람을 타고 걷는 자', icon: '❄️', itemKey: 'ithaqua2',
        d: [['boots', '눈을 밟지 않는 신'], ['cloak', '바람의 망토']] },
      { id: 'chaugnar', name: '차우그나르 파우근의 화신', title: '피를 빠는 코끼리 신', icon: '🦣', itemKey: 'chaugnar2',
        d: [['shoulder', '상아 어깨뼈'], ['bracelet', '상아 팔찌']] },
      { id: 'hastur', name: '하스터의 화신', title: '세 번 부르면 오는 황의 왕', icon: '👑', kind: 'elite', set: 'elementalOldOnes', itemKey: 'hastur2',
        d: [['cloak', '누더기 황의']] },
      { id: 'glaaki', name: '글라아키의 화신', title: '가시로 꿈을 꿰는 자', icon: '🪲', itemKey: 'glaaki2',
        d: [['helm', '녹슨 관'], ['greaves', '호수 바닥의 각반']] },
      { id: 'shoggoth', name: '쇼고스', title: '주인을 삼키고 남은 원형질', icon: '🦠',
        d: [['armor', '형체 없는 원형질 갑옷'], ['gloves', '테켈리리 하고 우는 손']] },
      { id: 'cthugha', name: '크투가의 화신', title: '포말하우트에서 타오르는 불', icon: '🔥', kind: 'elite', set: 'elementalOldOnes',
        d: [['weapon', '포말하우트의 불꽃']] },
      { id: 'migo', name: '미-고', title: '유고스에서 날아온 균류', icon: '🍄',
        d: [['offhand', '뇌를 담은 원통']] },
      { id: 'tsathoggua', name: '츠아토구아의 화신', title: '움직이기 싫어하는 두꺼비 신', icon: '🦥', kind: 'elite', set: 'elementalOldOnes', itemKey: 'tsathoggua2',
        d: [['bracelet', '잠의 팔찌']] },
      { id: 'atlachnacha', name: '아틀락-나챠의 화신', title: '다 짜면 세상이 끝나는 거미줄을 치는', icon: '🕸️',
        d: [['necklace', '거미줄에 걸린 꿈'], ['belt', '심연에 걸친 실']] },
      { id: 'cthulhu', name: '크툴루의 화신', title: '죽지 않고 잠들어 있을 뿐인', icon: '🐙', kind: 'boss', itemKey: 'cthulhu2',
        d: [['weapon', '르뤼에의 촉수'], ['armor', '심해의 갑각'], ['special', '잠든 신의 우상', { relic: ['doubleHit'] }]] }
    ]
  },
  {
    id: 'rank5', rank: 20,
    name: '궁극의 혼돈',
    flavor: '여기엔 위도 아래도 없다. 신화도 없다. 신화는 인간의 것이니까.',
    enemies: [
      { id: 'shubniggurath', name: '슈브니구라스의 화신', title: '천 마리 새끼를 거느린 검은 염소', icon: '🐐', itemKey: 'shubniggurath2',
        d: [['helm', '뿔난 관'], ['greaves', '검은 털 각반']] },
      { id: 'ubbosathla', name: '우보-사틀라의 화신', title: '머리도 팔다리도 없는, 모든 것의 처음이자 끝', icon: '🧬',
        d: [['belt', '처음이자 끝인 진흙 띠'], ['gloves', '모든 것을 빚은 손']] },
      { id: 'abhoth', name: '아브호스의 화신', title: '끝없이 새것을 게워내는 웅덩이', icon: '🫧', itemKey: 'abhoth2',
        d: [['armor', '끓는 진흙 갑주'], ['boots', '녹아내리는 신']] },
      { id: 'daoloth', name: '다올로스의 화신', title: '장막을 찢는 자', icon: '🌫️',
        d: [['shoulder', '장막을 찢는 견갑'], ['offhand', '찢어진 장막']] },
      { id: 'yogsothoth', name: '요그소토스의 화신', title: '문이자 열쇠이며 문지기인', icon: '🔮', kind: 'elite', itemKey: 'yogsothoth2',
        d: [['ring', '모든 문의 열쇠'], ['necklace', '구체 속의 구체']] },
      { id: 'voidlordmyth', name: '공허의 군주', title: '아무것도 아닌 것의 왕', icon: '🕳️', itemKey: 'voidlordmyth2',
        d: [['weapon', '공허의 낫'], ['bracelet', '빈 고리']] },
      { id: 'tulzscha', name: '툴주샤의 화신', title: '백치 신의 궁정에서 타는 초록 불꽃', icon: '❇️',
        d: [['ring', '초록 불꽃의 반지'], ['gloves', '불꽃으로 춤추는 손']] },
      { id: 'yibbtstll', name: '이브-츠틀의 화신', title: '시간 바깥에서 참고 기다리는 자', icon: '⏳',
        d: [['cloak', '시간을 덮는 망토'], ['bracelet', '시간을 세는 팔찌']] },
      { id: 'nyarlathotep', name: '니알라토텝의 화신', title: '천 개의 가면을 쓴 기어오는 혼돈', icon: '🎭', kind: 'elite', itemKey: 'nyarlathotep2',
        d: [['cloak', '검은 파라오의 의복'], ['helm', '천 개째의 가면']] },
      { id: 'ghroth', name: '그로스의 화신', title: '별을 깨우며 떠도는 행성', icon: '🪐',
        d: [['shoulder', '떠도는 별의 견갑'], ['boots', '별을 깨우며 걷는 신']] },
      { id: 'pipers', name: '아자토스의 피리꾼', title: '백치 신 곁에서 피리를 멈추지 않는', icon: '🎶',
        d: [['offhand', '멈추지 않는 피리']] },
      { id: 'azathoth', name: '아자토스', title: '중심에서 잠든 눈먼 백치 신 · 화신을 갖지 못한 유일한 것', icon: '🌀', kind: 'boss', final: true, itemKey: 'azathoth2',
        d: [['weapon', '만물을 가르는 칼날'], ['armor', '무(無)의 갑주'], ['necklace', '백치의 왕관']] }
    ]
  }
];

// ============================================================
//  적마다의 성격
// ============================================================
// 그 적이 남기는 전리품의 성격입니다. 생김새 · 설화와 어울리게 붙였습니다.
// 이웃한 적끼리는 일부러 다른 성격을 줬습니다 — 바로 윗레벨에서 같은 부위가
// 또 나와도 「갈아끼울까 말까」 가 고민이 되도록.
// 『행운』과 『성장』은 **일부러 드뭅니다.** 싸움을 포기하고 갈아입는 물건이라
// 흔하면 갈아입는 일이 특별하지 않게 됩니다. 격마다 하나씩만 두세요.
const ENEMY_ARCHETYPE = {
  // 1격 — 초심자의 지하수로
  slime: 'ward',  giantrat: 'swift',  goblin: 'fierce',  kobold: 'guard',
  goblinchief: 'brutal',  skeleton: 'pierce',  zombie: 'ward',  cavespider: 'leech',
  mimic: 'lucky',  imp: 'growth',  darkwolf: 'swift',  dungeonguardian: 'guard',

  // 2격 — 이끼 낀 숲길
  orc: 'brutal',  hobgoblin: 'guard',  lizardman: 'pierce',  harpy: 'swift',
  orcgeneral: 'fierce',  ogre: 'brutal',  darkelf: 'leech',  treant: 'thorn',
  forestwitch: 'leech',  gargoyle: 'guard',  basilisk: 'pierce',  trollking: 'ward',

  // 3격 — 무너진 왕국
  minotaur: 'brutal',  wyvern: 'swift',  chimera: 'fierce',  manticore: 'pierce',
  griffinlord: 'swift',  stonegolem: 'guard',  irongolem: 'thorn',  harpyqueen: 'lucky',
  hydra: 'ward',  cockatrice: 'pierce',  darkknight: 'fierce',  fallenking: 'guard',

  // 4격 — 거인의 고개
  hillgiant: 'brutal',  cyclops: 'pierce',  stonegiant: 'guard',  ettin: 'fierce',
  frostgiant: 'ward',  goliath: 'brutal',  yeti: 'swift',  firegiant: 'fierce',
  roc: 'swift',  cloudgiant: 'lucky',  mammoth: 'ward',  giantking: 'thorn',

  // 5격 — 시체가 걷는 도시
  ghoul: 'leech',  wraith: 'swift',  vampire: 'leech',  whitehorse: 'pierce',
  banshee: 'fierce',  deathknight: 'guard',  bonedragon: 'pierce',  redhorse: 'brutal',
  succubus: 'lucky',  incubus: 'leech',  lich: 'pierce',  blackhorse: 'leech',
  demonlord: 'brutal',  balrog: 'fierce',  palehorse: 'thorn',  lichking: 'ward',

  // 6격 — 마계의 왕좌
  archdemon: 'fierce',  abysstentacle: 'leech',  sinsloth: 'guard',  sinenvy: 'swift',
  elderdragon: 'brutal',  sinlust: 'leech',  singluttony: 'ward',  sinpride: 'thorn',
  sinwrath: 'fierce',  singreed: 'leech',  demongeneral: 'pierce',  observer: 'swift',
  worldworm: 'leech',  apocalypsebeast: 'brutal',  demonking: 'fierce',

  // 7격 — 알렉산드리아 대도서관
  storyteller: 'lucky',  scribe: 'swift',  guanyu: 'brutal',  archimedes: 'growth',
  hypatia: 'swift',  sunzi: 'guard',  davinci: 'swift',  zhangfei: 'fierce',
  herodotos: 'ward',  joan: 'fierce',  zhaoyun: 'guard',  spartacus: 'brutal',
  genghis: 'swift',  machao: 'leech',  alexander: 'fierce',  huangzhong: 'pierce',
  yisunsin: 'guard',

  // 8격 — 원탁의 성 카멜롯
  auraknight: 'fierce',  paladin: 'ward',  lancelot: 'pierce',  templar: 'guard',
  dragonknight: 'swift',  gawain: 'brutal',  berserker: 'leech',  galahad: 'ward',
  greenknight: 'growth',  tristan: 'swift',  roland: 'guard',  percival: 'lucky',
  elcid: 'fierce',  bedivere: 'guard',  robinhood: 'pierce',  mordred: 'leech',
  ladyofthelake: 'ward',  arthur: 'guard',

  // 9격 — 안개 너머의 아발론
  archmage: 'fierce',  elementalist: 'brutal',  salamander: 'fierce',  summoner: 'guard',
  runemage: 'ward',  undine: 'thorn',  alchemist: 'growth',  druid: 'ward',
  faust: 'lucky',  sylph: 'swift',  warlock: 'leech',  babayaga: 'pierce',
  gnome: 'guard',  circe: 'leech',  morgan: 'fierce',  merlin: 'ward',

  // 10격 — 천하제일 비무대
  nangin: 'fierce',  gaebang: 'lucky',  namgung: 'brutal',  emei: 'pierce',
  shaolin: 'guard',  tangga: 'leech',  dalma: 'growth',  wudang: 'ward',
  moyong: 'thorn',  hwasan: 'swift',  jegal: 'guard',  zhangsanfeng: 'thorn',
  bukhae: 'guard',  paeng: 'brutal',  cheonma: 'fierce',

  // 11격 — 만년설 덮인 천산
  yeongsa: 'leech',  geumjam: 'pierce',  azuredragon: 'thorn',  geumseom: 'lucky',
  sansam: 'ward',  gumiho: 'leech',  bingjam: 'guard',  whitetiger: 'fierce',
  ungnyeo: 'growth',  sangun: 'fierce',  vermilionbird: 'brutal',  geumsijo: 'swift',
  hwarin: 'pierce',  blacktortoise: 'ward',  yeonggu: 'guard',  imugi: 'brutal',

  // 12격 — 잊혀진 성역
  unicorn: 'ward',  nemeanlion: 'guard',  pegasus: 'swift',  ceryneianhind: 'lucky',
  sphinx: 'ward',  erymanthianboar: 'brutal',  phoenix: 'growth',  stymphalianbirds: 'pierce',
  cretanbull: 'fierce',  hippogriff: 'swift',  kraken: 'leech',  mares: 'brutal',
  geryon: 'guard',  cerberus: 'fierce',  ladon: 'ward',  sanctdragon: 'thorn',

  // 13격 — 엘리시온 평원
  theseus: 'pierce',  perseus: 'swift',  odysseus: 'pierce',  atalanta: 'swift',
  enkidu: 'ward',  gilgamesh: 'brutal',  hector: 'guard',  achilles: 'fierce',
  cuchulainn: 'brutal',  beowulf: 'thorn',  arjuna: 'pierce',  siegfried: 'leech',
  heracles: 'brutal',

  // 14격 — 일곱 번째 하늘
  guardianangel: 'ward',  principality: 'guard',  raphael: 'ward',  powerangel: 'fierce',
  trumpetangel: 'swift',  uriel: 'pierce',  virtueangel: 'lucky',  dominion: 'brutal',
  raguel: 'guard',  throneangel: 'thorn',  gabriel: 'growth',  cherub: 'guard',
  sariel: 'swift',  seraph: 'fierce',  remiel: 'ward',  michael: 'brutal',

  // 15격 — 얼어붙은 코키토스
  legion: 'brutal',  bael: 'swift',  moloch: 'fierce',  baphomet: 'growth',
  asmodeus: 'fierce',  azazel: 'pierce',  beleth: 'brutal',  beelzebub: 'leech',
  mephisto: 'lucky',  paimon: 'guard',  astaroth: 'swift',  purson: 'ward',
  belial: 'thorn',  lilith: 'leech',  vine: 'fierce',  balam: 'guard',
  zagan: 'thorn',  lucifer: 'pierce',

  // 16격 — 이그드라실의 가지
  bastet: 'swift',  hera: 'thorn',  anubis: 'pierce',  hermes: 'swift',
  susanoo: 'fierce',  athena: 'guard',  poseidon: 'brutal',  apollo: 'ward',
  thor: 'brutal',  artemis: 'swift',  aphrodite: 'leech',  amaterasu: 'ward',
  loki: 'lucky',  hephaestus: 'guard',  ares: 'fierce',  isis: 'growth',
  demeter: 'ward',  dionysus: 'leech',  hades: 'thorn',

  // 17격 — 태초의 바다
  titanmyth: 'guard',  behemoth: 'ward',  jormungandr: 'leech',  fenrir: 'fierce',
  leviathan: 'brutal',  apophis: 'pierce',  typhon: 'fierce',  vritra: 'guard',
  ziz: 'swift',  orochi: 'brutal',  ymir: 'growth',  tiamat: 'thorn',

  // 18격 — 올림포스 정상
  osiris: 'leech',  brahma: 'growth',  izanagi: 'pierce',  ra: 'fierce',
  vishnu: 'ward',  indra: 'brutal',  hwanin: 'guard',  shiva: 'pierce',
  jadeemperor: 'lucky',  odin: 'pierce',  quetzalcoatl: 'swift',  ahuramazda: 'thorn',
  zeus: 'fierce',

  // 19격 — 가라앉은 르뤼에
  yig: 'thorn',  dagon: 'leech',  ithaqua: 'swift',  chaugnar: 'leech',
  hastur: 'thorn',  glaaki: 'growth',  shoggoth: 'ward',  cthugha: 'fierce',
  migo: 'pierce',  tsathoggua: 'ward',  atlachnacha: 'guard',  cthulhu: 'brutal',

  // 20격 — 궁극의 혼돈
  shubniggurath: 'ward',  ubbosathla: 'growth',  abhoth: 'leech',  daoloth: 'pierce',
  yogsothoth: 'lucky',  voidlordmyth: 'pierce',  tulzscha: 'fierce',  yibbtstll: 'guard',
  nyarlathotep: 'swift',  ghroth: 'thorn',  pipers: 'ward',  azathoth: 'brutal'
};

// ============================================================
//  정예 묶음
// ============================================================
// 칠죄종처럼 숫자 · 속성으로 묶이는 정예들입니다. 묶음 정예는 전리품이 하나 — 그 존재를 대표하는 물건입니다.
// 『격을 삼키는 검』이 삼킬 격이 없습니다 (devourEnergy) — 다 삼킬 수 있게 하면 묶음 정예가 여든다섯이라
// 시작 에너지가 기본 30에 그만큼 더 붙습니다.
// 맵에서는 6격의 칠죄종 홀처럼 묶음을 한곳에 모아 세웁니다 (docs/MAP-REFERENCE-PLAN.md).
const ELITE_SETS = {
  elementGiants: { name: '원소 거인 넷', members: ['stonegiant', 'frostgiant', 'firegiant', 'cloudgiant'] },
  horsemen: { name: '묵시록의 네 기사', members: ['whitehorse', 'redhorse', 'blackhorse', 'palehorse'] },
  sins: { name: '칠죄종', members: ['sinsloth', 'sinenvy', 'sinlust', 'singluttony', 'sinpride', 'sinwrath', 'singreed'] },
  tigers: { name: '오호대장군', members: ['guanyu', 'zhangfei', 'zhaoyun', 'machao', 'huangzhong'] },
  roundTable: { name: '원탁의 기사', members: ['lancelot', 'gawain', 'galahad', 'tristan', 'percival', 'bedivere', 'mordred'] },
  elementals: { name: '4대 정령', members: ['salamander', 'undine', 'sylph', 'gnome'] },
  clans: { name: '오대세가', members: ['namgung', 'tangga', 'moyong', 'jegal', 'paeng'] },
  fourSymbols: { name: '사신수', members: ['azuredragon', 'whitetiger', 'vermilionbird', 'blacktortoise'] },
  labors: { name: '헤라클레스의 열두 과업', members: ['nemeanlion', 'ceryneianhind', 'erymanthianboar', 'stymphalianbirds', 'cretanbull', 'mares', 'geryon', 'cerberus', 'ladon'] },
  archangels: { name: '일곱 대천사', members: ['raphael', 'uriel', 'raguel', 'gabriel', 'sariel', 'remiel'] },
  goetiaKings: { name: '솔로몬 72 마신의 아홉 왕', members: ['bael', 'asmodeus', 'beleth', 'paimon', 'purson', 'belial', 'vine', 'balam', 'zagan'] },
  olympians: { name: '올림포스 12신', members: ['hera', 'hermes', 'athena', 'poseidon', 'apollo', 'artemis', 'aphrodite', 'hephaestus', 'ares', 'demeter', 'dionysus'] },
  primordialBeasts: { name: '땅 · 바다 · 하늘의 세 짐승', members: ['behemoth', 'leviathan', 'ziz'] },
  trimurti: { name: '트리무르티', members: ['brahma', 'vishnu', 'shiva'] },
  elementalOldOnes: { name: '원소별 옛 지배자', members: ['dagon', 'hastur', 'cthugha', 'tsathoggua'] }
};

// ============================================================
//  특수장비 · 빠진 전리품
// ============================================================
// 예전엔 허리띠 · 망토 · 장갑 · 팔찌를 덧붙이는 표(EXTRA_DROPS)와, 몇몇 화신의 전리품 하나를
// 특수장비로 바꾸는 표(SPECIAL_DROPS)가 따로 있었습니다. 격 재편 때 전리품 수를 「대부분 둘 · 종종 하나 ·
// 보스 셋」으로 갈아엎으면서 전부 각 적의 d 에 합쳤습니다 — 자리(번호)는 그대로라 남긴 장비는 그대로입니다.
// 빠진 전리품을 가진 저장본은 불러올 때 그 부위의 강화석으로 돌려받습니다 (RETIRED_ITEMS).
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

// 『격을 삼키는 검』이 삼킬 수 있는 에너지. 묶음 정예(칠죄종 · 일곱 대천사 …)는 정예여도 삼킬 격이 없습니다.
const SET_FOES = new Set(Object.values(ELITE_SETS).flatMap(s => s.members));
function devourEnergy(foe) {
  if (!foe || SET_FOES.has(foe.id)) return 0;
  return KINDS[foe.kind] ? KINDS[foe.kind].energy : 0;
}

ZONES.forEach((zone, zi) => {
  const rank = RANKS.find(r => r.n === zone.rank);
  const count = zone.enemies.length;

  zone.enemies.forEach((e, ei) => {
    const kind = e.kind || 'normal';
    const K = KINDS[kind];
    const level = rankLevel(rank.n, ei, count);
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
      set: e.set || null,         // 묶음 정예라면 그 묶음 (ELITE_SETS)
      zoneIndex: zi,
      zoneId: zone.id,
      zoneName: zone.name,
      rank,
      ...toughen(e.final ? finalBossStats(level, K.lifeMult) : enemyStats(level, K.lifeMult), rank.n, !!e.final),
      xp: enemyBaseXp(level)
    });

    // [부위, 이름] 뒤에 숫자를 붙이면 그 전리품만 성능 배수를 따로 줍니다.
    // 특수장비는 4격부터만 떨어집니다 (SPECIAL_MIN_RANK) — 그 아래 격의 특수장비 자리는 빠진 것으로 칩니다.
    const low = rank.n < SPECIAL_MIN_RANK;
    const key = e.itemKey || e.id;
    e.d.forEach(([slot, name, opt], i) => {
      const id = `${key}_${i}`;
      if (opt === 'retired' || (low && slot === 'special')) {
        RETIRED_ITEMS[id] = { slot, grade: kind, rank, name };
        return;
      }
      const noArch = opt === 'none';
      const isSpecial = slot === 'special';
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

// 6격 마계에 있다가 뒤쪽 신화 격으로 옮긴 타이탄 · 공허의 군주 — 옛 id 의 전리품은 빼고, 가진 저장본은 강화석으로 돌려받습니다.
// (id 를 그대로 두면 가진 사람의 낫 · 갑주가 하루아침에 14~15격 성능이 됩니다)
for (const [id, slot, name] of [
  ['titan_0', 'greaves', '거인의 각반'], ['titan_1', 'offhand', '산을 깎은 방패'], ['titan_2', 'belt', '거인의 허리띠'],
  ['voidlord_0', 'weapon', '공허의 낫'], ['voidlord_1', 'armor', '없음의 갑주'], ['voidlord_2', 'bracelet', '빈 고리']
]) RETIRED_ITEMS[id] = { slot, grade: 'normal', rank: RANKS.find(r => r.n === 6), name };

// 옛 번호 — 격 재편 때 격을 옮긴 적(옛 4격 짐승들 · 8격 뒤로 밀린 화신들)의 옛 전리품처럼, 지금 데이터에 없는 번호.
// 가진 저장본은 불러올 때 그 부위의 강화석으로 돌려받습니다. 예전 data.js 와 견줘 뽑은 표입니다 — 손으로 고치지 마세요.
//   id: [부위, 이름, 등급, 옛 격 번호]
const LEGACY_ITEMS = {
  'unicorn_0': ['weapon', '일각수의 뿔', 'normal', 4],
  'unicorn_1': ['necklace', '정화의 물방울', 'normal', 4],
  'unicorn_2': ['bracelet', '정화의 팔찌', 'normal', 4],
  'pegasus_0': ['boots', '구름을 딛는 편자', 'normal', 4],
  'pegasus_1': ['bracelet', '날개의 고리', 'normal', 4],
  'phoenix_0': ['cloak', '재에서 난 깃옷', 'normal', 4],
  'phoenix_2': ['gloves', '불티 장갑', 'normal', 4],
  'phoenix_3': ['special', '다시 타오르는 잿불', 'normal', 4],
  'cerberus_0': ['helm', '세 머리의 투구', 'normal', 4],
  'cerberus_1': ['greaves', '지옥문 각반', 'normal', 4],
  'cerberus_2': ['ring', '세 목줄의 고리', 'normal', 4],
  'sphinx_0': ['necklace', '풀리지 않는 수수께끼', 'elite', 4],
  'sphinx_1': ['helm', '사자의 관', 'elite', 4],
  'sphinx_2': ['bracelet', '정답의 고리', 'elite', 4],
  'leviathan_0': ['armor', '심해 비늘 갑주', 'normal', 4],
  'leviathan_1': ['shoulder', '해일의 지느러미', 'normal', 4],
  'behemoth_0': ['greaves', '대지의 각반', 'normal', 4],
  'behemoth_1': ['offhand', '뿔 방패', 'normal', 4],
  'behemoth_2': ['belt', '대지의 허리띠', 'normal', 4],
  'ziz_0': ['boots', '하늘 덮는 신', 'normal', 4],
  'ziz_1': ['bracelet', '깃대의 고리', 'normal', 4],
  'ziz_2': ['cloak', '하늘 덮는 망토', 'normal', 4],
  'kraken_0': ['shoulder', '거대 촉수', 'elite', 4],
  'kraken_1': ['armor', '흡반 갑피', 'elite', 4],
  'kraken_2': ['necklace', '심연의 먹물', 'elite', 4],
  'salamander_0': ['weapon', '불꽃 꼬리', 'normal', 4],
  'salamander_1': ['greaves', '용암 각반', 'normal', 4],
  'salamander_2': ['gloves', '화염 손', 'normal', 4],
  'sylph_0': ['boots', '바람의 신', 'normal', 4],
  'sylph_1': ['bracelet', '공기의 고리', 'normal', 4],
  'sylph_2': ['bracelet', '바람 팔찌', 'normal', 4],
  'sanctdragon_0': ['weapon', '용의 송곳니 검', 'boss', 4],
  'sanctdragon_1': ['armor', '고룡 비늘 갑주', 'boss', 4],
  'sanctdragon_4': ['special', '성역의 수호석', 'boss', 4],
  'nangin_0': ['weapon', '이 빠진 박도', 'normal', 8],
  'nangin_1': ['boots', '떠돌이 짚신', 'normal', 8],
  'gaebang_0': ['weapon', '타구봉', 'normal', 8],
  'gaebang_1': ['belt', '아홉 매듭 띠', 'normal', 8],
  'emei_0': ['offhand', '아미자', 'normal', 8],
  'emei_1': ['bracelet', '백팔 염주', 'normal', 8],
  'shaolin_0': ['gloves', '금강 권갑', 'normal', 8],
  'shaolin_1': ['armor', '철포삼', 'normal', 8],
  'dalma_0': ['offhand', '세수경', 'elite', 8],
  'dalma_1': ['necklace', '면벽의 염주', 'elite', 8],
  'dalma_2': ['cloak', '갈대 한 줄기 가사', 'elite', 8],
  'wudang_0': ['weapon', '송문고검', 'normal', 8],
  'wudang_1': ['cloak', '태극 도포', 'normal', 8],
  'tangga_0': ['ring', '독침 반지', 'normal', 8],
  'tangga_1': ['shoulder', '암기 견대', 'normal', 8],
  'hwasan_0': ['helm', '매화 두건', 'normal', 8],
  'hwasan_1': ['boots', '암향 신', 'normal', 8],
  'zhangsanfeng_0': ['weapon', '진무검', 'elite', 8],
  'zhangsanfeng_1': ['bracelet', '태극 팔찌', 'elite', 8],
  'zhangsanfeng_2': ['greaves', '구름 위를 걷는 각반', 'elite', 8],
  'namgung_0': ['necklace', '세가의 옥패', 'normal', 8],
  'namgung_1': ['greaves', '창궁 각반', 'normal', 8],
  'bukhae_0': ['armor', '한빙 갑의', 'normal', 8],
  'bukhae_1': ['helm', '서리 투구', 'normal', 8],
  'cheonma_0': ['weapon', '천마검', 'boss', 8],
  'cheonma_1': ['armor', '천마흑포', 'boss', 8],
  'cheonma_3': ['special', '천마의 비급', 'boss', 8],
  'yeongsa_0': ['necklace', '영사의 내단', 'normal', 9],
  'yeongsa_1': ['boots', '허물 벗은 신', 'normal', 9],
  'geumjam_0': ['ring', '금잠 반지', 'normal', 9],
  'geumjam_1': ['gloves', '금사 장갑', 'normal', 9],
  'geumseom_0': ['bracelet', '금섬 팔찌', 'normal', 9],
  'geumseom_1': ['offhand', '금전표', 'normal', 9],
  'sansam_0': ['belt', '산삼 뿌리 띠', 'normal', 9],
  'sansam_1': ['bracelet', '천년 삼 팔찌', 'normal', 9],
  'gumiho_0': ['necklace', '여우 구슬', 'elite', 9],
  'gumiho_1': ['ring', '홀리는 반지', 'elite', 9],
  'gumiho_2': ['cloak', '아홉 꼬리 목도리', 'elite', 9],
  'bingjam_0': ['armor', '천잠보의', 'normal', 9],
  'bingjam_1': ['cloak', '빙잠사 망토', 'normal', 9],
  'ungnyeo_0': ['helm', '쑥 화관', 'normal', 9],
  'ungnyeo_1': ['greaves', '곰 발 각반', 'normal', 9],
  'sangun_0': ['shoulder', '산군의 어깨', 'normal', 9],
  'sangun_1': ['weapon', '호랑이 발톱', 'normal', 9],
  'geumsijo_0': ['weapon', '용을 찢는 발톱', 'elite', 9],
  'geumsijo_1': ['shoulder', '금빛 깃 견갑', 'elite', 9],
  'geumsijo_2': ['boots', '바람을 딛는 발', 'elite', 9],
  'hwarin_0': ['weapon', '화린 뿔창', 'normal', 9],
  'hwarin_1': ['boots', '불을 밟는 신', 'normal', 9],
  'yeonggu_0': ['offhand', '만년 귀갑', 'normal', 9],
  'yeonggu_1': ['helm', '거북 등 투구', 'normal', 9],
  'bonghwang_0': ['special', '봉황의 비취', 'hidden', 9],
  'bonghwang_1': ['special', '태평의 깃', 'hidden', 9],
  'imugi_0': ['weapon', '승천하지 못한 뿔', 'boss', 9],
  'imugi_1': ['armor', '역린 갑주', 'boss', 9],
  'imugi_3': ['special', '이무기의 여의주', 'boss', 9],
  'theseus_0': ['shoulder', '아테네의 견갑', 'normal', 10],
  'theseus_1': ['necklace', '아리아드네의 실타래', 'normal', 10],
  'theseus_2': ['belt', '미궁의 실 허리띠', 'normal', 10],
  'perseus_0': ['offhand', '거울 방패', 'normal', 10],
  'perseus_1': ['boots', '날개 달린 신', 'normal', 10],
  'perseus_2': ['cloak', '보이지 않는 망토', 'normal', 10],
  'odysseus_0': ['gloves', '열두 도끼를 꿰뚫은 손', 'normal', 10],
  'odysseus_1': ['cloak', '거지 행색의 누더기', 'normal', 10],
  'atalanta_0': ['weapon', '칼리돈의 활', 'normal', 10],
  'atalanta_1': ['boots', '멈추지 않는 발', 'normal', 10],
  'atalanta_2': ['ring', '황금 사과', 'normal', 10],
  'enkidu_0': ['armor', '들짐승의 가죽', 'normal', 10],
  'enkidu_1': ['greaves', '야생의 각반', 'normal', 10],
  'enkidu_2': ['bracelet', '흙으로 빚은 팔찌', 'normal', 10],
  'gilgamesh_0': ['shoulder', '하늘 황소의 어깨', 'elite', 10],
  'gilgamesh_1': ['helm', '우루크의 왕관', 'elite', 10],
  'gilgamesh_2': ['necklace', '시들어버린 영생초', 'elite', 10],
  'hector_0': ['offhand', '트로이의 방패', 'normal', 10],
  'hector_1': ['greaves', '성벽의 각반', 'normal', 10],
  'hector_2': ['helm', '빛나는 투구', 'normal', 10],
  'achilles_0': ['weapon', '펠리온의 물푸레 창', 'normal', 10],
  'achilles_1': ['armor', '불멸의 청동 갑주', 'normal', 10],
  'achilles_2': ['boots', '테티스가 잡았던 발목', 'normal', 10],
  'cuchulainn_0': ['weapon', '게 불그', 'normal', 10],
  'cuchulainn_1': ['greaves', '뒤틀림의 각반', 'normal', 10],
  'cuchulainn_2': ['bracelet', '뒤틀림의 팔찌', 'normal', 10],
  'beowulf_0': ['gloves', '그렌델의 팔', 'elite', 10],
  'beowulf_1': ['helm', '곰가죽 투구', 'elite', 10],
  'beowulf_2': ['bracelet', '흐룬팅의 고리', 'elite', 10],
  'arjuna_0': ['weapon', '간디바', 'normal', 10],
  'arjuna_1': ['bracelet', '집중의 고리', 'normal', 10],
  'arjuna_2': ['boots', '전차의 발판', 'normal', 10],
  'siegfried_0': ['weapon', '마검 그람', 'normal', 10],
  'siegfried_1': ['armor', '용피 갑주', 'normal', 10],
  'siegfried_3': ['special', '파프니르의 피', 'normal', 10],
  'heracles_0': ['weapon', '올리브 몽둥이', 'boss', 10],
  'heracles_1': ['armor', '네메아 사자의 가죽', 'boss', 10],
  'heracles_4': ['special', '네메아를 꺾은 주먹', 'boss', 10],
  'guardianangel_0': ['cloak', '깃털 한 장의 망토', 'normal', 11],
  'guardianangel_1': ['ring', '지켜보는 반지', 'normal', 11],
  'principality_0': ['helm', '나라를 맡은 관', 'normal', 11],
  'principality_1': ['belt', '홀을 찬 띠', 'normal', 11],
  'powerangel_0': ['weapon', '악을 쫓는 창', 'normal', 11],
  'powerangel_1': ['shoulder', '능천사의 견갑', 'normal', 11],
  'trumpetangel_0': ['offhand', '첫째 나팔', 'normal', 11],
  'trumpetangel_1': ['boots', '구름 디딤 신', 'normal', 11],
  'raphael_0': ['bracelet', '치유의 팔찌', 'elite', 11],
  'raphael_1': ['necklace', '토비트의 물고기', 'elite', 11],
  'raphael_2': ['belt', '나그네의 띠', 'elite', 11],
  'virtueangel_0': ['bracelet', '기적의 팔찌', 'normal', 11],
  'virtueangel_1': ['gloves', '기적을 행하는 손', 'normal', 11],
  'dominion_0': ['armor', '다스림의 흉갑', 'normal', 11],
  'dominion_1': ['necklace', '주권의 목걸이', 'normal', 11],
  'throneangel_0': ['greaves', '바퀴 속의 바퀴', 'normal', 11],
  'throneangel_1': ['helm', '눈으로 가득한 관', 'normal', 11],
  'gabriel_0': ['offhand', '마지막 나팔', 'elite', 11],
  'gabriel_1': ['ring', '백합 반지', 'elite', 11],
  'gabriel_2': ['helm', '전령의 관', 'elite', 11],
  'cherub_0': ['weapon', '두루 도는 불칼', 'normal', 11],
  'cherub_1': ['shoulder', '네 얼굴의 견갑', 'normal', 11],
  'seraph_0': ['cloak', '여섯 날개', 'normal', 11],
  'seraph_1': ['gloves', '숯불 집게', 'normal', 11],
  'michael_0': ['weapon', '용을 떨어뜨린 검', 'boss', 11],
  'michael_1': ['armor', '천군의 갑주', 'boss', 11],
  'michael_3': ['special', '미카엘의 저울', 'boss', 11],
  'legion_0': ['armor', '이천 마리 돼지가죽', 'normal', 12],
  'legion_1': ['ring', '많은 이름의 반지', 'normal', 12],
  'moloch_0': ['helm', '황소 머리 투구', 'normal', 12],
  'moloch_1': ['gloves', '제단 불에 그을린 손', 'normal', 12],
  'baphomet_0': ['offhand', '염소 머리 우상', 'normal', 12],
  'baphomet_1': ['bracelet', '녹이고 굳히는 팔찌', 'normal', 12],
  'azazel_0': ['weapon', '처음 벼린 칼', 'normal', 12],
  'azazel_1': ['shoulder', '감시자의 견갑', 'normal', 12],
  'beelzebub_0': ['helm', '파리 떼의 관', 'elite', 12],
  'beelzebub_1': ['armor', '파리 날개 갑의', 'elite', 12],
  'beelzebub_2': ['gloves', '배를 채우지 못하는 손', 'elite', 12],
  'mephisto_0': ['necklace', '피로 쓴 계약서', 'normal', 12],
  'mephisto_1': ['cloak', '진홍 외투', 'normal', 12],
  'astaroth_0': ['boots', '독사를 탄 신', 'normal', 12],
  'astaroth_1': ['belt', '독사 허리띠', 'normal', 12],
  'belial_0': ['weapon', '무가치의 검', 'normal', 12],
  'belial_1': ['greaves', '불의 전차 각반', 'normal', 12],
  'asmodeus_0': ['ring', '솔로몬의 반지', 'elite', 12],
  'asmodeus_1': ['necklace', '세 머리의 목걸이', 'elite', 12],
  'asmodeus_2': ['boots', '불타는 발굽', 'elite', 12],
  'paimon_0': ['helm', '파이몬의 왕관', 'normal', 12],
  'paimon_1': ['offhand', '모든 학문의 책', 'normal', 12],
  'lilith_0': ['necklace', '밤의 목걸이', 'normal', 12],
  'lilith_1': ['bracelet', '첫 아내의 팔찌', 'normal', 12],
  'lucifer_0': ['weapon', '새벽별의 검', 'boss', 12],
  'lucifer_2': ['cloak', '빛을 잃은 여섯 날개', 'boss', 12],
  'lucifer_3': ['special', '새벽별 조각', 'boss', 12],
  'hermes_0': ['boots', '날개 달린 샌들', 'normal', 13],
  'hermes_1': ['offhand', '카두케우스', 'normal', 13],
  'hermes_3': ['special', '전령의 날개', 'normal', 13],
  'bastet_0': ['ring', '고양이의 눈', 'normal', 13],
  'bastet_1': ['greaves', '소리 없는 각반', 'normal', 13],
  'bastet_2': ['bracelet', '고양이 팔찌', 'normal', 13],
  'anubis_0': ['shoulder', '방부사의 어깨띠', 'normal', 13],
  'anubis_1': ['helm', '재칼의 가면', 'normal', 13],
  'anubis_2': ['necklace', '마아트의 저울', 'normal', 13],
  'artemis_0': ['weapon', '초승달 활', 'normal', 13],
  'artemis_1': ['boots', '사슴가죽 신', 'normal', 13],
  'artemis_2': ['cloak', '달빛 망토', 'normal', 13],
  'loki_0': ['offhand', '거짓의 단검', 'elite', 13],
  'loki_1': ['bracelet', '뒤바뀐 반지', 'elite', 13],
  'loki_2': ['necklace', '슬레이프니르의 갈기', 'elite', 13],
  'susanoo_0': ['weapon', '아메노하바키리', 'normal', 13],
  'susanoo_1': ['cloak', '폭풍의 겉옷', 'normal', 13],
  'susanoo_2': ['bracelet', '폭풍 팔찌', 'normal', 13],
  'thor_0': ['weapon', '묠니르', 'normal', 13],
  'thor_1': ['gloves', '야른그레이프르', 'normal', 13],
  'thor_3': ['special', '메긴교르드의 고리', 'normal', 13],
  'ares_0': ['shoulder', '전화(戰禍)의 견갑', 'normal', 13],
  'ares_1': ['armor', '전화(戰禍)의 갑주', 'normal', 13],
  'ares_2': ['helm', '포보스의 투구', 'normal', 13],
  'poseidon_0': ['weapon', '삼지창', 'elite', 13],
  'poseidon_1': ['boots', '파도를 딛는 신', 'elite', 13],
  'poseidon_2': ['necklace', '심해의 진주', 'elite', 13],
  'amaterasu_0': ['cloak', '하늘 옷', 'normal', 13],
  'amaterasu_1': ['helm', '야타의 관', 'normal', 13],
  'amaterasu_2': ['ring', '야사카니의 곡옥', 'normal', 13],
  'isis_0': ['gloves', '생명의 매듭', 'normal', 13],
  'isis_1': ['belt', '아마포 감개', 'normal', 13],
  'isis_2': ['necklace', '앙크', 'normal', 13],
  'hades_0': ['weapon', '명계의 이지창', 'boss', 13],
  'hades_1': ['helm', '보이지 않게 하는 투구', 'boss', 13],
  'hades_2': ['necklace', '케르베로스의 사슬', 'boss', 13],
  'osiris_0': ['offhand', '갈고리 홀', 'normal', 14],
  'osiris_1': ['greaves', '아마포 각반', 'normal', 14],
  'osiris_2': ['belt', '아마포 허리띠', 'normal', 14],
  'titanmyth_0': ['greaves', '거인의 각반', 'normal', 14],
  'titanmyth_1': ['offhand', '산을 깎은 방패', 'normal', 14],
  'titanmyth_2': ['belt', '거인의 허리띠', 'normal', 14],
  'izanagi_0': ['shoulder', '황천의 견갑', 'normal', 14],
  'izanagi_1': ['boots', '황천을 밟은 신', 'normal', 14],
  'izanagi_3': ['special', '황천의 복숭아', 'normal', 14],
  'ra_0': ['shoulder', '태양의 견갑', 'normal', 14],
  'ra_1': ['armor', '황금 태양원반', 'normal', 14],
  'ra_2': ['ring', '우라에우스의 뱀', 'normal', 14],
  'vishnu_0': ['offhand', '수다르샤나 원반', 'normal', 14],
  'vishnu_1': ['necklace', '연꽃의 씨', 'normal', 14],
  'vishnu_2': ['cloak', '열 화신의 망토', 'normal', 14],
  'indra_0': ['weapon', '금강저 바즈라', 'elite', 14],
  'indra_1': ['armor', '아이라바타의 비늘', 'elite', 14],
  'indra_2': ['helm', '천 개의 눈', 'elite', 14],
  'hwanin_0': ['helm', '천부인의 관', 'normal', 14],
  'hwanin_1': ['greaves', '태백의 각반', 'normal', 14],
  'hwanin_2': ['necklace', '신단수의 가지', 'normal', 14],
  'jadeemperor_0': ['cloak', '자미원의 곤룡포', 'normal', 14],
  'jadeemperor_1': ['ring', '옥새', 'normal', 14],
  'jadeemperor_2': ['gloves', '옥황의 장갑', 'normal', 14],
  'shiva_0': ['weapon', '트리슐라', 'normal', 14],
  'shiva_1': ['greaves', '재를 밟는 각반', 'normal', 14],
  'shiva_4': ['special', '시바의 셋째 눈', 'normal', 14],
  'odin_0': ['weapon', '빗나가지 않는 창 궁니르', 'elite', 14],
  'odin_1': ['cloak', '회색 나그네의 망토', 'elite', 14],
  'odin_2': ['necklace', '미미르의 눈', 'elite', 14],
  'quetzalcoatl_0': ['offhand', '깃털 방패', 'normal', 14],
  'quetzalcoatl_1': ['boots', '창공을 딛는 신', 'normal', 14],
  'quetzalcoatl_2': ['greaves', '깃털 각반', 'normal', 14],
  'ahuramazda_0': ['helm', '성화의 관', 'normal', 14],
  'ahuramazda_1': ['cloak', '빛의 겉옷', 'normal', 14],
  'ahuramazda_2': ['bracelet', '진리의 고리', 'normal', 14],
  'zeus_0': ['weapon', '케라우노스', 'boss', 14],
  'zeus_1': ['offhand', '아이기스', 'boss', 14],
  'zeus_2': ['necklace', '올림포스의 인장', 'boss', 14],
  'dagon_0': ['greaves', '심해 비늘 각반', 'normal', 15],
  'dagon_1': ['boots', '물갈퀴 신', 'normal', 15],
  'dagon_2': ['gloves', '물갈퀴 장갑', 'normal', 15],
  'yig_0': ['belt', '방울뱀 허리띠', 'normal', 15],
  'yig_1': ['ring', '저주의 고리', 'normal', 15],
  'ithaqua_0': ['boots', '눈을 밟지 않는 신', 'normal', 15],
  'ithaqua_1': ['necklace', '얼어붙은 발자국', 'normal', 15],
  'ithaqua_2': ['cloak', '바람의 망토', 'normal', 15],
  'chaugnar_0': ['shoulder', '상아 어깨뼈', 'normal', 15],
  'chaugnar_1': ['armor', '돌가죽 갑주', 'normal', 15],
  'chaugnar_2': ['bracelet', '상아 팔찌', 'normal', 15],
  'shubniggurath_0': ['helm', '뿔난 관', 'normal', 15],
  'shubniggurath_1': ['bracelet', '새끼의 고리', 'normal', 15],
  'shubniggurath_2': ['greaves', '검은 털 각반', 'normal', 15],
  'hastur_0': ['weapon', '황색 징표의 검', 'elite', 15],
  'hastur_1': ['cloak', '누더기 황의', 'elite', 15],
  'hastur_2': ['necklace', '카르코사의 열쇠', 'elite', 15],
  'tsathoggua_0': ['offhand', '잠의 부적', 'normal', 15],
  'tsathoggua_1': ['boots', '늪을 걷는 신', 'normal', 15],
  'tsathoggua_2': ['bracelet', '잠의 팔찌', 'normal', 15],
  'glaaki_0': ['shoulder', '꿰뚫는 금속 가시', 'normal', 15],
  'glaaki_1': ['helm', '녹슨 관', 'normal', 15],
  'glaaki_2': ['greaves', '호수 바닥의 각반', 'normal', 15],
  'cthulhu_0': ['weapon', '르뤼에의 촉수', 'normal', 15],
  'cthulhu_1': ['armor', '심해의 갑각', 'normal', 15],
  'cthulhu_4': ['special', '잠든 신의 우상', 'normal', 15],
  'yogsothoth_0': ['offhand', '열리는 문', 'elite', 15],
  'yogsothoth_1': ['ring', '모든 문의 열쇠', 'elite', 15],
  'yogsothoth_2': ['necklace', '구체 속의 구체', 'elite', 15],
  'abhoth_0': ['armor', '끓는 진흙 갑주', 'normal', 15],
  'abhoth_1': ['boots', '녹아내리는 신', 'normal', 15],
  'abhoth_2': ['bracelet', '갓 태어난 고리', 'normal', 15],
  'voidlordmyth_0': ['weapon', '공허의 낫', 'normal', 15],
  'voidlordmyth_1': ['armor', '없음의 갑주', 'normal', 15],
  'voidlordmyth_2': ['bracelet', '빈 고리', 'normal', 15],
  'nyarlathotep_0': ['weapon', '천 개째의 가면', 'normal', 15],
  'nyarlathotep_1': ['cloak', '검은 파라오의 의복', 'normal', 15],
  'nyarlathotep_2': ['greaves', '기어오는 각반', 'normal', 15],
  'azathoth_0': ['weapon', '만물을 가르는 칼날', 'boss', 15],
  'azathoth_1': ['armor', '무(無)의 갑주', 'boss', 15],
  'azathoth_2': ['necklace', '백치의 왕관', 'boss', 15],
  'phoenix_1': ['necklace', '불멸의 잿불', 'normal', 4],
  'sanctdragon_2': ['necklace', '성역의 인장', 'boss', 4],
  'cheonma_2': ['helm', '천마관', 'boss', 8],
  'imugi_2': ['necklace', '여의주', 'boss', 9],
  'siegfried_2': ['necklace', '파프니르의 심장', 'normal', 10],
  'heracles_2': ['necklace', '열두 과업의 증표', 'boss', 10],
  'michael_2': ['offhand', '영혼의 저울', 'boss', 11],
  'lucifer_1': ['armor', '얼어붙은 날개 갑주', 'boss', 12],
  'hermes_2': ['belt', '전령의 띠', 'normal', 13],
  'thor_2': ['belt', '메긴교르드', 'normal', 13],
  'izanagi_2': ['cloak', '황천의 망토', 'normal', 14],
  'shiva_2': ['necklace', '제3의 눈', 'normal', 14],
  'cthulhu_2': ['helm', '촉수관', 'normal', 15],
  // 2026-10-17 — 4격 손질: 골리앗은 정예 → 일반이라 번호를 새로, 다이다라봇치는 빠지고 털매머드가 그 자리에
  'goliath_0': ['weapon', '베틀채 같은 창', 'elite', 4],
  'goliath_1': ['armor', '청동 비늘 갑옷', 'elite', 4],
  'daidarabotchi_0': ['greaves', '호수가 된 발자국', 'elite', 4],
  'daidarabotchi_1': ['bracelet', '산을 빚은 흙 팔찌', 'elite', 4]
};
for (const [id, [slot, name, grade, rankN]] of Object.entries(LEGACY_ITEMS)) {
  if (!RETIRED_ITEMS[id]) RETIRED_ITEMS[id] = { slot, grade, rank: RANKS.find(r => r.n === rankN), name };
}

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
  '황금 태양원반': 35, '옥새': 40,
  '구름 성의 열쇠고리': 20,                                       // 구름 거인 — 황금 알을 낳는 거위가 사는 성
  '동냥 바가지': 20,                                              // 개방 장로 — 천하의 동냥이 모이는 바가지
  '쇠를 금화로 바꾸는 띠': 30                                      // 자간 — 쇠를 금화로 바꾸는 왕
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
// 파는 것은 **먼저 왔던 자들의 소지품**이 주고, 강화석은 덤입니다. 누구의 것이었는지는 말하지 않습니다 —
// 이름 지워진 안전모, 멈춘 손목시계. 한 줄 메모(note)가 흔적만 남깁니다.
// 한 번 사면 그 물건은 내 것이 되고 상점에서 사라집니다 (그 여정 동안도, 그 뒤로도).
//   [id, 이름, 부위, 아이콘, 격, 성격, 흔적 한 줄, 골드 획득 %(없으면 생략)]
//   격은 4~6 — 어느 지역에서 만나든 이 격의 성능 · 값입니다 (1지역에서 사려면 한참 모아야 하고, 사면 한동안 쓸 물건).
//   성능은 그 격 지역의 가장 센 일반 화신 것의 1.2배, 값은 priceFor(격, WARE_PRICE).
const MERCHANT_ID = 'merchant';
const MERCHANT_UNLOCK = 'carbuncle';
const MERCHANT_WARES = [
  // 제4격
  ['ware_hardhat',    '이름이 번진 안전모',   'helm',     '⛑️', 4, 'guard',  '안쪽에 매직으로 쓴 이름이 땀에 번져 읽히지 않는다.'],
  ['ware_flashlight', '아직 켜지는 손전등',   'offhand',  '🔦', 4, 'swift',  '건전지는 새것이다. 누가 갈아 끼웠는지는 모른다.'],
  ['ware_jacket',     '구겨진 협회 점퍼',     'armor',    '🧥', 4, 'guard',  '왼쪽 가슴에 붙은 번호표가 반쯤 뜯겼다.'],
  ['ware_boots',      '끈이 해진 등산화',     'boots',    '🥾', 4, 'swift',  '밑창에 아직 진흙이 마르지 않았다.'],
  ['ware_glove',      '한 짝뿐인 작업 장갑',  'gloves',   '🧤', 4, 'fierce', '나머지 한 짝을 찾는 사람은 없었다.'],
  ['ware_tag',        '번호만 남은 인식표',   'necklace', '🏷️', 5, 'lucky',  '체인에 묻은 얼룩은 닦이지 않는다.', 28],
  // 제5격
  ['ware_watch',      '멈춘 손목시계',        'bracelet', '⌚', 5, 'swift',  '바늘은 새벽 네 시 십 분에서 움직이지 않는다.'],
  ['ware_sign',       '방패 대신 든 표지판',  'offhand',  '🪧', 5, 'thorn',  '「공사중 · 우회하세요」'],
  ['ware_belt',       '탄창이 빈 전술 벨트',  'belt',     '🎒', 5, 'guard',  '고리마다 누군가의 손때가 있다.'],
  ['ware_raincoat',   '찢긴 방수 망토',       'cloak',    '☔', 5, 'ward',   '후드를 쓰면 빗소리 같은 것이 들린다.'],
  // 제6격
  ['ware_bat',        '손잡이만 감긴 쇠파이프', 'weapon', '🔧', 6, 'brutal', '테이프는 새것이고, 쇠는 닳아 있다.'],
  ['ware_ring',       '안쪽에 날짜가 새겨진 반지', 'ring', '💍', 6, 'lucky',  '날짜는 오늘보다 한참 전이다.', 32],
  ['ware_greaves',    '무릎보호대',           'greaves',  '🦵', 6, 'ward',   '한쪽만 심하게 닳았다.'],
  ['ware_scarf',      '색 바랜 목도리',       'shoulder', '🧣', 6, 'leech',  '누가 떠 준 것인지 모르는 채 두르게 된다.']
];
for (const [id, name, slot, icon, r, arch, note, gold] of MERCHANT_WARES) {
  const zone = ZONES.findIndex(z => z.rank === r);
  const level = Math.max(...ENEMIES.filter(e => e.zoneIndex === zone && e.kind === 'normal').map(e => e.level));
  const rank = RANKS.find(x => x.n === r);
  ITEMS.push({
    id, name, slot,
    grade: 'normal', arch, special: null, unique: false, note: note || null,
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

// 무명의 화신 — 마왕을 처음 꺾고 전리품 창에 들어서면 말을 걸어오는 이름 없는 존재 (ui.js 의 maybeNamelessTalk).
// 진짜 화신을 얻을 때까지 대신 화신이 되어 줍니다. 길에서 만나는 적이 아니라서 ENEMIES 에는 없고,
// 화신 창 · 칭호 · 능력치가 적 하나로 다루는 곳에서 쓰이도록 ENEMY_BY_ID 에만 넣습니다.
// 누구인지는 말하지 않습니다.
const NAMELESS_ID = 'nameless';
ENEMY_BY_ID[NAMELESS_ID] = {
  id: NAMELESS_ID, name: '무명', title: '이름이 없는 것', icon: '👤',
  kind: 'normal', arch: 'guard', boss: false, once: false, final: false,
  level: 0, zoneIndex: -1, rank: RANKS.find(r => r.n === 7)   // 화신이 되는 첫 격 (AVATAR_MIN_RANK — 그 상수는 아래에 있어 여기선 못 씁니다)
};

// ---------- 화신 — 내가 그들의 화신이 된다 ----------
// 7격부터의 상대를 꺾으면 아주 드물게(보통 1% · 보스 0.5%) 그 존재가 나를 화신으로 삼습니다.
// 한 번 얻은 화신은 남고, 한 번에 하나만 삼습니다 (「나」 창에서 고름). 삼은 화신의 이름이 내 칭호가 됩니다.
// 아자토스는 「화신을 갖지 못한 유일한 것」이라 화신이 되지 않습니다.
//
// 화신이 주는 능력치는 한쪽으로 크게 기웁니다 — 무언가를 크게 얻는 만큼 무언가를 크게 잃습니다.
// 그래서 어느 화신을 삼을지가 상대 · 지역 · 장비에 따라 고민이 됩니다.
//   mul — 핵심 스탯 배수(생명 · 공격력 · 방어력 · 민첩 · 행운), 장비 · 강화 · 도감까지 다 합친 뒤에 곱합니다
//   add — 특수 능력치(+), 상한은 그대로입니다. 얻는 것(전리품 · 경험치 · 골드)만 마이너스가 될 수 있습니다
const AVATAR_MIN_RANK = 7;
const AVATAR_CHANCE = 0.01;
const AVATAR_CHANCE_BOSS = 0.005;

// 성격마다의 기본 꼴 — 따로 정하지 않은 화신이 생기면 이걸 씁니다 (지금은 전부 아래 AVATAR_UNIQUE 에 따로 있음)
const AVATAR_ARCH = {
  fierce: { mul: { damage: 1.8, life: 0.5, defense: 0.6 },           add: { critRate: 0.15 } },
  guard:  { mul: { defense: 2.0, life: 1.3, damage: 0.5 },           add: { block: 0.15 } },
  leech:  { mul: { damage: 1.25, life: 0.5 },                        add: { lifesteal: 0.15 } },
  swift:  { mul: { dex: 2.0, life: 0.6, defense: 0.6 },              add: { doubleHit: 0.15, doubleTurn: 0.06 } },
  pierce: { mul: { damage: 1.3, dex: 0.5, defense: 0.7 },            add: { pierce: 0.35 } },
  thorn:  { mul: { defense: 1.6, life: 1.2, damage: 0.4 },           add: { reflect: 0.4 } },
  lucky:  { mul: { luck: 2.0, damage: 0.55, life: 0.7 },             add: { findRate: 0.8, goldRate: 1.0 } },
  growth: { mul: { damage: 0.6, defense: 0.6, life: 0.8 },           add: { xpRate: 1.0 } },
  brutal: { mul: { damage: 1.6, dex: 0.4 },                          add: { harmTouch: 0.06, critRate: 0.05 } },
  ward:   { mul: { life: 2.2, damage: 0.5, dex: 0.7 },               add: { regen: 0.04 } }
};

// 보스는 저마다 따로 — 더 극단적으로
const AVATAR_SIGNATURE = {
  yisunsin: { mul: { defense: 2.6, life: 1.5, damage: 0.6, dex: 0.6 }, add: { block: 0.25, survive: 1 } },          // 아직 열두 척이 남았다
  cheonma:  { mul: { damage: 2.6, life: 0.35, defense: 0.3 },         add: { critRate: 0.25, pierce: 0.3 } },         // 하늘 아래 마는 하나뿐
  imugi:    { mul: { life: 1.6, damage: 0.4, dex: 0.5 },              add: { xpRate: 2.0 } },                         // 천 년을 기다려 오르려는
  heracles: { mul: { life: 1.8, dex: 0.4, luck: 0.4 },                add: { survive: 2, regen: 0.06 } },           // 열두 번 죽고 돌아온
  michael:  { mul: { damage: 0.7, luck: 0.3 },                        add: { reflect: 0.7, block: 0.2 } },            // 용을 떨어뜨린
  lucifer:  { mul: { damage: 2.0, dex: 2.0, life: 0.3, defense: 0.3 }, add: { critRate: 0.2 } },                      // 가장 빛나던 별, 가장 깊이 떨어진
  hades:    { mul: { life: 1.5, dex: 0.6 },                           add: { lifesteal: 0.3, survive: 1, xpRate: -0.5 } }, // 돌아온 자가 없는 문의 주인
  zeus:     { mul: { damage: 1.6, defense: 0.4, life: 0.6 },          add: { harmTouch: 0.1, doubleTurn: 0.2 } },     // 올림포스의 마지막 말
  // ── 격 재편으로 들어온 보스 ──
  arthur:      { mul: { defense: 1.6, damage: 1.5, dex: 0.5, luck: 0.6 },        add: { block: 0.15 } },             // 바위에서 검을 뽑은 왕
  merlin:      { mul: { damage: 0.5, life: 0.7 },                                add: { xpRate: 1.2, reflect: 0.3 } }, // 왕을 만든 마법사
  sanctdragon: { mul: { defense: 2.4, life: 1.6, dex: 0.4, damage: 0.6 },        add: { reflect: 0.25 } },           // 천 년을 한 자리에서
  tiamat:      { mul: { life: 2.2, damage: 1.2, dex: 0.35, luck: 0.4 },          add: { regen: 0.05 } },             // 신들을 낳고 신들에게 갈라진 바다
  cthulhu:     { mul: { life: 1.8, damage: 1.4, dex: 0.3, defense: 0.6 },        add: { regen: 0.04 } }              // 죽지 않고 잠들어 있을 뿐인
};

// 하나하나 따로 — 칭호와 어울리게. [mul(배수), add(+)] — 격 · 종류에 따라 조금 더 극단으로 (avatarProfile)
//   mul: life 생명 · damage 공격력 · defense 방어력 · dex 민첩 · luck 행운
//   add: critRate 크리 · doubleHit 이중타격 · pierce 관통 · lifesteal 흡혈 · block 막기 · reflect 반사 · regen 재생 · survive 생존
//        harmTouch 일격 · doubleTurn 연속 턴 · findRate 전리품 · xpRate 경험치 · goldRate 골드 · stoneRate 강화석
const AVATAR_UNIQUE = {
  // ── 무명 — 진짜 화신이 올 때까지 ──
  nameless:      [{ life: 1.1, defense: 1.1, damage: 1.1 }, {}],                                          // 이름이 없는 것
  // ── 7격 · 알렉산드리아 대도서관 ──
  storyteller:   [{ damage: 0.6, dex: 0.7 },               { xpRate: 0.8, findRate: 0.4 }],             // 가장 오래된 목소리
  scribe:        [{ defense: 1.4, dex: 0.4, luck: 0.5 },    { stoneRate: 0.6 }],                         // 베껴 쓰다 눈이 먼
  archimedes:    [{ damage: 1.5, dex: 0.5, life: 0.7 },     { pierce: 0.3 }],                            // 지렛대를 든 자
  hypatia:       [{ defense: 1.3, damage: 0.5 },            { xpRate: 0.6, regen: 0.03 }],               // 마지막 도서관장
  sunzi:         [{ dex: 1.6, damage: 0.45 },               { block: 0.25, doubleTurn: 0.1 }],           // 싸우지 않고 이기는 법
  davinci:       [{ luck: 1.6, life: 0.6, defense: 0.7 },   { stoneRate: 0.8 }],                         // 다 그리지 못한 설계도
  herodotos:     [{ damage: 0.65, life: 0.75 },             { findRate: 0.6, xpRate: 0.4 }],             // 처음으로 기록한 자
  joan:          [{ damage: 1.5, defense: 0.5, life: 0.7 }, { survive: 1, critRate: 0.1 }],            // 불타는 오를레앙의 처녀
  spartacus:     [{ damage: 1.6, life: 1.2, defense: 0.4, luck: 0.5 }, { doubleHit: 0.15 }],             // 사슬을 끊은 검투사
  genghis:       [{ dex: 1.7, defense: 0.5, life: 0.8 },    { doubleHit: 0.15, goldRate: 0.5 }],         // 지평선을 국경으로 삼은
  alexander:     [{ damage: 1.7, life: 0.5, luck: 0.6 },    { pierce: 0.25 }],                           // 온 세계가 좁았던 자
  trismegistus:  [{ damage: 0.5, dex: 0.6 },                { reflect: 0.35, lifesteal: 0.12, regen: 0.03 }], // 위에서와 같이 아래에서도
  // ── 10격 · 천하제일 비무대 ──
  nangin:        [{ damage: 1.5, defense: 0.55, life: 0.8 }, { critRate: 0.12, goldRate: 0.4 }],        // 값만 맞으면 누구든 벤다
  gaebang:       [{ dex: 1.4, damage: 0.55, defense: 0.7 }, { findRate: 0.7 }],                          // 천하의 소문은 거지가 먼저 안다
  emei:          [{ damage: 1.3, life: 0.55 },              { critRate: 0.2 }],                          // 자비로운 얼굴, 자비 없는 비수
  shaolin:       [{ defense: 2.2, life: 1.3, dex: 0.45, damage: 0.7 }, {}],                              // 쇠를 두드려 몸을 만든
  dalma:         [{ defense: 1.8, dex: 0.3, damage: 0.6 },  { regen: 0.05, survive: 1 }],              // 벽을 보고 아홉 해
  wudang:        [{ dex: 1.4, damage: 0.5 },                { reflect: 0.35 }],                          // 부드러움이 굳셈을 이긴다
  tangga:        [{ life: 0.5, defense: 0.6 },              { pierce: 0.3, doubleHit: 0.12, harmTouch: 0.03 }], // 손끝마다 다른 독
  hwasan:        [{ dex: 1.3, life: 0.6, defense: 0.6 },    { doubleHit: 0.2, critRate: 0.1 }],          // 검 끝에 매화가 핀다
  zhangsanfeng:  [{ damage: 0.55, luck: 0.6 },              { block: 0.2, reflect: 0.25, lifesteal: 0.1 }], // 태극을 처음 그린 자
  namgung:       [{ damage: 1.8, dex: 0.6, luck: 0.5, defense: 0.7 }, {}],                               // 창공을 가르는 세가의 검
  bukhae:        [{ defense: 1.7, dex: 0.5, damage: 0.75 }, { block: 0.12 }],                            // 얼음 궁에서 내려온
  // ── 11격 · 만년설 덮인 천산 ──
  yeongsa:       [{ life: 1.8, dex: 0.5, damage: 0.7 },     { regen: 0.04 }],                            // 내단을 품고 똬리를 튼
  geumjam:       [{ life: 0.5, luck: 0.6 },                 { lifesteal: 0.2, pierce: 0.2 }],            // 독충을 다 잡아먹고 남은 하나
  geumseom:      [{ luck: 1.6, damage: 0.5, dex: 0.6 },     { goldRate: 1.5 }],                          // 동전을 뱉으면 복이 온다
  sansam:        [{ life: 1.4, damage: 0.45 },              { regen: 0.06, xpRate: 0.3 }],               // 사람 꼴을 하고 뛰어다니는 뿌리
  gumiho:        [{ dex: 1.5, luck: 1.4, defense: 0.45, life: 0.7 }, { lifesteal: 0.2 }],                // 천 년을 채우면 사람이 된다
  bingjam:       [{ defense: 1.5, damage: 0.5, dex: 0.7 },  { block: 0.2 }],                             // 만년설 속에서 실을 토하는 누에
  ungnyeo:       [{ life: 1.6, dex: 0.4, luck: 0.6 },       { survive: 1 }],                          // 쑥과 마늘로 백 일을 버틴 곰
  sangun:        [{ damage: 1.7, defense: 0.5, luck: 0.5 }, { critRate: 0.15 }],                         // 감히 이름으로 부르지 못하는 호랑이
  geumsijo:      [{ dex: 1.9, life: 0.5, defense: 0.6 },    { doubleTurn: 0.12, pierce: 0.15 }],         // 용을 잡아먹는 금빛 날개
  hwarin:        [{ damage: 1.4, life: 0.6, luck: 0.7 },    { reflect: 0.2 }],                           // 불을 밟고 다니는 기린
  yeonggu:       [{ defense: 2.4, life: 1.5, dex: 0.3, damage: 0.6 }, {}],                               // 만 년을 등에 지고 걷는 거북
  bonghwang:     [{ damage: 0.4 },                          { findRate: 0.8, xpRate: 0.5, regen: 0.03 }], // 태평한 세상에만 내려앉는 새
  // ── 13격 · 엘리시온 평원 ──
  theseus:       [{ dex: 1.3, damage: 0.7, luck: 0.6 },     { survive: 1 }],                          // 돌아오는 길을 아는
  perseus:       [{ life: 0.6, defense: 0.6 },              { harmTouch: 0.07, critRate: 0.1 }],         // 보지 않고 벤 자
  odysseus:      [{ luck: 1.5, damage: 0.6 },               { survive: 1, findRate: 0.4 }],            // 열 해를 헤매고도 돌아간
  atalanta:      [{ dex: 2.3, life: 0.55, defense: 0.55, damage: 0.8 }, { doubleTurn: 0.1 }],            // 누구보다 빨랐던
  enkidu:        [{ life: 1.9, defense: 1.3, luck: 0.4 },   { xpRate: -0.3 }],                           // 흙으로 빚어진 벗
  gilgamesh:     [{ damage: 1.6, defense: 1.3, life: 0.6, luck: 0.6 }, { goldRate: 0.4 }],               // 영생을 놓친 왕
  hector:        [{ defense: 1.8, damage: 0.55 },           { block: 0.2, survive: 1 }],              // 질 것을 알고도 나선
  achilles:      [{ defense: 2.6, damage: 1.4, life: 0.4 }, {}],                                         // 발뒤꿈치 하나만 사람인
  cuchulainn:    [{ damage: 1.3, life: 0.5 },               { doubleHit: 0.2, critRate: 0.12 }],         // 빛의 아이
  beowulf:       [{ damage: 1.9, defense: 0.5, dex: 0.7 },  { harmTouch: 0.05 }],                        // 맨손으로 괴물을 찢은
  arjuna:        [{ dex: 0.6, life: 0.7 },                  { critRate: 0.25, pierce: 0.2 }],            // 과녁의 눈만 보이는
  siegfried:     [{ defense: 2.2, luck: 0.4, dex: 0.6 },    { block: 0.15 }],                            // 용의 피를 뒤집어쓴 자
  // ── 14격 · 일곱 번째 하늘 ──
  guardianangel: [{ damage: 0.5 },                          { survive: 1, block: 0.15 }],              // 한 사람 곁에 하나씩
  principality:  [{ defense: 1.6, life: 1.3, dex: 0.5, luck: 0.6 }, {}],                                 // 나라 하나를 맡은
  powerangel:    [{ damage: 1.6, defense: 0.6, life: 0.8 }, { pierce: 0.25 }],                           // 악을 쫓는 첫 번째 칼
  trumpetangel:  [{ life: 0.55, defense: 0.7 },             { doubleTurn: 0.15, critRate: 0.1 }],        // 일곱 나팔 중 첫째를 부는
  raphael:       [{ life: 1.3, damage: 0.45 },              { regen: 0.07, lifesteal: 0.15 }],           // 신이 고치신다
  virtueangel:   [{ luck: 1.6, damage: 0.55 },              { findRate: 0.7, survive: 1 }],            // 기적을 맡은
  dominion:      [{ damage: 1.3, defense: 1.3, life: 1.2, dex: 0.4, luck: 0.4 }, { xpRate: -0.3 }],      // 천사들을 다스리는 천사
  throneangel:   [{ defense: 1.4, damage: 0.35 },           { reflect: 0.45 }],                          // 눈으로 가득한 바퀴
  gabriel:       [{ dex: 1.7, defense: 0.5, life: 0.7 },    { doubleTurn: 0.12, xpRate: 0.5 }],          // 소식을 전하러 내려온
  cherub:        [{ damage: 1.5, dex: 0.6, luck: 0.5 },     { block: 0.15 }],                            // 에덴의 동쪽에서 불칼을 든
  seraph:        [{ dex: 1.4, damage: 0.5 },                { block: 0.25, reflect: 0.15 }],             // 여섯 날개로 얼굴을 가린
  // ── 15격 · 얼어붙은 코키토스 ──
  legion:        [{ damage: 0.7, defense: 0.6 },            { doubleHit: 0.25, doubleTurn: 0.08 }],      // 우리는 많다
  moloch:        [{ damage: 1.8, life: 0.45 },              { goldRate: 0.5 }],                          // 불타는 제단 위의 황소
  baphomet:      [{ damage: 0.55, life: 0.7 },              { xpRate: 1.0, stoneRate: 0.5 }],            // 녹이고 굳히는 염소 머리 우상
  azazel:        [{ defense: 0.5, luck: 0.6 },              { pierce: 0.35, critRate: 0.12 }],           // 사람에게 칼 벼리는 법을 가르친
  beelzebub:     [{ life: 0.5, defense: 0.7 },              { lifesteal: 0.22, doubleHit: 0.18 }],       // 파리 떼의 왕
  mephisto:      [{ life: 0.5, defense: 0.6 },              { goldRate: 2.0, findRate: 0.5 }],           // 영혼을 값으로 쳐주는 상인
  astaroth:      [{ dex: 1.4, life: 0.6, luck: 0.7 },       { pierce: 0.25 }],                           // 독사를 타고 오는 공작
  belial:        [{ damage: 2.0, dex: 1.3, luck: 0.3, defense: 0.7 }, { xpRate: -0.4 }],                 // 불의 전차를 탄 무가치한 자
  asmodeus:      [{ luck: 2.0, defense: 0.45, life: 0.7 },  { findRate: 0.6, critRate: 0.1 }],           // 솔로몬의 반지를 빼앗은
  paimon:        [{ defense: 1.6, damage: 1.3, dex: 0.45 }, { xpRate: -0.3 }],                           // 서쪽을 다스리는 지옥의 왕
  lilith:        [{ dex: 1.8, defense: 0.45, life: 0.7 },   { lifesteal: 0.15 }],                        // 에덴을 먼저 떠난 자
  // ── 16격 · 이그드라실의 가지 ──
  hermes:        [{ dex: 2.0, life: 0.5, defense: 0.6 },    { doubleTurn: 0.15, goldRate: 0.5 }],        // 경계를 넘나드는 전령
  bastet:        [{ dex: 1.4, damage: 1.2, life: 0.6, luck: 0.7 }, { block: 0.2 }],                      // 집과 전쟁을 함께 지키는
  anubis:        [{ life: 0.55, dex: 0.7 },                 { harmTouch: 0.07, pierce: 0.2 }],           // 심장의 무게를 재는 자
  artemis:       [{ dex: 1.5, defense: 0.5, life: 0.7 },    { critRate: 0.2 }],                          // 달과 사냥의 주인
  loki:          [{ luck: 2.2, damage: 0.5, defense: 0.6 }, { reflect: 0.3, findRate: 0.5 }],            // 묶여서도 웃는 자
  susanoo:       [{ damage: 1.7, luck: 0.4, defense: 0.6 }, { survive: 1 }],                           // 쫓겨나서 영웅이 된
  thor:          [{ damage: 2.0, dex: 0.45, luck: 0.6 },    { harmTouch: 0.05 }],                        // 천둥을 손에 쥔 자
  ares:          [{ damage: 1.6, defense: 0.35, life: 0.7 }, { doubleHit: 0.15, lifesteal: 0.1 }],       // 전쟁 그 자체
  poseidon:      [{ damage: 1.6, life: 1.4, dex: 0.4, luck: 0.5 }, {}],                                  // 땅을 흔드는 자
  amaterasu:     [{ damage: 0.6, dex: 0.7 },                { regen: 0.06, xpRate: 0.5 }],               // 동굴에서 나온 해
  isis:          [{ damage: 0.5 },                          { survive: 1, regen: 0.05, findRate: 0.3 }], // 흩어진 것을 다시 모으는
  // ── 18격 · 올림포스 정상 (타이탄은 이제 17격 태초) ──
  titanmyth:     [{ defense: 1.9, life: 1.3, damage: 0.55, dex: 0.35 }, { block: 0.14 }],                   // 신에게 진 자들
  osiris:        [{ life: 1.4, damage: 0.45, dex: 0.6 },    { survive: 2 }],                          // 찢겨서도 다시 맞춰진
  izanagi:       [{ dex: 1.4, life: 0.6, luck: 0.6 },       { survive: 1 }],                          // 황천에서 돌아온 자
  ra:            [{ damage: 1.3, defense: 0.6, dex: 0.6 },  { regen: 0.07 }],                            // 매일 세계를 다시 켜는 자
  vishnu:        [{ life: 1.3, damage: 0.6, dex: 0.6 },     { xpRate: 1.0 }],                            // 열 번 세상에 내려온
  indra:         [{ dex: 1.6, life: 0.5, defense: 0.6 },    { critRate: 0.25 }],                         // 천 개의 눈으로 보는 자
  hwanin:        [{ damage: 0.5, defense: 0.7 },            { findRate: 0.8, xpRate: 0.6 }],             // 하늘에서 내려다본 자
  jadeemperor:   [{ defense: 1.5, dex: 0.45, damage: 0.7 }, { goldRate: 1.2 }],                          // 하늘 관청의 주인
  shiva:         [{ damage: 1.5, life: 0.35, defense: 0.5 }, { harmTouch: 0.1 }],                        // 춤 한 번에 세계를 끝내는
  odin:          [{ luck: 1.5, life: 0.55, dex: 0.7 },      { critRate: 0.2, xpRate: 0.6 }],             // 한쪽 눈으로 모든 것을 본
  quetzalcoatl:  [{ dex: 1.6, defense: 0.5 },               { regen: 0.04, doubleHit: 0.1 }],            // 깃털 달린 뱀
  ahuramazda:    [{ damage: 1.3, luck: 0.5, dex: 0.6 },     { survive: 1 }],                           // 꺼지지 않는 불
  // ── 19 · 20격 · 가라앉은 르뤼에와 궁극의 혼돈 ──
  dagon:         [{ life: 2.0, dex: 0.4 },                  { lifesteal: 0.12 }],                        // 깊은 곳의 아버지
  yig:           [{ life: 0.55, luck: 0.6 },                { pierce: 0.3, doubleHit: 0.15 }],           // 뱀들의 아버지
  ithaqua:       [{ dex: 2.2, defense: 0.4, life: 0.7 },    { doubleTurn: 0.12 }],                       // 바람을 타고 걷는 자
  chaugnar:      [{ life: 1.4, dex: 0.35 },                 { lifesteal: 0.28 }],                        // 피를 빠는 코끼리 신
  shubniggurath: [{ life: 1.6, damage: 0.55 },              { regen: 0.07, doubleHit: 0.1 }],            // 천 마리 새끼를 거느린 검은 염소
  hastur:        [{ damage: 1.5, life: 0.45, luck: 0.5 },   { critRate: 0.25 }],                         // 세 번 부르면 오는 황의 왕
  tsathoggua:    [{ defense: 2.2, life: 1.6, dex: 0.2, damage: 0.8 }, {}],                               // 움직이기 싫어하는 두꺼비 신
  glaaki:        [{ life: 0.5, defense: 0.6 },              { pierce: 0.4, harmTouch: 0.04 }],           // 가시로 꿈을 꿰는 자
  yogsothoth:    [{ defense: 1.4, damage: 0.4, dex: 0.6 },  { block: 0.25, reflect: 0.3 }],              // 문이자 열쇠이며 문지기인
  abhoth:        [{ damage: 0.5, defense: 0.7 },            { regen: 0.08, xpRate: 0.6 }],               // 끝없이 새것을 게워내는 웅덩이
  voidlordmyth:  [{ damage: 1.7, defense: 0.3, life: 0.55 }, { pierce: 0.4 }],                              // 아무것도 아닌 것의 왕
  nyarlathotep:  [{ luck: 2.0, life: 0.5, defense: 0.5 },   { critRate: 0.15, doubleTurn: 0.1 }],          // 천 개의 가면을 쓴 기어오는 혼돈
  // ── 격 재편으로 들어온 화신 ──
  // 7격 · 오호대장군
  guanyu:        [{ damage: 1.8, defense: 1.2, dex: 0.5, luck: 0.5 }, { critRate: 0.12 }],               // 다섯 관문을 지나 천 리를 홀로 간
  zhangfei:      [{ damage: 1.9, life: 1.2, defense: 0.45, luck: 0.4 }, { harmTouch: 0.04 }],            // 다리 위의 호통 한 번
  zhaoyun:       [{ dex: 1.6, defense: 1.4, damage: 0.6 },    { block: 0.15, survive: 1 }],              // 어린 주군을 품고 대군을 뚫은
  machao:        [{ dex: 1.7, damage: 1.3, defense: 0.4, life: 0.7 }, { lifesteal: 0.1 }],               // 사자 투구를 쓴 서량의 금마초
  huangzhong:    [{ damage: 1.2, dex: 0.5, life: 0.7 },       { critRate: 0.2, pierce: 0.15 }],            // 일흔에도 활을 놓지 않은
  // 8격 · 원탁의 성 카멜롯
  auraknight:    [{ damage: 1.7, defense: 0.6, luck: 0.6 },   { critRate: 0.15 }],                         // 검 끝에 오러를 세운
  paladin:       [{ defense: 1.6, life: 1.4, damage: 0.55, dex: 0.6 }, { regen: 0.03 }],                 // 기도로 검을 벼린
  lancelot:      [{ damage: 1.6, dex: 1.4, luck: 0.4, defense: 0.6 }, { doubleHit: 0.12 }],             // 원탁에서 가장 뛰어났던
  templar:       [{ defense: 1.8, damage: 0.8, dex: 0.5, luck: 0.5 }, { block: 0.12, goldRate: 0.3 }],  // 성지를 지키다 이단이 된 (기사단은 돈도 맡았습니다)
  dragonknight:  [{ dex: 1.8, damage: 1.2, life: 0.6, defense: 0.5 }, { doubleTurn: 0.08 }],             // 용을 타고 내려오는
  gawain:        [{ damage: 2.0, life: 0.6, dex: 0.6 },       { harmTouch: 0.05 }],                        // 해가 높을수록 세지는
  berserker:     [{ damage: 2.1, life: 1.2, defense: 0.3, luck: 0.4 }, { lifesteal: 0.12 }],             // 곰가죽을 쓰고 고통을 잊은
  galahad:       [{ defense: 1.5, life: 1.3, damage: 0.5, luck: 1.3 }, { regen: 0.04 }],                 // 성배에 닿은 단 한 사람
  greenknight:   [{ life: 1.8, damage: 0.6, dex: 0.6 },       { survive: 1, xpRate: 0.4 }],              // 목을 베여도 제 머리를 주워 드는
  tristan:       [{ dex: 1.5, luck: 1.3, defense: 0.5, life: 0.6 }, { doubleHit: 0.12 }],                // 바다 건너 슬픈 사랑을 한
  roland:        [{ defense: 1.9, life: 1.3, dex: 0.4, luck: 0.4 }, { block: 0.2 }],                     // 뿔나팔을 너무 늦게 분
  percival:      [{ luck: 2.0, damage: 0.55, defense: 0.6 },  { findRate: 0.7 }],                          // 숲에서 자라 성배를 찾아 나선
  elcid:         [{ damage: 1.5, defense: 1.2, life: 0.5, luck: 0.6 }, { survive: 1 }],                // 죽어서도 말에 올라 싸운
  bedivere:      [{ defense: 1.7, damage: 0.6, dex: 0.7 },    { block: 0.15, stoneRate: 0.4 }],            // 마지막까지 왕 곁에 남은
  robinhood:     [{ dex: 1.6, damage: 0.7, life: 0.6 },       { critRate: 0.18, goldRate: 0.6 }],          // 부자의 것을 털어 숲에 숨은 명궁
  mordred:       [{ damage: 1.8, luck: 0.3, defense: 0.5 },   { pierce: 0.3 }],                            // 왕을 찌른 원탁의 마지막 자리
  ladyofthelake: [{ damage: 0.5, defense: 0.8 },              { regen: 0.06, findRate: 0.5 }],             // 엑스칼리버를 건네고 다시 받아 간
  // 9격 · 안개 너머의 아발론
  archmage:      [{ damage: 2.2, life: 0.4, defense: 0.45 },  { critRate: 0.15 }],                         // 마나로 별을 떨어뜨리는
  elementalist:  [{ damage: 1.6, dex: 0.6, life: 0.6 },       { harmTouch: 0.04, doubleHit: 0.08 }],       // 불과 얼음을 한 손에 쥔
  salamander:    [{ damage: 1.7, defense: 0.5, life: 0.7 },   { critRate: 0.12 }],                         // 불 속에서만 사는
  summoner:      [{ defense: 1.5, damage: 0.6, dex: 0.6 },    { doubleTurn: 0.12 }],                       // 이름을 불러 다른 세계의 것을 끌어오는
  runemage:      [{ defense: 1.5, life: 1.2, dex: 0.5, damage: 0.7 }, { reflect: 0.2 }],                 // 돌에 새긴 글자로 싸우는
  undine:        [{ life: 1.6, damage: 0.5, defense: 0.7 },   { regen: 0.05 }],                            // 사랑을 잃으면 물로 돌아가는
  alchemist:     [{ damage: 0.6, life: 0.7 },                 { xpRate: 0.9, stoneRate: 0.6 }],            // 납을 금으로 바꾸려다 자신을 바꾼
  druid:         [{ life: 1.7, damage: 0.5, dex: 0.7 },       { regen: 0.06 }],                            // 떡갈나무에게 말을 거는
  faust:         [{ luck: 1.8, life: 0.5, defense: 0.6 },     { findRate: 0.6, xpRate: 0.5 }],             // 악마에게 영혼을 걸고 모든 것을 안
  sylph:         [{ dex: 2.1, life: 0.5, defense: 0.5 },      { doubleTurn: 0.1 }],                        // 만질 수 없는 것
  warlock:       [{ damage: 1.6, life: 0.45, luck: 0.6 },     { lifesteal: 0.2 }],                         // 금지된 책을 끝까지 읽은
  babayaga:      [{ defense: 1.3, luck: 1.3, dex: 0.4, life: 0.7 }, { pierce: 0.2 }],                    // 닭다리 오두막에 사는 숲의 마녀
  gnome:         [{ defense: 2.2, life: 1.4, dex: 0.3, damage: 0.6 }, {}],                               // 땅속을 헤엄치듯 다니는
  circe:         [{ luck: 1.5, defense: 0.6, damage: 0.6 },   { lifesteal: 0.12, findRate: 0.4 }],         // 사람을 돼지로 바꾸는 섬의 마녀
  morgan:        [{ damage: 1.6, dex: 1.3, defense: 0.45, life: 0.6 }, { reflect: 0.2 }],                // 아발론을 다스리는 마녀
  // 10격 · 오대세가
  moyong:        [{ defense: 1.3, damage: 0.6, dex: 0.8 },    { reflect: 0.4 }],                           // 받은 수를 그대로 돌려주는
  jegal:         [{ defense: 1.6, dex: 1.2, damage: 0.5, life: 0.7 }, { block: 0.15, xpRate: 0.3 }],     // 진법과 기관으로 싸우는
  paeng:         [{ damage: 2.0, dex: 0.5, defense: 0.6 },    { harmTouch: 0.05 }],                        // 도 한 자루로 하북을 지킨
  // 11격 · 사신수
  azuredragon:   [{ defense: 1.6, damage: 1.3, dex: 0.5, luck: 0.5 }, { reflect: 0.2 }],                 // 동쪽 하늘을 지키는 푸른 용
  whitetiger:    [{ damage: 1.9, dex: 1.2, defense: 0.4, life: 0.6 }, { critRate: 0.15 }],               // 서쪽 하늘을 지키는 흰 범
  vermilionbird: [{ damage: 1.5, life: 0.6, defense: 0.6 },   { regen: 0.04, harmTouch: 0.03 }],           // 남쪽 하늘을 지키는 붉은 새
  blacktortoise: [{ defense: 2.3, life: 1.6, dex: 0.3, damage: 0.6 }, { regen: 0.03 }],                  // 북쪽 하늘을 지키는 거북과 뱀
  // 12격 · 잊혀진 성역 (옛 4격의 짐승들 · 헤라클레스의 열두 과업)
  unicorn:       [{ life: 1.6, defense: 1.2, damage: 0.5, luck: 0.6 }, { regen: 0.05 }],                 // 순수한 자에게만 보이는
  pegasus:       [{ dex: 2.2, defense: 0.5, life: 0.6 },      { doubleTurn: 0.1 }],                        // 땅을 딛지 않는 말
  phoenix:       [{ damage: 0.6, defense: 0.6 },              { survive: 1, regen: 0.05, xpRate: 0.5 }], // 타 죽어야 사는 새
  hippogriff:    [{ dex: 1.8, damage: 1.2, life: 0.6, defense: 0.5 }, { doubleHit: 0.1 }],               // 그리핀이 암말을 사랑해서 난
  cerberus:      [{ damage: 1.7, defense: 1.3, dex: 0.5, luck: 0.4 }, { doubleHit: 0.15 }],              // 문을 지키는 세 머리
  nemeanlion:    [{ defense: 2.6, damage: 1.1, dex: 0.4, luck: 0.4 }, {}],                               // 어떤 칼도 들지 않는 가죽
  ceryneianhind: [{ dex: 2.0, luck: 1.4, damage: 0.4, defense: 0.6 }, { findRate: 0.5 }],                // 황금 뿔에 청동 발굽을 단
  erymanthianboar: [{ damage: 1.9, life: 1.3, dex: 0.4, luck: 0.5 }, { harmTouch: 0.04 }],               // 산을 갈아엎고 내려온
  stymphalianbirds: [{ dex: 1.3, life: 0.5, defense: 0.6 },   { pierce: 0.3, doubleHit: 0.12 }],           // 청동 깃을 화살처럼 쏘는
  cretanbull:    [{ damage: 1.8, life: 1.3, dex: 0.4, defense: 0.6 }, { critRate: 0.1 }],                // 바다에서 올라와 섬을 짓밟은
  mares:         [{ damage: 1.6, dex: 1.2, defense: 0.4, luck: 0.5 }, { lifesteal: 0.15 }],              // 사람을 먹고 자란
  geryon:        [{ life: 1.8, defense: 1.6, dex: 0.35, damage: 0.7 }, {}],                              // 몸 셋이 한 허리에 붙은 거인
  ladon:         [{ defense: 1.4, life: 1.4, dex: 0.4, damage: 0.6 }, { regen: 0.04, goldRate: 0.4 }],   // 황금 사과나무를 감고 잠들지 않는
  sphinx:        [{ defense: 1.4, damage: 0.6, dex: 0.7 },    { xpRate: 0.6, reflect: 0.2 }],              // 답하지 못하면 잡아먹는
  kraken:        [{ life: 1.7, damage: 1.3, dex: 0.35, defense: 0.6 }, { lifesteal: 0.15 }],             // 배를 통째로 끌고 내려가는
  // 14격 · 일곱 대천사
  uriel:         [{ damage: 1.7, life: 0.6, defense: 0.6 },   { pierce: 0.25 }],                           // 신의 불꽃이라는 이름의
  raguel:        [{ defense: 1.6, damage: 0.7, dex: 0.6 },    { reflect: 0.3 }],                           // 천사들의 잘못을 따지는
  sariel:        [{ dex: 1.8, life: 0.6, damage: 0.7 },       { doubleTurn: 0.12 }],                       // 달의 길을 가르친
  remiel:        [{ life: 1.5, damage: 0.5, dex: 0.7 },       { survive: 1, regen: 0.04 }],              // 다시 일어날 자들을 지키는
  // 15격 · 솔로몬 72 마신의 아홉 왕
  bael:          [{ dex: 1.8, defense: 0.5, life: 0.6 },      { doubleHit: 0.12, findRate: 0.3 }],         // 세 머리로 말하는 지옥의 첫 왕
  beleth:        [{ damage: 1.8, life: 1.2, defense: 0.4, luck: 0.5 }, { critRate: 0.12 }],              // 나팔 소리 속에 창백한 말을 타고 오는
  purson:        [{ life: 1.6, defense: 1.3, dex: 0.4, damage: 0.7 }, { xpRate: 0.4 }],                  // 사자 얼굴로 곰을 타고 오는
  vine:          [{ damage: 1.9, defense: 0.45, life: 0.7 },  { harmTouch: 0.05 }],                        // 폭풍을 부르고 탑을 허무는
  balam:         [{ defense: 1.5, luck: 1.3, damage: 0.5, dex: 0.6 }, { findRate: 0.5 }],                // 지나간 일과 올 일을 말하는
  zagan:         [{ defense: 1.3, damage: 0.6, dex: 0.7 },    { goldRate: 1.5, reflect: 0.15 }],           // 쇠를 금화로, 물을 포도주로 바꾸는
  // 16격 · 올림포스 12신
  hera:          [{ defense: 1.6, life: 1.3, dex: 0.5, luck: 0.6 }, { reflect: 0.3 }],                   // 신들의 여왕
  athena:        [{ defense: 1.9, damage: 1.2, dex: 0.6, luck: 0.6 }, { block: 0.15 }],                  // 지혜와 싸움을 함께 쥔
  apollo:        [{ dex: 1.4, life: 0.7, defense: 0.6 },      { critRate: 0.15, regen: 0.04 }],            // 빛과 음악과 활의 신
  aphrodite:     [{ luck: 2.0, defense: 0.45, damage: 0.6 },  { lifesteal: 0.15, goldRate: 0.4 }],         // 바다 거품에서 태어난
  hephaestus:    [{ defense: 2.0, damage: 1.2, dex: 0.35, luck: 0.5 }, { stoneRate: 0.8 }],              // 올림포스의 대장장이
  demeter:       [{ life: 1.8, damage: 0.5, dex: 0.7 },       { regen: 0.06, xpRate: 0.3 }],               // 곡식과 대지의 어머니
  dionysus:      [{ damage: 1.6, luck: 1.3, defense: 0.4, dex: 0.6 }, { lifesteal: 0.12 }],              // 포도주와 광기의 신
  // 17격 · 태초의 바다
  jormungandr:   [{ life: 2.0, defense: 1.3, dex: 0.3, damage: 0.7 }, { lifesteal: 0.15 }],              // 세계를 한 바퀴 감고 제 꼬리를 문
  fenrir:        [{ damage: 2.2, dex: 1.2, defense: 0.35, luck: 0.4 }, { critRate: 0.15 }],              // 끊어지지 않는 끈에 묶여 때를 기다리는
  apophis:       [{ dex: 1.5, damage: 1.2, life: 0.55, luck: 0.6 }, { pierce: 0.3 }],                    // 밤마다 해를 삼키려는 뱀
  vritra:        [{ defense: 2.1, life: 1.5, damage: 0.5, dex: 0.5 }, { block: 0.12 }],                  // 세상의 물을 가둔 용
  orochi:        [{ damage: 1.8, life: 1.3, dex: 0.4, luck: 0.4 }, { doubleHit: 0.15 }],                 // 여덟 골짜기를 덮은 여덟 머리
  behemoth:      [{ life: 2.2, defense: 1.5, dex: 0.25, damage: 0.7 }, { regen: 0.04 }],                 // 땅을 통째로 눌러앉은
  leviathan:     [{ damage: 1.9, life: 1.5, dex: 0.3, defense: 0.6 }, { harmTouch: 0.05 }],              // 바다를 통째로 삼킨
  ziz:           [{ dex: 2.2, life: 0.6, defense: 0.5 },      { doubleTurn: 0.12 }],                       // 하늘을 가리는 날개
  typhon:        [{ damage: 2.1, life: 1.3, defense: 0.4, luck: 0.35 }, { doubleHit: 0.15, critRate: 0.1 }], // 괴물들의 아버지
  ymir:          [{ life: 2.4, defense: 1.3, dex: 0.3, damage: 0.6 }, { xpRate: 0.8 }],                  // 주검으로 세계가 지어진 거인
  // 18격 · 트리무르티
  brahma:        [{ damage: 0.55, defense: 0.7 },             { xpRate: 1.4, findRate: 0.3 }],             // 네 얼굴로 세계를 지은
  // 19격 · 가라앉은 르뤼에
  shoggoth:      [{ life: 2.0, defense: 0.6, dex: 0.5 },      { regen: 0.07 }],                            // 주인을 삼키고 남은 원형질
  migo:          [{ dex: 1.4, life: 0.5, defense: 0.6 },      { pierce: 0.35, stoneRate: 0.4 }],           // 유고스에서 날아온 균류
  atlachnacha:   [{ defense: 1.8, life: 1.2, damage: 0.5, dex: 0.6 }, { block: 0.15, reflect: 0.15 }],   // 다 짜면 세상이 끝나는 거미줄을 치는
  cthugha:       [{ damage: 2.2, life: 0.45, defense: 0.45 }, { critRate: 0.18, harmTouch: 0.03 }],        // 포말하우트에서 타오르는 불
  // 20격 · 궁극의 혼돈
  ubbosathla:    [{ life: 1.6, damage: 0.45, dex: 0.6 },      { xpRate: 1.2, regen: 0.04 }],               // 모든 것의 처음이자 끝
  daoloth:       [{ dex: 1.5, damage: 1.2, defense: 0.45, life: 0.6 }, { pierce: 0.4 }],                 // 장막을 찢는 자
  tulzscha:      [{ damage: 1.9, defense: 0.4, luck: 0.6 },   { critRate: 0.2 }],                          // 백치 신의 궁정에서 타는 초록 불꽃
  yibbtstll:     [{ defense: 1.8, life: 1.3, dex: 0.35, damage: 0.6 }, { block: 0.18 }],                 // 시간 바깥에서 참고 기다리는 자
  ghroth:        [{ damage: 1.4, defense: 1.3, dex: 0.4, luck: 0.6 }, { reflect: 0.3, doubleTurn: 0.06 }], // 별을 깨우며 떠도는 행성
  pipers:        [{ dex: 1.6, damage: 0.5, life: 0.6 },       { doubleTurn: 0.15, xpRate: 0.3 }]           // 백치 신 곁에서 피리를 멈추지 않는
};

// 보스 화신만의 고유 능력 — 능력치 기울기 위에 하나씩, 전투의 규칙 자체를 바꿉니다 (game.js 의 simulateBattle).
// 승률 예감도 같은 계산을 쓰므로 그대로 맞습니다.
const AVATAR_POWERS = {
  yisunsin: { name: '배수진',         desc: '생명이 30% 아래로 떨어지면 공격력 ×2 · 막기 +20%' },
  cheonma:  { name: '천마군림',       desc: '싸움의 첫 공격은 반드시 일격 (빗나가지 않고 10배)' },
  imugi:    { name: '승천',           desc: '싸움이 10턴을 넘기면 용이 된다 — 공격력 · 방어력 ×2' },
  heracles: { name: '열두 번의 귀환', desc: '쓰러질 때마다 50% 확률로 생명 20%로 다시 일어선다 (한 싸움에 12번까지)' },
  michael:  { name: '용 떨어뜨리기',  desc: '상대의 생명이 나보다 크면 주는 피해 ×2' },
  lucifer:  { name: '추락하는 별',    desc: '첫 턴 공격력 ×3 — 턴마다 줄어들어 ×0.5까지 떨어진다' },
  hades:    { name: '문 너머로',      desc: '상대의 생명이 15% 아래로 떨어지면 그 자리에서 데려간다' },
  zeus:     { name: '벼락',           desc: '내 턴마다 15% 확률로 방어를 무시하고 상대 생명의 10%를 깎는다' },
  arthur:      { name: '바위의 검',     desc: '내 공격이 빗나가지 않는다' },
  merlin:      { name: '꿈의 안개',     desc: '상대의 공격이 셋에 하나꼴로 더 빗나간다 (상대 명중 ×0.7)' },
  sanctdragon: { name: '천 년의 비늘',  desc: '받는 피해가 30% 줄어든다' },
  tiamat:      { name: '태초의 바다',   desc: '턴마다 공격력이 10%씩 오른다 (×3까지)' },
  cthulhu:     { name: '죽지 않는 잠',  desc: '쓰러지면 한 번, 생명을 모두 채우고 다시 깨어난다' }
};

function canBecomeAvatar(foe) { return !!foe && foe.rank.n >= AVATAR_MIN_RANK && !foe.final; }
// 화신이 되었을 때 결과창 위에 뜨는 화신의 한마디 (ui.js 의 avatarMoment)
const AVATAR_LINES = {
  storyteller: '처음부터 끝까지 들어 줄 사람이 필요했다. 네가 마지막 독자가 되어 다오.',
  scribe: '눈이 멀 때까지 베껴 썼지. 이번엔 네가 가는 길을 받아 적으마.',
  archimedes: '발 디딜 곳만 다오. 세계는 네 쪽으로 기울어 움직일 테니.',
  hypatia: '불타는 서가에서 마지막으로 꺼낸 게 너다. 잘 읽혀라.',
  sunzi: '싸움은 이미 끝나 있었다. 네가 이긴 쪽에 서 있었을 뿐.',
  davinci: '설계도는 아직 덜 그렸다. 네 몸으로 마저 그려 보자.',
  herodotos: '네가 한 일을 있는 그대로 적어 두겠다. 부풀리지는 않는다.',
  joan: '목소리가 시키는 대로 갔을 뿐이야. 이번엔 네가 가는 길을 따라가지.',
  spartacus: '사슬은 끊으라고 있는 것이다. 네 사슬도 같이 끊어 주마.',
  genghis: '지평선 너머가 궁금하지 않나? 말을 내줄 테니 달려라.',
  alexander: '세계가 좁았다. 네가 가는 곳은 얼마나 넓은지 보고 싶군.',
  trismegistus: '위에서와 같이 아래에서도. 네가 선 자리가 곧 그 증거다.',
  yisunsin: '신에게는 아직 열두 척의 배가 남아 있사옵니다. 함께 나아가지요.',
  nangin: '값은 이미 치렀다. 이제부터 내 칼은 네 것이다.',
  gaebang: '소문은 거지가 제일 빠르지. 네 소문은 내가 퍼뜨려 주마.',
  emei: '자비롭게 웃으며 찌를 줄도 안다. 함께 가면 쓸모가 있을 거다.',
  shaolin: '몸은 쇠처럼, 마음은 물처럼. 맞는 법부터 배워라.',
  dalma: '…구 년째 벽만 보다가 너를 봤다. 나쁘지 않군.',
  wudang: '힘을 빼라. 센 것은 부드러운 것에게 진다.',
  tangga: '손끝이 닿기만 해도 족하다. 네 적에게도 알려 주지.',
  hwasan: '매화는 눈 속에서 핀다. 네 앞길이 얼어 있을수록 좋지.',
  zhangsanfeng: '원을 그려 보아라. 끝과 시작이 만나는 곳에 답이 있다.',
  namgung: '남궁의 검은 하늘을 가른다. 네 앞길도 갈라 주지.',
  bukhae: '얼음 궁은 춥지만 사람은 따뜻하더군. 오래 곁에 있어도 되겠나.',
  cheonma: '하늘 아래 마(魔)는 하나뿐이다. 이제 그 하나가 네 안에 산다.',
  yeongsa: '백 년을 똬리 틀고 기다렸다. 이제 움직일 때가 되었군.',
  geumjam: '독충을 다 먹고 남은 건 나 하나. 너도 남는 쪽이 되어라.',
  geumseom: '동전 하나 뱉어 주마. 복이란 건 받는 쪽이 하기 나름이다.',
  sansam: '캐려고 오는 사람은 많았지. 같이 가자고 한 건 네가 처음이다.',
  gumiho: '천 년을 채우면 사람이 된다더군. 네 곁이면 채울 만하겠어.',
  bingjam: '만년설 속에서 실을 뽑았다. 네 길이 끊기지 않게 엮어 주마.',
  ungnyeo: '백 일을 버텼다. 버티는 법이라면 가르쳐 줄 수 있지.',
  sangun: '내 이름을 입에 올리는 자는 없었다. 네가 처음이군. 좋다.',
  geumsijo: '용도 먹고 산 날개다. 높이 나는 법을 알려 주마.',
  hwarin: '불을 밟고 걸어도 풀 한 포기 안 태운다. 네 발밑도 그렇게 해 주지.',
  yeonggu: '만 년을 걸었으니 급할 것 없다. 천천히 가도 도착은 한다.',
  bonghwang: '태평한 세상에만 내려앉는다. 네가 그런 세상을 만들 수 있겠나.',
  imugi: '천 년을 기다렸다. 용이 되는 날이 오늘이라면 네 덕이다.',
  theseus: '미궁에서 돌아오는 길을 안다. 실 끝은 내가 쥐고 있지.',
  perseus: '보지 않고도 벤다. 눈을 감고 따라와라.',
  odysseus: '열 해를 헤매도 돌아간다. 돌아가는 길이라면 내가 안내하마.',
  atalanta: '나보다 빠르면 곁을 내주마. …방금 졌군, 내가.',
  enkidu: '흙에서 나와 흙으로 돌아간다. 그 사이는 벗과 함께면 족하다.',
  gilgamesh: '영생은 놓쳤다. 그래도 잡을 수 있는 건 아직 많더군.',
  hector: '질 줄 알면서 나섰다. 너는 이기려고 나서라. 그 차이가 전부다.',
  achilles: '약점은 하나뿐이다. 그 하나를 네가 지켜 다오.',
  cuchulainn: '빛의 아이는 쓰러지면서도 선 채로 죽는다. 너도 그리 서라.',
  beowulf: '괴물은 맨손으로 찢는 거다. 칼은 그다음 일이고.',
  arjuna: '과녁의 눈만 보인다. 네 눈에도 그것만 보이게 해 주지.',
  siegfried: '용의 피를 뒤집어썼지만 등 한 곳은 젖지 않았다. 그곳은 네가 맡아라.',
  heracles: '열두 번 죽고 열두 번 돌아왔다. 열세 번째도 같이 가자.',
  guardianangel: '한 사람 곁에 하나씩. 이제 네 곁은 내 자리다.',
  principality: '나라 하나를 맡았던 손이다. 네 하나쯤은 거뜬하지.',
  powerangel: '악을 쫓는 첫 칼이 여기 있다. 겨눌 곳을 가리켜라.',
  trumpetangel: '첫 나팔은 아직 불지 않았다. 네가 신호를 줄 때까지.',
  raphael: '신이 고치신다. 나는 그 손을 빌려줄 뿐이다.',
  virtueangel: '기적은 드물어서 기적이다. 네 몫으로 한 번쯤 아껴 두마.',
  dominion: '다스리는 자들을 다스려 왔다. 네 한 몸쯤이야.',
  throneangel: '수많은 눈이 네 길을 보고 있다. 눈 돌릴 곳이 없을 거다.',
  gabriel: '소식을 가져왔다 — 이제 네가 소식이다.',
  cherub: '불칼은 에덴을 지켰다. 이제 네 앞을 지킨다.',
  seraph: '얼굴을 가린 건 눈부셔서가 아니다. 네가 부끄럽지 않게 하려는 거지.',
  michael: '용을 떨어뜨린 칼이다. 네가 겨누는 건 무엇이든 떨어지겠지.',
  legion: '우리의 이름은 군대. 이제 우리 전부가 네 이름이 된다.',
  moloch: '제단은 늘 배고프다. 네가 바치는 건 승리뿐이면 좋겠군.',
  baphomet: '녹이고 굳히는 건 내 일이다. 네 약점도 굳혀 주지.',
  azazel: '칼 벼리는 법을 알려 준 죄로 갇혔다. 네게도 가르쳐 주지, 값은 나중에.',
  beelzebub: '파리 떼가 네 앞길을 먼저 훑어 줄 거다.',
  mephisto: '영혼은 값으로 쳐주마. 네 건 아직 받지 않았으니 안심해라.',
  astaroth: '독사를 타고 왔다. 물리는 쪽은 늘 네 적이 되겠지.',
  belial: '무가치한 자라 불렸다. 그래서 자유롭다. 너도 그 편이 편할걸.',
  asmodeus: '솔로몬의 반지도 빼앗았다. 네 앞길의 문쯤이야.',
  paimon: '서쪽 끝까지 다스렸다. 길을 물으면 대답해 주마.',
  lilith: '먼저 떠난 자가 길을 안다. 따라와라, 뒤돌아보지 말고.',
  lucifer: '가장 높이 있었기에 가장 깊이 떨어졌다. 너는 떨어지지 마라.',
  hermes: '경계를 넘나드는 게 내 일이다. 너를 건너편까지 배달해 주지.',
  bastet: '집도 전쟁도 지킨다. 어느 쪽이 필요하냐.',
  anubis: '심장을 달아 보았다. 네 쪽이 더 가볍더군. 좋은 뜻이다.',
  artemis: '달이 뜨면 사냥을 시작한다. 쫓을 것을 가리켜라.',
  loki: '묶여서도 웃었지. 웃을 일이 하나 늘었군, 네 덕에.',
  susanoo: '쫓겨나서 영웅이 됐다. 쫓겨나는 것도 나쁘지 않다.',
  thor: '천둥은 부르는 것이 아니라 쥐는 것이다. 자, 잡아라.',
  ares: '전쟁 그 자체다. 싸우고 싶을 때 내 이름을 불러라.',
  poseidon: '땅이 흔들리면 내가 움직이는 거다. 파도도 네 편이다.',
  amaterasu: '동굴에서 나온 해다. 네 앞이 어두우면 나를 불러라.',
  isis: '흩어진 것은 다시 모으면 된다. 네가 흩어져도 마찬가지다.',
  hades: '돌아온 자가 없는 문이다. 네가 첫 번째가 되겠군.',
  osiris: '찢겨서도 다시 맞춰졌다. 너도 그렇게 해라.',
  titanmyth: '신에게 졌다. 그래도 아직 일어서 있다. 너와 함께라면 더 높이도.',
  izanagi: '황천에서 돌아왔다. 돌아오는 길은 내가 제일 잘 안다.',
  ra: '매일 세계를 다시 켠다. 네 하루도 내가 켜 주마.',
  vishnu: '열 번 내려왔다. 열한 번째는 네 곁으로 간다.',
  indra: '천 개의 눈으로 보고 있다. 네 등 뒤는 걱정 마라.',
  hwanin: '하늘에서 내려다보았다. 네 걸음은 곧게 가더군.',
  jadeemperor: '하늘 관청의 도장을 찍어 주마. 이제 네 일은 공식이다.',
  shiva: '춤 한 번으로 세계를 끝낼 수 있지. 네게는 한 박자만 빌려주마.',
  odin: '한쪽 눈은 이미 내주었다. 나머지 한쪽으로 너를 지켜보마.',
  quetzalcoatl: '깃털 달린 뱀이 하늘을 난다. 올라타라.',
  ahuramazda: '꺼지지 않는 불이다. 어두운 길에는 이걸 들어라.',
  zeus: '올림포스의 마지막 말은 내가 한다. 네 이름을 불러 주마.',
  dagon: '깊은 곳에서 올라왔다. 숨이 차면 내 쪽으로 오너라.',
  yig: '뱀들이 너를 알아본다. 물릴 일은 없을 거다.',
  ithaqua: '바람을 타고 걷는다. 발자국은 남기지 마라, 쫓아오니까.',
  chaugnar: '피에 굶주렸지만 오늘은 참아 주마. …오늘만.',
  shubniggurath: '천 마리 새끼가 너를 따른다. 귀찮으면 말해라.',
  hastur: '세 번 불러서 왔다. 네 번째는 부르지 마라.',
  tsathoggua: '움직이기 싫다. 그러니 네가 대신 움직여라. 내 몫까지.',
  glaaki: '가시로 꿈을 꿰었다. 네 악몽쯤은 한 땀이면 된다.',
  cthulhu: '죽은 게 아니라 자는 거다. 네가 깨워 주는 날까지.',
  yogsothoth: '문이자 열쇠다. 어느 쪽이든 필요한 쪽을 쥐어라.',
  abhoth: '끝없이 새것을 게워 낸다. 낡은 건 내가 먹어 주마.',
  voidlordmyth: '아무것도 아닌 것의 왕이다. 그러니 잃을 것도 없지. 너처럼.',
  nyarlathotep: '가면은 천 개다. 네게 보여 줄 얼굴은 아직 고르지 못했다.',
  // ── 격 재편으로 들어온 화신 ──
  guanyu: '의리 하나로 천 리를 갔다. 이제 그 의리를 네게 건다.',
  zhangfei: '다리 위에서 한 번 소리치면 대군도 멈춘다. 네 앞길에서도 그래 주마.',
  zhaoyun: '어린 주군을 품고 대군을 뚫었다. 너 하나쯤 품고 못 뚫을 길은 없다.',
  machao: '사자 투구는 아직 벗지 않았다. 네 원수도 내 원수다.',
  huangzhong: '일흔에도 활은 놓지 않았다. 늙었다고 빗나가는 화살은 없다.',
  auraknight: '검 끝에 빛을 세우는 데 십 년이 걸렸다. 네 검에도 세워 주마.',
  paladin: '기도는 짧게, 검은 곧게. 남은 건 내가 지킨다.',
  lancelot: '가장 뛰어났기에 가장 많이 잃었다. 너는 잃지 않게 곁에 서마.',
  templar: '성지는 잃었지만 맹세는 남았다. 그 맹세를 네게 빌려주지.',
  dragonknight: '용의 등에서 내려다보면 길이 보인다. 올라타라.',
  gawain: '해가 높을수록 세진다. 네 앞길이 한낮이면 좋겠군.',
  berserker: '아픔은 나중에 느끼면 된다. 지금은 앞만 봐라.',
  galahad: '성배는 찾는 자가 아니라 맑은 자에게 닿는다. 너는 맑다.',
  greenknight: '목을 베어도 나는 다시 일어선다. 약속은 지켜야 하니까.',
  tristan: '슬픈 노래는 이제 그만. 네 이야기는 다르게 끝나게 해 주마.',
  roland: '뿔나팔을 너무 늦게 불었다. 너는 부를 때를 놓치지 마라.',
  percival: '숲에서 와서 아무것도 몰랐지. 그래서 성배를 봤다. 너도 그렇게 가라.',
  elcid: '죽어서도 말에 올랐다. 살아 있는 너라면 더 멀리 가겠지.',
  bedivere: '마지막까지 왕 곁에 남았다. 이제 네 곁이 내 자리다.',
  robinhood: '부자의 것은 털고 가난한 자의 것은 지킨다. 네 주머니는 걱정 마라.',
  mordred: '왕을 찔렀다. 그래서 왕이 되는 법도 안다. 원하면 가르쳐 주마.',
  ladyofthelake: '검은 건네고, 때가 되면 돌려받는다. 잘 쓰고 돌려다오.',
  arthur: '바위에서 검을 뽑은 날부터 왕이었다. 이제 그 검은 네 손에서 빛난다.',
  archmage: '마나는 넘치면 별이 된다. 떨어뜨릴 곳만 가리켜라.',
  elementalist: '불과 얼음은 싸우지 않는다. 쥐는 법을 알면.',
  salamander: '불 속이 내 집이다. 네 앞을 태워 길을 내 주지.',
  summoner: '이름을 부르면 온다. 이제 네 이름도 부를 줄 안다.',
  runemage: '돌에 새긴 것은 지워지지 않는다. 네 이름도 새겨 두마.',
  undine: '사랑을 잃으면 물로 돌아간다더군. 그러니 나를 잃지 마라.',
  alchemist: '납을 금으로 바꾸진 못했다. 대신 너를 바꿔 보겠다.',
  druid: '떡갈나무가 네 이야기를 해 주더군. 오래 살아라.',
  faust: '모든 것을 알았는데 남은 게 없었다. 너는 남는 쪽을 골라라.',
  sylph: '바람은 붙잡을 수 없다. 대신 등을 밀어 줄 수는 있지.',
  warlock: '금지된 책은 끝까지 읽어야 금지된 이유를 안다. 대가는 내가 치렀다.',
  babayaga: '절구를 타고 숲을 난다. 길을 잃으면 내 오두막에 들러라. 잡아먹진 않으마.',
  gnome: '땅속 길은 내가 다 안다. 위에서 막히면 아래로 가자.',
  circe: '사람을 돼지로 바꾸는 건 쉽다. 너는 바꾸지 않겠다. 아직은.',
  morgan: '아발론의 안개는 내가 걷는다. 네가 지나갈 길만 열어 두지.',
  merlin: '왕을 만들었다. 이번엔 너를 만들어 볼 차례군.',
  moyong: '받은 것은 그대로 돌려준다. 은혜든 원한이든.',
  jegal: '진은 이미 쳐 두었다. 너는 그 가운데로 걸어 들어가기만 해라.',
  paeng: '도 한 자루면 족하다. 나머지는 네가 들어라.',
  azuredragon: '동쪽 하늘에서 내려왔다. 해가 뜨는 쪽은 늘 네 편이다.',
  whitetiger: '서쪽 하늘의 범이다. 네 등 뒤는 내가 노려보마.',
  vermilionbird: '남쪽 하늘이 붉게 타는 건 내 날개 때문이다. 따뜻하게 해 주지.',
  blacktortoise: '북쪽 하늘은 느리게 흐른다. 서두르지 않아도 닿는다.',
  unicorn: '순수한 자에게만 보인다. 그러니 보이는 동안은 너를 믿겠다.',
  pegasus: '땅을 딛지 않고 간다. 너도 가끔은 발을 떼 봐라.',
  phoenix: '타 죽어야 다시 산다. 무서워하지 마라, 나는 매번 돌아온다.',
  hippogriff: '그리핀과 말 사이에서 났다. 안 될 일도 될 때가 있는 법이다.',
  cerberus: '세 머리가 모두 너를 따르기로 했다. 문은 이제 네가 지켜라.',
  nemeanlion: '어떤 칼도 내 가죽을 뚫지 못했다. 이제 그 가죽이 너를 덮는다.',
  ceryneianhind: '누구도 나를 따라잡지 못했다. 너는 쫓지 않아서 닿았다.',
  erymanthianboar: '산을 갈아엎고 내려왔다. 막히는 것은 엎어 버려라.',
  stymphalianbirds: '청동 깃은 화살처럼 날아간다. 겨누기만 해라.',
  cretanbull: '바다에서 올라온 황소다. 들이받을 곳을 정해라.',
  mares: '사람을 먹고 자랐다. 이제부터는 네 적만 먹겠다.',
  geryon: '몸이 셋이라 셋이 함께 너를 지킨다. 싸움은 언제나 셋 대 하나다.',
  ladon: '잠들지 않고 황금 사과를 지켰다. 네 것도 그렇게 지켜 주마.',
  sphinx: '답을 맞혔으니 길을 내준다. 다음 수수께끼는 네가 내라.',
  kraken: '배를 통째로 끌고 내려갔다. 네 적은 바다 밑에서 보게 될 거다.',
  sanctdragon: '천 년을 한 자리에서 지켰다. 이제 그 자리를 너로 옮긴다.',
  uriel: '신의 불꽃이라는 이름이다. 어두운 곳에는 나를 들어라.',
  raguel: '천사들의 잘못도 따진다. 네 잘못은 아직 하나도 못 찾았다.',
  sariel: '달의 길을 가르쳤다. 밤길은 내가 앞장서마.',
  remiel: '다시 일어날 자들을 지킨다. 쓰러져도 괜찮다, 내가 있으니.',
  bael: '세 머리가 같은 말을 한다 — 너를 따르겠다고. 보이지 않게.',
  beleth: '나팔 소리가 들리면 내가 온 거다. 놀라지 마라, 네 편이다.',
  purson: '숨겨진 것은 내 눈에 다 보인다. 네 앞길의 덫도.',
  vine: '폭풍을 부르고 탑을 허문다. 네 앞을 막는 벽이라면 무엇이든.',
  balam: '지나간 일과 올 일을 다 안다. 네 쪽이 이긴다는 것도.',
  zagan: '쇠를 금화로 바꿔 주지. 네 주머니가 무거워질 거다.',
  hera: '신들의 여왕이다. 내 질투는 이제 네 적을 향한다.',
  athena: '지혜 없는 힘은 넘어지고, 힘 없는 지혜는 갇힌다. 둘 다 주마.',
  apollo: '활을 쏘면 빗나가지 않고, 노래하면 상처가 아문다. 둘 중 무얼 원하나.',
  aphrodite: '아름다움도 무기다. 네 적이 칼을 내리게 해 주지.',
  hephaestus: '신들의 무기는 다 내가 벼렸다. 네 것도 다시 벼려 주마.',
  demeter: '씨를 뿌리면 거둔다. 네가 뿌린 만큼 거두게 해 주지.',
  dionysus: '취하면 두려움이 사라진다. 한 잔 받아라.',
  jormungandr: '세계를 한 바퀴 감고 있었다. 이제 너를 감싸 주마.',
  fenrir: '끊어지지 않는 끈도 언젠가는 끊어진다. 그날 나는 네 편에 서겠다.',
  apophis: '밤마다 해를 삼키려 했다. 너의 해만은 남겨 두마.',
  vritra: '세상의 물을 가두었었다. 목마를 때 나를 불러라.',
  orochi: '여덟 머리 중 하나쯤은 늘 깨어 있다. 네 잠을 지켜 주지.',
  behemoth: '땅을 통째로 눌러앉았었다. 이제 너를 위해 일어서마.',
  leviathan: '바다를 통째로 삼켰다. 네 앞의 바다쯤은 갈라 주지.',
  ziz: '날개를 펴면 하늘이 가려진다. 네 머리 위는 늘 그늘이 질 거다.',
  typhon: '신들도 짐승 꼴로 달아났었다. 네 적도 그렇게 해 주마.',
  ymir: '내 주검으로 세계가 지어졌다. 너는 그 위를 걷고 있는 거다.',
  tiamat: '신들을 낳았고 신들에게 갈라졌다. 너는 나를 가르지 않았군. 좋다.',
  brahma: '네 얼굴로 세계를 지었다. 다섯째 얼굴은 너를 보는 데 쓰마.',
  shoggoth: '테켈리-리. …주인을 삼킨 뒤로 처음 섬기는 자다.',
  migo: '유고스에서 왔다. 네 머릿속이 궁금하지만 참겠다.',
  atlachnacha: '거미줄을 다 짜면 세상이 끝난다. 네가 있는 동안은 천천히 짜마.',
  cthugha: '포말하우트에서 탄다. 꺼지지 않는 불이 필요하면 불러라.',
  ubbosathla: '모든 것이 나에게서 나와 나에게 돌아온다. 너도 언젠가는.',
  daoloth: '장막을 찢으면 진짜가 보인다. 눈을 감지 마라.',
  tulzscha: '백치 신의 궁정에서 춤추는 불이다. 네 장단에도 맞춰 주지.',
  yibbtstll: '시간 바깥에서 기다렸다. 너를 기다리는 건 조금도 길지 않았다.',
  ghroth: '내 노래에 별들이 깨어난다. 네 이름도 불러 주마.',
  pipers: '피리를 멈추면 그분이 깬다. 그러니 너를 위해서도 계속 분다.'
};
// 한마디가 없는 화신(나중에 늘어난 것)은 이 말로 갑니다
function avatarLine(foe) {
  return AVATAR_LINES[foe.id] || '…나를 꺾은 자여. 이제 내 이름이 네 이름 앞에 붙는다.';
}
function avatarTitle(foe) { return /의 화신$/.test(foe.name) ? foe.name : `${foe.name}의 화신`; }
function avatarChance(foe) { return foe.kind === 'boss' ? AVATAR_CHANCE_BOSS : AVATAR_CHANCE; }

const AVATAR_KIND_SCALE = { normal: 1, elite: 1.1, hidden: 1.15, boss: 1 };
const avatarCache = {};
function avatarProfile(foe) {
  if (!canBecomeAvatar(foe)) return null;
  if (avatarCache[foe.id]) return avatarCache[foe.id];
  const sig = AVATAR_SIGNATURE[foe.id];
  let p;
  if (sig) p = { mul: { ...sig.mul }, add: { ...sig.add } };
  else {
    // 하나하나 따로 정한 것(AVATAR_UNIQUE), 없으면 성격의 꼴(AVATAR_ARCH) — 나중에 새 화신을 넣었을 때를 위한 자리
    const u = AVATAR_UNIQUE[foe.id];
    const base = u ? { mul: u[0], add: u[1] } : (AVATAR_ARCH[foe.arch] || AVATAR_ARCH.fierce);
    const s = (1 + 0.04 * (foe.rank.n - AVATAR_MIN_RANK)) * (AVATAR_KIND_SCALE[foe.kind] || 1);
    p = { mul: {}, add: {} };
    for (const [k, v] of Object.entries(base.mul)) p.mul[k] = +Math.max(0.1, 1 + (v - 1) * s).toFixed(2);
    for (const [k, v] of Object.entries(base.add)) p.add[k] = k === 'survive' ? v : +(v * s).toFixed(3);   // 생존은 횟수라 키우지 않습니다
  }
  // 보여주는 값이 실제와 같도록 — 특수 능력치의 상한을 넘는 몫은 미리 잘라 둡니다
  for (const k of Object.keys(p.add)) if (p.add[k] > 0) p.add[k] = Math.min(SPECIAL_INFO[k].cap, p.add[k]);
  return (avatarCache[foe.id] = p);
}
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
