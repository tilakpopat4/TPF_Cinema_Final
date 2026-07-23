import React, { useState } from 'react';
import { 
  PlusCircle, Sparkles, AlertCircle, Coins, Heart, Eye, 
  User, Globe, Camera, ArrowLeft, CheckCircle, Clock, 
  HelpCircle, QrCode, Clipboard, ExternalLink, Settings, 
  Activity, ArrowUpRight, Check, Award, FileText, Download
} from 'lucide-react';
import { Film, Filmmaker, Tip } from '../types';
import { getDirectImageUrl } from '../lib/driveUtils';
import SubmissionModal from './SubmissionModal';
import CertificateModal from './CertificateModal';
import { getContentId, getThumbnailContentId, generateScreeningCertificatePDF } from '../lib/certificateGenerator';

interface FilmmakerStudioProps {
  currentUser: any;
  filmmakers: Filmmaker[];
  films: Film[];
  tips: Tip[];
  onRegisterFilmmaker: (formData: Omit<Filmmaker, 'id' | 'createdAt'>) => Promise<void>;
  onSubmitFilm: (newFilm: Omit<Film, 'id' | 'views' | 'likes' | 'reviews'>) => void;
  onBackToHome: () => void;
}

export default function FilmmakerStudio({
  currentUser,
  filmmakers,
  films,
  tips,
  onRegisterFilmmaker,
  onSubmitFilm,
  onBackToHome,
}: FilmmakerStudioProps) {
  // Find current user's filmmaker account
  const myProfile = filmmakers.find(
    fm => fm.userId === currentUser.uid || fm.id === currentUser.uid
  );

  // States for onboarding form
  const [name, setName] = useState(currentUser.displayName || '');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('India');
  const [role, setRole] = useState('Director / Screenwriter');
  const [upiId, setUpiId] = useState('');
  const [instagram, setInstagram] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

  // Tab State inside Dashboard
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-films' | 'profile-settings'>('dashboard');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCertFilm, setSelectedCertFilm] = useState<Film | null>(null);

  // Filter films submitted by this filmmaker
  const myFilms = films.filter(
    f => f.submittedByUid === currentUser.uid || (myProfile && f.filmmakerId === myProfile.id)
  );

  // Stats computation
  const totalViews = myFilms.reduce((acc, f) => acc + (f.views || 0), 0);
  const totalLikes = myFilms.reduce((acc, f) => acc + (f.likes || 0), 0);
  const totalFunds = myFilms.reduce((acc, f) => acc + (f.fundsReceived || 0), 0);

  // Filter tips sent to my films
  const myTips = tips.filter(tip => {
    if (myProfile && tip.filmmakerId === myProfile.id) return true;
    return myFilms.some(f => f.id === tip.filmId);
  }).sort((a, b) => b.createdAt - a.createdAt);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError('');

    if (!name.trim()) {
      setOnboardingError('Please provide your name or professional title.');
      return;
    }
    if (!bio.trim() || bio.length < 15) {
      setOnboardingError('Please provide a short filmmaker biography (minimum 15 characters).');
      return;
    }
    if (!upiId.trim() || !upiId.includes('@')) {
      setOnboardingError('Please provide a valid Google Pay UPI ID (must contain @) so viewers can support your work.');
      return;
    }

    setIsOnboardingSubmitting(true);
    try {
      await onRegisterFilmmaker({
        name: name.trim(),
        avatar: currentUser.photoURL || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&h=200&q=80',
        bio: bio.trim(),
        country: country.trim(),
        role: role.trim(),
        instagram: instagram.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
        userId: currentUser.uid
      });
    } catch (err: any) {
      setOnboardingError(err.message || 'Error creating profile.');
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#F5F5F7] font-sans">
      
      {/* Upper Navigation/Breadcrumb Banner */}
      <div className="bg-[#121214] border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-amber-500" />
          Back to Theater Catalog
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
            Filmmaker Portal
          </span>
        </div>
      </div>

      {!myProfile ? (
        /* Onboarding Stage */
        <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center mb-1">
                  <Camera className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-mono font-bold uppercase tracking-wider text-white">Create Filmmaker Account</h2>
                <p className="text-xs text-white/50 leading-relaxed font-sans">
                  To screen your films, submit series, track live impressions, and receive direct crowd support from our community, establish your verified filmmaker account profile.
                </p>
              </div>

              {onboardingError && (
                <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded text-xs flex items-center gap-2 font-mono uppercase tracking-tight">
                  <AlertCircle className="h-4 w-4" />
                  <span>{onboardingError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5 font-sans">
                {/* Director Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    Professional Director / Screen Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Christopher Nolan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:border-amber-500 focus:outline-none focus:bg-white/[0.07] transition-all text-white placeholder-white/20"
                  />
                </div>

                {/* Primary Role & Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                      Creative Role / Occupation
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Director & Cinematographer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:border-amber-500 focus:outline-none text-white placeholder-white/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                      Country of Origin
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. India"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:border-amber-500 focus:outline-none text-white placeholder-white/20"
                    />
                  </div>
                </div>

                {/* Direct GPay UPI ID */}
                <div className="flex flex-col gap-1.5 bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg">
                  <label className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
                    Direct UPI ID (Required for Google Pay Support)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sarahchen@okaxis"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-black/60 border border-amber-500/30 rounded px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none placeholder-white/15 font-mono"
                  />
                  <p className="text-[10px] text-white/40 leading-relaxed mt-1">
                    Enter the UPI ID linked to your Google Pay app profile. Viewers can support your screenings directly with no platform cuts. We construct instant QR codes directly using your ID.
                  </p>
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    Short Biography
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Briefly introduce your artistic journey, production gear of choice, and style..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:border-amber-500 focus:outline-none text-white placeholder-white/20 resize-none"
                  />
                </div>

                {/* Instagram & Portfolio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                      Instagram Handle (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. nolan_visuals"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:border-amber-500 focus:outline-none text-white placeholder-white/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                      Portfolio / Vimeo URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://vimeo.com/yourportfolio"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:border-amber-500 focus:outline-none text-white placeholder-white/20"
                    />
                  </div>
                </div>

                {/* Onboarding Submit CTA */}
                <button
                  type="submit"
                  disabled={isOnboardingSubmitting}
                  className="mt-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-white/5 disabled:text-white/20 text-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/5 font-mono"
                >
                  {isOnboardingSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Establish Account</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Filmmaker Dashboard */
        <div className="max-w-7xl mx-auto px-6 py-8 md:px-12 flex flex-col gap-8">
          
          {/* Filmmaker Bio Hero */}
          <div className="bg-[#0c0c0e] border border-white/5 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center font-mono font-bold text-xl uppercase shrink-0">
                {myProfile.name ? myProfile.name[0] : 'F'}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-mono font-bold uppercase text-white tracking-wide">{myProfile.name}</h1>
                  <span className="text-[8px] font-sans font-extrabold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-500/20">
                    {myProfile.role}
                  </span>
                </div>
                <p className="text-xs text-white/50 max-w-xl font-sans leading-relaxed">{myProfile.bio}</p>
                <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono mt-1 uppercase">
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-amber-500/60" /> {myProfile.country}</span>
                  <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-amber-500/60" /> GPay ID: <strong className="text-white">{myProfile.upiId}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-widest text-[#050505] bg-amber-500 hover:bg-amber-400 active:scale-[0.97] transition-all cursor-pointer shadow-lg shadow-amber-500/10 font-mono"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Submit Film/Series</span>
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-1 font-mono">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-white/45 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
              Stats & Attraction
            </button>
            <button
              onClick={() => setActiveTab('my-films')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'my-films'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-white/45 hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
              Submission Approvals ({myFilms.length})
            </button>
          </div>

          {/* TAB 1: Stats & Attraction */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Stat Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#0c0c0e] border border-white/5 rounded-xl p-6 flex items-center justify-between shadow-md">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Total GPay Support</span>
                    <span className="text-2xl font-mono font-bold text-amber-500">₹{totalFunds.toLocaleString()}</span>
                  </div>
                  <div className="h-10 w-10 bg-amber-500/5 text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/10">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-[#0c0c0e] border border-white/5 rounded-xl p-6 flex items-center justify-between shadow-md">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Audience Impressions</span>
                    <span className="text-2xl font-mono font-bold text-[#F5F5F7]">{totalViews} views</span>
                  </div>
                  <div className="h-10 w-10 bg-white/5 text-white/70 rounded-lg flex items-center justify-center border border-white/10">
                    <Eye className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-[#0c0c0e] border border-white/5 rounded-xl p-6 flex items-center justify-between shadow-md">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Patron Appreciation</span>
                    <span className="text-2xl font-mono font-bold text-rose-500">{totalLikes} likes</span>
                  </div>
                  <div className="h-10 w-10 bg-rose-500/5 text-rose-500 rounded-lg flex items-center justify-center border border-rose-500/10">
                    <Heart className="h-5 w-5 fill-current" />
                  </div>
                </div>
              </div>

              {/* Tips & Transactions History */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: Sponsorship Logs */}
                <div className="lg:col-span-2 bg-[#0c0c0e] border border-white/5 rounded-xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <h3 className="text-xs font-mono font-bold uppercase text-white tracking-widest flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-amber-500" />
                      Recent GPay Sponsorship (₹)
                    </h3>
                    <span className="text-[10px] font-mono text-white/40">{myTips.length} donations</span>
                  </div>

                  {myTips.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                      <HelpCircle className="h-8 w-8 text-white/20 animate-pulse" />
                      <p className="text-xs text-white/40 font-mono max-w-xs">
                        No micro-patron transactions recorded yet. Once viewers scan your GPay QR code, their sponsorships will reflect here.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                      {myTips.map((tip) => (
                        <div key={tip.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-lg flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold font-mono">
                              {tip.patronName[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-white">{tip.patronName}</span>
                              <span className="text-[9px] text-white/40 font-mono">Film: {tip.filmTitle}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end text-right">
                            <span className="text-xs font-mono font-extrabold text-amber-500">+₹{tip.amountINR}</span>
                            <span className="text-[8px] text-white/30 font-mono">
                              {new Date(tip.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side: Insights card */}
                <div className="bg-[#0c0c0e] border border-white/5 rounded-xl p-6 flex flex-col gap-4 justify-between h-full">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-mono font-bold uppercase text-white tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Director's Insight
                    </h3>
                    <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                      Our platform ensures <strong className="text-white">100% direct viewer funding</strong>. TPF Cinemas doesn't deduct any fees or transaction cuts. GPay payments go directly through peer-to-peer UPI routing.
                    </p>
                    <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                      Keep engaging your viewers inside the comments section, respond to reviews, and promote your Google Pay link in your social bio handles to gain further attraction.
                    </p>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-lg text-center mt-2 flex flex-col gap-1">
                    <span className="text-[8px] text-white/40 uppercase tracking-wider font-mono">Live Attraction Score</span>
                    <span className="text-xl font-mono font-bold text-amber-500">
                      {totalViews ? Math.round((totalLikes / totalViews) * 100) : 0}% 
                    </span>
                    <span className="text-[9px] text-white/40 font-sans">Likes-to-Views ratio</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Submission Approvals */}
          {activeTab === 'my-films' && (
            <div className="bg-[#0c0c0e] border border-white/5 rounded-xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-xs font-mono font-bold uppercase text-white tracking-widest">
                  Content Submission Tracker
                </h3>
                <span className="text-[10px] text-white/40 font-mono font-bold uppercase">{myFilms.length} projects total</span>
              </div>

              {myFilms.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-4">
                  <PlusCircle className="h-10 w-10 text-white/20 animate-pulse" />
                  <div className="max-w-md flex flex-col gap-1">
                    <h4 className="text-xs font-mono font-bold uppercase text-white">No film submissions yet</h4>
                    <p className="text-[11px] text-white/40 leading-relaxed font-sans">
                      Your catalog is currently empty. Click the button below to submit your first short film, documentary, or serialized cinematic project.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="mt-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-extrabold uppercase tracking-widest rounded transition-all cursor-pointer font-mono"
                  >
                    Screen New Work
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 uppercase text-[9px] tracking-widest font-mono">
                        <th className="py-3 px-4 font-normal">Project & TPF Identifiers</th>
                        <th className="py-3 px-4 font-normal">Format</th>
                        <th className="py-3 px-4 font-normal">Views</th>
                        <th className="py-3 px-4 font-normal">Likes</th>
                        <th className="py-3 px-4 font-normal text-right">Direct Funds</th>
                        <th className="py-3 px-4 text-center font-normal">Approval Status</th>
                        <th className="py-3 px-4 text-right font-normal">Rights Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {myFilms.map((film) => {
                        const status = film.approvalStatus || 'approved'; // Seeded films are approved
                        const contentId = getContentId(film);
                        const thumbId = getThumbnailContentId(film);
                        
                        return (
                          <tr key={film.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Title & Thumbnail & Identifiers */}
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={getDirectImageUrl(film.posterUrl)}
                                alt={film.title}
                                className="w-10 h-14 object-cover rounded-md border border-white/10 shrink-0 shadow-md"
                                style={{ objectPosition: `center ${film.posterPositionY ?? 50}%` }}
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold text-white text-xs">{film.title}</span>
                                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px]">
                                  <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                                    {contentId}
                                  </span>
                                  <span className="bg-white/5 text-white/50 border border-white/10 px-1.5 py-0.5 rounded">
                                    Thumb: {thumbId}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Format */}
                            <td className="py-3 px-4 uppercase text-[10px] font-mono text-white/70">
                              {film.type}
                            </td>

                            {/* Views */}
                            <td className="py-3 px-4 font-mono text-white/80">
                              {film.views || 0}
                            </td>

                            {/* Likes */}
                            <td className="py-3 px-4 font-mono text-white/80">
                              {film.likes || 0}
                            </td>

                            {/* Funds Received */}
                            <td className="py-3 px-4 font-mono text-right text-amber-500 font-bold">
                              ₹{(film.fundsReceived || 0).toLocaleString()}
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 px-4 text-center">
                              {status === 'approved' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                  <CheckCircle className="h-3 w-3" />
                                  Live & Approved
                                </span>
                              )}
                              {status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider animate-pulse">
                                  <Clock className="h-3 w-3" />
                                  Pending Review
                                </span>
                              )}
                              {status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                  <AlertCircle className="h-3 w-3" />
                                  Rejected
                                </span>
                              )}
                            </td>

                            {/* Certificate Download CTA */}
                            <td className="py-3 px-4 text-right">
                              {status === 'approved' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCertFilm(film)}
                                    className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                    title="Preview Rights Certificate"
                                  >
                                    <Award className="h-3 w-3 text-amber-400" />
                                    <span>Certificate</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => generateScreeningCertificatePDF(film, myProfile)}
                                    className="p-1.5 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white rounded border border-white/10 transition-all cursor-pointer"
                                    title="Download PDF Certificate Directly"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] text-white/30 font-mono italic">
                                  Available on approval
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Certificate Modal */}
      {selectedCertFilm && (
        <CertificateModal
          film={selectedCertFilm}
          filmmaker={myProfile}
          onClose={() => setSelectedCertFilm(null)}
        />
      )}

      {/* Embedded Submission modal inside the dashboard */}
      {showSubmitModal && (
        <SubmissionModal
          onClose={() => setShowSubmitModal(false)}
          prefilledUpiId={myProfile?.upiId}
          prefilledDirector={myProfile?.name}
          onSubmit={(formData) => {
            if (myProfile) {
              onSubmitFilm({
                ...formData,
                filmmakerId: myProfile.id,
                director: myProfile.name,
                upiId: myProfile.upiId,
                submittedByUid: currentUser.uid,
                approvalStatus: 'pending', // Starts as pending!
                fundsReceived: 0
              });
            } else {
              onSubmitFilm(formData);
            }
            setShowSubmitModal(false);
          }}
        />
      )}

    </div>
  );
}
