import axios from 'axios';

// 创建 axios 实例，配置携带 cookie
const myaxios = axios.create({
  baseURL: '/api',
  withCredentials: true, // 允许发送 cookie 到后端
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
myaxios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
myaxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default myaxios;
