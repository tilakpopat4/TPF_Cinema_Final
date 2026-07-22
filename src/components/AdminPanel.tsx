import React, { useState } from 'react';
import { 
  Film, Filmmaker, UpcomingFilm 
} from '../types';
import { getDirectImageUrl } from '../lib/driveUtils';
import { 
  Film as FilmIcon, User, Film as UpcomingIcon, Plus, Edit, Trash2, 
  Check, X, Save, Search, Settings, ShieldAlert, ArrowLeft, RefreshCw,
  ArrowUp, ArrowDown, Move
} from 'lucide-react';

interface AdminPanelProps {
  films: Film[];
  filmmakers: Filmmaker[];
  upcomingFilms: UpcomingFilm[];
  onUpdateFilms: (films: Film[]) => void;
  onUpdateFilmmakers: (filmmakers: Filmmaker[]) => void;
  onUpdateUpcoming: (upcoming: UpcomingFilm[]) => void;
  onBack: () => void;
}

type AdminTab = 'films' | 'filmmakers' | 'upcoming';

export default function AdminPanel({
  films,
  filmmakers,
  upcomingFilms,
  onUpdateFilms,
  onUpdateFilmmakers,
  onUpdateUpcoming,
  onBack
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('films');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Editing states ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // --- Film form state ---
  const [filmForm, setFilmForm] = useState<Partial<Film>>({
    title: '',
    type: 'film',
    description: '',
    duration: '',
    genre: [],
    director: '',
    releaseYear: new Date().getFullYear(),
    posterUrl: '',
    videoUrl: '',
    cameraUsed: '',
    filmmakerId: '',
    isFeatured: false,
    upiId: ''
  });

  // --- Filmmaker form state ---
  const [filmmakerForm, setFilmmakerForm] = useState<Partial<Filmmaker>>({
    name: '',
    avatar: '',
    bio: '',
    country: '',
    role: '',
    instagram: '',
    portfolio: ''
  });

  // --- Poster Artwork Tab state ---
  const [posterTab, setPosterTab] = useState<'portrait' | 'landscape'>('portrait');

  // --- Upcoming trailer form state ---
  const [upcomingForm, setUpcomingForm] = useState<Partial<UpcomingFilm>>({
    title: '',
    director: '',
    expectedRelease: '',
    genre: [],
    thumbnailUrl: '',
    videoUrl: '',
    description: ''
  });

  // --- Helpers to open Forms ---
  const startAddFilm = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFilmForm({
      title: '',
      type: 'film',
      description: '',
      duration: '10m 00s',
      genre: ['Drama'],
      director: filmmakers[0]?.name || 'Unknown',
      releaseYear: new Date().getFullYear(),
      posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=80',
      posterPositionY: 50,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      cameraUsed: 'Sony A7SIII',
      filmmakerId: filmmakers[0]?.id || 'fm-1',
      isFeatured: false,
      upiId: ''
    });
  };

  const startEditFilm = (film: Film) => {
    setEditingId(film.id);
    setIsAddingNew(false);
    setFilmForm({ ...film });
  };

  const startAddFilmmaker = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFilmmakerForm({
      name: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      bio: '',
      country: '',
      role: 'Director',
      instagram: '',
      portfolio: ''
    });
  };

  const startEditFilmmaker = (fm: Filmmaker) => {
    setEditingId(fm.id);
    setIsAddingNew(false);
    setFilmmakerForm({ ...fm });
  };

  const startAddUpcoming = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setUpcomingForm({
      title: '',
      director: '',
      expectedRelease: 'Coming Soon',
      genre: ['Indie'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&h=400&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      description: ''
    });
  };

  const startEditUpcoming = (uf: UpcomingFilm) => {
    setEditingId(uf.id);
    setIsAddingNew(false);
    setUpcomingForm({ ...uf });
  };

  // --- Deletion Handlers ---
  const handleDeleteFilm = (id: string) => {
    if (window.confirm('Are you sure you want to delete this film?')) {
      const next = films.filter(f => f.id !== id);
      onUpdateFilms(next);
    }
  };

  const handleDeleteFilmmaker = (id: string) => {
    if (window.confirm('Are you sure you want to delete this filmmaker?')) {
      const next = filmmakers.filter(fm => fm.id !== id);
      onUpdateFilmmakers(next);
    }
  };

  const handleDeleteUpcoming = (id: string) => {
    if (window.confirm('Are you sure you want to delete this upcoming movie announcement?')) {
      const next = upcomingFilms.filter(uf => uf.id !== id);
      onUpdateUpcoming(next);
    }
  };

  // --- Interactive Poster Crop/Pan Handlers ---
  const dragStartYRef = React.useRef<number | null>(null);
  const dragStartValRef = React.useRef<number>(50);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, targetField: 'portrait' | 'landscape' = 'portrait') => {
    e.preventDefault();
    dragStartYRef.current = e.clientY;
    dragStartValRef.current = targetField === 'landscape'
      ? (filmForm.landscapePosterPositionY ?? 50)
      : (filmForm.posterPositionY ?? 50);
    
    const handleDragMove = (moveEvent: MouseEvent) => {
      if (dragStartYRef.current !== null) {
        const deltaY = moveEvent.clientY - dragStartYRef.current;
        const containerHeight = targetField === 'landscape' ? 120 : 160;
        const pctChange = (deltaY / containerHeight) * 100;
        let newVal = Math.round(dragStartValRef.current + pctChange);
        newVal = Math.max(0, Math.min(100, newVal));

        if (targetField === 'landscape') {
          setFilmForm(prev => ({ ...prev, landscapePosterPositionY: newVal }));
        } else {
          setFilmForm(prev => ({ ...prev, posterPositionY: newVal }));
        }
      }
    };

    const handleDragEnd = () => {
      dragStartYRef.current = null;
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, targetField: 'portrait' | 'landscape' = 'portrait') => {
    if (e.touches[0]) {
      dragStartYRef.current = e.touches[0].clientY;
      dragStartValRef.current = targetField === 'landscape'
        ? (filmForm.landscapePosterPositionY ?? 50)
        : (filmForm.posterPositionY ?? 50);
    }
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (dragStartYRef.current !== null && moveEvent.touches[0]) {
        const deltaY = moveEvent.touches[0].clientY - dragStartYRef.current;
        const containerHeight = targetField === 'landscape' ? 120 : 160;
        const pctChange = (deltaY / containerHeight) * 100;
        let newVal = Math.round(dragStartValRef.current + pctChange);
        newVal = Math.max(0, Math.min(100, newVal));

        if (targetField === 'landscape') {
          setFilmForm(prev => ({ ...prev, landscapePosterPositionY: newVal }));
        } else {
          setFilmForm(prev => ({ ...prev, posterPositionY: newVal }));
        }
      }
    };

    const handleTouchEnd = () => {
      dragStartYRef.current = null;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const adjustPan = (amount: number, targetField: 'portrait' | 'landscape' = 'portrait') => {
    setFilmForm(prev => {
      if (targetField === 'landscape') {
        const current = prev.landscapePosterPositionY ?? 50;
        const newVal = Math.max(0, Math.min(100, current + amount));
        return { ...prev, landscapePosterPositionY: newVal };
      } else {
        const current = prev.posterPositionY ?? 50;
        const newVal = Math.max(0, Math.min(100, current + amount));
        return { ...prev, posterPositionY: newVal };
      }
    });
  };

  // --- Save / Submit Handlers ---
  const handleSaveFilm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filmForm.title || !filmForm.director) {
      alert('Please provide a Title and Director name.');
      return;
    }
    if (!filmForm.upiId || !filmForm.upiId.trim()) {
      alert('Sponsorship UPI ID (GPay) is required so viewers can support the filmmaker directly.');
      return;
    }

    if (isAddingNew) {
      const newId = `film-${Math.random().toString(36).substr(2, 5)}`;
      const newFilm: Film = {
        id: newId,
        title: filmForm.title || 'Untitled Film',
        type: filmForm.type || 'film',
        description: filmForm.description || '',
        duration: filmForm.duration || '10m 00s',
        genre: filmForm.genre || [],
        director: filmForm.director || 'Unknown',
        releaseYear: Number(filmForm.releaseYear) || new Date().getFullYear(),
        posterUrl: filmForm.posterUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=80',
        posterPositionY: filmForm.posterPositionY ?? 50,
        landscapePosterUrl: filmForm.landscapePosterUrl,
        landscapePosterPositionY: filmForm.landscapePosterPositionY ?? 50,
        videoUrl: filmForm.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        cameraUsed: filmForm.cameraUsed,
        filmmakerId: filmForm.filmmakerId || 'fm-1',
        views: 0,
        likes: 0,
        reviews: [],
        isFeatured: filmForm.isFeatured || false,
        upiId: filmForm.upiId
      };

      // If set to featured, disable other film featured flags
      let updatedFilms = [...films];
      if (newFilm.isFeatured) {
        updatedFilms = updatedFilms.map(f => ({ ...f, isFeatured: false }));
      }
      updatedFilms.unshift(newFilm);
      onUpdateFilms(updatedFilms);
    } else if (editingId) {
      let updatedFilms = films.map(f => {
        if (f.id === editingId) {
          return {
            ...f,
            ...filmForm,
            releaseYear: Number(filmForm.releaseYear) || f.releaseYear
          } as Film;
        }
        return f;
      });

      if (filmForm.isFeatured) {
        updatedFilms = updatedFilms.map(f => ({
          ...f,
          isFeatured: f.id === editingId
        }));
      }
      onUpdateFilms(updatedFilms);
    }

    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleSaveFilmmaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filmmakerForm.name) {
      alert('Please fill out the filmmaker name.');
      return;
    }

    if (isAddingNew) {
      const newId = `fm-${Math.random().toString(36).substr(2, 5)}`;
      const newFm: Filmmaker = {
        id: newId,
        name: filmmakerForm.name || 'Anonymous',
        avatar: filmmakerForm.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        bio: filmmakerForm.bio || '',
        country: filmmakerForm.country || 'Global',
        role: filmmakerForm.role || 'Director',
        instagram: filmmakerForm.instagram,
        portfolio: filmmakerForm.portfolio
      };
      onUpdateFilmmakers([newFm, ...filmmakers]);
    } else if (editingId) {
      const updated = filmmakers.map(fm => {
        if (fm.id === editingId) {
          return { ...fm, ...filmmakerForm } as Filmmaker;
        }
        return fm;
      });
      onUpdateFilmmakers(updated);
    }

    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleSaveUpcoming = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upcomingForm.title || !upcomingForm.director) {
      alert('Please fill out the upcoming film title and director.');
      return;
    }

    if (isAddingNew) {
      const newId = `up-${Math.random().toString(36).substr(2, 5)}`;
      const newUf: UpcomingFilm = {
        id: newId,
        title: upcomingForm.title || 'Untitled Trailer',
        director: upcomingForm.director || 'Unknown',
        expectedRelease: upcomingForm.expectedRelease || 'Coming Soon',
        genre: upcomingForm.genre || [],
        thumbnailUrl: upcomingForm.thumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&h=400&q=80',
        videoUrl: upcomingForm.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        description: upcomingForm.description || ''
      };
      onUpdateUpcoming([newUf, ...upcomingFilms]);
    } else if (editingId) {
      const updated = upcomingFilms.map(uf => {
        if (uf.id === editingId) {
          return { ...uf, ...upcomingForm } as UpcomingFilm;
        }
        return uf;
      });
      onUpdateUpcoming(updated);
    }

    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all content (films, filmmakers, trailers) back to initial template defaults? This clears custom entries.')) {
      localStorage.removeItem('indiescreen_films_v1');
      localStorage.removeItem('indiescreen_filmmakers');
      localStorage.removeItem('indiescreen_upcoming_v1');
      window.location.reload();
    }
  };

  // --- Filtering content list ---
  const filteredFilmsList = films.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.genre.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFilmmakersList = filmmakers.filter(fm => 
    fm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fm.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fm.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUpcomingList = upcomingFilms.filter(uf => 
    uf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    uf.director.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6 font-sans text-white/90">
      
      {/* Admin header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-500/10 border border-red-500/25 rounded-md text-red-400">
                <Settings className="h-4 w-4 animate-spin-slow" />
              </span>
              <h2 className="text-xl font-bold tracking-tight uppercase font-display">
                Cinema Console <span className="text-red-500 text-xs font-mono lowercase">/admin</span>
              </h2>
            </div>
            <p className="text-xs text-white/40 mt-1 font-mono">ROOT ADMINISTRATIVE HUB • CREATE, UPDATE AND PURGE BROADCAST FLUX</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            Reset Defaults
          </button>
          
          <button
            onClick={onBack}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Exit Console
          </button>
        </div>
      </div>

      {/* Admin navigation tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-[#0b0b0d] p-2 rounded-lg border border-white/5">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => { setActiveTab('films'); setIsAddingNew(false); setEditingId(null); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'films' 
                ? 'bg-amber-500 text-black font-extrabold' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <FilmIcon className="h-4 w-4" />
            Films & Series ({films.length})
          </button>

          <button
            onClick={() => { setActiveTab('filmmakers'); setIsAddingNew(false); setEditingId(null); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'filmmakers' 
                ? 'bg-amber-500 text-black font-extrabold' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="h-4 w-4" />
            Filmmakers ({filmmakers.length})
          </button>

          <button
            onClick={() => { setActiveTab('upcoming'); setIsAddingNew(false); setEditingId(null); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'upcoming' 
                ? 'bg-amber-500 text-black font-extrabold' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <UpcomingIcon className="h-4 w-4" />
            Upcoming Trailers ({upcomingFilms.length})
          </button>
        </div>

        {/* Global filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/30">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder={`Filter ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-56 bg-white/5 text-white placeholder-white/30 pl-9 pr-4 py-1.5 rounded text-xs border border-white/5 focus:border-amber-500/40 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid: Editor Form vs List table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Editor panel if active */}
        {(isAddingNew || editingId) ? (
          <div className="xl:col-span-5 bg-[#0b0b0d] p-6 rounded-lg border border-white/10 shadow-2xl relative flex flex-col gap-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                {isAddingNew ? `Add New ${activeTab === 'films' ? 'Film/Series' : activeTab === 'filmmakers' ? 'Filmmaker' : 'Trailer'}` : `Edit Selected ${activeTab === 'films' ? 'Film/Series' : activeTab === 'filmmakers' ? 'Filmmaker' : 'Trailer'}`}
              </h3>
              <button
                onClick={() => { setIsAddingNew(false); setEditingId(null); }}
                className="text-xs text-white/40 hover:text-white/90 border border-white/10 hover:bg-white/5 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* A. FILM FORM */}
            {activeTab === 'films' && (
              <form onSubmit={handleSaveFilm} className="flex flex-col gap-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Type</label>
                    <select
                      value={filmForm.type || 'film'}
                      onChange={(e) => setFilmForm({ ...filmForm, type: e.target.value as 'film' | 'series' })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="film">Short Film</option>
                      <option value="series">Web Series</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Featured Flag</label>
                    <select
                      value={filmForm.isFeatured ? 'true' : 'false'}
                      onChange={(e) => setFilmForm({ ...filmForm, isFeatured: e.target.value === 'true' })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="false">Standard Listing</option>
                      <option value="true">Featured Banner</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Film Title</label>
                  <input
                    type="text"
                    required
                    value={filmForm.title || ''}
                    onChange={(e) => setFilmForm({ ...filmForm, title: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g. Dreams of Neon"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Director</label>
                    <input
                      type="text"
                      required
                      value={filmForm.director || ''}
                      onChange={(e) => setFilmForm({ ...filmForm, director: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. Sarah Chen"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Filmmaker Entity Mapping</label>
                    <select
                      value={filmForm.filmmakerId || ''}
                      onChange={(e) => setFilmForm({ ...filmForm, filmmakerId: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="">Select Filmmaker</option>
                      {filmmakers.map(fm => (
                        <option key={fm.id} value={fm.id}>{fm.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Duration</label>
                    <input
                      type="text"
                      value={filmForm.duration || ''}
                      onChange={(e) => setFilmForm({ ...filmForm, duration: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. 12m 45s"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Year</label>
                    <input
                      type="number"
                      value={filmForm.releaseYear || ''}
                      onChange={(e) => setFilmForm({ ...filmForm, releaseYear: Number(e.target.value) })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. 2026"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Camera Used</label>
                    <input
                      type="text"
                      value={filmForm.cameraUsed || ''}
                      onChange={(e) => setFilmForm({ ...filmForm, cameraUsed: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. iPhone 13 Pro"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50 text-amber-500 font-bold">Sponsorship UPI ID (Required)</label>
                    <input
                      type="text"
                      required
                      value={filmForm.upiId || ''}
                      onChange={(e) => setFilmForm({ ...filmForm, upiId: e.target.value })}
                      className="bg-black border border-amber-500/30 p-2 rounded text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g. name@okaxis"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Genres (Comma separated)</label>
                  <input
                    type="text"
                    value={filmForm.genre?.join(', ') || ''}
                    onChange={(e) => setFilmForm({ ...filmForm, genre: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g. Cyberpunk, Philosophical, Drama"
                  />
                </div>

                {/* --- Dual Poster Upload & Crop Section (Portrait & Landscape) --- */}
                <div className="bg-black/60 border border-white/10 rounded-lg p-4 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Move className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        Poster & Artwork Uploads
                      </span>
                    </div>
                    
                    {/* Tab Buttons */}
                    <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/5">
                      <button
                        type="button"
                        onClick={() => setPosterTab('portrait')}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                          posterTab === 'portrait' 
                            ? 'bg-amber-500 text-black shadow-md' 
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        PORTRAIT (2:3)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPosterTab('landscape')}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                          posterTab === 'landscape' 
                            ? 'bg-amber-500 text-black shadow-md' 
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        LANDSCAPE (16:9)
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Portrait Poster */}
                  {posterTab === 'portrait' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono uppercase text-amber-400 font-semibold">
                            Portrait Poster URL (2:3 Aspect Ratio)
                          </label>
                          <span className="text-[9px] font-mono text-white/40">Used in film cards & vertical lists</span>
                        </div>
                        <input
                          type="url"
                          value={filmForm.posterUrl || ''}
                          onChange={(e) => setFilmForm({ ...filmForm, posterUrl: e.target.value })}
                          className="bg-black border border-white/10 p-2 rounded text-white text-xs focus:outline-none focus:border-amber-500/50 font-sans"
                          placeholder="https://images.unsplash.com/... or Google Drive direct link"
                        />
                      </div>

                      {filmForm.posterUrl ? (
                        <div className="bg-neutral-900/80 border border-white/5 rounded-lg p-3.5 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                          {/* Drag-to-Pan Preview Box */}
                          <div className="relative w-36 aspect-[2/3] bg-neutral-950 rounded overflow-hidden border border-amber-500/30 shadow-xl group select-none shrink-0">
                            <img 
                              src={getDirectImageUrl(filmForm.posterUrl)} 
                              alt="Portrait Crop preview" 
                              className="w-full h-full object-cover pointer-events-none"
                              style={{ objectPosition: `center ${filmForm.posterPositionY ?? 50}%` }}
                            />
                            
                            <div 
                              onMouseDown={(e) => handleDragStart(e, 'portrait')}
                              onTouchStart={(e) => handleTouchStart(e, 'portrait')}
                              className="absolute inset-0 cursor-ns-resize bg-black/10 hover:bg-black/25 flex flex-col justify-between p-2 active:bg-black/30 transition-colors"
                            >
                              <div className="w-full border-t border-dashed border-amber-500/40" />
                              <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/90 text-[8px] text-amber-400 font-mono px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest border border-amber-500/30 shadow">
                                  <Move className="h-2 w-2" /> Drag to Pan
                                </span>
                              </div>
                              <div className="w-full border-b border-dashed border-amber-500/40" />
                            </div>
                          </div>

                          {/* Controls Area */}
                          <div className="flex-1 flex flex-col justify-center gap-3 w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase text-amber-500 font-bold flex items-center gap-1">
                                <Move className="h-3 w-3" /> Vertical Alignment / Crop
                              </span>
                              <span className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                Offset: {filmForm.posterPositionY ?? 50}%
                              </span>
                            </div>

                            <p className="text-[11px] text-white/60 leading-relaxed">
                              Drag vertically on the portrait box or use controls below to set the vertical crop alignment perfectly.
                            </p>

                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-[9px] font-mono text-white/40">
                                <span>TOP (0%)</span>
                                <span>CENTER (50%)</span>
                                <span>BOTTOM (100%)</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={filmForm.posterPositionY ?? 50} 
                                onChange={(e) => setFilmForm({ ...filmForm, posterPositionY: Number(e.target.value) })}
                                className="w-full accent-amber-500 bg-neutral-800 rounded appearance-none h-1.5 cursor-pointer"
                              />
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => adjustPan(-5, 'portrait')}
                                className="flex-1 min-w-[70px] bg-white/5 hover:bg-white/10 text-white/80 rounded py-1 px-2 text-[10px] font-mono flex items-center justify-center gap-1 border border-white/5 active:bg-white/15"
                              >
                                <ArrowUp className="h-3 w-3" /> PAN UP
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => setFilmForm(prev => ({ ...prev, posterPositionY: 50 }))}
                                className="flex-1 min-w-[70px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded py-1 px-2 text-[10px] font-mono flex items-center justify-center gap-1 border border-amber-500/20 active:bg-amber-500/30"
                              >
                                CENTER
                              </button>

                              <button
                                type="button"
                                onClick={() => adjustPan(5, 'portrait')}
                                className="flex-1 min-w-[70px] bg-white/5 hover:bg-white/10 text-white/80 rounded py-1 px-2 text-[10px] font-mono flex items-center justify-center gap-1 border border-white/5 active:bg-white/15"
                              >
                                <ArrowDown className="h-3 w-3" /> PAN DOWN
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-white/5 border border-dashed border-white/10 rounded text-center text-xs text-white/40 font-mono">
                          Enter a Portrait Poster URL above to unlock live drag-and-pan controls.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Landscape Poster */}
                  {posterTab === 'landscape' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono uppercase text-amber-400 font-semibold">
                            Landscape Poster URL (16:9 Banner)
                          </label>
                          {filmForm.posterUrl && (
                            <button
                              type="button"
                              onClick={() => setFilmForm(prev => ({ ...prev, landscapePosterUrl: prev.posterUrl }))}
                              className="text-[9px] font-mono text-amber-400 hover:underline uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                            >
                              Re-use Portrait Image URL
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          value={filmForm.landscapePosterUrl || ''}
                          onChange={(e) => setFilmForm({ ...filmForm, landscapePosterUrl: e.target.value })}
                          className="bg-black border border-white/10 p-2 rounded text-white text-xs focus:outline-none focus:border-amber-500/50 font-sans"
                          placeholder="https://images.unsplash.com/... (Used on Hero featured banners & cinema player)"
                        />
                      </div>

                      {(filmForm.landscapePosterUrl || filmForm.posterUrl) ? (
                        <div className="bg-neutral-900/80 border border-white/5 rounded-lg p-3.5 flex flex-col gap-4">
                          {/* Drag-to-Pan Landscape Preview Box */}
                          <div className="relative w-full aspect-[16/9] max-h-52 bg-neutral-950 rounded overflow-hidden border border-amber-500/30 shadow-xl group select-none">
                            <img 
                              src={getDirectImageUrl(filmForm.landscapePosterUrl || filmForm.posterUrl)} 
                              alt="Landscape Crop preview" 
                              className="w-full h-full object-cover pointer-events-none"
                              style={{ objectPosition: `center ${filmForm.landscapePosterPositionY ?? 50}%` }}
                            />
                            
                            <div 
                              onMouseDown={(e) => handleDragStart(e, 'landscape')}
                              onTouchStart={(e) => handleTouchStart(e, 'landscape')}
                              className="absolute inset-0 cursor-ns-resize bg-black/10 hover:bg-black/25 flex flex-col justify-between p-2 active:bg-black/30 transition-colors"
                            >
                              <div className="w-full border-t border-dashed border-amber-500/40" />
                              <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/90 text-[8px] text-amber-400 font-mono px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest border border-amber-500/30 shadow">
                                  <Move className="h-2 w-2" /> Drag to Pan Landscape Banner
                                </span>
                              </div>
                              <div className="w-full border-b border-dashed border-amber-500/40" />
                            </div>
                          </div>

                          {/* Controls Area */}
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase text-amber-500 font-bold flex items-center gap-1">
                                <Move className="h-3 w-3" /> Landscape Vertical Alignment
                              </span>
                              <span className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                Offset: {filmForm.landscapePosterPositionY ?? 50}%
                              </span>
                            </div>

                            <p className="text-[11px] text-white/60 leading-relaxed">
                              Drag vertically on the 16:9 banner preview or use controls to set featured hero banner framing perfectly.
                            </p>

                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-[9px] font-mono text-white/40">
                                <span>TOP (0%)</span>
                                <span>CENTER (50%)</span>
                                <span>BOTTOM (100%)</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={filmForm.landscapePosterPositionY ?? 50} 
                                onChange={(e) => setFilmForm({ ...filmForm, landscapePosterPositionY: Number(e.target.value) })}
                                className="w-full accent-amber-500 bg-neutral-800 rounded appearance-none h-1.5 cursor-pointer"
                              />
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => adjustPan(-5, 'landscape')}
                                className="flex-1 min-w-[70px] bg-white/5 hover:bg-white/10 text-white/80 rounded py-1 px-2 text-[10px] font-mono flex items-center justify-center gap-1 border border-white/5 active:bg-white/15"
                              >
                                <ArrowUp className="h-3 w-3" /> PAN UP
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => setFilmForm(prev => ({ ...prev, landscapePosterPositionY: 50 }))}
                                className="flex-1 min-w-[70px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded py-1 px-2 text-[10px] font-mono flex items-center justify-center gap-1 border border-amber-500/20 active:bg-amber-500/30"
                              >
                                CENTER
                              </button>

                              <button
                                type="button"
                                onClick={() => adjustPan(5, 'landscape')}
                                className="flex-1 min-w-[70px] bg-white/5 hover:bg-white/10 text-white/80 rounded py-1 px-2 text-[10px] font-mono flex items-center justify-center gap-1 border border-white/5 active:bg-white/15"
                              >
                                <ArrowDown className="h-3 w-3" /> PAN DOWN
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-white/5 border border-dashed border-white/10 rounded text-center text-xs text-white/40 font-mono">
                          Enter a Landscape Poster URL above to unlock 16:9 banner drag-and-pan controls.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">MP4 Video URL</label>
                  <input
                    type="url"
                    value={filmForm.videoUrl || ''}
                    onChange={(e) => setFilmForm({ ...filmForm, videoUrl: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Curation Status</label>
                    <select
                      value={filmForm.approvalStatus || 'approved'}
                      onChange={(e) => setFilmForm({ ...filmForm, approvalStatus: e.target.value as any })}
                      className="bg-black border border-white/10 p-2.5 rounded text-white focus:outline-none focus:border-amber-500/50 uppercase font-mono text-[10px] cursor-pointer"
                    >
                      <option value="approved">Approved & Live</option>
                      <option value="pending">Pending Review</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Funds Received (₹)</label>
                    <input
                      type="number"
                      value={filmForm.fundsReceived || 0}
                      onChange={(e) => setFilmForm({ ...filmForm, fundsReceived: Number(e.target.value) })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50 font-mono"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Logline Description</label>
                  <textarea
                    rows={3}
                    value={filmForm.description || ''}
                    onChange={(e) => setFilmForm({ ...filmForm, description: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50 font-sans resize-none"
                    placeholder="Enter short description..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded font-bold uppercase tracking-wider transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  Save Film Registry
                </button>
              </form>
            )}

            {/* B. FILMMAKER FORM */}
            {activeTab === 'filmmakers' && (
              <form onSubmit={handleSaveFilmmaker} className="flex flex-col gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Filmmaker Name</label>
                  <input
                    type="text"
                    required
                    value={filmmakerForm.name || ''}
                    onChange={(e) => setFilmmakerForm({ ...filmmakerForm, name: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g. Denis Villeneuve"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Country</label>
                    <input
                      type="text"
                      value={filmmakerForm.country || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, country: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. Canada"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Role Profile</label>
                    <input
                      type="text"
                      value={filmmakerForm.role || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, role: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. Director / Cinematographer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Instagram Handle</label>
                    <input
                      type="text"
                      value={filmmakerForm.instagram || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, instagram: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. @username"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Portfolio Site</label>
                    <input
                      type="text"
                      value={filmmakerForm.portfolio || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, portfolio: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. website.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Avatar Image URL</label>
                  <input
                    type="url"
                    value={filmmakerForm.avatar || ''}
                    onChange={(e) => setFilmmakerForm({ ...filmmakerForm, avatar: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Short Bio</label>
                  <textarea
                    rows={4}
                    value={filmmakerForm.bio || ''}
                    onChange={(e) => setFilmmakerForm({ ...filmmakerForm, bio: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50 font-sans resize-none"
                    placeholder="Brief description of the filmmaker's journey..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded font-bold uppercase tracking-wider transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  Save Profile
                </button>
              </form>
            )}

            {/* C. UPCOMING FILM TRAILER FORM */}
            {activeTab === 'upcoming' && (
              <form onSubmit={handleSaveUpcoming} className="flex flex-col gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Trailer Title</label>
                  <input
                    type="text"
                    required
                    value={upcomingForm.title || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, title: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g. Neon Samsara II"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Director</label>
                    <input
                      type="text"
                      required
                      value={upcomingForm.director || ''}
                      onChange={(e) => setUpcomingForm({ ...upcomingForm, director: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. Sarah Chen"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Expected Release</label>
                    <input
                      type="text"
                      value={upcomingForm.expectedRelease || ''}
                      onChange={(e) => setUpcomingForm({ ...upcomingForm, expectedRelease: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. Winter 2026"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Genres (Comma separated)</label>
                  <input
                    type="text"
                    value={upcomingForm.genre?.join(', ') || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, genre: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g. Sci-Fi, Arthouse"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Landscape Thumbnail URL (Unsplash or Google Drive)</label>
                  <input
                    type="url"
                    value={upcomingForm.thumbnailUrl || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, thumbnailUrl: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="https://images.unsplash.com/... or Google Drive Image link"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                      Trailer Video URL (YouTube, Google Drive, Vimeo, or MP4)
                    </label>
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      🛡️ YouTube Stealth Pipeline Enabled
                    </span>
                  </div>
                  <input
                    type="url"
                    value={upcomingForm.videoUrl || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, videoUrl: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/..."
                  />
                  <p className="text-[10px] text-white/40 font-mono">
                    ✦ YouTube Stealth Pipeline strips YouTube controls, logos, and external recommendations to provide a clean cinema playback experience.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Teaser/Description</label>
                  <textarea
                    rows={4}
                    value={upcomingForm.description || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, description: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50 font-sans resize-none"
                    placeholder="Write a tiny pitch or teaser text..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded font-bold uppercase tracking-wider transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  Save Trailer Announcement
                </button>
              </form>
            )}
          </div>
        ) : null}

        {/* List Grid table */}
        <div className={`${(isAddingNew || editingId) ? 'xl:col-span-7' : 'xl:col-span-12'} flex flex-col gap-4 bg-[#070708] border border-white/5 p-5 rounded-lg`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold tracking-wider text-white/50 uppercase">
              ACTIVES ({
                activeTab === 'films' ? filteredFilmsList.length :
                activeTab === 'filmmakers' ? filteredFilmmakersList.length :
                filteredUpcomingList.length
              } registry rows)
            </h3>
            
            <button
              onClick={() => {
                if (activeTab === 'films') startAddFilm();
                else if (activeTab === 'filmmakers') startAddFilmmaker();
                else if (activeTab === 'upcoming') startAddUpcoming();
              }}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add {activeTab === 'films' ? 'Film' : activeTab === 'filmmakers' ? 'Filmmaker' : 'Trailer'}</span>
            </button>
          </div>

          {/* LISTS */}
          <div className="overflow-x-auto w-full">
            
            {/* A. FILMS TABLE LIST */}
            {activeTab === 'films' && (
              <table className="w-full text-left text-xs text-white/70 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono text-white/40 uppercase">
                    <th className="py-2.5 px-2">Info</th>
                    <th className="py-2.5 px-2">Details</th>
                    <th className="py-2.5 px-2">Rating & Funds</th>
                    <th className="py-2.5 px-2">Curation Status</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFilmsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-white/30 font-mono">
                        No films matching selection.
                      </td>
                    </tr>
                  ) : (
                    filteredFilmsList.map((f) => (
                      <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-2 flex items-start gap-2.5">
                          <img 
                            src={getDirectImageUrl(f.posterUrl)} 
                            alt="" 
                            className="w-10 h-14 object-cover rounded bg-black/40 border border-white/10 shrink-0"
                            style={{ objectPosition: `center ${f.posterPositionY ?? 50}%` }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-amber-400 transition-colors">{f.title}</span>
                            <span className="text-[10px] text-white/40 font-mono">By {f.director}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`text-[8px] font-mono font-bold px-1 rounded uppercase ${f.type === 'series' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-white/10 text-white/80 border border-white/10'}`}>
                                {f.type === 'series' ? 'Web Series' : 'Short Film'}
                              </span>
                              {f.isFeatured && (
                                <span className="text-[8px] font-mono font-bold bg-amber-500 text-black px-1 rounded uppercase">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col text-[10px] font-mono">
                            <span>Year: {f.releaseYear}</span>
                            <span>Duration: {f.duration}</span>
                            <span className="text-white/40 truncate max-w-[120px]">{f.cameraUsed || 'Unknown cam'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col text-[10px] font-mono">
                            <span className="text-amber-500 font-bold">♥ {f.likes} likes</span>
                            <span className="text-white/40">👁 {f.views} views</span>
                            <span className="text-[#38bdf8] font-bold">₹ {f.fundsReceived || 0} raised</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={f.approvalStatus || 'approved'}
                              onChange={(e) => {
                                const val = e.target.value as 'approved' | 'pending' | 'rejected';
                                const updated = films.map(item => item.id === f.id ? { ...item, approvalStatus: val } : item);
                                onUpdateFilms(updated);
                              }}
                              className={`text-[10px] font-mono font-bold px-2 py-1.5 rounded bg-black border focus:outline-none focus:border-amber-500 cursor-pointer uppercase tracking-wider ${
                                (!f.approvalStatus || f.approvalStatus === 'approved') ? 'text-emerald-400 border-emerald-500/20' :
                                f.approvalStatus === 'pending' ? 'text-amber-400 border-amber-500/20' : 'text-rose-400 border-rose-500/20'
                              }`}
                            >
                              <option value="approved">Approved & Live</option>
                              <option value="pending">Pending Curation</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditFilm(f)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-white/70 hover:text-white cursor-pointer transition-all"
                              title="Edit Registry Entry"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFilm(f.id)}
                              className="p-1.5 bg-white/5 hover:bg-red-500/25 border border-white/5 hover:border-red-500/20 rounded text-white/40 hover:text-red-400 cursor-pointer transition-all"
                              title="Delete Entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* B. FILMMAKERS TABLE LIST */}
            {activeTab === 'filmmakers' && (
              <table className="w-full text-left text-xs text-white/70 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono text-white/40 uppercase">
                    <th className="py-2.5 px-2">Filmmaker</th>
                    <th className="py-2.5 px-2">Bio</th>
                    <th className="py-2.5 px-2">Socials</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFilmmakersList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-white/30 font-mono">
                        No filmmakers found.
                      </td>
                    </tr>
                  ) : (
                    filteredFilmmakersList.map((fm) => (
                      <tr key={fm.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-2 flex items-center gap-2.5">
                          <img 
                            src={getDirectImageUrl(fm.avatar)} 
                            alt="" 
                            className="w-9 h-9 object-cover rounded-full bg-black/40 border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{fm.name}</span>
                            <span className="text-[10px] font-mono text-white/40">{fm.role} • {fm.country}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs text-white/60 font-sans max-w-[200px] truncate" title={fm.bio}>
                          {fm.bio}
                        </td>
                        <td className="py-3 px-2 font-mono text-[10px] text-white/40 flex flex-col">
                          <span className="text-amber-500/90">{fm.instagram || 'No instagram'}</span>
                          <span>{fm.portfolio || 'No portfolio'}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditFilmmaker(fm)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-white/70 hover:text-white cursor-pointer transition-all"
                              title="Edit profile"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFilmmaker(fm.id)}
                              className="p-1.5 bg-white/5 hover:bg-red-500/25 border border-white/5 hover:border-red-500/20 rounded text-white/40 hover:text-red-400 cursor-pointer transition-all"
                              title="Delete profile"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* C. UPCOMING TRAILERS TABLE LIST */}
            {activeTab === 'upcoming' && (
              <table className="w-full text-left text-xs text-white/70 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono text-white/40 uppercase">
                    <th className="py-2.5 px-2">Trailer Preview</th>
                    <th className="py-2.5 px-2">Target Release</th>
                    <th className="py-2.5 px-2">Genres</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUpcomingList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-white/30 font-mono">
                        No upcoming trailers found.
                      </td>
                    </tr>
                  ) : (
                    filteredUpcomingList.map((uf) => (
                      <tr key={uf.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-2 flex items-start gap-2.5">
                          <img 
                            src={uf.thumbnailUrl} 
                            alt="" 
                            className="w-16 h-10 object-cover rounded bg-black/40 border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{uf.title}</span>
                            <span className="text-[10px] text-white/40 font-mono">Dir: {uf.director}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono text-[11px] text-amber-500 font-bold uppercase">
                          {uf.expectedRelease}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {uf.genre.map((g, i) => (
                              <span key={i} className="text-[9px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                #{g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditUpcoming(uf)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-white/70 hover:text-white cursor-pointer transition-all"
                              title="Edit Trailer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUpcoming(uf.id)}
                              className="p-1.5 bg-white/5 hover:bg-red-500/25 border border-white/5 hover:border-red-500/20 rounded text-white/40 hover:text-red-400 cursor-pointer transition-all"
                              title="Delete Trailer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
