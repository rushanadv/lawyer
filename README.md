# LEX VERA — The Verdict Is Yours
### Curated Interactive Legal Marketplace & Editorial Decision Desk

> **"Find counsel. Not chaos."**  
> An award-caliber legal discovery platform where individuals, founders, and institutions evaluate, listen to, and retain preeminent litigation partners, trial advocates, and sovereign arbitrators through an intuitive, swipe-based decision desk.

---

## ✨ Signature Features

- **The Opening — The Verdict Reveal**:
  - Photorealistic antique judge's gavel suspended in deep volumetric courtroom darkness.
  - Directional amber spotlight, floating atmospheric micro-dust particles rendered via Three.js WebGL.
  - Scroll-scrubbed physics: camera pushes forward, gavel accelerates and strikes the sound block.
  - Web Audio API acoustic synthesis: sub-bass wood thump (42Hz) + timber transient resonance.
  - Screen shake, light flash pulse, expanding shockwave, and kinetic typography: *"Find counsel. Not chaos."*
  - Session-aware (`sessionStorage`) with one-click **Replay Verdict** control.

- **The Transition — From Verdict to Discovery**:
  - The impact shockwave transforms into a glowing horizontal bronze line.
  - Editorial transition: *"Every case deserves the right voice. Let’s find yours."*
  - Seamless pacing shift from courtroom intensity to serene discovery.

- **Interactive Intake ("WHAT BRINGS YOU HERE?")**:
  - Tactile selection across 7 issue categories: *Business & Contracts*, *Civil Disputes*, *Criminal Defense*, *Intellectual Property*, *Family & Matrimonial*, *Property & Real Estate*, *Employment & Labor*.
  - Calibration by jurisdiction (New York, London, Washington D.C., San Francisco, Chicago, Miami), consultation mode (Video vs Chambers), and partner seniority.

- **The Editorial Decision Desk**:
  - 3D layered card stack with physical depth scaling.
  - Gesture engine: mouse drag, touch swipes, keyboard controls (`←` Skip, `→` Shortlist, `Enter` Dossier, `Cmd+Z` Undo).
  - Directional badges (`+ SHORTLIST` vs `— BYPASS`).
  - Active intake criteria left panel and live shortlist summary right panel.

- **"Oral Argument" — The 15-Second Voice Introduction**:
  - Integrated audio player on every lawyer card.
  - Real-time animated canvas waveform visualizer responding to frequency harmonics and syllables.
  - Speech synthesis narration capturing professional courtroom cadence.
  - Verbatim transcript drawer for accessibility.
  - Automatic pause on dismiss or card advance.

- **Shortlist Docket & Comparison Matrix**:
  - Save shortlisted counsel across session navigation.
  - Side-by-side comparison matrix for credentials, fee structures, and jurisdictions.
  - Direct consultation booking flow with client validation and simulated appointment reference code (`LV-XXXXXX`).

- **Legal Compliance & Regulatory Footprint**:
  - Bar Association Model Rule 7.1 compliance disclaimers.
  - Verified public bar standing indicators.
  - Tasteful admissions portal for senior advocates and chambers.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS v4 + Custom Glassmorphism & Editorial CSS tokens
- **3D & Visuals**: Three.js WebGL (volumetric lighting & atmospheric particle system)
- **Audio**: Web Audio API (procedural gavel impact synthesizer) + SpeechSynthesis
- **Icons**: Lucide React
- **Typography**: Cinzel, Cormorant Garamond, Plus Jakarta Sans, JetBrains Mono

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server (default port 5173)
npm run dev

# 3. Production build
npm run build

# 4. Preview production bundle
npm run preview
```

---

## ⚖️ Legal & Ethical Notice

LEX VERA is an interactive demonstration and legal discovery prototype. It is not a law firm or a lawyer referral service. Profiles, audio transcripts, and credentials represent curated fictional demonstrations of the platform's interaction design and evaluation architecture.
