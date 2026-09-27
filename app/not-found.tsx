import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--fg)] p-4 text-center">
      <h2 className="text-3xl font-serif-bn font-bold mb-2">পৃষ্ঠাটি পাওয়া যায়নি</h2>
      <p className="text-sm text-[var(--muted)] mb-6">আপনি যে পৃষ্ঠাটি খুঁজছেন তা সরানো হয়েছে অথবা আর বিদ্যমান নেই।</p>
      <Link 
        href="/" 
        className="px-5 py-2.5 bg-[var(--fg)] text-[var(--bg)] rounded-full text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        হোমপেজে ফিরে যান
      </Link>
    </div>
  );
}
