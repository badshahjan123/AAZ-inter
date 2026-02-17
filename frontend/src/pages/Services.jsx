import React from 'react';
import { 
  Truck, 
  Stethoscope, 
  Settings, 
  Globe, 
  CheckCircle, 
  Box, 
  Wrench,
  ShieldCheck,
  Activity,
  Heart
} from 'lucide-react';
import './Services.css';

const Services = () => {
  const serviceList = [
    {
      id: 'equipment',
      tag: 'Distribution',
      title: 'Medical Supply',
      icon: <Stethoscope size={20} />,
      desc: 'High-precision surgical instruments and orthopedic implants for specialized clinical environments.',
      features: ['Surgical Grade', 'ISO Certified', 'Batch Tracked', 'Sterile Packaged']
    },
    {
      id: 'logistics',
      tag: 'Global',
      title: 'Import Protocol',
      icon: <Globe size={20} />,
      desc: 'Expert logistics management for medical sourcing between Gulf, Europe, and International markets.',
      features: ['Customs Clearance', 'Direct Sourcing', 'Regulatory Sync', 'Temp Controlled']
    },
    {
      id: 'bulk',
      tag: 'Enterprise',
      title: 'Bulk Procurement',
      icon: <Box size={20} />,
      desc: 'Comprehensive inventory solutions for hospital groups, government tenders, and bulk distribution.',
      features: ['Tender Support', 'Wholesale Rates', 'Priority Slots', 'Direct Fulfillment']
    },
    {
      id: 'engineering',
      tag: 'Technical',
      title: 'Clinical Support',
      icon: <Wrench size={20} />,
      desc: 'Post-delivery technical assistance and maintenance lifecycle management for health equipment.',
      features: ['24/7 Response', 'On-site Repair', 'Calibration', 'Parts Sourcing']
    },
    {
      id: 'compliance',
      tag: 'Quality',
      title: 'Quality Audit',
      icon: <ShieldCheck size={20} />,
      desc: 'Rigorous compliance testing and quality assurance protocols for every medical device dispatched.',
      features: ['Standard Testing', 'Safety Checks', 'Label Verification', 'Impact Analysis']
    },
    {
      id: 'care',
      tag: 'Patient',
      title: 'Patient Systems',
      icon: <Activity size={20} />,
      desc: 'Advanced patient monitoring and diagnostic systems tailored for ICU and emergency departments.',
      features: ['Real-time Sync', 'Alert Systems', 'User Training', 'Integration Ready']
    }
  ];

  return (
    <div className="services-page">
      <div className="container">
        {/* Compact ERP Header */}
        <header className="services-header-modern">
          <h1>Clinical Service Portfolio</h1>
          <p>Professional healthcare solutions and logistics protocols optimized for global medical standards.</p>
        </header>

        {/* High Density ERP Grid */}
        <div className="services-grid-erp">
          {serviceList.map((service) => (
            <div key={service.id} className="service-card-erp">
              <span className="service-tag-erp">{service.tag}</span>
              <div className="card-head-erp">
                <div className="card-icon-box">
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
              </div>
              <p className="card-desc-erp">{service.desc}</p>
              <div className="card-features-erp">
                {service.features.map((feature, i) => (
                  <div key={i} className="feature-item-erp">
                    <CheckCircle size={14} className="feature-check-erp" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
