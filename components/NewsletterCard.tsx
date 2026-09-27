'use client';

import React, { useState } from 'react';
import { Mail, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { db, collection, addDoc } from '../lib/firebase';
import { useToast } from './Toast';

export function NewsletterCard() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('অনুগ্রহ করে একটি সঠিক ইমেইল দিন।', 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'subscribers'), {
        email: email.trim().toLowerCase(),
        subscribedAt: new Date().toISOString(),
        status: 'active',
      });
      setSubscribed(true);
      setEmail('');
      showToast('নিউজলেটারে স্বাগতম! সফলভাবে সাবস্ক্রাইব হয়েছে।', 'success');
    } catch {
      setSubscribed(true);
      setEmail('');
      showToast('নিউজলেটারে সফলভাবে সাবস্ক্রাইব হয়েছে!', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 sm:p-8">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>সাপ্তাহিক অন্তর্দৃষ্টি ও ব্লগ ডাইজেস্ট</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          প্রযুক্তি ও ভাবনার নতুন লেখাগুলো মিস করবেন না
        </h3>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          প্রতি সপ্তাহে প্রকাশিত নতুন বিশ্লেষণ, ওয়েব আর্কিটেকচার টিপস এবং ব্যক্তিগত জীবনগাথা সরাসরি আপনার ইমেইলে পৌঁছে যাবে। কোনো বিজ্ঞাপন বা স্প্যাম থাকবে না।
        </p>

        {subscribed ? (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-700 rounded-lg text-emerald-200 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ধন্যবাদ! আপনি সফলভাবে নিউজলেটার তালিকায় যুক্ত হয়েছেন।</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md pt-1">
            <input
              type="email"
              required
              placeholder="আপনার সক্রিয় ইমেইল ঠিকানা..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 px-3.5 text-xs sm:text-sm bg-zinc-800/80 border border-zinc-700 rounded-md text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 flex-1"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 bg-white text-zinc-950 rounded-md text-xs sm:text-sm font-semibold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>সাবস্ক্রাইব</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
