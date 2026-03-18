import { useRef } from 'react';
import {
  useSignatureStore,
  KOR_FONTS, EN_FONTS,
  type Language, type FontId,
} from './store';
import { toPng } from 'html-to-image';
import { AnimatePresence, motion } from 'framer-motion';
import { SignatureCanvas } from './components/SignatureCanvas';

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

  const fonts = language === 'kor' ? KOR_FONTS : EN_FONTS;
  const placeholder = language === 'kor' ? '이름' : '영문 이름';
  const maxLen = language === 'kor' ? 4 : 15;

  const handleNameChange = (raw: string) => {
    const filtered = language === 'kor' ? filterKor(raw) : filterEn(raw);
    setName(filtered.slice(0, maxLen));
  };

  const handleGenerate = () => {
    if (name.trim().length > 0) {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
      generate();
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
              <h1 className="title">내 싸인 만들기</h1>

              {/* ── 언어 선택 탭 (영문 / 한글 순서) ── */}
              <div className="lang-tab">
                {(['en', 'kor'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    className={`lang-tab-btn ${language === lang ? 'active' : ''}`}
                    onClick={() => setLanguage(lang)}
                  >
                    {lang === 'kor' ? '한글' : '영문'}
                  </button>
                ))}
              </div>

              {/* ── 이름 입력 ── */}
              <div className="input-group">
                <input
                  key={language} // 언어 바뀌면 input 리셋
                  className="name-input"
                  type="text"
                  placeholder={placeholder}
                  maxLength={maxLen}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                <p className="tip-text">
                  {language === 'kor'
                    ? '💡 성 없이 이름만(예: 상훈) 입력해 주세요.'
                    : '💡 영문 이름 또는 닉네임을 입력해 주세요. (예: Sanghoon)'}
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
            <div className="content-col">
              <h1 className="title">나만의 싸인 완성!</h1>

              <div className="signature-box" ref={signatureRef}>
                <SignatureCanvas
                  name={name}
                  fontId={fontId}
                  language={language}
                />
              </div>
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
    </div>
  );
}

export default App;
