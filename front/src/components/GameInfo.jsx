import React from 'react';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';
import ConnectionManager from '../services/ConnectionManager';

const InfoContainer = styled.div`
  background: rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  color: #2c3e50;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 10px;
    border-radius: 8px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    padding: 5px 10px;
    border-radius: 6px;
  }
`;

const GameStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  @media (max-width: 768px) {
    gap: 10px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    gap: 6px;
  }
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatusValue = styled.div`
  font-size: 24px;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 18px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    font-size: 14px;
  }
`;

const StatusLabel = styled.div`
  font-size: 12px;
  opacity: 0.8;

  @media (max-width: 768px) {
    font-size: 10px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    font-size: 8px;
  }
`;

const GameInfo = () => {
  const { state } = useGame();

  // Get room ID from ConnectionManager
  const gameId = ConnectionManager.getGameId() || '未加入';

  // Map game state to display text
  const getGameStateText = () => {
    switch (state.gameState) {
      case 'waiting': return '等待中';
      case 'bidding': return '叫地主';
      case 'playing': return '游戏中';
      case 'finished': return '已结束';
      default: return '等待中';
    }
  };

  return (
    <InfoContainer>
      <GameStatus>
        <StatusItem>
          <StatusValue>{state.round || 1}</StatusValue>
          <StatusLabel>回合</StatusLabel>
        </StatusItem>

        <StatusItem>
          <StatusValue>{getGameStateText()}</StatusValue>
          <StatusLabel>状态</StatusLabel>
        </StatusItem>

        <StatusItem>
          <StatusValue>
            {state.players.length}/3
          </StatusValue>
          <StatusLabel>玩家</StatusLabel>
        </StatusItem>
      </GameStatus>

      <div style={{ textAlign: 'right' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>斗地主游戏</h3>
        <p style={{ margin: '0', fontSize: '12px', opacity: 0.8 }}>
          当前房间: #{gameId}
        </p>
      </div>
    </InfoContainer>
  );
};

export default GameInfo;
