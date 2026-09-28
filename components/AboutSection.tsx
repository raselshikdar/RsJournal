'use client';

import React from 'react';

interface AboutSectionProps {
  onContactClick?: () => void;
  onSearchClick?: () => void;
}

export function AboutSection({ onContactClick, onSearchClick }: AboutSectionProps) {
  return (
    <div className="about-layout">
      {/* Left Article Area */}
      <article className="reveal">
        <div className="about-kicker">About / পরিচিতি</div>
        <h1 className="about-title font-serif-bn">রাসেল শিকদার</h1>
        <p className="about-lead font-serif-bn">
          ফুল-স্ট্যাক ওয়েব ডেভেলপার ও ক্রিয়েটিভ টেকনোলজিস্ট। React, TypeScript, আধুনিক ওয়েব আর্কিটেকচার এবং ডিজিটাল ইনোভেশন নিয়ে কাজ করি। এই জার্নাল আমার শেখা, ভাবনা, গবেষণা আর কাজের নোট রাখার একটি স্বাধীন জায়গা।
        </p>

        <div className="about-body space-y-5">
          <p>
            আমি রাসেল শিকদার — বিগত ৫+ বছর ধরে সফটওয়্যার ডেভেলপমেন্ট ও ওয়েব প্ল্যাটফর্মে কাজ করছি। জটিল টেকনিক্যাল সমস্যার মার্জিত ও ইউজার-ফ্রেন্ডলি ডিজিটাল সমাধান গড়ে তোলাই আমার মূল প্যাশন।
          </p>
          <p>
            এই টেক জার্নালে আমি আধুনিক ওয়েব প্রযুক্তি, রিঅ্যাক্ট ও নেক্সট.জেএস আর্কিটেকচার, পারফরম্যান্স অপ্টিমাইজেশন, এআই গবেষণা, সাইবার সিকিউরিটি এবং নিজের প্র্যাকটিক্যাল ডেভেলপমেন্ট অভিজ্ঞতা প্রাঞ্জল বাংলায় তুলে ধরি।
          </p>
          <p>
            আমার প্রজেক্ট ও পোর্টফোলিও সম্পর্কে আরও বিস্তারিত জানতে ভিজিট করুন{' '}
            <a href="https://rasel.dev.bd" target="_blank" rel="noreferrer" className="text-[var(--accent)] underline underline-offset-3 font-semibold">
              rasel.dev.bd
            </a>{' '}
            অথবা সরাসরি যোগাযোগ করতে{' '}
            {onContactClick ? (
              <button
                type="button"
                onClick={onContactClick}
                className="text-[var(--accent)] underline underline-offset-3 cursor-pointer font-semibold"
              >
                বার্তা পাঠান
              </button>
            ) : (
              <a href="mailto:info@rasel.dev.bd" className="text-[var(--accent)] underline underline-offset-3 font-semibold">যোগাযোগ করুন</a>
            )}
            ।
          </p>
        </div>
      </article>

      {/* Right Sticky Sidebar */}
      <aside className="about-side reveal">
        <div className="about-card">
          <h2>যে বিষয়গুলো নিয়ে লিখি</h2>
          <p>ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট, React, TypeScript, Next.js, ক্লাউড, এআই ও ডিজিটাল সংস্কৃতি।</p>
        </div>

        <div className="about-card">
          <h2>অনলাইনে</h2>
          <div className="about-links">
            <a href="https://rasel.dev.bd" target="_blank" rel="noreferrer">
              Portfolio (rasel.dev.bd) ↗
            </a>
            <a href="https://github.com/raselshikdar" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a href="https://linkedin.com/in/raselshikdar" target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <a href="https://twitter.com/raselshikdar_" target="_blank" rel="noreferrer">
              X (Twitter) ↗
            </a>
            <a href="https://facebook.com/raselverse" target="_blank" rel="noreferrer">
              Facebook ↗
            </a>
            {onSearchClick && (
              <button type="button" onClick={onSearchClick} className="text-left">
                জার্নাল সার্চ ↗
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
