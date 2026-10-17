import React from 'react';
import { Compass } from 'lucide-react';

interface VerdictTransitionProps {
  onProceedToIntake: () => void;
}

export const VerdictTransition: React.FC<VerdictTransitionProps> = ({ onProceedToIntake }) => {
  return (
    <section 
      id="transition-section"
      className="relative w-full py-28 md:py-36 bg-[#080808] overflow-hidden flex flex-col items-center justify-center text-center px-6 border-b border-[#C89B53]/15"
    >
      {/* Background radial gradient representing receding courtroom atmosphere */}
      <div className="absolute inset-0 bg-radial-court pointer-events-none opacity-60" />

      {/* Thin Bronze Expanding Horizontal Line */}
      <div className="relative w-full max-w-4xl my-8 flex items-center justify-center">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C89B53] to-transparent shadow-[0_0_12px_rgba(200,155,83,0.5)]" />
        
        {/* Central emblem on the bronze line */}
        <div className="absolute px-4 bg-[#080808] flex items-center gap-2">
          <div className="w-2 h-2 rotate-45 border border-[#E2B873] bg-[#080808]" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C89B53]">
            TRANSITION · ADJUDICATION TO ADVOCACY
          </span>
          <div className="w-2 h-2 rotate-45 border border-[#E2B873] bg-[#080808]" />
        </div>
      </div>

      {/* Editorial typography reveal */}
      <div className="max-w-3xl space-y-6 pt-4 relative z-10">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#F3F0E8] tracking-tight leading-tight">
          "Every case deserves the right voice.
          <span className="block italic text-gold-gradient font-normal mt-2">
            Let’s find yours."
          </span>
        </h2>

        <p className="text-[#9E988F] text-base md:text-lg font-sans max-w-xl mx-auto leading-relaxed">
          Move beyond transactional directories. Enter our editorial decision desk to hear the temperament, strategic instinct, and track record of peer-reviewed counsel.
        </p>

        <div className="pt-4 flex items-center justify-center gap-4">
          <button
            onClick={onProceedToIntake}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full glass-panel hover:glass-panel-gold text-xs font-mono tracking-widest uppercase text-[#E2B873] hover:text-[#F3F0E8] transition-all cursor-pointer group"
          >
            <Compass className="w-4 h-4 text-[#C89B53] group-hover:rotate-45 transition-transform" />
            <span>Calibrate Intake Filters</span>
          </button>
        </div>
      </div>
    </section>
  );
};
