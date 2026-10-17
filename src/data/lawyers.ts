import type { Lawyer } from '../types';

export const SAMPLE_LAWYERS: Lawyer[] = [
  {
    id: 'eleanor-vance',
    name: 'Eleanor Vance, KC',
    title: 'Senior Partner · Commercial Chancery & M&A Litigation',
    firm: 'Vance, Sterling & Hargrove Chambers',
    image: '/lawyers/eleanor_vance.jpg',
    primaryCategory: 'Business & Contracts',
    specialties: ['Cross-Border M&A Disputes', 'Shareholder Derivative Actions', 'Private Equity Covenants'],
    location: 'New York, NY & London',
    jurisdictions: ['New York State Bar', 'England & Wales (Senior KC)', 'Southern District of NY'],
    yearsExperience: 22,
    languages: ['English', 'French'],
    hourlyRate: 950,
    consultationRate: 450,
    consultationType: 'Both',
    verifiedBar: 'NY Bar #482910 · Bar Standards Board #8821',
    chambersRating: 'Chambers Global Band 1 · Dispute Resolution',
    audioDuration: 15,
    audioTranscript: 'In complex corporate warfare, chaos is the opposing counsel’s weapon; structural clarity is ours. Before we draft a single pleading, we isolate the governing commercial pressure point that forces settlement on your terms.',
    bio: 'Eleanor Vance is widely regarded as one of the preeminent commercial trial advocates of her generation. With over two decades presiding over high-stakes corporate disputes in Manhattan and London commercial courts, she combines forensic financial acumen with unflinching cross-examination. She regularly advises Fortune 100 boards and sovereign investment vehicles on multi-billion dollar breach-of-contract and merger fallout.',
    notableMatters: [
      'Lead trial counsel in $1.4B cross-border technology acquisition breach trial; secured complete defense verdict.',
      'Defended international fintech syndicate against aggressive activist shareholder derivative injunction.',
      'Represented European pharmaceutical conglomerate in 3-week expedited Delaware Court of Chancery trial.'
    ],
    education: [
      'B.C.L. (First Class Honours), University of Oxford',
      'J.D., Columbia Law School (Harlan Fiske Stone Scholar)'
    ],
    admissions: [
      'Supreme Court of the United States',
      'New York State Appellate Division, First Department',
      'King’s Counsel (Silk appointed 2018)'
    ]
  },
  {
    id: 'marcus-thorne',
    name: 'Marcus Thorne',
    title: 'Managing Trial Counsel · White-Collar & Government Investigations',
    firm: 'Thorne & Associates Defense Group',
    image: '/lawyers/marcus_thorne.jpg',
    primaryCategory: 'Criminal Defense',
    specialties: ['Federal Grand Jury Inquiries', 'SEC & DOJ Enforcement', 'Corporate Internal Defense'],
    location: 'Washington, D.C.',
    jurisdictions: ['District of Columbia Bar', 'U.S. District Court for DC', 'Fourth Circuit Court of Appeals'],
    yearsExperience: 26,
    languages: ['English'],
    hourlyRate: 1100,
    consultationRate: 600,
    consultationType: 'Both',
    verifiedBar: 'District of Columbia Bar #391820',
    chambersRating: 'Chambers USA Band 1 · White-Collar Criminal Defense',
    audioDuration: 15,
    audioTranscript: 'When the government directs its full investigative apparatus against you, standard defense postures collapse. We build an impenetrable factual and constitutional barrier before charges can ever be filed.',
    bio: 'Marcus Thorne is a former Federal Prosecutor who has spent the last 18 years defending corporate executives, public officials, and institutions against aggressive Department of Justice and Securities & Exchange Commission actions. Known for his courtroom gravitas and tactical mastery, Thorne has successfully prevented indictments in dozens of sensitive high-profile investigations.',
    notableMatters: [
      'Declination of criminal charges secured for Chief Financial Officer in landmark $400M accounting investigation.',
      'Full jury acquittal after 6-week federal trial alleging securities fraud and Foreign Corrupt Practices Act violations.',
      'Successfully quashed Department of Justice subpoenas in Congressional oversight showdown.'
    ],
    education: [
      'J.D., Harvard Law School (Editor, Harvard Law Review)',
      'B.A. in Political Philosophy, Howard University (Summa Cum Laude)'
    ],
    admissions: [
      'District of Columbia Court of Appeals',
      'United States Supreme Court',
      'U.S. Court of Appeals for the Second & Fourth Circuits'
    ]
  },
  {
    id: 'soraya-chen',
    name: 'Soraya Chen',
    title: 'Partner · Intellectual Property & Frontier Technology',
    firm: 'Chen & Meridian IP Partners',
    image: '/lawyers/soraya_chen.jpg',
    primaryCategory: 'Intellectual Property',
    specialties: ['Generative AI Architecture Disputes', 'Patent Portfolio Defense', 'Trade Secret Misappropriation'],
    location: 'San Francisco, CA & Silicon Valley',
    jurisdictions: ['State Bar of California', 'USPTO Patent Bar', 'Northern District of California'],
    yearsExperience: 16,
    languages: ['English', 'Mandarin'],
    hourlyRate: 850,
    consultationRate: 400,
    consultationType: 'Both',
    verifiedBar: 'State Bar of California #582914 · USPTO Reg. #68102',
    chambersRating: 'The Legal 500 · Leading Next Generation IP Partner',
    audioDuration: 15,
    audioTranscript: 'Proprietary weights, algorithms, and trade secrets are uniquely vulnerable in open court. We distill intricate computer science into undeniable legal rights that juries respect and appellate circuits uphold.',
    bio: 'Soraya Chen bridges elite technical training in computer engineering with formidable courtroom advocacy. Having successfully argued before the Federal Circuit and the International Trade Commission, she represents high-growth artificial intelligence unicorns, semiconductor designers, and institutional technology giants in high-stakes IP enforcement and defense.',
    notableMatters: [
      'Secured preliminary injunction safeguarding proprietary neural network weights in contested defection case.',
      'Obtained non-infringement verdict protecting core semiconductor architecture against $650M royalty claim.',
      'Architected international patent enforcement strategy spanning US, Germany, and Tokyo District Court.'
    ],
    education: [
      'M.S. in Electrical Engineering & Computer Science, MIT',
      'J.D., Stanford Law School'
    ],
    admissions: [
      'California Supreme Court',
      'United States Patent & Trademark Office',
      'Court of Appeals for the Federal Circuit'
    ]
  },
  {
    id: 'julian-vance',
    name: 'The Hon. Julian Alistair Montgomery',
    title: 'Senior Fellow · Sovereign Arbitration & Civil Appellate Advocacy',
    firm: 'Temple Court International Chambers',
    image: '/lawyers/julian_vance.jpg',
    primaryCategory: 'Civil Disputes',
    specialties: ['Bilateral Investment Treaty Arbitrations', 'Energy Infrastructure Disputes', 'High Appellate Advocacy'],
    location: 'London, UK & Geneva',
    jurisdictions: ['Honourable Society of the Middle Temple', 'Paris Bar (Foreign Counsel)', 'Dubai DIFC Courts'],
    yearsExperience: 31,
    languages: ['English', 'German', 'French'],
    hourlyRate: 1250,
    consultationRate: 750,
    consultationType: 'In-Person Chambers',
    verifiedBar: 'Middle Temple Roll of Barristers #1994 · DIFC Admitted',
    chambersRating: 'Chambers UK Senior Statesman · International Arbitration',
    audioDuration: 15,
    audioTranscript: 'True advocacy before an international tribunal is never theater; it is the patient, surgical dismantling of flawed premises. We protect sovereign and corporate dignity at every phase of the dispute.',
    bio: 'With over three decades leading monumental arbitrations in London, Paris, and The Hague, Julian Montgomery possesses unexcelled diplomatic and legal mastery. He has served both as lead counsel and presiding arbitrator under ICSID, LCIA, and ICC rules, resolving cross-border natural resource disputes, infrastructure concession terminations, and treaty violations.',
    notableMatters: [
      'Lead counsel in $2.1B energy concession ICSID arbitration against sovereign state; secured full compensation award.',
      'Represented multinational consortium in landmark North Sea renewable infrastructure dispute.',
      'Appellate argument before the Judicial Committee of the Privy Council establishing precedent in maritime jurisdiction.'
    ],
    education: [
      'M.A. in Jurisprudence (First Class), Trinity College, Cambridge',
      'LL.M. in International Law, The Graduate Institute Geneva'
    ],
    admissions: [
      'Bar of England & Wales (Bencher, Middle Temple)',
      'Arbitrator Roster, International Chamber of Commerce (ICC)',
      'Singapore International Arbitration Centre (SIAC) Panel'
    ]
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    title: 'Founding Partner · Private Wealth Preservation & Matrimonial Law',
    firm: 'Rostova Wealth & Family Chambers',
    image: '/lawyers/elena_rostova.jpg',
    primaryCategory: 'Family & Matrimonial',
    specialties: ['Ultra-High-Net-Worth Marital Dissolution', 'Multi-Jurisdictional Trust Disputes', 'Pre-Marital Asset Protection'],
    location: 'New York, NY & Miami, FL',
    jurisdictions: ['New York State Bar', 'Florida Bar', 'Southern District of Florida'],
    yearsExperience: 19,
    languages: ['English', 'Spanish', 'Russian'],
    hourlyRate: 875,
    consultationRate: 450,
    consultationType: 'Both',
    verifiedBar: 'New York Bar #501928 · Florida Bar #619420',
    chambersRating: 'Chambers High Net Worth Guide Band 1',
    audioDuration: 15,
    audioTranscript: 'Family legacy and generationally accumulated assets must never be squandered in sensational courtroom theater. We resolve complex asset divisions with absolute discretion, composure, and legal rigor.',
    bio: 'Elena Rostova is sought out by family offices, founders, and generational dynastic families for her extraordinary ability to de-escalate explosive marital and inheritance conflicts while strictly shielding proprietary assets. Her practice encompasses complex valuation of privately held enterprises, offshore trust protection, and confidential settlements.',
    notableMatters: [
      'Negotiated confidential, out-of-court global marital dissolution involving $800M across 4 offshore jurisdictions.',
      'Defended family trust integrity against contested cross-border probate challenge.',
      'Drafted protective multi-generational marital agreements for tech unicorn founders prior to public listing.'
    ],
    education: [
      'J.D., NYU School of Law (Vanderbilt Medal)',
      'B.A. in Economics & Comparative Literature, Georgetown University'
    ],
    admissions: [
      'New York Supreme Court Appellate Division',
      'Supreme Court of Florida',
      'American Academy of Matrimonial Lawyers (Fellow)'
    ]
  },
  {
    id: 'tariq-mansoor',
    name: 'Tariq Al-Mansoor',
    title: 'Partner · Real Estate Development & Urban Infrastructure',
    firm: 'Al-Mansoor Property & Land Use Group',
    image: '/lawyers/tariq_mansoor.jpg',
    primaryCategory: 'Property & Real Estate',
    specialties: ['Commercial Entitlements & Zoning', 'Billion-Dollar Joint Ventures', 'Eminent Domain & Land Use Litigation'],
    location: 'Chicago, IL & Austin, TX',
    jurisdictions: ['Illinois State Bar', 'State Bar of Texas', 'Northern District of Illinois'],
    yearsExperience: 18,
    languages: ['English', 'Arabic'],
    hourlyRate: 820,
    consultationRate: 380,
    consultationType: 'Both',
    verifiedBar: 'Illinois Bar #630129 · Texas Bar #772190',
    chambersRating: 'Chambers USA Band 2 · Real Estate & Zoning',
    audioDuration: 15,
    audioTranscript: 'Major developments hinge on anticipating regulatory gridlock before capital is exposed. When municipalities or recalcitrant partners stall transformative projects, we deliver entitlement certainty.',
    bio: 'Tariq Al-Mansoor represents premier institutional property developers, REITs, and sovereign wealth investors navigating complex municipal approvals, environmental reviews, and commercial financing covenants. Known as a pragmatist who drives deals across the finish line, he has successfully closed over $14B in urban mixed-use and logistics assets.',
    notableMatters: [
      'Secured contested city council entitlement approvals for $1.2B urban mixed-use transit corridor.',
      'Resolved multi-party mezzanine lender restructuring during market contraction without foreclosure.',
      'Trial victory overturning adverse municipal zoning restriction under constitutional land-use doctrine.'
    ],
    education: [
      'J.D., Northwestern University Pritzker School of Law',
      'B.S. in Urban Planning & Architecture, University of Illinois Urbana-Champaign'
    ],
    admissions: [
      'Supreme Court of Illinois',
      'Supreme Court of Texas',
      'Urban Land Institute Counsel Member'
    ]
  }
];

export const CATEGORIES_LIST = [
  'Business & Contracts',
  'Civil Disputes',
  'Criminal Defense',
  'Intellectual Property',
  'Family & Matrimonial',
  'Property & Real Estate',
  'Employment & Labor'
] as const;

export const JURISDICTIONS_LIST = [
  'All Jurisdictions',
  'New York, NY',
  'Washington, D.C.',
  'San Francisco, CA',
  'London, UK',
  'Chicago, IL',
  'Miami, FL'
];
