import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Interceptor to attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser?.token) {
      config.headers.Authorization = `Bearer ${storedUser.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
