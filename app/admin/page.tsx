'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Mail, 
  Users, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Save, 
  Check, 
  Zap, 
  ExternalLink,
  Lock
} from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/Toast';
import { Post, ContactMessage, Subscriber, SeoOptimizationResult } from '../../lib/types';
import { INITIAL_POSTS } from '../../lib/sample-data';
import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  ADMIN_EMAIL
} from '../../lib/firebase';

export default function AdminPage() {
  const { user, isAdmin, loading, loginWithGoogle, logout, isDemoAdmin, toggleDemoAdmin } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'editor' | 'messages' | 'subscribers'>('overview');

  // Post editor state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('technology');
  const [formTags, setFormTags] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80');
  const [formContent, setFormContent] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  const [savingPost, setSavingPost] = useState(false);

  // Gemini AI SEO State
  const [optimizingSeo, setOptimizingSeo] = useState(false);
  const [seoResult, setSeoResult] = useState<SeoOptimizationResult | null>(null);

  // Messages & Subscribers
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // Load Firestore data
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Post[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Post));
          setPosts(list);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Posts sync note:', e);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    try {
      getDocs(query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'))).then((snap) => {
        const list: ContactMessage[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ContactMessage));
        setMessages(list);
      }).catch(() => {});

      getDocs(collection(db, 'subscribers')).then((snap) => {
        const list: Subscriber[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Subscriber));
        setSubscribers(list);
      }).catch(() => {});
    } catch {
      // Ignored
    }
  }, [isAdmin]);

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingPostId) {
      const generated = val
        .toLowerCase()
        .replace(/[^\w\s\u0980-\u09FF-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setFormSlug(generated || 'new-post');
    }
  };

  const handleStartCreate = () => {
    setEditingPostId(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategory('technology');
    setFormTags('প্রযুক্তি, কোডিং, ওয়েব');
    setFormExcerpt('');
    setFormCoverImage('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80');
    setFormContent('## নতুন পোস্টের শিরোনাম\n\nএখানে বিস্তারিত লিখুন...');
    setFormPublished(true);
    setFormSeoTitle('');
    setFormSeoDescription('');
    setSeoResult(null);
    setActiveTab('editor');
  };

  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id);
    setFormTitle(post.title);
    setFormSlug(post.slug);
    setFormCategory(post.category);
    setFormTags(post.tags?.join(', ') || '');
    setFormExcerpt(post.excerpt);
    setFormCoverImage(post.coverImage);
    setFormContent(post.content);
    setFormPublished(post.published);
    setFormSeoTitle(post.seoTitle || '');
    setFormSeoDescription(post.seoDescription || '');
    setSeoResult(null);
    setActiveTab('editor');
  };

  // Gemini 3.1 Flash-Lite AI SEO Optimizer
  const handleOptimizeWithAI = async () => {
    if (!formTitle && !formContent) {
      showToast('অনুগ্রহ করে অন্তত শিরোনাম অথবা কনটেন্ট লিখুন।', 'error');
      return;
    }

    setOptimizingSeo(true);
    try {
      const res = await fetch('/api/seo-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          category: formCategory,
        }),
      });

      if (!res.ok) throw new Error('API Error');

      const data: SeoOptimizationResult = await res.json();
      setSeoResult(data);
      showToast('Gemini 3.1 Flash-Lite দিয়ে এসইও বিশ্লেষণ সম্পন্ন!', 'success');
    } catch {
      setSeoResult({
        seoTitle: `${formTitle.slice(0, 55)} | RS Blog`,
        seoDescription: formExcerpt.slice(0, 150) || `${formTitle} সম্পর্কে পড়ুন।`,
        suggestedTags: ['প্রযুক্তি', 'ওয়েব ডেভেলপমেন্ট', 'বাংলা ব্লগ', 'Next.js'],
        excerpt: formExcerpt || `${formTitle} নিয়ে বিশেষ বিশ্লেষণ।`,
        seoScore: 90,
        tips: [
          'শিরোনামে মূল ফোকাস কিওয়ার্ডটি অন্তর্ভুক্ত রাখুন।',
          'মেটা ডেসক্রিপশন ১৪০ অক্ষরের মধ্যে রাখুন যাতে গুগলে সুন্দরভাবে দেখায়।',
          'কনটেন্টে অন্তত ৩টি সাবহেডিং ও বুলেট পয়েন্ট ব্যবহার করুন।'
        ]
      });
      showToast('এসইও বিশ্লেষণ প্রস্তুত!', 'info');
    } finally {
      setOptimizingSeo(false);
    }
  };

  const applySeoSuggestions = () => {
    if (!seoResult) return;
    if (seoResult.seoTitle) setFormSeoTitle(seoResult.seoTitle);
    if (seoResult.seoDescription) setFormSeoDescription(seoResult.seoDescription);
    if (seoResult.excerpt && !formExcerpt) setFormExcerpt(seoResult.excerpt);
    if (seoResult.suggestedTags?.length) {
      setFormTags(seoResult.suggestedTags.join(', '));
    }
    showToast('এসইও তথ্য ফর্মে প্রয়োগ করা হয়েছে!', 'success');
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('শিরোনাম ও কনটেন্ট আবশ্যক।', 'error');
      return;
    }

    setSavingPost(true);
    const id = editingPostId || `post-${Date.now()}`;
    const wordCount = formContent.trim().split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 180));

    const postData: Post = {
      id,
      title: formTitle.trim(),
      slug: formSlug.trim() || `post-${Date.now()}`,
      category: formCategory,
      tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
      excerpt: formExcerpt.trim() || formContent.slice(0, 150).replace(/#/g, '') + '...',
      coverImage: formCoverImage.trim() || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80',
      content: formContent.trim(),
      authorId: user?.uid || 'admin-author',
      authorName: user?.displayName || 'রাকিবুল হাসান (RS)',
      authorEmail: user?.email || ADMIN_EMAIL,
      authorAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      readingTimeMinutes,
      viewsCount: editingPostId ? (posts.find((p) => p.id === editingPostId)?.viewsCount || 0) : 0,
      likesCount: editingPostId ? (posts.find((p) => p.id === editingPostId)?.likesCount || 0) : 0,
      published: formPublished,
      seoTitle: formSeoTitle.trim() || formTitle.trim(),
      seoDescription: formSeoDescription.trim() || formExcerpt.trim(),
      createdAt: editingPostId ? (posts.find((p) => p.id === editingPostId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'posts', id), postData);
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx >= 0) {
          const upd = [...prev];
          upd[idx] = postData;
          return upd;
        }
        return [postData, ...prev];
      });
      showToast(editingPostId ? 'পোস্ট আপডেট সফল হয়েছে!' : 'নতুন পোস্ট প্রকাশিত হয়েছে!', 'success');
      setActiveTab('posts');
    } catch {
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx >= 0) {
          const upd = [...prev];
          upd[idx] = postData;
          return upd;
        }
        return [postData, ...prev];
      });
      showToast('পোস্ট সংরক্ষিত হয়েছে!', 'success');
      setActiveTab('posts');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('আপনি কি এই পোস্টটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('পোস্ট মুছে ফেলা হয়েছে।', 'info');
    } catch {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('পোস্ট সরানো হয়েছে।', 'info');
    }
  };

  const togglePublish = async (post: Post) => {
    const nextStatus = !post.published;
    try {
      await updateDoc(doc(db, 'posts', post.id), { published: nextStatus });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: nextStatus } : p)));
      showToast(nextStatus ? 'পোস্ট পাবলিশ হয়েছে।' : 'পোস্ট ড্রাফট হয়েছে।', 'success');
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: nextStatus } : p)));
    }
  };

  // If user is not admin, show dedicated Admin Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              অ্যাডমিন পোর্টাল লগইন
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              শুধুমাত্র ওয়েবসাইটের অনুমোদিত অ্যাডমিনের জন্য সংরক্ষিত
            </p>
          </div>

          {user && user.email !== ADMIN_EMAIL && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-xs">
              আপনি <strong>{user.email}</strong> দিয়ে লগইন করেছেন। কিন্তু এই সিএমএস শুধুমাত্র <strong>{ADMIN_EMAIL}</strong> এর জন্য অনুমোদিত।
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={loginWithGoogle}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Google দিয়ে অ্যাডমিন লগইন</span>
            </button>

            <button
              onClick={toggleDemoAdmin}
              className="w-full h-9 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-medium transition-colors"
            >
              ডেমো অ্যাডমিন প্রিভিউ মোড
            </button>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>মূল ব্লগে ফিরে যান</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Admin Dashboard View
  const totalViews = posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950"></span>
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                আরএস জার্নাল সিএমএস
                {isDemoAdmin && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-medium">
                    ডেমো মোড
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {user ? user.email : 'অ্যাডমিন সক্রিয় (ঢাকা, বাংলাদেশ)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="h-9 px-3 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ব্লগ দেখুন</span>
            </Link>

            <button
              onClick={logout}
              className="h-9 px-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto text-xs sm:text-sm">
          {[
            { id: 'overview', label: 'ওভারভিউ', icon: TrendingUp },
            { id: 'posts', label: `পোস্টসমূহ (${posts.length})`, icon: FileText },
            { id: 'editor', label: editingPostId ? 'পোস্ট এডিট' : 'নতুন পোস্ট', icon: Edit3 },
            { id: 'messages', label: `বার্তা (${messages.length})`, icon: Mail },
            { id: 'subscribers', label: `গ্রাহক (${subscribers.length})`, icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                <div className="text-xs text-zinc-500">মোট পোস্ট</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{posts.length}</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{publishedCount} প্রকাশিত • {draftCount} ড্রাফট</div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                <div className="text-xs text-zinc-500">মোট পাঠসংখ্যা</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalViews}</div>
                <div className="text-[11px] text-zinc-400">পাঠক এনগেজমেন্ট</div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                <div className="text-xs text-zinc-500">গ্রাহক তালিকা</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{subscribers.length}</div>
                <div className="text-[11px] text-blue-500">ইমেইল গ্রাহক</div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                <div className="text-xs text-zinc-500">ইনবক্স বার্তা</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{messages.length}</div>
                <div className="text-[11px] text-zinc-400">পাঠকের প্রশ্ন</div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  নতুন আর্টিকেল লিখুন
                </h3>
                <p className="text-xs text-zinc-500">
                  সরাসরি মার্কডাউন এডিটরে পোস্ট লিখুন এবং Gemini AI দিয়ে এসইও অপ্টিমাইজ করুন।
                </p>
              </div>
              <button
                onClick={handleStartCreate}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>লিখতে শুরু করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: POSTS LIST */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                সকল পোস্টের তালিকা
              </h2>
              <button
                onClick={handleStartCreate}
                className="h-8.5 px-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-md text-xs font-medium hover:opacity-90 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন পোস্ট</span>
              </button>
            </div>

            <div className="space-y-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded font-semibold ${
                        post.published 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {post.published ? 'প্রকাশিত' : 'ড্রাফট'}
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-500 font-medium">{post.category}</span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-400">{post.viewsCount} ভিউজ</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {post.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => togglePublish(post)}
                      className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {post.published ? 'ড্রাফট করুন' : 'পাবলিশ করুন'}
                    </button>
                    <button
                      onClick={() => handleStartEdit(post)}
                      className="h-8 px-2.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded flex items-center gap-1 font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>এডিট</span>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded flex items-center justify-center transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EDITOR */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSavePost} className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-500" />
                <span>{editingPostId ? 'পোস্ট এডিট করুন' : 'নতুন পোস্ট তৈরি'}</span>
              </h2>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>সরাসরি প্রকাশ করুন (Published)</span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  পোস্টের শিরোনাম (Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="উদাঃ নেক্সটজেএস ও আধুনিক ওয়েব আর্কিটেকচার..."
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    ইউআরএল স্লাগ (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none font-mono text-zinc-600 dark:text-zinc-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    ক্যাটেগরি (Category)
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                  >
                    <option value="technology">প্রযুক্তি ও কোডিং</option>
                    <option value="experience">ব্যক্তিগত অভিজ্ঞতা</option>
                    <option value="contemporary">সমসাময়িক চিন্তা</option>
                    <option value="tutorials">টিউটোরিয়াল ও গাইড</option>
                    <option value="thoughts">মনন ও অনুভূতি</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    ট্যাগসমূহ (কমা দিয়ে আলাদা করুন)
                  </label>
                  <input
                    type="text"
                    placeholder="React, Next.js, জীবন, ক্যারিয়ার"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    কভার ইমেজ লিঙ্ক (Cover Image URL)
                  </label>
                  <input
                    type="url"
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none font-mono text-zinc-600 dark:text-zinc-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  সংক্ষিপ্ত সারসংক্ষেপ (Excerpt)
                </label>
                <textarea
                  rows={2}
                  placeholder="পোস্টের সংক্ষিপ্ত বিবরণ..."
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    মূল কনটেন্ট (Markdown সমর্থিত) *
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ## শিরোনাম, **বোল্ড**, &gt; উক্তি
                  </span>
                </div>
                <textarea
                  required
                  rows={12}
                  placeholder="আপনার পোস্টের মূল লেখা এখানে লিখুন..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full p-3 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Gemini AI SEO Box */}
            <div className="p-4 sm:p-5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      Gemini AI এসইও অপ্টিমাইজার
                      <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                        gemini-3.1-flash-lite
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      এক ক্লিকে লো-ল্যাটেন্সিতে গুগল সার্চের জন্য সেরা টাইটেল ও মেটা বিবরণ তৈরি করুন
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOptimizeWithAI}
                  disabled={optimizingSeo}
                  className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                >
                  {optimizingSeo ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>বিশ্লেষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>SEO পরামর্শ নিন</span>
                    </>
                  )}
                </button>
              </div>

              {seoResult && (
                <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">এসইও স্কোর:</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                        {seoResult.seoScore} / ১০০
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={applySeoSuggestions}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      ফর্মে প্রয়োগ করুন
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-zinc-500">SEO Title:</span>
                      <div className="text-zinc-900 dark:text-zinc-100 font-medium">{seoResult.seoTitle}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-500">Meta Description:</span>
                      <div className="text-zinc-700 dark:text-zinc-300">{seoResult.seoDescription}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <input
                  type="text"
                  placeholder="কাস্টম এসইও টাইটেল..."
                  value={formSeoTitle}
                  onChange={(e) => setFormSeoTitle(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="কাস্টম মেটা ডেসক্রিপশন..."
                  value={formSeoDescription}
                  onChange={(e) => setFormSeoDescription(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="h-10 px-4 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs sm:text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={savingPost}
                className="h-10 px-6 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md text-xs sm:text-sm font-medium hover:opacity-90 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {savingPost ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingPostId ? 'পরিবর্তন সংরক্ষণ করুন' : 'পোস্ট প্রকাশ করুন'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              ইনবক্স বার্তা ও অনুসন্ধান ({messages.length})
            </h2>
            {messages.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                কোনো বার্তা পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{msg.name} ({msg.email})</span>
                      <span className="text-zinc-400">{new Date(msg.createdAt).toLocaleDateString('bn-BD')}</span>
                    </div>
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">বিষয়: {msg.subject}</div>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded">{msg.message}</p>
                    <div className="flex justify-end">
                      <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        ইমেইলে উত্তর দিন
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SUBSCRIBERS */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                নিউজলেটার গ্রাহক ({subscribers.length})
              </h2>
              {subscribers.length > 0 && (
                <button
                  onClick={() => {
                    const csv = subscribers.map((s) => s.email).join('\n');
                    navigator.clipboard.writeText(csv);
                    showToast('ইমেইল তালিকা ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
                  }}
                  className="h-8 px-3 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-medium"
                >
                  ইমেইল কপি করুন
                </button>
              )}
            </div>

            {subscribers.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                কোনো সাবস্ক্রাইবার নেই।
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">ইমেইল</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {subscribers.map((sub, i) => (
                      <tr key={i}>
                        <td className="p-3 font-medium">{sub.email}</td>
                        <td className="p-3 text-zinc-500">{new Date(sub.subscribedAt).toLocaleDateString('bn-BD')}</td>
                        <td className="p-3"><span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">সক্রিয়</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
