import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Package, Heart, TrendingUp, Award, ShoppingBag, CheckCircle, Globe, Shield, Wrench, Headphones, TruckIcon, ChevronDown, ShieldCheck, Stethoscope, Phone } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import Button from '../components/common/Button';
import { api, cachedFetch } from '../config/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState({ _id: '', name: 'All Categories' });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch 8 latest products
        const productRes = await fetch(api('/api/products?limit=8&sort=latest'));
        const productData = await productRes.json();
        setFeaturedProducts(Array.isArray(productData) ? productData : []);

        // Fetch Categories
        const categoryRes = await fetch(api('/api/categories'));
        const categoryData = await categoryRes.json();
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

  const featuredBoxes = useMemo(() => [
    { color: 'blue', title: 'Clinical Furniture', subtitle: 'Hospital & Ward', discount: 'INSTITUTIONAL', icon: <Package size={40} /> },
    { color: 'pink', title: 'Surgical Instruments', subtitle: 'OT & ER Grade', discount: 'CERTIFIED', icon: <Heart size={40} /> },
    { color: 'green', title: 'Diagnostic Systems', subtitle: 'Advanced Imaging', discount: 'LATEST TECH', icon: <TrendingUp size={40} /> },
    { color: 'yellow', title: 'Bulk Supplies', subtitle: 'Consumables', discount: 'WHOLESALE', icon: <Award size={40} /> },
  ], []);

  const whyChooseUs = useMemo(() => [
    { icon: <CheckCircle size={36} />, title: 'Quality & Compliance', description: 'All products meet international medical standards and certifications' },
    { icon: <Globe size={36} />, title: 'Worldwide Import / Export', description: 'Seamless logistics and delivery to medical facilities globally' },
    { icon: <Shield size={36} />, title: 'Trusted Suppliers', description: 'Partnered with world-renowned medical equipment manufacturers' },
    { icon: <Wrench size={36} />, title: 'Maintenance & Repair Services', description: 'On-site support and comprehensive after-sales services' }
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
              <Button 
                variant="outline" 
                icon={<ArrowRight size={18} />} 
                onClick={() => navigate('/products')}
              >
                View Full Catalog
              </Button>
            </div>
            <div className="category-products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}


      <section className="why-choose-section">
        <div className="container">
          <div className="section-header-clean">
            <h2>Why Institutional Clients Choose Us</h2>
            <p>Your trusted global partner in clinical equipment supply and technical support</p>
          </div>
          <div className="why-choose-grid">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="why-choose-card">
                <div className="why-choose-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              <Button variant="secondary" onClick={() => navigate('/products')}>View Products</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Technical Support Button */}
      <div 
        className="floating-support-btn"
        onClick={() => window.open(`https://wa.me/923000000000?text=${encodeURIComponent("Hello, I need technical assistance with medical equipment.")}`, '_blank')}
      >
        <div className="support-tooltip">Contact Us</div>
        <Phone size={28} />
      </div>
    </div>
  );
};

export default Home;
