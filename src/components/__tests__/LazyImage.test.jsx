import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LazyImage from '../LazyImage';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
});
window.IntersectionObserver = mockIntersectionObserver;

describe('LazyImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with placeholder initially', () => {
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test image"
        placeholder="placeholder.jpg"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('src', 'placeholder.jpg');
    expect(img).toHaveClass('lazy-image', 'loading');
  });

  it('loads image when visible', async () => {
    const onLoad = vi.fn();
    
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test image"
        onLoad={onLoad}
      />
    );

    // Simulate intersection
    const [[callback]] = mockIntersectionObserver.mock.calls;
    callback([{ isIntersecting: true }]);

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('src', 'test-image.jpg');
    });
  });

  it('shows error state on load failure', async () => {
    const onError = vi.fn();
    
    render(
      <LazyImage
        src="invalid-image.jpg"
        alt="Test image"
        onError={onError}
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simulate intersection
    const [[callback]] = mockIntersectionObserver.mock.calls;
    callback([{ isIntersecting: true }]);

    // Simulate error
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(img).toHaveClass('error');
      expect(onError).toHaveBeenCalled();
    });
  });

  it('respects threshold option', () => {
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test image"
        threshold={0.5}
      />
    );

    const [[, options]] = mockIntersectionObserver.mock.calls;
    expect(options.threshold).toBe(0.5);
  });

  it('respects rootMargin option', () => {
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test image"
        rootMargin="50px"
      />
    );

    const [[, options]] = mockIntersectionObserver.mock.calls;
    expect(options.rootMargin).toBe('50px');
  });

  it('supports native lazy loading', () => {
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test image"
        loading="lazy"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('applies custom className', () => {
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('lazy-image', 'custom-class');
  });

  it('handles missing IntersectionObserver gracefully', () => {
    window.IntersectionObserver = undefined;
    
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('src', 'test-image.jpg');
  });

  it('cleans up observer on unmount', () => {
    const disconnect = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect
    });

    const { unmount } = render(
      <LazyImage
        src="test-image.jpg"
        alt="Test image"
      />
    );

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});