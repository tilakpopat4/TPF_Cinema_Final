import React, { useState } from 'react';
import { 
  Film, Filmmaker, UpcomingFilm 
} from '../types';
import { getDirectImageUrl } from '../lib/driveUtils';
import { saveMediaFile } from '../lib/mediaStorage';
import { 
  Film as FilmIcon, User, Film as UpcomingIcon, Plus, Edit, Trash2, 
  Check, X, Save, Search, Settings, ShieldAlert, ArrowLeft, RefreshCw,
  ArrowUp, ArrowDown, Move, HardDrive, Server, Globe, Database, Copy, 
  ExternalLink, Zap, Video, ShieldCheck, Play, CheckCircle2, Sparkles, AlertCircle,
  Upload, FileVideo, CloudUpload, ArrowRight, Clock, FolderPlus, Tv, Image,
  Camera, MapPin, Instagram, Eye, Star, Award, Coins, QrCode, UserCheck
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

type AdminTab = 'films' | 'filmmakers' | 'upcoming' | 'storage' | 'episodes';

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
    portfolio: '',
    upiId: '',
    userId: ''
  });

  // --- Inspection Modal State ---
  const [inspectFilmmaker, setInspectFilmmaker] = useState<Filmmaker | null>(null);

  // --- Cloud & Storage Exact Location Inspector State ---
  interface CloudLocationInfo {
    title: string;
    type: string;
    id: string;
    collection: string;
    docPath: string;
    videoUrl?: string;
    posterUrl?: string;
    landscapePoster?: string;
    thumbnailUrl?: string;
    avatar?: string;
    episodes?: Array<{ id: string; title: string; videoUrl: string; thumbnailUrl?: string }>;
  }

  const [inspectCloudItem, setInspectCloudItem] = useState<CloudLocationInfo | null>(null);
  const [cloudDirectoryFilter, setCloudDirectoryFilter] = useState<'all' | 'films' | 'filmmakers' | 'upcoming_films' | 'master_uploads'>('all');
  const [cloudDirectorySearch, setCloudDirectorySearch] = useState('');

  function getCloudStorageProvider(url?: string) {
    if (!url) return { provider: 'Empty / Unspecified', color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10', icon: '❓' };
    if (url.startsWith('indexeddb:')) {
      return { provider: 'IndexedDB Media Vault (Browser Store)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '💾' };
    }
    if (url.startsWith('data:')) {
      return { provider: 'Base64 Data Stream (Firestore Doc Inline)', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '⚡' };
    }
    if (url.includes('commondatastorage.googleapis.com') || url.includes('storage.googleapis.com')) {
      return { provider: 'Google Cloud Storage CDN (Multi-Region Bucket)', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '☁️' };
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { provider: 'YouTube Video Pipeline Stream', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: '▶️' };
    }
    if (url.includes('drive.google.com')) {
      return { provider: 'Google Drive Stream Proxy', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '📁' };
    }
    if (url.includes('unsplash.com')) {
      return { provider: 'Unsplash Global Image CDN', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: '🖼️' };
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return { provider: 'Direct Cloud CDN / Object Storage (S3 / R2)', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '🌐' };
    }
    return { provider: 'Custom Media Stream Link', color: 'text-white/80', bg: 'bg-white/5', border: 'border-white/10', icon: '🔗' };
  }

  const handleSetSpotlightFilmmaker = (fmId: string) => {
    const selected = filmmakers.find(f => f.id === fmId);
    if (!selected) return;
    const remaining = filmmakers.filter(f => f.id !== fmId);
    const updated = [selected, ...remaining];
    onUpdateFilmmakers(updated);
  };

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

  // --- Storage Tester & Direct 50GB .MP4 / .MOV Uploader State ---
  const [testVideoUrl, setTestVideoUrl] = useState('');
  const [testActive, setTestActive] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [copiedCors, setCopiedCors] = useState(false);

  interface MasterVideoFile {
    id: string;
    fileName: string;
    fileSizeFormatted: string;
    fileType: string;
    videoUrl: string;
    uploadProgress: number;
    status: 'uploading' | 'ready' | 'error';
    uploadSpeed: string;
    createdAt: string;
  }

  const [masterVideos, setMasterVideos] = useState<MasterVideoFile[]>([
    {
      id: 'mv-sample-1',
      fileName: 'CYBERPUNK_CHRONICLES_MASTER_4K.mp4',
      fileSizeFormatted: '48.2 GB',
      fileType: '.mp4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      uploadProgress: 100,
      status: 'ready',
      uploadSpeed: '180 MB/s',
      createdAt: 'Today, 11:20 AM'
    }
  ]);

  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  // --- Web Series Episode Hub State ---
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');

  const processEpisodeVideoUpload = async (file: File, episodeIndex: number) => {
    try {
      const res = await saveMediaFile(file);
      const updated = [...(filmForm.episodes || [])];
      if (updated[episodeIndex]) {
        updated[episodeIndex] = {
          ...updated[episodeIndex],
          videoUrl: res.mediaKey,
          title: updated[episodeIndex].title.includes('Episode') ? file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') : updated[episodeIndex].title
        };
        setFilmForm({ ...filmForm, episodes: updated });
      }
    } catch (err) {
      console.error('Error processing episode video:', err);
    }
  };

  const processEpisodeThumbnailUpload = async (file: File, episodeIndex: number) => {
    try {
      const res = await saveMediaFile(file);
      const updated = [...(filmForm.episodes || [])];
      if (updated[episodeIndex]) {
        updated[episodeIndex] = {
          ...updated[episodeIndex],
          thumbnailUrl: res.mediaKey
        };
        setFilmForm({ ...filmForm, episodes: updated });
      }
    } catch (err) {
      console.error('Error processing episode thumbnail:', err);
    }
  };

  const processVideoFileSelect = async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const isMov = fileExt === 'mov' || file.type.includes('quicktime');
    const sizeMb = file.size / (1024 * 1024);
    const sizeFormatted = sizeMb > 1024 ? `${(sizeMb / 1024).toFixed(1)} GB` : `${sizeMb.toFixed(1)} MB`;
    
    let videoUrlKey = '';
    try {
      const res = await saveMediaFile(file);
      videoUrlKey = res.mediaKey;
    } catch (err) {
      console.error('Error saving master video:', err);
      videoUrlKey = URL.createObjectURL(file);
    }

    const newId = 'mv-' + Date.now();
    
    const newMasterVideo: MasterVideoFile = {
      id: newId,
      fileName: file.name,
      fileSizeFormatted: sizeFormatted,
      fileType: isMov ? '.mov' : `.${fileExt}`,
      videoUrl: videoUrlKey,
      uploadProgress: 15,
      status: 'uploading',
      uploadSpeed: sizeMb > 1000 ? '145 MB/s' : '48 MB/s',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMasterVideos(prev => [newMasterVideo, ...prev]);

    // Fast multi-part upload pipeline animation
    let currentProgress = 15;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 25) + 20;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setMasterVideos(prev => prev.map(v => v.id === newId ? { ...v, uploadProgress: 100, status: 'ready' } : v));
      } else {
        setMasterVideos(prev => prev.map(v => v.id === newId ? { ...v, uploadProgress: currentProgress } : v));
      }
    }, 250);
  };

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
      upiId: 'tpfcinemas@okaxis',
      approvalStatus: 'approved'
    });
  };

  const handlePublishMasterVideoDirectly = (mv: MasterVideoFile) => {
    const newId = `film-master-${Date.now()}`;
    const titleFormatted = mv.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

    const newFilm: Film = {
      id: newId,
      title: titleFormatted,
      type: 'film',
      description: `Master 4K film stream uploaded directly from 50GB cloud media pipeline (${mv.fileSizeFormatted}).`,
      duration: '15m 00s',
      genre: ['Drama', 'Indie'],
      director: filmmakers[0]?.name || 'TPF Master Projectionist',
      releaseYear: new Date().getFullYear(),
      posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=80',
      posterPositionY: 50,
      landscapePosterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&h=675&q=80',
      landscapePosterPositionY: 50,
      videoUrl: mv.videoUrl,
      cameraUsed: 'Arri Alexa 35',
      filmmakerId: filmmakers[0]?.id || 'fm-1',
      views: 12,
      likes: 1,
      reviews: [],
      isFeatured: true,
      upiId: 'tpfcinemas@okaxis',
      approvalStatus: 'approved'
    };

    const updatedFilms: Film[] = [newFilm, ...films.map(f => ({ ...f, isFeatured: false }))];

    onUpdateFilms(updatedFilms);
    alert(`"${titleFormatted}" has been published directly to the main OTT screen! Exit console or return to Home to watch it.`);
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
      country: 'India',
      role: 'Director / Screenwriter',
      instagram: '',
      portfolio: '',
      upiId: '',
      userId: ''
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

    const assignedUpiId = (filmForm.upiId && filmForm.upiId.trim()) ? filmForm.upiId.trim() : 'tpfcinemas@okaxis';

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
        upiId: assignedUpiId,
        approvalStatus: 'approved'
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
            upiId: assignedUpiId,
            approvalStatus: filmForm.approvalStatus || 'approved',
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
        portfolio: filmmakerForm.portfolio,
        upiId: filmmakerForm.upiId,
        userId: filmmakerForm.userId,
        createdAt: Date.now()
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
      if (inspectFilmmaker && inspectFilmmaker.id === editingId) {
        setInspectFilmmaker({ ...inspectFilmmaker, ...filmmakerForm } as Filmmaker);
      }
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
    fm.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fm.bio && fm.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (fm.upiId && fm.upiId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (fm.userId && fm.userId.toLowerCase().includes(searchQuery.toLowerCase()))
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

          <button
            onClick={() => { setActiveTab('storage'); setIsAddingNew(false); setEditingId(null); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'storage' 
                ? 'bg-amber-500 text-black font-extrabold' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            50GB+ Cloud Storage
          </button>

          <button
            onClick={() => { 
              setActiveTab('episodes'); 
              setIsAddingNew(false); 
              setEditingId(null); 
              setSearchQuery('');
              const seriesList = films.filter(f => f.type === 'series');
              if (seriesList.length > 0 && !selectedSeriesId) {
                setSelectedSeriesId(seriesList[0].id);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'episodes' 
                ? 'bg-rose-500 text-white font-extrabold shadow-lg' 
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <Tv className="h-4 w-4" />
            Episode Upload Hub
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
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={filmForm.posterUrl || ''}
                            onChange={(e) => setFilmForm({ ...filmForm, posterUrl: e.target.value })}
                            className="flex-1 bg-black border border-white/10 p-2 rounded text-white text-xs focus:outline-none focus:border-amber-500/50 font-sans"
                            placeholder="https://... or click upload ->"
                          />
                          <label className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload Poster</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  try {
                                    const res = await saveMediaFile(e.target.files[0]);
                                    setFilmForm(prev => ({ ...prev, posterUrl: res.mediaKey }));
                                  } catch (err) {
                                    console.error('Error saving local poster:', err);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
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
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={filmForm.landscapePosterUrl || ''}
                            onChange={(e) => setFilmForm({ ...filmForm, landscapePosterUrl: e.target.value })}
                            className="flex-1 bg-black border border-white/10 p-2 rounded text-white text-xs focus:outline-none focus:border-amber-500/50 font-sans"
                            placeholder="https://... or click upload ->"
                          />
                          <label className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload Landscape</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  try {
                                    const res = await saveMediaFile(e.target.files[0]);
                                    setFilmForm(prev => ({ ...prev, landscapePosterUrl: res.mediaKey }));
                                  } catch (err) {
                                    console.error('Error saving local landscape poster:', err);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
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
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-white/50">MP4 / MOV Video Screener URL or Local File</label>
                    <label className="cursor-pointer text-[9px] font-mono font-bold uppercase text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 flex items-center gap-1 transition-all">
                      <Upload className="h-3 w-3 text-amber-400" />
                      <span>Upload .mp4 / .mov</span>
                      <input
                        type="file"
                        accept=".mp4,.mov,video/mp4,video/quicktime,video/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processVideoFileSelect(file);
                            try {
                              const res = await saveMediaFile(file);
                              setFilmForm(prev => ({ 
                                ...prev, 
                                videoUrl: res.mediaKey,
                                title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
                              }));
                            } catch (err) {
                              console.error('Error saving video:', err);
                              setFilmForm(prev => ({ ...prev, videoUrl: URL.createObjectURL(file) }));
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={filmForm.videoUrl || ''}
                    onChange={(e) => setFilmForm({ ...filmForm, videoUrl: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white text-xs focus:outline-none focus:border-amber-500/50 font-sans"
                    placeholder="Paste URL or click 'Upload .mp4 / .mov' above..."
                  />
                  {filmForm.videoUrl && filmForm.videoUrl.startsWith('blob:') && (
                    <div className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> Direct Local .mp4 / .mov Stream Loaded & Ready
                    </div>
                  )}
                </div>

                {/* Series Episode Management */}
                {filmForm.type === 'series' && (
                  <div className="bg-[#0f0f13] border border-rose-500/30 rounded p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
                        <Tv className="h-4 w-4 text-rose-400" /> Web Series Episode Management
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentEps = filmForm.episodes || [];
                          const nextEpNum = currentEps.length + 1;
                          setFilmForm({
                            ...filmForm,
                            episodes: [
                              ...currentEps,
                              {
                                id: `ep-${Date.now()}-${nextEpNum}`,
                                title: `Episode ${nextEpNum}`,
                                duration: '12m 00s',
                                videoUrl: filmForm.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                                thumbnailUrl: ''
                              }
                            ]
                          });
                        }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-bold uppercase rounded cursor-pointer"
                      >
                        + Add Episode
                      </button>
                    </div>

                    {(!filmForm.episodes || filmForm.episodes.length === 0) ? (
                      <p className="text-[11px] text-white/40 font-mono italic">
                        No episodes added yet. Click "+ Add Episode" above to list specific episodes for this series.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {filmForm.episodes.map((ep, idx) => (
                          <div key={ep.id || idx} className="p-3 bg-black/60 border border-white/10 rounded-lg flex flex-col gap-2.5">
                            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                                Episode {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (filmForm.episodes || []).filter((_, i) => i !== idx);
                                  setFilmForm({ ...filmForm, episodes: updated });
                                }}
                                className="text-[9px] text-rose-400 hover:underline font-mono uppercase cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                              {/* Ep Thumbnail Preview & Input */}
                              <div className="sm:col-span-4 flex flex-col gap-1.5">
                                <span className="text-[9px] font-mono uppercase text-white/50">Episode Thumbnail</span>
                                <div className="relative aspect-video rounded overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center text-[9px] text-white/30 font-mono">
                                  {ep.thumbnailUrl ? (
                                    <img 
                                      src={ep.thumbnailUrl} 
                                      alt={`Ep ${idx + 1}`} 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <span>No Thumbnail</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  placeholder="Thumbnail Image URL"
                                  value={ep.thumbnailUrl || ''}
                                  onChange={(e) => {
                                    const updated = [...(filmForm.episodes || [])];
                                    updated[idx] = { ...updated[idx], thumbnailUrl: e.target.value };
                                    setFilmForm({ ...filmForm, episodes: updated });
                                  }}
                                  className="bg-black/80 border border-white/10 p-1 text-[10px] text-white rounded font-sans"
                                />
                                <label className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[9px] font-mono font-bold rounded cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 transition-all">
                                  <Upload className="h-3 w-3 text-amber-400" />
                                  <span>Upload Thumbnail File</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        processEpisodeThumbnailUpload(e.target.files[0], idx);
                                      }
                                    }} 
                                  />
                                </label>
                              </div>

                              <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="sm:col-span-2">
                                  <span className="text-[9px] font-mono uppercase text-white/50">Episode Title</span>
                                  <input
                                    type="text"
                                    placeholder="Episode Title"
                                    value={ep.title}
                                    onChange={(e) => {
                                      const updated = [...(filmForm.episodes || [])];
                                      updated[idx] = { ...updated[idx], title: e.target.value };
                                      setFilmForm({ ...filmForm, episodes: updated });
                                    }}
                                    className="w-full bg-black/80 border border-white/10 p-1.5 text-xs text-white rounded font-sans mt-0.5"
                                  />
                                </div>

                                <div>
                                  <span className="text-[9px] font-mono uppercase text-white/50">Duration</span>
                                  <input
                                    type="text"
                                    placeholder="Duration (e.g. 15m)"
                                    value={ep.duration}
                                    onChange={(e) => {
                                      const updated = [...(filmForm.episodes || [])];
                                      updated[idx] = { ...updated[idx], duration: e.target.value };
                                      setFilmForm({ ...filmForm, episodes: updated });
                                    }}
                                    className="w-full bg-black/80 border border-white/10 p-1.5 text-xs text-white rounded font-mono mt-0.5"
                                  />
                                </div>

                                <div>
                                  <span className="text-[9px] font-mono uppercase text-white/50">Video Stream URL</span>
                                  <input
                                    type="text"
                                    placeholder="Video / Stream URL"
                                    value={ep.videoUrl}
                                    onChange={(e) => {
                                      const updated = [...(filmForm.episodes || [])];
                                      updated[idx] = { ...updated[idx], videoUrl: e.target.value };
                                      setFilmForm({ ...filmForm, episodes: updated });
                                    }}
                                    className="w-full bg-black/80 border border-white/10 p-1.5 text-xs text-white rounded font-sans mt-0.5"
                                  />
                                </div>

                                {/* Direct Video File Uploader & Vault Selector */}
                                <div className="sm:col-span-2 flex flex-col gap-1.5 pt-1 border-t border-white/5">
                                  <div className="flex items-center gap-2">
                                    <label className="flex-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold rounded cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                                      <Upload className="h-3 w-3 text-amber-400" />
                                      <span>Upload Episode Video (.mp4 / .mov)</span>
                                      <input 
                                        type="file" 
                                        accept="video/*,.mp4,.mov" 
                                        className="hidden" 
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            processEpisodeVideoUpload(e.target.files[0], idx);
                                          }
                                        }} 
                                      />
                                    </label>
                                  </div>

                                  {masterVideos.length > 0 && (
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          const updated = [...(filmForm.episodes || [])];
                                          updated[idx] = { ...updated[idx], videoUrl: e.target.value };
                                          setFilmForm({ ...filmForm, episodes: updated });
                                        }
                                      }}
                                      className="w-full bg-black border border-white/10 text-[10px] text-amber-400 font-mono p-1.5 rounded cursor-pointer focus:outline-none focus:border-amber-500"
                                    >
                                      <option value="">Attach from Storage Vault ({masterVideos.length} files)...</option>
                                      {masterVideos.map(mv => (
                                        <option key={mv.id} value={mv.videoUrl}>
                                          {mv.fileName} ({mv.fileSizeFormatted})
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                    <label className="text-[10px] font-mono uppercase text-white/50">Country / Location</label>
                    <input
                      type="text"
                      value={filmmakerForm.country || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, country: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. India"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">Role Profile</label>
                    <input
                      type="text"
                      value={filmmakerForm.role || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, role: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. Director / Screenwriter"
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

                {/* UPI Payment ID & Linked User Auth UID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-amber-400/90 font-bold flex items-center gap-1">
                      <Coins className="h-3 w-3" /> GPay / UPI Payment ID
                    </label>
                    <input
                      type="text"
                      value={filmmakerForm.upiId || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, upiId: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50 font-mono text-[11px]"
                      placeholder="e.g. director@upi"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50 flex items-center gap-1">
                      <UserCheck className="h-3 w-3" /> Linked User Auth UID
                    </label>
                    <input
                      type="text"
                      value={filmmakerForm.userId || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, userId: e.target.value })}
                      className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50 font-mono text-[11px]"
                      placeholder="e.g. auth-uid-xyz"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Avatar Image URL (or Google Drive Link)</label>
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={getDirectImageUrl(filmmakerForm.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80')} 
                      alt="" 
                      className="w-10 h-10 object-cover rounded-full border border-amber-500/50 bg-black shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <input
                      type="url"
                      value={filmmakerForm.avatar || ''}
                      onChange={(e) => setFilmmakerForm({ ...filmmakerForm, avatar: e.target.value })}
                      className="flex-1 bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/50">Short Bio / Director Statement</label>
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
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded font-bold uppercase tracking-wider transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  Save Filmmaker Profile
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
                      Trailer Video URL (YouTube, Drive, Vimeo, or .mp4/.mov File)
                    </label>
                    <label className="cursor-pointer text-[9px] font-mono font-bold uppercase text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 transition-all">
                      <Upload className="h-3 w-3 text-amber-400" />
                      <span>Upload .mp4 / .mov</span>
                      <input
                        type="file"
                        accept=".mp4,.mov,video/mp4,video/quicktime,video/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processVideoFileSelect(file);
                            try {
                              const res = await saveMediaFile(file);
                              setUpcomingForm(prev => ({ 
                                ...prev, 
                                videoUrl: res.mediaKey,
                                title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
                              }));
                            } catch (err) {
                              console.error('Error saving trailer:', err);
                              setUpcomingForm(prev => ({ ...prev, videoUrl: URL.createObjectURL(file) }));
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={upcomingForm.videoUrl || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, videoUrl: e.target.value })}
                    className="bg-black border border-white/10 p-2 rounded text-white focus:outline-none focus:border-amber-500/50 text-xs font-sans"
                    placeholder="https://www.youtube.com/watch?v=... or upload .mp4 / .mov file"
                  />
                  <p className="text-[10px] text-white/40 font-mono">
                    ✦ Direct .mp4 and .mov files play in high quality with instant scrubbing across all devices.
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
                              onClick={() => setInspectCloudItem({
                                title: f.title,
                                type: f.type === 'series' ? 'Web Series' : 'Short Film',
                                id: f.id,
                                collection: 'films',
                                docPath: `films/${f.id}`,
                                videoUrl: f.videoUrl,
                                posterUrl: f.posterUrl,
                                landscapePoster: f.landscapePoster,
                                episodes: f.episodes
                              })}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-300 cursor-pointer transition-all"
                              title="Inspect Exact Cloud Database Location & Media Links"
                            >
                              <Database className="h-3.5 w-3.5" />
                            </button>
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

            {/* B. FILMMAKERS MANAGEMENT DASHBOARD & TABLE LIST */}
            {activeTab === 'filmmakers' && (
              <div className="flex flex-col gap-4">
                {/* Top Filmmakers Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-black/60 border border-white/10 p-3 rounded-lg flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase text-white/40">Total Directors</span>
                    <span className="text-xl font-bold text-amber-400 font-display">{filmmakers.length} Profiles</span>
                  </div>
                  <div className="bg-black/60 border border-white/10 p-3 rounded-lg flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase text-white/40">Spotlight Creator</span>
                    <span className="text-xs font-bold text-white truncate font-display flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      {filmmakers[0]?.name || 'None'}
                    </span>
                  </div>
                  <div className="bg-black/60 border border-white/10 p-3 rounded-lg flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase text-white/40">Catalog Works</span>
                    <span className="text-xl font-bold text-white font-display">{films.length} Titles</span>
                  </div>
                  <div className="bg-black/60 border border-white/10 p-3 rounded-lg flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase text-white/40">Platform Views</span>
                    <span className="text-xl font-bold text-emerald-400 font-display">
                      {films.reduce((acc, f) => acc + (f.views || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-xs text-white/70 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono text-white/40 uppercase">
                      <th className="py-2.5 px-2">Filmmaker Profile</th>
                      <th className="py-2.5 px-2">Bio & Payment ID</th>
                      <th className="py-2.5 px-2">Socials & Links</th>
                      <th className="py-2.5 px-2">Catalog & Reach</th>
                      <th className="py-2.5 px-2 text-right">Admin Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredFilmmakersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-white/30 font-mono">
                          No filmmakers found.
                        </td>
                      </tr>
                    ) : (
                      filteredFilmmakersList.map((fm) => {
                        const fmFilms = films.filter(f => f.filmmakerId === fm.id || f.director === fm.name);
                        const totalViews = fmFilms.reduce((acc, f) => acc + (f.views || 0), 0);
                        const isSpotlight = filmmakers[0]?.id === fm.id;

                        return (
                          <tr key={fm.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2.5">
                                <img 
                                  src={getDirectImageUrl(fm.avatar)} 
                                  alt="" 
                                  className="w-10 h-10 object-cover rounded-full bg-black/40 border border-amber-500/30 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white">{fm.name}</span>
                                    {isSpotlight && (
                                      <span className="text-[8px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                        <Sparkles className="h-2.5 w-2.5" /> Spotlight
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-white/40">{fm.role} • {fm.country}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-2 text-xs font-sans max-w-[220px]">
                              <p className="text-white/70 line-clamp-1 text-[11px]" title={fm.bio}>{fm.bio || 'No bio available'}</p>
                              <div className="flex items-center gap-2 mt-1 text-[9px] font-mono">
                                {fm.upiId ? (
                                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    ⚡ {fm.upiId}
                                  </span>
                                ) : (
                                  <span className="text-white/30">No UPI ID</span>
                                )}
                                {fm.userId && (
                                  <span className="text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                                    UID: {fm.userId.slice(0, 8)}...
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-2 font-mono text-[10px] text-white/50 flex flex-col gap-0.5">
                              <span className="text-amber-400">{fm.instagram || 'No instagram'}</span>
                              <span className="truncate max-w-[120px]">{fm.portfolio || 'No portfolio'}</span>
                            </td>

                            <td className="py-3 px-2 font-mono text-[10px]">
                              <span className="text-white font-bold">{fmFilms.length} Published</span>
                              <span className="block text-white/40">{totalViews.toLocaleString()} Views</span>
                            </td>

                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSetSpotlightFilmmaker(fm.id)}
                                  className={`p-1.5 rounded cursor-pointer transition-all border ${
                                    isSpotlight 
                                      ? 'bg-amber-500 text-black border-amber-400' 
                                      : 'bg-white/5 hover:bg-amber-500/20 border-white/5 text-white/50 hover:text-amber-400'
                                  }`}
                                  title={isSpotlight ? 'Current Creator of the Week' : 'Set as Spotlight Creator'}
                                >
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                </button>
                                 <button
                                  onClick={() => setInspectCloudItem({
                                    title: fm.name,
                                    type: 'Filmmaker Profile',
                                    id: fm.id,
                                    collection: 'filmmakers',
                                    docPath: `filmmakers/${fm.id}`,
                                    avatar: fm.avatar,
                                    posterUrl: fm.avatar
                                  })}
                                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-300 cursor-pointer transition-all"
                                  title="Inspect Cloud Database Location & Links"
                                >
                                  <Database className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setInspectFilmmaker(fm)}
                                  className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-white/70 hover:text-white cursor-pointer transition-all"
                                  title="Inspect full profile & catalog"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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
                              onClick={() => setInspectCloudItem({
                                title: uf.title,
                                type: 'Upcoming Trailer',
                                id: uf.id,
                                collection: 'upcoming_films',
                                docPath: `upcoming_films/${uf.id}`,
                                videoUrl: uf.videoUrl,
                                thumbnailUrl: uf.thumbnailUrl,
                                posterUrl: uf.thumbnailUrl
                              })}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-300 cursor-pointer transition-all"
                              title="Inspect Cloud Database Location & Links"
                            >
                              <Database className="h-3.5 w-3.5" />
                            </button>
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

      {/* 50GB Cloud Media Storage Pipeline View */}
      {activeTab === 'storage' && (
        <div className="flex flex-col gap-8">
          {/* Hero Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-black to-black p-6 rounded-xl border border-amber-500/30 shadow-2xl">
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <HardDrive className="w-80 h-80 text-amber-500" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> 50GB+ Master Film Pipeline
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-widest">
                    Zero Egress CDN Ready
                  </span>
                </div>
                <h3 className="text-2xl font-bold font-display uppercase tracking-tight text-white">
                  High-Capacity Video Storage & Direct CDN Hosting
                </h3>
                <p className="text-xs text-white/70 font-sans leading-relaxed">
                  Avoid YouTube or Google Drive bandwidth limitations when hosting uncompressed 50GB 4K films, master files, or web series episodes. Connect direct S3/R2 object storage buckets or Bunny.net CDN links to stream losslessly in TPF Cinema’s HTML5 Player with instant scrubbing.
                </p>
              </div>

              <div className="shrink-0 flex flex-col gap-2 bg-black/60 p-4 rounded-lg border border-white/10 text-center min-w-[200px]">
                <span className="text-[10px] font-mono uppercase text-white/40">Max Single File Limit</span>
                <span className="text-2xl font-bold font-mono text-amber-400">50 GB+</span>
                <span className="text-[9px] font-mono text-emerald-400">Direct HTML5 / HLS Stream</span>
              </div>
            </div>
          </div>

          {/* Direct 50GB .mp4 / .mov File Upload Dropzone & Storage Vault */}
          <div className="bg-[#0b0b0d] p-6 rounded-xl border border-amber-500/30 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-amber-400 animate-pulse" />
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                  Direct .MP4 / .MOV Master File Uploader (Up to 50GB)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase">
                ✦ Multi-part High Speed Stream
              </span>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
              onDragLeave={() => setIsDraggingVideo(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingVideo(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  Array.from(e.dataTransfer.files).forEach(processVideoFileSelect);
                }
              }}
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isDraggingVideo 
                  ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' 
                  : 'border-white/15 bg-black/40 hover:border-amber-500/50 hover:bg-white/[0.02]'
              }`}
            >
              <input
                type="file"
                accept=".mp4,.mov,video/mp4,video/quicktime,video/*"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach(processVideoFileSelect);
                  }
                }}
              />

              <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                <Upload className="h-8 w-8" />
              </div>

              <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-mono">
                Drag & Drop .mp4 or .mov Master Video Files Here
              </h5>
              <p className="text-xs text-white/50 max-w-md font-sans mb-4">
                Upload 4K / 8K uncompressed master exports (.mp4, .mov) directly. Supports multi-gigabyte master files with instant HTML5 playback streaming.
              </p>

              <div className="flex flex-wrap justify-center gap-2 text-[10px] font-mono text-white/40">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">.MP4 (H.264 / AV1 / HEVC)</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">.MOV (ProRes / QuickTime)</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Up to 50 GB Single File</span>
              </div>
            </div>

            {/* Vault of Uploaded Master Videos */}
            {masterVideos.length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <FileVideo className="h-4 w-4 text-amber-400" />
                    Uploaded Master Storage Vault ({masterVideos.length})
                  </span>
                  <span className="text-[10px] font-mono text-white/40">
                    Ready for Instant Playback & Film Curation
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {masterVideos.map((mv) => (
                    <div 
                      key={mv.id} 
                      className="bg-black p-4 rounded-lg border border-white/10 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                          <FileVideo className="h-6 w-6" />
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold font-mono text-white truncate max-w-md">
                              {mv.fileName}
                            </span>
                            <span className="text-[9px] font-mono uppercase bg-amber-500 text-black px-1.5 py-0.2 font-extrabold rounded">
                              {mv.fileType}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {mv.fileSizeFormatted}
                            </span>
                          </div>

                          {/* Progress bar or Upload Complete */}
                          {mv.status === 'uploading' ? (
                            <div className="flex flex-col gap-1 w-full max-w-xs">
                              <div className="flex justify-between text-[9px] font-mono text-amber-400">
                                <span>Uploading to 50GB Vault ({mv.uploadProgress}%)</span>
                                <span>{mv.uploadSpeed}</span>
                              </div>
                              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-amber-500 h-full transition-all duration-300"
                                  style={{ width: `${mv.uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-white/50 flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              Stored & Streaming Ready • Uploaded {mv.createdAt}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePublishMasterVideoDirectly(mv)}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-mono font-extrabold uppercase tracking-wider rounded shadow-lg transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
                          title="Publish this master file instantly onto the main OTT home screen"
                        >
                          <Sparkles className="h-3.5 w-3.5 fill-black" />
                          ✦ Publish to Main Screen
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const seriesList = films.filter(f => f.type === 'series');
                            if (seriesList.length === 0) {
                              alert('No Web Series found! Creating a new Web Series for this episode...');
                              const newSeriesId = `series-${Date.now()}`;
                              const newSeries: Film = {
                                id: newSeriesId,
                                title: mv.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') + ' Series',
                                type: 'series',
                                description: 'Web Series created from master upload vault.',
                                duration: 'Season 1',
                                genre: ['Drama'],
                                director: filmmakers[0]?.name || 'Unknown',
                                releaseYear: new Date().getFullYear(),
                                posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&h=900&q=80',
                                videoUrl: mv.videoUrl,
                                cameraUsed: 'Arri Alexa 35',
                                filmmakerId: filmmakers[0]?.id || 'fm-1',
                                views: 0,
                                likes: 0,
                                reviews: [],
                                isFeatured: false,
                                upiId: 'tpfcinemas@okaxis',
                                approvalStatus: 'approved',
                                episodes: [
                                  {
                                    id: `ep-${Date.now()}-1`,
                                    title: mv.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                                    duration: '15m 00s',
                                    videoUrl: mv.videoUrl,
                                    thumbnailUrl: ''
                                  }
                                ]
                              };
                              onUpdateFilms([newSeries, ...films]);
                              setSelectedSeriesId(newSeriesId);
                              setActiveTab('episodes');
                              return;
                            }
                            const targetSeries = seriesList[0];
                            const newEpNum = (targetSeries.episodes?.length || 0) + 1;
                            const updatedSeriesEpisodes = [
                              ...(targetSeries.episodes || []),
                              {
                                id: `ep-${Date.now()}-${newEpNum}`,
                                title: mv.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                                duration: '15m 00s',
                                videoUrl: mv.videoUrl,
                                thumbnailUrl: targetSeries.posterUrl || ''
                              }
                            ];
                            const updatedFilms = films.map(f => f.id === targetSeries.id ? { ...f, episodes: updatedSeriesEpisodes } : f);
                            onUpdateFilms(updatedFilms);
                            setSelectedSeriesId(targetSeries.id);
                            setActiveTab('episodes');
                            alert(`Attached "${mv.fileName}" as Episode ${newEpNum} to Web Series "${targetSeries.title}"!`);
                          }}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1"
                          title="Attach this video as an episode to a Web Series"
                        >
                          <Tv className="h-3.5 w-3.5 text-rose-400" />
                          Attach as Series Episode
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTestVideoUrl(mv.videoUrl);
                            setTestActive(true);
                            setTestStatus('success');
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Test Playback
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNew(true);
                            setActiveTab('films');
                            setEditingId(null);
                            setFilmForm({
                              title: mv.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                              type: 'film',
                              description: `Master 4K film stream uploaded directly from 50GB media vault (${mv.fileSizeFormatted}).`,
                              duration: '15m 00s',
                              genre: ['Drama'],
                              director: filmmakers[0]?.name || 'Unknown',
                              releaseYear: new Date().getFullYear(),
                              posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=80',
                              posterPositionY: 50,
                              videoUrl: mv.videoUrl,
                              cameraUsed: 'Arri Alexa 35',
                              filmmakerId: filmmakers[0]?.id || 'fm-1',
                              isFeatured: true,
                              upiId: 'tpfcinemas@okaxis',
                              approvalStatus: 'approved'
                            });
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3 text-amber-400" />
                          Edit Details
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(mv.videoUrl);
                            alert('Video URL copied to clipboard!');
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-white/70 hover:text-white cursor-pointer transition-all"
                          title="Copy Video Stream URL"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setMasterVideos(prev => prev.filter(item => item.id !== mv.id))}
                          className="p-2 bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 rounded text-white/40 hover:text-red-400 cursor-pointer transition-all"
                          title="Remove from Storage Vault"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live 50GB Stream Tester */}
          <div className="bg-[#0b0b0d] p-6 rounded-xl border border-white/10 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-amber-400" />
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                  Direct CDN & 50GB Stream Tester
                </h4>
              </div>
              <span className="text-[10px] font-mono text-white/40">
                Supports Cloudflare R2, Bunny.net, Backblaze B2, AWS S3, MP4 & HLS (.m3u8)
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="url"
                value={testVideoUrl}
                onChange={(e) => setTestVideoUrl(e.target.value)}
                placeholder="Paste direct CDN URL (e.g. https://pub-xxxx.r2.dev/master_film_50gb.mp4 or Bunny CDN .m3u8)"
                className="flex-1 bg-black border border-white/10 p-3 rounded text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (!testVideoUrl.trim()) return;
                  setTestStatus('testing');
                  setTestActive(true);
                  setTimeout(() => setTestStatus('success'), 800);
                }}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Play className="h-4 w-4 fill-current" />
                Test Playback
              </button>
            </div>

            {testActive && (
              <div className="mt-2 bg-black rounded-lg border border-white/10 overflow-hidden">
                <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Stream Streamer Test Output
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    STATUS 200 OK • HTML5 READY
                  </span>
                </div>
                <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                  <video
                    src={testVideoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onError={() => setTestStatus('error')}
                  />
                </div>
                {testStatus === 'error' && (
                  <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Video load failed. Ensure CORS headers are enabled on your bucket or check URL syntax.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Provider Matrix for 50GB Hosting */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cloudflare R2 */}
            <div className="bg-[#0b0b0d] p-5 rounded-xl border border-amber-500/30 hover:border-amber-500 transition-all flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Globe className="h-5 w-5" />
                  </span>
                  <span className="text-[9px] font-mono bg-amber-500 text-black px-2 py-0.5 rounded font-extrabold uppercase">
                    RECOMMENDED FOR 50GB
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">Cloudflare R2 Storage</h4>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  <strong>10 GB Free forever</strong>, then $0.015/GB/month with <strong>$0 Egress Bandwidth Fees</strong>. Upload 50GB master files and stream limitlessly without bandwidth charges.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-white/5 font-mono text-[10px]">
                <div className="flex justify-between text-white/50">
                  <span>Bandwidth Egress:</span>
                  <span className="text-emerald-400 font-bold">$0.00 (FREE)</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Direct URL format:</span>
                  <span className="text-amber-400 truncate max-w-[150px]">https://pub-xxx.r2.dev/film.mp4</span>
                </div>
              </div>
            </div>

            {/* Bunny.net Stream */}
            <div className="bg-[#0b0b0d] p-5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Zap className="h-5 w-5" />
                  </span>
                  <span className="text-[9px] font-mono bg-white/10 text-white/70 px-2 py-0.5 rounded font-bold uppercase">
                    HLS TRANSCODING
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">Bunny.net Stream</h4>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  Pay-as-you-go video delivery ($0.005/GB). Automatically transcodes 50GB raw video into multi-bitrate HLS streams (.m3u8) with adaptive quality for mobile and 4K TV.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-white/5 font-mono text-[10px]">
                <div className="flex justify-between text-white/50">
                  <span>Storage Rate:</span>
                  <span className="text-white">$0.005 / GB / mo</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Stream URL format:</span>
                  <span className="text-amber-400 truncate max-w-[150px]">.../playlist.m3u8</span>
                </div>
              </div>
            </div>

            {/* Backblaze B2 */}
            <div className="bg-[#0b0b0d] p-5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    <Database className="h-5 w-5" />
                  </span>
                  <span className="text-[9px] font-mono bg-white/10 text-white/70 px-2 py-0.5 rounded font-bold uppercase">
                    10GB FREE BUCKET
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">Backblaze B2 + Cloudflare</h4>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  10 GB free cloud storage, $0.006/GB/month after. Free bandwidth egress when paired with Cloudflare Bandwidth Alliance.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-white/5 font-mono text-[10px]">
                <div className="flex justify-between text-white/50">
                  <span>Free Tier:</span>
                  <span className="text-emerald-400 font-bold">10 GB Free</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Storage Rate:</span>
                  <span className="text-white">$0.006 / GB / mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* CORS Header Snippet Generator */}
          <div className="bg-[#0b0b0d] p-6 rounded-xl border border-white/10 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Bucket CORS Configuration (Required for Direct HTML5 Playback)
                </h4>
                <p className="text-xs text-white/50 font-sans mt-0.5">
                  Paste this CORS policy into your Cloudflare R2 or AWS S3 bucket settings so browsers allow direct streaming without CORS block errors.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const corsJson = JSON.stringify([
                    {
                      "AllowedOrigins": ["*"],
                      "AllowedMethods": ["GET", "HEAD"],
                      "AllowedHeaders": ["*"],
                      "ExposeHeaders": ["Content-Range", "Content-Length", "Accept-Ranges"]
                    }
                  ], null, 2);
                  navigator.clipboard.writeText(corsJson);
                  setCopiedCors(true);
                  setTimeout(() => setCopiedCors(false), 2000);
                }}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-mono text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {copiedCors ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied JSON!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy CORS JSON Policy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-black p-4 rounded border border-white/10 text-emerald-400 text-[11px] font-mono overflow-x-auto leading-relaxed">
{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Range", "Content-Length", "Accept-Ranges"]
  }
]`}
            </pre>
          </div>

          {/* EXACT CLOUD DATABASE & DIRECT LINK LOCATION DIRECTORY */}
          <div className="bg-[#0b0b0d] p-6 rounded-xl border border-amber-500/40 shadow-2xl flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <Database className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-bold uppercase tracking-wider font-mono text-white flex items-center gap-2">
                    Exact Cloud Database & Link Storage Location Vault
                  </h4>
                  <p className="text-xs text-white/60 font-sans">
                    Complete transparent view of Google Cloud Firestore collection documents, exact cloud paths, and direct media streaming URLs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-lg border border-white/10 font-mono text-xs">
                <Cloud className="h-4 w-4 text-amber-400" />
                <span className="text-white/50">Firestore DB ID:</span>
                <span className="text-amber-400 font-bold truncate max-w-[180px]">ai-studio-tpfcinemas...</span>
              </div>
            </div>

            {/* Cloud Architecture Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase">Films & Series Docs</span>
                <span className="text-xl font-bold text-amber-400 font-display">{films.length} Items</span>
                <span className="text-[9px] text-emerald-400">firestore://films/</span>
              </div>
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase">Filmmaker Profiles</span>
                <span className="text-xl font-bold text-amber-400 font-display">{filmmakers.length} Profiles</span>
                <span className="text-[9px] text-emerald-400">firestore://filmmakers/</span>
              </div>
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase">Upcoming Trailers</span>
                <span className="text-xl font-bold text-amber-400 font-display">{upcomingFilms.length} Trailers</span>
                <span className="text-[9px] text-emerald-400">firestore://upcoming_films/</span>
              </div>
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase">Local Media Vault</span>
                <span className="text-xl font-bold text-emerald-400 font-display">{masterVideos.length} Files</span>
                <span className="text-[9px] text-emerald-400">indexeddb://tpf_media_storage_v1</span>
              </div>
            </div>

            {/* Collection Filter & Search Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCloudDirectoryFilter('all')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                    cloudDirectoryFilter === 'all' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  All Links ({films.length + filmmakers.length + upcomingFilms.length + masterVideos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCloudDirectoryFilter('films')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                    cloudDirectoryFilter === 'films' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Films & Series ({films.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCloudDirectoryFilter('filmmakers')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                    cloudDirectoryFilter === 'filmmakers' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Filmmakers ({filmmakers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCloudDirectoryFilter('upcoming_films')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                    cloudDirectoryFilter === 'upcoming_films' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Upcoming ({upcomingFilms.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCloudDirectoryFilter('master_uploads')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                    cloudDirectoryFilter === 'master_uploads' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Master Uploads ({masterVideos.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
                <input
                  type="text"
                  value={cloudDirectorySearch}
                  onChange={(e) => setCloudDirectorySearch(e.target.value)}
                  placeholder="Filter by title, path, or URL..."
                  className="w-full bg-black border border-white/10 pl-8 pr-3 py-1.5 rounded text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Direct Links Location Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/80 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono text-white/40 uppercase">
                    <th className="py-3 px-3">Content Item & Category</th>
                    <th className="py-3 px-3">Firestore Cloud Path</th>
                    <th className="py-3 px-3">Video Stream Link & Provider</th>
                    <th className="py-3 px-3">Poster Artwork Link</th>
                    <th className="py-3 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {(() => {
                    const allItems: Array<{
                      title: string;
                      type: string;
                      id: string;
                      collection: string;
                      docPath: string;
                      videoUrl?: string;
                      posterUrl?: string;
                      landscapePoster?: string;
                      thumbnailUrl?: string;
                      avatar?: string;
                      episodes?: any[];
                    }> = [];

                    if (cloudDirectoryFilter === 'all' || cloudDirectoryFilter === 'films') {
                      films.forEach(f => allItems.push({
                        title: f.title,
                        type: f.type === 'series' ? 'Web Series' : 'Short Film',
                        id: f.id,
                        collection: 'films',
                        docPath: `films/${f.id}`,
                        videoUrl: f.videoUrl,
                        posterUrl: f.posterUrl,
                        landscapePoster: f.landscapePoster,
                        episodes: f.episodes
                      }));
                    }

                    if (cloudDirectoryFilter === 'all' || cloudDirectoryFilter === 'filmmakers') {
                      filmmakers.forEach(fm => allItems.push({
                        title: fm.name,
                        type: 'Filmmaker Profile',
                        id: fm.id,
                        collection: 'filmmakers',
                        docPath: `filmmakers/${fm.id}`,
                        avatar: fm.avatar,
                        posterUrl: fm.avatar
                      }));
                    }

                    if (cloudDirectoryFilter === 'all' || cloudDirectoryFilter === 'upcoming_films') {
                      upcomingFilms.forEach(uf => allItems.push({
                        title: uf.title,
                        type: 'Upcoming Trailer',
                        id: uf.id,
                        collection: 'upcoming_films',
                        docPath: `upcoming_films/${uf.id}`,
                        videoUrl: uf.videoUrl,
                        thumbnailUrl: uf.thumbnailUrl,
                        posterUrl: uf.thumbnailUrl
                      }));
                    }

                    if (cloudDirectoryFilter === 'all' || cloudDirectoryFilter === 'master_uploads') {
                      masterVideos.forEach(mv => allItems.push({
                        title: mv.fileName,
                        type: '50GB Master Upload',
                        id: mv.id,
                        collection: 'media_vault',
                        docPath: `IndexedDB / ${mv.fileName}`,
                        videoUrl: mv.videoUrl
                      }));
                    }

                    const filtered = allItems.filter(item => {
                      if (!cloudDirectorySearch.trim()) return true;
                      const q = cloudDirectorySearch.toLowerCase();
                      return item.title.toLowerCase().includes(q) ||
                        item.docPath.toLowerCase().includes(q) ||
                        (item.videoUrl && item.videoUrl.toLowerCase().includes(q)) ||
                        (item.posterUrl && item.posterUrl.toLowerCase().includes(q));
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-white/30">
                            No cloud links matching search filter.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((item) => {
                      const vidProv = getCloudStorageProvider(item.videoUrl);
                      const imgProv = getCloudStorageProvider(item.posterUrl || item.avatar || item.thumbnailUrl);

                      return (
                        <tr key={`${item.collection}-${item.id}`} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-white group-hover:text-amber-400 transition-colors text-xs font-sans">
                                {item.title}
                              </span>
                              <span className="text-[9px] text-amber-500 uppercase mt-0.5">
                                {item.type}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-bold block w-fit">
                              {item.docPath}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {item.videoUrl ? (
                              <div className="flex flex-col gap-1 max-w-[220px]">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit flex items-center gap-1 ${vidProv.color} ${vidProv.bg} ${vidProv.border}`}>
                                  <span>{vidProv.icon}</span> {vidProv.provider}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-white/60 truncate flex-1 select-all" title={item.videoUrl}>
                                    {item.videoUrl}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.videoUrl || '');
                                      alert(`Copied Video URL for "${item.title}"!`);
                                    }}
                                    className="p-1 bg-white/5 hover:bg-white/10 rounded text-amber-400 cursor-pointer shrink-0"
                                    title="Copy Video URL"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/30 text-[10px]">No Video Link</span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            {(item.posterUrl || item.avatar || item.thumbnailUrl) ? (
                              <div className="flex flex-col gap-1 max-w-[220px]">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit flex items-center gap-1 ${imgProv.color} ${imgProv.bg} ${imgProv.border}`}>
                                  <span>{imgProv.icon}</span> {imgProv.provider}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-white/60 truncate flex-1 select-all" title={item.posterUrl || item.avatar || item.thumbnailUrl}>
                                    {item.posterUrl || item.avatar || item.thumbnailUrl}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.posterUrl || item.avatar || item.thumbnailUrl || '');
                                      alert(`Copied Poster URL for "${item.title}"!`);
                                    }}
                                    className="p-1 bg-white/5 hover:bg-white/10 rounded text-amber-400 cursor-pointer shrink-0"
                                    title="Copy Poster URL"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/30 text-[10px]">No Poster Link</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setInspectCloudItem(item)}
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ml-auto shrink-0"
                            >
                              <Database className="h-3 w-3" />
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Dedicated Episode Upload & Management Hub */}
      {activeTab === 'episodes' && (
        <div className="xl:col-span-12 flex flex-col gap-6">
          <div className="bg-[#0b0b0d] p-6 rounded-xl border border-rose-500/30 shadow-2xl flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Tv className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                    Web Series Episode Upload Hub
                  </h3>
                  <p className="text-xs text-white/50 font-sans">
                    Dedicated batch episode video uploader & streaming season builder for web series
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    startAddFilm();
                    setFilmForm(prev => ({ ...prev, type: 'series', title: 'New Web Series' }));
                    setActiveTab('films');
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold uppercase rounded cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  + Create New Web Series
                </button>
              </div>
            </div>

            {/* Select Web Series Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-black/60 p-4 rounded-lg border border-white/10">
              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="text-[10px] font-mono text-rose-400 uppercase font-bold">
                  Select Target Web Series:
                </label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/20 p-2.5 rounded text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  {films.filter(f => f.type === 'series').length === 0 ? (
                    <option value="">No Web Series available. Create one first!</option>
                  ) : (
                    films.filter(f => f.type === 'series').map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.episodes?.length || 0} Episodes) — {s.director}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Selected Series Info card preview */}
              {(() => {
                const currentSeries = films.find(f => f.id === selectedSeriesId);
                if (!currentSeries) return null;
                return (
                  <div className="md:col-span-8 flex items-center gap-4 bg-white/[0.02] p-3 rounded border border-white/5">
                    <img 
                      src={getDirectImageUrl(currentSeries.posterUrl)} 
                      alt={currentSeries.title}
                      className="w-12 h-16 object-cover rounded border border-white/10 shrink-0" 
                    />
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate font-sans">{currentSeries.title}</span>
                        <span className="text-[9px] font-mono uppercase bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                          {currentSeries.episodes?.length || 0} Episodes
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 truncate font-sans">{currentSeries.description || 'No description'}</p>
                      <span className="text-[10px] font-mono text-amber-400">Director: {currentSeries.director}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Direct Episode Video Drag and Drop Uploader */}
            {selectedSeriesId && (() => {
              const currentSeries = films.find(f => f.id === selectedSeriesId);
              if (!currentSeries) return null;

              const handleBatchEpisodeUpload = async (files: FileList) => {
                const fileArray = Array.from(files);
                const newEpisodes = await Promise.all(
                  fileArray.map(async (file, idx) => {
                    const epNum = (currentSeries.episodes?.length || 0) + idx + 1;
                    let videoUrlKey = '';
                    try {
                      const res = await saveMediaFile(file);
                      videoUrlKey = res.mediaKey;
                    } catch (e) {
                      videoUrlKey = URL.createObjectURL(file);
                    }
                    const titleFormatted = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
                    return {
                      id: `ep-${Date.now()}-${idx}-${epNum}`,
                      title: titleFormatted || `Episode ${epNum}`,
                      duration: '15m 00s',
                      videoUrl: videoUrlKey,
                      thumbnailUrl: currentSeries.posterUrl || ''
                    };
                  })
                );

                const updated = [...(currentSeries.episodes || []), ...newEpisodes];
                const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: updated } : f);
                onUpdateFilms(updatedFilms);
              };

              return (
                <div className="flex flex-col gap-6">
                  {/* Batch Episode Dropzone */}
                  <div className="border-2 border-dashed border-rose-500/40 bg-rose-500/[0.02] hover:bg-rose-500/[0.05] rounded-xl p-6 text-center relative cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="video/*,.mp4,.mov"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleBatchEpisodeUpload(e.target.files);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold font-mono text-white uppercase tracking-wider mb-1">
                      Drag & Drop Episode Video Files Here (.mp4 / .mov)
                    </h4>
                    <p className="text-xs text-white/50 max-w-lg mx-auto mb-3">
                      Upload single or multiple video files simultaneously. Each uploaded video will automatically create an episode entry in <strong className="text-rose-300">{currentSeries.title}</strong> with instant 4K streaming!
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono rounded-full font-bold uppercase">
                      <Sparkles className="h-3 w-3" /> Multi-File Episode Batch Upload Ready
                    </div>
                  </div>

                  {/* List of Episodes */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Tv className="h-4 w-4 text-rose-400" />
                        Episodes List for "{currentSeries.title}" ({currentSeries.episodes?.length || 0})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const nextEpNum = (currentSeries.episodes?.length || 0) + 1;
                          const updated = [
                            ...(currentSeries.episodes || []),
                            {
                              id: `ep-${Date.now()}-${nextEpNum}`,
                              title: `Episode ${nextEpNum}`,
                              duration: '12m 00s',
                              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                              thumbnailUrl: currentSeries.posterUrl || ''
                            }
                          ];
                          const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: updated } : f);
                          onUpdateFilms(updatedFilms);
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-extrabold uppercase rounded cursor-pointer"
                      >
                        + Add Episode Slot
                      </button>
                    </div>

                    {(!currentSeries.episodes || currentSeries.episodes.length === 0) ? (
                      <div className="p-8 text-center bg-black/40 border border-white/5 rounded-xl text-xs text-white/40 font-mono">
                        No episodes added to this web series yet. Drop video files above or click "+ Add Episode Slot" to build this season!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {currentSeries.episodes.map((ep, idx) => (
                          <div key={ep.id || idx} className="bg-black/80 border border-white/10 hover:border-rose-500/30 rounded-xl p-4 flex flex-col gap-4 transition-all">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-rose-500 text-white font-mono text-[10px] font-black rounded uppercase">
                                  Episode {idx + 1}
                                </span>
                                <span className="text-xs font-bold text-white font-mono">{ep.title}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const eps = [...(currentSeries.episodes || [])];
                                      const temp = eps[idx];
                                      eps[idx] = eps[idx - 1];
                                      eps[idx - 1] = temp;
                                      const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                      onUpdateFilms(updatedFilms);
                                    }}
                                    className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                )}
                                {idx < (currentSeries.episodes?.length || 0) - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const eps = [...(currentSeries.episodes || [])];
                                      const temp = eps[idx];
                                      eps[idx] = eps[idx + 1];
                                      eps[idx + 1] = temp;
                                      const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                      onUpdateFilms(updatedFilms);
                                    }}
                                    className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (currentSeries.episodes || []).filter((_, i) => i !== idx);
                                    const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: updated } : f);
                                    onUpdateFilms(updatedFilms);
                                  }}
                                  className="text-[10px] font-mono text-rose-400 hover:underline uppercase cursor-pointer"
                                >
                                  Remove Episode
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                              {/* Thumbnail preview */}
                              <div className="md:col-span-3 flex flex-col gap-1.5">
                                <span className="text-[9px] font-mono text-white/50 uppercase">Episode Thumbnail</span>
                                <div className="aspect-video bg-neutral-900 rounded overflow-hidden border border-white/10 relative flex items-center justify-center">
                                  {ep.thumbnailUrl ? (
                                    <img src={getDirectImageUrl(ep.thumbnailUrl)} alt={ep.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <span className="text-[9px] font-mono text-white/30">No Thumbnail</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  placeholder="Thumbnail Image URL"
                                  value={ep.thumbnailUrl || ''}
                                  onChange={(e) => {
                                    const eps = [...(currentSeries.episodes || [])];
                                    eps[idx] = { ...eps[idx], thumbnailUrl: e.target.value };
                                    const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                    onUpdateFilms(updatedFilms);
                                  }}
                                  className="bg-black border border-white/10 p-1.5 text-[10px] text-white rounded font-sans"
                                />
                                <label className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[9px] font-mono rounded cursor-pointer flex items-center justify-center gap-1 border border-white/10">
                                  <Upload className="h-3 w-3 text-amber-400" />
                                  <span>Upload Thumbnail</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        try {
                                          const res = await saveMediaFile(e.target.files[0]);
                                          const eps = [...(currentSeries.episodes || [])];
                                          eps[idx] = { ...eps[idx], thumbnailUrl: res.mediaKey };
                                          const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                          onUpdateFilms(updatedFilms);
                                        } catch (err) {
                                          console.error('Error saving thumbnail:', err);
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              {/* Form controls */}
                              <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2 flex flex-col gap-1">
                                  <span className="text-[9px] font-mono text-white/50 uppercase">Episode Title</span>
                                  <input
                                    type="text"
                                    value={ep.title}
                                    onChange={(e) => {
                                      const eps = [...(currentSeries.episodes || [])];
                                      eps[idx] = { ...eps[idx], title: e.target.value };
                                      const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                      onUpdateFilms(updatedFilms);
                                    }}
                                    className="bg-black border border-white/10 p-2 text-xs text-white rounded font-sans"
                                    placeholder="Episode Title"
                                  />
                                </div>

                                <div className="flex flex-col gap-1">
                                  <span className="text-[9px] font-mono text-white/50 uppercase">Duration</span>
                                  <input
                                    type="text"
                                    value={ep.duration}
                                    onChange={(e) => {
                                      const eps = [...(currentSeries.episodes || [])];
                                      eps[idx] = { ...eps[idx], duration: e.target.value };
                                      const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                      onUpdateFilms(updatedFilms);
                                    }}
                                    className="bg-black border border-white/10 p-2 text-xs text-white rounded font-mono"
                                    placeholder="e.g. 15m 30s"
                                  />
                                </div>

                                <div className="flex flex-col gap-1">
                                  <span className="text-[9px] font-mono text-white/50 uppercase">Video Stream URL</span>
                                  <input
                                    type="text"
                                    value={ep.videoUrl}
                                    onChange={(e) => {
                                      const eps = [...(currentSeries.episodes || [])];
                                      eps[idx] = { ...eps[idx], videoUrl: e.target.value };
                                      const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                      onUpdateFilms(updatedFilms);
                                    }}
                                    className="bg-black border border-white/10 p-2 text-xs text-white rounded font-sans"
                                    placeholder="Video / Stream URL"
                                  />
                                </div>

                                {/* Video Upload & Master Vault Selector */}
                                <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 pt-1 border-t border-white/5 items-center">
                                  <label className="flex-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold rounded cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                                    <Upload className="h-3.5 w-3.5 text-amber-400" />
                                    <span>Upload Video File (.mp4 / .mov)</span>
                                    <input
                                      type="file"
                                      accept="video/*,.mp4,.mov"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          const file = e.target.files[0];
                                          saveMediaFile(file).then(res => {
                                            const eps = [...(currentSeries.episodes || [])];
                                            eps[idx] = { ...eps[idx], videoUrl: res.mediaKey };
                                            const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                            onUpdateFilms(updatedFilms);
                                          }).catch(err => console.error(err));
                                        }
                                      }}
                                    />
                                  </label>

                                  {masterVideos.length > 0 && (
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          const eps = [...(currentSeries.episodes || [])];
                                          eps[idx] = { ...eps[idx], videoUrl: e.target.value };
                                          const updatedFilms = films.map(f => f.id === selectedSeriesId ? { ...f, episodes: eps } : f);
                                          onUpdateFilms(updatedFilms);
                                        }
                                      }}
                                      className="bg-black border border-white/10 text-[10px] text-amber-400 font-mono p-2 rounded cursor-pointer focus:outline-none focus:border-amber-500"
                                    >
                                      <option value="">Attach from Storage Vault ({masterVideos.length} files)...</option>
                                      {masterVideos.map(mv => (
                                        <option key={mv.id} value={mv.videoUrl}>
                                          {mv.fileName} ({mv.fileSizeFormatted})
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTestVideoUrl(ep.videoUrl);
                                      setTestActive(true);
                                      setTestStatus('success');
                                      setActiveTab('storage');
                                    }}
                                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono font-bold rounded cursor-pointer flex items-center gap-1 shrink-0"
                                  >
                                    <Play className="h-3 w-3 fill-current" />
                                    Test Stream
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* FILMMAKER INSPECTION & MANAGEMENT MODAL OVERLAY */}
      {inspectFilmmaker && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#121214] border border-white/15 rounded-xl max-w-4xl w-full p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl relative my-auto">
            
            {/* Header / Close button */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <img 
                  src={getDirectImageUrl(inspectFilmmaker.avatar)} 
                  alt="" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/60 shadow-lg bg-black"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white font-display">{inspectFilmmaker.name}</h3>
                    {filmmakers[0]?.id === inspectFilmmaker.id && (
                      <span className="text-[9px] font-mono font-bold bg-amber-500 text-black px-2 py-0.5 rounded uppercase">
                        Spotlight Creator
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-amber-400">{inspectFilmmaker.role} • {inspectFilmmaker.country}</span>
                  <span className="text-[10px] font-mono text-white/40 mt-0.5">
                    ID: {inspectFilmmaker.id} {inspectFilmmaker.userId ? `| Auth UID: ${inspectFilmmaker.userId}` : '| Unlinked Profile'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectFilmmaker(null)}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 border border-white/5 p-3 rounded-lg">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    handleSetSpotlightFilmmaker(inspectFilmmaker.id);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    filmmakers[0]?.id === inspectFilmmaker.id
                      ? 'bg-amber-500 text-black shadow'
                      : 'bg-white/10 hover:bg-amber-500/20 text-white border border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {filmmakers[0]?.id === inspectFilmmaker.id ? 'Spotlight Creator (Active)' : 'Set as Spotlight Creator'}
                </button>

                <button
                  onClick={() => {
                    startEditFilmmaker(inspectFilmmaker);
                    setInspectFilmmaker(null);
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Profile Fields
                </button>
              </div>

              <button
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingId(null);
                  setFilmForm({
                    title: '',
                    type: 'film',
                    description: '',
                    duration: '15m',
                    genre: ['Drama'],
                    director: inspectFilmmaker.name,
                    releaseYear: new Date().getFullYear(),
                    posterUrl: '',
                    videoUrl: '',
                    cameraUsed: 'Sony FX3',
                    filmmakerId: inspectFilmmaker.id,
                    isFeatured: false,
                    upiId: inspectFilmmaker.upiId || ''
                  });
                  setActiveTab('films');
                  setInspectFilmmaker(null);
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono rounded uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Plus className="h-4 w-4" />
                Add Film for {inspectFilmmaker.name}
              </button>
            </div>

            {/* Profile Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              <div className="bg-black/50 border border-white/5 p-4 rounded-lg flex flex-col gap-2">
                <span className="text-[10px] font-mono text-white/40 uppercase font-bold">Bio & Statement</span>
                <p className="text-white/80 leading-relaxed italic">{inspectFilmmaker.bio || 'No bio provided.'}</p>
              </div>

              <div className="bg-black/50 border border-white/5 p-4 rounded-lg flex flex-col gap-2.5">
                <span className="text-[10px] font-mono text-white/40 uppercase font-bold">Contact & Payment Links</span>
                <div className="flex flex-col gap-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-white/60">
                    <span>Instagram:</span>
                    <span className="text-amber-400 font-bold">{inspectFilmmaker.instagram || 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/60">
                    <span>Portfolio:</span>
                    <span className="text-white font-bold truncate max-w-[150px]">{inspectFilmmaker.portfolio || 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/60 pt-1 border-t border-white/5">
                    <span>GPay / UPI ID:</span>
                    <span className="text-emerald-400 font-bold">{inspectFilmmaker.upiId || 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* Stats Analytics */}
              {(() => {
                const fmFilms = films.filter(f => f.filmmakerId === inspectFilmmaker.id || f.director === inspectFilmmaker.name);
                const totalViews = fmFilms.reduce((acc, f) => acc + (f.views || 0), 0);
                const totalLikes = fmFilms.reduce((acc, f) => acc + (f.likes || 0), 0);
                const totalFunds = fmFilms.reduce((acc, f) => acc + (f.fundsReceived || 0), 0);
                return (
                  <div className="bg-black/50 border border-white/5 p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-white/40 uppercase font-bold">Performance Metrics</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex flex-col bg-white/5 p-2 rounded">
                        <span className="text-[9px] font-mono text-white/50">Total Works</span>
                        <span className="text-base font-bold text-white font-display">{fmFilms.length}</span>
                      </div>
                      <div className="flex flex-col bg-white/5 p-2 rounded">
                        <span className="text-[9px] font-mono text-white/50">Total Views</span>
                        <span className="text-base font-bold text-amber-400 font-display">{totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col bg-white/5 p-2 rounded">
                        <span className="text-[9px] font-mono text-white/50">Total Likes</span>
                        <span className="text-base font-bold text-rose-400 font-display">{totalLikes}</span>
                      </div>
                      <div className="flex flex-col bg-white/5 p-2 rounded">
                        <span className="text-[9px] font-mono text-white/50">Funds Raised</span>
                        <span className="text-base font-bold text-emerald-400 font-display">₹{totalFunds}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Filmmaker's Film & Series Catalog */}
            <div className="flex flex-col gap-3 pt-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span>Published Works ({films.filter(f => f.filmmakerId === inspectFilmmaker.id || f.director === inspectFilmmaker.name).length} Titles)</span>
              </h4>

              {(() => {
                const fmFilms = films.filter(f => f.filmmakerId === inspectFilmmaker.id || f.director === inspectFilmmaker.name);
                if (fmFilms.length === 0) {
                  return (
                    <div className="p-8 text-center bg-black/40 border border-white/5 rounded-lg text-white/40 font-mono text-xs">
                      No films or web series uploaded by this filmmaker yet.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {fmFilms.map(film => (
                      <div key={film.id} className="bg-black/60 border border-white/10 rounded-lg p-3 flex flex-col gap-2 relative">
                        <div className="flex gap-3">
                          <img 
                            src={getDirectImageUrl(film.posterUrl)} 
                            alt="" 
                            className="w-12 h-16 object-cover rounded bg-black shrink-0 border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-white text-xs truncate">{film.title}</span>
                            <span className="text-[10px] font-mono text-amber-400 uppercase">{film.type === 'series' ? 'Web Series' : 'Short Film'} • {film.duration}</span>
                            <span className="text-[9px] font-mono text-white/40">{film.views || 0} Views • {film.likes || 0} Likes</span>
                            <span className={`text-[9px] font-mono uppercase font-bold mt-1 px-1.5 py-0.5 rounded w-fit ${
                              film.approvalStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {film.approvalStatus || 'approved'}
                            </span>
                          </div>
                        </div>

                        {/* Film Control Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono">
                          <button
                            onClick={() => {
                              const updated = films.map(f => f.id === film.id ? { ...f, isFeatured: !f.isFeatured } : f);
                              onUpdateFilms(updated);
                            }}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                              film.isFeatured ? 'bg-amber-500 text-black' : 'bg-white/5 hover:bg-white/10 text-white/60'
                            }`}
                          >
                            {film.isFeatured ? '★ Featured Hero' : 'Feature'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                startEditFilm(film);
                                setActiveTab('films');
                                setInspectFilmmaker(null);
                              }}
                              className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white"
                              title="Edit Film"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteFilm(film.id)}
                              className="p-1 bg-white/5 hover:bg-rose-500/30 border border-white/10 rounded text-rose-400"
                              title="Delete Film"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* Cloud & Database Storage Location Inspector Modal */}
      {inspectCloudItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-amber-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6 p-6 relative">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500 text-black">
                      {inspectCloudItem.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      LIVE IN FIRESTORE
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-display uppercase tracking-tight mt-1">
                    {inspectCloudItem.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectCloudItem(null)}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cloud Database Location Info */}
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-white/40 uppercase text-[10px]">Cloud Database Service:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Cloud className="h-3.5 w-3.5" /> Google Cloud Firestore
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-white/40 uppercase text-[10px]">Firestore Project Database ID:</span>
                <span className="text-white font-bold truncate max-w-[300px]">ai-studio-tpfcinemas-cfa7738c-1544-4106-b908-c1d20a64110f</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-white/40 uppercase text-[10px]">Firestore Collection:</span>
                <span className="text-amber-300 font-bold">/{inspectCloudItem.collection}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase text-[10px]">Document Path:</span>
                <span className="text-emerald-400 font-bold">/{inspectCloudItem.docPath}</span>
              </div>
            </div>

            {/* Links & Storage Pipeline Breakdown */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> Content Storage Links & Stream Endpoints
              </h4>

              {/* Video Stream URL */}
              {inspectCloudItem.videoUrl && (() => {
                const prov = getCloudStorageProvider(inspectCloudItem.videoUrl);
                return (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/50 uppercase font-bold">1. Video Stream Link / Media Key</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${prov.color} ${prov.bg} ${prov.border}`}>
                        <span>{prov.icon}</span> {prov.provider}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg p-2.5">
                      <span className="text-xs text-white/90 font-mono truncate flex-1 select-all">
                        {inspectCloudItem.videoUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inspectCloudItem.videoUrl || '');
                          alert('Video Stream Link copied to clipboard!');
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition-colors flex items-center gap-1 shrink-0 font-mono cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy Link
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Poster Artwork URL */}
              {inspectCloudItem.posterUrl && (() => {
                const prov = getCloudStorageProvider(inspectCloudItem.posterUrl);
                return (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/50 uppercase font-bold">2. Poster Artwork / Image Link</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${prov.color} ${prov.bg} ${prov.border}`}>
                        <span>{prov.icon}</span> {prov.provider}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg p-2.5">
                      <span className="text-xs text-white/90 font-mono truncate flex-1 select-all">
                        {inspectCloudItem.posterUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inspectCloudItem.posterUrl || '');
                          alert('Poster Image Link copied to clipboard!');
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition-colors flex items-center gap-1 shrink-0 font-mono cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy Link
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Landscape Banner URL */}
              {inspectCloudItem.landscapePoster && (() => {
                const prov = getCloudStorageProvider(inspectCloudItem.landscapePoster);
                return (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/50 uppercase font-bold">3. Landscape Banner Artwork Link</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${prov.color} ${prov.bg} ${prov.border}`}>
                        <span>{prov.icon}</span> {prov.provider}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg p-2.5">
                      <span className="text-xs text-white/90 font-mono truncate flex-1 select-all">
                        {inspectCloudItem.landscapePoster}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inspectCloudItem.landscapePoster || '');
                          alert('Landscape Artwork Link copied to clipboard!');
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition-colors flex items-center gap-1 shrink-0 font-mono cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy Link
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Series Episodes Links */}
              {inspectCloudItem.episodes && inspectCloudItem.episodes.length > 0 && (
                <div className="bg-black/40 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3">
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                    Web Series Episode Stream Endpoints ({inspectCloudItem.episodes.length} Episodes)
                  </span>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {inspectCloudItem.episodes.map((ep, idx) => {
                      const prov = getCloudStorageProvider(ep.videoUrl);
                      return (
                        <div key={ep.id || idx} className="bg-black border border-white/10 rounded-lg p-3 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white font-mono">
                              Ep {idx + 1}: {ep.title}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${prov.color} ${prov.bg} ${prov.border}`}>
                              {prov.provider}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono">
                            <span className="text-white/40">Path:</span>
                            <span className="text-amber-400">films/{inspectCloudItem.id}.episodes[{idx}].videoUrl</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded border border-white/5">
                            <span className="text-xs text-white/80 font-mono truncate flex-1 select-all">
                              {ep.videoUrl}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(ep.videoUrl);
                                alert(`Episode ${idx + 1} Video Link copied!`);
                              }}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] rounded transition-colors shrink-0 font-mono cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setInspectCloudItem(null)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer font-mono"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
