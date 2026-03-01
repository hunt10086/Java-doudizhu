package com.game.doudizhu.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*", allowCredentials = "false", maxAge = 3600)
public class ApiController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "doudizhu-backend");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("gameName", "Doudizhu");
        config.put("maxPlayers", 3);
        config.put("websocketPath", "/ws/game");
        return ResponseEntity.ok(config);
    }
}