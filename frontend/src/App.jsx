import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./admin/context/AdminAuth";
import { SocketProvider } from "./context/SocketContext";
import { WishlistProvider } from "./context/WishlistContext";
import { NotificationProvider } from "./context/NotificationContext";
import ScrollToTop from "./components/common/ScrollToTop";
import "./App.css";

// Eager load critical components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Services = lazy(() => import("./pages/Services"));
const Resources = lazy(() => import("./pages/Resources"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Blog = lazy(() => import("./pages/Blog"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const MedicalDisclaimer = lazy(() => import("./pages/MedicalDisclaimer"));

// Admin lazy loads
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminLogin = lazy(() => import("./admin/pages/Login"));
const AdminDashboard = lazy(() => import("./admin/pages/Dashboard"));
const ProductList = lazy(() => import("./admin/pages/Products/ProductList"));
const ProductForm = lazy(() => import("./admin/pages/Products/ProductForm"));
const Categories = lazy(() => import("./admin/pages/Categories"));
const OrderManagement = lazy(() => import("./admin/pages/Orders/OrderManagement"));
const OrderDetail = lazy(() => import("./admin/pages/Orders/OrderDetail"));
const PaymentVerification = lazy(() => import("./admin/pages/PaymentVerification"));
const CustomerList = lazy(() => import("./admin/pages/Customers"));

const Loader = () => <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}><div>Loading...</div></div>;

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const authPaths = [
    '/login', 
    '/signup', 
    '/verify-email', 
    '/forgot-password', 
    '/reset-password'
  ];
  
  const isAuthPage = authPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="app">
      <Header />
      <main className="main-content">{children}</main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

function App() {
  return (
     <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <CartProvider>
            <WishlistProvider>
              <Router>
              <ScrollToTop />
              <Suspense fallback={<Loader />}>
                <Routes>
                  {/* Admin Routes */}
                  <Route
                    path="/admin/*"
                    element={
                      <AdminAuthProvider>
                        <Suspense fallback={<Loader />}>
                          <Routes>
                            <Route path="login" element={<AdminLogin />} />
                            <Route element={<AdminLayout />}>
                              <Route index element={<Navigate to="dashboard" replace />} />
                              <Route path="dashboard" element={<AdminDashboard />} />
                              <Route path="products" element={<ProductList />} />
                              <Route path="products/add" element={<ProductForm />} />
                              <Route path="products/edit/:id" element={<ProductForm />} />
                              <Route path="products/:id" element={<ProductForm />} />
                              <Route path="categories" element={<Categories />} />
                              <Route path="orders" element={<OrderManagement />} />
                              <Route path="orders/:id" element={<OrderDetail />} />
                              <Route path="payment-verification" element={<PaymentVerification />} />
                              <Route path="customers" element={<CustomerList />} />
                            </Route>
                          </Routes>
                        </Suspense>
                      </AdminAuthProvider>
                    }
                  />

                  {/* Public Routes */}
                  <Route
                    path="/*"
                    element={
                      <PublicLayout>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/signup" element={<Signup />} />
                          <Route path="/verify-email" element={<VerifyEmail />} />
                          <Route path="/verify-email/:token" element={<VerifyEmail />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password/:token" element={<ResetPassword />} />
                          <Route path="/blog" element={<Blog />} />
                          <Route path="/services" element={<Services />} />
                          <Route path="/resources" element={<Resources />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/products/:id" element={<ProductDetail />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                          <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                          <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
                          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                          <Route path="/order-details/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                          <Route path="/terms-conditions" element={<TermsConditions />} />
                          <Route path="/medical-disclaimer" element={<MedicalDisclaimer />} />
                        </Routes>
                      </PublicLayout>
                    }
                  />
                </Routes>
              </Suspense>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </NotificationProvider>
    </SocketProvider>
  </AuthProvider>
  );
}

export default App;
