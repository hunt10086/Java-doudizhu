// API base URL configuration
// For development with separate frontend and backend servers
// Frontend typically runs on http://localhost:9654 (Vite)
// Backend API runs on http://localhost:8118
// Use absolute URL for WebSocket to avoid Vite proxy issues

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const WS_HOST = import.meta.env.VITE_WS_URL || 'localhost:8118';
const USE_WSS = import.meta.env.VITE_USE_WSS === 'true';

// 构建 WebSocket URL
// 如果 VITE_WS_URL 已包含协议，直接使用；否则根据 USE_WSS 自动添加
let WS_BASE_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8118';
if (!WS_BASE_URL.startsWith('http')) {
  WS_BASE_URL = `${USE_WSS ? 'https' : 'http'}://${WS_BASE_URL}`;
}

export { API_BASE_URL, WS_BASE_URL, WS_HOST, USE_WSS };
