/**
 * Image Optimization Utilities
 */

/**
 * Generate srcset for responsive images
 * @param {string} src - Original image source
 * @param {number[]} widths - Array of widths to generate
 * @returns {string} srcset string
 */
export const generateSrcSet = (src, widths = [320, 640, 768, 1024, 1280, 1920]) => {
  if (!src || !src.includes('supabase')) {
    return '';
  }

  return widths
    .map(width => {
      const url = getOptimizedImageUrl(src, { width });
      return `${url} ${width}w`;
    })
    .join(', ');
};

/**
 * Get optimized image URL with transformations
 * @param {string} src - Original image source
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (src, options = {}) => {
  if (!src) return '';

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'cover'
  } = options;

  // Check if it's a Supabase storage URL
  if (src.includes('supabase') && src.includes('/storage/')) {
    const params = new URLSearchParams();
    
    if (width) params.append('width', width);
    if (height) params.append('height', height);
    params.append('quality', quality);
    params.append('format', format);
    params.append('resize', fit);

    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}${params.toString()}`;
  }

  // For external images, return as is
  return src;
};

/**
 * Preload critical images
 * @param {string[]} imageSrcs - Array of image sources to preload
 */
export const preloadImages = (imageSrcs) => {
  imageSrcs.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

/**
 * Convert image to WebP format using canvas (client-side)
 * @param {File} file - Image file
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<Blob>} WebP blob
 */
export const convertToWebP = async (file, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress image before upload
 * @param {File} file - Image file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Apply image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get image dimensions
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if browser supports WebP
 * @returns {Promise<boolean>}
 */
export const supportsWebP = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob !== null),
      'image/webp'
    );
  });
};

/**
 * Lazy load images using Intersection Observer
 * @param {string} selector - CSS selector for images
 * @param {Object} options - Intersection Observer options
 */
export const lazyLoadImages = (selector = 'img[data-lazy]', options = {}) => {
  const images = document.querySelectorAll(selector);
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.lazy;
          img.removeAttribute('data-lazy');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for browsers without Intersection Observer
    images.forEach(img => {
      img.src = img.dataset.lazy;
      img.removeAttribute('data-lazy');
    });
  }
};