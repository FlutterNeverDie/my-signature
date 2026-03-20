import { GoogleAdMob } from '@apps-in-toss/web-framework';
import { AD_CONFIG } from '../constants/adConfig';

/**
 * 💡 전면 광고를 호출하는 커스텀 훅
 */
export const useTossInterstitialAd = () => {
  const showAd = (onComplete: () => void) => {
    const isTossApp = /Toss/i.test(navigator.userAgent);
    let isDone = false; // 중복 호출 방지용

    const handleComplete = (unregister?: () => void) => {
      if (isDone) return;
      isDone = true;
      onComplete(); // 광고가 닫히거나 스킵되었을 때 실행될 원래 동작 (싸인 결과 생성)
      if (unregister && typeof unregister === 'function') {
        unregister();
      }
    };

    // 1. [로컬 방어] 개발용 PC 브라우저면 에러 없이 바로 통과 (모킹)
    if (!isTossApp) {
      console.log('[Mock] 전면 광고 스킵!');
      handleComplete();
      return;
    }

    try {
      // 2. 토스 인앱 환경일 경우 실제 호출 처리
      if (GoogleAdMob.showAppsInTossAdMob.isSupported?.() || GoogleAdMob.showAppsInTossAdMob) {
        // ✅ 토스 SDK에서 제공받은 해제 함수(unregister)를 반드시 변수에 담아둡니다.
        const unregister: any = GoogleAdMob.showAppsInTossAdMob({
          options: {
            adGroupId: AD_CONFIG.INTERSTITIAL, // 전면 광고 전용 키 (필수)
          },
          // 💡 [매우 중요] 광고 노출 도중 발생하는 이벤트를 모니터링합니다.
          onEvent: (event: any) => {
            // 전면 광고는 "보상형"이 아니므로 사용자가 닫았을 때(`dismissed` 등) 바로 통과시킴
            if (
              event.type === 'dismissed' || 
              event.type === 'adClosed' || 
              event.type === 'failedToShow' ||
              // 혹시 모를 구버전 호환용 (name 프로퍼티)
              event.name === 'adClosed' ||
              event.name === 'adFailedToShow'
            ) {
              handleComplete(unregister);
            }
          },
          // 통신 불량, 서버 다운 등으로 광고를 띄우지 못했을 때
          onError: (error: any) => {
            console.error('전면광고 에러 발생:', error);
            handleComplete(unregister); // 화면이 멈추지 않게 억지로라도 통과 (Fallback)
          },
        });
      } else {
        // 구버전 토스 앱이거나 미지원 상태일 때
        handleComplete();
      }
    } catch(e) {
      console.error('전면광고 실행 중 예외 처리:', e);
      handleComplete();
    }
  };

  return { showAd };
};
