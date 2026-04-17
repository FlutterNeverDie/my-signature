import { useRef, useState, useEffect } from 'react';
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
import { preloadFonts } from './hooks/useSignaturePath';
import { TossBannerAd } from './components/common/TossBannerAd';
import { AD_CONFIG } from './constants/adConfig';

/** 다른 스타일 선택 피커 */
function RecommendFontButton({
  fonts, currentFontId, onSelect, disabled,
}: {
  fonts: { id: string; label: string }[];
  currentFontId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const others = fonts.filter((f) => f.id !== currentFontId);

  const handlePick = (id: string) => {
    setOpen(false);
    onSelect(id);
  };

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) {
        setTimeout(() => {
          if (!pickerRef.current) return;
          const scrollContainer = pickerRef.current.closest('.view-container');
          const bottomNav = scrollContainer?.querySelector('.bottom-fixed')
            ?? document.querySelector('.bottom-fixed');
          if (!scrollContainer || !bottomNav) return;

          const pickerBottom = pickerRef.current.getBoundingClientRect().bottom;
          const navTop = bottomNav.getBoundingClientRect().top;
          const overlap = pickerBottom - navTop + 12; // 12px 여유

          if (overlap > 0) {
            scrollContainer.scrollBy({ top: overlap, behavior: 'smooth' });
          }
        }, 50);
      }
      return next;
    });
  };

  return (
    <div style={{ width: '100%' }}>
      <button
        className="btn-recommend"
        onClick={handleToggle}
        disabled={disabled}
      >
        {disabled ? '광고 준비 중...' : '다른 스타일 확인하기'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="font-picker">
              {others.map((f) => (
                <button
                  key={f.id}
                  className="font-picker-item"
                  onClick={() => handlePick(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="font-picker-notice">광고 시청 후 선택한 스타일로 변경됩니다</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 한글 전용 입력 필터 */
const filterKor = (val: string) => val.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ0-9\s]/g, '');

/** 영문 전용 입력 필터 */
const filterEn = (val: string) => val.replace(/[^a-zA-Z0-9\s'-]/g, '');

const KOR_PRESETS = ['김', '이', '박'];
const EN_PRESETS = ['Lee', 'Kim', 'Park', 'James'];

function App() {
  const {
    language, name, fontId, isGenerated,
    setLanguage, setName, setFontId, generate, reset,
  } = useSignatureStore();
  const signatureRef = useRef<HTMLDivElement>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isIntro, setIsIntro] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { preload, showAd } = useTossInterstitialAd();

  const fonts = language === 'kor' ? KOR_FONTS : EN_FONTS;
  const placeholder = language === 'kor' ? '이름 또는 성 입력' : 'Name or Surname';
  const presets = language === 'kor' ? KOR_PRESETS : EN_PRESETS;
  const maxLen = language === 'kor' ? 4 : 15;

  // Input 화면 진입 시 광고 + 현재 언어 폰트 전체 미리 로드
  useEffect(() => {
    if (!isIntro && !isGenerated) {
      preload();
      const fontBase = language === 'kor' ? '/fonts/kor' : '/fonts/en';
      const urls = fonts.map((f) => `${fontBase}/${f.file}`);
      preloadFonts(urls);
    }
  }, [isIntro, isGenerated, preload, language, fonts]);

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

  const handlePresetClick = (val: string) => {
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
    setName(val);
  };

  const handleGenerate = () => {
    if (name.trim().length > 0) {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);

      // 전면광고 노출 후 결과 페이지로 전환합니다.
      setIsGenerating(true);
      showAd(() => {
        setIsGenerating(false);
        generate();
      });
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
                  autoCapitalize="none"
                  lang={language === 'en' ? 'en' : 'ko'}
                  placeholder={placeholder}
                  maxLength={maxLen}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
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

                <div className="preset-group">
                  {presets.map((p) => (
                    <button
                      key={p}
                      className="preset-chip"
                      onClick={() => handlePresetClick(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <p className="tip-text" style={{ marginTop: '4px' }}>
                  {language === 'kor'
                    ? '💡 성만 입력(예: 김, 이)하거나 이름(예 : 철수)만 넣으면 밸런스가 좋습니다.'
                    : '💡 성(예: Lee, Kim) 위주로 입력하시거나 짧은 닉네임을 사용하면 가장 예쁘게 완성됩니다.'}
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
                disabled={name.trim().length === 0 || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? '광고 준비 중...' : '생성하기'}
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
                  <div className="concept-badge">
                    앱인토스 - 내 싸인 만들기
                  </div>
                  <div className="signature-box">
                    <SignatureCanvas name={name} fontId={fontId} language={language} />
                  </div>
                </div>
              </div>

              {/* 추천 폰트 전환 (광고 시청 후 적용) */}
              <RecommendFontButton
                fonts={fonts}
                currentFontId={fontId}
                onSelect={(nextId) => {
                  setIsGenerating(true);
                  showAd(() => {
                    setFontId(nextId as FontId);
                    setIsGenerating(false);
                  });
                }}
                disabled={isGenerating}
              />

              <TossBannerAd adGroupId={AD_CONFIG.NATIVE_IMAGE} variant="card" />
            </div>

            <div className="bottom-fixed">
              <button className="btn-secondary" onClick={reset}>
                다시 만들기
              </button>
              <button className="btn-primary" onClick={handleSave}>
                공유하기
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
