package com.game.doudizhu.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(WebSocketChannelInterceptor.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Track active sessions: sessionId -> gameId/playerId info
    private static final Map<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();

    // Reverse mapping: playerId -> sessionId, for handling reconnection/session migration
    private static final Map<String, String> playerSessionMap = new ConcurrentHashMap<>();

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

        // Handle session migration: if same playerId connects from new session,
        // clean up the old session entry
        if (playerId != null) {
            String oldSessionId = playerSessionMap.put(playerId, sessionId);
            if (oldSessionId != null && !oldSessionId.equals(sessionId)) {
                log.info("Player {} migrated from session {} to {}", playerId, oldSessionId, sessionId);
                activeSessions.remove(oldSessionId);
            }
        }

        log.debug("Session registered: {} -> gameId: {}, playerId: {}", sessionId, gameId, playerId);
    }

    // Remove session registration
    public static void removeSession(String sessionId) {
        SessionInfo info = activeSessions.remove(sessionId);
        if (info != null && info.playerId != null) {
            playerSessionMap.remove(info.playerId, sessionId);
        }
        log.debug("Session removed: {}", sessionId);
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
                log.info("WebSocket CONNECT received, sessionId: {}", sessionId);
            }

            // Handle DISCONNECT - clean up session
            if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                SessionInfo sessionInfo = activeSessions.get(sessionId);
                if (sessionInfo != null) {
                    // Check if this session was already superseded by a newer one
                    String mappedSessionId = playerSessionMap.get(sessionInfo.playerId);
                    if (mappedSessionId != null && !mappedSessionId.equals(sessionId)) {
                        log.info("DISCONNECT from old session {}, player {} has newer session {}, ignoring",
                            sessionId, sessionInfo.playerId, mappedSessionId);
                        activeSessions.remove(sessionId);
                        return message;
                    }

                    log.info("WebSocket DISCONNECT - sessionId: {}, playerId: {}, gameId: {}",
                        sessionId, sessionInfo.playerId, sessionInfo.gameId);
                    removeSession(sessionId);

                    // Notify GameService that player disconnected
                    if (sessionInfo.gameId != null && sessionInfo.playerId != null) {
                        try {
                            com.game.doudizhu.service.GameService gameService =
                                SpringContextHelper.getBean(com.game.doudizhu.service.GameService.class);
                            gameService.handlePlayerDisconnect(sessionInfo.gameId, sessionInfo.playerId);
                        } catch (Exception e) {
                            log.error("Error notifying GameService of disconnect: {}", e.getMessage());
                        }
                    }
                }
            }

            // Handle SEND - check for game join/create messages to register session
            if (StompCommand.SEND.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null) {
                    // Handle game creation - store playerId in native header (not in activeSessions with null gameId)
                    if (destination.equals("/app/game/create")) {
                        try {
                            String body = new String((byte[]) message.getPayload());
                            Map<String, Object> data = objectMapper.readValue(body, Map.class);
                            String playerId = (String) data.get("playerId");
                            if (playerId != null) {
                                accessor.setNativeHeader("pendingPlayerId", playerId);
                            }
                            log.debug("Game create request from player: {}, sessionId: {}", playerId, sessionId);
                        } catch (Exception e) {
                            log.error("Error parsing create message", e);
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
                            log.debug("Game join request - player: {}, gameId: {}, sessionId: {}", playerId, gameId, sessionId);
                        } catch (Exception e) {
                            log.error("Error parsing join message", e);
                        }
                    }
                }
            }

            // Handle SUBSCRIBE - register session from pending game creation
            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null && destination.startsWith("/topic/game/")) {
                    String gameId = destination.replace("/topic/game/", "");
                    if (gameId.contains("/chat")) {
                        gameId = gameId.replace("/chat", "");
                    }

                    // Get pending playerId from native headers (set during SEND frame for game/create)
                    String pendingPlayerId = accessor.getFirstNativeHeader("pendingPlayerId");
                    if (pendingPlayerId != null) {
                        registerSession(sessionId, gameId, pendingPlayerId);
                        log.info("Registered session after game creation - sessionId: {}, gameId: {}, playerId: {}",
                            sessionId, gameId, pendingPlayerId);
                    }
                }
            }
        }

        return message;
    }
}
