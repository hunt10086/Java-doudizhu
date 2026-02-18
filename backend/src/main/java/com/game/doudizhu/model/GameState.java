package com.game.doudizhu.model;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GameState {
    public enum Status {
        WAITING, DEALING, BIDDING, PLAYING, FINISHED
    }

    private String gameId;
    private String roomId;
    private Status status;
    private List<Player> players;
    private String currentPlayerId;
    private List<Card> currentCards;
    private String landlordId;
    private List<Card> landlordCards;
    private int round;
    private long startTime;
    private List<List<Card>> playedCards = new java.util.ArrayList<>();

    // Bidding related fields
    private int bidRound = 0;           // Current bid round (0 = not started)
    private String firstBidderId = null;  // First player who bid
    private int bidCount = 0;            // Number of bids made
    private boolean isGrabbing = false;  // Whether currently in grabbing mode
    private Map<String, Boolean> playerBids = new HashMap<>(); // Player bid status
    private int redealCount = 0;         // Number of times cards were redealt due to all passing

    // Playing related fields
    private String lastPlayerId = null;  // Last player who played cards (for cycle tracking)
    private long turnStartTime = 0;      // Timestamp when current player's turn started

    // Constructors
    public GameState() {
        this.players = new java.util.ArrayList<>();
        this.currentCards = new java.util.ArrayList<>();
        this.landlordCards = new java.util.ArrayList<>();
    }

    public GameState(String gameId) {
        this.gameId = gameId;
        this.status = Status.WAITING;
        this.players = new java.util.ArrayList<>();
        this.currentCards = new java.util.ArrayList<>();
        this.landlordCards = new java.util.ArrayList<>();
        this.round = 1;
        this.startTime = System.currentTimeMillis();
    }

    // Getters and setters
    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public List<Player> getPlayers() { return players; }
    public void setPlayers(List<Player> players) { this.players = players; }

    public String getCurrentPlayerId() { return currentPlayerId; }
    public void setCurrentPlayerId(String currentPlayerId) { this.currentPlayerId = currentPlayerId; }

    public List<Card> getCurrentCards() { return currentCards; }
    public void setCurrentCards(List<Card> currentCards) { this.currentCards = currentCards; }

    public String getLandlordId() { return landlordId; }
    public void setLandlordId(String landlordId) { this.landlordId = landlordId; }

    public List<Card> getLandlordCards() { return landlordCards; }
    public void setLandlordCards(List<Card> landlordCards) { this.landlordCards = landlordCards; }

    public int getRound() { return round; }
    public void setRound(int round) { this.round = round; }

    public long getStartTime() { return startTime; }
    public void setStartTime(long startTime) { this.startTime = startTime; }

    public List<List<Card>> getPlayedCards() { return playedCards; }
    public void setPlayedCards(List<List<Card>> playedCards) { this.playedCards = playedCards; }

    public int getBidRound() { return bidRound; }
    public void setBidRound(int bidRound) { this.bidRound = bidRound; }

    public String getFirstBidderId() { return firstBidderId; }
    public void setFirstBidderId(String firstBidderId) { this.firstBidderId = firstBidderId; }

    public int getBidCount() { return bidCount; }
    public void setBidCount(int bidCount) { this.bidCount = bidCount; }

    public int getRedealCount() { return redealCount; }
    public void setRedealCount(int redealCount) { this.redealCount = redealCount; }

    public boolean isGrabbing() { return isGrabbing; }
    public void setGrabbing(boolean grabbing) { isGrabbing = grabbing; }

    public Map<String, Boolean> getPlayerBids() { return playerBids; }
    public void setPlayerBids(Map<String, Boolean> playerBids) { this.playerBids = playerBids; }

    public String getLastPlayerId() { return lastPlayerId; }
    public void setLastPlayerId(String lastPlayerId) { this.lastPlayerId = lastPlayerId; }

    public long getTurnStartTime() { return turnStartTime; }
    public void setTurnStartTime(long turnStartTime) { this.turnStartTime = turnStartTime; }
}