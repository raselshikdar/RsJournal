'use client';

import React, { useState } from 'react';
import { Camera, X, Calendar, Tag, ZoomIn, Download, ExternalLink } from 'lucide-react';
import { GalleryItem } from '../lib/types';
import { INITIAL_GALLERY } from '../lib/sample-data';

interface GallerySectionProps {
  customItems?: GalleryItem[];
}

export function GallerySection({ customItems }: GallerySectionProps) {
  const items = customItems && customItems.length > 0 ? customItems : INITIAL_GALLERY;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  const categories = [
    { id: 'all', label: 'সব ছবি' },
    { id: 'ভ্রমণ ও প্রকৃতি', label: 'ভ্রমণ ও প্রকৃতি' },
    { id: 'কাজের স্থান', label: 'কাজের স্থান' },
    { id: 'দৈনন্দিন মুহূর্ত', label: 'দৈনন্দিন মুহূর্ত' },
    { id: 'শহুরে জীবন', label: 'শহুরে জীবন' },
  ];

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter((item) => item.category === activeCategory);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Camera className="w-4 h-4" />
            <span>স্মৃতির অ্যালবাম ও আলোকচিত্র</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            মুহূর্ত ও ফটোগ্রাফি
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            ভ্রমণ, কাজের পরিবেশ এবং জীবনের কিছু খণ্ডকালীন অনুভূতির ভিজ্যুয়াল জার্নাল।
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedPhoto(item)}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 aspect-4/3"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 mb-1">
                {item.category}
              </span>
              <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
              <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5">{item.description}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                <span>{item.createdAt}</span>
                <span className="flex items-center gap-1 text-white underline">
                  <ZoomIn className="w-3.5 h-3.5" />
                  বড় করে দেখুন
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {selectedPhoto.category}
                </span>
                <span className="text-xs text-zinc-400">• {selectedPhoto.createdAt}</span>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Preview */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                className="max-h-[60vh] max-w-full object-contain"
              />
            </div>

            {/* Caption Info */}
            <div className="p-4 sm:p-5 bg-zinc-900 text-white space-y-1">
              <h3 className="text-base sm:text-lg font-bold">{selectedPhoto.title}</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {selectedPhoto.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
