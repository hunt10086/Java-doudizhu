# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Doudizhu (Fight the Landlord)** card game with a Spring Boot backend and React frontend. It's a real-time multiplayer game using WebSockets for communication.

## Running the Project

### Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`

### Frontend (React)
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000`

### Production Build
```bash
# Backend
cd backend
mvn clean package -DskipTests

# Frontend
cd frontend
npm run build
```

## Architecture

### Backend (Java/Spring Boot)

- **GameService.java** - Core game logic including card dealing, bidding, playing, turn management
- **GameController.java** - STOMP WebSocket message handlers (`/app/game/*`)
- **GameState.java** - Game state model with status enum (WAITING, DEALING, BIDDING, PLAYING, FINISHED)
- **Player.java** - Player model with hand cards, position, landlord status
- **Card.java** - Card model (suit, rank)
- **GameEvent.java** - WebSocket event structure with EventType enum

**Key Game Flow:**
1. Player creates game → GAME_START (waiting for players)
2. 3 players join → Start game → DEALING → BIDDING
3. Landlord determined → PLAYING phase
4. Players play cards or pass → turn cycles
5. When all pass, last player plays again
6. Player with empty hand wins → GAME_END

**WebSocket Topics:**
- `/topic/game/{gameId}` - Broadcasts to all players in game
- `/topic/game/created_{playerId}` - Player-specific game created events
- `/topic/game/joined_{playerId}` - Player-specific join confirmation

**Game Events (GameEvent.EventType):**
- `PLAYER_JOIN` - Player joined the game
- `GAME_START` - Game started
- `CARDS_DEAL` - Cards dealt to players
- `BID_REQUEST` - Request player to bid (叫地主)
- `BID_RESPONSE` - Player's bid response
- `PLAY_CARDS` - Player played cards
- `PASS_TURN` - Player passed
- `TURN_START` - New turn started (includes turnStartTime for countdown)
- `GAME_END` - Game ended

### Frontend (React)

- **App.js** - Main component with game layout and message handling
- **GameContext.js** - React Context for global game state
- **ConnectionManager.js** - STOMP WebSocket client management
- **components/GameTable.js** - Card table display with player positions
- **components/GameControls.js** - Action buttons (叫地主, 出牌, 不要)
- **components/Card.js** - Card rendering component with selection

**Key State (GameContext):**
```javascript
{
  players: [],           // Array of players in game
  currentPlayer: null,   // Current player's turn
  currentCards: [],      // Cards on table
  gameState: 'waiting',  // waiting, bidding, playing, finished
  landlordId: null,      // Landlord player ID
  landlordCards: [],     // Landlord's 3 bottom cards (visible to all)
  myPlayerId: null,     // Current user's player ID
  handCards: [],        // User's hand cards
  selectedCards: [],    // Selected cards for playing
  canPass: true,        // Whether player can "不要"
  turnStartTime: null,  // Timestamp when current turn started (for 30s countdown)
  playerCardCounts: {}   // Card count for each player
}
```

## Key Game Logic

### Turn System (Backend - GameService.java)
- `playCards()` - Validates and processes card plays
- `passTurn()` - Handles player passing, cycles through players
- When all other players pass, `lastPlayerId` gets to play again (table clears)
- `canPass` flag sent to frontend to disable "不要" button for first player or after table clear

### Card Dealing
- 54 cards (52 standard + 2 jokers)
- 17 cards each + 3 landlord cards
- CARDS_DEAL event broadcasts to `/topic/game/{gameId}` with `targetPlayerId` in data

### Bidding (叫地主)
- Players can 叫 (bid) or 不叫 (pass)
- First bidder becomes landlord if everyone passes
- After landlord determined, landlord cards added to landlord's hand

### Player Identity Display
- **Landlord (地主)**: Red badge displayed on player avatar in GameTable.js
- **Farmer (农民)**: Green badge displayed on non-landlord players after landlord is determined
- Identity is determined by comparing playerId with landlordId in game state

## Common Development Tasks

### Adding a new game event
1. Add to `GameEvent.EventType` enum in backend
2. Handle in frontend's `MessageHandler` in App.js
3. Send via `messagingTemplate.convertAndSend()` in backend

### Modifying game rules
- Core logic in `GameService.java` - look for methods like `playCards()`, `passTurn()`, `validatePlay()`
- Frontend validation in `frontend/src/utils/gameLogic.js`

### UI Changes
- Styled-components used throughout frontend
- Card sizes defined in Card.js with `tiny`, `small`, `normal` variants
- Game table layout in GameTable.js with player positions

## Testing

Open browser console (F12) to see debug logs:
- `GameControls render:` - Shows current player, game state
- `PLAY_CARDS event received:` - Card play events
- `Received game event:` - All WebSocket events
- `Turn started for player:` - Turn start events for countdown
- `GameTable Timer effect:` - Timer display for left/right players
- `BottomTimer effect:` - Timer display for current player

## Commit Message Format

使用中文提交,格式如下:

```
<类型>: <标题>

<正文>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### 类型
- `feat`: 新功能
- `fix`: Bug修复
- `optimize`: 优化(性能/体验等)
- `refactor`: 重构
- `style`: 样式调整

### 示例
```
优化地主牌显示及游戏结算界面

主要优化点:
1. 地主牌(底牌)显示: 所有玩家可见三张底牌,地主视角显示红色高亮边框
2. 修复默认地主问题: 三轮无人叫地主后正确显示20张牌(含底牌)
3. 地主可见性修复: SET_LANDLORD reducer同时更新players数组的isLandlord属性

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
