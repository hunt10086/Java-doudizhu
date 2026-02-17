import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import connectionManager from '../services/ConnectionManager';
import { useGame } from '../contexts/GameContext';

const ChatContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex: 1;
  min-height: 300px;
`;

const ChatHeader = styled.div`
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;

  ${props => props.$isOwn ? `
    background: #3498db;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  ` : `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  `}
`;

const MessageInfo = styled.div`
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 2px;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SendButton = styled.button`
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-left: 10px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    background: #27ae60;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ChatPanel = () => {
  const { state } = useGame();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [pendingMessageId, setPendingMessageId] = useState(null); // Track pending message to avoid duplicate

  useEffect(() => {
    // Add system welcome message
    setMessages([{
      id: Date.now(),
      sender: '系统',
      text: '欢迎来到斗地主游戏！',
      timestamp: new Date().toLocaleTimeString(),
      isSystem: true
    }]);
  }, []);

  useEffect(() => {
    // Subscribe to chat topic
    const handleChatMessage = (data) => {
      console.log('Chat message received:', data);
      if (data.type === 'CHAT_MESSAGE') {
        const isOwn = data.playerId === connectionManager.getPlayerId();
        // data.data can be either an object or a string
        let senderName = '未知玩家';
        let text = '';
        let messageId = data.data?.messageId || Date.now();

        // Skip if this is our own message that we just sent (already added locally)
        if (isOwn && pendingMessageId === messageId) {
          console.log('Skipping duplicate own message');
          setPendingMessageId(null);
          return;
        }

        if (typeof data.data === 'object' && data.data !== null) {
          senderName = isOwn ? '我' : (data.data.senderName || '未知玩家');
          text = data.data.text || '';
          messageId = data.data.messageId || messageId;
        } else if (typeof data.data === 'string') {
          // If data.data is a string, use it as text and get senderName from player lookup
          text = data.data;
          if (!isOwn) {
            senderName = data.playerId || '未知玩家';
          }
        }

        const newMessage = {
          id: messageId,
          sender: senderName,
          text: text,
          timestamp: new Date().toLocaleTimeString(),
          isOwn: isOwn
        };

        setMessages(prev => [...prev, newMessage]);
      }
    };

    connectionManager.addMessageListener(handleChatMessage);

    return () => {
      connectionManager.removeMessageListener(handleChatMessage);
    };
  }, [pendingMessageId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    // Generate a unique message ID
    const messageId = Date.now();
    setPendingMessageId(messageId);

    // Send via WebSocket with message ID
    connectionManager.sendChat({ text: inputValue, messageId });

    // Add to local messages immediately
    const newMessage = {
      id: messageId,
      sender: '我',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      isOwn: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>游戏聊天</ChatHeader>
      <MessagesContainer id="chat-messages">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} $isOwn={msg.isOwn}>
            {!msg.isSystem && !msg.isOwn && (
              <MessageInfo>{msg.sender}</MessageInfo>
            )}
            {msg.isSystem && (
              <MessageInfo style={{ color: '#f39c12' }}>系统</MessageInfo>
            )}
            <div>{msg.text}</div>
            <small style={{ display: 'block', opacity: 0.7, fontSize: '10px', marginTop: '2px' }}>
              {msg.timestamp}
            </small>
          </MessageBubble>
        ))}
      </MessagesContainer>
      <InputContainer>
        <MessageInput
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
        />
        <SendButton onClick={handleSend}>✓</SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatPanel;
