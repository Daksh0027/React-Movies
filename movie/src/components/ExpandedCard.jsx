import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';

// Helper functions to format data
const formatCurrency = (number) => {
  if (number > 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(number);
  }
  return 'N/A';
};

const formatRuntime = (minutes) => {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const ExpandedCard = ({ movieId, apiKey, onClose }) => {
  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Prevent background scrolling when the modal is open
    document.body.style.overflow = 'hidden';

    const fetchMovieDetails = async () => {
      // Check if the apiKey prop was passed down
      if (!apiKey) {
        setError("API key is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // This is the correct options object that works with your key.
        const API_OPTIONS = {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        };

        // The URL does not contain the api_key parameter.
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=videos,credits`,
          API_OPTIONS // We pass the authorization header here.
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.status_message || 'Movie details could not be fetched.');
        }

        const data = await response.json();
        setMovie(data);

        // Find the official trailer from the videos response
        const officialTrailer = data.videos?.results.find(
          (video) => video.site === 'YouTube' && video.type === 'Trailer'
        );
        setTrailer(officialTrailer);

      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }

    // Cleanup function to re-enable scrolling when the component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [movieId, apiKey]); // Dependency array includes apiKey

  // Prevents modal from closing when clicking inside the content
  const handleContentClick = (e) => e.stopPropagation();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={onClose}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={onClose}>
        <div className="bg-[#1A1A1A] p-8 rounded-lg text-center" onClick={handleContentClick}>
          <h3 className="text-xl font-bold text-red-500 mb-2">Error</h3>
          <p className="text-gray-300">{error}</p>
          <p className="text-gray-500 text-sm mt-2">Please check your TMDB API key or network connection.</p>
          <button onClick={onClose} className="mt-6 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] rounded-2xl text-white p-6 md:p-8"
        onClick={handleContentClick}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-3xl font-light text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          &times;
        </button>
        {movie && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold pr-8">{movie.title}</h1>
                <div className="flex items-center space-x-3 text-gray-400 mt-2">
                  <span>{movie.release_date?.substring(0, 4)}</span>
                  <span>•</span>
                  <span>PG-13</span>
                  <span>•</span>
                  <span>{formatRuntime(movie.runtime)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <img src="/star.svg" alt="Rating" className="w-5 h-5" />
                  <span className="text-xl font-semibold">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({movie.vote_count} votes)</span>
                </div>
                <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6">
              <div className="md:col-span-1">
                <img
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/No-Poster.png'}
                  alt={`Poster for ${movie.title}`}
                  className="rounded-lg w-full shadow-lg"
                />
              </div>
              <div className="md:col-span-2 relative">
                <img
                  src={movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '/No-Poster.png'}
                  alt={`Backdrop for ${movie.title}`}
                  className="rounded-lg w-full shadow-lg"
                />
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-20 transition-all rounded-lg"
                  >
                    <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      <span className="text-white font-semibold">Trailer</span>
                    </div>
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.genres.map((genre) => (
                    <span key={genre.id} className="px-3 py-1 bg-gray-700 rounded-full text-sm">{genre.name}</span>
                  ))}
                </div>
                <h3 className="text-xl font-semibold mb-2">Overview</h3>
                <p className="text-gray-300 mb-6">{movie.overview}</p>
                {movie.homepage && (
                  <a href={movie.homepage} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                    Visit Homepage
                  </a>
                )}
              </div>
              <div className="md:col-span-1 space-y-3 text-sm">
                <div><strong className="text-gray-400 block">Status</strong> {movie.status}</div>
                <div><strong className="text-gray-400 block">Release Date</strong> {movie.release_date}</div>
                <div><strong className="text-gray-400 block">Budget</strong> {formatCurrency(movie.budget)}</div>
                <div><strong className="text-gray-400 block">Revenue</strong> {formatCurrency(movie.revenue)}</div>
                <div><strong className="text-gray-400 block">Production</strong> {movie.production_companies.map(c => c.name).join(', ')}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpandedCard;
