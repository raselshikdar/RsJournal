'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useSyncExternalStore } from 'react';
import { Plus } from 'lucide-react';
import { Post } from '../lib/types';
import { INITIAL_POSTS, INITIAL_GALLERY } from '../lib/sample-data';
import { db, collection, doc, onSnapshot, testConnection } from '../lib/firebase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArticleCard } from '../components/ArticleCard';
import { RecentArticleCard } from '../components/RecentArticleCard';
import { ArticleView } from '../components/ArticleView';
import { GallerySection } from '../components/GallerySection';
import { AboutSection } from '../components/AboutSection';
import { ContactForm } from '../components/ContactForm';
import { SearchModal } from '../components/SearchModal';
import { SearchPageSection } from '../components/SearchPageSection';
import { PrivacySection } from '../components/PrivacySection';
import { ScrollToTop } from '../components/ScrollToTop';
import { recordAnonymousPageView } from '../lib/cookie-manager';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
const noopSubscribe = () => () => {};

interface HistorySnapshot {
  view: string;
  selectedPostId: string | null;
  selectedPost: Post | null;
  activeCategory: string;
  activeSubcategory: string;
  categoryPage: number;
  searchPageQuery: string;
  scrollY: number;
}

const CATEGORY_MAP: Record<string, {
  name: string;
  color: string;
  subcategories?: { id: string; name: string; tag: string }[];
}> = {
  'tech-gossip': {
    name: 'প্রযুক্তি কথন',
    color: '#e11d2a',
    subcategories: [
      { id: 'all', name: 'সব', tag: '' },
      { id: 'social-media', name: 'সোশ্যাল মিডিয়া', tag: 'সোশ্যাল মিডিয়া' },
      { id: 'marketing', name: 'মার্কেটিং', tag: 'মার্কেটিং' },
      { id: 'blogging', name: 'ব্লগিং', tag: 'ব্লগিং' },
      { id: 'trends', name: 'ট্রেন্ডস্‌', tag: 'ট্রেন্ডস্‌' },
      { id: 'learn-with-digital', name: 'লার্ন উইদ ডিজিটাল', tag: 'লার্ন উইদ ডিজিটাল' },
    ],
  },
  'computer-programming': {
    name: 'কম্পিউটার প্রোগ্রামিং',
    color: '#059669',
    subcategories: [
      { id: 'all', name: 'সব', tag: '' },
      { id: 'python', name: 'পাইথন', tag: 'পাইথন' },
    ],
  },
  'data-science': {
    name: 'ডেটা সায়েন্স',
    color: '#0284c7',
  },
  'artificial-intelligence': {
    name: 'এআই ভয়েস',
    color: '#7c3aed',
  },
  'research': {
    name: 'রিসার্চ',
    color: '#d97706',
    subcategories: [
      { id: 'all', name: 'সব', tag: '' },
      { id: 'stata', name: 'স্ট্যাটা (STATA)', tag: 'স্ট্যাটা' },
      { id: 'kobo-toolbox', name: 'কোবো টুলবক্স (Kobo Toolbox)', tag: 'কোবো' },
    ],
  },
  'diversified': {
    name: 'বিবিধ',
    color: '#475569',
  },
  'technology': {
    name: 'প্রযুক্তি কথন',
    color: '#e11d2a',
  },
  'tutorials': {
    name: 'কম্পিউটার প্রোগ্রামিং',
    color: '#059669',
  },
  'contemporary': {
    name: 'এআই ও সমসাময়িক',
    color: '#e11d2a',
  },
  'experience': {
    name: 'ব্যক্তিগত অভিজ্ঞতা',
    color: '#7c3aed',
  },
};

export default function BlogHome() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  // Strictly initialize with INITIAL_POSTS to prevent SSR hydration mismatch
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  
  // Persistent Featured Post ID across reloads (synced with localStorage & Firestore site_settings)
  const [featuredPostId, setFeaturedPostId] = useState<string | null>(null);
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [categoryPage, setCategoryPage] = useState<number>(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchPageQuery, setSearchPageQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<number>(6);

  // Sync client-side localStorage posts & featuredPostId cleanly after hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedFeaturedId = localStorage.getItem('rs_featured_post_id');
        const saved = localStorage.getItem('rs_custom_posts');
        const deleted: string[] = JSON.parse(localStorage.getItem('rs_deleted_posts') || '[]');
        const localList: Post[] = saved ? JSON.parse(saved) : [];
        
        if (savedFeaturedId) {
          setFeaturedPostId(savedFeaturedId);
        }

        const map = new Map<string, Post>();
        INITIAL_POSTS.filter((p) => !deleted.includes(p.id)).forEach((p) => map.set(p.id, p));
        localList.filter((p) => !deleted.includes(p.id)).forEach((p) => map.set(p.id, p));

        const activeFId = savedFeaturedId || null;
        const list = Array.from(map.values()).map((p) => ({
          ...p,
          isFeatured: activeFId ? p.id === activeFId : Boolean(p.isFeatured),
        }));
        setPosts(list);
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Real-time synchronization of site_settings (Featured Post selection) from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'site_settings'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && 'featuredPostId' in data) {
            const fId = data.featuredPostId;
            if (fId && fId !== 'none' && typeof fId === 'string' && fId.trim().length > 0) {
              const cleanId = fId.trim();
              setFeaturedPostId(cleanId);
              try { localStorage.setItem('rs_featured_post_id', cleanId); } catch {}
              setPosts((prev) => prev.map((p) => ({
                ...p,
                isFeatured: p.id === cleanId,
              })));
            } else if (fId === 'none') {
              setFeaturedPostId(null);
              try { localStorage.removeItem('rs_featured_post_id'); } catch {}
              setPosts((prev) => prev.map((p) => ({
                ...p,
                isFeatured: false,
              })));
            }
          }
        }
      }, (err) => {
        console.warn('site_settings onSnapshot notice:', err);
      });
      return () => unsub();
    } catch {}
  }, []);

  // Navigation history & instant scroll restoration refs
  const historyStackRef = useRef<HistorySnapshot[]>([]);
  const pendingScrollRestoreRef = useRef<number | null>(null);
  const postsRef = useRef<Post[]>(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const findPostById = useCallback((id: string | null): Post | null => {
    if (!id) return null;
    return postsRef.current.find((p) => p.id === id) || INITIAL_POSTS.find((p) => p.id === id) || null;
  }, []);

  const getUrlForRoute = (view: string, post?: Post | null, category?: string, search?: string) => {
    if (view === 'article-detail' && post) {
      return `/?article=${encodeURIComponent(post.slug || post.id)}`;
    }
    if (view === 'category' && category && category !== 'all') {
      return `/?category=${encodeURIComponent(category)}`;
    }
    if (view === 'search') {
      return search ? `/?search=${encodeURIComponent(search)}` : '/?search';
    }
    if (['gallery', 'about', 'privacy', 'contact'].includes(view)) {
      return `/?view=${encodeURIComponent(view)}`;
    }
    return '/';
  };

  const navigateTo = (
    newView: string,
    options?: {
      post?: Post | null;
      category?: string;
      subcategory?: string;
      page?: number;
      searchQuery?: string;
    }
  ) => {
    const currentScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    const currentSnapshot: HistorySnapshot = {
      view: currentView,
      selectedPostId: selectedPost?.id || null,
      selectedPost,
      activeCategory,
      activeSubcategory,
      categoryPage,
      searchPageQuery,
      scrollY: currentScroll,
    };

    historyStackRef.current.push(currentSnapshot);

    const targetCategory = options?.category !== undefined ? options.category : (newView === 'home' ? 'all' : activeCategory);
    const targetSubcategory = options?.subcategory !== undefined ? options.subcategory : 'all';
    const targetPage = options?.page !== undefined ? options.page : 1;
    const targetSearch = options?.searchQuery !== undefined ? options.searchQuery : '';
    const targetPost = options?.post !== undefined ? options.post : null;

    const targetUrl = getUrlForRoute(newView, targetPost, targetCategory, targetSearch);

    if (typeof window !== 'undefined') {
      try {
        const nextSnapshot: HistorySnapshot = {
          view: newView,
          selectedPostId: targetPost?.id || null,
          selectedPost: targetPost,
          activeCategory: targetCategory,
          activeSubcategory: targetSubcategory,
          categoryPage: targetPage,
          searchPageQuery: targetSearch,
          scrollY: 0,
        };
        window.history.pushState({ appNav: true, snapshot: nextSnapshot }, '', targetUrl);
      } catch {}
    }

    pendingScrollRestoreRef.current = 0;
    setCurrentView(newView);
    setSelectedPost(targetPost);
    if (options?.category !== undefined) setActiveCategory(options.category);
    if (options?.subcategory !== undefined) setActiveSubcategory(options.subcategory);
    if (options?.page !== undefined) setCategoryPage(options.page);
    if (options?.searchQuery !== undefined) setSearchPageQuery(options.searchQuery);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const navigateBack = useCallback(() => {
    if (historyStackRef.current.length > 0) {
      const prev = historyStackRef.current.pop()!;
      pendingScrollRestoreRef.current = prev.scrollY;
      setCurrentView(prev.view);
      const restoredPost = prev.selectedPost || findPostById(prev.selectedPostId);
      setSelectedPost(restoredPost);
      setActiveCategory(prev.activeCategory);
      setActiveSubcategory(prev.activeSubcategory);
      setCategoryPage(prev.categoryPage);
      setSearchPageQuery(prev.searchPageQuery);
      if (typeof window !== 'undefined') {
        const backUrl = getUrlForRoute(prev.view, restoredPost, prev.activeCategory, prev.searchPageQuery);
        try {
          window.history.replaceState({ appNav: true, snapshot: prev }, '', backUrl);
        } catch {}
      }
    } else {
      pendingScrollRestoreRef.current = 0;
      setSelectedPost(null);
      setCurrentView('home');
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState({ appNav: true, snapshot: null }, '', '/');
        } catch {}
      }
    }
  }, [findPostById]);

  const handleSelectPost = (post: Post) => {
    navigateTo('article-detail', { post });
  };

  useEffect(() => {
    const path = currentView === 'article-detail' && selectedPost ? `/article/${selectedPost.id}` : `/${currentView === 'home' ? '' : currentView}`;
    recordAnonymousPageView(path);
  }, [currentView, selectedPost]);

  const handleBackToArticles = () => {
    if (typeof window !== 'undefined' && window.history.state?.appNav && window.history.length > 1) {
      window.history.back();
    } else {
      navigateBack();
    }
  };

  // Browser popstate handler & manual scroll restoration setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }

      // Deep link inspection on initial mount (?article=... or ?category=...)
      setTimeout(() => {
        try {
          const params = new URLSearchParams(window.location.search);
          const articleParam = params.get('article') || params.get('post');
          const categoryParam = params.get('category');
          const viewParam = params.get('view');
          const searchParam = params.get('search');

          let initView = 'home';
          let initPost: Post | null = null;
          let initCategory = 'all';
          let initSearch = '';

          if (articleParam) {
            const clean = decodeURIComponent(articleParam).trim();
            const found = postsRef.current.find((p) => p.slug === clean || p.id === clean) || INITIAL_POSTS.find((p) => p.slug === clean || p.id === clean);
            if (found) {
              initView = 'article-detail';
              initPost = found;
              setSelectedPost(found);
              setCurrentView('article-detail');
            }
          } else if (categoryParam) {
            initView = 'category';
            initCategory = categoryParam;
            setActiveCategory(categoryParam);
            setCurrentView('category');
          } else if (viewParam && ['gallery', 'about', 'privacy', 'contact'].includes(viewParam)) {
            initView = viewParam;
            setCurrentView(viewParam);
          } else if (searchParam !== null) {
            initView = 'search';
            initSearch = searchParam;
            setSearchPageQuery(searchParam);
            setCurrentView('search');
          }

          if (!window.history.state?.snapshot) {
            const initialSnapshot: HistorySnapshot = {
              view: initView,
              selectedPostId: initPost?.id || null,
              selectedPost: initPost,
              activeCategory: initCategory,
              activeSubcategory: 'all',
              categoryPage: 1,
              searchPageQuery: initSearch,
              scrollY: 0,
            };
            try {
              window.history.replaceState({ appNav: true, snapshot: initialSnapshot }, '', window.location.search || '/');
            } catch {}
          }
        } catch {}
      }, 0);
    }

    const handlePopState = (event: PopStateEvent) => {
      const snapshot = event.state?.snapshot as HistorySnapshot | undefined;
      if (snapshot) {
        pendingScrollRestoreRef.current = snapshot.scrollY || 0;
        setCurrentView(snapshot.view || 'home');
        setSelectedPost(snapshot.selectedPost || findPostById(snapshot.selectedPostId));
        setActiveCategory(snapshot.activeCategory || 'all');
        setActiveSubcategory(snapshot.activeSubcategory || 'all');
        setCategoryPage(snapshot.categoryPage || 1);
        setSearchPageQuery(snapshot.searchPageQuery || '');
        if (historyStackRef.current.length > 0) {
          historyStackRef.current.pop();
        }
      } else {
        const params = new URLSearchParams(window.location.search);
        const articleParam = params.get('article') || params.get('post');
        if (articleParam) {
          const clean = decodeURIComponent(articleParam).trim();
          const found = postsRef.current.find((p) => p.slug === clean || p.id === clean) || INITIAL_POSTS.find((p) => p.slug === clean || p.id === clean);
          if (found) {
            setSelectedPost(found);
            setCurrentView('article-detail');
            return;
          }
        }
        navigateBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [findPostById, navigateBack]);

  // Deep link resolver when posts are asynchronously loaded from Firestore
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const articleParam = params.get('article') || params.get('post');
        if (articleParam && !selectedPost) {
          const clean = decodeURIComponent(articleParam).trim();
          const found = posts.find((p) => p.slug === clean || p.id === clean);
          if (found) {
            setSelectedPost(found);
            setCurrentView('article-detail');
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, [posts, selectedPost]);

  // Instant scroll restore effect: executes before paint to prevent any animated scroll
  useIsomorphicLayoutEffect(() => {
    if (pendingScrollRestoreRef.current !== null) {
      const targetY = pendingScrollRestoreRef.current;
      pendingScrollRestoreRef.current = null;

      window.scrollTo({ top: targetY, behavior: 'instant' });

      const raf1 = requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      });

      return () => cancelAnimationFrame(raf1);
    }
  }, [currentView, selectedPost, activeCategory, activeSubcategory, categoryPage]);

  // Initialize Firebase connection and sync posts
  useEffect(() => {
    testConnection().catch(() => {});

    try {
      const postsCol = collection(db, 'posts');
      const unsubscribe = onSnapshot(
        postsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remotePosts: Post[] = [];
            snapshot.forEach((docSnap) => {
              remotePosts.push({ id: docSnap.id, ...docSnap.data() } as Post);
            });

            let deletedIds: string[] = [];
            let localCustom: Post[] = [];
            try {
              deletedIds = JSON.parse(localStorage.getItem('rs_deleted_posts') || '[]');
              const saved = localStorage.getItem('rs_custom_posts');
              if (saved) localCustom = JSON.parse(saved);
            } catch {}

            const map = new Map<string, Post>();
            INITIAL_POSTS.filter((p) => !deletedIds.includes(p.id)).forEach((p) => map.set(p.id, p));
            localCustom.filter((p) => !deletedIds.includes(p.id)).forEach((p) => map.set(p.id, p));
            remotePosts.filter((p) => !deletedIds.includes(p.id)).forEach((p) => map.set(p.id, p));

            const savedFId = typeof window !== 'undefined' ? localStorage.getItem('rs_featured_post_id') : null;
            const remoteFeatured = remotePosts.find((p) => p.isFeatured);
            const currentFId = savedFId || featuredPostId || (remoteFeatured ? remoteFeatured.id : null);
            const merged = Array.from(map.values()).map((p) => ({
              ...p,
              isFeatured: currentFId ? p.id === currentFId : Boolean(p.isFeatured),
            }));
            setPosts(merged);

            try {
              localStorage.setItem('rs_custom_posts', JSON.stringify(merged));
            } catch {}
          }
        },
        (error) => {
          console.warn('Firestore posts listener note:', error?.message || error);
        }
      );

      return () => unsubscribe();
    } catch {
      // Fallback
    }
  }, []);

  // Chronologically ordered published posts
  const publishedPosts = [...posts]
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const currentCategoryConfig = CATEGORY_MAP[activeCategory] || {
    name: activeCategory === 'all' ? 'সকল প্রকাশিত লেখা' : activeCategory,
    color: '#e11d2a',
  };

  // Filter posts by category and subcategory
  const filteredPosts = publishedPosts.filter((p) => {
    if (activeCategory === 'all') return true;
    const matchesCategory =
      p.category === activeCategory ||
      (activeCategory === 'tech-gossip' && (p.category === 'technology' || p.category === 'tech-gossip' || p.category === 'social-media')) ||
      (activeCategory === 'computer-programming' && (p.category === 'tutorials' || p.category === 'computer-programming' || p.category === 'python')) ||
      (activeCategory === 'artificial-intelligence' && (p.category === 'contemporary' || p.category === 'artificial-intelligence')) ||
      (activeCategory === 'research' && (p.category === 'research' || p.category === 'stata' || p.category === 'kobo-toolbox')) ||
      (activeCategory === 'data-science' && (p.category === 'data-science' || p.category === 'technology')) ||
      (activeCategory === 'diversified' && (p.category === 'diversified' || p.category === 'experience')) ||
      p.tags?.some((t) => t.toLowerCase() === activeCategory.toLowerCase());

    if (!matchesCategory) return false;

    if (activeSubcategory !== 'all') {
      const sub = currentCategoryConfig.subcategories?.find((s) => s.id === activeSubcategory);
      if (sub && sub.tag) {
        return p.tags?.some((t) => t.includes(sub.tag)) || p.category === activeSubcategory;
      }
    }
    return true;
  });

  const PAGE_SIZE = 6;
  const totalCategoryPages = Math.ceil(filteredPosts.length / PAGE_SIZE) || 1;
  const paginatedCategoryPosts = filteredPosts.slice(
    (categoryPage - 1) * PAGE_SIZE,
    categoryPage * PAGE_SIZE
  );

  // Hero Lead Story (বিশেষ নিবন্ধ):
  // 1. Matches explicitly chosen featuredPostId (from Firestore site_settings or localStorage)
  // 2. OR any post with isFeatured === true
  // 3. Fallback to latest published post
  const effectiveFeaturedId = isMounted
    ? (featuredPostId || (typeof window !== 'undefined' ? localStorage.getItem('rs_featured_post_id') : null))
    : null;
  const explicitFeaturedPost = effectiveFeaturedId
    ? publishedPosts.find((p) => p.id === effectiveFeaturedId)
    : publishedPosts.find((p) => p.isFeatured);

  const leadPost = explicitFeaturedPost || publishedPosts.find((p) => p.isFeatured) || publishedPosts[0] || posts[0] || INITIAL_POSTS[0];

  // Hero Side Stories (4 posts excluding the chosen lead post)
  const heroSidePosts = publishedPosts.filter((p) => p.id !== leadPost?.id).slice(0, 4);

  // Tech gossip posts (Section 2 matching blog.suhanurrahman.com, excluding lead post)
  const techGossipPosts = publishedPosts
    .filter((p) => p.id !== leadPost?.id)
    .filter(
      (p) => p.category === 'tech-gossip' || p.category === 'technology' || p.category === 'social-media'
    ).slice(0, 3);
  const displayTechPosts = techGossipPosts.length > 0 ? techGossipPosts : publishedPosts.filter((p) => p.id !== leadPost?.id).slice(0, 3);

  // Remaining latest posts excluding leadPost and heroSidePosts
  const heroSideIds = new Set(heroSidePosts.map((p) => p.id));
  const latestPosts = publishedPosts.filter((p) => p.id !== leadPost?.id && !heroSideIds.has(p.id));

  // Top 4 most read / trending posts
  const trendingPosts = [...posts]
    .filter((p) => p.published)
    .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
    .slice(0, 4);

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'technology':
      case 'tech-gossip':
        return { name: 'প্রযুক্তি কথন', color: '#2563eb' };
      case 'tutorials':
      case 'computer-programming':
      case 'python':
        return { name: 'কম্পিউটার প্রোগ্রামিং', color: '#059669' };
      case 'contemporary':
      case 'artificial-intelligence':
        return { name: 'এআই ও সমসাময়িক', color: '#e11d2a' };
      case 'experience':
        return { name: 'ব্যক্তিগত অভিজ্ঞতা', color: '#7c3aed' };
      case 'data-science':
        return { name: 'ডেটা সায়েন্স', color: '#0284c7' };
      case 'research':
      case 'stata':
      case 'kobo-toolbox':
        return { name: 'রিসার্চ', color: '#d97706' };
      default:
        return { name: 'বিশেষ নিবন্ধ', color: '#0284c7' };
    }
  };

  return (
    <div className="site-public min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      
      {/* Magazine Sticky Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'search') {
            navigateTo('search', { searchQuery: '' });
          } else {
            navigateTo(view);
          }
        }}
        onSelectCategory={(catSlug) => {
          navigateTo('category', {
            category: catSlug,
            subcategory: 'all',
            page: 1,
          });
        }}
        openSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Magazine Body */}
      <main className="flex-1 w-full pb-16">
        
        {/* VIEW 1: SINGLE ARTICLE DETAIL */}
        {currentView === 'article-detail' && (
          <div className="mag-container pt-8">
            <ArticleView
              post={selectedPost || leadPost}
              onBack={handleBackToArticles}
              allPosts={posts}
              onSelectPost={handleSelectPost}
            />
          </div>
        )}

        {/* VIEW 2: HOMEPAGE (Exact Suhanur Rahman Blog Magazine Architecture) */}
        {(currentView === 'home' || !['article-detail', 'articles', 'category', 'search', 'gallery', 'about', 'privacy', 'contact'].includes(currentView)) && (
          <div className="space-y-12">
            
            {/* SECTION 1: HERO SECTION matching blog.suhanurrahman.com */}
            {leadPost && (
              <section className="mag-container">
                <div className="mag-hero">
                  
                  {/* Left Lead Story */}
                  <article
                    onClick={() => handleSelectPost(leadPost)}
                    className="mag-hero-lead reveal is-visible cursor-pointer"
                    style={{ '--cat': getCategoryMeta(leadPost.category).color } as React.CSSProperties}
                  >
                    <div className="mag-hero-media">
                      <img
                        src={leadPost.coverImage}
                        alt={leadPost.title}
                        loading="lazy"
                      />
                    </div>

                    <span
                      className="mag-chip cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('category', {
                          category: leadPost.category,
                          subcategory: 'all',
                          page: 1,
                        });
                      }}
                    >
                      {getCategoryMeta(leadPost.category).name}
                    </span>

                    <h1 className="mag-hero-title">
                      <span>{leadPost.title}</span>
                    </h1>

                    <p className="mag-hero-dek">
                      {leadPost.excerpt}
                    </p>

                    <div className="mag-meta">
                      <span>{new Date(leadPost.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span className="opacity-40">·</span>
                      <span>{leadPost.authorName}</span>
                    </div>
                  </article>

                  {/* Right Side Stack: 4 Stories with Dividers */}
                  <div className="mag-hero-side">
                    {heroSidePosts.map((post) => {
                      const meta = getCategoryMeta(post.category);
                      return (
                        <article
                          key={post.id}
                          onClick={() => handleSelectPost(post)}
                          className="reveal is-visible cursor-pointer"
                          style={{ '--cat': meta.color } as React.CSSProperties}
                        >
                          <span
                            className="mag-chip text-xs cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo('category', {
                                category: post.category,
                                subcategory: 'all',
                                page: 1,
                              });
                            }}
                          >
                            {meta.name}
                          </span>
                          <h3>
                            <span>{post.title}</span>
                          </h3>
                          <div className="mag-meta">
                            <span>{new Date(post.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="opacity-40">·</span>
                            <span>{post.authorName}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                </div>
              </section>
            )}

            {/* SECTION 2: প্রযুক্তি কথন (Tech Section matching blog.suhanurrahman.com) */}
            <section className="mag-container home-tech-section">
              <div className="mag-section-head">
                <h2 className="mag-section-title">
                  প্রযুক্তি কথন
                </h2>
                <button
                  onClick={() => {
                    navigateTo('category', {
                      category: 'tech-gossip',
                      subcategory: 'all',
                      page: 1,
                    });
                  }}
                  className="mag-all cursor-pointer"
                >
                  সকল লেখা <span className="arrow">→</span>
                </button>
              </div>

              <div className="home-tech-grid">
                {displayTechPosts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className="home-tech-card reveal is-visible cursor-pointer"
                  >
                    <div>
                      <h3 className="home-tech-card-title">
                        <span>{post.title}</span>
                      </h3>
                      <p className="home-tech-card-excerpt text-[14px]">{post.excerpt}</p>
                    </div>
                    <img
                      className="home-tech-thumb"
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                    />
                  </article>
                ))}
              </div>
            </section>

            {/* SECTION 3: সাম্প্রতিক লেখা (Recent Articles Grid matching blog.suhanurrahman.com) */}
            <section className="mag-container pt-8 border-t border-[var(--line-2)]">
              <div className="mag-section-head">
                <h2 className="mag-section-title">
                  সাম্প্রতিক লেখা
                </h2>
                <button
                  onClick={() => {
                    navigateTo('category', {
                      category: 'all',
                      subcategory: 'all',
                      page: 1,
                    });
                  }}
                  className="mag-all cursor-pointer"
                >
                  সব লেখা <span className="arrow">→</span>
                </button>
              </div>

              {/* 3-Column Magazine Card Grid */}
              <div className="mag-grid">
                {filteredPosts.slice(0, displayCount).map((post, idx) => (
                  <RecentArticleCard
                    key={post.id}
                    post={post}
                    onSelect={handleSelectPost}
                    index={idx}
                  />
                ))}
              </div>

              {/* Load More Button matching Suhanur Rahman Blog */}
              {displayCount < filteredPosts.length && (
                <div className="pt-10 text-center">
                  <button
                    onClick={() => setDisplayCount((prev) => prev + 6)}
                    className="mag-btn cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>আরও লেখা দেখুন</span>
                  </button>
                </div>
              )}
            </section>

            {/* SECTION 4: পাঠকের সহায়তা (Donation Card matching blog.suhanurrahman.com) */}
            <section className="mag-container">
              <div className="mag-donation-card reveal">
                <div className="mag-donation-copy">
                  <span className="mag-donation-kicker">পাঠকের সহায়তা</span>
                  <h2>এই জার্নালকে এগিয়ে নিতে পাশে থাকুন</h2>
                  <p>স্বাধীনভাবে প্রযুক্তি, গবেষণা ও ডিজিটাল সংস্কৃতি নিয়ে কাজ চালিয়ে যেতে আপনার সহায়তা গুরুত্বপূর্ণ।</p>
                </div>

                <a
                  className="mag-btn primary mag-donation-btn cursor-pointer"
                  href="https://rasel.dev.bd"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>ডোনেট করুন →</span>
                </a>
              </div>
            </section>

          </div>
        )}

        {/* VIEW 3: CATEGORY / ARTICLES PAGE (Exact replica of blog.suhanurrahman.com/category/tech-gossip) */}
        {(currentView === 'articles' || currentView === 'category') && (
          <div className="mag-container pt-8">
            <section className="mag-section">
              
              {/* Category Header with Kicker, H1 and Meta - Exact same as target site */}
              <div className="mag-section-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div className="mag-kicker">বিভাগ</div>
                <h1 className="mag-article-title" style={{ fontSize: 'clamp(30px, 4vw, 46px)' }}>
                  {currentCategoryConfig.name}
                </h1>
                <p className="mag-meta">
                  পৃষ্ঠা {categoryPage} · মোট {filteredPosts.length} টি লেখা
                </p>
              </div>

              {/* Subcategories (if available for this category) */}
              {currentCategoryConfig.subcategories && currentCategoryConfig.subcategories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
                  {currentCategoryConfig.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveSubcategory(sub.id);
                        setCategoryPage(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        activeSubcategory === sub.id
                          ? 'bg-[var(--fg)] text-[var(--bg)]'
                          : 'bg-[var(--bg-2)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--line)]'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Magazine Card Grid - EXACT same classes and markup as blog.suhanurrahman.com */}
              {filteredPosts.length === 0 ? (
                <div className="py-16 text-center text-sm text-[var(--muted)] border border-dashed border-[var(--line)] rounded-xl">
                  এই বিষয়শ্রেণীতে কোনো লেখা পাওয়া যায়নি।
                </div>
              ) : (
                <div className="mag-grid">
                  {paginatedCategoryPosts.map((post) => {
                    const meta = getCategoryMeta(post.category);
                    return (
                      <article
                        key={post.id}
                        className="mag-card reveal is-visible cursor-pointer"
                        style={{ '--cat': meta.color } as React.CSSProperties}
                      >
                        <div
                          className="mag-card-media"
                          onClick={() => handleSelectPost(post)}
                        >
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            loading="lazy"
                          />
                        </div>
                        <div className="mag-card-body">
                          <span
                            className="mag-chip cursor-pointer"
                            onClick={() => {
                              navigateTo('category', {
                                category: post.category,
                                subcategory: 'all',
                                page: 1,
                              });
                            }}
                          >
                            {meta.name}
                          </span>
                          <h3
                            className="mag-card-title"
                            onClick={() => handleSelectPost(post)}
                          >
                            <span>{post.title}</span>
                          </h3>
                          <p className="mag-card-dek">
                            {post.excerpt}
                          </p>
                          <div className="mag-card-foot">
                            <span className="mag-meta">
                              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="mag-meta font-medium">
                              {post.authorName}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Bottom Pagination matching blog.suhanurrahman.com */}
              {totalCategoryPages > 1 && (
                <nav
                  aria-label="বিভাগের পৃষ্ঠা"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '36px',
                  }}
                >
                  {categoryPage > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo('category', {
                          category: activeCategory,
                          subcategory: activeSubcategory,
                          page: Math.max(1, categoryPage - 1),
                        });
                      }}
                      className="mag-btn cursor-pointer"
                    >
                      ← আগের পৃষ্ঠা
                    </button>
                  ) : (
                    <span />
                  )}

                  {categoryPage < totalCategoryPages ? (
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo('category', {
                          category: activeCategory,
                          subcategory: activeSubcategory,
                          page: categoryPage + 1,
                        });
                      }}
                      className="mag-btn cursor-pointer"
                    >
                      পরের পৃষ্ঠা →
                    </button>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </section>
          </div>
        )}

        {/* VIEW 4: PHOTOGRAPHY GALLERY */}
        {currentView === 'gallery' && (
          <div className="mag-container pt-8">
            <GallerySection />
          </div>
        )}

        {/* VIEW 5: ABOUT AUTHOR */}
        {currentView === 'about' && (
          <div className="mag-container pt-8">
            <AboutSection 
              onContactClick={() => {
                navigateTo('contact');
              }} 
              onSearchClick={() => {
                navigateTo('search', { searchQuery: '' });
              }}
            />
          </div>
        )}

        {/* VIEW 6: DEDICATED SEARCH PAGE */}
        {currentView === 'search' && (
          <div className="mag-container pt-4">
            <SearchPageSection
              posts={posts}
              initialQuery={searchPageQuery}
              onSelectPost={handleSelectPost}
            />
          </div>
        )}

        {/* VIEW 7: PRIVACY POLICY PAGE */}
        {currentView === 'privacy' && (
          <div className="mag-container pt-8">
            <PrivacySection
              onHomeClick={() => {
                navigateTo('home');
              }}
              onContactClick={() => {
                navigateTo('contact');
              }}
            />
          </div>
        )}

        {/* VIEW 8: CONTACT FORM */}
        {currentView === 'contact' && (
          <div className="mag-container pt-8">
            <ContactForm />
          </div>
        )}

      </main>

      {/* Magazine Footer */}
      <Footer
        onNavigate={(viewId) => {
          const categorySlugs = [
            'technology', 'tech-gossip', 'tutorials', 'computer-programming', 'python',
            'contemporary', 'artificial-intelligence', 'experience', 'data-science',
            'research', 'stata', 'kobo-toolbox', 'diversified', 'social-media',
            'marketing', 'blogging', 'trends', 'learn-with-digital'
          ];
          if (categorySlugs.includes(viewId)) {
            navigateTo('category', {
              category: viewId,
              subcategory: 'all',
              page: 1,
            });
          } else if (viewId === 'search') {
            navigateTo('search', { searchQuery: '' });
          } else {
            navigateTo(viewId);
          }
        }}
        openAdmin={() => {}}
      />

      {/* Global Realtime Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        posts={posts}
        onSelectPost={handleSelectPost}
        onViewAll={(q) => {
          navigateTo('search', { searchQuery: q });
        }}
      />

      {/* 100% SAME TO SAME BOTTOM TO TOP BUTTON */}
      <ScrollToTop />

    </div>
  );
}
