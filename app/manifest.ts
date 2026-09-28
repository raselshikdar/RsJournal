import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "রাসেল শিকদার | ডিজিটাল ক্যানভাস ও টেক জার্নাল",
    short_name: "রাসেল শিকদার",
    description: "রাসেল শিকদারের প্রযুক্তি, ওয়েব ডেভেলপমেন্ট, গবেষণা ও চিন্তা-ভাবনা নিয়ে বাংলা ও ইংরেজি টেক জার্নাল।",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#8B5CF6",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
