import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX, RotateCcw, ArrowDown } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface GavelHeroProps {
  onVerdictDelivered?: () => void;
  onExploreClick: () => void;
}

export const GavelHero: React.FC<GavelHeroProps> = ({ onVerdictDelivered, onExploreClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isImpacted, setIsImpacted] = useState<boolean>(false);
  const [hasDelivered, setHasDelivered] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());
  const [shakeIntensity, setShakeIntensity] = useState<number>(0);

  // Check sessionStorage on mount
  useEffect(() => {
    const delivered = sessionStorage.getItem('lex_verdict_delivered');
    if (delivered === 'true') {
      setHasDelivered(true);
      setIsImpacted(true);
      setScrollProgress(1);
      onVerdictDelivered?.();
    }
  }, [onVerdictDelivered]);

  // Three.js Volumetric Courtroom Atmosphere Particles
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    // Atmospheric courtroom dust particles caught in light beam
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Concentrate in a conical light beam from top-right to center
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      scales[i] = Math.random() * 0.04 + 0.01;
      speeds[i] = Math.random() * 0.003 + 0.001;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle material
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xE2B873,
      size: 0.05,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      const posArray = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] -= speeds[i];
        posArray[i * 3] += Math.sin(elapsedTime * 0.5 + i) * 0.001;
        if (posArray[i * 3 + 1] < -2.5) {
          posArray[i * 3 + 1] = 2.5;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Slight camera parallax
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Trigger impact sequence
  const deliverVerdict = useCallback(() => {
    if (isImpacted) return;
    setIsImpacted(true);
    setHasDelivered(true);
    setScrollProgress(1);

    // Audio impact
    soundEngine.playGavelImpact();

    // Controlled directional screen shake
    setShakeIntensity(1);
    setTimeout(() => setShakeIntensity(0), 400);

    sessionStorage.setItem('lex_verdict_delivered', 'true');
    onVerdictDelivered?.();
  }, [isImpacted, onVerdictDelivered]);

  // Replay sequence
  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImpacted(false);
    setScrollProgress(0);
    setHasDelivered(false);
    sessionStorage.removeItem('lex_verdict_delivered');
    soundEngine.playSubtleTick();
  };

  // Sound toggle
  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEngine.playSubtleTick();
    }
  };

  // Wheel listener to scrub verdict progression
  useEffect(() => {
    if (hasDelivered) return;

    const handleWheel = (e: WheelEvent) => {
      if (hasDelivered) return;
      if (e.deltaY > 0) {
        setScrollProgress((prev) => {
          const next = Math.min(1, prev + 0.14);
          if (next >= 0.95 && !isImpacted) {
            deliverVerdict();
          }
          return next;
        });
      } else if (e.deltaY < 0 && !hasDelivered) {
        setScrollProgress((prev) => Math.max(0, prev - 0.1));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [hasDelivered, isImpacted, deliverVerdict]);

  // Gavel rotation & camera push values
  const gavelAngle = -22 * (1 - scrollProgress); // rotates from -22deg down to 0deg (striking block)
  const cameraZoom = 1 + scrollProgress * 0.12;
  const lightPulseOpacity = shakeIntensity > 0 ? 0.65 : 0;

  return (
    <section
      ref={containerRef}
      id="verdict-hero"
      aria-label="Courtroom Verdict Opening"
      className="relative w-full h-screen min-h-[720px] bg-[#080808] overflow-hidden flex flex-col justify-between select-none"
      style={{
        transform: shakeIntensity > 0 ? `translate(${Math.sin(Date.now()) * 4}px, ${Math.cos(Date.now()) * 6}px)` : 'none',
        transition: shakeIntensity > 0 ? 'none' : 'transform 0.4s ease-out'
      }}
    >
      {/* Three.js Atmospheric Particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Top Header / Status bar */}
      <header className="relative z-30 flex items-center justify-between px-6 md:px-12 pt-8 w-full">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#C89B53] animate-pulse" />
          <span className="font-display tracking-[0.25em] text-xs uppercase text-[#E2B873] font-semibold">
            LEX VERA
          </span>
          <span className="text-[#66615B] text-xs font-mono hidden sm:inline">| CHANCERY DESK</span>
        </div>

        <div className="flex items-center gap-4">
          {hasDelivered && (
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] hover:border-[#C89B53]/40 transition-all cursor-pointer"
              title="Replay Verdict Reveal"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C89B53]" />
              <span className="hidden sm:inline">Replay Verdict</span>
            </button>
          )}

          <button
            onClick={handleToggleSound}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] transition-all cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#C89B53]" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
          </button>
        </div>
      </header>

      {/* Central 3D Cinematic Visual Stage */}
      <div className="relative flex-1 flex items-center justify-center w-full z-20 px-4">
        {/* Directional Volumetric Spotlight Cones */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{
            background: 'radial-gradient(circle at 55% 42%, rgba(200, 155, 83, 0.16) 0%, rgba(200, 155, 83, 0.04) 45%, rgba(8, 8, 8, 0) 75%)',
            opacity: 0.85 + scrollProgress * 0.15
          }}
        />

        {/* Sharp Impact Light Pulse Flash */}
        <div 
          className="absolute inset-0 bg-[#E2B873]/20 pointer-events-none transition-opacity duration-150"
          style={{ opacity: lightPulseOpacity }}
        />

        {/* Photorealistic Gavel & Sound Block Container */}
        <div 
          className="relative w-full max-w-4xl aspect-[16/9] max-h-[65vh] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 ease-out"
          style={{
            transform: `scale(${cameraZoom})`,
            boxShadow: isImpacted ? '0 0 80px rgba(200, 155, 83, 0.25)' : '0 25px 50px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Suspended Gavel Layer (Fades out upon impact) */}
          <div 
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: isImpacted ? 0 : 1,
              transform: `rotate(${gavelAngle * 0.4}deg)`,
              transformOrigin: '75% 45%'
            }}
          >
            <img 
              src="/gavel/gavel_suspended.jpg" 
              alt="Judge's gavel suspended in cinematic light above sound block" 
              className="w-full h-full object-cover filter contrast-[1.08] brightness-[0.96]"
            />
          </div>

          {/* Impact Gavel Layer (Revealed upon strike) */}
          <div 
            className="absolute inset-0 transition-opacity duration-200"
            style={{
              opacity: isImpacted ? 1 : 0
            }}
          >
            <img 
              src="/gavel/gavel_impact.jpg" 
              alt="Judge's gavel striking sound block with dramatic shockwave" 
              className="w-full h-full object-cover filter contrast-[1.12] brightness-[1.02]"
            />
          </div>

          {/* Thin Bronze Shockwave Ring upon impact */}
          {isImpacted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-48 h-48 rounded-full border border-[#E2B873] animate-ping opacity-75"
                style={{ animationDuration: '1.4s', animationIterationCount: 1 }}
              />
            </div>
          )}

          {/* Vignette edge blending */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/70" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#080808] via-transparent to-[#080808]" />
        </div>

        {/* Dramatic Kinetic Typography Reveal */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 px-6 text-center">
          {isImpacted ? (
            <div className="space-y-4 max-w-4xl animate-fade-in">
              <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#C89B53] block">
                THE VERDICT IS YOURS
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif tracking-tight leading-[1.05]">
                <span className="block text-[#F3F0E8] drop-shadow-lg">
                  Find counsel.
                </span>
                <span className="block text-gold-gradient font-normal italic drop-shadow-2xl">
                  Not chaos.
                </span>
              </h1>
              <p className="text-sm md:text-base font-sans text-[#9E988F] max-w-xl mx-auto pt-2 leading-relaxed">
                An editorial decision desk connecting discerning clients to preeminent litigation partners, trial advocates, and sovereign arbitrators.
              </p>
            </div>
          ) : (
            <div 
              className="transition-opacity duration-300"
              style={{ opacity: 1 - scrollProgress * 1.5 }}
            >
              <p className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-[#E2B873]/90">
                SCROLL OR DRAG TO DELIVER THE VERDICT
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Interactive Verdict Scrubber / Action Bar */}
      <footer className="relative z-30 px-6 md:px-12 pb-8 w-full flex flex-col items-center gap-4">
        {!isImpacted ? (
          <div className="w-full max-w-md flex flex-col items-center gap-2">
            {/* Interactive scrub bar */}
            <div 
              className="w-full h-1.5 bg-[#1F1E1D] rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                setScrollProgress(pos);
                if (pos >= 0.85) deliverVerdict();
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-[#8E6D38] via-[#C89B53] to-[#E2B873] transition-all duration-150"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full text-[11px] font-mono text-[#66615B]">
              <span>[PENDING ADJUDICATION]</span>
              <button 
                onClick={deliverVerdict}
                className="text-[#E2B873] hover:underline cursor-pointer uppercase tracking-wider font-semibold"
              >
                Strike Gavel Immediately &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
            <button
              onClick={onExploreClick}
              className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#F3F0E8] text-[#080808] font-sans font-medium text-sm tracking-wide hover:bg-[#E2B873] transition-all duration-300 shadow-xl cursor-pointer"
            >
              <span>Enter Decision Desk</span>
              <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
            
            <a
              href="#how-it-works"
              className="px-6 py-3 rounded-full text-xs font-mono text-[#9E988F] hover:text-[#F3F0E8] transition-colors"
            >
              How It Works
            </a>
          </div>
        )}
      </footer>
    </section>
  );
};
