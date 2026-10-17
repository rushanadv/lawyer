import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck 
} from 'lucide-react';
import type { Lawyer } from '../types';
import { soundEngine } from '../services/soundEngine';

interface ConsultationModalProps {
  lawyer: Lawyer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  lawyer,
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    matterSummary: '',
    urgency: 'Standard (3-5 days)',
    preferredDate: '',
    consultationType: 'Online Video' as 'Online Video' | 'In-Person Chambers'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [referenceId, setReferenceId] = useState<string>('');

  if (!isOpen || !lawyer) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.clientName.trim()) {
      errs.clientName = 'Full legal name is required.';
    }
    if (!formData.clientEmail.trim() || !formData.clientEmail.includes('@')) {
      errs.clientEmail = 'A valid business or personal email is required.';
    }
    if (!formData.clientPhone.trim()) {
      errs.clientPhone = 'Telephone number is required for verification.';
    }
    if (!formData.matterSummary.trim() || formData.matterSummary.length < 20) {
      errs.matterSummary = 'Please provide at least 20 characters describing the nature of the matter.';
    }
    if (!formData.preferredDate) {
      errs.preferredDate = 'Please select a preferred initial consultation date.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      soundEngine.playSkipTone();
      return;
    }

    setIsSubmitting(true);
    soundEngine.playSubtleTick();

    // Simulate secure intake transmission
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedRef = `LV-${Math.floor(100000 + Math.random() * 900000)}`;
      setReferenceId(generatedRef);
      setBookingConfirmed(true);
      soundEngine.playShortlistChime();
    }, 900);
  };

  const handleReset = () => {
    setBookingConfirmed(false);
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      matterSummary: '',
      urgency: 'Standard (3-5 days)',
      preferredDate: '',
      consultationType: 'Online Video'
    });
    setErrors({});
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={handleReset}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0E0E0E] border border-[#C89B53]/35 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C89B53]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#C89B53] font-semibold">
              CONFIDENTIAL INTAKE PROTOCOL
            </span>
          </div>

          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-full glass-panel hover:bg-white/10 flex items-center justify-center text-[#9E988F] hover:text-[#F3F0E8] transition-colors cursor-pointer"
            aria-label="Close Intake"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[80vh]">
          {bookingConfirmed ? (
            /* Prototype Success Confirmation */
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#C89B53]/20 border border-[#C89B53]/40 font-mono text-xs text-[#E2B873]">
                  PROTOTYPE TRANSMISSION SUCCESSFUL
                </span>
                <h3 className="font-serif text-3xl text-[#F3F0E8]">
                  Consultation Request Dispatched
                </h3>
                <p className="text-sm font-sans text-[#9E988F] max-w-md mx-auto leading-relaxed">
                  Your encrypted briefing has been routed to the Chambers of <strong className="text-[#F3F0E8]">{lawyer.name}</strong>.
                </p>
              </div>

              {/* Reference ID card */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-md mx-auto text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#66615B]">Matter Dossier Ref:</span>
                  <span className="text-[#E2B873] font-bold">{referenceId}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#66615B]">Designated Counsel:</span>
                  <span className="text-[#F3F0E8]">{lawyer.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#66615B]">Requested Date:</span>
                  <span className="text-[#F3F0E8]">{formData.preferredDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66615B]">Format:</span>
                  <span className="text-[#F3F0E8]">{formData.consultationType}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 text-amber-200 text-xs font-sans max-w-md mx-auto leading-relaxed text-left">
                <strong>Important Notice:</strong> In accordance with legal ethics standards, this website operates as an interactive prototype demonstration. No binding attorney-client relationship is created until an official retainer agreement is executed.
              </div>

              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-full bg-[#F3F0E8] text-[#080808] font-sans text-xs font-semibold hover:bg-[#E2B873] transition-all cursor-pointer"
              >
                Return to Decision Desk
              </button>
            </div>
          ) : (
            /* Consultation Request Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lawyer banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl glass-panel border border-white/10">
                <img
                  src={lawyer.image}
                  alt={lawyer.name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg text-[#F3F0E8] font-medium leading-tight truncate">
                    {lawyer.name}
                  </h3>
                  <p className="text-xs font-sans text-[#9E988F]">
                    {lawyer.title} · <span className="text-[#E2B873]">${lawyer.consultationRate} Strategy Session</span>
                  </p>
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#9E988F] uppercase">Full Legal Name *</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="e.g. Katherine Sterling"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 focus:border-[#C89B53] outline-none text-xs text-[#F3F0E8] transition-colors"
                  />
                  {errors.clientName && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                      <AlertCircle className="w-3 h-3" /> {errors.clientName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#9E988F] uppercase">Confidential Email *</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="ksterling@enterprise.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 focus:border-[#C89B53] outline-none text-xs text-[#F3F0E8] transition-colors"
                  />
                  {errors.clientEmail && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                      <AlertCircle className="w-3 h-3" /> {errors.clientEmail}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#9E988F] uppercase">Direct Phone *</label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="+1 (212) 555-0198"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 focus:border-[#C89B53] outline-none text-xs text-[#F3F0E8] transition-colors"
                  />
                  {errors.clientPhone && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                      <AlertCircle className="w-3 h-3" /> {errors.clientPhone}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#9E988F] uppercase">Preferred Date *</label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 focus:border-[#C89B53] outline-none text-xs text-[#F3F0E8] transition-colors"
                  />
                  {errors.preferredDate && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                      <AlertCircle className="w-3 h-3" /> {errors.preferredDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Consultation Format & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#9E988F] uppercase">Consultation Format</label>
                  <select
                    value={formData.consultationType}
                    onChange={(e) => setFormData({ ...formData, consultationType: e.target.value as 'Online Video' | 'In-Person Chambers' })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 focus:border-[#C89B53] outline-none text-xs text-[#F3F0E8] transition-colors"
                  >
                    <option value="Online Video">Confidential Video Session (Zoom/Teams)</option>
                    <option value="In-Person Chambers">In-Person at Counsel Chambers</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#9E988F] uppercase">Case Urgency</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 focus:border-[#C89B53] outline-none text-xs text-[#F3F0E8] transition-colors"
                  >
                    <option value="Standard (3-5 days)">Standard (3-5 Business Days)</option>
                    <option value="Urgent (24-48 hours)">Urgent (24-48 Hours)</option>
                    <option value="Immediate Emergency">Immediate Emergency Response</option>
                  </select>
                </div>
              </div>

              {/* Matter Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#9E988F] uppercase">Summary of Matter & Objectives *</label>
                <textarea
                  rows={4}
                  value={formData.matterSummary}
                  onChange={(e) => setFormData({ ...formData, matterSummary: e.target.value })}
                  placeholder="Provide an overview of the legal context, primary counterparties, jurisdictional scope, and desired strategic outcome..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 focus:border-[#C89B53] outline-none text-xs text-[#F3F0E8] transition-colors leading-relaxed"
                />
                {errors.matterSummary && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                    <AlertCircle className="w-3 h-3" /> {errors.matterSummary}
                  </p>
                )}
              </div>

              {/* Security and Disclaimer Badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#121212] border border-white/5 text-[11px] font-sans text-[#9E988F]">
                <ShieldCheck className="w-5 h-5 text-[#C89B53] flex-shrink-0" />
                <span>
                  All submissions are encrypted in transit. Disclosed details remain protected by preliminary attorney work-product privilege principles.
                </span>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-full text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-full bg-[#E2B873] text-[#080808] font-sans text-xs font-bold tracking-wider hover:bg-[#F3F0E8] transition-all cursor-pointer shadow-lg shadow-[#C89B53]/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting Briefing...' : 'Dispatch Consultation Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
