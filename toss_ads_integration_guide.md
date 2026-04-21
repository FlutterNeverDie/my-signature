# AppsInToss 광고 연동 가이드

다른 AI 담당자나 팀원에게 전달할 목적으로 작성된 토스 통합 광고 연동 가이드 및 코드 모음입니다. 
광고 ID만 본인들의 앱 환경에 맞게 교체하여 바로 사용할 수 있습니다.

## 📌 필수 확인 사항
- **전면 광고 타이밍**: 유저가 대기하는 시간을 줄이기 위해 화면 진입 시 `preload()` 로 먼저 로드해 두고, 버튼 클릭 등 결과 화면 전환 직전에 `showAd()`를 호출합니다. 광고 종료 콜백 안에서 다음 화면 전환 로직을 수행합니다.
- **배너 광고 사이즈**: 텍스트 기점의 하단 띠 배너는 `96px` 권장, 피드형/이미지 느낌 배너는 `410px` 권장입니다.

---

## 1. 광고 ID 설정 ([src/constants/adConfig.ts](file:///Users/sanghoon/Documents/GitHub/my-signature/src/constants/adConfig.ts))

발급받은 광고 ID를 관리하는 파일입니다. 실 서비스 배포 전 반드시 토스 디벨로퍼 센터에서 발급 받은 ID로 변경해야 합니다.

```typescript
/**
 * 토스 광고 2.0 (App-in-Toss) 광고 ID 관리
 */
export const AD_CONFIG = {
  // 전면 광고: 결과 페이지 전환하기 직전에 띄움
  INTERSTITIAL: 'ait.v2.live.4c7e9d7a569b4472', // 👉 발급받은 전면광고 ID로 변경

  // 일반 띠 배너: 하단 고정용 (높이 96px)
  BANNER: 'ait.v2.live.557cc5e9c7f9426f',     // 👉 발급받은 하단 배너 ID로 변경

  // 피드형/이미지 배너: 결과 화면 내 큰 사이즈용 (높이 410px)
  NATIVE_IMAGE: 'ait.v2.live.690a70b8f7574d55', // 👉 발급받은 네이티브 이미지 배너 ID로 변경
};
```

---

## 2. 전면 광고 Hook ([src/hooks/useTossInterstitialAd.ts](file:///Users/sanghoon/Documents/GitHub/my-signature/src/hooks/useTossInterstitialAd.ts))

결과 조회 전 노출하기 위한 전면 광고용 Custom Hook([useTossInterstitialAd](file:///Users/sanghoon/Documents/GitHub/my-signature/src/hooks/useTossInterstitialAd.ts#5-94)) 코드입니다. `GoogleAdMob` 객체를 이용해 로딩과 시연을 분리 관리합니다.

```typescript
import { GoogleAdMob } from '@apps-in-toss/web-framework';
import { useRef, useCallback } from 'react';
import { AD_CONFIG } from '../constants/adConfig';

export const useTossInterstitialAd = () => {
  const isLoaded = useRef(false);
  const isLoading = useRef(false);

  // 토스 인앱 브라우저인지 확인
  const isTossApp = () => /Toss/i.test(navigator.userAgent);

  const isSupported = () => {
    try {
      return (
        GoogleAdMob.loadAppsInTossAdMob.isSupported() &&
        GoogleAdMob.showAppsInTossAdMob.isSupported()
      );
    } catch {
      return false;
    }
  };

  // ✅ 1. 미리 로드하기 (안 기다리게 화면 켜질 때 즉시 호출)
  const preload = useCallback(() => {
    if (!isTossApp() || !isSupported()) return;
    if (isLoaded.current || isLoading.current) return;

    isLoading.current = true;

    try {
      GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId: AD_CONFIG.INTERSTITIAL },
        onEvent: (event: any) => {
          if (event.type === 'loaded') {
            isLoaded.current = true;
            isLoading.current = false;
          } else if (event.type === 'failedToLoad') {
            isLoading.current = false;
          }
        },
        onError: () => {
          isLoading.current = false;
        },
      });
    } catch {
      isLoading.current = false;
    }
  }, []);

  // ✅ 2. 광고 노출하기 (광고 종료 시점이 오면 onClose 콜백으로 다음 액션 실행)
  const showAd = useCallback((onClose: () => void) => {
    if (!isTossApp()) {
      console.log('[Mock] 외부 웹 브라우저 임으로 전면 광고 스킵함');
      onClose();
      return;
    }

    if (!isSupported() || !isLoaded.current) {
      // 로딩 중이거나 지원하지 않는 경우 진행을 막지 않고 즉시 콜백 반환
      onClose();
      return;
    }

    isLoaded.current = false;
    let isDone = false;
    let unsubscribeShow: (() => void) | undefined;

    const handleNext = () => {
      if (isDone) return;
      isDone = true;
      if (unsubscribeShow) unsubscribeShow();
      onClose();   // 👉 여기서 다음 작업(결과 화면 전환) 진행
      preload();   // 다음 번 광고 시청을 위해 광고 객체 재로드
    };

    try {
      unsubscribeShow = GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId: AD_CONFIG.INTERSTITIAL },
        onEvent: (event: any) => {
          if (
            event.type === 'adClosed' ||
            event.type === 'adFailedToShow' ||
            event.type === 'dismissed'
          ) {
            handleNext();
          }
        },
        onError: () => handleNext(),
      });
    } catch {
      handleNext();
    }
  }, [preload]);

  return { preload, showAd };
};
```

---

## 3. 배너 컴포넌트 ([src/components/common/TossBannerAd.tsx](file:///Users/sanghoon/Documents/GitHub/my-signature/src/components/common/TossBannerAd.tsx))

화면 하단에 부착하거나 중간중간 이미지를 띄울 배너 랩핑 컴포넌트입니다. SDK 초기화 이슈에 대한 Fallback, 그리고 언마운트 시 메모리 누수 방지용 `.destroy()` 처리가 포함되어 있습니다.

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework'; 
import { AD_CONFIG } from '../../constants/adConfig';

interface TossBannerAdProps {
  adGroupId: string;    
  height?: string;      
  variant?: 'card' | 'expanded'; 
}

export const TossBannerAd: React.FC<TossBannerAdProps> = ({ 
  adGroupId, 
  height, 
  variant = 'expanded' 
}) => {
  // ✅ 배너 타입에 따른 높이 기본값 분기
  let resolvedHeight = height;
  if (!resolvedHeight) {
    if (variant === 'expanded') resolvedHeight = '96px';
    else if (adGroupId === AD_CONFIG.NATIVE_IMAGE) resolvedHeight = '410px';
    else resolvedHeight = '180px';
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isTossApp = /Toss/i.test(navigator.userAgent); 

  // ① 앱인토스 SDK 초기화 처리
  useEffect(() => {
    if (!isTossApp) return;
    const globalAds = TossAds as any;
    
    try {
      if (globalAds.initialize?.isSupported?.() || globalAds.initialize) {
        globalAds.initialize({
          callbacks: {
            onInitialized: () => setIsInitialized(true),
            onInitializationFailed: (error: any) => {
              console.error('Toss Ads 초기화 에러:', error);
              setIsInitialized(true); 
            },
          },
        });
      } else {
        setIsInitialized(true);
      }
    } catch(e) {
      setIsInitialized(true);
    }
  }, [isTossApp]);

  // ② 배너 부착 및 해제 (안전 장치 포함)
  useEffect(() => {
    if (!isTossApp || !isInitialized || !containerRef.current) return;
    let banner: { destroy: () => void } | undefined;
    const globalAds = TossAds as any;
    const attachFn = globalAds.attachBanner || globalAds.attach;

    try {
      banner = attachFn?.(adGroupId, containerRef.current, {
        variant,
        theme: 'light', 
      });
    } catch (error) {
      console.error('Toss Banner 부착 에러:', error);
    }

    // 💡 [핵심] 컴포넌트 해제 시 기존 배너 날려주기
    return () => {
      if (banner && typeof banner.destroy === 'function') {
        banner.destroy();
      } else {
        globalAds.destroyAll?.();
      }
    };
  }, [adGroupId, variant, isInitialized, isTossApp]);

  return (
    <div style={{ width: '100%', minHeight: resolvedHeight, background: 'transparent' }}>
      {isTossApp && (
        <div 
          ref={containerRef} 
          style={{ width: '100%', marginTop: variant === 'expanded' ? 0 : 16, marginBottom: variant === 'expanded' ? 0 : 16 }} 
        />
      )}
      {!isTossApp && (
        <div style={{ height: resolvedHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', background: '#F2F4F6', color: '#8B95A1', fontSize: '13px' }}>
          [Mock] 외부 환경 배너 노출 영역
        </div>
      )}
    </div>
  );
};
```

---

## 4. 실전 활용 예시 ([App.tsx](file:///Users/sanghoon/Documents/GitHub/my-signature/src/App.tsx) 등에서 엮기)

위에서 제시한 Hook과 컴포넌트를 실제 페이지에서 조립하여 시퀀스를 완성하는 예시 코드입니다.

```tsx
import { useEffect } from 'react';
import { TossBannerAd } from './components/common/TossBannerAd';
import { useTossInterstitialAd } from './hooks/useTossInterstitialAd';
import { AD_CONFIG } from './constants/adConfig';

function App() {
  const { preload, showAd } = useTossInterstitialAd();

  // ✅ 1. 화면 처음 진입 시 전면 광고부터 로드 되도록 태움
  useEffect(() => {
    preload();
  }, [preload]);

  // ✅ 2. 버튼 등으로 사용자가 결과 생성을 누를 때 연결
  const handleGenerate = () => {
    console.log("결과 화면 렌더링 전 전면광고 노출...");
    
    // showAd에 콜백 넘김: 광고 끄는 순간 아래 콜백 즉시 실행됨
    showAd(() => {
      console.log("광고 종료. 결과 렌더링 시작");
      // TODO: setState 등으로 이후 로직 처리 (ex. generate(), 페이지 push 처리 등)
    });
  };

  return (
    <div>
      <div className="content">
        <h1>우리 앱 메인 페이지</h1>
        <button onClick={handleGenerate}>결과 확인하기</button>
      </div>

      <div className="bottom-fixed" style={{ position: 'fixed', bottom: 0, width: '100%' }}>
        {/* ✅ 3. 하단 등에 띠 배너 고정 위치 시켜둠 */}
        <TossBannerAd adGroupId={AD_CONFIG.BANNER} variant="expanded" height="96px" />
      </div>
    </div>
  );
}
```
