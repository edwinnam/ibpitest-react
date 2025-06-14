import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

const LazyImage = ({ 
  src, 
  alt, 
  placeholder,
  className = '',
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, setImageRef] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const observerRef = useRef();

  useEffect(() => {
    if (!imageRef) return;

    // Native lazy loading support
    if ('loading' in HTMLImageElement.prototype && loading === 'lazy') {
      setImageSrc(src);
      return;
    }

    // Intersection Observer for browsers without native lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observerRef.current = observer;
    observer.observe(imageRef);

    return () => {
      if (observerRef.current && imageRef) {
        observerRef.current.unobserve(imageRef);
      }
    };
  }, [imageRef, src, loading]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    setIsError(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setIsError(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  const aspectRatio = width && height ? (height / width) * 100 : null;

  return (
    <div 
      className={`lazy-image-container ${className}`}
      style={{
        ...(aspectRatio && { paddingBottom: `${aspectRatio}%` })
      }}
    >
      {/* Placeholder or blur effect */}
      {!isLoaded && placeholder && (
        <div className="lazy-image-placeholder">
          <img src={placeholder} alt="" aria-hidden="true" />
        </div>
      )}

      {/* Loading spinner */}
      {!isLoaded && !placeholder && !isError && (
        <div className="lazy-image-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="lazy-image-error">
          <i className="fas fa-image"></i>
          <p>이미지를 불러올 수 없습니다</p>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={setImageRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
        {...props}
      />
    </div>
  );
};

export default LazyImage;