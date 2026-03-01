import React, { useState, useEffect } from 'react';
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
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => {
    if (props.$isLandlord) return '#e74c3c';
    if (props.$isFarmer) return '#27ae60';
    if (props.$isPlaying) return '#2ecc71';
    return '#95a5a6';
  }};
  color: white;
`;

const TimerContainer = styled.div`
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TimerCircle = styled.svg`
  transform: rotate(-90deg);
`;

const TimerBackground = styled.circle`
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 3;
`;

const TimerProgress = styled.circle`
  fill: none;
  stroke: ${props => props.$timeLeft <= 5 ? '#e74c3c' : '#3498db'};
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear, stroke 0.3s;
`;

const TimerText = styled.span`
  position: absolute;
  font-size: 12px;
  font-weight: bold;
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

// Timer component for countdown
const PlayerTimer = ({ timeLeft, maxTime = 30 }) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / maxTime) * circumference;
  const strokeDashoffset = circumference - progress;

  if (timeLeft <= 0 || timeLeft > maxTime) {
    return null;
  }

  return (
    <TimerContainer>
      <TimerCircle width="32" height="32" viewBox="0 0 32 32">
        <TimerBackground cx="16" cy="16" r={radius} />
        <TimerProgress
          cx="16"
          cy="16"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          $timeLeft={timeLeft}
        />
      </TimerCircle>
      <TimerText>{timeLeft}</TimerText>
    </TimerContainer>
  );
};

const PlayerPanel = ({ position = 'bottom' }) => {
  const { state } = useGame();

  // Determine which player to show based on position
  let player = null;
  let playerCardCount = 0;
  let isCurrentPlayer = false;
  if (position === 'bottom') {
    // Current player (human player)
    player = state.players.find(p => p.id === state.myPlayerId) || {};
    playerCardCount = state.handCards ? state.handCards.length : 0;
    isCurrentPlayer = state.currentPlayer?.id === state.myPlayerId;
  } else if (position === 'right') {
    // Right player (could be AI or another human)
    player = state.players[1] || {};
    // Get card count from state
    if (player && player.id && state.playerCardCounts) {
      playerCardCount = state.playerCardCounts[player.id] || 0;
    }
    isCurrentPlayer = state.currentPlayer?.id === player?.id;
  }

  // Calculate time left for current player (visible to all players)
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    console.log('Timer effect:', { turnStartTime: state.turnStartTime, isCurrentPlayer, gameState: state.gameState });
    if (state.turnStartTime) {
      const startTime = state.turnStartTime;
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        console.log('Timer update:', { elapsed, remaining, startTime, now: Date.now() });
        setTimeLeft(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
    }
  }, [state.turnStartTime, isCurrentPlayer, state.gameState]);

  // Determine player roles
  const isLandlord = player?.isLandlord;
  const isFarmer = !isLandlord && state.landlordId && player?.id && player.id !== state.landlordId;

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
        <PlayerStatus>
          {isLandlord && <StatusBadge $isLandlord>地主</StatusBadge>}
          {isFarmer && <StatusBadge $isFarmer>农民</StatusBadge>}
          {!isLandlord && !isFarmer && (
            <StatusBadge $isPlaying={player.isActive}>
              {player.isActive ? '进行中' : '等待中'}
            </StatusBadge>
          )}
          {isCurrentPlayer && state.gameState === 'playing' && (
            <PlayerTimer timeLeft={timeLeft} />
          )}
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
