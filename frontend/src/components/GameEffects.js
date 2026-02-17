// Card type effects and animations
import styled, { keyframes, css } from 'styled-components';

// Card type names in Chinese
export const CARD_TYPE_NAMES = {
  SINGLE: '单张',
  PAIR: '对子',
  TRIPLE: '三张',
  TRIPLE_SINGLE: '三带一',
  TRIPLE_PAIR: '三带二',
  STRAIGHT: '顺子',
  DOUBLE_STRAIGHT: '连对',
  AIRPLANE: '飞机',
  BOMB: '炸弹',
  JOKER_BOMB: '王炸'
};

// Bomb explosion animation
const bombExplode = keyframes`
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Joker bomb rainbow effect
const rainbowGlow = keyframes`
  0% {
    box-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000;
    filter: hue-rotate(0deg);
  }
  50% {
    box-shadow: 0 0 30px #00ff00, 0 0 60px #00ff00;
    filter: hue-rotate(180deg);
  }
  100% {
    box-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000;
    filter: hue-rotate(360deg);
  }
`;

// Straight/sequence flowing animation
const straightFlow = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
`;

// Airplane flying animation
const airplaneFly = keyframes`
  0% {
    transform: translateY(20px) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translateY(0) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
`;

// Glow pulse
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px currentColor;
  }
  50% {
    box-shadow: 0 0 40px currentColor, 0 0 60px currentColor;
  }
`;

// Effects container
export const EffectContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  pointer-events: none;
`;

// Bomb effect
export const BombEffect = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: ${bombExplode} 0.5s ease-out;

  ${props => props.$isJoker && css`
    animation: ${bombExplode} 0.5s ease-out, ${rainbowGlow} 2s infinite;
  `}
`;

export const EffectLabel = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: ${props => {
    switch(props.$type) {
      case 'BOMB': return '#ff6b6b';
      case 'JOKER_BOMB': return 'linear-gradient(90deg, #ff0000, #00ff00)';
      case 'STRAIGHT': return '#4ecdc4';
      case 'DOUBLE_STRAIGHT': return '#45b7d1';
      case 'AIRPLANE': return '#f9ca24';
      default: return '#fff';
    }
  }};
  text-shadow: 0 0 20px currentColor;
  ${props => props.$isJoker && css`
    background: linear-gradient(90deg, #ff0000, #00ff00, #0000ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `}
`;

// Card combo display
export const ComboCards = styled.div`
  display: flex;
  gap: 4px;
  animation: ${props => {
    switch(props.$type) {
      case 'BOMB':
      case 'JOKER_BOMB':
        return bombExplode;
      case 'STRAIGHT':
      case 'DOUBLE_STRAIGHT':
        return straightFlow;
      case 'AIRPLANE':
        return airplaneFly;
      default:
        return bombExplode;
    }
  }} 0.5s ease-out;
`;

// Winner announcement
const winnerSlide = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const confettiFall = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

export const WinnerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${winnerSlide} 0.5s ease-out;
`;

export const WinnerBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  padding: 60px 100px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 30px;
  border: 3px solid;
  border-color: ${props => props.$isLandlord ? '#ff6b6b' : '#4ecdc4'};
  box-shadow:
    0 0 50px ${props => props.$isLandlord ? 'rgba(255,107,107,0.5)' : 'rgba(78,205,196,0.5)'},
    inset 0 0 30px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(255,255,255,0.1) 60deg,
      transparent 120deg
    );
    animation: rotate 4s linear infinite;
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const WinnerTitle = styled.div`
  font-size: 48px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 8px;
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${glowPulse} 2s infinite;
  color: #f093fb;
  text-shadow: 0 0 30px rgba(240, 147, 251, 0.5);
`;

export const WinnerName = styled.div`
  font-size: 64px;
  font-weight: bold;
  color: ${props => props.$isLandlord ? '#ff6b6b' : '#4ecdc4'};
  text-shadow: 0 0 30px currentColor;
  animation: ${glowPulse} 1.5s infinite;
`;

export const WinnerSubtitle = styled.div`
  font-size: 20px;
  color: rgba(255,255,255,0.7);
  margin-top: 10px;
`;

// Confetti
export const ConfettiContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 999;
`;

export const ConfettiPiece = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  top: -20px;
  background: ${props => props.$color || '#f093fb'};
  animation: ${confettiFall} ${props => props.$duration || 3}s linear forwards;
  animation-delay: ${props => props.$delay || 0}s;
  transform: rotate(${props => props.$rotation || 0}deg);
  opacity: 0.8;
`;

// Game table background
export const GameBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(78, 205, 196, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(240, 147, 251, 0.08) 0%, transparent 70%),
    linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0d0d20 100%);
  z-index: -1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.03) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
    opacity: 0.3;
  }
`;

// Playing card area enhanced
export const PlayArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  min-height: 300px;
`;

export const CardsOnTable = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 30px 50px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  min-width: 300px;
  min-height: 150px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.3),
    inset 0 0 30px rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  ${props => props.$hasBomb && css`
    border-color: rgba(255, 107, 107, 0.5);
    box-shadow:
      0 10px 40px rgba(255, 107, 107, 0.3),
      0 0 30px rgba(255, 107, 107, 0.2),
      inset 0 0 30px rgba(255, 107, 107, 0.1);
  `}

  ${props => props.$hasJokerBomb && css`
    border-color: rgba(240, 147, 251, 0.5);
    animation: ${rainbowGlow} 2s infinite;
  `}
`;

export const CardTypeIndicator = styled.div`
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  color: white;
  background: ${props => {
    switch(props.$type) {
      case 'BOMB': return 'linear-gradient(135deg, #ff6b6b, #ee5a5a)';
      case 'JOKER_BOMB': return 'linear-gradient(135deg, #f093fb, #f5576c)';
      case 'STRAIGHT': return 'linear-gradient(135deg, #4ecdc4, #45b7d1)';
      case 'DOUBLE_STRAIGHT': return 'linear-gradient(135deg, #45b7d1, #96e6a1)';
      case 'AIRPLANE': return 'linear-gradient(135deg, #f9ca24, #f093fb)';
      default: return 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  }};
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  animation: ${glowPulse} 2s infinite;
`;

// Player areas
export const PlayerArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 2px solid ${props => props.$isCurrent ? 'rgba(78, 205, 196, 0.6)' : 'rgba(255, 255, 255, 0.1)'};
  transition: all 0.3s ease;
  min-width: 140px;

  ${props => props.$isCurrent && css`
    background: rgba(78, 205, 196, 0.1);
    box-shadow: 0 0 20px rgba(78, 205, 196, 0.3);
    animation: ${glowPulse} 2s infinite;
  `}
`;

export const PlayerName = styled.div`
  font-size: 16px;
  font-weight: ${props => props.$isCurrent ? 'bold' : '500'};
  color: ${props => props.$isCurrent ? '#4ecdc4' : 'rgba(255, 255, 255, 0.9)'};
  text-shadow: ${props => props.$isCurrent ? '0 0 10px #4ecdc4' : 'none'};
`;

export const CardCount = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
`;

// Hand cards section enhanced
export const HandCardsArea = styled.div`
  background: linear-gradient(180deg, rgba(20, 20, 40, 0.9) 0%, rgba(10, 10, 30, 0.95) 100%);
  border-radius: 20px;
  padding: 15px 20px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

export const HandCardsLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 3px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  }
`;

export const HandCardsList = styled.div`
  display: flex;
  gap: 3px;
  overflow-x: auto;
  padding: 5px 0;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
  }
`;

// Control buttons enhanced
export const ControlsArea = styled.div`
  display: flex;
  gap: 12px;
  padding: 15px 25px;
  background: linear-gradient(180deg, rgba(20, 20, 40, 0.9) 0%, rgba(10, 10, 30, 0.95) 100%);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
`;

export const ActionButton = styled.button`
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  opacity: ${props => props.$disabled ? 0.4 : 1};
  pointer-events: ${props => props.$disabled ? 'none' : 'auto'};

  ${props => props.$variant === 'play' && css`
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(56, 239, 125, 0.5);
    }
  `}

  ${props => props.$variant === 'pass' && css`
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 87, 108, 0.5);
    }
  `}

  ${props => props.$variant === 'bid' && css`
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5);
    }
  `}

  ${props => props.$variant === 'secondary' && css`
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }
  `}

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

// Wait message
export const WaitMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f39c12;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

// Status indicator
export const StatusIndicator = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ecdc4;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
`;

// Confetti colors
export const CONFETTI_COLORS = [
  '#f093fb', '#f5576c', '#4ecdc4', '#45b7d1',
  '#f9ca24', '#6ab04c', '#eb4d4b', '#a55eea'
];

// Generate confetti pieces
export const generateConfetti = (count = 50) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    left: Math.random() * 100,
    duration: 2 + Math.random() * 2,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360
  }));
};
