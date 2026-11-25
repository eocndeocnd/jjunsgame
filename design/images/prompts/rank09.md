# 제9격 마도 — 장비 29개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 9-A — 무기 · 보조무기 · 투구 · 갑옷 · 어깨 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank09-A.png`

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

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「별을 부르는 지팡이」 — loot from the monster 「대마법사」. plain look; mood: aggressive, sharp.
2. WEAPON 「절구공이」 — loot from the monster 「바바 야가」. plain look; mood: pointed, piercing.
3. WEAPON 「꿈을 꾸는 지팡이」 — loot from the monster 「멀린」. the most ornate and imposing piece of this set; mood: reinforced, built to last.
4. OFF-HAND (shield, book, lantern, orb ...) 「이름을 적은 마도서」 — loot from the monster 「소환술사」. plain look; mood: sturdy, protective.
5. OFF-HAND (shield, book, lantern, orb ...) 「끝까지 읽은 금지된 책」 — loot from the monster 「흑마법사」. plain look; mood: sinister, a touch of blood red.
6. HEADGEAR 「마나가 고인 고깔모자」 — loot from the monster 「대마법사」. plain look; mood: aggressive, sharp.
7. BODY ARMOR / CLOTHING 「얼룩진 연금 앞치마」 — loot from the monster 「연금술사」. plain look; mood: modest, well used.
8. BODY ARMOR / CLOTHING 「그림자 로브」 — loot from the monster 「흑마법사」. plain look; mood: sinister, a touch of blood red.
9. SHOULDER GUARD 「룬을 새긴 견갑」 — loot from the monster 「룬 마법사」. plain look; mood: reinforced, built to last.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 별을 부르는 지팡이 | 무기 | 대마법사 | `assets/items/archmage_0.png` ✅ |
| 2 | 절구공이 | 무기 | 바바 야가 | `assets/items/babayaga_0.png` ✅ |
| 3 | 꿈을 꾸는 지팡이 | 무기 | 멀린 | `assets/items/merlin_0.png` ✅ |
| 4 | 이름을 적은 마도서 | 보조무기 | 소환술사 | `assets/items/summoner_0.png` ✅ |
| 5 | 끝까지 읽은 금지된 책 | 보조무기 | 흑마법사 | `assets/items/warlock_0.png` ✅ |
| 6 | 마나가 고인 고깔모자 | 투구 | 대마법사 | `assets/items/archmage_1.png` ✅ |
| 7 | 얼룩진 연금 앞치마 | 갑옷 | 연금술사 | `assets/items/alchemist_0.png` ✅ |
| 8 | 그림자 로브 | 갑옷 | 흑마법사 | `assets/items/warlock_1.png` ✅ |
| 9 | 룬을 새긴 견갑 | 어깨 | 룬 마법사 | `assets/items/runemage_0.png` ✅ |

## 시트 9-B — 장갑 · 허리띠 · 각반 · 신발 · 망토 (8개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank09-B.png`

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

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. GLOVES / GAUNTLETS 「네 원소를 쥔 손」 — loot from the monster 「원소술사」. plain look; mood: heavy, blunt, massive.
2. GLOVES / GAUNTLETS 「화염 손」 — loot from the monster 「샐러맨더」. more refined and menacing; mood: aggressive, sharp.
3. BELT / SASH 「약병을 꽂은 허리띠」 — loot from the monster 「연금술사」. plain look; mood: modest, well used.
4. BELT / SASH 「안개로 짠 허리띠」 — old treasure that was buried in a chest for a long time. plain look; mood: reinforced, built to last.
5. LEG ARMOR 「떡갈나무 껍질 각반」 — loot from the monster 「드루이드」. plain look; mood: reinforced, built to last.
6. LEG ARMOR 「땅속을 걷는 각반」 — loot from the monster 「노움」. more refined and menacing; mood: sturdy, protective.
7. BOOTS / SHOES 「바람의 신」 — loot from the monster 「실프」. more refined and menacing; mood: light, slim, built for speed.
8. CLOAK / CAPE 「겨우살이 두건」 — loot from the monster 「드루이드」. plain look; mood: reinforced, built to last.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 네 원소를 쥔 손 | 장갑 | 원소술사 | `assets/items/elementalist_0.png` ✅ |
| 2 | 화염 손 | 장갑 | 샐러맨더 | `assets/items/salamander2_0.png` ✅ |
| 3 | 약병을 꽂은 허리띠 | 허리띠 | 연금술사 | `assets/items/alchemist_1.png` ✅ |
| 4 | 안개로 짠 허리띠 | 허리띠 | 보물상자 | `assets/items/chest_avalon_belt.png` ✅ |
| 5 | 떡갈나무 껍질 각반 | 각반 | 드루이드 | `assets/items/druid_1.png` ✅ |
| 6 | 땅속을 걷는 각반 | 각반 | 노움 | `assets/items/gnome_0.png` ✅ |
| 7 | 바람의 신 | 신발 | 실프 | `assets/items/sylph2_0.png` ✅ |
| 8 | 겨우살이 두건 | 망토 | 드루이드 | `assets/items/druid_0.png` ✅ |

## 시트 9-C — 망토 · 반지 · 목걸이 · 팔찌 (8개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank09-C.png`

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

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. CLOAK / CAPE 「박사의 검은 가운」 — loot from the monster 「파우스트」. more refined and menacing; mood: a lucky charm, a hint of gold.
2. CLOAK / CAPE 「아발론의 안개 망토」 — loot from the monster 「모르간 르 페이」. more refined and menacing; mood: aggressive, sharp.
3. RING 「요정 여왕의 반지」 — loot from the monster 「모르간 르 페이」. more refined and menacing; mood: aggressive, sharp.
4. RING 「계약의 인장」 — loot from the monster 「소환술사」. plain look; mood: sturdy, protective.
5. NECKLACE / AMULET 「탑에 갇힌 수정」 — loot from the monster 「멀린」. the most ornate and imposing piece of this set; mood: reinforced, built to last.
6. NECKLACE / AMULET 「룬 뼈 목걸이」 — loot from the monster 「룬 마법사」. plain look; mood: reinforced, built to last.
7. BRACELET / BANGLE / WRISTWATCH 「불과 얼음의 팔찌」 — loot from the monster 「원소술사」. plain look; mood: heavy, blunt, massive.
8. BRACELET / BANGLE / WRISTWATCH 「되찾은 젊음의 팔찌」 — loot from the monster 「파우스트」. more refined and menacing; mood: a lucky charm, a hint of gold.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 박사의 검은 가운 | 망토 | 파우스트 | `assets/items/faust_0.png` ✅ |
| 2 | 아발론의 안개 망토 | 망토 | 모르간 르 페이 | `assets/items/morgan_0.png` ✅ |
| 3 | 요정 여왕의 반지 | 반지 | 모르간 르 페이 | `assets/items/morgan_1.png` ✅ |
| 4 | 계약의 인장 | 반지 | 소환술사 | `assets/items/summoner_1.png` ✅ |
| 5 | 탑에 갇힌 수정 | 목걸이 | 멀린 | `assets/items/merlin_2.png` ✅ |
| 6 | 룬 뼈 목걸이 | 목걸이 | 룬 마법사 | `assets/items/runemage_1.png` ✅ |
| 7 | 불과 얼음의 팔찌 | 팔찌 | 원소술사 | `assets/items/elementalist_1.png` ✅ |
| 8 | 되찾은 젊음의 팔찌 | 팔찌 | 파우스트 | `assets/items/faust_1.png` ✅ |

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

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

ITEM — the name is Korean. Draw what the name describes; never write the name in the image.
If the name describes a different kind of object than its type, draw the object from the name.
```

- **별을 부르는 지팡이** → `assets/items/archmage_0.png`

  ```text
  WEAPON 「별을 부르는 지팡이」 — loot from the monster 「대마법사」. plain look; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **절구공이** → `assets/items/babayaga_0.png`

  ```text
  WEAPON 「절구공이」 — loot from the monster 「바바 야가」. plain look; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **꿈을 꾸는 지팡이** → `assets/items/merlin_0.png`

  ```text
  WEAPON 「꿈을 꾸는 지팡이」 — loot from the monster 「멀린」. the most ornate and imposing piece of this set; mood: reinforced, built to last. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **이름을 적은 마도서** → `assets/items/summoner_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「이름을 적은 마도서」 — loot from the monster 「소환술사」. plain look; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **끝까지 읽은 금지된 책** → `assets/items/warlock_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「끝까지 읽은 금지된 책」 — loot from the monster 「흑마법사」. plain look; mood: sinister, a touch of blood red. Framing: front view, slightly tilted.
  ```

- **마나가 고인 고깔모자** → `assets/items/archmage_1.png`

  ```text
  HEADGEAR 「마나가 고인 고깔모자」 — loot from the monster 「대마법사」. plain look; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **은자의 두건** → `assets/items/merlin_1.png`

  ```text
  HEADGEAR 「은자의 두건」 — loot from the monster 「멀린」. the most ornate and imposing piece of this set; mood: reinforced, built to last. Framing: 3/4 front view, empty (no head inside).
  ```

- **얼룩진 연금 앞치마** → `assets/items/alchemist_0.png`

  ```text
  BODY ARMOR / CLOTHING 「얼룩진 연금 앞치마」 — loot from the monster 「연금술사」. plain look; mood: modest, well used. Framing: front view, torso piece only, empty (no body inside).
  ```

- **그림자 로브** → `assets/items/warlock_1.png`

  ```text
  BODY ARMOR / CLOTHING 「그림자 로브」 — loot from the monster 「흑마법사」. plain look; mood: sinister, a touch of blood red. Framing: front view, torso piece only, empty (no body inside).
  ```

- **베틀에서 짠 숄** → `assets/items/circe_0.png`

  ```text
  SHOULDER GUARD 「베틀에서 짠 숄」 — loot from the monster 「키르케」. plain look; mood: sinister, a touch of blood red. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **룬을 새긴 견갑** → `assets/items/runemage_0.png`

  ```text
  SHOULDER GUARD 「룬을 새긴 견갑」 — loot from the monster 「룬 마법사」. plain look; mood: reinforced, built to last. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **네 원소를 쥔 손** → `assets/items/elementalist_0.png`

  ```text
  GLOVES / GAUNTLETS 「네 원소를 쥔 손」 — loot from the monster 「원소술사」. plain look; mood: heavy, blunt, massive. Framing: a pair, backs of the hands, fingers up.
  ```

- **화염 손** → `assets/items/salamander2_0.png`

  ```text
  GLOVES / GAUNTLETS 「화염 손」 — loot from the monster 「샐러맨더」. more refined and menacing; mood: aggressive, sharp. Framing: a pair, backs of the hands, fingers up.
  ```

- **약병을 꽂은 허리띠** → `assets/items/alchemist_1.png`

  ```text
  BELT / SASH 「약병을 꽂은 허리띠」 — loot from the monster 「연금술사」. plain look; mood: modest, well used. Framing: laid in a loop, buckle or knot at the front.
  ```

- **해골 등불 허리띠** → `assets/items/babayaga_1.png`

  ```text
  BELT / SASH 「해골 등불 허리띠」 — loot from the monster 「바바 야가」. plain look; mood: pointed, piercing. Framing: laid in a loop, buckle or knot at the front.
  ```

- **안개로 짠 허리띠** → `assets/items/chest_avalon_belt.png`

  ```text
  BELT / SASH 「안개로 짠 허리띠」 — old treasure that was buried in a chest for a long time. plain look; mood: reinforced, built to last. Framing: laid in a loop, buckle or knot at the front.
  ```

- **떡갈나무 껍질 각반** → `assets/items/druid_1.png`

  ```text
  LEG ARMOR 「떡갈나무 껍질 각반」 — loot from the monster 「드루이드」. plain look; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **땅속을 걷는 각반** → `assets/items/gnome_0.png`

  ```text
  LEG ARMOR 「땅속을 걷는 각반」 — loot from the monster 「노움」. more refined and menacing; mood: sturdy, protective. Framing: a pair of shin guards, front view.
  ```

- **바람의 신** → `assets/items/sylph2_0.png`

  ```text
  BOOTS / SHOES 「바람의 신」 — loot from the monster 「실프」. more refined and menacing; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **겨우살이 두건** → `assets/items/druid_0.png`

  ```text
  CLOAK / CAPE 「겨우살이 두건」 — loot from the monster 「드루이드」. plain look; mood: reinforced, built to last. Framing: front view, hanging open, empty (no body inside).
  ```

- **박사의 검은 가운** → `assets/items/faust_0.png`

  ```text
  CLOAK / CAPE 「박사의 검은 가운」 — loot from the monster 「파우스트」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: front view, hanging open, empty (no body inside).
  ```

- **아발론의 안개 망토** → `assets/items/morgan_0.png`

  ```text
  CLOAK / CAPE 「아발론의 안개 망토」 — loot from the monster 「모르간 르 페이」. more refined and menacing; mood: aggressive, sharp. Framing: front view, hanging open, empty (no body inside).
  ```

- **요정 여왕의 반지** → `assets/items/morgan_1.png`

  ```text
  RING 「요정 여왕의 반지」 — loot from the monster 「모르간 르 페이」. more refined and menacing; mood: aggressive, sharp. Framing: single ring, 3/4 view so the band is visible.
  ```

- **계약의 인장** → `assets/items/summoner_1.png`

  ```text
  RING 「계약의 인장」 — loot from the monster 「소환술사」. plain look; mood: sturdy, protective. Framing: single ring, 3/4 view so the band is visible.
  ```

- **탑에 갇힌 수정** → `assets/items/merlin_2.png`

  ```text
  NECKLACE / AMULET 「탑에 갇힌 수정」 — loot from the monster 「멀린」. the most ornate and imposing piece of this set; mood: reinforced, built to last. Framing: chain in a loop, pendant at the bottom center.
  ```

- **룬 뼈 목걸이** → `assets/items/runemage_1.png`

  ```text
  NECKLACE / AMULET 「룬 뼈 목걸이」 — loot from the monster 「룬 마법사」. plain look; mood: reinforced, built to last. Framing: chain in a loop, pendant at the bottom center.
  ```

- **사랑을 잃은 물방울** → `assets/items/undine_0.png`

  ```text
  NECKLACE / AMULET 「사랑을 잃은 물방울」 — loot from the monster 「운디네」. more refined and menacing; mood: spiked, thorny. Framing: chain in a loop, pendant at the bottom center.
  ```

- **불과 얼음의 팔찌** → `assets/items/elementalist_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「불과 얼음의 팔찌」 — loot from the monster 「원소술사」. plain look; mood: heavy, blunt, massive. Framing: single band, 3/4 view.
  ```

- **되찾은 젊음의 팔찌** → `assets/items/faust_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「되찾은 젊음의 팔찌」 — loot from the monster 「파우스트」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: single band, 3/4 view.
  ```
