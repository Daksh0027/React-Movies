import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import axios from 'axios';

// Helper functions (no changes)
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

// Component definition (no changes to props or logic)
const ExpandedCard = ({ mediaId, mediaType, apiKey, onClose, isWatched, onToggleWatched }) => {
  const [details, setDetails] = useState(null);
  const [imdbId, setImdbId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const fetchDetails = async () => {
      // ... a lot of code
      // This entire data fetching useEffect hook remains exactly the same
      // ...
      setIsLoading(true);
      setError(null);
      setImdbId(null);
      if (!apiKey) {
        setError("API key is missing.");
        setIsLoading(false);
        return;
      }
      try {
        const API_HEADERS = {
          accept: 'application/json',
          Authorization: `Bearer ${apiKey}`
        };
        const url = `https://api.themoviedb.org/3/${mediaType}/${mediaId}?append_to_response=credits,external_ids`;
        const response = await axios(url,{headers : API_HEADERS} );

        const data = response.data;
        setDetails(data);
        if (data.external_ids?.imdb_id) {
          setImdbId(data.external_ids.imdb_id);
        }
      } catch (err) {
        const message = err.response?.data?.status_message || err.message;
        console.error("Error fetching details:", message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    if (mediaId && mediaType) {
      fetchDetails();
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mediaId, mediaType, apiKey]);

  // Loading and Error states (no changes)
  const handleContentClick = (e) => e.stopPropagation();
  if (isLoading) { return <Spinner />}
  if (error) { return <div className="text-bg : bg-red-600">{error}</div>; }

  // Data extraction for easier use in JSX (no changes)
  const title = details?.title || details?.name;
  const releaseDate = details?.release_date || details?.first_air_date;
  const runtime = mediaType === 'movie' ? details?.runtime : details?.episode_run_time?.[0];

  // The main return statement is replaced with the new layout
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        // Using the font-family defined in your original CSS
        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto font-[--font-dm-sans] bg-[#0A091A] rounded-2xl text-white p-6 md:p-8 border border-[#23214a]"
        onClick={handleContentClick}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-3xl font-light text-gray-400 hover:text-white transition-colors z-20"
          aria-label="Close"
        >
          &times;
        </button>
        
        {details && (
          <>
            {/* == HEADER SECTION == */}
            <header className="mb-6">
              {/* Using Bebas Neue for the title as it matches the image style */}
              <h1 className="text-4xl md:text-6xl font-['Bebas_Neue'] tracking-wider mb-3">{title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-400 text-sm md:text-base">
                <div className="flex items-center space-x-2">
                    <img src="/star.svg" alt="Rating" className="w-4 h-4" />
                    <span className="font-bold text-white">{details.vote_average.toFixed(1)}</span>
                </div>
                <span className="text-gray-600">•</span>
                <span>{releaseDate?.substring(0, 4)}</span>
                <span className="text-gray-600">•</span>
                <span>{formatRuntime(runtime)}</span>
              </div>
            </header>

            {/* == MAIN CONTENT (Poster & Player) == */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
              <div className="lg:col-span-1">
                <img
                  src={details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://placehold.co/500x750/1A1A1A/FFFFFF?text=No+Poster'}
                  alt={`Poster for ${title}`}
                  className="rounded-lg w-full shadow-lg border border-slate-800"
                />
              </div>
              <div className="lg:col-span-2 relative aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                {imdbId ? (
                  <iframe
                    src={`https://m.playimdb.com/title/${imdbId}/`}
                    title={`Player for ${title}`}
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full rounded-lg z-10"
                  ></iframe>
                ) : (
                  <div className="text-gray-500">IMDb Player Not Available</div>
                )}
              </div>
            </section>

            {/* == DETAILS & OVERVIEW SECTION == */}
            <section>
              <div className="flex flex-wrap gap-2 mb-6">
                  {/* FIX: Darker, bordered genre badges to match the image */}
                  {details.genres.map((genre) => (
                      <span key={genre.id} className="px-3 py-1 bg-slate-900/80 border border-slate-700 rounded-full text-xs font-medium text-gray-300">{genre.name}</span>
                  ))}
              </div>

              <div className="mb-6">
                {/* FIX: Heading with gradient underline */}
                <h3 className="text-2xl font-semibold">Overview</h3>
                <div className="h-0.5 w-20 bg-linear-to-r from-fuchsia-600 to-cyan-500 mt-1"></div>
              </div>
              <p className="text-gray-300 mb-8 leading-relaxed max-w-4xl">{details.overview}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5 text-sm">
                <div>
                  {/* FIX: Uppercase, spaced-out labels */}
                  <strong className="block text-xs text-gray-500 uppercase tracking-wider">Status</strong>
                  <span>{details.status}</span>
                </div>
                <div>
                  <strong className="block text-xs text-gray-500 uppercase tracking-wider">Release Date</strong>
                  <span>{releaseDate}</span>
                </div>
                {mediaType === 'movie' && (
                  <>
                    <div>
                      <strong className="block text-xs text-gray-500 uppercase tracking-wider">Budget</strong>
                      <span>{formatCurrency(details.budget)}</span>
                    </div>
                    <div>
                      <strong className="block text-xs text-gray-500 uppercase tracking-wider">Revenue</strong>
                      <span>{formatCurrency(details.revenue)}</span>
                    </div>
                  </>
                )}
                 {mediaType === 'tv' && (
                  <>
                    <div>
                      <strong className="block text-xs text-gray-500 uppercase tracking-wider">Seasons</strong>
                      <span>{details.number_of_seasons}</span>
                    </div>
                    <div>
                      <strong className="block text-xs text-gray-500 uppercase tracking-wider">Episodes</strong>
                      <span>{details.number_of_episodes}</span>
                    </div>
                  </>
                )}
              </div>
            </section>
            
            <footer className="mt-8 pt-6 border-t border-slate-800 flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => onToggleWatched(mediaType, mediaId)}
                  className={`px-10 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 cursor-pointer border-none ${
                    isWatched
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                  }`}
                >
                  {isWatched ? '✓ Watched' : '👁 Mark as Watched'}
                </button>
                {details.homepage && (
                  <a href={details.homepage} target="_blank" rel="noopener noreferrer" className="px-10 py-3 bg-linear-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-700 hover:to-cyan-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                    Visit Homepage
                  </a>
                )}
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpandedCard;