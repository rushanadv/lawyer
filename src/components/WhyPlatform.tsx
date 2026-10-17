import React from 'react';
import { ShieldCheck, UserCheck, Ear, Scale } from 'lucide-react';

export const WhyPlatform: React.FC = () => {
  const pillars = [
    {
      title: 'Human Temperament Over Paper Credentials',
      icon: <Ear className="w-5 h-5 text-[#C89B53]" />,
      description: 'Resumes cannot convey how a barrister cross-examines a hostile witness or speaks to a sovereign tribunal. Our 15-second oral argument captures trial cadence and clarity of thought.'
    },
    {
      title: 'Public Record & Bar Verification',
      icon: <ShieldCheck className="w-5 h-5 text-[#C89B53]" />,
      description: 'Every displayed attorney profile is cross-referenced with public bar association standing and jurisdictional admissions. We do not permit self-awarded endorsements.'
    },
    {
      title: 'Editorial Selection, Not Pay-to-Rank',
      icon: <Scale className="w-5 h-5 text-[#C89B53]" />,
      description: 'Law firms cannot purchase sponsored priority in the discovery stack. Matches are determined strictly by your calibrated jurisdiction, matter category, and strategic requirements.'
    },
    {
      title: 'Discreet, Encrypted Adjudication',
      icon: <UserCheck className="w-5 h-5 text-[#C89B53]" />,
      description: 'Your search journey remains completely anonymous and client-side contained until you explicitly choose to dispatch a confidential consultation intake.'
    }
  ];

  return (
    <section 
      id="why-platform"
      className="relative w-full py-28 px-6 lg:px-12 bg-[#0A0A0A] border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#C89B53] font-semibold block">
              THE EDITORIAL VERDICT
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#F3F0E8] tracking-tight">
              Why LEX VERA
            </h2>
          </div>
          <p className="text-sm md:text-base font-sans text-[#9E988F] max-w-md leading-relaxed">
            A standard legal directory offers hundreds of indistinguishable bios. We offer an editorial decision desk built for discerning clients.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, idx) => (
            <div 
              key={idx}
              className="glass-panel p-8 rounded-3xl border border-white/5 space-y-4 hover:border-[#C89B53]/25 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#141414] border border-white/5">
                  {pillar.icon}
                </div>
                <h3 className="font-serif text-xl text-[#F3F0E8] font-medium">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-sm font-sans text-[#9E988F] leading-relaxed pl-1">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* Regulatory & Professional Conduct Statement */}
        <div className="p-6 rounded-2xl bg-[#111111] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-sans text-[#9E988F]">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-[#C89B53] font-semibold block">
              LEGAL ETHICS & PROFESSIONAL STANDARDS NOTICE
            </span>
            <p>
              Profiles, media transcripts, and public accolades are curated in strict compliance with state and national bar advertising guidelines. LEX VERA does not guarantee matter outcomes or provide legal advice.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
