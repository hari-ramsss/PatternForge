'use client';

import React, { useState } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';

interface AiGenerateSubtopicModalProps {
  isOpen: boolean;
  conceptTitle: string;
  onClose: () => void;
  onGenerateSubtopic: (focus: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD') => Promise<void>;
}

export const AiGenerateSubtopicModal: React.FC<AiGenerateSubtopicModalProps> = ({
  isOpen,
  conceptTitle,
  onClose,
  onGenerateSubtopic,
}) => {
  const [subtopicTitle, setSubtopicTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);
    try {
      await onGenerateSubtopic(subtopicTitle.trim(), difficulty);
      setSubtopicTitle('');
      onClose();
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'AI could not create a subtopic. Nothing was added.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-[#e8e1d3] bg-[#fffdf8] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eee7da] pb-3">
          <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-[#17263a]">
              Generate AI Subtopic for &ldquo;{conceptTitle}&rdquo;
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">What do you want to strengthen? <span className="font-normal text-slate-400">Optional AI guidance</span></label>
            <input
              type="text"
              value={subtopicTitle}
              onChange={(e) => setSubtopicTitle(e.target.value)}
              placeholder="Leave blank and AI will choose a missing focus"
              className="w-full rounded-xl border border-[#e4dbcf] bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-amber-500"
            />
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">Target Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    difficulty === diff
                      ? 'border-amber-400 bg-[#fff2d7] text-[#b76418]'
                      : 'border-[#e4dbcf] bg-white text-slate-500 hover:border-[#d8c9b5]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#f1ece3] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#e7dfd3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-200"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Subtopic</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiGenerateSubtopicModal;
