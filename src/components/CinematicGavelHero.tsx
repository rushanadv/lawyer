import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX, RotateCcw, ArrowDown } from 'lucide-react';
import { buildCinematicCourtroomScene } from '../utils/gavelModelBuilder';
import type { GavelSceneObjects } from '../utils/gavelModelBuilder';
import { loadModularGavelSTL } from '../utils/stlLoaderHelper';
import type { LoadedGavelAssembly } from '../utils/stlLoaderHelper';
import { soundEngine } from '../services/soundEngine';

interface CinematicGavelHeroProps {
  onTransitionComplete?: () => void;
  onExploreClick: () => void;
}

export const CinematicGavelHero: React.FC<CinematicGavelHeroProps> = ({
  onTransitionComplete,
  onExploreClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneObjectsRef = useRef<GavelSceneObjects | null>(null);
  const gavelAssemblyRef = useRef<LoadedGavelAssembly | null>(null);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [hasDelivered, setHasDelivered] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());
  const [cameraShake, setCameraShake] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const hasImpactPlayedRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Check sessionStorage
  useEffect(() => {
    const delivered = sessionStorage.getItem('lex_verdict_delivered');
    if (delivered === 'true') {
      setHasDelivered(true);
      hasImpactPlayedRef.current = true;
    }
  }, []);

  // Set up Three.js Canvas and Scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // High performance WebGL renderer
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
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    // Cinematic Camera (full-frame ~70mm equivalent focal length for intimate courtroom close-up)
    const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 50);
    cameraRef.current = camera;

    // Build the 3D scene (lighting, bench, atmosphere, dust)
    const sceneData = buildCinematicCourtroomScene();
    sceneObjectsRef.current = sceneData;

    // Asynchronously load the modular STL gavel assembly
    loadModularGavelSTL(sceneData.scene).then((assembly) => {
      gavelAssemblyRef.current = assembly;

      // Remove procedural temporary gavel and sound block once true modular STLs are mounted
      if (sceneData.gavelPivot) {
        sceneData.scene.remove(sceneData.gavelPivot);
      }
      if (sceneData.soundBlock) {
        sceneData.scene.remove(sceneData.soundBlock);
      }

      // Initial suspended pose
      assembly.gavelPivot.rotation.x = assembly.suspendedAngle;
    }).catch((err) => {
      console.warn('Modular STL loading note:', err);
    });

    let clock = new THREE.Clock();

    // Initial Camera Transform (0–20% Opening: Extreme cinematic close-up of suspended wooden gavel)
    const camStartPos = new THREE.Vector3(1.1, 1.7, 2.2);
    const camTarget = new THREE.Vector3(0, 1.4, 0.2);
    camera.position.copy(camStartPos);
    camera.lookAt(camTarget);

    // Render loop
    const render = () => {
      animationFrameIdRef.current = requestAnimationFrame(render);
      const delta = clock.getDelta();

      // Update atmospheric dust
      sceneData.updateDust(delta);

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
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
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

      // Update 3D Camera and Gavel positions based on progress
      update3DScene(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update 3D Scene transforms based on scroll
  const update3DScene = useCallback((progress: number) => {
    const sceneData = sceneObjectsRef.current;
    const assembly = gavelAssemblyRef.current;
    if (!sceneData || !canvasRef.current) return;

    // Determine which pivot to animate (modular STL if loaded, otherwise procedural sceneData)
    const activePivot = assembly ? assembly.gavelPivot : sceneData.gavelPivot;

    // Kinematic Angles:
    // Suspended angle: ~0.32 rad (poised above sound block)
    // Raised angle: ~0.65 rad (pulled back in anticipation/preparation)
    // Strike impact angle: 0.0 rad (exact physical contact, 0 gap, 0 penetration)
    const suspendedAngle = assembly ? assembly.suspendedAngle : 0.32;
    const raisedAngle = assembly ? assembly.raisedAngle : 0.65;
    const exactContactAngle = assembly ? assembly.exactContactAngle : 0.0;

    let gavelRotationX = exactContactAngle;

    // ========================================================
    // 1. KINEMATIC GAVEL SWING SEQUENCE (0.0 -> 1.0)
    // ========================================================
    if (progress <= 0.20) {
      // Phase 1 (0–20%): Suspended Gavel with gentle organic micro-float
      const floatOffset = Math.sin(Date.now() * 0.001) * 0.004;
      gavelRotationX = suspendedAngle + floatOffset;
    } else if (progress <= 0.45) {
      // Phase 2 (20–45%): Anticipation & Controlled Wind-up
      // Gavel rotates backward into preparation pose
      const t = (progress - 0.20) / (0.45 - 0.20);
      const easeT = Math.sin((t * Math.PI) / 2); // ease-out curve for smooth wind-up
      gavelRotationX = THREE.MathUtils.lerp(suspendedAngle, raisedAngle, easeT);
    } else if (progress <= 0.58) {
      // Phase 3A (45–58%): Downward Angular Acceleration
      // Gavel accelerates toward the sound block (easeInCubic)
      const t = (progress - 0.45) / (0.58 - 0.45);
      const accel = Math.pow(t, 2.8);
      gavelRotationX = THREE.MathUtils.lerp(raisedAngle, exactContactAngle, accel);
    } else if (progress <= 0.63) {
      // Phase 3B (58–63%): Physical Impact & Small Rebound
      // Small, physically restrained bounce (~0.024 rad / ~1.3°) then settles firmly
      const t = (progress - 0.58) / (0.63 - 0.58);
      const bounce = Math.sin(t * Math.PI) * 0.024;
      gavelRotationX = exactContactAngle + bounce;
    } else {
      // Phase 3C & onwards (63–100%): Firmly settled at rest on sound block
      gavelRotationX = exactContactAngle;
    }

    if (activePivot) {
      activePivot.rotation.x = gavelRotationX;
    }

    // ========================================================
    // 2. STRIKE DETECTION & IMPACT EFFECTS (At progress 0.58)
    // ========================================================
    if (progress >= 0.575 && !hasImpactPlayedRef.current) {
      hasImpactPlayedRef.current = true;
      setHasDelivered(true);
      sessionStorage.setItem('lex_verdict_delivered', 'true');

      // Trigger Web Audio authentic wooden impact sound
      soundEngine.playGavelImpact();

      // Trigger fine dust burst caught in the light shaft
      sceneData.triggerDustBurst();

      // Physically restrained camera impulse
      const impulseSteps = [
        { x: 3.5, y: -4.5 },
        { x: -2.5, y: 3.0 },
        { x: 1.2, y: -1.8 },
        { x: -0.6, y: 0.8 },
        { x: 0, y: 0 }
      ];
      impulseSteps.forEach((step, idx) => {
        setTimeout(() => setCameraShake(step), idx * 45);
      });
    } else if (progress < 0.48) {
      // Reset trigger if visitor scrolls backwards before the strike
      hasImpactPlayedRef.current = false;
    }

    if (progress >= 0.96) {
      onTransitionComplete?.();
    }

    // ========================================================
    // 3. CONTINUOUS CAMERA CHOREOGRAPHY (Consistent 3D Targets)
    // ========================================================
    const camera = cameraRef.current;
    if (camera) {
      if (progress <= 0.20) {
        // Phase 1 (0–20%): Extreme cinematic close-up of suspended wooden gavel
        const t = progress / 0.20;
        camera.position.x = THREE.MathUtils.lerp(1.1, 1.2, t);
        camera.position.y = THREE.MathUtils.lerp(1.7, 1.8, t);
        camera.position.z = THREE.MathUtils.lerp(2.2, 2.5, t);
        camera.lookAt(0, 1.4, 0.2);
      } else if (progress <= 0.45) {
        // Phase 2 (20–45%): Camera pushes closer, perspective shifts, sound block enters view
        const t = (progress - 0.20) / (0.45 - 0.20);
        camera.position.x = THREE.MathUtils.lerp(1.2, 1.4, t);
        camera.position.y = THREE.MathUtils.lerp(1.8, 2.1, t);
        camera.position.z = THREE.MathUtils.lerp(2.5, 3.2, t);
        camera.lookAt(0, THREE.MathUtils.lerp(1.4, 1.0, t), THREE.MathUtils.lerp(0.2, 0.1, t));
      } else if (progress <= 0.70) {
        // Phase 3 (45–70%): The Strike & Impact vantage point
        const t = (progress - 0.45) / (0.70 - 0.45);
        camera.position.x = THREE.MathUtils.lerp(1.4, 0.8, t);
        camera.position.y = THREE.MathUtils.lerp(2.1, 1.6, t);
        camera.position.z = THREE.MathUtils.lerp(3.2, 2.8, t);
        camera.lookAt(0, THREE.MathUtils.lerp(1.0, 0.65, t), THREE.MathUtils.lerp(0.1, 0.0, t));
      } else if (progress <= 0.85) {
        // Phase 4 (70–85%): Camera settles on resting gavel, headline reveal
        const t = (progress - 0.70) / (0.85 - 0.70);
        camera.position.x = THREE.MathUtils.lerp(0.8, 0.4, t);
        camera.position.y = THREE.MathUtils.lerp(1.6, 1.3, t);
        camera.position.z = THREE.MathUtils.lerp(2.8, 2.4, t);
        camera.lookAt(0, 0.55, 0.0);
      } else {
        // Phase 5 (85–100%): Camera moves toward dark polished walnut bench surface for seamless wipe
        const t = (progress - 0.85) / 0.15;
        camera.position.x = THREE.MathUtils.lerp(0.4, 0.0, t);
        camera.position.y = THREE.MathUtils.lerp(1.3, 0.12, t);
        camera.position.z = THREE.MathUtils.lerp(2.4, 1.1, t);
        camera.lookAt(0, 0.0, -0.4);
      }
    }
  }, []);

  // Quick Strike Action
  const strikeInstantly = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTarget = containerRef.current.offsetTop + containerRef.current.offsetHeight * 0.58;
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, []);

  // Replay Action
  const replayVerdict = useCallback(() => {
    hasImpactPlayedRef.current = false;
    setHasDelivered(false);
    sessionStorage.removeItem('lex_verdict_delivered');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    soundEngine.playSubtleTick();
  }, []);


  // Sound toggle
  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) soundEngine.playSubtleTick();
  };

  // Skip Intro (scrolls past 3D hero directly into discovery)
  const skipIntro = () => {
    if (!containerRef.current) return;
    const endPosition = containerRef.current.offsetTop + containerRef.current.offsetHeight;
    window.scrollTo({ top: endPosition, behavior: 'smooth' });
    sessionStorage.setItem('lex_verdict_delivered', 'true');
    setHasDelivered(true);
  };


  // Darkness overlay opacity for seamless Phase 5 bench-surface wipe
  const transitionDarknessOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.78) / 0.18));

  return (
    <div 
      ref={containerRef}
      id="cinematic-hero-container"
      className="relative w-full h-[280vh] bg-[#060606]"
      aria-label="Cinematic 3D Courtroom Verdict"
    >
      {/* Sticky Fullscreen 3D Viewport (Edge-to-edge, zero cards, zero borders) */}
      <div 
        className="sticky top-0 left-0 w-full h-screen overflow-hidden select-none"
        style={{
          transform: `translate(${cameraShake.x}px, ${cameraShake.y}px)`,
          transition: cameraShake.x !== 0 ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Fullscreen Three.js WebGL Canvas */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full block" 
        />

        {/* Minimal Editorial Top HUD */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-12 pt-7 pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#C89B53] animate-pulse" />
            <span className="font-display tracking-[0.25em] text-xs uppercase text-[#E2B873] font-semibold">
              LEX VERA
            </span>
            <span className="text-[#66615B] text-xs font-mono hidden sm:inline">| COURT OF CHANCERY</span>
          </div>

          <div className="flex items-center gap-3">
            {hasDelivered && (
              <button
                onClick={replayVerdict}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] transition-all cursor-pointer"
                title="Replay 3D Verdict Sequence"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C89B53]" />
                <span className="hidden sm:inline">Replay 3D Sequence</span>
              </button>
            )}

            <button
              onClick={skipIntro}
              className="px-3 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] transition-all cursor-pointer"
            >
              Skip Intro
            </button>

            <button
              onClick={toggleSound}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] transition-all cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#C89B53]" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
          </div>
        </header>

        {/* FRAME 01 & 02: Initial Minimal Prompts (Before Strike) */}
        {scrollProgress < 0.44 && (
          <div 
            className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center justify-center text-center px-4 transition-opacity duration-300 pointer-events-auto"
            style={{ opacity: 1 - scrollProgress * 2.2 }}
          >
            <p className="font-mono text-xs md:text-sm tracking-[0.35em] uppercase text-[#E2B873]/90 drop-shadow-md mb-3">
              SCROLL TO DELIVER THE VERDICT
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-[#66615B]">
              <span className="w-12 h-[1px] bg-white/20" />
              <button
                onClick={strikeInstantly}
                className="text-[#E2B873] hover:underline cursor-pointer uppercase tracking-wider font-semibold"
              >
                Strike Gavel Instantly &rarr;
              </button>
              <span className="w-12 h-[1px] bg-white/20" />
            </div>
          </div>
        )}

        {/* FRAME 04: Editorial Headline Reveal (After Strike: scroll 0.48 -> 0.78) */}
        {scrollProgress >= 0.46 && scrollProgress < 0.85 && (
          <div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none transition-all duration-500"
            style={{
              opacity: scrollProgress >= 0.50 ? Math.min(1, (scrollProgress - 0.50) / 0.08) : 0,
              transform: `scale(${1 - (scrollProgress - 0.50) * 0.15})`
            }}
          >
            <div className="space-y-4 max-w-4xl">
              <span className="font-mono text-xs md:text-sm tracking-[0.4em] uppercase text-[#C89B53] font-semibold block">
                THE VERDICT IS YOURS
              </span>

              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif tracking-tight leading-[1.05]">
                <span className="block text-[#F3F0E8] drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                  Find counsel.
                </span>
                <span className="block text-gold-gradient font-normal italic drop-shadow-[0_15px_40px_rgba(200,155,83,0.3)]">
                  Not chaos.
                </span>
              </h1>

              <p className="text-sm md:text-base font-sans text-[#C2BDB5] max-w-xl mx-auto pt-2 leading-relaxed drop-shadow-md">
                An editorial decision desk where discerning clients hear, evaluate, and retain preeminent litigation partners.
              </p>

              <div className="pt-4 pointer-events-auto">
                <button
                  onClick={onExploreClick}
                  className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-[#F3F0E8] text-[#080808] font-sans text-xs font-semibold tracking-wider hover:bg-[#E2B873] transition-all cursor-pointer shadow-2xl group"
                >
                  <span>Enter Chambers Docket</span>
                  <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 5: Seamless Camera Transition to Judge's Bench Surface */}
        <div 
          className="absolute inset-0 bg-[#060606] pointer-events-none z-30 transition-opacity duration-200"
          style={{ opacity: transitionDarknessOpacity }}
        />

        {/* Transition Typography during bench push */}
        {scrollProgress >= 0.78 && (
          <div 
            className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center px-6 pointer-events-none transition-opacity duration-300"
            style={{ opacity: Math.min(1, (scrollProgress - 0.78) / 0.12) }}
          >
            <span className="font-mono text-xs tracking-[0.3em] uppercase text-[#C89B53] block mb-3">
              THE TRANSITION
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif text-[#F3F0E8] tracking-tight">
              "THE RIGHT VOICE. THE RIGHT COUNSEL."
            </h2>
          </div>
        )}

        {/* Scroll Progress Indicator Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 z-30">
          <div 
            className="h-full bg-gradient-to-r from-[#8E6D38] via-[#C89B53] to-[#E2B873] transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

      </div>
    </div>
  );
};
