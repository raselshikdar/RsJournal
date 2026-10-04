'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg,#ffffff)] text-[var(--fg,#16130f)] p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl border border-[var(--line,#e7e7e4)] bg-[var(--surface,#ffffff)] shadow-lg space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">
          !
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif-bn text-[var(--fg,#16130f)]">
          পৃষ্ঠাটি লোড হতে সমস্যা হয়েছে
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted,#62626a)] leading-relaxed">
          সাময়িক টেকনিক্যাল ত্রুটির কারণে পেজটি প্রদর্শনে অসুবিধা হচ্ছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            পুনরায় চেষ্টা করুন
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="px-5 py-2.5 border border-[var(--line,#e7e7e4)] hover:bg-[var(--bg-2,#f6f6f4)] text-[var(--fg,#16130f)] rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            হোমপেজে যান
          </button>
        </div>
      </div>
    </div>
  );
}
