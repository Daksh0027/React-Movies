import React from 'react'

const Search = ({ searchTerm, setSearchTerm, onSearch }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="search">
      <div>
        <img src="search.svg" alt="search" />

        <input
          type="text"
          placeholder="Search movies and series"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={onSearch}
          className="ml-2 px-3 sm:px-5 py-2 bg-[#cecefb] hover:bg-[#b9b7f5] text-[#0f0d23] rounded-full font-semibold transition-colors cursor-pointer border-none text-sm sm:text-base whitespace-nowrap"
        >
          Search
        </button>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="ml-1.5 sm:ml-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-light-200 rounded-full font-medium transition-colors cursor-pointer border-none text-sm sm:text-base whitespace-nowrap"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
export default Search