export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  readingTimeMinutes: number;
  viewsCount: number;
  likesCount: number;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  content: string;
  parentId?: string | null;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  replies?: Comment[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Subscriber {
  id?: string;
  email: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'reader';
  createdAt: string;
}

export interface SeoOptimizationResult {
  seoTitle: string;
  seoDescription: string;
  suggestedTags: string[];
  excerpt: string;
  seoScore: number;
  tips: string[];
}

export const BLOG_CATEGORIES = [
  { id: 'all', labelBn: 'সব পোস্ট', labelEn: 'All Posts' },
  { id: 'technology', labelBn: 'প্রযুক্তি ও কোডিং', labelEn: 'Technology' },
  { id: 'experience', labelBn: 'ব্যক্তিগত অভিজ্ঞতা', labelEn: 'Life Experience' },
  { id: 'contemporary', labelBn: 'সমসাময়িক চিন্তা', labelEn: 'Contemporary' },
  { id: 'tutorials', labelBn: 'টিউটোরিয়াল ও গাইড', labelEn: 'Tutorials' },
  { id: 'thoughts', labelBn: 'মনন ও অনুভূতি', labelEn: 'Reflections' },
] as const;
