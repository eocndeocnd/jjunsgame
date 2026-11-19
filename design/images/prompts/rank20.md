# 제20격 외신 — 장비 25개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 20-A — 무기 · 보조무기 · 투구 · 갑옷 (8개)

저장할 이름: `design/images/sheets/rank20-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「만물을 가르는 칼날」 — loot from the monster 「아자토스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
2. WEAPON 「혼돈 속에서 건진 칼」 — old treasure that was buried in a chest for a long time. plain look; mood: aggressive, sharp.
3. WEAPON 「공허의 낫」 — loot from the monster 「공허의 군주」. plain look; mood: pointed, piercing.
4. OFF-HAND (shield, book, lantern, orb ...) 「찢어진 장막」 — loot from the monster 「다올로스」. plain look; mood: pointed, piercing.
5. OFF-HAND (shield, book, lantern, orb ...) 「멈추지 않는 피리」 — loot from the monster 「아자토스의 피리꾼」. plain look; mood: reinforced, built to last.
6. HEADGEAR 「천 개째의 가면」 — loot from the monster 「니알라토텝」. more refined and menacing; mood: light, slim, built for speed.
7. HEADGEAR 「뿔난 관」 — loot from the monster 「슈브니구라스」. plain look; mood: reinforced, built to last.
8. BODY ARMOR / CLOTHING 「끓는 진흙 갑주」 — loot from the monster 「아브호스」. plain look; mood: sinister, a touch of blood red.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 만물을 가르는 칼날 | 무기 | 아자토스 | `assets/items/azathoth2_0.png` |
| 2 | 혼돈 속에서 건진 칼 | 무기 | 보물상자 | `assets/items/chest_chaos_blade.png` |
| 3 | 공허의 낫 | 무기 | 공허의 군주 | `assets/items/voidlordmyth2_0.png` |
| 4 | 찢어진 장막 | 보조무기 | 다올로스 | `assets/items/daoloth_1.png` |
| 5 | 멈추지 않는 피리 | 보조무기 | 아자토스의 피리꾼 | `assets/items/pipers_0.png` |
| 6 | 천 개째의 가면 | 투구 | 니알라토텝 | `assets/items/nyarlathotep2_1.png` |
| 7 | 뿔난 관 | 투구 | 슈브니구라스 | `assets/items/shubniggurath2_0.png` |
| 8 | 끓는 진흙 갑주 | 갑옷 | 아브호스 | `assets/items/abhoth2_0.png` |

## 시트 20-B — 갑옷 · 어깨 · 장갑 · 허리띠 · 각반 · 신발 (8개)

저장할 이름: `design/images/sheets/rank20-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「무(無)의 갑주」 — loot from the monster 「아자토스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
2. SHOULDER GUARD 「장막을 찢는 견갑」 — loot from the monster 「다올로스」. plain look; mood: pointed, piercing.
3. SHOULDER GUARD 「떠도는 별의 견갑」 — loot from the monster 「그로스」. plain look; mood: spiked, thorny.
4. GLOVES / GAUNTLETS 「불꽃으로 춤추는 손」 — loot from the monster 「툴주샤」. plain look; mood: aggressive, sharp.
5. GLOVES / GAUNTLETS 「모든 것을 빚은 손」 — loot from the monster 「우보-사틀라」. plain look; mood: modest, well used.
6. BELT / SASH 「처음이자 끝인 진흙 띠」 — loot from the monster 「우보-사틀라」. plain look; mood: modest, well used.
7. LEG ARMOR 「검은 털 각반」 — loot from the monster 「슈브니구라스」. plain look; mood: reinforced, built to last.
8. BOOTS / SHOES 「녹아내리는 신」 — loot from the monster 「아브호스」. plain look; mood: sinister, a touch of blood red.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 무(無)의 갑주 | 갑옷 | 아자토스 | `assets/items/azathoth2_1.png` |
| 2 | 장막을 찢는 견갑 | 어깨 | 다올로스 | `assets/items/daoloth_0.png` |
| 3 | 떠도는 별의 견갑 | 어깨 | 그로스 | `assets/items/ghroth_0.png` |
| 4 | 불꽃으로 춤추는 손 | 장갑 | 툴주샤 | `assets/items/tulzscha_1.png` |
| 5 | 모든 것을 빚은 손 | 장갑 | 우보-사틀라 | `assets/items/ubbosathla_1.png` |
| 6 | 처음이자 끝인 진흙 띠 | 허리띠 | 우보-사틀라 | `assets/items/ubbosathla_0.png` |
| 7 | 검은 털 각반 | 각반 | 슈브니구라스 | `assets/items/shubniggurath2_1.png` |
| 8 | 녹아내리는 신 | 신발 | 아브호스 | `assets/items/abhoth2_1.png` |

## 시트 20-C — 신발 · 망토 · 반지 · 목걸이 · 팔찌 (8개)

저장할 이름: `design/images/sheets/rank20-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BOOTS / SHOES 「별을 깨우며 걷는 신」 — loot from the monster 「그로스」. plain look; mood: spiked, thorny.
2. CLOAK / CAPE 「검은 파라오의 의복」 — loot from the monster 「니알라토텝」. more refined and menacing; mood: light, slim, built for speed.
3. CLOAK / CAPE 「시간을 덮는 망토」 — loot from the monster 「이브-츠틀」. plain look; mood: sturdy, protective.
4. RING 「초록 불꽃의 반지」 — loot from the monster 「툴주샤」. plain look; mood: aggressive, sharp.
5. RING 「모든 문의 열쇠」 — loot from the monster 「요그소토스」. more refined and menacing; mood: a lucky charm, a hint of gold.
6. NECKLACE / AMULET 「구체 속의 구체」 — loot from the monster 「요그소토스」. more refined and menacing; mood: a lucky charm, a hint of gold.
7. BRACELET / BANGLE / WRISTWATCH 「빈 고리」 — loot from the monster 「공허의 군주」. plain look; mood: pointed, piercing.
8. BRACELET / BANGLE / WRISTWATCH 「시간을 세는 팔찌」 — loot from the monster 「이브-츠틀」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 별을 깨우며 걷는 신 | 신발 | 그로스 | `assets/items/ghroth_1.png` |
| 2 | 검은 파라오의 의복 | 망토 | 니알라토텝 | `assets/items/nyarlathotep2_0.png` |
| 3 | 시간을 덮는 망토 | 망토 | 이브-츠틀 | `assets/items/yibbtstll_0.png` |
| 4 | 초록 불꽃의 반지 | 반지 | 툴주샤 | `assets/items/tulzscha_0.png` |
| 5 | 모든 문의 열쇠 | 반지 | 요그소토스 | `assets/items/yogsothoth2_0.png` |
| 6 | 구체 속의 구체 | 목걸이 | 요그소토스 | `assets/items/yogsothoth2_1.png` |
| 7 | 빈 고리 | 팔찌 | 공허의 군주 | `assets/items/voidlordmyth2_1.png` |
| 8 | 시간을 세는 팔찌 | 팔찌 | 이브-츠틀 | `assets/items/yibbtstll_1.png` |

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

- **만물을 가르는 칼날** → `assets/items/azathoth2_0.png`

  ```text
  WEAPON 「만물을 가르는 칼날」 — loot from the monster 「아자토스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **혼돈 속에서 건진 칼** → `assets/items/chest_chaos_blade.png`

  ```text
  WEAPON 「혼돈 속에서 건진 칼」 — old treasure that was buried in a chest for a long time. plain look; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **공허의 낫** → `assets/items/voidlordmyth2_0.png`

  ```text
  WEAPON 「공허의 낫」 — loot from the monster 「공허의 군주」. plain look; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **찢어진 장막** → `assets/items/daoloth_1.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「찢어진 장막」 — loot from the monster 「다올로스」. plain look; mood: pointed, piercing. Framing: front view, slightly tilted.
  ```

- **멈추지 않는 피리** → `assets/items/pipers_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「멈추지 않는 피리」 — loot from the monster 「아자토스의 피리꾼」. plain look; mood: reinforced, built to last. Framing: front view, slightly tilted.
  ```

- **천 개째의 가면** → `assets/items/nyarlathotep2_1.png`

  ```text
  HEADGEAR 「천 개째의 가면」 — loot from the monster 「니알라토텝」. more refined and menacing; mood: light, slim, built for speed. Framing: 3/4 front view, empty (no head inside).
  ```

- **뿔난 관** → `assets/items/shubniggurath2_0.png`

  ```text
  HEADGEAR 「뿔난 관」 — loot from the monster 「슈브니구라스」. plain look; mood: reinforced, built to last. Framing: 3/4 front view, empty (no head inside).
  ```

- **끓는 진흙 갑주** → `assets/items/abhoth2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「끓는 진흙 갑주」 — loot from the monster 「아브호스」. plain look; mood: sinister, a touch of blood red. Framing: front view, torso piece only, empty (no body inside).
  ```

- **무(無)의 갑주** → `assets/items/azathoth2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「무(無)의 갑주」 — loot from the monster 「아자토스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **장막을 찢는 견갑** → `assets/items/daoloth_0.png`

  ```text
  SHOULDER GUARD 「장막을 찢는 견갑」 — loot from the monster 「다올로스」. plain look; mood: pointed, piercing. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **떠도는 별의 견갑** → `assets/items/ghroth_0.png`

  ```text
  SHOULDER GUARD 「떠도는 별의 견갑」 — loot from the monster 「그로스」. plain look; mood: spiked, thorny. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **불꽃으로 춤추는 손** → `assets/items/tulzscha_1.png`

  ```text
  GLOVES / GAUNTLETS 「불꽃으로 춤추는 손」 — loot from the monster 「툴주샤」. plain look; mood: aggressive, sharp. Framing: a pair, backs of the hands, fingers up.
  ```

- **모든 것을 빚은 손** → `assets/items/ubbosathla_1.png`

  ```text
  GLOVES / GAUNTLETS 「모든 것을 빚은 손」 — loot from the monster 「우보-사틀라」. plain look; mood: modest, well used. Framing: a pair, backs of the hands, fingers up.
  ```

- **처음이자 끝인 진흙 띠** → `assets/items/ubbosathla_0.png`

  ```text
  BELT / SASH 「처음이자 끝인 진흙 띠」 — loot from the monster 「우보-사틀라」. plain look; mood: modest, well used. Framing: laid in a loop, buckle or knot at the front.
  ```

- **검은 털 각반** → `assets/items/shubniggurath2_1.png`

  ```text
  LEG ARMOR 「검은 털 각반」 — loot from the monster 「슈브니구라스」. plain look; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **녹아내리는 신** → `assets/items/abhoth2_1.png`

  ```text
  BOOTS / SHOES 「녹아내리는 신」 — loot from the monster 「아브호스」. plain look; mood: sinister, a touch of blood red. Framing: a pair, side view facing right.
  ```

- **별을 깨우며 걷는 신** → `assets/items/ghroth_1.png`

  ```text
  BOOTS / SHOES 「별을 깨우며 걷는 신」 — loot from the monster 「그로스」. plain look; mood: spiked, thorny. Framing: a pair, side view facing right.
  ```

- **검은 파라오의 의복** → `assets/items/nyarlathotep2_0.png`

  ```text
  CLOAK / CAPE 「검은 파라오의 의복」 — loot from the monster 「니알라토텝」. more refined and menacing; mood: light, slim, built for speed. Framing: front view, hanging open, empty (no body inside).
  ```

- **시간을 덮는 망토** → `assets/items/yibbtstll_0.png`

  ```text
  CLOAK / CAPE 「시간을 덮는 망토」 — loot from the monster 「이브-츠틀」. plain look; mood: sturdy, protective. Framing: front view, hanging open, empty (no body inside).
  ```

- **초록 불꽃의 반지** → `assets/items/tulzscha_0.png`

  ```text
  RING 「초록 불꽃의 반지」 — loot from the monster 「툴주샤」. plain look; mood: aggressive, sharp. Framing: single ring, 3/4 view so the band is visible.
  ```

- **모든 문의 열쇠** → `assets/items/yogsothoth2_0.png`

  ```text
  RING 「모든 문의 열쇠」 — loot from the monster 「요그소토스」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: single ring, 3/4 view so the band is visible.
  ```

- **백치의 왕관** → `assets/items/azathoth2_2.png`

  ```text
  NECKLACE / AMULET 「백치의 왕관」 — loot from the monster 「아자토스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: chain in a loop, pendant at the bottom center.
  ```

- **구체 속의 구체** → `assets/items/yogsothoth2_1.png`

  ```text
  NECKLACE / AMULET 「구체 속의 구체」 — loot from the monster 「요그소토스」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: chain in a loop, pendant at the bottom center.
  ```

- **빈 고리** → `assets/items/voidlordmyth2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「빈 고리」 — loot from the monster 「공허의 군주」. plain look; mood: pointed, piercing. Framing: single band, 3/4 view.
  ```

- **시간을 세는 팔찌** → `assets/items/yibbtstll_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「시간을 세는 팔찌」 — loot from the monster 「이브-츠틀」. plain look; mood: sturdy, protective. Framing: single band, 3/4 view.
  ```
