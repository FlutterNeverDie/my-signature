// opentype.js 에 대한 TypeScript 타입 선언
// @types/opentype.js가 없을 경우 임시 사용하는 선언 파일
declare module 'opentype.js' {
  interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  interface Path {
    commands: unknown[];
    fill: string | null;
    stroke: string | null;
    getBoundingBox(): BoundingBox;
    toPathData(decimalPlaces?: number): string;
    // translate는 일부 버전에서 미지원 — 사용 금지
  }

  interface Font {
    getPath(
      text: string,
      x: number,
      y: number,
      fontSize: number,
      options?: Record<string, unknown>,
    ): Path;
    getPaths(
      text: string,
      x: number,
      y: number,
      fontSize: number,
      options?: Record<string, unknown>,
    ): Path[];
  }

  function load(
    url: string,
    callback?: (err: Error | null, font: Font) => void,
  ): Promise<Font>;

  export { Font, Path, BoundingBox, load };
}
