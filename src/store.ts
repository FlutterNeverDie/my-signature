import { create } from 'zustand';

export type Language = 'kor' | 'en';
export type KorFontId = 'samulnori' | 'haengbok' | 'shin' | 'younah';
export type EnFontId = 'dancing' | 'nickainley' | 'parisienne' | 'quentin';
export type FontId = KorFontId | EnFontId;

export interface FontOption {
  id: FontId;
  label: string;
  file: string; // public/fonts/{lang}/ 내 파일명
}

export const KOR_FONTS: FontOption[] = [
  { id: 'samulnori', label: '생동감',  file: 'CallifontSamulnori-Medium.ttf' }, // Lively
  { id: 'haengbok',  label: '따뜻한',  file: 'HaengbokGoheung.ttf' },           // Warm
  { id: 'shin',      label: '깔끔한',  file: 'SSShinRegular.ttf' },             // Clean
  { id: 'younah',    label: '감성적',  file: 'The_Tuesday_of_Younah.ttf' },     // Dreamy
];

export const EN_FONTS: FontOption[] = [
  { id: 'dancing',    label: '우아한',  file: 'DancingScript-VariableFont_wght.ttf' }, // Elegant
  { id: 'nickainley', label: '포근한',  file: 'Nickainley-Normal.otf' },               // Cozy
  { id: 'parisienne', label: '화려한',  file: 'Parisienne-Regular.ttf' },              // Fancy
  { id: 'quentin',    label: '강렬한',  file: 'Quentin.otf' },                         // Bold
];

interface SignatureState {
  language: Language;
  name: string;
  fontId: FontId;
  isGenerated: boolean;

  setLanguage: (lang: Language) => void;
  setName: (name: string) => void;
  setFontId: (fontId: FontId) => void;
  generate: () => void;
  reset: () => void;
}

export const useSignatureStore = create<SignatureState>((set) => ({
  language: 'en',
  name: '',
  fontId: 'dancing',
  isGenerated: false,

  // 언어 전환 시 이름·폰트 초기화
  setLanguage: (language) =>
    set({
      language,
      name: '',
      fontId: language === 'kor' ? 'samulnori' : 'dancing',
    }),

  setName: (name) => set({ name }),
  setFontId: (fontId) => set({ fontId }),
  generate: () => set({ isGenerated: true }),
  reset: () => set({ isGenerated: false }),
}));
