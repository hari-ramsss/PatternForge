import { create } from 'zustand';

interface EditorState {
  code: string;
  language: string;
  isCompiling: boolean;
  verdict: any | null;
  editorRef: any | null;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  setCompiling: (isCompiling: boolean) => void;
  setVerdict: (verdict: any) => void;
  setEditorRef: (ref: any) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: '',
  language: 'python',
  isCompiling: false,
  verdict: null,
  editorRef: null,
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setCompiling: (isCompiling) => set({ isCompiling }),
  setVerdict: (verdict) => set({ verdict }),
  setEditorRef: (editorRef) => set({ editorRef }),
}));
