import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowDown, ShieldAlert } from 'lucide-react';
import { buildFloatingLegalPapersScene } from '../utils/legalPaperBuilder';
import type { LegalPapersSceneData } from '../utils/legalPaperBuilder';

interface FloatingLegalPapers3DProps {
  onExploreManifesto: () => void;
  onProceedToIntake: () => void;
}

export const FloatingLegalPapers3D: React.FC<FloatingLegalPapers3DProps> = ({
  onExploreManifesto,
  onProceedToIntake
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneDataRef = useRef<LegalPapersSceneData | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activePhaseLabel, setActivePhaseLabel] = useState<string>('PROLOGUE');
  const progressRef = useRef<number>(0);

  // Update Camera along 3D Spline
  const updateCameraRig = useCallback((progress: number) => {
    const sceneData = sceneDataRef.current;
    const camera = cameraRef.current;
    if (!sceneData || !camera) return;

    // Evaluate camera position along continuous CatmullRomCurve3 spline
    const camPos = sceneData.cameraSpline.getPointAt(progress);
    const lookAheadProgress = Math.min(1.0, progress + 0.06);
    const lookPos = sceneData.cameraSpline.getPointAt(lookAheadProgress);

    camera.position.copy(camPos);
    camera.lookAt(lookPos.x, lookPos.y, lookPos.z - 12.0);

    // Subtle aerodynamic banking tilt during S-curve maneuvers
    if (progress >= 0.35 && progress <= 0.65) {
      const bankT = (progress - 0.35) / 0.30;
      camera.rotation.z = Math.sin(bankT * Math.PI) * 0.045;
    } else {
      camera.rotation.z = 0;
    }
  }, []);

  // Initialize Three.js Scene and 3D Floating Papers
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Cinematic 35mm Prime Focal Length (FOV: 36 deg)
    const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 200);
    cameraRef.current = camera;

    const sceneData = buildFloatingLegalPapersScene();
    sceneDataRef.current = sceneData;

    (window as any).__LEX_PAPERS_3D__ = {
      camera,
      sceneData,
      renderer,
      setProgress: (p: number) => {
        progressRef.current = p;
        setScrollProgress(p);
        updateCameraRig(p);
        if (p < 0.18) {
          setActivePhaseLabel('I. DISSOLVE TO RECORD');
        } else if (p < 0.42) {
          setActivePhaseLabel('II. PETITION IN FLIGHT');
        } else if (p < 0.75) {
          setActivePhaseLabel('III. THE EVIDENCE STREAM');
        } else {
          setActivePhaseLabel('IV. THE SOVEREIGN DECREE');
        }
      }
    };

    const initialPos = sceneData.cameraSpline.getPointAt(0);
    camera.position.copy(initialPos);
    camera.lookAt(0, 0, -16.0);

    let clock = new THREE.Clock();

    // Render loop
    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      const delta = clock.getDelta();
      const currentProg = progressRef.current;
      updateCameraRig(currentProg);
      sceneData.updatePapers(currentProg, delta);
      renderer.render(sceneData.scene, camera);
    };
    render();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      sceneData.dispose();
      renderer.dispose();
    };
  }, [updateCameraRig]);

  // Continuous Scroll Orchestration
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      progressRef.current = progress;
      setScrollProgress(progress);

      // Phase labels for editorial HUD
      if (progress < 0.18) {
        setActivePhaseLabel('I. DISSOLVE TO RECORD');
      } else if (progress < 0.42) {
        setActivePhaseLabel('II. PETITION IN FLIGHT');
      } else if (progress < 0.75) {
        setActivePhaseLabel('III. THE EVIDENCE STREAM');
      } else {
        setActivePhaseLabel('IV. THE SOVEREIGN DECREE');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      id="legal-papers-section"
      className="relative w-full bg-[#060505]"
      style={{ height: '380vh', minHeight: '380vh' }}
      aria-label="Floating Legal Documents Cinematic Transition"
    >
      {/* Sticky Fullscreen 3D Viewport */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden select-none bg-[#060505]">
        
        {/* WebGL Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Minimal Editorial HUD Header */}
        <div className="absolute top-20 left-6 md:left-12 z-20 pointer-events-none flex items-center gap-4">
          <span className="w-2 h-2 rotate-45 border border-[#C89B53] bg-[#060505]" />
          <span className="font-mono text-[11px] tracking-[0.35em] uppercase text-[#C89B53] font-medium drop-shadow-md">
            {activePhaseLabel}
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-[#666055] tracking-widest">
            · CASE MATERIAL ARCHIVES
          </span>
        </div>

        {/* Top-Right Quick Jump */}
        <div className="absolute top-20 right-6 md:right-12 z-20 pointer-events-auto flex items-center gap-3">
          <button
            onClick={onExploreManifesto}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] transition-all cursor-pointer"
          >
            <span>Manifesto</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#C89B53]" />
          </button>
        </div>

        {/* PHASE 1 & 2 OVERLAY (0% - 35%): Emergence Prompt */}
        {scrollProgress < 0.25 && (
          <div
            className="absolute bottom-14 left-0 right-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none transition-opacity duration-300"
            style={{ opacity: Math.max(0, 1 - scrollProgress * 5) }}
          >
            <p className="font-mono text-xs md:text-sm tracking-[0.35em] uppercase text-[#E2B873]/90 drop-shadow-md mb-2">
              THE FRAGMENTS OF THE RECORD
            </p>
            <span className="text-[11px] font-sans text-[#8A847A] tracking-wider max-w-md">
              Drifting through court filings, confidential releases, and sworn affidavits in atmospheric space
            </span>
          </div>
        )}

        {/* PHASE 3 FLOATING CALLOUTS (40% - 70%): Highlighting Artifact Details */}
        {scrollProgress >= 0.35 && scrollProgress <= 0.68 && (
          <div
            className="absolute bottom-16 left-8 md:left-16 z-20 max-w-sm pointer-events-none transition-opacity duration-500"
            style={{
              opacity: scrollProgress >= 0.40 && scrollProgress <= 0.62 ? 1 : 0
            }}
          >
            <div className="flex items-center gap-2 mb-2 text-[#C89B53]">
              <ShieldAlert className="w-4 h-4 text-[#C89B53]" />
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-semibold">
                EXHIBIT RECORD · ADMISSIBLE
              </span>
            </div>
            <h3 className="font-serif text-lg md:text-xl text-[#F3F0E8] leading-tight mb-1">
              Every dispute leaves its paper trail.
            </h3>
            <p className="text-xs font-sans text-[#8A847A] leading-relaxed">
              Petitions, redacted settlements, and trial testimony drifting under judicial scrutiny.
            </p>
          </div>
        )}

        {/* PHASE 4: TYPOGRAPHIC REVEAL & CLIMAX (75% - 100%) */}
        {scrollProgress >= 0.72 && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none transition-opacity duration-700"
            style={{
              opacity: Math.min(1, (scrollProgress - 0.72) / 0.15)
            }}
          >
            <div className="max-w-3xl flex flex-col items-center">
              <span className="font-mono text-xs md:text-sm tracking-[0.4em] uppercase text-[#C89B53] mb-4">
                THE VERDICT IS YOURS
              </span>
              
              <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-light tracking-tight text-[#F3F0E8] mb-6 drop-shadow-2xl">
                Find counsel. <span className="italic font-normal text-[#E2B873]">Not chaos.</span>
              </h2>

              <p className="font-sans text-sm md:text-base text-[#9E988F] max-w-xl mb-8 leading-relaxed">
                Step beyond transactional directories. Enter an architecture where the most consequential cases meet their defining advocates.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
                <button
                  onClick={onExploreManifesto}
                  className="px-6 py-3 rounded-full bg-[#F3F0E8] text-[#080808] font-mono text-xs uppercase tracking-widest font-semibold hover:bg-[#E2B873] transition-all cursor-pointer shadow-lg hover:shadow-[#E2B873]/20"
                >
                  Enter Typographic Manifesto →
                </button>
                <button
                  onClick={onProceedToIntake}
                  className="px-6 py-3 rounded-full border border-[#C89B53]/40 text-[#C89B53] font-mono text-xs uppercase tracking-widest font-medium hover:bg-[#C89B53]/10 transition-all cursor-pointer"
                >
                  Begin Case Evaluation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Elegant Bottom Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#141210] z-20">
          <div
            className="h-full bg-gradient-to-r from-[#8E1810] via-[#C89B53] to-[#E2B873] transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

      </div>
    </section>
  );
};
