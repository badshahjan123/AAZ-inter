import { useState, useEffect } from 'react';
import { X, Info, CheckCircle, XCircle, Bell } from 'lucide-react';
import './Notification.css';

const Notification = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <XCircle size={20} />;
      case 'warning': return <Info size={20} />;
      default: return <Bell size={20} />;
    }
  };

  return (
    <div className={`notification-item ${type} ${isExiting ? 'exit' : 'enter'}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      <div className="notification-content">
        <p>{message}</p>
      </div>
      <button className="notification-close" onClick={handleClose}>
        <X size={16} />
      </button>
    </div>
  );
};

export default Notification;
