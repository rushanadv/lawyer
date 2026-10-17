import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Calendar, 
  Scale, 
  MapPin, 
  Clock, 
  Award 
} from 'lucide-react';
import type { Lawyer } from '../types';
import { OralArgumentPlayer } from './OralArgumentPlayer';
import { soundEngine } from '../services/soundEngine';

interface ShortlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shortlist: Lawyer[];
  onRemove: (lawyerId: string) => void;
  onOpenProfile: (lawyer: Lawyer) => void;
  onRequestConsultation: (lawyer: Lawyer) => void;
}

export const ShortlistDrawer: React.FC<ShortlistDrawerProps> = ({
  isOpen,
  onClose,
  shortlist,
  onRemove,
  onOpenProfile,
  onRequestConsultation
}) => {
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleComparisonSelect = (id: string) => {
    soundEngine.playSubtleTick();
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter(item => item !== id));
    } else {
      if (selectedForComparison.length < 3) {
        setSelectedForComparison([...selectedForComparison, id]);
      }
    }
  };

  const comparedLawyers = shortlist.filter(l => selectedForComparison.includes(l.id));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] bg-[#0E0E0E] border border-[#C89B53]/30 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-[#121212]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C89B53]" />
              <span className="font-mono text-xs tracking-[0.25em] text-[#C89B53] uppercase font-semibold">
                CONFIDENTIAL DOCKET
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#F3F0E8] tracking-tight">
              YOUR SHORTLIST ({shortlist.length})
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full glass-panel hover:bg-white/10 flex items-center justify-center text-[#9E988F] hover:text-[#F3F0E8] transition-colors cursor-pointer"
              aria-label="Close Shortlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {shortlist.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Scale className="w-12 h-12 mx-auto text-[#66615B]" />
              <h3 className="font-serif text-2xl text-[#F3F0E8]">Your Docket is Currently Empty</h3>
              <p className="text-sm font-sans text-[#9E988F] max-w-md mx-auto">
                Explore the Decision Desk and swipe right or click the shortlist button on counsel you wish to compare and retain.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-full bg-[#E2B873] text-[#080808] font-sans text-xs font-semibold hover:bg-[#F3F0E8] transition-all cursor-pointer"
              >
                Return to Decision Desk
              </button>
            </div>
          ) : (
            <>
              {/* Optional Side-by-Side Comparison Matrix if 2 or 3 selected */}
              {comparedLawyers.length >= 2 && (
                <div className="glass-panel p-6 rounded-2xl border border-[#C89B53]/40 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#E2B873]" />
                      <span className="font-mono text-xs uppercase tracking-wider text-[#E2B873] font-semibold">
                        Side-by-Side Comparison Matrix ({comparedLawyers.length})
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedForComparison([])}
                      className="text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] cursor-pointer"
                    >
                      Clear Matrix
                    </button>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-${comparedLawyers.length} gap-4`}>
                    {comparedLawyers.map((counsel) => (
                      <div key={counsel.id} className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={counsel.image} alt={counsel.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <h4 className="font-serif text-base text-[#F3F0E8]">{counsel.name}</h4>
                            <p className="text-[11px] font-sans text-[#9E988F]">{counsel.primaryCategory}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs font-sans text-[#C2BDB5] pt-2 border-t border-white/5">
                          <p><span className="text-[#66615B] font-mono">Experience:</span> {counsel.yearsExperience} Years</p>
                          <p><span className="text-[#66615B] font-mono">Strategy Rate:</span> ${counsel.consultationRate}</p>
                          <p><span className="text-[#66615B] font-mono">Bar:</span> {counsel.verifiedBar}</p>
                          <p><span className="text-[#66615B] font-mono">Location:</span> {counsel.location}</p>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onRequestConsultation(counsel);
                          }}
                          className="w-full py-2 rounded-lg bg-[#C89B53] text-[#080808] font-sans text-xs font-bold hover:bg-[#E2B873] transition-all cursor-pointer"
                        >
                          Request Consultation
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editorial Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shortlist.map((counsel) => {
                  const isCompared = selectedForComparison.includes(counsel.id);
                  return (
                    <div 
                      key={counsel.id}
                      className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-[#C89B53]/30 transition-all flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-4">
                        {/* Top Card Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={counsel.image}
                              alt={counsel.name}
                              className="w-14 h-14 rounded-2xl object-cover filter contrast-[1.05] border border-white/10"
                            />
                            <div>
                              <h3 className="font-serif text-lg text-[#F3F0E8] font-medium leading-tight">
                                {counsel.name}
                              </h3>
                              <p className="text-xs font-sans text-[#9E988F] mt-0.5">
                                {counsel.primaryCategory}
                              </p>
                              <span className="font-mono text-[10px] text-[#C89B53]">
                                {counsel.chambersRating}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              soundEngine.playSubtleTick();
                              onRemove(counsel.id);
                            }}
                            className="p-2 rounded-full hover:bg-rose-950/40 text-[#66615B] hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove from shortlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Location and Rates */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-sans text-[#9E988F] pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#C89B53]" />
                            <span className="truncate">{counsel.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#C89B53]" />
                            <span>{counsel.yearsExperience} Yrs Exp</span>
                          </div>
                        </div>

                        {/* Oral Argument Player */}
                        <div>
                          <OralArgumentPlayer
                            lawyerId={counsel.id}
                            lawyerName={counsel.name}
                            transcript={counsel.audioTranscript}
                            compact={true}
                          />
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <button
                            onClick={() => toggleComparisonSelect(counsel.id)}
                            className={`font-mono text-[11px] cursor-pointer ${
                              isCompared ? 'text-[#E2B873] font-bold' : 'text-[#9E988F] hover:text-[#F3F0E8]'
                            }`}
                          >
                            {isCompared ? '✓ Added to Matrix' : '+ Compare in Matrix'}
                          </button>

                          <button
                            onClick={() => {
                              onClose();
                              onOpenProfile(counsel);
                            }}
                            className="font-mono text-[11px] text-[#C89B53] hover:underline cursor-pointer"
                          >
                            View Dossier &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onRequestConsultation(counsel);
                          }}
                          className="w-full py-2.5 rounded-full bg-[#F3F0E8] text-[#080808] font-sans text-xs font-semibold hover:bg-[#E2B873] transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Request Consultation</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {shortlist.length > 0 && (
          <div className="px-8 py-4 bg-[#121212] border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#9E988F]">
            <span>Confidential intake encrypted via TLS 1.3</span>
            <button
              onClick={onClose}
              className="text-[#E2B873] hover:underline cursor-pointer"
            >
              Continue Reviewing Counsel &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
