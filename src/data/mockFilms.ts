import { Film, Filmmaker } from '../types';

export const mockFilmmakers: Filmmaker[] = [
  {
    id: 'fm-1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'Self-taught director and VFX artist from Vancouver. Loves exploring the intersection of independent filmmaking and heavy visual effects.',
    country: 'Canada',
    role: 'Director / VFX Supervisor',
    instagram: '@sarah_chen_vfx',
    portfolio: 'sarahchenfilms.com'
  },
  {
    id: 'fm-2',
    name: 'Marcus Kael',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'Independent documentarian capturing raw human stories using minimal setups and ambient lighting. Works mostly with minimalist setups.',
    country: 'Germany',
    role: 'Documentary Filmmaker',
    instagram: '@marcus_kael_docs'
  },
  {
    id: 'fm-3',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'Cinematography graduate exploring surreal dreamscapes and magical realism. Believes that limitations breed extreme creativity.',
    country: 'Czechia',
    role: 'Director / Cinematographer',
    instagram: '@elena_cinematic'
  }
];

export const initialFilms: Film[] = [
  {
    id: 'film-1',
    title: 'Tears of Steel',
    type: 'film',
    description: 'In a dystopian neon future, a group of scientists gathers in the Oude Kerk of Amsterdam to stage an event of cosmic proportions. They attempt to rescue the world from destructive giant robots by recreating a crucial memory of love and heartbreak.',
    duration: '12m 14s',
    genre: ['Sci-Fi', 'Action', 'VFX Showcase'],
    director: 'Sarah Chen',
    releaseYear: 2025,
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&h=900&q=80',
    landscapePosterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&h=675&q=80',
    posterPositionY: 50,
    landscapePosterPositionY: 50,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    cameraUsed: 'Sony FX3 + Vintage Minolta Lenses',
    filmmakerId: 'fm-1',
    views: 1420,
    likes: 312,
    isFeatured: true,
    upiId: 'sarahchen@okaxis',
    reviews: [
      {
        id: 'rev-1',
        userName: 'Alex Rivers',
        rating: 5,
        comment: 'The VFX integration is jaw-dropping! The pacing is tight and the sound sync in the climax gave me chills. Excellent work, Sarah!',
        createdAt: '2026-07-10',
        aspects: { storytelling: 4, cinematography: 5, soundDesign: 5, acting: 4 }
      },
      {
        id: 'rev-2',
        userName: 'Cinema_Critique',
        rating: 4,
        comment: 'A visual spectacle! The narrative is slightly rushed, but the artistic ambition makes up for it. Truly shows what beginners can achieve today.',
        createdAt: '2026-07-12',
        aspects: { storytelling: 3, cinematography: 5, soundDesign: 4, acting: 4 }
      }
    ]
  },
  {
    id: 'film-2',
    title: 'Sintel\'s Quest',
    type: 'film',
    description: 'A lonely young woman named Sintel searches for her companion, a baby dragon she nurtured. When she finally finds him, she discovers that time and circumstances have changed their bond in a devastating, emotional way.',
    duration: '14m 48s',
    genre: ['Fantasy', 'Drama', 'Animation'],
    director: 'Elena Rostova',
    releaseYear: 2026,
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&h=900&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    cameraUsed: 'Blender 3D (Render Farm of friends\' laptops)',
    filmmakerId: 'fm-3',
    views: 980,
    likes: 245,
    isFeatured: false,
    upiId: 'elenarostova@okhdfc',
    reviews: [
      {
        id: 'rev-3',
        userName: 'GamerGirl99',
        rating: 5,
        comment: 'Absolutely beautiful storyline. I cried at the ending. The dragon animation is so expressive. Bravo Elena and crew!',
        createdAt: '2026-07-14',
        aspects: { storytelling: 5, cinematography: 4, soundDesign: 5, acting: 5 }
      }
    ]
  },
  {
    id: 'film-3',
    title: 'Echoes of the Mind',
    type: 'series',
    description: 'A 3-part documentary mini-series exploring the daily isolation and artistic release of three bedroom-producers and painters living in remote European villages during the modern digital boom.',
    duration: '3 Episodes',
    genre: ['Documentary', 'Indie', 'Human Interest'],
    director: 'Marcus Kael',
    releaseYear: 2025,
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    cameraUsed: 'iPhone 13 Pro + Rode VideoMicro',
    filmmakerId: 'fm-2',
    views: 650,
    likes: 184,
    isFeatured: false,
    upiId: 'marcuskael@okicici',
    episodes: [
      {
        id: 'ep-3-1',
        title: 'Episode 1: The Bedroom Producer',
        duration: '10m 53s',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&h=338&q=80',
        description: 'Exploring the quiet midnight soundscapes of bedroom music producers.'
      },
      {
        id: 'ep-3-2',
        title: 'Episode 2: Colors of the Forest',
        duration: '12m 14s',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&h=338&q=80',
        description: 'Vivid oil canvases created deep inside ancient woodland cabins.'
      },
      {
        id: 'ep-3-3',
        title: 'Episode 3: The Canvas in the Digital Age',
        duration: '14m 48s',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&h=338&q=80',
        description: 'Balancing digital gallery spaces with traditional raw tactile artwork.'
      }
    ],
    reviews: [
      {
        id: 'rev-4',
        userName: 'AuteurLover',
        rating: 4,
        comment: 'So intimate and beautifully shot. Marcus proves you don\'t need a cinema rig to capture profound human connection. The score fits the melancholic vibe perfectly.',
        createdAt: '2026-07-08',
        aspects: { storytelling: 5, cinematography: 4, soundDesign: 4, acting: 3 }
      }
    ]
  },
  {
    id: 'film-4',
    title: 'The Big Chase',
    type: 'film',
    description: 'A comical, fast-paced action short film about a forest rabbit who discovers that a giant, loveable bear has stolen his harvest of giant carrots, triggering a hilarious chase across a colorful landscape.',
    duration: '9m 56s',
    genre: ['Comedy', 'Adventure', 'Family'],
    director: 'Elena Rostova',
    releaseYear: 2024,
    posterUrl: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=600&h=900&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cameraUsed: 'iPad Pro (Stop Motion / 3D Mixed Setup)',
    filmmakerId: 'fm-3',
    views: 2150,
    likes: 540,
    isFeatured: false,
    reviews: [
      {
        id: 'rev-5',
        userName: 'LaughOutLoud',
        rating: 5,
        comment: 'Hilarious, my kids and I loved it! The physical comedy is top-notch. High-quality animation from a beginner filmmaker.',
        createdAt: '2026-07-05',
        aspects: { storytelling: 5, cinematography: 4, soundDesign: 4, acting: 4 }
      }
    ]
  }
];
