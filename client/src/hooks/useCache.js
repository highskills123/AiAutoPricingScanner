/**
 * React hook for client-side response caching
 */
import { useRef, useCallback } from 'react';

const useCache = (ttl = 5 * 60 * 1000) => {
  const cacheRef = useRef(new Map());
  const timestampsRef = useRef(new Map());

  const getCachedValue = useCallback(
    (key) => {
      const now = Date.now();
      const timestamp = timestampsRef.current.get(key);

      if (timestamp && now - timestamp < ttl) {
        return cacheRef.current.get(key);
      }

      // Invalidate expired cache
      cacheRef.current.delete(key);
      timestampsRef.current.delete(key);
      return null;
    },
    [ttl]
  );

  const setCachedValue = useCallback((key, value) => {
    cacheRef.current.set(key, value);
    timestampsRef.current.set(key, Date.now());
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    timestampsRef.current.clear();
  }, []);

  return { getCachedValue, setCachedValue, clearCache };
};

export default useCache;
