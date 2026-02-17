package com.game.doudizhu.service;

import com.game.doudizhu.model.Card;
import com.game.doudizhu.model.GameState;
import com.game.doudizhu.model.Player;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Card value map
    private static final Map<String, Integer> CARD_VALUES = new HashMap<>();
    static {
        CARD_VALUES.put("3", 3); CARD_VALUES.put("4", 4); CARD_VALUES.put("5", 5);
        CARD_VALUES.put("6", 6); CARD_VALUES.put("7", 7); CARD_VALUES.put("8", 8);
        CARD_VALUES.put("9", 9); CARD_VALUES.put("10", 10); CARD_VALUES.put("J", 11);
        CARD_VALUES.put("Q", 12); CARD_VALUES.put("K", 13); CARD_VALUES.put("A", 14);
        CARD_VALUES.put("2", 15); CARD_VALUES.put("BJ", 16); CARD_VALUES.put("RJ", 17);
    }

    /**
     * AI decides whether to bid (call landlord)
     */
    public boolean shouldBid(Player player, List<Card> landlordCards, GameState gameState) {
        List<Card> allCards = new ArrayList<>(player.getHand());
        allCards.addAll(landlordCards);

        // Analyze hand strength
        int score = evaluateHandStrength(allCards);

        // Higher threshold for first bid, lower for grabbing
        return score >= 75;
    }

    /**
     * Evaluate hand strength (0-100)
     */
    private int evaluateHandStrength(List<Card> hand) {
        int score = 0;

        // Count cards by rank
        Map<String, List<Card>> groups = hand.stream()
            .collect(Collectors.groupingBy(Card::getRank));

        // Count high cards
        for (Card card : hand) {
            int value = CARD_VALUES.getOrDefault(card.getRank(), 0);
            if (value >= 14) score += value - 10; // A and 2
            if (value >= 11) score += 1; // J and Q and K
        }

        // Count bombs
        long bombCount = groups.values().stream().filter(g -> g.size() == 4).count();
        score += bombCount * 15;

        // Count pairs
        long pairCount = groups.values().stream().filter(g -> g.size() == 2).count();
        score += pairCount * 3;

        // Count triples
        long tripleCount = groups.values().stream().filter(g -> g.size() == 3).count();
        score += tripleCount * 8;

        // Check for jokers
        boolean hasBJ = hand.stream().anyMatch(c -> "BJ".equals(c.getRank()));
        boolean hasRJ = hand.stream().anyMatch(c -> "RJ".equals(c.getRank()));
        if (hasBJ && hasRJ) score += 20;
        else if (hasBJ || hasRJ) score += 5;

        // Check for straight potential
        List<String> ranks = hand.stream()
            .map(Card::getRank)
            .filter(r -> CARD_VALUES.containsKey(r) && CARD_VALUES.get(r) <= 14)
            .distinct()
            .sorted(Comparator.comparingInt(r -> CARD_VALUES.get(r)))
            .collect(Collectors.toList());

        int straightPotential = 0;
        for (int i = 0; i < ranks.size() - 4; i++) {
            boolean isStraight = true;
            for (int j = 0; j < 4; j++) {
                if (CARD_VALUES.get(ranks.get(i + j + 1)) != CARD_VALUES.get(ranks.get(i + j)) + 1) {
                    isStraight = false;
                    break;
                }
            }
            if (isStraight) {
                straightPotential += 10;
                score += 5;
            }
        }

        return Math.min(100, score);
    }

    /**
     * AI chooses cards to play
     */
    public List<Card> chooseCardsToPlay(Player player, List<Card> prevCards, boolean isFirstTurn) {
        List<Card> hand = player.getHand();
        if (hand.isEmpty()) return Collections.emptyList();

        // Sort hand by value
        List<Card> sortedHand = sortCards(hand);

        // If first turn, play smallest single or appropriate combo
        if (isFirstTurn || prevCards == null || prevCards.isEmpty()) {
            return playFirstTurn(sortedHand);
        }

        // Try to beat previous cards
        return tryToBeat(sortedHand, prevCards);
    }

    /**
     * Play first turn - choose smallest valid combo
     */
    private List<Card> playFirstTurn(List<Card> sortedHand) {
        // Check for jokers first (rarely play first)
        boolean hasBJ = sortedHand.stream().anyMatch(c -> "BJ".equals(c.getRank()));
        boolean hasRJ = sortedHand.stream().anyMatch(c -> "RJ".equals(c.getRank()));

        // Group cards
        Map<String, List<Card>> groups = sortedHand.stream()
            .collect(Collectors.groupingBy(Card::getRank));

        // Try to play bomb if we have one (but not jokers)
        for (List<Card> group : groups.values()) {
            if (group.size() == 4) {
                // Check if it's not jokers
                if (!group.stream().allMatch(c -> "BJ".equals(c.getRank()) || "RJ".equals(c.getRank()))) {
                    return group;
                }
            }
        }

        // Try to play triple
        for (List<Card> group : groups.values()) {
            if (group.size() >= 3) {
                return group.subList(0, 3);
            }
        }

        // Try to play pair
        for (List<Card> group : groups.values()) {
            if (group.size() >= 2) {
                return group.subList(0, 2);
            }
        }

        // Play smallest card
        return Collections.singletonList(sortedHand.get(sortedHand.size() - 1));
    }

    /**
     * Try to beat previous cards
     */
    private List<Card> tryToBeat(List<Card> hand, List<Card> prevCards) {
        Map<String, List<Card>> groups = hand.stream()
            .collect(Collectors.groupingBy(Card::getRank));

        int prevValue = getCardValue(prevCards.get(0));
        int prevCount = countSameRank(hand, prevCards.get(0).getRank());

        // Try to find a bomb
        for (List<Card> group : groups.values()) {
            if (group.size() == 4) {
                int bombValue = CARD_VALUES.get(group.get(0).getRank());
                // Check if it's a valid bomb play
                if (bombValue + 5 > prevValue || isSpecialBomb(group)) {
                    return group;
                }
            }
        }

        // Check for jokers
        boolean hasBJ = hand.stream().anyMatch(c -> "BJ".equals(c.getRank()));
        boolean hasRJ = hand.stream().anyMatch(c -> "RJ".equals(c.getRank()));
        if (hasBJ && hasRJ) {
            return hand.stream()
                .filter(c -> "BJ".equals(c.getRank()) || "RJ".equals(c.getRank()))
                .collect(Collectors.toList());
        }

        // Try to find same type with higher value
        for (List<Card> group : groups.values()) {
            if (group.size() == prevCount) {
                int groupValue = CARD_VALUES.get(group.get(0).getRank());
                if (groupValue > prevValue) {
                    return group;
                }
            }
        }

        // Try straights
        List<String> ranks = hand.stream()
            .map(Card::getRank)
            .filter(r -> CARD_VALUES.containsKey(r))
            .distinct()
            .sorted(Comparator.comparingInt(r -> CARD_VALUES.get(r)))
            .collect(Collectors.toList());

        for (int len = 5; len <= ranks.size(); len++) {
            for (int i = 0; i <= ranks.size() - len; i++) {
                List<String> straightRanks = ranks.subList(i, i + len);
                if (isSequential(straightRanks)) {
                    int straightValue = CARD_VALUES.get(straightRanks.get(straightRanks.size() - 1));
                    if (straightValue > prevValue || prevCards.size() < 5) {
                        return hand.stream()
                            .filter(c -> straightRanks.contains(c.getRank()))
                            .collect(Collectors.toList());
                    }
                }
            }
        }

        // Cannot beat, return empty (should pass)
        return Collections.emptyList();
    }

    /**
     * Sort cards by value descending
     */
    private List<Card> sortCards(List<Card> cards) {
        return cards.stream()
            .sorted(Comparator.comparingInt(c -> CARD_VALUES.getOrDefault(c.getRank(), 0)))
            .collect(Collectors.toList());
    }

    private int getCardValue(Card card) {
        return CARD_VALUES.getOrDefault(card.getRank(), 0);
    }

    private int countSameRank(List<Card> cards, String rank) {
        return (int) cards.stream().filter(c -> rank.equals(c.getRank())).count();
    }

    private boolean isSequential(List<String> ranks) {
        if (ranks.size() < 2) return true;
        for (int i = 1; i < ranks.size(); i++) {
            if (CARD_VALUES.get(ranks.get(i)) != CARD_VALUES.get(ranks.get(i - 1)) + 1) {
                return false;
            }
        }
        return true;
    }

    private boolean isSpecialBomb(List<Card> cards) {
        return cards.stream().allMatch(c -> "BJ".equals(c.getRank()) || "RJ".equals(c.getRank()));
    }

    /**
     * AI decides whether to pass (when cannot beat)
     */
    public boolean shouldPass(List<Card> hand, List<Card> prevCards) {
        // If cannot find any valid play, must pass
        return tryToBeat(sortCards(hand), prevCards).isEmpty();
    }
}
