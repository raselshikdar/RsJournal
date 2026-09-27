'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, LoaderCircle } from 'lucide-react';
import { Post } from '../lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onViewAll?: (searchQuery: string) => void;
}

export function SearchModal({ isOpen, onClose, posts, onSelectPost, onViewAll }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredResults, setFilteredResults] = useState<Post[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setQuery('');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search logic matching blog.suhanurrahman.com
  useEffect(() => {
    const clean = query.trim().toLowerCase();
    const timer = setTimeout(() => {
      if (!clean) {
        setFilteredResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      const results = posts.filter((p) => {
        if (!p.published) return false;
        return (
          p.title.toLowerCase().includes(clean) ||
          p.excerpt.toLowerCase().includes(clean) ||
          p.content.toLowerCase().includes(clean) ||
          p.category.toLowerCase().includes(clean) ||
          p.tags?.some((t) => t.toLowerCase().includes(clean))
        );
      });
      setFilteredResults(results);
      setHasSearched(true);
      setIsSearching(false);
    }, clean ? 180 : 0);

    return () => clearTimeout(timer);
  }, [query, posts]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case 'technology':
        return 'প্রযুক্তি কথন';
      case 'tutorials':
        return 'কম্পিউটার প্রোগ্রামিং';
      case 'contemporary':
        return 'এআই ও সমসাময়িক';
      case 'experience':
        return 'ব্যক্তিগত অভিজ্ঞতা';
      default:
        return 'জার্নাল';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="mag-search"
      onMouseDown={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="mag-search-box"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Search Field */}
        <div className="mag-search-field">
          {isSearching ? (
            <LoaderCircle className="w-5 h-5 text-[var(--accent)] animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-[var(--fg)] shrink-0" strokeWidth={1.9} />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="লেখা খুঁজুন…"
            aria-label="Search"
          />

          <button
            type="button"
            className="mag-icon-btn !w-8 !h-8"
            aria-label="Close"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        {filteredResults.length > 0 && (
          <div className="mag-search-results">
            {filteredResults.map((post) => (
              <div
                key={post.id}
                className="mag-search-item"
                onClick={() => {
                  onSelectPost(post);
                  handleClose();
                }}
              >
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} />
                ) : (
                  <span className="w-16 h-12 rounded-lg bg-[var(--bg-2)] shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <h4>{post.title}</h4>
                  <span>{getCategoryName(post.category)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {hasSearched && !isSearching && filteredResults.length === 0 && query.trim() && (
          <div className="mag-search-results">
            <div className="mag-search-empty">
              “{query.trim()}” — কোনো ফলাফল পাওয়া যায়নি।
            </div>
          </div>
        )}

        {/* View All Action */}
        {query.trim() && !isSearching && filteredResults.length > 0 && (
          <button
            type="button"
            className="mag-search-all cursor-pointer"
            onClick={() => {
              const currentQ = query.trim();
              handleClose();
              if (onViewAll) {
                onViewAll(currentQ);
              }
            }}
          >
            সব ফলাফল দেখুন ↗
          </button>
        )}
      </div>
    </div>
  );
}
