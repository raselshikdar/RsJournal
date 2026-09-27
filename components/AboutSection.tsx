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
        <div className="about-kicker">About</div>
        <h1 className="about-title font-serif-bn">সোহানুর রহমান</h1>
        <p className="about-lead font-serif-bn">
          প্রযুক্তি, গবেষণা, ডেটা, ডিজিটাল সংস্কৃতি এবং লেখালেখি নিয়ে কাজ করি। এই জার্নাল আমার শেখা, ভাবনা, অনুসন্ধান আর কাজের নোট রাখার একটি স্বাধীন জায়গা।
        </p>

        <div className="about-body space-y-5">
          <p>
            আমি প্রযুক্তি ও গবেষণার মাঝের জায়গাটায় বেশি স্বচ্ছন্দ। ওয়েব, ডেটা, ডিজিটাল টুল এবং গবেষণাভিত্তিক কাজের মাধ্যমে জটিল বিষয়কে ব্যবহারযোগ্য ও বোধগম্য করে তোলার চেষ্টা করি।
          </p>
          <p>
            এই জার্নালে আমি প্রযুক্তি ও এআই, গবেষণা ও ডেটা, ডিজিটাল সংস্কৃতি, অনুসন্ধান এবং নিজের কাজ থেকে পাওয়া অভিজ্ঞতা নিয়ে লিখি। সব লেখা একই ধরনের নয়, তবে একটি বিষয় গুরুত্বপূর্ণ: কৌতূহল, প্রমাণ এবং নিজের মতো করে ভাবার জায়গা।
          </p>
          <p>
            আমার পেশাগত কাজ ও অন্যান্য প্রজেক্ট সম্পর্কে জানতে{' '}
            <a href="https://suhanurrahman.com/" target="_blank" rel="noreferrer">
              suhanurrahman.com
            </a>{' '}
            দেখতে পারেন। অথবা সরাসরি যোগাযোগ করতে{' '}
            {onContactClick ? (
              <button
                type="button"
                onClick={onContactClick}
                className="text-[var(--accent)] underline underline-offset-3 cursor-pointer"
              >
                বার্তা পাঠান
              </button>
            ) : (
              <a href="mailto:rsblog597@gmail.com">যোগাযোগ করুন</a>
            )}
            ।
          </p>
        </div>
      </article>

      {/* Right Sticky Sidebar */}
      <aside className="about-side reveal">
        <div className="about-card">
          <h2>যে বিষয়গুলো নিয়ে লিখি</h2>
          <p>প্রযুক্তি, এআই, গবেষণা, ডেটা, ডিজিটাল সংস্কৃতি, অনুসন্ধান ও ওয়েব।</p>
        </div>

        <div className="about-card">
          <h2>অনলাইনে</h2>
          <div className="about-links">
            <a href="https://suhanurrahman.com/" target="_blank" rel="noreferrer">
              Portfolio ↗
            </a>
            {onSearchClick && (
              <button type="button" onClick={onSearchClick}>
                জার্নাল সার্চ ↗
              </button>
            )}
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
