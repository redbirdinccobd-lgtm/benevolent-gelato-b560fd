
import React, { useState, useEffect } from 'react';
import { NAV_ITEMS, COMPANY_NAME } from '../constants';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.hash = `#track/${searchQuery.trim().toUpperCase()}`;
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <a href="#home" className="flex items-center space-x-3 group">
             <div className="relative w-12 h-12 transition-transform group-hover:scale-110">
                <img 
                  src="/logo.png" 
                  alt="Red Bird International Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback if logo.png is not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-xl">R</span>
                      </div>
                    `;
                  }}
                />
             </div>
             <div className="flex flex-col">
                <span className={`font-bold text-lg leading-none transition-colors ${isScrolled ? 'text-slate-900' : 'text-white md:text-white sm:text-slate-900'}`}>RED BIRD</span>
                <span className={`text-[10px] tracking-widest font-semibold transition-colors ${isScrolled ? 'text-red-400' : 'text-red-400'}`}>INTERNATIONAL</span>
             </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6 items-center">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`font-medium text-sm tracking-wide transition-colors hover:text-red-600 ${isScrolled ? 'text-slate-700' : 'text-white'}`}
              >
                {item.label}
              </a>
            ))}
            <a 
              href="#branding" 
              className={`font-black text-sm tracking-widest text-indigo-600 transition-colors hover:text-indigo-800 uppercase flex items-center gap-1 ${isScrolled ? 'border-l border-slate-200 pl-4' : 'border-l border-white/20 pl-4 text-amber-400'}`}
            >
               Brand Book
            </a>
            <a 
              href="#redbird-admin" 
              className={`font-black text-sm tracking-widest transition-colors hover:text-red-500 uppercase flex items-center gap-1 ${isScrolled ? 'text-slate-900 border-l border-slate-200 pl-4' : 'text-white/80 border-l border-white/20 pl-4'}`}
            >
               Admin
            </a>
          </div>

          {/* Persistent Search Shipment Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative mx-2 shrink-0">
            <input
              type="text"
              placeholder="Track Shipment (e.g. SH-01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 transition-all ${
                isScrolled
                  ? 'bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-red-600 focus:bg-white w-40 focus:w-48'
                  : 'bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:ring-red-500 focus:bg-slate-950/80 w-36 focus:w-44'
              }`}
            />
            <svg
              className={`absolute left-3 w-3.5 h-3.5 ${isScrolled ? 'text-slate-400' : 'text-slate-300'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {/* Contact Button */}
          <div className="hidden md:block">
            <a href="#contact" className="bg-red-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
              Get a Quote
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-slate-900 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className={`w-6 h-6 ${!isScrolled && 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white absolute top-full left-0 w-full shadow-xl animate-fade-in-down border-t">
            <div className="flex flex-col p-4 space-y-4">
              {/* Mobile Search Shipment Bar */}
              <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full">
                <input
                  type="text"
                  placeholder="Track Cargo (e.g. SH-01)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 transition-all bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-500 focus:ring-red-600 focus:bg-white w-full"
                />
                <svg
                  className="absolute left-3.5 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>

              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-slate-800 font-semibold text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a 
                href="#branding" 
                className="text-indigo-600 font-bold text-lg animate-pulse"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ★ Brand Book Studio
              </a>
              <a href="#contact" className="bg-red-600 text-white text-center py-3 rounded-lg font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                Contact Us
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
