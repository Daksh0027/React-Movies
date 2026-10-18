import { useState, useEffect } from 'react';
import Spinner from './Spinner';
import axios from 'axios';
import { SignInButton } from '@clerk/clerk-react';

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

const handleContentClick = (e) => e.stopPropagation();

const servers = [
  { id: 'imdb_su', name: 'imdb.su' },
  { id: 'vidlink_pro', name: 'VidLink.pro' },
  { id: 'embed_su', name: 'Embed.su' },
  { id: 'vidsrc_to', name: 'VidSrc.to' },
  { id: 'vidsrc_cc', name: 'VidSrc.cc' },
];

const getServerUrl = (serverId, mediaType, mediaId, imdbId, selectedSeason, selectedEpisode) => {
  if (!imdbId) return '';
  switch (serverId) {
    case 'imdb_su':
      return `https://imdb.su/title/${imdbId}/`;
    case 'vidlink_pro':
      return `https://vidlink.pro/${mediaType}/${mediaId}${mediaType === 'tv' ? `/${selectedSeason}/${selectedEpisode}` : ''}`;
    case 'embed_su':
      return `https://embed.su/embed/${mediaType}/${imdbId}${mediaType === 'tv' ? `/${selectedSeason}/${selectedEpisode}` : ''}`;
    case 'vidsrc_to':
      return `https://vidsrc.to/embed/${mediaType}/${imdbId}${mediaType === 'tv' ? `/${selectedSeason}/${selectedEpisode}` : ''}`;
    case 'vidsrc_cc':
      return `https://vidsrc.cc/v2/embed/${mediaType}/${imdbId}${mediaType === 'tv' ? `/${selectedSeason}/${selectedEpisode}` : ''}`;
    default:
      return `https://imdb.su/title/${imdbId}/`;
  }
};

const ExpandedCard = ({ mediaId, mediaType, apiKey, onClose, isWatched, onToggleWatched }) => {
  const [details, setDetails] = useState(null);
  const [imdbId, setImdbId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServer, setSelectedServer] = useState('imdb_su');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      setImdbId(null);
      setSelectedServer('imdb_su');
      setSelectedSeason(1);
      setSelectedEpisode(1);
      if (!apiKey) {
        setError('API key is missing.');
        setIsLoading(false);
        return;
      }
      try {
        const API_HEADERS = {
          accept: 'application/json',
          Authorization: `Bearer ${apiKey}`
        };
        const url = `https://api.themoviedb.org/3/${mediaType}/${mediaId}?append_to_response=credits,external_ids`;
        const response = await axios(url, { headers: API_HEADERS });

        const data = response.data;
        setDetails(data);
        if (data.external_ids?.imdb_id) {
          setImdbId(data.external_ids.imdb_id);
        }
      } catch (err) {
        const message = err.response?.data?.status_message || err.message;
        console.error('Error fetching details:', message);
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSeasonChange = (e) => {
    setSelectedSeason(Number(e.target.value));
    setSelectedEpisode(1);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
        <div className="bg-[#0f0d23] rounded-2xl p-8 max-w-md text-center" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-white text-2xl font-bold mb-3">Something went wrong</h2>
          <p className="text-gray-300 text-base mb-6">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#cecefb] text-[#0f0d23] font-semibold rounded-full cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const title = details?.title || details?.name;
  const releaseDate = details?.release_date || details?.first_air_date;
  const runtime = mediaType === 'movie' ? details?.runtime : details?.episode_run_time?.[0];
  const tagline = details?.tagline;
  const cast = (details?.credits?.cast || []).slice(0, 12);
  const seasonsList = details?.seasons || [];
  const currentSeasonDetails = details?.seasons?.find((s) => s.season_number === Number(selectedSeason));
  const episodesCount = currentSeasonDetails ? currentSeasonDetails.episode_count : 0;
  const episodesList = Array.from({ length: episodesCount }, (_, i) => i + 1);
  const playerUrl = getServerUrl(selectedServer, mediaType, mediaId, imdbId, selectedSeason, selectedEpisode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/90 p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-7xl sm:max-h-[92vh] sm:overflow-y-auto bg-[#0f0d23] sm:rounded-2xl text-white shadow-2xl [scrollbar-width:thin] [scrollbar-color:#2a2850_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2a2850] [&::-webkit-scrollbar-thumb]:rounded-full"
        onClick={handleContentClick}
      >
        {details && (
          <>
            {/* == BACKDROP HERO == */}
            <div className="relative">
              {details.backdrop_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w1280${details.backdrop_path}`}
                  alt={`Scene from ${title}`}
                  className="w-full h-64 sm:h-80 md:h-[420px] object-cover"
                />
              ) : (
                <div className="w-full h-64 sm:h-80 md:h-[420px] bg-[#16142e]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d23] via-[#0f0d23]/40 to-transparent" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white text-2xl font-light leading-none flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer border-none"
                aria-label="Close"
              >
                &times;
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                {tagline && (
                  <p className="text-[#a8b5db] text-sm sm:text-base italic mb-2">{tagline}</p>
                )}
                <h1 className="font-['Bebas_Neue'] tracking-wide text-4xl sm:text-6xl md:text-7xl leading-none mb-3">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:text-base text-gray-200">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <img src="/star.svg" alt="" className="w-4 h-4" />
                    {details.vote_average ? details.vote_average.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{releaseDate?.substring(0, 4) || 'N/A'}</span>
                  <span className="text-gray-400">•</span>
                  <span>{formatRuntime(runtime)}</span>
                  {mediaType === 'tv' && details.number_of_seasons > 1 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>{details.number_of_seasons} seasons</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* == PLAYER == */}
            <section className="p-5 sm:p-8">
              {imdbId ? (
                <>
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex flex-wrap gap-2">
                      {servers.map((server) => (
                        <button
                          key={server.id}
                          onClick={() => setSelectedServer(server.id)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer border-none ${
                            selectedServer === server.id
                              ? 'bg-[#cecefb] text-[#0f0d23]'
                              : 'bg-[#1a1836] text-[#a8b5db] hover:bg-[#242148] hover:text-white'
                          }`}
                        >
                          {server.name}
                        </button>
                      ))}
                    </div>

                    {mediaType === 'tv' && selectedServer !== 'imdb_su' && seasonsList.length > 0 && (
                      <div className="flex gap-4">
                        <label className="flex flex-col gap-1.5 text-sm text-gray-300">
                          Season
                          <select
                            value={selectedSeason}
                            onChange={handleSeasonChange}
                            className="bg-[#1a1836] text-white rounded-full px-4 py-2.5 text-sm font-medium outline-none cursor-pointer min-w-[130px] border-none"
                          >
                            {seasonsList.map((s) => (
                              <option key={s.id} value={s.season_number}>
                                {s.name || `Season ${s.season_number}`}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-gray-300">
                          Episode
                          <select
                            value={selectedEpisode}
                            onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                            className="bg-[#1a1836] text-white rounded-full px-4 py-2.5 text-sm font-medium outline-none cursor-pointer min-w-[130px] border-none"
                          >
                            {episodesList.map((ep) => (
                              <option key={ep} value={ep}>
                                Episode {ep}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                    <iframe
                      src={playerUrl}
                      title={`Player for ${title}`}
                      frameBorder="0"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full"
                    ></iframe>
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-[#16142e] rounded-xl flex items-center justify-center">
                  <p className="text-gray-300 text-base">No playable source found for this title</p>
                </div>
              )}
            </section>

            {/* == STORY == */}
            <section className="px-5 sm:px-8 pb-8">
              {details.overview && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-3">Story</h2>
                  <p className="text-gray-200 text-base leading-relaxed max-w-3xl">{details.overview}</p>
                </>
              )}

              {details.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {details.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-4 py-1.5 bg-[#1a1836] rounded-full text-sm text-[#cecefb]"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* == CAST == */}
            {cast.length > 0 && (
              <section className="px-5 sm:px-8 pb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Top billed cast</h2>
                <ul className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {cast.map((person) => (
                    <li key={person.credit_id} className="shrink-0 w-24">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
                          className="w-24 h-24 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-[#1a1836] flex items-center justify-center mb-2">
                          <span className="text-2xl font-bold text-[#a8b5db]">
                            {person.name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{person.name}</p>
                      <p className="text-gray-400 text-xs leading-snug line-clamp-2">{person.character}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* == DETAILS == */}
            <section className="px-5 sm:px-8 pb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Details</h2>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5 text-base">
                <div>
                  <dt className="text-gray-400 text-sm mb-0.5">Status</dt>
                  <dd className="text-white">{details.status || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm mb-0.5">Release date</dt>
                  <dd className="text-white">{releaseDate || 'N/A'}</dd>
                </div>
                {mediaType === 'movie' ? (
                  <>
                    <div>
                      <dt className="text-gray-400 text-sm mb-0.5">Budget</dt>
                      <dd className="text-white">{formatCurrency(details.budget)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400 text-sm mb-0.5">Revenue</dt>
                      <dd className="text-white">{formatCurrency(details.revenue)}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt className="text-gray-400 text-sm mb-0.5">Seasons</dt>
                      <dd className="text-white">{details.number_of_seasons ?? 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400 text-sm mb-0.5">Episodes</dt>
                      <dd className="text-white">{details.number_of_episodes ?? 'N/A'}</dd>
                    </div>
                  </>
                )}
                {details.original_language && (
                  <div>
                    <dt className="text-gray-400 text-sm mb-0.5">Original language</dt>
                    <dd className="text-white capitalize">{details.original_language}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* == ACTIONS == */}
            <footer className="px-5 sm:px-8 pb-8 flex justify-center gap-3 flex-wrap">
              {onToggleWatched ? (
                <button
                  onClick={() => onToggleWatched(mediaType, mediaId)}
                  className={`px-8 py-3 rounded-full font-semibold transition-colors duration-300 cursor-pointer border-none text-base ${
                    isWatched
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-[#1a1836] hover:bg-[#242148] text-white'
                  }`}
                >
                  {isWatched ? 'Watched' : 'Mark as watched'}
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="px-8 py-3 rounded-full font-semibold transition-colors duration-300 cursor-pointer border-none bg-[#cecefb] hover:bg-[#b9b7f5] text-[#0f0d23] text-base">
                    Sign in to track watched
                  </button>
                </SignInButton>
              )}
              {details.homepage && (
                <a
                  href={details.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 rounded-full font-semibold transition-colors duration-300 bg-[#1a1836] hover:bg-[#242148] text-white text-base"
                >
                  Visit homepage
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
