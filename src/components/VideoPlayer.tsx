import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, Sliders, Camera, DollarSign, ExternalLink, 
  Heart, Flame, Gift, Star, Eye, ThumbsUp, AlertCircle
} from 'lucide-react';
import { Film } from '../types';

interface VideoPlayerProps {
  film: Film;
  onLike: (id: string) => void;
  isLiked: boolean;
  onOpenTipJar: () => void;
}

export default function VideoPlayer({ film, onLike, isLiked, onOpenTipJar }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Reset active episode when changing film
  useEffect(() => {
    setActiveEpisodeIdx(0);
  }, [film]);

  const currentVideoUrl = (film.episodes && film.episodes[activeEpisodeIdx])
    ? film.episodes[activeEpisodeIdx].videoUrl
    : film.videoUrl;

  // Auto-play when video URL changes
  useEffect(() => {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Auto-start play (muted or low volume if browser blocks)
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Auto-play blocked by browser, that is fine
            setIsPlaying(false);
          });
      }
    }
  }, [currentVideoUrl]);

  // Handle controls visibility timeout on mouse movement
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(timeoutId);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      videoRef.current.muted = nextMuted;
      if (nextMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume;
      }
    }
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Monitor browser fullscreen changes (e.g. Esc key pressed)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Lights Off Cinematic Cover Overlay */}
      {isLightsOff && (
        <div 
          onClick={() => setIsLightsOff(false)}
          className="fixed inset-0 bg-black/95 z-50 transition-all duration-500 cursor-pointer flex items-center justify-center"
        >
          <div className="absolute top-6 left-6 text-white/30 text-[9px] font-mono uppercase tracking-widest">
            Cinema Mode Active • Click anywhere to exit
          </div>
        </div>
      )}

      {/* Main Player Area */}
      <div 
        id="cinema-player-container"
        ref={containerRef}
        className={`relative overflow-hidden rounded-lg bg-black border border-white/5 group shadow-2xl transition-all duration-500 ${
          theaterMode ? 'w-full aspect-[21/9]' : 'w-full aspect-video'
        } ${isLightsOff ? 'z-55 shadow-amber-500/5 ring-1 ring-amber-500/10' : ''}`}
      >
        {/* Video HTML5 Tag */}
        <video
          id="cinema-html5-video"
          ref={videoRef}
          src={currentVideoUrl}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => {
            setHasError(true);
            setIsPlaying(false);
          }}
          playsInline
        />

        {/* Error overlay or friendly fallback */}
        {hasError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Cinematic Stream Offline</h4>
            <p className="text-[11px] text-white/60 max-w-md leading-relaxed mb-4">
              This video stream from an external host is blocked, offline, or requires direct playback. You can also view this application in a new tab to bypass iframe restriction policies.
            </p>
            <button
              onClick={() => {
                setHasError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-extrabold uppercase tracking-widest rounded transition-all active:scale-95 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Big Centered Play/Pause Click Overlay */}
        <div 
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 cursor-pointer ${
            isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="h-16 w-16 md:h-18 md:w-18 rounded border border-white/25 bg-black/75 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all backdrop-blur-md">
            <Play className="h-6 w-6 fill-current translate-x-0.5" />
          </div>
        </div>

        {/* Cinematic Custom HUD Overlay Controls */}
        <div 
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 md:p-6 flex flex-col gap-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Timeline scrub bar */}
          <div className="flex items-center gap-3 w-full group/timeline">
            <span className="text-[9px] font-mono text-white/40 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              id="video-scrub-input"
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleScrub}
              className="flex-1 h-1 rounded appearance-none cursor-pointer bg-white/10 accent-amber-500 focus:outline-none"
            />
            <span className="text-[9px] font-mono text-white/40 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls button row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play / Pause Toggle */}
              <button 
                id="btn-play-toggle"
                onClick={togglePlay} 
                className="text-white hover:text-amber-500 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current" />}
              </button>

              {/* Volume Slider & Icon */}
              <div className="flex items-center gap-2 group/volume">
                <button 
                  id="btn-volume-toggle"
                  onClick={toggleMute} 
                  className="text-white hover:text-amber-500 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
                </button>
                <input
                  id="video-volume-input"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-12 h-1 bg-white/10 accent-amber-500 rounded appearance-none cursor-pointer group-hover/volume:w-16 transition-all focus:outline-none"
                />
              </div>

              {/* Badge info */}
              <div className="hidden sm:flex items-center gap-2 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">
                  {film.genre[0]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Speed Controller */}
              <button
                id="btn-speed-control"
                onClick={changeSpeed}
                className="text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/15 hover:border-white/30 active:scale-95 transition-all cursor-pointer"
                title="Playback speed"
              >
                {playbackSpeed === 1 ? '1.0X' : `${playbackSpeed}X`}
              </button>

              {/* Lights Toggle */}
              <button
                id="btn-lights-toggle"
                onClick={() => setIsLightsOff(!isLightsOff)}
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border active:scale-95 tracking-widest transition-all cursor-pointer ${
                  isLightsOff 
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/25' 
                    : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'
                }`}
                title="Toggle Lights Off mode"
              >
                DARK MODE
              </button>

              {/* Theater Mode Toggle */}
              <button
                id="btn-theater-toggle"
                onClick={() => setTheaterMode(!theaterMode)}
                className="hidden md:block text-white/50 hover:text-amber-500 transition-colors cursor-pointer"
                title="Toggle theater mode (wide)"
              >
                <Sliders className={`h-4 w-4 ${theaterMode ? 'text-amber-400' : ''}`} />
              </button>

              {/* Fullscreen Toggle */}
              <button 
                id="btn-fullscreen-toggle"
                onClick={toggleFullscreen} 
                className="text-white hover:text-amber-500 transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize className="h-4.5 w-4.5" /> : <Maximize className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Episode Guide for Series */}
      {film.type === 'series' && film.episodes && film.episodes.length > 0 && (
        <div className="bg-[#0c0c0e] border border-white/5 rounded-lg p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              ✦ Episode Guide ({film.episodes.length} episodes)
            </h4>
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Select an episode to play</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {film.episodes.map((ep, idx) => {
              const isCurrent = activeEpisodeIdx === idx;
              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    setActiveEpisodeIdx(idx);
                  }}
                  className={`p-3.5 rounded border text-left flex flex-col gap-1 transition-all cursor-pointer relative group overflow-hidden ${
                    isCurrent 
                      ? 'bg-amber-500/[0.04] border-amber-500/50 shadow-lg' 
                      : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${isCurrent ? 'text-amber-500' : 'text-white/30'}`}>
                      {isCurrent ? '▶ NOW SHOWING' : `EPISODE ${idx + 1}`}
                    </span>
                    <span className="text-[9px] font-mono text-white/40 tabular-nums">{ep.duration}</span>
                  </div>
                  <h5 className={`text-xs font-semibold leading-snug transition-colors ${isCurrent ? 'text-[#F5F5F7]' : 'text-white/70 group-hover:text-white'}`}>
                    {ep.title}
                  </h5>
                  {isCurrent && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Film Information & Filmmaker Technical Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-[#0c0c0e] p-6 md:p-8 rounded-lg border border-white/5">
        
        {/* Left Column: Film Identity */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {film.type === 'series' ? (
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest bg-rose-500/5 text-rose-400 border border-rose-500/10 px-2 py-0.5 rounded">
                Web Series
              </span>
            ) : (
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest bg-amber-500/5 text-amber-500 border border-amber-500/10 px-2 py-0.5 rounded">
                Short Film
              </span>
            )}
            <span className="text-[10px] text-white/40 font-mono tracking-wider">{film.duration.toUpperCase()}</span>
            <span className="text-white/10">•</span>
            <span className="text-[10px] text-white/40 font-mono tracking-wider">RELEASED {film.releaseYear}</span>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#F5F5F7] mb-2 font-display">{film.title}</h2>
            <p className="text-xs text-white/50 font-sans leading-relaxed">{film.description}</p>
          </div>

          <div className="flex flex-wrap gap-1">
            {film.genre.map((g, idx) => (
              <span key={idx} className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-0.5 bg-white/5 text-white/40 rounded border border-white/5">
                {g}
              </span>
            ))}
          </div>

          {/* Social Stats & Like/Share Controls */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono uppercase tracking-wider">
              <Eye className="h-3.5 w-3.5 text-white/30" />
              <span>{film.views.toLocaleString()} screenings</span>
            </div>
            
            {/* Direct Interaction Button */}
            <button
              id={`like-btn-${film.id}`}
              onClick={() => onLike(film.id)}
              className={`flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest py-1 px-3 rounded border transition-all cursor-pointer ${
                isLiked 
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-sm' 
                  : 'bg-white/5 text-white/40 border border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              <ThumbsUp className={`h-3 w-3 ${isLiked ? 'text-rose-500' : ''}`} />
              <span>{film.likes + (isLiked ? 1 : 0)} Likes</span>
            </button>
          </div>
        </div>

        {/* Right Column: Filmmaker Technical Specs & Support */}
        <div className="flex flex-col gap-4 bg-black/20 p-5 rounded border border-white/5">
          <h3 className="text-[9px] font-mono font-bold tracking-widest text-white/40 uppercase border-b border-white/5 pb-2 flex items-center justify-between">
            <span>TECHNICAL SPEC SHEET</span>
            <span className="text-amber-500">METRICS</span>
          </h3>

          <div className="flex flex-col gap-3">
            {/* Director */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Director:</span>
              <span className="text-xs text-[#F5F5F7] font-semibold text-right">{film.director}</span>
            </div>
          </div>

          {/* Democratic Crowdfund Spotlight / Virtual Tip Jar */}
          <div className="mt-2 pt-3 border-t border-white/5">
            <div className="bg-white/[0.02] p-3 rounded border border-white/5 mb-3">
              <p className="text-[10px] text-white/40 font-sans leading-normal">
                Direct community micro-patronage fuels these independent screenings. Tips support their lens acquisition and festival entries.
              </p>
            </div>
            
            <button
              id={`tip-jar-btn-${film.id}`}
              onClick={onOpenTipJar}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest"
            >
              <Gift className="h-4 w-4" />
              <span>Support Filmmaker</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
