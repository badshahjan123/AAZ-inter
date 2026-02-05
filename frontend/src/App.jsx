import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

// Admin Imports
import { AdminAuthProvider } from "./admin/context/AdminAuth";
import { SocketProvider } from "./context/SocketContext";
import AdminLayout from "./admin/AdminLayout";
import AdminLogin from "./admin/pages/Login";
import AdminDashboard from "./admin/pages/Dashboard";
import ProductList from "./admin/pages/Products/ProductList";
import ProductForm from "./admin/pages/Products/ProductForm";
import Categories from "./admin/pages/Categories";
import OrderList from "./admin/pages/Orders/OrderList";
import OrderDetail from "./admin/pages/Orders/OrderDetail";
import PaymentVerification from "./admin/pages/PaymentVerification";
import CustomerList from "./admin/pages/Customers";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Services from "./pages/Services";
import Resources from "./pages/Resources";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import Wishlist from "./pages/Wishlist";
import Blog from "./pages/Blog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import MedicalDisclaimer from "./pages/MedicalDisclaimer";
import ScrollToTop from "./components/common/ScrollToTop";
import "./App.css";

const PublicLayout = ({ children }) => (
  <div className="app">
    <Header />
    <main className="main-content">{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <AdminAuthProvider>
                    <Routes>
                      <Route path="login" element={<AdminLogin />} />
                      <Route element={<AdminLayout />}>
                        <Route
                          index
                          element={<Navigate to="dashboard" replace />}
                        />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="products" element={<ProductList />} />
                        <Route path="products/add" element={<ProductForm />} />
                        <Route
                          path="products/edit/:id"
                          element={<ProductForm />}
                        />
                        <Route path="products/:id" element={<ProductForm />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="orders" element={<OrderList />} />
                        <Route path="orders/:id" element={<OrderDetail />} />
                        <Route
                          path="payment-verification"
                          element={<PaymentVerification />}
                        />
                        <Route path="customers" element={<CustomerList />} />
                      </Route>
                    </Routes>
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
                      <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                      />
                      <Route
                        path="/reset-password/:token"
                        element={<ResetPassword />}
                      />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route
                        path="/about"
                        element={
                          <ProtectedRoute>
                            <About />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/products"
                        element={
                          <ProtectedRoute>
                            <Products />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/products/:id"
                        element={
                          <ProtectedRoute>
                            <ProductDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cart"
                        element={
                          <ProtectedRoute>
                            <Cart />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/order-confirmation"
                        element={
                          <ProtectedRoute>
                            <OrderConfirmation />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/contact"
                        element={
                          <ProtectedRoute>
                            <Contact />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/wishlist"
                        element={
                          <ProtectedRoute>
                            <Wishlist />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-orders"
                        element={
                          <ProtectedRoute>
                            <MyOrders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/order-details/:orderId"
                        element={
                          <ProtectedRoute>
                            <OrderDetails />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/privacy-policy"
                        element={<PrivacyPolicy />}
                      />
                      <Route
                        path="/terms-conditions"
                        element={<TermsConditions />}
                      />
                      <Route
                        path="/medical-disclaimer"
                        element={<MedicalDisclaimer />}
                      />
                    </Routes>
                  </PublicLayout>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
