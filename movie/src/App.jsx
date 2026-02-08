import { useEffect, useRef, useState } from 'react';
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
  const fetchData = async (query = '') => {
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
  };


  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies(user?.id);
      setTrendingMovies(movies); 
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  };

  // Updated handler to accept the full media object
  const handleMediaClick = (media) => {
    setSelectedMedia({ id: media.id, type: media.media_type });
  };

  const handleCloseModal = async () => {
    setSelectedMedia(null);
    setSearchTerm('');
    await fetchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    loadTrendingMovies();
  }, [user?.id]);

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
  }, [showWatchedOnly, watchedItems.length]);

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
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="error-message">{errorMessage}</p>
          ) : (
            <ul>
              {(showWatchedOnly ? watchedMediaList : mediaList)
                .filter((media) => mediaFilter === 'all' || media.media_type === mediaFilter)
                .map((media) => (
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