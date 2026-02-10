// API Configuration
// IMPORTANT: Environment-based API URL configuration
//
// Vercel does NOT use .env.production from git!
// You MUST set VITE_API_URL in Vercel dashboard:
// Settings → Environment Variables → Add VITE_API_URL
//
// For now, using fallback to Railway URL in production mode

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://aaz-inter-production.up.railway.app" // Production: Railway backend
    : "http://localhost:5000"); // Development: Local backend

console.log("🔧 API Configuration:", {
  mode: import.meta.env.MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
});

if (!API_BASE_URL) {
  console.error("❌ CRITICAL: API_BASE_URL is undefined!");
}

export const API_URL = API_BASE_URL;

// Helper to build API endpoints
export const api = (path) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${API_BASE_URL}${cleanPath}`;
  console.log("📡 API Call:", fullUrl);
  return fullUrl;
};

export default API_URL;
