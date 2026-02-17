import { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Clock, Send, ShieldCheck } from 'lucide-react';
import { sendWhatsAppMessage, whatsappMessages, isValidEmail } from '../utils/helpers';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { api } from '../config/api';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(api('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 7000);
      } else {
        alert(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    sendWhatsAppMessage(whatsappMessages.generalInquiry());
  };

  const contactInfo = [
    {
      icon: <MapPin size={24} />,
      title: 'Headquarters',
      content: 'Near Jinnah Hospital, Karachi, Pakistan',
    },
    {
      icon: <Phone size={24} />,
      title: 'Support Line',
      content: '+92 345 3450644',
      link: 'tel:+923453450644',
    },
    {
      icon: <Mail size={24} />,
      title: 'Email Address',
      content: 'aazint808@gmail.com',
      link: 'mailto:aazint808@gmail.com',
    },
    {
      icon: <Clock size={24} />,
      title: 'Operational Hours',
      content: 'Mon - Sat: 9:00 AM - 6:00 PM',
    },
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="contact-title">Contact Our Experts</h1>
            <p className="contact-subtitle">
              Have questions about our medical equipment or services? We're here to help you bridge the gap in healthcare.
            </p>
          </div>
        </div>
        <div className="hero-shape">
           <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M0,80L60,75C120,70,240,60,360,45C480,30,600,10,720,8C840,6,960,22,1080,35C1200,48,1320,58,1380,63L1440,68L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      <div className="container">
        <div className="contact-main-layout">
          {/* Contact Details Cards */}
          <div className="contact-info-cards">
            {contactInfo.map((info, index) => (
              <div key={index} className="info-modern-card">
                <div className="info-icon-wrapper">{info.icon}</div>
                <div className="info-body">
                  <h4>{info.title}</h4>
                  {info.link ? (
                    <a href={info.link}>{info.content}</a>
                  ) : (
                    <p>{info.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="contact-grid">
            {/* Form Section */}
            <div className="form-container">
              <Card className="modern-glass-card" padding="large">
                <div className="form-header">
                  <h2 className="form-title">Send us a Message</h2>
                  <p>Our average response time is under 12 hours.</p>
                </div>

                {submitSuccess && (
                  <div className="success-banner">
                    <ShieldCheck size={20} />
                    <span>Your inquiry has been successfully transmitted to our team.</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="professional-form">
                  <div className="input-group-row">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Dr. John Smith"
                      required
                      error={errors.name}
                    />
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@facility.com"
                      required
                      error={errors.email}
                    />
                  </div>
                  <Input
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g. Equipment Maintenance / Export Inquiry"
                    required
                    error={errors.subject}
                  />
                  <div className="input-wrapper">
                    <label htmlFor="message" className="input-label">
                      Message Details<span className="input-required">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please provide specific details about your requirement..."
                      required
                      rows="5"
                      className={`modern-textarea ${errors.message ? 'input-error' : ''}`}
                    />
                    {errors.message && <span className="input-error-message">{errors.message}</span>}
                  </div>

                  <div className="form-footer">
                    <Button type="submit" variant="primary" size="large" fullWidth loading={isSubmitting} icon={<Send size={18} />}>
                      {isSubmitting ? 'Transmitting...' : 'Submit Inquiry'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Side Branding Section */}
            <div className="contact-branding">
              <Card className="branding-card" padding="large">
                <h3>Global Support</h3>
                <p>We provide medical technology to over 15 countries with 24/7 technical assistance.</p>
                
                <div className="brand-features">
                   <div className="feature">
                      <ShieldCheck size={20} className="feature-icon" />
                      <span>Certified Medical Grade</span>
                   </div>
                   <div className="feature">
                      <ShieldCheck size={20} className="feature-icon" />
                      <span>Regulatory Compliant</span>
                   </div>
                   <div className="feature">
                      <ShieldCheck size={20} className="feature-icon" />
                      <span>Real-time Tracking</span>
                   </div>
                </div>

                <div className="whatsapp-callout">
                   <p>Need an instant response?</p>
                   <Button
                    variant="secondary"
                    size="medium"
                    fullWidth
                    icon={<MessageCircle size={20} />}
                    onClick={handleWhatsAppClick}
                  >
                    Chat on WhatsApp
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Map or Locations Placeholder */}
      <section className="locations-preview">
         <div className="container">
            <div className="preview-box">
               <MapPin size={40} className="map-icon" />
               <h4>Serving from Karachi, Pakistan</h4>
               <p>Connecting worldwide healthcare facilities with premium medical artifacts.</p>
            </div>
         </div>
      </section>
    </div>
  );
};

export default Contact;

