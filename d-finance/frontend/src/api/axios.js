import axios from 'axios';

const isLocal = window.location.hostname === 'localhost';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  // baseURL: 'https://dfinance.space/api', // ✅ Ye wala rehne do
  withCredentials: true,
  timeout: 60000,
});


// Request Interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor
API.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.config.method.toUpperCase()}] ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ API Error [${error.config?.url}]:`, error.response?.data || error.message);

    // 🚀 FIX: Agar error 401 hai LEKIN ye KYC ya Login/Signup route hai, toh logout MAT KARO
    const isAuthRoute = error.config?.url.includes('/auth/') || error.config?.url.includes('/kyc/');

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      console.warn("Session expired. Logging out...");
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Backend ka asli error object pass karo taaki hum details dekh sakein
    return Promise.reject(error.response?.data || "Connection Error");
  }
);

export default API;