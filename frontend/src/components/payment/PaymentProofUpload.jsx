import { useState } from "react";
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { api } from '../../config/api';
import "./PaymentProofUpload.css";
const PaymentProofUpload = ({ orderId, onUploadSuccess }) => {
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setScreenshot(file);
    setFileName(file.name);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!transactionId.trim()) {
      setError("Transaction ID is required");
      return;
    }

    if (!screenshot) {
      setError("Please select a payment screenshot");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("transactionId", transactionId.trim());
      formData.append("screenshot", screenshot);

      console.log("Uploading payment proof...");
      console.log("Order ID:", orderId);
      console.log("Transaction ID:", transactionId);
      console.log("File:", screenshot.name, screenshot.size, screenshot.type);

      const response = await fetch(
        api("/api/payments/upload-proof"),
        {
          method: "POST",
          body: formData,
          // Don't set Content-Type header - let browser handle multipart/form-data
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Upload error response:", result);
        throw new Error(result.message || "Failed to upload payment proof");
      }

      console.log("✅ Payment proof uploaded successfully");
      setSuccess(true);
      setTransactionId("");
      setScreenshot(null);
      setFileName("");

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("❌ Payment proof upload error:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="payment-proof-upload">
      <div className="upload-header">
        <h3>Upload Payment Proof</h3>
        <p>Transfer the exact amount and upload the payment screenshot</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        {/* Transaction ID Input */}
        <div className="form-group">
          <label htmlFor="transactionId" className="required">
            Transaction ID
          </label>
          <input
            type="text"
            id="transactionId"
            placeholder="Enter your transaction ID (e.g., TXN123456789)"
            value={transactionId}
            onChange={(e) => {
              setTransactionId(e.target.value);
              setError(null);
            }}
            required
            disabled={uploading}
          />
          <small>The transaction reference number from your bank</small>
        </div>

        {/* Screenshot Upload */}
        <div className="form-group">
          <label className="required">Payment Screenshot</label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="screenshot"
              accept="image/*"
              onChange={handleScreenshotChange}
              disabled={uploading}
              className="file-input"
            />
            <label htmlFor="screenshot" className="file-upload-label">
              <Upload size={24} />
              <span>
                {fileName ? fileName : "Click to upload or drag and drop"}
              </span>
              <small>PNG, JPG, GIF or WebP (max 5MB)</small>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <p>
              Payment proof uploaded successfully! Your order is under review.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-submit"
          disabled={uploading || !transactionId.trim() || !screenshot}
        >
          {uploading ? (
            <>
              <Loader size={18} className="spinner" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload Payment Proof
            </>
          )}
        </button>

        {/* Info Box */}
        <div className="info-box">
          <p>
            <strong>Important:</strong> After uploading, your payment will be
            reviewed by our admin team. You'll be notified via email once it's
            verified. Please ensure the screenshot clearly shows:
          </p>
          <ul>
            <li>Transaction ID or reference number</li>
            <li>Amount transferred</li>
            <li>Date and time of transfer</li>
            <li>Bank confirmation</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default PaymentProofUpload;
