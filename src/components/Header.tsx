import React, { useState, useRef, useEffect } from 'react';
import { Film, Film as FilmIcon, Tv, Search, PlusCircle, Sparkles, HelpCircle, Home, Bookmark, User as UserIcon, Shield, Camera, ChevronDown, LogOut } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeType: 'all' | 'film' | 'series' | 'watchlist';
  setActiveType: (type: 'all' | 'film' | 'series' | 'watchlist') => void;
  onSubmitClick: () => void;
  onAboutClick: () => void;
  setViewState?: (state: 'home' | 'player' | 'admin' | 'filmmaker-studio') => void;
  currentUser?: any;
  onLogout?: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  activeType,
  setActiveType,
  onSubmitClick,
  onAboutClick,
  setViewState,
  currentUser,
  onLogout,
}: HeaderProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#2B2B2B]/95 backdrop-blur-md border-b border-white/5 px-4 md:px-12 lg:px-16 py-4">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Tag */}
        <div 
          className="flex items-center gap-4 cursor-pointer select-none group" 
          onClick={() => { 
            setSearchQuery(''); 
            setActiveType('all'); 
            if (setViewState) setViewState('home'); 
          }}
        >
          <img
            id="tpf-cinemas-logo"
            src="https://lh3.googleusercontent.com/d/1JPXumtChr94uaSSJ8rXTo8d4yJayFjzS"
            alt="TPF Cinemas"
            referrerPolicy="no-referrer"
            className="h-[60px] sm:h-[72px] w-auto object-contain select-none transition-all duration-300 group-hover:scale-[1.02]"
          />
        </div>

        {/* Categories & Filter Toggles */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 font-sans">
          <button
            id="filter-home-btn"
            onClick={() => {
              setActiveType('all');
              if (setViewState) setViewState('home');
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer font-sans ${
              activeType === 'all'
                ? 'bg-white/15 text-[#F5F5F7] shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
          <button
            id="filter-films-btn"
            onClick={() => {
              setActiveType('film');
              if (setViewState) setViewState('home');
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer font-sans ${
              activeType === 'film'
                ? 'bg-white/15 text-[#F5F5F7] shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <FilmIcon className="h-3.5 w-3.5" />
            Movies
          </button>
          <button
            id="filter-series-btn"
            onClick={() => {
              setActiveType('series');
              if (setViewState) setViewState('home');
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer font-sans ${
              activeType === 'series'
                ? 'bg-white/15 text-[#F5F5F7] shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            Series
          </button>
          <button
            id="filter-watchlist-btn"
            onClick={() => {
              setActiveType('watchlist');
              if (setViewState) setViewState('home');
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer font-sans ${
              activeType === 'watchlist'
                ? 'bg-white/15 text-[#F5F5F7] shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Watchlist
          </button>
        </div>

        {/* Search, Action CTA & Info */}
        <div className="flex items-center flex-wrap md:flex-nowrap gap-3 w-full md:w-auto justify-end">
          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/40">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              id="search-films-input"
              type="text"
              placeholder="Search films, directors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/5 text-[#F5F5F7] placeholder-white/30 pl-9 pr-4 py-1.5 rounded-lg text-xs border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all"
            />
          </div>

          {/* User Profile & Actions Dropdown */}
          {currentUser && (
            <div className="relative pl-2 border-l border-white/10 ml-1 font-sans" ref={dropdownRef}>
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 py-1.5 px-3 rounded-lg text-xs font-semibold text-[#F5F5F7] transition-all cursor-pointer active:scale-95"
                title={`${currentUser.displayName || ''} (${currentUser.email || ''})`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-amber-500/30"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="max-w-[80px] truncate hidden lg:inline-block text-[11px] tracking-tight">{currentUser.displayName?.split(' ')[0] || 'Member'}</span>
                <ChevronDown className={`h-3 w-3 text-white/50 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1f1f1f] border border-white/10 rounded-lg shadow-2xl py-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-[11px] font-bold text-white truncate">{currentUser.displayName || 'Cinema Member'}</p>
                    <p className="text-[9px] text-white/40 truncate mt-0.5">{currentUser.email}</p>
                  </div>

                  {/* Submit Action Button */}
                  <button
                    id="submit-film-header-btn"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onSubmitClick();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-500 hover:bg-white/5 transition-colors cursor-pointer text-left w-full"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Screen Your Work</span>
                  </button>

                  {/* Filmmaker Studio button */}
                  <button
                    id="filmmaker-studio-header-btn"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.hash = '#/studio';
                      if (setViewState) setViewState('filmmaker-studio');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#F5F5F7]/85 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left w-full"
                  >
                    <Camera className="h-4 w-4 text-amber-500/80" />
                    <span>Filmmaker Studio</span>
                  </button>



                  {onLogout && (
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onLogout();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
