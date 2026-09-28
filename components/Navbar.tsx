'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Search, 
  Menu, 
  X,
  ChevronDown,
  BriefcaseBusiness
} from 'lucide-react';
import { useTheme } from './ThemeContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openSearch: () => void;
  onSelectCategory?: (categorySlug: string) => void;
}

interface MenuItem {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

export function Navbar({ currentView, setCurrentView, openSearch, onSelectCategory }: NavbarProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Exact categories and subcategories from blog.suhanurrahman.com
  const menuCategories: MenuItem[] = [
    {
      id: 'menu-ds',
      name: 'ডেটা সায়েন্স',
      slug: 'data-science',
      children: [],
    },
    {
      id: 'menu-prog',
      name: 'কম্পিউটার প্রোগ্রামিং',
      slug: 'computer-programming',
      children: [
        { id: 'sub-python', name: 'পাইথন', slug: 'python' },
      ],
    },
    {
      id: 'menu-tech',
      name: 'প্রযুক্তি কথন',
      slug: 'tech-gossip',
      children: [
        { id: 'sub-social', name: 'সোশ্যাল মিডিয়া', slug: 'social-media' },
        { id: 'sub-marketing', name: 'মার্কেটিং', slug: 'marketing' },
        { id: 'sub-blogging', name: 'ব্লগিং', slug: 'blogging' },
        { id: 'sub-trends', name: 'ট্রেন্ডস্‌', slug: 'trends' },
        { id: 'sub-learn', name: 'লার্ন উইদ ডিজিটাল', slug: 'learn-with-digital' },
      ],
    },
    {
      id: 'menu-ai',
      name: 'এআই ভয়েস',
      slug: 'artificial-intelligence',
      children: [],
    },
    {
      id: 'menu-research',
      name: 'রিসার্চ',
      slug: 'research',
      children: [
        { id: 'sub-stata', name: 'স্ট্যাটা (STATA)', slug: 'stata' },
        { id: 'sub-kobo', name: 'কোবো টুলবক্স (Kobo Toolbox)', slug: 'kobo-toolbox' },
      ],
    },
    {
      id: 'menu-diversified',
      name: 'বিবিধ',
      slug: 'diversified',
      children: [],
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeDrawer = () => {
    setMobileDrawerOpen(false);
    setExpandedGroupId(null);
  };

  const handleCategoryClick = (slug: string) => {
    closeDrawer();
    if (onSelectCategory) {
      onSelectCategory(slug);
    } else {
      setCurrentView('articles');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleHomeClick = () => {
    closeDrawer();
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <>
      <header className={`mag-header${isScrolled ? ' is-scrolled' : ''}`}>
        <div className="mag-container mag-header-inner">
          
          {/* Left Brand & Menu: Hamburger button is at left-most edge, aligned vertically with post cards */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              className="mag-icon-btn mag-menu-btn"
              aria-label="Menu"
              onClick={() => setMobileDrawerOpen(true)}
              title="মেনু খুলুন"
            >
              <Menu size={19} strokeWidth={1.9} />
            </button>

            <button
              onClick={handleHomeClick}
              className="mag-logo hover:opacity-95 transition-opacity text-left cursor-pointer"
            >
              <span>রাসেল</span>&nbsp;<b>শিকদার</b>
              <span style={{ fontSize: '0.5em', color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>
                জার্নাল
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links with Dropdown Menus */}
          <nav className="mag-nav" aria-label="Sections">
            {menuCategories.map((item) => {
              const hasChildren = item.children.length > 0;
              return (
                <div
                  key={item.id}
                  className={hasChildren ? 'mag-nav-dropdown' : 'mag-nav-item'}
                >
                  <button
                    onClick={() => handleCategoryClick(item.slug)}
                    className="mag-nav-link cursor-pointer"
                  >
                    <span>{item.name}</span>
                    {hasChildren && (
                      <ChevronDown className="mag-nav-chevron" size={13} strokeWidth={1.8} />
                    )}
                  </button>

                  {hasChildren && (
                    <div className="mag-nav-submenu" role="menu">
                      {item.children.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleCategoryClick(sub.slug)}
                          role="menuitem"
                          className="w-full text-left cursor-pointer"
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Header Tools: Search & Dark/Light Theme Switcher */}
          <div className="mag-tools">
            <button
              type="button"
              className="mag-icon-btn"
              aria-label="Search"
              onClick={openSearch}
              title="লেখা খুঁজুন"
            >
              <Search size={18} strokeWidth={1.9} />
            </button>

            <button
              type="button"
              className="mag-icon-btn"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              title={mounted && theme === 'dark' ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
            >
              {mounted && theme === 'dark' ? (
                <Sun size={18} strokeWidth={1.9} className="text-amber-400" />
              ) : (
                <Moon size={18} strokeWidth={1.9} />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer (Same to same like blog.suhanurrahman.com) */}
      {mobileDrawerOpen && (
        <div className="mag-drawer is-open" role="dialog" aria-modal="true">
          <div className="mag-drawer-scrim" onClick={closeDrawer} />
          
          <div className="mag-drawer-panel">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line-2)] mb-4">
              <span className="mag-logo">
                <span>রাসেল</span>&nbsp;<b>শিকদার</b>
                <span style={{ fontSize: '0.5em', color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>
                  জার্নাল
                </span>
              </span>
              <button
                type="button"
                className="mag-icon-btn"
                aria-label="Close"
                onClick={closeDrawer}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Portfolio Link */}
            <a
              className="mag-drawer-portfolio"
              href="https://rasel.dev.bd"
              target="_blank"
              rel="noreferrer"
            >
              <BriefcaseBusiness size={17} strokeWidth={1.8} />
              <span>পোর্টফলিও ↗</span>
            </a>

            {/* Navigation in Drawer */}
            <div className="mt-3 space-y-1">
              <button
                onClick={handleHomeClick}
                className="mag-drawer-link"
              >
                হোম
              </button>

              {menuCategories.map((item) => {
                const hasChildren = item.children.length > 0;
                const isExpanded = expandedGroupId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`mag-drawer-group${isExpanded ? ' is-expanded' : ''}`}
                  >
                    <div className="mag-drawer-row">
                      <button
                        onClick={() => handleCategoryClick(item.slug)}
                        className="mag-drawer-link !flex-1 !border-b-0"
                      >
                        {item.name}
                      </button>

                      {hasChildren && (
                        <button
                          type="button"
                          className="mag-drawer-toggle"
                          aria-label={`${item.name} submenu`}
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedGroupId(isExpanded ? null : item.id)}
                        >
                          <ChevronDown size={18} strokeWidth={1.9} />
                        </button>
                      )}
                    </div>

                    {hasChildren && (
                      <div className="mag-drawer-children">
                        <div className="mag-drawer-children-inner">
                          {item.children.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleCategoryClick(sub.slug)}
                              className="mag-drawer-child cursor-pointer"
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
