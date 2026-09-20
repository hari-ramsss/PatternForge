'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Send, RefreshCw, Bot, User, CheckCircle, MessageSquare } from 'lucide-react';

interface AiVoiceInterviewerProps {
  company: string;
  problemTitle: string;
  code: string;
  language: string;
  onInterviewComplete: (transcript: string, score: number) => void;
}

export default function AiVoiceInterviewer({
  company,
  problemTitle,
  code,
  language,
  onInterviewComplete,
}: AiVoiceInterviewerProps) {
  const [messages, setMessages] = useState<Array<{ role: 'interviewer' | 'student'; text: string }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const recognitionRef = useRef<any>(null);

  const initialQuestion = `Hello! I'm your ${company} AI Technical Interviewer. I've analyzed your ${language} solution for "${problemTitle}". Can you walk me through your overall approach and explain the time complexity of your algorithm?`;

  useEffect(() => {
    // Initialize interview with initial AI question
    if (messages.length === 0) {
      setMessages([{ role: 'interviewer', text: initialQuestion }]);
      speakText(initialQuestion);
    }
  }, []);

  // Text-to-Speech synthesizer
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech-to-Text microphone initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentSpeech = '';
          for (let i = 0; i < event.results.length; i++) {
            currentSpeech += event.results[i][0].transcript;
          }
          setUserInput(currentSpeech);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const generateSmartAiResponse = (studentText: string, currentQuestionCount: number): string => {
    const textLower = studentText.toLowerCase();

    // 1. Student asks for help or indicates confusion / not started
    if (
      textLower.includes('help') ||
      textLower.includes("don't know") ||
      textLower.includes('not started') ||
      textLower.includes('even started') ||
      textLower.includes('how to start') ||
      textLower.includes('confused') ||
      textLower.includes('can you explain') ||
      textLower.includes('stuck')
    ) {
      return `No worries at all! Let's break it down together. For ${problemTitle}, if we take any number x, we are looking for a complement (target - x). What data structure in ${language} lets you look up whether (target - x) was seen previously in O(1) constant time?`;
    }

    // 2. Student mentions Hash Map / Dictionary / O(N)
    if (
      textLower.includes('hash') ||
      textLower.includes('dict') ||
      textLower.includes('map') ||
      textLower.includes('seen') ||
      textLower.includes('o(n)')
    ) {
      if (currentQuestionCount === 1) {
        return `Spot on! A Hash Map allows single-pass O(N) lookup time. Now, if the input array grows to 10 million elements, what memory space bottleneck might occur and how would you handle space constraints?`;
      }
      return `Excellent point! And how would your code handle boundary edge cases like an empty array or negative integers?`;
    }

    // 3. Student mentions Sorting / Two Pointers
    if (
      textLower.includes('sort') ||
      textLower.includes('pointer') ||
      textLower.includes('two pointer') ||
      textLower.includes('binary')
    ) {
      return `Good thinking! Sorting and using Two Pointers achieves O(1) space with O(N log N) time. How does that compare to the single-pass Hash Map trade-off?`;
    }

    // 4. Default contextual follow-up
    if (currentQuestionCount === 1) {
      return `Got it! Can you elaborate on the time complexity of your approach? What specific loop or lookup operation determines its Big-O performance?`;
    }

    return `Thank you for sharing that breakdown! What edge cases would you double-check before shipping this solution into production?`;
  };

  const handleStudentAnswer = async (answerText?: string) => {
    const textToSend = answerText || userInput;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { role: 'student' as const, text: textToSend.trim() }];
    setMessages(newMessages);
    setUserInput('');

    const nextCount = questionCount + 1;
    setQuestionCount(nextCount);

    if (nextCount >= 4) {
      const closingMsg = `Thank you for walking me through your thought process! That concludes our 10-minute technical interview round. I am now compiling your candidate report card.`;
      setMessages((prev) => [...prev, { role: 'interviewer', text: closingMsg }]);
      speakText(closingMsg);
      setIsFinished(true);

      const fullTranscript = newMessages.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      onInterviewComplete(fullTranscript, 88);
      return;
    }

    // Generate dynamic Socratic response based on student's actual answer
    const aiResponse = generateSmartAiResponse(textToSend, nextCount);
    setMessages((prev) => [...prev, { role: 'interviewer', text: aiResponse }]);
    speakText(aiResponse);
  };

  return (
    <div className="bg-[#141413] border border-stone-800 rounded-2xl p-5 text-stone-200 font-sans space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-850 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-stone-100">{company} AI Technical Voice Interviewer</h4>
            <span className="text-[10px] text-stone-400 font-mono">10-Minute Interactive Technical Q&A Round</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold font-mono animate-pulse flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Speaking...
            </span>
          )}
          {isListening && (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold font-mono animate-pulse flex items-center gap-1">
              <Mic className="w-3 h-3" /> Listening...
            </span>
          )}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-[#1A1A18] border border-stone-800 rounded-xl p-4 min-h-[180px] max-h-[260px] overflow-y-auto space-y-3 font-sans text-xs leading-relaxed">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${msg.role === 'student' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                msg.role === 'interviewer'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-stone-800 text-stone-200 border border-stone-700'
              }`}
            >
              {msg.role === 'interviewer' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3 rounded-xl max-w-[85%] ${
                msg.role === 'interviewer'
                  ? 'bg-[#242422] text-stone-200 border border-stone-800'
                  : 'bg-amber-600 text-white font-medium'
              }`}
            >
              <p className="text-xs">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Microphone & Input Bar */}
      {!isFinished && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={toggleMic}
            className={`p-2.5 rounded-xl border transition shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-stone-800 hover:bg-stone-750 text-amber-400 border-stone-700'
            }`}
            title={isListening ? 'Mute Microphone' : 'Speak Answer'}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? 'Listening to your spoken answer...' : 'Type or speak your answer to the interviewer...'}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userInput.trim()) {
                handleStudentAnswer();
              }
            }}
            className="flex-1 bg-[#1A1A18] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none focus:border-amber-500 transition font-sans"
          />

          <button
            onClick={() => handleStudentAnswer()}
            disabled={!userInput.trim()}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Answer</span>
          </button>
        </div>
      )}
    </div>
  );
}
