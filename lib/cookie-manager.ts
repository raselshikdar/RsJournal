/**
 * International GDPR & ePrivacy Compliant Cookie Manager
 * Handles real browser cookies, consent persistence, category gating, and cleanup.
 */

export interface CookieConsentCategories {
  necessary: boolean;    // Security, Session, Core functionality (always true)
  preferences: boolean;  // Theme, font sizing, display preferences
  analytics: boolean;    // Anonymous traffic analysis, reading time, scroll metrics
  marketing: boolean;    // Newsletter targeting, social widget sync
}

export interface CookieConsentData {
  status: 'accepted_all' | 'necessary_only' | 'custom';
  timestamp: string;
  categories: CookieConsentCategories;
  version: number;
}

export const CONSENT_COOKIE_NAME = 'rs_consent_status';
export const CONSENT_STORAGE_KEY = 'rs_cookie_consent';
export const CURRENT_CONSENT_VERSION = 1;

export const DEFAULT_CONSENT: CookieConsentData = {
  status: 'necessary_only',
  timestamp: new Date().toISOString(),
  categories: {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  },
  version: CURRENT_CONSENT_VERSION,
};

/**
 * Standard robust cookie reader
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const escapedName = encodeURIComponent(name).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escapedName + '=([^;]*)'));
    if (!match) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  } catch {
    return null;
  }
}

/**
 * Standard cookie writer with max-age, path, SameSite, and secure attributes
 */
export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const maxAge = days * 24 * 60 * 60;
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  } catch {}
}

/**
 * Delete a cookie by expiring it in the past
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  try {
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch {}
}

/**
 * Retrieve current consent from cookies or localStorage
 */
export function getSavedConsent(): CookieConsentData | null {
  if (typeof window === 'undefined') return null;

  // 1. Try reading from real document.cookie
  try {
    const raw = getCookie(CONSENT_COOKIE_NAME);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.categories) {
        return parsed as CookieConsentData;
      }
    }
  } catch {}

  // 2. Try reading from localStorage fallback
  try {
    const local = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object' && parsed.categories) {
        return parsed as CookieConsentData;
      }
    }
  } catch {}

  return null;
}

/**
 * Check if a specific consent category is granted
 */
export function hasConsent(category: keyof CookieConsentCategories): boolean {
  if (category === 'necessary') return true;
  const consent = getSavedConsent();
  if (!consent) return false;
  return !!consent.categories[category];
}

/**
 * Real functional application of cookie consent:
 * - Persists choice to real document.cookie and localStorage
 * - Activates or wipes cookies based on granted/denied categories
 */
export function applyCookieConsent(consent: CookieConsentData): void {
  if (typeof window === 'undefined') return;

  const dataToSave: CookieConsentData = {
    ...consent,
    categories: {
      ...consent.categories,
      necessary: true, // Always locked to true
    },
    timestamp: new Date().toISOString(),
    version: CURRENT_CONSENT_VERSION,
  };

  // 1. Save master consent cookie and storage
  const serialized = JSON.stringify(dataToSave);
  setCookie(CONSENT_COOKIE_NAME, serialized, 365);
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
  } catch {}

  // 2. Functional Category: Preferences (Theme, Font)
  if (dataToSave.categories.preferences) {
    setCookie('_rs_pref_allowed', 'true', 365);
    try {
      const savedTheme = localStorage.getItem('rs_blog_theme') || 'light';
      setCookie('rs_blog_theme', savedTheme, 365);
    } catch {}
  } else {
    deleteCookie('_rs_pref_allowed');
    deleteCookie('rs_blog_theme');
    deleteCookie('rs_theme');
    deleteCookie('rs_font_size');
  }

  // 3. Functional Category: Analytics
  if (dataToSave.categories.analytics) {
    let visitorId = getCookie('_rs_analytics_visitor_id');
    if (!visitorId) {
      visitorId = 'rs_v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      setCookie('_rs_analytics_visitor_id', visitorId, 365);
    }
    setCookie('_rs_analytics_allowed', 'true', 365);
    setCookie('_rs_analytics_session', Date.now().toString(), 1);
  } else {
    // Actively delete analytics cookies if consent revoked or denied
    deleteCookie('_rs_analytics_visitor_id');
    deleteCookie('_rs_analytics_session');
    deleteCookie('_rs_analytics_allowed');
    try {
      localStorage.removeItem('_rs_analytics_session_data');
    } catch {}
  }

  // 4. Functional Category: Marketing / Communications
  if (dataToSave.categories.marketing) {
    setCookie('_rs_mkt_allowed', 'true', 365);
  } else {
    deleteCookie('_rs_mkt_allowed');
    deleteCookie('_rs_newsletter_banner_dismissed');
  }

  // 5. Notify active components about consent change
  window.dispatchEvent(
    new CustomEvent('cookieConsentChanged', {
      detail: dataToSave,
    })
  );
}

/**
 * Trigger global event to open cookie preferences modal from anywhere (Footer, Privacy page, etc.)
 */
export function openCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('openCookiePreferences'));
}

/**
 * Lightweight anonymous page view & dwell tracker that strictly respects Analytics consent
 */
export function recordAnonymousPageView(path: string): void {
  if (typeof window === 'undefined') return;
  if (!hasConsent('analytics')) return;

  try {
    let visitorId = getCookie('_rs_analytics_visitor_id');
    if (!visitorId) {
      visitorId = 'rs_v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      setCookie('_rs_analytics_visitor_id', visitorId, 365);
    }
    setCookie('_rs_analytics_session', Date.now().toString(), 1);
  } catch {}
}
