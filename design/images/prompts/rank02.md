# 제2격 마물 — 장비 31개 · 시트 4장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 2-A — 무기 · 보조무기 · 투구 · 갑옷 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank02-A.png`

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

TIER LOOK: low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「경량 티타늄 장검」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 한 손으로 하루 종일 휘둘러도 손목이 남는다.
2. WEAPON 「뒤틀린 지팡이」 — loot from the monster 「숲의 마녀」. more refined and menacing; mood: sinister, a touch of blood red.
3. WEAPON 「재생의 곤봉」 — loot from the monster 「트롤 킹」. the most ornate and imposing piece of this set; mood: reinforced, built to last.
4. OFF-HAND (shield, book, lantern, orb ...) 「접이식 전술 방패」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: spiked, thorny. Hint (Korean): 펴는 데 0.4초. 접는 데는 조금 더 걸린다.
5. OFF-HAND (shield, book, lantern, orb ...) 「군용 방패」 — loot from the monster 「홉고블린」. plain look; mood: sturdy, protective.
6. OFF-HAND (shield, book, lantern, orb ...) 「뿌리 방패」 — loot from the monster 「트렌트」. plain look; mood: spiked, thorny.
7. HEADGEAR 「돌 뿔」 — loot from the monster 「가고일」. plain look; mood: sturdy, protective.
8. HEADGEAR 「뿔 달린 투구」 — loot from the monster 「오크 장군」. more refined and menacing; mood: aggressive, sharp.
9. BODY ARMOR / CLOTHING 「가죽 흉갑」 — loot from the monster 「오크 전사」. plain look; mood: heavy, blunt, massive.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 경량 티타늄 장검 | 무기 | 헌터백화점 | `assets/items/dept_saber.png` ✅ |
| 2 | 뒤틀린 지팡이 | 무기 | 숲의 마녀 | `assets/items/forestwitch_0.png` ✅ |
| 3 | 재생의 곤봉 | 무기 | 트롤 킹 | `assets/items/trollking_0.png` ✅ |
| 4 | 접이식 전술 방패 | 보조무기 | 헌터백화점 | `assets/items/dept_foldshield.png` ✅ |
| 5 | 군용 방패 | 보조무기 | 홉고블린 | `assets/items/hobgoblin_0.png` ✅ |
| 6 | 뿌리 방패 | 보조무기 | 트렌트 | `assets/items/treant_1.png` ✅ |
| 7 | 돌 뿔 | 투구 | 가고일 | `assets/items/gargoyle_1.png` ✅ |
| 8 | 뿔 달린 투구 | 투구 | 오크 장군 | `assets/items/orcgeneral_2.png` ✅ |
| 9 | 가죽 흉갑 | 갑옷 | 오크 전사 | `assets/items/orc_1.png` ✅ |

## 시트 2-B — 갑옷 · 어깨 · 장갑 · 허리띠 · 각반 · 신발 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank02-B.png`

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

TIER LOOK: low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.

FRAMING BY TYPE:
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「트롤가죽 갑주」 — loot from the monster 「트롤 킹」. the most ornate and imposing piece of this set; mood: reinforced, built to last.
2. SHOULDER GUARD 「통나무 어깨받이」 — loot from the monster 「오우거」. plain look; mood: heavy, blunt, massive.
3. SHOULDER GUARD 「장군의 견장」 — loot from the monster 「오크 장군」. more refined and menacing; mood: aggressive, sharp.
4. GLOVES / GAUNTLETS 「오크 손등가리개」 — loot from the monster 「오크 전사」. plain look; mood: heavy, blunt, massive.
5. BELT / SASH 「군용 허리띠」 — loot from the monster 「홉고블린」. plain look; mood: sturdy, protective.
6. BELT / SASH 「덩굴 허리띠」 — loot from the monster 「트렌트」. plain look; mood: spiked, thorny.
7. LEG ARMOR 「늪지 각반」 — loot from the monster 「리저드맨」. plain look; mood: pointed, piercing.
8. LEG ARMOR 「두꺼운 각반」 — loot from the monster 「오우거」. plain look; mood: heavy, blunt, massive.
9. BOOTS / SHOES 「그림자 신」 — loot from the monster 「다크 엘프 자객」. plain look; mood: sinister, a touch of blood red.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 트롤가죽 갑주 | 갑옷 | 트롤 킹 | `assets/items/trollking_1.png` ✅ |
| 2 | 통나무 어깨받이 | 어깨 | 오우거 | `assets/items/ogre_0.png` ✅ |
| 3 | 장군의 견장 | 어깨 | 오크 장군 | `assets/items/orcgeneral_0.png` ✅ |
| 4 | 오크 손등가리개 | 장갑 | 오크 전사 | `assets/items/orc_2.png` ✅ |
| 5 | 군용 허리띠 | 허리띠 | 홉고블린 | `assets/items/hobgoblin_2.png` ✅ |
| 6 | 덩굴 허리띠 | 허리띠 | 트렌트 | `assets/items/treant_2.png` ✅ |
| 7 | 늪지 각반 | 각반 | 리저드맨 | `assets/items/lizardman_1.png` ✅ |
| 8 | 두꺼운 각반 | 각반 | 오우거 | `assets/items/ogre_1.png` ✅ |
| 9 | 그림자 신 | 신발 | 다크 엘프 자객 | `assets/items/darkelf_1.png` ✅ |

## 시트 2-C — 신발 · 망토 · 반지 · 목걸이 · 팔찌 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank02-C.png`

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

TIER LOOK: low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.

FRAMING BY TYPE:
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BOOTS / SHOES 「깃털 신」 — loot from the monster 「하피」. plain look; mood: light, slim, built for speed.
2. CLOAK / CAPE 「이슬 맺힌 이끼 망토」 — old treasure that was buried in a chest for a long time. plain look; mood: light, slim, built for speed.
3. CLOAK / CAPE 「깃털 망토」 — loot from the monster 「하피」. plain look; mood: light, slim, built for speed.
4. RING 「암살자의 인장」 — loot from the monster 「다크 엘프 자객」. plain look; mood: sinister, a touch of blood red.
5. RING 「마녀의 고리」 — loot from the monster 「숲의 마녀」. more refined and menacing; mood: sinister, a touch of blood red.
6. NECKLACE / AMULET 「석화의 눈」 — loot from the monster 「바실리스크」. plain look; mood: pointed, piercing.
7. NECKLACE / AMULET 「숲의 심장」 — loot from the monster 「트롤 킹」. the most ornate and imposing piece of this set; mood: reinforced, built to last.
8. BRACELET / BANGLE / WRISTWATCH 「석화의 팔찌」 — loot from the monster 「바실리스크」. plain look; mood: pointed, piercing.
9. BRACELET / BANGLE / WRISTWATCH 「돌 팔찌」 — loot from the monster 「가고일」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 깃털 신 | 신발 | 하피 | `assets/items/harpy_0.png` ✅ |
| 2 | 이슬 맺힌 이끼 망토 | 망토 | 보물상자 | `assets/items/chest_forest_cloak.png` ✅ |
| 3 | 깃털 망토 | 망토 | 하피 | `assets/items/harpy_2.png` ✅ |
| 4 | 암살자의 인장 | 반지 | 다크 엘프 자객 | `assets/items/darkelf_2.png` ✅ |
| 5 | 마녀의 고리 | 반지 | 숲의 마녀 | `assets/items/forestwitch_2.png` ✅ |
| 6 | 석화의 눈 | 목걸이 | 바실리스크 | `assets/items/basilisk_0.png` ✅ |
| 7 | 숲의 심장 | 목걸이 | 트롤 킹 | `assets/items/trollking_2.png` ✅ |
| 8 | 석화의 팔찌 | 팔찌 | 바실리스크 | `assets/items/basilisk_2.png` ✅ |
| 9 | 돌 팔찌 | 팔찌 | 가고일 | `assets/items/gargoyle_2.png` ✅ |

## 시트 2-D — 투구 · 갑옷 · 장갑 · 신발 (4개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank02-D.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 4 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 5 cells empty (plain magenta).

TIER LOOK: factory-new hunter gear sold in a modern department store — clean, unworn, manufactured; basic budget models, simple shapes.

FRAMING BY TYPE:
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. HEADGEAR 「경량 카본 헬멧」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: aggressive, sharp. Hint (Korean): 쓴 것을 잊을 만큼 가볍다. 그래서 자꾸 잊고 나간다.
2. BODY ARMOR / CLOTHING 「방탄 섬유 재킷」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 총알을 막으려고 만든 것이 이빨도 막는다.
3. GLOVES / GAUNTLETS 「충격 흡수 장갑」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 손등의 젤이 맞을 때마다 꾸욱 눌린다.
4. BOOTS / SHOES 「쿠션 전술화」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 하루 사만 보를 걸어도 발이 멀쩡하다는 광고.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 경량 카본 헬멧 | 투구 | 헌터백화점 | `assets/items/dept_helm2.png` |
| 2 | 방탄 섬유 재킷 | 갑옷 | 헌터백화점 | `assets/items/dept_vest2.png` |
| 3 | 충격 흡수 장갑 | 장갑 | 헌터백화점 | `assets/items/dept_glove2.png` |
| 4 | 쿠션 전술화 | 신발 | 헌터백화점 | `assets/items/dept_boots2.png` |

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

TIER LOOK: low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.

ITEM — the name is Korean. Draw what the name describes; never write the name in the image.
If the name describes a different kind of object than its type, draw the object from the name.
```

- **경량 티타늄 장검** → `assets/items/dept_saber.png`

  ```text
  WEAPON 「경량 티타늄 장검」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 한 손으로 하루 종일 휘둘러도 손목이 남는다. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **뒤틀린 지팡이** → `assets/items/forestwitch_0.png`

  ```text
  WEAPON 「뒤틀린 지팡이」 — loot from the monster 「숲의 마녀」. more refined and menacing; mood: sinister, a touch of blood red. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **재생의 곤봉** → `assets/items/trollking_0.png`

  ```text
  WEAPON 「재생의 곤봉」 — loot from the monster 「트롤 킹」. the most ornate and imposing piece of this set; mood: reinforced, built to last. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **접이식 전술 방패** → `assets/items/dept_foldshield.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「접이식 전술 방패」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: spiked, thorny. Hint (Korean): 펴는 데 0.4초. 접는 데는 조금 더 걸린다. Framing: front view, slightly tilted.
  ```

- **군용 방패** → `assets/items/hobgoblin_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「군용 방패」 — loot from the monster 「홉고블린」. plain look; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **뿌리 방패** → `assets/items/treant_1.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「뿌리 방패」 — loot from the monster 「트렌트」. plain look; mood: spiked, thorny. Framing: front view, slightly tilted.
  ```

- **경량 카본 헬멧** → `assets/items/dept_helm2.png`

  ```text
  HEADGEAR 「경량 카본 헬멧」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: aggressive, sharp. Hint (Korean): 쓴 것을 잊을 만큼 가볍다. 그래서 자꾸 잊고 나간다. Framing: 3/4 front view, empty (no head inside).
  ```

- **돌 뿔** → `assets/items/gargoyle_1.png`

  ```text
  HEADGEAR 「돌 뿔」 — loot from the monster 「가고일」. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **뿔 달린 투구** → `assets/items/orcgeneral_2.png`

  ```text
  HEADGEAR 「뿔 달린 투구」 — loot from the monster 「오크 장군」. more refined and menacing; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **방탄 섬유 재킷** → `assets/items/dept_vest2.png`

  ```text
  BODY ARMOR / CLOTHING 「방탄 섬유 재킷」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 총알을 막으려고 만든 것이 이빨도 막는다. Framing: front view, torso piece only, empty (no body inside).
  ```

- **가죽 흉갑** → `assets/items/orc_1.png`

  ```text
  BODY ARMOR / CLOTHING 「가죽 흉갑」 — loot from the monster 「오크 전사」. plain look; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **트롤가죽 갑주** → `assets/items/trollking_1.png`

  ```text
  BODY ARMOR / CLOTHING 「트롤가죽 갑주」 — loot from the monster 「트롤 킹」. the most ornate and imposing piece of this set; mood: reinforced, built to last. Framing: front view, torso piece only, empty (no body inside).
  ```

- **통나무 어깨받이** → `assets/items/ogre_0.png`

  ```text
  SHOULDER GUARD 「통나무 어깨받이」 — loot from the monster 「오우거」. plain look; mood: heavy, blunt, massive. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **장군의 견장** → `assets/items/orcgeneral_0.png`

  ```text
  SHOULDER GUARD 「장군의 견장」 — loot from the monster 「오크 장군」. more refined and menacing; mood: aggressive, sharp. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **충격 흡수 장갑** → `assets/items/dept_glove2.png`

  ```text
  GLOVES / GAUNTLETS 「충격 흡수 장갑」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 손등의 젤이 맞을 때마다 꾸욱 눌린다. Framing: a pair, backs of the hands, fingers up.
  ```

- **오크 손등가리개** → `assets/items/orc_2.png`

  ```text
  GLOVES / GAUNTLETS 「오크 손등가리개」 — loot from the monster 「오크 전사」. plain look; mood: heavy, blunt, massive. Framing: a pair, backs of the hands, fingers up.
  ```

- **군용 허리띠** → `assets/items/hobgoblin_2.png`

  ```text
  BELT / SASH 「군용 허리띠」 — loot from the monster 「홉고블린」. plain look; mood: sturdy, protective. Framing: laid in a loop, buckle or knot at the front.
  ```

- **덩굴 허리띠** → `assets/items/treant_2.png`

  ```text
  BELT / SASH 「덩굴 허리띠」 — loot from the monster 「트렌트」. plain look; mood: spiked, thorny. Framing: laid in a loop, buckle or knot at the front.
  ```

- **늪지 각반** → `assets/items/lizardman_1.png`

  ```text
  LEG ARMOR 「늪지 각반」 — loot from the monster 「리저드맨」. plain look; mood: pointed, piercing. Framing: a pair of shin guards, front view.
  ```

- **두꺼운 각반** → `assets/items/ogre_1.png`

  ```text
  LEG ARMOR 「두꺼운 각반」 — loot from the monster 「오우거」. plain look; mood: heavy, blunt, massive. Framing: a pair of shin guards, front view.
  ```

- **그림자 신** → `assets/items/darkelf_1.png`

  ```text
  BOOTS / SHOES 「그림자 신」 — loot from the monster 「다크 엘프 자객」. plain look; mood: sinister, a touch of blood red. Framing: a pair, side view facing right.
  ```

- **쿠션 전술화** → `assets/items/dept_boots2.png`

  ```text
  BOOTS / SHOES 「쿠션 전술화」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 하루 사만 보를 걸어도 발이 멀쩡하다는 광고. Framing: a pair, side view facing right.
  ```

- **깃털 신** → `assets/items/harpy_0.png`

  ```text
  BOOTS / SHOES 「깃털 신」 — loot from the monster 「하피」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **이슬 맺힌 이끼 망토** → `assets/items/chest_forest_cloak.png`

  ```text
  CLOAK / CAPE 「이슬 맺힌 이끼 망토」 — old treasure that was buried in a chest for a long time. plain look; mood: light, slim, built for speed. Framing: front view, hanging open, empty (no body inside).
  ```

- **깃털 망토** → `assets/items/harpy_2.png`

  ```text
  CLOAK / CAPE 「깃털 망토」 — loot from the monster 「하피」. plain look; mood: light, slim, built for speed. Framing: front view, hanging open, empty (no body inside).
  ```

- **암살자의 인장** → `assets/items/darkelf_2.png`

  ```text
  RING 「암살자의 인장」 — loot from the monster 「다크 엘프 자객」. plain look; mood: sinister, a touch of blood red. Framing: single ring, 3/4 view so the band is visible.
  ```

- **마녀의 고리** → `assets/items/forestwitch_2.png`

  ```text
  RING 「마녀의 고리」 — loot from the monster 「숲의 마녀」. more refined and menacing; mood: sinister, a touch of blood red. Framing: single ring, 3/4 view so the band is visible.
  ```

- **석화의 눈** → `assets/items/basilisk_0.png`

  ```text
  NECKLACE / AMULET 「석화의 눈」 — loot from the monster 「바실리스크」. plain look; mood: pointed, piercing. Framing: chain in a loop, pendant at the bottom center.
  ```

- **숲의 심장** → `assets/items/trollking_2.png`

  ```text
  NECKLACE / AMULET 「숲의 심장」 — loot from the monster 「트롤 킹」. the most ornate and imposing piece of this set; mood: reinforced, built to last. Framing: chain in a loop, pendant at the bottom center.
  ```

- **석화의 팔찌** → `assets/items/basilisk_2.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「석화의 팔찌」 — loot from the monster 「바실리스크」. plain look; mood: pointed, piercing. Framing: single band, 3/4 view.
  ```

- **돌 팔찌** → `assets/items/gargoyle_2.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「돌 팔찌」 — loot from the monster 「가고일」. plain look; mood: sturdy, protective. Framing: single band, 3/4 view.
  ```
