import { motion, AnimatePresence } from 'framer-motion';

interface InfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoSheet({ isOpen, onClose }: InfoSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 어두운 배경 오버레이 */}
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* 하단에서 올라오는 바텀 시트 */}
          <motion.div
            className="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="sheet-header">
              <h3>앱 정보 및 라이선스</h3>
              <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="sheet-content">
              <p className="sheet-desc">
                본 서비스는 사용자 입력에 따라 다양한 시그니처 및 손글씨 스타일의 서명 이미지를 생성합니다.
              </p>

              <div className="license-group">
                <h4>사용된 한글 폰트</h4>
                <ul>
                  <li><strong>생동감</strong>: 캘리폰트 사물놀이체 (캘리폰트)</li>
                  <li><strong>따뜻한</strong>: 행복고흥체 (고흥군청)</li>
                  <li><strong>깔끔한</strong>: 상상신체 (상상폰트)</li>
                  <li><strong>감성적</strong>: 유나의 화요일</li>
                </ul>
              </div>

              <div className="license-group">
                <h4>사용된 영문 폰트</h4>
                <ul>
                  <li><strong>우아한</strong>: Dancing Script (OFL)</li>
                  <li><strong>포근한</strong>: Nickainley Normal (Freeware)</li>
                  <li><strong>화려한</strong>: Parisienne (OFL)</li>
                  <li><strong>강렬한</strong>: Quentin (Freeware)</li>
                </ul>
              </div>

              <p className="copyright-text">
                © {new Date().getFullYear()} Signature App. All rights reserved.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
