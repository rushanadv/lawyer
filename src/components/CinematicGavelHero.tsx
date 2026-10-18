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

  const lastProgressRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

  // Check sessionStorage
  useEffect(() => {
    const delivered = sessionStorage.getItem('lex_verdict_delivered');
    if (delivered === 'true') {
      setHasDelivered(true);
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
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    // Cinematic Camera (three-quarters perspective revealing vertical head, perpendicular handle, and sound block)
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 50);
    cameraRef.current = camera;

    // Build the 3D courtroom scene
    const sceneData = buildCinematicCourtroomScene();
    sceneObjectsRef.current = sceneData;

    (window as any).__LEX_3D__ = { camera, sceneData, gavelAssemblyRef, renderer };

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
      assembly.gavelPivot.rotation.z = assembly.suspendedAngle;
    }).catch((err) => {
      console.warn('Modular STL loading note:', err);
    });

    let clock = new THREE.Clock();

    // Initial Camera Transform: Shot 01 Extreme Macro Close-up of striking head & dark walnut grain
    const camStartPos = new THREE.Vector3(0.9, 0.9, 2.0);
    const camTarget = new THREE.Vector3(-0.15, 0.9, 0.0);
    camera.position.copy(camStartPos);
    camera.lookAt(camTarget);

    // Render loop
    const render = () => {
      animationFrameIdRef.current = requestAnimationFrame(render);
      const delta = clock.getDelta();
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

    const activePivot = assembly ? assembly.gavelPivot : sceneData.gavelPivot;

    const suspendedAngle = assembly ? assembly.suspendedAngle : 0.22;
    const raisedAngle = assembly ? assembly.raisedAngle : 0.40;
    const exactContactAngle = assembly ? assembly.exactContactAngle : 0.0;

    let gavelRotationZ = exactContactAngle;

    // ========================================================
    // STEP 5: CONTINUOUS SCROLL MASTER TIMELINE (0.0 -> 1.0)
    // ========================================================
    if (progress <= 0.25) {
      // Phase 1 (0–25%): Suspended Gavel with gentle organic micro-float
      const floatOffset = Math.sin(Date.now() * 0.001) * 0.003;
      gavelRotationZ = suspendedAngle + floatOffset;
    } else if (progress <= 0.45) {
      // Phase 2 (25–45%): Gavel raises backward around its handle pivot into preparation pose
      const t = (progress - 0.25) / (0.45 - 0.25);
      const easeT = Math.sin((t * Math.PI) / 2); // natural wind-up ease-out
      gavelRotationZ = THREE.MathUtils.lerp(suspendedAngle, raisedAngle, easeT);
    } else if (progress <= 0.75) {
      // Phase 3 (45–75%): Gavel swings downward, accelerating naturally toward sound block
      const t = (progress - 0.45) / (0.75 - 0.45);
      const accel = Math.pow(t, 2.6);
      gavelRotationZ = THREE.MathUtils.lerp(raisedAngle, exactContactAngle, accel);
    } else if (progress <= 0.85) {
      // Phase 4 (75–85%): Striking surface contacts the sound block (0.0 gap, 0.0 penetration)
      gavelRotationZ = exactContactAngle;
    } else if (progress <= 0.90) {
      // Phase 5 (85–90%): Tiny natural rebound followed by settling
      const t = (progress - 0.85) / (0.90 - 0.85);
      const rebound = Math.sin(t * Math.PI) * 0.016; // ~0.9 degrees restrained rebound
      gavelRotationZ = exactContactAngle + rebound;
    } else {
      // Phase 6 (90–100%): Firmly settled at rest on sound block, headline reveal
      gavelRotationZ = exactContactAngle;
    }

    if (activePivot) {
      activePivot.rotation.z = gavelRotationZ;
    }

    // ========================================================
    // IMPACT AUDIO & RESTRAINED CAMERA IMPULSE (Crossing 0.75 in forward direction)
    // ========================================================
    if (lastProgressRef.current < 0.75 && progress >= 0.75) {
      setHasDelivered(true);
      sessionStorage.setItem('lex_verdict_delivered', 'true');

      // Trigger Web Audio authentic wooden impact sound
      soundEngine.playGavelImpact();

      // Physically restrained camera impulse
      const impulseSteps = [
        { x: 3.0, y: -4.0 },
        { x: -2.0, y: 2.5 },
        { x: 1.0, y: -1.2 },
        { x: -0.5, y: 0.6 },
        { x: 0, y: 0 }
      ];
      impulseSteps.forEach((step, idx) => {
        setTimeout(() => setCameraShake(step), idx * 40);
      });
    }

    lastProgressRef.current = progress;

    if (progress >= 0.97) {
      onTransitionComplete?.();
    }

    // ========================================================
    // SHOTS 01–04: CINEMATIC CAMERA CHOREOGRAPHY
    // ========================================================
    const camera = cameraRef.current;
    if (camera) {
      if (progress <= 0.25) {
        // Shot 01 (0–25%): The Macro Reveal
        // Begins in extreme macro close-up of the striking head & dark walnut wood grain,
        // then smoothly pulls back to establish the gavel, handle, and sound block
        const t = progress / 0.25;
        const easeT = Math.sin((t * Math.PI) / 2);
        camera.position.x = THREE.MathUtils.lerp(0.9, 2.4, easeT);
        camera.position.y = THREE.MathUtils.lerp(0.9, 0.5, easeT);
        camera.position.z = THREE.MathUtils.lerp(2.0, 4.8, easeT);
        camera.lookAt(
          THREE.MathUtils.lerp(-0.15, -0.8, easeT),
          THREE.MathUtils.lerp(0.9, -0.4, easeT),
          0.0
        );
      } else if (progress <= 0.45) {
        // Shot 02 (25–45%): The Anticipation
        // Gavel lifts backward; camera moves around the striking head in a controlled arc
        const t = (progress - 0.25) / (0.45 - 0.25);
        camera.position.x = THREE.MathUtils.lerp(2.4, 2.5, t);
        camera.position.y = THREE.MathUtils.lerp(0.5, 0.9, t);
        camera.position.z = THREE.MathUtils.lerp(4.8, 4.4, t);
        camera.lookAt(
          THREE.MathUtils.lerp(-0.8, -0.5, t),
          THREE.MathUtils.lerp(-0.4, 0.2, t),
          0.0
        );
      } else if (progress <= 0.75) {
        // Shot 03 (45–75%): The Impact
        // Gavel swings downward with accelerating physical weight
        const t = (progress - 0.45) / (0.75 - 0.45);
        camera.position.x = THREE.MathUtils.lerp(2.5, 2.1, t);
        camera.position.y = THREE.MathUtils.lerp(0.9, 0.1, t);
        camera.position.z = THREE.MathUtils.lerp(4.4, 3.8, t);
        camera.lookAt(
          THREE.MathUtils.lerp(-0.5, -0.2, t),
          THREE.MathUtils.lerp(0.2, -0.85, t),
          0.0
        );
      } else if (progress <= 0.88) {
        // Contact, Rebound & Settle (75–88%)
        const t = (progress - 0.75) / (0.88 - 0.75);
        camera.position.x = THREE.MathUtils.lerp(2.1, 1.8, t);
        camera.position.y = THREE.MathUtils.lerp(0.1, -0.1, t);
        camera.position.z = THREE.MathUtils.lerp(3.8, 3.4, t);
        camera.lookAt(-0.2, -0.85, 0.0);
      } else {
        // Shot 04 (88–100%): The Match-Cut Transition
        // Camera glides toward the dark wood contact surface as courtroom dims to black
        const t = (progress - 0.88) / 0.12;
        camera.position.x = THREE.MathUtils.lerp(1.8, 0.0, t);
        camera.position.y = THREE.MathUtils.lerp(-0.1, -1.0, t);
        camera.position.z = THREE.MathUtils.lerp(3.4, 1.4, t);
        camera.lookAt(
          THREE.MathUtils.lerp(-0.2, 0.0, t),
          THREE.MathUtils.lerp(-0.85, -1.34, t),
          0.0
        );

        // Environmental lighting dims smoothly into total darkness for seamless transition into 3D typography
        if (sceneData.keyLight) {
          sceneData.keyLight.intensity = THREE.MathUtils.lerp(6.2, 0.4, t);
        }
        if (sceneData.ambientLight) {
          sceneData.ambientLight.intensity = THREE.MathUtils.lerp(0.95, 0.05, t);
        }
        if (sceneData.rimLight) {
          sceneData.rimLight.intensity = THREE.MathUtils.lerp(1.8, 0.1, t);
        }
      }
    }
  }, []);

  // Quick Strike Action (Smoothly scrolls directly to impact contact at 75%)
  const strikeInstantly = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTarget = containerRef.current.offsetTop + containerRef.current.offsetHeight * 0.75;
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, []);

  // Replay Action
  const replayVerdict = useCallback(() => {
    lastProgressRef.current = 0;
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

  return (
    <div 
      ref={containerRef}
      id="cinematic-hero-container"
      className="relative w-full bg-[#0a0908]"
      style={{ height: '350vh', minHeight: '350vh' }}
      aria-label="Cinematic 3D Courtroom Verdict"
    >
      {/* Sticky Fullscreen 3D Viewport (Edge-to-edge, zero borders, zero containers) */}
      <div 
        className="sticky top-0 left-0 w-full overflow-hidden select-none"
        style={{
          height: '100vh',
          width: '100%',
          transform: `translate(${cameraShake.x}px, ${cameraShake.y}px)`,
          transition: cameraShake.x !== 0 ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Fullscreen Three.js WebGL Canvas */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full block" 
        />

        {/* Minimal Editorial HUD Controls (top-right pill controls) */}
        <div className="absolute top-20 right-6 md:right-12 z-30 flex items-center gap-3 pointer-events-auto">
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

        {/* FRAME 01 & 02: Initial Minimal Prompts (Before Strike) */}
        {scrollProgress < 0.65 && (
          <div 
            className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center justify-center text-center px-4 transition-opacity duration-300 pointer-events-auto"
            style={{ opacity: 1 - scrollProgress * 1.5 }}
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

        {/* FRAME 05: Editorial Headline Reveal (Strictly AFTER Contact: 90% – 100%) */}
        {scrollProgress >= 0.88 && (
          <div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none transition-all duration-300"
            style={{
              opacity: Math.min(1, (scrollProgress - 0.88) / 0.05),
              transform: `scale(${1 - (scrollProgress - 0.88) * 0.1})`
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
                  <span>Explore 3D Manifesto & Counsel</span>
                  <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
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
