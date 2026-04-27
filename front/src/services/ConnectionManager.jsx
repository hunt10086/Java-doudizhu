import { WS_BASE_URL } from '../utils/config';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class ConnectionManager {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = [];
    this.onMessageCallbacks = [];
    this.onConnectionChangeCallbacks = [];
    this.playerId = null;
    this.gameId = null;
  }

  connect(playerId, onConnected, onError) {
    this.playerId = playerId;
    console.log('Connecting to WebSocket server:', `${WS_BASE_URL}/api/ws/game`);

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/api/ws/game`),
      reconnectDelay: [1000, 2000, 4000, 8000, 16000],
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('Connected to game server! Frame:', frame);
        this.connected = true;

        // Clear any residual subscriptions from previous connection
        this.subscriptions.forEach(sub => {
          try { sub.unsubscribe(); } catch (e) { /* already gone */ }
        });
        this.subscriptions = [];

        console.log('Subscribing to game topics...');
        this.subscribeToGameTopics();
        console.log('Subscription complete. Connected:', this.connected);

        this.notifyConnectionChange('connected');

        // Auto-rejoin if we have saved room info in localStorage (STOMP reconnect after refresh)
        const savedRoomId = localStorage.getItem("doudizhu_roomId");
        const savedPlayerName = localStorage.getItem("doudizhu_playerName");
        if (savedRoomId && savedPlayerName && !this.gameId) {
          console.log('STOMP reconnected with saved room, auto-rejoining:', savedRoomId);
          setTimeout(() => {
            this.joinGame(savedRoomId, savedPlayerName);
          }, 300);
        }

        if (onConnected) {
          onConnected();
        }
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connected = false;
        this.notifyConnectionChange('error');
        if (onError) {
          onError(frame);
        }
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      },
      onDisconnect: () => {
        console.log('Disconnected from game server');
        this.connected = false;
        this.notifyConnectionChange('disconnected');
      }
    });

    this.client.activate();
  }

  // Connection status tracking
  addConnectionListener(callback) {
    this.onConnectionChangeCallbacks.push(callback);
  }

  removeConnectionListener(callback) {
    this.onConnectionChangeCallbacks = this.onConnectionChangeCallbacks.filter(cb => cb !== callback);
  }

  notifyConnectionChange(status) {
    this.onConnectionChangeCallbacks.forEach(cb => cb(status));
  }

  subscribeToGameTopics() {
    console.log('=== subscribeToGameTopics called, gameId:', this.gameId, 'connected:', this.connected);

    // Subscribe to private queue for this player
    const privateSubscription = this.client.subscribe(
      `/user/queue/private`,
      (message) => {
        console.log('Received on /user/queue/private:', message.body);
        const data = JSON.parse(message.body);
        this.handleMessage(data);
      }
    );
    this.subscriptions.push(privateSubscription);

    // Subscribe to error queue
    const errorSubscription = this.client.subscribe(
      `/user/queue/errors`,
      (message) => {
        console.log('Received on /user/queue/errors:', message.body);
        const data = JSON.parse(message.body);
        this.handleMessage(data);
      }
    );
    this.subscriptions.push(errorSubscription);

    // Only subscribe to game topic if gameId is set
    if (!this.gameId) {
      console.log('No gameId, not subscribing to game topic');
      return;
    }

    console.log('Subscribing to game topic:', `/topic/game/${this.gameId}`);
    const gameSubscription = this.client.subscribe(
      `/topic/game/${this.gameId}`,
      (message) => {
        console.log('=== Received on game topic:', message.body);
        const data = JSON.parse(message.body);
        this.handleMessage(data);
      }
    );
    this.subscriptions.push(gameSubscription);

    // Subscribe to chat topic
    console.log('Subscribing to chat topic:', `/topic/game/${this.gameId}/chat`);
    const chatSubscription = this.client.subscribe(
      `/topic/game/${this.gameId}/chat`,
      (message) => {
        console.log('=== Received on chat topic:', message.body);
        const data = JSON.parse(message.body);
        this.handleMessage(data);
      }
    );
    this.subscriptions.push(chatSubscription);
  }

  setGameId(gameId) {
    console.log('=== setGameId called:', gameId, 'connected:', this.connected);
    this.gameId = gameId;

    if (this.connected) {
      console.log('Re-subscribing to game topics...');
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions = [];
      this.subscribeToGameTopics();
    } else {
      console.log('Not connected yet, will subscribe later');
    }
  }

  sendMessage(destination, body) {
    console.log('Sending message to', destination, 'with body', body);
    console.log('Client:', this.client, 'Connected:', this.connected);
    if (this.client && this.connected) {
      try {
        this.client.publish({
          destination: destination,
          body: JSON.stringify(body),
          headers: {}
        });
        console.log('Message sent successfully');
      } catch (err) {
        console.error('Error sending message:', err);
      }
    } else {
      console.warn('STOMP not connected, unable to send message');
    }
  }

  // Create a game room
  createGame(playerName) {
    const playerId = this.playerId;
    const topic = `/topic/game/created_${playerId}`;

    console.log('Subscribing to:', topic);

    const createdSubscription = this.client.subscribe(
      topic,
      (message) => {
        console.log('Received message on created topic:', message.body);
        const data = JSON.parse(message.body);
        console.log('Game created response:', data);
        if (data.data && data.data.gameId) {
          this.setGameId(data.data.gameId);
        }
        this.handleMessage(data);
        createdSubscription.unsubscribe();
      }
    );

    setTimeout(() => {
      console.log('Sending create request after subscription');
      this.sendMessage('/app/game/create', {
        playerId: playerId,
        gameId: null,
        data: playerName
      });
    }, 500);
  }

  // Join an existing game
  joinGame(gameId, playerName) {
    const playerId = this.playerId;

    // Subscribe to join response topic
    const joinedSubscription = this.client.subscribe(
      `/topic/game/joined_${playerId}`,
      (message) => {
        const data = JSON.parse(message.body);
        console.log('Game joined response:', data);
        this.handleMessage(data);
        joinedSubscription.unsubscribe();
      }
    );

    // Subscribe to game topic IMMEDIATELY to receive broadcasts
    this.gameId = gameId;
    if (this.connected) {
      console.log('Subscribing to game topic immediately for join:', `/topic/game/${gameId}`);
      const gameSubscription = this.client.subscribe(
        `/topic/game/${gameId}`,
        (message) => {
          console.log('=== Received on game topic (join):', message.body);
          const data = JSON.parse(message.body);
          this.handleMessage(data);
        }
      );
      this.subscriptions.push(gameSubscription);
    }

    setTimeout(() => {
      this.sendMessage('/app/game/join', {
        playerId: playerId,
        gameId: gameId,
        data: playerName
      });
    }, 100);
  }

  // Start the game
  startGame() {
    this.sendMessage('/app/game/start', {
      playerId: this.playerId,
      gameId: this.gameId
    });
  }

  // Submit bid (call landlord or not)
  submitBid(bid) {
    this.sendMessage('/app/game/bid', {
      playerId: this.playerId,
      gameId: this.gameId,
      data: bid
    });
  }

  // Play cards
  playCards(cards) {
    this.sendMessage('/app/game/play', {
      playerId: this.playerId,
      gameId: this.gameId,
      data: cards
    });
  }

  // Pass turn
  passTurn() {
    this.sendMessage('/app/game/pass', {
      playerId: this.playerId,
      gameId: this.gameId
    });
  }

  // Start next round (only host)
  startNextRound() {
    this.sendMessage('/app/game/nextRound', {
      playerId: this.playerId,
      gameId: this.gameId
    });
  }

  // Leave game room
  leaveGame() {
    this.sendMessage('/app/game/leave', {
      playerId: this.playerId,
      gameId: this.gameId
    });
  }

  // Send chat message
  sendChat(message) {
    this.sendMessage('/app/chat/send', {
      playerId: this.playerId,
      gameId: this.gameId,
      data: message
    });
  }

  handleMessage(data) {
    this.onMessageCallbacks.forEach(callback => callback(data));
  }

  addMessageListener(callback) {
    this.onMessageCallbacks.push(callback);
  }

  removeMessageListener(callback) {
    this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
  }

  reconnect(playerId, gameId) {
    console.log('Sending reconnect request for game:', gameId, 'player:', playerId);
    this.sendMessage('/app/game/reconnect', {
      playerId: playerId,
      gameId: gameId
    });
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach(sub => {
        try { sub.unsubscribe(); } catch (e) { /* ignore */ }
      });
      this.subscriptions = [];
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.gameId = null;
    }
  }

  isConnected() {
    return this.connected;
  }

  getPlayerId() {
    return this.playerId;
  }

  getGameId() {
    return this.gameId;
  }
}

// Singleton instance
const connectionManager = new ConnectionManager();
export default connectionManager;
