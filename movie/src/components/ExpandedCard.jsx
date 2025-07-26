// src/components/ExpandedCard.jsx

import React, { useState, useEffect } from 'react';
import { databases } from '../appwrite'; // Assuming you export your Appwrite db instance
import Spinner from './Spinner'; // Your loading spinner

// Use your Vite environment variable for the API key
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

function ExpandedCard({ movieId, onClose }) {
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch movie details from TMDB
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch movie data.');
        }
        const data = await response.json();
        setMovie(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]); // This effect runs whenever the movieId prop changes

  // Function to handle adding to a watchlist via Appwrite
  const handleAddToWatchlist = () => {
    console.log('Adding to watchlist:', movie.id);
    // Add your Appwrite database logic here
    // e.g., databases.createDocument(...)
  };
  
  // Prevents the modal from closing when clicking inside the content
  const handleContentClick = (e) => e.stopPropagation();

  return (
    // The Modal Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose} // Close modal when clicking the overlay
    >
      {/* The Modal Content */}
      <div
        className="relative w-full max-w-4xl p-8 bg-[#1A1A1A] rounded-lg text-white" // Example styling
        onClick={handleContentClick}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold hover:text-gray-400"
        >
          &times;
        </button>

        {isLoading && <Spinner />}
        
        {error && <p className="text-red-500">Error: {error}</p>}

        {movie && !isLoading && (
          // Your main content layout starts here
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Poster */}
            <div className="md:col-span-1">
              <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="rounded-lg" />
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-2">
              <h1 className="text-4xl font-bold">{movie.title}</h1>
              <p className="text-sm text-gray-400">{movie.release_date.substring(0, 4)} ・ {movie.runtime} min</p>

              {/* Add all the other details from your design here */}
              <p className="mt-4">{movie.overview}</p>
              
              <div className="mt-4">
                <strong>Budget:</strong> ${movie.budget.toLocaleString()}
              </div>
              <div>
                <strong>Revenue:</strong> ${movie.revenue.toLocaleString()}
              </div>
              
              {/* Add your buttons and other elements */}
              <button onClick={handleAddToWatchlist} className="mt-4 px-4 py-2 bg-blue-600 rounded">Add to Watchlist</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpandedCard;