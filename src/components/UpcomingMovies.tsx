import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Calendar, Film } from 'lucide-react';
import { UpcomingFilm } from '../types';

interface UpcomingMoviesProps {
  upcomingList: UpcomingFilm[];
}

export default function UpcomingMovies({ upcomingList }: UpcomingMoviesProps) {
  const [lightboxVideo, setLightboxVideo] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [videoError, setVideoError] = useState(false);

  return (
    <div id="upcoming-movies-section" className="bg-[#09090b] p-6 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6 border-b border-white/5 pb-4">
        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
          <Film className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-mono font-extrabold tracking-widest uppercase text-[#F5F5F7] flex items-center gap-1.5">
            Upcoming Movies
            <span className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Trailers & Announcements
            </span>
          </h3>
          <p className="text-[11px] text-white/40 font-sans mt-0.5">Preview highly anticipated releases from our global creator network.</p>
        </div>
      </div>

      {/* Grid of Trailers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {upcomingList.map((film) => (
          <div 
            key={film.id}
            className="group flex flex-col bg-[#0d0d10]/60 border border-white/5 rounded-lg overflow-hidden hover:border-white/10 hover:bg-[#111114]/80 transition-all duration-300"
          >
            {/* Landscape Thumbnail at the top */}
            <div 
              onClick={() => {
                setLightboxVideo(film.videoUrl);
                setLightboxTitle(film.title);
                setVideoError(false);
              }}
              className="aspect-video w-full overflow-hidden relative border-b border-white/5 bg-black cursor-pointer"
            >
              <img 
                src={film.thumbnailUrl} 
                alt={film.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/75 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-amber-500 uppercase tracking-widest border border-white/10">
                Play Trailer
              </div>
            </div>

            {/* Information below thumbnail */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Upcoming
                </span>
                <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {film.expectedRelease}
                </span>
              </div>
              
              <h4 className="text-sm font-bold text-[#F5F5F7] tracking-tight group-hover:text-amber-500 transition-colors">
                {film.title}
              </h4>
              <p className="text-[11px] text-white/40 font-medium mt-0.5 font-mono">Dir: {film.director}</p>
              
              <p className="text-xs text-[#a1a1aa] font-sans mt-3 line-clamp-2 leading-relaxed flex-1">
                {film.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/5">
                {film.genre.map((g, i) => (
                  <span key={i} className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    #{g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded Video Trailer Lightbox Modal */}
      <AnimatePresence>
        {lightboxVideo && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-[#09090b] rounded-xl border border-white/10 overflow-hidden shadow-2xl"
            >
              {/* Lightbox header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-amber-500 fill-current" />
                  <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-amber-500">
                    TRAILER PREVIEW
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-xs font-bold text-[#F5F5F7] truncate max-w-xs">{lightboxTitle}</span>
                </div>
                <button 
                  onClick={() => setLightboxVideo(null)}
                  className="p-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-white/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* HTML5 Player container */}
              <div className="aspect-video relative bg-black flex items-center justify-center">
                <video 
                  src={lightboxVideo} 
                  autoPlay 
                  controls 
                  className="w-full h-full object-contain"
                  onError={() => setVideoError(true)}
                  playsInline
                />

                {videoError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 mb-3 animate-pulse">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-1.5">Trailer Offline</h4>
                    <p className="text-[10px] text-white/50 max-w-sm leading-relaxed mb-4 font-sans">
                      The public media source is blocked, expired, or has compatibility errors within this sandbox. Try launching the preview in a new tab.
                    </p>
                    <button
                      onClick={() => setVideoError(false)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#F5F5F7] border border-white/10 text-[9px] font-mono tracking-widest uppercase rounded transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              {/* Lightbox footer */}
              <div className="p-4 bg-[#050507] border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40 uppercase tracking-widest">
                <span>TPF Cinemas • Upcoming Indie Releases Preview</span>
                <button
                  onClick={() => setLightboxVideo(null)}
                  className="text-white/60 hover:text-amber-500 font-bold border-b border-white/15 hover:border-amber-500/50 transition-colors"
                >
                  CLOSE PREVIEW
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
