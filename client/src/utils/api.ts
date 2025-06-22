import axios from "axios";

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://consensus-44zx.onrender.com/api"
    : "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    // console.log('Request Object:', config)
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
