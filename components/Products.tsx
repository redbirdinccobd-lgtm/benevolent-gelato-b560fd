
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PRODUCTS } from '../constants';
import ReviewSection from './ReviewSection';
import { Product, Review } from '../types';
import { calculateDynamicPrice } from '../lib/pricing';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Sparkles, Search, SlidersHorizontal, ArrowRight, RotateCcw } from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '../src/firebase';
import { parseNaturalLanguageSearch } from '../src/services/aiSearchService';

const ProductCarousel: React.FC<{ images: string[]; brand: string }> = ({ images, brand }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Track which indices have been 'activated' for loading to ensure smooth transitions once an image is loaded
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));

  // Pre-load the next image whenever the current index changes
  useEffect(() => {
    setLoadedIndices((prev) => {
      const nextIndex = (currentIndex + 1) % images.length;
      if (prev.has(currentIndex) && prev.has(nextIndex)) return prev;
      const next = new Set(prev);
      next.add(currentIndex);
      next.add(nextIndex);
      return next;
    });
  }, [currentIndex, images.length]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative h-80 overflow-hidden group/carousel bg-slate-100">
      {/* Images with enhanced Fade + Scale Transition and Hover Zoom */}
      {images.map((img, idx) => {
        const isLoaded = loadedIndices.has(idx);
        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
              idx === currentIndex 
                ? 'opacity-100 scale-100 z-10' 
                : 'opacity-0 scale-105 z-0 pointer-events-none'
            }`}
          >
            {isLoaded ? (
              <img
                src={img}
                alt={`${brand} view ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover/carousel:scale-110"
                loading="lazy"
              />
            ) : (
              /* Skeleton/Placeholder while not yet triggered for loading */
              <div className="w-full h-full bg-slate-200 animate-pulse" />
            )}
          </div>
        );
      })}

      {/* Navigation Overlay - Only shows on hover */}
      <div className="absolute inset-0 flex items-center justify-between px-3 z-20 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
        <button
          onClick={prevImage}
          className="bg-white/90 hover:bg-white text-slate-900 p-2.5 rounded-full shadow-xl transition-all transform hover:scale-110 active:scale-95 focus:outline-none"
          aria-label="Previous image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextImage}
          className="bg-white/90 hover:bg-white text-slate-900 p-2.5 rounded-full shadow-xl transition-all transform hover:scale-110 active:scale-95 focus:outline-none"
          aria-label="Next image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Brand Label */}
      <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest z-30 shadow-lg">
        {brand}
      </div>

      {/* Interactive Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ease-out border-none cursor-pointer hover:bg-white/80 ${
              idx === currentIndex 
                ? 'bg-white w-6 shadow-sm' 
                : 'bg-white/40 w-1.5 hover:w-3'
            }`}
            aria-label={`View image ${idx + 1}`}
            aria-current={idx === currentIndex ? 'true' : 'false'}
          />
        ))}
      </div>
      
      {/* Subtle overlay to help visibility of indicators */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-20"></div>
    </div>
  );
};

const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full animate-pulse">
    <div className="h-80 bg-slate-200" />
    <div className="p-7 flex flex-col flex-grow">
      <div className="flex justify-between items-start mb-4">
        <div className="h-3 w-16 bg-slate-200 rounded-full" />
        <div className="h-6 w-20 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-7 w-3/4 bg-slate-200 rounded-xl mb-4" />
      <div className="flex items-center gap-2 mb-6">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-slate-200 rounded-full" />
          ))}
        </div>
        <div className="h-3 w-12 bg-slate-200 rounded-full" />
      </div>
      <div className="mt-auto pt-6 border-t border-slate-50">
        <div className="h-5 w-32 bg-slate-200 rounded-full" />
      </div>
    </div>
  </div>
);

const Products: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGarmentTypes, setSelectedGarmentTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [estimateQty, setEstimateQty] = useState(100);
  const [estimateColor, setEstimateColor] = useState<string>('');
  const [estimateSize, setEstimateSize] = useState<string>('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    
    setIsAiSearching(true);
    try {
      const filters = await parseNaturalLanguageSearch(aiSearchQuery);
      
      // Reset filters before applying AI results for a fresh start
      setSelectedBrands([]);
      setSelectedCategories([]);
      setSelectedGarmentTypes([]);
      setSelectedColors([]);
      setSelectedSizes([]);

      // Apply parsed filters
      if (filters.brand?.length) setSelectedBrands(filters.brand);
      if (filters.category?.length) setSelectedCategories(filters.category);
      if (filters.garmentType?.length) setSelectedGarmentTypes(filters.garmentType);
      if (filters.colors?.length) setSelectedColors(filters.colors);
      if (filters.sizes?.length) setSelectedSizes(filters.sizes);
      
      // Clear standard search term if AI found specific filters
      if (Object.values(filters).some(arr => arr && arr.length > 0)) {
        setSearchTerm('');
      }
      
      // Feedback to user
      const resultsSection = document.getElementById('product-grid');
      resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error("AI Search failed:", err);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Handle loading state for filters
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600); // Simulated loading delay for smooth transitions
    return () => clearTimeout(timer);
  }, [selectedBrands, selectedCategories, selectedGarmentTypes, selectedColors, selectedSizes, searchTerm, sortBy]);

  useEffect(() => {
    if (selectedProduct) {
      setEstimateQty(100);
      setEstimateColor(selectedProduct.colors[0] || '');
      setEstimateSize(selectedProduct.sizes[0] || '');
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'reviews'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => {
        const data = doc.data(); 
        return { 
          id: doc.id,
          ...data
        } as Review;
      });
      
      setAllProducts(prev => {
        return PRODUCTS.map(p => {
          const pReviews = reviewsData.filter(r => r.productId === p.id);
          // Preserve existing state except reviews
          const prevProduct = prev.find(old => old.id === p.id) || p;
          return { ...prevProduct, reviews: pReviews };
        });
      });

      setSelectedProduct(prev => {
        if (!prev) return null;
        const pReviews = reviewsData.filter(r => r.productId === prev.id);
        return { ...prev, reviews: pReviews };
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    });

    return () => unsubscribe();
  }, []);

  const estimatedPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    const variants = [];
    if (estimateColor) variants.push(estimateColor);
    if (estimateSize) variants.push(estimateSize);
    return calculateDynamicPrice(selectedProduct, estimateQty, variants);
  }, [selectedProduct, estimateQty, estimateColor, estimateSize]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract unique brands and categories with counts
  const brandStats = useMemo(() => {
    const stats: Record<string, number> = { 'All': allProducts.length };
    allProducts.forEach(p => {
      stats[p.brand] = (stats[p.brand] || 0) + 1;
    });
    return stats;
  }, [allProducts]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { 'All': allProducts.length };
    allProducts.forEach(p => {
      stats[p.category] = (stats[p.category] || 0) + 1;
    });
    return stats;
  }, [allProducts]);

  const garmentTypeStats = useMemo(() => {
    const stats: Record<string, number> = { 'All': allProducts.length };
    allProducts.forEach(p => {
      stats[p.garmentType] = (stats[p.garmentType] || 0) + 1;
    });
    return stats;
  }, [allProducts]);

  const colorStats = useMemo(() => {
    const stats: Record<string, number> = { 'All': allProducts.length };
    allProducts.forEach(p => {
      p.colors.forEach(color => {
        stats[color] = (stats[color] || 0) + 1;
      });
    });
    return stats;
  }, [allProducts]);

  const sizeStats = useMemo(() => {
    const stats: Record<string, number> = { 'All': allProducts.length };
    allProducts.forEach(p => {
      p.sizes.forEach(size => {
        stats[size] = (stats[size] || 0) + 1;
      });
    });
    return stats;
  }, [allProducts]);

  const brands = useMemo(() => Object.keys(brandStats).sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)), [brandStats]);
  const categories = useMemo(() => Object.keys(categoryStats).sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)), [categoryStats]);
  const garmentTypes = useMemo(() => Object.keys(garmentTypeStats).sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)), [garmentTypeStats]);
  const colors = useMemo(() => Object.keys(colorStats).sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)), [colorStats]);
  const sizes = useMemo(() => Object.keys(sizeStats).sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)), [sizeStats]);

  // Generate suggestions based on product names and brands
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerSearch = searchTerm.toLowerCase();
    const matches = new Set<string>();
    
    allProducts.forEach(p => {
      if (p.name.toLowerCase().includes(lowerSearch)) matches.add(p.name);
      if (p.brand.toLowerCase().includes(lowerSearch)) matches.add(p.brand);
    });
    
    return Array.from(matches).slice(0, 6); // Limit to 6 suggestions
  }, [searchTerm, allProducts]);

  const filteredProducts = useMemo(() => {
    let result = allProducts.filter(product => {
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const garmentMatch = selectedGarmentTypes.length === 0 || selectedGarmentTypes.includes(product.garmentType);
      const colorMatch = selectedColors.length === 0 || product.colors.some(c => selectedColors.includes(c));
      const sizeMatch = selectedSizes.length === 0 || product.sizes.some(s => selectedSizes.includes(s));
      const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      return brandMatch && categoryMatch && garmentMatch && colorMatch && sizeMatch && searchMatch;
    });

    // Apply sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [selectedBrands, selectedCategories, selectedGarmentTypes, selectedColors, selectedSizes, searchTerm, sortBy, allProducts]);

  const scrollToProducts = () => {
    const section = document.getElementById('products');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedGarmentTypes([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSortBy('featured');
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const toggleFilter = (list: string[], value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value === 'All') {
      setter([]);
      return;
    }
    setter(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value) 
        : [...prev, value]
    );
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  return (
    <section id="products" className="py-24 bg-slate-50 scroll-mt-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-red-600 font-bold tracking-widest uppercase text-sm mb-4">Our Specialties</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Explore Our Product Range</h3>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg mb-8">
            We source a diverse array of apparel across categories, ensuring the highest quality for our global partners.
          </p>
          
          <button 
            onClick={scrollToProducts}
            className="group relative inline-flex items-center px-10 py-4 font-bold text-white transition-all duration-300 bg-red-600 rounded-full hover:bg-red-700 shadow-xl shadow-red-600/20 active:scale-95"
          >
            <span className="relative flex items-center">
              View All Products
              <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </span>
          </button>
        </div>

        {/* Filter Section */}
        <div className="mb-12 space-y-6">
          {/* AI Search Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group"
          >
            {/* Animated Background Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-red-600/20 transition-colors duration-700"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 group-hover:bg-blue-600/20 transition-colors duration-700"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-600/40">
                  <Sparkles className="text-white" size={20} />
                </div>
                <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs">AI Smart Search</h4>
              </div>
              
              <h5 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">What are you looking for today?</h5>
              <p className="text-slate-400 text-sm mb-8 max-w-xl leading-relaxed">
                Try searching naturally: <span className="text-red-400 font-medium">"I need 220 GSM heavyweight combed t-shirts for Korea export"</span> or <span className="text-blue-400 font-medium">"show me fine-gauge knitwear sweaters"</span>
              </p>

              <form onSubmit={handleAiSearch} className="relative max-w-3xl">
                <input 
                  type="text"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  placeholder="Describe your garment specifications or surplus requirement..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-7 pr-32 text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-red-600/20 focus:border-red-600/50 transition-all text-lg font-medium"
                />
                <button 
                  type="submit"
                  disabled={isAiSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 group/ai-btn disabled:opacity-50"
                >
                  {isAiSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Find Now</span>
                      <ArrowRight size={18} className="group-hover/ai-btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col gap-8">
              
              {/* Search Bar with Autocomplete */}
              <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <SlidersHorizontal size={18} className="text-slate-500" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Manual Filters</h4>
              </div>
            
              <div ref={searchRef} className="relative group/search z-40">
                <label htmlFor="product-search" className="sr-only">Search by garment type, GSM, fabric, or production line</label>
                <input
                  id="product-search"
                  type="text"
                  placeholder="Search by garment type, GSM, fabric, or export line (e.g. Korea T-Shirt, 220 GSM, Sweater)..."
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all duration-300 shadow-inner"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-haspopup="listbox"
                  aria-controls="suggestions-list"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-red-500 transition-colors" aria-hidden="true">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    id="suggestions-list"
                    role="listbox" 
                    aria-label="Search suggestions"
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        role="option"
                        aria-selected={false}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-6 py-3 hover:bg-slate-50 text-slate-700 hover:text-red-600 font-medium transition-colors flex items-center gap-3 border-b border-slate-50 last:border-none"
                      >
                        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setShowSuggestions(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-200 text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                {/* Production / Sourcing Line Filters */}
                <div className="flex-1" role="group" aria-labelledby="filter-brand-label">
                  <span id="filter-brand-label" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Production & Sourcing Line</span>
                  <div className="flex flex-wrap gap-2">
                    {brands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => toggleFilter(selectedBrands, brand, setSelectedBrands)}
                        aria-pressed={brand === 'All' ? selectedBrands.length === 0 : selectedBrands.includes(brand)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                          (brand === 'All' ? selectedBrands.length === 0 : selectedBrands.includes(brand))
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {brand}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          (brand === 'All' ? selectedBrands.length === 0 : selectedBrands.includes(brand)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {brandStats[brand]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex-1" role="group" aria-labelledby="filter-category-label">
                  <span id="filter-category-label" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Filter by Category</span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => toggleFilter(selectedCategories, category, setSelectedCategories)}
                        aria-pressed={category === 'All' ? selectedCategories.length === 0 : selectedCategories.includes(category)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                          (category === 'All' ? selectedCategories.length === 0 : selectedCategories.includes(category))
                            ? 'bg-slate-900 text-white shadow-lg' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {category}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          (category === 'All' ? selectedCategories.length === 0 : selectedCategories.includes(category)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {categoryStats[category]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                {/* Garment Type Filters */}
                <div className="flex-1" role="group" aria-labelledby="filter-garment-label">
                  <span id="filter-garment-label" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Garment Type</span>
                  <div className="flex flex-wrap gap-2">
                    {garmentTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => toggleFilter(selectedGarmentTypes, type, setSelectedGarmentTypes)}
                        aria-pressed={type === 'All' ? selectedGarmentTypes.length === 0 : selectedGarmentTypes.includes(type)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                          (type === 'All' ? selectedGarmentTypes.length === 0 : selectedGarmentTypes.includes(type))
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {type}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          (type === 'All' ? selectedGarmentTypes.length === 0 : selectedGarmentTypes.includes(type)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {garmentTypeStats[type]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Filters */}
                <div className="flex-1" role="group" aria-labelledby="filter-color-label">
                  <span id="filter-color-label" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Color</span>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => toggleFilter(selectedColors, color, setSelectedColors)}
                        aria-pressed={color === 'All' ? selectedColors.length === 0 : selectedColors.includes(color)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                          (color === 'All' ? selectedColors.length === 0 : selectedColors.includes(color))
                            ? 'bg-slate-900 text-white shadow-lg' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {color}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          (color === 'All' ? selectedColors.length === 0 : selectedColors.includes(color)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {colorStats[color]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Filters */}
                <div className="flex-1" role="group" aria-labelledby="filter-size-label">
                  <span id="filter-size-label" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Size</span>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => toggleFilter(selectedSizes, size, setSelectedSizes)}
                        aria-pressed={size === 'All' ? selectedSizes.length === 0 : selectedSizes.includes(size)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                          (size === 'All' ? selectedSizes.length === 0 : selectedSizes.includes(size))
                            ? 'bg-slate-900 text-white shadow-lg' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {size}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          (size === 'All' ? selectedSizes.length === 0 : selectedSizes.includes(size)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {sizeStats[size]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By Dropdown */}
                <div className="w-full lg:w-48">
                  <label htmlFor="sort-by" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sort By</label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A-Z</option>
                  </select>
                </div>

                {/* Reset Button */}
                {(selectedBrands.length > 0 || selectedCategories.length > 0 || selectedGarmentTypes.length > 0 || selectedColors.length > 0 || selectedSizes.length > 0 || searchTerm !== '' || sortBy !== 'featured') && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-red-600 font-bold text-sm hover:underline flex items-center gap-1 self-start lg:mb-2.5"
                  >
                    <RotateCcw size={14} />
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Counter */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-bold">{filteredProducts.length}</span> products
          </p>
        </div>

        {/* Product Grid */}
        <div id="product-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 min-h-[400px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="skeleton-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                {[...Array(6)].map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </motion.div>
            ) : filteredProducts.length > 0 ? (
              <motion.div 
                key="results-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                {filteredProducts.map((product, idx) => (
                  <motion.div 
                    key={product.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${product.name}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col h-full cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedProduct(product);
                      }
                    }}
                  >
                    <ProductCarousel images={product.images} brand={product.brand} />
                    <div className="p-7 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          product.category === 'Custom Manufacturing' 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {product.category}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors uppercase tracking-tight">{product.name}</h4>
                      
                      {/* Fabric Specification */}
                      {product.fabricSpec && (
                        <p className="text-xs text-slate-600 font-medium mb-3 line-clamp-2 leading-relaxed">
                          {product.fabricSpec}
                        </p>
                      )}

                      {/* Line and Garment Type */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                         <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                           {product.brand}
                         </span>
                         <span className="text-[11px] text-slate-500 font-medium">
                           {product.garmentType}
                         </span>
                         {product.targetMarket && (
                           <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold ml-auto">
                             {product.targetMarket}
                           </span>
                         )}
                      </div>
                      
                      {/* Rating Summary */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => {
                            const avg = product.reviews && product.reviews.length > 0
                              ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
                              : 0;
                            return (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < Math.round(avg) ? 'fill-current' : 'text-slate-200'}`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            );
                          })}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">({product.reviews?.length || 0} reviews)</span>
                      </div>
      
                      <div className="mt-auto pt-6 flex justify-between items-center border-t border-slate-50">
                         <button className="text-slate-900 font-bold text-sm inline-flex items-center group/btn transition-colors hover:text-red-600">
                           <span className="border-b-2 border-red-600 pb-0.5">View Details & Reviews</span>
                           <svg className="w-4 h-4 ml-1 transform transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300"
              >
                <p className="text-slate-400 text-lg">No products found matching your criteria.</p>
                <button 
                  onClick={handleResetFilters}
                  className="mt-4 text-red-600 font-bold hover:underline"
                >
                  Reset All Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 focus:outline-none" tabIndex={-1}>
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 z-50 p-2 bg-white/90 text-slate-900 rounded-full shadow-lg hover:bg-red-600 hover:text-white transition-all active:scale-90"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100">
                    <img 
                      src={selectedProduct.images[0]} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedProduct.images.slice(1).map((img, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
                        <img src={img} alt={`${selectedProduct.name} view ${i + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                       {selectedProduct.brandLogo && <img src={selectedProduct.brandLogo} alt="" className="w-6 h-6 object-contain" />}
                       <p className="text-red-600 font-bold uppercase tracking-widest text-sm">{selectedProduct.brand}</p>
                    </div>
                    <h3 id="modal-title" className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{selectedProduct.name}</h3>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {selectedProduct.category}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Product Specifications</h4>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                          <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Available Colors</h5>
                          <div className="flex flex-wrap gap-2">
                             {selectedProduct.colors.map(color => (
                               <span key={color} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 capitalize shadow-sm">
                                 {color}
                               </span>
                             ))}
                          </div>
                       </div>
                       <div>
                          <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Available Sizes</h5>
                          <div className="flex flex-wrap gap-2">
                             {selectedProduct.sizes.map(size => (
                               <span key={size} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 shadow-sm">
                                 {size}
                               </span>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200/60">
                       <div className="flex items-center gap-3 text-slate-500">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <p className="text-xs font-medium italic">
                            {selectedProduct.moq ? `Minimum Order Quantity (MOQ): ${selectedProduct.moq}` : 'Commercial export quantities: 1,000 to 30,000+ pieces.'}
                          </p>
                       </div>
                    </div>
                  </div>

                  <div className="prose prose-slate mb-8">
                    <p className="text-slate-600 text-base leading-relaxed">
                      {selectedProduct.sourcingType === 'Custom OEM Manufacturing' 
                        ? `Custom OEM production engineered to buyer tech-pack specifications. Suitable for demanding export corridors (including South Korea and European Union). Sizing schemes, brand labeling, custom hangtags, and packaging are negotiated confidentially.` 
                        : `Authentic factory surplus and cancelled export lot handled under valid commercial permissions and secondary market export clearances. Available for bulk global distribution.`}
                    </p>
                  </div>

                  <div className="space-y-6 mb-8">
                    <div>
                      <span className="block text-sm font-bold text-slate-900 mb-3">Order Readiness</span>
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {selectedProduct.sourcingType === 'Custom OEM Manufacturing' ? 'OEM Production Ready' : 'Surplus Lot Ready for Export'}
                      </span>
                    </div>
                  </div>

                  <a 
                    href="#contact"
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Negotiate Specifications & Order
                  </a>
                </div>
              </div>

              {/* Reviews Section */}
              <ReviewSection 
                productId={selectedProduct.id} 
                reviews={selectedProduct.reviews || []} 
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Products;
