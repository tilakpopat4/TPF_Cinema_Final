import React, { useState, useEffect } from 'react';
import { initialFilms, mockFilmmakers } from './data/mockFilms';
import { Film, Review, UpcomingFilm, Filmmaker, Tip, ContinueWatchingItem } from './types';
import { getDirectImageUrl } from './lib/driveUtils';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import FeedbackSection from './components/FeedbackSection';
import SubmissionModal from './components/SubmissionModal';
import AboutManifesto from './components/AboutManifesto';
import TipJarModal from './components/TipJarModal';
import FilmmakerSpotlight from './components/FilmmakerSpotlight';
import FilmCard from './components/FilmCard';
import UpcomingMovies from './components/UpcomingMovies';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import IntroSplash from './components/IntroSplash';
import FilmmakerStudio from './components/FilmmakerStudio';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { hydrateMediaList, dehydrateMediaList, dehydrateMediaItem } from './lib/mediaStorage';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Sparkles, Heart, Info, Globe, Coins, Flame, Tv, 
  CheckCircle, Plus, Bookmark, BookmarkCheck, ListFilter, 
  Clapperboard, AlertCircle, ArrowLeft, Play, Star, User,
  TrendingUp, ChevronRight, Camera, RotateCcw, X, Clock
} from 'lucide-react';

const defaultUpcomingList: UpcomingFilm[] = [
  {
    id: 'up-1',
    title: 'Neon Samsara',
    director: 'Sarah Chen',
    expectedRelease: 'Winter 2026',
    genre: ['Cyberpunk', 'Philosophical'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&h=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'A mind-bending sci-fi exploration into cybernetic reincarnation and ancestral memory inside a digital neon hyper-city. Built with high-end Unreal Engine 5 backgrounds.'
  },
  {
    id: 'up-2',
    title: 'The Last Campfire',
    director: 'Marcus Kael',
    expectedRelease: 'Spring 2027',
    genre: ['Minimalist', 'Survival'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&h=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'An intimate survival docu-drama tracking a lonely modern writer trying to reconnect with nature in the depths of Germany\'s Black Forest during an unexpected winter blizzard.'
  },
  {
    id: 'up-3',
    title: 'Whispers of the Wind',
    director: 'Elena Rostova',
    expectedRelease: 'Late 2027',
    genre: ['Magical Realism', 'Visual Poem'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&h=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    description: 'A poetic arthouse short film capturing the silent dialogue between a 100-year-old oak tree and three generations of Czech farmers. Focuses on magical realism.'
  }
];

export default function App() {
  // --- States with sensible local/mock fallbacks for fast first paint ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(() => {
    // Show cinematic intro once per tab session
    return !sessionStorage.getItem('tpf_cinemas_intro_played');
  });

  const [films, setFilms] = useState<Film[]>(initialFilms);
  const [filmmakers, setFilmmakers] = useState<Filmmaker[]>(mockFilmmakers);
  const [upcomingFilms, setUpcomingFilms] = useState<UpcomingFilm[]>(defaultUpcomingList);
  const [tips, setTips] = useState<Tip[]>([]);

  const [selectedActiveFilm, setSelectedActiveFilm] = useState<Film | null>(null);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState<number>(0);
  const [viewState, setViewState] = useState<'home' | 'player' | 'admin' | 'filmmaker-studio'>('home');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'film' | 'series' | 'watchlist'>('all');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('All');

  // User-specific states (personal watchlist & liked films & continue watching synced to Firestore)
  const [likedFilms, setLikedFilms] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);

  // Modals & UI Toggles
  const [showSubmission, setShowSubmission] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);
  const [showTipJar, setShowTipJar] = useState(false);
  const [showFullFeaturedDesc, setShowFullFeaturedDesc] = useState(false);

  // Success alert states
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  // Set document title
  useEffect(() => {
    document.title = "TPF Cinemas | An OTT For Beginners";
  }, []);

  // --- Real-time Firestore synchronization & Seeding ---
  useEffect(() => {
    if (!currentUser || currentUser.email !== 'tilakpopat2007@gmail.com') return;
    const seedDatabase = async () => {
      try {
        // Seed filmmakers
        let filmmakerDocs;
        try {
          filmmakerDocs = await getDocs(collection(db, 'filmmakers'));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'filmmakers');
        }
        if (filmmakerDocs && filmmakerDocs.empty) {
          for (const fm of mockFilmmakers) {
            try {
              await setDoc(doc(db, 'filmmakers', fm.id), fm);
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `filmmakers/${fm.id}`);
            }
          }
        }

        // Seed films
        let filmDocs;
        try {
          filmDocs = await getDocs(collection(db, 'films'));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'films');
        }
        if (filmDocs && filmDocs.empty) {
          for (let i = 0; i < initialFilms.length; i++) {
            const film = initialFilms[i];
            const createdAt = Date.now() - (i * 1000); 
            try {
              await setDoc(doc(db, 'films', film.id), { ...film, createdAt });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `films/${film.id}`);
            }
          }
        }

        // Seed upcoming films
        let upcomingDocs;
        try {
          upcomingDocs = await getDocs(collection(db, 'upcoming_films'));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'upcoming_films');
        }
        if (upcomingDocs && upcomingDocs.empty) {
          for (const up of defaultUpcomingList) {
            try {
              await setDoc(doc(db, 'upcoming_films', up.id), up);
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `upcoming_films/${up.id}`);
            }
          }
        }
      } catch (error) {
        console.error('Error seeding database:', error);
      }
    };

    seedDatabase();
  }, [currentUser]);

  // Load local cached media state on initial mount
  useEffect(() => {
    const loadCachedMedia = async () => {
      try {
        const cachedFilms = localStorage.getItem('indiescreen_films_v1');
        if (cachedFilms) {
          const parsed = JSON.parse(cachedFilms);
          const hydrated = await hydrateMediaList(parsed);
          setFilms(hydrated);
        }
        const cachedFms = localStorage.getItem('indiescreen_filmmakers_v1');
        if (cachedFms) {
          const parsed = JSON.parse(cachedFms);
          const hydrated = await hydrateMediaList(parsed);
          setFilmmakers(hydrated);
        }
        const cachedUpcoming = localStorage.getItem('indiescreen_upcoming_v1');
        if (cachedUpcoming) {
          const parsed = JSON.parse(cachedUpcoming);
          const hydrated = await hydrateMediaList(parsed);
          setUpcomingFilms(hydrated);
        }
        const cachedCW = localStorage.getItem('tpf_continue_watching_v1');
        if (cachedCW) {
          try {
            setContinueWatching(JSON.parse(cachedCW));
          } catch (e) {
            console.error("Error parsing continue watching cache:", e);
          }
        }
      } catch (err) {
        console.error("Error loading cached local media:", err);
      }
    };
    loadCachedMedia();
  }, []);

  // Subscribe to Films real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'films'), async (snapshot) => {
      const loadedFilms: Film[] = [];
      snapshot.forEach((doc) => {
        loadedFilms.push(doc.data() as Film);
      });
      loadedFilms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const hydratedFilms = await hydrateMediaList(loadedFilms);
      setFilms(hydratedFilms);
      localStorage.setItem('indiescreen_films_v1', JSON.stringify(dehydrateMediaList(loadedFilms)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'films');
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to Filmmakers real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'filmmakers'), async (snapshot) => {
      const loadedFilmmakers: Filmmaker[] = [];
      snapshot.forEach((doc) => {
        loadedFilmmakers.push(doc.data() as Filmmaker);
      });
      loadedFilmmakers.sort((a, b) => a.id.localeCompare(b.id));
      const hydratedFms = await hydrateMediaList(loadedFilmmakers);
      setFilmmakers(hydratedFms);
      localStorage.setItem('indiescreen_filmmakers_v1', JSON.stringify(dehydrateMediaList(loadedFilmmakers)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'filmmakers');
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to Upcoming Films real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'upcoming_films'), async (snapshot) => {
      const loadedUpcoming: UpcomingFilm[] = [];
      snapshot.forEach((doc) => {
        loadedUpcoming.push(doc.data() as UpcomingFilm);
      });
      loadedUpcoming.sort((a, b) => a.id.localeCompare(b.id));
      const hydratedUpcoming = await hydrateMediaList(loadedUpcoming);
      setUpcomingFilms(hydratedUpcoming);
      localStorage.setItem('indiescreen_upcoming_v1', JSON.stringify(dehydrateMediaList(loadedUpcoming)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'upcoming_films');
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to Tips real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'tips'), (snapshot) => {
      const loadedTips: Tip[] = [];
      snapshot.forEach((doc) => {
        loadedTips.push(doc.data() as Tip);
      });
      loadedTips.sort((a, b) => b.createdAt - a.createdAt);
      setTips(loadedTips);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tips');
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Handle URL change routing
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        if (currentUser?.email === 'tilakpopat2007@gmail.com') {
          setViewState('admin');
        } else {
          // Non-admin users are prevented from entering the admin state
          window.history.replaceState(null, '', '/');
          setViewState('home');
        }
      } else if (hash === '#/studio' || hash === '#studio') {
        if (currentUser) {
          setViewState('filmmaker-studio');
        } else {
          window.history.replaceState(null, '', '/');
          setViewState('home');
        }
      } else {
        setViewState(current => (current === 'admin' || current === 'filmmaker-studio') ? 'home' : current);
      }
    };
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [currentUser]);

  // --- Firebase Auth Subscription ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Subscribe to User's private watchlist & likedFilms in Firestore ---
  useEffect(() => {
    if (!currentUser) {
      setWatchlist([]);
      setLikedFilms([]);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWatchlist(data.watchlist || []);
        setLikedFilms(data.likedFilms || []);
        if (data.continueWatching && Array.isArray(data.continueWatching)) {
          setContinueWatching(data.continueWatching);
          localStorage.setItem('tpf_continue_watching_v1', JSON.stringify(data.continueWatching));
        }
      } else {
        setDoc(userDocRef, { watchlist: [], likedFilms: [] }, { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
        setWatchlist([]);
        setLikedFilms([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- Default active film on first snapshot load ---
  useEffect(() => {
    if (films.length > 0 && !selectedActiveFilm) {
      const featured = films.find(f => f.isFeatured) || films[0];
      setSelectedActiveFilm(featured);
    }
  }, [films, selectedActiveFilm]);

  // Keep activeFilm reference pointing to the live reactive database copy
  const activeFilm = selectedActiveFilm ? (films.find(f => f.id === selectedActiveFilm.id) || selectedActiveFilm) : null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // --- Admin Save helpers (Updates Firebase and triggers live snapshot propagation) ---
  const saveFilmsToStorage = async (updatedFilms: Film[]) => {
    try {
      const hydrated = await hydrateMediaList(updatedFilms);
      setFilms(hydrated);
      localStorage.setItem('indiescreen_films_v1', JSON.stringify(dehydrateMediaList(updatedFilms)));

      const currentFilmsInDb = [...films];
      const updatedIds = new Set(updatedFilms.map(f => f.id));
      
      // Delete removed documents
      for (const existingFilm of currentFilmsInDb) {
        if (!updatedIds.has(existingFilm.id)) {
          try {
            await deleteDoc(doc(db, 'films', existingFilm.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `films/${existingFilm.id}`);
          }
        }
      }

      // Add or update documents
      for (const film of updatedFilms) {
        const existing = currentFilmsInDb.find(f => f.id === film.id);
        const createdAt = existing?.createdAt || film.createdAt || Date.now();
        const dehydrated = dehydrateMediaItem(film);
        try {
          await setDoc(doc(db, 'films', film.id), { ...dehydrated, createdAt });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `films/${film.id}`);
        }
      }
    } catch (err) {
      console.error("Error saving films:", err);
    }
  };

  const saveFilmmakersToStorage = async (updatedFilmmakers: Filmmaker[]) => {
    try {
      const hydrated = await hydrateMediaList(updatedFilmmakers);
      setFilmmakers(hydrated);
      localStorage.setItem('indiescreen_filmmakers_v1', JSON.stringify(dehydrateMediaList(updatedFilmmakers)));

      const currentFilmmakersInDb = [...filmmakers];
      const updatedIds = new Set(updatedFilmmakers.map(f => f.id));

      // Delete removed filmmakers
      for (const existingFm of currentFilmmakersInDb) {
        if (!updatedIds.has(existingFm.id)) {
          try {
            await deleteDoc(doc(db, 'filmmakers', existingFm.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `filmmakers/${existingFm.id}`);
          }
        }
      }

      // Add or update filmmakers
      for (const fm of updatedFilmmakers) {
        const dehydrated = dehydrateMediaItem(fm);
        try {
          await setDoc(doc(db, 'filmmakers', fm.id), dehydrated);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `filmmakers/${fm.id}`);
        }
      }
    } catch (err) {
      console.error("Error saving filmmakers:", err);
    }
  };

  const saveUpcomingToStorage = async (updatedUpcoming: UpcomingFilm[]) => {
    try {
      const hydrated = await hydrateMediaList(updatedUpcoming);
      setUpcomingFilms(hydrated);
      localStorage.setItem('indiescreen_upcoming_v1', JSON.stringify(dehydrateMediaList(updatedUpcoming)));

      const currentUpcomingInDb = [...upcomingFilms];
      const updatedIds = new Set(updatedUpcoming.map(u => u.id));

      // Delete removed upcoming entries
      for (const existingUp of currentUpcomingInDb) {
        if (!updatedIds.has(existingUp.id)) {
          try {
            await deleteDoc(doc(db, 'upcoming_films', existingUp.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `upcoming_films/${existingUp.id}`);
          }
        }
      }

      // Add or update upcoming trailers
      for (const up of updatedUpcoming) {
        const dehydrated = dehydrateMediaItem(up);
        try {
          await setDoc(doc(db, 'upcoming_films', up.id), dehydrated);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `upcoming_films/${up.id}`);
        }
      }
    } catch (err) {
      console.error("Error saving upcoming list:", err);
    }
  };

  // --- Handlers ---
  const handleLikeToggle = async (filmId: string) => {
    if (!currentUser) return;
    try {
      const isCurrentlyLiked = likedFilms.includes(filmId);
      const nextLikes = isCurrentlyLiked
        ? likedFilms.filter(id => id !== filmId)
        : [...likedFilms, filmId];

      // Update user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        await setDoc(userDocRef, { likedFilms: nextLikes }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
      }

      // Update film likes metric
      const filmDocRef = doc(db, 'films', filmId);
      let filmSnap;
      try {
        filmSnap = await getDoc(filmDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `films/${filmId}`);
      }
      if (filmSnap && filmSnap.exists()) {
        const filmData = filmSnap.data() as Film;
        const currentLikesCount = filmData.likes || 0;
        const nextLikesCount = Math.max(0, currentLikesCount + (isCurrentlyLiked ? -1 : 1));
        try {
          await updateDoc(filmDocRef, { likes: nextLikesCount });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `films/${filmId}`);
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleWatchlistToggle = async (filmId: string) => {
    if (!currentUser) return;
    try {
      const isCurrentlyInWatchlist = watchlist.includes(filmId);
      const nextWatchlist = isCurrentlyInWatchlist
        ? watchlist.filter(id => id !== filmId)
        : [...watchlist, filmId];

      // Update user watchlist document in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        await setDoc(userDocRef, { watchlist: nextWatchlist }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
      }
    } catch (err) {
      console.error("Error toggling watchlist:", err);
    }
  };

  const handleAddReview = async (filmId: string, reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    try {
      const newReview: Review = {
        ...reviewData,
        id: `rev-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString().split('T')[0]
      };

      const filmDocRef = doc(db, 'films', filmId);
      let filmSnap;
      try {
        filmSnap = await getDoc(filmDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `films/${filmId}`);
      }
      if (filmSnap && filmSnap.exists()) {
        const filmData = filmSnap.data() as Film;
        const currentReviews = filmData.reviews || [];
        try {
          await updateDoc(filmDocRef, {
            reviews: [newReview, ...currentReviews]
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `films/${filmId}`);
        }
      }
    } catch (err) {
      console.error("Error adding review:", err);
    }
  };

  const handleRegisterFilmmaker = async (formData: Omit<Filmmaker, 'id' | 'createdAt'>) => {
    try {
      const uid = currentUser?.uid;
      if (!uid) throw new Error("No authenticated user session found.");

      const newFilmmaker: Filmmaker = {
        ...formData,
        id: uid,
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'filmmakers', uid), newFilmmaker);
    } catch (err) {
      console.error("Error registering filmmaker:", err);
      throw err;
    }
  };

  const handleSponsor = async (film: Film, amountINR: number, patronName: string) => {
    try {
      const tipId = `tip-${Math.random().toString(36).substr(2, 5)}`;
      const newTip: Tip = {
        id: tipId,
        filmId: film.id,
        filmTitle: film.title,
        filmmakerId: film.filmmakerId,
        amountINR,
        patronName,
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'tips', tipId), newTip);

      const filmDocRef = doc(db, 'films', film.id);
      const currentFunds = film.fundsReceived || 0;
      await updateDoc(filmDocRef, {
        fundsReceived: currentFunds + amountINR
      });
    } catch (err) {
      console.error("Error processing sponsorship donation:", err);
      throw err;
    }
  };

  const handleNewSubmission = async (newFilmData: Omit<Film, 'id' | 'views' | 'likes' | 'reviews'>) => {
    try {
      const newId = `film-${Math.random().toString(36).substr(2, 5)}`;
      const newFilm: Film = {
        ...newFilmData,
        id: newId,
        views: Math.floor(Math.random() * 20) + 1,
        likes: 1,
        reviews: [],
        createdAt: Date.now(),
        submittedByUid: currentUser?.uid || '',
        approvalStatus: 'pending',
        fundsReceived: 0
      };

      try {
        await setDoc(doc(db, 'films', newId), newFilm);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `films/${newId}`);
      }

      setShowSubmitSuccess(true);
      setTimeout(() => {
        setShowSubmitSuccess(false);
      }, 5000);

      if (viewState !== 'filmmaker-studio') {
        setSelectedActiveFilm(newFilm);
        setViewState('player');

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error("Error submitting film:", err);
    }
  };

  const recordFilmView = (filmId: string, episodeIndex: number = 0) => {
    setContinueWatching(prev => {
      const newItem: ContinueWatchingItem = {
        filmId,
        episodeIndex,
        timestamp: Date.now()
      };
      const filtered = prev.filter(item => item.filmId !== filmId);
      const updated = [newItem, ...filtered].slice(0, 5);
      localStorage.setItem('tpf_continue_watching_v1', JSON.stringify(updated));

      if (currentUser) {
        setDoc(doc(db, 'users', currentUser.uid), { continueWatching: updated }, { merge: true })
          .catch(err => console.error("Error saving continue watching to Firestore:", err));
      }
      return updated;
    });
  };

  const handleRemoveFromContinueWatching = (filmId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setContinueWatching(prev => {
      const updated = prev.filter(item => item.filmId !== filmId);
      localStorage.setItem('tpf_continue_watching_v1', JSON.stringify(updated));

      if (currentUser) {
        setDoc(doc(db, 'users', currentUser.uid), { continueWatching: updated }, { merge: true })
          .catch(err => console.error("Error removing continue watching item from Firestore:", err));
      }
      return updated;
    });
  };

  const handleSelectFilm = async (film: Film, episodeIndex: number = 0) => {
    try {
      recordFilmView(film.id, episodeIndex);
      setSelectedActiveFilm(film);
      setSelectedEpisodeIndex(episodeIndex);
      setViewState('player');

      const filmDocRef = doc(db, 'films', film.id);
      let filmSnap;
      try {
        filmSnap = await getDoc(filmDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `films/${film.id}`);
      }
      if (filmSnap && filmSnap.exists()) {
        const filmData = filmSnap.data() as Film;
        const currentViews = filmData.views || 0;
        try {
          await updateDoc(filmDocRef, { views: currentViews + 1 });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `films/${film.id}`);
        }
      }

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error("Error selecting film:", err);
    }
  };

  // --- Filtering computations ---
  const approvedFilms = films.filter(f => !f.approvalStatus || f.approvalStatus === 'approved');

  const genresAvailable: string[] = ['All', ...(Array.from(new Set(approvedFilms.flatMap(f => f.genre))) as string[])];

  const filteredFilms = approvedFilms.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesType = true;
    if (activeType === 'film' || activeType === 'series') {
      matchesType = f.type === activeType;
    } else if (activeType === 'watchlist') {
      matchesType = watchlist.includes(f.id);
    }
    
    const matchesGenre = selectedGenreFilter === 'All' ? true : f.genre.includes(selectedGenreFilter);

    return matchesSearch && matchesType && matchesGenre;
  });

  const watchlistFilms = approvedFilms.filter(f => watchlist.includes(f.id));

  const continueWatchingFilms = continueWatching
    .map(cw => {
      const filmObj = films.find(f => f.id === cw.filmId);
      if (!filmObj) return null;
      return {
        film: filmObj,
        episodeIndex: cw.episodeIndex || 0,
        timestamp: cw.timestamp
      };
    })
    .filter((item): item is { film: Film; episodeIndex: number; timestamp: number } => item !== null);

  // --- Curated Categories for OTT Page ---
  const featuredFilm = approvedFilms.find(f => f.isFeatured) || approvedFilms[0] || activeFilm;
  
  const trendingFilms = [...approvedFilms].sort((a, b) => b.views - a.views);
  
  const topRatedFilms = [...approvedFilms].sort((a, b) => b.likes - a.likes);
  
  const guerillaFilms = approvedFilms.filter(f => {
    return f.type === 'film' && f.cameraUsed;
  });
  
  const seriesAndDocs = approvedFilms.filter(f => f.type === 'series' || f.genre.includes('Documentary'));

  const isFilterOrSearchActive = searchQuery.trim() !== '' || activeType !== 'all' || selectedGenreFilter !== 'All';

  // --- Auth Gate check ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex flex-col justify-center items-center font-sans select-none">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xs uppercase tracking-widest text-white/40 font-mono">Syncing Projection Booth...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  if (showIntro) {
    return (
      <IntroSplash
        onComplete={() => {
          setShowIntro(false);
          sessionStorage.setItem('tpf_cinemas_intro_played', 'true');
        }}
      />
    );
  }

  if (viewState === 'admin' && currentUser?.email === 'tilakpopat2007@gmail.com') {
    return (
      <div className="min-h-screen bg-[#2B2B2B] text-[#F5F5F7] flex flex-col font-sans selection:bg-amber-500 selection:text-black">
        <AdminPanel
          films={films}
          onUpdateFilms={saveFilmsToStorage}
          filmmakers={filmmakers}
          onUpdateFilmmakers={saveFilmmakersToStorage}
          upcomingFilms={upcomingFilms}
          onUpdateUpcoming={saveUpcomingToStorage}
          onBack={() => {
            window.history.pushState(null, '', '/');
            setViewState('home');
          }}
        />
      </div>
    );
  }

  if (viewState === 'filmmaker-studio') {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#F5F5F7] flex flex-col font-sans selection:bg-amber-500 selection:text-black">
        <FilmmakerStudio
          currentUser={currentUser}
          filmmakers={filmmakers}
          films={films}
          tips={tips}
          onRegisterFilmmaker={handleRegisterFilmmaker}
          onSubmitFilm={handleNewSubmission}
          onBackToHome={() => {
            window.history.pushState(null, '', '/');
            setViewState('home');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2B2B2B] text-[#F5F5F7] flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* 1. Header Navigation Bar */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeType={activeType}
        setActiveType={setActiveType}
        onSubmitClick={() => setShowSubmission(true)}
        onAboutClick={() => setShowManifesto(true)}
        setViewState={setViewState}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main cinematic canvas layout container */}
      <main className="flex-1 w-full px-3 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-8 pb-24 md:pb-8 flex flex-col gap-6 sm:gap-10">
        
        {/* Banner Success Announcement */}
        {showSubmitSuccess && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-bold text-xs tracking-wider uppercase font-mono">LOBBY PROJECTION ACTIVE</p>
                <p className="text-xs text-white/70 mt-0.5">Your listing has been compiled and is now live in the active OTT browsing guide.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSubmitSuccess(false)}
              className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 px-3 py-1.5 rounded uppercase tracking-wider cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* --- DYNAMIC VIEWPORT SWITCH --- */}
        {viewState === 'player' && activeFilm ? (
          
          /* --- THEATER ACTIVE PLAYER VIEW SCREEN --- */
          <div className="flex flex-col gap-6">
            
            {/* Immersive Theater Back and Info Header Bar */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <button
                id="btn-back-to-browse"
                onClick={() => setViewState('home')}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors cursor-pointer group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to OTT Browse Dashboard</span>
              </button>
              
              {/* Theater active state dot and label removed */}
            </div>

            <div className="flex flex-col gap-8">
              {/* Left/Middle: Custom Media Player + Info & Spec cards */}
              <div className="w-full flex flex-col gap-5">
                
                {/* Dynamic Watchlist Toggle indicator on Stage */}
                <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
                      Cinema Screen • Now Showing: <span className="text-amber-500 font-bold">{activeFilm.title}</span>
                    </span>
                  </div>
                </div>

                {/* Advanced Interactive Player */}
                <VideoPlayer 
                  film={activeFilm} 
                  initialEpisodeIndex={selectedEpisodeIndex}
                  onLike={handleLikeToggle}
                  isLiked={likedFilms.includes(activeFilm.id)}
                  onOpenTipJar={() => setShowTipJar(true)}
                />
              </div>

              {/* Right side: Interactive constructivist audience feedback section */}
              <div className="w-full flex flex-col gap-6">
                <FeedbackSection 
                  film={activeFilm}
                  onAddReview={handleAddReview}
                />
              </div>
            </div>

            {/* "More Like This" Curated Row */}
            <div className="border-t border-white/5 pt-8 mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clapperboard className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/90">RECOMMENDED INDIE SCREENINGS</h3>
                </div>
                <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">MORE GENRES & SERIES</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {films.filter(f => f.id !== activeFilm.id).slice(0, 6).map((film) => (
                  <div 
                    key={film.id}
                    onClick={() => handleSelectFilm(film)}
                    className="group cursor-pointer relative rounded overflow-hidden aspect-[2/3] border border-white/5 hover:border-amber-500/40 transition-all shadow-sm"
                  >
                    <img 
                      src={getDirectImageUrl(film.posterUrl)} 
                      alt={film.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: `center ${film.posterPositionY ?? 50}%` }}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-2.5 opacity-90">
                      <p className="text-[10px] font-bold text-[#F5F5F7] truncate">{film.title}</p>
                      <p className="text-[8px] text-white/40 font-mono">By {film.director}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        ) : (
          
          /* --- BROWSABLE PREMIUM OTT HOME STATE --- */
          <div className="flex flex-col gap-8 sm:gap-10">

            {/* IF SEARCH/FILTER ACTIVE, SHOW DISCOVERY SEARCH RESULTS IN GRID */}
            {isFilterOrSearchActive ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F7] flex items-center gap-2">
                      <Clapperboard className="h-4 w-4 text-amber-500" /> EXPLORE ARCHIVE INDEX ({filteredFilms.length} RESULTS)
                    </h3>
                    <p className="text-[10px] text-white/40 font-mono tracking-tight mt-0.5 uppercase">MATCHING YOUR ACTIVE FILTERS & SEARCH INDEX</p>
                  </div>

                  {/* Genre Pill filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    <ListFilter className="h-3.5 w-3.5 text-white/30 shrink-0" />
                    <div className="flex gap-1">
                      {genresAvailable.slice(0, 5).map((gen) => (
                        <button
                          key={gen}
                          onClick={() => setSelectedGenreFilter(gen)}
                          className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded transition-all cursor-pointer uppercase tracking-widest ${
                            selectedGenreFilter === gen
                              ? 'bg-white/10 text-white border border-white/20'
                              : 'text-white/40 hover:text-white border border-transparent hover:bg-white/5'
                          }`}
                        >
                          {gen}
                        </button>
                      ))}
                      {genresAvailable.length > 5 && (
                        <select
                          id="genre-dropdown-filter"
                          value={genresAvailable.includes(selectedGenreFilter) && genresAvailable.indexOf(selectedGenreFilter) >= 5 ? selectedGenreFilter : 'More'}
                          onChange={(e) => {
                            if (e.target.value !== 'More') {
                              setSelectedGenreFilter(e.target.value);
                            }
                          }}
                          className="text-[9px] font-mono font-bold bg-[#0c0c0e] text-white/50 px-2.5 py-1 rounded border border-white/10 focus:outline-none cursor-pointer uppercase tracking-widest"
                        >
                          <option value="More" disabled>MORE GENRES</option>
                          {genresAvailable.slice(5).map((gen) => (
                            <option key={gen} value={gen}>{gen.toUpperCase()}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {filteredFilms.length === 0 ? (
                  <div className="p-12 text-center bg-white/[0.01] border border-dashed border-white/10 rounded flex flex-col gap-2 items-center">
                    <AlertCircle className="h-8 w-8 text-white/25" />
                    <p className="text-xs text-white/40 font-sans">
                      {activeType === 'watchlist' 
                        ? 'Your reserved playlist is empty. Add films or series to your list.'
                        : 'No matching screens found on the archive index.'}
                    </p>
                    {activeType !== 'watchlist' ? (
                      <button
                        id="reset-filters-btn"
                        onClick={() => { setSearchQuery(''); setActiveType('all'); setSelectedGenreFilter('All'); }}
                        className="mt-2 text-xs text-amber-500 font-bold underline cursor-pointer"
                      >
                        Reset Search & Filters
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {filteredFilms.map((film) => (
                      <FilmCard 
                        key={film.id}
                        film={film}
                        onClick={() => handleSelectFilm(film)}
                        onSelectEpisode={(f, idx) => handleSelectFilm(f, idx)}
                        isActive={activeFilm ? activeFilm.id === film.id : false}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              
              /* NO ACTIVE FILTERS: STANDARD PREMIUM OTT RECOMMENDATIONS ROWS */
              <div className="flex flex-col gap-8 sm:gap-10">

                {/* A. GIANT DYNAMIC HERO BANNER - FIRST AT TOP */}
                {featuredFilm && (
                  <div className="relative overflow-hidden rounded-xl bg-black border border-white/10 min-h-[440px] sm:min-h-[480px] md:min-h-0 md:aspect-[21/9] flex items-center shadow-2xl p-5 sm:p-8 md:p-12">
                    {/* Background Graphic Art */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={getDirectImageUrl(featuredFilm.landscapePosterUrl || featuredFilm.posterUrl)} 
                        alt={featuredFilm.title} 
                        className="w-full h-full object-cover scale-[1.02]" 
                        style={{ 
                          objectPosition: `center ${
                            featuredFilm.landscapePosterUrl 
                              ? (featuredFilm.landscapePosterPositionY ?? 50) 
                              : (featuredFilm.posterPositionY ?? 50)
                          }%` 
                        }}
                        referrerPolicy="no-referrer"
                      />
                      {/* Dark gradient mask tuned for 60% opacity fade behind the title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161618]/90 via-[#161618]/60 to-black/20 md:bg-gradient-to-r md:from-[#161618]/85 md:via-[#161618]/60 md:via-[50%] md:to-transparent z-10" />
                    </div>

                    {/* Content Section - takes 50% width on medium+ screens */}
                    <div className="relative z-20 w-full md:w-[50%] lg:w-[52%] flex flex-col gap-2.5 sm:gap-3 select-none pr-0 md:pr-4">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest bg-amber-500 text-black px-2 py-0.5 rounded shadow">
                          CINEMATIC FEATURED
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest bg-white/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 backdrop-blur-sm">
                          ★ RECOMMENDED SCREENING
                        </span>
                      </div>

                      <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black tracking-tight text-[#F5F5F7] uppercase font-display leading-[0.95] drop-shadow-2xl my-1">
                        {featuredFilm.title}
                      </h2>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] font-mono text-white/60">
                        <span>{featuredFilm.releaseYear}</span>
                        <span className="text-white/20">•</span>
                        <span className="text-amber-400 uppercase font-bold">{featuredFilm.type === 'series' ? 'Web Series' : 'Short Film'}</span>
                        <span className="text-white/20">•</span>
                        <span>{featuredFilm.duration}</span>
                      </div>

                      <div className="max-w-lg">
                        <p className={`text-xs md:text-sm text-white/80 font-sans leading-relaxed transition-all drop-shadow-sm ${
                          showFullFeaturedDesc ? '' : 'line-clamp-2 md:line-clamp-3'
                        }`}>
                          {featuredFilm.description}
                        </p>
                        {featuredFilm.description && featuredFilm.description.length > 130 && (
                          <button
                            type="button"
                            onClick={() => setShowFullFeaturedDesc(!showFullFeaturedDesc)}
                            className="text-[10px] font-mono text-amber-400 hover:underline mt-0.5 focus:outline-none flex items-center gap-1 uppercase tracking-wider font-bold"
                          >
                            {showFullFeaturedDesc ? 'Show Less' : 'Read More...'}
                          </button>
                        )}
                      </div>

                      {/* Control buttons */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-1 sm:mt-2">
                        <button
                          id="hero-watch-btn"
                          onClick={() => handleSelectFilm(featuredFilm)}
                          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-extrabold transition-all cursor-pointer uppercase tracking-wider shadow-lg active:scale-95"
                        >
                          <Play className="h-4 w-4 fill-current" />
                          <span>Watch Now</span>
                        </button>

                        <button
                          id="hero-list-btn"
                          onClick={() => handleWatchlistToggle(featuredFilm.id)}
                          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer uppercase tracking-wider active:scale-95 ${
                            watchlist.includes(featuredFilm.id)
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {watchlist.includes(featuredFilm.id) ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span>Reserved</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span>My List</span>
                            </>
                          )}
                        </button>

                        <button
                          id="hero-sponsor-btn"
                          onClick={() => {
                            setSelectedActiveFilm(featuredFilm);
                            setShowTipJar(true);
                          }}
                          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer uppercase tracking-wider active:scale-95"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                          <span>Sponsor</span>
                        </button>
                      </div>

                      {/* Featured Series Listed Episode Options */}
                      {featuredFilm.type === 'series' && (
                        <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-white/10 w-full">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                            <Tv className="h-3 w-3" /> Select Episode To Play:
                          </span>
                          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 w-full">
                            {(featuredFilm.episodes && featuredFilm.episodes.length > 0 
                              ? featuredFilm.episodes 
                              : [{ id: `${featuredFilm.id}-ep1`, title: 'Episode 1', duration: featuredFilm.duration || '10m', videoUrl: featuredFilm.videoUrl }]
                            ).map((ep, idx) => (
                              <button
                                key={ep.id || idx}
                                type="button"
                                onClick={() => handleSelectFilm(featuredFilm, idx)}
                                className="px-3 py-1.5 bg-black/80 hover:bg-amber-500 hover:text-black border border-white/20 hover:border-amber-400 text-white rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow"
                              >
                                <Play className="h-2.5 w-2.5 fill-current" />
                                <span>Ep {idx + 1}: {ep.title}</span>
                                <span className="opacity-60 text-[9px]">({ep.duration})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 0. CONTINUE WATCHING SECTION (Last 5 viewed films) */}
                {continueWatchingFilms.length > 0 && (
                  <div className="flex flex-col gap-3.5 bg-white/[0.02] border border-amber-500/20 p-4 sm:p-5 rounded-xl backdrop-blur-sm relative overflow-hidden shadow-xl">
                    {/* Ambient subtle glow background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center justify-between border-b border-white/10 pb-3 z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[#F5F5F7] flex items-center gap-2">
                            CONTINUE WATCHING
                          </h3>
                          <p className="text-[9px] font-mono text-white/40 uppercase tracking-tight">
                            RESUME YOUR RECENTLY VIEWED SCREENINGS ({continueWatchingFilms.length}/5)
                          </p>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono text-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
                        ★ QUICK RESUME
                      </span>
                    </div>

                    {/* Row / Grid of Continue Watching Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 pt-1 z-10">
                      {continueWatchingFilms.map(({ film, episodeIndex }) => {
                        const activeEp = film.episodes && film.episodes[episodeIndex] ? film.episodes[episodeIndex] : null;
                        const poster = film.landscapePosterUrl || film.posterUrl;

                        return (
                          <div
                            key={film.id}
                            onClick={() => handleSelectFilm(film, episodeIndex)}
                            className="group cursor-pointer relative rounded-lg overflow-hidden bg-black/60 border border-white/10 hover:border-amber-500/60 transition-all duration-300 shadow-lg flex flex-col justify-between"
                          >
                            {/* Card Thumbnail Area */}
                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
                              <img
                                src={getDirectImageUrl(poster)}
                                alt={film.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                                style={{
                                  objectPosition: `center ${
                                    film.landscapePosterUrl
                                      ? (film.landscapePosterPositionY ?? 50)
                                      : (film.posterPositionY ?? 50)
                                  }%`
                                }}
                                referrerPolicy="no-referrer"
                              />

                              {/* Dark Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                              {/* Remove item button */}
                              <button
                                type="button"
                                onClick={(e) => handleRemoveFromContinueWatching(film.id, e)}
                                title="Remove from Continue Watching"
                                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/70 hover:bg-rose-500 text-white/70 hover:text-white flex items-center justify-center border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-20"
                              >
                                <X className="h-3 w-3" />
                              </button>

                              {/* Type / Episode Badge */}
                              <div className="absolute top-1.5 left-1.5 z-10">
                                <span className="text-[8px] font-mono font-bold bg-black/80 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
                                  {film.type === 'series'
                                    ? (activeEp ? `Ep ${episodeIndex + 1}` : 'Series')
                                    : 'Film'}
                                </span>
                              </div>

                              {/* Play Icon Circle Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="h-9 w-9 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                  <Play className="h-4 w-4 fill-current ml-0.5" />
                                </div>
                              </div>

                              {/* Progress bar simulation at bottom of thumbnail */}
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                <div className="h-full bg-amber-400 w-2/3 rounded-r" />
                              </div>
                            </div>

                            {/* Title & Info Bar */}
                            <div className="p-2.5 flex flex-col justify-between gap-1 bg-[#161618]">
                              <p className="text-xs font-extrabold text-[#F5F5F7] truncate font-sans group-hover:text-amber-300 transition-colors">
                                {film.title}
                              </p>
                              <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
                                <span className="truncate">By {film.director}</span>
                                <span className="text-amber-400 font-bold shrink-0 ml-1">RESUME</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* B. AUDIENCE PERSONAL WATCHLIST (Row 1 - If exists) */}
                {watchlistFilms.length > 0 && (
                  <div className="flex flex-col gap-3 bg-[#0c0c0e]/30 p-5 rounded border border-white/5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-amber-500" />
                        <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/90">MY RESERVED PLAYLIST</h3>
                      </div>
                      <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase">
                        {watchlistFilms.length} SAVED LISTINGS
                      </span>
                    </div>

                    <div className="relative group/row">
                      <div className="flex gap-5 overflow-x-auto pb-2 pt-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                        {watchlistFilms.map((film) => (
                          <div 
                            key={film.id}
                            onClick={() => handleSelectFilm(film)}
                            className="min-w-[150px] sm:min-w-[180px] w-[150px] sm:w-[180px] shrink-0 group cursor-pointer relative rounded overflow-hidden aspect-[2/3] border border-white/10 hover:border-amber-500/40 transition-all shadow-sm"
                          >
                            <img 
                              src={getDirectImageUrl(film.posterUrl)} 
                              alt={film.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              style={{ objectPosition: `center ${film.posterPositionY ?? 50}%` }}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-2.5 opacity-90">
                              <p className="text-[10px] font-bold text-[#F5F5F7] truncate">{film.title}</p>
                              <p className="text-[8px] text-white/40 font-mono">By {film.director}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* C. CURATED ROW 1: TRENDING NOW */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                      <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/95">TRENDING TODAY</h3>
                    </div>
                    <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">ORGANIC REACH</span>
                  </div>

                  <div className="relative group/row">
                    <div className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                      {trendingFilms.map((film) => (
                        <div key={film.id} className="min-w-[190px] sm:min-w-[220px] w-[190px] sm:w-[220px] shrink-0">
                          <FilmCard 
                            film={film} 
                            onClick={() => handleSelectFilm(film)} 
                            onSelectEpisode={(f, idx) => handleSelectFilm(f, idx)}
                            isActive={activeFilm ? activeFilm.id === film.id : false} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* D. CURATED ROW 2: HIGHLY RATED & AWARD WINNERS */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/95">CRITICALLY ACCLAIMED</h3>
                    </div>
                    <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">HIGHEST RATING</span>
                  </div>

                  <div className="relative group/row">
                    <div className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                      {topRatedFilms.map((film) => (
                        <div key={film.id} className="min-w-[190px] sm:min-w-[220px] w-[190px] sm:w-[220px] shrink-0">
                          <FilmCard 
                            film={film} 
                            onClick={() => handleSelectFilm(film)} 
                            onSelectEpisode={(f, idx) => handleSelectFilm(f, idx)}
                            isActive={activeFilm ? activeFilm.id === film.id : false} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* E. CURATED ROW 3: GUERILLA CINEMA MASTERPIECES */}
                {guerillaFilms.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-amber-500" />
                        <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/95">GUERILLA INDIE GEMS</h3>
                      </div>
                      <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">ZERO BARRIERS</span>
                    </div>

                    <div className="relative group/row">
                      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                        {guerillaFilms.map((film) => (
                          <div key={film.id} className="min-w-[190px] sm:min-w-[220px] w-[190px] sm:w-[220px] shrink-0">
                            <FilmCard 
                              film={film} 
                              onClick={() => handleSelectFilm(film)} 
                              onSelectEpisode={(f, idx) => handleSelectFilm(f, idx)}
                              isActive={activeFilm ? activeFilm.id === film.id : false} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* F. CURATED ROW 4: SERIES & INDIE DOCUMENTARIES */}
                {seriesAndDocs.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Tv className="h-4 w-4 text-amber-500" />
                        <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/95">INDIE SERIALS & DOCUMENTARIES</h3>
                      </div>
                      <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">DEEPER DIALOGUES</span>
                    </div>

                    <div className="relative group/row">
                      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                        {seriesAndDocs.map((film) => (
                          <div key={film.id} className="min-w-[190px] sm:min-w-[220px] w-[190px] sm:w-[220px] shrink-0">
                            <FilmCard 
                              film={film} 
                              onClick={() => handleSelectFilm(film)} 
                              onSelectEpisode={(f, idx) => handleSelectFilm(f, idx)}
                              isActive={activeFilm ? activeFilm.id === film.id : false} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Releases and Announcements Section */}
                <UpcomingMovies upcomingList={upcomingFilms} />

                {/* G. INTERACTIVE BENTO SPOTLIGHT & PHILOSOPHY SECTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch mt-4">
                  
                  {/* Filmmaker of the week Spotlight */}
                  <div className="lg:col-span-1 h-full flex flex-col">
                    <FilmmakerSpotlight 
                      filmmakers={filmmakers}
                      films={films}
                      onSelectFilm={handleSelectFilm}
                      activeFilmId={activeFilm ? activeFilm.id : ''}
                    />
                  </div>

                  {/* Ethics and platform manifesto container */}
                  <div className="lg:col-span-3 bg-[#0c0c0e] p-6 md:p-8 rounded border border-white/5 flex flex-col justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500">
                          PLATFORM GUIDING PROTOCOLS
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F5F5F7] uppercase font-display">
                        A cinematic universe designed entirely for independent storytellers.
                      </h3>

                      <p className="text-xs text-white/50 leading-relaxed font-sans">
                        IndieScreen operates without algorithmic lockouts, corporate tier pricing, or developer platform listing fee structures. We believe high-quality, creative cinematic expression should be 100% open and accessible to the public, backed by constructive viewer ratings, spec analysis, and fully distributed filmmaker micro-sponsorship.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 pt-4 border-t border-white/5 text-[11px] text-white/40">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase block mb-1">1. ZERO SCREENING FEES</span>
                          Upload your short films or web series directly. No subscriptions or audience gatekeepers.
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase block mb-1">2. SPECIFIC RATING ANALYTICS</span>
                          Get constructive technical feedback on storyboards, audio engineering, and framing.
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase block mb-1">3. DIRECT CROUDFUNDING</span>
                          Sponsor lens acquisitions, movie equipment, and local screening submissions.
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/5">
                      <button
                        onClick={() => setShowSubmission(true)}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-widest"
                      >
                        Screen Your Work Now
                      </button>

                      <button
                        onClick={() => setShowManifesto(true)}
                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-widest"
                      >
                        Read manifesto
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* --- MODALS & PORTALS --- */}
      
      {/* Filmmaker Submission Wizard */}
      {showSubmission && (
        <SubmissionModal 
          onClose={() => setShowSubmission(false)}
          prefilledUpiId={currentUser ? filmmakers.find(fm => fm.userId === currentUser.uid || fm.id === currentUser.uid)?.upiId : undefined}
          prefilledDirector={currentUser ? filmmakers.find(fm => fm.userId === currentUser.uid || fm.id === currentUser.uid)?.name : undefined}
          onSubmit={handleNewSubmission}
        />
      )}

      {/* Ethical Distribution Manifesto Dialog */}
      {showManifesto && (
        <AboutManifesto 
          onClose={() => setShowManifesto(false)}
        />
      )}

      {/* Interactive Micro-Tip Support Checkout */}
      {showTipJar && activeFilm && (
        <TipJarModal 
          film={activeFilm}
          onClose={() => setShowTipJar(false)}
          onSponsor={(amount, name) => handleSponsor(activeFilm, amount, name)}
        />
      )}

      {/* Minimal Footer */}
      <footer className="mt-auto py-10 bg-black/95 border-t border-white/5 text-center text-xs text-white/40 font-sans tracking-wide">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white/60 font-bold tracking-wider text-sm">
            TPF CINEMAS | AN OTT FOR BEGINNERS
          </div>
          <div className="text-[11px] text-white/30 font-medium tracking-normal">
            &copy; {new Date().getFullYear()} TPF Cinemas. All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
