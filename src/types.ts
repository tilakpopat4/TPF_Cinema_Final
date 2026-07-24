export interface Filmmaker {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  country: string;
  role: string; // e.g., "Director / Screenwriter"
  instagram?: string;
  portfolio?: string;
  userId?: string; // Link to user's auth UID
  createdAt?: number;
  upiId?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  aspects: {
    storytelling: number;
    cinematography: number;
    soundDesign: number;
    acting: number;
  };
}

export interface Episode {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface Film {
  id: string;
  title: string;
  type: 'film' | 'series';
  description: string;
  duration: string; // e.g., "14m" or "3 Episodes"
  genre: string[];
  director: string;
  releaseYear: number;
  posterUrl: string; // Portrait poster (2:3 aspect ratio)
  landscapePosterUrl?: string; // Landscape poster (16:9 aspect ratio)
  videoUrl: string; // Direct link or mock stream
  trailerUrl?: string; // Official trailer / teaser video URL or local video file
  cameraUsed?: string; // e.g., "Sony A7III"
  ageRating?: string; // e.g., "U/A 16+"
  filmmakerId: string;
  views: number;
  likes: number;
  reviews: Review[];
  isFeatured?: boolean;
  episodes?: Episode[];
  upiId?: string;
  createdAt?: number;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  fundsReceived?: number;
  submittedByUid?: string;
  posterPositionY?: number; // percentage (0 to 100) for vertical crop/pan of portrait poster
  landscapePosterPositionY?: number; // percentage (0 to 100) for vertical crop/pan of landscape poster
  contentId?: string; // TPF Cinemas unique content ID e.g. TPF-CID-2026-X89K2
  thumbnailContentId?: string; // TPF Cinemas unique thumbnail asset ID e.g. TPF-THM-2026-P01B9
}

export interface UpcomingFilm {
  id: string;
  title: string;
  director: string;
  expectedRelease: string;
  genre: string[];
  thumbnailUrl: string;
  videoUrl: string;
  description: string;
}

export interface Tip {
  id: string;
  filmId: string;
  filmTitle: string;
  filmmakerId: string;
  amountINR: number;
  patronName: string;
  createdAt: number;
}

export interface ContinueWatchingItem {
  filmId: string;
  episodeIndex?: number;
  timestamp: number;
}

