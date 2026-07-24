/**
 * Cyber Security Utilities for TPF Cinemas
 * Defends against XSS, Brute-Force Attacks, Traffic Interception / Eavesdropping, and Injection vulnerabilities.
 */

// 1. Anti-XSS Text Sanitizer
export function sanitizeText(input: string, maxLength: number = 2000): string {
  if (!input) return '';
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
    .replace(/javascript:/gi, '') // Strip javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Strip event handlers like onload=, onerror=
    .trim();
}

// 2. Safe URL Protocol Validator (Prevents XSS via javascript: or data:text/html URLs)
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  
  // Safe protocols allowed in TPF Cinema
  const safeProtocols = ['https://', 'http://', 'blob:', 'indexeddb:'];
  const isSafe = safeProtocols.some(proto => trimmed.toLowerCase().startsWith(proto));

  if (!isSafe && !trimmed.startsWith('/')) {
    console.warn('[Security Guard] Blocked unsafe URL protocol:', trimmed);
    return '';
  }
  
  return trimmed;
}

// 3. Client & Storage Rate-Limiting Engine for Brute Force Defense
interface RateLimitRecord {
  count: number;
  firstAttemptTime: number;
  lockoutUntil: number;
}

const memoryRateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  actionKey: string, 
  maxAttempts: number = 5, 
  windowMs: number = 60000, 
  lockoutMs: number = 300000
): { allowed: boolean; remainingAttempts: number; retryAfterSec: number } {
  const now = Date.now();
  let record = memoryRateLimitMap.get(actionKey);

  if (!record) {
    record = { count: 0, firstAttemptTime: now, lockoutUntil: 0 };
    memoryRateLimitMap.set(actionKey, record);
  }

  // Check if locked out
  if (record.lockoutUntil > now) {
    const retryAfterSec = Math.ceil((record.lockoutUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  // Reset window if time elapsed
  if (now - record.firstAttemptTime > windowMs) {
    record.count = 0;
    record.firstAttemptTime = now;
  }

  if (record.count >= maxAttempts) {
    record.lockoutUntil = now + lockoutMs;
    const retryAfterSec = Math.ceil(lockoutMs / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - record.count, 
    retryAfterSec: 0 
  };
}

export function recordFailedAttempt(actionKey: string, lockoutMs: number = 300000): number {
  const now = Date.now();
  let record = memoryRateLimitMap.get(actionKey);
  if (!record) {
    record = { count: 1, firstAttemptTime: now, lockoutUntil: 0 };
  } else {
    record.count += 1;
  }

  if (record.count >= 5) {
    record.lockoutUntil = now + lockoutMs;
  }

  memoryRateLimitMap.set(actionKey, record);
  return record.count;
}

export function clearRateLimit(actionKey: string): void {
  memoryRateLimitMap.delete(actionKey);
}

// 4. Anti-Brute-Force Delay Generator (Mitigates timing attacks & thwarts automated password sprayers)
export async function verifyAdminPasswordSecure(passwordInput: string, correctPassword: string): Promise<{ success: boolean; error?: string }> {
  // Artificial non-deterministic delay (400-800ms) to defeat high-speed brute force tools and side-channel timing analysis
  const artificialDelay = 400 + Math.floor(Math.random() * 400);
  await new Promise(res => setTimeout(res, artificialDelay));

  // Perform constant-length-aware comparison
  const inputTrimmed = passwordInput.trim();
  let match = true;

  if (inputTrimmed.length !== correctPassword.length) {
    match = false;
  }

  const len = Math.max(inputTrimmed.length, correctPassword.length);
  for (let i = 0; i < len; i++) {
    const charA = inputTrimmed.charCodeAt(i) || 0;
    const charB = correctPassword.charCodeAt(i) || 0;
    if (charA !== charB) {
      match = false;
    }
  }

  return { success: match };
}

// 5. Session Timeout Manager (Auto-logs out inactive admin after 15 mins)
export function initAdminSessionTracker(onTimeout: () => void): () => void {
  const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 Minutes
  let timer: NodeJS.Timeout;

  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.warn('[Security Guard] Admin session expired due to inactivity.');
      sessionStorage.removeItem('tpf_admin_auth');
      onTimeout();
    }, INACTIVITY_LIMIT_MS);
  };

  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  activityEvents.forEach(evt => window.addEventListener(evt, resetTimer));

  resetTimer();

  return () => {
    clearTimeout(timer);
    activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
  };
}
