// Winner display component
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  WinnerOverlay,
  WinnerBox,
  WinnerTitle,
  WinnerName,
  WinnerSubtitle,
  ConfettiContainer,
  ConfettiPiece,
  generateConfetti
} from './GameEffects';

const WinnerDisplay = ({ winner, isLandlord, onNextRound, isHost }) => {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    setConfetti(generateConfetti(60));
  }, []);

  const winnerName = winner?.name || '未知玩家';

  return (
    <>
      <ConfettiContainer>
        {confetti.map(piece => (
          <ConfettiPiece
            key={piece.id}
            $color={piece.color}
            $duration={piece.duration}
            $delay={piece.delay}
            $rotation={piece.rotation}
            style={{ left: `${piece.left}%` }}
          />
        ))}
      </ConfettiContainer>
      <WinnerOverlay>
        <WinnerBox $isLandlord={isLandlord}>
          <WinnerTitle>游戏结束</WinnerTitle>
          <WinnerName $isLandlord={isLandlord}>
            {winnerName}
          </WinnerName>
          <WinnerSubtitle>
            {isLandlord ? '地主获胜!' : '农民获胜!'}
          </WinnerSubtitle>
          {isHost && (
            <NextRoundButton onClick={onNextRound}>
              再来一局
            </NextRoundButton>
          )}
          {!isHost && (
            <WaitText>等待房主开始下一局...</WaitText>
          )}
        </WinnerBox>
      </WinnerOverlay>
    </>
  );
};

const NextRoundButton = styled.button`
  margin-top: 30px;
  padding: 15px 50px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 20px rgba(56, 239, 125, 0.4);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(56, 239, 125, 0.6);
  }

  &:active {
    transform: translateY(0);
  }
`;

const WaitText = styled.div`
  margin-top: 30px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
`;

export default WinnerDisplay;
