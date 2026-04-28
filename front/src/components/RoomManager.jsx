import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useGame } from "../contexts/GameContext";
import connectionManager from "../services/ConnectionManager";

const RoomContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  z-index: 1000;
  padding: 20px 0;
  box-sizing: border-box;

  @media (min-height: 650px) {
    align-items: center;
    padding: 0;
  }
`;

const RoomBox = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 20px;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;

  @media (min-height: 650px) {
    padding: 30px;
  }
`;

const Title = styled.h2`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 15px;
  font-size: 20px;

  @media (min-height: 650px) {
    margin-bottom: 25px;
    font-size: 24px;
  }
`;

const RoomInfo = styled.div`
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
  text-align: center;

  @media (min-height: 650px) {
    padding: 15px;
    margin-bottom: 20px;
  }
`;

const RoomCode = styled.div`
  color: #f39c12;
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 4px;
  margin: 6px 0;

  @media (min-height: 650px) {
    font-size: 28px;
    margin: 10px 0;
  }
`;

const RoomStatus = styled.div`
  color: ${(props) => (props.$full ? "#2ecc71" : "#7f8c8d")};
  font-size: 14px;
`;

const PlayerList = styled.div`
  margin: 10px 0;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;

  @media (min-height: 650px) {
    margin: 15px 0;
    padding: 10px;
  }
`;

const PlayerItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  color: ${(props) => (props.$isHost ? "#f39c12" : "#2c3e50")};
  font-weight: ${(props) => (props.$isHost ? "bold" : "normal")};
`;

const HostBadge = styled.span`
  background: #f39c12;
  color: #2c3e50;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 8px;
`;

const OfflineBadge = styled.span`
  background: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  margin-left: 6px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (min-height: 650px) {
    gap: 15px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;

  @media (min-height: 650px) {
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

  @media (min-height: 650px) {
    padding: 12px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 6px;

  @media (min-height: 650px) {
    margin-top: 10px;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (min-height: 650px) {
    padding: 12px;
  }

  ${(props) =>
    props.$variant === "primary" &&
    `
    background: #3498db;
    color: white;
  `}

  ${(props) =>
    props.$variant === "success" &&
    `
    background: #2ecc71;
    color: white;
  `}

  ${(props) =>
    props.$variant === "warning" &&
    `
    background: #f39c12;
    color: white;
  `}

  ${(props) =>
    props.$variant === "secondary" &&
    `
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

const LeaveButton = styled.button`
  padding: 10px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  pointer-events: all;
  position: relative;
  z-index: 10;

  @media (min-height: 650px) {
    margin-top: 15px;
  }

  &:hover {
    background: #c0392b;
    transform: translateY(-2px);
  }
`;

const RoomManager = ({ userInfo }) => {
  const { dispatch } = useGame();
  const navigate = useNavigate();

  // 尝试从 localStorage 恢复之前保存的玩家信息
  const [playerName, setPlayerName] = useState(() => {
    // 优先使用用户信息，其次使用 localStorage
    if (userInfo?.nickname || userInfo?.username) {
      return userInfo.nickname || userInfo.username;
    }
    return localStorage.getItem("doudizhu_playerName") || "";
  });
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  // 监听从游戏返回房间的事件，重新连接 WebSocket
  useEffect(() => {
    const handleReturnToRoom = () => {
      console.log('Returned to room manager, reconnecting WebSocket...');
      // 清除之前的房间状态，显示创建/加入房间界面
      setCurrentRoomInfo(null);
      setRoomReady(false);
      setRoomId("");
      setPlayers([]);
      setIsHost(false);
      setError("");
      setSuccess("");
      // 清除 localStorage 中的游戏状态
      localStorage.removeItem('doudizhu_gameState');

      // 重新连接 WebSocket - 使用 connectionManager.isConnected() 检查实际连接状态
      if (!connectionManager.isConnected()) {
        console.log('WebSocket not connected, reconnecting...');
        let playerId = localStorage.getItem("doudizhu_playerId");
        if (!playerId) {
          playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          localStorage.setItem("doudizhu_playerId", playerId);
        }

        connectionManager.connect(playerId, (success) => {
          console.log('Reconnection result:', success);
          setConnected(success);
        });
      } else {
        console.log('WebSocket already connected');
        setConnected(true);
      }
    };

    window.addEventListener('returnToRoomManager', handleReturnToRoom);
    return () => {
      window.removeEventListener('returnToRoomManager', handleReturnToRoom);
    };
  }, []);

  // Connect to server when component mounts
  useEffect(() => {
    // 检查是否已经连接（ConnectionInitializer 在 App 级别已处理连接）
    if (connectionManager.isConnected()) {
      console.log('Already connected to server (by ConnectionInitializer)');
      setConnected(true);
      // 设置 playerId
      let playerId = localStorage.getItem("doudizhu_playerId");
      if (!playerId) {
        playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem("doudizhu_playerId", playerId);
      }
      setMyPlayerId(playerId);
      dispatch({ type: "SET_MY_PLAYER_ID", payload: playerId });

      // 检查是否有保存的房间号，尝试自动恢复游戏
      const savedRoomId = localStorage.getItem("doudizhu_roomId");
      const savedGameId = localStorage.getItem("doudizhu_gameId");
      const savedPlayerName = localStorage.getItem("doudizhu_playerName") || playerName;
      if (savedPlayerName) {
        const joinTargetId = savedGameId || savedRoomId;
        if (joinTargetId) {
          console.log("Found saved game, attempting to reconnect from RoomManager...", joinTargetId);
          setRoomId(savedRoomId || joinTargetId);
          setTimeout(() => {
            connectionManager.joinGame(joinTargetId, savedPlayerName);
          }, 500);
          setSuccess("正在恢复游戏...");
        }
      }
      return;
    }

    // 连接由 App 级别的 ConnectionInitializer 处理，这里只做重连逻辑
    let playerId = localStorage.getItem("doudizhu_playerId");
    if (!playerId) {
      playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("doudizhu_playerId", playerId);
    }
    setMyPlayerId(playerId);
    dispatch({ type: "SET_MY_PLAYER_ID", payload: playerId });
  }, [dispatch]);

  // Listen for game events
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleMessage = (data) => {
      console.log("=== RoomManager received ===", data);

      if (data.type === "PLAYER_JOIN") {
        console.log(
          "PLAYER_JOIN event, data:",
          data.data,
          "playerId:",
          data.playerId,
        );

        // Check if this is a join response (contains roomId)
        if (data.data && data.data.roomId) {
          console.log("This is a join response");
          const roomInfo = data.data;
          setCurrentRoomInfo(roomInfo);
          setRoomId(roomInfo.roomId);
          setIsHost(roomInfo.isHost || false);
          setPlayers(roomInfo.players || []);

          // 保存房间号、游戏ID和玩家名称到 localStorage，用于刷新后恢复
          localStorage.setItem("doudizhu_roomId", roomInfo.roomId);
          localStorage.setItem("doudizhu_gameId", roomInfo.gameId);
          localStorage.setItem("doudizhu_playerName", playerName);

          setSuccess(`加入房间成功！房间号: ${roomInfo.roomId}`);
          console.log("Subscribing to game topic:", roomInfo.gameId);
          // Subscribe to game topic
          connectionManager.setGameId(roomInfo.gameId);

          // 如果是重连且游戏正在进行中，先恢复游戏状态再导航到游戏页面
          if (roomInfo.reconnected && (roomInfo.status === "BIDDING" || roomInfo.status === "PLAYING")) {
            console.log("Reconnection to active game, restoring game state and navigating to game view");
            // 恢复游戏状态到 GameContext
            dispatch({ type: 'SET_GAME_STATE', payload: roomInfo.gameStatus ? roomInfo.gameStatus.toLowerCase() : roomInfo.status.toLowerCase() });
            dispatch({ type: 'SET_PLAYERS', payload: roomInfo.players || [] });
            if (roomInfo.handCards) {
              dispatch({ type: 'SET_HAND_CARDS', payload: roomInfo.handCards });
            }
            if (roomInfo.landlordId) {
              dispatch({ type: 'SET_LANDLORD', payload: roomInfo.landlordId });
            }
            if (roomInfo.landlordCards) {
              dispatch({ type: 'SET_LANDLORD_CARDS', payload: roomInfo.landlordCards });
            }
            if (roomInfo.currentCards) {
              dispatch({ type: 'SET_CURRENT_CARDS', payload: roomInfo.currentCards });
            }
            if (roomInfo.currentPlayerId) {
              dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: roomInfo.currentPlayerId } });
            }
            if (roomInfo.playerCardCounts) {
              dispatch({ type: 'SET_PLAYER_CARD_COUNTS', payload: roomInfo.playerCardCounts });
            }
            if (roomInfo.playerLandlordStatus && roomInfo.players) {
              const updatedPlayers = roomInfo.players.map(p => ({
                ...p,
                isLandlord: roomInfo.playerLandlordStatus[p.id] || false
              }));
              dispatch({ type: 'SET_PLAYERS', payload: updatedPlayers });
            }
            if (roomInfo.canPass !== undefined) {
              dispatch({ type: 'SET_CAN_PASS', payload: roomInfo.canPass });
            }
            setTimeout(() => navigate('/game'), 100);
          }
        } else if (data.data && data.data.id) {
          // Player joined the game (broadcast or private notification) - data is the Player object
          console.log(
            "This is a broadcast/private notification, adding player:",
            data.data,
          );
          // Avoid adding duplicate players
          setPlayers((prev) => {
            // Check if this player already exists
            const exists = prev.some((p) => p.id === data.data.id);
            if (exists) {
              console.log("Player already exists, skipping");
              return prev;
            }

            // If we have roomInfo with players, use those as base
            // Use ref to get the latest value and avoid closure issues
            const latestRoomInfo = currentRoomInfoRef.current;
            let basePlayers = prev;
            if (
              latestRoomInfo &&
              latestRoomInfo.players &&
              prev.length < latestRoomInfo.players.length
            ) {
              basePlayers = latestRoomInfo.players;
              console.log("Using players from roomInfo as base:", basePlayers);
            }

            const newPlayers = [...basePlayers, data.data];
            console.log("New players:", newPlayers);
            // Check if room is full (3 players including AI)
            if (newPlayers.length >= 3) {
              setRoomReady(true);
            }
            return newPlayers;
          });
        }
      } else if (data.type === "GAME_START") {
        console.log("GAME_START event, data:", data.data);

        // Check if game has already started (has status field like BIDDING or PLAYING)
        if (
          data.data &&
          data.data.status &&
          (data.data.status === "BIDDING" || data.data.status === "PLAYING")
        ) {
          console.log("Game already started, status:", data.data.status);
          // Update players list
          if (data.data.players) {
            setPlayers(data.data.players);
          }
          // Game has started, transition to game view
          navigate('/game');
          return;
        }

        // Check if this is a room creation response (has roomId and gameId, and status is WAITING)
        if (data.data && data.data.roomId && data.data.gameId) {
          // Skip if we already have room info (avoid duplicate processing)
          if (currentRoomInfo && currentRoomInfo.roomId === data.data.roomId) {
            console.log("Duplicate room info, but checking for updates...");
            // Still process roomReady/players updates even on "duplicate"
            if (data.data.players) {
              setPlayers(data.data.players);
            }
            if (data.data.roomReady) {
              setRoomReady(true);
              setSuccess('房间已满，请点击"开始游戏"按钮');
            }
            if (data.data.message) {
              setSuccess(data.data.message);
            }
            return;
          }

          console.log("This is a room creation response");
          const roomInfo = data.data;
          setCurrentRoomInfo(roomInfo);
          setRoomId(roomInfo.roomId);
          setIsHost(roomInfo.isHost || true);
          setPlayers(roomInfo.players || []);
          setSuccess(`房间创建成功！房间号: ${roomInfo.roomId}`);

          // Check if room is full
          if (
            roomInfo.roomReady ||
            (roomInfo.players && roomInfo.players.length >= 3)
          ) {
            setRoomReady(true);
          }

          console.log("Subscribing to game topic for host:", roomInfo.gameId);
          // Subscribe to game topic
          connectionManager.setGameId(roomInfo.gameId);

          // 保存房间号、游戏ID和玩家名称到 localStorage，用于刷新后恢复
          localStorage.setItem("doudizhu_roomId", roomInfo.roomId);
          localStorage.setItem("doudizhu_gameId", roomInfo.gameId);
          localStorage.setItem("doudizhu_playerName", playerName);

          return;
        }

        // Check if this is room ready notification (for all players)
        if (data.data && data.data.message === "房间已满，请房主开始游戏") {
          console.log("Room ready notification");
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
          console.log("Room ready notification via roomReady flag");
          if (data.data.players) {
            setPlayers(data.data.players);
          }
          setRoomReady(true);
          setSuccess('房间已满，请点击"开始游戏"按钮');
          return;
        }

        // Regular game start - cards dealt
        navigate('/game');
      } else if (data.type === "CARDS_DEAL") {
        // Cards dealt - check if it's for this player
        // Use ConnectionManager.getPlayerId() to get current playerId
        const currentPlayerId = connectionManager.getPlayerId();
        console.log(
          "CARDS_DEAL in RoomManager, myPlayerId:",
          currentPlayerId,
          "data:",
          data.data,
        );
        // New format: data contains { targetPlayerId, cards }
        if (
          data.data &&
          data.data.targetPlayerId === currentPlayerId &&
          data.data.cards
        ) {
          dispatch({ type: "SET_HAND_CARDS", payload: data.data.cards });
        }
        // Also handle old format for backward compatibility
        if (
          data.playerId === currentPlayerId &&
          data.data &&
          Array.isArray(data.data)
        ) {
          dispatch({ type: "SET_HAND_CARDS", payload: data.data });
        }
      } else if (data.type === "PLAYER_LEAVE") {
        // 玩家离开房间
        console.log("PLAYER_LEAVE event:", data);
        const leavingPlayerId = data.playerId;
        const leavingPlayerName = data.data;

        // 从玩家列表中移除该玩家
        setPlayers((prev) => {
          const newPlayers = prev.filter((p) => p.id !== leavingPlayerId);
          console.log("Player left, remaining players:", newPlayers);

          // 如果不足3人，重置房间状态
          if (newPlayers.length < 3) {
            setRoomReady(false);
          }

          // 如果是自己离开，重置房间状态
          if (leavingPlayerId === myPlayerId) {
            resetRoomState();
          }

          return newPlayers;
        });

        setSuccess(`${leavingPlayerName} 离开了房间`);
      } else if (data.type === "GAME_DESTROYED") {
        // 房间被解散（房主离开或所有玩家离开）
        console.log("GAME_DESTROYED event:", data);
        const message = data.data || "房间已解散";

        // 显示消息
        setError(message);
        setTimeout(() => setError(""), 3000);

        // 重置房间状态，回到初始界面
        resetRoomState();
      } else if (data.type === "PLAYER_OFFLINE") {
        // 玩家离线
        console.log("PLAYER_OFFLINE in RoomManager:", data);
        if (data.data && data.data.playerId) {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === data.data.playerId ? { ...p, isOffline: data.data.isOffline } : p
            )
          );
        }
      } else if (data.type === "ERROR") {
        // 后端返回的错误
        console.error("Error from server:", data.data);
        setError(String(data.data || "操作失败"));
        setTimeout(() => setError(""), 5000);
      }
    };

    connectionManager.addMessageListener(handleMessage);

    return () => {
      connectionManager.removeMessageListener(handleMessage);
    };
  }, [myPlayerId, navigate, dispatch]);

  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("请输入玩家名称");
      return;
    }

    if (!connected) {
      setError("正在连接服务器，请稍候...");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Create game via connection manager
      connectionManager.createGame(playerName.trim());
    } catch (err) {
      setError("创建游戏失败: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("请输入玩家名称");
      return;
    }
    if (!roomId.trim()) {
      setError("请输入房间号");
      return;
    }

    if (!connected) {
      setError("正在连接服务器，请稍候...");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Join game via connection manager
      connectionManager.joinGame(
        roomId.trim().toUpperCase(),
        playerName.trim(),
      );
      setSuccess("正在加入房间...");
    } catch (err) {
      setError("加入游戏失败: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!currentRoomInfo && !roomId) {
      setError("请先创建或加入房间");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const gameId = currentRoomInfo?.gameId || roomId;
      connectionManager.setGameId(gameId);
      connectionManager.startGame();
    } catch (err) {
      setError("开始游戏失败: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 重置房间状态
  const resetRoomState = () => {
    setCurrentRoomInfo(null);
    setRoomId("");
    setIsHost(false);
    setPlayers([]);
    setRoomReady(false);
    connectionManager.setGameId(null);
    // 清除 localStorage 中保存的房间信息
    localStorage.removeItem("doudizhu_roomId");
    localStorage.removeItem("doudizhu_gameId");
    localStorage.removeItem("doudizhu_playerName");
  };

  // 退出房间
  const handleLeaveRoom = () => {
    const gameId = currentRoomInfo?.gameId || roomId;
    if (gameId) {
      connectionManager.leaveGame();
      // 不立即重置状态，等待后端响应
      // 如果后端返回错误（游戏中无法离开），会收到错误消息
      // 如果成功，会收到PLAYER_LEAVE事件，届时会重置状态
    } else {
      resetRoomState();
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
              {roomReady ? "房间已满，可以开始游戏" : "等待其他玩家加入..."}
            </RoomStatus>
          </RoomInfo>

          <PlayerList>
            <Label>玩家列表</Label>
            {players.map((player, index) => (
              <PlayerItem key={index} $isHost={player.isHost}>
                <span>
                  {player.name}
                  {player.isOffline && <OfflineBadge>离线</OfflineBadge>}
                </span>
                {player.isHost && <HostBadge>房主</HostBadge>}
              </PlayerItem>
            ))}
            {!roomReady && players.length < 3 && (
              <PlayerItem>
                <span style={{ color: "#7f8c8d" }}>等待玩家加入...</span>
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
                {isLoading ? "开始中..." : "开始游戏"}
              </Button>
            </ButtonGroup>
          )}

          {!isHost && !roomReady && (
            <SuccessMessage>等待房主邀请其他玩家...</SuccessMessage>
          )}

          {/* 退出房间按钮 */}
          <div style={{ textAlign: "center" }}>
            <LeaveButton onClick={handleLeaveRoom}>退出房间</LeaveButton>
          </div>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </RoomBox>
      </RoomContainer>
    );
  }

  return (
    <RoomContainer>
      <RoomBox>
        <Title>斗地主游戏</Title>

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateGame(e);
          }}
        >
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
              {isLoading ? "创建中..." : "创建房间"}
            </Button>

            <Button
              type="button"
              $variant="primary"
              onClick={handleJoinGame}
              disabled={isLoading || !connected}
            >
              {isLoading ? "加入中..." : "加入房间"}
            </Button>
          </ButtonGroup>

          <InputGroup>
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

          {!connected && <ErrorMessage>正在连接服务器...</ErrorMessage>}
        </Form>

        {/* 重新连接按钮 - 当localStorage有保存的房间信息时显示 */}
        {connected && localStorage.getItem("doudizhu_roomId") && !currentRoomInfo && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <Button
              $variant="warning"
              onClick={() => {
                const savedRoomId = localStorage.getItem("doudizhu_roomId");
                const savedGameId = localStorage.getItem("doudizhu_gameId");
                const savedPlayerName = localStorage.getItem("doudizhu_playerName") || playerName;
                const joinTargetId = savedGameId || savedRoomId;
                if (joinTargetId && savedPlayerName) {
                  connectionManager.joinGame(joinTargetId, savedPlayerName);
                  setSuccess("正在重新连接...");
                }
              }}
            >
              重新连接到之前的房间
            </Button>
          </div>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </RoomBox>
    </RoomContainer>
  );
};

export default RoomManager;
