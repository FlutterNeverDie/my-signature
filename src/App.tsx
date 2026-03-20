import { useRef, useState } from 'react';
import {
  useSignatureStore,
  KOR_FONTS, EN_FONTS,
  type Language, type FontId,
} from './store';
import { toPng } from 'html-to-image';
import { AnimatePresence, motion } from 'framer-motion';
import { PenTool, Zap, Sparkles } from 'lucide-react';
import { SignatureCanvas } from './components/SignatureCanvas';
import { InfoSheet } from './components/InfoSheet';
import { useTossInterstitialAd } from './hooks/useTossInterstitialAd';
import { TossBannerAd } from './components/common/TossBannerAd';
import { AD_CONFIG } from './constants/adConfig';

/** 한글 전용 입력 필터 */
const filterKor = (val: string) => val.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '');

/** 영문 전용 입력 필터 */
const filterEn = (val: string) => val.replace(/[^a-zA-Z\s'-]/g, '');

function App() {
  const {
    language, name, fontId, isGenerated,
    setLanguage, setName, setFontId, generate, reset,
  } = useSignatureStore();
  const signatureRef = useRef<HTMLDivElement>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isIntro, setIsIntro] = useState(true);
  const { showAd } = useTossInterstitialAd();

  const fonts = language === 'kor' ? KOR_FONTS : EN_FONTS;
  const placeholder = language === 'kor' ? '이름' : '영문 이름';
  const maxLen = language === 'kor' ? 4 : 15;

  const handleNameChange = (raw: string) => {
    const filtered = language === 'kor' ? filterKor(raw) : filterEn(raw);

    // 필터링 전후가 다르면 허용되지 않은 문자가 입력되었다는 뜻
    if (raw !== filtered) {
      setInputError(language === 'kor' ? '한글만 입력 가능합니다.' : '영문만 입력 가능합니다.');
    } else {
      setInputError(null);
    }

    setName(filtered.slice(0, maxLen));
  };

  const handleGenerate = () => {
    if (name.trim().length > 0) {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);

      // 1. 화면을 즉시 '결과 페이지'로 전환합니다.
      generate();

      // 2. 로컬 스토리지 애드 카운트 증가 및 체크
      const storedCount = parseInt(localStorage.getItem('SIGNATURE_AD_COUNT') || '0', 10);
      const newCount = storedCount + 1;
      localStorage.setItem('SIGNATURE_AD_COUNT', newCount.toString());

      // 3. 생성 시도 2번에 1번 꼴로 전면광고를 띄웁니다.
      if (newCount % 2 === 0) {
        showAd(() => {
          console.log(`전면광고 노출 완료 (현재 카운트: ${newCount})`);
        });
      }
    }
  };

  const handleSave = async () => {
    if (!signatureRef.current) return;
    try {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);

      // 1. 고화질 투명 배경으로 이미지 추출
      const dataUrl = await toPng(signatureRef.current, {
        cacheBust: false, // iOS 캐시 오류 방지
        pixelRatio: 3,
        backgroundColor: 'transparent',
        skipFonts: true,  // 💡 [핵심] iOS 웹뷰 CORS(오류: object Event) 방지용. 서명은 패스(Path)로 그려지므로 외부 폰트 다운로드가 필요없음.
      });

      // 2. 모바일 웹뷰/앱 환경 대응: Web Share API(네이티브 공유 창) 사용
      // (토스 인앱 등에서 a 태그 다운로드가 막히는 현상 우회)
      if (navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `${name}_싸인.png`, { type: blob.type });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${name}님의 싸인`,
            });
            return; // 성공 시 종료
          }
        } catch (shareErr) {
          console.warn('Share API Failed or Cancelled:', shareErr);
          // 취소하거나 에러가 나면 아래 Fallback(다운로드)으로 넘어갑니다.
        }
      }

      // 3. Fallback: 기존 PC 브라우저 다운로드 방식
      const link = document.createElement('a');
      link.download = `${name}_싸인.png`;
      link.href = dataUrl;
      link.click();

    } catch (err: any) {
      console.error(err);
      alert(`이미지 저장/공유에 실패했습니다.\r\n사유: ${err.message || String(err)}\r\n(네트워크 문제이거나 인앱 브라우저 보안 이슈일 수 있습니다.)`);
    }
  };

  return (
    <div className="layout" style={{ height: '100%' }}>
      <AnimatePresence mode="wait" initial={false}>
        {isIntro ? (
          <motion.div
            key="intro-view"
            className="view-container intro-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="content-col" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <motion.div
                className="intro-logo-box"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <img
                  src="/fonts/asset/intor.png"
                  alt="내 싸인 만들기 아이콘"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </motion.div>

              <motion.h1
                className="intro-title"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                내 싸인 만들기
              </motion.h1>

              <motion.p
                className="intro-subtitle"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                내 이름이 멋진 브랜드가 되는 마법<br />단 3초 만에 당신만의 프리미엄 서명을 만드세요.
              </motion.p>

              <motion.div
                className="intro-features"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="feature-item">
                  <div className="feature-icon bg-blue"><PenTool size={20} className="text-blue" /></div>
                  <div className="feature-text">
                    <strong>다양한 컨셉 폰트</strong>
                    <span>캘리그라피부터 정갈한 필기체까지</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon bg-purple"><Zap size={20} className="text-purple" /></div>
                  <div className="feature-text">
                    <strong>초고속 즉석 변환</strong>
                    <span>입력과 동시에 완성되는 마일스톤</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon bg-pink"><Sparkles size={20} className="text-pink" /></div>
                  <div className="feature-text">
                    <strong>고화질 투명 이미지</strong>
                    <span>어디서나 활용 가능한 배경 투명 PNG</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="bottom-fixed">
              <button
                className="btn-primary"
                onClick={() => setIsIntro(false)}
              >
                무료로 시작하기
              </button>
              <TossBannerAd adGroupId={AD_CONFIG.BANNER} variant="expanded" />
            </div>
          </motion.div>
        ) : !isGenerated ? (
          <motion.div
            key="input-view"
            className="view-container"
            style={{ height: '100%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="content-col">
              <div className="header-area">
                <h1 className="title">내 싸인 만들기</h1>
                <button className="info-btn" onClick={() => setIsInfoOpen(true)} title="앱 정보">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </button>
              </div>

              {/* ── 언어 선택 탭 (영문 / 한글 순서) ── */}
              <div className="lang-tab">
                {(['en', 'kor'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    className={`lang-tab-btn ${language === lang ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage(lang);
                      setInputError(null);
                    }}
                  >
                    {lang === 'kor' ? '한글' : '영문'}
                  </button>
                ))}
              </div>

              {/* ── 이름 입력 ── */}
              <div className="input-group">
                <input
                  key={language} // 언어 바뀌면 input 리셋
                  className={`name-input ${inputError ? 'error' : ''}`}
                  style={inputError ? { borderColor: '#F04438' } : {}}
                  type="text"
                  placeholder={placeholder}
                  maxLength={maxLen}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />

                {inputError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ color: '#F04438', fontSize: '13px', fontWeight: 600, margin: '2px 0 0 0' }}
                  >
                    {inputError}
                  </motion.p>
                )}

                <p className="tip-text" style={{ marginTop: '0px' }}>
                  {language === 'kor'
                    ? '💡 성 없이 이름만(예: 길동) 입력해 주세요.'
                    : '💡 영문 이름 또는 닉네임을 입력해 주세요. (예: Gil Dong)'}
                </p>
              </div>

              {/* ── 폰트 토글 ── */}
              <div className="concept-toggle">
                <div
                  className="toggle-indicator"
                  style={{
                    width: `${100 / fonts.length}%`,
                    left: `${(fonts.findIndex((f) => f.id === fontId) / fonts.length) * 100}%`,
                  }}
                />
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    className={`toggle-btn ${fontId === f.id ? 'active' : ''}`}
                    onClick={() => setFontId(f.id as FontId)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bottom-fixed">
              <button
                className="btn-primary"
                disabled={name.trim().length === 0}
                onClick={handleGenerate}
              >
                생성하기
              </button>
              <TossBannerAd adGroupId={AD_CONFIG.BANNER} variant="expanded" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result-view"
            className="view-container"
            style={{ height: '100%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="content-col" style={{ alignItems: 'center' }}>
              <h1 className="title" style={{ width: '100%', textAlign: 'left' }}>나만의 싸인 완성!</h1>

              <div className="result-area">
                <div className="signature-card" ref={signatureRef}>

                  {/* 컨셉 뱃지: 어떤 스타일로 만들어졌는지 표시 */}
                  <div className="concept-badge">
                    {fonts.find(f => f.id === fontId)?.label} 스타일
                  </div>

                  <div className="signature-box">
                    <SignatureCanvas name={name} fontId={fontId} language={language} />
                  </div>
                </div>
              </div>

              <TossBannerAd adGroupId={AD_CONFIG.NATIVE_IMAGE} variant="card" />
            </div>

            <div className="bottom-fixed">
              <button className="btn-primary" onClick={handleSave}>
                공유하기
              </button>
              <button className="btn-secondary" onClick={reset}>
                다시 만들기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <InfoSheet isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}

export default App;
