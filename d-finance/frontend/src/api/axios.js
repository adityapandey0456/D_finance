import axios from 'axios';

// 🧭 AUTOMATIC ENVIRONMENT DETECTION ENGINE
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API = axios.create({
  // 🔥 AUTO-SWITCH MATRIX: Ab aapko baar-baar comment/uncomment nahi karna padega
  // baseURL: 'https://dfinance.space/api',
  baseURL: 'https://d-finance-backend.onrender.com/api',
  withCredentials: true,
  timeout: 60000,
});

// ⏳ Request Interceptor: Injecting bearer token to outgoing network pipelines
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, 
  (error) => Promise.reject(error)
);

// 📡 Response Interceptor: Evaluating responses incoming packet stream matrix
API.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.config.method.toUpperCase()}] ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    // Structural normalization layer tracking
    const errorData = error.response?.data;
    console.error(`❌ API Error [${error.config?.url}]:`, errorData || error.message);

    // 🚀 BYPASS RECONCILE: Agar error 401 (Unauthorized) hai LEKIN ye KYC ya Login/Signup route hai, toh logout MAT KARO
    const isAuthRoute = error.config?.url?.includes('/auth/') || error.config?.url?.includes('/kyc/');

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      console.warn("🛡️ Session expired or token cluster validation failed. Logging out...");
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // 🔥 SAFE REJECTION HOOK: Backend ka asli object ya message pass karo taaki runtime context break na ho
    // Agar backend se poora HTML content (jaise 404 text) mil raha hai, toh use object format me wrap kar diya hai
    if (typeof errorData === 'string' && errorData.includes('<!DOCTYPE html>')) {
      return Promise.reject({ error: "Route validation endpoint missing. Please verify server routes register code map." });
    }

    return Promise.reject(errorData || { error: error.message || "Connection Error" });
  }
);

export default API;