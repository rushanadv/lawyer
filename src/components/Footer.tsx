import React from 'react';
import { Scale } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative w-full bg-[#050505] text-[#9E988F] pt-20 pb-12 px-6 lg:px-12 border-t border-white/5 font-sans">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#C89B53]" />
              <span className="font-display tracking-[0.25em] text-sm uppercase text-[#E2B873] font-bold">
                LEX VERA
              </span>
            </div>

            <p className="font-serif text-2xl text-[#F3F0E8] italic">
              "The verdict is yours."
            </p>

            <p className="text-xs text-[#9E988F] max-w-sm leading-relaxed">
              A bespoke legal discovery desk connecting individuals, founders, and enterprises to verified trial counsel, senior partners, and sovereign arbitrators.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[#C89B53] font-semibold block">
              Discovery
            </span>
            <ul className="space-y-2 text-xs">
              <li><a href="#verdict-hero" className="hover:text-[#F3F0E8] transition-colors">The Verdict</a></li>
              <li><a href="#intake-section" className="hover:text-[#F3F0E8] transition-colors">Calibrate Intake</a></li>
              <li><a href="#decision-desk" className="hover:text-[#F3F0E8] transition-colors">Decision Desk</a></li>
              <li><a href="#how-it-works" className="hover:text-[#F3F0E8] transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* Practice Areas */}
          <div className="md:col-span-2 space-y-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[#C89B53] font-semibold block">
              Admitted Dockets
            </span>
            <ul className="space-y-2 text-xs">
              <li><span className="text-[#C2BDB5]">Commercial Chancery</span></li>
              <li><span className="text-[#C2BDB5]">White-Collar Criminal</span></li>
              <li><span className="text-[#C2BDB5]">Intellectual Property</span></li>
              <li><span className="text-[#C2BDB5]">International Arbitration</span></li>
            </ul>
          </div>

          {/* Compliance & Contact */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[#C89B53] font-semibold block">
              Compliance Office
            </span>
            <p className="text-xs text-[#9E988F] leading-relaxed">
              Lex Vera Platform LLC<br />
              One World Trade Center, Suite 8400<br />
              New York, NY 10007<br />
              intake@lexvera.legal
            </p>
          </div>

        </div>

        {/* Regulatory & Ethics Disclaimer Block */}
        <div className="p-6 rounded-2xl bg-[#090909] border border-white/5 space-y-3 text-[11px] leading-relaxed text-[#66615B]">
          <div className="flex items-center gap-2 text-[#C89B53]">
            <Scale className="w-4 h-4" />
            <span className="font-mono uppercase font-semibold text-[10px]">
              LEGAL PRACTICE & DEMONSTRATION NOTICE
            </span>
          </div>
          <p>
            LEX VERA is a legal technology discovery platform and is not a law firm, lawyer referral service, or prepaid legal services plan. Using LEX VERA or reviewing counsel profiles does not establish an attorney-client relationship. All profiles and credentials shown represent an interactive demonstration prototype. Any formal engagement requires direct execution of an engagement letter with respective counsel chambers.
          </p>
        </div>

        {/* Bottom copyright row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 text-xs font-mono text-[#66615B]">
          <div>
            © 2026 LEX VERA Platform LLC. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#verdict-hero" className="hover:text-[#F3F0E8] transition-colors">Privacy Policy</a>
            <a href="#verdict-hero" className="hover:text-[#F3F0E8] transition-colors">Terms of Adjudication</a>
            <a href="#verdict-hero" className="hover:text-[#F3F0E8] transition-colors">Accessibility (WCAG 2.1 AA)</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
