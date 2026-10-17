import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Languages, 
  Calendar, 
  GraduationCap, 
  Scale, 
  Briefcase, 
  Bookmark 
} from 'lucide-react';
import type { Lawyer } from '../types';
import { OralArgumentPlayer } from './OralArgumentPlayer';
import { soundEngine } from '../services/soundEngine';

interface LawyerDossierModalProps {
  lawyer: Lawyer | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestConsultation: (lawyer: Lawyer) => void;
  isShortlisted: boolean;
  onToggleShortlist: (lawyer: Lawyer) => void;
}

export const LawyerDossierModal: React.FC<LawyerDossierModalProps> = ({
  lawyer,
  isOpen,
  onClose,
  onRequestConsultation,
  isShortlisted,
  onToggleShortlist
}) => {
  if (!isOpen || !lawyer) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#0E0E0E] border border-[#C89B53]/35 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#C89B53] font-semibold">
              OFFICIAL COUNSEL DOSSIER · {lawyer.verifiedBar}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEngine.playSubtleTick();
                onToggleShortlist(lawyer);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                isShortlisted 
                  ? 'bg-[#C89B53] text-[#080808] font-bold' 
                  : 'glass-panel text-[#9E988F] hover:text-[#F3F0E8]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>{isShortlisted ? 'Shortlisted' : '+ Shortlist'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full glass-panel hover:bg-white/10 flex items-center justify-center text-[#9E988F] hover:text-[#F3F0E8] transition-colors cursor-pointer"
              aria-label="Close Dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          
          {/* Hero Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 relative rounded-2xl overflow-hidden aspect-[3/4] border border-white/10 shadow-2xl">
              <img
                src={lawyer.image}
                alt={lawyer.name}
                className="w-full h-full object-cover filter contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verified Public Standing
                </span>
              </div>
            </div>

            <div className="md:col-span-7 space-y-5">
              <div>
                <span className="font-mono text-xs text-[#C89B53] tracking-widest uppercase block mb-1">
                  {lawyer.chambersRating}
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif text-[#F3F0E8] font-medium leading-tight">
                  {lawyer.name}
                </h1>
                <p className="text-sm font-sans text-[#E2B873] mt-1">
                  {lawyer.title} · <span className="text-[#9E988F]">{lawyer.firm}</span>
                </p>
              </div>

              {/* Badges / Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                <div className="glass-panel p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[#66615B] font-mono uppercase block text-[10px]">Practice Area</span>
                  <span className="text-[#F3F0E8] font-medium">{lawyer.primaryCategory}</span>
                </div>
                <div className="glass-panel p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[#66615B] font-mono uppercase block text-[10px]">Trial Seniority</span>
                  <span className="text-[#F3F0E8] font-medium">{lawyer.yearsExperience} Years Practice</span>
                </div>
                <div className="glass-panel p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[#66615B] font-mono uppercase block text-[10px]">Primary Jurisdiction</span>
                  <span className="text-[#F3F0E8] font-medium">{lawyer.location}</span>
                </div>
                <div className="glass-panel p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[#66615B] font-mono uppercase block text-[10px]">Consultation Fee</span>
                  <span className="text-[#F3F0E8] font-medium">${lawyer.consultationRate} Strategy Session</span>
                </div>
              </div>

              {/* Spoken Languages */}
              <div className="flex items-center gap-2 text-xs font-sans text-[#9E988F]">
                <Languages className="w-4 h-4 text-[#C89B53]" />
                <span>Languages: <strong className="text-[#F3F0E8]">{lawyer.languages.join(', ')}</strong></span>
              </div>

              {/* Consultation Action */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onRequestConsultation(lawyer);
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#E2B873] text-[#080808] font-sans text-xs font-semibold tracking-wider hover:bg-[#F3F0E8] transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Request Private Consultation (${lawyer.consultationRate})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: "HEAR THEIR APPROACH" Signature Experience */}
          <div className="glass-panel-gold p-6 sm:p-8 rounded-3xl border border-[#C89B53]/40 space-y-4">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#E2B873] font-semibold block">
                ORAL ARGUMENT ARCHIVE
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#F3F0E8]">
                HEAR THEIR APPROACH.
              </h2>
              <p className="text-sm font-sans text-[#9E988F]">
                Before you decide who represents you, hear how they think.
              </p>
            </div>

            <OralArgumentPlayer
              lawyerId={lawyer.id}
              lawyerName={lawyer.name}
              transcript={lawyer.audioTranscript}
              duration={lawyer.audioDuration}
              compact={false}
            />
          </div>

          {/* Biography & Philosophy */}
          <div className="space-y-3">
            <h3 className="font-serif text-xl text-[#F3F0E8] border-b border-white/10 pb-2">
              Chambers Biography & Practice Philosophy
            </h3>
            <p className="text-sm font-sans text-[#C2BDB5] leading-relaxed">
              {lawyer.bio}
            </p>
          </div>

          {/* Notable Matters / Precedents */}
          <div className="space-y-3">
            <h3 className="font-serif text-xl text-[#F3F0E8] border-b border-white/10 pb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#C89B53]" />
              Notable Representative Matters
            </h3>
            <ul className="space-y-2.5">
              {lawyer.notableMatters.map((matter, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs font-sans text-[#C2BDB5] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C89B53] mt-1.5 flex-shrink-0" />
                  <span>{matter}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Admissions & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h4 className="font-serif text-lg text-[#F3F0E8] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#C89B53]" />
                Bar Admissions
              </h4>
              <ul className="space-y-1.5 text-xs font-mono text-[#9E988F]">
                {lawyer.admissions.map((adm, i) => (
                  <li key={i}>• {adm}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif text-lg text-[#F3F0E8] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#C89B53]" />
                Education & Honors
              </h4>
              <ul className="space-y-1.5 text-xs font-mono text-[#9E988F]">
                {lawyer.education.map((edu, i) => (
                  <li key={i}>• {edu}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 bg-[#121212] border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#9E988F]">
          <span>Verified against bar association registers (Demo Prototype)</span>
          <button
            onClick={onClose}
            className="text-[#E2B873] hover:underline cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
