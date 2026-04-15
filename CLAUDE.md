# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite 개발 서버 (--host 플래그로 모바일 테스트 가능)
npm run build     # TypeScript 컴파일 + Vite 번들링
npm run lint      # ESLint 실행
npm run preview   # 빌드 결과 미리보기
npm run toss      # Granite dev 환경 (토스 앱 통합 테스트)
npm run deploy    # App-in-Toss 배포
```

테스트 프레임워크가 별도로 설정되어 있지 않으므로 `npm run build && npm run lint`로 정적 검증을 수행한다.

## 프로젝트 개요

**내 싸인 만들기** — 사용자 이름과 폰트 스타일을 선택해 고품질 디지털 서명 이미지를 생성하는 모바일 전용 웹앱. Zero-Backend, No-Auth 구조.

**배포 환경**: 토스 App-in-Toss (인앱 웹뷰). 토스 SDK(`@apps-in-toss/web-framework`) 의존.

## 아키텍처

### 화면 전환 흐름

```
Intro → Input → (2회마다 전면광고) → Result
```

`App.tsx`가 `isIntro`(boolean)와 Zustand의 `isGenerated`(boolean) 두 상태로 3개 화면을 `AnimatePresence`로 관리한다. 별도 라우터 없음.

### 상태 관리 (`src/store.ts`)

Zustand 단일 스토어:
- `language`: `'kor' | 'en'` — 언어 전환 시 `name`과 `fontId` 초기화됨
- `name`: 입력된 이름 (한글 최대 4자, 영문 최대 15자)
- `fontId`: 선택한 폰트 ID (`KorFontId | EnFontId`)
- `isGenerated`: Result 화면 표시 여부
- `generate()` / `reset()`: 화면 전환 액션

### 서명 렌더링 (`src/components/SignatureCanvas.tsx`)

1. `useSignaturePath` 훅이 `opentype.js`로 `public/fonts/` 폰트 파일을 직접 파싱해 SVG path 데이터 생성
2. SVG viewBox `500x260` 기준으로 글자 크기 자동 조절 (MAX_WIDTH: 420px, MAX_HEIGHT: 200px)
3. `framer-motion`의 `pathLength` 애니메이션으로 손글씨 그리기 효과 (stroke → fill 순서)
4. `feTurbulence` + `feDisplacementMap` SVG 필터로 잉크 번짐 질감 적용
5. 회전 변환: 영문 -10도, 한글 -6도

### 이미지 저장 (`App.tsx` `handleSave`)

```
html-to-image (toPng, pixelRatio: 3) → Web Share API → fallback: <a> 다운로드
```
`skipFonts: true` 옵션은 iOS CORS 이슈 회피를 위한 것.

### 광고 시스템

- **전면 광고**: `localStorage` 카운터로 생성 2회마다 1회 노출 (`useTossInterstitialAd`)
- **배너 광고**: `TossBannerAd.tsx` — 토스 Ads SDK로 초기화/attach/destroy 생명주기 관리. 토스 앱 외부에서는 placeholder 표시
- 광고 ID는 `src/constants/adConfig.ts`에서 관리

### 폰트

`public/fonts/kor/` (한글 4종), `public/fonts/en/` (영문 4종). 폰트 파일은 opentype.js가 런타임에 fetch하여 파싱한다. 새 폰트 추가 시 `store.ts`의 `KorFontId`/`EnFontId` 타입과 `useSignaturePath.ts`의 경로 매핑도 함께 수정해야 한다.
