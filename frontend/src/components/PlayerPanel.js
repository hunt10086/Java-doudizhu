import React from 'react';
import styled from 'styled-components';
import Card from './Card';
import { useGame } from '../contexts/GameContext';

const PanelContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 250px;

  ${({ $position }) => $position === 'right' && `
    height: 300px;
  `}

  ${({ $position }) => $position === 'bottom' && `
    flex: 1;
  `}
`;

const PlayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
`;

const PlayerName = styled.div`
  font-weight: bold;
  color: white;
  font-size: 16px;
`;

const PlayerStatus = styled.div`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => props.$isPlaying ? '#2ecc71' : '#95a5a6'};
  color: white;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  overflow-y: auto;
  max-height: 200px;
`;

const PlaceholderText = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  text-align: center;
  padding: 20px 0;
`;

const PlayerPanel = ({ position = 'bottom' }) => {
  const { state } = useGame();

  // Determine which player to show based on position
  let player = null;
  let playerCardCount = 0;
  if (position === 'bottom') {
    // Current player (human player)
    player = state.players.find(p => p.id === state.myPlayerId) || {};
    playerCardCount = state.handCards ? state.handCards.length : 0;
  } else if (position === 'right') {
    // Right player (could be AI or another human)
    player = state.players[1] || {};
    // Get card count from state
    if (player && player.id && state.playerCardCounts) {
      playerCardCount = state.playerCardCounts[player.id] || 0;
    }
  }

  // If no specific player found, show placeholder
  if (!player || Object.keys(player).length === 0) {
    return (
      <PanelContainer $position={position}>
        <PlayerHeader>
          <PlayerName>{position === 'bottom' ? '您' : '玩家 2'}</PlayerName>
          <PlayerStatus $isPlaying={false}>等待中</PlayerStatus>
        </PlayerHeader>
        <PlaceholderText>
          {position === 'bottom' ? '您的手牌将显示在这里' : '对手的手牌数将显示在这里'}
        </PlaceholderText>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer $position={position}>
      <PlayerHeader>
        <PlayerName>{player.name || (position === 'bottom' ? '您' : `玩家 ${player.position || 2}`)}</PlayerName>
        <PlayerStatus $isPlaying={player.isActive}>
          {player.isLandlord ? '地主' : player.isActive ? '进行中' : '等待中'}
        </PlayerStatus>
      </PlayerHeader>

      {position === 'bottom' ? (
        // Show actual cards for the human player
        <CardsContainer>
          {state.handCards && state.handCards.length > 0 ? (
            state.handCards.map((card, index) => (
              <Card
                key={`${card.suit}-${card.rank}-${index}`}
                suit={card.suit}
                rank={card.rank}
                size="small"
                isFaceUp={true}
              />
            ))
          ) : (
            <PlaceholderText>等待发牌...</PlaceholderText>
          )}
        </CardsContainer>
      ) : (
        // Show number of cards for other players
        <CardsContainer>
          {playerCardCount > 0 ? (
            Array.from({ length: playerCardCount }).map((_, index) => (
              <Card
                key={`opponent-card-${index}`}
                suit="back"
                rank=""
                isFaceUp={false}
              />
            ))
          ) : (
            <PlaceholderText>等待发牌...</PlaceholderText>
          )}
        </CardsContainer>
      )}
    </PanelContainer>
  );
};

export default PlayerPanel;