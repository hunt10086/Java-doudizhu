import axios from 'axios';
import { API_BASE_URL } from './config';

// 创建 axios 实例，配置 cookie 和 session
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 允许发送 cookie 到后端
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 每次请求都会自动携带 cookie
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
