// Mock backend server to simulate API endpoints and WebSocket for testing
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

// CORS configuration to mimic Spring Boot server
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));

app.use(express.json());

// Middleware to handle potential security headers like Spring Security
app.use((req, res, next) => {
  // Allow all origins during development/testing
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "http://127.0.0.1:8080"],
    methods: ["GET", "POST"]
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'doudizhu-backend'
  });
});

// Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    gameName: 'Doudizhu',
    maxPlayers: 3,
    websocketPath: '/ws/game'
  });
});

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('/game/create', (data) => {
    console.log('Game creation requested:', data);
    // Simulate game creation
    io.emit('/topic/games', {
      type: 'GAME_CREATED',
      gameId: `game_${Date.now()}`,
      ...data
    });
  });

  socket.on('/game/join', (data) => {
    console.log('Player joining game:', data);
    // Simulate successful join
    io.emit(`/topic/game/${data.gameId}`, {
      type: 'PLAYER_JOIN',
      ...data
    });
  });

  socket.on('/game/start', (data) => {
    console.log('Game starting:', data);
    // Simulate game start
    io.emit(`/topic/game/${data.gameId}`, {
      type: 'GAME_START',
      status: 'started',
      ...data
    });
  });

  socket.on('/game/bid', (data) => {
    console.log('Bid received:', data);
    // Simulate bid processing
    io.emit(`/topic/game/${data.gameId}`, {
      type: 'BID_RESPONSE',
      ...data
    });
  });

  socket.on('/game/play', (data) => {
    console.log('Card play received:', data);
    // Simulate card play
    io.emit(`/topic/game/${data.gameId}`, {
      type: 'PLAY_CARDS',
      ...data
    });
  });

  socket.on('/chat/send', (data) => {
    console.log('Chat message received:', data);
    // Broadcast chat message
    io.emit(`/topic/game/${data.gameId}/chat`, {
      type: 'CHAT_MESSAGE',
      ...data
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Mock Doudizhu backend server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET  http://localhost:8080/api/health`);
  console.log(`  GET  http://localhost:8080/api/config`);
  console.log(`WebSocket endpoint:`);
  console.log(`  WS   ws://localhost:8080`);
  console.log('');
  console.log('This mock server simulates the expected backend API for front-end testing.');
});