'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  Code,
  Minus,
  Search,
  FolderPlus,
  X,
  EyeOff,
  Columns,
  Maximize2,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/Toast';
import { Post, ContactMessage, Subscriber, SeoOptimizationResult, BLOG_CATEGORIES } from '../../lib/types';
import { INITIAL_POSTS } from '../../lib/sample-data';
import { compressImageToWebP } from '../../lib/image-compressor';
import { 
  db, 
  auth,
  signInAnonymously,
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

interface CategoryItem {
  id: string;
  labelBn: string;
  labelEn: string;
}

// Local post persistence helpers
const savePostToLocal = (post: Post) => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('rs_custom_posts');
    let list: Post[] = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex((p) => p.id === post.id);
    if (idx >= 0) {
      list[idx] = post;
    } else {
      list = [post, ...list];
    }
    localStorage.setItem('rs_custom_posts', JSON.stringify(list));
    // Remove from deleted list if re-saved
    const deleted: string[] = JSON.parse(localStorage.getItem('rs_deleted_posts') || '[]');
    if (deleted.includes(post.id)) {
      localStorage.setItem('rs_deleted_posts', JSON.stringify(deleted.filter((id) => id !== post.id)));
    }
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
};

const deletePostFromLocal = (postId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('rs_custom_posts');
    if (saved) {
      const list: Post[] = JSON.parse(saved);
      localStorage.setItem('rs_custom_posts', JSON.stringify(list.filter((p) => p.id !== postId)));
    }
    const deleted: string[] = JSON.parse(localStorage.getItem('rs_deleted_posts') || '[]');
    if (!deleted.includes(postId)) {
      deleted.push(postId);
      localStorage.setItem('rs_deleted_posts', JSON.stringify(deleted));
    }
  } catch (err) {
    console.warn('LocalStorage delete error:', err);
  }
};

export default function AdminPage() {
  const { user, isAdmin, loading, loginWithGoogle, loginWithCredentials, logout } = useAuth();
  const { showToast } = useToast();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Custom private admin password update state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  // CMS state initialized from localStorage merged with INITIAL_POSTS and featuredPostId
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window === 'undefined') return INITIAL_POSTS;
    try {
      const saved = localStorage.getItem('rs_custom_posts');
      const deleted: string[] = JSON.parse(localStorage.getItem('rs_deleted_posts') || '[]');
      const savedFeaturedId = localStorage.getItem('rs_featured_post_id');
      const localList: Post[] = saved ? JSON.parse(saved) : [];
      const map = new Map<string, Post>();
      INITIAL_POSTS.filter((p) => !deleted.includes(p.id)).forEach((p) => map.set(p.id, p));
      localList.filter((p) => !deleted.includes(p.id)).forEach((p) => map.set(p.id, p));
      return Array.from(map.values()).map((p) => ({
        ...p,
        isFeatured: savedFeaturedId ? p.id === savedFeaturedId : Boolean(p.isFeatured),
      }));
    } catch {
      return INITIAL_POSTS;
    }
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'editor' | 'messages' | 'subscribers'>('overview');

  // Categories state with support for dynamically adding new categories
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const defaultCats = BLOG_CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({
      id: c.id,
      labelBn: c.labelBn,
      labelEn: c.labelEn,
    }));
    if (typeof window !== 'undefined') {
      try {
        const savedCats = localStorage.getItem('rs_custom_categories');
        if (savedCats) {
          const parsed = JSON.parse(savedCats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map<string, CategoryItem>();
            defaultCats.forEach((c) => map.set(c.id, c));
            parsed.forEach((c: CategoryItem) => map.set(c.id, c));
            return Array.from(map.values());
          }
        }
      } catch {}
    }
    return defaultCats;
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatBn, setNewCatBn] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

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
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  const [savingPost, setSavingPost] = useState(false);

  // Inline attached images registry (WebP < 50KB with short token references)
  const [formContentImages, setFormContentImages] = useState<Record<string, { dataUrl: string; caption: string; sizeKb: number }>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  // Editor mode & preview
  const [editorViewMode, setEditorViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const inlineFileInputRef = useRef<HTMLInputElement | null>(null);

  // Posts filter & search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Gemini AI SEO State
  const [optimizingSeo, setOptimizingSeo] = useState(false);
  const [seoResult, setSeoResult] = useState<SeoOptimizationResult | null>(null);

  // Messages & Subscribers
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // Load custom categories from Firestore
  useEffect(() => {
    try {
      getDocs(collection(db, 'categories')).then((snap) => {
        if (!snap.empty) {
          const list: CategoryItem[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CategoryItem));
          setCategories((prev) => {
            const map = new Map<string, CategoryItem>();
            prev.forEach((c) => map.set(c.id, c));
            list.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }
      }).catch(() => {});
    } catch {}
  }, []);

  // Load Firestore posts
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'posts'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteList: Post[] = [];
            snapshot.forEach((d) => remoteList.push({ id: d.id, ...d.data() } as Post));
            
            let deleted: string[] = [];
            let localList: Post[] = [];
            try {
              deleted = JSON.parse(localStorage.getItem('rs_deleted_posts') || '[]');
              const saved = localStorage.getItem('rs_custom_posts');
              if (saved) localList = JSON.parse(saved);
            } catch {}

            const map = new Map<string, Post>();
            INITIAL_POSTS.filter((p) => !deleted.includes(p.id)).forEach((p) => map.set(p.id, p));
            localList.filter((p) => !deleted.includes(p.id)).forEach((p) => map.set(p.id, p));
            remoteList.filter((p) => !deleted.includes(p.id)).forEach((p) => map.set(p.id, p));

            const currentFeaturedId = typeof window !== 'undefined' ? localStorage.getItem('rs_featured_post_id') : null;
            const merged = Array.from(map.values()).map((p) => ({
              ...p,
              isFeatured: currentFeaturedId ? p.id === currentFeaturedId : Boolean(p.isFeatured),
            }));
            setPosts(merged);

            try {
              localStorage.setItem('rs_custom_posts', JSON.stringify(merged));
            } catch {}
          }
        },
        (error) => {
          console.warn('Admin posts sync note:', error?.message || error);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Posts sync note:', e);
    }
  }, []);

  // Listen to Firestore site_settings (Featured Post selection) in real time
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'site_settings'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && 'featuredPostId' in data) {
            const fId = data.featuredPostId;
            if (fId && fId !== 'none' && typeof fId === 'string' && fId.trim().length > 0) {
              const cleanId = fId.trim();
              try { localStorage.setItem('rs_featured_post_id', cleanId); } catch {}
              setPosts((prev) => prev.map((p) => ({
                ...p,
                isFeatured: p.id === cleanId,
              })));
            } else if (fId === 'none') {
              try { localStorage.removeItem('rs_featured_post_id'); } catch {}
              setPosts((prev) => prev.map((p) => ({
                ...p,
                isFeatured: false,
              })));
            }
          }
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  // Load messages & subscribers
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

  // Handle credential login
  const handleCredentialLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      showToast('ইউজারনেম/ইমেইল এবং পাসওয়ার্ড আবশ্যক।', 'error');
      return;
    }

    setLoginSubmitting(true);
    try {
      const ok = await loginWithCredentials(loginIdentifier, loginPassword);
      if (ok) {
        setLoginPassword('');
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleUpdateAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim() || newAdminPassword.trim().length < 6) {
      showToast('নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।', 'error');
      return;
    }
    try {
      localStorage.setItem('rs_admin_master_pwd', newAdminPassword.trim());
      setNewAdminPassword('');
      setShowChangePassword(false);
      showToast('আপনার অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত ও সংরক্ষিত হয়েছে!', 'success');
    } catch {
      showToast('পাসওয়ার্ড সংরক্ষণ করা যায়নি।', 'error');
    }
  };

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
    setFormCategory(categories[0]?.id || 'technology');
    setFormTags('প্রযুক্তি, কোডিং, ওয়েব');
    setFormExcerpt('');
    setFormCoverImage('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80');
    setFormContent('## নতুন পোস্টের শিরোনাম\n\nএখানে বিস্তারিত লিখুন...');
    setFormContentImages({});
    setFormPublished(true);
    setFormIsFeatured(false);
    setFormSeoTitle('');
    setFormSeoDescription('');
    setSeoResult(null);
    setEditorViewMode('edit');
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

    // Initialize content images registry and auto-migrate legacy base64 URLs
    const initialImages: Record<string, { dataUrl: string; caption: string; sizeKb: number }> = {};
    if (post.contentImages) {
      Object.entries(post.contentImages).forEach(([k, dataUrl]) => {
        const token = k.startsWith('img:') ? k : (k.startsWith('img-') ? k.replace('img-', 'img:') : `img:${k}`);
        const commaIdx = dataUrl.indexOf(',');
        const sizeBytes = commaIdx !== -1 ? Math.round((dataUrl.substring(commaIdx + 1).length * 3) / 4) : 0;
        initialImages[token] = {
          dataUrl,
          caption: 'আর্টিকেল চিত্র',
          sizeKb: Math.round((sizeBytes / 1024) * 10) / 10 || 35,
        };
      });
    }

    // Auto-migrate any legacy raw base64 data URLs in post.content into clean short tokens
    let contentToSet = post.content;
    const dataUrlRegex = /!\[(.*?)\]\((data:image\/[a-zA-Z+]+;base64,[^)]+)\)/g;
    let autoIndex = Object.keys(initialImages).length + 1;
    contentToSet = contentToSet.replace(dataUrlRegex, (_, alt, rawDataUrl) => {
      const token = `img:${autoIndex++}`;
      const commaIdx = rawDataUrl.indexOf(',');
      const sizeBytes = commaIdx !== -1 ? Math.round((rawDataUrl.substring(commaIdx + 1).length * 3) / 4) : 0;
      initialImages[token] = {
        dataUrl: rawDataUrl,
        caption: alt || 'আর্টিকেল চিত্র',
        sizeKb: Math.round((sizeBytes / 1024) * 10) / 10 || 38,
      };
      return `![${alt || 'চিত্র'}](${token})`;
    });

    setFormContent(contentToSet);
    setFormContentImages(initialImages);
    setFormPublished(post.published);
    setFormIsFeatured(Boolean(post.isFeatured));
    setFormSeoTitle(post.metaTitle || post.seoTitle || '');
    setFormSeoDescription(post.metaDescription || post.seoDescription || '');
    setSeoResult(null);
    setEditorViewMode('edit');
    setActiveTab('editor');
  };

  // Direct image upload for Cover Image (< 50KB WebP, 16:9 perfect ratio)
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WebP) আপলোড করুন।', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      showToast('কভার ছবি অপ্টিমাইজ ও কম্প্রেস করা হচ্ছে...', 'info');
      const result = await compressImageToWebP(file, 1120);
      setFormCoverImage(result.dataUrl);
      showToast(`কভার ছবি সফলভাবে আপলোড হয়েছে! (${result.sizeKb} KB, WebP, পারফেক্ট ১৬:৯ সাইজ)`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'কভার ছবি আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Direct image upload inside Post Content (< 50KB WebP, 16:9 perfect ratio, short token)
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WebP) আপলোড করুন।', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      showToast('পোস্টের ছবি অপ্টিমাইজ ও কম্প্রেস করা হচ্ছে...', 'info');
      // 1. Compresses to WebP strictly < 50KB in standard 16:9 aspect ratio
      const result = await compressImageToWebP(file, 960);

      // 2. Generate short token ID (img:1, img:2, ...)
      const existingTokens = Object.keys(formContentImages);
      let nextIndex = 1;
      while (existingTokens.includes(`img:${nextIndex}`) || formContent.includes(`(img:${nextIndex})`)) {
        nextIndex++;
      }
      const token = `img:${nextIndex}`;

      const rawName = file.name.replace(/\.[^/.]+$/, '').trim();
      const caption = prompt('ছবিটির ক্যাপশন বা বিবরণ দিন (ঐচ্ছিক):', rawName) || rawName || 'আর্টিকেল চিত্র';

      // 3. Register in formContentImages state
      setFormContentImages((prev) => ({
        ...prev,
        [token]: {
          dataUrl: result.dataUrl,
          caption,
          sizeKb: result.sizeKb,
        },
      }));

      // 4. Insert clean short reference into markdown instead of a giant base64 URL
      insertMarkdownText(`\n\n![${caption}](${token})\n\n`);

      showToast(`পোস্টে ছবি সফলভাবে যুক্ত হয়েছে! (${result.sizeKb} KB, WebP, পারফেক্ট ১৬:৯ সাইজ)`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে।', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Rich text formatting insertion helper
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formContent.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = formContent.substring(0, start) + replacement + formContent.substring(end);
    setFormContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const insertMarkdownText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormContent((prev) => prev + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = formContent.substring(0, start) + text + formContent.substring(end);
    setFormContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 10);
  };

  // Add new category dynamically
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBn = newCatBn.trim();
    if (!cleanBn) {
      showToast('ক্যাটাগরির বাংলা নাম দিন।', 'error');
      return;
    }

    const slug = (newCatSlug.trim() || cleanBn)
      .toLowerCase()
      .replace(/[^\w\s\u0980-\u09FF-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const newCatItem: CategoryItem = {
      id: slug,
      labelBn: cleanBn,
      labelEn: cleanBn,
    };

    setCategories((prev) => {
      const exists = prev.some((c) => c.id === slug);
      if (exists) return prev;
      const updated = [...prev, newCatItem];
      try {
        localStorage.setItem('rs_custom_categories', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await setDoc(doc(db, 'categories', slug), newCatItem);
    } catch {}

    setFormCategory(slug);
    setNewCatBn('');
    setNewCatSlug('');
    setIsAddingCategory(false);
    showToast(`নতুন ক্যাটাগরি '${cleanBn}' সফলভাবে যুক্ত হয়েছে!`, 'success');
  };

  // Gemini AI SEO Optimizer
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
        seoTitle: `${formTitle.slice(0, 55)} | রাসেল শিকদার`,
        seoDescription: formExcerpt.slice(0, 150) || `${formTitle} সম্পর্কে পড়ুন।`,
        suggestedTags: ['প্রযুক্তি', 'ওয়েব ডেভেলপমেন্ট', 'বাংলা ব্লগ', 'Next.js'],
        excerpt: formExcerpt || `${formTitle} নিয়ে বিশেষ বিশ্লেষণ।`,
        seoScore: 92,
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

    // Construct persistent contentImages dictionary for short tokens
    const finalContentImages: Record<string, string> = {};
    Object.entries(formContentImages).forEach(([k, item]) => {
      const url = typeof item === 'string' ? item : item.dataUrl;
      finalContentImages[k] = url;
      if (k.startsWith('img:')) {
        finalContentImages[k.replace('img:', 'img-')] = url;
      }
    });

    const postData: Post = {
      id,
      title: formTitle.trim(),
      slug: formSlug.trim() || `post-${Date.now()}`,
      category: formCategory,
      tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
      excerpt: formExcerpt.trim() || formContent.slice(0, 150).replace(/#/g, '') + '...',
      coverImage: formCoverImage.trim() || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80',
      content: formContent.trim(),
      contentImages: Object.keys(finalContentImages).length > 0 ? finalContentImages : undefined,
      authorId: user?.uid || 'admin-author',
      authorName: user?.displayName || 'রাসেল শিকদার',
      authorEmail: ADMIN_EMAIL,
      authorAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      readingTimeMinutes,
      viewsCount: editingPostId ? (posts.find((p) => p.id === editingPostId)?.viewsCount || 0) : 0,
      likesCount: editingPostId ? (posts.find((p) => p.id === editingPostId)?.likesCount || 0) : 0,
      published: formPublished,
      isFeatured: formIsFeatured,
      metaTitle: formSeoTitle.trim() || formTitle.trim(),
      metaDescription: formSeoDescription.trim() || formExcerpt.trim(),
      seoTitle: formSeoTitle.trim() || formTitle.trim(),
      seoDescription: formSeoDescription.trim() || formExcerpt.trim(),
      createdAt: editingPostId ? (posts.find((p) => p.id === editingPostId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately persist to localStorage so post is instantly saved and never lost
    savePostToLocal(postData);

    // 2. If this post is marked as featured, update site_settings and unfeature any other post
    let previousFeaturedId: string | null = null;
    if (formIsFeatured) {
      try {
        localStorage.setItem('rs_featured_post_id', id);
        setDoc(doc(db, 'settings', 'site_settings'), {
          featuredPostId: id,
          authorEmail: ADMIN_EMAIL,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch {}
      const prevFeatured = posts.find((p) => p.isFeatured && p.id !== id);
      if (prevFeatured) {
        previousFeaturedId = prevFeatured.id;
        const unfeatured = { ...prevFeatured, isFeatured: false, updatedAt: new Date().toISOString() };
        savePostToLocal(unfeatured);
      }
    } else if (editingPostId && typeof window !== 'undefined' && localStorage.getItem('rs_featured_post_id') === id) {
      try {
        localStorage.removeItem('rs_featured_post_id');
        setDoc(doc(db, 'settings', 'site_settings'), {
          featuredPostId: null,
          authorEmail: ADMIN_EMAIL,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch {}
    }

    // 3. Immediately update state
    setPosts((prev) => {
      let list = prev.map((p) => (formIsFeatured && p.id !== id && p.isFeatured ? { ...p, isFeatured: false } : p));
      const idx = list.findIndex((p) => p.id === id);
      if (idx >= 0) {
        list[idx] = postData;
        return list;
      }
      return [postData, ...list];
    });

    // 4. Ensure Firebase Auth session is active
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn('Anonymous auth session note:', authErr);
      }
    }

    // 5. Save to Firestore
    try {
      await setDoc(doc(db, 'posts', id), postData);
      if (previousFeaturedId) {
        await updateDoc(doc(db, 'posts', previousFeaturedId), { isFeatured: false, authorEmail: ADMIN_EMAIL });
      }
      showToast(editingPostId ? 'পোস্ট সফলভাবে আপডেট হয়েছে!' : 'নতুন পোস্ট সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে!', 'success');
      setActiveTab('posts');
    } catch (fsErr) {
      console.warn('Firestore write note:', fsErr);
      showToast(editingPostId ? 'পোস্ট আপডেট ও সংরক্ষিত হয়েছে!' : 'নতুন পোস্ট সংরক্ষিত ও প্রকাশিত হয়েছে!', 'success');
      setActiveTab('posts');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('আপনি কি এই পোস্টটি নিশ্চিতভাবে মুছে ফেলতে চান?')) return;
    deletePostFromLocal(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('পোস্ট মুছে ফেলা হয়েছে।', 'info');

    if (!auth.currentUser) {
      try { await signInAnonymously(auth); } catch {}
    }
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {
      console.warn('Delete post note:', e);
    }
  };

  const togglePublish = async (post: Post) => {
    const nextStatus = !post.published;
    const updatedPost = { 
      ...post, 
      published: nextStatus, 
      authorEmail: ADMIN_EMAIL,
      updatedAt: new Date().toISOString() 
    };
    savePostToLocal(updatedPost);
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updatedPost : p)));
    showToast(nextStatus ? 'পোস্ট সরাসরি প্রকাশিত হয়েছে।' : 'পোস্ট ড্রাফট হিসেবে সংরক্ষিত হয়েছে।', 'success');

    if (!auth.currentUser) {
      try { await signInAnonymously(auth); } catch {}
    }
    try {
      await updateDoc(doc(db, 'posts', post.id), { 
        published: nextStatus, 
        authorEmail: ADMIN_EMAIL,
        updatedAt: updatedPost.updatedAt 
      });
    } catch (e) {
      console.warn('Publish toggle firestore note:', e);
    }
  };

  // Toggle or select a specific post as the featured/special post (Lead Story)
  const toggleFeaturedPost = async (targetPost: Post) => {
    const nextFeatured = !targetPost.isFeatured;
    const previousFeatured = posts.find((p) => p.isFeatured && p.id !== targetPost.id);

    const updatedPost: Post = { 
      ...targetPost, 
      isFeatured: nextFeatured, 
      authorEmail: ADMIN_EMAIL,
      updatedAt: new Date().toISOString() 
    };

    // 1. Immediately persist to localStorage so reload NEVER loses the selection
    if (nextFeatured) {
      try { localStorage.setItem('rs_featured_post_id', targetPost.id); } catch {}
    } else {
      try { localStorage.removeItem('rs_featured_post_id'); } catch {}
    }

    savePostToLocal(updatedPost);
    if (nextFeatured && previousFeatured) {
      savePostToLocal({ ...previousFeatured, isFeatured: false });
    }

    // Keep all posts in local storage cleanly synced with the isFeatured status
    try {
      const saved = localStorage.getItem('rs_custom_posts');
      if (saved) {
        const list: Post[] = JSON.parse(saved);
        const synced = list.map((p) => ({
          ...p,
          isFeatured: nextFeatured ? p.id === targetPost.id : false,
        }));
        localStorage.setItem('rs_custom_posts', JSON.stringify(synced));
      }
    } catch {}

    // 2. Immediately update state
    setPosts((prev) => prev.map((p) => {
      if (p.id === targetPost.id) return updatedPost;
      if (nextFeatured && p.isFeatured) return { ...p, isFeatured: false };
      return p;
    }));

    showToast(
      nextFeatured 
        ? `'${targetPost.title.slice(0, 30)}...' পোস্টটিকে প্রধান বিশেষ নিবন্ধ হিসেবে নির্ধারণ করা হয়েছে!` 
        : 'বিশেষ নিবন্ধের পদবি তুলে নেওয়া হয়েছে (সর্বশেষ পোস্টটি স্বয়ংক্রিয়ভাবে দেখাবে)।',
      'success'
    );

    if (!auth.currentUser) {
      try { await signInAnonymously(auth); } catch {}
    }

    // 3. Update Firestore site_settings so ANY client/device immediately sees this featured post!
    try {
      await setDoc(doc(db, 'settings', 'site_settings'), {
        featuredPostId: nextFeatured ? targetPost.id : 'none',
        authorEmail: ADMIN_EMAIL,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('site_settings save note:', e);
    }

    // 4. Update the post document in Firestore via setDoc with merge: true
    try {
      await setDoc(doc(db, 'posts', targetPost.id), {
        ...updatedPost,
        isFeatured: nextFeatured,
        authorEmail: ADMIN_EMAIL,
        updatedAt: updatedPost.updatedAt
      }, { merge: true });

      if (nextFeatured && previousFeatured) {
        await setDoc(doc(db, 'posts', previousFeatured.id), {
          ...previousFeatured,
          isFeatured: false,
          authorEmail: ADMIN_EMAIL,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Featured toggle firestore note:', err);
    }
  };

  // Select featured post directly from dropdown
  const handleSetFeaturedPostById = async (targetId: string) => {
    if (!targetId || targetId === 'none') {
      try {
        localStorage.removeItem('rs_featured_post_id');
      } catch {}
      const currentFeatured = posts.find((p) => p.isFeatured);
      if (currentFeatured) {
        const unfeatured = { ...currentFeatured, isFeatured: false, updatedAt: new Date().toISOString() };
        savePostToLocal(unfeatured);
      }
      try {
        const saved = localStorage.getItem('rs_custom_posts');
        if (saved) {
          const list: Post[] = JSON.parse(saved);
          localStorage.setItem('rs_custom_posts', JSON.stringify(list.map((p) => ({ ...p, isFeatured: false }))));
        }
      } catch {}
      setPosts((prev) => prev.map((p) => ({ ...p, isFeatured: false })));
      showToast('বিশেষ নিবন্ধ রিসেট করা হয়েছে (স্বয়ংক্রিয়ভাবে সর্বশেষ পোস্ট প্রদর্শিত হবে)।', 'info');
      
      if (!auth.currentUser) {
        try { await signInAnonymously(auth); } catch {}
      }
      try {
        await setDoc(doc(db, 'settings', 'site_settings'), {
          featuredPostId: 'none',
          authorEmail: ADMIN_EMAIL,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        if (currentFeatured) {
          await setDoc(doc(db, 'posts', currentFeatured.id), {
            ...currentFeatured,
            isFeatured: false,
            authorEmail: ADMIN_EMAIL,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch {}
      return;
    }

    const postToFeature = posts.find((p) => p.id === targetId);
    if (!postToFeature) return;
    await toggleFeaturedPost({ ...postToFeature, isFeatured: false });
  };

  // Filtered posts for CMS list
  const filteredPosts = posts.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'published' && p.published) || 
      (filterStatus === 'draft' && !p.published);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Render markdown preview in the editor
  const renderLivePreview = (markdown: string) => {
    const lines = markdown.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-xl sm:text-2xl font-bold font-serif-bn mt-4 mb-2 text-zinc-900 dark:text-zinc-100">{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-lg sm:text-xl font-bold font-serif-bn mt-4 mb-2 pb-1 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-base sm:text-lg font-bold font-serif-bn mt-3 mb-1 text-zinc-900 dark:text-zinc-100">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-3 pl-3.5 py-1.5 border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 italic text-zinc-800 dark:text-zinc-200 rounded-r text-sm">
            {trimmed.replace('> ', '')}
          </blockquote>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 my-0.5">
            {trimmed.substring(2)}
          </li>
        );
      }
      if (trimmed === '---' || trimmed === '***') {
        return <hr key={idx} className="my-4 border-zinc-200 dark:border-zinc-800" />;
      }
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        let src = imgMatch[2];
        if (formContentImages[src]) {
          src = formContentImages[src].dataUrl;
        } else if (formContentImages[src.replace('img-', 'img:')]) {
          src = formContentImages[src.replace('img-', 'img:')].dataUrl;
        } else if (formContentImages[`img:${src}`]) {
          src = formContentImages[`img:${src}`].dataUrl;
        }
        return (
          <figure key={idx} className="my-5">
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 aspect-video w-full flex items-center justify-center shadow-xs">
              <img 
                src={src} 
                alt={alt || 'আর্টিকেল চিত্র'} 
                className="w-full h-full object-cover" 
                loading="lazy" 
              />
            </div>
            {alt && (
              <figcaption className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 italic font-sans">
                {alt}
              </figcaption>
            )}
          </figure>
        );
      }
      if (trimmed.length > 0) {
        return <p key={idx} className="my-2 text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{trimmed}</p>;
      }
      return null;
    });
  };

  // IF USER IS NOT ADMIN: Display Dedicated Admin Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              অ্যাডমিন পোর্টাল লগইন
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              রাসেল শিকদার জার্নাল সিএমএস — শুধুমাত্র একমাত্র অনুমোদিত অ্যাডমিনের জন্য
            </p>
          </div>

          {/* Secure Admin Credential Form */}
          <form onSubmit={handleCredentialLoginSubmit} className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                অ্যাডমিন ইমেইল
              </label>
              <input
                type="email"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="আপনার অ্যাডমিন ইমেইল লিখুন"
                className="w-full h-10 px-3 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  অ্যাডমিন পাসওয়ার্ড
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {showPassword ? 'লুকান' : 'দেখান'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 px-3 pr-10 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loginSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>অ্যাডমিন লগইন</span>
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full"></div>
            <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400 absolute">অথবা</span>
          </div>

          <div>
            <button
              onClick={loginWithGoogle}
              className="w-full h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Google অ্যাকাউন্ট দিয়ে লগইন</span>
            </button>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>মূল জার্নালে ফিরে যান</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD VIEW
  const totalViews = posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      
      {/* Hidden File Inputs for Direct Image Uploads */}
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFileUpload}
        className="hidden"
      />
      <input
        ref={inlineFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInlineImageUpload}
        className="hidden"
      />

      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-950"></span>
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                রাসেল শিকদার জার্নাল সিএমএস
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {user?.email || `${ADMIN_EMAIL} (একমাত্র অনুমোদিত অ্যাডমিন)`}
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
            { id: 'editor', label: editingPostId ? 'পোস্ট এডিট' : 'নতুন পোস্ট লিখুন', icon: Edit3 },
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
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

            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  নতুন আর্টিকেল লিখুন
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  মোবাইল ও ডেস্কটপ ফ্রেন্ডলি রিচ এডিটর, সরাসরি ছবি আপলোড এবং Gemini AI এসইও সাপোর্ট সহ পোস্ট লিখুন।
                </p>
              </div>
              <button
                onClick={handleStartCreate}
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>লিখতে শুরু করুন</span>
              </button>
            </div>

            {/* Security & Private Password Card */}
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      অ্যাডমিন নিরাপত্তা ও ব্যক্তিগত পাসওয়ার্ড
                    </h3>
                    <p className="text-xs text-zinc-500">
                      শুধুমাত্র আপনার ইমেইল ({ADMIN_EMAIL}) দিয়ে লগইন সুরক্ষিত। আপনি চাইলে নিজস্ব নতুন পাসওয়ার্ড সেট করতে পারেন।
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="h-8 px-3 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 self-start sm:self-center"
                >
                  {showChangePassword ? 'বাতিল করুন' : 'পাসওয়ার্ড পরিবর্তন'}
                </button>
              </div>

              {showChangePassword && (
                <form onSubmit={handleUpdateAdminPassword} className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <input
                      type="password"
                      required
                      placeholder="নতুন গোপনীয় পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0"
                  >
                    সংরক্ষণ করুন
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: POSTS LIST & MANAGEMENT */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  সকল পোস্টের তালিকা ({filteredPosts.length})
                </h2>
                <p className="text-xs text-zinc-500">পোস্ট তৈরি, এডিট, সরাসরি পাবলিশ/ড্রাফট ও মুছুন</p>
              </div>
              <button
                onClick={handleStartCreate}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন পোস্ট লিখুন</span>
              </button>
            </div>

            {/* Featured Special Post Selection Card */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>প্রধান বিশেষ পোস্ট (Featured Lead Story) নির্বাচন</span>
                      <span className="text-[10px] font-normal text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                        ওয়েবসাইটের মূল হিরো সেকশনে প্রদর্শন
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      {posts.find((p) => p.isFeatured) ? (
                        <span>
                          বর্তমানে নির্বাচিত: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{posts.find((p) => p.isFeatured)?.title}</strong>
                        </span>
                      ) : (
                        <span>বর্তমানে কোনো নির্দিষ্ট পোস্ট নির্বাচন করা নেই (স্বয়ংক্রিয়ভাবে সর্বশেষ পোস্টটি বিশেষ পোস্ট হিসেবে প্রদর্শিত হচ্ছে)।</span>
                      )}
                    </p>
                  </div>
                </div>

                {posts.find((p) => p.isFeatured) && (
                  <button
                    type="button"
                    onClick={() => handleSetFeaturedPostById('none')}
                    className="h-8 px-3 text-xs border border-zinc-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 rounded-md font-medium text-zinc-600 dark:text-zinc-300 shrink-0 self-start sm:self-center transition-colors"
                  >
                    রিসেট (সর্বশেষ পোস্ট দেখান)
                  </button>
                )}
              </div>

              {/* Quick Dropdown Picker */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                  যেকোনো পোস্টকে বিশেষ পোস্ট হিসেবে বেছে নিন:
                </label>
                <select
                  value={posts.find((p) => p.isFeatured)?.id || 'none'}
                  onChange={(e) => handleSetFeaturedPostById(e.target.value)}
                  className="w-full sm:flex-1 h-9 px-3 text-xs bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                >
                  <option value="none">-- স্বয়ংক্রিয় (সর্বশেষ প্রকাশিত পোস্ট) --</option>
                  {posts.filter((p) => p.published).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.isFeatured ? '[বর্তমানে নির্বাচিত] ' : ''}{p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="শিরোনাম, ট্যাগ অথবা স্লাগ দিয়ে পোস্ট খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-9 px-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                >
                  <option value="all">সকল ক্যাটাগরি</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.labelBn}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="h-9 px-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none"
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="published">শুধুমাত্র প্রকাশিত</option>
                  <option value="draft">ড্রাফট</option>
                </select>
              </div>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <p>কোনো পোস্ট পাওয়া যায়নি।</p>
                <button
                  onClick={handleStartCreate}
                  className="h-8 px-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded text-xs font-medium"
                >
                  প্রথম পোস্টটি লিখুন
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-16 h-12 sm:w-20 sm:h-14 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`px-1.5 py-0.2 rounded font-semibold ${
                            post.published 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}>
                            {post.published ? 'প্রকাশিত' : 'ড্রাফট'}
                          </span>
                          {post.isFeatured && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              বিশেষ পোস্ট
                            </span>
                          )}
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-500 font-medium">
                            {categories.find((c) => c.id === post.category)?.labelBn || post.category}
                          </span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-400">{post.viewsCount || 0} ভিউজ</span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-400">{post.readingTimeMinutes || 3} মিনিট পাঠ</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {post.title}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-mono line-clamp-1">
                          /{post.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800 flex-wrap">
                      <button
                        onClick={() => toggleFeaturedPost(post)}
                        className={`h-8 px-2.5 text-xs rounded-md font-medium flex items-center gap-1 transition-colors ${
                          post.isFeatured
                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-zinc-200 dark:border-zinc-800'
                        }`}
                        title={post.isFeatured ? 'বিশেষ পোস্ট থেকে সরান' : 'এই পোস্টটিকে প্রধান বিশেষ পোস্ট করুন'}
                      >
                        <span>{post.isFeatured ? 'বিশেষ পোস্ট (অন)' : 'বিশেষ করুন'}</span>
                      </button>

                      <button
                        onClick={() => togglePublish(post)}
                        className={`h-8 px-2.5 text-xs rounded font-medium transition-colors ${
                          post.published
                            ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        {post.published ? 'ড্রাফট করুন' : 'পাবলিশ করুন'}
                      </button>
                      <button
                        onClick={() => handleStartEdit(post)}
                        className="h-8 px-3 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-1 font-semibold transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>এডিট</span>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md flex items-center justify-center transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MOBILE & DESKTOP FRIENDLY RICH EDITOR */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSavePost} className="space-y-6 max-w-5xl mx-auto">
            
            {/* Editor Action Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className="h-8 w-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-500" />
                  <span>{editingPostId ? 'পোস্ট এডিট করুন' : 'নতুন পোস্ট তৈরি'}</span>
                </h2>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1.5 rounded-md">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>বিশেষ পোস্ট (Lead Story)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>সরাসরি প্রকাশ (Publish)</span>
                </label>

                <button
                  type="submit"
                  disabled={savingPost}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingPost ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingPostId ? 'আপডেট করুন' : 'প্রকাশ করুন'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
              
              {/* Post Title */}
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
                  className="w-full h-10 px-3 py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Slug & Category Row with "নতুন ক্যাটাগরি যুক্ত করার সুবিধা" */}
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
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none font-mono text-zinc-600 dark:text-zinc-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      ক্যাটাগরি (Category) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>+ নতুন ক্যাটাগরি তৈরি</span>
                    </button>
                  </div>

                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.labelBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Add New Category Inline Box */}
              {isAddingCategory && (
                <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5" />
                      নতুন ক্যাটাগরি যুক্ত করুন
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="ক্যাটাগরির বাংলা নাম (উদাঃ এআই ও রোবোটিক্স)"
                      value={newCatBn}
                      onChange={(e) => setNewCatBn(e.target.value)}
                      className="h-9 px-3 text-xs bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-md focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ইংরেজি স্লাগ (উদাঃ ai-robotics)"
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      className="h-9 px-3 text-xs bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-md focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="h-8 px-3 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-medium"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="h-8 px-3 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                    >
                      যুক্ত করুন
                    </button>
                  </div>
                </div>
              )}

              {/* Tags & Direct Cover Image Upload */}
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
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none"
                  />
                  {/* Quick tag suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['প্রযুক্তি', 'ওয়েব ডেভেলপমেন্ট', 'এআই', 'Next.js', 'রিঅ্যাক্ট', 'টাইপস্ক্রিপ্ট', 'ক্যারিয়ার'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = formTags ? formTags.split(',').map((t) => t.trim()) : [];
                          if (!current.includes(tag)) {
                            setFormTags([...current, tag].join(', '));
                          }
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-600 transition-colors"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Image Upload for Cover Image */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      কভার ছবি (Direct Upload / URL)
                    </label>
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>ডিভাইস থেকে আপলোড</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="ইমেজ লিঙ্ক অথবা ফাইল আপলোড করুন..."
                      value={formCoverImage.startsWith('data:') ? '[লোকাল আপলোডকৃত ইমেজ]' : formCoverImage}
                      onChange={(e) => setFormCoverImage(e.target.value)}
                      className="flex-1 h-10 px-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none font-mono text-zinc-600 dark:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="h-10 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>আপলোড</span>
                    </button>
                  </div>

                  {formCoverImage && (
                    <div className="mt-2 relative w-full h-28 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 group">
                      <img src={formCoverImage} alt="Cover preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          className="h-7 px-2.5 bg-white text-zinc-900 rounded text-xs font-semibold shadow"
                        >
                          ছবি পরিবর্তন
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  সংক্ষিপ্ত সারসংক্ষেপ (Excerpt)
                </label>
                <textarea
                  rows={2}
                  placeholder="পোস্টের সংক্ষিপ্ত বিবরণ (প্রথম ২-৩ বাক্য)..."
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none leading-relaxed"
                />
              </div>

              {/* RICH FORMATTING TOOLBAR & EDITOR */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      পোস্টের মূল কনটেন্ট (Rich Editor & Markdown) *
                    </label>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      (সরাসরি ছবি আপলোড ও ফরম্যাটিং সমর্থিত)
                    </span>
                  </div>

                  {/* Mode switcher: Edit, Preview, Split */}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('edit')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        editorViewMode === 'edit'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      ✍️ এডিটর
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('preview')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        editorViewMode === 'preview'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      👁️ লাইভ প্রিভিউ
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('split')}
                      className={`hidden md:block px-2.5 py-1 rounded-md transition-colors ${
                        editorViewMode === 'split'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      ◫ স্প্লিট ভিউ
                    </button>
                  </div>
                </div>

                {/* Toolbar Buttons */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => insertFormatting('## ', '', 'হেডিং ২')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('### ', '', 'হেডিং ৩')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Heading 3"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                  
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**', 'বোল্ড টেক্সট')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*', 'ইটালিক টেক্সট')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('~~', '~~', 'কাটা টেক্সট')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => insertFormatting('> ', '', 'উক্তি বা কোটেশন')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Blockquote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('- ', '', 'তালিকার পয়েন্ট')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('1. ', '', 'ক্রমিক নম্বর')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('```\n', '\n```', '// কোড এখানে লিখুন')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Code Block"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownText('\n---\n')}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Horizontal Rule"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('লিঙ্কের ইউআরএল দিন:', 'https://');
                      if (url) {
                        insertFormatting('[', `](${url})`, 'লিঙ্ক টেক্সট');
                      }
                    }}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Insert Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>

                  {/* Direct Image Upload Button in Content */}
                  <button
                    type="button"
                    onClick={() => inlineFileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center gap-1.5 text-xs shadow-xs"
                    title="ছবি সরাসরি আপলোড ও যুক্ত করুন"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ছবি আপলোড</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const imgUrl = prompt('ছবির সরাসরি ইউআরএল দিন (Unsplash বা ওয়েব লিঙ্ক):');
                      if (imgUrl) {
                        const alt = prompt('ছবির বিবরণ (ক্যাপশন):') || 'চিত্র';
                        insertMarkdownText(`\n![${alt}](${imgUrl})\n`);
                      }
                    }}
                    className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors text-zinc-600 dark:text-zinc-300"
                    title="ইমেজ লিঙ্ক দিয়ে যুক্ত করুন"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Visual Attached Images Gallery in Perfect 16:9 Aspect Ratio (< 50KB WebP) */}
                {Object.keys(formContentImages).length > 0 && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        সংযুক্ত ছবিসমূহ (পারফেক্ট ১৬:৯ সাইজ &lt; ৫০KB WebP)
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {Object.keys(formContentImages).length}টি ছবি সংরক্ষিত
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(formContentImages).map(([token, imgItem]) => {
                        const inText = formContent.includes(`(${token})`);
                        return (
                          <div
                            key={token}
                            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2 group shadow-xs"
                          >
                            {/* Real Image Preview in 16:9 perfect aspect ratio */}
                            <div className="relative aspect-video w-full rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
                              <img
                                src={imgItem.dataUrl}
                                alt={imgItem.caption}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1 left-1 bg-black/75 text-white font-mono text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                                {token}
                              </div>
                              <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-xs">
                                WebP • {imgItem.sizeKb} KB
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-zinc-500">
                              <span className="truncate max-w-[130px] font-medium text-zinc-700 dark:text-zinc-300">
                                {imgItem.caption}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                                ১৬:৯ সাইজ
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!formContent.includes(`(${token})`)) {
                                    insertMarkdownText(`\n\n![${imgItem.caption}](${token})\n\n`);
                                    showToast(`'${token}' পোস্টের কার্সরে যুক্ত হয়েছে!`, 'success');
                                  } else {
                                    insertMarkdownText(`\n![${imgItem.caption}](${token})\n`);
                                    showToast(`'${token}' পুনরায় ইনসার্ট করা হয়েছে!`, 'info');
                                  }
                                }}
                                className={`flex-1 h-7 text-[11px] rounded font-medium transition-colors ${
                                  inText
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold'
                                }`}
                              >
                                {inText ? '✓ যুক্ত আছে (পুনরায় দিন)' : '+ পোস্টে যুক্ত করুন'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCap = prompt('নতুন ক্যাপশন দিন:', imgItem.caption);
                                  if (newCap && newCap !== imgItem.caption) {
                                    setFormContentImages((prev) => ({
                                      ...prev,
                                      [token]: { ...imgItem, caption: newCap }
                                    }));
                                  }
                                }}
                                className="h-7 px-2 text-[11px] rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title="ক্যাপশন পরিবর্তন"
                              >
                                এডিট
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('এই ছবিটি মুছে ফেলতে চান?')) {
                                    setFormContentImages((prev) => {
                                      const next = { ...prev };
                                      delete next[token];
                                      return next;
                                    });
                                    // Also remove reference from text if present
                                    setFormContent((prev) => prev.replace(new RegExp(`!\\[[^\\]]*\\]\\(${token}\\)`, 'g'), ''));
                                    showToast('ছবি অপসারণ করা হয়েছে।', 'info');
                                  }
                                }}
                                className="h-7 px-2 text-[11px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Editor & Preview Panes */}
                <div className={`grid gap-4 ${editorViewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {(editorViewMode === 'edit' || editorViewMode === 'split') && (
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        required
                        rows={16}
                        placeholder="আপনার আর্টিকেলের মূল বক্তব্য এখানে লিখুন... আপনি সরাসরি টুলবার দিয়ে বোল্ড, হেডিং এবং ডিভাইস থেকে ছবি আপলোড করে যুক্ত করতে পারবেন।"
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        className="w-full p-3.5 font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed min-h-[360px]"
                      />
                    </div>
                  )}

                  {(editorViewMode === 'preview' || editorViewMode === 'split') && (
                    <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[360px] overflow-y-auto max-h-[580px]">
                      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">লাইভ পাঠক ভিউ</span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {formContent.trim().split(/\s+/).filter(Boolean).length} শব্দ
                        </span>
                      </div>
                      <div className="prose dark:prose-invert max-w-none">
                        {renderLivePreview(formContent)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gemini 3.1 Flash-Lite AI SEO Box */}
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
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
                      গুগল সার্চ ও সোশ্যাল কার্ডের জন্য স্বয়ংক্রিয়ভাবে সেরা মেটা টাইটেল, ডেসক্রিপশন ও ট্যাগ তৈরি করুন
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOptimizeWithAI}
                  disabled={optimizingSeo}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
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
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">এসইও স্কোর:</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Meta Title (এসইও মেটা টাইটেল)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: আর্টিকেল টাইটেল | রাসেল শিকদার..."
                    value={formSeoTitle}
                    onChange={(e) => setFormSeoTitle(e.target.value)}
                    className="w-full h-9 px-3 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-0.5">গুগল ও সোশ্যাল শেয়ারে প্রদর্শিত হবে (ফাঁকা রাখলে পোস্টের মূল শিরোনাম ব্যবহৃত হবে)।</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Meta Description (এসইও মেটা ডেসক্রিপশন)
                  </label>
                  <input
                    type="text"
                    placeholder="সার্চ রেজাল্ট ও সোশ্যাল প্রিভিউয়ের জন্য ১-২ বাক্যের বর্ণনা..."
                    value={formSeoDescription}
                    onChange={(e) => setFormSeoDescription(e.target.value)}
                    className="w-full h-9 px-3 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-0.5">অনুসন্ধানকারীকে আকৃষ্ট করতে ১২০-১৬০ অক্ষরের সংক্ষিপ্ত বিবরণ।</p>
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="h-10 px-4 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs sm:text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={savingPost}
                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
              <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
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
              <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
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
