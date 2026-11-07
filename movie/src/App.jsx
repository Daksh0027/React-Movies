import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar.jsx';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';

// Lazy load ExpandedCard (only loads when user clicks a movie)
const ExpandedCard = lazy(() => import('./components/ExpandedCard.jsx'));

import { getTrendingMovies, updateSearchCount } from './appwrite.js';
import { useUser } from '@clerk/clerk-react';
import useWatched from './hooks/useWatched.js';
import { dataCache } from './utils/cache.js';
import { prefetchMediaDetails, prefetchVisibleImages, prefetchNextPage } from './utils/prefetch.js';


const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_HEADERS = {
  accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`
};

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Renamed from movieList to mediaList to reflect movies and series
  const [mediaList, setMediaList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  
  // Filter: 'all' | 'movie' | 'tv'
  const [mediaFilter, setMediaFilter] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [genreMap, setGenreMap] = useState({ movie: {}, tv: {} });

  // Changed state to hold an object with id and media type
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Auth state
  const { isSignedIn, user } = useUser();

  // Watched list (per-user, stored in localStorage)
  const { isWatched, toggleWatched, watchedCount, watchedItems } = useWatched();
  const [showWatchedOnly, setShowWatchedOnly] = useState(false);
  const [watchedMediaList, setWatchedMediaList] = useState([]);

  const resultsRef = useRef(null);

  const observer = useRef();
  const lastMediaElementRef = useCallback(node => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !showWatchedOnly) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore, showWatchedOnly]);

  const handleSearch = async () => {
    setPage(1);
    await fetchData(searchTerm, 1);
    setTimeout(() => {
      if (resultsRef.current) {
        const y = resultsRef.current.getBoundingClientRect().top + window.scrollY - 40;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 150);
  };

  // This function now fetches both movies and TV series with aggressive caching
  const fetchData = useCallback(async (query = '', pageNum = 1) => {
    // Check cache first
    const cacheKey = `search-${query}-${mediaFilter}-${pageNum}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached) {
      // Use cached data instantly
      setMediaList(prev => pageNum === 1 ? cached.results : [...prev, ...cached.results]);
      setHasMore(pageNum < cached.totalPages && pageNum < 500);
      
      // Prefetch images for cached results
      prefetchVisibleImages(cached.results);
      
      // Prefetch next page in background
      if (cached.results.length > 0) {
        prefetchNextPage(query, pageNum, mediaFilter, API_KEY);
      }
      return;
    }
    
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setErrorMessage('');

    try {
      const movieEndpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${pageNum}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${pageNum}`;

      const seriesEndpoint = query
        ? `${API_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&page=${pageNum}`
        : `${API_BASE_URL}/tv/top_rated?language=en-US&page=${pageNum}`;

      // axios both movies and series together 
      const [movieResponse, seriesResponse] = await Promise.all([
        axios.get(movieEndpoint,{headers: API_HEADERS}),
        axios.get(seriesEndpoint, {headers : API_HEADERS})
      ]);
      
      // Add a 'media_type' to each object to identify it later
      const movies = movieResponse.data.results.map(item => ({ ...item, media_type: 'movie' }));
      const series = seriesResponse.data.results.map(item => ({ ...item, media_type: 'tv' }));

      // Combine and sort the results by popularity
      const combinedResults = [...movies, ...series]
        .sort((a, b) => b.popularity - a.popularity);

      const maxPages = Math.max(movieResponse.data.total_pages || 0, seriesResponse.data.total_pages || 0);
      setHasMore(pageNum < maxPages && pageNum < 500);

      // Cache the results
      dataCache.set(cacheKey, {
        results: combinedResults,
        totalPages: maxPages
      });

      // Prefetch images immediately
      prefetchVisibleImages(combinedResults);
      
      // Prefetch next page in background
      if (combinedResults.length > 0 && pageNum < maxPages) {
        prefetchNextPage(query, pageNum, mediaFilter, API_KEY);
      }

      if (combinedResults.length === 0 && pageNum === 1) {
        setErrorMessage('No movies or series found for your search.');
      }
      
      setMediaList(prev => pageNum === 1 ? combinedResults : [...prev, ...combinedResults]);

      if (query && combinedResults.length > 0 && pageNum === 1) {
        await updateSearchCount(query, combinedResults[0], user?.id);
      }
    } catch (error) {
      // Axios provides more detailed error info
      const message = error.response?.data?.status_message || error.message || 'Error fetching data.';
      console.error(`Error fetching data: ${message}`);
      if (pageNum === 1) {
        setErrorMessage(message);
        setMediaList([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user?.id, mediaFilter]);


  const loadTrendingMovies = useCallback(async () => {
    try {
      const movies = await getTrendingMovies(user?.id);
      setTrendingMovies(movies); 
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  }, [user?.id]);

  const loadTopMovies = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/movie/top_rated?language=en-US&page=1`,
        { headers: API_HEADERS }
      );
      // Get top movies with highest vote average (more than 3 for carousel)
      const topMovies = response.data.results
        .filter(movie => movie.poster_path) // Only movies with posters
        .slice(0, 12); // Get 12 movies for variety
      setTopMovies(topMovies);
    } catch (error) {
      console.error(`Error fetching top movies: ${error}`);
    }
  }, []);

  // Updated handler to accept the full media object
  const handleMediaClick = (media) => {
    const mediaType = media.media_type;
    const mediaId = media.id;
    const title = (media.title || media.name || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Navigate to the new URL
    navigate(`/${mediaType}/${mediaId}/${title}`);
    setSelectedMedia({ id: mediaId, type: mediaType });
  };

  const handleCloseModal = async () => {
    // Navigate back to home
    navigate('/');
    setSelectedMedia(null);
    setSearchTerm('');
    setSelectedGenre('all');
    setPage(1);
    await fetchData('', 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadGenres = async () => {
    try {
      const [movieGenresResponse, tvGenresResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/genre/movie/list?language=en`, { headers: API_HEADERS }),
        axios.get(`${API_BASE_URL}/genre/tv/list?language=en`, { headers: API_HEADERS })
      ]);

      const movieGenres = (movieGenresResponse.data.genres || []).reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
      }, {});

      const tvGenres = (tvGenresResponse.data.genres || []).reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
      }, {});

      setGenreMap({ movie: movieGenres, tv: tvGenres });
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchGenreMedia = useCallback(async (genreId, pageNum = 1) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setErrorMessage('');

    try {
      const requestTargets = [];

      if (mediaFilter !== 'tv') {
        requestTargets.push({
          type: 'movie',
          url: `${API_BASE_URL}/discover/movie?language=en-US&sort_by=vote_average.desc&vote_count.gte=400&with_genres=${genreId}&page=${pageNum}`
        });
      }

      if (mediaFilter !== 'movie') {
        requestTargets.push({
          type: 'tv',
          url: `${API_BASE_URL}/discover/tv?language=en-US&sort_by=vote_average.desc&vote_count.gte=200&with_genres=${genreId}&page=${pageNum}`
        });
      }

      const responses = await Promise.all(
        requestTargets.map(({ type, url }) =>
          axios.get(url, { headers: API_HEADERS }).then((res) => ({
            type,
            resData: res.data
          }))
        )
      );

      const flattened = responses.flatMap(({ type, resData }) =>
        (resData.results || []).map((item) => ({ ...item, media_type: type }))
      );

      let maxPages = 0;
      responses.forEach(({ resData }) => {
        if (resData.total_pages > maxPages) maxPages = resData.total_pages;
      });

      setHasMore(pageNum < maxPages && pageNum < 500);

      const uniqueMap = new Map();
      flattened.forEach((item) => {
        uniqueMap.set(`${item.media_type}-${item.id}`, item);
      });

      const combinedResults = Array.from(uniqueMap.values())
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

      if (combinedResults.length === 0 && pageNum === 1) {
        setErrorMessage('No media found for this genre.');
      }

      setMediaList(prev => pageNum === 1 ? combinedResults : [...prev, ...combinedResults]);
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || 'Error fetching genre media.';
      console.error(`Error fetching genre media: ${message}`);
      if (pageNum === 1) {
        setErrorMessage(message);
        setMediaList([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [mediaFilter]);

  const mediaHasGenre = (media, genreId) => {
    if (Array.isArray(media.genre_ids)) {
      return media.genre_ids.includes(genreId);
    }

    if (Array.isArray(media.genres)) {
      return media.genres.some((genre) => genre.id === genreId);
    }

    return false;
  };

  const genreOptions = useMemo(() => {
    if (mediaFilter === 'movie') {
      return Object.entries(genreMap.movie)
        .map(([id, name]) => ({ id: Number(id), name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    if (mediaFilter === 'tv') {
      return Object.entries(genreMap.tv)
        .map(([id, name]) => ({ id: Number(id), name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const mergedGenres = new Map();
    [...Object.entries(genreMap.movie), ...Object.entries(genreMap.tv)].forEach(([id, name]) => {
      if (!mergedGenres.has(Number(id))) {
        mergedGenres.set(Number(id), name);
      }
    });

    return Array.from(mergedGenres.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [genreMap.movie, genreMap.tv, mediaFilter]);

  const filteredMediaList = (showWatchedOnly ? watchedMediaList : mediaList)
    .filter((media) => mediaFilter === 'all' || media.media_type === mediaFilter)
    .filter((media) => selectedGenre === 'all' || mediaHasGenre(media, Number(selectedGenre)));

  useEffect(() => {
    loadGenres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedGenre('all');
    setPage(1);
  }, [mediaFilter]);

  useEffect(() => {
    loadTrendingMovies();
    loadTopMovies();
  }, [loadTrendingMovies, loadTopMovies]);

  // Handle URL parameters - open modal if navigating directly to a media URL
  useEffect(() => {
    const pathMatch = location.pathname.match(/^\/(movie|tv)\/(\d+)/);
    if (pathMatch) {
      const [, mediaType, mediaId] = pathMatch;
      setSelectedMedia({ id: parseInt(mediaId), type: mediaType });
    } else {
      // If we're on the home route and modal is open, close it
      if (selectedMedia && location.pathname === '/') {
        setSelectedMedia(null);
      }
    }
  }, [location.pathname]); // Only depend on pathname

  // Handle genre fetching or pagination
  useEffect(() => {
    if (showWatchedOnly) return; // Watched list has no pages yet

    if (selectedGenre !== 'all') {
      fetchGenreMedia(selectedGenre, page);
    } else {
      // Fetch data for page 1 when genre is 'all', or when scrolling page > 1
      fetchData(searchTerm, page);
    }
  }, [selectedGenre, showWatchedOnly, page, fetchGenreMedia, fetchData]); // Intentionally removed searchTerm from deps 

  // Fetch full TMDB details for all watched items when filter is toggled on
  useEffect(() => {
    if (!showWatchedOnly || watchedItems.length === 0) {
      setWatchedMediaList([]);
      return;
    }
    let cancelled = false;
    const fetchWatchedMedia = async () => {
      setIsLoading(true);
      try {
        const promises = watchedItems.map(({ mediaType, mediaId }) =>
          axios.get(`${API_BASE_URL}/${mediaType}/${mediaId}`, { headers: API_HEADERS })
            .then(res => ({ ...res.data, media_type: mediaType }))
            .catch(() => null)
        );
        const results = await Promise.all(promises);
        if (!cancelled) {
          setWatchedMediaList(results.filter(Boolean));
        }
      } catch (error) {
        console.error('Error fetching watched media:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchWatchedMedia();
    return () => { cancelled = true; };
  }, [showWatchedOnly, watchedItems]);

  return (
    <>
      {!selectedMedia && (
        <Navbar onHomeClick={handleCloseModal} mediaFilter={mediaFilter} setMediaFilter={setMediaFilter} showWatchedOnly={showWatchedOnly} setShowWatchedOnly={setShowWatchedOnly} watchedCount={watchedCount} isSignedIn={isSignedIn} scrollToResults={() => {
          setTimeout(() => {
            if (resultsRef.current) {
              const y = resultsRef.current.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 100);
        }} />
      )}
      <main>
        <div className="bg-animated" />
        <div className="wrapper">
        <header>
          {/* Continuous Scrolling Movie Carousel */}
          <div className="hero-carousel-wrapper">
            {topMovies.length > 0 ? (
              <div className="hero-carousel-track">
                {/* Duplicate the movies array twice for seamless infinite scroll */}
                {[...topMovies, ...topMovies].map((movie, index) => (
                  <div 
                    key={`${movie.id}-${index}`}
                    className="hero-carousel-item"
                    onClick={() => handleMediaClick({ ...movie, media_type: 'movie' })}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="hero-carousel-poster"
                    />
                    <div className="hero-carousel-overlay">
                      <p className="hero-carousel-title">{movie.title}</p>
                      <div className="hero-carousel-rating">
                        <img src="/star.svg" alt="Rating" />
                        <span>{movie.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-80 mx-auto flex items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>
          <h1>Find <span className="text-gradient">Movies And Series</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={handleSearch} />
        </header>

        {trendingMovies.length > 0 && !searchTerm && (
          <section className="trending">
            <h2><span className='text-gradient'>Suggested</span></h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li
                  key={movie.$id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSearchTerm(movie.searchTerm);
                    fetchData(movie.searchTerm);
                  }}
                >
                  <p>{index + 1}</p>
                  <div className="flex flex-col items-center -ml-3.5 shrink-0">
                    <div className="relative w-28 h-40 sm:w-40 sm:h-56 rounded-lg overflow-hidden shadow-lg border border-white/10 bg-dark-100 transition-all duration-300 hover:scale-105 hover:border-white/25">
                      <img
                        src={movie.poster_url}
                        alt={movie.searchTerm}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies" ref={resultsRef}>
          <h1><span className='text-gradient'>{mediaFilter === 'movie' ? 'Top Rated Movies' : mediaFilter === 'tv' ? 'Top Rated TV Shows' : 'Top Rated Movies And Shows'}</span></h1>
          <div className="flex items-center justify-end gap-3 mt-2 mb-4">
            <label htmlFor="genre-filter" className="text-light-200 text-sm sm:text-base">Genre:</label>
            <select
              id="genre-filter"
              value={selectedGenre}
              onChange={(e) => {
                const nextGenre = e.target.value;
                setSelectedGenre(nextGenre);
                setPage(1);

                if (nextGenre === 'all' && !showWatchedOnly && !searchTerm) {
                  fetchData('', 1);
                }
              }}
              className="bg-dark-100 text-white border border-white/10 rounded-full px-4 py-2 text-sm sm:text-base outline-none focus:border-[#cecefb]/50 cursor-pointer"
            >
              <option value="all">All Genres</option>
              {genreOptions.map((genre) => (
                <option key={genre.id} value={String(genre.id)}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="error-message">{errorMessage}</p>
          ) : filteredMediaList.length === 0 ? (
            <p className="error-message">Nothing matches these filters yet. Try another genre or media type.</p>
          ) : (
            <ul>
              {filteredMediaList.map((media, index) => {
                const isLast = index === filteredMediaList.length - 1;
                return (
                  <MovieCard
                    ref={isLast ? lastMediaElementRef : null}
                    key={`${media.media_type}-${media.id}`}
                    media={media}
                    onClick={() => handleMediaClick(media)}
                    onMouseEnter={() => prefetchMediaDetails(media.id, media.media_type, API_KEY)}
                    isWatched={isSignedIn && isWatched(media.media_type, media.id)}
                  />
                );
              })}
            </ul>
          )}
          {isLoadingMore && (
            <div className="mt-8 flex justify-center w-full">
              <Spinner />
            </div>
          )}
        </section>

        {/* Pass media ID and type and API Key to the children(ExpandedCard.jsx) */}
        {selectedMedia && (
          <Suspense fallback={<Spinner />}>
            <ExpandedCard 
              mediaId={selectedMedia.id}
              mediaType={selectedMedia.type} 
              apiKey={API_KEY} 
              onClose={handleCloseModal}
              isWatched={isSignedIn && isWatched(selectedMedia.type, selectedMedia.id)}
              onToggleWatched={isSignedIn ? toggleWatched : null}
            />
          </Suspense>
        )}
      </div>
    </main>
    </>
  );
};

export default App;