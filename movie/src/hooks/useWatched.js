import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';

/**
 * Custom hook to manage a per-user "watched" list stored in localStorage.
 * Each entry is stored as "mediaType-mediaId" (e.g. "movie-123", "tv-456").
 */
const useWatched = () => {
  const { user } = useUser();
  const [watched, setWatched] = useState(new Set());

  const storageKey = user ? `watched_${user.id}` : null;

  // Load from localStorage when user changes
  useEffect(() => {
    if (!storageKey) {
      setWatched(new Set());
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setWatched(new Set(JSON.parse(stored)));
      } else {
        setWatched(new Set());
      }
    } catch {
      setWatched(new Set());
    }
  }, [storageKey]);

  // Persist to localStorage
  const persist = useCallback((newSet) => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify([...newSet]));
    }
  }, [storageKey]);

  const makeKey = (mediaType, mediaId) => `${mediaType}-${mediaId}`;

  const isWatched = useCallback((mediaType, mediaId) => {
    return watched.has(makeKey(mediaType, mediaId));
  }, [watched]);

  const toggleWatched = useCallback((mediaType, mediaId) => {
    setWatched((prev) => {
      const key = makeKey(mediaType, mediaId);
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      persist(next);
      return next;
    });
  }, [persist]);

  const watchedCount = watched.size;

  return { isWatched, toggleWatched, watchedCount };
};

export default useWatched;
