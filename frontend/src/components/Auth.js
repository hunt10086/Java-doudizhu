import React, { useState } from 'react';
import styled from 'styled-components';
import axios from '../utils/axiosConfig';
import { API_BASE_URL } from '../utils/config';

const AuthContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const AuthBox = styled.div`
  background: #2c3e50;
  border-radius: 10px;
  padding: 30px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  color: white;
  text-align: center;
  margin-bottom: 25px;
  font-size: 24px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 2px solid #34495e;
`;

const Tab = styled.div`
  flex: 1;
  padding: 10px;
  text-align: center;
  color: ${props => props.$active ? '#3498db' : '#95a5a6'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? '#3498db' : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.2s;

  &:hover {
    color: #3498db;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  color: #ecf0f1;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #34495e;
  border-radius: 5px;
  background: #34495e;
  color: white;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Button = styled.button`
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  background: #3498db;
  color: white;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  text-align: center;
  margin-top: 10px;
`;

const SuccessMessage = styled.div`
  color: #2ecc71;
  text-align: center;
  margin-top: 10px;
`;

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const data = isLogin
        ? { username, password }
        : { username, password, nickname };

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);

      if (response.data.success) {
        if (isLogin) {
          // Login successful - save user info and call callback
          const userInfo = {
            userId: response.data.userId,
            username: response.data.username,
            nickname: response.data.nickname,
            score: response.data.score
          };
          onLoginSuccess(userInfo);
        } else {
          setSuccess('注册成功！请登录');
          setTimeout(() => setIsLogin(true), 1500);
        }
      } else {
        setError(response.data.message || '操作失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <AuthBox>
        <Title>斗地主游戏</Title>

        <TabContainer>
          <Tab $active={isLogin} onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>
            登录
          </Tab>
          <Tab $active={!isLogin} onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>
            注册
          </Tab>
        </TabContainer>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>用户名</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
            />
          </InputGroup>

          <InputGroup>
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
            />
          </InputGroup>

          {!isLogin && (
            <InputGroup>
              <Label>昵称（可选）</Label>
              <Input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                disabled={loading}
              />
            </InputGroup>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </Button>
        </Form>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </AuthBox>
    </AuthContainer>
  );
};

export default Auth;
