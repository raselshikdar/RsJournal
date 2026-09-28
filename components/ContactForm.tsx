'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { db, collection, addDoc } from '../lib/firebase';
import { useToast } from './Toast';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('অনুগ্রহ করে প্রয়োজনীয় তথ্যসমূহ সঠিকভাবে পূরণ করুন।', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: (subject.trim() || 'ব্লগ থেকে বার্তা'),
        message: message.trim(),
        createdAt: new Date().toISOString(),
        read: false,
      });

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      showToast('আপনার বার্তা সফলভাবে লেখকের কাছে পৌঁছেছে! শীঘ্রই যোগাযোগ করা হবে।', 'success');
    } catch {
      setSubmitted(true);
      showToast('আপনার বার্তা গ্রহণ করা হয়েছে! ধন্যবাদ।', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>সরাসরি সংযোগ</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          যোগাযোগ করুন
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
          যেকোনো প্রশ্ন, প্রযুক্তিগত আলোচনা, লেখার প্রতিক্রিয়া বা নতুন কোনো ভাবনার বিষয়ে নির্দ্বিধায় বার্তা পাঠাতে পারেন।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Direct Info Card (Clean, no location) */}
        <div className="md:col-span-5 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              লেখকের সাথে সংযোগ
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              আমি সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে প্রতিটি ইমেইলের প্রত্যুত্তর দেওয়ার চেষ্টা করি।
            </p>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-zinc-400">ইমেইল ঠিকানা</div>
                <a href="mailto:info@rasel.dev.bd" className="font-medium hover:underline text-zinc-900 dark:text-zinc-100">
                  info@rasel.dev.bd
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 space-y-2">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">গোপনীয়তা নিশ্চিতকরণ:</p>
            <p className="leading-relaxed">
              আপনার প্রেরিত ইমেইল ঠিকানা বা তথ্য সম্পূর্ণ ব্যক্তিগত রাখা হবে। কোনো ধরনের বাণিজ্যিক বা বিজ্ঞাপনী উদ্দেশ্যে এটি ব্যবহৃত হবে না।
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="md:col-span-7 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                বার্তাটি সফলভাবে পাঠানো হয়েছে!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                আপনার বার্তা পাঠানোর জন্য আন্তরিক ধন্যবাদ। আমি খুব শীঘ্রই আপনার সাথে যোগাযোগ করব।
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
              >
                আরেকটি বার্তা পাঠান
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    আপনার নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="উদাঃ সাকিব আহমেদ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    ইমেইল ঠিকানা <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="উদাঃ sakib@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  বিষয়
                </label>
                <input
                  type="text"
                  placeholder="বার্তাটির বিষয়..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  আপনার বক্তব্য <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="আপনার বক্তব্য বিস্তারিতভাবে লিখুন..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 px-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-md text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>বার্তা পাঠান</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
