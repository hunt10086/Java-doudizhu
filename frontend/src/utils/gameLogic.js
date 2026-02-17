// Helper functions for Doudizhu (Fight the Landlord) card game

// Card types
export const CardType = {
  SINGLE: 'SINGLE',           // 单张
  PAIR: 'PAIR',               // 对子
  TRIPLE: 'TRIPLE',           // 三张
  TRIPLE_SINGLE: 'TRIPLE_SINGLE',     // 三带一
  TRIPLE_PAIR: 'TRIPLE_PAIR',         // 三带二
  STRAIGHT: 'STRAIGHT',       // 顺子
  DOUBLE_STRAIGHT: 'DOUBLE_STRAIGHT', // 连对
  AIRPLANE: 'AIRPLANE',      // 飞机
  BOMB: 'BOMB',               // 炸弹
  JOKER_BOMB: 'JOKER_BOMB'    // 王炸
};

// Card values for comparison (3 to 2, then BJ, RJ)
const CARD_VALUE_MAP = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
  'BJ': 16,  // Black Joker
  'RJ': 17   // Red Joker
};

export const CardUtils = {
  ranks: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'],
  suits: ['hearts', 'diamonds', 'clubs', 'spades'],
  jokers: ['BJ', 'RJ'],

  // Get card value for comparison
  getCardValue(card) {
    return CARD_VALUE_MAP[card.rank] || 0;
  },

  // Create a full deck of cards
  createDeck() {
    const deck = [];
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        deck.push({ suit, rank, id: `${suit}_${rank}` });
      }
    }
    deck.push({ suit: 'joker', rank: 'BJ', id: 'BJ' });
    deck.push({ suit: 'joker', rank: 'RJ', id: 'RJ' });
    return deck;
  },

  // Shuffle the deck using Fisher-Yates algorithm
  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Deal cards to players
  dealCards(deck) {
    const player1 = deck.slice(0, 17);
    const player2 = deck.slice(17, 34);
    const player3 = deck.slice(34, 51);
    const landlordCards = deck.slice(51, 54);

    return {
      players: [player1, player2, player3],
      landlordCards
    };
  },

  // Sort cards by value
  sortCards(cards) {
    return [...cards].sort((a, b) => this.getCardValue(b) - this.getCardValue(a));
  },

  // Group cards by rank
  groupByRank(cards) {
    const groups = {};
    for (const card of cards) {
      if (!groups[card.rank]) {
        groups[card.rank] = [];
      }
      groups[card.rank].push(card);
    }
    return groups;
  },

  // Check if cards form a valid sequence
  isSequential(ranks, minLength = 5) {
    if (ranks.length < minLength) return false;

    const validRanks = ranks.filter(r => CARD_VALUE_MAP[r] && CARD_VALUE_MAP[r] <= 14);
    if (validRanks.length !== ranks.length) return false;

    const values = validRanks.map(r => CARD_VALUE_MAP[r]).sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) return false;
    }
    return true;
  },

  // Analyze cards and return card type and info
  analyzeCards(cards) {
    if (!cards || cards.length === 0) {
      return { type: null, valid: false };
    }

    const sortedCards = this.sortCards(cards);
    const groups = this.groupByRank(cards);
    const groupCounts = Object.values(groups).map(g => g.length).sort((a, b) => b - a);

    // Check for Joker Bomb (both jokers)
    const hasBJ = cards.some(c => c.rank === 'BJ');
    const hasRJ = cards.some(c => c.rank === 'RJ');
    if (hasBJ && hasRJ) {
      return { type: CardType.JOKER_BOMB, valid: true, value: 20 };
    }

    // Check for Bomb (4 same rank)
    if (groupCounts[0] === 4) {
      const bombRank = Object.keys(groups).find(rank => groups[rank].length === 4);
      return { type: CardType.BOMB, valid: true, value: CARD_VALUE_MAP[bombRank] + 5 };
    }

    // Check for single
    if (cards.length === 1) {
      return { type: CardType.SINGLE, valid: true, value: this.getCardValue(cards[0]) };
    }

    // Check for pair
    if (cards.length === 2 && groupCounts[0] === 2) {
      const pairRank = Object.keys(groups).find(rank => groups[rank].length === 2);
      return { type: CardType.PAIR, valid: true, value: CARD_VALUE_MAP[pairRank] };
    }

    // Check for triple
    if (cards.length === 3 && groupCounts[0] === 3) {
      const tripleRank = Object.keys(groups).find(rank => groups[rank].length === 3);
      return { type: CardType.TRIPLE, valid: true, value: CARD_VALUE_MAP[tripleRank] };
    }

    // Check for triple + single (4 cards)
    if (cards.length === 4 && groupCounts[0] === 3) {
      const tripleRank = Object.keys(groups).find(rank => groups[rank].length === 3);
      return { type: CardType.TRIPLE_SINGLE, valid: true, value: CARD_VALUE_MAP[tripleRank] };
    }

    // Check for triple + pair (5 cards)
    if (cards.length === 5 && groupCounts[0] === 3 && groupCounts[1] === 2) {
      const tripleRank = Object.keys(groups).find(rank => groups[rank].length === 3);
      return { type: CardType.TRIPLE_PAIR, valid: true, value: CARD_VALUE_MAP[tripleRank] };
    }

    // Check for straight (5+ consecutive singles)
    if (cards.length >= 5 && groupCounts[0] === 1) {
      const ranks = cards.map(c => c.rank);
      if (this.isSequential(ranks, 5)) {
        return { type: CardType.STRAIGHT, valid: true, length: cards.length, value: CARD_VALUE_MAP[ranks[ranks.length - 1]] };
      }
    }

    // Check for double straight (3+ consecutive pairs)
    if (cards.length >= 6 && groupCounts[0] === 2 && groupCounts[1] === 2) {
      const pairRanks = Object.keys(groups).filter(rank => groups[rank].length === 2);
      if (this.isSequential(pairRanks, 3)) {
        return { type: CardType.DOUBLE_STRAIGHT, valid: true, length: pairRanks.length, value: CARD_VALUE_MAP[pairRanks[pairRanks.length - 1]] };
      }
    }

    // Check for airplane (2+ triples with optional singles/pairs)
    if (cards.length >= 6) {
      const tripleCount = groupCounts.filter(c => c === 3).length;
      const otherCount = cards.length - tripleCount * 3;

      if (tripleCount >= 2) {
        // Check if triples are sequential
        const tripleRanks = Object.keys(groups).filter(rank => groups[rank].length === 3);
        if (this.isSequential(tripleRanks, tripleCount)) {
          // Check if the rest can be paired or single
          const isValidAirplane = (tripleCount === 2 && otherCount === 0) ||  // 飞机不带
                                  (tripleCount === 2 && otherCount === 2) ||  // 飞机带两单
                                  (tripleCount === 3 && otherCount === 0) ||  // 飞机不带
                                  (tripleCount === 3 && otherCount === 3) ||  // 飞机带三单
                                  (tripleCount === 3 && otherCount === 6);    // 飞机带三对

          if (isValidAirplane) {
            return {
              type: CardType.AIRPLANE,
              valid: true,
              tripleCount,
              withSingle: otherCount > 0 && otherCount === tripleCount,
              withPair: otherCount > 0 && otherCount === tripleCount * 2,
              value: CARD_VALUE_MAP[tripleRanks[tripleRanks.length - 1]]
            };
          }
        }
      }
    }

    return { type: null, valid: false };
  },

  // Validate if a move is legal
  isValidMove(cards, prevCards = null, isFirstTurn = false) {
    const analysis = this.analyzeCards(cards);
    if (!analysis.valid) {
      return { valid: false, reason: 'Invalid card combination' };
    }

    // First turn: must play smallest single or pass if cannot play
    if (isFirstTurn && prevCards === null) {
      // First play can be any valid combination
      return { valid: true, analysis };
    }

    // No previous cards - can play anything
    if (!prevCards || prevCards.length === 0) {
      return { valid: true, analysis };
    }

    const prevAnalysis = this.analyzeCards(prevCards);
    if (!prevAnalysis.valid) {
      return { valid: true, analysis }; // Previous was invalid, can play anything
    }

    // Compare with previous cards
    const comparison = this.compareAnalysis(analysis, prevAnalysis);
    if (!comparison.valid) {
      return { valid: false, reason: comparison.reason };
    }

    return { valid: true, analysis };
  },

  // Compare two card analyses
  compareAnalysis(current, previous) {
    // Joker bomb beats everything
    if (current.type === CardType.JOKER_BOMB) {
      return { valid: true };
    }

    // Bomb beats non-bomb (except joker bomb)
    if (current.type === CardType.BOMB) {
      if (previous.type !== CardType.BOMB && previous.type !== CardType.JOKER_BOMB) {
        return { valid: true };
      }
      // Both bombs - compare values
      if (current.value > previous.value) {
        return { valid: true };
      }
      return { valid: false, reason: 'Bomb value too low' };
    }

    // Cannot play bomb against joker bomb
    if (previous.type === CardType.JOKER_BOMB) {
      return { valid: false, reason: 'Cannot beat Joker Bomb' };
    }

    // Must match card type
    if (current.type !== previous.type) {
      return { valid: false, reason: 'Card type mismatch' };
    }

    // Compare by type
    switch (current.type) {
      case CardType.SINGLE:
      case CardType.PAIR:
      case CardType.TRIPLE:
      case CardType.TRIPLE_SINGLE:
      case CardType.TRIPLE_PAIR:
      case CardType.BOMB:
        if (current.value > previous.value) {
          return { valid: true };
        }
        return { valid: false, reason: 'Card value too low' };

      case CardType.STRAIGHT:
        if (current.length !== previous.length) {
          return { valid: false, reason: 'Straight length mismatch' };
        }
        if (current.value > previous.value) {
          return { valid: true };
        }
        return { valid: false, reason: 'Straight value too low' };

      case CardType.DOUBLE_STRAIGHT:
        if (current.length !== previous.length) {
          return { valid: false, reason: 'Double straight length mismatch' };
        }
        if (current.value > previous.value) {
          return { valid: true };
        }
        return { valid: false, reason: 'Double straight value too low' };

      case CardType.AIRPLANE:
        if (current.tripleCount !== previous.tripleCount) {
          return { valid: false, reason: 'Airplane triple count mismatch' };
        }
        if (current.withSingle !== previous.withSingle || current.withPair !== previous.withPair) {
          return { valid: false, reason: 'Airplane carrying type mismatch' };
        }
        if (current.value > previous.value) {
          return { valid: true };
        }
        return { valid: false, reason: 'Airplane value too low' };

      default:
        return { valid: false, reason: 'Unknown card type' };
    }
  },

  // Compare two sets of cards
  compareCards(cards1, cards2) {
    if (!cards1 || cards1.length === 0) return -1;
    if (!cards2 || cards2.length === 0) return 1;

    const analysis1 = this.analyzeCards(cards1);
    const analysis2 = this.analyzeCards(cards2);

    if (!analysis1.valid) return -1;
    if (!analysis2.valid) return 1;

    const comparison = this.compareAnalysis(analysis1, analysis2);
    return comparison.valid ? 1 : -1;
  },

  // Smart card selection helpers
  getPlayableCards(handCards, prevCards, isFirstTurn) {
    if (!handCards || handCards.length === 0) return [];

    const playable = [];

    // Try single
    for (const card of handCards) {
      const result = this.isValidMove([card], prevCards, isFirstTurn);
      if (result.valid) {
        playable.push([card]);
      }
    }

    // Try pairs
    const groups = this.groupByRank(handCards);
    for (const rank in groups) {
      if (groups[rank].length === 2) {
        const result = this.isValidMove(groups[rank], prevCards, isFirstTurn);
        if (result.valid) {
          playable.push(groups[rank]);
        }
      }
    }

    // Try triples
    for (const rank in groups) {
      if (groups[rank].length >= 3) {
        const triple = groups[rank].slice(0, 3);
        const result = this.isValidMove(triple, prevCards, isFirstTurn);
        if (result.valid) {
          playable.push(triple);
        }
      }
    }

    // Try bombs
    for (const rank in groups) {
      if (groups[rank].length === 4) {
        const result = this.isValidMove(groups[rank], prevCards, isFirstTurn);
        if (result.valid) {
          playable.push(groups[rank]);
        }
      }
    }

    // Try joker bomb
    const hasBJ = handCards.some(c => c.rank === 'BJ');
    const hasRJ = handCards.some(c => c.rank === 'RJ');
    if (hasBJ && hasRJ) {
      const jokerBomb = handCards.filter(c => c.rank === 'BJ' || c.rank === 'RJ');
      const result = this.isValidMove(jokerBomb, prevCards, isFirstTurn);
      if (result.valid) {
        playable.push(jokerBomb);
      }
    }

    // Try straights
    const ranks = [...new Set(handCards.map(c => c.rank))].filter(r => r !== 'BJ' && r !== 'RJ');
    for (let len = 5; len <= ranks.length; len++) {
      for (let i = 0; i <= ranks.length - len; i++) {
        const straightRanks = ranks.slice(i, i + len);
        if (this.isSequential(straightRanks, len)) {
          const straightCards = handCards.filter(c => straightRanks.includes(c.rank));
          const result = this.isValidMove(straightCards, prevCards, isFirstTurn);
          if (result.valid) {
            playable.push(straightCards);
          }
        }
      }
    }

    return playable;
  }
};

// Game state management functions
export const GameState = {
  initializeGame() {
    const deck = CardUtils.createDeck();
    const shuffledDeck = CardUtils.shuffleDeck(deck);
    const { players, landlordCards } = CardUtils.dealCards(shuffledDeck);

    return {
      deck: shuffledDeck,
      players: players.map((hand, index) => ({
        id: `player${index + 1}`,
        name: `玩家${index + 1}`,
        hand: CardUtils.sortCards(hand),
        position: index
      })),
      landlordCards,
      currentPlayerIndex: 0,
      playedCards: [],
      gameState: 'dealing',
      landlordId: null
    };
  },

  startBidding(gameState) {
    return {
      ...gameState,
      gameState: 'bidding',
      currentPlayerIndex: 0
    };
  },

  startPlaying(gameState, landlordId) {
    // Add landlord cards to landlord's hand
    const updatedPlayers = gameState.players.map(player => {
      if (player.id === landlordId) {
        return {
          ...player,
          hand: CardUtils.sortCards([...player.hand, ...gameState.landlordCards])
        };
      }
      return player;
    });

    return {
      ...gameState,
      players: updatedPlayers,
      gameState: 'playing',
      landlordId,
      currentPlayerIndex: gameState.players.findIndex(p => p.id === landlordId)
    };
  },

  processMove(gameState, playerId, cards) {
    const currentPlayerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (currentPlayerIndex !== gameState.currentPlayerIndex) {
      return { valid: false, reason: 'Not your turn', gameState };
    }

    const isFirstTurn = gameState.gameState === 'playing' &&
      gameState.playedCards.length === 0;

    const prevCards = gameState.currentCards && gameState.currentCards.length > 0
      ? gameState.currentCards
      : null;

    const validation = CardUtils.isValidMove(cards, prevCards, isFirstTurn);
    if (!validation.valid) {
      return { valid: false, reason: validation.reason, gameState };
    }

    // Remove cards from player's hand
    const updatedPlayers = gameState.players.map(player => {
      if (player.id === playerId) {
        const remainingHand = player.hand.filter(card =>
          !cards.some(selectedCard =>
            selectedCard.rank === card.rank && selectedCard.suit === card.suit
          )
        );
        return { ...player, hand: remainingHand };
      }
      return player;
    });

    // Update played cards
    const updatedPlayedCards = [...gameState.playedCards, { playerId, cards }];

    // Move to next player
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    // Check if player has won
    const playerWon = updatedPlayers[currentPlayerIndex].hand.length === 0;

    return {
      valid: true,
      gameState: {
        ...gameState,
        players: updatedPlayers,
        playedCards: updatedPlayedCards,
        currentCards: cards,
        currentPlayerIndex: playerWon ? gameState.currentPlayerIndex : nextPlayerIndex,
        gameState: playerWon ? 'finished' : 'playing'
      },
      playerWon
    };
  }
};
