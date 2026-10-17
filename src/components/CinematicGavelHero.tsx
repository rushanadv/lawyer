import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX, RotateCcw, ArrowDown } from 'lucide-react';
import { buildCinematicCourtroomScene } from '../utils/gavelModelBuilder';
import type { GavelSceneObjects } from '../utils/gavelModelBuilder';
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
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Cinematic Camera (full-frame ~70mm equivalent focal length for intimate courtroom close-up)
    const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 50);
    cameraRef.current = camera;

    // Build the 3D scene
    const sceneData = buildCinematicCourtroomScene();
    sceneObjectsRef.current = sceneData;

    let clock = new THREE.Clock();

    // Initial Camera Transform (Frame 01: Dramatic Close-Up suspended)
    const camStartPos = new THREE.Vector3(1.6, 2.8, 4.8);
    const camTarget = new THREE.Vector3(0, 0.9, 0.4);
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
    if (!sceneData || !canvasRef.current) return;

    // 1. GAVEL SWING PHYSICS:
    // Frame 01 (0.0 -> 0.2): Suspended mid-air
    // Frame 02 (0.2 -> 0.48): Accelerates downward
    // Frame 03 (0.48 -> 0.52): STRIKE on sound block (exact contact angle = 0.0)
    // Post-impact (0.52 -> 0.56): Restrained rebound (0.025 rad) then settles firmly
    let gavelRotationX = 0;
    const initialSuspendedAngle = -0.58; // ~33 degrees upward tilt

    if (progress <= 0.15) {
      // Gentle breathing float
      gavelRotationX = initialSuspendedAngle + Math.sin(Date.now() * 0.001) * 0.005;
    } else if (progress <= 0.48) {
      // Gravitational acceleration (easeInCubic)
      const swingT = (progress - 0.15) / (0.48 - 0.15);
      const accel = Math.pow(swingT, 2.6);
      gavelRotationX = initialSuspendedAngle * (1 - accel);
    } else if (progress <= 0.54) {
      // Rebound phase
      const reboundT = (progress - 0.48) / 0.06;
      // Slight bounce upward then settle
      gavelRotationX = Math.sin(reboundT * Math.PI) * 0.035;
    } else {
      // Firmly at rest on block
      gavelRotationX = 0;
    }

    sceneData.gavelPivot.rotation.x = gavelRotationX;

    // 2. STRIKE DETECTION & IMPACT EFFECTS (around progress 0.48 - 0.50)
    if (progress >= 0.48 && !hasImpactPlayedRef.current) {
      hasImpactPlayedRef.current = true;
      setHasDelivered(true);
      sessionStorage.setItem('lex_verdict_delivered', 'true');

      // Trigger Web Audio sound effect
      soundEngine.playGavelImpact();

      // Trigger fine dust particles catching the light
      sceneData.triggerDustBurst();

      // Restrained camera impulse shake
      const shakeSteps = [
        { x: 3, y: -4 },
        { x: -2, y: 3 },
        { x: 1, y: -2 },
        { x: 0, y: 0 }
      ];
      shakeSteps.forEach((step, idx) => {
        setTimeout(() => setCameraShake(step), idx * 60);
      });
    } else if (progress < 0.42) {
      // If user scrolls backwards before impact, reset trigger so they can deliver again!
      hasImpactPlayedRef.current = false;
    }

    if (progress >= 0.96) {
      onTransitionComplete?.();
    }

    // 3. CAMERA CHOREOGRAPHY:
    // Frame 01 (0.0 -> 0.2): Dramatic close-up
    // Frame 02 (0.2 -> 0.48): Dolly push forward & slight lower
    // Frame 03 (0.48 -> 0.72): Settles into majestic front three-quarter view
    // Frame 05 (0.75 -> 1.0): Camera lowers toward dark judge's bench surface for seamless transition
    const camera = cameraRef.current;
    if (camera) {
      if (progress <= 0.48) {
        const dollyT = progress / 0.48;
        // Interpolate camera position
        camera.position.x = THREE.MathUtils.lerp(1.6, 0.9, dollyT);
        camera.position.y = THREE.MathUtils.lerp(2.8, 1.8, dollyT);
        camera.position.z = THREE.MathUtils.lerp(4.8, 3.4, dollyT);
        camera.lookAt(0, 0.65, 0.2);
      } else if (progress <= 0.75) {
        const revealT = (progress - 0.48) / (0.75 - 0.48);
        camera.position.x = THREE.MathUtils.lerp(0.9, 0.3, revealT);
        camera.position.y = THREE.MathUtils.lerp(1.8, 1.4, revealT);
        camera.position.z = THREE.MathUtils.lerp(3.4, 2.8, revealT);
        camera.lookAt(0, 0.55, 0.1);
      } else {
        // Transition: Push down towards the dark walnut bench surface
        const transT = (progress - 0.75) / 0.25;
        camera.position.x = THREE.MathUtils.lerp(0.3, 0.0, transT);
        camera.position.y = THREE.MathUtils.lerp(1.4, 0.15, transT);
        camera.position.z = THREE.MathUtils.lerp(2.8, 1.2, transT);
        camera.lookAt(0, 0.0, -0.5);
      }
    }
  }, []);

  // Quick Strike Action
  const strikeInstantly = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTarget = containerRef.current.offsetTop + containerRef.current.offsetHeight * 0.52;
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
              "THE RIGHT DEFENSE BEGINS WITH THE RIGHT VOICE."
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
