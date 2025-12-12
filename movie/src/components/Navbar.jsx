const Navbar = () => {
  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.reload();
  };
  const handleMoviesClick = () =>{
    window.open('/','_self');
  }
  const handleSeriesClick = () =>{
    window.open('/','_self');
  }
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
            className="text-white text-base sm:text-lg font-medium hover:text-blue-200 transition-colors px-4 py-2 rounded-lg hover:bg-blue-800/50 bg-transparent border-none cursor-pointer"
            onClick={handleMoviesClick}
          >
            Movies
          </button>
          <button 
            className="text-white text-base sm:text-lg font-medium hover:text-blue-200 transition-colors px-4 py-2 rounded-lg hover:bg-blue-800/50 bg-transparent border-none cursor-pointer"
            onClick={handleSeriesClick}
          >
            Series
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;