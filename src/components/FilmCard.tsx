import React from 'react';
import { Film, Star, Play, Tv, DollarSign, Tag } from 'lucide-react';
import { Film as FilmType } from '../types';
import { getDirectImageUrl } from '../lib/driveUtils';

interface FilmCardProps {
  key?: React.Key;
  film: FilmType;
  onClick: () => void;
  onSelectEpisode?: (film: FilmType, episodeIndex: number) => void;
  isActive: boolean;
}

export default function FilmCard({ film, onClick, onSelectEpisode, isActive }: FilmCardProps) {
  // Compute overall average rating
  const averageRating = film.reviews.length > 0 
    ? parseFloat((film.reviews.reduce((acc, curr) => acc + curr.rating, 0) / film.reviews.length).toFixed(1))
    : 0;

  // Normalized episodes list for series
  const episodes = (film.type === 'series')
    ? (film.episodes && film.episodes.length > 0)
        ? film.episodes
        : [{ id: `${film.id}-ep1`, title: 'Episode 1', duration: film.duration || '10m', videoUrl: film.videoUrl }]
    : [];

  return (
    <div 
      id={`film-card-${film.id}`}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border cursor-pointer bg-[#121215] transition-all duration-200 ${
        isActive 
          ? 'border-amber-500/80 ring-1 ring-amber-500/30' 
          : 'border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Cinematic Poster Wrapper */}
      <div className="relative aspect-[2/3] overflow-hidden w-full bg-zinc-900">
        <img 
          src={getDirectImageUrl(film.posterUrl)} 
          alt={film.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          style={{ objectPosition: `center ${film.posterPositionY ?? 50}%` }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        
        {/* Play Overlay Hover effect */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Format Badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[10px] font-medium bg-black/70 text-zinc-200 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10">
            {film.type === 'series' ? 'Series' : 'Short Film'}
          </span>
        </div>

        {/* Runtime Badge */}
        <span className="absolute bottom-2 right-2 text-[10px] font-medium text-zinc-300 bg-black/75 px-1.5 py-0.5 rounded-md backdrop-blur-md border border-white/10">
          {film.duration}
        </span>
      </div>

      {/* Film Metadata details */}
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-1.5">
          <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
            {film.title}
          </h4>
          
          {/* Rating */}
          {averageRating > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-300 font-medium shrink-0">
              <Star className="h-3 w-3 text-amber-400 fill-current" />
              <span>{averageRating}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-zinc-400 truncate">
          {film.director}
        </p>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1 pt-1.5 border-t border-zinc-800/80">
          <span>{film.releaseYear || '2025'}</span>
          <span>
            {film.reviews.length} review{film.reviews.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
