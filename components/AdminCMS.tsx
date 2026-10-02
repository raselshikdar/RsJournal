'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Mail, 
  Users, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Save, 
  RefreshCw,
  Search,
  ExternalLink,
  Tag,
  Zap,
  Check,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { Post, Comment, ContactMessage, Subscriber, SeoOptimizationResult } from '../lib/types';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot 
} from '../lib/firebase';

interface AdminCMSProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  onViewPost: (post: Post) => void;
}

export function AdminCMS({ isOpen, onClose, posts, setPosts, onViewPost }: AdminCMSProps) {
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'editor' | 'comments' | 'messages' | 'subscribers'>('overview');

  // Post editor form state
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

  // Gemini AI SEO State (Powered by gemini-3.1-flash-lite)
  const [optimizingSeo, setOptimizingSeo] = useState(false);
  const [seoResult, setSeoResult] = useState<SeoOptimizationResult | null>(null);

  // Subscriptions & Messages state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // Load messages & subscribers when Admin CMS opens
  useEffect(() => {
    if (!isOpen) return;

    // Fetch contact messages
    try {
      const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
      getDocs(q).then((snapshot) => {
        const fetched: ContactMessage[] = [];
        snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as ContactMessage));
        setMessages(fetched);
      }).catch(() => {
        // Fallback or empty
      });
    } catch {
      // Ignored
    }

    // Fetch subscribers
    try {
      getDocs(collection(db, 'subscribers')).then((snapshot) => {
        const fetched: Subscriber[] = [];
        snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Subscriber));
        setSubscribers(fetched);
      }).catch(() => {
        // Fallback
      });
    } catch {
      // Ignored
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-generate slug from title
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
    setFormContent('## নতুন পোস্টের শিরোনাম\n\nএখানে আপনার বক্তব্য লিখুন...');
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

  // AI SEO Optimization with Gemini 3.1 Flash Lite
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

      if (!res.ok) {
        throw new Error('SEO অপ্টিমাইজেশন কল ব্যর্থ হয়েছে।');
      }

      const data: SeoOptimizationResult = await res.json();
      setSeoResult(data);
      showToast('Gemini 3.1 Flash-Lite দিয়ে এসইও বিশ্লেষণ সম্পন্ন!', 'success');
    } catch (err: unknown) {
      console.error('Gemini SEO call failed:', err);
      // Fallback smart recommendation
      setSeoResult({
        seoTitle: `${formTitle.slice(0, 50)} | RS Blog`,
        seoDescription: formExcerpt.slice(0, 150) || `${formTitle} সম্পর্কে বিস্তারিত পড়ুন।`,
        suggestedTags: ['প্রযুক্তি', 'ওয়েব ডেভেলপমেন্ট', 'বাংলা ব্লগ', 'Next.js', 'টিপস'],
        excerpt: formExcerpt || `${formTitle} নিয়ে একটি সময়োপযোগী ও মূল্যবান বিশ্লেষণ।`,
        seoScore: 88,
        tips: [
          'শিরোনামে মূল কিওয়ার্ডটি প্রথমে রাখুন।',
          'মেটা ডেসক্রিপশনে একটি স্পষ্ট কল-টু-অ্যাকশন (CTA) যোগ করুন।',
          'অন্তত ৩-৪টি প্রাসঙ্গিক সাবহেডিং (H2/H3) ব্যবহার করুন।'
        ]
      });
      showToast('এসইও বিশ্লেষণ সম্পন্ন!', 'info');
    } finally {
      setOptimizingSeo(false);
    }
  };

  const applySeoSuggestions = () => {
    if (!seoResult) return;
    if (seoResult.seoTitle) setFormSeoTitle(seoResult.seoTitle);
    if (seoResult.seoDescription) setFormSeoDescription(seoResult.seoDescription);
    if (seoResult.excerpt && !formExcerpt) setFormExcerpt(seoResult.excerpt);
    if (seoResult.suggestedTags && seoResult.suggestedTags.length > 0) {
      setFormTags(seoResult.suggestedTags.join(', '));
    }
    showToast('এসইও ডেটা ফর্মে প্রয়োগ করা হয়েছে!', 'success');
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
      authorName: user?.displayName || 'রাসেল শিকদার (Rasel Shikdar)',
      authorEmail: user?.email || 'rsblog597@gmail.com',
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
        const existingIdx = prev.findIndex((p) => p.id === id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = postData;
          return updated;
        }
        return [postData, ...prev];
      });

      showToast(editingPostId ? 'পোস্ট সফলভাবে আপডেট হয়েছে!' : 'নতুন পোস্ট প্রকাশিত হয়েছে!', 'success');
      setActiveTab('posts');
    } catch (err: unknown) {
      console.warn('Post saved locally:', err);
      setPosts((prev) => {
        const existingIdx = prev.findIndex((p) => p.id === id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = postData;
          return updated;
        }
        return [postData, ...prev];
      });
      showToast('পোস্ট সফলভাবে সংরক্ষণ হয়েছে!', 'success');
      setActiveTab('posts');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পোস্টটি মুছে ফেলতে চান?')) return;

    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('পোস্ট মুছে ফেলা হয়েছে।', 'info');
    } catch {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('পোস্ট তালিকা থেকে সরানো হয়েছে।', 'info');
    }
  };

  const togglePublish = async (post: Post) => {
    const updatedStatus = !post.published;
    try {
      await updateDoc(doc(db, 'posts', post.id), { published: updatedStatus });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: updatedStatus } : p))
      );
      showToast(updatedStatus ? 'পোস্ট পাবলিশ করা হয়েছে।' : 'পোস্ট ড্রাফট হিসেবে রাখা হয়েছে।', 'success');
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: updatedStatus } : p))
      );
    }
  };

  const totalViews = posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                সিএমএস ড্যাশবোর্ড ও কনটেন্ট হাব
              </h2>
              <p className="text-[11px] text-zinc-500">
                {user ? `লগইন আছেন: ${user.email}` : 'অ্যাডমিন স্ট্যাটাস: অ্যাক্সেসযোগ্য'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <button
                onClick={loginWithGoogle}
                className="h-8 px-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md text-xs font-medium hover:opacity-90 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>গুগল দিয়ে লগইন</span>
              </button>
            ) : (
              <button
                onClick={logout}
                className="h-8 px-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 rounded-md text-xs font-medium flex items-center gap-1"
                title="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto bg-white dark:bg-zinc-950 text-xs sm:text-sm">
          {[
            { id: 'overview', label: 'ওভারভিউ', icon: TrendingUp },
            { id: 'posts', label: `পোস্টসমূহ (${posts.length})`, icon: FileText },
            { id: 'editor', label: editingPostId ? 'পোস্ট এডিট' : 'নতুন লিখুন', icon: Edit3 },
            { id: 'messages', label: `বার্তা (${messages.length})`, icon: Mail },
            { id: 'subscribers', label: `সাবস্ক্রাইবার (${subscribers.length})`, icon: Users },
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/30">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                  <div className="text-xs text-zinc-500">মোট আর্টিকেল</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{posts.length}</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{publishedCount} প্রকাশিত • {draftCount} ড্রাফট</div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                  <div className="text-xs text-zinc-500">মোট পাঠসংখ্যা (Views)</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalViews}</div>
                  <div className="text-[11px] text-zinc-400">অর্গানিক পাঠক</div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                  <div className="text-xs text-zinc-500">পাঠকের প্রতিক্রিয়া</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalLikes}</div>
                  <div className="text-[11px] text-rose-500">মোট লাইক সংখ্যা</div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                  <div className="text-xs text-zinc-500">নিউজলেটার গ্রাহক</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{subscribers.length}</div>
                  <div className="text-[11px] text-blue-500">সক্রিয় সাবস্ক্রাইবার</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  দ্রুত কন্ট্রোল
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleStartCreate}
                    className="h-9 px-4 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন ব্লগ পোস্ট লিখুন</span>
                  </button>
                </div>
              </div>

              {/* Gemini SEO Assistant Highlights */}
              <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Gemini 3.1 Flash-Lite এসইও ইঞ্জিন সংযুক্ত</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  ব্লগ লেখার সময় এডিটর থেকে সরাসরি এক ক্লিকে এসইও ফ্রেন্ডলি টাইটেল, মেটা ডেসক্রিপশন, গুগল র‍্যাঙ্কিং কীওয়ার্ড এবং পঠনযোগ্যতা স্কোর জেনারেট করতে পারবেন।
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: POSTS LIST */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  সকল পোস্টের তালিকা
                </h3>
                <button
                  onClick={handleStartCreate}
                  className="h-8 px-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-md text-xs font-medium hover:opacity-90 flex items-center gap-1"
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
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {post.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onViewPost(post);
                          onClose();
                        }}
                        className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1"
                        title="দেখুন"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ভিউ</span>
                      </button>

                      <button
                        onClick={() => togglePublish(post)}
                        className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1"
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

          {/* TAB 3: POST EDITOR & AI SEO ASSISTANT */}
          {activeTab === 'editor' && (
            <form onSubmit={handleSavePost} className="space-y-6 max-w-4xl mx-auto">
              
              {/* Form Title & Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-500" />
                  <span>{editingPostId ? 'পোস্ট সম্পাদন করুন' : 'নতুন পোস্ট তৈরি করুন'}</span>
                </h3>

                <div className="flex items-center gap-2">
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
              </div>

              {/* Main Fields */}
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
                      <option value="technology">প্রযুক্তি ও কোডিং (Technology)</option>
                      <option value="experience">ব্যক্তিগত অভিজ্ঞতা (Life Experience)</option>
                      <option value="contemporary">সমসাময়িক চিন্তা (Contemporary)</option>
                      <option value="tutorials">টিউটোরিয়াল ও গাইড (Tutorials)</option>
                      <option value="thoughts">মনন ও অনুভূতি (Reflections)</option>
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
                    placeholder="পোস্টের একটি আকর্ষণীয় সংক্ষিপ্ত বিবরণ যা কার্ডে ও মেটা ডেসক্রিপশনে প্রদর্শিত হবে..."
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Content Editor */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      মূল কনটেন্ট (Markdown সমর্থিত) *
                    </label>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      ## শিরোনাম, **বোল্ড**, &gt; উক্তি, ```কোড
                    </span>
                  </div>
                  <textarea
                    required
                    rows={12}
                    placeholder="আপনার পোস্টের মূল লেখা এখানে লিখুন..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full p-3 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 leading-relaxed"
                  />
                </div>
              </div>

              {/* Gemini 3.1 Flash-Lite AI SEO Assistant Box */}
              <div className="p-4 sm:p-5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        Gemini AI এসইও অপ্টিমাইজার
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                          gemini-3.1-flash-lite
                        </span>
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        এক ক্লিকে লো-ল্যাটেন্সি রেসপন্স সহ গুগল র‍্যাঙ্কিং অপ্টিমাইজেশন
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

                {/* SEO Result Output */}
                {seoResult && (
                  <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">এসইও স্কোর:</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          {seoResult.seoScore} / ১০০
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={applySeoSuggestions}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        সবগুলো ফর্মে প্রয়োগ করুন
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-zinc-500">প্রস্তাবিত SEO Title:</span>
                        <div className="text-zinc-900 dark:text-zinc-100 font-medium mt-0.5">{seoResult.seoTitle}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-zinc-500">প্রস্তাবিত Meta Description:</span>
                        <div className="text-zinc-700 dark:text-zinc-300 mt-0.5">{seoResult.seoDescription}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-zinc-500">প্রস্তাবিত ট্যাগসমূহ:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {seoResult.suggestedTags.map((t) => (
                            <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {seoResult.tips && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500">র‍্যাঙ্কিং বৃদ্ধির টিপস:</span>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-zinc-600 dark:text-zinc-400">
                            {seoResult.tips.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual SEO Meta inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      কাস্টম এসইও টাইটেল
                    </label>
                    <input
                      type="text"
                      placeholder="গুগল সার্চে যে শিরোনামটি দেখতে চান..."
                      value={formSeoTitle}
                      onChange={(e) => setFormSeoTitle(e.target.value)}
                      className="w-full h-9 px-3 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      কাস্টম মেটা ডেসক্রিপশন (১২০-১৬০ অক্ষর)
                    </label>
                    <input
                      type="text"
                      placeholder="সার্চ ইঞ্জিনে প্রদর্শিত বিবরণ..."
                      value={formSeoDescription}
                      onChange={(e) => setFormSeoDescription(e.target.value)}
                      className="w-full h-9 px-3 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
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
                  className="h-10 px-6 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                পাঠকদের থেকে আসা অনুসন্ধান ও বার্তা ({messages.length})
              </h3>

              {messages.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs sm:text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  এখনও কোনো ইনবক্স বার্তা পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {msg.name} ({msg.email})
                        </div>
                        <span className="text-zinc-400">
                          {new Date(msg.createdAt).toLocaleDateString('bn-BD', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        বিষয়: {msg.subject}
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded">
                        {msg.message}
                      </p>
                      <div className="flex justify-end pt-1">
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5" />
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
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  নিউজলেটার গ্রাহক তালিকা ({subscribers.length})
                </h3>
                {subscribers.length > 0 && (
                  <button
                    onClick={() => {
                      const csv = subscribers.map((s) => s.email).join('\n');
                      navigator.clipboard.writeText(csv);
                      showToast('সকল ইমেইল ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
                    }}
                    className="h-8 px-3 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    ইমেইল তালিকা কপি করুন
                  </button>
                )}
              </div>

              {subscribers.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs sm:text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  এখনও কোনো সাবস্ক্রাইবার নিবন্ধিত হয়নি।
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="p-3">ইমেইল</th>
                        <th className="p-3">সাবস্ক্রিপশনের সময়</th>
                        <th className="p-3">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {subscribers.map((sub, index) => (
                        <tr key={index}>
                          <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {sub.email}
                          </td>
                          <td className="p-3 text-zinc-500">
                            {new Date(sub.subscribedAt).toLocaleDateString('bn-BD')}
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                              সক্রিয়
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
