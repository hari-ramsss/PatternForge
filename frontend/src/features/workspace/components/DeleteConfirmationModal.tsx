'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  problemTitle: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  problemTitle,
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#EFECE6] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-stone-800 font-sans relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">Confirm Problem Deletion</h3>
            <span className="text-[11px] font-mono text-rose-600 font-bold uppercase tracking-wider">Warning: Permanent Database Purge</span>
          </div>
        </div>

        {/* Body Description */}
        <div className="space-y-2 text-xs text-stone-600 leading-relaxed bg-[#FAF8F5] border border-stone-200/80 p-4 rounded-xl">
          <p className="font-bold text-stone-850">
            Are you 100% sure you want to delete <span className="text-amber-800 font-mono font-bold">"{problemTitle}"</span>?
          </p>
          <p className="text-[11px] text-stone-500">
            This action will permanently purge all test cases, starter code boilerplate, and execution records from PostgreSQL. You will need to regenerate this problem using AI afterwards.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 uppercase tracking-wider disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Problem</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
