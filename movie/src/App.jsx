import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar.jsx';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import ExpandedCard from './components/ExpandedCard.jsx';

import { getTrendingMovies, updateSearchCount } from './appwrite.js';
import { useUser } from '@clerk/clerk-react';
import useWatched from './hooks/useWatched.js';


const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_HEADERS = {
  accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Renamed from movieList to mediaList to reflect movies and series
  const [mediaList, setMediaList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);
  
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

  const handleSearch = async () => {
    await fetchData(searchTerm);
    setTimeout(() => {
      if (resultsRef.current) {
        const y = resultsRef.current.getBoundingClientRect().top + window.scrollY - 40;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 150);
  };

  // This function now fetches both movies and TV series
  const fetchData = useCallback(async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const movieEndpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const seriesEndpoint = query
        ? `${API_BASE_URL}/search/tv?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/tv/top_rated?language=en-US&page=1`; // sort by popularity descending is dumb

      // axios both movies and series together 
      const [movieResponse, seriesResponse] = await Promise.all([ /* Promise.all for multiple request */
        axios.get(movieEndpoint,{headers: API_HEADERS}),
        axios.get(seriesEndpoint, {headers : API_HEADERS})
      ]);
      
      // Add a 'media_type' to each object to identify it later
      const movies = movieResponse.data.results.map(item => ({ ...item, media_type: 'movie' }));
      const series = seriesResponse.data.results.map(item => ({ ...item, media_type: 'tv' }));

      // Combine and sort the results by popularity
      const combinedResults = [...movies, ...series]
        .sort((a, b) => b.popularity - a.popularity);

      if (combinedResults.length === 0) {
        setErrorMessage('No movies or series found for your search.');
      }
      
      setMediaList(combinedResults);

      if (query && combinedResults.length > 0) {
        await updateSearchCount(query, combinedResults[0], user?.id);
      }
    } catch (error) {
      // Axios provides more detailed error info
      const message = error.response?.data?.status_message || error.message || 'Error fetching data.';
      console.error(`Error fetching data: ${message}`);
      setErrorMessage(message);
      setMediaList([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);


  const loadTrendingMovies = useCallback(async () => {
    try {
      const movies = await getTrendingMovies(user?.id);
      setTrendingMovies(movies); 
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  }, [user?.id]);

  // Updated handler to accept the full media object
  const handleMediaClick = (media) => {
    setSelectedMedia({ id: media.id, type: media.media_type });
  };

  const handleCloseModal = async () => {
    setSelectedMedia(null);
    setSearchTerm('');
    setSelectedGenre('all');
    await fetchData();
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

  const fetchGenreMedia = useCallback(async (genreId) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const pagesToFetch = 3;
      const requestTargets = [];

      if (mediaFilter !== 'tv') {
        for (let page = 1; page <= pagesToFetch; page += 1) {
          requestTargets.push({
            type: 'movie',
            url: `${API_BASE_URL}/discover/movie?language=en-US&sort_by=vote_average.desc&vote_count.gte=400&with_genres=${genreId}&page=${page}`
          });
        }
      }

      if (mediaFilter !== 'movie') {
        for (let page = 1; page <= pagesToFetch; page += 1) {
          requestTargets.push({
            type: 'tv',
            url: `${API_BASE_URL}/discover/tv?language=en-US&sort_by=vote_average.desc&vote_count.gte=200&with_genres=${genreId}&page=${page}`
          });
        }
      }

      const responses = await Promise.all(
        requestTargets.map(({ type, url }) =>
          axios.get(url, { headers: API_HEADERS }).then((res) => ({
            type,
            results: res.data?.results || []
          }))
        )
      );

      const flattened = responses.flatMap(({ type, results }) =>
        results.map((item) => ({ ...item, media_type: type }))
      );

      const uniqueMap = new Map();
      flattened.forEach((item) => {
        uniqueMap.set(`${item.media_type}-${item.id}`, item);
      });

      const combinedResults = Array.from(uniqueMap.values())
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

      if (combinedResults.length === 0) {
        setErrorMessage('No media found for this genre.');
      }

      setMediaList(combinedResults);
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || 'Error fetching genre media.';
      console.error(`Error fetching genre media: ${message}`);
      setErrorMessage(message);
      setMediaList([]);
    } finally {
      setIsLoading(false);
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
    fetchData();
    loadGenres();
  }, [fetchData]);

  useEffect(() => {
    setSelectedGenre('all');
  }, [mediaFilter]);

  useEffect(() => {
    loadTrendingMovies();
  }, [loadTrendingMovies]);

  useEffect(() => {
    if (selectedGenre === 'all' || showWatchedOnly || searchTerm) {
      return;
    }

    fetchGenreMedia(selectedGenre);
  }, [selectedGenre, mediaFilter, showWatchedOnly, searchTerm, fetchGenreMedia]);

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
        <div className="pattern" />
        <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
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
                    <div className="relative w-28 h-40 sm:w-40 sm:h-56 rounded-lg overflow-hidden shadow-lg border border-slate-800 bg-dark-100 transition-transform hover:scale-105">
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

                if (nextGenre === 'all' && !showWatchedOnly && !searchTerm) {
                  fetchData();
                }
              }}
              className="bg-dark-100 text-white border border-light-200/20 rounded-lg px-3 py-2 text-sm sm:text-base outline-none focus:border-blue-400"
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
          ) : (
            <ul>
              {filteredMediaList.map((media) => (
                <MovieCard
                  key={`${media.media_type}-${media.id}`}
                  media={media}
                  onClick={() => handleMediaClick(media)}
                  isWatched={isSignedIn && isWatched(media.media_type, media.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Pass media ID and type and API Key to the childern(ExpandedCard.jsx) */}
        {selectedMedia && (
          <ExpandedCard 
            mediaId={selectedMedia.id}
            mediaType={selectedMedia.type} 
            apiKey={API_KEY} 
            onClose={handleCloseModal}
            isWatched={isSignedIn && isWatched(selectedMedia.type, selectedMedia.id)}
            onToggleWatched={isSignedIn ? toggleWatched : null}
          />
        )}
      </div>
    </main>
    </>
  );
};

export default App;