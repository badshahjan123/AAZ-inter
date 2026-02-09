import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import Button from '../components/common/Button';
import { api } from '../config/api';
import './Products.css';
const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  const [filterOpen, setFilterOpen] = useState(false);
  
  // New Filter States
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(api('/api/products')),
          fetch(api('/api/categories'))
        ]);
        
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Clear search when changing category
    if (categoryId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId });
    }
    setFilterOpen(false);
  };

  const getFilteredProducts = () => {
    let filtered = products;

    // Filter by search query first
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Filter by Price
    filtered = filtered.filter(p => {
      const price = p.price || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Filter by Stock
    if (inStockOnly) {
       filtered = filtered.filter(p => (p.stock !== undefined ? p.stock > 0 : p.inStock));
    }

    // Sort Results
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    // Then filter by category if selected
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category?._id === selectedCategory);
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const getCategoryName = () => {
    if (searchQuery) {
      return `Search Results for "${searchQuery}"`;
    }
    if (selectedCategory === 'all') return 'All Products';
    const category = categories.find((cat) => cat._id === selectedCategory);
    return category ? category.name : 'Products';
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="products-page">
      <div className="container">
        {/* Page Header */}
        <div className="products-header">
          <div>
            <h1 className="products-title">{getCategoryName()}</h1>
            <p className="products-subtitle">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}{' '}
              available
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <select 
              className="products-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            <Button
              variant="outline"
              icon={<Filter size={20} />}
              onClick={() => setFilterOpen(!filterOpen)}
              className="mobile-filter-toggle"
            >
              Filter
            </Button>
          </div>
        </div>

        <div className="products-layout">
          {/* Sidebar Filter */}
          <aside className={`products-sidebar ${filterOpen ? 'products-sidebar-open' : ''}`}>
            <div className="filter-header">
              <h2 className="filter-title">Filters</h2>
              <button 
                className="mobile-filter-close" 
                onClick={() => setFilterOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Price Filter */}
            <div className="filter-section">
              <span className="filter-subtitle">Price Range (Rs.)</span>
              <div className="filter-range-inputs">
                <input 
                  type="number" 
                  className="filter-input"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                />
                <span className="filter-divider">-</span>
                <input 
                  type="number" 
                  className="filter-input"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Availability Filter */}
            <div className="filter-section">
              <span className="filter-subtitle">Availability</span>
              <label className="filter-checkbox">
                <input 
                  type="checkbox" 
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                In Stock Only
              </label>
            </div>

            <div className="filter-list">
              <span className="filter-subtitle" style={{ padding: '0 8px' }}>Categories</span>
              <button
                className={`filter-item ${selectedCategory === 'all' ? 'filter-item-active' : ''}`}
                onClick={() => handleCategoryChange('all')}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  className={`filter-item ${
                    selectedCategory === category._id ? 'filter-item-active' : ''
                  }`}
                  onClick={() => handleCategoryChange(category._id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="products-main">
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="products-empty">
                <h3>No products found</h3>
                <p>Try selecting a different category</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
