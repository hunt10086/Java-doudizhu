package com.game.doudizhu.model;

public class GameEvent {
    public enum EventType {
        PLAYER_JOIN,
        GAME_START,
        CARDS_DEAL,
        BID_REQUEST,
        BID_RESPONSE,
        PLAY_CARDS,
        PASS_TURN,
        GAME_END,
        PLAYER_DISCONNECT,
        CHAT_MESSAGE,
        NEXT_ROUND,
        TURN_START
    }

    private EventType type;
    private String gameId;
    private String playerId;
    private Object data;
    private String message;

    // Constructors
    public GameEvent() {}

    public GameEvent(EventType type, String gameId, String playerId, Object data) {
        this.type = type;
        this.gameId = gameId;
        this.playerId = playerId;
        this.data = data;
    }

    public GameEvent(EventType type, String gameId, String message) {
        this.type = type;
        this.gameId = gameId;
        this.message = message;
    }

    // Getters and setters
    public EventType getType() {
        return type;
    }

    public void setType(EventType type) {
        this.type = type;
    }

    public String getGameId() {
        return gameId;
    }

    public void setGameId(String gameId) {
        this.gameId = gameId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public void setPlayerId(String playerId) {
        this.playerId = playerId;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}