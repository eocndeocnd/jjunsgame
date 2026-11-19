# 제16격 신격 — 장비 28개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 16-A — 무기 · 보조무기 · 투구 · 갑옷 · 어깨 (9개)

저장할 이름: `design/images/sheets/rank16-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「명계의 이지창」 — loot from the monster 「하데스」. the most ornate and imposing piece of this set; mood: spiked, thorny.
2. WEAPON 「삼지창」 — loot from the monster 「포세이돈」. more refined and menacing; mood: heavy, blunt, massive.
3. WEAPON 「묠니르」 — loot from the monster 「토르」. plain look; mood: heavy, blunt, massive.
4. OFF-HAND (shield, book, lantern, orb ...) 「고르곤의 머리를 단 방패」 — loot from the monster 「아테나」. more refined and menacing; mood: sturdy, protective.
5. OFF-HAND (shield, book, lantern, orb ...) 「거짓의 단검」 — loot from the monster 「로키」. more refined and menacing; mood: a lucky charm, a hint of gold.
6. HEADGEAR 「재칼의 가면」 — loot from the monster 「아누비스」. plain look; mood: pointed, piercing.
7. HEADGEAR 「보이지 않게 하는 투구」 — loot from the monster 「하데스」. the most ornate and imposing piece of this set; mood: spiked, thorny.
8. BODY ARMOR / CLOTHING 「표범 가죽 옷」 — loot from the monster 「디오니소스」. more refined and menacing; mood: sinister, a touch of blood red.
9. SHOULDER GUARD 「방부사의 어깨띠」 — loot from the monster 「아누비스」. plain look; mood: pointed, piercing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 명계의 이지창 | 무기 | 하데스 | `assets/items/hades2_0.png` |
| 2 | 삼지창 | 무기 | 포세이돈 | `assets/items/poseidon2_0.png` |
| 3 | 묠니르 | 무기 | 토르 | `assets/items/thor2_0.png` |
| 4 | 고르곤의 머리를 단 방패 | 보조무기 | 아테나 | `assets/items/athena_0.png` |
| 5 | 거짓의 단검 | 보조무기 | 로키 | `assets/items/loki2_0.png` |
| 6 | 재칼의 가면 | 투구 | 아누비스 | `assets/items/anubis2_1.png` |
| 7 | 보이지 않게 하는 투구 | 투구 | 하데스 | `assets/items/hades2_1.png` |
| 8 | 표범 가죽 옷 | 갑옷 | 디오니소스 | `assets/items/dionysus_0.png` |
| 9 | 방부사의 어깨띠 | 어깨 | 아누비스 | `assets/items/anubis2_0.png` |

## 시트 16-B — 어깨 · 장갑 · 허리띠 · 각반 · 신발 · 망토 (9개)

저장할 이름: `design/images/sheets/rank16-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. SHOULDER GUARD 「공작 깃 견갑」 — loot from the monster 「헤라」. more refined and menacing; mood: spiked, thorny.
2. GLOVES / GAUNTLETS 「리라를 켜는 손」 — loot from the monster 「아폴론」. more refined and menacing; mood: reinforced, built to last.
3. GLOVES / GAUNTLETS 「불에 그을린 대장장이 손」 — loot from the monster 「헤파이스토스」. more refined and menacing; mood: sturdy, protective.
4. BELT / SASH 「케스토스」 — loot from the monster 「아프로디테」. more refined and menacing; mood: sinister, a touch of blood red.
5. LEG ARMOR 「소리 없는 각반」 — loot from the monster 「바스테트」. plain look; mood: light, slim, built for speed.
6. LEG ARMOR 「보리 이삭을 엮은 각반」 — loot from the monster 「데메테르」. more refined and menacing; mood: reinforced, built to last.
7. BOOTS / SHOES 「사슴가죽 신」 — loot from the monster 「아르테미스」. more refined and menacing; mood: light, slim, built for speed.
8. CLOAK / CAPE 「하늘 옷」 — loot from the monster 「아마테라스」. plain look; mood: reinforced, built to last.
9. CLOAK / CAPE 「폭풍의 겉옷」 — loot from the monster 「스사노오」. plain look; mood: aggressive, sharp.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 공작 깃 견갑 | 어깨 | 헤라 | `assets/items/hera_0.png` |
| 2 | 리라를 켜는 손 | 장갑 | 아폴론 | `assets/items/apollo_0.png` |
| 3 | 불에 그을린 대장장이 손 | 장갑 | 헤파이스토스 | `assets/items/hephaestus_0.png` |
| 4 | 케스토스 | 허리띠 | 아프로디테 | `assets/items/aphrodite_0.png` |
| 5 | 소리 없는 각반 | 각반 | 바스테트 | `assets/items/bastet2_1.png` |
| 6 | 보리 이삭을 엮은 각반 | 각반 | 데메테르 | `assets/items/demeter_0.png` |
| 7 | 사슴가죽 신 | 신발 | 아르테미스 | `assets/items/artemis2_0.png` |
| 8 | 하늘 옷 | 망토 | 아마테라스 | `assets/items/amaterasu2_0.png` |
| 9 | 폭풍의 겉옷 | 망토 | 스사노오 | `assets/items/susanoo2_0.png` |

## 시트 16-C — 반지 · 목걸이 · 팔찌 · 특수장비 (9개)

저장할 이름: `design/images/sheets/rank16-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. RING 「야사카니의 곡옥」 — loot from the monster 「아마테라스」. plain look; mood: reinforced, built to last.
2. RING 「고양이의 눈」 — loot from the monster 「바스테트」. plain look; mood: light, slim, built for speed.
3. NECKLACE / AMULET 「케르베로스의 사슬」 — loot from the monster 「하데스」. the most ornate and imposing piece of this set; mood: spiked, thorny.
4. NECKLACE / AMULET 「앙크」 — loot from the monster 「이시스」. plain look; mood: modest, well used.
5. BRACELET / BANGLE / WRISTWATCH 「세계수 가지 팔찌」 — old treasure that was buried in a chest for a long time. plain look; mood: modest, well used.
6. BRACELET / BANGLE / WRISTWATCH 「뒤바뀐 반지」 — loot from the monster 「로키」. more refined and menacing; mood: a lucky charm, a hint of gold.
7. BRACELET / BANGLE / WRISTWATCH 「폭풍 팔찌」 — loot from the monster 「스사노오」. plain look; mood: aggressive, sharp.
8. SMALL PRECIOUS OBJECT (gem or relic) 「전령의 날개」 — loot from the monster 「헤르메스」. a small ancient object; more refined and menacing.
9. SMALL PRECIOUS OBJECT (gem or relic) 「메긴교르드의 고리」 — loot from the monster 「토르」. a small shining stone or crystal; plain look.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 야사카니의 곡옥 | 반지 | 아마테라스 | `assets/items/amaterasu2_1.png` |
| 2 | 고양이의 눈 | 반지 | 바스테트 | `assets/items/bastet2_0.png` |
| 3 | 케르베로스의 사슬 | 목걸이 | 하데스 | `assets/items/hades2_2.png` |
| 4 | 앙크 | 목걸이 | 이시스 | `assets/items/isis2_0.png` |
| 5 | 세계수 가지 팔찌 | 팔찌 | 보물상자 | `assets/items/chest_yggdrasil_bracelet.png` |
| 6 | 뒤바뀐 반지 | 팔찌 | 로키 | `assets/items/loki2_1.png` |
| 7 | 폭풍 팔찌 | 팔찌 | 스사노오 | `assets/items/susanoo2_1.png` |
| 8 | 전령의 날개 | 특수장비 | 헤르메스 | `assets/items/hermes2_0.png` |
| 9 | 메긴교르드의 고리 | 특수장비 | 토르 | `assets/items/thor2_1.png` |

## 하나씩 뽑기 (시트가 잘 안 될 때)

아래 「앞에 붙일 말」 뒤에 장비 한 줄을 붙여 보냅니다. 나온 그림은 표의 「잘라서 둘 곳」 이름으로 저장합니다 (배경은 나중에 도구가 걷어냅니다).

앞에 붙일 말:

```text
Make ONE square image, 1024x1024: a single game item icon.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: one object, centered, filling about 75% of the image, never touching the edges.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

ITEM — the name is Korean. Draw what the name describes; never write the name in the image.
If the name describes a different kind of object than its type, draw the object from the name.
```

- **명계의 이지창** → `assets/items/hades2_0.png`

  ```text
  WEAPON 「명계의 이지창」 — loot from the monster 「하데스」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **삼지창** → `assets/items/poseidon2_0.png`

  ```text
  WEAPON 「삼지창」 — loot from the monster 「포세이돈」. more refined and menacing; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **묠니르** → `assets/items/thor2_0.png`

  ```text
  WEAPON 「묠니르」 — loot from the monster 「토르」. plain look; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **고르곤의 머리를 단 방패** → `assets/items/athena_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「고르곤의 머리를 단 방패」 — loot from the monster 「아테나」. more refined and menacing; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **거짓의 단검** → `assets/items/loki2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「거짓의 단검」 — loot from the monster 「로키」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: front view, slightly tilted.
  ```

- **재칼의 가면** → `assets/items/anubis2_1.png`

  ```text
  HEADGEAR 「재칼의 가면」 — loot from the monster 「아누비스」. plain look; mood: pointed, piercing. Framing: 3/4 front view, empty (no head inside).
  ```

- **보이지 않게 하는 투구** → `assets/items/hades2_1.png`

  ```text
  HEADGEAR 「보이지 않게 하는 투구」 — loot from the monster 「하데스」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: 3/4 front view, empty (no head inside).
  ```

- **전화(戰禍)의 갑주** → `assets/items/ares2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「전화(戰禍)의 갑주」 — loot from the monster 「아레스」. more refined and menacing; mood: aggressive, sharp. Framing: front view, torso piece only, empty (no body inside).
  ```

- **표범 가죽 옷** → `assets/items/dionysus_0.png`

  ```text
  BODY ARMOR / CLOTHING 「표범 가죽 옷」 — loot from the monster 「디오니소스」. more refined and menacing; mood: sinister, a touch of blood red. Framing: front view, torso piece only, empty (no body inside).
  ```

- **방부사의 어깨띠** → `assets/items/anubis2_0.png`

  ```text
  SHOULDER GUARD 「방부사의 어깨띠」 — loot from the monster 「아누비스」. plain look; mood: pointed, piercing. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **공작 깃 견갑** → `assets/items/hera_0.png`

  ```text
  SHOULDER GUARD 「공작 깃 견갑」 — loot from the monster 「헤라」. more refined and menacing; mood: spiked, thorny. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **리라를 켜는 손** → `assets/items/apollo_0.png`

  ```text
  GLOVES / GAUNTLETS 「리라를 켜는 손」 — loot from the monster 「아폴론」. more refined and menacing; mood: reinforced, built to last. Framing: a pair, backs of the hands, fingers up.
  ```

- **불에 그을린 대장장이 손** → `assets/items/hephaestus_0.png`

  ```text
  GLOVES / GAUNTLETS 「불에 그을린 대장장이 손」 — loot from the monster 「헤파이스토스」. more refined and menacing; mood: sturdy, protective. Framing: a pair, backs of the hands, fingers up.
  ```

- **케스토스** → `assets/items/aphrodite_0.png`

  ```text
  BELT / SASH 「케스토스」 — loot from the monster 「아프로디테」. more refined and menacing; mood: sinister, a touch of blood red. Framing: laid in a loop, buckle or knot at the front.
  ```

- **소리 없는 각반** → `assets/items/bastet2_1.png`

  ```text
  LEG ARMOR 「소리 없는 각반」 — loot from the monster 「바스테트」. plain look; mood: light, slim, built for speed. Framing: a pair of shin guards, front view.
  ```

- **보리 이삭을 엮은 각반** → `assets/items/demeter_0.png`

  ```text
  LEG ARMOR 「보리 이삭을 엮은 각반」 — loot from the monster 「데메테르」. more refined and menacing; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **사슴가죽 신** → `assets/items/artemis2_0.png`

  ```text
  BOOTS / SHOES 「사슴가죽 신」 — loot from the monster 「아르테미스」. more refined and menacing; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **하늘 옷** → `assets/items/amaterasu2_0.png`

  ```text
  CLOAK / CAPE 「하늘 옷」 — loot from the monster 「아마테라스」. plain look; mood: reinforced, built to last. Framing: front view, hanging open, empty (no body inside).
  ```

- **폭풍의 겉옷** → `assets/items/susanoo2_0.png`

  ```text
  CLOAK / CAPE 「폭풍의 겉옷」 — loot from the monster 「스사노오」. plain look; mood: aggressive, sharp. Framing: front view, hanging open, empty (no body inside).
  ```

- **야사카니의 곡옥** → `assets/items/amaterasu2_1.png`

  ```text
  RING 「야사카니의 곡옥」 — loot from the monster 「아마테라스」. plain look; mood: reinforced, built to last. Framing: single ring, 3/4 view so the band is visible.
  ```

- **고양이의 눈** → `assets/items/bastet2_0.png`

  ```text
  RING 「고양이의 눈」 — loot from the monster 「바스테트」. plain look; mood: light, slim, built for speed. Framing: single ring, 3/4 view so the band is visible.
  ```

- **케르베로스의 사슬** → `assets/items/hades2_2.png`

  ```text
  NECKLACE / AMULET 「케르베로스의 사슬」 — loot from the monster 「하데스」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: chain in a loop, pendant at the bottom center.
  ```

- **앙크** → `assets/items/isis2_0.png`

  ```text
  NECKLACE / AMULET 「앙크」 — loot from the monster 「이시스」. plain look; mood: modest, well used. Framing: chain in a loop, pendant at the bottom center.
  ```

- **세계수 가지 팔찌** → `assets/items/chest_yggdrasil_bracelet.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「세계수 가지 팔찌」 — old treasure that was buried in a chest for a long time. plain look; mood: modest, well used. Framing: single band, 3/4 view.
  ```

- **뒤바뀐 반지** → `assets/items/loki2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「뒤바뀐 반지」 — loot from the monster 「로키」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: single band, 3/4 view.
  ```

- **폭풍 팔찌** → `assets/items/susanoo2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「폭풍 팔찌」 — loot from the monster 「스사노오」. plain look; mood: aggressive, sharp. Framing: single band, 3/4 view.
  ```

- **전령의 날개** → `assets/items/hermes2_0.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「전령의 날개」 — loot from the monster 「헤르메스」. a small ancient object; more refined and menacing. Framing: single small object, 3/4 view.
  ```

- **메긴교르드의 고리** → `assets/items/thor2_1.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「메긴교르드의 고리」 — loot from the monster 「토르」. a small shining stone or crystal; plain look. Framing: single small object, 3/4 view.
  ```
