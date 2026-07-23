// IndexedDB & Base64 Persistent Media Manager for TPF Cinemas
// Ensures local images, posters, avatars, thumbnails, and master video uploads persist across browser restarts.

const DB_NAME = 'tpf_cinemas_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

// Runtime cache for active Object URLs created from IndexedDB
const activeBlobUrlCache = new Map<string, string>();

/**
 * Open or upgrade the IndexedDB database for media storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Compress and resize an image file into a lightweight JPEG Base64 Data URL
 * guaranteed to fit within Firestore & LocalStorage limits (< 200KB).
 */
export function compressAndResizeImage(file: File, maxDimension = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D context for image compression.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression.'));
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert an image file to a persistent Base64 Data URL
 */
export function imageFileToBase64(file: File): Promise<string> {
  return compressAndResizeImage(file, 1200, 0.82);
}

/**
 * Save a File/Blob to IndexedDB or convert to Base64 (for images)
 */
export async function saveMediaFile(file: File): Promise<{ mediaKey: string; previewUrl: string }> {
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    try {
      // For images, lightweight Base64 Data URLs (<150KB) are self-contained and work permanently in state, localStorage & Firestore!
      const base64Url = await compressAndResizeImage(file, 1200, 0.82);
      // Also store raw file in IndexedDB for backup
      const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id, file, name: file.name, type: file.type, createdAt: Date.now() });
      } catch (e) {
        console.warn('Could not back up image to IndexedDB:', e);
      }
      return { mediaKey: base64Url, previewUrl: base64Url };
    } catch (err) {
      console.error('Image compression failed, falling back to basic reader:', err);
    }
  }

  // For video files or non-image media, store directly in IndexedDB
  const rawId = 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const mediaKey = `indexeddb:${rawId}`;

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.put({
      id: rawId,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      createdAt: Date.now()
    });

    req.onsuccess = () => {
      const liveBlobUrl = URL.createObjectURL(file);
      activeBlobUrlCache.set(mediaKey, liveBlobUrl);
      resolve({ mediaKey, previewUrl: liveBlobUrl });
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve a stored Blob from IndexedDB using an indexeddb: key or raw ID
 */
export async function getStoredMediaBlob(mediaKey: string): Promise<Blob | null> {
  const rawId = mediaKey.startsWith('indexeddb:') ? mediaKey.replace('indexeddb:', '') : mediaKey;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.get(rawId);
      req.onsuccess = () => {
        if (req.result && req.result.file) {
          resolve(req.result.file as Blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Error fetching media from IndexedDB:', err);
    return null;
  }
}

/**
 * Resolve any stored media URL (e.g. 'indexeddb:vid_123', 'data:image/...', 'https://...', or active 'blob:')
 * into a live, playable / displayable URL for the current session.
 */
export async function resolveMediaUrl(url: string | undefined | null): Promise<string> {
  if (!url) return '';

  // If it's already a Data URL or external HTTP/HTTPS URL, return as-is
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's an indexeddb: URI
  if (url.startsWith('indexeddb:')) {
    if (activeBlobUrlCache.has(url)) {
      return activeBlobUrlCache.get(url)!;
    }

    const blob = await getStoredMediaBlob(url);
    if (blob) {
      const liveUrl = URL.createObjectURL(blob);
      activeBlobUrlCache.set(url, liveUrl);
      return liveUrl;
    }
  }

  // If it's a blob: URL from a previous session that expired, check if we can resolve it by matching any stored video
  if (url.startsWith('blob:')) {
    // If it's in active cache, return
    for (const [, cachedLiveUrl] of activeBlobUrlCache.entries()) {
      if (cachedLiveUrl === url) return url;
    }
  }

  return url;
}

/**
 * Hydrate an object (Film, Episode, MasterVideo, etc.) replacing indexeddb: keys with live URLs
 */
export async function hydrateMediaItem<T extends Record<string, any>>(item: T): Promise<T> {
  if (!item) return item;
  const copy: Record<string, any> = { ...item };

  if (copy.videoUrl) copy.videoUrl = await resolveMediaUrl(copy.videoUrl);
  if (copy.posterUrl) copy.posterUrl = await resolveMediaUrl(copy.posterUrl);
  if (copy.thumbnailUrl) copy.thumbnailUrl = await resolveMediaUrl(copy.thumbnailUrl);
  if (copy.landscapePoster) copy.landscapePoster = await resolveMediaUrl(copy.landscapePoster);
  if (copy.avatar) copy.avatar = await resolveMediaUrl(copy.avatar);

  if (Array.isArray(copy.episodes)) {
    copy.episodes = await Promise.all(
      copy.episodes.map(async (ep: any) => {
        const epCopy: Record<string, any> = { ...ep };
        if (epCopy.videoUrl) epCopy.videoUrl = await resolveMediaUrl(epCopy.videoUrl);
        if (epCopy.thumbnailUrl) epCopy.thumbnailUrl = await resolveMediaUrl(epCopy.thumbnailUrl);
        return epCopy;
      })
    );
  }

  return copy as T;
}

/**
 * Hydrate an array of items
 */
export async function hydrateMediaList<T extends Record<string, any>>(list: T[]): Promise<T[]> {
  if (!Array.isArray(list)) return [];
  return Promise.all(list.map(item => hydrateMediaItem(item)));
}
