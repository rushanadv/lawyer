import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowDown, Compass } from 'lucide-react';
import { loadCinzelFont, buildTypographicManifestoScene } from '../utils/typography3DBuilder';
import type { ManifestoSceneData } from '../utils/typography3DBuilder';

interface TypographicManifesto3DProps {
  onProceedToIntake: () => void;
}

export const TypographicManifesto3D: React.FC<TypographicManifesto3DProps> = ({
  onProceedToIntake
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneDataRef = useRef<ManifestoSceneData | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeWordLabel, setActiveWordLabel] = useState<string>('JUSTICE');

  // Initialize Three.js Scene and Load 3D Font
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

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 350);
    cameraRef.current = camera;

    // Match-cut continuation from dark wood gavel surface
    camera.position.set(0.0, -0.6, 2.0);
    camera.lookAt(0.0, 0.0, -48.0);

    let isMounted = true;

    loadCinzelFont().then((font) => {
      if (!isMounted) return;
      const sceneData = buildTypographicManifestoScene(font);
      sceneDataRef.current = sceneData;

      (window as any).__LEX_MANIFESTO_3D__ = { camera, sceneData, renderer };

      // Render loop
      const render = () => {
        animFrameRef.current = requestAnimationFrame(render);
        renderer.render(sceneData.scene, camera);
      };
      render();
    }).catch((err) => {
      console.error('Failed to load 3D manifesto font:', err);
    });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (sceneDataRef.current) {
        sceneDataRef.current.dispose();
      }
      renderer.dispose();
    };
  }, []);

  // Continuous Scroll Orchestration
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      setScrollProgress(progress);

      // Active Section Label HUD
      if (progress < 0.08) {
        setActiveWordLabel('PROLOGUE');
      } else if (progress < 0.32) {
        setActiveWordLabel('I. JUSTICE');
      } else if (progress < 0.58) {
        setActiveWordLabel('II. ACCESS');
      } else if (progress < 0.84) {
        setActiveWordLabel('III. CLARITY');
      } else {
        setActiveWordLabel('THE MANIFESTO');
      }

      updateManifestoScene(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update 3D Scene transforms based on scroll
  const updateManifestoScene = useCallback((progress: number) => {
    const sceneData = sceneDataRef.current;
    const camera = cameraRef.current;
    if (!sceneData || !camera) return;

    // ========================================================
    // 1. ADVANCED CONTINUOUS CAMERA RIG VIA CatmullRomCurve3
    // Guarantees smooth tangent, collision-free corridor, zero abrupt jumps
    // ========================================================
    const camPos = sceneData.cameraSpline.getPointAt(progress);
    const lookAheadProgress = Math.min(1.0, progress + 0.05);
    const lookPos = sceneData.cameraSpline.getPointAt(lookAheadProgress);

    camera.position.copy(camPos);
    camera.lookAt(lookPos.x, lookPos.y, lookPos.z - 15.0);

    // Subtle architectural Dutch banking tilt during ACCESS S-curve (progress 0.40 -> 0.56)
    if (progress >= 0.40 && progress <= 0.56) {
      const bankT = (progress - 0.40) / 0.16;
      camera.rotation.z = Math.sin(bankT * Math.PI) * 0.035;
    } else {
      camera.rotation.z = 0;
    }

    // Moving Key Spotlight tracks with the camera rig
    sceneData.keyLight.position.set(camPos.x + 8, camPos.y + 12, camPos.z + 8);
    sceneData.keyLight.target.position.set(lookPos.x, lookPos.y, lookPos.z - 15.0);
    sceneData.keyLight.target.updateMatrixWorld();

    // ========================================================
    // 2. STRICT STATION ISOLATION WITH DISTANT GATEWAY EMERGENCE
    // At hero readable moments, only one word is active in the scene!
    // During fly-throughs, the next word emerges ahead in atmospheric distance.
    // ========================================================
    sceneData.justiceGroup.visible = progress <= 0.28;
    sceneData.accessGroup.visible = progress >= 0.18 && progress <= 0.62;
    sceneData.clarityGroup.visible = progress >= 0.48 && progress <= 0.92;

    // ========================================================
    // 3. CHOREOGRAPHED SCULPTURAL LETTER TRANSFORMATIONS
    // ========================================================
    sceneData.letters.forEach((item) => {
      const { mesh, word, basePos, baseRot, displacedPos, displacedRot, fragmentedPos, fragmentedRot } = item;

      if (word === 'JUSTICE') {
        // JUSTICE:
        // 0.08 - 0.16: HERO READABLE MOMENT (basePos, baseRot)
        // 0.16 - 0.24: Heavy sculptural parting opening passage between S and T
        // 0.24 - 0.30: Passage held wide as camera glides through
        let factor = 0;
        if (progress > 0.16) {
          factor = Math.min(1, (progress - 0.16) / 0.08);
        }
        const easeFactor = factor * factor * (3 - 2 * factor); // smoothstep

        mesh.position.lerpVectors(basePos, displacedPos, easeFactor);
        mesh.rotation.x = THREE.MathUtils.lerp(baseRot.x, displacedRot.x, easeFactor);
        mesh.rotation.y = THREE.MathUtils.lerp(baseRot.y, displacedRot.y, easeFactor);
        mesh.rotation.z = THREE.MathUtils.lerp(baseRot.z, displacedRot.z, easeFactor);

      } else if (word === 'ACCESS') {
        // ACCESS:
        // 0.30 - 0.44: HERO READABLE MOMENT (classical monolithic composition)
        // 0.44 - 0.54: Expands outward like an architectural gateway
        // 0.54 - 0.62: Gateway held wide as camera sweeps through
        let factor = 0;
        if (progress > 0.44) {
          factor = Math.min(1, (progress - 0.44) / 0.10);
        }
        const easeFactor = Math.sin((factor * Math.PI) / 2);

        mesh.position.lerpVectors(basePos, displacedPos, easeFactor);
        mesh.rotation.x = THREE.MathUtils.lerp(baseRot.x, displacedRot.x, easeFactor);
        mesh.rotation.y = THREE.MathUtils.lerp(baseRot.y, displacedRot.y, easeFactor);
        mesh.rotation.z = THREE.MathUtils.lerp(baseRot.z, displacedRot.z, easeFactor);

      } else if (word === 'CLARITY') {
        // CLARITY:
        // 0.62 - 0.68: Letters subtly fragmented across depth planes converge
        // 0.68 - 0.76: HERO READABLE MOMENT (perfect classical focus)
        // 0.76 - 0.84: Letters part gently between R and I as camera glides through
        // 0.84 - 0.92: Flight completes into tranquil darkness
        if (progress <= 0.76) {
          const factor = Math.max(0, Math.min(1, (progress - 0.62) / 0.06));
          const easeFactor = factor * factor * (3 - 2 * factor);

          if (fragmentedPos && fragmentedRot) {
            mesh.position.lerpVectors(fragmentedPos, basePos, easeFactor);
            mesh.rotation.x = THREE.MathUtils.lerp(fragmentedRot.x, baseRot.x, easeFactor);
            mesh.rotation.y = THREE.MathUtils.lerp(fragmentedRot.y, baseRot.y, easeFactor);
            mesh.rotation.z = THREE.MathUtils.lerp(fragmentedRot.z, baseRot.z, easeFactor);
          }
        } else {
          // Parting flight
          const factor = Math.min(1, (progress - 0.76) / 0.08);
          const easeFactor = factor * factor;

          mesh.position.lerpVectors(basePos, displacedPos, easeFactor);
          mesh.rotation.x = THREE.MathUtils.lerp(baseRot.x, displacedRot.x, easeFactor);
          mesh.rotation.y = THREE.MathUtils.lerp(baseRot.y, displacedRot.y, easeFactor);
          mesh.rotation.z = THREE.MathUtils.lerp(baseRot.z, displacedRot.z, easeFactor);
        }
      }
    });
  }, []);

  return (
    <section 
      ref={containerRef}
      id="manifesto-section"
      className="relative w-full bg-[#080808]"
      style={{ height: '450vh', minHeight: '450vh' }}
      aria-label="Cinematic 3D Typographic Manifesto"
    >
      {/* Sticky Fullscreen 3D Viewport */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden select-none bg-[#080808]">
        
        {/* WebGL Canvas */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full block" 
        />

        {/* Minimal Editorial HUD Header */}
        <div className="absolute top-20 left-6 md:left-12 z-20 pointer-events-none flex items-center gap-4">
          <span className="w-2 h-2 rotate-45 border border-[#C89B53] bg-[#080808]" />
          <span className="font-mono text-[11px] tracking-[0.35em] uppercase text-[#C89B53] font-medium drop-shadow-md">
            {activeWordLabel}
          </span>
        </div>

        {/* Top-Right Jump to Discovery */}
        <div className="absolute top-20 right-6 md:right-12 z-20 pointer-events-auto">
          <button
            onClick={onProceedToIntake}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] transition-all cursor-pointer"
          >
            <span>Skip to Discovery</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#C89B53]" />
          </button>
        </div>

        {/* PROLOGUE PROMPT (0–8%): Transition from Gavel */}
        {scrollProgress < 0.08 && (
          <div 
            className="absolute bottom-12 left-0 right-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none transition-opacity duration-300"
            style={{ opacity: 1 - scrollProgress * 12 }}
          >
            <p className="font-mono text-xs md:text-sm tracking-[0.35em] uppercase text-[#E2B873]/90 drop-shadow-md mb-2">
              SCROLL TO ENTER THE MANIFESTO
            </p>
            <span className="text-[11px] font-sans text-[#7E7971] tracking-wider">
              Flying through monumental typography
            </span>
          </div>
        )}

        {/* STATION 1 LABEL: JUSTICE (8% - 30%) */}
        {scrollProgress >= 0.08 && scrollProgress < 0.30 && (
          <div 
            className="absolute bottom-10 left-6 md:left-12 z-20 pointer-events-none transition-opacity duration-300"
            style={{ opacity: Math.sin(((scrollProgress - 0.08) / 0.22) * Math.PI) }}
          >
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C89B53]/80 block">
              CANON I
            </span>
            <p className="font-serif text-lg md:text-2xl text-[#F0EAE0] tracking-tight">
              Justice is not an abstraction. It is an architecture.
            </p>
          </div>
        )}

        {/* STATION 2 LABEL: ACCESS (30% - 55%) */}
        {scrollProgress >= 0.30 && scrollProgress < 0.55 && (
          <div 
            className="absolute bottom-10 left-6 md:left-12 z-20 pointer-events-none transition-opacity duration-300"
            style={{ opacity: Math.sin(((scrollProgress - 0.30) / 0.25) * Math.PI) }}
          >
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C89B53]/80 block">
              CANON II
            </span>
            <p className="font-serif text-lg md:text-2xl text-[#F0EAE0] tracking-tight">
              True counsel expands room for advocacy.
            </p>
          </div>
        )}

        {/* STATION 3 LABEL: CLARITY (55% - 80%) */}
        {scrollProgress >= 0.55 && scrollProgress < 0.80 && (
          <div 
            className="absolute bottom-10 left-6 md:left-12 z-20 pointer-events-none transition-opacity duration-300"
            style={{ opacity: Math.sin(((scrollProgress - 0.55) / 0.25) * Math.PI) }}
          >
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#F0EAE0] tracking-tight">
              CANON III
            </span>
            <p className="font-serif text-lg md:text-2xl text-[#F0EAE0] tracking-tight">
              Clarity emerges when confusion dissolves.
            </p>
          </div>
        )}

        {/* STATION 4: QUIET EDITORIAL MANIFESTO STATEMENT (86% - 100%) */}
        {scrollProgress >= 0.86 && (
          <div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none transition-all duration-300"
            style={{
              opacity: Math.min(1, (scrollProgress - 0.86) / 0.08),
              transform: `translateY(${(1 - Math.min(1, (scrollProgress - 0.86) / 0.08)) * 20}px)`
            }}
          >
            <div className="space-y-6 max-w-4xl">
              
              {/* Emblem */}
              <div className="flex items-center justify-center gap-3">
                <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[#C89B53]" />
                <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#C89B53]">
                  THE MANIFESTO
                </span>
                <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[#C89B53]" />
              </div>

              {/* Quiet Statement */}
              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif tracking-tight leading-[1.12] text-[#F3F0E8] drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)]">
                “A marketplace for the people lawyers{' '}
                <span className="italic font-normal text-gold-gradient block sm:inline">
                  actually want to help.
                </span>”
              </h2>

              <p className="text-sm md:text-base font-sans text-[#A8A299] max-w-xl mx-auto pt-2 leading-relaxed">
                Move past transactional directories. Experience peer-reviewed trial lawyers who litigate with conviction.
              </p>

              {/* Action into Discovery */}
              <div className="pt-6 pointer-events-auto flex items-center justify-center gap-4">
                <button
                  onClick={onProceedToIntake}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#F3F0E8] text-[#080808] font-sans text-xs font-semibold tracking-wider hover:bg-[#E2B873] transition-all cursor-pointer shadow-2xl group"
                >
                  <Compass className="w-4 h-4 text-[#080808] group-hover:rotate-45 transition-transform" />
                  <span>Begin Case Evaluation</span>
                  <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Scroll Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 z-30">
          <div 
            className="h-full bg-gradient-to-r from-[#8E6D38] via-[#C89B53] to-[#E2B873] transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

      </div>
    </section>
  );
};
