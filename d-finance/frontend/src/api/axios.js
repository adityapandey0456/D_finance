import axios from 'axios';

// 🧭 AUTOMATIC ENVIRONMENT DETECTION ENGINE
// api/axios.js mein baseURL ko is tarah update karo:
// const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// const API = axios.create({
//   // 🔥 AUTO-SWITCH MATRIX ACTIVATE: Localhost par local port chalega, prod par live URL
//   baseURL: isLocal ? 'http://localhost:5000/api' : 'https://dfinance.space/api', // 5000 ko apne local backend port se replace kar lena agar alag hai
//   withCredentials: true,
//   timeout: 60000,
// });

// 🧭 AUTOMATIC ENVIRONMENT DETECTION ENGINE
// Capacitor check add karo
const isCapacitor = window.location.protocol === 'capacitor:';
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API = axios.create({
  // 🔥 AGAR CAPACITOR (Android App) HAI, TOH HAMESHA LIVE URL USE KARO
  baseURL: (isCapacitor || !isLocal) ? 'https://dfinance.space/api' : 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 60000,
});

// ⏳ Request Interceptor: Injecting bearer token to outgoing network pipelines
API.interceptors.request.use(
  (config) => {
    // 1. Pehle direct 'token' check karo
    let token = localStorage.getItem('token');
    
    // 2. Agar direct nahi mila, toh 'user' object ke andar check karo
    if (!token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token; // User object se token nikal liya
        } catch (e) {
          console.error("Local storage parsing error", e);
        }
      }
    }

    // 3. Agar token mil gaya, toh Header mein attach kar do
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
    const errorData = error.response?.data;
    console.error(`❌ API Error [${error.config?.url}]:`, errorData || error.message);

    const isAuthRoute = error.config?.url?.includes('/auth/') || error.config?.url?.includes('/kyc/');

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      console.warn("🛡️ Session expired. Logging out...");
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    if (typeof errorData === 'string' && errorData.includes('<!DOCTYPE html>')) {
      return Promise.reject({ error: "Route validation endpoint missing." });
    }

    return Promise.reject(errorData || { error: error.message || "Connection Error" });
  }
);

export default API;