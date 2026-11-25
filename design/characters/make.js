// ============================================================
//  이야기 캐릭터 일러스트 프롬프트 — 픽셀 생김새(js/allylook.js)와 같은 색 · 머리 · 옷으로
//
//    node design/characters/make.js
//      → design/characters/<id>.png   픽셀 참고 그림 (앞 · 뒤 · 옆 · 반대 옆, 8배) — 이미지 AI 에 프롬프트와 같이 올림
//      → design/characters/PROMPTS.md  캐릭터마다 프롬프트 (색 코드는 픽셀 색 목록에서 그대로 뽑음)
//
//  이야기 동료(하윤 · 단우)는 js/data.js 의 ALLIES 생김새를 그대로 읽음.
//  4대 길드 에이스는 아직 게임에 그림이 없어서 생김새를 여기서 정함 (제안 — 그림이 정해지면 data.js 로 옮김).
//  손으로 고치지 말고 이 파일의 CHARACTERS 를 고친 뒤 다시 뽑습니다.
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { png } = require('../ally/png.js');
const Look = require('../../js/allylook.js');

const ROOT = path.join(__dirname, '..', '..');
const { ALLIES } = vm.runInNewContext(`${fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8')}\n;({ ALLIES })`, {}, { filename: 'data.js' });
const P = Look.PALETTE;

// ---------- 캐릭터 ----------
// look 은 js/allylook.js 의 생김새 객체. who · pose · face · extra 는 그림에만 쓰는 말 (영어 — 이미지 AI 가 읽음), ko 는 이 문서에 적는 설명
const CHARACTERS = [
  { id: 'hayun', name: '하윤', role: '첫 이야기 동료 · D급 · 추가타', look: ALLIES.hayun.look,
    ko: '협회 로비에서 먼저 말을 거는 헌터. 눈치가 빠르고 말수가 적은 편 — 「옆에서 한 번씩 더 칠게요」. (성별 · 나이는 제안: 20대 초반 여성)',
    who: 'a young woman in her early twenties, a D-rank hunter; quick-eyed, quiet, a little guarded but kind',
    face: 'calm, slightly guarded look with a faint smile at one corner of the mouth',
    pose: 'standing relaxed with the weight on one leg, one hand tugging the end of the scarf, the other hand resting near the dagger at the hip',
    extra: 'a short practical dagger in a black sheath on the belt' },
  { id: 'danwoo', name: '단우', role: '둘째 이야기 동료 · A급 · 버티기', look: ALLIES.danwoo.look,
    ko: '청해 길드를 떠난 무인. 무뚝뚝한 사람 — 「길은 내가 연다. 너는 끝만 보고 가라.」 (성별 · 나이는 제안: 20대 후반 남성)',
    who: 'a man in his late twenties, an A-rank martial artist; stoic, steady, speaks little',
    face: 'stern, steady eyes, mouth set in a straight line',
    pose: 'standing straight, one fist resting in the other palm in front of the chest (a martial-arts salute)',
    extra: 'the uniform is old and worn, mended in a few places' },
  { id: 'hongyeom', name: '홍염 에이스', role: '4대 길드 1위 홍염의 S급 · 시험관 · 광장 위기 게이트', guild: '홍염 — 붉은 불꽃 문장, 뜨겁고 거친 쪽',
    look: { v: 1, seed: 7101, skin: 2, hc: 4, bangs: 'spiky', side: 0, back: 0, tie: 5, vol: 2, flip: false, eye: 'sharp', ec: 5, mouth: 'line', mark: 'scar', top: 'jacket', bottom: 'pants', extra: 'belt', c1: 4, c2: 0, c3: 0, shoe: 0, hseed: 7101 },
    ko: '「불 좀 붙여 봐. 미지근하면 바로 끝낸다.」 — 거칠고 뜨거운 싸움꾼. (생김새는 제안: 남성 · 붉은 뻗친 머리 · 빨간 재킷)',
    who: 'a man in his late twenties, the S-rank ace of the top hunter guild "Hongyeom" (red flame); rough, hot-blooded, fearless',
    face: 'a cocky, fierce grin, eyes narrowed like a challenge',
    pose: 'standing with shoulders squared, one hand in a loose fist with faint sparks of fire around the knuckles',
    extra: 'a small red flame emblem pin on the jacket chest' },
  { id: 'cheonghae', name: '청해 에이스', role: '4대 길드 2위 청해의 S급 · 시험관 · 광장 위기 게이트', guild: '청해 — 푸른 파도 문장, 옛 문파의 무공을 잇는 무협 길드',
    look: { v: 1, seed: 7102, skin: 0, hc: 0, bangs: 'straight', side: 3, back: 2, tie: 1, vol: 1, flip: false, eye: 'sharp', ec: 2, mouth: 'small', mark: 'none', top: 'dobok', bottom: 'pants', extra: 'none', c1: 3, c2: 2, c3: 2, shoe: 0, hseed: 7102 },
    ko: '「예를 갖추고 — 한 수 겨뤄 봅시다.」 포권을 하는 정중한 무인. (생김새는 제안: 여성 · 긴 검은 머리를 높이 묶음 · 흰 도복에 남색 띠)',
    who: 'a woman in her mid twenties, the S-rank ace of the martial-arts guild "Cheonghae" (blue wave), heir of an old martial school; poised, polite, precise',
    face: 'composed and polite, a calm level gaze',
    pose: 'standing upright with a straight back, giving a martial-arts salute (right fist against the open left palm in front of the chest)',
    extra: 'a thin pattern of blue waves embroidered along the sleeve hems of the uniform' },
  { id: 'crown', name: '크라운 에이스', role: '4대 길드 3위 크라운의 S급 · 시험관 · 광장 위기 게이트', guild: '크라운 — 금빛 왕관 문장, 자신만만하고 돈이 많고 뒤가 구린 길드',
    look: { v: 1, seed: 7103, skin: 0, hc: 3, bangs: 'side', side: 1, back: 0, tie: 0, vol: 1, flip: true, eye: 'sleepy', ec: 5, mouth: 'small', mark: 'none', top: 'suit', bottom: 'pants', extra: 'cape', c1: 3, c2: 3, c3: 10, shoe: 1, hseed: 7103 },
    ko: '「바쁜 사람 불러 놓고 실망시키진 않겠지?」 — 돈 많고 자신만만한 사람. (생김새는 제안: 남성 · 금발 · 흰 정장에 겨자빛 넥타이와 짧은 망토)',
    who: 'a man in his late twenties, the S-rank ace of the rich and arrogant guild "Crown" (golden crown); confident, smug, used to winning',
    face: 'a smug half-lidded look and a small superior smile',
    pose: 'standing with one hand in the trouser pocket and the other adjusting the necktie',
    extra: 'a small gold crown pin on the lapel and an expensive-looking gold wristwatch' },
  { id: 'dal', name: '달 에이스', role: '4대 길드 4위 달의 S급 · 시험관 · 광장 위기 게이트', guild: '달 — 달 문장, 밤에만 움직이는 길드',
    look: { v: 1, seed: 7104, skin: 0, hc: 5, bangs: 'side', side: 2, back: 1, tie: 0, vol: 1, flip: true, eye: 'sleepy', ec: 6, mouth: 'none', mark: 'none', top: 'hoodie', bottom: 'pants', extra: 'scarf', c1: 2, c2: 0, c3: 1, shoe: 0, hseed: 7104 },
    ko: '「조용히 끝내요. 아프지 않게.」 — 밤에만 움직이는 조용한 사람. (생김새는 제안: 여성 · 어깨까지 오는 은발 · 남색 후드에 먹색 목도리)',
    who: 'a woman in her early twenties, the S-rank ace of the night guild "Dal" (moon); quiet, sleepy-looking, unsettlingly calm',
    face: 'expressionless, sleepy half-closed eyes, the scarf pulled up just under the chin',
    pose: 'standing loosely with hands hidden in the hoodie pocket, head tilted slightly',
    extra: 'a small silver crescent-moon pendant on a thin chain' }
];

// ---------- 생김새 → 영어 설명 ----------
const BANGS_EN = { messy: 'messy, tousled bangs', straight: 'blunt straight-cut bangs', parted: 'center-parted bangs', side: 'side-swept bangs', spiky: 'spiky, pointed bangs', short: 'short bangs that show the forehead' };
const SIDE_EN = { short: 'short sides with the ears showing', ear: 'side hair covering the ears', cheek: 'side locks down to the cheeks', chin: 'side locks down to the jaw' };
const BACK_EN = { none: 'short at the back of the neck', shoulder: 'back hair reaching the shoulders', long: 'long hair falling down the back' };
const TIE_EN = { none: '', ponytail: 'gathered into a high ponytail at the back', twin: 'tied in twin tails', bun: 'tied up in a top bun', ahoge: 'one stray strand sticking up on top', spikes: 'spiking up on top' };
const EYE_EN = { round: 'round eyes', sharp: 'sharp, narrow eyes', sleepy: 'half-lidded, sleepy eyes', big: 'big, bright eyes', dot: 'small, simple eyes', smile: 'eyes often curved in a smile' };
const MARK_EN = { none: '', blush: 'a light blush on both cheeks', scar: 'a small diagonal scar on the left cheek', bandage: 'a small square bandage on the left cheek', mole: 'a small mole under the right eye' };
const TOP_EN = {
  tee: 'a short-sleeved T-shirt', long: 'a plain long-sleeved shirt', hoodie: 'a hoodie with the hood down and two white drawstrings',
  jacket: 'an open jacket worn over an inner shirt (the inner shirt is the ACCENT color)', suit: 'a suit jacket over a white shirt with a necktie (the necktie is the ACCENT color)',
  robe: 'a long robe down to the shins with a sash at the waist (the sash is the ACCENT color)', armor: 'a metal chest plate and shoulder guards over a long-sleeved top',
  dobok: 'a martial-arts uniform with a crossed collar, tied with a belt (the belt is the ACCENT color)', sleeveless: 'a sleeveless top'
};
const BOTTOM_EN = { pants: 'long trousers', shorts: 'shorts', skirt: 'a knee-length skirt' };
const EXTRA_EN = { none: '', scarf: 'a scarf around the neck (ACCENT color)', belt: 'a brown leather belt with a small gold buckle', strap: 'a brown leather strap across the chest', cape: 'a short cape over the shoulders with gold clasps (ACCENT color)' };
const name = (list, i) => list[i][0];
const hex = (list, i) => list[i][1];
// 그늘 색 — 게임이 그 재료에 쓰는 명암 한 단계 아래 (피부 0.085 · 머리 0.1 · 눈 0.12 · 옷 0.1 · 신발 0.08 — js/allylook.js 의 drawLook)
const shade = (h, step = 0.1) => P.ramp(h, step)[1];

function colorLock(L) {
  const rows = [
    ['Hair', name(P.HAIR_COLORS, L.hc), hex(P.HAIR_COLORS, L.hc), 0.1],
    ['Skin', name(P.SKINS, L.skin), hex(P.SKINS, L.skin), 0.085],
    ['Eyes (iris)', name(P.EYE_COLORS, L.ec), hex(P.EYE_COLORS, L.ec), 0.12],
    ['Top (main outfit color)', name(P.CLOTH_COLORS, L.c1), hex(P.CLOTH_COLORS, L.c1)],
    ['Bottom', L.top === 'robe' ? null : name(P.CLOTH_COLORS, L.c2), hex(P.CLOTH_COLORS, L.c2)],
    ['ACCENT', name(P.CLOTH_COLORS, L.c3), hex(P.CLOTH_COLORS, L.c3)],
    ['Shoes', name(P.SHOES, L.shoe), hex(P.SHOES, L.shoe), 0.08]
  ].filter(r => r[1] !== null);
  const usesAccent = /ACCENT/.test(TOP_EN[L.top] + EXTRA_EN[L.extra]);
  return rows.filter(r => r[0] !== 'ACCENT' || usesAccent);
}
function hairText(L) {
  return [BANGS_EN[L.bangs] + (L.bangs === 'side' ? ` (swept toward the ${L.flip ? 'left' : 'right'} side of the face)` : ''),
    SIDE_EN[P.SIDES[L.side][0]], BACK_EN[P.BACKS[L.back][0]], TIE_EN[P.TIES[L.tie][0]], L.vol === 2 ? 'thick and voluminous' : 'neat and close to the head']
    .filter(Boolean).join(', ');
}
function prompt(c) {
  const L = c.look, lock = colorLock(L);
  const lockLines = lock.map(([k, ko, h, st]) => `- ${k}: ${h}  (shadows ${shade(h, st)})`).join('\n');
  return `Make ONE image, 1024x1536 portrait: a full-body character illustration for a game. One character only.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. No name, no caption, no signature, no logo, no letters or numbers.
2. The WHOLE body from the top of the hair to the soles of the shoes is inside the image, centered, with empty space around it. Nothing cut off.
3. The whole background is one flat magenta (#FF00FF). No gradient, no floor, no ground shadow, no scenery, no effects behind the character.
   Do not use magenta or hot pink on the character.

STYLE: modern Korean webtoon / anime character art. Clean thin lineart, cel shading (two tones plus one highlight), soft light from the upper left.
Attractive, slightly stylized proportions (about 7 heads tall). Urban-fantasy hunter setting: present-day Korea where gates and monsters appeared.

REFERENCE: the attached pixel sprite (front, back, side, other side) is THIS SAME CHARACTER in the game.
Copy its hairstyle, outfit shapes and colors exactly, but draw it as a detailed illustration — NOT as pixel art.

COLOR LOCK — the colors MUST match the pixel sprite. Use these as the main colors, nothing else as a main color:
${lockLines}
Small details (buttons, buckles, metal) may be silver or gold.

CHARACTER: ${c.who}.
HAIR: ${hairText(L)}.
FACE: ${EYE_EN[L.eye]}${MARK_EN[L.mark] ? `, ${MARK_EN[L.mark]}` : ''}; ${c.face}.
OUTFIT: ${TOP_EN[L.top]}, ${BOTTOM_EN[L.bottom]}${EXTRA_EN[L.extra] ? `, ${EXTRA_EN[L.extra]}` : ''}, shoes in the Shoes color. ${c.extra[0].toUpperCase() + c.extra.slice(1)}.
POSE: ${c.pose}. Facing the viewer at a slight 3/4 angle.`;
}
function bustPrompt(c) {
  return `Now draw the SAME character again — same face, hair, outfit and colors as the full-body image above.
ONE image, 1024x1024: a bust portrait (from the top of the head to the middle of the chest), facing the viewer at a slight 3/4 angle.
Expression: ${c.face}.
Same rules: no text, one flat magenta (#FF00FF) background, nothing else in the image.`;
}

// ---------- 픽셀 참고 그림 ----------
const Z = 8, GAP = 16, VIEWS = ['front', 'back', 'side', 'sideL'];
function refPng(L) {
  const fw = Look.W * Z, fh = Look.H * Z, Wd = VIEWS.length * (fw + GAP) + GAP, Hd = fh + GAP * 2, px = new Uint8Array(Wd * Hd * 4);
  for (let k = 0; k < Wd * Hd; k++) { px[k * 4] = 236; px[k * 4 + 1] = 234; px[k * 4 + 2] = 228; px[k * 4 + 3] = 255; }
  VIEWS.forEach((v, n) => {
    const f = Look.drawLook(L, v);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const s = (((y / Z) | 0) * Look.W + ((x / Z) | 0)) * 4; if (!f[s + 3]) continue;
      const d = ((GAP + y) * Wd + GAP + n * (fw + GAP) + x) * 4; px[d] = f[s]; px[d + 1] = f[s + 1]; px[d + 2] = f[s + 2];
    }
  });
  return png(Wd, Hd, px);
}

// ---------- 문서 ----------
const out = [];
out.push(`# 이야기 캐릭터 일러스트 프롬프트

> 자동으로 만든 파일입니다 (\`node design/characters/make.js\`). 손으로 고치지 마세요 — 바꾸려면 \`make.js\` 의 \`CHARACTERS\` 를 고치고 다시 뽑습니다.

이야기에서 꼭 만나는 사람(이야기 동료 둘 · 4대 길드 에이스 넷)을 제미나이 · GPT 로 **웹툰 · 애니메이션 느낌의 일러스트**로 뽑기 위한 프롬프트입니다.
게임 안의 픽셀 캐릭터(\`js/allylook.js\` 의 조합 그림)와 **머리 모양 · 옷 · 머리색 · 피부색 · 눈 색이 같아야** 하므로,
색 코드는 픽셀이 쓰는 색 목록에서 그대로 뽑았고, 픽셀 참고 그림을 같이 올리게 했습니다.

## 쓰는 법

1. **캐릭터 하나마다 새 대화창.** 한 대화에서 여러 사람을 이어 뽑으면 얼굴이 섞입니다.
2. 그 캐릭터의 **픽셀 참고 그림**(\`design/characters/<id>.png\`)을 먼저 올리고, 회색 상자 「전신」을 통째로 붙여 넣습니다.
3. 나온 그림을 봅니다 — 글자가 없나 · 배경이 한 가지 자홍색인가 · 발끝까지 다 나왔나 · **색이 픽셀과 같은가**(머리 · 피부 · 옷 · 눈).
   색이 틀리면 「COLOR LOCK 의 색 코드를 정확히 지켜서 다시」라고 합니다. 픽셀처럼(도트로) 나오면 「픽셀 아트가 아니라 일러스트로」.
4. 마음에 들면 **같은 대화에서** 회색 상자 「상반신」을 보내 대화창용 얼굴을 뽑습니다 (같은 대화라야 얼굴이 이어집니다).
5. 「저장할 이름」대로 저장합니다. 게임에 넣을 때는 다른 그림처럼 먼저 줄입니다 (배경 걷어내기 · 크기 줄이기 — 넣을 때 정함).

## 프롬프트에 이미 들어 있는 규칙

- **배경은 한 가지 자홍색(#FF00FF)** — 장비 그림처럼 나중에 도구가 걷어내 투명하게 만듭니다. 그래서 자홍 · 진분홍은 캐릭터에 쓰지 말라고 적었습니다.
- **COLOR LOCK** — 머리 · 피부 · 눈 · 윗옷 · 아래옷 · 포인트 · 신발 색을 픽셀과 같은 색 코드로, 그늘 색까지. 다른 큰 색은 쓰지 않게.
- 글자 없음 · 한 사람만 · 발끝까지 · 살짝 3/4 앞모습 · 현대 한국에 게이트가 열린 어반 판타지.
- 성격 · 표정 · 자세는 게임 대사에서 읽히는 대로. 사연(세계관 문서)은 넣지 않았습니다.

## 차례

| 캐릭터 | 역할 | 픽셀 참고 | 저장할 이름 (전신 · 상반신) |
|---|---|---|---|
`);
for (const c of CHARACTERS) out.push(`| ${c.name} | ${c.role} | \`design/characters/${c.id}.png\` | \`design/images/portraits/${c.id}-full.png\` · \`${c.id}-bust.png\` |\n`);
out.push(`
> 성별 · 나이는 여섯 모두 정해진 적이 없어 **제안**입니다. 4대 길드 에이스 넷은 생김새(머리 · 옷 · 색)까지 제안 — 게임에는 아직 그림이 없습니다. 바꾸려면 \`make.js\` 의 그 사람 \`look\` 을 고치고 다시 뽑습니다.
> 정해지면 게임의 시험관 · 광장 위기 게이트에도 같은 픽셀로 넣습니다.
`);
for (const c of CHARACTERS) {
  const L = c.look;
  out.push(`
---

## ${c.name} — ${c.role}

${c.ko}${c.guild ? `\n\n길드: ${c.guild}` : ''}

![${c.name} 픽셀](${c.id}.png)

픽셀 참고: \`design/characters/${c.id}.png\` (앞 · 뒤 · 옆 · 반대 옆)

| 부위 | 픽셀 생김새 | 색 |
|---|---|---|
| 머리 | ${{ messy: '덥수룩', straight: '일자', parted: '가르마', side: '옆으로', spiky: '삐죽', short: '이마 보임' }[L.bangs]} 앞머리 · ${P.SIDES[L.side][2]} · 뒤 ${P.BACKS[L.back][2]} · ${P.TIES[L.tie][1]} · 숱 ${L.vol === 2 ? '많이' : '적게'} | ${name(P.HAIR_COLORS, L.hc)} \`${hex(P.HAIR_COLORS, L.hc)}\` |
| 피부 | | ${name(P.SKINS, L.skin)} \`${hex(P.SKINS, L.skin)}\` |
| 눈 | ${{ round: '둥근', sharp: '날카로운', sleepy: '졸린', big: '큰', dot: '점', smile: '웃는' }[L.eye]} 눈${L.mark !== 'none' ? ` · ${{ blush: '볼터치', scar: '흉터', bandage: '반창고', mole: '점' }[L.mark]}` : ''} | ${name(P.EYE_COLORS, L.ec)} \`${hex(P.EYE_COLORS, L.ec)}\` |
| 윗옷 | ${{ tee: '반팔', long: '긴팔', hoodie: '후드', jacket: '재킷', suit: '정장', robe: '로브', armor: '갑옷', dobok: '도복', sleeveless: '민소매' }[L.top]} | ${name(P.CLOTH_COLORS, L.c1)} \`${hex(P.CLOTH_COLORS, L.c1)}\` |
| 아래옷 | ${{ pants: '바지', shorts: '반바지', skirt: '치마' }[L.bottom]} | ${name(P.CLOTH_COLORS, L.c2)} \`${hex(P.CLOTH_COLORS, L.c2)}\` |
| 포인트 | ${{ none: '—', scarf: '목도리', belt: '허리띠', strap: '가방끈', cape: '망토' }[L.extra]} · 속옷 · 띠 · 넥타이 | ${name(P.CLOTH_COLORS, L.c3)} \`${hex(P.CLOTH_COLORS, L.c3)}\` |
| 신발 | | ${name(P.SHOES, L.shoe)} \`${hex(P.SHOES, L.shoe)}\` |

### 전신

저장할 이름: \`design/images/portraits/${c.id}-full.png\`

\`\`\`text
${prompt(c)}
\`\`\`

### 상반신 (같은 대화에서 이어서)

저장할 이름: \`design/images/portraits/${c.id}-bust.png\`

\`\`\`text
${bustPrompt(c)}
\`\`\`
${ALLIES[c.id] ? '' : `
<details><summary>게임에 넣을 생김새 (js/allylook.js 의 생김새 객체)</summary>

\`\`\`js
${JSON.stringify(L)}
\`\`\`
</details>
`}`);
}
for (const c of CHARACTERS) fs.writeFileSync(path.join(__dirname, `${c.id}.png`), refPng(c.look));
fs.writeFileSync(path.join(__dirname, 'PROMPTS.md'), out.join(''));
console.log(`캐릭터 ${CHARACTERS.length}명 — 픽셀 참고 그림 · PROMPTS.md`);
