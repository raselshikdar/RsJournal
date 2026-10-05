'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, Layout } from 'lucide-react';
import { 
  AdSlotConfig, 
  AdSettings, 
  getCachedAdSettings, 
  subscribeToAdSettings 
} from '../lib/ad-manager';

interface AdBannerProps {
  slotId: string;
  className?: string;
  previewMode?: boolean;
  overrideConfig?: AdSlotConfig;
}

export function AdBanner({ 
  slotId, 
  className = '', 
  previewMode = false,
  overrideConfig 
}: AdBannerProps) {
  const [settings, setSettings] = useState<AdSettings>(() => getCachedAdSettings());
  const [isAdBlockBlocked, setIsAdBlockBlocked] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const adsbygooglePushed = useRef(false);

  useEffect(() => {
    if (overrideConfig) return;
    const unsubscribe = subscribeToAdSettings((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, [overrideConfig]);

  const slotConfig = overrideConfig || settings.slots[slotId];
  const isMasterEnabled = settings.enabled;
  const isSlotEnabled = slotConfig?.enabled ?? false;
  const isTestMode = settings.adsense.testMode || previewMode;

  const shouldRender = isTestMode || (isMasterEnabled && isSlotEnabled);

  // Initialize Google AdSense for adsense type slots
  useEffect(() => {
    if (!shouldRender || slotConfig?.type !== 'adsense') return;
    if (adsbygooglePushed.current) return;

    try {
      if (typeof window !== 'undefined') {
        const win = window as unknown as { adsbygoogle?: unknown[] };
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({});
        adsbygooglePushed.current = true;
      }
    } catch (err) {
      console.warn('Google AdSense render attempt notice:', err);
      setTimeout(() => {
        setIsAdBlockBlocked(true);
      }, 0);
    }
  }, [shouldRender, slotConfig?.type, slotConfig?.adSlot]);

  if (!shouldRender || !slotConfig) {
    return null;
  }

  // 1. TEST MODE / PREVIEW PLACEHOLDER
  if (isTestMode && (!isSlotEnabled || !isMasterEnabled || (slotConfig.type === 'adsense' && !slotConfig.adSlot))) {
    return (
      <div 
        className={`my-6 mx-auto w-full max-w-4xl p-3 sm:p-4 rounded-xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 text-center transition-all ${className}`}
        aria-label="বিজ্ঞাপন স্লট প্রিভিউ"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-[var(--accent)]/15 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider font-mono">
              [ বিজ্ঞাপন প্লেসহোল্ডার / প্রিভিউ মোড ]
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--muted)]">
            স্লট আইডি: <span className="text-[var(--fg)] font-semibold">{slotId}</span> ({slotConfig.name})
          </span>
        </div>

        <div className="py-5 px-3 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
            <Layout className="w-4 h-4 text-[var(--accent)]" />
            <span>ধরন: <strong className="text-[var(--fg)]">{slotConfig.type.toUpperCase()}</strong></span>
            <span className="opacity-40">·</span>
            <span>ফরমেট: <strong className="text-[var(--fg)]">{slotConfig.adFormat || 'responsive'}</strong></span>
            <span className="opacity-40">·</span>
            <span>স্ট্যাটাস: <strong className={isSlotEnabled ? 'text-emerald-600' : 'text-zinc-500'}>{isSlotEnabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}</strong></span>
          </div>
          <p className="text-[11px] text-[var(--muted)] max-w-md text-center leading-relaxed">
            লাইভ সাইটে অ্যাডসেন্স অনুমোদনের পর এখানে গুগল বিজ্ঞাপন বা কাস্টম ব্যানার স্বয়ংক্রিয়ভাবে লোড হবে।
          </p>
        </div>
      </div>
    );
  }

  // 2. GOOGLE ADSENSE AD UNIT
  if (slotConfig.type === 'adsense') {
    const publisherId = slotConfig.adClient || settings.adsense.publisherId;
    const adSlot = slotConfig.adSlot;

    if (!publisherId || !adSlot) {
      if (isTestMode) {
        return (
          <div className={`my-5 mx-auto w-full max-w-3xl p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-center ${className}`}>
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest block mb-1">বিজ্ঞাপন · Google AdSense</span>
            <p className="text-xs text-[var(--muted)] font-mono">
              অ্যাডসেন্স স্লট আইডি বা পাবলিশার আইডি কনফিগার করা বাকি। (Slot: {slotId})
            </p>
          </div>
        );
      }
      return null;
    }

    return (
      <div 
        ref={adRef}
        className={`my-6 mx-auto w-full max-w-4xl text-center overflow-hidden transition-all ${className}`}
        aria-label="গুগল অ্যাডসেন্স বিজ্ঞাপন"
      >
        {/* Subtle unboxed metadata label */}
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="text-[10px] font-medium tracking-widest uppercase text-[var(--muted)]/80 select-none">
            বিজ্ঞাপন · ADVERTISEMENT
          </span>
        </div>

        <div className="min-h-[90px] sm:min-h-[100px] flex items-center justify-center bg-[var(--bg-2)]/30 rounded-xl border border-[var(--line-2)] p-1">
          {isAdBlockBlocked ? (
            <div className="py-4 text-xs text-[var(--muted)]">
              বিজ্ঞাপনটি দেখতে ব্রাউজারের অ্যাডব্লকার সাময়িকভাবে বন্ধ করতে পারেন।
            </div>
          ) : (
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client={publisherId}
              data-ad-slot={adSlot}
              data-ad-format={slotConfig.adFormat || 'auto'}
              data-full-width-responsive="true"
            />
          )}
        </div>
      </div>
    );
  }

  // 3. CUSTOM BANNER / AFFILIATE / SPONSOR AD
  if (slotConfig.type === 'custom_banner') {
    if (!slotConfig.imageUrl) return null;

    return (
      <div 
        className={`my-6 mx-auto w-full max-w-4xl text-center transition-all ${className}`}
        aria-label="স্পনসরড বিজ্ঞাপন"
      >
        {/* Header label */}
        <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-1.5 px-1 font-medium select-none">
          <span className="uppercase tracking-widest">
            {slotConfig.sponsorName ? `স্পনসরড: ${slotConfig.sponsorName}` : 'বিজ্ঞাপন · SPONSORED'}
          </span>
          <span className="text-[10px] opacity-70 flex items-center gap-1">
            <span>বিজ্ঞাপন</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Banner Clickable Image */}
        <a
          href={slotConfig.targetUrl || '#'}
          target={slotConfig.openInNewTab !== false ? '_blank' : '_self'}
          rel="sponsored nofollow noopener noreferrer"
          className="group block relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all shadow-xs"
        >
          <img
            src={slotConfig.imageUrl}
            alt={slotConfig.altText || slotConfig.sponsorName || 'স্পনসর বিজ্ঞাপন'}
            className="w-full h-auto max-h-[140px] sm:max-h-[180px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
            loading="lazy"
          />
        </a>
      </div>
    );
  }

  // 4. CUSTOM HTML / THIRD PARTY SCRIPT AD
  if (slotConfig.type === 'html_script') {
    if (!slotConfig.customHtml) return null;

    return (
      <div 
        className={`my-6 mx-auto w-full max-w-4xl text-center transition-all ${className}`}
        aria-label="কাস্টম বিজ্ঞাপন"
      >
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="text-[10px] font-medium tracking-widest uppercase text-[var(--muted)] select-none">
            বিজ্ঞাপন · ADVERTISEMENT
          </span>
        </div>

        <div 
          className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 min-h-[90px] flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: slotConfig.customHtml }}
        />
      </div>
    );
  }

  return null;
}
