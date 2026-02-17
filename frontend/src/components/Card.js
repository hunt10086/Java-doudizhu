import React from 'react';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';

const CardContainer = styled.div`
  position: relative;
  width: ${({ size }) => size === 'tiny' ? '24px' : size === 'small' ? '48px' : '56px'};
  height: ${({ size }) => size === 'tiny' ? '34px' : size === 'small' ? '72px' : '84px'};
  border-radius: 2px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1px;
  cursor: pointer;
  transition: all 0.15s ease;
  transform: ${({ $isSelected }) => $isSelected ? 'translateY(-6px)' : 'none'};
  border: 1px solid ${({ $isSelected }) => $isSelected ? '#ffcc00' : '#ccc'};
  margin-bottom: ${({ $isSelected }) => $isSelected ? '6px' : '0'};
  flex-shrink: 0;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
`;

const CardCorner = styled.div`
  font-size: ${({ size }) => size === 'tiny' ? '4px' : size === 'small' ? '12px' : '8px'};
  font-weight: bold;
  line-height: 1;
  padding: 0;
  margin: 0;
`;

const SuitSymbol = styled.span`
  font-size: ${({ size }) => size === 'tiny' ? '6px' : size === 'small' ? '16px' : '12px'};
  display: block;
  text-align: center;
  color: ${({ suit }) => (suit === 'hearts' || suit === 'diamonds') ? '#d00' : '#000'};
  line-height: 1;
  padding: 0;
  margin: 0;
`;

const JokerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  overflow: hidden;
`;

const JokerText = styled.div`
  font-size: ${({ size }) => size === 'tiny' ? '4px' : size === 'small' ? '14px' : '7px'};
  font-weight: bold;
  text-align: center;
  line-height: 1;
  color: ${({ $isRed }) => $isRed ? '#d00' : '#000'};
`;

const CardBack = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a237e, #4a148c);
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: ${({ size }) => size === 'tiny' ? '4px' : size === 'small' ? '6px' : '8px'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const Card = ({ suit, rank, size = 'normal', isFaceUp = true }) => {
  const { state, dispatch } = useGame();

  // Check if this card is selected
  const isSelected = state.selectedCards.some(c =>
    c.suit === suit && c.rank === rank
  );

  const handleClick = () => {
    if (!isFaceUp) return;

    const cardInHand = state.handCards.find(c => c.suit === suit && c.rank === rank);
    if (!cardInHand) return;

    if (isSelected) {
      dispatch({ type: 'DESELECT_CARD', payload: cardInHand });
    } else {
      dispatch({ type: 'SELECT_CARD', payload: cardInHand });
    }
  };

  if (!isFaceUp) {
    return <CardBack size={size}>🂠</CardBack>;
  }

  // Handle jokers - BJ is red (Big Joker), RJ is black (Small Joker)
  if (rank === 'BJ' || rank === 'RJ') {
    const isRedJoker = rank === 'BJ';
    return (
      <CardContainer size={size} $isSelected={isSelected} onClick={handleClick}>
        <JokerContainer>
          <JokerText size={size} $isRed={isRedJoker}>
            {isRedJoker ? '🃏' : '🃏'}
          </JokerText>
          <JokerText size={size} $isRed={isRedJoker}>
            {rank}
          </JokerText>
        </JokerContainer>
      </CardContainer>
    );
  }

  // Map suits to symbols
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };

  return (
    <CardContainer size={size} $isSelected={isSelected} onClick={handleClick}>
      <CardCorner size={size}>
        <div>{rank}</div>
        <SuitSymbol suit={suit}>
          {suitSymbols[suit]}
        </SuitSymbol>
      </CardCorner>

      <SuitSymbol suit={suit} style={{ fontSize: size === 'tiny' ? '8px' : size === 'small' ? '24px' : '14px' }}>
        {suitSymbols[suit]}
      </SuitSymbol>

      <CardCorner size={size} style={{ textAlign: 'right' }}>
        <SuitSymbol suit={suit}>
          {suitSymbols[suit]}
        </SuitSymbol>
        <div>{rank}</div>
      </CardCorner>
    </CardContainer>
  );
};

export default Card;
