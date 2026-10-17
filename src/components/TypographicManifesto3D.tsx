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

    const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 350);
    cameraRef.current = camera;

    // Initial Camera Transform (seamless continuation from gavel exit)
    camera.position.set(1.2, -0.4, 3.6);
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
      } else if (progress < 0.82) {
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
    // MASTER CAMERA FLIGHT PATH THROUGH 3D TYPOGRAPHY (0.0 -> 1.0)
    // ========================================================

    let camX = 0;
    let camY = 0;
    let camZ = 3.6;
    let targetX = 0;
    let targetY = 0;
    let targetZ = -48.0;
    let rollZ = 0;

    if (progress <= 0.08) {
      // 0–8%: Exit the gavel environment into deep black atmospheric void
      const t = progress / 0.08;
      const easeT = Math.sin((t * Math.PI) / 2);
      camX = THREE.MathUtils.lerp(1.2, 0.0, easeT);
      camY = THREE.MathUtils.lerp(-0.4, 0.0, easeT);
      camZ = THREE.MathUtils.lerp(3.6, -18.0, easeT);
      targetX = 0.0;
      targetY = 0.0;
      targetZ = -48.0;
    } else if (progress <= 0.30) {
      // 8–30%: JUSTICE
      // 8-15%: Camera advances toward readable composition (Z: -18 -> -26)
      // 15-24%: Letters separate in 3D space
      // 24-30%: Camera flies between S and T at Z = -48 (Z: -36 -> -65)
      const t = (progress - 0.08) / (0.30 - 0.08);

      // Flight through opening between S (-5.8) and T (+5.4)
      camX = THREE.MathUtils.lerp(0.0, -0.2, Math.sin(t * Math.PI));
      camY = THREE.MathUtils.lerp(0.0, 0.1, t);
      camZ = THREE.MathUtils.lerp(-18.0, -68.0, t);

      targetX = THREE.MathUtils.lerp(0.0, 1.0, t);
      targetY = 0.0;
      targetZ = THREE.MathUtils.lerp(-48.0, -108.0, t);
    } else if (progress <= 0.55) {
      // 30–55%: ACCESS
      // 30-40%: Monolithic cluster visible ahead (Z: -68 -> -88)
      // 40-48%: Spacing expands, vertical axis rotations
      // 48-55%: Camera performs graceful S-curve between C2 (-2.2) and E (+5.5)
      const t = (progress - 0.30) / (0.55 - 0.30);

      const sCurve = Math.sin(t * Math.PI);
      camX = THREE.MathUtils.lerp(-0.2, 1.4, t) + sCurve * 1.6;
      camY = THREE.MathUtils.lerp(0.1, -0.15, t);
      camZ = THREE.MathUtils.lerp(-68.0, -128.0, t);

      // Subtle architectural banking tilt
      rollZ = Math.sin(t * Math.PI) * 0.038;

      targetX = THREE.MathUtils.lerp(1.0, -0.4, t);
      targetY = 0.0;
      targetZ = THREE.MathUtils.lerp(-108.0, -168.0, t);
    } else if (progress <= 0.80) {
      // 55–80%: CLARITY
      // 55-64%: Fragmented across depths
      // 64-73%: Converges into crystal-clear tranquil alignment
      // 73-80%: Parts for final central camera flight
      const t = (progress - 0.55) / (0.80 - 0.55);

      camX = THREE.MathUtils.lerp(1.4, 0.0, Math.sin(t * Math.PI * 0.5));
      camY = THREE.MathUtils.lerp(-0.15, 0.0, t);
      camZ = THREE.MathUtils.lerp(-128.0, -186.0, t);

      targetX = 0.0;
      targetY = 0.0;
      targetZ = THREE.MathUtils.lerp(-168.0, -220.0, t);
    } else {
      // 80–100%: Smooth deceleration into final quiet editorial manifesto
      const t = (progress - 0.80) / (1.0 - 0.80);
      const easeT = 1 - Math.pow(1 - t, 2.5); // Smooth natural deceleration

      camX = 0.0;
      camY = THREE.MathUtils.lerp(0.0, 0.0, easeT);
      camZ = THREE.MathUtils.lerp(-186.0, -208.0, easeT);

      targetX = 0.0;
      targetY = 0.0;
      targetZ = -250.0;
    }

    camera.position.set(camX, camY, camZ);
    camera.lookAt(targetX, targetY, targetZ);
    camera.rotation.z += rollZ;

    // Follow spot keylight to ensure dramatic letter face illumination
    sceneData.keyLight.position.set(camX + 10, camY + 14, camZ + 8);
    sceneData.keyLight.target.position.set(targetX, targetY, targetZ);
    sceneData.keyLight.target.updateMatrixWorld();

    // ========================================================
    // INDEPENDENT 3D LETTER TRANSFORMATIONS
    // ========================================================
    sceneData.letters.forEach((item) => {
      const { mesh, word, basePos, baseRot, displacedPos, displacedRot, fragmentedPos, fragmentedRot } = item;

      if (word === 'JUSTICE') {
        // JUSTICE: holds readable aligned pose (8-16%), separates (16-26%), holds opening (26-30%)
        let factor = 0;
        if (progress > 0.16) {
          factor = Math.min(1, (progress - 0.16) / 0.10);
        }
        const easeFactor = factor * factor * (3 - 2 * factor); // smoothstep

        mesh.position.lerpVectors(basePos, displacedPos, easeFactor);
        mesh.rotation.x = THREE.MathUtils.lerp(baseRot.x, displacedRot.x, easeFactor);
        mesh.rotation.y = THREE.MathUtils.lerp(baseRot.y, displacedRot.y, easeFactor);
        mesh.rotation.z = THREE.MathUtils.lerp(baseRot.z, displacedRot.z, easeFactor);

      } else if (word === 'ACCESS') {
        // ACCESS: starts compressed (30–38%), expands outward & rotates (38–50%)
        let factor = 0;
        if (progress > 0.38) {
          factor = Math.min(1, (progress - 0.38) / 0.12);
        }
        const easeFactor = Math.sin((factor * Math.PI) / 2);

        mesh.position.lerpVectors(basePos, displacedPos, easeFactor);
        mesh.rotation.x = THREE.MathUtils.lerp(baseRot.x, displacedRot.x, easeFactor);
        mesh.rotation.y = THREE.MathUtils.lerp(baseRot.y, displacedRot.y, easeFactor);
        mesh.rotation.z = THREE.MathUtils.lerp(baseRot.z, displacedRot.z, easeFactor);

      } else if (word === 'CLARITY') {
        // CLARITY:
        // 1. Fragmented at distance (progress < 0.60)
        // 2. Converges into perfect alignment (0.60 -> 0.72)
        // 3. Holds serene alignment (0.70 -> 0.73)
        // 4. Parts gracefully for camera passage (0.73 -> 0.80)
        if (progress <= 0.73) {
          const factor = Math.max(0, Math.min(1, (progress - 0.58) / 0.12));
          const easeFactor = factor * factor * (3 - 2 * factor);

          if (fragmentedPos && fragmentedRot) {
            mesh.position.lerpVectors(fragmentedPos, basePos, easeFactor);
            mesh.rotation.x = THREE.MathUtils.lerp(fragmentedRot.x, baseRot.x, easeFactor);
            mesh.rotation.y = THREE.MathUtils.lerp(fragmentedRot.y, baseRot.y, easeFactor);
            mesh.rotation.z = THREE.MathUtils.lerp(fragmentedRot.z, baseRot.z, easeFactor);
          }
        } else {
          // Final parting flight
          const factor = Math.min(1, (progress - 0.73) / 0.07);
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
        {scrollProgress < 0.10 && (
          <div 
            className="absolute bottom-12 left-0 right-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none transition-opacity duration-300"
            style={{ opacity: 1 - scrollProgress * 10 }}
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
