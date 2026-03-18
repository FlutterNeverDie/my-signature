import { useState, useEffect } from 'react';
import opentype from 'opentype.js';

// 폰트 파일 캐시 (같은 폰트 반복 로드 방지)
const fontCache = new Map<string, opentype.Font>();

async function loadFont(url: string): Promise<opentype.Font> {
  if (fontCache.has(url)) return fontCache.get(url)!;
  const font = await opentype.load(url);
  fontCache.set(url, font);
  return font;
}

export interface SignaturePathResult {
  pathData: string;
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * 이름(text)을 opentype.js로 파싱해 SVG path data를 반환한다.
 * viewBox 500x260 기준으로 글자를 중앙에 배치한다.
 */
export function useSignaturePath(
  text: string,
  fontUrl: string,
  fontSize = 160,
) {
  const [result, setResult] = useState<SignaturePathResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setResult(null);

    loadFont(fontUrl)
      .then((font) => {
        if (cancelled) return;

        // 1) 측정용 패스: 원점에서 그려서 bounding box 계산
        const measuredPath = font.getPath(text, 0, fontSize, fontSize);
        const bb = measuredPath.getBoundingBox();

        let w = bb.x2 - bb.x1;
        let h = bb.y2 - bb.y1;

        // 2) 텍스트가 너무 길면 fontSize를 자동으로 줄여서 맞춤
        //    좌우 여백 40px씩 확보 → 최대 허용 너비 = 420
        const MAX_WIDTH = 420;
        const MAX_HEIGHT = 200;
        let finalFontSize = fontSize;

        if (w > MAX_WIDTH || h > MAX_HEIGHT) {
          // 너비/높이 중 더 많이 초과하는 쪽 기준으로 스케일 계산
          const scaleByW = MAX_WIDTH / w;
          const scaleByH = MAX_HEIGHT / h;
          const scale = Math.min(scaleByW, scaleByH);
          finalFontSize = Math.floor(fontSize * scale);

          // 조정된 폰트 크기로 다시 측정
          const rescaled = font.getPath(text, 0, finalFontSize, finalFontSize);
          const rbb = rescaled.getBoundingBox();
          w = rbb.x2 - rbb.x1;
          h = rbb.y2 - rbb.y1;
        }

        // 3) viewBox(500x260) 중앙 정렬 좌표 역산
        const measuredFinal = font.getPath(text, 0, finalFontSize, finalFontSize);
        const bbFinal = measuredFinal.getBoundingBox();
        const startXFinal = (500 - (bbFinal.x2 - bbFinal.x1)) / 2 - bbFinal.x1;
        const baselineY = finalFontSize + ((260 - (bbFinal.y2 - bbFinal.y1)) / 2 - bbFinal.y1);

        // 4) 최종 위치로 패스 생성
        const centeredPath = font.getPath(text, startXFinal, baselineY, finalFontSize);

        if (cancelled) return;

        setResult({
          pathData: centeredPath.toPathData(2),
          naturalWidth: bbFinal.x2 - bbFinal.x1,
          naturalHeight: bbFinal.y2 - bbFinal.y1,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[useSignaturePath] Font load error:', err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [text, fontUrl, fontSize]);

  return { result, loading };
}
