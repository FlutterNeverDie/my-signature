import { useRef, useState } from 'react';
import {
  useSignatureStore,
  KOR_FONTS, EN_FONTS,
  type Language, type FontId,
} from './store';
import { toPng } from 'html-to-image';
import { AnimatePresence, motion } from 'framer-motion';
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
      
      // 2. 결과 페이지 진입과 동시에 그 위에 전면광고를 띄웁니다.
      // 전면광고가 닫힌 후 추가로 이동할 대상이 없으므로 빈 콜백을 전달합니다.
      showAd(() => {
        console.log('전면광고 노출 완료');
      });
    }
  };

  const handleSave = async () => {
    if (!signatureRef.current) return;
    try {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
      const dataUrl = await toPng(signatureRef.current, {
        cacheBust: true, pixelRatio: 3, backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `${name}_싸인.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  return (
    <div className="layout" style={{ height: '100%' }}>
      <AnimatePresence mode="wait" initial={false}>
        {!isGenerated ? (
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
                이미지 저장하기
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
