'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface VocalTranscriptDrawerProps {
  onTranscriptUpdate?: (transcript: string) => void;
}

export default function VocalTranscriptDrawer({ onTranscriptUpdate }: VocalTranscriptDrawerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript);
          if (onTranscriptUpdate) {
            onTranscriptUpdate(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            setError(`Microphone Notice: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (isListening) {
            try {
              recognition.start();
            } catch (e) {
              // Ignore restart error
            }
          }
        };

        recognitionRef.current = recognition;
      } else {
        setError('Web Speech API is not supported in this browser. You can type spoken thoughts manually.');
      }
    }
  }, [isListening, onTranscriptUpdate]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setError('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  return (
    <div className="bg-[#141413] border border-stone-800 rounded-2xl p-4 text-stone-200 font-sans space-y-3 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-850 pb-2.5">
        <div className="flex items-center gap-2">
          <Volume2 className={`w-4 h-4 ${isListening ? 'text-amber-500 animate-bounce' : 'text-stone-400'}`} />
          <h4 className="font-serif text-xs font-bold text-stone-200">Vocal Reasoning Transcript (Voice AI)</h4>
        </div>

        <button
          onClick={toggleListening}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-stone-800 hover:bg-stone-750 text-amber-400 border border-stone-700'
          }`}
        >
          {isListening ? (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Recording Voice...</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Start Voice Reasoning</span>
            </>
          )}
        </button>
      </div>

      {/* Error / Support Notice */}
      {error && (
        <div className="p-2 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Transcript Box */}
      <div className="bg-[#1A1A18] border border-stone-800 rounded-xl p-3 text-xs font-mono text-stone-300 min-h-[60px] max-h-24 overflow-y-auto leading-relaxed">
        {transcript.trim() ? (
          <p className="text-emerald-400 leading-snug">"{transcript.trim()}"</p>
        ) : (
          <span className="text-stone-500 italic text-[11px]">
            {isListening ? 'Speak aloud your thought process... (Voice AI transcribing in real-time)' : 'Click "Start Voice Reasoning" to record spoken solution thought process for AI assessment evaluation.'}
          </span>
        )}
      </div>
    </div>
  );
}
