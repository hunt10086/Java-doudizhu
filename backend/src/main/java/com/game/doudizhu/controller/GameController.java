package com.game.doudizhu.controller;

import com.game.doudizhu.model.GameEvent;
import com.game.doudizhu.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Handle requests to create a new game
     */
    @MessageMapping("/game/create")
    public void createGame(@Payload GameEvent event) {
        String playerId = event.getPlayerId();
        String playerName = (String) event.getData();
        System.out.println("=== CREATE GAME === playerId: " + playerId + ", playerName: " + playerName);

        try {
            // Create game via service
            com.game.doudizhu.model.GameState gameState = gameService.createGame(playerId, playerName);
            System.out.println("Game created: " + gameState.getGameId() + ", roomId: " + gameState.getRoomId());

            // Send game created event back to the creator with room info (only basic player info)
            Map<String, Object> roomInfo = new HashMap<>();
            roomInfo.put("gameId", gameState.getGameId());
            roomInfo.put("roomId", gameState.getRoomId());
            roomInfo.put("players", getBasicPlayerInfo(gameState.getPlayers()));
            roomInfo.put("status", gameState.getStatus().name());
            roomInfo.put("isHost", true);

            GameEvent createdEvent = new GameEvent(
                GameEvent.EventType.GAME_START,
                gameState.getGameId(),
                playerId,
                roomInfo
            );

            String topic = "/topic/game/created_" + playerId;
            System.out.println("Sending to topic: " + topic);
            // Send to a player-specific topic that the creator will subscribe to
            messagingTemplate.convertAndSend(topic, createdEvent);
            System.out.println("Message sent successfully");
        } catch (Exception e) {
            System.out.println("Error creating game: " + e.getMessage());
            e.printStackTrace();
            // Handle error - broadcast error to the specific player via topic
            GameEvent errorEvent = new GameEvent(
                GameEvent.EventType.PLAYER_DISCONNECT,
                null,
                playerId,
                "Error creating game: " + e.getMessage()
            );
            messagingTemplate.convertAndSend("/topic/game/error_" + playerId, errorEvent);
        }
    }

    /**
     * Handle requests to join an existing game
     */
    @MessageMapping("/game/join")
    public void joinGame(@Payload GameEvent event) {
        // Extract game and player info from the event
        String gameId = event.getGameId();
        String playerId = event.getPlayerId();
        String playerName = (String) event.getData();

        try {
            com.game.doudizhu.model.GameState gameState = gameService.joinGame(gameId, playerId, playerName);

            // Send join success response (only basic player info)
            Map<String, Object> roomInfo = new HashMap<>();
            roomInfo.put("gameId", gameState.getGameId());
            roomInfo.put("roomId", gameState.getRoomId());
            roomInfo.put("players", getBasicPlayerInfo(gameState.getPlayers()));
            roomInfo.put("status", gameState.getStatus().name());
            roomInfo.put("isHost", false);

            GameEvent joinEvent = new GameEvent(
                GameEvent.EventType.PLAYER_JOIN,
                gameState.getGameId(),
                playerId,
                roomInfo
            );

            messagingTemplate.convertAndSend("/topic/game/joined_" + playerId, joinEvent);
        } catch (Exception e) {
            // Handle error
            GameEvent errorEvent = new GameEvent(
                GameEvent.EventType.PLAYER_DISCONNECT,
                gameId,
                playerId,
                "Error joining game: " + e.getMessage()
            );
            messagingTemplate.convertAndSend("/topic/game/error_" + playerId, errorEvent);
        }
    }

    /**
     * Helper method to get basic player info without sensitive data like hand cards
     */
    private java.util.List<Map<String, Object>> getBasicPlayerInfo(java.util.List<com.game.doudizhu.model.Player> players) {
        java.util.List<Map<String, Object>> basicInfo = new java.util.ArrayList<>();
        for (com.game.doudizhu.model.Player player : players) {
            Map<String, Object> info = new HashMap<>();
            info.put("id", player.getId());
            info.put("name", player.getName());
            info.put("position", player.getPosition());
            info.put("isHost", player.isHost());
            info.put("isLandlord", player.isLandlord());
            basicInfo.add(info);
        }
        return basicInfo;
    }

    /**
     * Handle requests to start a game
     */
    @MessageMapping("/game/start")
    public void startGame(@Payload GameEvent event) {
        String gameId = event.getGameId();

        try {
            gameService.startGame(gameId);
        } catch (Exception e) {
            // Handle error appropriately
            GameEvent errorEvent = new GameEvent(
                GameEvent.EventType.PLAYER_DISCONNECT, // Reusing this for errors
                gameId,
                event.getPlayerId(),
                "Error starting game: " + e.getMessage()
            );

            messagingTemplate.convertAndSendToUser(event.getPlayerId(), "/queue/errors", errorEvent);
        }
    }

    /**
     * Handle requests to start next round (only host can do this)
     */
    @MessageMapping("/game/nextRound")
    public void nextRound(@Payload GameEvent event) {
        String gameId = event.getGameId();
        String playerId = event.getPlayerId();

        try {
            gameService.nextRound(gameId, playerId);
        } catch (Exception e) {
            // Handle error appropriately
            GameEvent errorEvent = new GameEvent(
                GameEvent.EventType.PLAYER_DISCONNECT,
                gameId,
                playerId,
                "Error starting next round: " + e.getMessage()
            );

            messagingTemplate.convertAndSendToUser(playerId, "/queue/errors", errorEvent);
        }
    }

    /**
     * Handle bid responses from players
     */
    @MessageMapping("/game/bid")
    public void handleBid(@Payload GameEvent event) {
        String gameId = event.getGameId();
        String playerId = event.getPlayerId();
        Boolean bid = (Boolean) event.getData();

        try {
            gameService.processBid(gameId, playerId, bid);
        } catch (Exception e) {
            // Handle error appropriately
            GameEvent errorEvent = new GameEvent(
                GameEvent.EventType.PLAYER_DISCONNECT, // Reusing this for errors
                gameId,
                playerId,
                "Error processing bid: " + e.getMessage()
            );

            messagingTemplate.convertAndSendToUser(playerId, "/queue/errors", errorEvent);
        }
    }

    /**
     * Handle card plays from players
     */
    @MessageMapping("/game/play")
    public void handlePlay(@Payload GameEvent event) {
        String gameId = event.getGameId();
        String playerId = event.getPlayerId();

        try {
            // Extract cards from the event data (assuming the frontend sends the cards in the data field)
            // In a real implementation, we'd need to properly deserialize the cards from the payload
            @SuppressWarnings("unchecked")
            java.util.List<java.util.Map<String, String>> rawCards =
                (java.util.List<java.util.Map<String, String>>) event.getData();

            java.util.List<com.game.doudizhu.model.Card> cards = new java.util.ArrayList<>();
            if (rawCards != null) {
                for (java.util.Map<String, String> rawCard : rawCards) {
                    String suit = rawCard.get("suit");
                    String rank = rawCard.get("rank");
                    cards.add(new com.game.doudizhu.model.Card(suit, rank));
                }
            }

            gameService.playCards(gameId, playerId, cards);
        } catch (Exception e) {
            // Handle error appropriately
            GameEvent errorEvent = new GameEvent(
                GameEvent.EventType.PLAYER_DISCONNECT, // Reusing this for errors
                gameId,
                playerId,
                "Error processing play: " + e.getMessage()
            );

            messagingTemplate.convertAndSendToUser(playerId, "/queue/errors", errorEvent);
        }
    }

    /**
     * Handle pass requests from players
     */
    @MessageMapping("/game/pass")
    public void handlePass(@Payload GameEvent event) {
        String gameId = event.getGameId();
        String playerId = event.getPlayerId();

        try {
            gameService.passTurn(gameId, playerId);
        } catch (Exception e) {
            // Handle error appropriately
            GameEvent errorEvent = new GameEvent(
                GameEvent.EventType.PLAYER_DISCONNECT, // Reusing this for errors
                gameId,
                playerId,
                "Error processing pass: " + e.getMessage()
            );

            messagingTemplate.convertAndSendToUser(playerId, "/queue/errors", errorEvent);
        }
    }

    /**
     * Handle chat messages
     */
    @MessageMapping("/chat/send")
    public void sendChatMessage(@Payload GameEvent event) {
        String gameId = event.getGameId();
        String playerId = event.getPlayerId();

        // Get player name from game
        String senderName = playerId;
        if (gameService != null) {
            try {
                var gameState = gameService.getGameState(gameId);
                if (gameState != null && gameState.getPlayers() != null) {
                    for (var player : gameState.getPlayers()) {
                        if (player.getId().equals(playerId)) {
                            senderName = player.getName();
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                // Ignore
            }
        }

        // Add sender name to the data
        Map<String, Object> chatData = new HashMap<>();
        // Handle both string and object data
        Object data = event.getData();
        if (data instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> dataMap = (Map<String, Object>) data;
            // Extract text and messageId as strings/values, not objects
            Object textObj = dataMap.get("text");
            Object msgIdObj = dataMap.get("messageId");
            chatData.put("text", textObj != null ? textObj.toString() : "");
            chatData.put("messageId", msgIdObj != null ? msgIdObj.toString() : "");
        } else {
            chatData.put("text", data != null ? data.toString() : "");
        }
        chatData.put("senderName", senderName);
        chatData.put("playerId", playerId);

        // Create chat event with sender name
        GameEvent chatEvent = new GameEvent(
            GameEvent.EventType.CHAT_MESSAGE,
            gameId,
            playerId,
            chatData
        );

        // Broadcast the message to all players in the game
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/chat", chatEvent);
    }
}