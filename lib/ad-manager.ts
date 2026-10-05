import { db, doc, getDoc, setDoc, onSnapshot } from './firebase';

export type AdType = 'adsense' | 'custom_banner' | 'html_script';

export interface AdSlotConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: AdType;
  // Google AdSense settings
  adClient?: string;
  adSlot?: string;
  adFormat?: 'auto' | 'horizontal' | 'rectangle' | 'vertical';
  // Custom Banner / Sponsor / Affiliate
  imageUrl?: string;
  targetUrl?: string;
  altText?: string;
  openInNewTab?: boolean;
  sponsorName?: string;
  // Custom HTML / Third Party Script
  customHtml?: string;
}

export interface AdSettings {
  enabled: boolean;
  adsense: {
    enabled: boolean;
    publisherId: string;
    autoAdsEnabled: boolean;
    testMode: boolean;
  };
  slots: Record<string, AdSlotConfig>;
  updatedAt?: string;
}

export const DEFAULT_AD_SLOTS: Record<string, AdSlotConfig> = {
  header_top: {
    id: 'header_top',
    name: 'হেডার টপ ব্যানার (Header Top)',
    description: 'মেনুর ঠিক নিচে বা হেডারের শীর্ষে ৭২৮x৯০ বা রেসপন্সিভ ব্যানার বিজ্ঞাপন',
    enabled: false,
    type: 'adsense',
    adFormat: 'horizontal',
    openInNewTab: true,
  },
  home_mid: {
    id: 'home_mid',
    name: 'হোমপেজ মিডল ব্যানার (Homepage In-Feed)',
    description: 'হোমপেজে "প্রযুক্তি কথন" এবং "সাম্প্রতিক পোস্ট"-এর মধ্যবর্তী স্থান',
    enabled: true,
    type: 'custom_banner',
    adFormat: 'horizontal',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://rasel.dev.bd',
    altText: 'Next-Gen Cloud & Software Architecture by Rasel Shikdar',
    sponsorName: 'টেক জার্নাল স্পন্সরশিপ',
    openInNewTab: true,
  },
  article_top: {
    id: 'article_top',
    name: 'আর্টিকেল টপ ব্যানার (Article Top)',
    description: 'আর্টিকেলের শিরোনাম ও কভার ইমেজের ঠিক নিচে প্রধান রিডিং স্পট',
    enabled: false,
    type: 'adsense',
    adFormat: 'auto',
    openInNewTab: true,
  },
  article_in_content: {
    id: 'article_in_content',
    name: 'আর্টিকেল ইন-কনটেন্ট (Article In-Content)',
    description: 'আর্টিকেলের প্যারাগ্রাফের মাঝে সর্বাধিক ক্লিক উপযোগী বিজ্ঞাপন',
    enabled: true,
    type: 'custom_banner',
    adFormat: 'rectangle',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
    targetUrl: 'https://rasel.dev.bd',
    altText: 'সাইবার সিকিউরিটি ও ফুল-স্ট্যাক ইঞ্জিনিয়ারিং গাইড',
    sponsorName: 'নলেজ পার্টনার',
    openInNewTab: true,
  },
  article_bottom: {
    id: 'article_bottom',
    name: 'আর্টিকেল বটম ব্যানার (Article Bottom)',
    description: 'আর্টিকেলের সমাপ্তিতে এবং মন্তব্য সেকশনের ঠিক পূর্বে স্থাপিত ব্যানার',
    enabled: false,
    type: 'adsense',
    adFormat: 'horizontal',
    openInNewTab: true,
  },
  article_sidebar: {
    id: 'article_sidebar',
    name: 'আর্টিকেল সাইডবার ব্যানার (Article Sidebar)',
    description: 'ডেস্কটপ ভিউতে সাইডবার বা স্টিকি সেকশনে ৩০০x২৫০ ব্যানার বিজ্ঞাপন',
    enabled: false,
    type: 'adsense',
    adFormat: 'rectangle',
    openInNewTab: true,
  },
};

export const DEFAULT_AD_SETTINGS: AdSettings = {
  enabled: true,
  adsense: {
    enabled: false,
    publisherId: '',
    autoAdsEnabled: false,
    testMode: false,
  },
  slots: DEFAULT_AD_SLOTS,
  updatedAt: new Date().toISOString(),
};

const LOCAL_STORAGE_KEY = 'rs_ad_settings_cache';

/**
 * Get initial cached settings from localStorage for instant zero-lag rendering
 */
export function getCachedAdSettings(): AdSettings {
  if (typeof window === 'undefined') return DEFAULT_AD_SETTINGS;
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_AD_SETTINGS,
        ...parsed,
        adsense: {
          ...DEFAULT_AD_SETTINGS.adsense,
          ...(parsed.adsense || {}),
        },
        slots: {
          ...DEFAULT_AD_SLOTS,
          ...(parsed.slots || {}),
        },
      };
    }
  } catch {}
  return DEFAULT_AD_SETTINGS;
}

/**
 * Cache settings locally to prevent layout shifts on next visits
 */
export function cacheAdSettingsLocally(settings: AdSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

/**
 * Subscribe to realtime AdSettings from Firestore
 */
export function subscribeToAdSettings(onUpdate: (settings: AdSettings) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    const settingsDocRef = doc(db, 'settings', 'monetization');
    const unsubscribe = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<AdSettings>;
        const merged: AdSettings = {
          ...DEFAULT_AD_SETTINGS,
          ...data,
          adsense: {
            ...DEFAULT_AD_SETTINGS.adsense,
            ...(data.adsense || {}),
          },
          slots: {
            ...DEFAULT_AD_SLOTS,
            ...(data.slots || {}),
          },
        };
        cacheAdSettingsLocally(merged);
        onUpdate(merged);
      } else {
        // If document doesn't exist yet, emit default cached settings
        const current = getCachedAdSettings();
        onUpdate(current);
      }
    }, (error) => {
      console.warn('Realtime ad settings listener notice:', error.message);
      onUpdate(getCachedAdSettings());
    });

    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Save updated ad settings to Firestore and local cache
 */
export async function saveAdSettings(settings: AdSettings): Promise<void> {
  const payload: AdSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  cacheAdSettingsLocally(payload);

  try {
    const settingsDocRef = doc(db, 'settings', 'monetization');
    await setDoc(settingsDocRef, payload, { merge: true });
    
    // Broadcast event for active windows/components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adSettingsUpdated', { detail: payload }));
    }
  } catch (error) {
    console.error('Failed to save ad settings to Firestore:', error);
    throw error;
  }
}
