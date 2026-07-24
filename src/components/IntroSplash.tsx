import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Play, Volume2, VolumeX } from 'lucide-react';

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Buffer messages that rotate during the calibration phase
  const [loadingStep, setLoadingStep] = useState(0);
  const steps = [
    'CALIBRATING PROJECTOR BOOTH...',
    'IGNITING XENON ARC LAMP...',
    'ALIGNING 35MM CINEMATIC FEED...',
    'SYNCING SOUNDSTAGE TRANSDUCERS...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBuffering) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % steps.length);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBuffering]);

  // Safety fallback: if anything fails or gets stuck, auto-complete after 12 seconds
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 12000);

    return () => {
      clearTimeout(safetyTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCanPlay = () => {
    setIsBuffering(false);
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log('Autoplay blocked or playback interrupted:', err);
      });
    }
  };

  const handlePlay = () => {
    setHasStarted(true);
    setIsBuffering(false);

    // Limit playback to exactly 6 seconds after play starts
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleFinish();
    }, 6000);
  };

  const handleFinish = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onComplete();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2B2B2B] flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {isBuffering && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#2B2B2B]/95"
          >
            {/* Cinematic Film Spinner */}
            <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-amber-500/10 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-amber-500/80 animate-pulse" />
            </div>

            {/* Glowing Buffer Progress Status */}
            <div className="flex flex-col items-center gap-2 max-w-xs text-center">
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase animate-pulse">
                Projector Buffering
              </span>
              <p className="text-xs uppercase tracking-widest text-white/50 font-mono min-h-[1.5rem]">
                {steps[loadingStep]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Ambient Backdrop Shadow */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0a0a0c]/60 to-[#0a0a0c] z-10 pointer-events-none" />

      {/* High Quality 6-second Countdown Intro Video */}
      <video
        ref={videoRef}
        src="https://assets.mixkit.co/videos/preview/mixkit-vintage-film-countdown-from-ten-to-one-34440-large.mp4"
        className={`w-full h-full object-cover transition-opacity duration-1000 ${
          hasStarted ? 'opacity-90' : 'opacity-0'
        }`}
        muted={isMuted}
        playsInline
        onCanPlay={handleCanPlay}
        onPlay={handlePlay}
        onEnded={handleFinish}
        onError={() => {
          console.warn("Intro countdown video source failed to load. Gracefully bypassing.");
          handleFinish();
        }}
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-8 left-8 right-8 z-30 flex items-center justify-between pointer-events-auto">
        {/* Sound Toggle Button */}
        <button
          onClick={toggleMute}
          className="flex items-center gap-2 px-3 py-1.5 bg-black/65 hover:bg-black/85 text-white/70 hover:text-white border border-white/10 rounded-lg text-[10px] font-mono tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="h-3.5 w-3.5 text-rose-400" />
              <span>Unmute Audio</span>
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Mute Audio</span>
            </>
          )}
        </button>

        {/* Skip Button */}
        <button
          onClick={handleFinish}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black border border-amber-500/30 hover:border-transparent rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all active:scale-95 cursor-pointer"
        >
          Skip Intro
        </button>
      </div>

      {/* Retro Aspect Frame / Cinematic Vignette */}
      <div className="absolute inset-0 border-[24px] border-black/80 pointer-events-none z-20 md:border-[40px] opacity-70" />
    </div>
  );
}
