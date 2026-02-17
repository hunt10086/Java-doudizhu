# 斗地主游戏 - 前后端分离部署指南

## 项目结构

该项目采用前后端分离架构：
- **后端**: Spring Boot 应用，位于 `backend/` 目录
- **前端**: React 应用，位于项目根目录

## 分别运行前后端

### 1. 后端设置 (Spring Boot)

#### 构建和运行后端

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

或者构建为 JAR 文件运行：

```bash
cd backend
mvn clean package
java -jar target/doudizhu-backend.jar
```

默认情况下，后端将在 `http://localhost:8080` 上运行，并监听以下路径：
- REST API: `http://localhost:8080/api/*`
- WebSocket: `ws://localhost:8080/ws/game`

### 2. 前端设置 (React)

#### 安装依赖

```bash
npm install
```

#### 运行前端开发服务器

```bash
npm start
```

前端将在 `http://localhost:3000` 上运行。

#### 自定义后端地址

如果你的后端运行在不同的端口或主机上，可以通过环境变量指定：

```bash
REACT_APP_API_URL=http://your-backend-host:port REACT_APP_WS_URL=ws://your-backend-host:port npm start
```

例如：
```bash
REACT_APP_API_URL=http://api.example.com:8080 REACT_APP_WS_URL=ws://api.example.com:8080 npm start
```

### 3. CORS 配置说明

为确保前后端能够正确通信，后端已配置 CORS 策略：

- 允许来源: `http://localhost:*`, `http://127.0.0.1:*`, `https://*`
- 允许方法: GET, POST, PUT, DELETE, OPTIONS, HEAD
- 允许头: 所有头部
- 凭证: 允许

WebSocket 连接同样支持跨域，配置了相应的 Origin Patterns。

### 4. 构建生产版本

#### 构建前端生产版本

```bash
npm run build
```

生成的静态文件位于 `build/` 目录，可以部署到任何静态文件服务器。

#### 部署后端

将 `backend/target/doudizhu-backend.jar` 部署到 Java 服务器。

## 故障排除

1. **WebSocket 连接失败**: 检查前端的 `WS_BASE_URL` 是否正确指向后端 WebSocket 端点。

2. **API 调用失败**: 检查前端的 `API_BASE_URL` 和后端的 CORS 配置。

3. **跨域错误**: 确保后端的 `CorsConfig` 已生效，允许前端域名访问。

## 生产环境注意事项

- 在生产环境中，应使用特定的域名而不是通配符 `*` 来限制 CORS 访问。
- 配置 HTTPS 以确保 WebSocket 连接的安全性 (WSS)。
- 实施适当的身份验证和授权机制。