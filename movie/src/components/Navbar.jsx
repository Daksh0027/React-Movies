import { useState } from 'react';
import { UserButton, SignInButton, SignUpButton } from '@clerk/clerk-react';

const Navbar = ({ onHomeClick, mediaFilter, setMediaFilter, showWatchedOnly, setShowWatchedOnly, watchedCount, isSignedIn, scrollToResults }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleHomeClick = async () => {
    setMediaFilter('all');
    setMenuOpen(false);
    if (onHomeClick) {
      await onHomeClick();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMoviesClick = () => {
    setMediaFilter(mediaFilter === 'movie' ? 'all' : 'movie');
    if (scrollToResults) scrollToResults();
  };

  const handleSeriesClick = () => {
    setMediaFilter(mediaFilter === 'tv' ? 'all' : 'tv');
    if (scrollToResults) scrollToResults();
  };

  const activeClass = 'bg-blue-700 text-white';
  const defaultClass = 'bg-transparent text-white hover:bg-blue-800/50 hover:text-blue-200';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        <button 
          className="text-white text-xl sm:text-3xl font-bold hover:text-blue-200 transition-colors cursor-pointer bg-transparent border-none"
          onClick={handleHomeClick}
        >
          🎞️ ReSpectro
        </button>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-white text-2xl bg-transparent border-none cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop nav */}
        <div className="hidden sm:flex gap-4 sm:gap-6 items-center">
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
          {isSignedIn ? (
            <>
              <button 
                className={`text-base sm:text-lg font-medium transition-colors px-4 py-2 rounded-lg border-none cursor-pointer ${showWatchedOnly ? 'bg-green-600 text-white' : defaultClass}`}
                onClick={() => setShowWatchedOnly(!showWatchedOnly)}
              >
                Watched ({watchedCount})
              </button>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <SignInButton mode="modal">
                <button className="text-base font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white border-none cursor-pointer transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-base font-medium px-4 py-2 bg-transparent hover:bg-blue-800/50 rounded-lg text-white border-none cursor-pointer transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden flex flex-col gap-2 px-4 pb-4 bg-blue-900/95 border-t border-blue-800">
          <button 
            className={`w-full text-left text-base font-medium transition-colors px-4 py-3 rounded-lg border-none cursor-pointer ${mediaFilter === 'movie' ? activeClass : defaultClass}`}
            onClick={() => { handleMoviesClick(); setMenuOpen(false); }}
          >
            Movies
          </button>
          <button 
            className={`w-full text-left text-base font-medium transition-colors px-4 py-3 rounded-lg border-none cursor-pointer ${mediaFilter === 'tv' ? activeClass : defaultClass}`}
            onClick={() => { handleSeriesClick(); setMenuOpen(false); }}
          >
            Series
          </button>
          {isSignedIn ? (
            <>
              <button 
                className={`w-full text-left text-base font-medium transition-colors px-4 py-3 rounded-lg border-none cursor-pointer ${showWatchedOnly ? 'bg-green-600 text-white' : defaultClass}`}
                onClick={() => { setShowWatchedOnly(!showWatchedOnly); setMenuOpen(false); }}
              >
                Watched ({watchedCount})
              </button>
              <div className="px-4 py-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </>
          ) : (
            <div className="flex gap-2 px-4 py-2">
              <SignInButton mode="modal">
                <button className="text-base font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white border-none cursor-pointer transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-base font-medium px-4 py-2 bg-transparent hover:bg-blue-800/50 rounded-lg text-white border-none cursor-pointer transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;