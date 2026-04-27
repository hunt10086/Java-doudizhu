import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const rotatePhone = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(90deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const OrientationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
  touch-action: none;
  user-select: none;
`;

const PhoneIcon = styled.div`
  font-size: 80px;
  margin-bottom: 30px;
  animation: ${rotatePhone} 1s ease-in-out infinite;
  color: #4ecdc4;
`;

const Title = styled.h2`
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 15px;
  text-align: center;
`;

const Message = styled.p`
  color: rgba(0, 0, 0, 0.7);
  font-size: 16px;
  text-align: center;
  line-height: 1.6;
  max-width: 300px;
`;

const RotateHint = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
`;

const ArrowIcon = styled.div`
  font-size: 32px;
  color: #ff6b6b;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const ArrowText = styled.span`
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
`;

const checkIsPhone = () => {
  const isMobileDevice = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth < 768;
  return isMobileDevice && isSmallScreen;
};

const OrientationLock = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    const checkDevice = () => {
      setIsPhone(checkIsPhone());
    };

    checkOrientation();
    checkDevice();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Only show overlay on phones (not tablets) in portrait mode
  if (!isPhone || !isPortrait) {
    return null;
  }

  return (
    <OrientationOverlay>
      <PhoneIcon>📱</PhoneIcon>
      <Title>请横屏游玩</Title>
      <Message>
        斗地主游戏需要在横屏模式下才能获得最佳体验
      </Message>
      <RotateHint>
        <ArrowIcon>↻</ArrowIcon>
        <ArrowText>请将设备旋转90度</ArrowText>
      </RotateHint>
    </OrientationOverlay>
  );
};

export default OrientationLock;
