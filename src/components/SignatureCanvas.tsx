import { motion } from 'framer-motion';
import { useId } from 'react';
import { type FontId, type Language, KOR_FONTS, EN_FONTS } from '../store';
import { useSignaturePath } from '../hooks/useSignaturePath';

interface SignatureCanvasProps {
  name: string;
  fontId: FontId;
  language: Language;
}

// 언어별 폰트 폴더 경로
const FONT_BASE: Record<Language, string> = {
  kor: '/fonts/kor',
  en: '/fonts/en',
};

export function SignatureCanvas({ name, fontId, language }: SignatureCanvasProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = `ink-${uid}`;

  // 선택된 폰트 옵션
  const fonts = language === 'kor' ? KOR_FONTS : EN_FONTS;
  const fontOption = fonts.find((f) => f.id === fontId) ?? fonts[0];
  const fontUrl = `${FONT_BASE[language]}/${fontOption.file}`;

  // 영문 싸인은 조금 크게, 한글은 기본
  const fontSize = language === 'en' ? 140 : 160;

  const { result, loading } = useSignaturePath(name, fontUrl, fontSize);

  return (
    <svg viewBox="0 0 500 260" width="100%" height="100%">
      <defs>
        {/* 잉크 번짐 질감 */}
        <filter id={filterId} x="-4%" y="-12%" width="108%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            seed="17"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      {loading && (
        <text x="250" y="138" textAnchor="middle" fontSize="14" fill="#CCC" fontFamily="system-ui">
          렌더링 중…
        </text>
      )}

      {result && (
        // 영문은 기울기를 더 강하게 줘서 싸인 느낌 강조
        <g
          transform={language === 'en' ? 'rotate(-10, 250, 130)' : 'rotate(-6, 250, 130)'}
          filter={`url(#${filterId})`}
        >
          {/* 1단계: 외곽선 획으로 그리기 */}
          <motion.path
            key={`${name}-${fontId}-stroke`}
            d={result.pathData}
            fill="transparent"
            stroke="#111"
            strokeWidth={language === 'en' ? 1.0 : 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ pathLength: { duration: 0.7, ease: [0.35, 0, 0.25, 1] } }}
          />

          {/* 2단계: fill 채우기 (획 그리기 직후) */}
          <motion.path
            key={`${name}-${fontId}-fill`}
            d={result.pathData}
            stroke="none"
            fill="#111"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.2, ease: 'easeIn' }}
          />
        </g>
      )}
    </svg>
  );
}
