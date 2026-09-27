'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Post } from '../lib/types';

interface SearchPageSectionProps {
  posts: Post[];
  initialQuery?: string;
  onSelectPost: (post: Post) => void;
}

export function SearchPageSection({ posts, initialQuery = '', onSelectPost }: SearchPageSectionProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Post[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const clean = query.trim().toLowerCase();
    const timer = setTimeout(() => {
      if (!clean) {
        setResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      const filtered = posts.filter((p) => {
        if (!p.published) return false;
        return (
          p.title.toLowerCase().includes(clean) ||
          p.excerpt.toLowerCase().includes(clean) ||
          p.content.toLowerCase().includes(clean) ||
          p.category.toLowerCase().includes(clean) ||
          p.tags?.some((t) => t.toLowerCase().includes(clean))
        );
      });
      setResults(filtered);
      setHasSearched(true);
      setIsSearching(false);
    }, clean ? 180 : 0);

    return () => clearTimeout(timer);
  }, [query, posts]);

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'technology':
      case 'tech-gossip':
        return 'প্রযুক্তি কথন';
      case 'tutorials':
      case 'computer-programming':
        return 'কম্পিউটার প্রোগ্রামিং';
      case 'contemporary':
      case 'artificial-intelligence':
        return 'এআই ও সমসাময়িক';
      case 'experience':
        return 'ব্যক্তিগত অভিজ্ঞতা';
      case 'data-science':
        return 'ডেটা সায়েন্স';
      case 'research':
        return 'রিসার্চ';
      default:
        return 'জার্নাল';
    }
  };

  return (
    <div className="search-page">
      <section className="search-hero reveal">
        <div className="search-kicker">Search</div>
        <h1 className="search-title font-serif-bn">লেখা খুঁজুন</h1>
        <p className="search-dek">
          শিরোনাম, সংক্ষিপ্ত বর্ণনা বা লেখার ভেতরের শব্দ দিয়ে জার্নালের লেখা খুঁজে দেখুন। লিখতে শুরু করলেই ফলাফল স্বয়ংক্রিয়ভাবে আপডেট হবে।
        </p>

        <form
          className="search-form"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <span className="search-icon" aria-hidden="true">
            <Search className="w-5 h-5 text-[var(--muted)]" strokeWidth={1.9} />
          </span>

          <input
            ref={inputRef}
            className="search-input"
            type="search"
            placeholder="যা খুঁজছেন লিখুন…"
            aria-label="Search query"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            className="search-submit"
            type="submit"
            aria-label="লাইভ সার্চ"
            title="লাইভ সার্চ"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" strokeWidth={2} />
            )}
            <span className="search-submit-label">লাইভ সার্চ</span>
          </button>
        </form>
      </section>

      {/* Loading state */}
      {isSearching && (
        <div className="search-results-section">
          <div className="search-loading">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
            <span>অনুসন্ধান চলছে…</span>
          </div>
        </div>
      )}

      {/* Empty Initial State */}
      {!hasSearched && !isSearching && !query.trim() && (
        <div className="search-empty-state">
          <div className="search-empty">
            সার্চ বক্সে লিখলেই প্রকাশিত লেখাগুলো থেকে ফলাফল দেখাবে।
          </div>
        </div>
      )}

      {/* No Results Found */}
      {hasSearched && !isSearching && results.length === 0 && query.trim() && (
        <div className="search-empty-state">
          <div className="search-empty">
            “<strong>{query.trim()}</strong>” — কোনো ফলাফল পাওয়া যায়নি।
          </div>
        </div>
      )}

      {/* Results List */}
      {!isSearching && results.length > 0 && (
        <section className="search-results-section reveal">
          <p className="search-summary">
            মোট <strong>{results.length}</strong> টি ফলাফল পাওয়া গেছে:
          </p>

          <div className="search-results">
            {results.map((post) => (
              <article
                key={post.id}
                className="search-result group cursor-pointer"
                onClick={() => onSelectPost(post)}
              >
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="search-result-thumb object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="search-result-thumb search-result-placeholder">
                    ছবি নেই
                  </div>
                )}

                <div className="min-w-0">
                  <div className="search-result-category">
                    {getCategoryMeta(post.category)}
                  </div>
                  <h3 className="search-result-title font-serif-bn">
                    <span className="group-hover:text-[var(--accent)] transition-colors">
                      {post.title}
                    </span>
                  </h3>
                  <p className="search-result-excerpt line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
