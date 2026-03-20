/**
 * 토스 광고 2.0 (App-in-Toss) 광고 ID 관리
 * 
 * 개발 중에는 반드시 아래의 테스트 ID를 사용하고,
 * 실제 앱 디플로이 검수 전 토스 디벨로퍼 센터에서 발급 받은 실제 ID로 교체하세요.
 */

export const AD_CONFIG = {
  /**
   * 전면 광고: 페이지 전환용
   * 현재 사용처: 싸인 생성 버튼 클릭 시
   */
  INTERSTITIAL: 'ait-ad-test-interstitial-id',

  /**
   * 리스트형 배너: 하단 및 리스트 중간용 (높이 96px 권장)
   * 현재 사용처: 첫 화면 하단 고정 배너
   */
  BANNER: 'ait-ad-test-banner-id',

  /**
   * 피드형 배너: 이미지 강조형 배너 (높이 410px 권장)
   * 현재 사용처: 결과 화면 완성된 카드와 하단 버튼 사이
   */
  NATIVE_IMAGE: 'ait-ad-test-native-image-id',

  /**
   * 리워드 광고: 유저가 직접 시청하고 보상을 받는 구조
   * (현재 서명 앱에서는 쓰이지 않으나 가이드라인 참조 명목으로 보관)
   */
  REWARDED: 'ait-ad-test-rewarded-id',
};
