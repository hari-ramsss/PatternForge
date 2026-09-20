'use client';

import React, { useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useEditorStore } from '../useEditorStore';

interface MonacoWrapperProps {
  theme?: 'light' | 'dark';
}

export default function MonacoWrapper({ theme = 'dark' }: MonacoWrapperProps) {
  const code = useEditorStore((state) => state.code);
  const language = useEditorStore((state) => state.language);
  const setCode = useEditorStore((state) => state.setCode);
  const setEditorRef = useEditorStore((state) => state.setEditorRef);

  useEffect(() => {
    // Dynamically update theme if it changes
    const monaco = (window as any).monaco;
    if (monaco) {
      monaco.editor.setTheme(theme === 'dark' ? 'calm-dev-dark' : 'calm-dev-light');
    }
  }, [theme]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    setEditorRef(editor);

    // Calm Dev Dark Theme
    monaco.editor.defineTheme('calm-dev-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6E6B64', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'EA580C', fontStyle: 'bold' },
        { token: 'string', foreground: '34D399' },
      ],
      colors: {
        'editor.background': '#1E1E1C',
        'editor.foreground': '#ECE9E2',
        'editor.lineHighlightBackground': '#232320',
        'editorCursor.foreground': '#F59E0B',
        'editor.selectionBackground': '#2F2F2B',
        'editorLineNumber.foreground': '#6E6B64',
        'editorLineNumber.activeForeground': '#ECE9E2',
      },
    });

    // Calm Dev Light Theme
    monaco.editor.defineTheme('calm-dev-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '9F9C94', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'D97706', fontStyle: 'bold' },
        { token: 'string', foreground: '10B981' },
      ],
      colors: {
        'editor.background': '#FBF9F6',
        'editor.foreground': '#1A1A1A',
        'editor.lineHighlightBackground': '#EFECE6',
        'editorCursor.foreground': '#D97706',
        'editor.selectionBackground': '#EFECE6',
        'editorLineNumber.foreground': '#9F9C94',
        'editorLineNumber.activeForeground': '#1A1A1A',
      },
    });

    monaco.editor.setTheme(theme === 'dark' ? 'calm-dev-dark' : 'calm-dev-light');
  };

  const mapLanguage = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
        return 'cpp';
      case 'javascript':
        return 'javascript';
      default:
        return 'python';
    }
  };

  return (
    <div className="w-full h-full border border-stone-800 rounded-xl overflow-hidden bg-stone-900">
      <Editor
        height="100%"
        language={mapLanguage(language)}
        value={code}
        onChange={(value) => setCode(value || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'Fira Code, JetBrains Mono, monospace',
          lineHeight: 22,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
