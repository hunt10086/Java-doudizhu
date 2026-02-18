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

const WinnerDisplay = ({ winner, isLandlord, onNextRound, isHost, onClose }) => {
  const [confetti, setConfetti] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    setConfetti(generateConfetti(60));
    // Delay showing the overlay by 1 second
    const timer = setTimeout(() => {
      setShowOverlay(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const winnerName = winner?.name || '未知玩家';

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('WinnerDisplay button clicked, isHost:', isHost);
    if (onNextRound) {
      onNextRound();
    }
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  if (!showOverlay) {
    return null;
  }

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
      <WinnerOverlay onClick={handleClose}>
        <WinnerBox $isLandlord={isLandlord} onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={handleClose} title="关闭">×</CloseButton>
          <WinnerTitle>游戏结束</WinnerTitle>
          <WinnerName $isLandlord={isLandlord}>
            {winnerName}
          </WinnerName>
          <WinnerSubtitle>
            {isLandlord ? '地主获胜!' : '农民获胜!'}
          </WinnerSubtitle>
          {isHost && (
            <NextRoundButton
              onClick={handleClick}
              type="button"
            >
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

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1002;

  &:hover {
    background: rgba(255, 100, 100, 0.4);
    color: white;
  }

  @media (max-width: 480px) {
    top: 8px;
    right: 10px;
    width: 24px;
    height: 24px;
    font-size: 16px;
  }
`;

const NextRoundButton = styled.button`
  margin-top: 15px;
  padding: 10px 30px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  pointer-events: all;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4);
  position: relative;
  z-index: 1001;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(56, 239, 125, 0.6);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 480px) {
    margin-top: 10px;
    padding: 8px 20px;
    font-size: 14px;
    border-radius: 15px;
  }
`;

const WaitText = styled.div`
  margin-top: 15px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);

  @media (max-width: 480px) {
    margin-top: 10px;
    font-size: 12px;
  }
`;

export default WinnerDisplay;
