package com.game.doudizhu.service;

import com.game.doudizhu.model.*;
import com.game.doudizhu.service.AIService;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class GameService {

    // Card type enumeration
    private enum CardType {
        SINGLE, PAIR, TRIPLE, TRIPLE_SINGLE, TRIPLE_PAIR,
        STRAIGHT, DOUBLE_STRAIGHT, AIRPLANE, BOMB, JOKER_BOMB
    }

    // Card value map
    private static final Map<String, Integer> CARD_VALUES = new HashMap<>();
    static {
        CARD_VALUES.put("3", 3); CARD_VALUES.put("4", 4); CARD_VALUES.put("5", 5);
        CARD_VALUES.put("6", 6); CARD_VALUES.put("7", 7); CARD_VALUES.put("8", 8);
        CARD_VALUES.put("9", 9); CARD_VALUES.put("10", 10); CARD_VALUES.put("J", 11);
        CARD_VALUES.put("Q", 12); CARD_VALUES.put("K", 13); CARD_VALUES.put("A", 14);
        CARD_VALUES.put("2", 15); CARD_VALUES.put("BJ", 16); CARD_VALUES.put("RJ", 17);
    }

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Resource
    private AIService aiService;

    // Store active games
    private final Map<String, GameState> activeGames = new ConcurrentHashMap<>();
    // 超时任务管理：gameId -> Future
    private final Map<String, java.util.concurrent.ScheduledFuture<?>> turnTimeoutTasks = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    /**
     * Create a new game room
     */
    public GameState createGame(String playerId, String playerName) {
        // 检查该playerId是否已在其他游戏中（防止重复创建/加入）
        for (GameState gs : activeGames.values()) {
            for (Player p : gs.getPlayers()) {
                if (p.getId().equals(playerId)) {
                    throw new RuntimeException("您已在其他房间中，请先离开");
                }
            }
        }

        // Generate a short 6-character room ID
        String roomId = generateRoomId();
        String gameId = "game_" + roomId;

        GameState gameState = new GameState();
        gameState.setGameId(gameId);
        gameState.setRoomId(roomId);
        gameState.setStatus(GameState.Status.WAITING);

        // Add the creating player
        Player player = new Player(playerId, playerName, 0);
        player.setHost(true);
        gameState.getPlayers().add(player);

        activeGames.put(gameId, gameState);

        return gameState;
    }

    /**
     * Generate a short 6-character room ID (guaranteed unique)
     */
    private String generateRoomId() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        String roomId;
        int attempts = 0;
        // Keep generating until we find a unique room ID
        do {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            roomId = sb.toString();
            attempts++;
            // Safety limit to prevent infinite loop
            if (attempts > 100) {
                throw new RuntimeException("Failed to generate unique room ID");
            }
        } while (isRoomIdExists(roomId));
        return roomId;
    }

    /**
     * Check if a room ID already exists
     */
    private boolean isRoomIdExists(String roomId) {
        return activeGames.values().stream()
            .anyMatch(game -> game.getRoomId() != null && game.getRoomId().equalsIgnoreCase(roomId));
    }

    /**
     * Join an existing game
     */
    public GameState joinGame(String gameId, String playerId, String playerName) {
        // Find game by roomId or gameId
        GameState gameState = null;
        if (gameId.startsWith("game_")) {
            gameState = activeGames.get(gameId);
        } else {
            // Search by roomId
            for (GameState gs : activeGames.values()) {
                if (gs.getRoomId() != null && gs.getRoomId().equalsIgnoreCase(gameId)) {
                    gameState = gs;
                    break;
                }
            }
        }

        if (gameState == null) {
            throw new RuntimeException("Game not found: " + gameId);
        }

        if (gameState.getPlayers().size() >= 3) {
            throw new RuntimeException("Game is full: " + gameId);
        }

        // 检查该playerId是否已在本游戏中（防止同一用户重复加入）
        for (Player existingPlayer : gameState.getPlayers()) {
            if (existingPlayer.getId().equals(playerId)) {
                throw new RuntimeException("您已在该房间中");
            }
        }

        // Add player to game
        Player player = new Player(playerId, playerName, gameState.getPlayers().size());
        gameState.getPlayers().add(player);

        // Use the actual gameId from GameState for broadcasting (not the incoming roomId)
        String broadcastGameId = gameState.getGameId();
        System.out.println("=== Broadcasting PLAYER_JOIN to /topic/game/" + broadcastGameId);

        // Broadcast player joined event
        GameEvent joinEvent = new GameEvent(
            GameEvent.EventType.PLAYER_JOIN,
            broadcastGameId,
            playerId,
            player
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, joinEvent);

        // Also send to each player privately to ensure they receive the notification
        for (Player p : gameState.getPlayers()) {
            GameEvent privateJoinEvent = new GameEvent(
                GameEvent.EventType.PLAYER_JOIN,
                broadcastGameId,
                p.getId(),
                player
            );
            messagingTemplate.convertAndSendToUser(p.getId(), "/queue/private", privateJoinEvent);
        }

        // Notify players that room is full and waiting for host to start
        if (gameState.getPlayers().size() >= 3) {
            // Broadcast room ready event to all players (only basic player info)
            Map<String, Object> roomReadyData = new HashMap<>();
            roomReadyData.put("roomId", gameState.getRoomId());
            roomReadyData.put("gameId", gameState.getGameId());
            roomReadyData.put("players", getBasicPlayerInfo(gameState.getPlayers()));
            roomReadyData.put("message", "房间已满，请房主开始游戏");
            roomReadyData.put("roomReady", true);

            GameEvent roomReadyEvent = new GameEvent(
                GameEvent.EventType.GAME_START, // Reuse event type
                broadcastGameId,
                null,
                roomReadyData
            );
            // Broadcast to all players in the room (use broadcastGameId)
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, roomReadyEvent);

            // Also send to each player privately
            for (Player p : gameState.getPlayers()) {
                messagingTemplate.convertAndSendToUser(p.getId(), "/queue/private", roomReadyEvent);
            }
        }

        return gameState;
    }

    /**
     * Add AI players to fill the room to 3 players
     */
    public void addAIPlayersIfNeeded(GameState gameState) {
        while (gameState.getPlayers().size() < 3) {
            String aiId = "AI_" + (gameState.getPlayers().size() + 1);
            String aiName = "电脑玩家" + (gameState.getPlayers().size() + 1);
            Player aiPlayer = new Player(aiId, aiName, gameState.getPlayers().size());
            gameState.getPlayers().add(aiPlayer);

            // Broadcast AI joined
            GameEvent joinEvent = new GameEvent(
                GameEvent.EventType.PLAYER_JOIN,
                gameState.getGameId(),
                aiId,
                aiPlayer
            );
            messagingTemplate.convertAndSend("/topic/game/" + gameState.getGameId(), joinEvent);
        }
    }

    /**
     * Get game state by gameId or roomId
     */
    public GameState getGameState(String gameId) {
        if (gameId == null) return null;

        // Try gameId first
        GameState gameState = activeGames.get(gameId);
        if (gameState != null) return gameState;

        // Try roomId
        for (GameState gs : activeGames.values()) {
            if (gs.getRoomId() != null && gs.getRoomId().equalsIgnoreCase(gameId)) {
                return gs;
            }
        }
        return null;
    }

    /**
     * Start the game
     */
    public void startGame(String gameId) {
        // Find game by roomId or gameId
        GameState gameState = null;
        if (gameId.startsWith("game_")) {
            gameState = activeGames.get(gameId);
        } else {
            // Search by roomId
            for (GameState gs : activeGames.values()) {
                if (gs.getRoomId() != null && gs.getRoomId().equalsIgnoreCase(gameId)) {
                    gameState = gs;
                    break;
                }
            }
        }

        if (gameState == null) {
            throw new RuntimeException("Game not found: " + gameId);
        }

        // Use actual gameId from gameState
        String broadcastGameId = gameState.getGameId();

        if (gameState.getPlayers().size() < 1) {
            throw new RuntimeException("Need at least 1 player to start game");
        }

        // Add AI players if needed to make 3 players
        addAIPlayersIfNeeded(gameState);

        // Initialize game
        gameState.setStatus(GameState.Status.DEALING);

        // Create and shuffle deck
        List<Card> deck = createDeck();
        Collections.shuffle(deck, random);

        // Deal cards to players
        for (int i = 0; i < 3; i++) {
            Player player = gameState.getPlayers().get(i);
            List<Card> hand = deck.subList(i * 17, (i + 1) * 17);
            player.setHand(new ArrayList<>(hand));
        }

        // Remaining 3 cards are landlord cards
        List<Card> landlordCards = deck.subList(51, 54);
        gameState.setLandlordCards(landlordCards);

        // Set to bidding state
        gameState.setStatus(GameState.Status.BIDDING);
        gameState.setCurrentPlayerId(gameState.getPlayers().get(0).getId());
        gameState.setBidRound(0);
        gameState.setFirstBidderId(null);
        gameState.setBidCount(0);
        gameState.setGrabbing(false);
        gameState.getPlayerBids().clear();

        // Send cards to each player via game topic (with target player ID in the message)
        for (Player player : gameState.getPlayers()) {
            Map<String, Object> dealData = new HashMap<>();
            dealData.put("targetPlayerId", player.getId());
            dealData.put("cards", player.getHand());

            GameEvent dealEvent = new GameEvent(
                GameEvent.EventType.CARDS_DEAL,
                broadcastGameId,
                player.getId(),  // This is the sender (server)
                dealData
            );

            // Broadcast to all players - frontend will check targetPlayerId
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, dealEvent);
        }

        // Notify all players of the game start (without sensitive info)
        Map<String, Object> startData = new HashMap<>();
        startData.put("gameId", gameState.getGameId());
        startData.put("roomId", gameState.getRoomId());
        startData.put("status", gameState.getStatus().name());
        startData.put("players", getBasicPlayerInfo(gameState.getPlayers()));

        // Add hand card counts for all players (everyone has 17 cards at start)
        Map<String, Integer> playerCardCounts = new HashMap<>();
        for (Player p : gameState.getPlayers()) {
            playerCardCounts.put(p.getId(), p.getHand() != null ? p.getHand().size() : 0);
        }
        startData.put("playerCardCounts", playerCardCounts);

        GameEvent startEvent = new GameEvent(
            GameEvent.EventType.GAME_START,
            broadcastGameId,
            null,
            startData
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, startEvent);

        // Start bidding with first player
        GameEvent bidRequest = new GameEvent(
            GameEvent.EventType.BID_REQUEST,
            broadcastGameId,
            gameState.getCurrentPlayerId(),
            null
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, bidRequest);

        // Schedule AI response after a short delay
        scheduleAIResponse(broadcastGameId);
    }

    /**
     * Start a new round (after game ends)
     */
    public void nextRound(String gameId, String requesterId) {
        // Find game by roomId or gameId
        GameState gameState = null;
        if (gameId.startsWith("game_")) {
            gameState = activeGames.get(gameId);
        } else {
            for (GameState gs : activeGames.values()) {
                if (gs.getRoomId() != null && gs.getRoomId().equalsIgnoreCase(gameId)) {
                    gameState = gs;
                    break;
                }
            }
        }

        if (gameState == null) {
            throw new RuntimeException("Game not found: " + gameId);
        }

        // Check if requester is host
        Player host = gameState.getPlayers().stream()
            .filter(Player::isHost)
            .findFirst()
            .orElse(null);

        if (host == null || !host.getId().equals(requesterId)) {
            throw new RuntimeException("Only host can start next round");
        }

        // Use actual gameId from gameState
        String broadcastGameId = gameState.getGameId();

        // Reset game state for new round
        gameState.setStatus(GameState.Status.DEALING);
        gameState.setLandlordId(null);
        gameState.setCurrentCards(new ArrayList<>());
        gameState.getPlayedCards().clear();
        gameState.setLastPlayerId(null);

        // Reset player states
        for (Player player : gameState.getPlayers()) {
            player.getHand().clear();
            player.setLandlord(false);
        }

        // Reset bidding state
        gameState.setBidRound(0);
        gameState.setFirstBidderId(null);
        gameState.setBidCount(0);
        gameState.setGrabbing(false);
        gameState.getPlayerBids().clear();

        // Create and shuffle deck
        List<Card> deck = createDeck();
        Collections.shuffle(deck, random);

        // Deal cards to players
        for (int i = 0; i < 3; i++) {
            Player player = gameState.getPlayers().get(i);
            List<Card> hand = deck.subList(i * 17, (i + 1) * 17);
            player.setHand(new ArrayList<>(hand));
        }

        // Remaining 3 cards are landlord cards
        List<Card> landlordCards = deck.subList(51, 54);
        gameState.setLandlordCards(landlordCards);

        // Set to bidding state
        gameState.setStatus(GameState.Status.BIDDING);
        gameState.setCurrentPlayerId(gameState.getPlayers().get(0).getId());

        // Send cards to each player
        for (Player player : gameState.getPlayers()) {
            Map<String, Object> dealData = new HashMap<>();
            dealData.put("targetPlayerId", player.getId());
            dealData.put("cards", player.getHand());

            GameEvent dealEvent = new GameEvent(
                GameEvent.EventType.CARDS_DEAL,
                broadcastGameId,
                player.getId(),
                dealData
            );

            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, dealEvent);
        }

        // Notify all players of the new round
        Map<String, Object> startData = new HashMap<>();
        startData.put("gameId", gameState.getGameId());
        startData.put("roomId", gameState.getRoomId());
        startData.put("status", gameState.getStatus().name());
        startData.put("players", getBasicPlayerInfo(gameState.getPlayers()));

        Map<String, Integer> playerCardCounts = new HashMap<>();
        for (Player p : gameState.getPlayers()) {
            playerCardCounts.put(p.getId(), p.getHand() != null ? p.getHand().size() : 0);
        }
        startData.put("playerCardCounts", playerCardCounts);

        GameEvent startEvent = new GameEvent(
            GameEvent.EventType.GAME_START,
            broadcastGameId,
            null,
            startData
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, startEvent);

        // Notify that next round is starting
        GameEvent nextRoundEvent = new GameEvent(
            GameEvent.EventType.NEXT_ROUND,
            broadcastGameId,
            null,
            "Next round is starting!"
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, nextRoundEvent);

        // Start bidding with first player
        GameEvent bidRequest = new GameEvent(
            GameEvent.EventType.BID_REQUEST,
            broadcastGameId,
            gameState.getCurrentPlayerId(),
            null
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, bidRequest);

        // Schedule AI response
        scheduleAIResponse(broadcastGameId);
    }

    /**
     * Handle player leaving the game
     * Returns true if player successfully left, false if game was destroyed (host left)
     */
    public boolean leaveGame(String gameId, String playerId) {
        GameState gameState = null;
        // Find game by roomId or gameId
        if (gameId != null && gameId.startsWith("game_")) {
            gameState = activeGames.get(gameId);
        } else if (gameId != null) {
            // Search by roomId
            for (GameState gs : activeGames.values()) {
                if (gs.getRoomId() != null && gs.getRoomId().equalsIgnoreCase(gameId)) {
                    gameState = gs;
                    break;
                }
            }
        }

        if (gameState == null) {
            return true; // Game doesn't exist, player can leave
        }

        String broadcastGameId = gameState.getGameId();
        Player leavingPlayer = null;

        // Find the leaving player
        for (Player player : gameState.getPlayers()) {
            if (player.getId().equals(playerId)) {
                leavingPlayer = player;
                break;
            }
        }

        if (leavingPlayer == null) {
            return true; // Player not in game
        }

        // Check if game is in progress (cannot leave while playing)
        if (gameState.getStatus() == GameState.Status.PLAYING ||
            gameState.getStatus() == GameState.Status.BIDDING) {
            // Cannot leave while game is in progress
            return false;
        }

        // Check if the leaving player is the host
        boolean isHost = leavingPlayer.isHost();

        // Remove player from game
        gameState.getPlayers().remove(leavingPlayer);

        // Broadcast player leave event
        GameEvent leaveEvent = new GameEvent(
            GameEvent.EventType.PLAYER_LEAVE,
            broadcastGameId,
            playerId,
            leavingPlayer.getName()
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, leaveEvent);

        // If host left or no players left, destroy the game
        if (isHost || gameState.getPlayers().isEmpty()) {
            // Destroy the game
            activeGames.remove(broadcastGameId);

            // Broadcast game destroyed event
            GameEvent destroyEvent = new GameEvent(
                GameEvent.EventType.GAME_DESTROYED,
                broadcastGameId,
                null,
                isHost ? "房主离开，房间已解散" : "房间已解散"
            );
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, destroyEvent);

            return true;
        }

        // If the host left but there are still players, reassign host
        if (isHost && !gameState.getPlayers().isEmpty()) {
            Player newHost = gameState.getPlayers().get(0);
            newHost.setHost(true);

            // Broadcast new host info
            GameEvent hostChangeEvent = new GameEvent(
                GameEvent.EventType.GAME_START,
                broadcastGameId,
                newHost.getId(),
                getBasicPlayerInfo(gameState.getPlayers())
            );
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, hostChangeEvent);
        }

        return true;
    }

    /**
     * Helper method to get basic player info without sensitive data like hand cards
     */
    private List<Map<String, Object>> getBasicPlayerInfo(List<Player> players) {
        List<Map<String, Object>> basicInfo = new ArrayList<>();
        for (Player player : players) {
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
     * Schedule AI response with a delay
     */
    private void scheduleAIResponse(String gameId) {
        scheduler.schedule(() -> {
            GameState gameState = activeGames.get(gameId);
            if (gameState == null) return;

            String currentPlayerId = gameState.getCurrentPlayerId();

            // Check if current player is AI
            if (currentPlayerId != null && currentPlayerId.startsWith("AI_")) {
                Player player = gameState.getPlayers().stream()
                    .filter(p -> p.getId().equals(currentPlayerId))
                    .findFirst()
                    .orElse(null);

                if (player == null) return;

                // Handle AI response based on game state
                if (gameState.getStatus() == GameState.Status.BIDDING) {
                    // AI bidding decision
                    boolean shouldBid = aiService.shouldBid(player, gameState.getLandlordCards(), gameState);
                    try {
                        processBid(gameId, currentPlayerId, shouldBid);
                    } catch (Exception e) {
                        // If bid fails, try false
                        try {
                            processBid(gameId, currentPlayerId, false);
                        } catch (Exception ex) {
                            // Ignore
                        }
                    }
                } else if (gameState.getStatus() == GameState.Status.PLAYING) {
                    // AI play decision
                    List<Card> prevCards = gameState.getCurrentCards();
                    boolean isFirstTurn = gameState.getPlayedCards() == null || gameState.getPlayedCards().isEmpty();

                    List<Card> cardsToPlay = aiService.chooseCardsToPlay(player, prevCards, isFirstTurn);

                    if (cardsToPlay != null && !cardsToPlay.isEmpty()) {
                        try {
                            playCards(gameId, currentPlayerId, cardsToPlay);
                        } catch (Exception e) {
                            // If play fails, try to pass
                            try {
                                passTurn(gameId, currentPlayerId);
                            } catch (Exception ex) {
                                // Ignore
                            }
                        }
                    } else {
                        // AI passes
                        try {
                            passTurn(gameId, currentPlayerId);
                        } catch (Exception e) {
                            // Ignore
                        }
                    }
                }
            }
        }, 1, TimeUnit.SECONDS);
    }

    /**
     * 调度玩家思考超时处理（30秒）
     * 如果超时，地主出最小的一张牌，非地主不出牌
     */
    private void scheduleTurnTimeout(String gameId) {
        // 取消之前的超时任务
        java.util.concurrent.ScheduledFuture<?> existingTask = turnTimeoutTasks.get(gameId);
        if (existingTask != null) {
            existingTask.cancel(false);
        }

        GameState gameState = activeGames.get(gameId);
        if (gameState == null || gameState.getStatus() != GameState.Status.PLAYING) {
            return;
        }

        String currentPlayerId = gameState.getCurrentPlayerId();
        if (currentPlayerId == null || currentPlayerId.startsWith("AI_")) {
            return; // AI 玩家不需要超时处理
        }

        // 调度30秒后的超时处理
        java.util.concurrent.ScheduledFuture<?> future = scheduler.schedule(() -> {
            GameState gs = activeGames.get(gameId);
            if (gs == null) return;

            // 检查是否仍然是同一个玩家的回合
            if (!currentPlayerId.equals(gs.getCurrentPlayerId())) {
                return; // 玩家已经出牌，超时任务取消
            }

            if (gs.getStatus() != GameState.Status.PLAYING) {
                return;
            }

            System.out.println("=== Player timeout: " + currentPlayerId + " ===");

            // 判断是否是地主
            boolean isLandlord = currentPlayerId.equals(gs.getLandlordId());

            if (isLandlord) {
                // 地主：出最小的一张牌
                Player landlord = gs.getPlayers().stream()
                    .filter(p -> p.getId().equals(currentPlayerId))
                    .findFirst()
                    .orElse(null);

                if (landlord != null && !landlord.getHand().isEmpty()) {
                    // 找出最小的牌
                    List<Card> hand = landlord.getHand();
                    Card minCard = hand.get(0);
                    for (Card c : hand) {
                        if (getCardValue(c) < getCardValue(minCard)) {
                            minCard = c;
                        }
                    }

                    List<Card> cardsToPlay = new ArrayList<>();
                    cardsToPlay.add(minCard);

                    try {
                        System.out.println("=== Landlord timeout auto-play: " + minCard);
                        playCards(gameId, currentPlayerId, cardsToPlay);
                    } catch (Exception e) {
                        System.out.println("=== Auto-play failed: " + e.getMessage());
                        // 如果出牌失败，尝试不出
                        try {
                            passTurn(gameId, currentPlayerId);
                        } catch (Exception ex) {
                            // Ignore
                        }
                    }
                }
            } else {
                // 非地主：不出牌
                try {
                    System.out.println("=== Non-landlord timeout: auto pass");
                    passTurn(gameId, currentPlayerId);
                } catch (Exception e) {
                    System.out.println("=== Auto pass failed: " + e.getMessage());
                }
            }
        }, 30, TimeUnit.SECONDS);

        turnTimeoutTasks.put(gameId, future);
    }

    /**
     * 获取牌的数值用于比较
     */
    private int getCardValue(Card card) {
        if (card == null) return 0;
        String rank = card.getRank();
        return CARD_VALUES.getOrDefault(rank, 0);
    }

    /**
     * Process a bid response
     * @param gameId the game ID
     * @param playerId the player ID
     * @param bid true = bid (call/grab landlord), false = no bid
     */
    public void processBid(String gameId, String playerId, boolean bid) {
        GameState gameState = activeGames.get(gameId);
        if (gameState == null) {
            throw new RuntimeException("Game not found: " + gameId);
        }

        // Use actual gameId from gameState for broadcasting
        String broadcastGameId = gameState.getGameId();

        if (!gameState.getCurrentPlayerId().equals(playerId)) {
            throw new RuntimeException("Not your turn to bid");
        }

        int currentPlayerIndex = gameState.getPlayers().indexOf(
            gameState.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElse(null)
        );

        Player currentPlayer = gameState.getPlayers().get(currentPlayerIndex);

        // Record player's bid
        gameState.getPlayerBids().put(playerId, bid);

        // Broadcast bid response
        GameEvent bidResponse = new GameEvent(
            GameEvent.EventType.BID_RESPONSE,
            broadcastGameId,
            playerId,
            bid
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, bidResponse);

        if (bid) {
            // Player chose to bid
            gameState.setBidCount(gameState.getBidCount() + 1);

            if (gameState.getFirstBidderId() == null) {
                // First bid - start bidding phase
                gameState.setFirstBidderId(playerId);
                gameState.setBidRound(1);
            } else if (!gameState.isGrabbing()) {
                // First bid was made, now entering grabbing mode
                gameState.setGrabbing(true);
                gameState.setBidRound(gameState.getBidRound() + 1);
            } else {
                // Already in grabbing mode, update bid round
                gameState.setBidRound(gameState.getBidRound() + 1);
            }
        }

        // Determine if bidding should end
        if (shouldEndBidding(gameState)) {
            // End bidding and determine landlord
            determineLandlord(gameState);
            return;
        }

        // Move to next player for bidding
        int nextPlayerIndex = (currentPlayerIndex + 1) % gameState.getPlayers().size();
        Player nextPlayer = gameState.getPlayers().get(nextPlayerIndex);
        gameState.setCurrentPlayerId(nextPlayer.getId());

        // Request next player to bid
        GameEvent nextBid = new GameEvent(
            GameEvent.EventType.BID_REQUEST,
            broadcastGameId,
            nextPlayer.getId(),
            gameState.isGrabbing() ? "grab" : "bid"
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, nextBid);

        // Schedule AI response for next player
        scheduleAIResponse(broadcastGameId);
    }

    /**
     * Determine if bidding should end
     */
    private boolean shouldEndBidding(GameState gameState) {
        // Check if all players passed (no one called landlord) - need to redeal
        if (allPlayersPassed(gameState)) {
            return true;
        }

        // If someone bid and all other players have had a chance to respond
        if (gameState.getFirstBidderId() != null) {
            int playersResponded = gameState.getPlayerBids().size();
            // Check if all players except the first bidder have responded
            if (playersResponded >= gameState.getPlayers().size()) {
                // All players have responded
                // If in grabbing mode, check if we should continue
                if (gameState.isGrabbing()) {
                    // Check if there are any more valid grabs
                    return true; // End after everyone has had a chance
                }
                return true;
            }

            // Special case: if first bidder is the last player and they bid,
            // and all others have responded (no more players to ask)
            if (gameState.getBidRound() > 0) {
                String firstBidder = gameState.getFirstBidderId();
                int firstBidderIndex = gameState.getPlayers().indexOf(
                    gameState.getPlayers().stream()
                        .filter(p -> p.getId().equals(firstBidder))
                        .findFirst()
                        .orElse(null)
                );

                int currentPlayerIndex = gameState.getPlayers().indexOf(
                    gameState.getPlayers().stream()
                        .filter(p -> p.getId().equals(gameState.getCurrentPlayerId()))
                        .findFirst()
                        .orElse(null)
                );

                // If we've gone around and come back to the first bidder
                if (currentPlayerIndex == firstBidderIndex && gameState.isGrabbing()) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if all players passed on bidding (no one called landlord)
     */
    private boolean allPlayersPassed(GameState gameState) {
        // If firstBidderId is null, no one has bid yet
        if (gameState.getFirstBidderId() == null) {
            // Check if all players have had a chance to bid
            return gameState.getPlayerBids().size() >= gameState.getPlayers().size();
        }
        return false;
    }

    /**
     * Redeal cards when all players pass on bidding
     */
    private void redealCards(GameState gameState) {
        String broadcastGameId = gameState.getGameId();

        // Increment redeal count
        int redealCount = gameState.getRedealCount() + 1;
        gameState.setRedealCount(redealCount);

        // If we've redealt too many times, just make first player landlord
        if (redealCount >= 3) {
            // Reset bidding state and make first player landlord
            gameState.setFirstBidderId(gameState.getPlayers().get(0).getId());
            gameState.setLandlordId(gameState.getPlayers().get(0).getId());
            gameState.setStatus(GameState.Status.PLAYING);
            gameState.setCurrentPlayerId(gameState.getPlayers().get(0).getId());
            gameState.setLastPlayerId(gameState.getPlayers().get(0).getId());

            // Add landlord cards to landlord's hand
            if (gameState.getLandlordCards() != null) {
                gameState.getPlayers().get(0).getHand().addAll(gameState.getLandlordCards());
            }

            // Notify players
            Map<String, Object> landlordData = new HashMap<>();
            landlordData.put("landlordId", gameState.getPlayers().get(0).getId());
            // Send landlord cards to all players
            landlordData.put("landlordCards", gameState.getLandlordCards());
            GameEvent landlordEvent = new GameEvent(
                GameEvent.EventType.BID_RESPONSE,
                broadcastGameId,
                "LANDLORD_DETERMINED",
                landlordData
            );
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, landlordEvent);

            // Calculate player card counts for all players
            Map<String, Integer> playerCardCounts = new HashMap<>();
            for (Player p : gameState.getPlayers()) {
                playerCardCounts.put(p.getId(), p.getHand() != null ? p.getHand().size() : 0);
            }

            // Send updated hands
            for (Player player : gameState.getPlayers()) {
                Map<String, Object> dealData = new HashMap<>();
                dealData.put("targetPlayerId", player.getId());
                dealData.put("cards", player.getHand());
                dealData.put("playerCardCounts", playerCardCounts);
                GameEvent dealEvent = new GameEvent(
                    GameEvent.EventType.CARDS_DEAL,
                    broadcastGameId,
                    player.getId(),
                    dealData
                );
                messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, dealEvent);
            }

            // Request landlord to play
            Map<String, Object> firstPlayData = new HashMap<>();
            firstPlayData.put("canPass", false);
            GameEvent playRequest = new GameEvent(
                GameEvent.EventType.PLAY_CARDS,
                broadcastGameId,
                gameState.getPlayers().get(0).getId(),
                firstPlayData
            );
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, playRequest);
            scheduleAIResponse(broadcastGameId);
            // 调度玩家思考超时（30秒）
            scheduleTurnTimeout(broadcastGameId);
            return;
        }

        // Reset bidding state
        gameState.setCurrentPlayerId(null);
        gameState.setBidRound(0);
        gameState.setFirstBidderId(null);
        gameState.setBidCount(0);
        gameState.setGrabbing(false);
        gameState.getPlayerBids().clear();

        // Create and shuffle deck again
        List<Card> deck = createDeck();
        Collections.shuffle(deck, random);

        // Deal cards to players
        for (int i = 0; i < 3; i++) {
            Player player = gameState.getPlayers().get(i);
            List<Card> hand = deck.subList(i * 17, (i + 1) * 17);
            player.setHand(new ArrayList<>(hand));
        }

        // Remaining 3 cards are landlord cards
        List<Card> landlordCards = deck.subList(51, 54);
        gameState.setLandlordCards(landlordCards);

        // Set to bidding state
        gameState.setStatus(GameState.Status.BIDDING);

        // Find the first player to bid - start from landlord's next player (clockwise)
        String firstBidPlayerId;
        String previousLandlordId = gameState.getLandlordId();

        if (previousLandlordId != null && !previousLandlordId.isEmpty()) {
            // Find landlord's index and use the next player (clockwise)
            int landlordIndex = -1;
            for (int i = 0; i < gameState.getPlayers().size(); i++) {
                if (gameState.getPlayers().get(i).getId().equals(previousLandlordId)) {
                    landlordIndex = i;
                    break;
                }
            }
            if (landlordIndex >= 0) {
                // Next player clockwise (index + 1, wrap around)
                int nextPlayerIndex = (landlordIndex + 1) % gameState.getPlayers().size();
                firstBidPlayerId = gameState.getPlayers().get(nextPlayerIndex).getId();
            } else {
                // If landlord not found, use first player
                firstBidPlayerId = gameState.getPlayers().get(0).getId();
            }
        } else {
            // First game, start from first player
            firstBidPlayerId = gameState.getPlayers().get(0).getId();
        }

        gameState.setCurrentPlayerId(firstBidPlayerId);

        // Notify all players about the redeal
        Map<String, Object> redealData = new HashMap<>();
        redealData.put("message", "所有人都不叫，重新发牌！");

        GameEvent redealEvent = new GameEvent(
            GameEvent.EventType.GAME_START,
            broadcastGameId,
            null,
            redealData
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, redealEvent);

        // Send new cards to each player
        for (Player player : gameState.getPlayers()) {
            Map<String, Object> dealData = new HashMap<>();
            dealData.put("targetPlayerId", player.getId());
            dealData.put("cards", player.getHand());

            GameEvent dealEvent = new GameEvent(
                GameEvent.EventType.CARDS_DEAL,
                broadcastGameId,
                player.getId(),
                dealData
            );
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, dealEvent);
        }

        // Notify all players of game start with new cards
        Map<String, Integer> playerCardCounts = new HashMap<>();
        for (Player p : gameState.getPlayers()) {
            playerCardCounts.put(p.getId(), p.getHand() != null ? p.getHand().size() : 0);
        }

        Map<String, Object> startData = new HashMap<>();
        startData.put("status", "BIDDING");
        startData.put("playerCardCounts", playerCardCounts);

        GameEvent startEvent = new GameEvent(
            GameEvent.EventType.GAME_START,
            broadcastGameId,
            null,
            startData
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, startEvent);

        // Request first player to bid
        GameEvent bidRequest = new GameEvent(
            GameEvent.EventType.BID_REQUEST,
            broadcastGameId,
            gameState.getPlayers().get(0).getId(),
            "bid"
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, bidRequest);

        // Schedule AI response
        scheduleAIResponse(broadcastGameId);
    }

    /**
     * Determine the landlord and start playing
     */
    private void determineLandlord(GameState gameState) {
        // Check if all players passed - if so, redeal cards
        if (allPlayersPassed(gameState)) {
            redealCards(gameState);
            return;
        }

        String landlordId = gameState.getFirstBidderId();

        if (landlordId == null) {
            // No one bid - first player becomes landlord by default
            landlordId = gameState.getPlayers().get(0).getId();
        }

        gameState.setLandlordId(landlordId);
        gameState.setStatus(GameState.Status.PLAYING);
        gameState.setCurrentPlayerId(landlordId);
        gameState.setLastPlayerId(landlordId); // Initialize last player to landlord

        // Use actual gameId for broadcasting
        String broadcastGameId = gameState.getGameId();

        // Add landlord cards to landlord's hand
        final String finalLandlordId = landlordId;
        Player landlord = gameState.getPlayers().stream()
            .filter(p -> p.getId().equals(finalLandlordId))
            .findFirst()
            .orElse(null);

        if (landlord != null && gameState.getLandlordCards() != null) {
            landlord.getHand().addAll(gameState.getLandlordCards());
        }

        // Send updated hand to ALL players (with landlord cards for landlord) - via game topic
        for (Player player : gameState.getPlayers()) {
            Map<String, Object> dealData = new HashMap<>();
            dealData.put("targetPlayerId", player.getId());
            dealData.put("cards", player.getHand());

            GameEvent dealEvent = new GameEvent(
                GameEvent.EventType.CARDS_DEAL,
                broadcastGameId,
                player.getId(),
                dealData
            );
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, dealEvent);
        }

        // Notify all players of landlord (with landlord cards visible to all)
        Map<String, Object> landlordData = new HashMap<>();
        landlordData.put("landlordId", finalLandlordId);
        // Send landlord cards to all players
        landlordData.put("landlordCards", gameState.getLandlordCards());

        GameEvent landlordEvent = new GameEvent(
            GameEvent.EventType.BID_RESPONSE,
            broadcastGameId,
            "LANDLORD_DETERMINED",
            landlordData
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, landlordEvent);

        // Notify all players that game is now in playing state
        Map<String, Object> playData = new HashMap<>();
        playData.put("status", "PLAYING");
        playData.put("landlordId", finalLandlordId);
        playData.put("currentPlayerId", finalLandlordId);

        // Add player card counts
        Map<String, Integer> playerCardCounts = new HashMap<>();
        for (Player p : gameState.getPlayers()) {
            playerCardCounts.put(p.getId(), p.getHand() != null ? p.getHand().size() : 0);
        }
        playData.put("playerCardCounts", playerCardCounts);

        GameEvent playStateEvent = new GameEvent(
            GameEvent.EventType.GAME_START,
            broadcastGameId,
            null,
            playData
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, playStateEvent);

        // Request landlord to play first card (cannot pass on first turn)
        Map<String, Object> firstPlayData = new HashMap<>();
        firstPlayData.put("canPass", false); // First player cannot pass

        GameEvent playRequest = new GameEvent(
            GameEvent.EventType.PLAY_CARDS,
            broadcastGameId,
            finalLandlordId,
            firstPlayData
        );
        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, playRequest);

        // Schedule AI response for first play
        scheduleAIResponse(broadcastGameId);

        // 调度玩家思考超时（30秒）
        scheduleTurnTimeout(broadcastGameId);

        // 发送回合开始事件，用于前端倒计时
        sendTurnStartEvent(broadcastGameId, finalLandlordId);
    }

    /**
     * Process a card play
     */
    public void playCards(String gameId, String playerId, List<Card> cards) {
        GameState gameState = activeGames.get(gameId);
        if (gameState == null) {
            throw new RuntimeException("Game not found: " + gameId);
        }

        // Use actual gameId from gameState for broadcasting
        String broadcastGameId = gameState.getGameId();

        if (!gameState.getCurrentPlayerId().equals(playerId)) {
            throw new RuntimeException("Not your turn to play cards");
        }

        // Validate the play
        boolean isFirstTurn = gameState.getPlayedCards() == null || gameState.getPlayedCards().isEmpty();
        List<Card> prevCards = gameState.getCurrentCards();
        Map<String, Object> validation = validatePlay(cards, prevCards, isFirstTurn);

        if (!(Boolean) validation.getOrDefault("valid", false)) {
            String reason = (String) validation.getOrDefault("reason", "Invalid move");
            throw new RuntimeException("Invalid play: " + reason);
        }

        // Find the player
        Player player = gameState.getPlayers().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElse(null);

        if (player == null) {
            throw new RuntimeException("Player not found in game: " + playerId);
        }

        // Remove cards from player's hand
        for (Card card : cards) {
            player.getHand().removeIf(c -> c.equals(card));
        }

        // Update current cards on table
        gameState.setCurrentCards(cards);

        // Add to played cards history
        gameState.getPlayedCards().add(new ArrayList<>(cards));

        // Set last player (the one who just played)
        gameState.setLastPlayerId(playerId);

        // Move to next player
        int currentPlayerIndex = gameState.getPlayers().indexOf(player);
        int nextPlayerIndex = (currentPlayerIndex + 1) % gameState.getPlayers().size();
        Player nextPlayer = gameState.getPlayers().get(nextPlayerIndex);
        gameState.setCurrentPlayerId(nextPlayer.getId());

        // Check if player has won (no more cards)
        boolean playerWon = player.getHand().isEmpty();
        if (playerWon) {
            gameState.setStatus(GameState.Status.FINISHED);
        }

        // Send play event to all players
        Map<String, Object> playData = new HashMap<>();
        playData.put("playerId", playerId);
        playData.put("cards", cards);
        playData.put("nextPlayerId", nextPlayer.getId());
        playData.put("playerWon", playerWon);

        // Add player name for winner display
        Player winner = gameState.getPlayers().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElse(null);
        if (winner != null) {
            playData.put("playerName", winner.getName());
        }

        // Add hand card counts for all players (without revealing actual cards)
        Map<String, Integer> playerCardCounts = new HashMap<>();
        for (Player p : gameState.getPlayers()) {
            playerCardCounts.put(p.getId(), p.getHand() != null ? p.getHand().size() : 0);
        }
        playData.put("playerCardCounts", playerCardCounts);

        GameEvent playEvent = new GameEvent(
            GameEvent.EventType.PLAY_CARDS,
            broadcastGameId,
            playerId,
            playData
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, playEvent);

        if (!playerWon) {
            // Request next player to play or pass
            // Check if next player is the last player (must play, cannot pass)
            boolean canPass = !playerId.equals(nextPlayer.getId());
            Map<String, Object> nextTurnData = new HashMap<>();
            nextTurnData.put("canPass", canPass);

            GameEvent nextTurn = new GameEvent(
                GameEvent.EventType.PLAY_CARDS,
                broadcastGameId,
                nextPlayer.getId(),
                nextTurnData
            );

            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, nextTurn);

            // Schedule AI response for next player
            scheduleAIResponse(broadcastGameId);

            // 调度玩家思考超时（30秒）
            scheduleTurnTimeout(broadcastGameId);

            // 发送回合开始事件，用于前端倒计时
            sendTurnStartEvent(broadcastGameId, nextPlayer.getId());
        } else {
            // Game ended
            GameEvent endEvent = new GameEvent(
                GameEvent.EventType.GAME_END,
                broadcastGameId,
                playerId, // winner
                player
            );

            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, endEvent);
        }
    }

    /**
     * Process a pass (skip turn)
     */
    public void passTurn(String gameId, String playerId) {
        GameState gameState = activeGames.get(gameId);
        if (gameState == null) {
            throw new RuntimeException("Game not found: " + gameId);
        }

        // Use actual gameId from gameState for broadcasting
        String broadcastGameId = gameState.getGameId();

        if (!gameState.getCurrentPlayerId().equals(playerId)) {
            throw new RuntimeException("Not your turn to pass");
        }

        // Find the player
        Player player = gameState.getPlayers().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElse(null);

        if (player == null) {
            throw new RuntimeException("Player not found in game: " + playerId);
        }

        // Track pass count - when everyone passes, clear the table and go back to last player
        String lastPlayerId = gameState.getLastPlayerId();

        // Move to next player
        int currentPlayerIndex = gameState.getPlayers().indexOf(player);
        int nextPlayerIndex = (currentPlayerIndex + 1) % gameState.getPlayers().size();
        Player nextPlayer = gameState.getPlayers().get(nextPlayerIndex);

        // Check if we've gone full circle - all other players passed
        if (lastPlayerId != null && lastPlayerId.equals(nextPlayer.getId())) {
            // Everyone passed - clear the table and let last player play again
            gameState.setCurrentCards(new ArrayList<>());
            gameState.setCurrentPlayerId(lastPlayerId);

            // Notify all players that table is cleared and last player must play
            Map<String, Object> clearData = new HashMap<>();
            clearData.put("cards", new ArrayList<>());
            clearData.put("playerId", lastPlayerId);
            clearData.put("tableCleared", true);
            clearData.put("mustPlay", true); // Last player must play, cannot pass

            GameEvent clearEvent = new GameEvent(
                GameEvent.EventType.PLAY_CARDS,
                broadcastGameId,
                lastPlayerId,
                clearData
            );
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, clearEvent);

            // Request last player to play
            GameEvent nextTurn = new GameEvent(
                GameEvent.EventType.PLAY_CARDS,
                broadcastGameId,
                lastPlayerId,
                null
            );
            messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, nextTurn);

            // Schedule AI response
            scheduleAIResponse(broadcastGameId);

            // 调度玩家思考超时（30秒）
            scheduleTurnTimeout(broadcastGameId);

            // 发送回合开始事件，用于前端倒计时
            sendTurnStartEvent(broadcastGameId, lastPlayerId);
            return;
        }

        gameState.setCurrentPlayerId(nextPlayer.getId());

        // Send pass event to all players
        Map<String, Object> passData = new HashMap<>();
        passData.put("playerId", playerId);
        passData.put("nextPlayerId", nextPlayer.getId());
        passData.put("canPass", true); // Next player can pass

        GameEvent passEvent = new GameEvent(
            GameEvent.EventType.PASS_TURN,
            broadcastGameId,
            playerId,
            passData
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, passEvent);

        // Request next player to play or pass
        GameEvent nextTurn = new GameEvent(
            GameEvent.EventType.PLAY_CARDS,
            broadcastGameId,
            nextPlayer.getId(),
            null
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, nextTurn);

        // Schedule AI response for next player
        scheduleAIResponse(broadcastGameId);

        // 调度玩家思考超时（30秒）
        scheduleTurnTimeout(broadcastGameId);

        // 发送回合开始事件，用于前端倒计时
        sendTurnStartEvent(broadcastGameId, nextPlayer.getId());
    }

    /**
     * 发送回合开始事件，用于前端倒计时显示
     */
    private void sendTurnStartEvent(String gameId, String playerId) {
        GameEvent turnStartEvent = new GameEvent(
            GameEvent.EventType.TURN_START,
            gameId,
            playerId,
            null
        );
        messagingTemplate.convertAndSend("/topic/game/" + gameId, turnStartEvent);
    }

    /**
     * Create a standard 54-card deck (including jokers)
     */
    private List<Card> createDeck() {
        List<Card> deck = new ArrayList<>();

        // Standard suits and ranks
        String[] suits = {"hearts", "diamonds", "clubs", "spades"};
        String[] ranks = {"3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"};

        // Add regular cards
        for (String suit : suits) {
            for (String rank : ranks) {
                deck.add(new Card(suit, rank));
            }
        }

        // Add jokers
        deck.add(new Card("joker", "BJ"));
        deck.add(new Card("joker", "RJ"));

        return deck;
    }

    /**
     * Generate a unique game ID
     */
    private String generateGameId() {
        return "game_" + System.currentTimeMillis() + "_" + random.nextInt(10000);
    }

    /**
     * Handle player disconnection
     */
    public void handleDisconnect(String gameId, String playerId) {
        GameState gameState = activeGames.get(gameId);
        if (gameState == null) {
            return; // Game might already be finished
        }

        // Use actual gameId from gameState for broadcasting
        String broadcastGameId = gameState.getGameId();

        // Notify other players
        GameEvent disconnectEvent = new GameEvent(
            GameEvent.EventType.PLAYER_DISCONNECT,
            broadcastGameId,
            playerId,
            null
        );

        messagingTemplate.convertAndSend("/topic/game/" + broadcastGameId, disconnectEvent);
    }

    /**
     * Analyze card type and return analysis result
     */
    private Map<String, Object> analyzeCards(List<Card> cards) {
        Map<String, Object> result = new HashMap<>();
        result.put("valid", false);

        if (cards == null || cards.isEmpty()) {
            return result;
        }

        // Check for Joker Bomb
        boolean hasBJ = cards.stream().anyMatch(c -> "BJ".equals(c.getRank()));
        boolean hasRJ = cards.stream().anyMatch(c -> "RJ".equals(c.getRank()));
        if (hasBJ && hasRJ) {
            result.put("type", CardType.JOKER_BOMB);
            result.put("valid", true);
            result.put("value", 20);
            return result;
        }

        // Group by rank
        Map<String, List<Card>> groups = cards.stream()
            .collect(Collectors.groupingBy(Card::getRank));
        List<Integer> groupCounts = groups.values().stream()
            .map(List::size)
            .sorted((a, b) -> b - a)
            .collect(Collectors.toList());

        // Check for Bomb
        if (groupCounts.get(0) == 4) {
            String bombRank = groups.entrySet().stream()
                .filter(e -> e.getValue().size() == 4)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("2");
            result.put("type", CardType.BOMB);
            result.put("valid", true);
            result.put("value", CARD_VALUES.getOrDefault(bombRank, 15) + 5);
            return result;
        }

        // Check for single
        if (cards.size() == 1) {
            result.put("type", CardType.SINGLE);
            result.put("valid", true);
            result.put("value", CARD_VALUES.getOrDefault(cards.get(0).getRank(), 0));
            return result;
        }

        // Check for pair
        if (cards.size() == 2 && groupCounts.get(0) == 2) {
            String pairRank = groups.entrySet().stream()
                .filter(e -> e.getValue().size() == 2)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("2");
            result.put("type", CardType.PAIR);
            result.put("valid", true);
            result.put("value", CARD_VALUES.getOrDefault(pairRank, 15));
            return result;
        }

        // Check for triple
        if (cards.size() == 3 && groupCounts.get(0) == 3) {
            String tripleRank = groups.entrySet().stream()
                .filter(e -> e.getValue().size() == 3)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("2");
            result.put("type", CardType.TRIPLE);
            result.put("valid", true);
            result.put("value", CARD_VALUES.getOrDefault(tripleRank, 15));
            return result;
        }

        // Check for triple + single
        if (cards.size() == 4 && groupCounts.get(0) == 3) {
            String tripleRank = groups.entrySet().stream()
                .filter(e -> e.getValue().size() == 3)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("2");
            result.put("type", CardType.TRIPLE_SINGLE);
            result.put("valid", true);
            result.put("value", CARD_VALUES.getOrDefault(tripleRank, 15));
            return result;
        }

        // Check for triple + pair
        if (cards.size() == 5 && groupCounts.get(0) == 3 && groupCounts.get(1) == 2) {
            String tripleRank = groups.entrySet().stream()
                .filter(e -> e.getValue().size() == 3)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("2");
            result.put("type", CardType.TRIPLE_PAIR);
            result.put("valid", true);
            result.put("value", CARD_VALUES.getOrDefault(tripleRank, 15));
            return result;
        }

        // Check for straight
        if (cards.size() >= 5 && groupCounts.get(0) == 1) {
            List<String> ranks = cards.stream()
                .map(Card::getRank)
                .filter(r -> CARD_VALUES.containsKey(r) && CARD_VALUES.get(r) <= 14)
                .sorted(Comparator.comparingInt(r -> CARD_VALUES.get(r)))
                .distinct()
                .collect(Collectors.toList());

            if (ranks.size() >= 5 && isSequential(ranks)) {
                result.put("type", CardType.STRAIGHT);
                result.put("valid", true);
                result.put("length", ranks.size());
                result.put("value", CARD_VALUES.get(ranks.get(ranks.size() - 1)));
                return result;
            }
        }

        // Check for double straight
        if (cards.size() >= 6) {
            List<String> pairRanks = groups.entrySet().stream()
                .filter(e -> e.getValue().size() == 2)
                .map(Map.Entry::getKey)
                .filter(r -> CARD_VALUES.containsKey(r) && CARD_VALUES.get(r) <= 14)
                .sorted(Comparator.comparingInt(r -> CARD_VALUES.get(r)))
                .collect(Collectors.toList());

            if (pairRanks.size() >= 3 && isSequential(pairRanks)) {
                result.put("type", CardType.DOUBLE_STRAIGHT);
                result.put("valid", true);
                result.put("length", pairRanks.size());
                result.put("value", CARD_VALUES.get(pairRanks.get(pairRanks.size() - 1)));
                return result;
            }
        }

        // Check for airplane
        if (cards.size() >= 6) {
            long tripleCount = groupCounts.stream().filter(c -> c == 3).count();
            if (tripleCount >= 2) {
                List<String> tripleRanks = groups.entrySet().stream()
                    .filter(e -> e.getValue().size() == 3)
                    .map(Map.Entry::getKey)
                    .filter(r -> CARD_VALUES.containsKey(r) && CARD_VALUES.get(r) <= 14)
                    .sorted(Comparator.comparingInt(r -> CARD_VALUES.get(r)))
                    .collect(Collectors.toList());

                if (tripleRanks.size() >= 2 && isSequential(tripleRanks)) {
                    result.put("type", CardType.AIRPLANE);
                    result.put("valid", true);
                    result.put("tripleCount", tripleRanks.size());
                    result.put("value", CARD_VALUES.get(tripleRanks.get(tripleRanks.size() - 1)));
                    return result;
                }
            }
        }

        return result;
    }

    /**
     * Check if ranks form a sequential order
     */
    private boolean isSequential(List<String> ranks) {
        if (ranks.size() < 2) return true;
        for (int i = 1; i < ranks.size(); i++) {
            int prev = CARD_VALUES.get(ranks.get(i - 1));
            int curr = CARD_VALUES.get(ranks.get(i));
            if (curr != prev + 1) return false;
        }
        return true;
    }

    /**
     * Validate if a move is legal
     */
    private Map<String, Object> validatePlay(List<Card> cards, List<Card> prevCards, boolean isFirstTurn) {
        Map<String, Object> analysis = analyzeCards(cards);

        if (!(Boolean) analysis.getOrDefault("valid", false)) {
            return Map.of("valid", false, "reason", "Invalid card combination");
        }

        // First turn can play anything valid
        if (isFirstTurn || prevCards == null || prevCards.isEmpty()) {
            return Map.of("valid", true, "analysis", analysis);
        }

        Map<String, Object> prevAnalysis = analyzeCards(prevCards);
        if (!(Boolean) prevAnalysis.getOrDefault("valid", false)) {
            return Map.of("valid", true, "analysis", analysis); // Previous invalid, can play anything
        }

        // Compare cards
        CardType currentType = (CardType) analysis.get("type");
        CardType prevType = (CardType) prevAnalysis.get("type");

        // Joker bomb beats everything
        if (currentType == CardType.JOKER_BOMB) {
            return Map.of("valid", true, "analysis", analysis);
        }

        // Bomb beats non-bomb
        if (currentType == CardType.BOMB) {
            if (prevType != CardType.BOMB && prevType != CardType.JOKER_BOMB) {
                return Map.of("valid", true, "analysis", analysis);
            }
            // Both bombs
            int currentValue = (Integer) analysis.get("value");
            int prevValue = (Integer) prevAnalysis.get("value");
            if (currentValue > prevValue) {
                return Map.of("valid", true, "analysis", analysis);
            }
            return Map.of("valid", false, "reason", "Bomb value too low");
        }

        // Cannot beat joker bomb
        if (prevType == CardType.JOKER_BOMB) {
            return Map.of("valid", false, "reason", "Cannot beat Joker Bomb");
        }

        // Must match type
        if (currentType != prevType) {
            return Map.of("valid", false, "reason", "Card type mismatch");
        }

        // Compare values
        int currentValue = (Integer) analysis.get("value");
        int prevValue = (Integer) prevAnalysis.get("value");

        if (currentType == CardType.STRAIGHT || currentType == CardType.DOUBLE_STRAIGHT) {
            int currentLength = (Integer) analysis.getOrDefault("length", 0);
            int prevLength = (Integer) prevAnalysis.getOrDefault("length", 0);
            if (currentLength != prevLength) {
                return Map.of("valid", false, "reason", "Length mismatch");
            }
        }

        if (currentValue > prevValue) {
            return Map.of("valid", true, "analysis", analysis);
        }

        return Map.of("valid", false, "reason", "Card value too low");
    }
}