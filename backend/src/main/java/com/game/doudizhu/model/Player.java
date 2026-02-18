package com.game.doudizhu.model;

import java.util.List;

public class Player {
    private String id;
    private String name;
    private int position; // 0, 1, 2 for three players
    private boolean isLandlord;
    private boolean isHost;
    private List<Card> hand;
    private boolean isActive;
    private int score;

    // Constructors
    public Player() {}

    public Player(String id, String name, int position) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.hand = new java.util.ArrayList<>();
        this.isActive = true;
        this.score = 0;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public boolean isLandlord() { return isLandlord; }
    public void setLandlord(boolean landlord) { isLandlord = landlord; }

    public boolean isHost() { return isHost; }
    public void setHost(boolean host) { isHost = host; }

    public List<Card> getHand() { return hand; }
    public void setHand(List<Card> hand) { this.hand = hand; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}
