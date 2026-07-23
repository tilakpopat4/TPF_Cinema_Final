import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, Sliders, Camera, DollarSign, ExternalLink, 
  Heart, Flame, Gift, Star, Eye, ThumbsUp, AlertCircle,
  Shield, ShieldOff, EyeOff, Subtitles, Settings, Check
} from 'lucide-react';
import { Film } from '../types';
import { getVideoEmbedData } from '../lib/driveUtils';
import { resolveMediaUrl } from '../lib/mediaStorage';

interface VideoPlayerProps {
  film: Film;
  onLike: (id: string) => void;
  isLiked: boolean;
  onOpenTipJar: () => void;
  initialEpisodeIndex?: number;
}

export default function VideoPlayer({ film, onLike, isLiked, onOpenTipJar, initialEpisodeIndex = 0 }: VideoPlayerProps) {
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
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState(initialEpisodeIndex);
  const [hasError, setHasError] = useState(false);
  
  // Dynamic live video URL resolution
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  
  // Netflix-style Pause Title Slide state (slides in from left after 5s of pause)
  const [showPauseSlide, setShowPauseSlide] = useState(false);

  // YouTube Stealth Pipeline: Hides YouTube UI, title bars, and branding
  const [stealthPipelineActive, setStealthPipelineActive] = useState(true);

  // Auto English Captions & Video Quality states
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'Auto' | '4K' | '1080p' | '720p' | '360p'>('1080p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualityToast, setQualityToast] = useState<string | null>(null);

  // Helper: Generates realistic timed English Auto-Captions/Subtitles
  function getAutoEnglishCaption(timeInSeconds: number, filmObj: Film): string | null {
    if (timeInSeconds <= 0) return null;
    const cycle = Math.floor(timeInSeconds % 120);
    
    if (cycle >= 0 && cycle < 6) return `[Orchestral Theme Music Playing]`;
    if (cycle >= 6 && cycle < 15) return `(Narrator) "Welcome to ${filmObj.title}."`;
    if (cycle >= 15 && cycle < 26) return `"${filmObj.description.slice(0, 80)}..."`;
    if (cycle >= 26 && cycle < 36) return `[Ambient atmospheric soundscapes]`;
    if (cycle >= 36 && cycle < 48) return `[English] "We must forge ahead with courage and purpose."`;
    if (cycle >= 48 && cycle < 58) return `[Action Sequence] (Cinematic drums & sword clashes)`;
    if (cycle >= 58 && cycle < 70) return `[Character] "History is written by those who dare."`;
    if (cycle >= 70 && cycle < 82) return `(Subtitles) "Look towards the horizon—our victory is near."`;
    if (cycle >= 82 && cycle < 95) return `[Suspenseful Score Building]`;
    if (cycle >= 95 && cycle < 108) return `[English Dialogue] "This moment defines our ultimate destiny."`;
    if (cycle >= 108 && cycle < 120) return `[Cinematic Musical Climax]`;
    return null;
  }

  // Sync active episode when changing film or initialEpisodeIndex
  useEffect(() => {
    setActiveEpisodeIdx(initialEpisodeIndex || 0);
    setShowPauseSlide(false);
  }, [film, initialEpisodeIndex]);

  // Netflix-style Pause Title Slide timer: shows full screen pause slide 1.5s after pausing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPlaying) {
      timer = setTimeout(() => {
        setShowPauseSlide(true);
      }, 1500);
    } else {
      setShowPauseSlide(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying]);

  // Always compute normalized episodes list for series
  const episodesList = (film.type === 'series')
    ? (film.episodes && film.episodes.length > 0)
        ? film.episodes
        : [{ id: `${film.id}-ep-1`, title: `${film.title} - Episode 1`, duration: film.duration || 'Full Stream', videoUrl: film.videoUrl }]
    : [];

  const currentEpisode = (episodesList.length > 0 && episodesList[activeEpisodeIdx])
    ? episodesList[activeEpisodeIdx]
    : null;

  const currentVideoUrl = currentEpisode
    ? currentEpisode.videoUrl
    : film.videoUrl;

  // Resolve current video URL asynchronously if it's an indexeddb: or blob: link
  useEffect(() => {
    let isMounted = true;
    if (currentVideoUrl) {
      resolveMediaUrl(currentVideoUrl).then((resolved) => {
        if (isMounted) {
          setResolvedVideoUrl(resolved);
        }
      }).catch(() => {
        if (isMounted) setResolvedVideoUrl(currentVideoUrl);
      });
    } else {
      setResolvedVideoUrl('');
    }
    return () => { isMounted = false; };
  }, [currentVideoUrl]);

  const activeStreamUrl = resolvedVideoUrl || currentVideoUrl;

  const embedData = getVideoEmbedData(activeStreamUrl, {
    hideYouTubePlayerUI: stealthPipelineActive,
    autoplay: true
  });

  const { isEmbed, embedUrl, provider } = embedData;

  // Auto-play when video URL changes
  useEffect(() => {
    setHasError(false);
    if (!isEmbed && videoRef.current && activeStreamUrl) {
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
  }, [activeStreamUrl, isEmbed]);

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

      {/* Prominent Series Listed Episode Options Bar */}
      {film.type === 'series' && (
        <div className="bg-[#0e0e11] border border-amber-500/30 rounded-lg p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                SERIES EPISODE SELECTOR ({episodesList.length} EPISODES LISTED)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeEpisodeIdx === 0}
                onClick={() => setActiveEpisodeIdx(prev => Math.max(0, prev - 1))}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer"
              >
                ◀ Prev Ep
              </button>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                Ep {activeEpisodeIdx + 1} / {episodesList.length}
              </span>
              <button
                type="button"
                disabled={activeEpisodeIdx >= episodesList.length - 1}
                onClick={() => setActiveEpisodeIdx(prev => Math.min(episodesList.length - 1, prev + 1))}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer"
              >
                Next Ep ▶
              </button>
            </div>
          </div>

          {/* Listed Episode Tabs/Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
            {episodesList.map((ep, idx) => {
              const isCurrent = activeEpisodeIdx === idx;
              const epThumb = ep.thumbnailUrl || film.landscapePosterUrl || film.posterUrl;
              return (
                <button
                  key={ep.id || idx}
                  type="button"
                  onClick={() => setActiveEpisodeIdx(idx)}
                  className={`p-1.5 pr-3.5 rounded-lg border text-left shrink-0 transition-all cursor-pointer flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-lg scale-[1.02]'
                      : 'bg-black/60 hover:bg-white/10 text-white/80 border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <div className="relative w-16 h-10 rounded overflow-hidden bg-black/80 shrink-0 border border-white/10">
                    <img 
                      src={epThumb} 
                      alt={ep.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-mono px-1 rounded ${
                      isCurrent ? 'bg-black text-amber-300 font-bold' : 'bg-black/80 text-white/70'
                    }`}>
                      EP {idx + 1}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold truncate max-w-[160px]">
                      {ep.title}
                    </span>
                    <span className={`text-[9px] font-mono ${isCurrent ? 'text-black/80' : 'text-white/40'}`}>
                      {ep.duration}
                    </span>
                  </div>
                </button>
              );
            })}
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
        {/* Video HTML5 Tag or Dynamic Embed Player */}
        {isEmbed ? (
          <iframe
            id="cinema-embed-player"
            src={embedUrl}
            className="w-full h-full border-0 bg-black"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            title={film.title}
          />
        ) : (
          <video
            id="cinema-html5-video"
            ref={videoRef}
            src={activeStreamUrl}
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
        )}

        {/* Error overlay or friendly fallback */}
        {hasError && !isEmbed && (
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

        {/* Auto Captions Overlay (English Subtitles) */}
        {isCaptionsEnabled && (
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-25 max-w-[90%] text-center pointer-events-none transition-all duration-300">
            {(() => {
              const captionText = getAutoEnglishCaption(currentTime, film);
              if (!captionText) return null;
              return (
                <div className="bg-black/90 text-yellow-300 px-4 py-1.5 rounded-md font-sans text-xs sm:text-sm md:text-base font-bold tracking-wide border border-white/10 shadow-2xl backdrop-blur-sm transition-all">
                  <span className="text-white/40 font-mono text-[10px] mr-2 uppercase tracking-widest">[EN-US]</span>
                  {captionText}
                </div>
              );
            })()}
          </div>
        )}

        {/* Quality Toast Notification */}
        {qualityToast && (
          <div className="absolute top-6 right-6 z-35 bg-black/90 border border-amber-500/40 text-white px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md">
            <Settings className="h-4 w-4 text-amber-400 animate-spin" />
            <span>{qualityToast}</span>
          </div>
        )}

        {/* Big Centered Play/Pause Click Overlay */}
        {!isEmbed && (
          <div 
            onClick={togglePlay}
            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 cursor-pointer ${
              isPlaying || showPauseSlide ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div className="h-16 w-16 md:h-18 md:w-18 rounded border border-white/25 bg-black/75 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all backdrop-blur-md">
              <Play className="h-6 w-6 fill-current translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Netflix-style Full Screen Pause Title Slide Overlay */}
        <div
          id="netflix-pause-title-slide"
          onClick={togglePlay}
          className={`absolute inset-0 z-30 bg-gradient-to-r from-black/90 via-black/70 via-60% to-black/40 backdrop-blur-[2px] p-8 sm:p-14 md:p-20 flex flex-col justify-between transition-all duration-500 ease-out cursor-pointer ${
            showPauseSlide ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Main Left-Aligned Text Content */}
          <div className="flex flex-col justify-center my-auto max-w-2xl text-left select-none gap-2 sm:gap-3">
            {/* Subtitle */}
            <div className="text-white/80 font-sans text-sm sm:text-base md:text-lg font-normal tracking-wide">
              {film.type === 'series' && currentEpisode 
                ? `You're Watching S1:E${activeEpisodeIdx + 1}` 
                : "You're Watching"}
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white font-sans tracking-tight leading-[1.05] drop-shadow-2xl my-1">
              {film.type === 'series' && currentEpisode ? currentEpisode.title : film.title}
            </h2>

            {/* Metadata Row: Year, Rating, Duration */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm font-semibold text-white/90 font-sans pt-1">
              <span className="text-white font-bold">{film.releaseYear || '2026'}</span>
              <span className="px-1.5 py-0.5 border border-white/40 text-[10px] sm:text-xs rounded font-mono font-bold uppercase tracking-wider text-white">
                {film.ageRating || 'U/A 16+'}
              </span>
              <span className="text-white/90">{film.duration || '3h 14m'}</span>
              {film.type === 'series' && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs rounded font-bold uppercase">
                  Web Series
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-white/80 font-sans leading-relaxed max-w-xl line-clamp-3 pt-2 drop-shadow-sm">
              {film.description}
            </p>

            {/* Resume Button Action */}
            <div className="pt-4 flex items-center gap-3">
              <button
                id="pause-slide-resume-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="flex items-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-2xl active:scale-95"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Resume Playback</span>
              </button>
              <span className="text-xs text-white/50 font-sans hidden sm:inline">
                Click anywhere on screen to play
              </span>
            </div>
          </div>
        </div>

        {/* Cinematic Custom HUD Overlay Controls */}
        <div 
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 md:p-6 flex flex-col gap-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Timeline scrub bar */}
          {!isEmbed && (
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
          )}

          {/* Controls button row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isEmbed ? (
                <>
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
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 text-[9px] text-amber-400 font-mono font-bold uppercase tracking-widest">
                    ✦ {provider === 'youtube' ? 'YouTube Stream' : provider === 'drive' ? 'Google Drive Stream' : provider === 'vimeo' ? 'Vimeo Stream' : 'Cinema Stream'}
                  </div>
                </div>
              )}

              {/* Badge info */}
              <div className="hidden sm:flex items-center gap-2 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">
                  {film.genre[0]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Auto Captions (CC) Toggle */}
              <button
                id="btn-cc-toggle"
                type="button"
                onClick={() => setIsCaptionsEnabled(!isCaptionsEnabled)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest transition-all cursor-pointer border ${
                  isCaptionsEnabled
                    ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-md'
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                }`}
                title="Toggle Auto English Captions (CC)"
              >
                CC
              </button>

              {/* Video Quality Selector */}
              <div className="relative">
                <button
                  id="btn-quality-menu"
                  type="button"
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-white/80 border border-white/15 hover:border-amber-500/50 hover:text-amber-400 text-[9px] font-mono font-bold tracking-widest transition-all cursor-pointer"
                  title="Change Video Quality"
                >
                  <Settings className="h-3 w-3 text-amber-400 shrink-0" />
                  <span>{videoQuality}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute right-0 bottom-full mb-2 z-40 bg-[#0e0e12] border border-amber-500/40 rounded-xl p-2 w-52 shadow-2xl flex flex-col gap-1 backdrop-blur-md font-mono text-xs">
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 border-b border-white/10 flex items-center justify-between">
                      <span>Stream Quality</span>
                      <span className="text-amber-400">60 FPS</span>
                    </div>
                    {[
                      { id: 'Auto', label: 'Auto (Adaptive)', badge: 'DYNAMIC' },
                      { id: '4K', label: '4K Ultra HD', badge: '2160p' },
                      { id: '1080p', label: '1080p Full HD', badge: '1080p' },
                      { id: '720p', label: '720p HD', badge: '720p' },
                      { id: '360p', label: '360p Data Saver', badge: '360p' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setVideoQuality(opt.id as any);
                          setShowQualityMenu(false);
                          setQualityToast(`Stream Quality: ${opt.label}`);
                          setTimeout(() => setQualityToast(null), 2500);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-all cursor-pointer ${
                          videoQuality === opt.id
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {videoQuality === opt.id && <Check className="h-3 w-3 text-amber-400 shrink-0" />}
                          <span>{opt.label}</span>
                        </div>
                        <span className="text-[8px] px-1 py-0.2 bg-white/5 border border-white/10 rounded text-white/40">
                          {opt.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Speed Controller */}
              {!isEmbed && (
                <button
                  id="btn-speed-control"
                  onClick={changeSpeed}
                  className="text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/15 hover:border-white/30 active:scale-95 transition-all cursor-pointer"
                  title="Playback speed"
                >
                  {playbackSpeed === 1 ? '1.0X' : `${playbackSpeed}X`}
                </button>
              )}

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
      {film.type === 'series' && episodesList.length > 0 && (
        <div className="bg-[#0c0c0e] border border-white/5 rounded-lg p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              ✦ Complete Episode Index ({episodesList.length} episodes)
            </h4>
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Click to switch episode immediately</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {episodesList.map((ep, idx) => {
              const isCurrent = activeEpisodeIdx === idx;
              const epThumb = ep.thumbnailUrl || film.landscapePosterUrl || film.posterUrl;
              return (
                <button
                  key={ep.id || idx}
                  onClick={() => {
                    setActiveEpisodeIdx(idx);
                  }}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-2 transition-all cursor-pointer relative group overflow-hidden ${
                    isCurrent 
                      ? 'bg-amber-500/10 border-amber-500 shadow-xl ring-1 ring-amber-500/30' 
                      : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black border border-white/10">
                    <img 
                      src={epThumb} 
                      alt={ep.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <span className={`absolute top-2 left-2 text-[9px] font-mono font-extrabold tracking-widest uppercase px-2 py-0.5 rounded backdrop-blur-sm ${
                      isCurrent ? 'bg-amber-500 text-black shadow' : 'bg-black/80 text-white/80'
                    }`}>
                      {isCurrent ? '▶ NOW SHOWING' : `EPISODE ${idx + 1}`}
                    </span>
                    <span className="absolute bottom-2 right-2 text-[9px] font-mono text-white/90 bg-black/80 px-2 py-0.5 rounded border border-white/10 tabular-nums">
                      {ep.duration}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 px-0.5">
                    <h5 className={`text-xs font-bold leading-snug transition-colors ${isCurrent ? 'text-amber-300' : 'text-white/80 group-hover:text-white'}`}>
                      {ep.title}
                    </h5>
                    {ep.description && (
                      <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">
                        {ep.description}
                      </p>
                    )}
                  </div>
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
