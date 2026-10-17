# 그림 목록 (AI 이미지 생성용)

> 이 문서와 `image-manifest.json` 은 `tools/export-images.html` (또는 `node tools/cli.js images`) 로 만든 것입니다. 손으로 고치지 마세요 — 적이나 전리품이 바뀌면 다시 뽑아야 합니다.

게임에 필요한 그림 전부의 목록입니다. 기계가 읽는 전체 데이터는 `image-manifest.json` 이고, 이 문서는 같은 내용을 격(지역)별로 묶은 안내입니다.

## 공통 규칙

- **형식**: PNG 또는 WebP, 배경은 진짜 투명(체크무늬 무늬 넣지 말 것)
- **몬스터**: 512x512, 전신, 가운데 정렬, 발 밑 약한 그림자 가능. 전투 초상(정사각 칸)과 화신 그림으로 같이 씀. 작게 줄여도 알아볼 실루엣이 중요.
- **전리품**: 256x256, 물건 하나만 가운데에. 화면에서는 58~72px 정사각 칸에 contain 으로 들어감 → 단순하고 굵은 실루엣. 64x64 격자로 그려 4배 확대(nearest-neighbor)를 권장.
- **화풍**: 16-bit pixel art, crisp 1px dark outline, limited color palette, centered, no text, transparent background
- **일관성**: 같은 부위의 물건끼리 시점/비율을 통일(옆모습 또는 3/4 정면). 격이 높을수록 화려하게: 1~3격은 거칠고 소박, 4~6격은 금속·마석, 7격부터는 신화적 장식.
- **세계관**: 현대 지구 위에 이상현상(균열 속 공간)이 생긴 세계. 소지품(상인 물건)은 현대 일상용품(안전모, 손전등, 등산화 등). 그 밖의 적/전리품은 판타지·신화풍.
- **주의**: 누구의 소지품인지, 상인이 누구인지, 무명이 누구인지 등 정체를 설명하는 요소는 그림에 넣지 말 것. 다른 작품의 고유 용어나 요소는 넣지 말 것.
- **저장 경로**: 몬스터 `assets/monsters/<id>.png` · 전리품 `assets/items/<id>.png` (id 는 아래 표와 json 의 id)

## 개수

- 몬스터 297개 (일반 157 · 정예 114 · 히든 6 · 보스 20) — 이 중 **화신 215명**은 몬스터 그림을 화신 그림으로도 씁니다
- 전리품 517개 — 부위별: weapon 55 · offhand 38 · helm 43 · armor 45 · shoulder 35 · gloves 35 · belt 29 · greaves 34 · boots 33 · cloak 37 · ring 33 · necklace 39 · bracelet 36 · special 25

## 그 밖의 그림

- **hero_fresh** — 주인공 — 기본 차림 (재킷에 가방을 멘 헌터) (있음) → `assets/hero/hunter.webp` — 지금은 체크무늬 배경이 박힌 그림을 코드가 걷어냄. 진짜 투명 PNG 로 바꾸면 처리 불필요
- **hero_worn** — 주인공 — 마왕을 지난 뒤 해진 차림 (있음) → `assets/hero/hunter-worn.webp` — 위와 같은 포즈 · 같은 인물, 옷만 해진 것
- **merchant** — 떠돌이 상인 초상 (아직 없음, 이모티콘 🎒) (필요) → `assets/other/merchant.png`
- **avatar_art_slot** — 화신 그림 — 화신(몬스터) 그림을 그대로 씁니다. 화신 단추 · 화신 얻는 창의 그림 칸 (몬스터 그림과 같음) → `(monsters 의 그림 재사용)` — 7격 이상 적 113명 + 무명. 화신 창에서는 정사각 칸에 contain 으로 들어갑니다

---

## 제1격 잡졸 — 초심자의 지하수로

> 누구나 여기서 시작한다. 여기서 끝나는 자도 많다.

### 슬라임 `slime` — 일반

- 설명: 가장 만만한 것 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/slime.png` (지금은 🟢)
- 프롬프트: 슬라임 — 가장 만만한 것. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `slime_0` **녹슨 단검** (weapon) → `assets/items/slime_0.png`

### 자이언트 랫 `giantrat` — 일반

- 설명: 수로에 사는 것 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/giantrat.png` (지금은 🐀)
- 프롬프트: 자이언트 랫 — 수로에 사는 것. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `giantrat_0` **쥐가죽 신** (boots) → `assets/items/giantrat_0.png`
  - `giantrat_1` **이빨 목걸이** (ring) → `assets/items/giantrat_1.png`

### 고블린 `goblin` — 일반

- 설명: 떼로 몰려다니는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/goblin.png` (지금은 👺)
- 프롬프트: 고블린 — 떼로 몰려다니는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `goblin_0` **고블린 손도끼** (weapon) → `assets/items/goblin_0.png`
  - `goblin_1` **찌그러진 투구** (helm) → `assets/items/goblin_1.png`

### 코볼트 `kobold` — 일반

- 설명: 함정을 파는 것 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/kobold.png` (지금은 🦎)
- 프롬프트: 코볼트 — 함정을 파는 것. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `kobold_1` **비늘 각반** (greaves) → `assets/items/kobold_1.png`
  - `kobold_2` **코볼트 허리끈** (belt) → `assets/items/kobold_2.png`

### 고블린 족장 `goblinchief` — 정예

- 설명: 제일 큰 몽둥이를 든 자 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/goblinchief.png` (지금은 🪓)
- 프롬프트: 고블린 족장 — 제일 큰 몽둥이를 든 자. 초심자의 지하수로(제1격 잡졸)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `goblinchief_0` **족장의 어깨뼈** (shoulder) → `assets/items/goblinchief_0.png`
  - `goblinchief_1` **전리품 누더기** (armor) → `assets/items/goblinchief_1.png`

### 스켈레톤 `skeleton` — 일반

- 설명: 부서져도 다시 모이는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/skeleton.png` (지금은 ☠️)
- 프롬프트: 스켈레톤 — 부서져도 다시 모이는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `skeleton_0` **갈비뼈 견갑** (shoulder) → `assets/items/skeleton_0.png`
  - `skeleton_1` **해골 투구** (helm) → `assets/items/skeleton_1.png`

### 좀비 `zombie` — 일반

- 설명: 느리지만 멈추지 않는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/zombie.png` (지금은 🧟)
- 프롬프트: 좀비 — 느리지만 멈추지 않는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `zombie_0` **썩은 가죽** (armor) → `assets/items/zombie_0.png`
  - `zombie_1` **무거운 발** (greaves) → `assets/items/zombie_1.png`

### 자이언트 스파이더 `cavespider` — 일반

- 설명: 천장에서 내려오는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/cavespider.png` (지금은 🕷️)
- 프롬프트: 자이언트 스파이더 — 천장에서 내려오는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `cavespider_1` **독니 반지** (ring) → `assets/items/cavespider_1.png`
  - `cavespider_2` **거미줄 팔찌** (bracelet) → `assets/items/cavespider_2.png`

### 미믹 `mimic` — 정예

- 설명: 보물인 척하는 것 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/mimic.png` (지금은 🧰)
- 프롬프트: 미믹 — 보물인 척하는 것. 초심자의 지하수로(제1격 잡졸)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `mimic_0` **이빨 달린 상자** (gloves) → `assets/items/mimic_0.png`
  - `mimic_1` **가짜 금화** (necklace) → `assets/items/mimic_1.png`

### 임프 `imp` — 일반

- 설명: 작고 귀찮은 악마 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/imp.png` (지금은 😈)
- 프롬프트: 임프 — 작고 귀찮은 악마. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `imp_0` **작은 삼지창** (offhand) → `assets/items/imp_0.png`
  - `imp_2` **박쥐날개 망토** (cloak) → `assets/items/imp_2.png`

### 다크 울프 `darkwolf` — 일반

- 설명: 어둠 속에서 눈만 보이는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/darkwolf.png` (지금은 🐕‍🦺)
- 프롬프트: 다크 울프 — 어둠 속에서 눈만 보이는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `darkwolf_1` **발자국 없는 신** (boots) → `assets/items/darkwolf_1.png`
  - `darkwolf_2` **늑대발 장갑** (gloves) → `assets/items/darkwolf_2.png`

### 던전 가디언 `dungeonguardian` — 보스

- 설명: 문을 지키라는 명령만 남은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/dungeonguardian.png` (지금은 🛡️)
- 프롬프트: 던전 가디언 — 문을 지키라는 명령만 남은. 초심자의 지하수로(제1격 잡졸)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `dungeonguardian_0` **수호자의 대검** (weapon) → `assets/items/dungeonguardian_0.png`
  - `dungeonguardian_1` **고철 판금** (armor) → `assets/items/dungeonguardian_1.png`
  - `dungeonguardian_2` **지하수로의 열쇠** (necklace) → `assets/items/dungeonguardian_2.png`


---

## 제2격 마물 — 이끼 낀 숲길

> 길은 있다. 다만 누가 냈는지는 아무도 모른다.

### 오크 전사 `orc` — 일반

- 설명: 힘으로만 밀어붙이는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/orc.png` (지금은 🐗)
- 프롬프트: 오크 전사 — 힘으로만 밀어붙이는. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `orc_1` **가죽 흉갑** (armor) → `assets/items/orc_1.png`
  - `orc_2` **오크 손등가리개** (gloves) → `assets/items/orc_2.png`

### 홉고블린 `hobgoblin` — 일반

- 설명: 줄을 맞춰 싸우는 고블린 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/hobgoblin.png` (지금은 👹)
- 프롬프트: 홉고블린 — 줄을 맞춰 싸우는 고블린. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `hobgoblin_0` **군용 방패** (offhand) → `assets/items/hobgoblin_0.png`
  - `hobgoblin_2` **군용 허리띠** (belt) → `assets/items/hobgoblin_2.png`

### 리저드맨 `lizardman` — 일반

- 설명: 늪에서 기어나온 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/lizardman.png` (지금은 🐊)
- 프롬프트: 리저드맨 — 늪에서 기어나온. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `lizardman_1` **늪지 각반** (greaves) → `assets/items/lizardman_1.png`

### 하피 `harpy` — 일반

- 설명: 노래로 홀리는 것 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/harpy.png` (지금은 🪽)
- 프롬프트: 하피 — 노래로 홀리는 것. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `harpy_0` **깃털 신** (boots) → `assets/items/harpy_0.png`
  - `harpy_2` **깃털 망토** (cloak) → `assets/items/harpy_2.png`

### 오크 장군 `orcgeneral` — 정예

- 설명: 천 명을 이끌었던 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/orcgeneral.png` (지금은 🪖)
- 프롬프트: 오크 장군 — 천 명을 이끌었던. 이끼 낀 숲길(제2격 마물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `orcgeneral_0` **장군의 견장** (shoulder) → `assets/items/orcgeneral_0.png`
  - `orcgeneral_2` **뿔 달린 투구** (helm) → `assets/items/orcgeneral_2.png`

### 오우거 `ogre` — 일반

- 설명: 나무를 뽑아 휘두르는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/ogre.png` (지금은 🪨)
- 프롬프트: 오우거 — 나무를 뽑아 휘두르는. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `ogre_0` **통나무 어깨받이** (shoulder) → `assets/items/ogre_0.png`
  - `ogre_1` **두꺼운 각반** (greaves) → `assets/items/ogre_1.png`

### 다크 엘프 자객 `darkelf` — 일반

- 설명: 뒤에서만 나타나는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/darkelf.png` (지금은 🌑)
- 프롬프트: 다크 엘프 자객 — 뒤에서만 나타나는. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `darkelf_1` **그림자 신** (boots) → `assets/items/darkelf_1.png`
  - `darkelf_2` **암살자의 인장** (ring) → `assets/items/darkelf_2.png`

### 트렌트 `treant` — 일반

- 설명: 걷는 나무 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/treant.png` (지금은 🌳)
- 프롬프트: 트렌트 — 걷는 나무. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `treant_1` **뿌리 방패** (offhand) → `assets/items/treant_1.png`
  - `treant_2` **덩굴 허리띠** (belt) → `assets/items/treant_2.png`

### 숲의 마녀 `forestwitch` — 정예

- 설명: 길 잃은 자만 만나는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/forestwitch.png` (지금은 🧙)
- 프롬프트: 숲의 마녀 — 길 잃은 자만 만나는. 이끼 낀 숲길(제2격 마물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `forestwitch_0` **뒤틀린 지팡이** (weapon) → `assets/items/forestwitch_0.png`
  - `forestwitch_2` **마녀의 고리** (ring) → `assets/items/forestwitch_2.png`

### 가고일 `gargoyle` — 일반

- 설명: 낮에는 돌인 것 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/gargoyle.png` (지금은 🗿)
- 프롬프트: 가고일 — 낮에는 돌인 것. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `gargoyle_1` **돌 뿔** (helm) → `assets/items/gargoyle_1.png`
  - `gargoyle_2` **돌 팔찌** (bracelet) → `assets/items/gargoyle_2.png`

### 바실리스크 `basilisk` — 일반

- 설명: 눈을 마주치면 끝 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/basilisk.png` (지금은 🐍)
- 프롬프트: 바실리스크 — 눈을 마주치면 끝. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `basilisk_0` **석화의 눈** (necklace) → `assets/items/basilisk_0.png`
  - `basilisk_2` **석화의 팔찌** (bracelet) → `assets/items/basilisk_2.png`

### 트롤 킹 `trollking` — 보스

- 설명: 베어도 다시 붙는 자 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/trollking.png` (지금은 🧌)
- 프롬프트: 트롤 킹 — 베어도 다시 붙는 자. 이끼 낀 숲길(제2격 마물)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `trollking_0` **재생의 곤봉** (weapon) → `assets/items/trollking_0.png`
  - `trollking_1` **트롤가죽 갑주** (armor) → `assets/items/trollking_1.png`
  - `trollking_2` **숲의 심장** (necklace) → `assets/items/trollking_2.png`


---

## 제3격 마수 — 무너진 왕국

> 왕은 없고 왕관만 굴러다닌다.

### 미노타우로스 `minotaur` — 일반

- 설명: 미궁의 주인 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/minotaur.png` (지금은 🐂)
- 프롬프트: 미노타우로스 — 미궁의 주인. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `minotaur_0` **미궁의 전투도끼** (weapon) → `assets/items/minotaur_0.png`
  - `minotaur_2` **미궁의 허리띠** (belt) → `assets/items/minotaur_2.png`

### 와이번 `wyvern` — 일반

- 설명: 용은 아니지만 하늘을 나는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/wyvern.png` (지금은 🦇)
- 프롬프트: 와이번 — 용은 아니지만 하늘을 나는. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `wyvern_0` **날개막 신** (boots) → `assets/items/wyvern_0.png`
  - `wyvern_2` **와이번 가죽 망토** (cloak) → `assets/items/wyvern_2.png`

### 키메라 `chimera` — 일반

- 설명: 셋을 억지로 붙여놓은 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/chimera.png` (지금은 🦁)
- 프롬프트: 키메라 — 셋을 억지로 붙여놓은. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `chimera_0` **세 짐승의 어깨** (shoulder) → `assets/items/chimera_0.png`
  - `chimera_1` **뒤섞인 심장** (necklace) → `assets/items/chimera_1.png`

### 만티코어 `manticore` — 일반

- 설명: 꼬리에 독침이 달린 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/manticore.png` (지금은 🦂)
- 프롬프트: 만티코어 — 꼬리에 독침이 달린. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `manticore_1` **만티코어의 송곳니** (ring) → `assets/items/manticore_1.png`
  - `manticore_2` **만티코어 망토** (cloak) → `assets/items/manticore_2.png`

### 그리핀 로드 `griffinlord` — 정예

- 설명: 하늘의 왕관을 쓴 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/griffinlord.png` (지금은 🦅)
- 프롬프트: 그리핀 로드 — 하늘의 왕관을 쓴. 무너진 왕국(제3격 마수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `griffinlord_0` **창공의 발톱** (boots) → `assets/items/griffinlord_0.png`
  - `griffinlord_1` **깃털 흉갑** (armor) → `assets/items/griffinlord_1.png`

### 스톤 골렘 `stonegolem` — 일반

- 설명: 명령 하나만 기억하는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/stonegolem.png` (지금은 🪆)
- 프롬프트: 스톤 골렘 — 명령 하나만 기억하는. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `stonegolem_1` **돌기둥 각반** (greaves) → `assets/items/stonegolem_1.png`
  - `stonegolem_2` **화강암 띠** (belt) → `assets/items/stonegolem_2.png`

### 아이언 골렘 `irongolem` — 일반

- 설명: 녹슬지 않는 병사 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/irongolem.png` (지금은 ⚒️)
- 프롬프트: 아이언 골렘 — 녹슬지 않는 병사. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `irongolem_0` **강철 방패** (offhand) → `assets/items/irongolem_0.png`
  - `irongolem_2` **무쇠 손** (gloves) → `assets/items/irongolem_2.png`

### 하피 퀸 `harpyqueen` — 일반

- 설명: 노래를 멈추지 않는 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/harpyqueen.png` (지금은 🎶)
- 프롬프트: 하피 퀸 — 노래를 멈추지 않는. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `harpyqueen_0` **여왕의 깃털** (ring) → `assets/items/harpyqueen_0.png`
  - `harpyqueen_2` **여왕의 팔찌** (bracelet) → `assets/items/harpyqueen_2.png`

### 히드라 `hydra` — 정예

- 설명: 하나 자르면 둘이 되는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/hydra.png` (지금은 🐲)
- 프롬프트: 히드라 — 하나 자르면 둘이 되는. 무너진 왕국(제3격 마수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `hydra_0` **아홉 머리의 이빨** (weapon) → `assets/items/hydra_0.png`
  - `hydra_1` **재생하는 비늘** (armor) → `assets/items/hydra_1.png`

### 코카트리스 `cockatrice` — 일반

- 설명: 닭처럼 생겼지만 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/cockatrice.png` (지금은 🐓)
- 프롬프트: 코카트리스 — 닭처럼 생겼지만. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `cockatrice_0` **석화 방지 각반** (greaves) → `assets/items/cockatrice_0.png`

### 다크 나이트 `darkknight` — 일반

- 설명: 투구 안이 비어 있는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/darkknight.png` (지금은 🖤)
- 프롬프트: 다크 나이트 — 투구 안이 비어 있는. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `darkknight_0` **흑철 견갑** (shoulder) → `assets/items/darkknight_0.png`
  - `darkknight_2` **빈 투구** (helm) → `assets/items/darkknight_2.png`

### 카벙클 `carbuncle` — 히든

- 설명: 무너진 왕국의 홍옥을 이마에 박은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/carbuncle.png` (지금은 💎)
- 프롬프트: 카벙클 — 무너진 왕국의 홍옥을 이마에 박은. 무너진 왕국(제3격 마수)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 전리품:


### 몰락한 왕 `fallenking` — 보스

- 설명: 아직도 옥좌에 앉아 있는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/fallenking.png` (지금은 🤴)
- 프롬프트: 몰락한 왕 — 아직도 옥좌에 앉아 있는. 무너진 왕국(제3격 마수)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `fallenking_0` **왕의 세검** (weapon) → `assets/items/fallenking_0.png`
  - `fallenking_1` **녹슨 왕관** (helm) → `assets/items/fallenking_1.png`
  - `fallenking_2` **무너진 옥새** (necklace) → `assets/items/fallenking_2.png`


---

## 제4격 거인 — 거인의 고개

> 첫 들판에서도 저 너머로 머리가 보인다. 고개를 넘었다는 사람은 아직 없다.

### 언덕 거인 `hillgiant` — 일반

- 설명: 바위를 공깃돌 삼는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/hillgiant.png` (지금은 🪨)
- 프롬프트: 언덕 거인 — 바위를 공깃돌 삼는. 거인의 고개(제4격 거인)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `hillgiant_0` **뽑아 든 통바위** (weapon) → `assets/items/hillgiant_0.png`
  - `hillgiant_1` **바위를 지는 어깨받이** (shoulder) → `assets/items/hillgiant_1.png`

### 사이클롭스 `cyclops` — 일반

- 설명: 눈이 하나뿐인 대장장이 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/cyclops.png` (지금은 🔨)
- 프롬프트: 사이클롭스 — 눈이 하나뿐인 대장장이. 거인의 고개(제4격 거인)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `cyclops_0` **외눈 투구** (helm) → `assets/items/cyclops_0.png`
  - `cyclops_1` **벼락을 벼리던 손** (gloves) → `assets/items/cyclops_1.png`

### 돌 거인 `stonegiant` — 정예

- 설명: 가만히 있으면 바위산인 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/stonegiant.png` (지금은 🗻)
- 프롬프트: 돌 거인 — 가만히 있으면 바위산인. 거인의 고개(제4격 거인)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `stonegiant_0` **바위산 갑주** (armor) → `assets/items/stonegiant_0.png`

### 에틴 `ettin` — 일반

- 설명: 머리 둘이 늘 서로 다투는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/ettin.png` (지금은 🗣️)
- 프롬프트: 에틴 — 머리 둘이 늘 서로 다투는. 거인의 고개(제4격 거인)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `ettin_0` **두 머리가 다투는 방패** (offhand) → `assets/items/ettin_0.png`
  - `ettin_1` **둘이 나눠 맨 허리띠** (belt) → `assets/items/ettin_1.png`

### 서리 거인 `frostgiant` — 정예

- 설명: 숨만 쉬어도 서리가 내리는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/frostgiant.png` (지금은 🥶)
- 프롬프트: 서리 거인 — 숨만 쉬어도 서리가 내리는. 거인의 고개(제4격 거인)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `frostgiant_0` **서리 내린 각반** (greaves) → `assets/items/frostgiant_0.png`

### 골리앗 `goliath` — 일반

- 설명: 아직 돌팔매를 맞지 않은 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/goliath.png` (지금은 💪)
- 프롬프트: 골리앗 — 아직 돌팔매를 맞지 않은. 거인의 고개(제4격 거인)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `goliath2_0` **베틀채 같은 창** (weapon) → `assets/items/goliath2_0.png`
  - `goliath2_1` **청동 비늘 갑옷** (armor) → `assets/items/goliath2_1.png`

### 설인 `yeti` — 일반

- 설명: 눈보라 속에 발자국만 남기는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/yeti.png` (지금은 🦍)
- 프롬프트: 설인 — 눈보라 속에 발자국만 남기는. 거인의 고개(제4격 거인)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `yeti_0` **큰 발자국 털신** (boots) → `assets/items/yeti_0.png`
  - `yeti_1` **눈보라 털가죽** (cloak) → `assets/items/yeti_1.png`

### 불의 거인 `firegiant` — 정예

- 설명: 용암에 발을 담그고 사는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/firegiant.png` (지금은 🔥)
- 프롬프트: 불의 거인 — 용암에 발을 담그고 사는. 거인의 고개(제4격 거인)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `firegiant_0` **용암을 주무르는 손** (gloves) → `assets/items/firegiant_0.png`

### 로크 `roc` — 일반

- 설명: 코끼리를 채 가는 새 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/roc.png` (지금은 🦅)
- 프롬프트: 로크 — 코끼리를 채 가는 새. 거인의 고개(제4격 거인)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `roc_0` **로크의 알 껍데기** (necklace) → `assets/items/roc_0.png`

### 구름 거인 `cloudgiant` — 정예

- 설명: 구름 위에 성을 짓는 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/cloudgiant.png` (지금은 ☁️)
- 프롬프트: 구름 거인 — 구름 위에 성을 짓는. 거인의 고개(제4격 거인)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `cloudgiant_0` **구름 성의 열쇠고리** (ring) → `assets/items/cloudgiant_0.png`

### 털매머드 `mammoth` — 일반

- 설명: 거인들이 짐을 싣고 고개를 넘는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/mammoth.png` (지금은 🦣)
- 프롬프트: 털매머드 — 거인들이 짐을 싣고 고개를 넘는. 거인의 고개(제4격 거인)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `mammoth_0` **눈길을 다지는 각반** (greaves) → `assets/items/mammoth_0.png`
  - `mammoth_1` **매머드 털 팔찌** (bracelet) → `assets/items/mammoth_1.png`

### 거인왕 `giantking` — 보스

- 설명: 고개를 막고 앉아 아무도 넘기지 않는 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/giantking.png` (지금은 👑)
- 프롬프트: 거인왕 — 고개를 막고 앉아 아무도 넘기지 않는. 거인의 고개(제4격 거인)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `giantking_0` **고개를 막은 대검** (weapon) → `assets/items/giantking_0.png`
  - `giantking_1` **산맥의 왕관** (helm) → `assets/items/giantking_1.png`
  - `giantking_2` **고개의 쐐기돌** (special·relic) → `assets/items/giantking_2.png`


---

## 제5격 마족 — 시체가 걷는 도시

> 여기 사는 것들은 죽는 법을 잊었다.

### 구울 `ghoul` — 일반

- 설명: 무덤을 파헤치는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/ghoul.png` (지금은 🧟‍♂️)
- 프롬프트: 구울 — 무덤을 파헤치는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `ghoul_0` **갈퀴손** (gloves) → `assets/items/ghoul_0.png`
  - `ghoul_2` **수의 허리끈** (belt) → `assets/items/ghoul_2.png`

### 레이스 `wraith` — 일반

- 설명: 만질 수 없는 원한 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/wraith.png` (지금은 👻)
- 프롬프트: 레이스 — 만질 수 없는 원한. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `wraith_0` **안개 수의** (cloak) → `assets/items/wraith_0.png`
  - `wraith_1` **원한의 고리** (bracelet) → `assets/items/wraith_1.png`

### 뱀파이어 `vampire` — 일반

- 설명: 초대받아야 들어오는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/vampire.png` (지금은 🧛)
- 프롬프트: 뱀파이어 — 초대받아야 들어오는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `vampire_1` **귀족의 망토** (cloak) → `assets/items/vampire_1.png`
  - `vampire_4` **흡혈귀의 송곳니** (special·relic) → `assets/items/vampire_4.png`

### 흰 말의 기사 `whitehorse` — 정예

- 설명: 이기고 또 이기려는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/whitehorse.png` (지금은 🏹)
- 프롬프트: 흰 말의 기사 — 이기고 또 이기려는. 시체가 걷는 도시(제5격 마족)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `whitehorse_0` **승리의 면류관** (helm) → `assets/items/whitehorse_0.png`

### 밴시 `banshee` — 일반

- 설명: 죽음을 미리 알리는 울음 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/banshee.png` (지금은 😱)
- 프롬프트: 밴시 — 죽음을 미리 알리는 울음. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `banshee_0` **통곡의 두건** (helm) → `assets/items/banshee_0.png`
  - `banshee_1` **예고의 고리** (bracelet) → `assets/items/banshee_1.png`

### 데스 나이트 `deathknight` — 정예

- 설명: 충성만 남은 시체 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/deathknight.png` (지금은 ⚰️)
- 프롬프트: 데스 나이트 — 충성만 남은 시체. 시체가 걷는 도시(제5격 마족)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `deathknight_0` **서약의 대검** (weapon) → `assets/items/deathknight_0.png`
  - `deathknight_1` **사자의 판금** (armor) → `assets/items/deathknight_1.png`

### 본 드래곤 `bonedragon` — 일반

- 설명: 살이 없어도 나는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/bonedragon.png` (지금은 🦴)
- 프롬프트: 본 드래곤 — 살이 없어도 나는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `bonedragon_0` **뼈 갑주** (armor) → `assets/items/bonedragon_0.png`
  - `bonedragon_1` **해골 발톱** (boots) → `assets/items/bonedragon_1.png`

### 붉은 말의 기사 `redhorse` — 정예

- 설명: 땅에서 평화를 거두는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/redhorse.png` (지금은 🗡️)
- 프롬프트: 붉은 말의 기사 — 땅에서 평화를 거두는. 시체가 걷는 도시(제5격 마족)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `redhorse_0` **평화를 거두는 큰 칼** (weapon) → `assets/items/redhorse_0.png`

### 서큐버스 `succubus` — 일반

- 설명: 꿈으로 들어오는 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/succubus.png` (지금은 💋)
- 프롬프트: 서큐버스 — 꿈으로 들어오는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `succubus_0` **유혹의 반지** (ring) → `assets/items/succubus_0.png`
  - `succubus_1` **훔친 꿈** (necklace) → `assets/items/succubus_1.png`

### 인큐버스 `incubus` — 일반

- 설명: 깨어나면 사라지는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/incubus.png` (지금은 🩸)
- 프롬프트: 인큐버스 — 깨어나면 사라지는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `incubus_0` **악몽의 어깨** (shoulder) → `assets/items/incubus_0.png`

### 리치 `lich` — 정예

- 설명: 심장을 항아리에 넣어둔 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/lich.png` (지금은 📕)
- 프롬프트: 리치 — 심장을 항아리에 넣어둔. 시체가 걷는 도시(제5격 마족)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `lich_1` **성물함** (necklace) → `assets/items/lich_1.png`
  - `lich_2` **학자의 관** (helm) → `assets/items/lich_2.png`

### 검은 말의 기사 `blackhorse` — 정예

- 설명: 손에 저울을 든 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/blackhorse.png` (지금은 ⚖️)
- 프롬프트: 검은 말의 기사 — 손에 저울을 든. 시체가 걷는 도시(제5격 마족)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `blackhorse_0` **기근의 저울** (offhand) → `assets/items/blackhorse_0.png`

### 데몬 로드 `demonlord` — 일반

- 설명: 계약서를 들고 오는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/demonlord.png` (지금은 👿)
- 프롬프트: 데몬 로드 — 계약서를 들고 오는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `demonlord_0` **계약의 낙인** (shoulder) → `assets/items/demonlord_0.png`
  - `demonlord_2` **피로 쓴 서명** (ring) → `assets/items/demonlord_2.png`

### 발록 `balrog` — 일반

- 설명: 불과 그림자 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/balrog.png` (지금은 🌋)
- 프롬프트: 발록 — 불과 그림자. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `balrog_1` **용암 정강이** (greaves) → `assets/items/balrog_1.png`
  - `balrog_2` **그림자 방패** (offhand) → `assets/items/balrog_2.png`

### 창백한 말의 기사 `palehorse` — 정예

- 설명: 그 이름은 죽음 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/palehorse.png` (지금은 💀)
- 프롬프트: 창백한 말의 기사 — 그 이름은 죽음. 시체가 걷는 도시(제5격 마족)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `palehorse_0` **죽음이 걸친 창백한 망토** (cloak) → `assets/items/palehorse_0.png`

### 까마귀 왕 `ravenking` — 히든

- 설명: 반짝이는 것이면 죽은 자의 것이라도 물어 가는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/ravenking.png` (지금은 🐦)
- 프롬프트: 까마귀 왕 — 반짝이는 것이면 죽은 자의 것이라도 물어 가는. 시체가 걷는 도시(제5격 마족)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 전리품:
  - `ravenking_0` **까마귀가 물어 온 청옥** (special·gem) → `assets/items/ravenking_0.png`
  - `ravenking_1` **검은 깃 부적** (special·relic) → `assets/items/ravenking_1.png`

### 불사의 왕 `lichking` — 보스

- 설명: 죽음을 신하로 부리는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/lichking.png` (지금은 👑)
- 프롬프트: 불사의 왕 — 죽음을 신하로 부리는. 시체가 걷는 도시(제5격 마족)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `lichking_0` **서리한** (weapon) → `assets/items/lichking_0.png`
  - `lichking_1` **불사의 판금** (armor) → `assets/items/lichking_1.png`
  - `lichking_4` **죽지 않는 성물함** (special·relic) → `assets/items/lichking_4.png`


---

## 제6격 마왕 — 마계의 왕좌

> 세계를 끝내겠다고 말하는 것들이 여기 모여 있다.

### 아크데몬 `archdemon` — 일반

- 설명: 군단을 거느린 것 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/archdemon.png` (지금은 😈)
- 프롬프트: 아크데몬 — 군단을 거느린 것. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `archdemon_0` **심연의 대검** (weapon) → `assets/items/archdemon_0.png`
  - `archdemon_2` **군단장의 망토** (cloak) → `assets/items/archdemon_2.png`

### 심연의 촉수 `abysstentacle` — 일반

- 설명: 바닥이 없는 곳에서 올라온 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/abysstentacle.png` (지금은 🦑)
- 프롬프트: 심연의 촉수 — 바닥이 없는 곳에서 올라온. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `abysstentacle_1` **바닥 없는 신** (boots) → `assets/items/abysstentacle_1.png`

### 칠죄종 · 나태 `sinsloth` — 정예

- 설명: 일어나기 싫은 것 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/sinsloth.png` (지금은 😴)
- 프롬프트: 칠죄종 · 나태 — 일어나기 싫은 것. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinsloth_1` **졸음의 방패** (offhand) → `assets/items/sinsloth_1.png`

### 칠죄종 · 질투 `sinenvy` — 정예

- 설명: 남의 것이 더 좋아 보이는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/sinenvy.png` (지금은 💚)
- 프롬프트: 칠죄종 · 질투 — 남의 것이 더 좋아 보이는. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinenvy_0` **훔쳐 낀 장갑** (gloves) → `assets/items/sinenvy_0.png`

### 고대룡 `elderdragon` — 일반

- 설명: 신화보다 오래된 비늘 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/elderdragon.png` (지금은 🐲)
- 프롬프트: 고대룡 — 신화보다 오래된 비늘. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `elderdragon_1` **고룡의 비늘** (armor) → `assets/items/elderdragon_1.png`
  - `elderdragon_4` **고룡의 심장석** (special·gem) → `assets/items/elderdragon_4.png`

### 칠죄종 · 색욕 `sinlust` — 정예

- 설명: 눈을 떼지 못하게 하는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/sinlust.png` (지금은 💋)
- 프롬프트: 칠죄종 · 색욕 — 눈을 떼지 못하게 하는. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinlust_0` **비단 망토** (cloak) → `assets/items/sinlust_0.png`

### 칠죄종 · 폭식 `singluttony` — 정예

- 설명: 먹어도 허기진 것 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/singluttony.png` (지금은 🍖)
- 프롬프트: 칠죄종 · 폭식 — 먹어도 허기진 것. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `singluttony_0` **부푼 허리띠** (belt) → `assets/items/singluttony_0.png`

### 칠죄종 · 오만 `sinpride` — 정예

- 설명: 무릎 꿇는 법을 모르는 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/sinpride.png` (지금은 🪞)
- 프롬프트: 칠죄종 · 오만 — 무릎 꿇는 법을 모르는. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinpride_0` **오만의 관** (helm) → `assets/items/sinpride_0.png`

### 칠죄종 · 분노 `sinwrath` — 정예

- 설명: 식지 않는 것 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/sinwrath.png` (지금은 🔥)
- 프롬프트: 칠죄종 · 분노 — 식지 않는 것. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinwrath_0` **분노의 견갑** (shoulder) → `assets/items/sinwrath_0.png`

### 칠죄종 · 탐욕 `singreed` — 정예

- 설명: 가져도 모자란 것 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/singreed.png` (지금은 💰)
- 프롬프트: 칠죄종 · 탐욕 — 가져도 모자란 것. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `singreed_0` **탐욕의 반지** (ring) → `assets/items/singreed_0.png`

### 마신장 `demongeneral` — 일반

- 설명: 마왕의 왼팔 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/demongeneral.png` (지금은 ⚔️)
- 프롬프트: 마신장 — 마왕의 왼팔. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `demongeneral_2` **마장의 투구** (helm) → `assets/items/demongeneral_2.png`
  - `demongeneral_3` **마장의 건틀릿** (gloves) → `assets/items/demongeneral_3.png`

### 관측자 `observer` — 히든

- 설명: 처음부터 당신을 보고 있던 것 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/observer.png` (지금은 👁️)
- 프롬프트: 관측자 — 처음부터 당신을 보고 있던 것. 마계의 왕좌(제6격 마왕)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 전리품:
  - `observer_0` **격을 삼키는 검** (weapon) → `assets/items/observer_0.png`

### 세계수를 먹는 벌레 `worldworm` — 정예

- 설명: 뿌리부터 갉아먹는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/worldworm.png` (지금은 🐛)
- 프롬프트: 세계수를 먹는 벌레 — 뿌리부터 갉아먹는. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `worldworm_2` **세계수의 파편** (necklace) → `assets/items/worldworm_2.png`
  - `worldworm_3` **갉는 팔찌** (bracelet) → `assets/items/worldworm_3.png`

### 종말의 짐승 `apocalypsebeast` — 일반

- 설명: 뿔이 일곱 개인 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/apocalypsebeast.png` (지금은 🐏)
- 프롬프트: 종말의 짐승 — 뿔이 일곱 개인. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `apocalypsebeast_0` **일곱 뿔의 관** (helm) → `assets/items/apocalypsebeast_0.png`
  - `apocalypsebeast_1` **짓밟는 각반** (greaves) → `assets/items/apocalypsebeast_1.png`

### 마왕 `demonking` — 보스

- 설명: 세계를 끝내러 온 자 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/demonking.png` (지금은 💀)
- 프롬프트: 마왕 — 세계를 끝내러 온 자. 마계의 왕좌(제6격 마왕)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `demonking_0` **마왕의 검** (weapon) → `assets/items/demonking_0.png`
  - `demonking_1` **마왕의 갑주** (armor) → `assets/items/demonking_1.png`
  - `demonking_2` **마왕의 관** (necklace) → `assets/items/demonking_2.png`


---

## 제7격 설화 — 알렉산드리아 대도서관

> 불탄 줄 알았던 두루마리들이 아직 여기서 숨을 쉰다.

### 이름 없는 이야기꾼 `storyteller` — 일반 · 화신

- 설명: 가장 오래된 목소리 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/storyteller.png` (지금은 📖)
- 프롬프트: 이름 없는 이야기꾼 — 가장 오래된 목소리. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「처음부터 끝까지 들어 줄 사람이 필요했다. 네가 마지막 독자가 되어 다오.」
- 전리품:
  - `storyteller_1` **이야기꾼의 해진 외투** (cloak) → `assets/items/storyteller_1.png`
  - `storyteller_2` **천 하룻밤의 띠** (belt) → `assets/items/storyteller_2.png`

### 필경사의 화신 `scribe` — 일반 · 화신

- 설명: 베껴 쓰다 눈이 먼 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/scribe.png` (지금은 🪶)
- 프롬프트: 필경사의 화신 — 베껴 쓰다 눈이 먼. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「눈이 멀 때까지 베껴 썼지. 이번엔 네가 가는 길을 받아 적으마.」
- 전리품:
  - `scribe_0` **마르지 않는 뿔병** (offhand) → `assets/items/scribe_0.png`
  - `scribe_2` **잉크 물든 장갑** (gloves) → `assets/items/scribe_2.png`

### 관우의 화신 `guanyu` — 정예 · 화신

- 설명: 다섯 관문을 지나 천 리를 홀로 간 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/guanyu.png` (지금은 🧔)
- 프롬프트: 관우의 화신 — 다섯 관문을 지나 천 리를 홀로 간. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「의리 하나로 천 리를 갔다. 이제 그 의리를 네게 건다.」
- 전리품:
  - `guanyu_0` **청룡언월도** (weapon) → `assets/items/guanyu_0.png`

### 아르키메데스의 화신 `archimedes` — 일반 · 화신

- 설명: 지렛대를 든 자 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/archimedes.png` (지금은 ⚙️)
- 프롬프트: 아르키메데스의 화신 — 지렛대를 든 자. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「발 디딜 곳만 다오. 세계는 네 쪽으로 기울어 움직일 테니.」
- 전리품:
  - `archimedes_1` **유레카의 원** (ring) → `assets/items/archimedes_1.png`

### 히파티아의 화신 `hypatia` — 일반 · 화신

- 설명: 마지막 도서관장 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/hypatia.png` (지금은 🔭)
- 프롬프트: 히파티아의 화신 — 마지막 도서관장. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「불타는 서가에서 마지막으로 꺼낸 게 너다. 잘 읽혀라.」
- 전리품:
  - `hypatia_0` **천구의** (offhand) → `assets/items/hypatia_0.png`
  - `hypatia_2` **천문 팔찌** (bracelet) → `assets/items/hypatia_2.png`

### 손자의 화신 `sunzi` — 정예 · 화신

- 설명: 싸우지 않고 이기는 법 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/sunzi.png` (지금은 📜)
- 프롬프트: 손자의 화신 — 싸우지 않고 이기는 법. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「싸움은 이미 끝나 있었다. 네가 이긴 쪽에 서 있었을 뿐.」
- 전리품:
  - `sunzi_0` **병법의 죽간** (weapon) → `assets/items/sunzi_0.png`
  - `sunzi_1` **그림자 각반** (greaves) → `assets/items/sunzi_1.png`

### 레오나르도 다 빈치의 화신 `davinci` — 일반 · 화신

- 설명: 다 그리지 못한 설계도 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/davinci.png` (지금은 🎨)
- 프롬프트: 레오나르도 다 빈치의 화신 — 다 그리지 못한 설계도. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「설계도는 아직 덜 그렸다. 네 몸으로 마저 그려 보자.」
- 전리품:
  - `davinci_1` **비행 장치** (boots) → `assets/items/davinci_1.png`
  - `davinci_2` **설계도 각반** (greaves) → `assets/items/davinci_2.png`

### 장비의 화신 `zhangfei` — 정예 · 화신

- 설명: 다리 위의 호통 한 번으로 대군을 멈춘 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/zhangfei.png` (지금은 🍶)
- 프롬프트: 장비의 화신 — 다리 위의 호통 한 번으로 대군을 멈춘. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「다리 위에서 한 번 소리치면 대군도 멈춘다. 네 앞길에서도 그래 주마.」
- 전리품:
  - `zhangfei_0` **술 호리병 허리띠** (belt) → `assets/items/zhangfei_0.png`

### 헤로도토스의 화신 `herodotos` — 일반 · 화신

- 설명: 처음으로 기록한 자 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/herodotos.png` (지금은 🗺️)
- 프롬프트: 헤로도토스의 화신 — 처음으로 기록한 자. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「네가 한 일을 있는 그대로 적어 두겠다. 부풀리지는 않는다.」
- 전리품:
  - `herodotos_0` **기록자의 두건** (helm) → `assets/items/herodotos_0.png`
  - `herodotos_2` **여행자의 망토** (cloak) → `assets/items/herodotos_2.png`

### 잔 다르크의 화신 `joan` — 일반 · 화신

- 설명: 불타는 오를레앙의 처녀 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/joan.png` (지금은 ⚜️)
- 프롬프트: 잔 다르크의 화신 — 불타는 오를레앙의 처녀. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「목소리가 시키는 대로 갔을 뿐이야. 이번엔 네가 가는 길을 따라가지.」
- 전리품:
  - `joan_0` **성녀의 견갑** (shoulder) → `assets/items/joan_0.png`
  - `joan_2` **재가 되지 않는 심장** (necklace) → `assets/items/joan_2.png`

### 조운의 화신 `zhaoyun` — 정예 · 화신

- 설명: 어린 주군을 품고 대군을 홀로 뚫은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/zhaoyun.png` (지금은 🛡️)
- 프롬프트: 조운의 화신 — 어린 주군을 품고 대군을 홀로 뚫은. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「어린 주군을 품고 대군을 뚫었다. 너 하나쯤 품고 못 뚫을 길은 없다.」
- 전리품:
  - `zhaoyun_0` **아두를 품은 흉갑** (armor) → `assets/items/zhaoyun_0.png`

### 스파르타쿠스의 화신 `spartacus` — 정예 · 화신

- 설명: 사슬을 끊은 검투사 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/spartacus.png` (지금은 ⛓️)
- 프롬프트: 스파르타쿠스의 화신 — 사슬을 끊은 검투사. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「사슬은 끊으라고 있는 것이다. 네 사슬도 같이 끊어 주마.」
- 전리품:
  - `spartacus_1` **검투사의 방패** (offhand) → `assets/items/spartacus_1.png`
  - `spartacus_2` **끊어진 족쇄** (bracelet) → `assets/items/spartacus_2.png`

### 칭기즈 칸의 화신 `genghis` — 일반 · 화신

- 설명: 지평선을 국경으로 삼은 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/genghis.png` (지금은 🏇)
- 프롬프트: 칭기즈 칸의 화신 — 지평선을 국경으로 삼은. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「지평선 너머가 궁금하지 않나? 말을 내줄 테니 달려라.」
- 전리품:
  - `genghis_0` **초원의 어깨가리개** (shoulder) → `assets/items/genghis_0.png`
  - `genghis_1` **천리마의 등자** (boots) → `assets/items/genghis_1.png`

### 마초의 화신 `machao` — 정예 · 화신

- 설명: 사자 투구를 쓴 서량의 금마초 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/machao.png` (지금은 🦁)
- 프롬프트: 마초의 화신 — 사자 투구를 쓴 서량의 금마초. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「사자 투구는 아직 벗지 않았다. 네 원수도 내 원수다.」
- 전리품:
  - `machao_0` **사자 투구** (helm) → `assets/items/machao_0.png`

### 알렉산드로스의 화신 `alexander` — 일반 · 화신

- 설명: 온 세계가 좁았던 자 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/alexander.png` (지금은 🐎)
- 프롬프트: 알렉산드로스의 화신 — 온 세계가 좁았던 자. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「세계가 좁았다. 네가 가는 곳은 얼마나 넓은지 보고 싶군.」
- 전리품:
  - `alexander_0` **정복자의 투구** (helm) → `assets/items/alexander_0.png`
  - `alexander_4` **칼로 끊은 매듭** (special·relic) → `assets/items/alexander_4.png`

### 황충의 화신 `huangzhong` — 정예 · 화신

- 설명: 일흔에도 활을 놓지 않은 노장 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/huangzhong.png` (지금은 🏹)
- 프롬프트: 황충의 화신 — 일흔에도 활을 놓지 않은 노장. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「일흔에도 활은 놓지 않았다. 늙었다고 빗나가는 화살은 없다.」
- 전리품:
  - `huangzhong_0` **노장의 깍지** (ring) → `assets/items/huangzhong_0.png`

### 헤르메스 트리스메기스투스의 화신 `trismegistus` — 히든 · 화신

- 설명: 위에서와 같이 아래에서도 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/trismegistus.png` (지금은 ⚗️)
- 프롬프트: 헤르메스 트리스메기스투스의 화신 — 위에서와 같이 아래에서도. 알렉산드리아 대도서관(제7격 설화)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 화신의 한마디: 「위에서와 같이 아래에서도. 네가 선 자리가 곧 그 증거다.」
- 전리품:
  - `trismegistus_0` **에메랄드 서판** (special·relic) → `assets/items/trismegistus_0.png`
  - `trismegistus_1` **현자의 돌** (special·gem) → `assets/items/trismegistus_1.png`

### 이순신의 화신 `yisunsin` — 보스 · 화신

- 설명: 아직 열두 척이 남았다 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/yisunsin.png` (지금은 ⚓)
- 프롬프트: 이순신의 화신 — 아직 열두 척이 남았다. 알렉산드리아 대도서관(제7격 설화)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「신에게는 아직 열두 척의 배가 남아 있사옵니다. 함께 나아가지요.」
- 전리품:
  - `yisunsin_0` **쌍룡검** (weapon) → `assets/items/yisunsin_0.png`
  - `yisunsin_1` **두정갑** (armor) → `assets/items/yisunsin_1.png`
  - `yisunsin_2` **난중일기** (necklace) → `assets/items/yisunsin_2.png`


---

## 제8격 기사 — 원탁의 성 카멜롯

> 검에 이름을 붙인 자들이 원탁에 모인다. 빈자리 하나는 아직 주인이 없다.

### 오러 기사 `auraknight` — 일반 · 화신

- 설명: 검 끝에 오러를 세운 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/auraknight.png` (지금은 ⚔️)
- 프롬프트: 오러 기사 — 검 끝에 오러를 세운. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「검 끝에 빛을 세우는 데 십 년이 걸렸다. 네 검에도 세워 주마.」
- 전리품:
  - `auraknight_0` **오러를 쥔 건틀릿** (gloves) → `assets/items/auraknight_0.png`
  - `auraknight_1` **오러가 밴 흉갑** (armor) → `assets/items/auraknight_1.png`

### 성기사 `paladin` — 일반 · 화신

- 설명: 기도로 검을 벼린 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/paladin.png` (지금은 🔆)
- 프롬프트: 성기사 — 기도로 검을 벼린. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「기도는 짧게, 검은 곧게. 남은 건 내가 지킨다.」
- 전리품:
  - `paladin_0` **기도문을 새긴 방패** (offhand) → `assets/items/paladin_0.png`
  - `paladin_1` **축성된 성표** (necklace) → `assets/items/paladin_1.png`

### 랜슬롯의 화신 `lancelot` — 정예 · 화신

- 설명: 원탁에서 가장 뛰어났던 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/lancelot.png` (지금은 🗡️)
- 프롬프트: 랜슬롯의 화신 — 원탁에서 가장 뛰어났던. 원탁의 성 카멜롯(제8격 기사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「가장 뛰어났기에 가장 많이 잃었다. 너는 잃지 않게 곁에 서마.」
- 전리품:
  - `lancelot_0` **아론다이트** (weapon) → `assets/items/lancelot_0.png`

### 템플 기사 `templar` — 일반 · 화신

- 설명: 성지를 지키다 이단이 된 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/templar.png` (지금은 🏰)
- 프롬프트: 템플 기사 — 성지를 지키다 이단이 된. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「성지는 잃었지만 맹세는 남았다. 그 맹세를 네게 빌려주지.」
- 전리품:
  - `templar_0` **붉은 십자 투구** (helm) → `assets/items/templar_0.png`
  - `templar_1` **흰 성전 망토** (cloak) → `assets/items/templar_1.png`

### 용기사 `dragonknight` — 일반 · 화신

- 설명: 용을 타고 내려오는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/dragonknight.png` (지금은 🐉)
- 프롬프트: 용기사 — 용을 타고 내려오는. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「용의 등에서 내려다보면 길이 보인다. 올라타라.」
- 전리품:
  - `dragonknight_0` **용비늘 견갑** (shoulder) → `assets/items/dragonknight_0.png`
  - `dragonknight_1` **하늘을 딛는 용의 등자** (boots) → `assets/items/dragonknight_1.png`

### 가웨인의 화신 `gawain` — 정예 · 화신

- 설명: 해가 높을수록 세지는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/gawain.png` (지금은 ☀️)
- 프롬프트: 가웨인의 화신 — 해가 높을수록 세지는. 원탁의 성 카멜롯(제8격 기사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「해가 높을수록 세진다. 네 앞길이 한낮이면 좋겠군.」
- 전리품:
  - `gawain_0` **정오의 고리** (ring) → `assets/items/gawain_0.png`

### 광전사 `berserker` — 일반 · 화신

- 설명: 곰가죽을 쓰고 고통을 잊은 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/berserker.png` (지금은 🐻)
- 프롬프트: 광전사 — 곰가죽을 쓰고 고통을 잊은. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「아픔은 나중에 느끼면 된다. 지금은 앞만 봐라.」
- 전리품:
  - `berserker_0` **곰가죽 어깨덮개** (shoulder) → `assets/items/berserker_0.png`
  - `berserker_1` **곰 발톱 팔찌** (bracelet) → `assets/items/berserker_1.png`

### 갤러해드의 화신 `galahad` — 정예 · 화신

- 설명: 성배에 닿은 단 한 사람 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/galahad.png` (지금은 🏆)
- 프롬프트: 갤러해드의 화신 — 성배에 닿은 단 한 사람. 원탁의 성 카멜롯(제8격 기사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「성배는 찾는 자가 아니라 맑은 자에게 닿는다. 너는 맑다.」
- 전리품:
  - `galahad_0` **성배의 한 줄기 빛** (necklace) → `assets/items/galahad_0.png`

### 녹색 기사 `greenknight` — 일반 · 화신

- 설명: 목을 베여도 제 머리를 주워 드는 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/greenknight.png` (지금은 🌿)
- 프롬프트: 녹색 기사 — 목을 베여도 제 머리를 주워 드는. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「목을 베어도 나는 다시 일어선다. 약속은 지켜야 하니까.」
- 전리품:
  - `greenknight_0` **초록 허리띠** (belt) → `assets/items/greenknight_0.png`

### 트리스탄의 화신 `tristan` — 정예 · 화신

- 설명: 바다 건너 슬픈 사랑을 한 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/tristan.png` (지금은 🎻)
- 프롬프트: 트리스탄의 화신 — 바다 건너 슬픈 사랑을 한. 원탁의 성 카멜롯(제8격 기사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「슬픈 노래는 이제 그만. 네 이야기는 다르게 끝나게 해 주마.」
- 전리품:
  - `tristan_0` **이졸데의 팔찌** (bracelet) → `assets/items/tristan_0.png`

### 롤랑의 화신 `roland` — 일반 · 화신

- 설명: 뿔나팔을 너무 늦게 분 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/roland.png` (지금은 📯)
- 프롬프트: 롤랑의 화신 — 뿔나팔을 너무 늦게 분. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「뿔나팔을 너무 늦게 불었다. 너는 부를 때를 놓치지 마라.」
- 전리품:
  - `roland_0` **뒤랑달** (weapon) → `assets/items/roland_0.png`
  - `roland_1` **론세스바예스의 허리띠** (belt) → `assets/items/roland_1.png`

### 퍼시벌의 화신 `percival` — 정예 · 화신

- 설명: 숲에서 자라 성배를 찾아 나선 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/percival.png` (지금은 🌲)
- 프롬프트: 퍼시벌의 화신 — 숲에서 자라 성배를 찾아 나선. 원탁의 성 카멜롯(제8격 기사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「숲에서 와서 아무것도 몰랐지. 그래서 성배를 봤다. 너도 그렇게 가라.」
- 전리품:
  - `percival_0` **숲에서 온 투박한 각반** (greaves) → `assets/items/percival_0.png`

### 엘 시드의 화신 `elcid` — 일반 · 화신

- 설명: 죽어서도 말에 올라 싸운 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/elcid.png` (지금은 🏇)
- 프롬프트: 엘 시드의 화신 — 죽어서도 말에 올라 싸운. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「죽어서도 말에 올랐다. 살아 있는 너라면 더 멀리 가겠지.」
- 전리품:
  - `elcid_0` **바비에카를 몬 박차** (boots) → `assets/items/elcid_0.png`
  - `elcid_1` **마지막 출정의 각반** (greaves) → `assets/items/elcid_1.png`

### 베디비어의 화신 `bedivere` — 정예 · 화신

- 설명: 마지막까지 왕 곁에 남은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/bedivere.png` (지금은 🌊)
- 프롬프트: 베디비어의 화신 — 마지막까지 왕 곁에 남은. 원탁의 성 카멜롯(제8격 기사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「마지막까지 왕 곁에 남았다. 이제 네 곁이 내 자리다.」
- 전리품:
  - `bedivere_0` **검을 호수에 던진 손** (gloves) → `assets/items/bedivere_0.png`

### 로빈 후드의 화신 `robinhood` — 일반 · 화신

- 설명: 부자의 것을 털어 숲에 숨은 명궁 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/robinhood.png` (지금은 🏹)
- 프롬프트: 로빈 후드의 화신 — 부자의 것을 털어 숲에 숨은 명궁. 원탁의 성 카멜롯(제8격 기사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「부자의 것은 털고 가난한 자의 것은 지킨다. 네 주머니는 걱정 마라.」
- 전리품:
  - `robinhood_0` **링컨 그린 두건** (cloak) → `assets/items/robinhood_0.png`
  - `robinhood_1` **화살을 가른 깍지** (ring) → `assets/items/robinhood_1.png`

### 모드레드의 화신 `mordred` — 정예 · 화신

- 설명: 왕을 찌른 원탁의 마지막 자리 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/mordred.png` (지금은 🩸)
- 프롬프트: 모드레드의 화신 — 왕을 찌른 원탁의 마지막 자리. 원탁의 성 카멜롯(제8격 기사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「왕을 찔렀다. 그래서 왕이 되는 법도 안다. 원하면 가르쳐 주마.」
- 전리품:
  - `mordred_0` **배신자의 투구** (helm) → `assets/items/mordred_0.png`

### 호수의 여인 `ladyofthelake` — 히든 · 화신

- 설명: 엑스칼리버를 건네고 다시 받아 간 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/ladyofthelake.png` (지금은 🧜‍♀️)
- 프롬프트: 호수의 여인 — 엑스칼리버를 건네고 다시 받아 간. 원탁의 성 카멜롯(제8격 기사)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 화신의 한마디: 「검은 건네고, 때가 되면 돌려받는다. 잘 쓰고 돌려다오.」
- 전리품:
  - `ladyofthelake_0` **아발론의 칼집** (special·relic) → `assets/items/ladyofthelake_0.png`

### 아서왕의 화신 `arthur` — 보스 · 화신

- 설명: 바위에서 검을 뽑은 왕 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/arthur.png` (지금은 👑)
- 프롬프트: 아서왕의 화신 — 바위에서 검을 뽑은 왕. 원탁의 성 카멜롯(제8격 기사)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「바위에서 검을 뽑은 날부터 왕이었다. 이제 그 검은 네 손에서 빛난다.」
- 전리품:
  - `arthur_0` **엑스칼리버** (weapon) → `assets/items/arthur_0.png`
  - `arthur_1` **펜드래건의 갑주** (armor) → `assets/items/arthur_1.png`
  - `arthur_2` **프리드웬** (offhand) → `assets/items/arthur_2.png`


---

## 제9격 마도 — 안개 너머의 아발론

> 안개 너머의 사과 섬. 마나가 짙어 숨만 쉬어도 주문이 된다.

### 대마법사 `archmage` — 일반 · 화신

- 설명: 마나로 별을 떨어뜨리는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/archmage.png` (지금은 ☄️)
- 프롬프트: 대마법사 — 마나로 별을 떨어뜨리는. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「마나는 넘치면 별이 된다. 떨어뜨릴 곳만 가리켜라.」
- 전리품:
  - `archmage_0` **별을 부르는 지팡이** (weapon) → `assets/items/archmage_0.png`
  - `archmage_1` **마나가 고인 고깔모자** (helm) → `assets/items/archmage_1.png`

### 원소술사 `elementalist` — 일반 · 화신

- 설명: 불과 얼음을 한 손에 쥔 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/elementalist.png` (지금은 🪄)
- 프롬프트: 원소술사 — 불과 얼음을 한 손에 쥔. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「불과 얼음은 싸우지 않는다. 쥐는 법을 알면.」
- 전리품:
  - `elementalist_0` **네 원소를 쥔 손** (gloves) → `assets/items/elementalist_0.png`
  - `elementalist_1` **불과 얼음의 팔찌** (bracelet) → `assets/items/elementalist_1.png`

### 샐러맨더 `salamander` — 정예 · 화신

- 설명: 불 속에서만 사는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/salamander.png` (지금은 🦎)
- 프롬프트: 샐러맨더 — 불 속에서만 사는. 안개 너머의 아발론(제9격 마도)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「불 속이 내 집이다. 네 앞을 태워 길을 내 주지.」
- 전리품:
  - `salamander2_0` **화염 손** (gloves) → `assets/items/salamander2_0.png`

### 소환술사 `summoner` — 일반 · 화신

- 설명: 이름을 불러 다른 세계의 것을 끌어오는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/summoner.png` (지금은 🌌)
- 프롬프트: 소환술사 — 이름을 불러 다른 세계의 것을 끌어오는. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「이름을 부르면 온다. 이제 네 이름도 부를 줄 안다.」
- 전리품:
  - `summoner_0` **이름을 적은 마도서** (offhand) → `assets/items/summoner_0.png`
  - `summoner_1` **계약의 인장** (ring) → `assets/items/summoner_1.png`

### 룬 마법사 `runemage` — 일반 · 화신

- 설명: 돌에 새긴 글자로 싸우는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/runemage.png` (지금은 💠)
- 프롬프트: 룬 마법사 — 돌에 새긴 글자로 싸우는. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「돌에 새긴 것은 지워지지 않는다. 네 이름도 새겨 두마.」
- 전리품:
  - `runemage_0` **룬을 새긴 견갑** (shoulder) → `assets/items/runemage_0.png`
  - `runemage_1` **룬 뼈 목걸이** (necklace) → `assets/items/runemage_1.png`

### 운디네 `undine` — 정예 · 화신

- 설명: 사랑을 잃으면 물로 돌아가는 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/undine.png` (지금은 💧)
- 프롬프트: 운디네 — 사랑을 잃으면 물로 돌아가는. 안개 너머의 아발론(제9격 마도)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「사랑을 잃으면 물로 돌아간다더군. 그러니 나를 잃지 마라.」
- 전리품:
  - `undine_0` **사랑을 잃은 물방울** (necklace) → `assets/items/undine_0.png`

### 연금술사 `alchemist` — 일반 · 화신

- 설명: 납을 금으로 바꾸려다 자신을 바꾼 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/alchemist.png` (지금은 ⚗️)
- 프롬프트: 연금술사 — 납을 금으로 바꾸려다 자신을 바꾼. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「납을 금으로 바꾸진 못했다. 대신 너를 바꿔 보겠다.」
- 전리품:
  - `alchemist_0` **얼룩진 연금 앞치마** (armor) → `assets/items/alchemist_0.png`
  - `alchemist_1` **약병을 꽂은 허리띠** (belt) → `assets/items/alchemist_1.png`

### 드루이드 `druid` — 일반 · 화신

- 설명: 떡갈나무에게 말을 거는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/druid.png` (지금은 🍃)
- 프롬프트: 드루이드 — 떡갈나무에게 말을 거는. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「떡갈나무가 네 이야기를 해 주더군. 오래 살아라.」
- 전리품:
  - `druid_0` **겨우살이 두건** (cloak) → `assets/items/druid_0.png`
  - `druid_1` **떡갈나무 껍질 각반** (greaves) → `assets/items/druid_1.png`

### 파우스트의 화신 `faust` — 정예 · 화신

- 설명: 악마에게 영혼을 걸고 모든 것을 안 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/faust.png` (지금은 📚)
- 프롬프트: 파우스트의 화신 — 악마에게 영혼을 걸고 모든 것을 안. 안개 너머의 아발론(제9격 마도)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「모든 것을 알았는데 남은 게 없었다. 너는 남는 쪽을 골라라.」
- 전리품:
  - `faust_0` **박사의 검은 가운** (cloak) → `assets/items/faust_0.png`
  - `faust_1` **되찾은 젊음의 팔찌** (bracelet) → `assets/items/faust_1.png`

### 실프 `sylph` — 정예 · 화신

- 설명: 만질 수 없는 것 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/sylph.png` (지금은 💨)
- 프롬프트: 실프 — 만질 수 없는 것. 안개 너머의 아발론(제9격 마도)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「바람은 붙잡을 수 없다. 대신 등을 밀어 줄 수는 있지.」
- 전리품:
  - `sylph2_0` **바람의 신** (boots) → `assets/items/sylph2_0.png`

### 흑마법사 `warlock` — 일반 · 화신

- 설명: 금지된 책을 끝까지 읽은 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/warlock.png` (지금은 🌘)
- 프롬프트: 흑마법사 — 금지된 책을 끝까지 읽은. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「금지된 책은 끝까지 읽어야 금지된 이유를 안다. 대가는 내가 치렀다.」
- 전리품:
  - `warlock_0` **끝까지 읽은 금지된 책** (offhand) → `assets/items/warlock_0.png`
  - `warlock_1` **그림자 로브** (armor) → `assets/items/warlock_1.png`

### 바바 야가의 화신 `babayaga` — 일반 · 화신

- 설명: 닭다리 오두막에 사는 숲의 마녀 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/babayaga.png` (지금은 🛖)
- 프롬프트: 바바 야가의 화신 — 닭다리 오두막에 사는 숲의 마녀. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「절구를 타고 숲을 난다. 길을 잃으면 내 오두막에 들러라. 잡아먹진 않으마.」
- 전리품:
  - `babayaga_0` **절구공이** (weapon) → `assets/items/babayaga_0.png`
  - `babayaga_1` **해골 등불 허리띠** (belt) → `assets/items/babayaga_1.png`

### 노움 `gnome` — 정예 · 화신

- 설명: 땅속을 헤엄치듯 다니는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/gnome.png` (지금은 ⛏️)
- 프롬프트: 노움 — 땅속을 헤엄치듯 다니는. 안개 너머의 아발론(제9격 마도)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「땅속 길은 내가 다 안다. 위에서 막히면 아래로 가자.」
- 전리품:
  - `gnome_0` **땅속을 걷는 각반** (greaves) → `assets/items/gnome_0.png`

### 키르케의 화신 `circe` — 일반 · 화신

- 설명: 사람을 돼지로 바꾸는 섬의 마녀 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/circe.png` (지금은 🐖)
- 프롬프트: 키르케의 화신 — 사람을 돼지로 바꾸는 섬의 마녀. 안개 너머의 아발론(제9격 마도)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「사람을 돼지로 바꾸는 건 쉽다. 너는 바꾸지 않겠다. 아직은.」
- 전리품:
  - `circe_0` **베틀에서 짠 숄** (shoulder) → `assets/items/circe_0.png`

### 모르간 르 페이의 화신 `morgan` — 정예 · 화신

- 설명: 아발론을 다스리는 마녀 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/morgan.png` (지금은 🍎)
- 프롬프트: 모르간 르 페이의 화신 — 아발론을 다스리는 마녀. 안개 너머의 아발론(제9격 마도)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「아발론의 안개는 내가 걷는다. 네가 지나갈 길만 열어 두지.」
- 전리품:
  - `morgan_0` **아발론의 안개 망토** (cloak) → `assets/items/morgan_0.png`
  - `morgan_1` **요정 여왕의 반지** (ring) → `assets/items/morgan_1.png`

### 멀린의 화신 `merlin` — 보스 · 화신

- 설명: 왕을 만든 마법사 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/merlin.png` (지금은 🧙)
- 프롬프트: 멀린의 화신 — 왕을 만든 마법사. 안개 너머의 아발론(제9격 마도)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「왕을 만들었다. 이번엔 너를 만들어 볼 차례군.」
- 전리품:
  - `merlin_0` **꿈을 꾸는 지팡이** (weapon) → `assets/items/merlin_0.png`
  - `merlin_1` **은자의 두건** (helm) → `assets/items/merlin_1.png`
  - `merlin_2` **탑에 갇힌 수정** (necklace) → `assets/items/merlin_2.png`


---

## 제10격 무림 — 천하제일 비무대

> 강호에 이름 석 자를 남기려는 자들이 오른다. 걸어서 내려간 자는 손에 꼽는다.

### 흑도 낭인 `nangin` — 일반 · 화신

- 설명: 값만 맞으면 누구든 벤다 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/nangin.png` (지금은 🗡️)
- 프롬프트: 흑도 낭인 — 값만 맞으면 누구든 벤다. 천하제일 비무대(제10격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「값은 이미 치렀다. 이제부터 내 칼은 네 것이다.」
- 전리품:
  - `nangin2_0` **떠돌이 짚신** (boots) → `assets/items/nangin2_0.png`

### 개방 장로 `gaebang` — 일반 · 화신

- 설명: 천하의 소문은 거지가 먼저 안다 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/gaebang.png` (지금은 🥢)
- 프롬프트: 개방 장로 — 천하의 소문은 거지가 먼저 안다. 천하제일 비무대(제10격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「소문은 거지가 제일 빠르지. 네 소문은 내가 퍼뜨려 주마.」
- 전리품:
  - `gaebang2_0` **아홉 매듭 띠** (belt) → `assets/items/gaebang2_0.png`
  - `gaebang2_1` **동냥 바가지** (offhand) → `assets/items/gaebang2_1.png`

### 남궁세가 가주 `namgung` — 정예 · 화신

- 설명: 창공을 가르는 세가의 검 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/namgung.png` (지금은 🏯)
- 프롬프트: 남궁세가 가주 — 창공을 가르는 세가의 검. 천하제일 비무대(제10격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「남궁의 검은 하늘을 가른다. 네 앞길도 갈라 주지.」
- 전리품:
  - `namgung2_0` **세가의 옥패** (necklace) → `assets/items/namgung2_0.png`

### 아미파 사태 `emei` — 일반 · 화신

- 설명: 자비로운 얼굴, 자비 없는 비수 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/emei.png` (지금은 📿)
- 프롬프트: 아미파 사태 — 자비로운 얼굴, 자비 없는 비수. 천하제일 비무대(제10격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「자비롭게 웃으며 찌를 줄도 안다. 함께 가면 쓸모가 있을 거다.」
- 전리품:
  - `emei2_0` **아미자** (ring) → `assets/items/emei2_0.png`
  - `emei2_1` **백팔 염주** (bracelet) → `assets/items/emei2_1.png`

### 소림 나한 `shaolin` — 일반 · 화신

- 설명: 쇠를 두드려 몸을 만든 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/shaolin.png` (지금은 🙏)
- 프롬프트: 소림 나한 — 쇠를 두드려 몸을 만든. 천하제일 비무대(제10격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「몸은 쇠처럼, 마음은 물처럼. 맞는 법부터 배워라.」
- 전리품:
  - `shaolin2_0` **금강 권갑** (gloves) → `assets/items/shaolin2_0.png`
  - `shaolin2_1` **철포삼** (armor) → `assets/items/shaolin2_1.png`

### 사천당가 독수 `tangga` — 정예 · 화신

- 설명: 손끝마다 다른 독 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/tangga.png` (지금은 🧪)
- 프롬프트: 사천당가 독수 — 손끝마다 다른 독. 천하제일 비무대(제10격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「손끝이 닿기만 해도 족하다. 네 적에게도 알려 주지.」
- 전리품:
  - `tangga2_0` **암기 견대** (shoulder) → `assets/items/tangga2_0.png`

### 달마의 화신 `dalma` — 정예 · 화신

- 설명: 벽을 보고 아홉 해 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/dalma.png` (지금은 🧘)
- 프롬프트: 달마의 화신 — 벽을 보고 아홉 해. 천하제일 비무대(제10격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「…구 년째 벽만 보다가 너를 봤다. 나쁘지 않군.」
- 전리품:
  - `dalma2_0` **세수경** (offhand) → `assets/items/dalma2_0.png`
  - `dalma2_1` **면벽의 염주** (necklace) → `assets/items/dalma2_1.png`

### 무당 도사 `wudang` — 일반 · 화신

- 설명: 부드러움이 굳셈을 이긴다 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/wudang.png` (지금은 ☯️)
- 프롬프트: 무당 도사 — 부드러움이 굳셈을 이긴다. 천하제일 비무대(제10격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「힘을 빼라. 센 것은 부드러운 것에게 진다.」
- 전리품:
  - `wudang2_0` **송문고검** (weapon) → `assets/items/wudang2_0.png`
  - `wudang2_1` **태극 도포** (cloak) → `assets/items/wudang2_1.png`

### 모용세가 공자 `moyong` — 정예 · 화신

- 설명: 받은 수를 그대로 돌려주는 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/moyong.png` (지금은 🪞)
- 프롬프트: 모용세가 공자 — 받은 수를 그대로 돌려주는. 천하제일 비무대(제10격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「받은 것은 그대로 돌려준다. 은혜든 원한이든.」
- 전리품:
  - `moyong_0` **되돌리는 손** (gloves) → `assets/items/moyong_0.png`

### 화산파 매화검수 `hwasan` — 일반 · 화신

- 설명: 검 끝에 매화가 핀다 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/hwasan.png` (지금은 🌸)
- 프롬프트: 화산파 매화검수 — 검 끝에 매화가 핀다. 천하제일 비무대(제10격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「매화는 눈 속에서 핀다. 네 앞길이 얼어 있을수록 좋지.」
- 전리품:
  - `hwasan2_0` **매화 두건** (helm) → `assets/items/hwasan2_0.png`
  - `hwasan2_1` **암향 신** (boots) → `assets/items/hwasan2_1.png`

### 제갈세가 군사 `jegal` — 정예 · 화신

- 설명: 진법과 기관으로 싸우는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/jegal.png` (지금은 🪭)
- 프롬프트: 제갈세가 군사 — 진법과 기관으로 싸우는. 천하제일 비무대(제10격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「진은 이미 쳐 두었다. 너는 그 가운데로 걸어 들어가기만 해라.」
- 전리품:
  - `jegal_0` **백우선** (offhand) → `assets/items/jegal_0.png`

### 장삼봉의 화신 `zhangsanfeng` — 정예 · 화신

- 설명: 태극을 처음 그린 자 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/zhangsanfeng.png` (지금은 ⛰️)
- 프롬프트: 장삼봉의 화신 — 태극을 처음 그린 자. 천하제일 비무대(제10격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「원을 그려 보아라. 끝과 시작이 만나는 곳에 답이 있다.」
- 전리품:
  - `zhangsanfeng2_0` **태극 팔찌** (bracelet) → `assets/items/zhangsanfeng2_0.png`
  - `zhangsanfeng2_1` **구름 위를 걷는 각반** (greaves) → `assets/items/zhangsanfeng2_1.png`

### 북해빙궁 무사 `bukhae` — 일반 · 화신

- 설명: 얼음 궁에서 내려온 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/bukhae.png` (지금은 🧊)
- 프롬프트: 북해빙궁 무사 — 얼음 궁에서 내려온. 천하제일 비무대(제10격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「얼음 궁은 춥지만 사람은 따뜻하더군. 오래 곁에 있어도 되겠나.」
- 전리품:
  - `bukhae2_0` **한빙 갑의** (armor) → `assets/items/bukhae2_0.png`
  - `bukhae2_1` **서리 투구** (helm) → `assets/items/bukhae2_1.png`

### 하북팽가 도객 `paeng` — 정예 · 화신

- 설명: 도 한 자루로 하북을 지킨 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/paeng.png` (지금은 🔪)
- 프롬프트: 하북팽가 도객 — 도 한 자루로 하북을 지킨. 천하제일 비무대(제10격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「도 한 자루면 족하다. 나머지는 네가 들어라.」
- 전리품:
  - `paeng_0` **팽가의 대도** (weapon) → `assets/items/paeng_0.png`

### 천마 `cheonma` — 보스 · 화신

- 설명: 하늘 아래 마(魔)는 하나뿐 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/cheonma.png` (지금은 🌑)
- 프롬프트: 천마 — 하늘 아래 마(魔)는 하나뿐. 천하제일 비무대(제10격 무림)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「하늘 아래 마(魔)는 하나뿐이다. 이제 그 하나가 네 안에 산다.」
- 전리품:
  - `cheonma2_0` **천마검** (weapon) → `assets/items/cheonma2_0.png`
  - `cheonma2_1` **천마흑포** (armor) → `assets/items/cheonma2_1.png`
  - `cheonma2_2` **천마의 비급** (special·relic) → `assets/items/cheonma2_2.png`


---

## 제11격 영물 — 만년설 덮인 천산

> 무림인이 평생을 걸고 찾는 내단의 주인들이 산다. 대개는 찾는 쪽이 먹힌다.

### 백년 영사 `yeongsa` — 일반 · 화신

- 설명: 내단을 품고 똬리를 튼 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/yeongsa.png` (지금은 🐍)
- 프롬프트: 백년 영사 — 내단을 품고 똬리를 튼. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「백 년을 똬리 틀고 기다렸다. 이제 움직일 때가 되었군.」
- 전리품:
  - `yeongsa2_0` **영사의 내단** (necklace) → `assets/items/yeongsa2_0.png`
  - `yeongsa2_1` **허물 벗은 신** (boots) → `assets/items/yeongsa2_1.png`

### 금잠고 `geumjam` — 일반 · 화신

- 설명: 독충을 다 잡아먹고 남은 하나 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/geumjam.png` (지금은 🐛)
- 프롬프트: 금잠고 — 독충을 다 잡아먹고 남은 하나. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「독충을 다 먹고 남은 건 나 하나. 너도 남는 쪽이 되어라.」
- 전리품:
  - `geumjam2_0` **금잠 반지** (ring) → `assets/items/geumjam2_0.png`
  - `geumjam2_1` **금사 장갑** (gloves) → `assets/items/geumjam2_1.png`

### 청룡 `azuredragon` — 정예 · 화신

- 설명: 동쪽 하늘을 지키는 푸른 용 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/azuredragon.png` (지금은 🐲)
- 프롬프트: 청룡 — 동쪽 하늘을 지키는 푸른 용. 만년설 덮인 천산(제11격 영물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「동쪽 하늘에서 내려왔다. 해가 뜨는 쪽은 늘 네 편이다.」
- 전리품:
  - `azuredragon_0` **청룡의 비늘 허리띠** (belt) → `assets/items/azuredragon_0.png`

### 세 발 금두꺼비 `geumseom` — 일반 · 화신

- 설명: 물고 있던 동전을 뱉으면 복이 온다 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/geumseom.png` (지금은 🐸)
- 프롬프트: 세 발 금두꺼비 — 물고 있던 동전을 뱉으면 복이 온다. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「동전 하나 뱉어 주마. 복이란 건 받는 쪽이 하기 나름이다.」
- 전리품:
  - `geumseom2_0` **금섬 팔찌** (bracelet) → `assets/items/geumseom2_0.png`
  - `geumseom2_1` **금전표** (offhand) → `assets/items/geumseom2_1.png`

### 천년 산삼 동자 `sansam` — 일반 · 화신

- 설명: 사람 꼴을 하고 산을 뛰어다니는 뿌리 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/sansam.png` (지금은 🌱)
- 프롬프트: 천년 산삼 동자 — 사람 꼴을 하고 산을 뛰어다니는 뿌리. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「캐려고 오는 사람은 많았지. 같이 가자고 한 건 네가 처음이다.」
- 전리품:
  - `sansam2_0` **산삼 뿌리 띠** (belt) → `assets/items/sansam2_0.png`
  - `sansam2_1` **천년 삼 팔찌** (bracelet) → `assets/items/sansam2_1.png`

### 구미호 `gumiho` — 정예 · 화신

- 설명: 천 년을 채우면 사람이 된다 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/gumiho.png` (지금은 🦊)
- 프롬프트: 구미호 — 천 년을 채우면 사람이 된다. 만년설 덮인 천산(제11격 영물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「천 년을 채우면 사람이 된다더군. 네 곁이면 채울 만하겠어.」
- 전리품:
  - `gumiho2_0` **여우 구슬** (necklace) → `assets/items/gumiho2_0.png`
  - `gumiho2_1` **아홉 꼬리 목도리** (cloak) → `assets/items/gumiho2_1.png`

### 빙잠 `bingjam` — 일반 · 화신

- 설명: 만년설 속에서 실을 토하는 누에 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/bingjam.png` (지금은 🪱)
- 프롬프트: 빙잠 — 만년설 속에서 실을 토하는 누에. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「만년설 속에서 실을 뽑았다. 네 길이 끊기지 않게 엮어 주마.」
- 전리품:
  - `bingjam2_0` **천잠보의** (armor) → `assets/items/bingjam2_0.png`
  - `bingjam2_1` **빙잠사 망토** (cloak) → `assets/items/bingjam2_1.png`

### 백호 `whitetiger` — 정예 · 화신

- 설명: 서쪽 하늘을 지키는 흰 범 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/whitetiger.png` (지금은 🐯)
- 프롬프트: 백호 — 서쪽 하늘을 지키는 흰 범. 만년설 덮인 천산(제11격 영물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「서쪽 하늘의 범이다. 네 등 뒤는 내가 노려보마.」
- 전리품:
  - `whitetiger_0` **흰 범의 발톱** (gloves) → `assets/items/whitetiger_0.png`

### 웅녀 `ungnyeo` — 일반 · 화신

- 설명: 쑥과 마늘로 백 일을 버틴 곰 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/ungnyeo.png` (지금은 🐻)
- 프롬프트: 웅녀 — 쑥과 마늘로 백 일을 버틴 곰. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「백 일을 버텼다. 버티는 법이라면 가르쳐 줄 수 있지.」
- 전리품:
  - `ungnyeo2_0` **쑥 화관** (helm) → `assets/items/ungnyeo2_0.png`
  - `ungnyeo2_1` **곰 발 각반** (greaves) → `assets/items/ungnyeo2_1.png`

### 산군 `sangun` — 일반 · 화신

- 설명: 감히 이름으로 부르지 못하는 호랑이 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/sangun.png` (지금은 🐅)
- 프롬프트: 산군 — 감히 이름으로 부르지 못하는 호랑이. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「내 이름을 입에 올리는 자는 없었다. 네가 처음이군. 좋다.」
- 전리품:
  - `sangun2_0` **산군의 어깨** (shoulder) → `assets/items/sangun2_0.png`

### 주작 `vermilionbird` — 정예 · 화신

- 설명: 남쪽 하늘을 지키는 붉은 새 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/vermilionbird.png` (지금은 🪶)
- 프롬프트: 주작 — 남쪽 하늘을 지키는 붉은 새. 만년설 덮인 천산(제11격 영물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「남쪽 하늘이 붉게 타는 건 내 날개 때문이다. 따뜻하게 해 주지.」
- 전리품:
  - `vermilionbird_0` **주작의 불씨 반지** (ring) → `assets/items/vermilionbird_0.png`

### 금시조 `geumsijo` — 정예 · 화신

- 설명: 용을 잡아먹는 금빛 날개 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/geumsijo.png` (지금은 🦚)
- 프롬프트: 금시조 — 용을 잡아먹는 금빛 날개. 만년설 덮인 천산(제11격 영물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「용도 먹고 산 날개다. 높이 나는 법을 알려 주마.」
- 전리품:
  - `geumsijo2_0` **용을 찢는 발톱** (weapon) → `assets/items/geumsijo2_0.png`
  - `geumsijo2_1` **금빛 깃 견갑** (shoulder) → `assets/items/geumsijo2_1.png`

### 화린 `hwarin` — 일반 · 화신

- 설명: 불을 밟고 다니는 기린 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/hwarin.png` (지금은 🦌)
- 프롬프트: 화린 — 불을 밟고 다니는 기린. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「불을 밟고 걸어도 풀 한 포기 안 태운다. 네 발밑도 그렇게 해 주지.」
- 전리품:
  - `hwarin2_0` **화린 뿔창** (weapon) → `assets/items/hwarin2_0.png`
  - `hwarin2_1` **불을 밟는 신** (boots) → `assets/items/hwarin2_1.png`

### 현무 `blacktortoise` — 정예 · 화신

- 설명: 북쪽 하늘을 지키는 거북과 뱀 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/blacktortoise.png` (지금은 🐢)
- 프롬프트: 현무 — 북쪽 하늘을 지키는 거북과 뱀. 만년설 덮인 천산(제11격 영물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「북쪽 하늘은 느리게 흐른다. 서두르지 않아도 닿는다.」
- 전리품:
  - `blacktortoise_0` **뱀이 감긴 각반** (greaves) → `assets/items/blacktortoise_0.png`

### 금강영구 `yeonggu` — 일반 · 화신

- 설명: 만 년을 등에 지고 걷는 거북 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/yeonggu.png` (지금은 🐢)
- 프롬프트: 금강영구 — 만 년을 등에 지고 걷는 거북. 만년설 덮인 천산(제11격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「만 년을 걸었으니 급할 것 없다. 천천히 가도 도착은 한다.」
- 전리품:
  - `yeonggu2_0` **만년 귀갑** (offhand) → `assets/items/yeonggu2_0.png`
  - `yeonggu2_1` **거북 등 투구** (helm) → `assets/items/yeonggu2_1.png`

### 봉황 `bonghwang` — 히든 · 화신

- 설명: 태평한 세상에만 내려앉는 새 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/bonghwang.png` (지금은 🎋)
- 프롬프트: 봉황 — 태평한 세상에만 내려앉는 새. 만년설 덮인 천산(제11격 영물)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 화신의 한마디: 「태평한 세상에만 내려앉는다. 네가 그런 세상을 만들 수 있겠나.」
- 전리품:
  - `bonghwang2_0` **봉황의 비취** (special·gem) → `assets/items/bonghwang2_0.png`
  - `bonghwang2_1` **태평의 깃** (special·relic) → `assets/items/bonghwang2_1.png`

### 이무기 `imugi` — 보스 · 화신

- 설명: 천 년을 기다려 하늘로 오르려는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/imugi.png` (지금은 🐉)
- 프롬프트: 이무기 — 천 년을 기다려 하늘로 오르려는. 만년설 덮인 천산(제11격 영물)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「천 년을 기다렸다. 용이 되는 날이 오늘이라면 네 덕이다.」
- 전리품:
  - `imugi2_0` **승천하지 못한 뿔** (weapon) → `assets/items/imugi2_0.png`
  - `imugi2_1` **역린 갑주** (armor) → `assets/items/imugi2_1.png`
  - `imugi2_2` **이무기의 여의주** (special·gem) → `assets/items/imugi2_2.png`


---

## 제12격 환수 — 잊혀진 성역

> 신화에 이름이 실린 짐승들이 여기 숨어 있다.

### 유니콘 `unicorn` — 일반 · 화신

- 설명: 순수한 자에게만 보이는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/unicorn.png` (지금은 🦄)
- 프롬프트: 유니콘 — 순수한 자에게만 보이는. 잊혀진 성역(제12격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「순수한 자에게만 보인다. 그러니 보이는 동안은 너를 믿겠다.」
- 전리품:
  - `unicorn2_0` **일각수의 뿔** (weapon) → `assets/items/unicorn2_0.png`
  - `unicorn2_1` **정화의 팔찌** (bracelet) → `assets/items/unicorn2_1.png`

### 네메아의 사자 `nemeanlion` — 정예 · 화신

- 설명: 어떤 칼도 들지 않는 가죽 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/nemeanlion.png` (지금은 🦁)
- 프롬프트: 네메아의 사자 — 어떤 칼도 들지 않는 가죽. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「어떤 칼도 내 가죽을 뚫지 못했다. 이제 그 가죽이 너를 덮는다.」
- 전리품:
  - `nemeanlion_0` **칼이 들지 않는 갈기** (shoulder) → `assets/items/nemeanlion_0.png`

### 페가수스 `pegasus` — 일반 · 화신

- 설명: 땅을 딛지 않는 말 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/pegasus.png` (지금은 🐴)
- 프롬프트: 페가수스 — 땅을 딛지 않는 말. 잊혀진 성역(제12격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「땅을 딛지 않고 간다. 너도 가끔은 발을 떼 봐라.」
- 전리품:
  - `pegasus2_0` **구름을 딛는 편자** (boots) → `assets/items/pegasus2_0.png`
  - `pegasus2_1` **날개의 고리** (bracelet) → `assets/items/pegasus2_1.png`

### 케리네이아의 사슴 `ceryneianhind` — 정예 · 화신

- 설명: 황금 뿔에 청동 발굽을 단 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/ceryneianhind.png` (지금은 🦌)
- 프롬프트: 케리네이아의 사슴 — 황금 뿔에 청동 발굽을 단. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「누구도 나를 따라잡지 못했다. 너는 쫓지 않아서 닿았다.」
- 전리품:
  - `ceryneianhind_0` **청동 발굽** (boots) → `assets/items/ceryneianhind_0.png`

### 스핑크스 `sphinx` — 정예 · 화신

- 설명: 답하지 못하면 잡아먹는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/sphinx.png` (지금은 🐈‍⬛)
- 프롬프트: 스핑크스 — 답하지 못하면 잡아먹는. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「답을 맞혔으니 길을 내준다. 다음 수수께끼는 네가 내라.」
- 전리품:
  - `sphinx2_0` **풀리지 않는 수수께끼** (necklace) → `assets/items/sphinx2_0.png`
  - `sphinx2_1` **사자의 관** (helm) → `assets/items/sphinx2_1.png`

### 에리만토스의 멧돼지 `erymanthianboar` — 정예 · 화신

- 설명: 산을 갈아엎고 내려온 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/erymanthianboar.png` (지금은 🐗)
- 프롬프트: 에리만토스의 멧돼지 — 산을 갈아엎고 내려온. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「산을 갈아엎고 내려왔다. 막히는 것은 엎어 버려라.」
- 전리품:
  - `erymanthianboar_0` **멧돼지 엄니 각반** (greaves) → `assets/items/erymanthianboar_0.png`

### 피닉스 `phoenix` — 일반 · 화신

- 설명: 타 죽어야 사는 새 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/phoenix.png` (지금은 🔥)
- 프롬프트: 피닉스 — 타 죽어야 사는 새. 잊혀진 성역(제12격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「타 죽어야 다시 산다. 무서워하지 마라, 나는 매번 돌아온다.」
- 전리품:
  - `phoenix2_0` **재에서 난 깃옷** (cloak) → `assets/items/phoenix2_0.png`
  - `phoenix2_1` **다시 타오르는 잿불** (special·relic) → `assets/items/phoenix2_1.png`

### 스팀팔로스의 새 `stymphalianbirds` — 정예 · 화신

- 설명: 청동 깃을 화살처럼 쏘는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/stymphalianbirds.png` (지금은 🐦)
- 프롬프트: 스팀팔로스의 새 — 청동 깃을 화살처럼 쏘는. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「청동 깃은 화살처럼 날아간다. 겨누기만 해라.」
- 전리품:
  - `stymphalianbirds_0` **청동 깃 반지** (ring) → `assets/items/stymphalianbirds_0.png`

### 크레타의 황소 `cretanbull` — 정예 · 화신

- 설명: 바다에서 올라와 섬을 짓밟은 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/cretanbull.png` (지금은 🐂)
- 프롬프트: 크레타의 황소 — 바다에서 올라와 섬을 짓밟은. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「바다에서 올라온 황소다. 들이받을 곳을 정해라.」
- 전리품:
  - `cretanbull_0` **황소 뿔 방패** (offhand) → `assets/items/cretanbull_0.png`

### 히포그리프 `hippogriff` — 일반 · 화신

- 설명: 그리핀이 암말을 사랑해서 난 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/hippogriff.png` (지금은 🐎)
- 프롬프트: 히포그리프 — 그리핀이 암말을 사랑해서 난. 잊혀진 성역(제12격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「그리핀과 말 사이에서 났다. 안 될 일도 될 때가 있는 법이다.」
- 전리품:
  - `hippogriff_0` **그리핀의 앞발** (gloves) → `assets/items/hippogriff_0.png`

### 크라켄 `kraken` — 정예 · 화신

- 설명: 배를 통째로 끌고 내려가는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/kraken.png` (지금은 🦑)
- 프롬프트: 크라켄 — 배를 통째로 끌고 내려가는. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「배를 통째로 끌고 내려갔다. 네 적은 바다 밑에서 보게 될 거다.」
- 전리품:
  - `kraken2_0` **거대 촉수** (shoulder) → `assets/items/kraken2_0.png`
  - `kraken2_1` **흡반 갑피** (armor) → `assets/items/kraken2_1.png`

### 디오메데스의 말 `mares` — 정예 · 화신

- 설명: 사람을 먹고 자란 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/mares.png` (지금은 🐴)
- 프롬프트: 디오메데스의 말 — 사람을 먹고 자란. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「사람을 먹고 자랐다. 이제부터는 네 적만 먹겠다.」
- 전리품:
  - `mares_0` **쇠사슬 고삐** (belt) → `assets/items/mares_0.png`

### 게리온 `geryon` — 정예 · 화신

- 설명: 몸 셋이 한 허리에 붙은 거인 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/geryon.png` (지금은 🐄)
- 프롬프트: 게리온 — 몸 셋이 한 허리에 붙은 거인. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「몸이 셋이라 셋이 함께 너를 지킨다. 싸움은 언제나 셋 대 하나다.」
- 전리품:
  - `geryon_0` **세 몸을 두른 갑주** (armor) → `assets/items/geryon_0.png`

### 케르베로스 `cerberus` — 정예 · 화신

- 설명: 문을 지키는 세 머리 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/cerberus.png` (지금은 🐕)
- 프롬프트: 케르베로스 — 문을 지키는 세 머리. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「세 머리가 모두 너를 따르기로 했다. 문은 이제 네가 지켜라.」
- 전리품:
  - `cerberus2_0` **세 머리의 투구** (helm) → `assets/items/cerberus2_0.png`

### 라돈 `ladon` — 정예 · 화신

- 설명: 황금 사과나무를 감고 잠들지 않는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/ladon.png` (지금은 🐍)
- 프롬프트: 라돈 — 황금 사과나무를 감고 잠들지 않는. 잊혀진 성역(제12격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「잠들지 않고 황금 사과를 지켰다. 네 것도 그렇게 지켜 주마.」
- 전리품:
  - `ladon_0` **라돈의 비늘 목걸이** (necklace) → `assets/items/ladon_0.png`

### 성역의 수호룡 `sanctdragon` — 보스 · 화신

- 설명: 천 년을 한 자리에서 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/sanctdragon.png` (지금은 🐉)
- 프롬프트: 성역의 수호룡 — 천 년을 한 자리에서. 잊혀진 성역(제12격 환수)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「천 년을 한 자리에서 지켰다. 이제 그 자리를 너로 옮긴다.」
- 전리품:
  - `sanctdragon2_0` **용의 송곳니 검** (weapon) → `assets/items/sanctdragon2_0.png`
  - `sanctdragon2_1` **고룡 비늘 갑주** (armor) → `assets/items/sanctdragon2_1.png`
  - `sanctdragon2_2` **성역의 수호석** (special·relic) → `assets/items/sanctdragon2_2.png`


---

## 제13격 영웅 — 엘리시온 평원

> 죽어서도 영웅인 자들만 이 들판을 걷는다.

### 테세우스의 화신 `theseus` — 일반 · 화신

- 설명: 돌아오는 길을 아는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/theseus.png` (지금은 🧵)
- 프롬프트: 테세우스의 화신 — 돌아오는 길을 아는. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「미궁에서 돌아오는 길을 안다. 실 끝은 내가 쥐고 있지.」
- 전리품:
  - `theseus2_0` **아리아드네의 실타래** (necklace) → `assets/items/theseus2_0.png`
  - `theseus2_1` **미궁의 실 허리띠** (belt) → `assets/items/theseus2_1.png`

### 페르세우스의 화신 `perseus` — 일반 · 화신

- 설명: 보지 않고 벤 자 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/perseus.png` (지금은 🪞)
- 프롬프트: 페르세우스의 화신 — 보지 않고 벤 자. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「보지 않고도 벤다. 눈을 감고 따라와라.」
- 전리품:
  - `perseus2_0` **거울 방패** (offhand) → `assets/items/perseus2_0.png`
  - `perseus2_1` **보이지 않는 망토** (cloak) → `assets/items/perseus2_1.png`

### 오디세우스의 화신 `odysseus` — 일반 · 화신

- 설명: 열 해를 헤매고도 돌아간 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/odysseus.png` (지금은 ⛵)
- 프롬프트: 오디세우스의 화신 — 열 해를 헤매고도 돌아간. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「열 해를 헤매도 돌아간다. 돌아가는 길이라면 내가 안내하마.」
- 전리품:
  - `odysseus2_0` **열두 도끼를 꿰뚫은 손** (gloves) → `assets/items/odysseus2_0.png`

### 아탈란테의 화신 `atalanta` — 일반 · 화신

- 설명: 누구보다 빨랐던 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/atalanta.png` (지금은 🏹)
- 프롬프트: 아탈란테의 화신 — 누구보다 빨랐던. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「나보다 빠르면 곁을 내주마. …방금 졌군, 내가.」
- 전리품:
  - `atalanta2_0` **멈추지 않는 발** (boots) → `assets/items/atalanta2_0.png`
  - `atalanta2_1` **황금 사과** (ring) → `assets/items/atalanta2_1.png`

### 엔키두의 화신 `enkidu` — 일반 · 화신

- 설명: 흙으로 빚어진 벗 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/enkidu.png` (지금은 🌿)
- 프롬프트: 엔키두의 화신 — 흙으로 빚어진 벗. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「흙에서 나와 흙으로 돌아간다. 그 사이는 벗과 함께면 족하다.」
- 전리품:
  - `enkidu2_0` **들짐승의 가죽** (armor) → `assets/items/enkidu2_0.png`
  - `enkidu2_1` **야생의 각반** (greaves) → `assets/items/enkidu2_1.png`

### 길가메시의 화신 `gilgamesh` — 정예 · 화신

- 설명: 영생을 놓친 왕 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/gilgamesh.png` (지금은 🗿)
- 프롬프트: 길가메시의 화신 — 영생을 놓친 왕. 엘리시온 평원(제13격 영웅)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「영생은 놓쳤다. 그래도 잡을 수 있는 건 아직 많더군.」
- 전리품:
  - `gilgamesh2_0` **하늘 황소의 어깨** (shoulder) → `assets/items/gilgamesh2_0.png`
  - `gilgamesh2_1` **우루크의 왕관** (helm) → `assets/items/gilgamesh2_1.png`

### 헥토르의 화신 `hector` — 일반 · 화신

- 설명: 질 것을 알고도 나선 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/hector.png` (지금은 🏛️)
- 프롬프트: 헥토르의 화신 — 질 것을 알고도 나선. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「질 줄 알면서 나섰다. 너는 이기려고 나서라. 그 차이가 전부다.」
- 전리품:
  - `hector2_0` **트로이의 방패** (offhand) → `assets/items/hector2_0.png`
  - `hector2_1` **빛나는 투구** (helm) → `assets/items/hector2_1.png`

### 아킬레우스의 화신 `achilles` — 일반 · 화신

- 설명: 발뒤꿈치 하나만 사람인 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/achilles.png` (지금은 🛡️)
- 프롬프트: 아킬레우스의 화신 — 발뒤꿈치 하나만 사람인. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「약점은 하나뿐이다. 그 하나를 네가 지켜 다오.」
- 전리품:
  - `achilles2_0` **불멸의 청동 갑주** (armor) → `assets/items/achilles2_0.png`
  - `achilles2_1` **테티스가 잡았던 발목** (boots) → `assets/items/achilles2_1.png`

### 쿠 훌린의 화신 `cuchulainn` — 일반 · 화신

- 설명: 빛의 아이 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/cuchulainn.png` (지금은 🔱)
- 프롬프트: 쿠 훌린의 화신 — 빛의 아이. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「빛의 아이는 쓰러지면서도 선 채로 죽는다. 너도 그리 서라.」
- 전리품:
  - `cuchulainn2_0` **뒤틀림의 각반** (greaves) → `assets/items/cuchulainn2_0.png`
  - `cuchulainn2_1` **뒤틀림의 팔찌** (bracelet) → `assets/items/cuchulainn2_1.png`

### 베오울프의 화신 `beowulf` — 정예 · 화신

- 설명: 맨손으로 괴물을 찢은 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/beowulf.png` (지금은 🐻)
- 프롬프트: 베오울프의 화신 — 맨손으로 괴물을 찢은. 엘리시온 평원(제13격 영웅)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「괴물은 맨손으로 찢는 거다. 칼은 그다음 일이고.」
- 전리품:
  - `beowulf2_0` **그렌델의 팔** (gloves) → `assets/items/beowulf2_0.png`
  - `beowulf2_1` **흐룬팅의 고리** (bracelet) → `assets/items/beowulf2_1.png`

### 아르주나의 화신 `arjuna` — 일반 · 화신

- 설명: 과녁의 눈만 보이는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/arjuna.png` (지금은 🎯)
- 프롬프트: 아르주나의 화신 — 과녁의 눈만 보이는. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「과녁의 눈만 보인다. 네 눈에도 그것만 보이게 해 주지.」
- 전리품:
  - `arjuna2_0` **간디바** (weapon) → `assets/items/arjuna2_0.png`
  - `arjuna2_1` **전차병의 망토** (cloak) → `assets/items/arjuna2_1.png`

### 지그프리트의 화신 `siegfried` — 일반 · 화신

- 설명: 용의 피를 뒤집어쓴 자 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/siegfried.png` (지금은 🗡️)
- 프롬프트: 지그프리트의 화신 — 용의 피를 뒤집어쓴 자. 엘리시온 평원(제13격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「용의 피를 뒤집어썼지만 등 한 곳은 젖지 않았다. 그곳은 네가 맡아라.」
- 전리품:
  - `siegfried2_0` **마검 그람** (weapon) → `assets/items/siegfried2_0.png`
  - `siegfried2_1` **파프니르의 피** (special·gem) → `assets/items/siegfried2_1.png`

### 헤라클레스의 화신 `heracles` — 보스 · 화신

- 설명: 열두 번 죽고 열두 번 돌아온 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/heracles.png` (지금은 🦁)
- 프롬프트: 헤라클레스의 화신 — 열두 번 죽고 열두 번 돌아온. 엘리시온 평원(제13격 영웅)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「열두 번 죽고 열두 번 돌아왔다. 열세 번째도 같이 가자.」
- 전리품:
  - `heracles2_0` **올리브 몽둥이** (weapon) → `assets/items/heracles2_0.png`
  - `heracles2_1` **네메아 사자의 가죽** (armor) → `assets/items/heracles2_1.png`
  - `heracles2_2` **네메아를 꺾은 주먹** (special·relic) → `assets/items/heracles2_2.png`


---

## 제14격 천사 — 일곱 번째 하늘

> 노래가 한 번도 멈춘 적 없는 곳. 아홉 겹의 성가대가 문을 지킨다.

### 수호천사 `guardianangel` — 일반 · 화신

- 설명: 한 사람 곁에 하나씩 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/guardianangel.png` (지금은 😇)
- 프롬프트: 수호천사 — 한 사람 곁에 하나씩. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「한 사람 곁에 하나씩. 이제 네 곁은 내 자리다.」
- 전리품:
  - `guardianangel2_0` **깃털 한 장의 망토** (cloak) → `assets/items/guardianangel2_0.png`
  - `guardianangel2_1` **지켜보는 반지** (ring) → `assets/items/guardianangel2_1.png`

### 권천사 `principality` — 일반 · 화신

- 설명: 나라 하나를 맡은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/principality.png` (지금은 🛐)
- 프롬프트: 권천사 — 나라 하나를 맡은. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「나라 하나를 맡았던 손이다. 네 하나쯤은 거뜬하지.」
- 전리품:
  - `principality2_0` **나라를 맡은 관** (helm) → `assets/items/principality2_0.png`
  - `principality2_1` **홀을 찬 띠** (belt) → `assets/items/principality2_1.png`

### 라파엘의 화신 `raphael` — 정예 · 화신

- 설명: 신이 고치신다 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/raphael.png` (지금은 ⚕️)
- 프롬프트: 라파엘의 화신 — 신이 고치신다. 일곱 번째 하늘(제14격 천사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「신이 고치신다. 나는 그 손을 빌려줄 뿐이다.」
- 전리품:
  - `raphael2_0` **토비트의 물고기** (necklace) → `assets/items/raphael2_0.png`

### 능천사 `powerangel` — 일반 · 화신

- 설명: 악을 쫓는 첫 번째 칼 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/powerangel.png` (지금은 🔆)
- 프롬프트: 능천사 — 악을 쫓는 첫 번째 칼. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「악을 쫓는 첫 칼이 여기 있다. 겨눌 곳을 가리켜라.」
- 전리품:
  - `powerangel2_0` **악을 쫓는 창** (weapon) → `assets/items/powerangel2_0.png`
  - `powerangel2_1` **능천사의 견갑** (shoulder) → `assets/items/powerangel2_1.png`

### 나팔의 천사 `trumpetangel` — 일반 · 화신

- 설명: 일곱 나팔 중 첫째를 부는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/trumpetangel.png` (지금은 🎺)
- 프롬프트: 나팔의 천사 — 일곱 나팔 중 첫째를 부는. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「첫 나팔은 아직 불지 않았다. 네가 신호를 줄 때까지.」
- 전리품:
  - `trumpetangel2_0` **첫째 나팔** (offhand) → `assets/items/trumpetangel2_0.png`
  - `trumpetangel2_1` **구름 디딤 신** (boots) → `assets/items/trumpetangel2_1.png`

### 우리엘의 화신 `uriel` — 정예 · 화신

- 설명: 신의 불꽃이라는 이름의 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/uriel.png` (지금은 🔥)
- 프롬프트: 우리엘의 화신 — 신의 불꽃이라는 이름의. 일곱 번째 하늘(제14격 천사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「신의 불꽃이라는 이름이다. 어두운 곳에는 나를 들어라.」
- 전리품:
  - `uriel_0` **불꽃을 쥔 손** (gloves) → `assets/items/uriel_0.png`

### 역천사 `virtueangel` — 일반 · 화신

- 설명: 기적을 맡은 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/virtueangel.png` (지금은 ✨)
- 프롬프트: 역천사 — 기적을 맡은. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「기적은 드물어서 기적이다. 네 몫으로 한 번쯤 아껴 두마.」
- 전리품:
  - `virtueangel2_0` **기적의 팔찌** (bracelet) → `assets/items/virtueangel2_0.png`
  - `virtueangel2_1` **기적을 행하는 손** (gloves) → `assets/items/virtueangel2_1.png`

### 주천사 `dominion` — 일반 · 화신

- 설명: 천사들을 다스리는 천사 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/dominion.png` (지금은 🕊️)
- 프롬프트: 주천사 — 천사들을 다스리는 천사. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「다스리는 자들을 다스려 왔다. 네 한 몸쯤이야.」
- 전리품:
  - `dominion2_0` **다스림의 흉갑** (armor) → `assets/items/dominion2_0.png`
  - `dominion2_1` **주권의 목걸이** (necklace) → `assets/items/dominion2_1.png`

### 라구엘의 화신 `raguel` — 정예 · 화신

- 설명: 천사들의 잘못을 따지는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/raguel.png` (지금은 ⚖️)
- 프롬프트: 라구엘의 화신 — 천사들의 잘못을 따지는. 일곱 번째 하늘(제14격 천사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「천사들의 잘못도 따진다. 네 잘못은 아직 하나도 못 찾았다.」
- 전리품:
  - `raguel_0` **빛을 다스리는 팔찌** (bracelet) → `assets/items/raguel_0.png`

### 좌천사 `throneangel` — 일반 · 화신

- 설명: 눈으로 가득한 바퀴 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/throneangel.png` (지금은 🛞)
- 프롬프트: 좌천사 — 눈으로 가득한 바퀴. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「수많은 눈이 네 길을 보고 있다. 눈 돌릴 곳이 없을 거다.」
- 전리품:
  - `throneangel2_0` **바퀴 속의 바퀴** (greaves) → `assets/items/throneangel2_0.png`
  - `throneangel2_1` **눈으로 가득한 관** (helm) → `assets/items/throneangel2_1.png`

### 가브리엘의 화신 `gabriel` — 정예 · 화신

- 설명: 소식을 전하러 내려온 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/gabriel.png` (지금은 📯)
- 프롬프트: 가브리엘의 화신 — 소식을 전하러 내려온. 일곱 번째 하늘(제14격 천사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「소식을 가져왔다 — 이제 네가 소식이다.」
- 전리품:
  - `gabriel2_0` **마지막 나팔** (offhand) → `assets/items/gabriel2_0.png`

### 지품천사 `cherub` — 일반 · 화신

- 설명: 에덴의 동쪽에서 불칼을 든 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/cherub.png` (지금은 🦁)
- 프롬프트: 지품천사 — 에덴의 동쪽에서 불칼을 든. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「불칼은 에덴을 지켰다. 이제 네 앞을 지킨다.」
- 전리품:
  - `cherub2_0` **두루 도는 불칼** (weapon) → `assets/items/cherub2_0.png`
  - `cherub2_1` **네 얼굴의 견갑** (shoulder) → `assets/items/cherub2_1.png`

### 사리엘의 화신 `sariel` — 정예 · 화신

- 설명: 달의 길을 가르친 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/sariel.png` (지금은 🌗)
- 프롬프트: 사리엘의 화신 — 달의 길을 가르친. 일곱 번째 하늘(제14격 천사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「달의 길을 가르쳤다. 밤길은 내가 앞장서마.」
- 전리품:
  - `sariel_0` **달의 길을 걷는 신** (boots) → `assets/items/sariel_0.png`

### 치품천사 `seraph` — 일반 · 화신

- 설명: 여섯 날개로 얼굴을 가린 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/seraph.png` (지금은 🌞)
- 프롬프트: 치품천사 — 여섯 날개로 얼굴을 가린. 일곱 번째 하늘(제14격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「얼굴을 가린 건 눈부셔서가 아니다. 네가 부끄럽지 않게 하려는 거지.」
- 전리품:
  - `seraph2_0` **여섯 날개** (cloak) → `assets/items/seraph2_0.png`

### 레미엘의 화신 `remiel` — 정예 · 화신

- 설명: 다시 일어날 자들을 지키는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/remiel.png` (지금은 🌄)
- 프롬프트: 레미엘의 화신 — 다시 일어날 자들을 지키는. 일곱 번째 하늘(제14격 천사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「다시 일어날 자들을 지킨다. 쓰러져도 괜찮다, 내가 있으니.」
- 전리품:
  - `remiel_0` **일으켜 세우는 각반** (greaves) → `assets/items/remiel_0.png`

### 미카엘의 화신 `michael` — 보스 · 화신

- 설명: 용을 하늘에서 떨어뜨린 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/michael.png` (지금은 ⚖️)
- 프롬프트: 미카엘의 화신 — 용을 하늘에서 떨어뜨린. 일곱 번째 하늘(제14격 천사)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「용을 떨어뜨린 칼이다. 네가 겨누는 건 무엇이든 떨어지겠지.」
- 전리품:
  - `michael2_0` **용을 떨어뜨린 검** (weapon) → `assets/items/michael2_0.png`
  - `michael2_1` **천군의 갑주** (armor) → `assets/items/michael2_1.png`
  - `michael2_2` **미카엘의 저울** (special·relic) → `assets/items/michael2_2.png`


---

## 제15격 악마 — 얼어붙은 코키토스

> 지옥의 맨 밑바닥은 불이 아니라 얼음이다. 등을 돌린 자들이 거기 얼어 있다.

### 레기온 `legion` — 일반 · 화신

- 설명: 우리의 이름은 군대, 우리는 많다 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/legion.png` (지금은 👥)
- 프롬프트: 레기온 — 우리의 이름은 군대, 우리는 많다. 얼어붙은 코키토스(제15격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「우리의 이름은 군대. 이제 우리 전부가 네 이름이 된다.」
- 전리품:
  - `legion2_0` **이천 마리 돼지가죽** (armor) → `assets/items/legion2_0.png`
  - `legion2_1` **많은 이름의 반지** (ring) → `assets/items/legion2_1.png`

### 바엘의 화신 `bael` — 정예 · 화신

- 설명: 세 머리로 말하는 지옥의 첫 왕 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/bael.png` (지금은 🐸)
- 프롬프트: 바엘의 화신 — 세 머리로 말하는 지옥의 첫 왕. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「세 머리가 같은 말을 한다 — 너를 따르겠다고. 보이지 않게.」
- 전리품:
  - `bael_0` **보이지 않게 하는 손** (gloves) → `assets/items/bael_0.png`

### 몰록의 화신 `moloch` — 일반 · 화신

- 설명: 불타는 제단 위의 황소 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/moloch.png` (지금은 🐂)
- 프롬프트: 몰록의 화신 — 불타는 제단 위의 황소. 얼어붙은 코키토스(제15격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「제단은 늘 배고프다. 네가 바치는 건 승리뿐이면 좋겠군.」
- 전리품:
  - `moloch2_0` **황소 머리 투구** (helm) → `assets/items/moloch2_0.png`
  - `moloch2_1` **제단 불에 그을린 손** (gloves) → `assets/items/moloch2_1.png`

### 바포메트의 화신 `baphomet` — 일반 · 화신

- 설명: 녹이고 굳히는 염소 머리 우상 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/baphomet.png` (지금은 🐐)
- 프롬프트: 바포메트의 화신 — 녹이고 굳히는 염소 머리 우상. 얼어붙은 코키토스(제15격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「녹이고 굳히는 건 내 일이다. 네 약점도 굳혀 주지.」
- 전리품:
  - `baphomet2_0` **염소 머리 우상** (offhand) → `assets/items/baphomet2_0.png`
  - `baphomet2_1` **녹이고 굳히는 팔찌** (bracelet) → `assets/items/baphomet2_1.png`

### 아스모데우스의 화신 `asmodeus` — 정예 · 화신

- 설명: 솔로몬의 반지를 빼앗은 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/asmodeus.png` (지금은 💍)
- 프롬프트: 아스모데우스의 화신 — 솔로몬의 반지를 빼앗은. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「솔로몬의 반지도 빼앗았다. 네 앞길의 문쯤이야.」
- 전리품:
  - `asmodeus2_0` **솔로몬의 반지** (ring) → `assets/items/asmodeus2_0.png`

### 아자젤의 화신 `azazel` — 일반 · 화신

- 설명: 사람에게 칼 벼리는 법을 가르친 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/azazel.png` (지금은 ⚒️)
- 프롬프트: 아자젤의 화신 — 사람에게 칼 벼리는 법을 가르친. 얼어붙은 코키토스(제15격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「칼 벼리는 법을 알려 준 죄로 갇혔다. 네게도 가르쳐 주지, 값은 나중에.」
- 전리품:
  - `azazel2_0` **처음 벼린 칼** (weapon) → `assets/items/azazel2_0.png`
  - `azazel2_1` **감시자의 견갑** (shoulder) → `assets/items/azazel2_1.png`

### 벨레트의 화신 `beleth` — 정예 · 화신

- 설명: 나팔 소리 속에 창백한 말을 타고 오는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/beleth.png` (지금은 🎺)
- 프롬프트: 벨레트의 화신 — 나팔 소리 속에 창백한 말을 타고 오는. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「나팔 소리가 들리면 내가 온 거다. 놀라지 마라, 네 편이다.」
- 전리품:
  - `beleth_0` **창백한 말의 박차** (boots) → `assets/items/beleth_0.png`

### 벨제부브의 화신 `beelzebub` — 정예 · 화신

- 설명: 파리 떼의 왕 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/beelzebub.png` (지금은 🪰)
- 프롬프트: 벨제부브의 화신 — 파리 떼의 왕. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「파리 떼가 네 앞길을 먼저 훑어 줄 거다.」
- 전리품:
  - `beelzebub2_0` **파리 떼의 관** (helm) → `assets/items/beelzebub2_0.png`
  - `beelzebub2_1` **파리 날개 갑의** (armor) → `assets/items/beelzebub2_1.png`

### 메피스토펠레스의 화신 `mephisto` — 일반 · 화신

- 설명: 영혼을 값으로 쳐주는 상인 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/mephisto.png` (지금은 🎩)
- 프롬프트: 메피스토펠레스의 화신 — 영혼을 값으로 쳐주는 상인. 얼어붙은 코키토스(제15격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「영혼은 값으로 쳐주마. 네 건 아직 받지 않았으니 안심해라.」
- 전리품:
  - `mephisto2_0` **피로 쓴 계약서** (necklace) → `assets/items/mephisto2_0.png`
  - `mephisto2_1` **진홍 외투** (cloak) → `assets/items/mephisto2_1.png`

### 파이몬의 화신 `paimon` — 정예 · 화신

- 설명: 서쪽을 다스리는 지옥의 왕 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/paimon.png` (지금은 🐪)
- 프롬프트: 파이몬의 화신 — 서쪽을 다스리는 지옥의 왕. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「서쪽 끝까지 다스렸다. 길을 물으면 대답해 주마.」
- 전리품:
  - `paimon2_0` **모든 학문의 책** (offhand) → `assets/items/paimon2_0.png`

### 아스타로트의 화신 `astaroth` — 일반 · 화신

- 설명: 독사를 타고 오는 공작 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/astaroth.png` (지금은 🦎)
- 프롬프트: 아스타로트의 화신 — 독사를 타고 오는 공작. 얼어붙은 코키토스(제15격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「독사를 타고 왔다. 물리는 쪽은 늘 네 적이 되겠지.」
- 전리품:
  - `astaroth2_0` **독사를 탄 신** (boots) → `assets/items/astaroth2_0.png`
  - `astaroth2_1` **독사 허리띠** (belt) → `assets/items/astaroth2_1.png`

### 푸르손의 화신 `purson` — 정예 · 화신

- 설명: 사자 얼굴로 곰을 타고 오는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/purson.png` (지금은 🐻)
- 프롬프트: 푸르손의 화신 — 사자 얼굴로 곰을 타고 오는. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「숨겨진 것은 내 눈에 다 보인다. 네 앞길의 덫도.」
- 전리품:
  - `purson_0` **곰을 탄 왕의 견갑** (shoulder) → `assets/items/purson_0.png`

### 벨리알의 화신 `belial` — 정예 · 화신

- 설명: 불의 전차를 탄 무가치한 자 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/belial.png` (지금은 🕯️)
- 프롬프트: 벨리알의 화신 — 불의 전차를 탄 무가치한 자. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「무가치한 자라 불렸다. 그래서 자유롭다. 너도 그 편이 편할걸.」
- 전리품:
  - `belial2_0` **불의 전차 각반** (greaves) → `assets/items/belial2_0.png`

### 릴리스의 화신 `lilith` — 일반 · 화신

- 설명: 에덴을 먼저 떠난 자 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/lilith.png` (지금은 🌒)
- 프롬프트: 릴리스의 화신 — 에덴을 먼저 떠난 자. 얼어붙은 코키토스(제15격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「먼저 떠난 자가 길을 안다. 따라와라, 뒤돌아보지 말고.」
- 전리품:
  - `lilith2_0` **첫 아내의 팔찌** (bracelet) → `assets/items/lilith2_0.png`

### 바인의 화신 `vine` — 정예 · 화신

- 설명: 폭풍을 부르고 탑을 허무는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/vine.png` (지금은 🌩️)
- 프롬프트: 바인의 화신 — 폭풍을 부르고 탑을 허무는. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「폭풍을 부르고 탑을 허문다. 네 앞을 막는 벽이라면 무엇이든.」
- 전리품:
  - `vine_0` **탑을 허무는 각반** (greaves) → `assets/items/vine_0.png`

### 발람의 화신 `balam` — 정예 · 화신

- 설명: 세 머리로 지나간 일과 올 일을 말하는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/balam.png` (지금은 🐃)
- 프롬프트: 발람의 화신 — 세 머리로 지나간 일과 올 일을 말하는. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「지나간 일과 올 일을 다 안다. 네 쪽이 이긴다는 것도.」
- 전리품:
  - `balam_0` **앞일을 말하는 목걸이** (necklace) → `assets/items/balam_0.png`

### 자간의 화신 `zagan` — 정예 · 화신

- 설명: 쇠를 금화로, 물을 포도주로 바꾸는 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/zagan.png` (지금은 🍷)
- 프롬프트: 자간의 화신 — 쇠를 금화로, 물을 포도주로 바꾸는. 얼어붙은 코키토스(제15격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「쇠를 금화로 바꿔 주지. 네 주머니가 무거워질 거다.」
- 전리품:
  - `zagan_0` **쇠를 금화로 바꾸는 띠** (belt) → `assets/items/zagan_0.png`

### 루시퍼의 화신 `lucifer` — 보스 · 화신

- 설명: 가장 빛나던 별, 가장 깊이 떨어진 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/lucifer.png` (지금은 🌠)
- 프롬프트: 루시퍼의 화신 — 가장 빛나던 별, 가장 깊이 떨어진. 얼어붙은 코키토스(제15격 악마)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「가장 높이 있었기에 가장 깊이 떨어졌다. 너는 떨어지지 마라.」
- 전리품:
  - `lucifer2_0` **새벽별의 검** (weapon) → `assets/items/lucifer2_0.png`
  - `lucifer2_1` **빛을 잃은 여섯 날개** (cloak) → `assets/items/lucifer2_1.png`
  - `lucifer2_2` **새벽별 조각** (special·relic) → `assets/items/lucifer2_2.png`


---

## 제16격 신격 — 이그드라실의 가지

> 아홉 세계가 이 나무 하나에 매달려 있다. 어느 신화든 여기서 만난다.

### 바스테트의 화신 `bastet` — 일반 · 화신

- 설명: 집과 전쟁을 함께 지키는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/bastet.png` (지금은 🐈)
- 프롬프트: 바스테트의 화신 — 집과 전쟁을 함께 지키는. 이그드라실의 가지(제16격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「집도 전쟁도 지킨다. 어느 쪽이 필요하냐.」
- 전리품:
  - `bastet2_0` **고양이의 눈** (ring) → `assets/items/bastet2_0.png`
  - `bastet2_1` **소리 없는 각반** (greaves) → `assets/items/bastet2_1.png`

### 헤라의 화신 `hera` — 정예 · 화신

- 설명: 신들의 여왕 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/hera.png` (지금은 👸)
- 프롬프트: 헤라의 화신 — 신들의 여왕. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「신들의 여왕이다. 내 질투는 이제 네 적을 향한다.」
- 전리품:
  - `hera_0` **공작 깃 견갑** (shoulder) → `assets/items/hera_0.png`

### 아누비스의 화신 `anubis` — 일반 · 화신

- 설명: 심장의 무게를 재는 자 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/anubis.png` (지금은 🐺)
- 프롬프트: 아누비스의 화신 — 심장의 무게를 재는 자. 이그드라실의 가지(제16격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「심장을 달아 보았다. 네 쪽이 더 가볍더군. 좋은 뜻이다.」
- 전리품:
  - `anubis2_0` **방부사의 어깨띠** (shoulder) → `assets/items/anubis2_0.png`
  - `anubis2_1` **재칼의 가면** (helm) → `assets/items/anubis2_1.png`

### 헤르메스의 화신 `hermes` — 정예 · 화신

- 설명: 경계를 넘나드는 전령 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/hermes.png` (지금은 🪽)
- 프롬프트: 헤르메스의 화신 — 경계를 넘나드는 전령. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「경계를 넘나드는 게 내 일이다. 너를 건너편까지 배달해 주지.」
- 전리품:
  - `hermes2_0` **전령의 날개** (special·relic) → `assets/items/hermes2_0.png`

### 스사노오의 화신 `susanoo` — 일반 · 화신

- 설명: 쫓겨나서 영웅이 된 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/susanoo.png` (지금은 🌪️)
- 프롬프트: 스사노오의 화신 — 쫓겨나서 영웅이 된. 이그드라실의 가지(제16격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「쫓겨나서 영웅이 됐다. 쫓겨나는 것도 나쁘지 않다.」
- 전리품:
  - `susanoo2_0` **폭풍의 겉옷** (cloak) → `assets/items/susanoo2_0.png`
  - `susanoo2_1` **폭풍 팔찌** (bracelet) → `assets/items/susanoo2_1.png`

### 아테나의 화신 `athena` — 정예 · 화신

- 설명: 지혜와 싸움을 함께 쥔 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/athena.png` (지금은 🦉)
- 프롬프트: 아테나의 화신 — 지혜와 싸움을 함께 쥔. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「지혜 없는 힘은 넘어지고, 힘 없는 지혜는 갇힌다. 둘 다 주마.」
- 전리품:
  - `athena_0` **고르곤의 머리를 단 방패** (offhand) → `assets/items/athena_0.png`

### 포세이돈의 화신 `poseidon` — 정예 · 화신

- 설명: 땅을 흔드는 자 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/poseidon.png` (지금은 🌊)
- 프롬프트: 포세이돈의 화신 — 땅을 흔드는 자. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「땅이 흔들리면 내가 움직이는 거다. 파도도 네 편이다.」
- 전리품:
  - `poseidon2_0` **삼지창** (weapon) → `assets/items/poseidon2_0.png`

### 아폴론의 화신 `apollo` — 정예 · 화신

- 설명: 빛과 음악과 활의 신 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/apollo.png` (지금은 🎼)
- 프롬프트: 아폴론의 화신 — 빛과 음악과 활의 신. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「활을 쏘면 빗나가지 않고, 노래하면 상처가 아문다. 둘 중 무얼 원하나.」
- 전리품:
  - `apollo_0` **리라를 켜는 손** (gloves) → `assets/items/apollo_0.png`

### 토르의 화신 `thor` — 일반 · 화신

- 설명: 천둥을 손에 쥔 자 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/thor.png` (지금은 ⚡)
- 프롬프트: 토르의 화신 — 천둥을 손에 쥔 자. 이그드라실의 가지(제16격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「천둥은 부르는 것이 아니라 쥐는 것이다. 자, 잡아라.」
- 전리품:
  - `thor2_0` **묠니르** (weapon) → `assets/items/thor2_0.png`
  - `thor2_1` **메긴교르드의 고리** (special·gem) → `assets/items/thor2_1.png`

### 아르테미스의 화신 `artemis` — 정예 · 화신

- 설명: 달과 사냥의 주인 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/artemis.png` (지금은 🌙)
- 프롬프트: 아르테미스의 화신 — 달과 사냥의 주인. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「달이 뜨면 사냥을 시작한다. 쫓을 것을 가리켜라.」
- 전리품:
  - `artemis2_0` **사슴가죽 신** (boots) → `assets/items/artemis2_0.png`

### 아프로디테의 화신 `aphrodite` — 정예 · 화신

- 설명: 바다 거품에서 태어난 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/aphrodite.png` (지금은 🐚)
- 프롬프트: 아프로디테의 화신 — 바다 거품에서 태어난. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「아름다움도 무기다. 네 적이 칼을 내리게 해 주지.」
- 전리품:
  - `aphrodite_0` **케스토스** (belt) → `assets/items/aphrodite_0.png`

### 아마테라스의 화신 `amaterasu` — 일반 · 화신

- 설명: 동굴에서 나온 해 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/amaterasu.png` (지금은 🌅)
- 프롬프트: 아마테라스의 화신 — 동굴에서 나온 해. 이그드라실의 가지(제16격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「동굴에서 나온 해다. 네 앞이 어두우면 나를 불러라.」
- 전리품:
  - `amaterasu2_0` **하늘 옷** (cloak) → `assets/items/amaterasu2_0.png`
  - `amaterasu2_1` **야사카니의 곡옥** (ring) → `assets/items/amaterasu2_1.png`

### 로키의 화신 `loki` — 정예 · 화신

- 설명: 묶여서도 웃는 자 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/loki.png` (지금은 🦊)
- 프롬프트: 로키의 화신 — 묶여서도 웃는 자. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「묶여서도 웃었지. 웃을 일이 하나 늘었군, 네 덕에.」
- 전리품:
  - `loki2_0` **거짓의 단검** (offhand) → `assets/items/loki2_0.png`
  - `loki2_1` **뒤바뀐 반지** (bracelet) → `assets/items/loki2_1.png`

### 헤파이스토스의 화신 `hephaestus` — 정예 · 화신

- 설명: 올림포스의 대장장이 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/hephaestus.png` (지금은 ⚒️)
- 프롬프트: 헤파이스토스의 화신 — 올림포스의 대장장이. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「신들의 무기는 다 내가 벼렸다. 네 것도 다시 벼려 주마.」
- 전리품:
  - `hephaestus_0` **불에 그을린 대장장이 손** (gloves) → `assets/items/hephaestus_0.png`

### 아레스의 화신 `ares` — 정예 · 화신

- 설명: 전쟁 그 자체 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/ares.png` (지금은 ⚔️)
- 프롬프트: 아레스의 화신 — 전쟁 그 자체. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「전쟁 그 자체다. 싸우고 싶을 때 내 이름을 불러라.」
- 전리품:
  - `ares2_0` **전화(戰禍)의 갑주** (armor) → `assets/items/ares2_0.png`

### 이시스의 화신 `isis` — 일반 · 화신

- 설명: 흩어진 것을 다시 모으는 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/isis.png` (지금은 🪬)
- 프롬프트: 이시스의 화신 — 흩어진 것을 다시 모으는. 이그드라실의 가지(제16격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「흩어진 것은 다시 모으면 된다. 네가 흩어져도 마찬가지다.」
- 전리품:
  - `isis2_0` **앙크** (necklace) → `assets/items/isis2_0.png`

### 데메테르의 화신 `demeter` — 정예 · 화신

- 설명: 곡식과 대지의 어머니 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/demeter.png` (지금은 🌾)
- 프롬프트: 데메테르의 화신 — 곡식과 대지의 어머니. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「씨를 뿌리면 거둔다. 네가 뿌린 만큼 거두게 해 주지.」
- 전리품:
  - `demeter_0` **보리 이삭을 엮은 각반** (greaves) → `assets/items/demeter_0.png`

### 디오니소스의 화신 `dionysus` — 정예 · 화신

- 설명: 포도주와 광기의 신 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/dionysus.png` (지금은 🍇)
- 프롬프트: 디오니소스의 화신 — 포도주와 광기의 신. 이그드라실의 가지(제16격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「취하면 두려움이 사라진다. 한 잔 받아라.」
- 전리품:
  - `dionysus_0` **표범 가죽 옷** (armor) → `assets/items/dionysus_0.png`

### 하데스의 화신 `hades` — 보스 · 화신

- 설명: 돌아온 자가 없는 문의 주인 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/hades.png` (지금은 💀)
- 프롬프트: 하데스의 화신 — 돌아온 자가 없는 문의 주인. 이그드라실의 가지(제16격 신격)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「돌아온 자가 없는 문이다. 네가 첫 번째가 되겠군.」
- 전리품:
  - `hades2_0` **명계의 이지창** (weapon) → `assets/items/hades2_0.png`
  - `hades2_1` **보이지 않게 하는 투구** (helm) → `assets/items/hades2_1.png`
  - `hades2_2` **케르베로스의 사슬** (necklace) → `assets/items/hades2_2.png`


---

## 제17격 태초 — 태초의 바다

> 신들이 처음으로 칼을 뽑은 곳. 여기서 진 것들의 몸으로 땅과 하늘이 지어졌다.

### 타이탄 `titanmyth` — 일반 · 화신

- 설명: 신에게 진 자들 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/titanmyth.png` (지금은 🗿)
- 프롬프트: 타이탄 — 신에게 진 자들. 태초의 바다(제17격 태초)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「신에게 졌다. 그래도 아직 일어서 있다. 너와 함께라면 더 높이도.」
- 전리품:
  - `titanmyth2_0` **산을 깎은 방패** (offhand) → `assets/items/titanmyth2_0.png`
  - `titanmyth2_1` **거인의 각반** (greaves) → `assets/items/titanmyth2_1.png`

### 베히모스 `behemoth` — 정예 · 화신

- 설명: 땅을 통째로 눌러앉은 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/behemoth.png` (지금은 🦏)
- 프롬프트: 베히모스 — 땅을 통째로 눌러앉은. 태초의 바다(제17격 태초)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「땅을 통째로 눌러앉았었다. 이제 너를 위해 일어서마.」
- 전리품:
  - `behemoth2_0` **대지의 각반** (greaves) → `assets/items/behemoth2_0.png`

### 요르문간드 `jormungandr` — 일반 · 화신

- 설명: 세계를 한 바퀴 감고 제 꼬리를 문 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/jormungandr.png` (지금은 🐍)
- 프롬프트: 요르문간드 — 세계를 한 바퀴 감고 제 꼬리를 문. 태초의 바다(제17격 태초)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「세계를 한 바퀴 감고 있었다. 이제 너를 감싸 주마.」
- 전리품:
  - `jormungandr_0` **세계를 감은 비늘 띠** (belt) → `assets/items/jormungandr_0.png`
  - `jormungandr_1` **제 꼬리를 문 고리** (ring) → `assets/items/jormungandr_1.png`

### 펜리르 `fenrir` — 일반 · 화신

- 설명: 끊어지지 않는 끈에 묶여 때를 기다리는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/fenrir.png` (지금은 🐺)
- 프롬프트: 펜리르 — 끊어지지 않는 끈에 묶여 때를 기다리는. 태초의 바다(제17격 태초)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「끊어지지 않는 끈도 언젠가는 끊어진다. 그날 나는 네 편에 서겠다.」
- 전리품:
  - `fenrir_0` **신을 삼킬 송곳니** (weapon) → `assets/items/fenrir_0.png`
  - `fenrir_1` **글레이프니르 족쇄** (bracelet) → `assets/items/fenrir_1.png`

### 리바이어던 `leviathan` — 정예 · 화신

- 설명: 바다를 통째로 삼킨 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/leviathan.png` (지금은 🐋)
- 프롬프트: 리바이어던 — 바다를 통째로 삼킨. 태초의 바다(제17격 태초)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「바다를 통째로 삼켰다. 네 앞의 바다쯤은 갈라 주지.」
- 전리품:
  - `leviathan2_0` **해일의 지느러미** (shoulder) → `assets/items/leviathan2_0.png`

### 아포피스 `apophis` — 일반 · 화신

- 설명: 밤마다 해를 삼키려는 뱀 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/apophis.png` (지금은 🌑)
- 프롬프트: 아포피스 — 밤마다 해를 삼키려는 뱀. 태초의 바다(제17격 태초)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「밤마다 해를 삼키려 했다. 너의 해만은 남겨 두마.」
- 전리품:
  - `apophis_0` **해를 가리는 비늘 망토** (cloak) → `assets/items/apophis_0.png`
  - `apophis_1` **밤을 삼키는 뱀 머리** (helm) → `assets/items/apophis_1.png`

### 티폰 `typhon` — 정예 · 화신

- 설명: 괴물들의 아버지 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/typhon.png` (지금은 🌋)
- 프롬프트: 티폰 — 괴물들의 아버지. 태초의 바다(제17격 태초)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「신들도 짐승 꼴로 달아났었다. 네 적도 그렇게 해 주마.」
- 전리품:
  - `typhon_0` **백 개의 뱀 머리 투구** (helm) → `assets/items/typhon_0.png`
  - `typhon_1` **제우스의 힘줄을 끊은 손** (gloves) → `assets/items/typhon_1.png`

### 브리트라 `vritra` — 일반 · 화신

- 설명: 세상의 물을 가둔 용 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/vritra.png` (지금은 🐊)
- 프롬프트: 브리트라 — 세상의 물을 가둔 용. 태초의 바다(제17격 태초)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「세상의 물을 가두었었다. 목마를 때 나를 불러라.」
- 전리품:
  - `vritra_0` **물을 가둔 비늘** (armor) → `assets/items/vritra_0.png`
  - `vritra_1` **강을 막은 발톱** (gloves) → `assets/items/vritra_1.png`

### 지즈 `ziz` — 정예 · 화신

- 설명: 하늘을 가리는 날개 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/ziz.png` (지금은 🕊️)
- 프롬프트: 지즈 — 하늘을 가리는 날개. 태초의 바다(제17격 태초)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「날개를 펴면 하늘이 가려진다. 네 머리 위는 늘 그늘이 질 거다.」
- 전리품:
  - `ziz2_0` **하늘 덮는 신** (boots) → `assets/items/ziz2_0.png`

### 야마타노오로치 `orochi` — 일반 · 화신

- 설명: 여덟 골짜기를 덮은 여덟 머리 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/orochi.png` (지금은 🐉)
- 프롬프트: 야마타노오로치 — 여덟 골짜기를 덮은 여덟 머리. 태초의 바다(제17격 태초)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「여덟 머리 중 하나쯤은 늘 깨어 있다. 네 잠을 지켜 주지.」
- 전리품:
  - `orochi_0` **꼬리에서 나온 구사나기** (weapon) → `assets/items/orochi_0.png`

### 이미르 `ymir` — 정예 · 화신

- 설명: 주검으로 세계가 지어진 거인 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/ymir.png` (지금은 ❄️)
- 프롬프트: 이미르 — 주검으로 세계가 지어진 거인. 태초의 바다(제17격 태초)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「내 주검으로 세계가 지어졌다. 너는 그 위를 걷고 있는 거다.」
- 전리품:
  - `ymir_0` **산맥이 된 어깨** (shoulder) → `assets/items/ymir_0.png`
  - `ymir_1` **서리 거인의 심장** (necklace) → `assets/items/ymir_1.png`

### 티아마트의 화신 `tiamat` — 보스 · 화신

- 설명: 신들을 낳고 신들에게 갈라진 바다 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/tiamat.png` (지금은 🌊)
- 프롬프트: 티아마트의 화신 — 신들을 낳고 신들에게 갈라진 바다. 태초의 바다(제17격 태초)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「신들을 낳았고 신들에게 갈라졌다. 너는 나를 가르지 않았군. 좋다.」
- 전리품:
  - `tiamat_0` **갈라진 바다의 갑주** (armor) → `assets/items/tiamat_0.png`
  - `tiamat_1` **운명의 서판** (necklace) → `assets/items/tiamat_1.png`
  - `tiamat_2` **열한 괴물의 팔찌** (bracelet) → `assets/items/tiamat_2.png`


---

## 제18격 주신 — 올림포스 정상

> 어느 신화의 주신이든, 결국 정상에서는 마주치게 된다.

### 오시리스의 화신 `osiris` — 일반 · 화신

- 설명: 찢겨서도 다시 맞춰진 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/osiris.png` (지금은 🏺)
- 프롬프트: 오시리스의 화신 — 찢겨서도 다시 맞춰진. 올림포스 정상(제18격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「찢겨서도 다시 맞춰졌다. 너도 그렇게 해라.」
- 전리품:
  - `osiris2_0` **갈고리 홀** (offhand) → `assets/items/osiris2_0.png`
  - `osiris2_1` **아마포 허리띠** (belt) → `assets/items/osiris2_1.png`

### 브라흐마의 화신 `brahma` — 정예 · 화신

- 설명: 네 얼굴로 세계를 지은 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/brahma.png` (지금은 🌺)
- 프롬프트: 브라흐마의 화신 — 네 얼굴로 세계를 지은. 올림포스 정상(제18격 주신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「네 얼굴로 세계를 지었다. 다섯째 얼굴은 너를 보는 데 쓰마.」
- 전리품:
  - `brahma_0` **네 팔의 장갑** (gloves) → `assets/items/brahma_0.png`

### 이자나기의 화신 `izanagi` — 일반 · 화신

- 설명: 황천에서 돌아온 자 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/izanagi.png` (지금은 🗾)
- 프롬프트: 이자나기의 화신 — 황천에서 돌아온 자. 올림포스 정상(제18격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「황천에서 돌아왔다. 돌아오는 길은 내가 제일 잘 안다.」
- 전리품:
  - `izanagi2_0` **황천의 견갑** (shoulder) → `assets/items/izanagi2_0.png`
  - `izanagi2_1` **황천의 복숭아** (special·relic) → `assets/items/izanagi2_1.png`

### 라의 화신 `ra` — 일반 · 화신

- 설명: 매일 세계를 다시 켜는 자 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/ra.png` (지금은 ☀️)
- 프롬프트: 라의 화신 — 매일 세계를 다시 켜는 자. 올림포스 정상(제18격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「매일 세계를 다시 켠다. 네 하루도 내가 켜 주마.」
- 전리품:
  - `ra2_0` **황금 태양원반** (armor) → `assets/items/ra2_0.png`
  - `ra2_1` **우라에우스의 뱀** (ring) → `assets/items/ra2_1.png`

### 비슈누의 화신 `vishnu` — 정예 · 화신

- 설명: 열 번 세상에 내려온 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/vishnu.png` (지금은 🪷)
- 프롬프트: 비슈누의 화신 — 열 번 세상에 내려온. 올림포스 정상(제18격 주신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「열 번 내려왔다. 열한 번째는 네 곁으로 간다.」
- 전리품:
  - `vishnu2_0` **수다르샤나 원반** (offhand) → `assets/items/vishnu2_0.png`

### 인드라의 화신 `indra` — 정예 · 화신

- 설명: 천 개의 눈으로 보는 자 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/indra.png` (지금은 🐘)
- 프롬프트: 인드라의 화신 — 천 개의 눈으로 보는 자. 올림포스 정상(제18격 주신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「천 개의 눈으로 보고 있다. 네 등 뒤는 걱정 마라.」
- 전리품:
  - `indra2_0` **금강저 바즈라** (weapon) → `assets/items/indra2_0.png`
  - `indra2_1` **천 개의 눈** (helm) → `assets/items/indra2_1.png`

### 환인의 화신 `hwanin` — 일반 · 화신

- 설명: 하늘에서 내려다본 자 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/hwanin.png` (지금은 🏔️)
- 프롬프트: 환인의 화신 — 하늘에서 내려다본 자. 올림포스 정상(제18격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「하늘에서 내려다보았다. 네 걸음은 곧게 가더군.」
- 전리품:
  - `hwanin2_0` **천부인의 관** (helm) → `assets/items/hwanin2_0.png`
  - `hwanin2_1` **신단수의 가지** (necklace) → `assets/items/hwanin2_1.png`

### 시바의 화신 `shiva` — 정예 · 화신

- 설명: 춤 한 번에 세계를 끝내는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/shiva.png` (지금은 🕉️)
- 프롬프트: 시바의 화신 — 춤 한 번에 세계를 끝내는. 올림포스 정상(제18격 주신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「춤 한 번으로 세계를 끝낼 수 있지. 네게는 한 박자만 빌려주마.」
- 전리품:
  - `shiva2_0` **시바의 셋째 눈** (special·relic) → `assets/items/shiva2_0.png`

### 옥황상제의 화신 `jadeemperor` — 일반 · 화신

- 설명: 하늘 관청의 주인 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/jadeemperor.png` (지금은 🐲)
- 프롬프트: 옥황상제의 화신 — 하늘 관청의 주인. 올림포스 정상(제18격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「하늘 관청의 도장을 찍어 주마. 이제 네 일은 공식이다.」
- 전리품:
  - `jadeemperor2_0` **자미원의 곤룡포** (cloak) → `assets/items/jadeemperor2_0.png`
  - `jadeemperor2_1` **옥새** (ring) → `assets/items/jadeemperor2_1.png`

### 오딘의 화신 `odin` — 정예 · 화신

- 설명: 한쪽 눈으로 모든 것을 본 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/odin.png` (지금은 🦅)
- 프롬프트: 오딘의 화신 — 한쪽 눈으로 모든 것을 본. 올림포스 정상(제18격 주신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「한쪽 눈은 이미 내주었다. 나머지 한쪽으로 너를 지켜보마.」
- 전리품:
  - `odin2_0` **빗나가지 않는 창 궁니르** (weapon) → `assets/items/odin2_0.png`
  - `odin2_1` **회색 나그네의 망토** (cloak) → `assets/items/odin2_1.png`

### 케찰코아틀의 화신 `quetzalcoatl` — 일반 · 화신

- 설명: 깃털 달린 뱀 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/quetzalcoatl.png` (지금은 🐍)
- 프롬프트: 케찰코아틀의 화신 — 깃털 달린 뱀. 올림포스 정상(제18격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「깃털 달린 뱀이 하늘을 난다. 올라타라.」
- 전리품:
  - `quetzalcoatl2_0` **창공을 딛는 신** (boots) → `assets/items/quetzalcoatl2_0.png`
  - `quetzalcoatl2_1` **깃털 각반** (greaves) → `assets/items/quetzalcoatl2_1.png`

### 아후라 마즈다의 화신 `ahuramazda` — 일반 · 화신

- 설명: 꺼지지 않는 불 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/ahuramazda.png` (지금은 🔥)
- 프롬프트: 아후라 마즈다의 화신 — 꺼지지 않는 불. 올림포스 정상(제18격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「꺼지지 않는 불이다. 어두운 길에는 이걸 들어라.」
- 전리품:
  - `ahuramazda2_0` **진리의 고리** (bracelet) → `assets/items/ahuramazda2_0.png`

### 제우스의 화신 `zeus` — 보스 · 화신

- 설명: 올림포스의 마지막 말 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/zeus.png` (지금은 ⛈️)
- 프롬프트: 제우스의 화신 — 올림포스의 마지막 말. 올림포스 정상(제18격 주신)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「올림포스의 마지막 말은 내가 한다. 네 이름을 불러 주마.」
- 전리품:
  - `zeus2_0` **케라우노스** (weapon) → `assets/items/zeus2_0.png`
  - `zeus2_1` **아이기스** (offhand) → `assets/items/zeus2_1.png`
  - `zeus2_2` **올림포스의 인장** (necklace) → `assets/items/zeus2_2.png`


---

## 제19격 고신 — 가라앉은 르뤼에

> 별이 제자리에 올 때까지 이 도시는 물 밑에서 꿈을 꾼다.

### 이그의 화신 `yig` — 일반 · 화신

- 설명: 뱀들의 아버지 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/yig.png` (지금은 🐍)
- 프롬프트: 이그의 화신 — 뱀들의 아버지. 가라앉은 르뤼에(제19격 고신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「뱀들이 너를 알아본다. 물릴 일은 없을 거다.」
- 전리품:
  - `yig2_0` **방울뱀 허리띠** (belt) → `assets/items/yig2_0.png`
  - `yig2_1` **저주의 고리** (ring) → `assets/items/yig2_1.png`

### 다곤의 화신 `dagon` — 정예 · 화신

- 설명: 깊은 곳의 아버지 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/dagon.png` (지금은 🐟)
- 프롬프트: 다곤의 화신 — 깊은 곳의 아버지. 가라앉은 르뤼에(제19격 고신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「깊은 곳에서 올라왔다. 숨이 차면 내 쪽으로 오너라.」
- 전리품:
  - `dagon2_0` **물갈퀴 장갑** (gloves) → `assets/items/dagon2_0.png`

### 이타콰의 화신 `ithaqua` — 일반 · 화신

- 설명: 바람을 타고 걷는 자 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/ithaqua.png` (지금은 ❄️)
- 프롬프트: 이타콰의 화신 — 바람을 타고 걷는 자. 가라앉은 르뤼에(제19격 고신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「바람을 타고 걷는다. 발자국은 남기지 마라, 쫓아오니까.」
- 전리품:
  - `ithaqua2_0` **눈을 밟지 않는 신** (boots) → `assets/items/ithaqua2_0.png`
  - `ithaqua2_1` **바람의 망토** (cloak) → `assets/items/ithaqua2_1.png`

### 차우그나르 파우근의 화신 `chaugnar` — 일반 · 화신

- 설명: 피를 빠는 코끼리 신 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/chaugnar.png` (지금은 🦣)
- 프롬프트: 차우그나르 파우근의 화신 — 피를 빠는 코끼리 신. 가라앉은 르뤼에(제19격 고신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「피에 굶주렸지만 오늘은 참아 주마. …오늘만.」
- 전리품:
  - `chaugnar2_0` **상아 어깨뼈** (shoulder) → `assets/items/chaugnar2_0.png`
  - `chaugnar2_1` **상아 팔찌** (bracelet) → `assets/items/chaugnar2_1.png`

### 하스터의 화신 `hastur` — 정예 · 화신

- 설명: 세 번 부르면 오는 황의 왕 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/hastur.png` (지금은 👑)
- 프롬프트: 하스터의 화신 — 세 번 부르면 오는 황의 왕. 가라앉은 르뤼에(제19격 고신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「세 번 불러서 왔다. 네 번째는 부르지 마라.」
- 전리품:
  - `hastur2_0` **누더기 황의** (cloak) → `assets/items/hastur2_0.png`

### 글라아키의 화신 `glaaki` — 일반 · 화신

- 설명: 가시로 꿈을 꿰는 자 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/glaaki.png` (지금은 🪲)
- 프롬프트: 글라아키의 화신 — 가시로 꿈을 꿰는 자. 가라앉은 르뤼에(제19격 고신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「가시로 꿈을 꿰었다. 네 악몽쯤은 한 땀이면 된다.」
- 전리품:
  - `glaaki2_0` **녹슨 관** (helm) → `assets/items/glaaki2_0.png`
  - `glaaki2_1` **호수 바닥의 각반** (greaves) → `assets/items/glaaki2_1.png`

### 쇼고스 `shoggoth` — 일반 · 화신

- 설명: 주인을 삼키고 남은 원형질 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/shoggoth.png` (지금은 🦠)
- 프롬프트: 쇼고스 — 주인을 삼키고 남은 원형질. 가라앉은 르뤼에(제19격 고신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「테켈리-리. …주인을 삼킨 뒤로 처음 섬기는 자다.」
- 전리품:
  - `shoggoth_0` **형체 없는 원형질 갑옷** (armor) → `assets/items/shoggoth_0.png`
  - `shoggoth_1` **테켈리리 하고 우는 손** (gloves) → `assets/items/shoggoth_1.png`

### 크투가의 화신 `cthugha` — 정예 · 화신

- 설명: 포말하우트에서 타오르는 불 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/cthugha.png` (지금은 🔥)
- 프롬프트: 크투가의 화신 — 포말하우트에서 타오르는 불. 가라앉은 르뤼에(제19격 고신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「포말하우트에서 탄다. 꺼지지 않는 불이 필요하면 불러라.」
- 전리품:
  - `cthugha_0` **포말하우트의 불꽃** (weapon) → `assets/items/cthugha_0.png`

### 미-고 `migo` — 일반 · 화신

- 설명: 유고스에서 날아온 균류 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/migo.png` (지금은 🍄)
- 프롬프트: 미-고 — 유고스에서 날아온 균류. 가라앉은 르뤼에(제19격 고신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「유고스에서 왔다. 네 머릿속이 궁금하지만 참겠다.」
- 전리품:
  - `migo_0` **뇌를 담은 원통** (offhand) → `assets/items/migo_0.png`

### 츠아토구아의 화신 `tsathoggua` — 정예 · 화신

- 설명: 움직이기 싫어하는 두꺼비 신 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/tsathoggua.png` (지금은 🦥)
- 프롬프트: 츠아토구아의 화신 — 움직이기 싫어하는 두꺼비 신. 가라앉은 르뤼에(제19격 고신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「움직이기 싫다. 그러니 네가 대신 움직여라. 내 몫까지.」
- 전리품:
  - `tsathoggua2_0` **잠의 팔찌** (bracelet) → `assets/items/tsathoggua2_0.png`

### 아틀락-나챠의 화신 `atlachnacha` — 일반 · 화신

- 설명: 다 짜면 세상이 끝나는 거미줄을 치는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/atlachnacha.png` (지금은 🕸️)
- 프롬프트: 아틀락-나챠의 화신 — 다 짜면 세상이 끝나는 거미줄을 치는. 가라앉은 르뤼에(제19격 고신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「거미줄을 다 짜면 세상이 끝난다. 네가 있는 동안은 천천히 짜마.」
- 전리품:
  - `atlachnacha_0` **거미줄에 걸린 꿈** (necklace) → `assets/items/atlachnacha_0.png`
  - `atlachnacha_1` **심연에 걸친 실** (belt) → `assets/items/atlachnacha_1.png`

### 크툴루의 화신 `cthulhu` — 보스 · 화신

- 설명: 죽지 않고 잠들어 있을 뿐인 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/cthulhu.png` (지금은 🐙)
- 프롬프트: 크툴루의 화신 — 죽지 않고 잠들어 있을 뿐인. 가라앉은 르뤼에(제19격 고신)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「죽은 게 아니라 자는 거다. 네가 깨워 주는 날까지.」
- 전리품:
  - `cthulhu2_0` **르뤼에의 촉수** (weapon) → `assets/items/cthulhu2_0.png`
  - `cthulhu2_1` **심해의 갑각** (armor) → `assets/items/cthulhu2_1.png`
  - `cthulhu2_2` **잠든 신의 우상** (special·relic) → `assets/items/cthulhu2_2.png`


---

## 제20격 외신 — 궁극의 혼돈

> 여기엔 위도 아래도 없다. 신화도 없다. 신화는 인간의 것이니까.

### 슈브니구라스의 화신 `shubniggurath` — 일반 · 화신

- 설명: 천 마리 새끼를 거느린 검은 염소 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/shubniggurath.png` (지금은 🐐)
- 프롬프트: 슈브니구라스의 화신 — 천 마리 새끼를 거느린 검은 염소. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「천 마리 새끼가 너를 따른다. 귀찮으면 말해라.」
- 전리품:
  - `shubniggurath2_0` **뿔난 관** (helm) → `assets/items/shubniggurath2_0.png`
  - `shubniggurath2_1` **검은 털 각반** (greaves) → `assets/items/shubniggurath2_1.png`

### 우보-사틀라의 화신 `ubbosathla` — 일반 · 화신

- 설명: 머리도 팔다리도 없는, 모든 것의 처음이자 끝 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/ubbosathla.png` (지금은 🧬)
- 프롬프트: 우보-사틀라의 화신 — 머리도 팔다리도 없는, 모든 것의 처음이자 끝. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「모든 것이 나에게서 나와 나에게 돌아온다. 너도 언젠가는.」
- 전리품:
  - `ubbosathla_0` **처음이자 끝인 진흙 띠** (belt) → `assets/items/ubbosathla_0.png`
  - `ubbosathla_1` **모든 것을 빚은 손** (gloves) → `assets/items/ubbosathla_1.png`

### 아브호스의 화신 `abhoth` — 일반 · 화신

- 설명: 끝없이 새것을 게워내는 웅덩이 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/abhoth.png` (지금은 🫧)
- 프롬프트: 아브호스의 화신 — 끝없이 새것을 게워내는 웅덩이. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「끝없이 새것을 게워 낸다. 낡은 건 내가 먹어 주마.」
- 전리품:
  - `abhoth2_0` **끓는 진흙 갑주** (armor) → `assets/items/abhoth2_0.png`
  - `abhoth2_1` **녹아내리는 신** (boots) → `assets/items/abhoth2_1.png`

### 다올로스의 화신 `daoloth` — 일반 · 화신

- 설명: 장막을 찢는 자 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/daoloth.png` (지금은 🌫️)
- 프롬프트: 다올로스의 화신 — 장막을 찢는 자. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「장막을 찢으면 진짜가 보인다. 눈을 감지 마라.」
- 전리품:
  - `daoloth_0` **장막을 찢는 견갑** (shoulder) → `assets/items/daoloth_0.png`
  - `daoloth_1` **찢어진 장막** (offhand) → `assets/items/daoloth_1.png`

### 요그소토스의 화신 `yogsothoth` — 정예 · 화신

- 설명: 문이자 열쇠이며 문지기인 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/yogsothoth.png` (지금은 🔮)
- 프롬프트: 요그소토스의 화신 — 문이자 열쇠이며 문지기인. 궁극의 혼돈(제20격 외신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「문이자 열쇠다. 어느 쪽이든 필요한 쪽을 쥐어라.」
- 전리품:
  - `yogsothoth2_0` **모든 문의 열쇠** (ring) → `assets/items/yogsothoth2_0.png`
  - `yogsothoth2_1` **구체 속의 구체** (necklace) → `assets/items/yogsothoth2_1.png`

### 공허의 군주 `voidlordmyth` — 일반 · 화신

- 설명: 아무것도 아닌 것의 왕 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/voidlordmyth.png` (지금은 🕳️)
- 프롬프트: 공허의 군주 — 아무것도 아닌 것의 왕. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「아무것도 아닌 것의 왕이다. 그러니 잃을 것도 없지. 너처럼.」
- 전리품:
  - `voidlordmyth2_0` **공허의 낫** (weapon) → `assets/items/voidlordmyth2_0.png`
  - `voidlordmyth2_1` **빈 고리** (bracelet) → `assets/items/voidlordmyth2_1.png`

### 툴주샤의 화신 `tulzscha` — 일반 · 화신

- 설명: 백치 신의 궁정에서 타는 초록 불꽃 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/tulzscha.png` (지금은 ❇️)
- 프롬프트: 툴주샤의 화신 — 백치 신의 궁정에서 타는 초록 불꽃. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「백치 신의 궁정에서 춤추는 불이다. 네 장단에도 맞춰 주지.」
- 전리품:
  - `tulzscha_0` **초록 불꽃의 반지** (ring) → `assets/items/tulzscha_0.png`
  - `tulzscha_1` **불꽃으로 춤추는 손** (gloves) → `assets/items/tulzscha_1.png`

### 이브-츠틀의 화신 `yibbtstll` — 일반 · 화신

- 설명: 시간 바깥에서 참고 기다리는 자 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/yibbtstll.png` (지금은 ⏳)
- 프롬프트: 이브-츠틀의 화신 — 시간 바깥에서 참고 기다리는 자. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「시간 바깥에서 기다렸다. 너를 기다리는 건 조금도 길지 않았다.」
- 전리품:
  - `yibbtstll_0` **시간을 덮는 망토** (cloak) → `assets/items/yibbtstll_0.png`
  - `yibbtstll_1` **시간을 세는 팔찌** (bracelet) → `assets/items/yibbtstll_1.png`

### 니알라토텝의 화신 `nyarlathotep` — 정예 · 화신

- 설명: 천 개의 가면을 쓴 기어오는 혼돈 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/nyarlathotep.png` (지금은 🎭)
- 프롬프트: 니알라토텝의 화신 — 천 개의 가면을 쓴 기어오는 혼돈. 궁극의 혼돈(제20격 외신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「가면은 천 개다. 네게 보여 줄 얼굴은 아직 고르지 못했다.」
- 전리품:
  - `nyarlathotep2_0` **검은 파라오의 의복** (cloak) → `assets/items/nyarlathotep2_0.png`
  - `nyarlathotep2_1` **천 개째의 가면** (helm) → `assets/items/nyarlathotep2_1.png`

### 그로스의 화신 `ghroth` — 일반 · 화신

- 설명: 별을 깨우며 떠도는 행성 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/ghroth.png` (지금은 🪐)
- 프롬프트: 그로스의 화신 — 별을 깨우며 떠도는 행성. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「내 노래에 별들이 깨어난다. 네 이름도 불러 주마.」
- 전리품:
  - `ghroth_0` **떠도는 별의 견갑** (shoulder) → `assets/items/ghroth_0.png`
  - `ghroth_1` **별을 깨우며 걷는 신** (boots) → `assets/items/ghroth_1.png`

### 아자토스의 피리꾼 `pipers` — 일반 · 화신

- 설명: 백치 신 곁에서 피리를 멈추지 않는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/pipers.png` (지금은 🎶)
- 프롬프트: 아자토스의 피리꾼 — 백치 신 곁에서 피리를 멈추지 않는. 궁극의 혼돈(제20격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「피리를 멈추면 그분이 깬다. 그러니 너를 위해서도 계속 분다.」
- 전리품:
  - `pipers_0` **멈추지 않는 피리** (offhand) → `assets/items/pipers_0.png`

### 아자토스 `azathoth` — 보스

- 설명: 중심에서 잠든 눈먼 백치 신 · 화신을 갖지 못한 유일한 것 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/azathoth.png` (지금은 🌀)
- 프롬프트: 아자토스 — 중심에서 잠든 눈먼 백치 신 · 화신을 갖지 못한 유일한 것. 궁극의 혼돈(제20격 외신)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `azathoth2_0` **만물을 가르는 칼날** (weapon) → `assets/items/azathoth2_0.png`
  - `azathoth2_1` **무(無)의 갑주** (armor) → `assets/items/azathoth2_1.png`
  - `azathoth2_2` **백치의 왕관** (necklace) → `assets/items/azathoth2_2.png`


---

## 떠돌이 상인의 소지품 (몬스터 없음)

- `ware_hardhat` **이름이 번진 안전모** (helm, 제4격 성능) → `assets/items/ware_hardhat.png` — 안쪽에 매직으로 쓴 이름이 땀에 번져 읽히지 않는다.
- `ware_flashlight` **아직 켜지는 손전등** (offhand, 제4격 성능) → `assets/items/ware_flashlight.png` — 건전지는 새것이다. 누가 갈아 끼웠는지는 모른다.
- `ware_jacket` **구겨진 협회 점퍼** (armor, 제4격 성능) → `assets/items/ware_jacket.png` — 왼쪽 가슴에 붙은 번호표가 반쯤 뜯겼다.
- `ware_boots` **끈이 해진 등산화** (boots, 제4격 성능) → `assets/items/ware_boots.png` — 밑창에 아직 진흙이 마르지 않았다.
- `ware_glove` **한 짝뿐인 작업 장갑** (gloves, 제4격 성능) → `assets/items/ware_glove.png` — 나머지 한 짝을 찾는 사람은 없었다.
- `ware_tag` **번호만 남은 인식표** (necklace, 제5격 성능) → `assets/items/ware_tag.png` — 체인에 묻은 얼룩은 닦이지 않는다.
- `ware_watch` **멈춘 손목시계** (bracelet, 제5격 성능) → `assets/items/ware_watch.png` — 바늘은 새벽 네 시 십 분에서 움직이지 않는다.
- `ware_sign` **방패 대신 든 표지판** (offhand, 제5격 성능) → `assets/items/ware_sign.png` — 「공사중 · 우회하세요」
- `ware_belt` **탄창이 빈 전술 벨트** (belt, 제5격 성능) → `assets/items/ware_belt.png` — 고리마다 누군가의 손때가 있다.
- `ware_raincoat` **찢긴 방수 망토** (cloak, 제5격 성능) → `assets/items/ware_raincoat.png` — 후드를 쓰면 빗소리 같은 것이 들린다.
- `ware_bat` **손잡이만 감긴 쇠파이프** (weapon, 제6격 성능) → `assets/items/ware_bat.png` — 테이프는 새것이고, 쇠는 닳아 있다.
- `ware_ring` **안쪽에 날짜가 새겨진 반지** (ring, 제6격 성능) → `assets/items/ware_ring.png` — 날짜는 오늘보다 한참 전이다.
- `ware_greaves` **무릎보호대** (greaves, 제6격 성능) → `assets/items/ware_greaves.png` — 한쪽만 심하게 닳았다.
- `ware_scarf` **색 바랜 목도리** (shoulder, 제6격 성능) → `assets/items/ware_scarf.png` — 누가 떠 준 것인지 모르는 채 두르게 된다.

---

## 무명의 화신

- `nameless` → `assets/monsters/nameless.png` — 무명 — 이름이 없는 것. 얼굴과 이름이 없는 인물의 실루엣. 전신 도트 일러스트, 투명 배경. (정체를 암시하지 말 것)
