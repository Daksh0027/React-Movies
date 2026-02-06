const MovieCard = ({ media, onClick, isWatched }) => {
  // Destructure properties, handling differences between movies and TV series
  const { vote_average, poster_path, original_language } = media;
  const title = media.title || media.name;
  const releaseDate = media.release_date || media.first_air_date; // if movie release date or series first air date 
  return (
    <div className="movie-card cursor-pointer relative" onClick={onClick}>
      {isWatched && (
        <div className="absolute top-2 left-2 z-10 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <span>✓</span> Watched
        </div>
      )}
      <img
        src={poster_path ?
          `https://image.tmdb.org/t/p/w500/${poster_path}` : '/No-Poster.png'}
        alt={title}
      />

      <div className="mt-4">
        <h3>{title}</h3>

        <div className="content">
          <div className="rating">
            <img src="/star.svg" alt="Rating" />
            <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
          </div>

          <span>•</span>
          <p className="lang">{original_language}</p>

          <span>•</span>
          <p className="year">
            {releaseDate ? releaseDate.split('-')[0] : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;