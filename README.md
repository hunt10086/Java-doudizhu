# 斗地主游戏 (Doudizhu)

这是一个现代的斗地主（Fight the Landlord）卡牌游戏，采用前后端分离架构。

## 项目结构

```
doudizhu/
├── backend/           # Spring Boot 后端服务
│   ├── src/           # 后端源码
│   ├── pom.xml        # Maven 配置文件
│   └── ...
└── frontend/          # React 前端应用
    ├── src/           # 前端源码
    ├── public/        # 静态资源
    ├── package.json   # 前端依赖配置
    └── ...
```

## 分别运行前后端

### 后端 (Spring Boot)

进入后端目录并运行：

```bash
cd backend
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 上运行。

### 前端 (React)

进入前端目录并运行：

```bash
cd frontend
npm install
npm start
```

前端将在 `http://localhost:3000` 上运行。

## 构建生产版本

### 构建前端

```bash
cd frontend
npm run build
```

### 构建后端

```bash
cd backend
mvn clean package
```

## API 和 WebSocket 连接

- REST API: `http://localhost:8080/api/*`
- WebSocket: `ws://localhost:8080/ws/game`

## 配置

前后端通信的 CORS 已经配置完成，确保前端可以访问后端资源。