import { Shield, Globe, Award, Users, CheckCircle, Activity, Heart, Wrench } from 'lucide-react';
import Card from '../components/common/Card';
import './About.css';

const About = () => {
  const stats = [
    { label: 'Countries Served', value: '15+', icon: <Globe size={24} /> },
    { label: 'Quality Standards', value: 'ISO Cert', icon: <Shield size={24} /> },
    { label: 'Happy Clients', value: '500+', icon: <Users size={24} /> },
    { label: 'Product Range', value: '1000+', icon: <Activity size={24} /> },
  ];

  const values = [
    {
      icon: <CheckCircle size={32} />,
      title: 'Quality Assurance',
      description: 'All products meet international healthcare standards and certifications.',
    },
    {
      icon: <Globe size={32} />,
      title: 'Global Reach',
      description: 'Serving healthcare facilities across Gulf countries, Europe, and beyond.',
    },
    {
      icon: <Award size={32} />,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality medical equipment and services.',
    },
    {
      icon: <Heart size={32} />,
      title: 'Customer Focus',
      description: 'Dedicated support and personalized solutions for every client.',
    },
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="about-title">About AAZ International</h1>
            <p className="about-subtitle">
              Your Trusted Partner in Global Healthcare Solutions & Medical Excellence
            </p>
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-info">
                    <span className="stat-value">{stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f0f9ff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Company Philosophy */}
      <section className="about-philosophy">
        <div className="container">
          <div className="philosophy-grid">
            <div className="philosophy-text">
              <span className="section-badge">Who We Are</span>
              <h2>Pioneering Healthcare Excellence Since Inception</h2>
              <p>
                <strong>AAZ International Enterprises Pvt. Ltd.</strong> is a leading healthcare solutions
                provider based in Karachi, Pakistan. We specialize in supplying high-quality medical
                equipment, orthopedic implants, cardiac angiography systems, neurosurgical devices,
                and patient care equipment.
              </p>
              <p>
                With years of expert experience, we have established ourselves as a pillar of trust for 
                healthcare providers seeking reliable, certified, and cost-effective medical solutions 
                that prioritize patient outcomes.
              </p>
              <div className="philosophy-list">
                <div className="list-item">
                  <CheckCircle size={20} className="check-icon" />
                  <span>ISO Certified Medical Equipment</span>
                </div>
                <div className="list-item">
                  <CheckCircle size={20} className="check-icon" />
                  <span>24/7 Professional Technical Support</span>
                </div>
                <div className="list-item">
                  <CheckCircle size={20} className="check-icon" />
                  <span>Global Logistics & Supply Chain</span>
                </div>
              </div>
            </div>
            <div className="philosophy-image">
              <div className="image-stack">
                <div className="main-image">
                  <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Medical Facility" />
                </div>
                <div className="accent-box"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mission-vision">
        <div className="container">
          <div className="mission-grid">
            <Card className="mission-card" padding="large">
              <div className="card-icon"><Activity size={40} /></div>
              <h3>Our Mission</h3>
              <p>
                To provide healthcare facilities with access to world-class medical equipment and
                implants that enhance patient care. We are committed to quality, reliability, 
                and innovation in everything we do.
              </p>
            </Card>
            <Card className="mission-card vision" padding="large">
              <div className="card-icon"><Globe size={40} /></div>
              <h3>Our Vision</h3>
              <p>
                To be the global leader in medical equipment supply, bridging the gap between 
                advanced technology and healthcare providers across all continents.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Offerings Section */}
      <section className="professional-offerings">
        <div className="container">
          <div className="text-center section-header">
            <span className="section-badge">Services</span>
            <h2>Comprehensive Healthcare Solutions</h2>
            <p className="section-desc">We offer a wide range of medical services and equipment tailored to modern healthcare needs.</p>
          </div>
          
          <div className="offerings-grid">
            {[
              { title: 'Hospital Equipment', desc: 'Beds, surgical tables, and ICU monitors.', icon: <Activity /> },
              { title: 'Orthopedic Implants', desc: 'Hip, knee, and spinal surgical solutions.', icon: <Shield /> },
              { title: 'Cardiac Care', desc: 'Angiography systems and interventional devices.', icon: <Award /> },
              { title: 'Neuro Surgery', desc: 'Precision cranial fixation and instruments.', icon: <Shield /> },
              { title: 'Patient Care', desc: 'Comfort-focused monitoring and care devices.', icon: <Heart /> },
              { title: 'Support & Repair', desc: 'Professional technical maintenance services.', icon: <Wrench /> },
            ].map((offering, idx) => (
              <div key={idx} className="offering-card">
                <div className="offering-icon-mini">{offering.icon}</div>
                <div className="offering-info">
                  <h4>{offering.title}</h4>
                  <p>{offering.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="container">
          <div className="text-center section-header">
            <span className="section-badge">Values</span>
            <h2>Why Choose AAZ?</h2>
          </div>
          <div className="values-grid">
            {values.map((value, index) => (
              <Card key={index} className="value-card-modern" padding="large" hover>
                <div className="value-icon-circle">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="premium-cta">
        <div className="container">
          <div className="cta-box">
            <div className="cta-content">
              <h2>Let's Build the Future of Healthcare Together</h2>
              <p>Contact our experts today for a personalized consultation on your medical equipment needs.</p>
              <div className="cta-buttons">
                 <a href="/contact" className="cta-btn primary">Get Started</a>
                 <a href="tel:+923453450644" className="cta-btn secondary">Call Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

