import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { useSocket } from '../context/SocketContext';
import Button from '../components/common/Button';
import { api, cachedFetch } from '../config/api';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const { socket } = useSocket();

  const fetchData = async () => {
    // Only show loading on initial fetch, not on socket updates
    if (categories.length === 0) setLoading(true);
    
    try {
      const query = new URLSearchParams();
      const search = searchParams.get('search');
      const category = searchParams.get('category');
      
      if (search) query.append('search', search);
      if (category && category !== 'all' && category !== 'undefined' && category !== 'null') {
        query.append('category', category);
      }
      
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(api(`/api/products?${query.toString()}`)),
        fetch(api('/api/categories'))
      ]);
      
      const [productsData, categoriesData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json()
      ]);
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Products fetch error:", error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    if (socket) {
      socket.on('analyticsUpdate', fetchData);
      return () => socket.off('analyticsUpdate', fetchData);
    }
  }, [socket, searchParams]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    setSearchParams(categoryId === 'all' ? {} : { category: categoryId });
    setFilterOpen(false);
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }


    if (inStockOnly) {
      filtered = filtered.filter(p => (p.stock !== undefined ? p.stock > 0 : p.inStock));
    }

    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category?._id === selectedCategory);
    }

    return filtered;
  }, [products, searchQuery, inStockOnly, sortBy, selectedCategory]);

  const categoryName = useMemo(() => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    if (selectedCategory === 'all') return 'All Products';
    const category = categories.find((cat) => cat._id === selectedCategory);
    return category ? category.name : 'Products';
  }, [searchQuery, selectedCategory, categories]);

  const totalProductCount = useMemo(() => {
    return categories.reduce((acc, cat) => acc + (cat.productCount || 0), 0);
  }, [categories]);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <div>
            <h1 className="products-title">{categoryName}</h1>
            <p className="products-subtitle">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available</p>
          </div>
          <div className="products-controls flex gap-4 items-center">
            <select className="products-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <Button variant="outline" icon={<Filter size={20} />} onClick={() => setFilterOpen(!filterOpen)} className="mobile-filter-toggle">Filter</Button>
          </div>
        </div>

        <div className="products-layout">
          <aside className={`products-sidebar ${filterOpen ? 'products-sidebar-open' : ''}`}>
            <div className="filter-header">
              <h2 className="filter-title">Filters</h2>
              <button className="mobile-filter-close" onClick={() => setFilterOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="filter-section">
              <span className="filter-subtitle">Availability</span>
              <label className="filter-checkbox">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                In Stock Only
              </label>
            </div>

            <div className="filter-list">
              <span className="filter-subtitle" style={{ padding: '0 8px' }}>Categories</span>
              <button 
                className={`filter-item ${selectedCategory === 'all' ? 'filter-item-active' : ''}`} 
                onClick={() => handleCategoryChange('all')}
              >
                <span>All Products</span>
                <span className="category-count">({totalProductCount})</span>
              </button>
              {categories.map((category) => (
                <button 
                  key={category._id} 
                  className={`filter-item ${selectedCategory === category._id ? 'filter-item-active' : ''}`} 
                  onClick={() => handleCategoryChange(category._id)}
                >
                  <span>{category.name}</span>
                  <span className="category-count">({category.productCount || 0})</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="products-main">
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product) => <ProductCard key={product._id} product={product} />)}
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
