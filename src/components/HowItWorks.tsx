import React from 'react';
import { Sliders, Headphones, Award } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Define your need.',
      icon: <Sliders className="w-6 h-6 text-[#C89B53]" />,
      desc: 'Bypass unstructured search queries. Calibrate your matter by jurisdiction, trial urgency, and specific specialty through precision intake parameters.'
    },
    {
      num: '02',
      title: 'Hear their approach.',
      icon: <Headphones className="w-6 h-6 text-[#C89B53]" />,
      desc: 'Listen to a dedicated 15-second oral argument from each partner. Evaluate strategic posture, courtroom composure, and temperament before retaining.'
    },
    {
      num: '03',
      title: 'Choose your counsel.',
      icon: <Award className="w-6 h-6 text-[#C89B53]" />,
      desc: 'Shortlist candidate attorneys into your private review docket. Compare fee structures and initiate privileged consultation bookings directly.'
    }
  ];

  return (
    <section 
      id="how-it-works"
      className="relative w-full py-28 px-6 lg:px-12 bg-[#080808] border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#C89B53] font-semibold block">
            THE EDITORIAL DISCOVERY METHOD
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#F3F0E8] tracking-tight">
            How LEX VERA Works
          </h2>
          <p className="text-sm md:text-base font-sans text-[#9E988F] leading-relaxed">
            Legal representation is fundamentally human. We replace opaque yellow-page style directories with an intimate, rigorous decision desk.
          </p>
        </div>

        {/* 3 Step Editorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="group glass-panel p-8 rounded-3xl border border-white/5 hover:border-[#C89B53]/30 transition-all duration-300 relative flex flex-col justify-between space-y-8"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/5 group-hover:border-[#C89B53]/40 transition-colors">
                    {step.icon}
                  </div>
                  <span className="font-mono text-2xl text-[#C89B53]/40 font-bold group-hover:text-[#C89B53] transition-colors">
                    {step.num}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="font-serif text-2xl text-[#F3F0E8] font-medium tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-sm font-sans text-[#9E988F] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center text-xs font-mono text-[#C89B53]">
                <span>Phase {step.num} of Protocol</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
