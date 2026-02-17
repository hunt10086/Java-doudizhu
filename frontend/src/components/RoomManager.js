import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';
import connectionManager from '../services/ConnectionManager';

const RoomContainer = styled.div`
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

const RoomBox = styled.div`
  background: #2c3e50;
  border-radius: 10px;
  padding: 30px;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  color: white;
  text-align: center;
  margin-bottom: 25px;
  font-size: 24px;
`;

const RoomInfo = styled.div`
  background: #34495e;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  text-align: center;
`;

const RoomCode = styled.div`
  color: #f39c12;
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 4px;
  margin: 10px 0;
`;

const RoomStatus = styled.div`
  color: ${props => props.$full ? '#2ecc71' : '#95a5a6'};
  font-size: 14px;
`;

const PlayerList = styled.div`
  margin: 15px 0;
  padding: 10px;
  background: #34495e;
  border-radius: 8px;
`;

const PlayerItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  color: ${props => props.$isHost ? '#f39c12' : '#ecf0f1'};
  font-weight: ${props => props.$isHost ? 'bold' : 'normal'};
`;

const HostBadge = styled.span`
  background: #f39c12;
  color: #2c3e50;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 8px;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${props => props.$variant === 'primary' && `
    background: #3498db;
    color: white;
  `}

  ${props => props.$variant === 'success' && `
    background: #2ecc71;
    color: white;
  `}

  ${props => props.$variant === 'warning' && `
    background: #f39c12;
    color: white;
  `}

  ${props => props.$variant === 'secondary' && `
    background: #95a5a6;
    color: white;
  `}
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

const RoomManager = ({ onGameStart, userInfo }) => {
  const { dispatch } = useGame();
  const [playerName, setPlayerName] = useState(userInfo?.nickname || userInfo?.username || '');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [currentRoomInfo, setCurrentRoomInfo] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [roomReady, setRoomReady] = useState(false);
  const playerNameRef = useRef(playerName);
  const currentRoomInfoRef = useRef(null); // Use ref to avoid closure issues

  // Keep refs updated
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    currentRoomInfoRef.current = currentRoomInfo;
  }, [currentRoomInfo]);

  // Connect to server when component mounts
  useEffect(() => {
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setMyPlayerId(playerId);

    // Set my player ID in context
    dispatch({ type: 'SET_MY_PLAYER_ID', payload: playerId });

    connectionManager.connect(
      playerId,
      () => {
        console.log('Connected to server');
        setConnected(true);
      },
      (error) => {
        console.error('Connection error:', error);
        setError('无法连接到游戏服务器');
      }
    );

    // Don't disconnect on unmount - the connection should persist for the game
    // return () => {
    //   connectionManager.disconnect();
    // };
  }, [dispatch]);

  // Listen for game events
  useEffect(() => {
    const handleMessage = (data) => {
      console.log('=== RoomManager received ===', data);

      if (data.type === 'PLAYER_JOIN') {
        console.log('PLAYER_JOIN event, data:', data.data, 'playerId:', data.playerId);

        // Check if this is a join response (contains roomId)
        if (data.data && data.data.roomId) {
          console.log('This is a join response');
          const roomInfo = data.data;
          setCurrentRoomInfo(roomInfo);
          setRoomId(roomInfo.roomId);
          setIsHost(roomInfo.isHost || false);
          setPlayers(roomInfo.players || []);
          setSuccess(`加入房间成功！房间号: ${roomInfo.roomId}`);
          console.log('Subscribing to game topic:', roomInfo.gameId);
          // Subscribe to game topic
          connectionManager.setGameId(roomInfo.gameId);
        } else if (data.data && data.data.id) {
          // Player joined the game (broadcast or private notification) - data is the Player object
          console.log('This is a broadcast/private notification, adding player:', data.data);
          // Avoid adding duplicate players
          setPlayers(prev => {
            // Check if this player already exists
            const exists = prev.some(p => p.id === data.data.id);
            if (exists) {
              console.log('Player already exists, skipping');
              return prev;
            }

            // If we have roomInfo with players, use those as base
            // Use ref to get the latest value and avoid closure issues
            const latestRoomInfo = currentRoomInfoRef.current;
            let basePlayers = prev;
            if (latestRoomInfo && latestRoomInfo.players && prev.length < latestRoomInfo.players.length) {
              basePlayers = latestRoomInfo.players;
              console.log('Using players from roomInfo as base:', basePlayers);
            }

            const newPlayers = [...basePlayers, data.data];
            console.log('New players:', newPlayers);
            // Check if room is full (3 players including AI)
            if (newPlayers.length >= 3) {
              setRoomReady(true);
            }
            return newPlayers;
          });
        }
      } else if (data.type === 'GAME_START') {
        console.log('GAME_START event, data:', data.data);

        // Check if game has already started (has status field like BIDDING or PLAYING)
        if (data.data && data.data.status && (data.data.status === 'BIDDING' || data.data.status === 'PLAYING')) {
          console.log('Game already started, status:', data.data.status);
          // Update players list
          if (data.data.players) {
            setPlayers(data.data.players);
          }
          // Game has started, transition to game view
          onGameStart && onGameStart();
          return;
        }

        // Check if this is a room creation response (has roomId and gameId, and status is WAITING)
        if (data.data && data.data.roomId && data.data.gameId) {
          // Skip if we already have room info (avoid duplicate processing)
          if (currentRoomInfo && currentRoomInfo.roomId === data.data.roomId) {
            console.log('Duplicate room info, skipping');
            return;
          }

          console.log('This is a room creation response');
          const roomInfo = data.data;
          setCurrentRoomInfo(roomInfo);
          setRoomId(roomInfo.roomId);
          setIsHost(roomInfo.isHost || true);
          setPlayers(roomInfo.players || []);
          setSuccess(`房间创建成功！房间号: ${roomInfo.roomId}`);

          // Check if room is full
          if (roomInfo.roomReady || (roomInfo.players && roomInfo.players.length >= 3)) {
            setRoomReady(true);
          }

          console.log('Subscribing to game topic for host:', roomInfo.gameId);
          // Subscribe to game topic
          connectionManager.setGameId(roomInfo.gameId);
          return;
        }

        // Check if this is room ready notification (for all players)
        if (data.data && data.data.message === '房间已满，请房主开始游戏') {
          console.log('Room ready notification');
          // Update players list if included
          if (data.data.players) {
            setPlayers(data.data.players);
          }
          setRoomReady(true);
          setSuccess('房间已满，请点击"开始游戏"按钮');
          return;
        }

        // Check if this is room full and ready to start (roomReady flag)
        if (data.data && data.data.roomReady) {
          console.log('Room ready notification via roomReady flag');
          if (data.data.players) {
            setPlayers(data.data.players);
          }
          setRoomReady(true);
          setSuccess('房间已满，请点击"开始游戏"按钮');
          return;
        }

        // Regular game start - cards dealt
        onGameStart && onGameStart();
      } else if (data.type === 'CARDS_DEAL') {
        // Cards dealt - check if it's for this player
        // Use ConnectionManager.getPlayerId() to get current playerId
        const currentPlayerId = connectionManager.getPlayerId();
        console.log('CARDS_DEAL in RoomManager, myPlayerId:', currentPlayerId, 'data:', data.data);
        // New format: data contains { targetPlayerId, cards }
        if (data.data && data.data.targetPlayerId === currentPlayerId && data.data.cards) {
          dispatch({ type: 'SET_HAND_CARDS', payload: data.data.cards });
        }
        // Also handle old format for backward compatibility
        if (data.playerId === currentPlayerId && data.data && Array.isArray(data.data)) {
          dispatch({ type: 'SET_HAND_CARDS', payload: data.data });
        }
      }
    };

    connectionManager.addMessageListener(handleMessage);

    return () => {
      connectionManager.removeMessageListener(handleMessage);
    };
  }, [myPlayerId, onGameStart, dispatch]);

  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('请输入玩家名称');
      return;
    }

    if (!connected) {
      setError('正在连接服务器，请稍候...');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create game via connection manager
      connectionManager.createGame(playerName.trim());
    } catch (err) {
      setError('创建游戏失败: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('请输入玩家名称');
      return;
    }
    if (!roomId.trim()) {
      setError('请输入房间号');
      return;
    }

    if (!connected) {
      setError('正在连接服务器，请稍候...');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Join game via connection manager
      connectionManager.joinGame(roomId.trim().toUpperCase(), playerName.trim());
      setSuccess('正在加入房间...');
    } catch (err) {
      setError('加入游戏失败: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!currentRoomInfo && !roomId) {
      setError('请先创建或加入房间');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const gameId = currentRoomInfo?.gameId || roomId;
      connectionManager.setGameId(gameId);
      connectionManager.startGame();
    } catch (err) {
      setError('开始游戏失败: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show room info if in a room
  if (currentRoomInfo || roomReady) {
    return (
      <RoomContainer>
        <RoomBox>
          <Title>等待游戏开始</Title>

          <RoomInfo>
            <Label>房间号</Label>
            <RoomCode>{currentRoomInfo?.roomId || roomId}</RoomCode>
            <RoomStatus $full={roomReady}>
              {roomReady ? '房间已满，可以开始游戏' : '等待其他玩家加入...'}
            </RoomStatus>
          </RoomInfo>

          <PlayerList>
            <Label>玩家列表</Label>
            {players.map((player, index) => (
              <PlayerItem key={index} $isHost={player.isHost}>
                <span>{player.name}</span>
                {player.isHost && <HostBadge>房主</HostBadge>}
              </PlayerItem>
            ))}
            {!roomReady && players.length < 3 && (
              <PlayerItem>
                <span style={{ color: '#7f8c8d' }}>等待玩家加入...</span>
              </PlayerItem>
            )}
          </PlayerList>

          {isHost && roomReady && (
            <ButtonGroup>
              <Button
                $variant="warning"
                onClick={handleStartGame}
                disabled={isLoading}
              >
                {isLoading ? '开始中...' : '开始游戏'}
              </Button>
            </ButtonGroup>
          )}

          {!isHost && !roomReady && (
            <SuccessMessage>等待房主邀请其他玩家...</SuccessMessage>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </RoomBox>
      </RoomContainer>
    );
  }

  return (
    <RoomContainer>
      <RoomBox>
        <Title>斗地主游戏</Title>

        <Form onSubmit={(e) => { e.preventDefault(); handleCreateGame(e); }}>
          <InputGroup>
            <Label>玩家名称</Label>
            <Input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入您的名称"
              disabled={isLoading}
            />
          </InputGroup>

          <ButtonGroup>
            <Button
              type="button"
              $variant="success"
              onClick={handleCreateGame}
              disabled={isLoading || !connected}
            >
              {isLoading ? '创建中...' : '创建房间'}
            </Button>

            <Button
              type="button"
              $variant="primary"
              onClick={handleJoinGame}
              disabled={isLoading || !connected}
            >
              {isLoading ? '加入中...' : '加入房间'}
            </Button>
          </ButtonGroup>

          <InputGroup style={{ marginTop: '15px' }}>
            <Label>房间号 (加入游戏时使用)</Label>
            <Input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="例如: ABC123"
              disabled={isLoading}
              maxLength={6}
            />
          </InputGroup>

          {!connected && (
            <ErrorMessage>正在连接服务器...</ErrorMessage>
          )}
        </Form>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </RoomBox>
    </RoomContainer>
  );
};

export default RoomManager;
