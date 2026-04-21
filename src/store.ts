import { create } from 'zustand';

export type Language = 'kor' | 'en';
export type KorFontId = 'samulnori' | 'haengbok' | 'shin';
export type EnFontId = 'dancing' | 'nickainley' | 'parisienne' | 'quentin';
export type FontId = KorFontId | EnFontId;

export interface FontOption {
  id: FontId;
  label: string;
  file: string; // public/fonts/{lang}/ 내 파일명
}

export const KOR_FONTS: FontOption[] = [
  { id: 'samulnori', label: '아이코닉', file: 'CallifontSamulnori-Medium.ttf' },
  { id: 'haengbok', label: '휴머니스트', file: 'HaengbokGoheung.ttf' },
  { id: 'shin', label: '프로페셔널', file: 'SSShinRegular.ttf' },
];

export const EN_FONTS: FontOption[] = [
  { id: 'quentin', label: 'CEO', file: 'Quentin.otf' },
  { id: 'dancing', label: 'Artist', file: 'DancingScript-VariableFont_wght.ttf' },
  { id: 'nickainley', label: 'Editor', file: 'Nickainley-Normal.otf' },
  { id: 'parisienne', label: 'Dreamer', file: 'Parisienne-Regular.ttf' },
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
  fontId: 'quentin',
  isGenerated: false,

  // 언어 전환 시 이름·폰트 초기화
  setLanguage: (language) =>
    set({
      language,
      name: '',
      fontId: language === 'kor' ? 'samulnori' : 'quentin',
    }),

  setName: (name) => set({ name }),
  setFontId: (fontId) => set({ fontId }),
  generate: () => set({ isGenerated: true }),
  reset: () => set({ isGenerated: false, name: '' }),
}));
