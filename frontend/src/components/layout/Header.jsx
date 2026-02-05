import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { sendWhatsAppMessage, whatsappMessages } from "../../utils/helpers";
import "./Header.css";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [categories, setCategories] = useState([]); // Dynamic categories
  const dropdownTimeoutRef = useRef(null);

  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const cartCount = getCartCount();

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories for menu", err);
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const handleWhatsAppClick = () => {
    sendWhatsAppMessage(whatsappMessages.generalInquiry());
  };

  const toggleDropdown = (menuName) => {
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
  };

  // Professional dropdown handlers with delay
  const handleDropdownEnter = (menuName) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(menuName);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300); // 300ms delay before closing
  };

  const handleDropdownStay = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
  };

  const navigation = [
    {
      name: "Home",
      path: "/",
      dropdown: false,
    },
    {
      name: "Products",
      path: "/products",
      dropdown: true,
      items: categories.map((cat) => ({
        name: cat.name,
        path: `/products?category=${cat._id}`,
      })),
    },
    {
      name: "Services",
      path: "/services",
      dropdown: true,
      items: [
        { name: "Medical Equipment", path: "/services#equipment" },
        { name: "Import & Export", path: "/services#import-export" },
        { name: "Bulk Orders", path: "/services#bulk-orders" },
        { name: "Maintenance & Support", path: "/services#support" },
      ],
    },
    {
      name: "Resources",
      path: "/resources",
      dropdown: true,
      items: [
        { name: "Product Catalogs", path: "/resources#catalogs" },
        { name: "Certifications", path: "/resources#certifications" },
        { name: "User Guides", path: "/resources#guides" },
        { name: "FAQs", path: "/resources#faq" },
      ],
    },
    {
      name: "Pages",
      path: "#",
      dropdown: true,
      items: [
        { name: "About Us", path: "/about" },
        { name: "Contact Us", path: "/contact" },
      ],
    },
    {
      name: "Blog",
      path: "/blog",
      dropdown: false,
    },
  ];

  return (
    <header className="header-modern">
      {/* Main Navigation */}
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
                        <ChevronDown size={16} className="dropdown-icon" />
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

            {/* Right Actions */}
            <div className="nav-actions-modern">
              {/* User Profile / Login */}
              {user ? (
                <div
                  className="user-menu-wrapper"
                  onMouseEnter={() => setShowUserMenu(true)}
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <button className="user-btn-modern">
                    <User size={20} />
                    <span>{user.name}</span>
                    <ChevronDown
                      size={16}
                      className={`user-dropdown-icon ${showUserMenu ? "open" : ""}`}
                    />
                  </button>
                  {showUserMenu && (
                    <div className="user-dropdown-menu">
                      <Link
                        to="/profile"
                        className="user-dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={18} />
                        My Profile
                      </Link>
                      <Link
                        to="/wishlist"
                        className="user-dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart size={18} />
                        My Wishlist
                      </Link>
                      <Link
                        to="/my-orders"
                        className="user-dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package size={18} />
                        My Orders
                      </Link>
                      <button
                        className="user-dropdown-item"
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
                  <User size={20} />
                  <span>Login</span>
                </Link>
              )}

              <Link to="/cart" className="cart-btn-modern">
                <ShoppingCart size={22} />
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
