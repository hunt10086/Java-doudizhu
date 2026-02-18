package com.game.doudizhu.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Track active sessions: sessionId -> gameId/playerId info
    private static final Map<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();

    public static class SessionInfo {
        String gameId;
        String playerId;

        SessionInfo(String gameId, String playerId) {
            this.gameId = gameId;
            this.playerId = playerId;
        }
    }

    // Register a session when player joins a game
    public static void registerSession(String sessionId, String gameId, String playerId) {
        activeSessions.put(sessionId, new SessionInfo(gameId, playerId));
        System.out.println("Session registered: " + sessionId + " -> gameId: " + gameId + ", playerId: " + playerId);
    }

    // Remove session registration
    public static void removeSession(String sessionId) {
        activeSessions.remove(sessionId);
        System.out.println("Session removed: " + sessionId);
    }

    // Get session info
    public static SessionInfo getSessionInfo(String sessionId) {
        return activeSessions.get(sessionId);
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            String sessionId = accessor.getSessionId();

            // Handle CONNECT - log connection
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                System.out.println("WebSocket CONNECT received, sessionId: " + sessionId);
            }

            // Handle SEND - check for game join/create messages to register session
            if (StompCommand.SEND.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null) {
                    // Handle game creation - store playerId temporarily
                    if (destination.equals("/app/game/create")) {
                        try {
                            String body = new String((byte[]) message.getPayload());
                            Map<String, Object> data = objectMapper.readValue(body, Map.class);
                            String playerId = (String) data.get("playerId");
                            // Temporarily register with null gameId, will update when game topic is subscribed
                            if (playerId != null) {
                                activeSessions.put(sessionId, new SessionInfo(null, playerId));
                            }
                            System.out.println("Game create request from player: " + playerId + ", sessionId: " + sessionId);
                        } catch (Exception e) {
                            System.out.println("Error parsing create message: " + e.getMessage());
                        }
                    }
                    // Handle game join
                    else if (destination.equals("/app/game/join")) {
                        try {
                            String body = new String((byte[]) message.getPayload());
                            Map<String, Object> data = objectMapper.readValue(body, Map.class);
                            String playerId = (String) data.get("playerId");
                            String gameId = (String) data.get("gameId");
                            if (playerId != null && gameId != null) {
                                registerSession(sessionId, gameId, playerId);
                            }
                            System.out.println("Game join request - player: " + playerId + ", gameId: " + gameId + ", sessionId: " + sessionId);
                        } catch (Exception e) {
                            System.out.println("Error parsing join message: " + e.getMessage());
                        }
                    }
                }
            }

            // Handle SUBSCRIBE - update gameId for game creation case
            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null && destination.startsWith("/topic/game/")) {
                    // Extract gameId from topic
                    String gameId = destination.replace("/topic/game/", "");
                    // Remove /chat suffix if present
                    if (gameId.contains("/chat")) {
                        gameId = gameId.replace("/chat", "");
                    }

                    // Check if we have a pending session (from game creation)
                    SessionInfo existingInfo = activeSessions.get(sessionId);
                    if (existingInfo != null && existingInfo.gameId == null && existingInfo.playerId != null) {
                        // This is a game creation - update with the gameId
                        registerSession(sessionId, gameId, existingInfo.playerId);
                        System.out.println("Updated session after game creation - sessionId: " + sessionId + ", gameId: " + gameId);
                    }
                }
            }
        }

        return message;
    }
}
