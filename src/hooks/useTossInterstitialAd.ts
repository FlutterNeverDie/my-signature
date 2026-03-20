import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { AD_CONFIG } from '../constants/adConfig';

export const useTossInterstitialAd = () => {
  const showAd = (onNextAction: () => void) => {
    const isTossApp = /Toss/i.test(navigator.userAgent);
    let isDone = false;

    const handleNext = () => {
      if (isDone) return;
      isDone = true;
      onNextAction();
      if (unsubscribeLoad) unsubscribeLoad();
      if (unsubscribeShow) unsubscribeShow();
    };

    if (!isTossApp) {
      console.log('[Mock] 전면 배너 스킵 - 웹 환경');
      handleNext();
      return;
    }

    try {
      if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) {
        console.log('Interop is not supported. Skipping ad.');
        handleNext();
        return;
      }
    } catch(e) {
      handleNext();
      return;
    }

    let unsubscribeShow: (() => void) | undefined;
    let unsubscribeLoad: (() => void) | undefined;

    try {
      unsubscribeLoad = loadFullScreenAd({
        options: { adGroupId: AD_CONFIG.INTERSTITIAL },
        onEvent: (event: any) => {
          if (event.type === 'loaded') {
            try {
              unsubscribeShow = showFullScreenAd({
                options: { adGroupId: AD_CONFIG.INTERSTITIAL },
                onEvent: (showEvent: any) => {
                  if (showEvent.type === 'adClosed' || showEvent.type === 'adFailedToShow' || showEvent.type === 'dismissed') {
                    handleNext();
                  }
                },
                onError: (err: any) => {
                  console.error('Failed to show interstitial ad', err);
                  handleNext();
                }
              });
            } catch (err) {
              console.error('Show error catch', err);
              handleNext();
            }
          } else if (event.type === 'failedToLoad') {
            console.error('Failed to load interstitial ad');
            handleNext();
          }
        },
        onError: (err: any) => {
          console.error('Load error', err);
          handleNext();
        }
      });
    } catch (error) {
      console.error('interstitial ad error catch', error);
      handleNext();
    }
  };

  return { showAd };
};
