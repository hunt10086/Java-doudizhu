import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import GameTable from './components/GameTable';
import PlayerPanel from './components/PlayerPanel';
import GameControls from './components/GameControls';
import ChatPanel from './components/ChatPanel';
import GameInfo from './components/GameInfo';
import Card from './components/Card';
import ConnectionManager from './services/ConnectionManager';
import { GameProvider, useGame } from './contexts/GameContext';
import RoomManager from './components/RoomManager';
import Auth from './components/Auth';
import axios from './utils/axiosConfig';

// Global styles
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
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
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(120, 0, 255, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(0, 200, 255, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }
`;

// Game layout - Full screen game area
const GameLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 8px;
  gap: 8px;
  position: relative;
  z-index: 1;
`;

// Top bar with game info
const TopBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
`;

// Main game area - flex to take remaining space
const MainArea = styled.div`
  display: flex;
  flex: 1;
  gap: 8px;
  min-height: 0;
  overflow: hidden;
`;

// Left side - Game table
const GameArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  animation: ${fadeIn} 0.5s ease-out;
`;

// Right side - Info panel
const SidePanel = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
`;

// Opponent panel (top)
const OpponentArea = styled.div`
  flex: 0 0 auto;
  min-height: 80px;
`;

// Bottom area - Hand cards and controls
const BottomArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  animation: ${fadeIn} 0.6s ease-out;
`;

// Hand cards container
const HandCardsSection = styled.div`
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
  border-radius: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  min-height: 70px;
  display: flex;
  flex-direction: column;
`;

const HandCardsLabel = styled.div`
  color: rgba(255,255,255,0.6);
  font-size: 10px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const HandCardsWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: nowrap;
  gap: 2px;
  align-content: flex-start;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 2px;
  min-height: 50px;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
  }
`;

// Controls section
const ControlsSection = styled.div`
  flex-shrink: 0;
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
          // New format: data contains { targetPlayerId, cards }
          if (data.data && data.data.targetPlayerId === currentPlayerId && data.data.cards) {
            console.log('Setting hand cards for player:', currentPlayerId, 'cards count:', data.data.cards.length);
            dispatch({ type: 'SET_HAND_CARDS', payload: data.data.cards });
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
              dispatch({ type: 'SET_GAME_STATE', payload: 'finished' });
              console.log('Player won:', playData.playerId);
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
          dispatch({ type: 'CLEAR_SELECTED_CARDS' });
          dispatch({ type: 'SET_CAN_PASS', payload: true });
          break;

        case 'PLAYER_DISCONNECT':
          console.log('Player disconnected:', data.playerId);
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRoomManager, setShowRoomManager] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const initialGameState = {
    players: [],
    currentPlayer: null,
    currentCards: [],
    gameState: 'waiting',
    landlordId: null,
    round: 1,
    scores: {},
    myPlayerId: null,
    handCards: [],
    selectedCards: [],
    playerCardCounts: {}
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
              <HandCardsSection>
                <HandCardsLabel>您的手牌</HandCardsLabel>
                <HandCardsWrapper>
                  <CardContent />
                </HandCardsWrapper>
              </HandCardsSection>
              <ControlsSection>
                <GameControls />
              </ControlsSection>
            </BottomArea>
          </GameLayout>
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

const PlaceholderText = styled.div`
  color: rgba(255,255,255,0.4);
  font-size: 14px;
  padding: 20px;
  text-align: center;
  width: 100%;
`;

export default App;
