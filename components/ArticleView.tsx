'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare
} from 'lucide-react';
import { Post, Comment } from '../lib/types';
import { INITIAL_COMMENTS } from '../lib/sample-data';
import { useToast } from './Toast';
import { useAuth } from './AuthContext';
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  increment, 
  query, 
  orderBy, 
  onSnapshot 
} from '../lib/firebase';
import { ArticleCard } from './ArticleCard';

interface ArticleViewProps {
  post: Post;
  onBack: () => void;
  allPosts: Post[];
  onSelectPost: (post: Post) => void;
}

export function ArticleView({ post, onBack, allPosts, onSelectPost }: ArticleViewProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showFloatingShare, setShowFloatingShare] = useState(false);
  const [copiedState, setCopiedState] = useState<'idle' | 'copied'>('idle');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Comments state with consistent initial state between SSR and client
  const [comments, setComments] = useState<Comment[]>(() => INITIAL_COMMENTS[post.id] || []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const cached = localStorage.getItem(`comments_${post.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setComments(parsed);
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, [post.id]);
  const [newCommentName, setNewCommentName] = useState(user?.displayName || '');
  const [newCommentEmail, setNewCommentEmail] = useState(user?.email || '');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Scroll listener for reading progress bar and floating share trigger
  useEffect(() => {
    let ticking = false;

    const onScrollOrResize = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
          // Progress bar
          const root = document.documentElement;
          const totalScrollable = root.scrollHeight - root.clientHeight;
          setScrollProgress(totalScrollable > 0 ? Math.min(100, (root.scrollTop / totalScrollable) * 100) : 0);

          // Floating share visibility (scrollY > 260 && footer not yet reached)
          const footElem = document.querySelector('.mag-article-foot');
          const footRect = footElem?.getBoundingClientRect();
          const footVisible = !!footRect && footRect.top < window.innerHeight && footRect.bottom > 0;
          setShowFloatingShare(window.scrollY > 260 && !footVisible);
        });
        ticking = true;
      }
    };

    onScrollOrResize();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  // Lightbox click listener on article images (same as blog.suhanurrahman.com)
  useEffect(() => {
    const handleImgClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'IMG' &&
        (target.closest('.mag-article-body') || target.classList.contains('mag-article-hero'))
      ) {
        const src = (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src;
        if (src) setLightboxImage(src);
      }
    };
    document.addEventListener('click', handleImgClick);
    return () => document.removeEventListener('click', handleImgClick);
  }, []);

  // Increment view count in Firestore once on mount
  useEffect(() => {
    try {
      const postRef = doc(db, 'posts', post.id);
      updateDoc(postRef, {
        viewsCount: increment(1)
      }).catch(() => {});
    } catch {
      // Ignored
    }
  }, [post.id]);

  // Load and listen to comments from Firestore
  useEffect(() => {
    // Real-time Firestore sync with merged deduplication
    try {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
        if (!snapshot.empty) {
          const remoteComments: Comment[] = [];
          snapshot.forEach((d) => {
            remoteComments.push({ id: d.id, ...d.data() } as Comment);
          });
          
          setComments((prev) => {
            const combinedMap = new Map<string, Comment>();
            // Retain local/existing
            prev.forEach((c) => combinedMap.set(c.id, c));
            // Add/overwrite remote
            remoteComments.forEach((c) => combinedMap.set(c.id, c));
            const merged = Array.from(combinedMap.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            try {
              localStorage.setItem(`comments_${post.id}`, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }, (err) => {
        console.warn('Firestore comments snapshot notice:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore comments init error:', err);
    }
  }, [post.id]);

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopiedState('copied');
      showToast('আর্টিকেলের লিঙ্ক কপি করা হয়েছে!', 'success');
      window.setTimeout(() => setCopiedState('idle'), 1800);
    } catch {
      setCopiedState('idle');
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.title,
          url,
        });
        return;
      } catch (err: unknown) {
        const errObj = err as { name?: string };
        if (errObj?.name === 'AbortError') return;
      }
    }
    await handleCopyLink();
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCommentName.trim();
    const cleanContent = newCommentContent.trim();

    if (!cleanName || !cleanContent) {
      showToast('অনুগ্রহ করে আপনার নাম এবং মন্তব্যের বক্তব্য লিখুন।', 'error');
      return;
    }

    setSubmittingComment(true);
    const commentId = 'comm_' + Date.now();
    const newComment: Comment = {
      id: commentId,
      postId: post.id,
      authorName: cleanName,
      authorEmail: newCommentEmail.trim() || 'reader@rasel.dev.bd',
      authorAvatar: user?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`,
      content: cleanContent,
      createdAt: new Date().toISOString(),
      parentId: null,
      status: 'approved' as const,
    };

    // Immediate state update & local persistence
    setComments((prev) => {
      const updated = [newComment, ...prev.filter((c) => c.id !== commentId)];
      try {
        localStorage.setItem(`comments_${post.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setNewCommentContent('');
    showToast('আপনার মন্তব্য প্রকাশিত হয়েছে!', 'success');

    try {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      await addDoc(commentsRef, {
        postId: newComment.postId,
        authorName: newComment.authorName,
        authorEmail: newComment.authorEmail,
        authorAvatar: newComment.authorAvatar,
        content: newComment.content,
        createdAt: newComment.createdAt,
        parentId: null,
        status: 'approved',
      });
    } catch (err) {
      console.warn('Comment saved locally; Firestore sync notice:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => {
      const updated = prev.filter((c) => c.id !== commentId);
      try {
        localStorage.setItem(`comments_${post.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('মন্তব্য মুছে ফেলা হয়েছে', 'info');
  };

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'technology':
        return { name: 'প্রযুক্তি কথন', color: '#2563eb' };
      case 'tutorials':
        return { name: 'কম্পিউটার প্রোগ্রামিং', color: '#059669' };
      case 'contemporary':
        return { name: 'এআই ও সমসাময়িক', color: '#e11d2a' };
      case 'experience':
        return { name: 'ব্যক্তিগত অভিজ্ঞতা', color: '#7c3aed' };
      default:
        return { name: 'বিশেষ নিবন্ধ', color: '#0284c7' };
    }
  };

  const { name: categoryName, color: categoryColor } = getCategoryMeta(post.category);

  const formattedDate = new Date(post.createdAt).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.published)
    .slice(0, 3);

  // Markdown rendering
  const renderFormattedMarkdown = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-5 space-y-2 list-disc list-inside text-[var(--fg)]">
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        flushList();
        if (inCodeBlock) {
          inCodeBlock = false;
          elements.push(
            <pre key={`code-${index}`} className="my-6 p-4 rounded-xl bg-zinc-900 text-zinc-100 text-sm overflow-x-auto border border-zinc-800 font-mono">
              <code>{codeContent.trim()}</code>
            </pre>
          );
          codeContent = '';
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        listItems.push(trimmed.substring(2));
        return;
      } else {
        flushList();
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="font-serif-bn text-2xl sm:text-3xl font-bold text-[var(--fg)] mt-10 mb-4 tracking-tight">
            {trimmed.replace('# ', '')}
          </h1>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="font-serif-bn text-xl sm:text-2xl font-bold text-[var(--fg)] mt-10 mb-4 pb-2 border-b border-[var(--line-2)] tracking-tight">
            {trimmed.replace('## ', '')}
          </h2>
        );
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="font-serif-bn text-lg sm:text-xl font-bold text-[var(--fg)] mt-8 mb-3 tracking-tight">
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="my-6 pl-4 py-2 border-l-4 border-[var(--accent)] bg-[var(--bg-2)] text-[var(--fg)] rounded-r-lg italic font-serif-bn text-lg">
            {trimmed.replace('> ', '')}
          </blockquote>
        );
        return;
      }

      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={index} className="my-8 border-[var(--line-2)]" />);
        return;
      }

      if (trimmed.length > 0) {
        elements.push(
          <p key={index} className="mb-6 leading-[1.95] text-[var(--fg)] text-[17.5px] sm:text-[18.5px]">
            {trimmed}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  // Reusable share button pair (100% same to same like blog.suhanurrahman.com)
  const renderShareButtons = (compact = false) => (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share this article"
        style={{
          background: '#d92b2b',
          backgroundColor: '#d92b2b',
          backgroundImage: 'none',
          color: '#fff',
          borderColor: '#d92b2b',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="2.5"></circle>
          <circle cx="6" cy="12" r="2.5"></circle>
          <circle cx="18" cy="19" r="2.5"></circle>
          <path d="m8.2 10.8 7.6-4.5"></path>
          <path d="m8.2 13.2 7.6 4.5"></path>
        </svg>
        {compact ? 'শেয়ার' : 'শেয়ার করুন'}
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        aria-label={copiedState === 'copied' ? 'Article link copied' : 'Copy article link'}
      >
        {copiedState === 'copied' ? 'কপি হয়েছে' : 'কপি লিংক'}
      </button>
    </>
  );

  return (
    <div className="mag-article" style={{ '--cat': categoryColor } as React.CSSProperties}>
      
      {/* Top Reading Progress Bar */}
      <div 
        className="mag-progress" 
        style={{ width: `${scrollProgress}%` }} 
        aria-hidden="true" 
      />

      {/* 100% SAME TO SAME FLOATING SOCIAL SHARE BAR */}
      {showFloatingShare && (
        <div className="mag-share mag-share-floating" aria-label="Article sharing actions">
          {renderShareButtons(true)}
        </div>
      )}

      {/* Back to feed button */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল লেখায় ফিরুন</span>
        </button>
      </div>

      {/* ARTICLE HEADER (Matching blog.suhanurrahman.com/how-ai-identify-image-and-how-generate-image) */}
      <header className="mag-article-head">
        
        {/* Kicker Category */}
        <span className="mag-kicker">
          {categoryName}
        </span>

        {/* Title */}
        <h1 className="mag-article-title">
          {post.title}
        </h1>

        {/* Dek / Subtitle */}
        {post.excerpt && (
          <p className="mag-article-dek">
            {post.excerpt}
          </p>
        )}

        {/* Compact Share Bar in Header */}
        <div className="mag-share mag-share-compact">
          {renderShareButtons(true)}
        </div>

        {/* Article Meta Row: Author, Date, Reading Time */}
        <div className="mag-article-meta">
          <span><b>{post.authorName}</b></span>
          <span className="dot"></span>
          <span>{formattedDate}</span>
          <span className="dot"></span>
          <span>{post.readingTimeMinutes} মিনিট পাঠ</span>
        </div>

      </header>

      {/* ARTICLE FIGURE / HERO IMAGE */}
      <figure className="mag-article-figure">
        <img
          src={post.coverImage}
          alt={post.title}
          className="mag-article-hero"
        />
      </figure>

      {/* ARTICLE BODY / PROSE CONTENT */}
      <article className="mag-article-body">
        {renderFormattedMarkdown(post.content)}
      </article>

      {/* ARTICLE FOOT / SOURCE ATTRIBUTION & BOTTOM SHARE */}
      <div className="mag-article-foot">
        <div className="mag-meta font-bold text-base font-serif-bn">
          {post.authorName}
        </div>

        <div className="mag-share">
          {renderShareButtons(false)}
        </div>
      </div>

      {/* COMMENTS SECTION */}
      <section className="mag-comments">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--line-2)] mb-5">
          <h3 className="font-serif-bn text-lg sm:text-xl font-bold text-[var(--fg)] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
            <span>মন্তব্য ({comments.length})</span>
          </h3>
        </div>

        {/* Proportional Compact Comment Submission Form */}
        <form onSubmit={handleCommentSubmit} className="mb-8 p-4 sm:p-5 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="আপনার নাম *"
              value={newCommentName}
              onChange={(e) => setNewCommentName(e.target.value)}
              className="h-10 px-3.5 text-sm bg-[var(--bg)] border border-[var(--line)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <input
              type="email"
              placeholder="ইমেইল (ঐচ্ছিক)"
              value={newCommentEmail}
              onChange={(e) => setNewCommentEmail(e.target.value)}
              className="h-10 px-3.5 text-sm bg-[var(--bg)] border border-[var(--line)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <textarea
            required
            rows={3}
            placeholder="আপনার সুচিন্তিত মন্তব্য লিখুন..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            className="w-full p-3 text-sm bg-[var(--bg)] border border-[var(--line)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors leading-relaxed resize-y min-h-[85px] max-h-[220px]"
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-xs text-[var(--muted)]">মন্তব্য সরাসরি প্রকাশিত হবে।</span>
            <button
              type="submit"
              disabled={submittingComment}
              className="h-10 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingComment ? 'পাঠানো হচ্ছে...' : 'মন্তব্য প্রকাশ করুন'}</span>
            </button>
          </div>
        </form>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] text-sm">
            এখনো কোনো মন্তব্য করা হয়নি। আপনার মূল্যবান মতামত দিয়ে আলোচনা শুরু করুন!
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comm) => (
              <div key={comm.id} className="p-3.5 sm:p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center font-bold text-xs text-[var(--accent)] shrink-0">
                      {comm.authorName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-serif-bn font-bold text-sm text-[var(--fg)] leading-tight">
                        {comm.authorName}
                      </h5>
                      <span className="text-[11px] text-[var(--muted)]">
                        {new Date(comm.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comm.id)}
                    className="text-xs text-[var(--muted)] hover:text-red-500 transition-colors p-1"
                    title="মন্তব্য মুছুন"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-2 text-sm sm:text-[14.5px] text-[var(--fg)] leading-relaxed pl-10.5">
                  {comm.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RELATED ARTICLES SECTION (Matching blog.suhanurrahman.com .mag-related) */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-10 border-t border-[var(--line-2)]">
          <div className="mag-section-head">
            <h2 className="mag-section-title">
              আরও লেখা
            </h2>
            <button
              onClick={onBack}
              className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer font-serif-bn"
            >
              <span>সব লেখা →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((rPost) => (
              <ArticleCard
                key={rPost.id}
                post={rPost}
                onSelect={onSelectPost}
              />
            ))}
          </div>
        </section>
      )}

      {/* Image Lightbox (Matching blog.suhanurrahman.com Lightbox) */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-500 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-label="Image Preview"
        >
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

    </div>
  );
}
