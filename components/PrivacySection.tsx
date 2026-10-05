'use client';

import React from 'react';
import { openCookiePreferences } from '../lib/cookie-manager';

interface PrivacySectionProps {
  onContactClick?: () => void;
  onHomeClick?: () => void;
}

export function PrivacySection({ onContactClick, onHomeClick }: PrivacySectionProps) {
  return (
    <div className="privacy-wrap reveal">
      {/* Breadcrumb List */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-[var(--muted)]" aria-label="Breadcrumb">
        <button 
          onClick={onHomeClick} 
          className="hover:text-[var(--fg)] transition-colors cursor-pointer"
        >
          হোম
        </button>
        <span>/</span>
        <span className="text-[var(--fg)] font-medium">প্রাইভেসি পলিসি</span>
      </nav>

      <article className="privacy-body">
        <div className="privacy-kicker">Privacy</div>
        <h1 className="privacy-title font-serif-bn">প্রাইভেসি পলিসি</h1>
        <p className="privacy-updated">সর্বশেষ হালনাগাদ: ১৪ সেপ্টেম্বর ২০২৬</p>

        <section>
          <h2>এই নীতিমালা সম্পর্কে</h2>
          <p>
            রাসেল শিকদার | জার্নাল একটি ব্যক্তিগত প্রকাশনা প্ল্যাটফর্ম। এখানে আপনার গোপনীয়তা সম্মান করা হয় এবং প্রয়োজনের বাইরে ব্যক্তিগত তথ্য সংগ্রহ বা ব্যবহার না করার নীতি অনুসরণ করা হয়।
          </p>
        </section>

        <section>
          <h2>আমরা কী তথ্য পাই</h2>
          <p>
            আপনি সাইটে মন্তব্য করলে বা নিউজলেটারে যুক্ত হলে আপনার দেওয়া নাম, ইমেইল এবং মন্তব্যের তথ্য পাওয়া যেতে পারে। ইমেইলটি সর্বসাধারণের জন্য প্রকাশ না করে সুরক্ষিত রাখা হয় এবং মন্তব্য প্রকাশের আগে বিবেচনা করা হয়।
          </p>
          <p>
            জার্নালের থিম পছন্দ (ডার্ক/লাইট মোড) এবং ব্যবহারকারীর সুবিধার কিছু ফিচার আপনার ব্রাউজারের স্থানীয় স্টোরেজ (local storage) ব্যবহার করতে পারে। এগুলো সম্পূর্ণ আপনার ডিভাইসেই সংরক্ষিত থাকে।
          </p>
        </section>

        <section>
          <h2>কুকি ও ডিজিটাল প্রিফারেন্স নীতিমালা</h2>
          <p>
            আমরা আন্তর্জাতিক GDPR ও ePrivacy নীতিমালার সম্পূর্ণ প্রতিপালন করি। আপনি সাইটে প্রবেশ করার পর কুকি পছন্দ নির্ধারণ করতে পারেন। প্রয়োজনীয় কুকি ব্যতীত অন্যান্য ক্যাটাগরি (যেমন অ্যানালিটিক্স বা পার্সোনালাইজেশন) আপনি যেকোনো সময় চালু বা বন্ধ করতে পারেন।
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => openCookiePreferences()}
              className="mag-btn !h-[38px] !px-4 !text-xs font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer border border-[var(--line)] bg-[var(--bg-2)] hover:bg-[var(--line)] text-[var(--fg)] transition-colors"
            >
              <span>⚙ কুকি পছন্দ ও সেটিংস পরিবর্তন করুন</span>
            </button>
          </div>
        </section>

        <section>
          <h2>তথ্য কীভাবে ব্যবহার করা হয়</h2>
          <ul>
            <li>মন্তব্য পর্যালোচনা ও প্রকাশের জন্য</li>
            <li>নতুন লেখার আপডেট ও নিউজলেটার প্রেরণের জন্য (যদি সাবস্ক্রাইব করে থাকেন)</li>
            <li>সাইটের প্রয়োজনীয় ফিচার পরিচালনা ও সাইট পারফরম্যান্স বজায় রাখার জন্য</li>
            <li>সাইটের নিরাপত্তা ও অনাকাঙ্ক্ষিত স্প্যাম প্রতিরোধ করার জন্য</li>
          </ul>
        </section>

        <section>
          <h2>তথ্য শেয়ার করা</h2>
          <p>
            আপনার ব্যক্তিগত তথ্য বিক্রি, বিপণন বা বাণিজ্যিক উদ্দেশ্যে কোনো তৃতীয় পক্ষের কাছে হস্তান্তরের উদ্দেশ্য এই জার্নালের নেই। প্রযোজ্য আইনগত বাধ্যবাধকতা ছাড়া কোনো তথ্য কারো সাথে শেয়ার করা হয় না।
          </p>
        </section>

        <section>
          <h2>তৃতীয় পক্ষের লিংক</h2>
          <p>
            এই জার্নালে পোর্টফলিও, সামাজিক যোগাযোগমাধ্যম (GitHub, LinkedIn) বা বাহ্যিক ওয়েবসাইটের লিংক থাকতে পারে। ওই সাইটগুলোর নিজস্ব প্রাইভেসি পলিসি ও নীতিমালা প্রযোজ্য হবে।
          </p>
        </section>

        <section>
          <h2>যোগাযোগ</h2>
          <p>
            প্রাইভেসি বা আপনার তথ্য নিয়ে কোনো প্রশ্ন থাকলে{' '}
            <button
              onClick={onContactClick}
              className="text-[var(--accent)] underline underline-offset-3 cursor-pointer"
            >
              যোগাযোগ পেজে
            </button>{' '}
            বার্তা পাঠাতে পারেন।
          </p>
        </section>
      </article>
    </div>
  );
}
