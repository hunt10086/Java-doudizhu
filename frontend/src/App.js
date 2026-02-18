import React, { useState, useEffect } from 'react';
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
import axios from './utils/axiosConfig';
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
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
`;

// Top bar with game info
const TopBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;

  @media (max-height: 500px) and (orientation: landscape) {
    height: 25px;
  }
`;

// Main game area - flex to take remaining space
const MainArea = styled.div`
  display: flex;
  flex: 1;
  gap: 10px;
  min-height: 0;
  overflow: hidden;

  @media (max-height: 500px) and (orientation: landscape) {
    flex: 0.8;
    gap: 4px;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    flex: 0.7;
    min-width: 35%;
  }
`;

// Left side - Game table
const GameArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-height: 500px) and (orientation: landscape) {
    min-height: 0;
  }
`;

// Right side - Info panel
const SidePanel = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: none;
  }

  @media (max-height: 500px) and (orientation: landscape) {
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
  min-height: 0;
  overflow: hidden;

  @media (max-height: 500px) and (orientation: landscape) {
    flex: 1;
    min-width: 65%;
    max-width: 75%;
    gap: 3px;
    min-height: 100px;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    flex: 1;
    min-width: 70%;
    gap: 2px;
    min-height: 90px;
  }
`;

// Card component styled for hand
const HandCard = styled.div`
  animation: ${cardDeal} 0.3s ease-out;
  animation-delay: ${props => props.$index * 0.05}s;
  animation-fill-mode: both;
`;

// Message handler component
const MessageHandler = ({ onGameStart }) => {
  const { state, dispatch } = useGame();

  useEffect(() => {
    const handleMessage = (data) => {
      // Get current playerId from ConnectionManager
      const currentPlayerId = ConnectionManager.getPlayerId();
      console.log('Received game event:', data, 'myPlayerId:', currentPlayerId);

      switch (data.type) {
        case 'PLAYER_JOIN':
          if (data.data && data.data.id) {
            console.log('Player joined:', data.data);
            // Add player to state if not already present
            const existingPlayer = state.players?.find(p => p.id === data.data.id);
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
          }
          if (data.data && !data.data.roomId) {
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
              console.log('Player won, looking for player:', playData.playerId, 'in players:', state.players, 'playerName from server:', playData.playerName);
              const winnerPlayer = state.players?.find(p => p.id === playData.playerId);
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
          console.log('Player disconnected:', data.playerId);
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

        default:
          break;
      }
    };

    ConnectionManager.addMessageListener(handleMessage);

    return () => {
      ConnectionManager.removeMessageListener(handleMessage);
    };
  }, [dispatch, onGameStart]);

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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRoomManager, setShowRoomManager] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    currentEffect: null  // For displaying card type effects
  };

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get('/api/auth/check');
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

  return (
    <GameProvider initialState={initialGameState}>
      <GlobalStyle />
      <OrientationLock />
      <MessageHandler />
      {loading ? (
        <LoadingContainer>
          <LoadingText>加载中...</LoadingText>
        </LoadingContainer>
      ) : !isLoggedIn ? (
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : showRoomManager ? (
        <RoomManager
          onGameStart={() => setShowRoomManager(false)}
          userInfo={userInfo}
        />
      ) : (
        <AppContainer>
          <ScreenShakeEffect />
          <GameBackground />
          <GameLayout>
            <TopBar>
              <GameInfo />
            </TopBar>

            <MainArea>
              <GameArea>
                <GameTable />
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
                <GameControls />
              </ControlsArea>
            </BottomArea>
          </GameLayout>
          <CardEffectDisplay />
          <WinnerOverlayContent showToast={showToast} />
          {toast && (
            <ToastContainer>
              <Toast $type={toast.type}>
                <ToastIcon>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</ToastIcon>
                <ToastMessage>{toast.message}</ToastMessage>
              </Toast>
            </ToastContainer>
          )}
        </AppContainer>
      )}
    </GameProvider>
  );
}

const LoadingContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
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
const WinnerOverlayContent = ({ showToast }) => {
  const { state } = useGame();

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

  return (
    <WinnerDisplay
      winner={state.winner}
      isLandlord={isLandlord}
      isHost={isHost}
      onNextRound={handleNextRound}
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
