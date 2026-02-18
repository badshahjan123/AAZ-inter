import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Package, Heart, TrendingUp, Award, ShoppingBag, CheckCircle, Globe, Shield, Wrench, Headphones, TruckIcon, ChevronDown, ShieldCheck, Stethoscope, Phone, FileDown, Activity } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import Button from '../components/common/Button';
import { api, cachedFetch } from '../config/api';
import { generateProfessionalCatalog } from '../utils/catalogGenerator';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState({ _id: '', name: 'All Categories' });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productRes, categoryRes] = await Promise.all([
          fetch(api('/api/products?limit=8&sort=latest')),
          fetch(api('/api/categories'))
        ]);

        const [productData, categoryData] = await Promise.all([
          productRes.json(),
          categoryRes.json()
        ]);

        setFeaturedProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (error) {
        console.error("Home data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    let url = '/products';
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedCategory._id) params.append('category', selectedCategory._id);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    navigate(url);
  };

  const handleDownloadCatalog = async () => {
    try {
      setIsDownloading(true);
      // Fetch all products for a comprehensive catalog
      const res = await fetch(api('/api/products?limit=100'));
      const products = await res.json();
      
      if (Array.isArray(products)) {
        await generateProfessionalCatalog(products);
      } else {
        alert("Failed to fetch product list for catalog.");
      }
    } catch (error) {
      console.error("PDF Scan error:", error);
      alert("Error generating catalog. Please try again later.");
    } finally {
      setIsDownloading(false);
    }
  };

  const featuredBoxes = useMemo(() => [
    { color: 'blue', title: 'Orthopedic Implants', subtitle: 'Prosthetics & Fixation', discount: '4 PRODUCTS', icon: <Activity size={40} />, image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800' },
    { color: 'pink', title: 'Surgical Instruments', subtitle: 'Precision OT Tools', discount: 'EU CERTIFIED', icon: <Heart size={40} />, image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800' },
    { color: 'green', title: 'Respiratory Care Equipment', subtitle: 'Ventilators & Oxygen', discount: 'CRITICAL CARE', icon: <TrendingUp size={40} />, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800' },
    { color: 'yellow', title: 'Neurology Equipment', subtitle: 'Brain & Nerve Care', discount: 'DIAGNOSTIC', icon: <Activity size={40} />, image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800' },
    { color: 'purple', title: 'Neonatal Equipment', subtitle: 'Infant Care Systems', discount: 'PREMIUM', icon: <ShoppingBag size={40} />, image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=800' },
    { color: 'cyan', title: 'Patient Monitoring Equipment', subtitle: 'Vital Sign Systems', discount: '24/7 TRACKING', icon: <TrendingUp size={40} />, image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=800' },
  ], []);



  const services = useMemo(() => [
    { icon: <Package size={32} />, title: 'Medical Equipment Supply', description: 'Complete range of hospital and surgical equipment for all departments' },
    { icon: <Wrench size={32} />, title: 'Equipment Maintenance & Repair', description: 'Expert technical support and preventive maintenance programs' },
    { icon: <TruckIcon size={32} />, title: 'Import & Export', description: 'Efficient procurement and delivery of medical devices worldwide' },
    { icon: <Headphones size={32} />, title: 'Hospital Support Solutions', description: 'Consultation and customized equipment solutions for healthcare facilities' }
  ], []);

  const reviews = useMemo(() => [
    { name: 'Dr. Yusuf Zaid', role: 'Chief Surgeon, City Medical Center', text: "AAZ International provides exceptional surgical instruments. The quality is consistent and highly reliable for our daily operations." },
    { name: 'Dr. Sara Ahmed', role: 'Director of Procurement, Al-Shifa Hospital', text: "We have been sourcing our disposables from AAZ for years. Their supply chain reliability is critical to our hospital's success." },
    { name: 'Dr. Bilal Khan', role: 'Head of Department, Orthopedics', text: "The orthopedic implants from AAZ meet all international standards. My team is very satisfied with the precision." },
    { name: 'Ayesha Malik', role: 'Clinic Administrator, Care Trust', text: "Excellent customer service and prompt delivery. AAZ is our go-to partner for all medical equipment needs." }
  ], []);

  const handleDeptClick = (deptTitle) => {
    const category = categories.find(cat => 
      cat.name.toLowerCase().includes(deptTitle.toLowerCase()) || 
      deptTitle.toLowerCase().includes(cat.name.toLowerCase())
    );
    
    if (category) {
      navigate(`/products?category=${category._id}`);
    } else {
      navigate(`/products?search=${deptTitle}`);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-modern">
        <video 
          className="hero-video-bg"
          autoPlay 
          loop 
          muted 
          playsInline
          poster="/medical_hospital_equipment_hero.png"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay-bg"></div>
        
        <div className="container">
          <div className="hero-modern-content">
            <div className="hero-text">
              <h1 className="hero-modern-title">
                Enterprise-Grade <br />
                <span className="hero-modern-highlight">Medical Equipment Solutions</span>
              </h1>
              <p className="hero-modern-subtitle">
                AAZ International provides clinical-grade instruments, hospital furniture,
                and advanced diagnostic systems to healthcare institutions worldwide.
              </p>
              <div className="hero-actions-container">
                <Button 
                  variant="primary" 
                  size="large" 
                  onClick={() => navigate('/products')}
                  className="hero-cta-btn"
                >
                  Explore Catalog
                </Button>
                <Button 
                  variant="outline" 
                  size="large" 
                  icon={<FileDown size={20} />}
                  onClick={handleDownloadCatalog}
                  loading={isDownloading}
                  className="hero-download-btn"
                >
                  Download Catalog
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Departments Grid */}
      <section className="dept-grid-section">
        <div className="container">
          <div className="section-header-clean">
            <h2 className="section-title-enterprise">Institutional Departments</h2>
            <p className="section-desc-enterprise">Specialized equipment solutions tailored for clinical environments</p>
          </div>
          <div className="dept-modern-grid">
            {featuredBoxes.map((dept, index) => (
              <div 
                key={index} 
                className="dept-card-new" 
                onClick={() => handleDeptClick(dept.title)}
              >
                <div className="dept-image-box">
                  <img src={dept.image} alt={dept.title} loading="lazy" />
                  <div className="dept-overlay"></div>
                  <div className="dept-badge">{dept.discount}</div>
                </div>
                <div className="dept-info-new">
                  <div className="dept-icon-mini">{dept.icon}</div>
                  <h3>{dept.title}</h3>
                  <p>{dept.subtitle}</p>
                  <span className="dept-explore-link">Browse Specialists <ArrowRight size={14} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Stats Bar - Professional B2B Strip */}
      <section className="trust-stats-bar">
        <div className="container">
          <div className="stats-inner-container">
            <div className="stat-unit">
              <ShieldCheck size={28} className="stat-icon-blue" />
              <div className="stat-text">
                <span className="stat-title">ISO Certified</span>
                <span className="stat-subtitle">Quality Standards</span>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-unit">
              <Globe size={28} className="stat-icon-blue" />
              <div className="stat-text">
                <span className="stat-title">15+ Countries</span>
                <span className="stat-subtitle">Global Presence</span>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-unit">
              <Award size={28} className="stat-icon-blue" />
              <div className="stat-text">
                <span className="stat-title">500+ Clients</span>
                <span className="stat-subtitle">Healthcare Partners</span>
              </div>
            </div>
            <div className="stat-divider desktop-only"></div>
            <div className="stat-unit desktop-only">
              <CheckCircle size={28} className="stat-icon-blue" />
              <div className="stat-text">
                <span className="stat-title">CE Marked</span>
                <span className="stat-subtitle">Surgical Precision</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured/Latest Products Section */}
      {featuredProducts.length > 0 && (
        <section className="category-section">
          <div className="container">
            <div className="category-section-header">
              <div>
                <h2 className="category-section-title">Professional Medical Equipment Catalog</h2>
                <p className="text-muted">High-precision instruments from certified global manufacturers</p>
              </div>
            </div>
            <div className="category-products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="mobile-only section-footer-btn">
              <Button 
                variant="outline" 
                icon={<ArrowRight size={18} />} 
                onClick={() => navigate('/products')}
                fullWidth
              >
                Show All Products
              </Button>
            </div>
          </div>
        </section>
      )}




      <section className="services-section">
        <div className="container">
          <div className="section-header-clean">
            <h2>Our Professional Services</h2>
            <p>Comprehensive medical equipment lifecycle solutions and technical support</p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="container">
          <div className="section-header-clean">
            <h2>Institutional Partners & Trust</h2>
            <p>Feedback from healthcare leaders who rely on AAZ International</p>
          </div>
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-stars">★★★★★</div>
                <div className="review-quote">"{review.text}"</div>
                <div className="review-author-box">
                  <div className="review-avatar">
                    {review.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="review-meta">
                    <h4>{review.name}</h4>
                    <p>{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-short-section">
        <div className="container">
          <div className="about-short-content">
            <h2>About Our Company</h2>
            <p>AAZ International is a trusted supplier of medical equipment and surgical instruments. We provide quality products to hospitals and clinics worldwide.</p>
            <Button variant="outline" onClick={() => navigate('/about')}>Learn More</Button>
          </div>
        </div>
      </section>

      <section className="cta-section-modern">
        <div className="container">
          <div className="cta-content-modern">
            <h2>Need Help? Contact Us</h2>
            <p>Our team is ready to assist you with your medical equipment needs</p>
            <div className="cta-actions-modern">
              <Button variant="primary" onClick={() => navigate('/contact')}>Contact Us</Button>
              <Button variant="secondary" onClick={() => navigate('/products')}>View Categories</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Technical Support Button */}
      <div 
        className="floating-support-btn"
        onClick={() => window.open(`https://wa.me/923453450644?text=${encodeURIComponent("Hello, I need technical assistance with medical equipment.")}`, '_blank')}
      >
        <div className="support-tooltip">Contact Us</div>
        <Phone size={28} />
      </div>
    </div>
  );
};

export default Home;
