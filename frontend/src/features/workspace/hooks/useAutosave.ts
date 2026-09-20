import { useEffect, useRef } from 'react';
import { useEditorStore } from '../useEditorStore';
import { saveLocalDraft, clearLocalDraft, getAllLocalDrafts } from '../../../utils/indexedDb';

export function useAutosave(problemId: string) {
  const code = useEditorStore((state) => state.code);
  const language = useEditorStore((state) => state.language);
  const setCode = useEditorStore((state) => state.setCode);

  const prevCodeRef = useRef(code);
  const prevLangRef = useRef(language);

  // Load initial draft on mount or language change
  useEffect(() => {
    const localKey = `draft:${problemId}:${language}`;
    const cached = localStorage.getItem(localKey);
    if (cached) {
      setCode(cached);
    }
  }, [problemId, language, setCode]);

  // Debounce local storage saving (2000ms of inactivity)
  useEffect(() => {
    if (!code) return;
    const handler = setTimeout(() => {
      const localKey = `draft:${problemId}:${language}`;
      localStorage.setItem(localKey, code);
    }, 2000);

    return () => clearTimeout(handler);
  }, [code, problemId, language]);

  // Track code and language in refs for background updates without restarting the interval
  useEffect(() => {
    prevCodeRef.current = code;
    prevLangRef.current = language;
  }, [code, language]);

  // Flush all offline drafts stored in IndexedDB to backend
  const flushLocalDraftsToBackend = async () => {
    try {
      const drafts = await getAllLocalDrafts();
      if (drafts.length === 0) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

      for (const draft of drafts) {
        const res = await fetch(`${apiUrl}/playground/autosave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            problemId: draft.problemId,
            language: draft.language,
            code: draft.code,
          }),
        });

        if (res.ok) {
          await clearLocalDraft(draft.problemId, draft.language);
        }
      }
    } catch (err) {
      console.error('Failed to flush offline drafts to backend:', err);
    }
  };

  useEffect(() => {
    const saveToBackend = async (currentCode: string, currentLang: string) => {
      if (!currentCode) return;
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!isOnline) {
        // Save to IndexedDB locally if offline
        await saveLocalDraft(problemId, currentLang, currentCode).catch((err) =>
          console.error('Failed to save draft to IndexedDB:', err)
        );
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiUrl}/playground/autosave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            problemId,
            language: currentLang,
            code: currentCode,
          }),
        });

        if (res.ok) {
          // Check if there are other pending local drafts to flush
          await flushLocalDraftsToBackend();
        } else {
          // Buffer locally if backend API returns non-200 status
          await saveLocalDraft(problemId, currentLang, currentCode).catch(() => {});
        }
      } catch (error) {
        // Buffer locally if network or request fails
        await saveLocalDraft(problemId, currentLang, currentCode).catch(() => {});
      }
    };

    const interval = setInterval(() => {
      saveToBackend(prevCodeRef.current, prevLangRef.current);
    }, 10000);

    // Watch online status to trigger flush
    const handleOnline = () => {
      flushLocalDraftsToBackend();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      // Run once on load to flush any leftover offline drafts
      flushLocalDraftsToBackend();
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
      // Flush draft on unmount
      saveToBackend(prevCodeRef.current, prevLangRef.current);
    };
  }, [problemId]);
}
