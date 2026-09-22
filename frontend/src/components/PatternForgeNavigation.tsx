'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, BookOpen, BrainCircuit, Compass, Flag, Flame, LogOut, Menu, Sparkles, UserRound, X } from 'lucide-react';

interface PatternForgeNavigationProps {
  userName?: string;
  statusLabel: string;
  statusValue: string;
  totalXp?: number;
  streak?: { currentStreak: number; longestStreak: number; solvedToday: boolean; lastActiveDate: string | null } | null;
}

const primaryNavItems = [
  { id: 'journey', label: 'Journey', icon: Compass, path: '/dashboard' },
  { id: 'library', label: 'Pattern Library', icon: BookOpen, path: '/library' },
  { id: 'oa', label: 'Launch OA Arena', icon: Flag, path: '/interview-arena' },
  { id: 'mistakes', label: 'Insights', icon: BrainCircuit, path: '/mistakes' },
  { id: 'creator', label: 'AI Problem Creator', icon: Sparkles, path: '/dashboard/creator' },
];

export default function PatternForgeNavigation({ userName = 'Pattern learner', statusLabel, statusValue, totalXp, streak = null }: PatternForgeNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const navItems = primaryNavItems;
  const navigate = (path: string) => router.push(path);

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
    navigate(path);
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAccountOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsAccountOpen(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r-2 border-[#e8e1d3] bg-[#fffdf8] p-6 lg:flex">
        <div className="space-y-8">
          <motion.button type="button" onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.02 }} className="flex items-center gap-2.5 px-1 text-left">
            <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-b-4 border-orange-600/40 bg-gradient-to-tr from-orange-500 to-amber-300 text-white"><Flame className="h-5 w-5 fill-white" /></span>
            <span className="text-xl font-black tracking-tight text-[#17263a]">Pattern<span className="text-[#e67b1f]">Forge</span></span>
          </motion.button>
          <nav className="space-y-2.5" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button key={item.id} type="button" onClick={() => navigate(item.path)} aria-current={isActive ? 'page' : undefined} className={`relative z-10 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition-colors ${isActive ? 'text-[#9b5416]' : 'text-slate-500 hover:text-slate-800'}`}>
                  {isActive && <motion.span layoutId="activeNavPill" className="absolute inset-0 -z-10 rounded-2xl border-2 border-b-4 border-[#f0cd7a] bg-[#fff0c9]" transition={{ type: 'spring', stiffness: 450, damping: 32 }} />}
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#e67b1f]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="space-y-3.5">
          <div className="space-y-3 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-white p-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-slate-700"><span className="flex items-center gap-2"><Flame className="h-4 w-4 fill-amber-500 text-amber-500" />{streak?.currentStreak ?? 0} Day Streak</span><span className={`rounded-full border-2 px-2 py-0.5 font-mono text-[10px] font-bold ${streak?.solvedToday ? 'border-[#f6d89b] bg-[#fff1d5] text-[#c56a17]' : 'border-[#e8e1d3] bg-[#f8f5ed] text-slate-400'}`}>{streak?.solvedToday ? 'Active' : 'Solve one today'}</span></div>
            <div className="flex items-center justify-between border-t-2 border-[#eee7da] pt-2.5 text-xs text-slate-500"><span>{statusLabel}</span><span className="text-sm font-black text-[#d97717]">{totalXp !== undefined ? `${totalXp} XP` : statusValue}</span></div>
          </div>
          <div ref={accountRef} className="relative">
            <button type="button" onClick={() => setIsAccountOpen((open) => !open)} aria-expanded={isAccountOpen} aria-haspopup="menu" className="flex w-full items-center justify-between rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-white p-2.5 text-left transition hover:border-[#d9cba8]">
              <span className="flex min-w-0 items-center gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-b-4 border-amber-600/50 bg-gradient-to-tr from-amber-500 to-amber-300 text-xs font-black text-slate-950">{userName.charAt(0).toUpperCase()}</span><span className="max-w-[120px] truncate text-xs font-bold text-slate-700">{userName}</span></span><span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
            </button>
            <AccountMenu isOpen={isAccountOpen} userName={userName} onNavigate={handleNavigate} onSignOut={handleSignOut} />
          </div>
        </div>
      </aside>
      <div className="fixed inset-x-3 top-3 z-50 flex items-center justify-between rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8]/95 px-3 py-2 shadow-[0_10px_24px_rgba(23,38,58,0.12)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => handleNavigate('/dashboard')} className="flex items-center gap-2 text-left">
          <span className="grid h-8 w-8 place-items-center rounded-lg border-2 border-b-4 border-orange-600/40 bg-gradient-to-tr from-orange-500 to-amber-300 text-white"><Flame className="h-4 w-4 fill-white" /></span>
          <span className="text-base font-black tracking-tight text-[#17263a]">Pattern<span className="text-[#e67b1f]">Forge</span></span>
        </button>
        <button type="button" onClick={() => setIsMenuOpen((open) => !open)} aria-expanded={isMenuOpen} aria-controls="mobile-patternforge-menu" className="flex items-center gap-2 rounded-xl border-2 border-b-4 border-[#e8e1d3] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[#17263a] active:translate-y-[2px] active:border-b-2">
          {isMenuOpen ? <X className="h-4 w-4 text-[#e67b1f]" /> : <Menu className="h-4 w-4 text-[#e67b1f]" />}
          <span>{isMenuOpen ? 'Close' : 'Forge menu'}</span>
        </button>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav id="mobile-patternforge-menu" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="fixed inset-x-3 top-[4.75rem] z-50 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-3 shadow-[0_18px_40px_rgba(23,38,58,0.18)] lg:hidden" aria-label="Mobile navigation">
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Your practice route</p>
            <div className="grid gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return <button key={item.id} type="button" onClick={() => handleNavigate(item.path)} aria-current={isActive ? 'page' : undefined} className={`flex items-center justify-between rounded-2xl px-3 py-3 text-left text-xs font-extrabold uppercase tracking-wide ${isActive ? 'border-2 border-b-4 border-[#f0cd7a] bg-[#fff0c9] text-[#9b5416]' : 'text-slate-600 hover:bg-[#fff8e9]'}`}><span className="flex items-center gap-3"><Icon className={`h-5 w-5 ${isActive ? 'text-[#e67b1f]' : 'text-slate-400'}`} />{item.label}</span><span className="text-slate-300">→</span></button>;
              })}
            </div>
            <div className="mt-3 border-t-2 border-[#eee7da] pt-3">
              <button type="button" onClick={() => setIsAccountOpen((open) => !open)} aria-expanded={isAccountOpen} className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-700"><UserRound className="h-5 w-5 text-[#e67b1f]" /><span className="min-w-0 flex-1 truncate">{userName}</span><span className="text-[10px] text-slate-400">Account</span></button>
              {isAccountOpen && <AccountMenu isOpen userName={userName} onNavigate={handleNavigate} onSignOut={handleSignOut} mobile />}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

function AccountMenu({ isOpen, userName, onNavigate, onSignOut, mobile = false }: { isOpen: boolean; userName: string; onNavigate: (path: string) => void; onSignOut: () => void; mobile?: boolean }) {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`${mobile ? 'mt-2' : 'absolute bottom-[calc(100%+0.65rem)] left-0 right-0'} z-[60] overflow-hidden rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-1.5 shadow-[0_16px_35px_rgba(23,38,58,0.18)]`} role="menu">
      <div className="border-b-2 border-[#eee7da] px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Signed in as</p><p className="truncate text-xs font-bold text-[#17263a]">{userName}</p></div>
      <button type="button" role="menuitem" onClick={() => onNavigate('/dashboard')} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-[#fff0c9]"><UserRound className="h-4 w-4 text-[#e67b1f]" />My journey</button>
      <button type="button" role="menuitem" onClick={() => onSignOut()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-[#fff0c9]"><ArrowLeftRight className="h-4 w-4 text-[#e67b1f]" />Switch account</button>
      <button type="button" role="menuitem" onClick={() => onSignOut()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-red-700 hover:bg-red-50"><LogOut className="h-4 w-4" />Log out</button>
    </motion.div>
  );
}