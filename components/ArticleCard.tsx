'use client';

import React from 'react';
import { Post } from '../lib/types';

interface ArticleCardProps {
  post: Post;
  onSelect: (post: Post) => void;
  featured?: boolean;
  rankedIndex?: number;
}

export function ArticleCard({ post, onSelect, featured = false, rankedIndex }: ArticleCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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
      case 'diversified':
        return { name: 'বিবিধ', color: '#64748b' };
      default:
        return { name: 'বিশেষ নিবন্ধ', color: '#0284c7' };
    }
  };

  const { name: categoryName, color: categoryColor } = getCategoryMeta(post.category);

  // 1. FEATURED LEAD STORY (Suhanur Rahman Blog Magazine Lead Style)
  if (featured) {
    return (
      <article
        onClick={() => onSelect(post)}
        className="group cursor-pointer rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 overflow-hidden"
        style={{ '--cat': categoryColor } as React.CSSProperties}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          
          {/* Lead Media */}
          <div className="lg:col-span-7 relative aspect-16/10 overflow-hidden bg-[var(--bg-2)] border-t-4 border-[var(--cat,var(--accent))]">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover object-center group-hover:scale-104 transition-transform duration-600 ease-out"
              loading="lazy"
            />
          </div>

          {/* Lead Body */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="mag-chip">
                {categoryName}
              </span>

              <h2 className="font-serif-bn text-xl sm:text-2xl lg:text-[26px] font-bold text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors leading-[1.3] tracking-tight">
                {post.title}
              </h2>

              <p className="text-sm text-[var(--muted)] line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            {/* Foot */}
            <div className="pt-4 border-t border-[var(--line-2)] flex items-center justify-between text-xs text-[var(--muted)]">
              <div className="flex items-center gap-2">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-[var(--line)]"
                />
                <span className="font-medium text-[var(--fg)]">
                  {post.authorName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>{formattedDate}</span>
                <span>•</span>
                <span>{post.readingTimeMinutes} মিনিট পাঠ</span>
              </div>
            </div>

          </div>
        </div>
      </article>
    );
  }

  // 2. RANKED CARD (For Most Read / সর্বাধিক পঠিত)
  if (rankedIndex !== undefined) {
    const rankBengali = ['০১', '০২', '০৩', '০৪', '০৫', '০৬'][rankedIndex] || `০${rankedIndex + 1}`;

    return (
      <article
        onClick={() => onSelect(post)}
        className="mag-card"
        style={{ '--cat': categoryColor } as React.CSSProperties}
      >
        <div className="mag-card-media">
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 bg-black/80 text-white px-2 py-0.5 rounded text-xs font-bold font-serif-bn tracking-wider backdrop-blur-xs">
            {rankBengali}
          </div>
        </div>
        <div className="mag-card-body">
          <span className="mag-chip">{categoryName}</span>
          <h3 className="mag-card-title">{post.title}</h3>
          <p className="mag-card-dek">{post.excerpt}</p>
          <div className="mag-card-foot">
            <span>{formattedDate}</span>
            <span>{post.viewsCount} বার পঠিত</span>
          </div>
        </div>
      </article>
    );
  }

  // 3. STANDARD MAGAZINE CARD (Matches blog.suhanurrahman.com's mag-card)
  return (
    <article
      onClick={() => onSelect(post)}
      className="mag-card"
      style={{ '--cat': categoryColor } as React.CSSProperties}
    >
      <div className="mag-card-media">
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
        />
      </div>

      <div className="mag-card-body">
        <span className="mag-chip">
          {categoryName}
        </span>

        <h3 className="mag-card-title">
          {post.title}
        </h3>

        <p className="mag-card-dek">
          {post.excerpt}
        </p>

        <div className="mag-card-foot">
          <span>{formattedDate}</span>
          <span>{post.authorName}</span>
        </div>
      </div>
    </article>
  );
}
