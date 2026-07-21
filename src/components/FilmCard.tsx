import React from 'react';
import { Film, Star, Play, Tv, DollarSign } from 'lucide-react';
import { Film as FilmType } from '../types';

interface FilmCardProps {
  key?: React.Key;
  film: FilmType;
  onClick: () => void;
  isActive: boolean;
}

export default function FilmCard({ film, onClick, isActive }: FilmCardProps) {
  // Compute overall average rating
  const averageRating = film.reviews.length > 0 
    ? parseFloat((film.reviews.reduce((acc, curr) => acc + curr.rating, 0) / film.reviews.length).toFixed(1))
    : 0;

  return (
    <div 
      id={`film-card-${film.id}`}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border cursor-pointer bg-[#0c0c0e] transition-all duration-350 ${
        isActive 
          ? 'border-amber-500 ring-1 ring-amber-500/20' 
          : 'border-white/5 hover:border-white/15'
      }`}
    >
      {/* Cinematic Poster Wrapper */}
      <div className="relative aspect-[2/3] overflow-hidden w-full bg-black">
        <img 
          src={film.posterUrl} 
          alt={film.title} 
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        
        {/* Play Overlay Hover effect */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="h-10 w-10 rounded border border-white/20 bg-black/60 text-white flex items-center justify-center transform scale-95 group-hover:scale-100 transition-transform duration-300 backdrop-blur-md">
            <Play className="h-4 w-4 fill-current translate-x-0.5" />
          </div>
        </div>

        {/* Translucent Floating Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {/* Film vs Series Format */}
          {film.type === 'series' ? (
            <span className="flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-widest bg-black/85 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 backdrop-blur-sm">
              Series
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-widest bg-black/85 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 backdrop-blur-sm">
              Short Film
            </span>
          )}


        </div>

        {/* Runtime Float bottom badge */}
        <span className="absolute bottom-2 right-2 text-[8px] font-mono font-bold tracking-wide text-white/70 bg-black/85 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
          {film.duration}
        </span>
      </div>

      {/* Film Metadata details */}
      <div className="p-3.5 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-[#F5F5F7] group-hover:text-amber-500 transition-colors truncate w-full">
            {film.title}
          </h4>
          
          {/* Average Rating Star */}
          {averageRating > 0 && (
            <div className="flex items-center gap-1 text-[9px] font-mono text-white/80 font-bold shrink-0 bg-white/5 border border-white/10 px-1 py-0.5 rounded">
              <Star className="h-2.5 w-2.5 text-amber-500 fill-current" />
              <span>{averageRating}</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-white/40 font-mono">
          Directed by {film.director}
        </p>

        <div className="flex items-center justify-between text-[9px] font-mono text-white/30 mt-2 border-t border-white/5 pt-2">
          <span>{film.releaseYear}</span>
          <span className="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/50 hover:text-[#F5F5F7] transition-colors">
            {film.reviews.length} review{film.reviews.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
