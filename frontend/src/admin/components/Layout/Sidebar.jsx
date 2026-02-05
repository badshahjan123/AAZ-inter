import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Tags,
  CheckCircle,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuth";
import { useSocket } from "../../../context/SocketContext";
import { api } from '../../../config/api';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAdminAuth();
  const { socket } = useSocket();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);

  const isActive = (path) => location.pathname.startsWith(path);

  useEffect(() => {
    fetchPendingCount();
    fetchPendingPayments();

    if (socket) {
      const handleNewOrder = () => setPendingOrders((prev) => prev + 1);
      const handleStatusUpdate = () => fetchPendingCount();
      const handlePaymentProofUploaded = () => fetchPendingPayments();

      socket.on("newOrder", handleNewOrder);
      socket.on("orderStatusUpdate", handleStatusUpdate);
      socket.on("paymentProofUploaded", handlePaymentProofUploaded);

      return () => {
        socket.off("newOrder", handleNewOrder);
        socket.off("orderStatusUpdate", handleStatusUpdate);
        socket.off("paymentProofUploaded", handlePaymentProofUploaded);
      };
    }
  }, [socket]);

  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(api("/api/orders"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Fix: Handle non-array responses (like error objects)
      if (Array.isArray(data)) {
        // Count only CREATED or PAYMENT_PENDING orders
        const count = data.filter(
          (o) =>
            o.orderStatus === "CREATED" || o.orderStatus === "PAYMENT_PENDING",
        ).length;
        setPendingOrders(count);
      } else {
        console.warn("Sidebar received invalid orders data:", data);
      }
    } catch (err) {
      console.error("Error fetching sidebar counts:", err);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(api("/api/payments/pending"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPendingPayments(data.count || 0);
    } catch (err) {
      console.error("Error fetching pending payments:", err);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { name: "Products", path: "/admin/products", icon: <Package size={20} /> },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: <ShoppingCart size={20} />,
      badge: pendingOrders,
    },
    {
      name: "Payment Verification",
      path: "/admin/payment-verification",
      icon: <CheckCircle size={20} />,
      badge: pendingPayments,
    },
    { name: "Categories", path: "/admin/categories", icon: <Tags size={20} /> },
    { name: "Customers", path: "/admin/customers", icon: <Users size={20} /> },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div
          className="avatar-circle"
          style={{
            width: "40px",
            height: "40px",
            fontSize: "0.9rem",
            marginRight: "0.75rem",
          }}
        >
          AZ
        </div>
        <span>Admin Panel</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <nav className="admin-nav">
          <div
            className="text-muted"
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              padding: "0 1.5rem 0.5rem",
              fontWeight: 700,
            }}
          >
            Main Menu
          </div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${isActive(item.path) ? "active" : ""}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "white",
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    fontWeight: 700,
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
