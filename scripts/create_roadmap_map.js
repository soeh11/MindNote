const fs = require('fs');
const path = require('path');

const NOTES_DIR = path.join('C:', 'MM', 'data', 'notes');
const MAPS_DIR = path.join('C:', 'MM', 'data', 'maps');

if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });
if (!fs.existsSync(MAPS_DIR)) fs.mkdirSync(MAPS_DIR, { recursive: true });

const now = new Date().toISOString();

const notesData = [
  {
    id: 'note-roadmap-hub',
    title: '🚀 MindNote 상업화 & 출시 전략 총괄',
    color: 'blue',
    tags: ['로드맵', '상업화', '전략'],
    summary: '중학생 개발자의 무자본 상업화 전략! AI 연동부터 DB, 자동 업데이트, 커뮤니티 바이럴까지 전 과정 총정리',
    content: `# 🚀 MindNote 상업화 & 출시 전략 총괄

> **"헵타베이스는 너무 비싸고 무겁다. 로컬 파일의 안전함과 노션의 편리함, 마인드맵의 시각화를 합친 도구를 내가 직접 만든다!"**

---

### 🌟 프로젝트 핵심 비전
1. **압도적 가격 경쟁력**: 헵타베이스(월 16,000원, 무료 없음) 대비 **월 4,900원(1/3 수준)** & 무료 체험 넉넉 제공
2. **데이터 100% 로컬 소유권**: 클라우드 종속 없이 내 컴퓨터의 마크다운(\`.md\`) 파일로 영구 보관 (속도 0.1초)
3. **진정성 있는 스토리**: "중학생 개발자가 혼자 완주한 생산성 도구"라는 강력한 응원 동기

---

### 🗺️ 4대 핵심 추진 단계
1. **[1단계] AI 기능 & Supabase 0원 보안 인프라**: Supabase Edge Functions로 API 키 은닉 + 하루 10회 제한 + 스마트 요약 & 브레인스토밍 (Cloudflare 없이 올인원!)
2. **[2단계] 계정 & 라이선스 DB**: Lemon Squeezy 시리얼 키(서버 0개) 또는 Supabase 구글 원클릭 로그인
3. **[3단계] 자동 업데이트 & 배포**: GitHub Releases 무제한 무료 CDN + electron-updater 원클릭 패치
4. **[4단계] 커뮤니티 출시 & 0원 바이럴**: 디스콰이엇, 긱뉴스, 노션/개발 갤러리, 15초 비포/애프터 숏폼`
  },
  {
    id: 'note-roadmap-ai-proxy',
    title: '⚡ Supabase Edge Functions 0원 AI 중계기',
    color: 'purple',
    tags: ['AI', '보안', 'Supabase', '서버리스'],
    summary: 'Cloudflare 없이 Supabase 하나로 API 키 완벽 은닉! 키를 앱에 주지 않고 대신 AI에게 다녀오는 안전한 대리 호출',
    content: `# ⚡ Supabase Edge Functions 0원 AI 중계기

### ⚠️ 왜 앱 안에 API 키를 넣으면 안 될까?
- 사용자 PC에 설치되는 앱은 누구나 패킷 감시 도구(Fiddler 등)로 \`Authorization: Bearer sk-...\` 키를 훔쳐갈 수 있음.
- 키가 털리면 다른 사람이 내 카드로 수백만 원어치 AI를 결제할 위험 발생!

---

### 💡 핵심 원리: "키를 주는 게 아니라, 대신 다녀오는 심부름꾼!"
- 만약 앱이 서버에서 API 키를 받아와서 OpenAI/Google에 직접 호출하면, 결국 사용자 PC에 키가 노출됨.
- 진짜 안전한 중계(Reverse Proxy) 방식:
  1. 앱은 메모 본문만 전달: *"이 메모 2줄로 요약해 줘!"* (API 키 전혀 없음)
  2. Supabase 서버리스 함수(Edge Function)가 비밀 금고(Vault)에서 마스터 키를 꺼냄.
  3. "이 유저가 오늘 10번 넘게 썼나?" DB에서 체크 후, 마스터 키로 AI에 대신 질의.
  4. AI 응답을 받아 앱에는 **"요약된 텍스트 결과만"** 전달!
  5. 👉 **앱과 사용자는 API 키가 뭔지 평생 구경조차 못 하므로 지갑이 100% 안전!**

---

### 🌟 왜 Cloudflare 대신 Supabase 하나로 통합할까?
- Cloudflare와 Supabase를 쪼개서 쓰면 관리할 사이트가 2개가 되어 복잡함.
- **Supabase 올인원(All-in-One)의 압도적 장점**:
  1. **계정 인증 (Supabase Auth)**: 구글 소셜 로그인
  2. **사용량 추적 (Supabase DB)**: "이 유저 오늘 10번 넘게 썼나?" 체크
  3. **AI 대리 호출 (Supabase Edge Functions)**: API 키 은닉 및 AI 응답 중계
- **비용**: 50,000명 사용자까지 **전부 0원 (완전 무료)**!`
  },
  {
    id: 'note-roadmap-ai-feat',
    title: '🧠 스마트 요약 & 마인드맵 브레인스토밍',
    color: 'purple',
    tags: ['AI', '킬러기능'],
    summary: '긴 메모를 2줄로 짚어주는 스마트 요약과, 노드 클릭 한 번으로 하위 아이디어가 뻗어나가는 AI 확장',
    content: `# 🧠 스마트 요약 & 마인드맵 브레인스토밍

### 1. 메모 스마트 요약 & 태그 추출
- 에디터 상단 **[✨ AI 요약]** 버튼 클릭 시, 수천 자의 긴 마크다운 본문을 읽고 핵심 2~3줄 요약문 생성.
- 요약문은 마인드맵 노드 카드에 즉시 실시간 동기화.
- 연관 핵심 해시태그 2~4개 자동 추천 및 원클릭 태깅.

---

### 2. 마인드맵 스마트 브레인스토밍 (노드 자동 확장)
- 생각의 흐름이 막혔을 때, 노드 헤더의 **[✨ AI 확장]** 클릭!
- AI가 현재 노드의 주제를 분석하여 연관된 하위/파생 아이디어 3~5개를 방사형 노드로 자동 배치 및 간선 연결.

---

### 3. 압도적 마진율 (수익성)
- 텍스트 요약 1회당 AI 원가: **약 0.1원 ~ 0.3원** (Gemini 1.5 Flash 등 기준).
- 유료 유저가 한 달 100회 사용해도 원가는 **30원~50원** 미만!
- 월 4,900원 결제액 대비 **마진율 98%** 달성 가능!`
  },
  {
    id: 'note-roadmap-ai-limit',
    title: '⏱️ 하루 10회 무료 제한 & Pro 전환 설계',
    color: 'purple',
    tags: ['비즈니스모델', '프리미엄', 'Supabase'],
    summary: '무료 사용자는 하루 10회 무료 요약으로 감탄하게 만들고, 헤비 유저는 월 4,900원 Pro 플랜으로 자연스럽게 전환',
    content: `# ⏱️ 하루 10회 무료 제한 & Pro 전환 설계

### 🎯 프리미엄(Freemium) 과금 공식
- **무료 유저 (Free)**: 하루 10회 AI 요약/브레인스토밍 제공.
  - 기능의 놀라운 편리함을 직접 체감하도록 허들을 극도로 낮춤.
- **유료 유저 (Pro - 월 4,900원)**: AI 무제한 사용 + 중첩 서브맵 무제한 + 고해상도 내보내기.

---

### 🛡️ 남용 방지 메커니즘
- Supabase Edge Functions에서 사용자 고유 계정 ID(또는 IP/기기 식별값) 기준으로 일일 호출 카운트 체크.
- Supabase DB 테이블에 오늘 사용 횟수를 기록하여 10회 초과 시 안전하게 차단.
- 10회 초과 시: *"오늘의 무료 AI 충전량이 소진되었어요! 월 4,900원으로 무제한 AI와 프로 기능을 누려보세요."* 팝업 노출.`
  },
  {
    id: 'note-roadmap-db-license',
    title: '🔑 Lemon Squeezy 라이선스 키 (서버 0개)',
    color: 'green',
    tags: ['결제', '라이선스', '무서버'],
    summary: '회원가입/비밀번호 DB 관리 없이, 결제 즉시 시리얼 번호(MN-PRO-XXXX)를 발급하여 잠금 해제하는 무서버 결제',
    content: `# 🔑 Lemon Squeezy 라이선스 키 모델 (서버 0개)

### 💡 가장 강력 추천하는 결제 방식
- **고민**: *"사용자 비밀번호, 개인정보를 서버 DB에 보관하는 건 해킹 위험도 있고 너무 복잡해요."*
- **해결책**: **글로벌 소프트웨어 결제 대행사 Lemon Squeezy** 활용!

---

### 🛒 작동 메커니즘
1. 앱 내에서 [Pro 업그레이드] 클릭 ➔ 브라우저에서 안전한 결제창 열림 (신용카드, 카카오페이 등 지원).
2. 결제 완료 즉시 사용자 이메일로 고유 시리얼 번호(\`MN-PRO-XXXX-XXXX\`) 자동 발송.
3. 앱 설정창에 시리얼 키를 입력하면, Lemon Squeezy 공식 API로 0.1초 만에 유효성 검증 후 Pro 잠금 해제!
4. **결과**: 개발자가 데이터베이스나 보안 서버를 1대도 운영할 필요가 없음 (유지비 0원, 관리 0시간).`
  },
  {
    id: 'note-roadmap-db-supabase',
    title: '⚡ Supabase 사용자 계정 & 소셜 로그인',
    color: 'green',
    tags: ['데이터베이스', 'Supabase', '인증'],
    summary: '노션처럼 로그인 계정이 필요할 때 5만 명까지 완전 무료로 Google 원클릭 로그인을 구축할 수 있는 BaaS',
    content: `# ⚡ Supabase 사용자 계정 & 소셜 로그인

### 🌐 노션/헵타베이스 스타일 계정이 필요할 때
- 만약 단순 시리얼 키를 넘어 **"구글 아이디로 로그인"** 경험을 제공하고 싶다면 **Supabase**가 최고의 대안!

---

### 💎 Supabase 무료 티어 스펙
- **월 활성 사용자(MAU)**: **50,000명까지 완전 무료 (0원)**
- **기능**:
  - Google / Apple / GitHub 소셜 로그인 3분 만에 설정 가능.
  - 이메일 인증, 비밀번호 재설정 기본 제공.
  - 클라우드 백엔드 데이터베이스(PostgreSQL) 내장.
- **보안**: RLS(Row Level Security) 정책으로 사용자가 자기 데이터만 읽고 쓸 수 있도록 철통 암호화.`
  },
  {
    id: 'note-roadmap-db-privacy',
    title: '🔒 100% 로컬 데이터 소유권 & 신뢰성',
    color: 'green',
    tags: ['프라이버시', '오프라인'],
    summary: '노션/헵타베이스의 서버 장애와 정보 유출 불안을 해소하는 100% 로컬 마크다운(.md) 영구 보관 철학',
    content: `# 🔒 100% 로컬 데이터 소유권 & 신뢰성

### 🥊 헵타베이스 & 노션 사용자들이 겪는 극심한 불안
1. *"인터넷 끊기면 메모를 못 열어본다."*
2. *"서비스 회사가 서버를 끄거나 망하면 내 모든 지식이 날아간다."*
3. *"회사 기밀이나 내 은밀한 아이디어가 남의 서버에 올라간다."*

---

### 🌟 MindNote의 절대적 신뢰 무기
- 모든 메모는 내 컴퓨터 \`C:\\MM\\data\\notes\` 폴더에 **표준 마크다운(\`.md\`) 파일로 영구 보관**.
- 인터넷이 끊겨도 0.1초 만에 즉시 실행되는 완벽한 오프라인 독립성.
- 서비스가 종료되더라도 사용자의 메모는 평생 소장! (Obsidian, VS Code 등 어디서든 바로 열림).`
  },
  {
    id: 'note-roadmap-up-github',
    title: '📦 GitHub Releases 무료 초고속 CDN 배포',
    color: 'orange',
    tags: ['배포', 'GitHub', 'CDN'],
    summary: '마이크로소프트의 글로벌 고속 CDN 서버를 무료로 활용하여 100MB+ 설치 파일(.exe)을 무제한 호스팅',
    content: `# 📦 GitHub Releases 무료 초고속 CDN 배포

### 💰 설치 파일 호스팅 비용 문제
- 데스크톱 앱 설치 파일(\`.exe\`)은 용량이 60~100MB에 달함.
- 수천 명이 다운로드하면 일반 웹서버는 대역폭 요금 폭탄을 맞음!

---

### 🚀 해결책: GitHub Releases 무제한 무료 호스팅
- GitHub 공개 저장소의 **Releases** 탭에 빌드 파일 업로드.
- 마이크로소프트의 엔터프라이즈급 글로벌 초고속 CDN 무료 이용.
- 전 세계 어디서든 수십 MB/s 속도로 안정적 다운로드 지원 (비용 0원).`
  },
  {
    id: 'note-roadmap-up-electron',
    title: '🔄 electron-updater 원클릭 자동 업데이트',
    color: 'orange',
    tags: ['업데이트', 'Electron', '자동화'],
    summary: '사용자가 사이트에 다시 들어갈 필요 없이, 앱 실행 시 자동으로 새 버전을 감지하고 백그라운드 패치',
    content: `# 🔄 electron-updater 원클릭 자동 업데이트

### 🚀 사용자가 재설치하는 번거로움 없애기
- 구식 프로그램: *"새 버전 나왔으니 홈페이지 가서 다시 다운받으세요."* ➔ 유저 이탈 80%!
- 모던 앱(디스코드, 슬랙): **백그라운드에서 조용히 다운로드 후 원클릭 재실행!**

---

### ⚙️ 구현 메커니즘
1. \`electron-updater\` 라이브러리 탑재.
2. 앱 실행 시 GitHub Releases의 최신 버전(\`latest.yml\`) 확인.
3. 새 버전이 있으면 백그라운드에서 다운로드.
4. 다운로드 완료 시 토스트 알림: *"새로운 MindNote 업데이트가 준비되었어요! 지금 재시작할까요?"*
5. 클릭 시 1초 만에 패치 완료 후 재실행.`
  },
  {
    id: 'note-roadmap-up-landing',
    title: '🌐 Vercel 무료 호스팅 랜딩페이지',
    color: 'orange',
    tags: ['랜딩페이지', 'Vercel', '웹사이트'],
    summary: 'React + Tailwind로 만든 세련된 단일 다운로드 웹사이트를 Vercel 무료 티어로 배포 (mindnote.vercel.app)',
    content: `# 🌐 Vercel 무료 호스팅 랜딩페이지

### 🖥️ 다운로드 웹사이트 구축 (0원)
- **도메인 & 호스팅**: Vercel 무료 배포 (\`mindnote.vercel.app\`)
- **구성 요소**:
  1. **헤더**: 로고, [Windows 다운로드 (무료)] 버튼
  2. **히어로 섹션**: 줄글이 마인드맵으로 펼쳐지는 생생한 GIF 애니메이션
  3. **비교표**: 헵타베이스 vs MindNote (월 16,000원 vs 4,900원 / 폐쇄형 vs 로컬 오픈)
  4. **SmartScreen 안내**: 윈도우 최초 실행 시 [추가 정보 ➔ 실행]을 누르면 안전하게 열린다는 친절한 설명
  5. **다운로드 버튼 클릭 시**: GitHub Releases의 최신 \`.exe\` 직접 다운로드 링크 연결.`
  },
  {
    id: 'note-roadmap-mk-story',
    title: '📖 중학생 개발자의 진정성 있는 스토리텔링',
    color: 'red',
    tags: ['마케팅', '스토리텔링', '바이럴'],
    summary: '"헵타베이스가 너무 비싸서 중학생인 제가 직접 만들었습니다." - 어른들의 응원과 자발적 공유를 부르는 최고의 치트키',
    content: `# 📖 중학생 개발자의 진정성 있는 스토리텔링

### 🎯 왜 스토리가 최고의 마케팅일까?
- 대기업이나 어른 개발자가 만든 앱은 "또 광고네" 하고 지나침.
- 하지만 **"헵타베이스 16,000원이 너무 비싸서, 공부하려고 중학생인 제가 직접 React와 Electron으로 만든 마인드맵 메모장입니다."**라는 글은:
  1. 개발자 커뮤니티 어른들의 엄청난 존경과 감탄 유발.
  2. 링크드인, 트위터(X), 개발자 단톡방 자발적 바이럴 공유.
  3. 피드백을 주는 '찐 팬'들이 스스로 모여듦.

---

### 📝 글쓰기 3대 핵심 공식
1. **솔직한 동기**: 내가 왜 기존 메모 앱들에 답답함을 느꼈는지.
2. **개발 여정의 고난과 극복**: 핸들 어긋남, 노드 증발 버그를 밤새워 잡았던 생생한 과정.
3. **겸손한 피드백 요청**: *"아직 부족하지만 써보시고 따끔한 조언 부탁드립니다!"*`
  },
  {
    id: 'note-roadmap-mk-channels',
    title: '🎯 디스콰이엇, 긱뉴스, 커뮤니티 런칭',
    color: 'red',
    tags: ['커뮤니티', '런칭', '배포'],
    summary: '초기 유저 1,000명을 0원으로 모으는 4대 핵심 커뮤니티 공략법 (디스콰이엇 트렌딩 1위 타겟)',
    content: `# 🎯 디스콰이엇, 긱뉴스, 커뮤니티 런칭

### 🚀 1차 타겟: 얼리어답터 / IT 커뮤니티
1. **디스콰이엇 (Disquiet.io)**:
   - 한국의 메이커/스타트업 중심지.
   - 트렌딩 1위 달성 시 **조회수 5,000회 / 다운로드 300~500명** 즉시 확보!
2. **긱뉴스 (GeekNews)**:
   - 기술적 깊이를 인정받는 개발자 뉴스레터. 깔끔한 아키텍처와 로컬 마크다운 철학 공유.
3. **디시인사이드 (프로그래밍 갤러리 / 노션 갤러리)**:
   - 솔직하고 가감 없는 유저들의 필터링 없는 피드백 수집 및 버그 리포트 창구.
4. **아카라이브 / 클리앙 / 루리웹 IT 게시판**:
   - 국산 독립 소프트웨어 응원 및 바이럴 확산.`
  },
  {
    id: 'note-roadmap-mk-shorts',
    title: '🎬 3초 변환 15초 숏폼 바이럴 (인스타/쇼츠)',
    color: 'red',
    tags: ['숏폼', '쇼츠', '릴스', '바이럴'],
    summary: '줄글 메모를 치고 버튼을 누르자마자 화려한 마인드맵으로 촥 펼쳐지는 비포/애프터 15초 영상 공략',
    content: `# 🎬 3초 변환 15초 숏폼 바이럴 (인스타/쇼츠)

### 📱 텍스트보다 100배 빠른 비주얼 충격
- 인스타그램 릴스, 유튜브 쇼츠, 틱톡은 **시각적 비포/애프터**에 열광함!

---

### 🎥 15초 영상 시나리오
- **0~3초 (후킹)**: 복잡하고 어지러운 시험 범위 / 회의록 줄글 텍스트 화면.
  - 자막: *"노션에 줄글로 길게 적으면 절대 다시 안 읽는 이유"*
- **4~8초 (행동)**: MindNote에서 **[마인드맵 보기]** 버튼을 찰칵 클릭!
- **9~13초 (카타르시스)**: 3초 만에 알록달록한 노드와 연결선으로 화려하게 펼쳐지는 캔버스!
  - 휠 줌인/줌아웃 및 부드러운 패닝 시연.
- **14~15초 (CTA)**: *"프로필 링크에서 무료 다운로드 받으세요!"*`
  },
  {
    id: 'note-roadmap-mindset',
    title: '🏆 망해도 본전 이상, 잘되면 인생 역전',
    color: 'default',
    tags: ['멘탈관리', '동기부여', '성장'],
    summary: '손해액 0원! 다운로드가 5명뿐이어도 상위 0.1% 개발 실력과 포트폴리오가 남아 평생 자산이 되는 무적의 게임',
    content: `# 🏆 망해도 본전 이상, 잘되면 인생 역전

### 🧘 실패에 대한 두려움 지우기
- **최악의 시나리오**: 다운로드 5명, 결제 0원.
- **잃은 것**: **돈 0원** (대출도 없고 빚도 없음. 약간의 아쉬움뿐).
- **영원히 내 손에 남는 것**:
  1. 중학생 나이에 Electron, React, 마크다운 엔진, AI 파이프라인을 완주한 **상위 0.1% 실력**.
  2. 고등학교/대학교 입시나 취업에서 면접관을 압도할 **실제 런칭 포트폴리오**.
  3. 남들이 안 써도 내가 평생 편리하게 쓸 수 있는 **나만의 맞춤형 도구**.

---

### 🎯 첫 번째 마일스톤
- "전 세계 10만 명"이라는 거대한 목표 대신, **"나 말고 딱 1명이라도 매일 진심으로 쓰는 사람 만들기"**부터 가볍게 시작합시다!`
  }
];

// 1. 메모 파일 생성
notesData.forEach(n => {
  const filePath = path.join(NOTES_DIR, `${n.id}.md`);
  const fileContent = `---
id: ${n.id}
title: ${n.title}
color: ${n.color}
tags: ${JSON.stringify(n.tags)}
summary: "${n.summary.replace(/"/g, '\\"')}"
updatedAt: ${now}
---
${n.content}`;
  fs.writeFileSync(filePath, fileContent, 'utf-8');
});

// 2. 마인드맵 JSON 구성
const mapData = {
  id: 'map-commercial-roadmap',
  title: '🚀 MindNote 상업화 & 출시 올인원 로드맵',
  updatedAt: now,
  nodes: [
    // --- 섹션 4개 ---
    {
      id: 'sec-ai',
      type: 'sectionNode',
      position: { x: -380, y: -450 },
      style: { width: 680, height: 500, pointerEvents: 'none' },
      width: 680,
      height: 500,
      zIndex: -1,
      data: {
        title: '🧠 1단계: AI 기능 & Supabase 0원 보안 인프라',
        color: 'purple'
      }
    },
    {
      id: 'sec-db',
      type: 'sectionNode',
      position: { x: 420, y: -450 },
      style: { width: 680, height: 500, pointerEvents: 'none' },
      width: 680,
      height: 500,
      zIndex: -1,
      data: {
        title: '💾 2단계: 계정 & 라이선스 데이터베이스',
        color: 'green'
      }
    },
    {
      id: 'sec-update',
      type: 'sectionNode',
      position: { x: -380, y: 380 },
      style: { width: 680, height: 500, pointerEvents: 'none' },
      width: 680,
      height: 500,
      zIndex: -1,
      data: {
        title: '🔄 3단계: 자동 업데이트 & 배포 인프라',
        color: 'amber'
      }
    },
    {
      id: 'sec-market',
      type: 'sectionNode',
      position: { x: 420, y: 380 },
      style: { width: 680, height: 500, pointerEvents: 'none' },
      width: 680,
      height: 500,
      zIndex: -1,
      data: {
        title: '📢 4단계: 0원 커뮤니티 출시 & 바이럴 마케팅',
        color: 'rose'
      }
    },

    // --- 중앙 허브 노드 ---
    {
      id: 'node-hub',
      type: 'noteNode',
      position: { x: 220, y: 120 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-hub',
        title: '🚀 MindNote 상업화 & 출시 전략 총괄',
        summary: '중학생 개발자의 무자본 상업화 전략! AI 연동부터 DB, 자동 업데이트, 커뮤니티 바이럴까지 전 과정 총정리',
        color: 'blue',
        tags: ['로드맵', '상업화', '전략']
      }
    },

    // --- 1단계: AI 인프라 노드들 ---
    {
      id: 'node-ai-1',
      type: 'noteNode',
      position: { x: -340, y: -380 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-ai-proxy',
        title: '⚡ Supabase Edge Functions 0원 AI 중계기',
        summary: 'Cloudflare 없이 Supabase 하나로 API 키 완벽 은닉! 키를 앱에 주지 않고 대신 AI에게 다녀오는 안전한 대리 호출',
        color: 'purple',
        tags: ['AI', '보안', 'Supabase', '서버리스']
      }
    },
    {
      id: 'node-ai-2',
      type: 'noteNode',
      position: { x: -340, y: -180 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-ai-feat',
        title: '🧠 스마트 요약 & 마인드맵 브레인스토밍',
        summary: '긴 메모를 2줄로 짚어주는 스마트 요약과, 노드 클릭 한 번으로 하위 아이디어가 뻗어나가는 AI 확장',
        color: 'purple',
        tags: ['AI', '킬러기능']
      }
    },
    {
      id: 'node-ai-3',
      type: 'noteNode',
      position: { x: -20, y: -280 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-ai-limit',
        title: '⏱️ 하루 10회 무료 제한 & Pro 전환 설계',
        summary: '무료 사용자는 하루 10회 무료 요약으로 감탄하게 만들고, 헤비 유저는 월 4,900원 Pro 플랜으로 자연스럽게 전환',
        color: 'purple',
        tags: ['비즈니스모델', '프리미엄']
      }
    },

    // --- 2단계: DB & 라이선스 노드들 ---
    {
      id: 'node-db-1',
      type: 'noteNode',
      position: { x: 460, y: -380 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-db-license',
        title: '🔑 Lemon Squeezy 라이선스 키 (서버 0개)',
        summary: '회원가입/비밀번호 DB 관리 없이, 결제 즉시 시리얼 번호(MN-PRO-XXXX)를 발급하여 잠금 해제하는 무서버 결제',
        color: 'green',
        tags: ['결제', '라이선스', '무서버']
      }
    },
    {
      id: 'node-db-2',
      type: 'noteNode',
      position: { x: 460, y: -180 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-db-supabase',
        title: '⚡ Supabase 사용자 계정 & 소셜 로그인',
        summary: '노션처럼 로그인 계정이 필요할 때 5만 명까지 완전 무료로 Google 원클릭 로그인을 구축할 수 있는 BaaS',
        color: 'green',
        tags: ['데이터베이스', 'Supabase', '인증']
      }
    },
    {
      id: 'node-db-3',
      type: 'noteNode',
      position: { x: 780, y: -280 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-db-privacy',
        title: '🔒 100% 로컬 데이터 소유권 & 신뢰성',
        summary: '노션/헵타베이스의 서버 장애와 정보 유출 불안을 해소하는 100% 로컬 마크다운(.md) 영구 보관 철학',
        color: 'green',
        tags: ['프라이버시', '오프라인']
      }
    },

    // --- 3단계: 자동 업데이트 & 배포 노드들 ---
    {
      id: 'node-up-1',
      type: 'noteNode',
      position: { x: -340, y: 450 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-up-github',
        title: '📦 GitHub Releases 무료 초고속 CDN 배포',
        summary: '마이크로소프트의 글로벌 고속 CDN 서버를 무료로 활용하여 100MB+ 설치 파일(.exe)을 무제한 호스팅',
        color: 'orange',
        tags: ['배포', 'GitHub', 'CDN']
      }
    },
    {
      id: 'node-up-2',
      type: 'noteNode',
      position: { x: -340, y: 650 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-up-electron',
        title: '🔄 electron-updater 원클릭 자동 업데이트',
        summary: '사용자가 사이트에 다시 들어갈 필요 없이, 앱 실행 시 자동으로 새 버전을 감지하고 백그라운드 패치',
        color: 'orange',
        tags: ['업데이트', 'Electron', '자동화']
      }
    },
    {
      id: 'node-up-3',
      type: 'noteNode',
      position: { x: -20, y: 550 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-up-landing',
        title: '🌐 Vercel 무료 호스팅 랜딩페이지',
        summary: 'React + Tailwind로 만든 세련된 단일 다운로드 웹사이트를 Vercel 무료 티어로 배포 (mindnote.vercel.app)',
        color: 'orange',
        tags: ['랜딩페이지', 'Vercel', '웹사이트']
      }
    },

    // --- 4단계: 커뮤니티 출시 & 바이럴 노드들 ---
    {
      id: 'node-mk-1',
      type: 'noteNode',
      position: { x: 460, y: 450 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-mk-story',
        title: '📖 중학생 개발자의 진정성 있는 스토리텔링',
        summary: '"헵타베이스가 너무 비싸서 중학생인 제가 직접 만들었습니다." - 어른들의 응원과 자발적 공유를 부르는 최고의 치트키',
        color: 'red',
        tags: ['마케팅', '스토리텔링', '바이럴']
      }
    },
    {
      id: 'node-mk-2',
      type: 'noteNode',
      position: { x: 460, y: 650 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-mk-channels',
        title: '🎯 디스콰이엇, 긱뉴스, 커뮤니티 런칭',
        summary: '초기 유저 1,000명을 0원으로 모으는 4대 핵심 커뮤니티 공략법 (디스콰이엇 트렌딩 1위 타겟)',
        color: 'red',
        tags: ['커뮤니티', '런칭', '배포']
      }
    },
    {
      id: 'node-mk-3',
      type: 'noteNode',
      position: { x: 780, y: 550 },
      style: { width: 288, height: 160 },
      data: {
        noteId: 'note-roadmap-mk-shorts',
        title: '🎬 3초 변환 15초 숏폼 바이럴 (인스타/쇼츠)',
        summary: '줄글 메모를 치고 버튼을 누르자마자 화려한 마인드맵으로 촥 펼쳐지는 비포/애프터 15초 영상 공략',
        color: 'red',
        tags: ['숏폼', '쇼츠', '릴스', '바이럴']
      }
    },

    // --- 마인드셋 & 결론 노드 ---
    {
      id: 'node-mindset',
      type: 'noteNode',
      position: { x: 220, y: -70 },
      style: { width: 288, height: 150 },
      data: {
        noteId: 'note-roadmap-mindset',
        title: '🏆 망해도 본전 이상, 잘되면 인생 역전',
        summary: '손해액 0원! 다운로드가 5명뿐이어도 상위 0.1% 개발 실력과 포트폴리오가 남아 평생 자산이 되는 무적의 게임',
        color: 'default',
        tags: ['멘탈관리', '동기부여', '성장']
      }
    }
  ],
  edges: [
    // 허브 ➔ 4대 영역 연결
    {
      id: 'e-hub-ai',
      source: 'node-hub',
      target: 'node-ai-3',
      sourceHandle: 'left-source',
      targetHandle: 'right-target',
      type: 'deletable',
      animated: true,
      style: { stroke: '#8B5CF6', strokeWidth: 2.5 },
      data: { label: '1단계: AI 인프라' }
    },
    {
      id: 'e-hub-db',
      source: 'node-hub',
      target: 'node-db-1',
      sourceHandle: 'top-source',
      targetHandle: 'bottom-target',
      type: 'deletable',
      animated: true,
      style: { stroke: '#10B981', strokeWidth: 2.5 },
      data: { label: '2단계: 계정 & 라이선스' }
    },
    {
      id: 'e-hub-up',
      source: 'node-hub',
      target: 'node-up-3',
      sourceHandle: 'bottom-source',
      targetHandle: 'top-target',
      type: 'deletable',
      animated: true,
      style: { stroke: '#F59E0B', strokeWidth: 2.5 },
      data: { label: '3단계: 배포 & 업데이트' }
    },
    {
      id: 'e-hub-mk',
      source: 'node-hub',
      target: 'node-mk-1',
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      type: 'deletable',
      animated: true,
      style: { stroke: '#EF4444', strokeWidth: 2.5 },
      data: { label: '4단계: 커뮤니티 런칭' }
    },
    {
      id: 'e-hub-mindset',
      source: 'node-hub',
      target: 'node-mindset',
      sourceHandle: 'top-source',
      targetHandle: 'bottom-target',
      type: 'deletable',
      animated: false,
      style: { stroke: '#2383E2', strokeWidth: 2 },
      data: { label: '핵심 철학' }
    },

    // 1단계 내부 연결
    {
      id: 'e-ai-1-2',
      source: 'node-ai-1',
      target: 'node-ai-2',
      sourceHandle: 'bottom-source',
      targetHandle: 'top-target',
      type: 'deletable',
      style: { stroke: '#8B5CF6', strokeWidth: 2 },
      data: { label: 'Supabase 대리호출' }
    },
    {
      id: 'e-ai-2-3',
      source: 'node-ai-2',
      target: 'node-ai-3',
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      type: 'deletable',
      style: { stroke: '#8B5CF6', strokeWidth: 2 },
      data: { label: '과금 모델' }
    },

    // 2단계 내부 연결
    {
      id: 'e-db-1-2',
      source: 'node-db-1',
      target: 'node-db-2',
      sourceHandle: 'bottom-source',
      targetHandle: 'top-target',
      type: 'deletable',
      style: { stroke: '#10B981', strokeWidth: 2 },
      data: { label: '인증 옵션' }
    },
    {
      id: 'e-db-2-3',
      source: 'node-db-2',
      target: 'node-db-3',
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      type: 'deletable',
      style: { stroke: '#10B981', strokeWidth: 2 },
      data: { label: '로컬 신뢰' }
    },

    // 3단계 내부 연결
    {
      id: 'e-up-1-2',
      source: 'node-up-1',
      target: 'node-up-2',
      sourceHandle: 'bottom-source',
      targetHandle: 'top-target',
      type: 'deletable',
      style: { stroke: '#F59E0B', strokeWidth: 2 },
      data: { label: '원클릭 패치' }
    },
    {
      id: 'e-up-1-3',
      source: 'node-up-1',
      target: 'node-up-3',
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      type: 'deletable',
      style: { stroke: '#F59E0B', strokeWidth: 2 },
      data: { label: 'CDN 연동' }
    },

    // 4단계 내부 연결
    {
      id: 'e-mk-1-2',
      source: 'node-mk-1',
      target: 'node-mk-2',
      sourceHandle: 'bottom-source',
      targetHandle: 'top-target',
      type: 'deletable',
      style: { stroke: '#EF4444', strokeWidth: 2 },
      data: { label: '스토리 확산' }
    },
    {
      id: 'e-mk-1-3',
      source: 'node-mk-1',
      target: 'node-mk-3',
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      type: 'deletable',
      style: { stroke: '#EF4444', strokeWidth: 2 },
      data: { label: '비주얼 쇼츠' }
    }
  ]
};

const mapFilePath = path.join(MAPS_DIR, 'map-commercial-roadmap.json');
fs.writeFileSync(mapFilePath, JSON.stringify(mapData, null, 2), 'utf-8');

console.log('Successfully created notes and mindmap!');
