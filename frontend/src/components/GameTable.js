import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Card from './Card';
import { useGame } from '../contexts/GameContext';
import playerAvatar from '../assets/ava.jpg';

const TableContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  min-height: 300px;

  @media (max-width: 768px) {
    padding: 10px 15px;
    min-height: 200px;
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    min-height: 150px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    padding: 5px 15px;
    min-height: 100px;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    padding: 3px 8px;
    min-height: 80px;
  }
`;

const PlayerSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 150px;

  @media (max-width: 768px) {
    width: 80px;
    gap: 5px;
  }

  @media (max-width: 480px) {
    width: 60px;
    gap: 3px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    width: 50px;
    gap: 2px;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    width: 45px;
    gap: 2px;
  }
`;

const PlayerCard = styled.div`
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid ${props => props.$isCurrent ? 'rgba(255,140,0,0.8)' : 'rgba(255,255,255,0.5)'};
  box-shadow: ${props => props.$isCurrent ? '0 0 15px rgba(255,140,0,0.4), 0 4px 15px rgba(0,0,0,0.1)' : '0 4px 15px rgba(0,0,0,0.1)'};
  backdrop-filter: blur(5px);

  @media (max-width: 768px) {
    padding: 5px;
    gap: 4px;
    border-radius: 8px;
  }

  @media (max-width: 480px) {
    padding: 3px;
    gap: 2px;
    border-radius: 6px;
  }
`;

const PlayerAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid ${props => props.$isCurrent ? '#ff8c00' : 'rgba(255,255,255,0.3)'};
  box-shadow: ${props => props.$isCurrent ? '0 0 15px rgba(255,140,0,0.6)' : '0 2px 8px rgba(0,0,0,0.3)'};
  object-fit: cover;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 480px) {
    width: 30px;
    height: 30px;
    border-width: 1px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    width: 28px;
    height: 28px;
    border-width: 1px;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    width: 24px;
    height: 24px;
  }
`;

const PlayerName = styled.div`
  font-size: 14px;
  font-weight: ${props => props.$isCurrent ? 'bold' : 'normal'};
  color: ${props => props.$isCurrent ? '#ff8c00' : 'rgba(255,255,255,0.9)'};
  text-shadow: ${props => props.$isCurrent ? '0 0 10px rgba(255,140,0,0.6)' : '0 1px 3px rgba(0,0,0,0.5)'};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    font-size: 11px;
  }

  @media (max-width: 480px) {
    font-size: 9px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 55px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    font-size: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 45px;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    font-size: 7px;
    max-width: 40px;
  }
`;

const CardCount = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.5);

  @media (max-width: 768px) {
    font-size: 10px;
  }

  @media (max-width: 480px) {
    font-size: 8px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    font-size: 7px;
  }

  @media (max-width: 480px) and (orientation: landscape) {
    font-size: 6px;
  }
`;

const CenterArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 0 40px;
  min-height: 0;

  @media (max-width: 768px) {
    padding: 0 15px;
    gap: 10px;
  }

  @media (max-width: 480px) {
    padding: 0 8px;
    gap: 6px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    padding: 0 10px;
    gap: 5px;
  }
`;

const PlayedCardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  min-height: 100px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  min-width: 300px;

  @media (max-width: 768px) {
    min-height: 60px;
    padding: 10px;
    min-width: 200px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    min-height: 40px;
    padding: 6px;
    min-width: 150px;
    border-radius: 8px;
    gap: 2px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    min-height: 40px;
    padding: 6px;
    min-width: 120px;
    border-radius: 6px;
    gap: 2px;
  }
`;

const StatusText = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    font-size: 10px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const LandlordBadge = styled.div`
  font-size: 12px;
  color: #ff6b6b;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 9px;
  }

  @media (max-width: 480px) {
    font-size: 7px;
  }
`;

const FarmerBadge = styled.div`
  font-size: 12px;
  color: #27ae60;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 9px;
  }

  @media (max-width: 480px) {
    font-size: 7px;
  }
`;

// Timer components
const TimerContainer = styled.div`
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
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
  font-size: 10px;
  font-weight: bold;
  color: white;
`;

// Timer component
const TableTimer = ({ timeLeft, maxTime = 30 }) => {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / maxTime) * circumference;
  const strokeDashoffset = circumference - progress;

  if (timeLeft <= 0 || timeLeft > maxTime) {
    return null;
  }

  return (
    <TimerContainer>
      <TimerCircle width="28" height="28" viewBox="0 0 28 28">
        <TimerBackground cx="14" cy="14" r={radius} />
        <TimerProgress
          cx="14"
          cy="14"
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

const LandlordCardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 25px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  border: 2px solid ${props => props.$isLandlord ? 'rgba(255, 107, 107, 0.8)' : 'rgba(255, 255, 255, 0.4)'};
  box-shadow: ${props => props.$isLandlord ? '0 0 20px rgba(255, 107, 107, 0.3)' : '0 4px 15px rgba(0,0,0,0.1)'};
  transition: all 0.3s ease;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 8px 12px;
    gap: 4px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    padding: 5px 8px;
    gap: 2px;
    border-radius: 8px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    padding: 8px 15px;
    gap: 3px;
    border-radius: 8px;
  }
`;

const LandlordCardsLabel = styled.div`
  font-size: 13px;
  color: ${props => props.$isLandlord ? '#ff6b6b' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: ${props => props.$isLandlord ? 'bold' : 'normal'};
  text-shadow: ${props => props.$isLandlord ? '0 0 10px rgba(255, 107, 107, 0.5)' : 'none'};
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 10px;
  }

  @media (max-width: 480px) {
    font-size: 8px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    font-size: 7px;
  }
`;

const LandlordCardsList = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 4px;
  }

  @media (max-width: 480px) {
    gap: 2px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    gap: 2px;
  }
`;

const SmallCardWrapper = styled.div`
  transform: scale(0.7);
  transform-origin: center;

  @media (max-width: 768px) {
    transform: scale(0.6);
  }

  @media (max-width: 480px) {
    transform: scale(0.5);
  }

  @media (max-height: 500px) and (orientation: landscape) {
    transform: scale(0.9);
  }
`;

const GameTable = () => {
  const { state } = useGame();
  const [centerCards, setCenterCards] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (state.currentCards && state.currentCards.length > 0) {
      setCenterCards(state.currentCards);
    } else {
      setCenterCards([]);
    }
  }, [state.currentCards]);

  // Timer effect
  useEffect(() => {
    console.log('GameTable Timer effect:', { turnStartTime: state.turnStartTime, gameState: state.gameState, currentPlayer: state.currentPlayer?.id });
    if (state.turnStartTime && state.gameState === 'playing') {
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
  }, [state.turnStartTime, state.gameState, state.currentPlayer]);

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

  // Check if a player is farmer (not landlord, but landlord is determined)
  const isFarmer = (playerId) => {
    return state.landlordId && playerId && playerId !== state.landlordId;
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
        <PlayerCard $isCurrent={leftPlayer && isCurrentPlayer(leftPlayer.id)}>
          <PlayerAvatar
            src={playerAvatar}
            alt="头像"
            $isCurrent={leftPlayer && isCurrentPlayer(leftPlayer.id)}
          />
          <PlayerName $isCurrent={leftPlayer && isCurrentPlayer(leftPlayer.id)}>
            {leftPlayer?.name || '等待加入...'}
          </PlayerName>
          {leftPlayer && isLandlord(leftPlayer.id) && <LandlordBadge>地主</LandlordBadge>}
          {leftPlayer && isFarmer(leftPlayer.id) && <FarmerBadge>农民</FarmerBadge>}
          {leftPlayer && isCurrentPlayer(leftPlayer.id) && state.gameState === 'playing' && (
            <TableTimer timeLeft={timeLeft} />
          )}
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

        {/* Landlord cards (底牌) - visible to all players */}
        {state.landlordCards && state.landlordCards.length > 0 && (
          <LandlordCardsContainer $isLandlord={isLandlord(state.myPlayerId)}>
            <LandlordCardsLabel $isLandlord={isLandlord(state.myPlayerId)}>
              {isLandlord(state.myPlayerId) ? '🎯 您的底牌' : '底牌'}
            </LandlordCardsLabel>
            <LandlordCardsList>
              {state.landlordCards.map((card, index) => (
                <SmallCardWrapper key={`landlord-${index}-${card.suit}-${card.rank}`}>
                  <Card
                    suit={card.suit}
                    rank={card.rank}
                    size="small"
                    isFaceUp={true}
                  />
                </SmallCardWrapper>
              ))}
            </LandlordCardsList>
          </LandlordCardsContainer>
        )}
      </CenterArea>

      {/* Right player (下家) */}
      <PlayerSide>
        <PlayerCard $isCurrent={rightPlayer && isCurrentPlayer(rightPlayer.id)}>
          <PlayerAvatar
            src={playerAvatar}
            alt="头像"
            $isCurrent={rightPlayer && isCurrentPlayer(rightPlayer.id)}
          />
          <PlayerName $isCurrent={rightPlayer && isCurrentPlayer(rightPlayer.id)}>
            {rightPlayer?.name || '等待加入...'}
          </PlayerName>
          {rightPlayer && isLandlord(rightPlayer.id) && <LandlordBadge>地主</LandlordBadge>}
          {rightPlayer && isFarmer(rightPlayer.id) && <FarmerBadge>农民</FarmerBadge>}
          {rightPlayer && isCurrentPlayer(rightPlayer.id) && state.gameState === 'playing' && (
            <TableTimer timeLeft={timeLeft} />
          )}
        </PlayerCard>
        <CardCount>{rightPlayer ? `${getCardCount(rightPlayer.id)}张牌` : ''}</CardCount>
      </PlayerSide>
    </TableContainer>
  );
};

export default GameTable;
