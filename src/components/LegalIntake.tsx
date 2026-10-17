import React, { useState } from 'react';
import { 
  Briefcase, 
  Scale, 
  ShieldAlert, 
  Cpu, 
  Users, 
  Building2, 
  UserCheck, 
  Check, 
  Sparkles, 
  SlidersHorizontal, 
  MapPin, 
  Clock, 
  Video 
} from 'lucide-react';
import type { LegalCategory, IntakeFilters } from '../types';
import { CATEGORIES_LIST, JURISDICTIONS_LIST } from '../data/lawyers';
import { soundEngine } from '../services/soundEngine';

interface LegalIntakeProps {
  filters: IntakeFilters;
  onFilterChange: (filters: IntakeFilters) => void;
  onCompleteIntake: () => void;
  matchingCount: number;
}

const CATEGORY_ICONS: Record<LegalCategory, React.ReactNode> = {
  'Business & Contracts': <Briefcase className="w-5 h-5 text-[#C89B53]" />,
  'Civil Disputes': <Scale className="w-5 h-5 text-[#C89B53]" />,
  'Criminal Defense': <ShieldAlert className="w-5 h-5 text-[#C89B53]" />,
  'Intellectual Property': <Cpu className="w-5 h-5 text-[#C89B53]" />,
  'Family & Matrimonial': <Users className="w-5 h-5 text-[#C89B53]" />,
  'Property & Real Estate': <Building2 className="w-5 h-5 text-[#C89B53]" />,
  'Employment & Labor': <UserCheck className="w-5 h-5 text-[#C89B53]" />
};

const CATEGORY_DESCRIPTIONS: Record<LegalCategory, string> = {
  'Business & Contracts': 'M&A disputes, shareholder actions, corporate governance & covenants',
  'Civil Disputes': 'Commercial arbitration, sovereign treaties & high-stakes trial advocacy',
  'Criminal Defense': 'Federal grand jury defense, SEC/DOJ inquiries & white-collar trials',
  'Intellectual Property': 'Patent infringement, proprietary algorithms, trade secrets & AI licensing',
  'Family & Matrimonial': 'High-net-worth marital dissolution, multi-jurisdiction trusts & estates',
  'Property & Real Estate': 'Commercial land use, urban entitlements, zoning & mezzanine covenants',
  'Employment & Labor': 'Executive compensation disputes, non-competes & whistleblower defense'
};

export const LegalIntake: React.FC<LegalIntakeProps> = ({
  filters,
  onFilterChange,
  onCompleteIntake,
  matchingCount
}) => {
  const [step, setStep] = useState<'category' | 'preferences'>('category');

  const handleSelectCategory = (cat: LegalCategory) => {
    soundEngine.playSubtleTick();
    onFilterChange({
      ...filters,
      category: filters.category === cat ? 'All' : cat
    });
  };

  const handleJurisdictionSelect = (jur: string) => {
    soundEngine.playSubtleTick();
    onFilterChange({
      ...filters,
      jurisdiction: jur === 'All Jurisdictions' ? 'All' : jur
    });
  };

  const handleConsultationType = (type: 'All' | 'Online Video' | 'In-Person Chambers') => {
    soundEngine.playSubtleTick();
    onFilterChange({ ...filters, consultationType: type });
  };

  const handleExperienceSelect = (tier: 'All' | '15+' | '20+' | '25+') => {
    soundEngine.playSubtleTick();
    onFilterChange({ ...filters, experienceTier: tier });
  };

  const handleReset = () => {
    soundEngine.playSubtleTick();
    onFilterChange({
      category: 'All',
      jurisdiction: 'All',
      consultationType: 'All',
      experienceTier: 'All',
      language: 'All'
    });
  };

  return (
    <section 
      id="intake-section"
      className="relative w-full max-w-6xl mx-auto px-6 py-20 z-20"
      aria-label="Interactive Legal Intake"
    >
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-[#C89B53]/30">
          <Sparkles className="w-3.5 h-3.5 text-[#E2B873]" />
          <span className="font-mono text-xs tracking-widest uppercase text-[#E2B873]">
            INTERACTIVE ADMISSION & INTAKE
          </span>
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-serif text-[#F3F0E8] tracking-tight">
          WHAT BRINGS YOU HERE?
        </h2>
        <p className="text-sm md:text-base font-sans text-[#9E988F] max-w-xl mx-auto">
          Specify the nature of your legal matter. Our decision desk will calibrate our docket to match your jurisdiction and strategic needs.
        </p>

        {/* Tab switcher: Category vs Preferences */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => { soundEngine.playSubtleTick(); setStep('category'); }}
            className={`px-5 py-2 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
              step === 'category'
                ? 'bg-[#C89B53] text-[#080808] font-bold shadow-lg shadow-[#C89B53]/20'
                : 'glass-panel text-[#9E988F] hover:text-[#F3F0E8]'
            }`}
          >
            1. Issue Category {filters.category !== 'All' ? `(${filters.category})` : ''}
          </button>
          <button
            onClick={() => { soundEngine.playSubtleTick(); setStep('preferences'); }}
            className={`px-5 py-2 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
              step === 'preferences'
                ? 'bg-[#C89B53] text-[#080808] font-bold shadow-lg shadow-[#C89B53]/20'
                : 'glass-panel text-[#9E988F] hover:text-[#F3F0E8]'
            }`}
          >
            2. Jurisdiction & Format
          </button>
        </div>
      </div>

      {/* Step 1: Category Selection Grid */}
      {step === 'category' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES_LIST.map((category) => {
              const isSelected = filters.category === category;
              return (
                <div
                  key={category}
                  onClick={() => handleSelectCategory(category)}
                  className={`group relative p-6 rounded-2xl transition-all duration-300 cursor-pointer border select-none ${
                    isSelected
                      ? 'glass-panel-gold border-[#C89B53] translate-y-[-2px]'
                      : 'glass-panel hover:border-[#C89B53]/40 hover:bg-[#181818]/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="p-3 rounded-xl bg-[#080808]/70 border border-white/5 group-hover:border-[#C89B53]/30 transition-colors">
                      {CATEGORY_ICONS[category]}
                    </div>
                    {isSelected ? (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#C89B53] text-[#080808]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full border border-white/10 group-hover:border-[#C89B53]/40 transition-colors" />
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-serif text-lg text-[#F3F0E8] font-medium tracking-wide">
                      {category}
                    </h3>
                    <p className="mt-1 text-xs text-[#9E988F] leading-relaxed">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="text-xs font-mono text-[#9E988F]">
              Showing <span className="text-[#E2B873] font-bold">{matchingCount}</span> available legal partners matching criteria
            </div>
            <div className="flex items-center gap-3">
              {filters.category !== 'All' && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
              <button
                onClick={() => {
                  soundEngine.playSubtleTick();
                  setStep('preferences');
                }}
                className="px-6 py-2.5 rounded-full bg-[#F3F0E8] text-[#080808] font-sans text-xs font-semibold tracking-wide hover:bg-[#E2B873] transition-all cursor-pointer"
              >
                Continue to Preferences &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preferences Calibration */}
      {step === 'preferences' && (
        <div className="space-y-8 animate-fade-in glass-panel p-8 rounded-3xl border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Preferred Jurisdiction / City */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#C89B53] uppercase">
                <MapPin className="w-3.5 h-3.5" />
                <span>Primary Jurisdiction</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {JURISDICTIONS_LIST.map((jur) => {
                  const isJurSelected = (jur === 'All Jurisdictions' && filters.jurisdiction === 'All') || filters.jurisdiction === jur;
                  return (
                    <button
                      key={jur}
                      onClick={() => handleJurisdictionSelect(jur)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                        isJurSelected
                          ? 'bg-[#C89B53] text-[#080808] font-semibold'
                          : 'glass-pill text-[#9E988F] hover:text-[#F3F0E8]'
                      }`}
                    >
                      {jur}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consultation Format */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#C89B53] uppercase">
                <Video className="w-3.5 h-3.5" />
                <span>Consultation Mode</span>
              </label>
              <div className="flex flex-col gap-2">
                {(['All', 'Online Video', 'In-Person Chambers'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleConsultationType(mode)}
                    className={`px-4 py-2 rounded-xl text-xs font-sans text-left transition-all cursor-pointer flex items-center justify-between ${
                      filters.consultationType === mode
                        ? 'bg-[#C89B53]/20 border border-[#C89B53] text-[#F3F0E8]'
                        : 'glass-pill text-[#9E988F] hover:text-[#F3F0E8]'
                    }`}
                  >
                    <span>{mode === 'All' ? 'Flexible / Either Format' : mode}</span>
                    {filters.consultationType === mode && <Check className="w-3.5 h-3.5 text-[#C89B53]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Seniority / Experience Preference */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#C89B53] uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>Partner Seniority</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(['All', '15+', '20+', '25+'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => handleExperienceSelect(tier)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      filters.experienceTier === tier
                        ? 'bg-[#C89B53] text-[#080808] font-bold'
                        : 'glass-pill text-[#9E988F] hover:text-[#F3F0E8]'
                    }`}
                  >
                    {tier === 'All' ? 'All Senior Partners' : `${tier} Years Practice`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
            <button
              onClick={() => { soundEngine.playSubtleTick(); setStep('category'); }}
              className="text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] cursor-pointer"
            >
              &larr; Back to Category Grid
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={handleReset}
                className="text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] cursor-pointer"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => {
                  soundEngine.playSubtleTick();
                  onCompleteIntake();
                }}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#E2B873] text-[#080808] font-sans text-xs font-semibold tracking-wider hover:bg-[#F3F0E8] transition-all cursor-pointer shadow-lg shadow-[#C89B53]/20"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Load Decision Desk ({matchingCount} Available)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
