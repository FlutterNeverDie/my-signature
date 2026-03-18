import { useRef } from 'react';
import { useSignatureStore, type Concept } from './store';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';

const CONCEPTS: { id: Concept; label: string }[] = [
  { id: 'classic', label: '클래식' },
  { id: 'signature', label: '시그니처' },
  { id: 'minimal', label: '미니멀' },
  { id: 'handwriting', label: '핸드라이팅' },
  { id: 'bold', label: '볼드' },
];

function App() {
  const { name, concept, isGenerated, setName, setConcept, generate, reset } = useSignatureStore();
  const signatureRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    if (name.trim().length > 0) {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      generate();
    }
  };

  const handleSave = async () => {
    if (!signatureRef.current) return;
    try {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      const dataUrl = await toPng(signatureRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${name}_싸인.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  const getFontClass = (c: Concept) => `font-${c}`;
  const getFontSize = (c: Concept) => {
    switch (c) {
      case 'signature': return '72px';
      case 'handwriting': return '80px';
      case 'bold': return '56px';
      case 'classic': return '48px';
      case 'minimal': return '40px';
      default: return '48px';
    }
  };

  return (
    // layout이 height: 100%를 받아 전체 화면을 flex column으로 꽉 채움
    <div className="layout" style={{ height: '100%' }}>
      {/* AnimatePresence도 부모의 높이를 그대로 채워야 함 */}
      <AnimatePresence mode="wait" initial={false}>
        {!isGenerated ? (
          // view-container: flex: 1 + flex-direction: column → content-col은 늘어나고, bottom-fixed는 아래에 딱 붙음
          <motion.div
            key="input-view"
            className="view-container"
            style={{ height: '100%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 가운데 정렬 콘텐츠 영역 (flex: 1로 남은 공간 차지) */}
            <div className="content-col">
              <h1 className="title">내 싸인 만들기</h1>

              <div className="input-group">
                <input
                  className="name-input"
                  type="text"
                  placeholder="이름"
                  maxLength={4}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="tip-text">
                  💡 팁: 보통 성을 빼고 싸인을 많이 만들어요.<br />
                  성 없이 생성하려면 이름만(예: 길동) 입력해 주세요.
                </p>
              </div>

              <div className="concept-toggle">
                <div
                  className="toggle-indicator"
                  style={{
                    width: `${100 / CONCEPTS.length}%`,
                    left: `${(CONCEPTS.findIndex(c => c.id === concept) / CONCEPTS.length) * 100}%`
                  }}
                />
                {CONCEPTS.map((c) => (
                  <button
                    key={c.id}
                    className={`toggle-btn ${concept === c.id ? 'active' : ''}`}
                    onClick={() => setConcept(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 하단 버튼 (flex-shrink: 0 → 절대 화면 밖으로 밀리지 않음) */}
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
                <motion.div
                  className={`signature-text ${getFontClass(concept)}`}
                  style={{ fontSize: getFontSize(concept) }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {name}
                </motion.div>
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
