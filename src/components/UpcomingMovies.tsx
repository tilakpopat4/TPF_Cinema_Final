import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Calendar, Film, ExternalLink } from 'lucide-react';
import { UpcomingFilm } from '../types';
import { getDirectImageUrl, getVideoEmbedData } from '../lib/driveUtils';

interface UpcomingMoviesProps {
  upcomingList: UpcomingFilm[];
}

export default function UpcomingMovies({ upcomingList }: UpcomingMoviesProps) {
  const [lightboxVideo, setLightboxVideo] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [videoError, setVideoError] = useState(false);

  const embedData = lightboxVideo ? getVideoEmbedData(lightboxVideo, { hideYouTubePlayerUI: true }) : { isEmbed: false, embedUrl: '', provider: 'direct' };

  return (
    <div id="upcoming-movies-section" className="bg-[#0e0e11] p-6 md:p-8 rounded-2xl border border-white/10 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold block mb-1">
            FIRST LOOKS & TEASERS
          </span>
          <h3 className="text-xl font-bold tracking-tight text-white">
            Upcoming Premieres
          </h3>
        </div>
        <p className="text-xs text-zinc-400 max-w-md">
          Preview upcoming independent releases and trailers from our community.
        </p>
      </div>

      {/* Grid of Trailers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {upcomingList.map((film) => (
          <div 
            key={film.id}
            className="group flex flex-col bg-[#141418] border border-white/10 rounded-xl overflow-hidden hover:border-amber-500/40 hover:bg-[#18181f] transition-all duration-200"
          >
            {/* Thumbnail */}
            <div 
              onClick={() => {
                setLightboxVideo(film.videoUrl);
                setLightboxTitle(film.title);
                setVideoError(false);
              }}
              className="aspect-video w-full overflow-hidden relative bg-black cursor-pointer"
            >
              <img 
                src={getDirectImageUrl(film.thumbnailUrl)} 
                alt={film.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 transition-all duration-200 shadow-lg">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-300 border border-white/10">
                Watch Trailer
              </div>
            </div>

            {/* Content info */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                  <Calendar className="h-3 w-3 text-amber-400" />
                  {film.expectedRelease}
                </span>
              </div>
              
              <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                {film.title}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">Directed by {film.director}</p>
              
              <p className="text-xs text-zinc-300/80 mt-2.5 line-clamp-2 leading-relaxed flex-1">
                {film.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/10">
                {film.genre.map((g, i) => (
                  <span key={i} className="text-[10px] text-zinc-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Lightbox Modal */}
      <AnimatePresence>
        {lightboxVideo && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-[#121215] rounded-xl border border-white/15 overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0e0e11]">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-amber-400 fill-current" />
                  <span className="text-xs font-semibold text-white truncate">{lightboxTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={lightboxVideo}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-zinc-200 transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-amber-400" /> Source
                  </a>
                  <button 
                    onClick={() => setLightboxVideo(null)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Player container */}
              <div className="aspect-video relative bg-black flex items-center justify-center overflow-hidden">
                {embedData.isEmbed ? (
                  <iframe
                    src={embedData.embedUrl}
                    title={lightboxTitle}
                    className="w-full h-full border-0 bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={lightboxVideo} 
                    autoPlay 
                    controls 
                    className="w-full h-full object-contain"
                    onError={() => setVideoError(true)}
                    playsInline
                  />
                )}

                {!embedData.isEmbed && videoError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
                    <h4 className="text-sm font-semibold text-white mb-2">Trailer Unavailable in Player</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mb-4">
                      The video link requires viewing directly on its native host.
                    </p>
                    <a
                      href={lightboxVideo}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded transition-colors"
                    >
                      Open Video in New Tab
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

