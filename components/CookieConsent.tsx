'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cookie, 
  ShieldCheck, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Lock, 
  Info,
  ExternalLink
} from 'lucide-react';
import { 
  getSavedConsent, 
  applyCookieConsent, 
  CookieConsentCategories, 
  CookieConsentData 
} from '../lib/cookie-manager';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function CookieConsent() {
  const mounted = useIsMounted();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showAuditTable, setShowAuditTable] = useState(false);

  // Category toggles state initialized lazily from saved consent if present
  const [categories, setCategories] = useState<CookieConsentCategories>(() => {
    if (typeof window !== 'undefined') {
      try {
        const existing = getSavedConsent();
        if (existing) {
          return existing.categories;
        }
      } catch {}
    }
    return {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: false,
    };
  });

  useEffect(() => {
    const existing = getSavedConsent();
    if (!existing) {
      // Small graceful delay so banner glides in smoothly after page render
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPreferencesModal) {
        setShowPreferencesModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreferencesModal]);

  // Listen for re-open requests (e.g. from footer link or privacy policy)
  useEffect(() => {
    const handleOpen = () => {
      const existing = getSavedConsent();
      if (existing) {
        setCategories(existing.categories);
      }
      setShowPreferencesModal(true);
    };

    window.addEventListener('openCookiePreferences', handleOpen);
    return () => window.removeEventListener('openCookiePreferences', handleOpen);
  }, []);

  if (!mounted) return null;

  const handleAcceptAll = () => {
    const consent: CookieConsentData = {
      status: 'accepted_all',
      timestamp: new Date().toISOString(),
      categories: {
        necessary: true,
        preferences: true,
        analytics: true,
        marketing: true,
      },
      version: 1,
    };
    applyCookieConsent(consent);
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleNecessaryOnly = () => {
    const consent: CookieConsentData = {
      status: 'necessary_only',
      timestamp: new Date().toISOString(),
      categories: {
        necessary: true,
        preferences: false,
        analytics: false,
        marketing: false,
      },
      version: 1,
    };
    applyCookieConsent(consent);
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleSavePreferences = () => {
    const consent: CookieConsentData = {
      status: 'custom',
      timestamp: new Date().toISOString(),
      categories: {
        ...categories,
        necessary: true,
      },
      version: 1,
    };
    applyCookieConsent(consent);
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  return (
    <>
      {/* 1. MAIN COOKIE CONSENT BANNER (International Standard Floating Card) */}
      {showBanner && !showPreferencesModal && (
        <div 
          role="region" 
          aria-label="কুকি ও গোপনীয়তা সম্মতি"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[440px] z-50 transition-all duration-300 transform translate-y-0"
        >
          <div className="p-5 sm:p-5 rounded-2xl bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--line)] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.7)] text-[var(--fg)]">
            
            {/* Header info */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                  <Cookie className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-bn font-bold text-base text-[var(--fg)] leading-snug">
                    কুকি ও গোপনীয়তা সেটিংস
                  </h3>
                  <span className="text-[11px] text-[var(--muted)] flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    আন্তর্জাতিক GDPR ও ePrivacy মানসম্মত
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNecessaryOnly}
                aria-label="শুধুমাত্র প্রয়োজনীয় রেখে বন্ধ করুন"
                className="text-[var(--faint)] hover:text-[var(--fg)] p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Concise international copy */}
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-3.5">
              আমরা আপনার ব্রাউজিং অভিজ্ঞতা সমৃদ্ধ করতে, সাইটের ট্রাফিক বুঝতে এবং থিম ও ফন্ট পছন্দ মনে রাখতে কুকি ব্যবহার করি। কোনো ব্যক্তিগত সংবেদনশীল তথ্য তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করা হয় না।
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-0.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="mag-btn primary !h-[38px] !px-4 !text-xs font-semibold whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>সব গ্রহণ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleNecessaryOnly}
                  className="h-[38px] px-4 text-xs font-semibold text-[var(--fg)] bg-[var(--bg-2)] hover:bg-[var(--line)] border border-[var(--line)] rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center"
                >
                  শুধুমাত্র প্রয়োজনীয়
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className="w-full h-[34px] text-[11px] font-medium text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-2)] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>পছন্দসমূহ কাস্টমাইজ করুন</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. ADVANCED COOKIE PREFERENCES MODAL */}
      {showPreferencesModal && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-5 sm:p-6 text-[var(--fg)] space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--line-2)] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="cookie-preferences-title" className="font-serif-bn font-bold text-base sm:text-lg text-[var(--fg)]">
                    কুকি পছন্দ ও গোপনীয়তা কেন্দ্র
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    আপনার ব্যক্তিগত গোপনীয়তার সম্পূর্ণ নিয়ন্ত্রণ আপনার হাতে।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-2)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation */}
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              যখন আপনি এই ওয়েবসাইটে আসেন, সাইটটির কার্যকারিতা ও আপনার পছন্দ মনে রাখতে ব্রাউজারে কিছু ক্ষুদ্র ডেটা (কুকি) সংরক্ষিত হয়। প্রয়োজনীয় কুকি ব্যতীত আপনি যেকোনো ক্যাটাগরি নিজের ইচ্ছা অনুযায়ী চালু বা বন্ধ রাখতে পারেন।
            </p>

            {/* Category Cards with Accessible Toggles */}
            <div className="space-y-3">
              
              {/* Category 1: Strictly Necessary */}
              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-2)]/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-[var(--fg)]">১. প্রয়োজনীয় কুকি (Strictly Necessary)</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-[var(--muted)]">
                      <Lock className="w-2.5 h-2.5" />
                      সর্বদা সক্রিয়
                    </span>
                  </div>
                  <div className="w-10 h-5 bg-emerald-600 rounded-full flex items-center justify-end px-1 opacity-80 cursor-not-allowed">
                    <div className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-[var(--muted)] leading-relaxed">
                  সাইটের মৌলিক নেভিগেশন, সিকিউরিটি রুলস, এবং অথেনটিকেশন সেশনের জন্য এই কুকি অপরিহার্য। এটি নিষ্ক্রিয় করা সম্ভব নয়।
                </p>
              </div>

              {/* Category 2: Functional / Preferences */}
              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs sm:text-sm text-[var(--fg)]">২. কার্যকারিতা ও পছন্দসমূহ (Functional & Preferences)</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={categories.preferences}
                    onClick={() => setCategories((prev) => ({ ...prev, preferences: !prev.preferences }))}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors px-1 cursor-pointer ${
                      categories.preferences ? 'bg-[var(--accent)] justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-[var(--muted)] leading-relaxed">
                  আপনার নির্বাচিত থিম মোড (ডার্ক/লাইট মোড), পড়ার ফন্ট সাইজ এবং ইন্টারফেস কনফিগারেশন মনে রাখতে এই কুকি কাজ করে।
                </p>
              </div>

              {/* Category 3: Analytics & Performance */}
              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs sm:text-sm text-[var(--fg)]">৩. অ্যানালিটিক্স ও পারফরম্যান্স (Analytics & Performance)</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={categories.analytics}
                    onClick={() => setCategories((prev) => ({ ...prev, analytics: !prev.analytics }))}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors px-1 cursor-pointer ${
                      categories.analytics ? 'bg-[var(--accent)] justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-[var(--muted)] leading-relaxed">
                  পাঠক কোন আর্টিকেল কত সময় পড়ছেন এবং সাইটের লোডিং গতি কেমন হচ্ছে তা সম্পূর্ণ বেনামে (Anonymous) পরিমাপ করে কনটেন্টের মান উন্নত করা হয়।
                </p>
              </div>

              {/* Category 4: Marketing & Updates */}
              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs sm:text-sm text-[var(--fg)]">৪. মার্কেটিং ও নিউজলেটার আপডেট (Communications)</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={categories.marketing}
                    onClick={() => setCategories((prev) => ({ ...prev, marketing: !prev.marketing }))}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors px-1 cursor-pointer ${
                      categories.marketing ? 'bg-[var(--accent)] justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-[var(--muted)] leading-relaxed">
                  নতুন লেখা প্রকাশের নোটিফিকেশন, নিউজলেটার রিমাইন্ডার এবং সোশ্যাল মিডিয়া শেয়ার ইন্টিগ্রেশন সমন্বয়ে সাহায্য করে।
                </p>
              </div>

            </div>

            {/* Expandable Technical Cookie Audit Table */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowAuditTable(!showAuditTable)}
                className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>ব্যবহৃত কুকিগুলোর পূর্ণাঙ্গ তালিকা ও মেয়াদ দেখুন</span>
                {showAuditTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAuditTable && (
                <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)] text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-2)] border-b border-[var(--line)] text-[var(--fg)] font-semibold">
                      <tr>
                        <th className="p-2.5">কুকি নাম</th>
                        <th className="p-2.5">ক্যাটাগরি</th>
                        <th className="p-2.5">মেয়াদ</th>
                        <th className="p-2.5">উদ্দেশ্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line-2)] text-[var(--muted)]">
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-[var(--fg)]">rs_consent_status</td>
                        <td className="p-2.5">প্রয়োজনীয়</td>
                        <td className="p-2.5">১ বছর</td>
                        <td className="p-2.5">আপনার কুকি সম্মতি ও নির্বাচন মনে রাখা</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-[var(--fg)]">rs_blog_theme</td>
                        <td className="p-2.5">কার্যকারিতা</td>
                        <td className="p-2.5">১ বছর</td>
                        <td className="p-2.5">ডার্ক/লাইট থিম মোড সংরক্ষণ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-[var(--fg)]">_rs_analytics_visitor_id</td>
                        <td className="p-2.5">অ্যানালিটিক্স</td>
                        <td className="p-2.5">১ বছর</td>
                        <td className="p-2.5">বেনামে রিডার ট্রাফিক ও আর্টিকেল পড়ার সময় নির্ধারণ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-[var(--fg)]">_rs_mkt_allowed</td>
                        <td className="p-2.5">মার্কেটিং</td>
                        <td className="p-2.5">১ বছর</td>
                        <td className="p-2.5">নিউজলেটার ও আপডেট সংশ্লিষ্ট স্ট্যাটাস</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[var(--line-2)] flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleNecessaryOnly}
                className="w-full sm:w-auto h-[38px] px-4 text-xs font-semibold text-[var(--fg)] hover:bg-[var(--bg-2)] border border-[var(--line)] rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              >
                শুধুমাত্র প্রয়োজনীয় রাখুন
              </button>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="w-full sm:w-auto h-[38px] px-4 text-xs font-semibold text-[var(--fg)] bg-[var(--bg-2)] hover:bg-[var(--line)] border border-[var(--line)] rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                >
                  পছন্দসমূহ সংরক্ষণ
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto mag-btn primary !h-[38px] !px-5 !text-xs font-semibold whitespace-nowrap cursor-pointer flex items-center justify-center"
                >
                  সব গ্রহণ করুন
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
