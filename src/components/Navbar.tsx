import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Bookmark, Sliders, Menu, X } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface NavbarProps {
  shortlistCount: number;
  onOpenShortlist: () => void;
  onOpenIntake: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  shortlistCount,
  onOpenShortlist,
  onOpenIntake
}) => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEngine.playSubtleTick();
    }
  };

  return (
    <nav 
      aria-label="Main Navigation"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#080808]/85 backdrop-blur-md border-b border-white/10 py-3.5 shadow-xl' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a 
          href="#verdict-hero" 
          className="flex items-center gap-2.5 group cursor-pointer"
          onClick={() => soundEngine.playSubtleTick()}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#C89B53] group-hover:scale-125 transition-transform" />
          <span className="font-display tracking-[0.25em] text-sm uppercase text-[#E2B873] font-bold">
            LEX VERA
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-mono text-[#9E988F]">
          <a href="#intake-section" className="hover:text-[#F3F0E8] transition-colors">
            Intake
          </a>
          <a href="#decision-desk" className="hover:text-[#F3F0E8] transition-colors">
            Decision Desk
          </a>
          <a href="#how-it-works" className="hover:text-[#F3F0E8] transition-colors">
            How It Works
          </a>
          <a href="#why-platform" className="hover:text-[#F3F0E8] transition-colors">
            Why Platform
          </a>
          <a href="#for-professionals" className="hover:text-[#F3F0E8] transition-colors">
            For Counsel
          </a>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          {/* Audio toggle button */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-full glass-pill hover:border-[#C89B53]/40 text-[#9E988F] hover:text-[#F3F0E8] transition-all cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#C89B53]" />}
          </button>

          {/* Calibrate Intake quick button */}
          <button
            onClick={onOpenIntake}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] hover:border-[#C89B53]/40 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#C89B53]" />
            <span>Calibrate</span>
          </button>

          {/* Shortlist Docket Button with badge */}
          <button
            onClick={onOpenShortlist}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] border border-[#C89B53]/40 text-[#F3F0E8] hover:bg-[#C89B53] hover:text-[#080808] transition-all cursor-pointer shadow-md text-xs font-mono group"
            title="View Shortlisted Counsel"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#C89B53] group-hover:text-[#080808] fill-current" />
            <span>Shortlist</span>
            <span className="w-5 h-5 rounded-full bg-[#C89B53] text-[#080808] group-hover:bg-[#080808] group-hover:text-[#E2B873] flex items-center justify-center font-bold text-[10px]">
              {shortlistCount}
            </span>
          </button>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full glass-pill text-[#9E988F] hover:text-[#F3F0E8] cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D0D0D] border-b border-white/10 px-6 py-6 space-y-4 animate-fade-in text-xs font-mono">
          <a 
            href="#intake-section" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#9E988F] hover:text-[#F3F0E8] py-1"
          >
            Intake Calibration
          </a>
          <a 
            href="#decision-desk" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#9E988F] hover:text-[#F3F0E8] py-1"
          >
            Decision Desk
          </a>
          <a 
            href="#how-it-works" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#9E988F] hover:text-[#F3F0E8] py-1"
          >
            How It Works
          </a>
          <a 
            href="#why-platform" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#9E988F] hover:text-[#F3F0E8] py-1"
          >
            Why LEX VERA
          </a>
          <a 
            href="#for-professionals" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#9E988F] hover:text-[#F3F0E8] py-1"
          >
            For Counsel Admissions
          </a>
        </div>
      )}
    </nav>
  );
};
