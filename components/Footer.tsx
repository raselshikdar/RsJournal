'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Check, Loader2, Send, ChevronDown } from 'lucide-react';
import { db, collection, addDoc, auth } from '../lib/firebase';
import { useToast } from './Toast';

interface FooterProps {
  onNavigate: (viewId: string) => void;
  openAdmin: () => void;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const { showToast } = useToast();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroup((prev) => (prev === groupId ? null : groupId));
  };

  const footerDeptCategories = [
    { id: 'f-ds', name: 'ডেটা সায়েন্স', slug: 'data-science', children: [] },
    {
      id: 'f-prog',
      name: 'কম্পিউটার প্রোগ্রামিং',
      slug: 'computer-programming',
      children: [{ id: 'f-sub-python', name: 'পাইথন', slug: 'python' }],
    },
    {
      id: 'f-tech',
      name: 'প্রযুক্তি কথন',
      slug: 'tech-gossip',
      children: [
        { id: 'f-sub-social', name: 'সোশ্যাল মিডিয়া', slug: 'social-media' },
        { id: 'f-sub-marketing', name: 'মার্কেটিং', slug: 'marketing' },
        { id: 'f-sub-blogging', name: 'ব্লগিং', slug: 'blogging' },
        { id: 'f-sub-trends', name: 'ট্রেন্ডস্‌', slug: 'trends' },
        { id: 'f-sub-learn', name: 'লার্ন উইদ ডিজিটাল', slug: 'learn-with-digital' },
      ],
    },
    { id: 'f-ai', name: 'এআই ভয়েস', slug: 'artificial-intelligence', children: [] },
    {
      id: 'f-research',
      name: 'রিসার্চ',
      slug: 'research',
      children: [
        { id: 'f-sub-stata', name: 'স্ট্যাটা (STATA)', slug: 'stata' },
        { id: 'f-sub-kobo', name: 'কোবো টুলবক্স (Kobo Toolbox)', slug: 'kobo-toolbox' },
      ],
    },
    { id: 'f-diversified', name: 'বিবিধ', slug: 'diversified', children: [] },
  ];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newsletterEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length > 150) {
      showToast('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।', 'error');
      return;
    }

    setSubmitting(true);
    const path = 'subscribers';
    try {
      await addDoc(collection(db, path), {
        email: cleanEmail,
        subscribedAt: new Date().toISOString(),
        status: 'active' as const,
      });

      setIsSubscribed(true);
      setNewsletterEmail('');
      showToast('নিউজলেটারে সফলভাবে সাবস্ক্রাইব করা হয়েছে! ধন্যবাদ।', 'success');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch {
        // Fallback friendly user feedback
      }
      showToast('সাবস্ক্রিপশনে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="mag-footer border-t border-[var(--line)] bg-[var(--bg-2)] pt-12 pb-8 mt-16 transition-colors">
      <div className="mag-container space-y-12">
        
        {/* Newsletter Subscription Section */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Newsletter Copy */}
            <div className="lg:col-span-6 space-y-2">
              <span className="mag-chip text-xs">
                নিউজলেটার সাবস্ক্রিপশন
              </span>
              <h3 className="font-serif-bn text-xl sm:text-2xl font-bold text-[var(--fg)] tracking-tight">
                নতুন লেখার আপডেট সরাসরি ইনবক্সে পেতে চান?
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xl">
                প্রযুক্তি, কৃত্রিম বুদ্ধিমত্তা, গবেষণা ও ডেভেলপমেন্ট সম্পর্কিত নতুন নিবন্ধ ও বিশ্লেষণ প্রকাশিত হওয়ামাত্র পড়তে আমাদের ফ্রি নিউজলেটারে যুক্ত থাকুন।
              </p>
            </div>

            {/* Newsletter Form */}
            <div className="lg:col-span-6">
              {isSubscribed ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium">
                    আপনি সফলভাবে সাবস্ক্রাইব করেছেন! প্রতিটি নতুন লেখার আপডেট এখন সরাসরি আপনার ইমেইলে পৌঁছে যাবে।
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--faint)]" />
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="আপনার ইমেইল ঠিকানা লিখুন..."
                      maxLength={150}
                      className="w-full h-11 pl-10 pr-3 text-sm bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--faint)] border border-[var(--line)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors"
                      disabled={submitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mag-btn primary !h-11 !px-5 !text-sm whitespace-nowrap shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>যুক্ত হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>সাবস্ক্রাইব করুন</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </section>

        {/* Main 4-column Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-[var(--line-2)]">
          
          {/* Column 1: Brand & Bio (4 cols) */}
          <div className="lg:col-span-4 space-y-3.5">
            <button
              onClick={() => onNavigate('home')}
              className="mag-logo text-left cursor-pointer"
            >
              <span>সোহানুর</span>&nbsp;<b>রহমান</b>
              <span className="text-xs font-bold text-[var(--accent)] ml-1.5 uppercase tracking-widest hidden sm:inline-block">
                জার্নাল
              </span>
            </button>
            <p className="text-[15px] sm:text-base text-[var(--muted)] leading-relaxed max-w-sm">
              প্রযুক্তি, গবেষণা, সফটওয়্যার আর্কিটেকচার, ডিজিটাল সংস্কৃতি ও সমসাময়িক ভাবনা নিয়ে একটি স্বাধীন বাংলা জার্নাল।
            </p>
          </div>

          {/* Column 2: বিভাগ (Categories) (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-base font-bold font-serif-bn text-[var(--fg)] tracking-wide">
              বিভাগ
            </h4>
            <ul className="space-y-2.5 text-[15px] sm:text-base font-medium text-[var(--muted)]">
              <li>
                <button
                  onClick={() => onNavigate('tech-gossip')}
                  className="hover:text-[var(--accent)] transition-colors text-left"
                >
                  প্রযুক্তি কথন
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('computer-programming')}
                  className="hover:text-[var(--accent)] transition-colors text-left"
                >
                  কম্পিউটার প্রোগ্রামিং
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('artificial-intelligence')}
                  className="hover:text-[var(--accent)] transition-colors text-left"
                >
                  এআই ভয়েস
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('research')}
                  className="hover:text-[var(--accent)] transition-colors text-left"
                >
                  রিসার্চ
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('diversified')}
                  className="hover:text-[var(--accent)] transition-colors text-left"
                >
                  বিবিধ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: লিংকস (Quick Links) (2.5 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-base font-bold font-serif-bn text-[var(--fg)] tracking-wide">
              লিংকস
            </h4>
            <ul className="space-y-2.5 text-[15px] sm:text-base font-medium text-[var(--muted)]">
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-[var(--accent)] transition-colors text-left flex items-center gap-1.5"
                >
                  <span>আমার সম্পর্কে</span>
                  <span className="text-sm">↗</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('gallery')}
                  className="hover:text-[var(--accent)] transition-colors text-left flex items-center gap-1.5"
                >
                  <span>ফটোগ্রাফি</span>
                  <span className="text-sm">↗</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('articles')}
                  className="hover:text-[var(--accent)] transition-colors text-left flex items-center gap-1.5"
                >
                  <span>সকল লেখা</span>
                  <span className="text-sm">↗</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('search')}
                  className="hover:text-[var(--accent)] transition-colors text-left flex items-center gap-1.5"
                >
                  <span>লেখা খুঁজুন</span>
                  <span className="text-sm">↗</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-[var(--accent)] transition-colors text-left flex items-center gap-1.5"
                >
                  <span>প্রাইভেসি পলিসি</span>
                  <span className="text-sm">↗</span>
                </button>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
                >
                  <span>সিএমএস</span>
                  <span className="text-sm">↗</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: যোগাযোগ (Contact) (2.5 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-base font-bold font-serif-bn text-[var(--fg)] tracking-wide">
              যোগাযোগ
            </h4>
            <ul className="space-y-2.5 text-[15px] sm:text-base font-medium text-[var(--muted)]">
              <li>
                <a
                  href="mailto:suhanurrahman.r@gmail.com"
                  className="hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
                >
                  <span>Email</span>
                  <span className="text-sm">↗</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[var(--accent)] transition-colors flex items-center gap-1.5 text-left"
                >
                  <span>বার্তা পাঠান</span>
                  <span className="text-sm">↗</span>
                </button>
              </li>
              <li>
                <a
                  href="https://suhanurrahman.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
                >
                  <span>Website</span>
                  <span className="text-sm">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://suhanurrahman.com/contact/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
                >
                  <span>Contact</span>
                  <span className="text-sm">↗</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[var(--muted)] font-medium">
          <span>© {currentYear} সোহানুর রহমান</span>
          <span>Independent journal · Bangladesh</span>
        </div>

      </div>
    </footer>
  );
}
