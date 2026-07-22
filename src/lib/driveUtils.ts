/**
 * Utility to process user-input URLs.
 * Converts Google Drive sharing links into direct/embeddable URLs for images & videos.
 */

export function getDirectImageUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Match Google Drive file ID
  const gdFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const gdOpenRegex = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const gdUcRegex = /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/;
  const gdUcExportRegex = /drive\.google\.com\/uc\?export=view&id=([a-zA-Z0-9_-]+)/;
  const gdDocsUcRegex = /docs\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/;

  const match = trimmed.match(gdFileRegex) || 
                trimmed.match(gdOpenRegex) || 
                trimmed.match(gdUcRegex) || 
                trimmed.match(gdUcExportRegex) ||
                trimmed.match(gdDocsUcRegex);

  if (match && match[1]) {
    // Return direct link that works reliably in img tags
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  return trimmed;
}

export interface VideoEmbedOptions {
  hideYouTubePlayerUI?: boolean;
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
}

export interface VideoEmbedData {
  isEmbed: boolean;
  embedUrl: string;
  provider?: 'youtube' | 'drive' | 'vimeo' | 'direct';
  videoId?: string;
}

export function getVideoEmbedData(
  url: string | undefined, 
  options: VideoEmbedOptions = { autoplay: true }
): VideoEmbedData {
  if (!url) return { isEmbed: false, embedUrl: '', provider: 'direct' };
  const trimmed = url.trim();

  // 1. YouTube Matches
  const ytWatchRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = trimmed.match(ytWatchRegex);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const autoplayParam = options.autoplay !== false ? '1' : '0';
    const muteParam = options.mute ? '&mute=1' : '';
    
    // Clean, high quality YouTube embed parameters without artificial masks
    const ytParams = `autoplay=${autoplayParam}&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${muteParam}`;

    return {
      isEmbed: true,
      embedUrl: `https://www.youtube.com/embed/${videoId}?${ytParams}`,
      provider: 'youtube',
      videoId
    };
  }

  // 2. Google Drive Matches
  const gdFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const gdOpenRegex = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const gdUcRegex = /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/;
  const gdDocsUcRegex = /docs\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/;

  const gdMatch = trimmed.match(gdFileRegex) ||
                  trimmed.match(gdOpenRegex) ||
                  trimmed.match(gdUcRegex) ||
                  trimmed.match(gdDocsUcRegex);

  if (gdMatch && gdMatch[1]) {
    return {
      isEmbed: true,
      embedUrl: `https://drive.google.com/file/d/${gdMatch[1]}/preview`,
      provider: 'drive',
      videoId: gdMatch[1]
    };
  }

  // 3. Vimeo Matches
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    const autoplayParam = options.autoplay !== false ? '1' : '0';
    return {
      isEmbed: true,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=${autoplayParam}&byline=0&portrait=0&title=0`,
      provider: 'vimeo',
      videoId
    };
  }

  return { isEmbed: false, embedUrl: trimmed, provider: 'direct' };
}

