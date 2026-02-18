import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import connectionManager from '../services/ConnectionManager';
import { useGame } from '../contexts/GameContext';

const ChatContainer = styled.div`
  background: rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  flex: 1;
  min-height: 200px;
  max-height: 100%;
  overflow: hidden;

  @media (max-width: 768px) {
    min-height: 180px;
    border-radius: 8px;
  }
`;

const ChatHeader = styled.div`
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.1);
  color: #2c3e50;
  font-weight: bold;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 13px;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;

  @media (max-width: 768px) {
    padding: 8px;
    gap: 6px;
  }
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 12px;
    border-radius: 14px;
  }

  ${props => props.$isOwn ? `
    background: #3498db;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  ` : `
    background: rgba(255, 255, 255, 0.5);
    color: #2c3e50;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  `}
`;

const MessageInfo = styled.div`
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 2px;
  color: #2c3e50;

  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: rgba(0, 0, 0, 0.08);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  min-height: 70px;

  @media (max-width: 768px) {
    padding: 8px;
    min-height: 60px;
  }
`;

const QuickMessageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  max-width: 100%;

  @media (max-width: 768px) {
    gap: 3px;
    margin-bottom: 4px;
    padding-bottom: 4px;
  }
`;

const QuickMessageButton = styled.button`
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  padding: 3px 8px;
  font-size: 11px;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: rgba(52, 152, 219, 0.3);
    border-color: #3498db;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    padding: 2px 6px;
    font-size: 10px;
    border-radius: 8px;
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.4);
  color: #2c3e50;
  font-size: 14px;
  outline: none;

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 13px;
    border-radius: 16px;
  }

  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
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

  @media (max-width: 768px) {
    width: 34px;
    height: 34px;
    margin-left: 6px;
    border-radius: 50%;
  }

  &:hover {
    background: #27ae60;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (hover: none) and (pointer: coarse) {
    &:active {
      transform: scale(0.92);
    }
  }
`;

const QUICK_MESSAGES = [
  '能不能快点啊',
  '等一下',
  '不好意思',
  '地主加油',
  '农民加油',
  '好牌啊'
];

const ChatPanel = () => {
  const { state } = useGame();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [pendingMessageId, setPendingMessageId] = useState(null); // Track pending message to avoid duplicate

  const handleQuickMessage = (text) => {
    if (text.trim() === '') return;

    // Generate a unique message ID
    const messageId = Date.now();
    setPendingMessageId(messageId);

    // Send via WebSocket with message ID
    connectionManager.sendChat({ text, messageId });

    // Add to local messages immediately
    const newMessage = {
      id: messageId,
      sender: '我',
      text: text,
      timestamp: new Date().toLocaleTimeString(),
      isOwn: true
    };

    setMessages(prev => [...prev, newMessage]);
  };

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
      console.log('data.data type:', typeof data.data, 'value:', data.data);
      if (data.type === 'CHAT_MESSAGE') {
        const isOwn = data.playerId === connectionManager.getPlayerId();

        // Skip if this is our own message that we just sent (already added locally)
        // Check by messageId if available (convert to string for comparison)
        const messageId = data.data?.messageId ? String(data.data.messageId) : null;
        const pendingId = pendingMessageId ? String(pendingMessageId) : null;
        if (isOwn && messageId && pendingId && messageId === pendingId) {
          console.log('Skipping duplicate own message, messageId:', messageId);
          setPendingMessageId(null);
          return;
        }

        // Extract sender name and text from the data
        let senderName = '未知玩家';
        let text = '';
        let finalMessageId = messageId || Date.now();

        // Handle both object and string data formats
        let rawText = '';
        if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          // It's an object - extract text
          // Note: backend may nest text in data.data.text.text or data.data.text
          const textField = data.data.text;
          if (typeof textField === 'string') {
            rawText = textField;
          } else if (textField && typeof textField === 'object' && textField.text) {
            // Backend nested the text: { text: { text: "1", messageId: xxx } }
            rawText = textField.text;
          }
          senderName = isOwn ? '我' : (data.data.senderName || data.playerId || '未知玩家');
          finalMessageId = data.data.messageId || finalMessageId;
        } else if (typeof data.data === 'string') {
          rawText = data.data;
          senderName = isOwn ? '我' : (data.playerId || '未知玩家');
        }

        // Ensure text is a string
        text = String(rawText || '');

        // Skip if text is empty or not a valid string
        if (!text || text === '[object Object]') {
          console.log('Skipping invalid message:', data.data);
          return;
        }

        const newMessage = {
          id: finalMessageId,
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
        <QuickMessageContainer>
          {QUICK_MESSAGES.map((msg, index) => (
            <QuickMessageButton
              key={index}
              onClick={() => handleQuickMessage(msg)}
            >
              {msg}
            </QuickMessageButton>
          ))}
        </QuickMessageContainer>
        <InputRow>
          <MessageInput
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
          />
          <SendButton onClick={handleSend}>✓</SendButton>
        </InputRow>
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatPanel;
