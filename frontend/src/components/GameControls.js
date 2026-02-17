import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';
import connectionManager from '../services/ConnectionManager';

const ControlsContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
`;

const ControlButton = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${props => props.$disabled ? 0.4 : 1};
  pointer-events: ${props => props.$disabled ? 'none' : 'auto'};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover:not(:disabled)::before {
    opacity: 1;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  ${props => props.$variant === 'primary' && `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
  `}

  ${props => props.$variant === 'success' && `
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(56, 239, 125, 0.3);
  `}

  ${props => props.$variant === 'danger' && `
    background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(235, 51, 73, 0.3);
  `}

  ${props => props.$variant === 'warning' && `
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(245, 87, 108, 0.3);
  `}

  ${props => props.$variant === 'secondary' && `
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
    color: white;
    border: 1px solid rgba(255,255,255,0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
    }
  `}
`;

const WaitMessage = styled.div`
  flex: 1;
  text-align: center;
  padding: 10px 16px;
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const StatusMessage = styled.div`
  position: fixed;
  top: 60px;
  left: 10px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f39c12;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

const GameControls = () => {
  const { state, dispatch } = useGame();

  // Get my player ID from connection manager (more reliable)
  const [myId, setMyId] = useState(connectionManager.getPlayerId());

  useEffect(() => {
    // Update myId when it changes
    const id = connectionManager.getPlayerId();
    if (id !== myId) {
      setMyId(id);
    }
  }, []);

  // Use state.myPlayerId if available, otherwise use connectionManager
  const actualMyPlayerId = state.myPlayerId || myId;

  const currentPlayerId = state.currentPlayer?.id;

  // Debug log
  console.log('GameControls render:', {
    gameState: state.gameState,
    currentPlayerId: currentPlayerId,
    myPlayerId: actualMyPlayerId,
    stateMyPlayerId: state.myPlayerId,
    connectionMyId: myId,
    players: state.players?.map(p => p.id)
  });

  const isCurrentPlayerTurn = currentPlayerId === actualMyPlayerId;

  const canPlayCards = isCurrentPlayerTurn && state.selectedCards.length > 0;
  // Can only pass if canPass is true (not the first player and not after table cleared)
  const canPass = isCurrentPlayerTurn && state.canPass !== false;

  // Check if current user is host
  const isHost = state.players?.some(p => p.id === actualMyPlayerId && p.isHost);

  const showBidControls = state.gameState === 'bidding' && isCurrentPlayerTurn;
  // Show play controls when game is in playing state - always show if it's current player's turn
  const showPlayControls = state.gameState === 'playing' && isCurrentPlayerTurn;
  // Show waiting message if game is active (not waiting, not finished) and it's not current player's turn
  const showWaitingMessage = (state.gameState === 'playing' || state.gameState === 'bidding') && !isCurrentPlayerTurn && currentPlayerId;

  // Handle next round
  const handleNextRound = () => {
    console.log('Starting next round...');
    connectionManager.startNextRound();
  };

  // Get the current player name
  const currentPlayerName = currentPlayerId
    ? state.players?.find(p => p.id === currentPlayerId)?.name || '未知玩家'
    : '';

  const handlePlayCards = () => {
    if (state.selectedCards.length === 0) return;

    const cardsToPlay = state.selectedCards.map(card => {
      const suit = card.suit;
      const rank = card.rank;
      return suit && rank ? { suit, rank } : null;
    }).filter(c => c !== null);

    if (cardsToPlay.length > 0) {
      console.log('Playing cards:', cardsToPlay);
      connectionManager.playCards(cardsToPlay);
      dispatch({ type: 'CLEAR_SELECTED_CARDS' });
    }
  };

  const handlePass = () => {
    console.log('Player passed');
    connectionManager.passTurn();
  };

  const handleSelectAll = () => {
    dispatch({ type: 'SET_SELECTED_CARDS', payload: [...state.handCards] });
  };

  const handleClearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTED_CARDS' });
  };

  const handleBid = (bid) => {
    console.log('Bid:', bid, 'myPlayerId:', actualMyPlayerId);
    connectionManager.submitBid(bid);
  };

  return (
    <>
      {showWaitingMessage && (
        <StatusMessage>
          等待 {currentPlayerName} 出牌...
        </StatusMessage>
      )}
      <ControlsContainer>
        {showBidControls && (
        <>
          <ControlButton
            $variant="success"
            onClick={() => handleBid(true)}
          >
            叫地主
          </ControlButton>
          <ControlButton
            $variant="secondary"
            onClick={() => handleBid(false)}
          >
            不叫
          </ControlButton>
        </>
        )}

        {showPlayControls && (
        <>
          <ControlButton
            $variant="secondary"
            onClick={handleSelectAll}
          >
            全选
          </ControlButton>

          <ControlButton
            $variant="secondary"
            onClick={handleClearSelection}
          >
            清除
          </ControlButton>

          <ControlButton
            $variant="success"
            onClick={handlePlayCards}
            $disabled={!canPlayCards}
          >
            出牌
          </ControlButton>

          <ControlButton
            $variant="warning"
            onClick={handlePass}
            $disabled={!canPass}
          >
            不要
          </ControlButton>
        </>
        )}

        {!showBidControls && !showPlayControls && state.gameState === 'waiting' && (
          <WaitMessage>
            等待游戏开始...
          </WaitMessage>
        )}

        {!showBidControls && !showPlayControls && state.gameState === 'finished' && (
          <>
            {isHost ? (
              <ControlButton
                $variant="primary"
                onClick={handleNextRound}
              >
                再来一局
              </ControlButton>
            ) : (
              <WaitMessage>
                等待房主开始下一局...
              </WaitMessage>
            )}
          </>
        )}
      </ControlsContainer>
    </>
  );
};

export default GameControls;
