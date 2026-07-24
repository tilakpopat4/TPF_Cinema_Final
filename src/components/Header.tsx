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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
    <>
      <header className="sticky top-0 z-40 w-full bg-[#2B2B2B]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 md:px-12 lg:px-16 py-2.5 sm:py-3.5">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Top Row on Mobile: Logo + Mobile Search Toggle + Profile */}
          <div className="w-full md:w-auto flex items-center justify-between gap-3">
            <div 
              className="flex items-center gap-3 cursor-pointer select-none group shrink-0" 
              onClick={() => { 
                setSearchQuery(''); 
                setActiveType('all'); 
                if (setViewState) setViewState('home'); 
              }}
            >
              <img
                id="tpf-cinemas-logo"
                src="https://lh3.googleusercontent.com/d/1WnKEHu3WYNJ8JUgzVlq5Eouzdw9LRIwc"
                alt="TPF Cinemas | An OTT For Beginners"
                title="TPF Cinemas | An OTT For Beginners"
                referrerPolicy="no-referrer"
                className="h-[49px] sm:h-[64px] md:h-[87px] w-auto object-contain select-none transition-all duration-300 group-hover:scale-[1.02]"
              />
            </div>

            {/* Mobile Actions Right */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white"
                aria-label="Toggle Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {currentUser && (
                <div className="relative font-sans" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-1.5 bg-white/5 border border-white/10 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-[#F5F5F7]"
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
                    <ChevronDown className={`h-3 w-3 text-white/50 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#1f1f1f] border border-white/10 rounded-lg shadow-2xl py-1.5 z-50 flex flex-col gap-0.5">
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <p className="text-[11px] font-bold text-white truncate">{currentUser.displayName || 'Cinema Member'}</p>
                        <p className="text-[9px] text-white/40 truncate mt-0.5">{currentUser.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onSubmitClick();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-500 hover:bg-white/5 cursor-pointer text-left w-full"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Screen Your Work</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          window.location.hash = '#/studio';
                          if (setViewState) setViewState('filmmaker-studio');
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#F5F5F7]/85 hover:text-white hover:bg-white/5 cursor-pointer text-left w-full"
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
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer text-left w-full"
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

          {/* Mobile Search Input Drawer (Visible when toggled on mobile or on desktop) */}
          <div className={`w-full md:hidden ${showMobileSearch ? 'block' : 'hidden'}`}>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/40">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search films, directors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 text-[#F5F5F7] placeholder-white/40 pl-9 pr-4 py-2 rounded-lg text-xs border border-white/20 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Categories & Filter Toggles (Scrollable horizontally on mobile) */}
          <div className="w-full md:w-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/5 p-1 rounded-lg border border-white/10 font-sans min-w-max">
              <button
                id="filter-home-btn"
                onClick={() => {
                  setActiveType('all');
                  if (setViewState) setViewState('home');
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all cursor-pointer font-sans shrink-0 ${
                  activeType === 'all'
                    ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
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
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all cursor-pointer font-sans shrink-0 ${
                  activeType === 'film'
                    ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
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
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all cursor-pointer font-sans shrink-0 ${
                  activeType === 'series'
                    ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
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
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all cursor-pointer font-sans shrink-0 ${
                  activeType === 'watchlist'
                    ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                Watchlist
              </button>
            </div>
          </div>

          {/* Desktop Search, Action CTA & Info */}
          <div className="hidden md:flex items-center gap-3 w-auto justify-end shrink-0">
            {/* Search Input */}
            <div className="relative w-56 lg:w-64">
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
                  <div className="absolute right-0 mt-2 w-56 bg-[#1f1f1f] border border-white/10 rounded-lg shadow-2xl py-1.5 z-50 flex flex-col gap-0.5">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-[11px] font-bold text-white truncate">{currentUser.displayName || 'Cinema Member'}</p>
                      <p className="text-[9px] text-white/40 truncate mt-0.5">{currentUser.email}</p>
                    </div>

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

      {/* Mobile Bottom Navigation Bar (Fixed for thumb navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#161618]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setActiveType('all');
            if (setViewState) setViewState('home');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono uppercase tracking-wider ${
            activeType === 'all' ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setActiveType('film');
            if (setViewState) setViewState('home');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono uppercase tracking-wider ${
            activeType === 'film' ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <FilmIcon className="h-5 w-5" />
          <span>Movies</span>
        </button>

        <button
          onClick={() => {
            setActiveType('series');
            if (setViewState) setViewState('home');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono uppercase tracking-wider ${
            activeType === 'series' ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Tv className="h-5 w-5" />
          <span>Series</span>
        </button>

        <button
          onClick={() => {
            setActiveType('watchlist');
            if (setViewState) setViewState('home');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono uppercase tracking-wider ${
            activeType === 'watchlist' ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Bookmark className="h-5 w-5" />
          <span>List</span>
        </button>

        <button
          onClick={() => {
            window.location.hash = '#/studio';
            if (setViewState) setViewState('filmmaker-studio');
          }}
          className="flex flex-col items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold"
        >
          <Camera className="h-5 w-5 text-amber-400" />
          <span>Studio</span>
        </button>
      </nav>
    </>
  );
}
