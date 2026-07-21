import React from 'react';
import { Filmmaker, Film } from '../types';
import { Camera, MapPin, Instagram, Globe, Sparkles, Film as FilmIcon } from 'lucide-react';
import { getDirectImageUrl } from '../lib/driveUtils';

interface FilmmakerSpotlightProps {
  filmmakers: Filmmaker[];
  films: Film[];
  onSelectFilm: (film: Film) => void;
  activeFilmId: string;
}

export default function FilmmakerSpotlight({ 
  filmmakers, 
  films, 
  onSelectFilm,
  activeFilmId 
}: FilmmakerSpotlightProps) {
  
  // Rotating/Featured filmmaker selection (e.g. index 0 for Sarah Chen)
  const spotlightMaker = filmmakers[0];

  if (!spotlightMaker) {
    return (
      <div className="bg-[#0c0c0e] p-6 rounded-lg border border-white/5 flex flex-col gap-5 h-full items-center justify-center text-center">
        <Camera className="h-8 w-8 text-white/20 mb-2" />
        <p className="text-xs text-white/40 font-mono">No filmmaker spotlight active</p>
      </div>
    );
  }
  
  // Filter films produced by this maker
  const makerFilms = films.filter(f => f.director === spotlightMaker.name);

  return (
    <div className="bg-[#0c0c0e] p-6 rounded-lg border border-white/5 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h4 className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-1.5">
          FILMMAKER SPOTLIGHT
        </h4>
        <span className="text-[8px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/40 uppercase tracking-wider font-bold">
          CREATOR OF THE WEEK
        </span>
      </div>

      {/* Filmmaker Bio Header */}
      <div className="flex items-center gap-4">
        <img 
          src={getDirectImageUrl(spotlightMaker.avatar)} 
          alt={spotlightMaker.name}
          className="h-12 w-12 rounded object-cover border border-white/10"
          referrerPolicy="no-referrer"
        />
        <div>
          <h5 className="text-xs font-bold text-[#F5F5F7] tracking-tight">{spotlightMaker.name}</h5>
          <p className="text-[10px] text-amber-500 font-bold font-mono uppercase tracking-wide flex items-center gap-1 mt-0.5">
            <Camera className="h-3 w-3" /> {spotlightMaker.role}
          </p>
          <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider mt-0.5 flex items-center gap-0.5">
            <MapPin className="h-3 w-3" /> {spotlightMaker.country}
          </p>
        </div>
      </div>

      {/* Bio text */}
      <p className="text-xs text-white/50 font-sans leading-relaxed italic">
        "{spotlightMaker.bio}"
      </p>

      {/* Social links */}
      <div className="flex items-center gap-2 pt-1">
        {spotlightMaker.instagram && (
          <a 
            href={`https://instagram.com/${spotlightMaker.instagram.replace('@', '')}`}
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1 text-[9px] text-white/40 hover:text-amber-500 font-mono transition-colors"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>{spotlightMaker.instagram}</span>
          </a>
        )}
        {spotlightMaker.portfolio && (
          <a 
            href={`https://${spotlightMaker.portfolio}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1 text-[9px] text-white/40 hover:text-amber-500 font-mono transition-colors border-l border-white/10 pl-2.5"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{spotlightMaker.portfolio}</span>
          </a>
        )}
      </div>

      {/* Filmmaker works screen list */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <h6 className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1">
          WORKS ON INDIESCREEN:
        </h6>

        <div className="flex flex-col gap-2">
          {makerFilms.length === 0 ? (
            <span className="text-xs text-white/30">No screen listings yet.</span>
          ) : (
            makerFilms.map((film) => {
              const isActive = film.id === activeFilmId;
              return (
                <div
                  key={film.id}
                  onClick={() => onSelectFilm(film)}
                  className={`p-2.5 rounded border cursor-pointer transition-all flex items-center justify-between ${
                    isActive 
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-500 font-bold' 
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-white/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FilmIcon className="h-3 w-3" />
                    <span className="text-xs truncate max-w-[150px]">{film.title}</span>
                  </div>
                  <span className="text-[9px] font-mono">{film.duration}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
