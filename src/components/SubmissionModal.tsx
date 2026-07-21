import React, { useState, useEffect } from 'react';
import { X, Film, Tv, Video, Image, DollarSign, Camera, HelpCircle, Sparkles, Check, Mail, Copy, ExternalLink, FileText, Plus, Trash2 } from 'lucide-react';
import { Film as FilmType } from '../types';

interface SubmissionModalProps {
  onClose: () => void;
  onSubmit: (newFilm: Omit<FilmType, 'id' | 'views' | 'likes' | 'reviews'>) => void;
  prefilledUpiId?: string;
  prefilledDirector?: string;
}

// Preset visual themes for easy poster selection
const POSTER_PRESETS = [
  {
    name: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&h=900&q=80',
    tag: 'Sci-Fi / Thriller'
  },
  {
    name: 'Dreamscape Portal',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&h=900&q=80',
    tag: 'Fantasy / Magic'
  },
  {
    name: 'Cinematic Noir Portrait',
    url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=80',
    tag: 'Drama / Documentary'
  },
  {
    name: 'Atmospheric Forest',
    url: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=600&h=900&q=80',
    tag: 'Adventure / Mystery'
  },
  {
    name: 'Golden Hour Street',
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&h=900&q=80',
    tag: 'Experimental / Romance'
  }
];

// Preset stock videos to let them test immediately
const VIDEO_PRESETS = [
  {
    name: 'VFX / Action (Tears of Steel)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    name: 'Animation / Drama (Sintel)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  },
  {
    name: 'Surrealism / Indie (Elephant\'s Dream)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    name: 'Comedy / Family (Big Buck Bunny)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }
];

const AVAILABLE_GENRES = [
  'Sci-Fi', 'Drama', 'Documentary', 'Comedy', 'Thriller', 
  'Animation', 'Horror', 'Action', 'Fantasy', 'Experimental', 'Romance'
];

export default function SubmissionModal({ onClose, onSubmit, prefilledUpiId = '', prefilledDirector = '' }: SubmissionModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'film' | 'series'>('film');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [director, setDirector] = useState(prefilledDirector);
  const [upiId, setUpiId] = useState(prefilledUpiId);
  
  // Poster selection
  const [posterType, setPosterType] = useState<'preset' | 'custom'>('custom');
  const [selectedPosterIdx, setSelectedPosterIdx] = useState(0);
  const [customPosterUrl, setCustomPosterUrl] = useState('');

  // Video selection
  const [videoType, setVideoType] = useState<'preset' | 'custom'>('custom');
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);
  const [customVideoUrl, setCustomVideoUrl] = useState('');

  // Dynamic episodes state for web series
  const [episodes, setEpisodes] = useState<Array<{ id: string; title: string; duration: string; videoUrl: string }>>([
    { id: 'ep-1', title: 'Episode 1: Pilot', duration: '12m', videoUrl: '' }
  ]);

  useEffect(() => {
    if (type === 'series') {
      setDuration(`${episodes.length} ${episodes.length === 1 ? 'Episode' : 'Episodes'}`);
    }
  }, [episodes.length, type]);

  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);

  const emailAddress = "work.tilakpopatfilms@gmail.com";
  const emailSubject = "[TPF Submission] Project Title - Director Name";
  const emailBody = `Dear TPF Cinemas Curation Team,

I would like to submit my project for your official OTT catalog review.

--- PROJECT SPECIFICATIONS ---
• Title: [Your Project Title]
• Director: [Director Name]
• Format: [Short Film / Web Series / Documentary / Feature]
• Genre(s): [e.g. Drama, Sci-Fi, Thriller]
• Runtime: [e.g. 15 minutes / 5 episodes]
• Production Gear: [e.g. Sony A7SIII, iPhone, 16mm]

--- SCREENER & MEDIA LINKS ---
• Direct Screener Link: [Vimeo/YouTube/Drive URL & Passwords]
• Direct Poster Artwork Link: [Direct URL to image file]

--- SYNOPSIS & STATEMENT ---
[Provide a 100-250 word synopsis and director's statement here.]

Best Regards,
[Your Name / Production Company]
[Contact Email & Phone]`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleGenreToggle = (g: string) => {
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter(x => x !== g));
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFormError('Please enter a film title.');
      return;
    }
    if (!description.trim() || description.length < 20) {
      setFormError('Please write a decent synopsis (minimum 20 characters).');
      return;
    }
    if (!duration.trim()) {
      setFormError('Please specify runtime duration or episode count.');
      return;
    }
    if (selectedGenres.length === 0) {
      setFormError('Please pick at least one genre tag.');
      return;
    }
    if (!director.trim()) {
      setFormError('Director name is required.');
      return;
    }
    if (!upiId.trim()) {
      setFormError('Your Google Pay / UPI ID is required so viewers can support you directly.');
      return;
    }

    if (type === 'series') {
      if (episodes.length === 0) {
        setFormError('Please add at least one episode for your series.');
        return;
      }
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        if (!ep.title.trim()) {
          setFormError(`Please enter a title for Episode ${i + 1}.`);
          return;
        }
        if (!ep.duration.trim()) {
          setFormError(`Please enter a duration for Episode ${i + 1}.`);
          return;
        }
        if (!ep.videoUrl.trim() || !ep.videoUrl.startsWith('http')) {
          setFormError(`Please enter a valid video stream link (starting with http) for Episode ${i + 1}.`);
          return;
        }
      }
    }

    const posterUrl = customPosterUrl.trim() || POSTER_PRESETS[0].url;
    const videoUrl = type === 'series' ? episodes[0].videoUrl.trim() : (customVideoUrl.trim() || VIDEO_PRESETS[0].url);

    onSubmit({
      title: title.trim(),
      type,
      description: description.trim(),
      duration: type === 'series' ? `${episodes.length} ${episodes.length === 1 ? 'Episode' : 'Episodes'}` : duration.trim(),
      genre: selectedGenres,
      director: director.trim(),
      releaseYear: new Date().getFullYear(),
      posterUrl,
      videoUrl,
      episodes: type === 'series' ? episodes.map(ep => ({ ...ep, title: ep.title.trim(), duration: ep.duration.trim(), videoUrl: ep.videoUrl.trim() })) : undefined,
      filmmakerId: `fm-${Math.random().toString(36).substr(2, 4)}`, // mock new id
      upiId: upiId.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-[#0c0c0e] border border-white/10 rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in-50 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0c0c0e] sticky top-0 z-10 font-sans">
          <div>
            <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-[#F5F5F7] flex items-center gap-2">
              <Video className="h-4 w-4 text-amber-500" /> SCREEN YOUR INDIE FILM / SERIES
            </h2>
            <p className="text-xs text-white/40 font-sans mt-0.5 uppercase tracking-wide">Zero screening fees. No audience walls. Retain 100% rights.</p>
          </div>
          <button 
            id="close-submission-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Fields container (Scrollable) */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
          
          {/* Google Pay / UPI Setup Section */}
          <div className="bg-[#0f0f13] border border-amber-500/30 rounded p-5 relative overflow-hidden flex flex-col gap-5 shadow-xl font-sans shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F7] flex items-center gap-1.5 font-display">
                  GOOGLE PAY & UPI SUPPORT SETUP
                </h4>
                <p className="text-[10px] text-white/40 font-sans mt-0.5 uppercase tracking-wide">
                  ENABLE DIRECT AUDIENCE PATRONAGE (0% platform fee)
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-sans">
              Set up direct filmmaker support. Enter your <span className="text-amber-500 font-bold">UPI ID</span> (e.g. Google Pay, PhonePe, Paytm). Viewers will see your UPI ID and a dynamically generated QR Code directly in the screening panel to support your film.
            </p>

            <div className="bg-black/50 border border-white/5 rounded p-4 flex flex-col md:flex-row gap-5 items-center justify-between">
              <div className="flex-1 w-full flex flex-col gap-2">
                <label className="block text-[9px] font-sans text-amber-500 uppercase tracking-widest font-bold">
                  Your Google Pay / UPI ID (Required)
                </label>
                <input
                  id="submit-upi-id-input"
                  type="text"
                  required
                  placeholder="e.g. sarahchen@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-3 py-2.5 rounded border border-amber-500/30 focus:border-amber-500 focus:outline-none focus:bg-white/5 transition-all font-sans placeholder-white/20"
                />
                <span className="text-[9px] text-white/30 font-sans leading-tight">
                  Verify with your Google Pay, PhonePe, or BHIM app profile settings.
                </span>
              </div>

              {upiId.trim() ? (
                <div className="flex flex-col items-center gap-2 bg-white/[0.02] border border-white/5 p-3 rounded shrink-0 w-full md:w-auto text-center">
                  <span className="text-[8px] font-sans text-amber-500 uppercase tracking-wider font-bold">
                    Live Payment QR Preview
                  </span>
                  <div className="p-2 bg-white rounded-md flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        `upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(
                          director.trim() || 'TPF Filmmaker'
                        )}&tn=Sponsoring%20${encodeURIComponent(title.trim() || 'Cinema')}&cu=INR`
                      )}`}
                      alt="UPI QR Code"
                      className="w-24 h-24"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[9px] text-[#F5F5F7] font-mono break-all max-w-[150px]">
                    {upiId.trim()}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 p-4 border border-dashed border-white/10 rounded shrink-0 w-full md:w-[170px] h-[170px] text-center text-white/35">
                  <div className="h-8 w-8 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-bold">Waiting for UPI ID</span>
                  <p className="text-[8px] leading-tight">Enter your ID to preview the dynamic payment QR</p>
                </div>
              )}
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded text-xs font-sans uppercase tracking-tight shrink-0">
              {formError}
            </div>
          )}

          {/* Section 1: Core Details */}
          <div className="flex flex-col gap-4 shrink-0">
            <h3 className="text-[10px] font-sans font-bold tracking-widest text-white/40 uppercase border-b border-white/5 pb-1">
              1. Title & Format
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-sans text-white/40 uppercase tracking-widest mb-1.5">Project Title</label>
                <input
                  id="submit-title-input"
                  type="text"
                  required
                  placeholder="e.g. Echoes of Silence"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-3 py-2 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[9px] font-sans text-white/40 uppercase tracking-widest mb-1.5">Category</label>
                <div className="flex bg-white/5 p-1 rounded border border-white/10">
                  <button
                    id="submit-type-film-btn"
                    type="button"
                    onClick={() => setType('film')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-widest ${
                      type === 'film' ? 'bg-white/10 text-amber-500' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Film className="h-3 w-3" /> Film
                  </button>
                  <button
                    id="submit-type-series-btn"
                    type="button"
                    onClick={() => setType('series')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-widest ${
                      type === 'series' ? 'bg-white/10 text-amber-500' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Tv className="h-3 w-3" /> Series
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-sans text-white/40 uppercase tracking-widest mb-1.5">
                  Runtime / Length
                </label>
                <input
                  id="submit-duration-input"
                  type="text"
                  required
                  disabled={type === 'series'}
                  placeholder={type === 'series' ? "Calculated from episodes..." : "e.g. 15m 30s"}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={`w-full text-[#F5F5F7] text-xs px-3 py-2 rounded border focus:border-amber-500/50 focus:outline-none transition-all ${
                    type === 'series' 
                      ? 'bg-white/[0.02] border-white/5 text-white/40 cursor-not-allowed' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 focus:bg-white/5'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-sans text-white/40 uppercase tracking-widest mb-1.5">
                  Director Name
                </label>
                <input
                  id="submit-director-input"
                  type="text"
                  required
                  placeholder="e.g. Sarah Chen"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-3 py-2 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-sans text-white/40 uppercase tracking-widest mb-1.5">Synopsis / Storyline</label>
              <textarea
                id="submit-description-input"
                rows={3}
                required
                placeholder="Describe your film's concept, tone, and theme so readers get hooked..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs p-3 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Genre Selectors */}
            <div>
              <label className="block text-[9px] font-sans text-white/40 uppercase tracking-widest mb-2">Genres (Select all that apply)</label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_GENRES.map((g) => {
                  const isChecked = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGenreToggle(g)}
                      className={`text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1.5 rounded border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' 
                          : 'bg-black/45 text-white/40 border-white/5 hover:border-white/15 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Episode List Builder (Only for Web Series) */}
            {type === 'series' && (
              <div className="bg-white/[0.01] border border-white/5 rounded p-4 flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <h4 className="text-[10px] font-sans font-bold tracking-widest text-amber-500 uppercase flex items-center gap-1.5">
                      Series Episodes Creator
                    </h4>
                    <p className="text-[8px] text-white/30 font-sans tracking-widest uppercase mt-0.5">
                      Define titles, runtimes, and video stream URLs for each episode
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setEpisodes([
                        ...episodes,
                        {
                          id: `ep-${Date.now()}`,
                          title: `Episode ${episodes.length + 1}`,
                          duration: '10m',
                          videoUrl: ''
                        }
                      ]);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded text-[9px] font-sans font-bold uppercase tracking-widest transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Episode</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {episodes.map((ep, idx) => (
                    <div key={ep.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-black/40 border border-white/5 p-3 rounded relative">
                      <div className="md:col-span-5">
                        <label className="block text-[8px] font-sans text-white/40 uppercase tracking-widest mb-1">
                          Episode {idx + 1} Title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Episode 1: Pilot"
                          value={ep.title}
                          onChange={(e) => {
                            const newEps = [...episodes];
                            newEps[idx].title = e.target.value;
                            setEpisodes(newEps);
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-2.5 py-1.5 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all font-sans"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[8px] font-sans text-white/40 uppercase tracking-widest mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 10m"
                          value={ep.duration}
                          onChange={(e) => {
                            const newEps = [...episodes];
                            newEps[idx].duration = e.target.value;
                            setEpisodes(newEps);
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-2.5 py-1.5 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all font-sans"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-[8px] font-sans text-white/40 uppercase tracking-widest mb-1">
                          Video Stream URL (.mp4)
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="e.g. https://.../ep1.mp4"
                          value={ep.videoUrl}
                          onChange={(e) => {
                            const newEps = [...episodes];
                            newEps[idx].videoUrl = e.target.value;
                            setEpisodes(newEps);
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-2.5 py-1.5 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all font-sans"
                        />
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          disabled={episodes.length <= 1}
                          onClick={() => {
                            setEpisodes(episodes.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                          title="Delete Episode"
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

          {/* Section 2: Film Poster Art */}
          <div className="flex flex-col gap-4 shrink-0">
            <h3 className="text-[10px] font-sans font-bold tracking-widest text-white/40 uppercase border-b border-white/5 pb-1">
              2. Film Poster Art
            </h3>

            <div>
              <label className="block text-[9px] font-sans text-white/40 uppercase tracking-widest mb-1.5">Poster Image URL</label>
              <input
                id="submit-custom-poster-input"
                type="url"
                required
                placeholder="Paste a direct URL of your poster image (Unsplash, Imgur, etc.)"
                value={customPosterUrl}
                onChange={(e) => setCustomPosterUrl(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-3 py-2.5 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all font-sans"
              />
            </div>
          </div>

          {/* Section 3: Film Screening File / Stream Link */}
          {type === 'film' && (
            <div className="flex flex-col gap-4 shrink-0">
              <h3 className="text-[10px] font-sans font-bold tracking-widest text-white/40 uppercase border-b border-white/5 pb-1">
                3. Film Screening File / Stream Link
              </h3>

              <div>
                <label className="block text-[9px] font-sans text-white/40 uppercase tracking-widest mb-1.5">Direct Video Link (.mp4 / stream URL)</label>
                <input
                  id="submit-custom-video-input"
                  type="url"
                  required
                  placeholder="Paste direct .mp4 address (e.g., https://example.com/movie.mp4)"
                  value={customVideoUrl}
                  onChange={(e) => setCustomVideoUrl(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/10 text-[#F5F5F7] text-xs px-3 py-2.5 rounded border border-white/10 focus:border-amber-500/50 focus:outline-none focus:bg-white/5 transition-all font-sans"
                />
              </div>
            </div>
          )}

          {/* Submission footer */}
          <div className="mt-4 pt-6 border-t border-white/5 flex justify-end gap-3 sticky bottom-0 bg-[#0c0c0e] py-3 z-10 shrink-0">
            <button
              id="submit-cancel-footer-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-white/10 hover:bg-white/5 text-white/50 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
            >
              Back to Cinema
            </button>
            <button
              id="submit-confirm-footer-btn"
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded transition-all cursor-pointer shadow-lg shadow-amber-500/5 uppercase tracking-widest"
            >
              Launch Screening Room
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
