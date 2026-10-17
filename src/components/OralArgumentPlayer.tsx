import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, FileText, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface OralArgumentPlayerProps {
  lawyerId: string;
  lawyerName: string;
  transcript: string;
  duration?: number;
  compact?: boolean;
}

export const OralArgumentPlayer: React.FC<OralArgumentPlayerProps> = ({
  lawyerId,
  lawyerName,
  transcript,
  duration = 15,
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop speech if lawyerId changes or component unmounts
  useEffect(() => {
    return () => {
      if (soundEngine.isLawyerPlaying(lawyerId)) {
        soundEngine.stopSpeech();
      }
    };
  }, [lawyerId]);

  // Handle Play/Pause
  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (isPlaying) {
      soundEngine.stopSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      soundEngine.playOralArgument(
        lawyerId,
        transcript,
        (time) => {
          setCurrentTime(time);
        },
        () => {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      );
    }
  }, [isPlaying, lawyerId, transcript]);

  // Waveform Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timeOffset = 0;
    const barCount = compact ? 28 : 42;

    const render = () => {
      timeOffset += isPlaying ? 0.08 : isHovered ? 0.03 : 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);
        const progressThreshold = (i / barCount) * duration;
        const isPassed = currentTime >= progressThreshold;

        // Calculate dynamic height based on audio playback state
        let normalizedHeight: number;
        if (isPlaying) {
          // Dynamic frequency-like modulation
          const wave1 = Math.sin(timeOffset * 3 + i * 0.4);
          const wave2 = Math.cos(timeOffset * 2 - i * 0.2);
          const voiceMod = Math.abs(Math.sin(timeOffset * 5 + (i % 5))) * 0.5 + 0.3;
          normalizedHeight = (Math.abs(wave1 * 0.6 + wave2 * 0.4) * voiceMod * 0.7 + 0.15);
        } else if (isHovered) {
          // Gentle ambient ripple on hover
          normalizedHeight = 0.2 + Math.abs(Math.sin(timeOffset * 2 + i * 0.3)) * 0.25;
        } else {
          // Static harmonic curve with resting ripple
          const baseline = Math.sin((i / barCount) * Math.PI) * 0.35 + 0.15;
          const subtleTick = Math.sin(timeOffset + i * 0.2) * 0.05;
          normalizedHeight = Math.max(0.1, baseline + subtleTick);
        }

        const barHeight = Math.max(4, normalizedHeight * height * 0.85);
        const y = (height - barHeight) / 2;

        // Color coding: gold for passed time, warm gray for future
        if (isPassed && isPlaying) {
          ctx.fillStyle = '#E2B873';
        } else if (isPassed) {
          ctx.fillStyle = '#C89B53';
        } else {
          ctx.fillStyle = isHovered ? 'rgba(243, 240, 232, 0.3)' : 'rgba(158, 152, 143, 0.25)';
        }

        // Draw rounded bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isHovered, currentTime, duration, compact]);

  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const remainingS = s % 60;
    return `${m}:${remainingS < 10 ? '0' : ''}${remainingS}`;
  };

  return (
    <div 
      className={`rounded-2xl transition-all duration-300 border ${
        compact 
          ? 'bg-[#121212]/90 border-white/5 p-3.5' 
          : 'glass-panel border-[#C89B53]/25 p-5'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${isPlaying ? 'bg-[#C89B53] text-[#080808]' : 'bg-[#1E1D1B] text-[#C89B53]'}`}>
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-mono text-[10px] tracking-wider uppercase text-[#C89B53] font-semibold block">
              ORAL ARGUMENT · 15S INTAKE
            </span>
            {!compact && (
              <span className="text-xs font-serif text-[#F3F0E8] italic">
                {lawyerName}’s strategic approach
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            soundEngine.playSubtleTick();
            setShowTranscript(!showTranscript);
          }}
          className="flex items-center gap-1 text-[11px] font-mono text-[#9E988F] hover:text-[#E2B873] transition-colors cursor-pointer px-2 py-1 rounded glass-pill"
          title="Read spoken transcript"
        >
          <FileText className="w-3 h-3" />
          <span>{showTranscript ? 'Hide' : 'Transcript'}</span>
          {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Player Bar: Play button + Canvas Waveform + Timer */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isPlaying
              ? 'bg-[#E2B873] text-[#080808] scale-105 shadow-md shadow-[#C89B53]/30'
              : 'bg-[#1F1D1A] hover:bg-[#C89B53] text-[#F3F0E8] hover:text-[#080808] border border-white/10'
          }`}
          aria-label={isPlaying ? 'Pause Oral Argument' : 'Play Oral Argument'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Animated Waveform Canvas */}
        <div 
          className="flex-1 h-9 relative flex items-center cursor-pointer"
          onClick={() => togglePlay()}
          title="Click to play or pause"
        >
          <canvas
            ref={canvasRef}
            width={compact ? 240 : 380}
            height={36}
            className="w-full h-full"
          />
        </div>

        {/* Timestamp */}
        <div className="flex-shrink-0 font-mono text-[11px] text-[#9E988F] tabular-nums">
          <span className="text-[#F3F0E8] font-medium">{formatTime(currentTime)}</span>
          <span className="text-[#66615B]"> / 0:15</span>
        </div>
      </div>

      {/* Expandable Transcript Drawer */}
      {showTranscript && (
        <div className="mt-3 pt-3 border-t border-white/10 text-xs font-sans text-[#E0DCD3] leading-relaxed italic bg-[#0A0A0A]/60 p-3 rounded-xl border border-white/5 animate-fade-in">
          <span className="font-mono text-[10px] text-[#C89B53] uppercase not-italic block mb-1">
            VERBATIM RECORDING TRANSCRIPT:
          </span>
          "{transcript}"
        </div>
      )}
    </div>
  );
};
