// API base URL configuration
// For development with separate frontend and backend servers
// Frontend typically runs on http://localhost:3000
// Backend API runs on http://localhost:8080

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080';

export { API_BASE_URL, WS_BASE_URL };