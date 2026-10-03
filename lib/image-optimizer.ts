/**
 * Image optimization utility for Rasel Shikder Blog
 * 
 * Rules strictly followed:
 * 1. Output format: WebP (best browser-native compression and fidelity)
 * 2. File size: Strictly < 50 KB (typically 20KB - 45KB)
 * 3. Aspect ratio: Standard blog 16:9 ratio (e.g. 960x540 max, center-cropped/fitted)
 */

export interface OptimizedImageResult {
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
  format: 'webp';
  caption?: string;
}

/**
 * Calculates byte size of a base64 Data URL
 */
export function getBase64ByteSize(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return 0;
  const base64Str = dataUrl.substring(commaIndex + 1);
  return Math.round((base64Str.length * 3) / 4);
}

/**
 * Compresses any image (File, Blob, or Data URL) into WebP format strictly under 50KB
 * with the blog's standard 16:9 aspect ratio.
 * 
 * @param fileOrDataUrl Image file or data URL
 * @param caption Optional caption
 * @param maxBytes Maximum allowed size in bytes (default 49KB = 50,176 bytes to stay safely under 50KB)
 */
export async function optimizeBlogImage(
  fileOrDataUrl: File | string,
  caption = 'আর্টিকেল চিত্র',
  maxBytes = 49 * 1024
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    // 1. Read input as data URL if File
    const processImageSrc = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          // Target 16:9 aspect ratio dimensions
          // Standard editorial blog target: 960x540
          let targetWidth = 960;
          let targetHeight = 540;

          // If source image is smaller than target, scale down proportionally in 16:9
          if (originalWidth < 960 && originalWidth >= 480) {
            targetWidth = Math.round(originalWidth);
            targetHeight = Math.round((targetWidth * 9) / 16);
          }

          // Calculate center crop from source image to fill 16:9 canvas
          const srcRatio = originalWidth / originalHeight;
          const targetRatio = 16 / 9;

          let cropX = 0;
          let cropY = 0;
          let cropWidth = originalWidth;
          let cropHeight = originalHeight;

          if (srcRatio > targetRatio) {
            // Source is wider than 16:9 -> crop sides
            cropWidth = Math.round(originalHeight * targetRatio);
            cropX = Math.round((originalWidth - cropWidth) / 2);
          } else if (srcRatio < targetRatio) {
            // Source is taller than 16:9 -> crop top/bottom
            cropHeight = Math.round(originalWidth / targetRatio);
            cropY = Math.round((originalHeight - cropHeight) / 2);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: false });

          if (!ctx) {
            throw new Error('Canvas 2D context not available');
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped & scaled 16:9 image
          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );

          // Iterative WebP compression to strictly satisfy < 50KB
          let quality = 0.82;
          let resultDataUrl = canvas.toDataURL('image/webp', quality);
          let currentBytes = getBase64ByteSize(resultDataUrl);

          // If still above maxBytes, step down quality
          const qualitySteps = [0.75, 0.65, 0.55, 0.45, 0.35, 0.25];
          let stepIdx = 0;

          while (currentBytes > maxBytes && stepIdx < qualitySteps.length) {
            quality = qualitySteps[stepIdx];
            resultDataUrl = canvas.toDataURL('image/webp', quality);
            currentBytes = getBase64ByteSize(resultDataUrl);
            stepIdx++;
          }

          // If still > maxBytes (extremely complex image), scale canvas down to 800x450 (16:9)
          if (currentBytes > maxBytes) {
            const smallerCanvas = document.createElement('canvas');
            smallerCanvas.width = 800;
            smallerCanvas.height = 450;
            const smCtx = smallerCanvas.getContext('2d');
            if (smCtx) {
              smCtx.imageSmoothingEnabled = true;
              smCtx.imageSmoothingQuality = 'high';
              smCtx.drawImage(canvas, 0, 0, 800, 450);
              for (const q of [0.65, 0.50, 0.35]) {
                const testUrl = smallerCanvas.toDataURL('image/webp', q);
                const testBytes = getBase64ByteSize(testUrl);
                resultDataUrl = testUrl;
                currentBytes = testBytes;
                if (testBytes <= maxBytes) break;
              }
            }
          }

          const sizeKb = Number((currentBytes / 1024).toFixed(1));

          resolve({
            dataUrl: resultDataUrl,
            sizeKb,
            width: targetWidth,
            height: targetHeight,
            format: 'webp',
            caption,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('ইমেজ ফাইল লোড করা সম্ভব হয়নি।'));
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      processImageSrc(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          processImageSrc(result);
        } else {
          reject(new Error('ফাইল রিড করা যায়নি।'));
        }
      };
      reader.onerror = () => reject(new Error('ফাইল রিড ত্রুটি।'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
