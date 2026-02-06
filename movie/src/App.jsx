import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar.jsx';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import ExpandedCard from './components/ExpandedCard.jsx';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import useWatched from './hooks/useWatched.js';


const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_HEADERS = {
  accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`
};

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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

  // Watched list (per-user, stored in localStorage)
  const { isWatched, toggleWatched, watchedCount } = useWatched();
  const [showWatchedOnly, setShowWatchedOnly] = useState(false);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);

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
        await updateSearchCount(query, combinedResults[0]);
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
      const movies = await getTrendingMovies();
      setTrendingMovies(movies); 
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  };

  // Updated handler to accept the full media object
  const handleMediaClick = (media) => {
    setSelectedMedia({ id: media.id, type: media.media_type });
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  useEffect(() => {
    fetchData(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <>
      <SignedOut>
        <div className="pattern" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">🎞️ DakshoRama</h1>
          <p className="text-lg mb-8 text-gray-300">Sign in to discover Movies & Series you'll love</p>
          <div className="flex gap-4">
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
      {!selectedMedia && (
        <Navbar onHomeClick={handleCloseModal} mediaFilter={mediaFilter} setMediaFilter={setMediaFilter} showWatchedOnly={showWatchedOnly} setShowWatchedOnly={setShowWatchedOnly} watchedCount={watchedCount} />
      )}
      <main>
        <div className="pattern" />
        <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className="text-gradient">Movies And Series</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2><span className='text-gradient'>Suggested </span></h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h1><span className='text-gradient'>{mediaFilter === 'movie' ? 'Top Rated Movies' : mediaFilter === 'tv' ? 'Top Rated TV Shows' : 'Top Rated Movies And Shows'}</span></h1>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="error-message">{errorMessage}</p>
          ) : (
            <ul>
              {mediaList
                .filter((media) => mediaFilter === 'all' || media.media_type === mediaFilter)
                .filter((media) => !showWatchedOnly || isWatched(media.media_type, media.id))
                .map((media) => (
                <MovieCard
                  key={`${media.media_type}-${media.id}`}
                  media={media}
                  onClick={() => handleMediaClick(media)}
                  isWatched={isWatched(media.media_type, media.id)}
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
            isWatched={isWatched(selectedMedia.type, selectedMedia.id)}
            onToggleWatched={toggleWatched}
          />
        )}
      </div>
    </main>
      </SignedIn>
    </>
  );
};

export default App;