import React, { useState } from 'react';
import { Award, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

export const ForProfessionals: React.FC = () => {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [firmName, setFirmName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.includes('@') || !firmName) return;
    soundEngine.playShortlistChime();
    setSubmitted(true);
  };

  return (
    <section 
      id="for-professionals"
      className="relative w-full py-28 px-6 lg:px-12 bg-[#080808] border-b border-white/5"
    >
      <div className="max-w-5xl mx-auto glass-panel p-8 sm:p-14 rounded-3xl border border-[#C89B53]/30 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial-court opacity-50 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          
          <div className="md:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-[#C89B53]/30 text-xs font-mono text-[#E2B873]">
              <Award className="w-3.5 h-3.5 text-[#C89B53]" />
              <span>CHANCERY INVITATION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-serif text-[#F3F0E8] leading-tight">
              For Distinguished Advocates & Chambers
            </h2>

            <p className="text-sm font-sans text-[#9E988F] leading-relaxed">
              Admission to LEX VERA is by peer nomination or invitation only. We represent senior litigation partners, King’s Counsel, and boutique practices with verifiable standing.
            </p>

            <ul className="space-y-2.5 text-xs font-sans text-[#C2BDB5]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C89B53]" />
                <span>Recorded 15-second oral argument production assisted by our audio team</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C89B53]" />
                <span>Zero unsolicited spam; direct, high-value strategy inquiries only</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C89B53]" />
                <span>Rigorous compliance with Bar Advertising ethics and Model Rule 7.1</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-5">
            {submitted ? (
              <div className="p-6 rounded-2xl bg-[#141414] border border-[#C89B53]/40 text-center space-y-3 animate-fade-in">
                <ShieldCheck className="w-10 h-10 mx-auto text-[#E2B873]" />
                <h4 className="font-serif text-lg text-[#F3F0E8]">Nomination Under Review</h4>
                <p className="text-xs font-sans text-[#9E988F] leading-relaxed">
                  Thank you. Our admissions committee will review your public bar standing and reach out via encrypted correspondence.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#121212] border border-white/10 space-y-3.5">
                <h3 className="font-mono text-xs uppercase tracking-widest text-[#C89B53] font-semibold">
                  Express Admissions Interest
                </h3>

                <div>
                  <label className="text-[10px] font-mono text-[#66615B] uppercase block mb-1">Partner Email</label>
                  <input
                    type="email"
                    required
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="partner@chambers.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080808] border border-white/10 text-xs text-[#F3F0E8] outline-none focus:border-[#C89B53]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#66615B] uppercase block mb-1">Firm / Chambers Name</label>
                  <input
                    type="text"
                    required
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="e.g. Vance & Associates"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080808] border border-white/10 text-xs text-[#F3F0E8] outline-none focus:border-[#C89B53]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#66615B] uppercase block mb-1">Primary Jurisdiction</label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g. New York State / Middle Temple"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080808] border border-white/10 text-xs text-[#F3F0E8] outline-none focus:border-[#C89B53]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#E2B873] text-[#080808] font-sans text-xs font-semibold hover:bg-[#F3F0E8] transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>Submit for Peer Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
