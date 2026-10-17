export type LegalCategory = 
  | 'Business & Contracts'
  | 'Intellectual Property'
  | 'Civil Disputes'
  | 'Criminal Defense'
  | 'Family & Matrimonial'
  | 'Property & Real Estate'
  | 'Employment & Labor';

export interface Lawyer {
  id: string;
  name: string;
  title: string;
  firm: string;
  image: string;
  primaryCategory: LegalCategory;
  specialties: string[];
  location: string;
  jurisdictions: string[];
  yearsExperience: number;
  languages: string[];
  hourlyRate: number;
  consultationRate: number;
  consultationType: 'Online Video' | 'In-Person Chambers' | 'Both';
  verifiedBar: string;
  chambersRating: string;
  audioDuration: number; // in seconds, typically 15
  audioTranscript: string;
  bio: string;
  notableMatters: string[];
  education: string[];
  admissions: string[];
}

export interface IntakeFilters {
  category: LegalCategory | 'All';
  jurisdiction: string;
  consultationType: 'All' | 'Online Video' | 'In-Person Chambers';
  experienceTier: 'All' | '15+' | '20+' | '25+';
  language: string;
}

export interface ConsultationRequest {
  lawyerId: string;
  lawyerName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  matterSummary: string;
  urgency: 'Standard (3-5 days)' | 'Urgent (24-48 hours)' | 'Immediate Emergency';
  preferredDate: string;
  consultationType: 'Online Video' | 'In-Person Chambers';
}
