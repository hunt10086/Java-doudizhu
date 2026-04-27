import React, { useState } from "react";
import styled from "styled-components";
import axios from "../utils/myaxios";

const AuthContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  background-image: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  z-index: 1000;
  padding: 10px;
  box-sizing: border-box;

  @media (max-height: 500px) {
    align-items: flex-start;
    padding-top: 10px;
    padding-bottom: 20px;
  }
`;

const AuthBox = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 20px;
  width: 400px;
  max-width: 95%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  margin: 10px 0;

  @media (min-height: 600px) {
    padding: 30px;
  }

  @media (max-height: 500px) {
    padding: 12px;
    border-radius: 8px;
  }
`;

const Title = styled.h2`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 15px;
  font-size: 20px;

  @media (min-height: 600px) {
    margin-bottom: 25px;
    font-size: 24px;
  }

  @media (max-height: 500px) {
    font-size: 16px;
    margin-bottom: 8px;
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 12px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);

  @media (min-height: 600px) {
    margin-bottom: 20px;
  }

  @media (max-height: 500px) {
    margin-bottom: 8px;
  }
`;

const Tab = styled.div`
  flex: 1;
  padding: 10px;
  text-align: center;
  color: ${(props) => (props.$active ? "#3498db" : "#7f8c8d")};
  cursor: pointer;
  border-bottom: 2px solid
    ${(props) => (props.$active ? "#3498db" : "transparent")};
  margin-bottom: -2px;
  transition: all 0.2s;

  &:hover {
    color: #3498db;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (min-height: 600px) {
    gap: 15px;
  }

  @media (max-height: 500px) {
    gap: 6px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;

  @media (min-height: 600px) {
    gap: 5px;
  }
`;

const Label = styled.label`
  color: #2c3e50;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 9px 12px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.8);
  color: #2c3e50;
  font-size: 16px;
  box-sizing: border-box;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #3498db;
  }

  @media (min-height: 600px) {
    padding: 12px;
  }
`;

const Button = styled.button`
  padding: 10px 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  background: #3498db;
  color: white;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (min-height: 600px) {
    padding: 12px;
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("请输入用户名");
      return;
    }
    if (username.length > 64) {
      setError("用户名长度不能超过64个字符");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("用户名只能包含字母、数字和下划线");
      return;
    }
    if (!password.trim()) {
      setError("请输入密码");
      return;
    }
    if (password.length < 6 || password.length > 64) {
      setError("密码长度需在6-64个字符之间");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(password)) {
      setError("密码只能包含字母、数字和下划线");
      return;
    }
    if (nickname && nickname.length > 64) {
      setError("昵称长度不能超过64个字符");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "auth/login" : "auth/register";
      const data = isLogin
        ? { username, password }
        : { username, password, nickname };

      const response = await axios.post(endpoint, data);

      if (response.data.success) {
        if (isLogin) {
          const userInfo = {
            userId: response.data.userId,
            username: response.data.username,
            nickname: response.data.nickname,
            score: response.data.score,
          };
          onLoginSuccess(userInfo);
        } else {
          setSuccess("注册成功！请登录");
          setTimeout(() => setIsLogin(true), 1500);
        }
      } else {
        setError(response.data.message || "操作失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <AuthBox>
        <Title>斗地主游戏</Title>

        <TabContainer>
          <Tab
            $active={isLogin}
            onClick={() => {
              setIsLogin(true);
              setError("");
              setSuccess("");
            }}
          >
            登录
          </Tab>
          <Tab
            $active={!isLogin}
            onClick={() => {
              setIsLogin(false);
              setError("");
              setSuccess("");
            }}
          >
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
            {loading ? "处理中..." : isLogin ? "登录" : "注册"}
          </Button>
        </Form>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </AuthBox>
    </AuthContainer>
  );
};

export default Auth;
