import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { getWatchedItems, addWatchedItem, removeWatchedItem } from '../appwrite.js';

/**
 * Custom hook to manage a per-user "watched" list stored in Appwrite.
 * Each entry is keyed as "mediaType-mediaId" (e.g. "movie-123", "tv-456").
 * The Appwrite collection stores: user_id, media_type, media_id.
 */
const useWatched = () => {
  const { user } = useUser();
  const userId = user?.id;
  const [watched, setWatched] = useState(new Set());  // Set of "type-id" keys
  const [loading, setLoading] = useState(false);

  const makeKey = (mediaType, mediaId) => `${mediaType}-${mediaId}`;

  // Load watched list from Appwrite when user changes
  useEffect(() => {
    if (!userId) {
      setWatched(new Set());
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const docs = await getWatchedItems(userId);
      if (!cancelled) {
        setWatched(new Set(docs.map(d => makeKey(d.media_type, d.media_id))));
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const isWatched = useCallback((mediaType, mediaId) => {
    return watched.has(makeKey(mediaType, mediaId));
  }, [watched]);

  const toggleWatched = useCallback(async (mediaType, mediaId) => {
    if (!userId) return;
    const key = makeKey(mediaType, mediaId);

    if (watched.has(key)) {
      // Optimistic remove
      setWatched(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      const ok = await removeWatchedItem(userId, mediaType, mediaId);
      if (!ok) {
        // Revert on failure
        setWatched(prev => new Set(prev).add(key));
      }
    } else {
      // Optimistic add
      setWatched(prev => new Set(prev).add(key));
      const doc = await addWatchedItem(userId, mediaType, mediaId);
      if (!doc) {
        // Revert on failure
        setWatched(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  }, [userId, watched]);

  const watchedCount = watched.size;

  return { isWatched, toggleWatched, watchedCount, loading };
};

export default useWatched;
