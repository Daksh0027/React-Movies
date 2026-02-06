import { UserButton } from '@clerk/clerk-react';

const Navbar = ({ onHomeClick, mediaFilter, setMediaFilter, showWatchedOnly, setShowWatchedOnly, watchedCount }) => {
  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    }
    setMediaFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMoviesClick = () => {
    setMediaFilter('movie');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeriesClick = () => {
    setMediaFilter('tv');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeClass = 'bg-blue-700 text-white';
  const defaultClass = 'bg-transparent text-white hover:bg-blue-800/50 hover:text-blue-200';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-blue-900/90 backdrop-blur-hm shadow-lg">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <button 
          className="text-white text-2xl sm:text-3xl font-bold hover:text-blue-200 transition-colors cursor-pointer bg-transparent border-none"
          onClick={handleHomeClick}
        >
          🎞️ DakshoRama
        </button>
        <div className="flex gap-4 sm:gap-6">
          <button 
            className={`text-base sm:text-lg font-medium transition-colors px-4 py-2 rounded-lg border-none cursor-pointer ${mediaFilter === 'movie' ? activeClass : defaultClass}`}
            onClick={handleMoviesClick}
          >
            Movies
          </button>
          <button 
            className={`text-base sm:text-lg font-medium transition-colors px-4 py-2 rounded-lg border-none cursor-pointer ${mediaFilter === 'tv' ? activeClass : defaultClass}`}
            onClick={handleSeriesClick}
          >
            Series
          </button>
          <button 
            className={`text-base sm:text-lg font-medium transition-colors px-4 py-2 rounded-lg border-none cursor-pointer ${showWatchedOnly ? 'bg-green-600 text-white' : defaultClass}`}
            onClick={() => setShowWatchedOnly(!showWatchedOnly)}
          >
            Watched ({watchedCount})
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;