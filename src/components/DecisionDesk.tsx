import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Bookmark, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Languages, 
  Filter, 
  Eye, 
  Scale 
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

  // Reset index if lawyers list changes drastically
  useEffect(() => {
    if (currentIndex >= lawyers.length && lawyers.length > 0) {
      setCurrentIndex(0);
    }
  }, [lawyers, currentIndex]);

  // Handle Shortlist action
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

  // Handle Skip action
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
    // Only drag from card header or image, avoid dragging inside audio scrubber
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

    if (deltaX > 60) {
      setShowSwipeFeedback('shortlist');
    } else if (deltaX < -60) {
      setShowSwipeFeedback('skip');
    } else {
      setShowSwipeFeedback(null);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 110;
    if (dragOffset.x > threshold) {
      handleShortlistAction();
    } else if (dragOffset.x < -threshold) {
      handleSkipAction();
    } else {
      // Spring back to center
      setDragOffset({ x: 0, y: 0 });
      setShowSwipeFeedback(null);
    }
  };

  const rotation = dragOffset.x * 0.045;
  const isShortlisted = activeLawyer && shortlist.some((item) => item.id === activeLawyer.id);

  return (
    <section 
      id="decision-desk"
      className="relative w-full min-h-[900px] py-16 px-4 sm:px-6 lg:px-12 bg-[#080808] border-b border-white/5 select-none"
      aria-label="Editorial Decision Desk"
    >
      {/* Editorial Section Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C89B53]" />
            <span className="font-mono text-xs tracking-[0.25em] text-[#C89B53] uppercase">
              EDITORIAL DECISION DESK
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#F3F0E8] tracking-tight">
            Review Counsel. Curate Your Docket.
          </h2>
          <p className="text-sm font-sans text-[#9E988F] max-w-xl">
            Swipe right or click Shortlist to add counsel to your confidential review docket. Swipe left to bypass.
          </p>
        </div>

        {/* Keyboard shortcut legend */}
        <div className="hidden lg:flex items-center gap-3 glass-pill px-4 py-2 rounded-full text-[11px] font-mono text-[#9E988F]">
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[#F3F0E8]">←</kbd> Skip</span>
          <span className="text-[#66615B]">·</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[#F3F0E8]">→</kbd> Shortlist</span>
          <span className="text-[#66615B]">·</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[#F3F0E8]">Enter</kbd> Dossier</span>
        </div>
      </div>

      {/* Main 3-Column Desk Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Active Intake Criteria & Jurisdictions (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C89B53] font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Active Docket Criteria
              </span>
              <button
                onClick={onOpenIntakeModal}
                className="text-[11px] font-mono text-[#9E988F] hover:text-[#E2B873] cursor-pointer"
              >
                Modify
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#66615B] font-mono uppercase block text-[10px]">Category</span>
                <span className="text-[#F3F0E8] font-medium">{filters.category === 'All' ? 'All Practice Areas' : filters.category}</span>
              </div>

              <div>
                <span className="text-[#66615B] font-mono uppercase block text-[10px]">Jurisdiction</span>
                <span className="text-[#F3F0E8] font-medium">{filters.jurisdiction === 'All' ? 'Global Admitted' : filters.jurisdiction}</span>
              </div>

              <div>
                <span className="text-[#66615B] font-mono uppercase block text-[10px]">Consultation</span>
                <span className="text-[#F3F0E8] font-medium">{filters.consultationType === 'All' ? 'Video or Chambers' : filters.consultationType}</span>
              </div>

              <div>
                <span className="text-[#66615B] font-mono uppercase block text-[10px]">Seniority</span>
                <span className="text-[#F3F0E8] font-medium">{filters.experienceTier === 'All' ? 'Senior Partners (15+ yrs)' : `${filters.experienceTier} Years`}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#9E988F]">In Review Docket:</span>
                <span className="text-[#E2B873] font-bold">{lawyers.length - currentIndex} Left</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 text-xs text-[#9E988F] space-y-2">
            <div className="flex items-center gap-2 text-[#E2B873] font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Chambers & Partners Grounded</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Every counsel featured has been independently evaluated against public bar standing, peer endorsements, and track record.
            </p>
          </div>
        </div>

        {/* CENTER COLUMN: Central 3D Stacked Lawyer Card (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-lg min-h-[640px] flex items-center justify-center perspective-1000">
            {activeLawyer ? (
              <>
                {/* 3rd Card in Stack (deepest) */}
                {nextLawyer2 && (
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden glass-panel border border-white/5 opacity-40 transition-transform duration-300 pointer-events-none"
                    style={{
                      transform: 'translateY(28px) scale(0.90)',
                      zIndex: 1
                    }}
                  >
                    <div className="w-full h-full bg-[#121212]/90 p-8 flex flex-col justify-end">
                      <span className="font-serif text-lg text-white/50">{nextLawyer2.name}</span>
                    </div>
                  </div>
                )}

                {/* 2nd Card in Stack (middle) */}
                {nextLawyer1 && (
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden glass-panel border border-white/10 opacity-70 transition-transform duration-300 pointer-events-none"
                    style={{
                      transform: 'translateY(14px) scale(0.95)',
                      zIndex: 2
                    }}
                  >
                    <div className="w-full h-full bg-[#141414]/95 p-8 flex flex-col justify-end">
                      <span className="font-serif text-xl text-white/70">{nextLawyer1.name}</span>
                    </div>
                  </div>
                )}

                {/* ACTIVE TOP CARD (Interactive Drag / Gesture Target) */}
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
                      ? 'translateX(120%) rotate(25deg)'
                      : swipeExitDirection === 'left'
                      ? 'translateX(-120%) rotate(-25deg)'
                      : `translate(${dragOffset.x}px, ${dragOffset.y * 0.3}px) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    touchAction: 'none'
                  }}
                >
                  {/* Dynamic Swipe Direction Badge Overlays */}
                  {showSwipeFeedback === 'shortlist' && (
                    <div className="absolute top-8 right-8 z-30 px-5 py-2 rounded-full bg-[#C89B53] text-[#080808] font-mono text-xs tracking-widest uppercase font-bold border-2 border-white shadow-2xl rotate-12 animate-pulse">
                      + SHORTLIST
                    </div>
                  )}

                  {showSwipeFeedback === 'skip' && (
                    <div className="absolute top-8 left-8 z-30 px-5 py-2 rounded-full bg-[#320E16] text-[#E2B873] font-mono text-xs tracking-widest uppercase font-bold border-2 border-[#E2B873]/50 shadow-2xl -rotate-12 animate-pulse">
                      — BYPASS
                    </div>
                  )}

                  {/* Card Visual Hero: Portrait + Overlay */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#101010]">
                    <img
                      src={activeLawyer.image}
                      alt={activeLawyer.name}
                      className="w-full h-full object-cover filter contrast-[1.05]"
                      draggable={false}
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-[11px] font-mono text-[#E2B873] border border-[#C89B53]/30">
                        <Scale className="w-3 h-3 text-[#C89B53]" />
                        {activeLawyer.primaryCategory}
                      </span>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Verified Bar</span>
                      </div>
                    </div>

                    {/* Bottom of Image: Name and Title */}
                    <div className="absolute bottom-4 left-6 right-6 z-20">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] text-[#C89B53] tracking-wider uppercase">
                          {activeLawyer.chambersRating}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl text-[#F3F0E8] font-medium leading-tight">
                        {activeLawyer.name}
                      </h3>
                      <p className="text-xs font-sans text-[#9E988F] mt-0.5">
                        {activeLawyer.title} · <span className="text-[#E2B873]">{activeLawyer.firm}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Body: Details & Audio Player */}
                  <div className="p-6 space-y-5 bg-[#141414]">
                    {/* Metadata chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-sans">
                      <div className="flex items-center gap-2 text-[#9E988F]">
                        <MapPin className="w-3.5 h-3.5 text-[#C89B53]" />
                        <span className="truncate">{activeLawyer.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#9E988F]">
                        <Clock className="w-3.5 h-3.5 text-[#C89B53]" />
                        <span>{activeLawyer.yearsExperience} Yrs Practice</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#9E988F]">
                        <Languages className="w-3.5 h-3.5 text-[#C89B53]" />
                        <span>{activeLawyer.languages.join(', ')}</span>
                      </div>
                    </div>

                    {/* Practice Specialties */}
                    <div className="flex flex-wrap gap-1.5">
                      {activeLawyer.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="px-2.5 py-1 rounded-md bg-[#1C1C1C] border border-white/5 text-[11px] text-[#D4CFC7] font-sans"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Integrated Signature Feature: Oral Argument 15s Audio Player */}
                    <div className="no-drag">
                      <OralArgumentPlayer
                        lawyerId={activeLawyer.id}
                        lawyerName={activeLawyer.name}
                        transcript={activeLawyer.audioTranscript}
                        duration={activeLawyer.audioDuration}
                        compact={true}
                      />
                    </div>

                    {/* Rate & Dossier View Link */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                      <div className="text-[#9E988F]">
                        Strategy Session: <span className="text-[#F3F0E8] font-bold">${activeLawyer.consultationRate}</span>
                      </div>

                      <button
                        onClick={() => onOpenProfile(activeLawyer)}
                        className="flex items-center gap-1.5 text-[#C89B53] hover:text-[#E2B873] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Full Dossier</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Empty Deck State */
              <div className="w-full glass-panel p-10 rounded-3xl border border-white/10 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C89B53]/20 flex items-center justify-center text-[#C89B53]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-[#F3F0E8]">
                  Docket Adjudicated
                </h3>
                <p className="text-sm font-sans text-[#9E988F] max-w-sm mx-auto">
                  You have reviewed all available counsel matching your current intake filters.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCurrentIndex(0)}
                    className="px-5 py-2.5 rounded-full bg-[#F3F0E8] text-[#080808] font-sans text-xs font-semibold hover:bg-[#E2B873] transition-all cursor-pointer"
                  >
                    Review Deck Again
                  </button>
                  <button
                    onClick={onOpenShortlistModal}
                    className="px-5 py-2.5 rounded-full glass-panel-gold text-[#E2B873] font-sans text-xs font-semibold hover:bg-[#C89B53] hover:text-[#080808] transition-all cursor-pointer"
                  >
                    Open Shortlist ({shortlist.length})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Tactile Action Deck Controls */}
          {activeLawyer && (
            <div className="mt-8 flex items-center gap-6">
              {/* Skip button */}
              <button
                onClick={handleSkipAction}
                className="w-14 h-14 rounded-full glass-panel hover:bg-rose-950/40 hover:border-rose-500/50 text-[#9E988F] hover:text-rose-400 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg group"
                title="Bypass counsel (or press ←)"
                aria-label="Skip counsel"
              >
                <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>

              {/* Undo button */}
              <button
                onClick={handleUndoAction}
                disabled={!canUndo}
                className={`w-11 h-11 rounded-full glass-panel flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  canUndo
                    ? 'text-[#9E988F] hover:text-[#F3F0E8] hover:border-[#C89B53]/40'
                    : 'opacity-30 cursor-not-allowed text-[#66615B]'
                }`}
                title="Undo previous decision"
                aria-label="Undo previous decision"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Shortlist button */}
              <button
                onClick={handleShortlistAction}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#8E6D38] via-[#C89B53] to-[#E2B873] text-[#080808] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl shadow-[#C89B53]/25 hover:scale-105 group"
                title="Shortlist counsel to review docket (or press →)"
                aria-label="Shortlist counsel"
              >
                <Bookmark className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Shortlist Docket Summary & Actions (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C89B53] font-semibold flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                Shortlist Docket ({shortlist.length})
              </span>
            </div>

            {shortlist.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {shortlist.map((counsel) => (
                    <div
                      key={counsel.id}
                      onClick={() => onOpenProfile(counsel)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-[#181818] hover:bg-[#202020] border border-white/5 hover:border-[#C89B53]/30 transition-all cursor-pointer group"
                    >
                      <img
                        src={counsel.image}
                        alt={counsel.name}
                        className="w-10 h-10 rounded-lg object-cover filter contrast-[1.05]"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xs text-[#F3F0E8] font-medium truncate group-hover:text-[#E2B873] transition-colors">
                          {counsel.name}
                        </h4>
                        <p className="text-[10px] font-sans text-[#9E988F] truncate">
                          {counsel.primaryCategory}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#66615B] group-hover:text-[#C89B53] transition-colors" />
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={onOpenShortlistModal}
                    className="w-full py-3 rounded-full bg-[#F3F0E8] text-[#080808] font-sans text-xs font-semibold tracking-wide hover:bg-[#E2B873] transition-all cursor-pointer shadow-lg"
                  >
                    Compare & Schedule Docket &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs font-sans text-[#9E988F]">
                  No counsel shortlisted yet. Swipe right on candidates that match your strategy.
                </p>
              </div>
            )}
          </div>

          {/* Platform Ethics Guarantee */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 text-xs text-[#9E988F] space-y-2">
            <span className="font-mono text-[10px] text-[#C89B53] uppercase block font-semibold">
              CONFIDENTIAL DISCOVERY
            </span>
            <p className="text-[11px] leading-relaxed">
              Interactions on the decision desk are client-side encrypted and fully anonymous until you explicitly authorize a consultation intake.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
