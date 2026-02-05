import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Package, Heart, TrendingUp, Award, ShoppingBag, CheckCircle, Globe, Shield, Wrench, Headphones, TruckIcon } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import Button from '../components/common/Button';
import './Home.css';
import { api } from '../config/api';

const Home = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Handle search functionality
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Get products by category (max 4 per category)
  const getProductsByCategory = (categoryId) => {
    return products
      .filter(p => p.category?._id === categoryId)
      .slice(0, 4);
  };

  const featuredBoxes = [
    {
      color: 'blue',
      title: 'Hospital Equipment',
      subtitle: 'at One Place',
      discount: 'UP TO 50% OFF',
      icon: <Package size={40} />,
    },
    {
      color: 'pink',
      title: 'Certified',
      subtitle: 'Quality Products',
      discount: 'TRUSTED',
      icon: <Heart size={40} />,
    },
    {
      color: 'green',
      title: 'Medical',
      subtitle: 'Solutions',
      discount: 'UP TO 40% OFF',
      icon: <TrendingUp size={40} />,
    },
    {
      color: 'yellow',
      title: 'Best Selling',
      subtitle: 'Products',
      discount: 'TOP RATED',
      icon: <Award size={40} />,
    },
  ];

  const whyChooseUs = [
    {
      icon: <CheckCircle size={36} />,
      title: 'Quality & Compliance',
      description: 'All products meet international medical standards and certifications'
    },
    {
      icon: <Globe size={36} />,
      title: 'Worldwide Import / Export',
      description: 'Seamless logistics and delivery to medical facilities globally'
    },
    {
      icon: <Shield size={36} />,
      title: 'Trusted Suppliers',
      description: 'Partnered with world-renowned medical equipment manufacturers'
    },
    {
      icon: <Wrench size={36} />,
      title: 'Maintenance & Repair Services',
      description: 'On-site support and comprehensive after-sales services'
    }
  ];

  const services = [
    {
      icon: <Package size={32} />,
      title: 'Medical Equipment Supply',
      description: 'Complete range of hospital and surgical equipment for all departments'
    },
    {
      icon: <Wrench size={32} />,
      title: 'Equipment Maintenance & Repair',
      description: 'Expert technical support and preventive maintenance programs'
    },
    {
      icon: <TruckIcon size={32} />,
      title: 'Import & Export',
      description: 'Efficient procurement and delivery of medical devices worldwide'
    },
    {
      icon: <Headphones size={32} />,
      title: 'Hospital Support Solutions',
      description: 'Consultation and customized equipment solutions for healthcare facilities'
    }
  ];


  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="home-page">
      {/* Hero Section with Search */}
      <section className="hero-modern">
        <div className="container">
          <div className="hero-modern-content">
            <div className="hero-text">
              <h1 className="hero-modern-title">
                Professional Medical Equipment
                <br />
                <span className="hero-modern-highlight">For Healthcare Excellence</span>
              </h1>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="hero-search">
                <div className="search-category">
                  <span>All Categories</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Search medical equipment..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
                <button type="submit" className="search-btn">
                  <Search size={20} />
                </button>
              </form>

              <div className="hero-modern-actions">
                <Button variant="primary" onClick={() => navigate('/products')}>
                  <ShoppingBag size={20} />
                  Browse Products
                </Button>
                <Button variant="outline" onClick={() => navigate('/contact')}>
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Colorful Boxes */}
      <section className="featured-boxes-section">
        <div className="container">
          <div className="featured-boxes-grid">
            {featuredBoxes.map((box, index) => (
              <div key={index} className={`featured-box featured-box-${box.color}`}>
                <div className="featured-box-discount">{box.discount}</div>
                <h3 className="featured-box-title">
                  {box.title}
                  <br />
                  <span className="featured-box-subtitle">{box.subtitle}</span>
                </h3>
                <div className="featured-box-icon">{box.icon}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories with Products - ONLY 2 for Professional Look */}
      {categories.slice(0, 2).map((category) => {
        const categoryProducts = getProductsByCategory(category._id);
        if (categoryProducts.length === 0) return null;

        return (
          <section key={category._id} className="category-section">
            <div className="container">
              <div className="category-section-header">
                <div>
                  <h2 className="category-section-title">{category.name}</h2>
                </div>
                <Button
                  variant="outline"
                  icon={<ArrowRight size={18} />}
                  onClick={() => navigate(`/products?category=${category._id}`)}
                >
                  View All
                </Button>
              </div>

              <div className="category-products-grid">
                {categoryProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <div className="container">
          <div className="section-header-clean">
            <h2>Why Choose AAZ International</h2>
            <p>Your trusted partner in medical equipment supply and support</p>
          </div>
          <div className="why-choose-grid">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="why-choose-card">
                <div className="why-choose-icon">
                  {item.icon}
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Services Section */}
      <section className="services-section">
        <div className="container">
          <div className="section-header-clean">
            <h2>Our Services</h2>
            <p>Comprehensive medical equipment solutions and support</p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Company Short Section */}
      <section className="about-short-section">
        <div className="container">
          <div className="about-short-content">
            <h2>About AAZ International Enterprises</h2>
            <p>
              AAZ International Enterprises Pvt. Ltd., based in Karachi, Pakistan, is a leading 
              supplier of high-quality medical equipment and surgical implants. We specialize in 
              hospital equipment, orthopedic implants, cardiac devices, and neuro-surgery instruments, 
              serving healthcare facilities across the globe with excellence and reliability.
            </p>
            <Button variant="outline" onClick={() => navigate('/about')}>
              Learn More About Us
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section-modern">
        <div className="container">
          <div className="cta-content-modern">
            <h2>Need Help Finding the Right Equipment?</h2>
            <p>Our team of medical equipment specialists is ready to assist you</p>
            <div className="cta-actions-modern">
              <Button variant="primary" onClick={() => navigate('/contact')}>
                Contact Our Team
              </Button>
              <Button variant="secondary" onClick={() => navigate('/products')}>
                Browse All Products
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
