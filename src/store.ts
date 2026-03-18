import { create } from 'zustand';

export type Concept = 'classic' | 'signature' | 'minimal' | 'handwriting' | 'bold';

interface SignatureState {
  name: string;
  concept: Concept;
  isGenerated: boolean;
  setName: (name: string) => void;
  setConcept: (concept: Concept) => void;
  generate: () => void;
  reset: () => void;
}

export const useSignatureStore = create<SignatureState>((set) => ({
  name: '',
  concept: 'signature',
  isGenerated: false,
  setName: (name) => set({ name: name.slice(0, 3) }),
  setConcept: (concept) => set({ concept }),
  generate: () => set({ isGenerated: true }),
  reset: () => set({ isGenerated: false }), // 이름은 유지하거나, 기획에 따라 초기화
}));
