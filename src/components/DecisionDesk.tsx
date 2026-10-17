import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Bookmark, 
  RotateCcw, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Languages, 
  Filter, 
  Eye, 
  Scale, 
  Award 
} from 'lucide-react';
import type { Lawyer, IntakeFilters } from '../types';
import { OralArgumentPlayer } from './OralArgumentPlayer';
import { soundEngine } from '../services/soundEngine';

interface DecisionDeskProps {
  lawyers: Lawyer[];
  filters: IntakeFilters;
  shortlist: Lawyer[];
  onShortlist: (lawyer: Lawyer) => void;
  onSkip: (lawyer: Lawyer) => void;
  onUndo: () => void;
  canUndo: boolean;
  onOpenProfile: (lawyer: Lawyer) => void;
  onOpenShortlistModal: () => void;
  onOpenIntakeModal: () => void;
}

export const DecisionDesk: React.FC<DecisionDeskProps> = ({
  lawyers,
  filters,
  shortlist,
  onShortlist,
  onSkip,
  onUndo,
  canUndo,
  onOpenProfile,
  onOpenShortlistModal,
  onOpenIntakeModal
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [swipeExitDirection, setSwipeExitDirection] = useState<'left' | 'right' | null>(null);
  const [showSwipeFeedback, setShowSwipeFeedback] = useState<'shortlist' | 'skip' | null>(null);

  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const activeLawyer = lawyers[currentIndex];
  const nextLawyer1 = lawyers[currentIndex + 1];
  const nextLawyer2 = lawyers[currentIndex + 2];

  // Reset index if filtered set changes
  useEffect(() => {
    if (currentIndex >= lawyers.length && lawyers.length > 0) {
      setCurrentIndex(0);
    }
  }, [lawyers, currentIndex]);

  // Handle Shortlist action (Right)
  const handleShortlistAction = useCallback(() => {
    if (!activeLawyer) return;
    soundEngine.playShortlistChime();
    setSwipeExitDirection('right');
    setShowSwipeFeedback('shortlist');

    setTimeout(() => {
      onShortlist(activeLawyer);
      setCurrentIndex((prev) => prev + 1);
      setSwipeExitDirection(null);
      setShowSwipeFeedback(null);
      setDragOffset({ x: 0, y: 0 });
    }, 280);
  }, [activeLawyer, onShortlist]);

  // Handle Skip action (Left)
  const handleSkipAction = useCallback(() => {
    if (!activeLawyer) return;
    soundEngine.playSkipTone();
    setSwipeExitDirection('left');
    setShowSwipeFeedback('skip');

    setTimeout(() => {
      onSkip(activeLawyer);
      setCurrentIndex((prev) => prev + 1);
      setSwipeExitDirection(null);
      setShowSwipeFeedback(null);
      setDragOffset({ x: 0, y: 0 });
    }, 280);
  }, [activeLawyer, onSkip]);

  // Handle Undo
  const handleUndoAction = useCallback(() => {
    if (!canUndo) return;
    soundEngine.playSubtleTick();
    onUndo();
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, [canUndo, onUndo]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleShortlistAction();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkipAction();
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndoAction();
      } else if (e.key === 'Enter' && activeLawyer) {
        e.preventDefault();
        onOpenProfile(activeLawyer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleShortlistAction, handleSkipAction, handleUndoAction, activeLawyer, onOpenProfile]);

  // Pointer / Touch Gestures for Swiping
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    setDragOffset({ x: deltaX, y: deltaY });

    if (deltaX > 70) {
      setShowSwipeFeedback('shortlist');
    } else if (deltaX < -70) {
      setShowSwipeFeedback('skip');
    } else {
      setShowSwipeFeedback(null);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 120;
    if (dragOffset.x > threshold) {
      handleShortlistAction();
    } else if (dragOffset.x < -threshold) {
      handleSkipAction();
    } else {
      setDragOffset({ x: 0, y: 0 });
      setShowSwipeFeedback(null);
    }
  };

  // Subtle natural tilt (max 10 degrees)
  const rotation = Math.max(-10, Math.min(10, dragOffset.x * 0.035));
  const isShortlisted = activeLawyer && shortlist.some((item) => item.id === activeLawyer.id);

  return (
    <section 
      id="decision-desk"
      className="relative w-full min-h-screen py-20 px-4 sm:px-6 lg:px-12 bg-[#080808] border-b border-white/5 select-none overflow-hidden"
      aria-label="Editorial Decision Desk"
    >
      {/* Top Floating Utility Bar */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#C89B53]" />
          <span className="font-mono text-xs tracking-[0.25em] text-[#C89B53] uppercase font-semibold">
            EDITORIAL DECISION DESK
          </span>
          <span className="text-[#66615B] text-xs font-mono">
            ({lawyers.length - currentIndex} Counsel Remaining)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenIntakeModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] hover:border-[#C89B53]/40 transition-all cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-[#C89B53]" />
            <span>Filter Criteria: {filters.category === 'All' ? 'All Specialties' : filters.category}</span>
          </button>

          <button
            onClick={onOpenShortlistModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] border border-[#C89B53]/40 text-[#F3F0E8] hover:bg-[#C89B53] hover:text-[#080808] transition-all cursor-pointer text-xs font-mono"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#C89B53] fill-current" />
            <span>Shortlist ({shortlist.length})</span>
          </button>
        </div>
      </div>

      {/* Main Large-Format Presentation Stage */}
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="relative w-full max-w-5xl min-h-[640px] flex items-center justify-center perspective-1000">
          
          {activeLawyer ? (
            <>
              {/* Card 3 (deepest background layer) */}
              {nextLawyer2 && (
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden glass-panel border border-white/5 opacity-30 pointer-events-none transition-transform duration-300 hidden md:block"
                  style={{
                    transform: 'translateY(24px) scale(0.92)',
                    zIndex: 1
                  }}
                />
              )}

              {/* Card 2 (middle background layer) */}
              {nextLawyer1 && (
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden glass-panel border border-white/10 opacity-60 pointer-events-none transition-transform duration-300 hidden sm:block"
                  style={{
                    transform: 'translateY(12px) scale(0.96)',
                    zIndex: 2
                  }}
                />
              )}

              {/* ACTIVE LARGE-FORMAT LAWYER CARD (Dominant Viewing Area) */}
              <div
                ref={cardRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`relative w-full rounded-3xl overflow-hidden glass-panel-gold border transition-shadow cursor-grab active:cursor-grabbing preserve-3d select-none ${
                  isShortlisted ? 'ring-2 ring-[#C89B53]' : ''
                }`}
                style={{
                  zIndex: 10,
                  transform: swipeExitDirection === 'right'
                    ? 'translateX(130%) rotate(15deg)'
                    : swipeExitDirection === 'left'
                    ? 'translateX(-130%) rotate(-15deg)'
                    : `translate(${dragOffset.x}px, ${dragOffset.y * 0.25}px) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  touchAction: 'none'
                }}
              >
                {/* Swipe Direction Overlays */}
                {showSwipeFeedback === 'shortlist' && (
                  <div className="absolute top-8 right-8 z-30 px-6 py-2.5 rounded-full bg-[#C89B53] text-[#080808] font-mono text-xs tracking-widest uppercase font-bold border-2 border-white shadow-2xl rotate-6 animate-pulse">
                    + SHORTLIST TO DOCKET
                  </div>
                )}

                {showSwipeFeedback === 'skip' && (
                  <div className="absolute top-8 left-8 z-30 px-6 py-2.5 rounded-full bg-[#320E16] text-[#E2B873] font-mono text-xs tracking-widest uppercase font-bold border-2 border-[#E2B873]/50 shadow-2xl -rotate-6 animate-pulse">
                    — BYPASS COUNSEL
                  </div>
                )}

                {/* Card Interior: Responsive Editorial Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] bg-[#121212]">
                  
                  {/* Left: Dominant Editorial Portrait (5 cols) */}
                  <div className="lg:col-span-5 relative overflow-hidden min-h-[360px] lg:min-h-full bg-[#0a0a0a]">
                    <img
                      src={activeLawyer.image}
                      alt={activeLawyer.name}
                      className="w-full h-full object-cover filter contrast-[1.06]"
                      draggable={false}
                    />

                    {/* Gradient shading */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80 lg:hidden" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#121212] hidden lg:block opacity-60" />

                    {/* Badges on image */}
                    <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-20">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-[11px] font-mono text-[#E2B873] border border-[#C89B53]/30">
                        <Scale className="w-3 h-3 text-[#C89B53]" />
                        {activeLawyer.primaryCategory}
                      </span>

                      <div className="flex items-center gap-1 px-3 py-1 rounded-full glass-panel text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Standing</span>
                      </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5 z-20 hidden lg:block">
                      <div className="p-3 rounded-xl bg-[#080808]/85 backdrop-blur-md border border-white/5 text-[11px] font-mono text-[#9E988F]">
                        <span>Bar Registry: {activeLawyer.verifiedBar}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Comprehensive Counsel Dossier & Audio Player (7 cols) */}
                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    
                    <div className="space-y-4">
                      {/* Chambers Ranking & Firm */}
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#C89B53]" />
                        <span className="font-mono text-xs text-[#C89B53] tracking-widest uppercase font-semibold">
                          {activeLawyer.chambersRating}
                        </span>
                      </div>

                      {/* Oversized Editorial Name */}
                      <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F3F0E8] font-medium leading-[1.1]">
                        {activeLawyer.name}
                      </h3>

                      <p className="text-sm font-sans text-[#E2B873]">
                        {activeLawyer.title} · <span className="text-[#9E988F]">{activeLawyer.firm}</span>
                      </p>

                      {/* Secondary Metadata Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-sans text-[#9E988F]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#C89B53] flex-shrink-0" />
                          <span className="truncate">{activeLawyer.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#C89B53] flex-shrink-0" />
                          <span>{activeLawyer.yearsExperience} Yrs Experience</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4 text-[#C89B53] flex-shrink-0" />
                          <span className="truncate">{activeLawyer.languages.join(', ')}</span>
                        </div>
                      </div>

                      {/* Practice Specialties Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeLawyer.specialties.map((spec) => (
                          <span
                            key={spec}
                            className="px-2.5 py-1 rounded-md bg-[#1C1C1C] border border-white/5 text-[11px] text-[#D4CFC7] font-sans"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>

                      {/* Brief Bio Extract */}
                      <p className="text-xs sm:text-sm font-sans text-[#C2BDB5] leading-relaxed line-clamp-2">
                        {activeLawyer.bio}
                      </p>
                    </div>

                    {/* Integrated Signature Feature: 15s Oral Argument Player */}
                    <div className="no-drag pt-2">
                      <OralArgumentPlayer
                        lawyerId={activeLawyer.id}
                        lawyerName={activeLawyer.name}
                        transcript={activeLawyer.audioTranscript}
                        duration={activeLawyer.audioDuration}
                        compact={false}
                      />
                    </div>

                    {/* Rates & Dossier Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono">
                      <div className="text-[#9E988F]">
                        Strategy Session: <span className="text-[#F3F0E8] font-bold text-sm">${activeLawyer.consultationRate}</span>
                      </div>

                      <button
                        onClick={() => onOpenProfile(activeLawyer)}
                        className="flex items-center gap-1.5 text-[#C89B53] hover:text-[#E2B873] transition-colors cursor-pointer font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Full Chambers Dossier &rarr;</span>
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            </>
          ) : (
            /* Empty Docket State */
            <div className="w-full glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-4 max-w-lg">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#C89B53]/20 flex items-center justify-center text-[#C89B53]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-3xl text-[#F3F0E8]">
                Review Docket Complete
              </h3>
              <p className="text-sm font-sans text-[#9E988F] max-w-sm mx-auto leading-relaxed">
                You have evaluated all counsel matching your intake parameters. Review your shortlist to compare track records and schedule.
              </p>
              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentIndex(0)}
                  className="px-6 py-3 rounded-full bg-[#F3F0E8] text-[#080808] font-sans text-xs font-semibold hover:bg-[#E2B873] transition-all cursor-pointer"
                >
                  Review Again
                </button>
                <button
                  onClick={onOpenShortlistModal}
                  className="px-6 py-3 rounded-full glass-panel-gold text-[#E2B873] font-sans text-xs font-semibold hover:bg-[#C89B53] hover:text-[#080808] transition-all cursor-pointer"
                >
                  View Shortlist ({shortlist.length})
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Tactile Bottom Controls Deck */}
        {activeLawyer && (
          <div className="mt-10 flex items-center gap-8">
            {/* Skip */}
            <button
              onClick={handleSkipAction}
              className="w-14 h-14 rounded-full glass-panel hover:bg-rose-950/40 hover:border-rose-500/50 text-[#9E988F] hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-lg group"
              title="Skip Counsel (or press ←)"
              aria-label="Skip counsel"
            >
              <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            {/* Undo */}
            <button
              onClick={handleUndoAction}
              disabled={!canUndo}
              className={`w-12 h-12 rounded-full glass-panel flex items-center justify-center transition-all cursor-pointer ${
                canUndo
                  ? 'text-[#9E988F] hover:text-[#F3F0E8] hover:border-[#C89B53]/40'
                  : 'opacity-30 cursor-not-allowed text-[#66615B]'
              }`}
              title="Undo decision (or Cmd+Z)"
              aria-label="Undo previous decision"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Shortlist */}
            <button
              onClick={handleShortlistAction}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#8E6D38] via-[#C89B53] to-[#E2B873] text-[#080808] flex items-center justify-center transition-all cursor-pointer shadow-xl shadow-[#C89B53]/25 hover:scale-105 group"
              title="Shortlist to review docket (or press →)"
              aria-label="Shortlist counsel"
            >
              <Bookmark className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
