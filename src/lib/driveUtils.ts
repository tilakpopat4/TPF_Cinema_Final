/**
 * Utility to process user-input URLs.
 * Converts Google Drive sharing links into direct/embeddable URLs for images.
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
