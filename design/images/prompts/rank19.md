# 제19격 고신 — 장비 21개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 19-A — 무기 · 보조무기 · 투구 · 갑옷 · 어깨 (7개)

저장할 이름: `design/images/sheets/rank19-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「포말하우트의 불꽃」 — loot from the monster 「크투가」. more refined and menacing; mood: aggressive, sharp.
2. WEAPON 「르뤼에의 촉수」 — loot from the monster 「크툴루」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
3. OFF-HAND (shield, book, lantern, orb ...) 「뇌를 담은 원통」 — loot from the monster 「미-고」. plain look; mood: pointed, piercing.
4. HEADGEAR 「녹슨 관」 — loot from the monster 「글라아키」. plain look; mood: modest, well used.
5. BODY ARMOR / CLOTHING 「심해의 갑각」 — loot from the monster 「크툴루」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
6. BODY ARMOR / CLOTHING 「형체 없는 원형질 갑옷」 — loot from the monster 「쇼고스」. plain look; mood: reinforced, built to last.
7. SHOULDER GUARD 「상아 어깨뼈」 — loot from the monster 「차우그나르 파우근」. plain look; mood: sinister, a touch of blood red.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 포말하우트의 불꽃 | 무기 | 크투가 | `assets/items/cthugha_0.png` |
| 2 | 르뤼에의 촉수 | 무기 | 크툴루 | `assets/items/cthulhu2_0.png` |
| 3 | 뇌를 담은 원통 | 보조무기 | 미-고 | `assets/items/migo_0.png` |
| 4 | 녹슨 관 | 투구 | 글라아키 | `assets/items/glaaki2_0.png` |
| 5 | 심해의 갑각 | 갑옷 | 크툴루 | `assets/items/cthulhu2_1.png` |
| 6 | 형체 없는 원형질 갑옷 | 갑옷 | 쇼고스 | `assets/items/shoggoth_0.png` |
| 7 | 상아 어깨뼈 | 어깨 | 차우그나르 파우근 | `assets/items/chaugnar2_0.png` |

## 시트 19-B — 장갑 · 허리띠 · 각반 · 신발 · 망토 (7개)

저장할 이름: `design/images/sheets/rank19-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. GLOVES / GAUNTLETS 「물갈퀴 장갑」 — loot from the monster 「다곤」. more refined and menacing; mood: sinister, a touch of blood red.
2. GLOVES / GAUNTLETS 「테켈리리 하고 우는 손」 — loot from the monster 「쇼고스」. plain look; mood: reinforced, built to last.
3. BELT / SASH 「심연에 걸친 실」 — loot from the monster 「아틀락-나챠」. plain look; mood: sturdy, protective.
4. BELT / SASH 「방울뱀 허리띠」 — loot from the monster 「이그」. plain look; mood: spiked, thorny.
5. LEG ARMOR 「호수 바닥의 각반」 — loot from the monster 「글라아키」. plain look; mood: modest, well used.
6. BOOTS / SHOES 「눈을 밟지 않는 신」 — loot from the monster 「이타콰」. plain look; mood: light, slim, built for speed.
7. CLOAK / CAPE 「누더기 황의」 — loot from the monster 「하스터」. more refined and menacing; mood: spiked, thorny.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 물갈퀴 장갑 | 장갑 | 다곤 | `assets/items/dagon2_0.png` |
| 2 | 테켈리리 하고 우는 손 | 장갑 | 쇼고스 | `assets/items/shoggoth_1.png` |
| 3 | 심연에 걸친 실 | 허리띠 | 아틀락-나챠 | `assets/items/atlachnacha_1.png` |
| 4 | 방울뱀 허리띠 | 허리띠 | 이그 | `assets/items/yig2_0.png` |
| 5 | 호수 바닥의 각반 | 각반 | 글라아키 | `assets/items/glaaki2_1.png` |
| 6 | 눈을 밟지 않는 신 | 신발 | 이타콰 | `assets/items/ithaqua2_0.png` |
| 7 | 누더기 황의 | 망토 | 하스터 | `assets/items/hastur2_0.png` |

## 시트 19-C — 망토 · 반지 · 목걸이 · 팔찌 · 특수장비 (7개)

저장할 이름: `design/images/sheets/rank19-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. CLOAK / CAPE 「바람의 망토」 — loot from the monster 「이타콰」. plain look; mood: light, slim, built for speed.
2. RING 「저주의 고리」 — loot from the monster 「이그」. plain look; mood: spiked, thorny.
3. NECKLACE / AMULET 「거미줄에 걸린 꿈」 — loot from the monster 「아틀락-나챠」. plain look; mood: sturdy, protective.
4. NECKLACE / AMULET 「가라앉은 도시의 산호 목걸이」 — old treasure that was buried in a chest for a long time. plain look; mood: pointed, piercing.
5. BRACELET / BANGLE / WRISTWATCH 「상아 팔찌」 — loot from the monster 「차우그나르 파우근」. plain look; mood: sinister, a touch of blood red.
6. BRACELET / BANGLE / WRISTWATCH 「잠의 팔찌」 — loot from the monster 「츠아토구아」. more refined and menacing; mood: reinforced, built to last.
7. SMALL PRECIOUS OBJECT (gem or relic) 「잠든 신의 우상」 — loot from the monster 「크툴루」. a small ancient object; the most ornate and imposing piece of this set.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 바람의 망토 | 망토 | 이타콰 | `assets/items/ithaqua2_1.png` |
| 2 | 저주의 고리 | 반지 | 이그 | `assets/items/yig2_1.png` |
| 3 | 거미줄에 걸린 꿈 | 목걸이 | 아틀락-나챠 | `assets/items/atlachnacha_0.png` |
| 4 | 가라앉은 도시의 산호 목걸이 | 목걸이 | 보물상자 | `assets/items/chest_rlyeh_necklace.png` |
| 5 | 상아 팔찌 | 팔찌 | 차우그나르 파우근 | `assets/items/chaugnar2_1.png` |
| 6 | 잠의 팔찌 | 팔찌 | 츠아토구아 | `assets/items/tsathoggua2_0.png` |
| 7 | 잠든 신의 우상 | 특수장비 | 크툴루 | `assets/items/cthulhu2_2.png` |

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

- **포말하우트의 불꽃** → `assets/items/cthugha_0.png`

  ```text
  WEAPON 「포말하우트의 불꽃」 — loot from the monster 「크투가」. more refined and menacing; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **르뤼에의 촉수** → `assets/items/cthulhu2_0.png`

  ```text
  WEAPON 「르뤼에의 촉수」 — loot from the monster 「크툴루」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **뇌를 담은 원통** → `assets/items/migo_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「뇌를 담은 원통」 — loot from the monster 「미-고」. plain look; mood: pointed, piercing. Framing: front view, slightly tilted.
  ```

- **녹슨 관** → `assets/items/glaaki2_0.png`

  ```text
  HEADGEAR 「녹슨 관」 — loot from the monster 「글라아키」. plain look; mood: modest, well used. Framing: 3/4 front view, empty (no head inside).
  ```

- **심해의 갑각** → `assets/items/cthulhu2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「심해의 갑각」 — loot from the monster 「크툴루」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **형체 없는 원형질 갑옷** → `assets/items/shoggoth_0.png`

  ```text
  BODY ARMOR / CLOTHING 「형체 없는 원형질 갑옷」 — loot from the monster 「쇼고스」. plain look; mood: reinforced, built to last. Framing: front view, torso piece only, empty (no body inside).
  ```

- **상아 어깨뼈** → `assets/items/chaugnar2_0.png`

  ```text
  SHOULDER GUARD 「상아 어깨뼈」 — loot from the monster 「차우그나르 파우근」. plain look; mood: sinister, a touch of blood red. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **물갈퀴 장갑** → `assets/items/dagon2_0.png`

  ```text
  GLOVES / GAUNTLETS 「물갈퀴 장갑」 — loot from the monster 「다곤」. more refined and menacing; mood: sinister, a touch of blood red. Framing: a pair, backs of the hands, fingers up.
  ```

- **테켈리리 하고 우는 손** → `assets/items/shoggoth_1.png`

  ```text
  GLOVES / GAUNTLETS 「테켈리리 하고 우는 손」 — loot from the monster 「쇼고스」. plain look; mood: reinforced, built to last. Framing: a pair, backs of the hands, fingers up.
  ```

- **심연에 걸친 실** → `assets/items/atlachnacha_1.png`

  ```text
  BELT / SASH 「심연에 걸친 실」 — loot from the monster 「아틀락-나챠」. plain look; mood: sturdy, protective. Framing: laid in a loop, buckle or knot at the front.
  ```

- **방울뱀 허리띠** → `assets/items/yig2_0.png`

  ```text
  BELT / SASH 「방울뱀 허리띠」 — loot from the monster 「이그」. plain look; mood: spiked, thorny. Framing: laid in a loop, buckle or knot at the front.
  ```

- **호수 바닥의 각반** → `assets/items/glaaki2_1.png`

  ```text
  LEG ARMOR 「호수 바닥의 각반」 — loot from the monster 「글라아키」. plain look; mood: modest, well used. Framing: a pair of shin guards, front view.
  ```

- **눈을 밟지 않는 신** → `assets/items/ithaqua2_0.png`

  ```text
  BOOTS / SHOES 「눈을 밟지 않는 신」 — loot from the monster 「이타콰」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **누더기 황의** → `assets/items/hastur2_0.png`

  ```text
  CLOAK / CAPE 「누더기 황의」 — loot from the monster 「하스터」. more refined and menacing; mood: spiked, thorny. Framing: front view, hanging open, empty (no body inside).
  ```

- **바람의 망토** → `assets/items/ithaqua2_1.png`

  ```text
  CLOAK / CAPE 「바람의 망토」 — loot from the monster 「이타콰」. plain look; mood: light, slim, built for speed. Framing: front view, hanging open, empty (no body inside).
  ```

- **저주의 고리** → `assets/items/yig2_1.png`

  ```text
  RING 「저주의 고리」 — loot from the monster 「이그」. plain look; mood: spiked, thorny. Framing: single ring, 3/4 view so the band is visible.
  ```

- **거미줄에 걸린 꿈** → `assets/items/atlachnacha_0.png`

  ```text
  NECKLACE / AMULET 「거미줄에 걸린 꿈」 — loot from the monster 「아틀락-나챠」. plain look; mood: sturdy, protective. Framing: chain in a loop, pendant at the bottom center.
  ```

- **가라앉은 도시의 산호 목걸이** → `assets/items/chest_rlyeh_necklace.png`

  ```text
  NECKLACE / AMULET 「가라앉은 도시의 산호 목걸이」 — old treasure that was buried in a chest for a long time. plain look; mood: pointed, piercing. Framing: chain in a loop, pendant at the bottom center.
  ```

- **상아 팔찌** → `assets/items/chaugnar2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「상아 팔찌」 — loot from the monster 「차우그나르 파우근」. plain look; mood: sinister, a touch of blood red. Framing: single band, 3/4 view.
  ```

- **잠의 팔찌** → `assets/items/tsathoggua2_0.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「잠의 팔찌」 — loot from the monster 「츠아토구아」. more refined and menacing; mood: reinforced, built to last. Framing: single band, 3/4 view.
  ```

- **잠든 신의 우상** → `assets/items/cthulhu2_2.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「잠든 신의 우상」 — loot from the monster 「크툴루」. a small ancient object; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```
