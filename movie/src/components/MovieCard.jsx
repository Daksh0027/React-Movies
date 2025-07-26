import React from 'react';

const MovieCard = ({ movie, onClick }) => {
  // Destructure properties inside the component for clarity
  const { title, vote_average, poster_path, release_date, original_language } = movie;

  return (
    // Add the onClick handler and cursor style here
    <div className="movie-card cursor-pointer" onClick={onClick}>
      <img
        // Ensure this path matches your file in the 'public' folder
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
            {release_date ? release_date.split('-')[0] : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;