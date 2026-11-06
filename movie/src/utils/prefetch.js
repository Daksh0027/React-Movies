// Aggressive prefetching for instant loading
import axios from 'axios';
import { dataCache } from './cache';

const API_BASE_URL = 'https://api.themoviedb.org/3';

// Prefetch movie/TV details when hovering over cards
export const prefetchMediaDetails = async (mediaId, mediaType, apiKey) => {
  const cacheKey = `details-${mediaType}-${mediaId}`;
  
  // Don't prefetch if already cached
  if (dataCache.has(cacheKey)) {
    return;
  }

  try {
    const API_HEADERS = {
      accept: 'application/json',
      Authorization: `Bearer ${apiKey}`
    };

    const url = `${API_BASE_URL}/${mediaType}/${mediaId}?append_to_response=credits,external_ids`;
    const response = await axios.get(url, { headers: API_HEADERS });
    
    // Cache the response
    dataCache.set(cacheKey, response.data);
    
    // Prefetch poster image
    if (response.data.poster_path) {
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/w500${response.data.poster_path}`;
    }
  } catch (error) {
    console.warn('Prefetch failed:', error);
  }
};

// Prefetch images for visible cards
export const prefetchVisibleImages = (mediaList) => {
  mediaList.slice(0, 20).forEach(media => {
    if (media.poster_path) {
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/w500${media.poster_path}`;
    }
    if (media.backdrop_path) {
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`;
    }
  });
};

// Prefetch next page of results
export const prefetchNextPage = async (searchTerm, page, mediaFilter, apiKey) => {
  const cacheKey = `search-${searchTerm}-${mediaFilter}-${page + 1}`;
  
  if (dataCache.has(cacheKey)) {
    return;
  }

  try {
    const API_HEADERS = {
      accept: 'application/json',
      Authorization: `Bearer ${apiKey}`
    };

    const movieEndpoint = searchTerm
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(searchTerm)}&page=${page + 1}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${page + 1}`;

    const seriesEndpoint = searchTerm
      ? `${API_BASE_URL}/search/tv?query=${encodeURIComponent(searchTerm)}&page=${page + 1}`
      : `${API_BASE_URL}/tv/top_rated?language=en-US&page=${page + 1}`;

    const [movieResponse, seriesResponse] = await Promise.all([
      axios.get(movieEndpoint, { headers: API_HEADERS }),
      axios.get(seriesEndpoint, { headers: API_HEADERS })
    ]);

    const movies = movieResponse.data.results.map(item => ({ ...item, media_type: 'movie' }));
    const series = seriesResponse.data.results.map(item => ({ ...item, media_type: 'tv' }));
    const combinedResults = [...movies, ...series].sort((a, b) => b.popularity - a.popularity);

    dataCache.set(cacheKey, {
      results: combinedResults,
      totalPages: Math.max(movieResponse.data.total_pages, seriesResponse.data.total_pages)
    });
  } catch (error) {
    console.warn('Next page prefetch failed:', error);
  }
};
