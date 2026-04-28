import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import GameTable from './components/GameTable';
import GameControls from './components/GameControls';
import ChatPanel from './components/ChatPanel';
import GameInfo from './components/GameInfo';
import Card from './components/Card';
import ConnectionManager from './services/ConnectionManager';
import { GameProvider, useGame } from './contexts/GameContext';
import RoomManager from './components/RoomManager';
import Auth from './components/Auth';
import OrientationLock from './components/OrientationLock';
import axios from './utils/myaxios';
import WinnerDisplay from './components/WinnerDisplay';
import {
  GameBackground,
  HandCardsArea,
  HandCardsLabel,
  HandCardsList,
  ControlsArea,
  EffectContainer,
  BombEffect,
  EffectLabel,
  CARD_TYPE_NAMES,
  ToastContainer,
  Toast,
  ToastIcon,
  ToastMessage,
  ScreenShakeWrapper,
  FlashOverlay
} from './components/GameEffects';
import { CardUtils, CardType } from './utils/gameLogic';

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
  }

  /* 移动端触摸优化 */
  @media (max-width: 768px) {
    body {
      -webkit-tap-highlight-color: transparent;
    }

    * {
      -webkit-tap-highlight-color: transparent;
    }
  }
`;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const cardDeal = keyframes`
  from {
    opacity: 0;
    transform: translateY(-100px) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

// Main container
const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-image: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
`;

// Game layout - Full screen game area
const GameLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 10px;
  gap: 10px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 6px;
    gap: 6px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    padding: 4px;
    gap: 4px;
  }

  /* 移动端确保底部区域有足够空间 */
  @media (max-width: 1024px), (max-height: 800px) {
    gap: 5px;
  }
`;

// Top bar with game info
const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  padding: 0 10px;
`;

// Main game area - flex to take remaining space
const MainArea = styled.div`
  display: flex;
  flex: 1;
  gap: 10px;
  min-height: 0;
  overflow: hidden;

  /* 移动端限制中间区域高度，给底部留空间 */
  @media (max-width: 1024px), (max-height: 800px) {
    flex: 1;
    max-height: 55%;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    flex: 1;
    max-height: 50%;
    gap: 4px;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    flex: 1;
    max-height: 45%;
    gap: 3px;
  }
`;

// Left side - Game table
const GameArea = styled.div`
  flex: 1;
  max-width: calc(100% - 290px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
  animation: ${fadeIn} 0.5s ease-out;
  position: relative;

  @media (max-width: 900px) {
    max-width: calc(100% - 250px);
  }

  /* 移动端游戏区域占满宽度 */
  @media (max-width: 1024px), (max-height: 800px) {
    max-width: 100%;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    max-width: 100%;
    min-height: 0;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    max-width: 100%;
  }
`;

// Right side - Info panel (chat and player info)
const SidePanel = styled.div`
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  padding: 5px;

  @media (max-width: 900px) {
    width: 240px;
  }

  /* 移动端始终隐藏聊天面板 */
  @media (max-width: 1024px), (max-height: 800px) {
    display: none;
  }
`;

// Bottom area - Hand cards and controls
const BottomArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  animation: ${fadeIn} 0.6s ease-out;
  min-height: 120px;
  overflow: hidden;

  /* 移动端底部区域优先级更高 */
  @media (max-width: 1024px), (max-height: 800px) {
    flex: 0 0 45%;
    min-height: 35%;
    max-height: 50%;
    gap: 5px;
  }

  @media (max-width: 768px) {
    min-height: 35%;
    gap: 5px;
  }

  @media (max-width: 480px) {
    min-height: 40%;
    gap: 4px;
  }

  @media (max-height: 600px) and (orientation: landscape) {
    flex: 0 0 45%;
    min-width: 100%;
    gap: 3px;
    min-height: 40%;
    max-height: 50%;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    flex: 0 0 50%;
    min-width: 100%;
    gap: 2px;
    min-height: 45%;
    max-height: 55%;
  }
`;

// Card component styled for hand
const HandCard = styled.div`
  animation: ${cardDeal} 0.3s ease-out;
  animation-delay: ${props => props.$index * 0.05}s;
  animation-fill-mode: both;
`;

// Message handler component - uses ref for state to avoid stale closures
// This component should be mounted at App level to persist across route changes
const MessageHandler = ({ onGameStart, onGameJoined, showToastRef }) => {
  const { state, dispatch } = useGame();
  const stateRef = useRef(state);
  stateRef.current = state;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleMessage = (data) => {
      // Use ref to always get current state
      const currentState = stateRef.current;
      // Get current playerId from ConnectionManager
      const currentPlayerId = ConnectionManager.getPlayerId();
      console.log('Received game event:', data, 'myPlayerId:', currentPlayerId);

      switch (data.type) {
        case 'PLAYER_JOIN':
          console.log('PLAYER_JOIN:', data.data);
          // Handle reconnection response (data contains roomId + full game state)
          if (data.data && data.data.roomId && data.data.reconnected) {
            console.log('Reconnection PLAYER_JOIN, restoring game state');
            // Restore full game state from reconnection data
            if (data.data.gameStatus) {
              dispatch({ type: 'SET_GAME_STATE', payload: data.data.gameStatus.toLowerCase() });
            } else if (data.data.status) {
              dispatch({ type: 'SET_GAME_STATE', payload: data.data.status.toLowerCase() });
            }
            if (data.data.players) {
              dispatch({ type: 'SET_PLAYERS', payload: data.data.players });
            }
            if (data.data.handCards) {
              dispatch({ type: 'SET_HAND_CARDS', payload: data.data.handCards });
            }
            if (data.data.landlordId) {
              dispatch({ type: 'SET_LANDLORD', payload: data.data.landlordId });
            }
            if (data.data.landlordCards) {
              dispatch({ type: 'SET_LANDLORD_CARDS', payload: data.data.landlordCards });
            }
            if (data.data.currentCards) {
              dispatch({ type: 'SET_CURRENT_CARDS', payload: data.data.currentCards });
            }
            if (data.data.currentPlayerId) {
              dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: data.data.currentPlayerId } });
            }
            if (data.data.playerCardCounts) {
              dispatch({ type: 'SET_PLAYER_CARD_COUNTS', payload: data.data.playerCardCounts });
            }
            if (data.data.playerLandlordStatus && data.data.players) {
              const updatedPlayers = data.data.players.map(p => ({
                ...p,
                isLandlord: data.data.playerLandlordStatus[p.id] || false
              }));
              dispatch({ type: 'SET_PLAYERS', payload: updatedPlayers });
            }
            if (data.data.canPass !== undefined) {
              dispatch({ type: 'SET_CAN_PASS', payload: data.data.canPass });
            }
            // Set myPlayerId if not set
            if (data.playerId && !currentState.myPlayerId) {
              dispatch({ type: 'SET_MY_PLAYER_ID', payload: data.playerId });
            }
            if (data.data.gameId) {
              ConnectionManager.setGameId(data.data.gameId);
            }
          } else if (data.data && data.data.id) {
            console.log('Player joined:', data.data);
            // Add player to state if not already present
            const existingPlayer = currentState.players?.find(p => p.id === data.data.id);
            if (!existingPlayer && data.data.name) {
              const newPlayer = {
                id: data.data.id,
                name: data.data.name,
                position: data.data.position,
                isHost: data.data.isHost || false
              };
              dispatch({ type: 'ADD_PLAYER', payload: newPlayer });
            }
          }
          break;

        case 'GAME_START':
          if (data.data && data.data.status) {
            const status = data.data.status;
            console.log('Game status:', status);

            if (status === 'DEALING' || status === 'BIDDING') {
              dispatch({ type: 'SET_GAME_STATE', payload: 'bidding' });
            } else if (status === 'PLAYING') {
              dispatch({ type: 'SET_GAME_STATE', payload: 'playing' });
            }

            if (data.data.players) {
              dispatch({ type: 'SET_PLAYERS', payload: data.data.players });
            }

            if (data.data.playerCardCounts) {
              dispatch({ type: 'SET_PLAYER_CARD_COUNTS', payload: data.data.playerCardCounts });
            }

            // Handle reconnection - restore game state
            if (data.data.reconnected) {
              if (data.data.landlordId) {
                dispatch({ type: 'SET_LANDLORD', payload: data.data.landlordId });
              }
              if (data.data.landlordCards) {
                dispatch({ type: 'SET_LANDLORD_CARDS', payload: data.data.landlordCards });
              }
              if (data.data.currentCards) {
                dispatch({ type: 'SET_CURRENT_CARDS', payload: data.data.currentCards });
              }
              if (data.data.handCards) {
                dispatch({ type: 'SET_HAND_CARDS', payload: data.data.handCards });
              }
              if (data.data.currentPlayerId) {
                dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: data.data.currentPlayerId } });
              }
              if (data.data.playerCardCounts) {
                dispatch({ type: 'SET_PLAYER_CARD_COUNTS', payload: data.data.playerCardCounts });
              }
              if (data.data.playerLandlordStatus) {
                // Update players with landlord status
                const currentPlayers = currentState.players || [];
                const updatedPlayers = currentPlayers.map(p => ({
                  ...p,
                  isLandlord: data.data.playerLandlordStatus[p.id] || false
                }));
                dispatch({ type: 'SET_PLAYERS', payload: updatedPlayers });
              }
              if (data.data.gameStatus) {
                dispatch({ type: 'SET_GAME_STATE', payload: data.data.gameStatus.toLowerCase() });
              }
              // If reconnected and game is in progress, hide room manager and show game
              if (data.data.gameStatus === 'BIDDING' || data.data.gameStatus === 'PLAYING') {
                onGameJoined && onGameJoined();
              }
            }
          }
          // Only show room manager when status is WAITING and there's no roomId
          // This handles the initial game creation case, not the playing state updates
          if (data.data && !data.data.roomId && data.data.status === 'WAITING') {
            onGameStart && onGameStart();
          }
          break;

        case 'CARDS_DEAL':
          console.log('CARDS_DEAL received, data:', data.data, 'currentPlayerId:', currentPlayerId);
          // New format: data contains { targetPlayerId, cards, playerCardCounts? }
          if (data.data && data.data.targetPlayerId === currentPlayerId && data.data.cards) {
            console.log('Setting hand cards for player:', currentPlayerId, 'cards count:', data.data.cards.length);
            dispatch({ type: 'SET_HAND_CARDS', payload: data.data.cards });
            // Also update player card counts if provided (for landlord card redistribution)
            if (data.data.playerCardCounts) {
              console.log('Updating player card counts:', data.data.playerCardCounts);
              dispatch({ type: 'SET_PLAYER_CARD_COUNTS', payload: data.data.playerCardCounts });
            }
          }
          // Also handle old format for backward compatibility
          if (data.playerId === currentPlayerId && data.data && Array.isArray(data.data)) {
            console.log('Setting hand cards (old format) for player:', currentPlayerId);
            dispatch({ type: 'SET_HAND_CARDS', payload: data.data });
          }
          break;

        case 'BID_REQUEST':
          dispatch({ type: 'SET_GAME_STATE', payload: 'bidding' });
          dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: data.playerId } });
          console.log('Bid requested for player:', data.playerId);
          break;

        case 'BID_RESPONSE':
          if (data.playerId === 'LANDLORD_DETERMINED') {
            const landlordData = data.data;
            if (landlordData && landlordData.landlordId) {
              dispatch({ type: 'SET_LANDLORD', payload: landlordData.landlordId });
              dispatch({ type: 'SET_GAME_STATE', payload: 'playing' });
              // Set current player to landlord
              dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: landlordData.landlordId } });
              // Landlord goes first, cannot pass
              dispatch({ type: 'SET_CAN_PASS', payload: false });
              // Set landlord cards (visible to all players)
              if (landlordData.landlordCards) {
                dispatch({ type: 'SET_LANDLORD_CARDS', payload: landlordData.landlordCards });
                console.log('Landlord cards:', landlordData.landlordCards);
              }
              console.log('Landlord determined:', landlordData.landlordId);
            }
          } else {
            console.log('Bid response from:', data.playerId, 'bid:', data.data);
          }
          break;

        case 'PLAY_CARDS':
          console.log('PLAY_CARDS event received:', data);
          if (data.data) {
            const playData = data.data;

            // Set canPass flag
            if (playData.canPass !== undefined) {
              dispatch({ type: 'SET_CAN_PASS', payload: playData.canPass });
              console.log('Setting canPass:', playData.canPass);
            }

            // Check if table was cleared (everyone passed)
            if (playData.tableCleared) {
              console.log('Table cleared, current player:', playData.playerId);
              dispatch({ type: 'SET_CURRENT_CARDS', payload: [] });
              dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: playData.playerId } });
              // After table cleared, mustPlay is true so canPass should be false
              if (playData.mustPlay) {
                dispatch({ type: 'SET_CAN_PASS', payload: false });
              }
            } else {
              // Normal play - update current player to next player
              if (playData.nextPlayerId) {
                console.log('Setting current player to next:', playData.nextPlayerId);
                dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: playData.nextPlayerId } });
              }
              if (playData.cards) {
                dispatch({ type: 'SET_CURRENT_CARDS', payload: playData.cards });

                // Detect card type and show effect
                const cardType = CardUtils.analyzeCards(playData.cards);
                if (cardType && (cardType.type === CardType.BOMB || cardType.type === CardType.JOKER_BOMB ||
                    cardType.type === CardType.STRAIGHT || cardType.type === CardType.DOUBLE_STRAIGHT ||
                    cardType.type === CardType.AIRPLANE)) {
                  console.log('Special card type detected:', cardType.type);
                  dispatch({ type: 'SET_CURRENT_EFFECT', payload: cardType });

                  // Trigger screen shake for bombs and joker bombs
                  if (cardType.type === CardType.BOMB || cardType.type === CardType.JOKER_BOMB) {
                    const isJoker = cardType.type === CardType.JOKER_BOMB;
                    dispatch({ type: 'SET_SCREEN_SHAKE', payload: { active: true, isJoker } });
                    // Clear shake after animation
                    setTimeout(() => {
                      dispatch({ type: 'SET_SCREEN_SHAKE', payload: { active: false, isJoker: false } });
                    }, isJoker ? 800 : 600);
                  }

                  // Clear effect after 2 seconds
                  setTimeout(() => {
                    dispatch({ type: 'SET_CURRENT_EFFECT', payload: null });
                  }, 2000);
                }
              }
              if (playData.playerId === currentPlayerId && playData.cards) {
                dispatch({ type: 'UPDATE_HAND_CARDS', payload: playData.cards });
                dispatch({ type: 'CLEAR_SELECTED_CARDS' });
              }
            }
            if (playData.playerCardCounts) {
              dispatch({ type: 'SET_PLAYER_CARD_COUNTS', payload: playData.playerCardCounts });
            }
            if (playData.playerWon) {
              // Find the winner player info - prefer playerName from server, fallback to local lookup
              console.log('Player won, looking for player:', playData.playerId, 'in players:', currentState.players, 'playerName from server:', playData.playerName);
              const winnerPlayer = currentState.players?.find(p => p.id === playData.playerId);
              console.log('Found winnerPlayer:', winnerPlayer);
              // Use server-provided name if available, otherwise use local player name
              const winnerName = playData.playerName || winnerPlayer?.name || '未知玩家';
              const winnerPayload = {
                id: playData.playerId,
                name: winnerName,
                isHost: winnerPlayer?.isHost || false,
                position: winnerPlayer?.position
              };
              dispatch({ type: 'SET_WINNER', payload: winnerPayload });
              dispatch({ type: 'SET_GAME_STATE', payload: 'finished' });
              console.log('Player won:', playData.playerId, 'winnerPayload:', winnerPayload);
            }
          }
          break;

        case 'PASS_TURN':
          if (data.data) {
            const passData = data.data;
            // Set canPass from pass event
            if (passData.canPass !== undefined) {
              dispatch({ type: 'SET_CAN_PASS', payload: passData.canPass });
            }
            dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: passData.nextPlayerId || passData } });
            console.log('Player passed, next player:', passData.nextPlayerId || passData);
          }
          break;

        case 'GAME_END':
          dispatch({ type: 'SET_GAME_STATE', payload: 'finished' });
          console.log('Game ended, winner:', data.playerId);
          break;

        case 'NEXT_ROUND':
          console.log('Next round starting:', data.data);
          // Reset game state for new round
          dispatch({ type: 'SET_GAME_STATE', payload: 'bidding' });
          dispatch({ type: 'SET_CURRENT_CARDS', payload: [] });
          dispatch({ type: 'SET_LANDLORD', payload: null });
          dispatch({ type: 'SET_LANDLORD_CARDS', payload: [] });
          dispatch({ type: 'CLEAR_SELECTED_CARDS' });
          dispatch({ type: 'SET_CAN_PASS', payload: true });
          break;

        case 'PLAYER_DISCONNECT':
          console.log('Player disconnected or error:', data.playerId, data.data);
          // 如果有错误消息，显示错误提示
          if (data.data) {
            showToastRef?.current?.(data.data, 'error');
            // 如果是加入游戏失败，返回房间界面
            if (data.data.includes('Error joining game')) {
              onGameStart && onGameStart();
            }
          }
          break;

        case 'GAME_DESTROYED':
          // 房间被解散（房主离开或所有玩家离开）
          console.log('Game destroyed:', data.data);
          showToastRef?.current?.(data.data || '房间已解散', 'error');
          ConnectionManager.disconnect();
          window.dispatchEvent(new Event('returnToRoomManager'));
          onGameStart && onGameStart();
          break;

        case 'ERROR':
          // 后端返回的错误消息
          console.log('Error from server:', data.data);
          if (data.data) {
            showToastRef?.current?.(String(data.data), 'error');
            // 如果是加入游戏失败，返回房间界面
            if (String(data.data).includes('Error joining game')) {
              onGameStart && onGameStart();
            }
          }
          break;

        case 'PLAYER_RECONNECT':
          console.log('Player reconnected:', data.playerId, data.data);
          break;

        case 'TURN_START':
          // Set current player and turn start time for countdown
          if (data.playerId) {
            dispatch({ type: 'SET_CURRENT_PLAYER', payload: { id: data.playerId } });
            // Set turn start time to current timestamp
            dispatch({ type: 'SET_TURN_START_TIME', payload: Date.now() });
            console.log('Turn started for player:', data.playerId);
          }
          break;

        case 'PLAYER_LEAVE':
          // 处理玩家离开房间的错误（如游戏中无法离开）
          if (data.data && typeof data.data === 'string') {
            console.log('Player leave error:', data.data);
            showToastRef?.current?.(data.data, 'error');
          }
          break;

        case 'PLAYER_OFFLINE':
          // 处理玩家离线事件
          console.log('Player offline:', data.data);
          if (data.data && data.data.playerId) {
            dispatch({
              type: 'SET_PLAYER_OFFLINE',
              payload: {
                playerId: data.data.playerId,
                isOffline: data.data.isOffline
              }
            });
            showToastRef?.current?.(`${data.data.playerName || '玩家'} 已离线`, 'info');
          }
          break;

        default:
          break;
      }
    };

    ConnectionManager.addMessageListener(handleMessage);

    return () => {
      ConnectionManager.removeMessageListener(handleMessage);
    };
  }, [dispatch, onGameStart, onGameJoined, showToastRef]);

  return null;
};

// Screen shake effect component - reads from GameContext
const ScreenShakeEffect = () => {
  const { state } = useGame();

  if (!state.screenShake || !state.screenShake.active) {
    return null;
  }

  return (
    <>
      <ScreenShakeWrapper $isJoker={state.screenShake.isJoker} />
      <FlashOverlay $isJoker={state.screenShake.isJoker} />
    </>
  );
};

// Connection initializer - ensures WebSocket stays connected across routes
function ConnectionInitializer() {
  const { dispatch } = useGame();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (ConnectionManager.isConnected()) {
      initialized.current = true;
      return;
    }

    let playerId = localStorage.getItem("doudizhu_playerId");
    if (!playerId) {
      playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("doudizhu_playerId", playerId);
    }
    dispatch({ type: 'SET_MY_PLAYER_ID', payload: playerId });

    ConnectionManager.connect(
      playerId,
      () => {
        console.log('App-level: Connected to server');
        initialized.current = true;
      },
      (error) => {
        console.error('App-level: Connection error:', error);
      }
    );
  }, [dispatch]);

  return null;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  // Toast ref that GamePage sets on mount - used by MessageHandler
  // Toast ref that GamePage sets on mount - used by MessageHandler
  const toastRef = useRef(null);

  const handleGameStart = useCallback(() => {
    if (window.location.pathname !== '/room' && window.location.pathname !== '/') {
      window.location.href = '/room';
    }
  }, []);

  const handleGameJoined = useCallback(() => {
    if (window.location.pathname !== '/game') {
      window.location.href = '/game';
    }
  }, []);

  const initialGameState = {
    players: [],
    currentPlayer: null,
    currentCards: [],
    gameState: 'waiting',
    landlordId: null,
    landlordCards: [],
    round: 1,
    scores: {},
    myPlayerId: null,
    handCards: [],
    selectedCards: [],
    playerCardCounts: {},
    currentEffect: null
  };

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get('auth/check');
        if (response.data.loggedIn) {
          setUserInfo({
            userId: response.data.userId,
            username: response.data.username,
            nickname: response.data.nickname,
            score: response.data.score
          });
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLoginSuccess = (user) => {
    setUserInfo(user);
    setIsLoggedIn(true);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingText>加载中...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <BrowserRouter>
      <GameProvider initialState={initialGameState}>
        <GlobalStyle />
        <OrientationLock />
        <ConnectionInitializer />
        <MessageHandler
          onGameStart={handleGameStart}
          onGameJoined={handleGameJoined}
          showToastRef={toastRef}
        />
        {isLoggedIn ? (
          <Routes>
            <Route path="/" element={<RoomManager userInfo={userInfo} />} />
            <Route path="/room" element={<RoomManager userInfo={userInfo} />} />
            <Route path="/game" element={<GamePage toastRef={toastRef} />} />
          </Routes>
        ) : (
          <Auth onLoginSuccess={handleLoginSuccess} />
        )}
      </GameProvider>
    </BrowserRouter>
  );
}

// Game page component
function GamePage({ toastRef }) {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Register toast ref so MessageHandler can use it
  useEffect(() => {
    if (toastRef) {
      toastRef.current = showToast;
    }
    return () => {
      if (toastRef) {
        toastRef.current = null;
      }
    };
  }, [toastRef, showToast]);

  // Listen for connection status changes
  useEffect(() => {
    const handleConnectionChange = (status) => {
      setIsReconnecting(status === 'disconnected');
    };
    ConnectionManager.addConnectionListener(handleConnectionChange);
    return () => ConnectionManager.removeConnectionListener(handleConnectionChange);
  }, []);

  // Warn before leaving page during active game
  useEffect(() => {
    const handler = (e) => {
      if (state.gameState === 'playing' || state.gameState === 'bidding') {
        e.preventDefault();
        e.returnValue = '游戏正在进行中，确定要离开吗？';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.gameState]);

  // Handle leave room
  const handleLeaveRoom = () => {
    if (window.confirm('确定要退出房间吗？退出后其他人可以看到您已离线。')) {
      console.log('Leaving room...');
      ConnectionManager.leaveGame();
      ConnectionManager.disconnect();
      // Clear saved room info so we don't auto-rejoin
      localStorage.removeItem('doudizhu_roomId');
      localStorage.removeItem('doudizhu_gameId');
      localStorage.removeItem('doudizhu_playerName');
      // Reset game state
      dispatch({ type: 'SET_GAME_STATE', payload: 'waiting' });
      dispatch({ type: 'SET_PLAYERS', payload: [] });
      dispatch({ type: 'SET_HAND_CARDS', payload: [] });
      dispatch({ type: 'SET_CURRENT_CARDS', payload: [] });
      dispatch({ type: 'SET_LANDLORD', payload: null });
      dispatch({ type: 'SET_LANDLORD_CARDS', payload: [] });
      // Emit event to notify RoomManager to reconnect
      window.dispatchEvent(new Event('returnToRoomManager'));
      // Navigate to room page
      navigate('/room');
    }
  };

  return (
    <>
      <AppContainer>
        <ScreenShakeEffect />
        <GameBackground />
        <GameLayout>
          <TopBar>
            <GameInfo />
            <ExitButton onClick={handleLeaveRoom}>退出</ExitButton>
          </TopBar>

          <MainArea>
            <GameArea>
              <GameTable />
              <CardEffectDisplay />
            </GameArea>

            <SidePanel>
              <ChatPanel />
            </SidePanel>
          </MainArea>

          <BottomArea>
            <HandCardsArea>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <HandCardsLabel>您的手牌</HandCardsLabel>
                <BottomTimer />
              </div>
              <HandCardsList>
                <CardContent />
              </HandCardsList>
            </HandCardsArea>
            <ControlsArea>
              <GameControls onLeaveRoom={handleLeaveRoom} />
            </ControlsArea>
          </BottomArea>
        </GameLayout>
        <WinnerOverlayContent showToast={showToast} onShowRoomManager={() => navigate('/room')} />
        {isReconnecting && <ReconnectingToast>正在重连服务器...</ReconnectingToast>}
        {toast && (
          <ToastContainer>
            <Toast $type={toast.type}>
              <ToastIcon>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</ToastIcon>
              <ToastMessage>{toast.message}</ToastMessage>
            </Toast>
          </ToastContainer>
        )}
      </AppContainer>
    </>
  );
}

const ExitButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(235, 51, 73, 0.4);
  }
`;

const pulseAnim = keyframes`
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
`;

const ReconnectingToast = styled.div`
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(231, 76, 60, 0.9);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  animation: ${pulseAnim} 1s ease-in-out infinite;
`;

const LoadingContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
`;

const LoadingText = styled.div`
  color: white;
  font-size: 18px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

// Card content component
const CardContent = () => {
  const { state } = useGame();

  console.log('CardContent render, handCards:', state.handCards?.length, 'gameState:', state.gameState);

  if (!state.handCards || state.handCards.length === 0) {
    return (
      <PlaceholderText>
        {state.gameState === 'waiting' ? '等待游戏开始...' : '等待发牌...'}
      </PlaceholderText>
    );
  }

  return state.handCards.map((card, index) => (
    <HandCard key={`${card.suit}-${card.rank}-${index}`} $index={index}>
      <Card
        suit={card.suit}
        rank={card.rank}
        size="small"
        isFaceUp={true}
      />
    </HandCard>
  ));
};

// Bottom timer component for current player
const BottomTimer = () => {
  const { state } = useGame();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    console.log('BottomTimer effect:', { turnStartTime: state.turnStartTime, gameState: state.gameState, currentPlayer: state.currentPlayer?.id, myPlayerId: state.myPlayerId });
    const isMyTurn = state.currentPlayer?.id === state.myPlayerId;
    if (state.turnStartTime && state.gameState === 'playing' && isMyTurn) {
      const startTime = state.turnStartTime;
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setTimeLeft(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
    }
  }, [state.turnStartTime, state.gameState, state.currentPlayer, state.myPlayerId]);

  if (timeLeft <= 0) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginLeft: '10px'
    }}>
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="14" cy="14" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        <circle
          cx="14" cy="14" r="12"
          fill="none"
          stroke={timeLeft <= 5 ? '#e74c3c' : '#3498db'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 12}
          strokeDashoffset={2 * Math.PI * 12 * (1 - timeLeft / 30)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span style={{
        color: timeLeft <= 5 ? '#e74c3c' : 'white',
        fontWeight: 'bold',
        fontSize: '14px'
      }}>{timeLeft}</span>
    </div>
  );
};

const PlaceholderText = styled.div`
  color: rgba(255,255,255,0.4);
  font-size: 14px;
  padding: 20px;
  text-align: center;
  width: 100%;
`;

// Winner overlay content - uses useGame hook
const WinnerOverlayContent = ({ showToast, onShowRoomManager }) => {
  const { state, dispatch } = useGame();

  window.WINNER_DEBUG = state; // Debug: expose state to window

  console.log('WinnerOverlayContent render, gameState:', state.gameState, 'winner:', state.winner, 'players:', state.players, 'myPlayerId:', state.myPlayerId);

  if (state.gameState !== 'finished' || !state.winner) {
    console.log('WinnerOverlayContent: not rendering because gameState:', state.gameState, 'winner:', state.winner);
    return null;
  }

  const isLandlord = state.landlordId === state.winner.id;
  // Use ConnectionManager to get current player ID for isHost check
  const currentPlayerId = ConnectionManager.getPlayerId();
  const isHost = state.players?.some(p => p.id === currentPlayerId && p.isHost);
  console.log('isHost calculation:', { currentPlayerId, players: state.players, isHost });

  const handleNextRound = () => {
    const gameId = ConnectionManager.getGameId();
    console.log('Next round clicked, gameId:', gameId, 'playerId:', ConnectionManager.getPlayerId());
    showToast('正在发起下一局...', 'info');
    ConnectionManager.startNextRound();
  };

  const handleClose = () => {
    console.log('Winner overlay closed');
    // Clear winner to hide the overlay
    dispatch({ type: 'SET_WINNER', payload: null });
  };

  const handleLeaveRoom = () => {
    console.log('Leave room clicked from WinnerDisplay');
    // 调用后端离开房间
    ConnectionManager.leaveGame();
    // 断开 WebSocket 连接
    ConnectionManager.disconnect();
    // 重置游戏状态并返回房间等待界面
    dispatch({ type: 'SET_WINNER', payload: null });
    dispatch({ type: 'SET_GAME_STATE', payload: 'waiting' });
    dispatch({ type: 'SET_PLAYERS', payload: [] });
    dispatch({ type: 'SET_HAND_CARDS', payload: [] });
    dispatch({ type: 'SET_CURRENT_CARDS', payload: [] });
    dispatch({ type: 'SET_LANDLORD', payload: null });
    dispatch({ type: 'SET_LANDLORD_CARDS', payload: [] });
    // 触发返回房间界面事件
    window.dispatchEvent(new Event('returnToRoomManager'));
    // 触发返回房间界面
    onShowRoomManager && onShowRoomManager();
  };

  return (
    <WinnerDisplay
      winner={state.winner}
      isLandlord={isLandlord}
      isHost={isHost}
      onNextRound={handleNextRound}
      onClose={handleClose}
      onLeaveRoom={handleLeaveRoom}
    />
  );
};

// Card type effect display component
const CardEffectDisplay = () => {
  const { state } = useGame();

  if (!state.currentEffect) {
    return null;
  }

  const effect = state.currentEffect;
  const isJoker = effect.type === 'JOKER_BOMB';
  const effectName = CARD_TYPE_NAMES[effect.type] || effect.type;

  return (
    <EffectContainer>
      <BombEffect $isJoker={isJoker}>
        <EffectLabel $type={effect.type} $isJoker={isJoker}>
          {effectName}
        </EffectLabel>
      </BombEffect>
    </EffectContainer>
  );
};

export default App;
