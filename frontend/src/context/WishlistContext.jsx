import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../config/api';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user || !user.token) {
      setWishlistItems([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(api('/api/wishlist'), {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (product) => {
    if (!user || !user.token) return { success: false, message: 'Please login first' };

    const isItemInWishlist = wishlistItems.some(item => item.product._id === product._id);
    const method = isItemInWishlist ? 'DELETE' : 'POST';
    const url = isItemInWishlist ? api(`/api/wishlist/${product._id}`) : api('/api/wishlist');
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: isItemInWishlist ? null : JSON.stringify({ productId: product._id })
      });

      if (res.ok) {
        await fetchWishlist(); // Refresh wishlist
        return { success: true };
      }
      return { success: false, message: 'Failed to update wishlist' };
    } catch (err) {
      console.error('Wishlist error:', err);
      return { success: false, message: 'Server error' };
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user || !user.token) return;

    try {
      const res = await fetch(api(`/api/wishlist/${productId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (res.ok) {
        setWishlistItems(prev => prev.filter(item => item.product._id !== productId));
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const getWishlistCount = () => wishlistItems.length;

  const value = useMemo(() => ({
    wishlistItems,
    loading,
    toggleWishlist,
    removeFromWishlist,
    getWishlistCount,
    refreshWishlist: fetchWishlist
  }), [wishlistItems, loading, toggleWishlist, removeFromWishlist, fetchWishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
