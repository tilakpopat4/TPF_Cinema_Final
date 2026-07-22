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
  cameraUsed?: string; // e.g., "Sony A7III"
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

