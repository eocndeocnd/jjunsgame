# 제15격 악마 — 장비 28개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 15-A — 무기 · 보조무기 · 갑옷 · 어깨 (7개)

저장할 이름: `design/images/sheets/rank15-A.png`

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
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「처음 벼린 칼」 — loot from the monster 「아자젤」. plain look; mood: pointed, piercing.
2. WEAPON 「새벽별의 검」 — loot from the monster 「루시퍼」. the most ornate and imposing piece of this set; mood: pointed, piercing.
3. OFF-HAND (shield, book, lantern, orb ...) 「염소 머리 우상」 — loot from the monster 「바포메트」. plain look; mood: modest, well used.
4. OFF-HAND (shield, book, lantern, orb ...) 「모든 학문의 책」 — loot from the monster 「파이몬」. more refined and menacing; mood: sturdy, protective.
5. BODY ARMOR / CLOTHING 「파리 날개 갑의」 — loot from the monster 「벨제부브」. more refined and menacing; mood: sinister, a touch of blood red.
6. BODY ARMOR / CLOTHING 「이천 마리 돼지가죽」 — loot from the monster 「레기온」. plain look; mood: heavy, blunt, massive.
7. SHOULDER GUARD 「감시자의 견갑」 — loot from the monster 「아자젤」. plain look; mood: pointed, piercing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 처음 벼린 칼 | 무기 | 아자젤 | `assets/items/azazel2_0.png` |
| 2 | 새벽별의 검 | 무기 | 루시퍼 | `assets/items/lucifer2_0.png` |
| 3 | 염소 머리 우상 | 보조무기 | 바포메트 | `assets/items/baphomet2_0.png` |
| 4 | 모든 학문의 책 | 보조무기 | 파이몬 | `assets/items/paimon2_0.png` |
| 5 | 파리 날개 갑의 | 갑옷 | 벨제부브 | `assets/items/beelzebub2_1.png` |
| 6 | 이천 마리 돼지가죽 | 갑옷 | 레기온 | `assets/items/legion2_0.png` |
| 7 | 감시자의 견갑 | 어깨 | 아자젤 | `assets/items/azazel2_1.png` |

## 시트 15-B — 어깨 · 장갑 · 허리띠 · 각반 · 신발 (7개)

저장할 이름: `design/images/sheets/rank15-B.png`

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
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. SHOULDER GUARD 「곰을 탄 왕의 견갑」 — loot from the monster 「푸르손」. more refined and menacing; mood: reinforced, built to last.
2. GLOVES / GAUNTLETS 「보이지 않게 하는 손」 — loot from the monster 「바엘」. more refined and menacing; mood: light, slim, built for speed.
3. GLOVES / GAUNTLETS 「코키토스 서리 장갑」 — old treasure that was buried in a chest for a long time. plain look; mood: sinister, a touch of blood red.
4. BELT / SASH 「쇠를 금화로 바꾸는 띠」 — loot from the monster 「자간」. more refined and menacing; mood: spiked, thorny.
5. LEG ARMOR 「불의 전차 각반」 — loot from the monster 「벨리알」. more refined and menacing; mood: spiked, thorny.
6. LEG ARMOR 「탑을 허무는 각반」 — loot from the monster 「바인」. more refined and menacing; mood: aggressive, sharp.
7. BOOTS / SHOES 「독사를 탄 신」 — loot from the monster 「아스타로트」. plain look; mood: light, slim, built for speed.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 곰을 탄 왕의 견갑 | 어깨 | 푸르손 | `assets/items/purson_0.png` |
| 2 | 보이지 않게 하는 손 | 장갑 | 바엘 | `assets/items/bael_0.png` |
| 3 | 코키토스 서리 장갑 | 장갑 | 보물상자 | `assets/items/chest_cocytus_gloves.png` |
| 4 | 쇠를 금화로 바꾸는 띠 | 허리띠 | 자간 | `assets/items/zagan_0.png` |
| 5 | 불의 전차 각반 | 각반 | 벨리알 | `assets/items/belial2_0.png` |
| 6 | 탑을 허무는 각반 | 각반 | 바인 | `assets/items/vine_0.png` |
| 7 | 독사를 탄 신 | 신발 | 아스타로트 | `assets/items/astaroth2_0.png` |

## 시트 15-C — 망토 · 반지 · 목걸이 · 팔찌 (7개)

저장할 이름: `design/images/sheets/rank15-C.png`

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

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. CLOAK / CAPE 「빛을 잃은 여섯 날개」 — loot from the monster 「루시퍼」. the most ornate and imposing piece of this set; mood: pointed, piercing.
2. CLOAK / CAPE 「진홍 외투」 — loot from the monster 「메피스토펠레스」. plain look; mood: a lucky charm, a hint of gold.
3. RING 「솔로몬의 반지」 — loot from the monster 「아스모데우스」. more refined and menacing; mood: aggressive, sharp.
4. RING 「많은 이름의 반지」 — loot from the monster 「레기온」. plain look; mood: heavy, blunt, massive.
5. NECKLACE / AMULET 「피로 쓴 계약서」 — loot from the monster 「메피스토펠레스」. plain look; mood: a lucky charm, a hint of gold.
6. BRACELET / BANGLE / WRISTWATCH 「녹이고 굳히는 팔찌」 — loot from the monster 「바포메트」. plain look; mood: modest, well used.
7. BRACELET / BANGLE / WRISTWATCH 「첫 아내의 팔찌」 — loot from the monster 「릴리스」. plain look; mood: sinister, a touch of blood red.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 빛을 잃은 여섯 날개 | 망토 | 루시퍼 | `assets/items/lucifer2_1.png` |
| 2 | 진홍 외투 | 망토 | 메피스토펠레스 | `assets/items/mephisto2_1.png` |
| 3 | 솔로몬의 반지 | 반지 | 아스모데우스 | `assets/items/asmodeus2_0.png` |
| 4 | 많은 이름의 반지 | 반지 | 레기온 | `assets/items/legion2_1.png` |
| 5 | 피로 쓴 계약서 | 목걸이 | 메피스토펠레스 | `assets/items/mephisto2_0.png` |
| 6 | 녹이고 굳히는 팔찌 | 팔찌 | 바포메트 | `assets/items/baphomet2_1.png` |
| 7 | 첫 아내의 팔찌 | 팔찌 | 릴리스 | `assets/items/lilith2_0.png` |

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

- **처음 벼린 칼** → `assets/items/azazel2_0.png`

  ```text
  WEAPON 「처음 벼린 칼」 — loot from the monster 「아자젤」. plain look; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **새벽별의 검** → `assets/items/lucifer2_0.png`

  ```text
  WEAPON 「새벽별의 검」 — loot from the monster 「루시퍼」. the most ornate and imposing piece of this set; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **염소 머리 우상** → `assets/items/baphomet2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「염소 머리 우상」 — loot from the monster 「바포메트」. plain look; mood: modest, well used. Framing: front view, slightly tilted.
  ```

- **모든 학문의 책** → `assets/items/paimon2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「모든 학문의 책」 — loot from the monster 「파이몬」. more refined and menacing; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **파리 떼의 관** → `assets/items/beelzebub2_0.png`

  ```text
  HEADGEAR 「파리 떼의 관」 — loot from the monster 「벨제부브」. more refined and menacing; mood: sinister, a touch of blood red. Framing: 3/4 front view, empty (no head inside).
  ```

- **황소 머리 투구** → `assets/items/moloch2_0.png`

  ```text
  HEADGEAR 「황소 머리 투구」 — loot from the monster 「몰록」. plain look; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **파리 날개 갑의** → `assets/items/beelzebub2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「파리 날개 갑의」 — loot from the monster 「벨제부브」. more refined and menacing; mood: sinister, a touch of blood red. Framing: front view, torso piece only, empty (no body inside).
  ```

- **이천 마리 돼지가죽** → `assets/items/legion2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「이천 마리 돼지가죽」 — loot from the monster 「레기온」. plain look; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **감시자의 견갑** → `assets/items/azazel2_1.png`

  ```text
  SHOULDER GUARD 「감시자의 견갑」 — loot from the monster 「아자젤」. plain look; mood: pointed, piercing. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **곰을 탄 왕의 견갑** → `assets/items/purson_0.png`

  ```text
  SHOULDER GUARD 「곰을 탄 왕의 견갑」 — loot from the monster 「푸르손」. more refined and menacing; mood: reinforced, built to last. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **보이지 않게 하는 손** → `assets/items/bael_0.png`

  ```text
  GLOVES / GAUNTLETS 「보이지 않게 하는 손」 — loot from the monster 「바엘」. more refined and menacing; mood: light, slim, built for speed. Framing: a pair, backs of the hands, fingers up.
  ```

- **코키토스 서리 장갑** → `assets/items/chest_cocytus_gloves.png`

  ```text
  GLOVES / GAUNTLETS 「코키토스 서리 장갑」 — old treasure that was buried in a chest for a long time. plain look; mood: sinister, a touch of blood red. Framing: a pair, backs of the hands, fingers up.
  ```

- **제단 불에 그을린 손** → `assets/items/moloch2_1.png`

  ```text
  GLOVES / GAUNTLETS 「제단 불에 그을린 손」 — loot from the monster 「몰록」. plain look; mood: aggressive, sharp. Framing: a pair, backs of the hands, fingers up.
  ```

- **독사 허리띠** → `assets/items/astaroth2_1.png`

  ```text
  BELT / SASH 「독사 허리띠」 — loot from the monster 「아스타로트」. plain look; mood: light, slim, built for speed. Framing: laid in a loop, buckle or knot at the front.
  ```

- **쇠를 금화로 바꾸는 띠** → `assets/items/zagan_0.png`

  ```text
  BELT / SASH 「쇠를 금화로 바꾸는 띠」 — loot from the monster 「자간」. more refined and menacing; mood: spiked, thorny. Framing: laid in a loop, buckle or knot at the front.
  ```

- **불의 전차 각반** → `assets/items/belial2_0.png`

  ```text
  LEG ARMOR 「불의 전차 각반」 — loot from the monster 「벨리알」. more refined and menacing; mood: spiked, thorny. Framing: a pair of shin guards, front view.
  ```

- **탑을 허무는 각반** → `assets/items/vine_0.png`

  ```text
  LEG ARMOR 「탑을 허무는 각반」 — loot from the monster 「바인」. more refined and menacing; mood: aggressive, sharp. Framing: a pair of shin guards, front view.
  ```

- **독사를 탄 신** → `assets/items/astaroth2_0.png`

  ```text
  BOOTS / SHOES 「독사를 탄 신」 — loot from the monster 「아스타로트」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **창백한 말의 박차** → `assets/items/beleth_0.png`

  ```text
  BOOTS / SHOES 「창백한 말의 박차」 — loot from the monster 「벨레트」. more refined and menacing; mood: heavy, blunt, massive. Framing: a pair, side view facing right.
  ```

- **빛을 잃은 여섯 날개** → `assets/items/lucifer2_1.png`

  ```text
  CLOAK / CAPE 「빛을 잃은 여섯 날개」 — loot from the monster 「루시퍼」. the most ornate and imposing piece of this set; mood: pointed, piercing. Framing: front view, hanging open, empty (no body inside).
  ```

- **진홍 외투** → `assets/items/mephisto2_1.png`

  ```text
  CLOAK / CAPE 「진홍 외투」 — loot from the monster 「메피스토펠레스」. plain look; mood: a lucky charm, a hint of gold. Framing: front view, hanging open, empty (no body inside).
  ```

- **솔로몬의 반지** → `assets/items/asmodeus2_0.png`

  ```text
  RING 「솔로몬의 반지」 — loot from the monster 「아스모데우스」. more refined and menacing; mood: aggressive, sharp. Framing: single ring, 3/4 view so the band is visible.
  ```

- **많은 이름의 반지** → `assets/items/legion2_1.png`

  ```text
  RING 「많은 이름의 반지」 — loot from the monster 「레기온」. plain look; mood: heavy, blunt, massive. Framing: single ring, 3/4 view so the band is visible.
  ```

- **앞일을 말하는 목걸이** → `assets/items/balam_0.png`

  ```text
  NECKLACE / AMULET 「앞일을 말하는 목걸이」 — loot from the monster 「발람」. more refined and menacing; mood: sturdy, protective. Framing: chain in a loop, pendant at the bottom center.
  ```

- **피로 쓴 계약서** → `assets/items/mephisto2_0.png`

  ```text
  NECKLACE / AMULET 「피로 쓴 계약서」 — loot from the monster 「메피스토펠레스」. plain look; mood: a lucky charm, a hint of gold. Framing: chain in a loop, pendant at the bottom center.
  ```

- **녹이고 굳히는 팔찌** → `assets/items/baphomet2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「녹이고 굳히는 팔찌」 — loot from the monster 「바포메트」. plain look; mood: modest, well used. Framing: single band, 3/4 view.
  ```

- **첫 아내의 팔찌** → `assets/items/lilith2_0.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「첫 아내의 팔찌」 — loot from the monster 「릴리스」. plain look; mood: sinister, a touch of blood red. Framing: single band, 3/4 view.
  ```

- **새벽별 조각** → `assets/items/lucifer2_2.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「새벽별 조각」 — loot from the monster 「루시퍼」. a small ancient object; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```
