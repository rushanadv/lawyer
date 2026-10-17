import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Lawyer, IntakeFilters } from './types';
import { SAMPLE_LAWYERS } from './data/lawyers';
import { Navbar } from './components/Navbar';
import { GavelHero } from './components/GavelHero';
import { VerdictTransition } from './components/VerdictTransition';
import { LegalIntake } from './components/LegalIntake';
import { DecisionDesk } from './components/DecisionDesk';
import { HowItWorks } from './components/HowItWorks';
import { WhyPlatform } from './components/WhyPlatform';
import { ForProfessionals } from './components/ForProfessionals';
import { Footer } from './components/Footer';
import { ShortlistDrawer } from './components/ShortlistDrawer';
import { LawyerDossierModal } from './components/LawyerDossierModal';
import { ConsultationModal } from './components/ConsultationModal';
import { soundEngine } from './services/soundEngine';

export const App: React.FC = () => {
  // Intake Filter State
  const [filters, setFilters] = useState<IntakeFilters>({
    category: 'All',
    jurisdiction: 'All',
    consultationType: 'All',
    experienceTier: 'All',
    language: 'All'
  });

  // Shortlist State with Session Storage persistence
  const [shortlist, setShortlist] = useState<Lawyer[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('lex_shortlist');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Undo History Stack
  const [history, setHistory] = useState<{ action: 'shortlist' | 'skip'; lawyer: Lawyer }[]>([]);

  // Modals & Navigation
  const [isShortlistOpen, setIsShortlistOpen] = useState<boolean>(false);
  const [activeProfileLawyer, setActiveProfileLawyer] = useState<Lawyer | null>(null);
  const [consultationLawyer, setConsultationLawyer] = useState<Lawyer | null>(null);

  // Sync shortlist to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lex_shortlist', JSON.stringify(shortlist));
    }
  }, [shortlist]);

  // Filtered lawyers based on active intake
  const filteredLawyers = useMemo(() => {
    return SAMPLE_LAWYERS.filter((l) => {
      if (filters.category !== 'All' && l.primaryCategory !== filters.category) {
        return false;
      }
      if (filters.jurisdiction !== 'All' && !l.location.toLowerCase().includes(filters.jurisdiction.toLowerCase())) {
        return false;
      }
      if (filters.consultationType !== 'All') {
        if (filters.consultationType === 'Online Video' && l.consultationType === 'In-Person Chambers') {
          return false;
        }
        if (filters.consultationType === 'In-Person Chambers' && l.consultationType === 'Online Video') {
          return false;
        }
      }
      if (filters.experienceTier !== 'All') {
        const minExp = parseInt(filters.experienceTier, 10);
        if (l.yearsExperience < minExp) return false;
      }
      return true;
    });
  }, [filters]);

  // Actions
  const handleShortlist = useCallback((lawyer: Lawyer) => {
    setShortlist((prev) => {
      if (prev.some((item) => item.id === lawyer.id)) return prev;
      return [...prev, lawyer];
    });
    setHistory((prev) => [...prev, { action: 'shortlist', lawyer }]);
  }, []);

  const handleSkip = useCallback((lawyer: Lawyer) => {
    setHistory((prev) => [...prev, { action: 'skip', lawyer }]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));

    if (last.action === 'shortlist') {
      setShortlist((prev) => prev.filter((item) => item.id !== last.lawyer.id));
    }
  }, [history]);

  const handleToggleShortlistFromProfile = (lawyer: Lawyer) => {
    if (shortlist.some((item) => item.id === lawyer.id)) {
      setShortlist((prev) => prev.filter((item) => item.id !== lawyer.id));
    } else {
      handleShortlist(lawyer);
    }
  };

  const scrollToSection = (id: string) => {
    soundEngine.playSubtleTick();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#080808] text-[#F3F0E8] overflow-x-hidden">
      
      {/* Top Navigation */}
      <Navbar
        shortlistCount={shortlist.length}
        onOpenShortlist={() => setIsShortlistOpen(true)}
        onOpenIntake={() => scrollToSection('intake-section')}
      />

      <main>
        {/* 1. Gavel Verdict Cinematic Opening */}
        <GavelHero
          onExploreClick={() => scrollToSection('transition-section')}
        />

        {/* 2. The Verdict to Discovery Editorial Transition */}
        <VerdictTransition
          onProceedToIntake={() => scrollToSection('intake-section')}
        />

        {/* 3. Interactive Legal Intake ("WHAT BRINGS YOU HERE?") */}
        <LegalIntake
          filters={filters}
          onFilterChange={setFilters}
          onCompleteIntake={() => scrollToSection('decision-desk')}
          matchingCount={filteredLawyers.length}
        />

        {/* 4. The Editorial Decision Desk (3D Stack + Swipe Gestures + Oral Argument) */}
        <DecisionDesk
          lawyers={filteredLawyers}
          filters={filters}
          shortlist={shortlist}
          onShortlist={handleShortlist}
          onSkip={handleSkip}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          onOpenProfile={(lawyer) => setActiveProfileLawyer(lawyer)}
          onOpenShortlistModal={() => setIsShortlistOpen(true)}
          onOpenIntakeModal={() => scrollToSection('intake-section')}
        />

        {/* 5. How It Works */}
        <HowItWorks />

        {/* 6. Why This Platform */}
        <WhyPlatform />

        {/* 7. For Legal Professionals Admissions */}
        <ForProfessionals />
      </main>

      {/* 8. Footer with Ethics Notice and Disclaimers */}
      <Footer />

      {/* Modals & Overlays */}
      <ShortlistDrawer
        isOpen={isShortlistOpen}
        onClose={() => setIsShortlistOpen(false)}
        shortlist={shortlist}
        onRemove={(id) => setShortlist((prev) => prev.filter((item) => item.id !== id))}
        onOpenProfile={(lawyer) => setActiveProfileLawyer(lawyer)}
        onRequestConsultation={(lawyer) => setConsultationLawyer(lawyer)}
      />

      <LawyerDossierModal
        lawyer={activeProfileLawyer}
        isOpen={!!activeProfileLawyer}
        onClose={() => setActiveProfileLawyer(null)}
        onRequestConsultation={(lawyer) => setConsultationLawyer(lawyer)}
        isShortlisted={!!activeProfileLawyer && shortlist.some((item) => item.id === activeProfileLawyer.id)}
        onToggleShortlist={handleToggleShortlistFromProfile}
      />

      <ConsultationModal
        lawyer={consultationLawyer}
        isOpen={!!consultationLawyer}
        onClose={() => setConsultationLawyer(null)}
      />

    </div>
  );
};

export default App;
