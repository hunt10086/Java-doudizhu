import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/config';

const ApiTestComponent = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Test API connectivity
    const fetchApiData = async () => {
      try {
        // Fetch health status
        const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
        const healthData = await healthResponse.json();
        setHealthStatus(healthData);

        // Fetch config
        const configResponse = await fetch(`${API_BASE_URL}/api/config`);
        const configData = await configResponse.json();
        setConfig(configData);
      } catch (err) {
        setError(err.message);
        console.error('API test failed:', err);
      }
    };

    fetchApiData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>API 测试结果</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          <strong>错误:</strong> {error}
        </div>
      )}

      {healthStatus && (
        <div style={{ marginBottom: '20px' }}>
          <h3>健康状态</h3>
          <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
        </div>
      )}

      {config && (
        <div>
          <h3>系统配置</h3>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      )}

      {!healthStatus && !config && !error && (
        <div>正在加载...</div>
      )}
    </div>
  );
};

export default ApiTestComponent;