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
    setMenuOpen(false);
    if (scrollToResults) scrollToResults();
  };

  const handleSeriesClick = () => {
    setMediaFilter(mediaFilter === 'tv' ? 'all' : 'tv');
    setMenuOpen(false);
    if (scrollToResults) scrollToResults();
  };

  const activeClass = 'bg-[#cecefb] text-[#0f0d23]';
  const defaultClass = 'bg-transparent text-white hover:bg-white/10 hover:text-[#cecefb]';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-[#030014]/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        <button 
          className="flex items-center gap-2.5 text-white text-xl sm:text-3xl font-bold hover:text-[#cecefb] transition-colors cursor-pointer bg-transparent border-none"
          onClick={handleHomeClick}
        >
          <img src="/logo.png" alt="" className="h-7 w-7 sm:h-9 sm:w-9 object-contain" />
          ReSpectro
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
            className={`text-base sm:text-lg font-medium transition-colors px-4 py-2 rounded-full border-none cursor-pointer ${mediaFilter === 'movie' ? activeClass : defaultClass}`}
            onClick={handleMoviesClick}
          >
            Movies
          </button>
          <button 
            className={`text-base sm:text-lg font-medium transition-colors px-4 py-2 rounded-full border-none cursor-pointer ${mediaFilter === 'tv' ? activeClass : defaultClass}`}
            onClick={handleSeriesClick}
          >
            Series
          </button>
          {isSignedIn ? (
            <>
              <button 
                className={`text-base sm:text-lg font-medium transition-colors px-4 py-2 rounded-full border-none cursor-pointer ${showWatchedOnly ? 'bg-green-600 text-white' : defaultClass}`}
                onClick={() => setShowWatchedOnly(!showWatchedOnly)}
              >
                Watched ({watchedCount})
              </button>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <SignInButton mode="modal">
                <button className="text-base font-medium px-4 py-2 bg-[#cecefb] hover:bg-[#b9b7f5] rounded-full text-[#0f0d23] border-none cursor-pointer transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-base font-medium px-4 py-2 bg-transparent hover:bg-white/10 rounded-full text-white border-none cursor-pointer transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden flex flex-col gap-2 px-4 pb-4 bg-[#0f0d23]/98 border-t border-white/10">
          <button 
            className={`w-full text-left text-base font-medium transition-colors px-4 py-3 rounded-full border-none cursor-pointer ${mediaFilter === 'movie' ? activeClass : defaultClass}`}
            onClick={() => { handleMoviesClick(); setMenuOpen(false); }}
          >
            Movies
          </button>
          <button 
            className={`w-full text-left text-base font-medium transition-colors px-4 py-3 rounded-full border-none cursor-pointer ${mediaFilter === 'tv' ? activeClass : defaultClass}`}
            onClick={() => { handleSeriesClick(); setMenuOpen(false); }}
          >
            Series
          </button>
          {isSignedIn ? (
            <>
              <button 
                className={`w-full text-left text-base font-medium transition-colors px-4 py-3 rounded-full border-none cursor-pointer ${showWatchedOnly ? 'bg-green-600 text-white' : defaultClass}`}
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
                <button className="text-base font-medium px-4 py-2 bg-[#cecefb] hover:bg-[#b9b7f5] rounded-full text-[#0f0d23] border-none cursor-pointer transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-base font-medium px-4 py-2 bg-transparent hover:bg-white/10 rounded-full text-white border-none cursor-pointer transition-colors">
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