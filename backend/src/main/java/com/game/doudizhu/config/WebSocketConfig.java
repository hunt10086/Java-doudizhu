package com.game.doudizhu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 后端 context-path: /api，所以 /ws/game 实际是 /api/ws/game
        // Nginx: location /api/ws { proxy_pass http://localhost:8118; }
        // 转发后：/api/ws/game → /api/ws/game ✓
        registry.addEndpoint("/ws/game")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable a simple in-memory message broker for topics
        registry.enableSimpleBroker("/topic", "/queue");

        // Set the prefix for messages sent from the client to @MessageMapping annotated methods
        registry.setApplicationDestinationPrefixes("/app");

        // Set user-specific destination prefix
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(org.springframework.messaging.simp.config.ChannelRegistration registration) {
        registration.interceptors(new WebSocketChannelInterceptor());
    }
}