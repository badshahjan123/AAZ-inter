import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Truck,
  Package,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";
import { api, API_URL } from "../../../config/api";
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(api(`/api/orders/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setOrder(data);
      setNewStatus(data.orderStatus || "pending");
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  // Payment verification is now handled in the dedicated Payment Verification page
  // Only order workflow status (pending -> processing -> shipped) is managed here

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("adminToken");
      const response = await fetch(api(`/api/orders/${id}/status`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        setOrder(data);
        alert("Order status updated successfully");
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/uploads") || imagePath.startsWith("uploads/")) {
      const normalizedSrc = imagePath.replace(/\\/g, "/");
      const cleanPath = normalizedSrc.startsWith("/")
        ? normalizedSrc
        : `/${normalizedSrc}`;
      const baseUrl = API_URL;
      return `${baseUrl}${cleanPath}`;
    }
    return imagePath;
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!order) return <div className="p-8">Order not found</div>;

  return (
    <div>
      <button
        onClick={() => navigate("/admin/orders")}
        className="admin-btn btn-secondary mb-4"
      >
        <ArrowLeft size={16} /> Back to Orders
      </button>

      <div className="flex-between mb-4">
        <h1 className="page-title">
          Order {order.orderNumber || `#${order._id.substring(18)}`}
        </h1>
        <span
          className={`status-badge status-${(order.orderStatus || "CREATED").toLowerCase().replace("_", "-")}`}
        >
          {order.orderStatus || "CREATED"}
        </span>
      </div>

      <div
        className="stat-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        {/* Customer Info */}
        <div className="admin-card">
          <div
            className="flex items-center gap-2 mb-4"
            style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
          >
            <User size={20} className="text-gray-500" />
            <h3 className="font-bold">Customer Details</h3>
          </div>
          <p>
            <strong>Name:</strong> {order.customerName}
          </p>
          <p>
            <strong>Email:</strong> {order.email}
          </p>
          <p>
            <strong>Phone:</strong> {order.phone}
          </p>
        </div>

        {/* Shipping Info */}
        <div className="admin-card">
          <div
            className="flex items-center gap-2 mb-4"
            style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
          >
            <MapPin size={20} className="text-gray-500" />
            <h3 className="font-bold">Shipping Address</h3>
          </div>
          <p>{order.address}</p>
          <p>{order.city}</p>
          <p>
            Status:{" "}
            <span style={{ textTransform: "uppercase", fontWeight: 600 }}>
              {order.orderStatus}
            </span>
          </p>
        </div>

        {/* Order Management */}
        <div className="admin-card">
          <div
            className="flex items-center gap-2 mb-4"
            style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
          >
            <Truck size={20} className="text-gray-500" />
            <h3 className="font-bold">Order Management</h3>
          </div>
          
          {/* Payment Status Display */}
          <div className="admin-form-group" style={{ marginBottom: "1rem" }}>
            <label className="admin-label">Payment Status</label>
            <div style={{ padding: "0.5rem 0" }}>
              <span className={`status-badge status-${order.paymentStatus || 'pending'}`} 
                    style={{ 
                      display: 'inline-flex',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      backgroundColor: 
                        order.paymentStatus === 'approved' || order.paymentStatus === 'paid' ? '#dcfce7' : 
                        order.paymentStatus === 'rejected' || order.paymentStatus === 'failed' ? '#fee2e2' : '#fef9c3',
                      color: 
                        order.paymentStatus === 'approved' || order.paymentStatus === 'paid' ? '#166534' : 
                        order.paymentStatus === 'rejected' || order.paymentStatus === 'failed' ? '#991b1b' : '#854d0e'
                    }}>
                {order.paymentStatus || 'pending'}
              </span>
              {order.paymentMethod === 'bank' && order.paymentStatus === 'pending' && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <p>Go to <Link to="/admin/payment-verification" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Payment Verification</Link> page to approve/reject bank transfers.</p>
                </div>
              )}
              {order.paymentStatus === 'rejected' && order.rejectionReason && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
                  <strong>Rejection Reason:</strong> {order.rejectionReason}
                </div>
              )}
            </div>
          </div>
          
          {/* Order Status Update */}
          <div className="admin-form-group">
            <label className="admin-label">Update Order Status</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="admin-select"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="admin-btn btn-primary"
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
            <small style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.5rem", display: "block" }}>
              Order workflow status. Payment verification is handled separately.
            </small>
          </div>
        </div>

        {/* CreditCard section removed */}
      </div>

      {/* Order Items */}
      <div className="admin-card">
        <h3 className="font-bold mb-4" style={{ marginBottom: "1rem" }}>
          Order Items
        </h3>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      {item.product?.image && (
                        <img
                          src={getImageUrl(item.product.image)}
                          alt={item.product.name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <span>{item.product?.name || "Product Deleted"}</span>
                    </div>
                  </td>
                  <td>Rs. {item.price}</td>
                  <td>{item.quantity}</td>
                  <td>Rs. {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: "bold", backgroundColor: "#f8fafc" }}>
                <td colSpan="3" className="text-right">
                  Total Amount:
                </td>
                <td>Rs. {order.totalAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
