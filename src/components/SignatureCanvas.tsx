import { motion } from 'framer-motion';
import { useId, useEffect, useRef, useState } from 'react';
import { type FontId, type Language, KOR_FONTS, EN_FONTS } from '../store';
import { useSignaturePath } from '../hooks/useSignaturePath';

interface SignatureCanvasProps {
  name: string;
  fontId: FontId;
  language: Language;
}

const FONT_BASE: Record<Language, string> = {
  kor: '/fonts/kor',
  en: '/fonts/en',
};

const WRITE_DURATION    = 2.0;                          // 획 그리기 시간 (초)
const FILL_DELAY_MS     = WRITE_DURATION * 0.8 * 1000; // 획 80% 시점에 fill 시작
const FILL_TRANSITION   = `opacity ${WRITE_DURATION * 0.35}s ease-in`;
const STROKE_TRANSITION = `stroke-dashoffset ${WRITE_DURATION}s cubic-bezier(0.2,0,0.5,1)`;
const GLOW_ANIMATION    = `sig-draw ${WRITE_DURATION}s cubic-bezier(0.2,0,0.5,1) forwards, sig-glow-fade ${WRITE_DURATION}s ease-in forwards`;

export function SignatureCanvas({ name, fontId, language }: SignatureCanvasProps) {
  const uid      = useId().replace(/:/g, '');
  const filterId = `ink-${uid}`;
  const blurId   = `blur-${uid}`;

  const fonts      = language === 'kor' ? KOR_FONTS : EN_FONTS;
  const fontOption = fonts.find((f) => f.id === fontId) ?? fonts[0];
  const fontUrl    = `${FONT_BASE[language]}/${fontOption.file}`;
  const fontSize   = language === 'en' ? 140 : 160;

  const { result, loading } = useSignaturePath(name, fontUrl, fontSize);

  const strokeRef  = useRef<SVGPathElement>(null);
  const [fillVisible, setFillVisible] = useState(false);

  const strokeWidth = language === 'en' ? 1.4 : 1.7;
  const rotation    = language === 'en' ? 'rotate(-10, 250, 130)' : 'rotate(-6, 250, 130)';

  useEffect(() => {
    if (!result || !strokeRef.current) return;

    setFillVisible(false);

    const el  = strokeRef.current;
    const len = el.getTotalLength();

    // 획을 완전히 숨긴 상태로 리셋
    el.style.transition      = 'none';
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    el.style.opacity         = '1';

    // 브라우저가 리셋 상태를 렌더링하도록 강제 reflow
    void el.getBoundingClientRect();

    // 획 그리기 시작 (CSS transition으로 dashoffset 0까지 이동)
    el.style.transition       = STROKE_TRANSITION;
    el.style.strokeDashoffset = '0';

    // 80% 시점: fill 등장 + stroke fade out
    const timer = setTimeout(() => {
      setFillVisible(true);
      el.style.transition = 'opacity 0.3s ease-in';
      el.style.opacity    = '0';
    }, FILL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [result]);

  return (
    <svg viewBox="0 0 500 260" width="100%" height="100%">
      <defs>
        <filter id={filterId} x="-4%" y="-12%" width="108%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="17" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={blurId} x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {loading && (
        <motion.text
          x="250" y="138"
          textAnchor="middle"
          fontSize="13"
          fill="#9CA3AF"
          fontFamily="system-ui"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          싸인 생성 중...
        </motion.text>
      )}

      {result && (
        <g transform={rotation}>
          {/* 글로우: result가 null→값으로 바뀔 때마다 언마운트→리마운트되므로 CSS animation 재시작 보장 */}
          <path
            d={result.pathData}
            fill="transparent"
            stroke="#4A90D9"
            strokeWidth={strokeWidth * 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${blurId})`}
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1,
              animation: GLOW_ANIMATION,
            }}
          />

          <g filter={`url(#${filterId})`}>
            {/* 획: ref로 getTotalLength() 사용해 CSS transition 직접 제어 */}
            <path
              ref={strokeRef}
              d={result.pathData}
              fill="transparent"
              stroke="#111827"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* fill: 획이 충분히 그려진 후 서서히 등장 */}
            <path
              d={result.pathData}
              stroke="none"
              fill="#111827"
              style={{
                opacity:    fillVisible ? 1 : 0,
                transition: fillVisible ? FILL_TRANSITION : 'none',
              }}
            />
          </g>
        </g>
      )}
    </svg>
  );
}
