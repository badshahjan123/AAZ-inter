import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Eye } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../data/products";
import Button from "../common/Button";
import Card from "../common/Card";
import "./ProductCard.css";
import { API_URL } from "../../config/api";
import { getAssetUrl } from "../../utils/helpers";

const ProductCard = memo(({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const productId = product._id || product.id;

  const handleViewProduct = () => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  // Determine image source
  const mainImage = getAssetUrl(product.image, API_URL);

  // Fallback to placeholder if no image
  const imageSrc = mainImage || `https://via.placeholder.com/800x800/0A74DA/FFFFFF?text=${encodeURIComponent(product.name || "Product")}`;
  const hasStock =
    product.stock !== undefined ? product.stock > 0 : product.inStock;

  return (
    <Card className="product-card" hover onClick={handleViewProduct}>
      <div className="product-card-image">
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          onError={(e) =>
            (e.target.src = "https://via.placeholder.com/300?text=No+Image")
          }
        />
        {hasStock ? (
          <span className="product-badge product-badge-success">In Stock</span>
        ) : (
          <span className="product-badge product-badge-error">
            Out of Stock
          </span>
        )}
      </div>
      <div className="product-card-content">
        <h3 className="product-card-name">{product.name}</h3>
        {product.sku && <p className="product-card-sku">SKU: {product.sku}</p>}
        <p className="product-card-description">
          {product.description?.substring(0, 100)}...
        </p>
        <div className="product-card-footer">
          <div className="product-card-price">
            <span className="product-price">{formatPrice(product.price)}</span>
          </div>
          <div className="product-card-actions">
            <Button
              variant="outline"
              size="small"
              icon={<Eye size={16} />}
              onClick={handleViewProduct}
              aria-label="View product details"
            >
              View
            </Button>
            <Button
              variant="primary"
              size="small"
              icon={<ShoppingCart size={16} />}
              onClick={handleAddToCart}
              disabled={!hasStock}
              aria-label="Add to cart"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";
export default ProductCard;
