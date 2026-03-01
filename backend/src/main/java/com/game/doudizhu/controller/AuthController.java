package com.game.doudizhu.controller;

import com.game.doudizhu.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * Register a new user
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String nickname = request.get("nickname");

        if (username == null || username.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "用户名不能为空"));
        }
        if (username.length() > 64) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "用户名长度不能超过64个字符"));
        }
        if (!username.matches("^[a-zA-Z0-9_]+$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "用户名只能包含字母、数字和下划线"));
        }
        if (password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "密码不能为空"));
        }
        if (password.length() < 6 || password.length() > 64) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "密码长度需在6-64个字符之间"));
        }
        if (!password.matches("^[a-zA-Z0-9_]+$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "密码只能包含字母、数字和下划线"));
        }
        if (nickname != null && nickname.length() > 64) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "昵称长度不能超过64个字符"));
        }

        Map<String, Object> result = userService.register(username, password, nickname);

        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * User login
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> request,
            HttpServletResponse response) {
        String username = request.get("username");
        String password = request.get("password");

        if (username == null || username.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "用户名不能为空"));
        }
        if (username.length() > 50) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "用户名长度不能超过50个字符"));
        }
        if (password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "密码不能为空"));
        }

        Map<String, Object> result = userService.login(username, password);

        if ((Boolean) result.get("success")) {
            // 设置 session cookie
            Cookie cookie = new Cookie("SESSION", result.get("sessionId").toString());
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            cookie.setMaxAge(60 * 60 * 24); // 24小时
            cookie.setSecure(false); // 开发环境设为 false，生产环境设为 true
            response.addCookie(cookie);

            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Check login status
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkLogin(
            @CookieValue(value = "SESSION", required = false) String sessionId) {
        Map<String, Object> result = new HashMap<>();

        if (sessionId != null && !sessionId.isEmpty()) {
            Map<String, Object> userInfo = userService.getUserBySession(sessionId);
            if (userInfo != null) {
                result.put("success", true);
                result.put("loggedIn", true);
                result.put("userId", userInfo.get("userId"));
                result.put("username", userInfo.get("username"));
                result.put("nickname", userInfo.get("nickname"));
                result.put("score", userInfo.get("score"));
                return ResponseEntity.ok(result);
            }
        }

        result.put("success", true);
        result.put("loggedIn", false);
        return ResponseEntity.ok(result);
    }

    /**
     * Logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @CookieValue(value = "SESSION", required = false) String sessionId,
            HttpServletResponse response) {
        // 清除 session
        if (sessionId != null) {
            userService.clearSession(sessionId);
        }

        // 清除 cookie
        Cookie cookie = new Cookie("SESSION", "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "已退出登录");
        return ResponseEntity.ok(result);
    }

    /**
     * Get user info
     */
    @GetMapping("/user/{id}")
    public ResponseEntity<Map<String, Object>> getUserInfo(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("userId", id);
        return ResponseEntity.ok(result);
    }
}
