import React, { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework'; // 토스 공식 패키지
import { AD_CONFIG } from '../../constants/adConfig';

interface TossBannerAdProps {
  adGroupId: string;    // 파트너센터에서 발급받은 광고 ID
  height?: string;      // 배너 높이 (문구 띠 배너는 96px, 이미지 배너는 410px 이상)
  variant?: 'card' | 'expanded'; // 배너 스타일 (card: 테두리 있음, expanded: 꽉참)
}

export const TossBannerAd: React.FC<TossBannerAdProps> = ({ 
  adGroupId, 
  height, 
  variant = 'expanded' 
}) => {
  // 전달된 height가 없을 경우의 기본값 처리
  let resolvedHeight = height;
  if (!resolvedHeight) {
    if (variant === 'expanded') resolvedHeight = '96px';
    else if (adGroupId === AD_CONFIG.NATIVE_IMAGE) resolvedHeight = '410px';
    else resolvedHeight = '180px';
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isTossApp = /Toss/i.test(navigator.userAgent); // TossApp 또는 Toss

  // ① SDK 초기화
  useEffect(() => {
    if (!isTossApp) return;
    
    const globalAds = TossAds as any;
    
    // TossAds.initialize.isSupported() 지원 여부 확인 후 적용 (단, 레거시 호환되도록 try-catch)
    try {
      if (globalAds.initialize?.isSupported?.() || globalAds.initialize) {
        globalAds.initialize({
          callbacks: {
            onInitialized: () => setIsInitialized(true),
            onInitializationFailed: (error: any) => {
              console.error('Toss Ads 초기화 실패:', error);
              setIsInitialized(true); // Fallback: 실패해도 attach 시도할 수 있도록
            },
          },
        });
      } else {
        setIsInitialized(true);
      }
    } catch(e) {
      console.error('TossAds 초기화 중 예외:', e);
      setIsInitialized(true);
    }
  }, [isTossApp]);

  // ② 배너 부착 및 제거(Destroy)
  useEffect(() => {
    if (!isTossApp || !isInitialized || !containerRef.current) return;
    let banner: { destroy: () => void } | undefined;
    
    const globalAds = TossAds as any;
    const attachFn = globalAds.attachBanner || globalAds.attach;

    try {
      // 컴포넌트 div(containerRef) 영역에 광고 객체를 렌더링합니다.
      banner = attachFn?.(adGroupId, containerRef.current, {
        variant,
        theme: 'light', // 토스 가이드는 auto, 하지만 서명 앱 배경은흰색이라 light를 유지
      });
    } catch (error) {
      console.error('Toss Banner 부착 에러:', error);
    }

    // 💡 [매우 중요] 컴포넌트가 화면에서 사라질 때 반드시 destroy 호출! (안 하면 메모리 누수 발생)
    return () => {
      if (banner && typeof banner.destroy === 'function') {
        banner.destroy();
      } else {
        // 기존 대비책
        globalAds.destroyAll?.();
      }
    };
  }, [adGroupId, variant, isInitialized, isTossApp]);

  return (
    <div style={{ width: '100%', minHeight: resolvedHeight, background: 'transparent' }}>
      {/* 실제 광고가 렌더링 될 빈 컨테이너 (토스 내에서만 공간차지) */}
      {isTossApp && (
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%',
            marginTop: variant === 'expanded' ? 0 : 16,
            marginBottom: variant === 'expanded' ? 0 : 16,
          }} 
        />
      )}
      
      {/* 로컬 웹 개발용 가짜 UI (Toss 앱 외부일 때) */}
      {!isTossApp && (
        <div 
          style={{ 
            height: resolvedHeight, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '2px dashed #ccc',
            backgroundColor: '#F2F4F6',
            borderRadius: variant === 'card' ? '16px' : '0px',
            color: '#8B95A1',
            fontSize: '14px',
            fontWeight: 600,
            marginTop: variant === 'expanded' ? 0 : 16,
            marginBottom: variant === 'expanded' ? 0 : 16,
          }}
        >
          <div style={{ fontSize: '12px', color: '#B0B8C1', marginBottom: '4px' }}>[AD PLACEHOLDER]</div>
          {adGroupId === AD_CONFIG.BANNER ? '하단 띠 배너 영역' : 
           adGroupId === AD_CONFIG.NATIVE_IMAGE ? '이미지 강조형 배너 영역' : `[광고 영역: ${adGroupId}]`}
          <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 'normal' }}>
            ({resolvedHeight})
          </div>
        </div>
      )}
    </div>
  );
};
