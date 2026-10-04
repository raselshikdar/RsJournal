'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Post } from '../lib/types';
import { ArticleCard } from './ArticleCard';

interface RecentArticleCardProps {
  post: Post;
  onSelect: (post: Post) => void;
  index: number;
}

export function RecentArticleCard({ post, onSelect, index }: RecentArticleCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (typeof window === 'undefined') return;

    // Safety fallback: Ensure card is ALWAYS revealed even if IntersectionObserver is delayed or in an iframe
    const fallbackTimer = setTimeout(() => {
      setIsRevealed(true);
    }, 500 + (index % 3) * 60);

    // If IntersectionObserver is not supported in this client environment, reveal immediately
    if (!('IntersectionObserver' in window)) {
      const immediateTimer = setTimeout(() => setIsRevealed(true), 0);
      return () => {
        clearTimeout(immediateTimer);
        clearTimeout(fallbackTimer);
      };
    }

    // Check if card is already within the viewport on initial render
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const timer = setTimeout(() => setIsRevealed(true), (index % 3) * 60);
      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
      };
    }

    // Scroll reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '60px 0px 60px 0px',
      }
    );

    observer.observe(el);
    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`recent-card-scroll-reveal ${isRevealed ? 'is-revealed' : ''}`}
      style={{
        transitionDelay: isRevealed ? `${(index % 3) * 75}ms` : '0ms',
      }}
    >
      <ArticleCard post={post} onSelect={onSelect} />
    </div>
  );
}
