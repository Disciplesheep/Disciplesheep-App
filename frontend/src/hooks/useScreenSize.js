import { useState, useEffect } from 'react';

/**
 * Returns the current screen size category.
 * phone:  < 640px  (Android phone portrait)
 * phablet: 640–767px (large phone / small phone landscape)
 * tablet: 768px+   (Android tablet portrait or landscape)
 */
export function useScreenSize() {
  const getSize = () => {
    const w = window.innerWidth;
    if (w < 640) return 'phone';
    if (w < 768) return 'phablet';
    return 'tablet';
  };

  const [size, setSize] = useState(getSize);

  useEffect(() => {
    const handler = () => setSize(getSize());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    size,
    isPhone: size === 'phone',
    isPhablet: size === 'phablet',
    isTablet: size === 'tablet',
    isMobile: size !== 'tablet', // phone or phablet
  };
}
