import React, { createContext, useContext, useReducer } from 'react';
import { CardUtils } from '../utils/gameLogic';

const GameContext = createContext();

const initialState = {
  players: [],
  currentPlayer: null,
  currentCards: [],
  gameState: 'waiting',
  landlordId: null,
  round: 1,
  scores: {},
  myPlayerId: null,
  handCards: [],
  selectedCards: [],
  playerCardCounts: {},  // Store card counts for all players
  canPass: true  // Whether current player can pass (不要)
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.payload };
    case 'SET_CURRENT_CARDS':
      return { ...state, currentCards: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_LANDLORD':
      return { ...state, landlordId: action.payload };
    case 'SET_CAN_PASS':
      return { ...state, canPass: action.payload };
    case 'SET_ROUND':
      return { ...state, round: action.payload };
    case 'SET_SCORES':
      return { ...state, scores: action.payload };
    case 'SET_MY_PLAYER_ID':
      return { ...state, myPlayerId: action.payload };
    case 'SET_HAND_CARDS':
      // Sort cards in descending order (Big Joker to 3)
      // Add id to each card if not present
      const cardsWithId = (action.payload || []).map(card => ({
        ...card,
        id: card.id || `${card.suit}_${card.rank}`
      }));
      return { ...state, handCards: CardUtils.sortCards(cardsWithId) };
    case 'SELECT_CARD':
      // Check if card is already selected by comparing id
      const cardToSelect = action.payload;
      const cardId = cardToSelect.id || `${cardToSelect.suit}_${cardToSelect.rank}`;
      const alreadySelected = state.selectedCards.some(c =>
        (c.id || `${c.suit}_${c.rank}`) === cardId
      );
      if (alreadySelected) {
        return state;
      }
      const newSelected = [...state.selectedCards, { ...cardToSelect, id: cardId }];
      return { ...state, selectedCards: newSelected };
    case 'DESELECT_CARD':
      // Filter by comparing id or suit+rank
      const cardToDeselect = action.payload;
      const deselectId = cardToDeselect.id || `${cardToDeselect.suit}_${cardToDeselect.rank}`;
      const filtered = state.selectedCards.filter(c =>
        (c.id || `${c.suit}_${c.rank}`) !== deselectId
      );
      return { ...state, selectedCards: filtered };
    case 'CLEAR_SELECTED_CARDS':
      return { ...state, selectedCards: [] };
    case 'SET_SELECTED_CARDS':
      return { ...state, selectedCards: action.payload };
    case 'CLEAR_CARDS_ON_TABLE':
      return { ...state, currentCards: [] };
    case 'UPDATE_HAND_CARDS':
      // Remove played cards from hand
      const playedCards = action.payload;
      const playedCardIds = new Set(playedCards.map(c => c.id || `${c.suit}_${c.rank}`));
      const remainingHand = state.handCards.filter(c =>
        !playedCardIds.has(c.id || `${c.suit}_${c.rank}`)
      );
      return { ...state, handCards: remainingHand };
    case 'SET_PLAYER_CARD_COUNTS':
      // Update card counts for all players (for displaying other players' card count)
      return { ...state, playerCardCounts: action.payload };
    default:
      return state;
  }
}

export const GameProvider = ({ children, initialState: initialOverrideState = initialState }) => {
  const [state, dispatch] = useReducer(gameReducer, { ...initialState, ...initialOverrideState });

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};