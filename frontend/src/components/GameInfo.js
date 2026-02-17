import React from 'react';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';

const InfoContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  color: white;
`;

const GameStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatusValue = styled.div`
  font-size: 24px;
  font-weight: bold;
`;

const StatusLabel = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

const GameInfo = () => {
  const { state } = useGame();

  return (
    <InfoContainer>
      <GameStatus>
        <StatusItem>
          <StatusValue>{state.round || 1}</StatusValue>
          <StatusLabel>回合</StatusLabel>
        </StatusItem>

        <StatusItem>
          <StatusValue>
            {state.gameState === 'waiting' ? '等待中' :
             state.gameState === 'playing' ? '游戏中' :
             state.gameState === 'finished' ? '已结束' : '未知'}
          </StatusValue>
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
          当前房间: Room #{Math.floor(Math.random() * 1000)}
        </p>
      </div>
    </InfoContainer>
  );
};

export default GameInfo;