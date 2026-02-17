package com.game.doudizhu.model;

import java.util.Objects;

public class Card {
    private String suit; // hearts, diamonds, clubs, spades, joker
    private String rank; // 3-10, J, Q, K, A, 2, BJ (Black Joker), RJ (Red Joker)
    private String id;   // Unique identifier like "hearts_3", "BJ", "RJ"

    public Card() {}

    public Card(String suit, String rank) {
        this.suit = suit;
        this.rank = rank;
        this.id = suit + "_" + rank;
    }

    public Card(String suit, String rank, String id) {
        this.suit = suit;
        this.rank = rank;
        this.id = id;
    }

    // Getters and setters
    public String getSuit() { return suit; }
    public void setSuit(String suit) { this.suit = suit; }

    public String getRank() { return rank; }
    public void setRank(String rank) { this.rank = rank; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    @Override
    public String toString() {
        return suit + ":" + rank;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Card card = (Card) obj;
        return Objects.equals(id, card.id) || (Objects.equals(suit, card.suit) && Objects.equals(rank, card.rank));
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, suit, rank);
    }
}