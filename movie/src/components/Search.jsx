import React, { memo } from 'react'

const Search = memo(({ searchTerm, setSearchTerm, onSearch }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="search">
      <div>
        <img src="search.svg" alt="search" loading="lazy" />

        <input
          type="text"
          placeholder="Search movies and series"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={onSearch}
          className="ml-2 px-3 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors cursor-pointer border-none text-sm sm:text-base whitespace-nowrap"
        >
          Search
        </button>
      </div>
    </div>
  )
});

Search.displayName = 'Search';

export default Search