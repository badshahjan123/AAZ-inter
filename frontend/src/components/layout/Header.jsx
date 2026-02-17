import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  MessageCircle,
  ChevronDown,
  User,
  LogOut,
  Package,
  Heart,
  Globe,
  ShieldCheck,
  Phone,
  Search,
  Bell,
  Trash2,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext";
import { sendWhatsAppMessage, whatsappMessages } from "../../utils/helpers";
import { api, cachedFetch } from '../../config/api';
import "./Header.css";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownTimeoutRef = useRef(null);
  const userMenuTimeoutRef = useRef(null);
  const searchRef = useRef(null);

  const { socket } = useSocket();
  const { showNotification, history, unreadCount, markAsRead, clearHistory } = useNotification();
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const { getWishlistCount } = useWishlist();
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (!event.target.closest('.notification-center-wrapper')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markAsRead();
    }
  };

  // Global Notification Listener
  useEffect(() => {
    if (!socket || !user) return;

    const handlePaymentApproved = (data) => {
      console.log('🔔 RECEIVED paymentApproved:', data);
      
      // Case-insensitive email match
      if (data.customerEmail && data.customerEmail.toLowerCase() !== user.email.toLowerCase()) {
        console.log('🚫 Skipping notification: Email mismatch');
        return;
      }
      
      const shortId = data.orderId ? data.orderId.slice(-8).toUpperCase() : 'Unknown';
      
      showNotification(
        `Great news! Payment for order #${shortId} has been verified.`,
        'success'
      );
    };

    const handlePaymentRejected = (data) => {
      console.log('🔔 RECEIVED paymentRejected:', data);

      if (data.customerEmail && data.customerEmail.toLowerCase() !== user.email.toLowerCase()) {
        console.log('🚫 Skipping notification: Email mismatch');
        return;
      }

      const shortId = data.orderId ? data.orderId.slice(-8).toUpperCase() : 'Unknown';

      showNotification(
        `Payment was rejected for order #${shortId}. Reason: ${data.reason}`,
        'error',
        10000 // Show for longer
      );
    };

    socket.on('paymentApproved', handlePaymentApproved);
    socket.on('paymentRejected', handlePaymentRejected);

    return () => {
      socket.off('paymentApproved', handlePaymentApproved);
      socket.off('paymentRejected', handlePaymentRejected);
    };
  }, [socket, user, showNotification]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await cachedFetch(api("/api/categories"));
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        // Error handled silently
      }
    };
    fetchCategories();
  }, []);

  // Live Search Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const res = await fetch(api(`/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`));
        const data = await res.json();
        setSearchSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        setSearchSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setShowUserMenu(false);
  }, [logout]);

  const handleUserMenuEnter = useCallback(() => {
    if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current);
    }
    setShowUserMenu(true);
  }, []);

  const handleUserMenuLeave = useCallback(() => {
    userMenuTimeoutRef.current = setTimeout(() => {
      setShowUserMenu(false);
    }, 300);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setShowSuggestions(false);
  }, []);

  const handleWhatsAppClick = useCallback(() => {
    sendWhatsAppMessage(whatsappMessages.generalInquiry());
  }, []);

  const toggleDropdown = useCallback((menuName) => {
    setActiveDropdown(prev => prev === menuName ? null : menuName);
  }, []);

  const handleDropdownEnter = useCallback((menuName) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(menuName);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300);
  }, []);

  const handleDropdownStay = useCallback(() => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
  }, []);

  const navigation = useMemo(() => [
    {
      name: "Home",
      path: "/",
      dropdown: false,
    },
    {
      name: "Products",
      path: "/products",
      dropdown: true,
      items: [
        { name: "All Products", path: "/products" },
        ...categories.map((cat) => ({
          name: cat.name,
          path: `/products?category=${cat._id}`,
        }))
      ],
    },
    {
      name: "Pages",
      path: "#",
      dropdown: true,
      items: [
        { name: "About Us", path: "/about" },
        { name: "Services", path: "/services" },
        { name: "Contact Us", path: "/contact" },
      ],
    },
  ], [categories]);
  return (
    <header className="header-modern">
      <div className="header-nav-main">
        <div className="container">
          <div className="nav-main-content">
            {/* Logo */}
            <Link to="/" className="logo-modern" onClick={closeMobileMenu}>
              <img src="/logo.png" alt="AAZ International" className="logo-image" />
            </Link>

            {/* Desktop Navigation with Dropdowns */}
            <nav className="nav-links-modern">
               {navigation.map((item) => (
                <div
                  key={item.name}
                  className="nav-item-wrapper"
                  onMouseEnter={() =>
                    item.dropdown && handleDropdownEnter(item.name)
                  }
                  onMouseLeave={handleDropdownLeave}
                >
                  {item.dropdown ? (
                    <>
                      <button className="nav-link-modern nav-link-dropdown">
                        {item.name}
                        <ChevronDown size={14} className="dropdown-icon" />
                      </button>
                      {activeDropdown === item.name && (
                        <div
                          className="dropdown-menu"
                          onMouseEnter={handleDropdownStay}
                          onMouseLeave={handleDropdownLeave}
                        >
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.path}
                              className="dropdown-item"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `nav-link-modern ${isActive ? "nav-link-active-modern" : ""}`
                      }
                    >
                      {item.name}
                    </NavLink>
                  )}
                </div>
              ))}
            </nav>

            {/* Compact Integrated Search Bar */}
            <div className="header-search-wrapper" ref={searchRef}>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
                }
                setShowSuggestions(false);
              }} className="header-search-form">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="header-search-input"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                />
                <button type="submit" className="header-search-btn">
                  <Search size={18} />
                </button>
              </form>

              {/* Live Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions-dropdown">
                  <div className="suggestions-list">
                    {searchSuggestions.map((product) => (
                      <Link
                        key={product._id}
                        to={`/products/${product._id}`}
                        className="suggestion-item"
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="suggestion-info">
                          <span className="suggestion-name">{product.name}</span>
                          <span className="suggestion-price">Rs. {product.price.toLocaleString()}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link 
                    to={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                    className="see-all-results"
                    onClick={() => setShowSuggestions(false)}
                  >
                    See all results for "{searchQuery}"
                  </Link>
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="nav-actions-modern">
              {/* Notification Center */}
              {user && (
                <div className="notification-center-wrapper">
                  <button 
                    className={`notification-btn-modern ${unreadCount > 0 ? 'has-unread' : ''}`}
                    onClick={handleNotificationClick}
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="notification-dropdown-header">
                        <h4>Notifications</h4>
                        <button onClick={clearHistory} className="clear-all-btn">
                          <Trash2 size={14} />
                          Clear All
                        </button>
                      </div>
                      <div className="notification-list-scroll">
                        {history.length > 0 ? (
                          history.map((notif) => (
                            <div key={notif.id} className={`notification-history-item ${notif.type}`}>
                              <div className="notif-header">
                                <span className={`notif-dot ${notif.type}`}></span>
                                <span className="notif-time">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="notif-message">{notif.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="notif-empty">
                            <Bell size={32} />
                            <p>No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Profile / Login */}
              {user ? (
                <div
                  className="user-menu-wrapper"
                  onMouseEnter={handleUserMenuEnter}
                  onMouseLeave={handleUserMenuLeave}
                >
                  <button 
                    className="user-btn-modern" 
                    type="button" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setShowUserMenu(!showUserMenu); 
                    }} 
                  >
                    <User size={18} />
                    <span>{user.name}</span>
                  </button>
                  {showUserMenu && (
                    <div 
                      className="user-dropdown-menu"
                      onMouseEnter={handleUserMenuEnter}
                      onMouseLeave={handleUserMenuLeave}
                    >
                      <Link
                        to="/profile"
                        className="user-dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={18} />
                        Profile
                      </Link>
                      <Link
                        to="/wishlist"
                        className="user-dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart size={18} />
                        Wishlist
                      </Link>
                      <Link
                        to="/my-orders"
                        className="user-dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package size={18} />
                        Orders
                      </Link>
                      <button
                        className="user-dropdown-item logout-accent"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="login-btn-modern">
                  <User size={18} />
                  <span>Login</span>
                </Link>
              )}

              <Link to="/wishlist" className="wishlist-btn-modern">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="wishlist-badge-modern">{wishlistCount}</span>
                )}
              </Link>

              <Link to="/cart" className="cart-btn-modern">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="cart-badge-modern">{cartCount}</span>
                )}
              </Link>

              <button
                className="mobile-toggle-modern"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-overlay" onClick={closeMobileMenu}></div>
          <div className="mobile-menu-modern">
            <div className="mobile-menu-content">
              <div className="mobile-menu-header">
                <h3>Menu</h3>
                <button onClick={closeMobileMenu}>
                  <X size={24} />
                </button>
              </div>
              <nav className="mobile-nav-modern">
                {navigation.map((item) => (
                  <div key={item.name} className="mobile-nav-item">
                    {item.dropdown ? (
                      <>
                        <button
                          className="mobile-nav-link-modern mobile-dropdown-toggle"
                          onClick={() => toggleDropdown(item.name)}
                        >
                          {item.name}
                          <ChevronDown
                            size={18}
                            className={`mobile-dropdown-icon ${activeDropdown === item.name ? "open" : ""}`}
                          />
                        </button>
                        {activeDropdown === item.name && (
                          <div className="mobile-dropdown-menu">
                            {item.items.map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.path}
                                className="mobile-dropdown-item"
                                onClick={closeMobileMenu}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `mobile-nav-link-modern ${isActive ? "mobile-nav-active" : ""}`
                        }
                        onClick={closeMobileMenu}
                      >
                        {item.name}
                      </NavLink>
                    )}
                  </div>
                ))}
              </nav>
              <button
                className="mobile-whatsapp-btn"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle size={20} />
                <span>Contact on WhatsApp</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
