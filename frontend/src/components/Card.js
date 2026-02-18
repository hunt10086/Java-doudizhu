import React from 'react';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';

const getCardSize = (size) => {
  switch(size) {
    case 'tiny': return { width: '24px', height: '34px' };
    case 'extra-small': return { width: '36px', height: '52px' };
    case 'small': return { width: '48px', height: '72px' };
    default: return { width: '56px', height: '84px' };
  }
};

const CardContainer = styled.div`
  position: relative;
  width: ${({ size }) => getCardSize(size).width};
  height: ${({ size }) => getCardSize(size).height};
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
  border: 2px solid ${({ $isSelected }) => $isSelected ? '#ff8c00' : '#ccc'};
  box-shadow: ${({ $isSelected }) => $isSelected ? '0 0 12px rgba(255, 140, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.3)'};
  margin-bottom: ${({ $isSelected }) => $isSelected ? '6px' : '0'};
  flex-shrink: 0;
  overflow: hidden;

  @media (max-width: 768px) {
    width: ${({ size }) => {
      switch(size) {
        case 'tiny': return '20px';
        case 'extra-small': return '28px';
        case 'small': return '38px';
        default: return '44px';
      }
    }};
    height: ${({ size }) => {
      switch(size) {
        case 'tiny': return '28px';
        case 'extra-small': return '40px';
        case 'small': return '56px';
        default: return '66px';
      }
    }};
  }

  @media (max-width: 480px) {
    width: ${({ size }) => {
      switch(size) {
        case 'tiny': return '16px';
        case 'extra-small': return '24px';
        case 'small': return '32px';
        default: return '38px';
      }
    }};
    height: ${({ size }) => {
      switch(size) {
        case 'tiny': return '22px';
        case 'extra-small': return '34px';
        case 'small': return '48px';
        default: return '56px';
      }
    }};
  }

  @media (max-height: 500px) and (orientation: landscape) {
    width: ${({ size }) => {
      switch(size) {
        case 'tiny': return '14px';
        case 'extra-small': return '20px';
        case 'small': return '28px';
        default: return '34px';
      }
    }};
    height: ${({ size }) => {
      switch(size) {
        case 'tiny': return '20px';
        case 'extra-small': return '28px';
        case 'small': return '42px';
        default: return '50px';
      }
    }};
    margin-bottom: ${({ $isSelected }) => $isSelected ? '4px' : '0'};
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }

  @media (hover: none) and (pointer: coarse) {
    &:active {
      transform: ${({ $isSelected }) => $isSelected ? 'translateY(-8px)' : 'translateY(-2px)'};
    }
  }
`;

const getCornerFontSize = (size) => {
  switch(size) {
    case 'tiny': return '4px';
    case 'extra-small': return '6px';
    case 'small': return '10px';
    default: return '8px';
  }
};

const CardCorner = styled.div`
  font-size: ${({ size }) => getCornerFontSize(size)};
  font-weight: bold;
  line-height: 1;
  padding: 0;
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '3px';
        case 'extra-small': return '5px';
        case 'small': return '8px';
        default: return '6px';
      }
    }};
  }

  @media (max-width: 480px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '2px';
        case 'extra-small': return '4px';
        case 'small': return '6px';
        default: return '5px';
      }
    }};
  }
`;

const getSuitFontSize = (size) => {
  switch(size) {
    case 'tiny': return '6px';
    case 'extra-small': return '8px';
    case 'small': return '14px';
    default: return '12px';
  }
};

const SuitSymbol = styled.span`
  font-size: ${({ size }) => getSuitFontSize(size)};
  display: block;
  text-align: center;
  color: ${({ suit }) => (suit === 'hearts' || suit === 'diamonds') ? '#d00' : '#000'};
  line-height: 1;
  padding: 0;
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '4px';
        case 'extra-small': return '6px';
        case 'small': return '10px';
        default: return '8px';
      }
    }};
  }

  @media (max-width: 480px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '3px';
        case 'extra-small': return '5px';
        case 'small': return '8px';
        default: return '6px';
      }
    }};
  }
`;

const getCenterSuitFontSize = (size) => {
  switch(size) {
    case 'tiny': return '8px';
    case 'extra-small': return '10px';
    case 'small': return '20px';
    default: return '14px';
  }
};

const CenterSuitSymbol = styled(SuitSymbol)`
  font-size: ${({ size }) => getCenterSuitFontSize(size)};

  @media (max-width: 768px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '6px';
        case 'extra-small': return '8px';
        case 'small': return '14px';
        default: return '10px';
      }
    }};
  }

  @media (max-width: 480px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '5px';
        case 'extra-small': return '6px';
        case 'small': return '10px';
        default: return '8px';
      }
    }};
  }
`;

const JokerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  overflow: hidden;
`;

const getJokerFontSize = (size) => {
  switch(size) {
    case 'tiny': return '4px';
    case 'extra-small': return '5px';
    case 'small': return '12px';
    default: return '7px';
  }
};

const JokerText = styled.div`
  font-size: ${({ size }) => getJokerFontSize(size)};
  font-weight: bold;
  text-align: center;
  line-height: 1;
  color: ${({ $isRed }) => $isRed ? '#d00' : '#000'};

  @media (max-width: 768px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '3px';
        case 'extra-small': return '4px';
        case 'small': return '10px';
        default: return '5px';
      }
    }};
  }

  @media (max-width: 480px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '2px';
        case 'extra-small': return '3px';
        case 'small': return '8px';
        default: return '4px';
      }
    }};
  }
`;

const getCardBackFontSize = (size) => {
  switch(size) {
    case 'tiny': return '4px';
    case 'extra-small': return '5px';
    case 'small': return '6px';
    default: return '8px';
  }
};

const CardBack = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: ${({ size }) => getCardBackFontSize(size)};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '3px';
        case 'extra-small': return '4px';
        case 'small': return '5px';
        default: return '6px';
      }
    }};
  }

  @media (max-width: 480px) {
    font-size: ${({ size }) => {
      switch(size) {
        case 'tiny': return '2px';
        case 'extra-small': return '3px';
        case 'small': return '4px';
        default: return '5px';
      }
    }};
  }
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

      <CenterSuitSymbol suit={suit} size={size}>
        {suitSymbols[suit]}
      </CenterSuitSymbol>

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
