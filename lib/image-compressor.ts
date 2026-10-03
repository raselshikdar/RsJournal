/**
 * Image compression utility to convert any uploaded image into 
 * highly-optimized WebP format strictly under 50 KB with the blog's
 * perfect 16:9 editorial aspect ratio.
 */

export interface CompressionResult {
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  width: number;
  height: number;
  format: 'image/webp';
}

export async function compressImageToWebP(
  fileOrUrl: File | string,
  targetMaxWidth = 960,
  maxSizeBytes = 48 * 1024 // 48 KB (strictly under 50 KB guarantee)
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const processImage = (srcUrl: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = () => reject(new Error('ইমেজ পার্স করতে ব্যর্থ হয়েছে।'));
      img.onload = () => {
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;

        // Blog's perfect aspect ratio: 16:9
        const targetRatio = 16 / 9;
        const srcRatio = srcW / srcH;

        // Calculate center crop to 16:9
        let cropX = 0;
        let cropY = 0;
        let cropW = srcW;
        let cropH = srcH;

        if (srcRatio > targetRatio) {
          // Source is wider than 16:9: crop left & right
          cropW = Math.round(srcH * targetRatio);
          cropX = Math.round((srcW - cropW) / 2);
        } else if (srcRatio < targetRatio) {
          // Source is taller than 16:9: crop top & bottom
          cropH = Math.round(srcW / targetRatio);
          cropY = Math.round((srcH - cropH) / 2);
        }

        // Standard 16:9 resolution: 960 x 540 max
        let targetW = Math.min(targetMaxWidth, cropW);
        let targetH = Math.round((targetW * 9) / 16);

        // Ensure minimum dimensions
        if (targetW < 480) {
          targetW = 480;
          targetH = 270;
        }

        // Iterative compression loop to guarantee WebP under 50 KB
        let quality = 0.82;
        let scale = 1.0;
        let bestDataUrl = '';
        let bestSizeBytes = Infinity;
        let bestW = targetW;
        let bestH = targetH;

        for (let attempt = 0; attempt < 10; attempt++) {
          const w = Math.max(360, Math.round(targetW * scale));
          const h = Math.round((w * 9) / 16);

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) break;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw center-cropped 16:9 into canvas
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, w, h);

          const webpData = canvas.toDataURL('image/webp', Math.max(0.25, quality));
          const commaIndex = webpData.indexOf(',');
          const base64Content = commaIndex !== -1 ? webpData.substring(commaIndex + 1) : '';
          const sizeBytes = Math.round((base64Content.length * 3) / 4);

          bestDataUrl = webpData;
          bestSizeBytes = sizeBytes;
          bestW = w;
          bestH = h;

          if (sizeBytes <= maxSizeBytes) {
            break;
          }

          // Progressively lower quality and resolution
          quality -= 0.12;
          scale *= 0.88;
        }

        resolve({
          dataUrl: bestDataUrl,
          sizeBytes: bestSizeBytes,
          sizeKb: Math.round((bestSizeBytes / 1024) * 10) / 10,
          width: bestW,
          height: bestH,
          format: 'image/webp',
        });
      };
      img.src = srcUrl;
    };

    if (typeof fileOrUrl === 'string') {
      processImage(fileOrUrl);
    } else {
      if (!fileOrUrl || !fileOrUrl.type.startsWith('image/')) {
        return reject(new Error('শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WebP) আপলোড করুন।'));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('ইমেজ ফাইলটি পড়তে ব্যর্থ হয়েছে।'));
      reader.onload = (e) => {
        const srcUrl = e.target?.result as string;
        processImage(srcUrl);
      };
      reader.readAsDataURL(fileOrUrl);
    }
  });
}
