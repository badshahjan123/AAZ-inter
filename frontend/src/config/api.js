// API Configuration
// IMPORTANT: Uses VITE_API_URL from environment variables
// .env.production → https://aaz-inter-production.up.railway.app (for Vercel)
// .env → http://localhost:5000 (for local development)

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error('❌ VITE_API_URL is not defined! Check your .env file.');
}

export const API_URL = API_BASE_URL;

// Helper to build API endpoints
export const api = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default API_URL;
