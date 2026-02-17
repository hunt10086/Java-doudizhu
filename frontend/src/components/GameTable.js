import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Card from './Card';
import { useGame } from '../contexts/GameContext';
import playerAvatar from '../../ava.jpg';

const TableContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  min-height: 300px;
`;

const PlayerSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 150px;
`;

const PlayerCard = styled.div`
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  backdrop-filter: blur(5px);
`;

const PlayerAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid ${props => props.$isCurrent ? '#4ecdc4' : 'rgba(255,255,255,0.3)'};
  box-shadow: ${props => props.$isCurrent ? '0 0 15px rgba(78,205,196,0.5)' : '0 2px 8px rgba(0,0,0,0.3)'};
  object-fit: cover;
`;

const PlayerName = styled.div`
  font-size: 14px;
  font-weight: ${props => props.$isCurrent ? 'bold' : 'normal'};
  color: ${props => props.$isCurrent ? '#4ecdc4' : 'rgba(255,255,255,0.9)'};
  text-shadow: ${props => props.$isCurrent ? '0 0 10px #4ecdc4' : '0 1px 3px rgba(0,0,0,0.5)'};
  transition: all 0.3s ease;
`;

const PlayerCards = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  min-height: 80px;
`;

const CardCount = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.5);
`;

const CenterArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 0 40px;
`;

const PlayedCardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  min-height: 100px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 300px;
`;

const StatusText = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
`;

const LandlordBadge = styled.div`
  font-size: 12px;
  color: #ff6b6b;
  font-weight: bold;
`;

const GameTable = () => {
  const { state } = useGame();
  const [centerCards, setCenterCards] = useState([]);

  useEffect(() => {
    if (state.currentCards && state.currentCards.length > 0) {
      setCenterCards(state.currentCards);
    } else {
      setCenterCards([]);
    }
  }, [state.currentCards]);

  // Get my player index to determine positions
  const getMyPlayerIndex = () => {
    if (!state.players || !state.myPlayerId) return 0;
    return state.players.findIndex(p => p.id === state.myPlayerId);
  };

  const myIndex = getMyPlayerIndex();

  // Get players in positions: left = previous, right = next
  // My position is always at bottom (not shown in this component)
  const getLeftPlayer = () => {
    if (!state.players || state.players.length === 0) return null;
    const leftIndex = (myIndex + 2) % 3; // Previous player
    return state.players[leftIndex] || null;
  };

  const getRightPlayer = () => {
    if (!state.players || state.players.length === 0) return null;
    const rightIndex = (myIndex + 1) % 3; // Next player
    return state.players[rightIndex] || null;
  };

  // Check if a player is the current player
  const isCurrentPlayer = (playerId) => {
    return state.currentPlayer?.id === playerId;
  };

  // Check if a player is landlord
  const isLandlord = (playerId) => {
    return state.landlordId === playerId;
  };

  // Get card count for a player
  const getCardCount = (playerId) => {
    return state.playerCardCounts?.[playerId] || 0;
  };

  const leftPlayer = getLeftPlayer();
  const rightPlayer = getRightPlayer();

  return (
    <TableContainer>
      {/* Left player (上家) */}
      <PlayerSide>
        <PlayerCard>
          <PlayerAvatar
            src={playerAvatar}
            alt="头像"
            $isCurrent={leftPlayer && isCurrentPlayer(leftPlayer.id)}
          />
          <PlayerName $isCurrent={leftPlayer && isCurrentPlayer(leftPlayer.id)}>
            {leftPlayer?.name || '等待加入...'}
          </PlayerName>
          {leftPlayer && isLandlord(leftPlayer.id) && <LandlordBadge>地主</LandlordBadge>}
        </PlayerCard>
        <CardCount>{leftPlayer ? `${getCardCount(leftPlayer.id)}张牌` : ''}</CardCount>
      </PlayerSide>

      {/* Center area - played cards */}
      <CenterArea>
        <PlayedCardsContainer>
          {centerCards.length > 0 ? (
            centerCards.map((card, index) => (
              <Card
                key={`center-${card.suit}-${card.rank}-${index}`}
                suit={card.suit}
                rank={card.rank}
                size="normal"
                isFaceUp={true}
              />
            ))
          ) : (
            <StatusText>
              {state.gameState === 'bidding' ? '等待叫地主...' : '等待出牌...'}
            </StatusText>
          )}
        </PlayedCardsContainer>
      </CenterArea>

      {/* Right player (下家) */}
      <PlayerSide>
        <PlayerCard>
          <PlayerAvatar
            src={playerAvatar}
            alt="头像"
            $isCurrent={rightPlayer && isCurrentPlayer(rightPlayer.id)}
          />
          <PlayerName $isCurrent={rightPlayer && isCurrentPlayer(rightPlayer.id)}>
            {rightPlayer?.name || '等待加入...'}
          </PlayerName>
          {rightPlayer && isLandlord(rightPlayer.id) && <LandlordBadge>地主</LandlordBadge>}
        </PlayerCard>
        <CardCount>{rightPlayer ? `${getCardCount(rightPlayer.id)}张牌` : ''}</CardCount>
      </PlayerSide>
    </TableContainer>
  );
};

export default GameTable;
