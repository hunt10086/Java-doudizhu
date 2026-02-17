package com.game.doudizhu.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.game.doudizhu.entity.User;
import com.game.doudizhu.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.HashMap;

@Service
public class UserService extends ServiceImpl<UserMapper, User> {

    private final PasswordEncoder passwordEncoder;
    // Session 存储: sessionId -> userId
    private final Map<String, Long> sessionStore = new ConcurrentHashMap<>();
    // userId -> sessionId (每个用户一个 session)
    private final Map<Long, String> userSessionStore = new ConcurrentHashMap<>();

    public UserService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Register a new user
     */
    public Map<String, Object> register(String username, String password, String nickname) {
        Map<String, Object> result = new HashMap<>();

        // Check if username exists
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User existingUser = this.getOne(wrapper);
        if (existingUser != null) {
            result.put("success", false);
            result.put("message", "用户名已存在");
            return result;
        }

        // Create new user
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname != null && !nickname.isEmpty() ? nickname : username);
        user.setScore(1000);
        user.setGamesPlayed(0);
        user.setGamesWon(0);
        user.setStatus(1);

        this.save(user);

        result.put("success", true);
        result.put("message", "注册成功");
        result.put("userId", user.getId());
        return result;
    }

    /**
     * Login with username and password
     */
    public Map<String, Object> login(String username, String password) {
        Map<String, Object> result = new HashMap<>();

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User user = this.getOne(wrapper);

        if (user == null) {
            result.put("success", false);
            result.put("message", "用户不存在");
            return result;
        }

        if (user.getStatus() == 0) {
            result.put("success", false);
            result.put("message", "账号已被禁用");
            return result;
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            result.put("success", false);
            result.put("message", "密码错误");
            return result;
        }

        // 生成 session ID
        String sessionId = UUID.randomUUID().toString().replace("-", "");

        // 清除之前的 session（如果存在）
        String oldSession = userSessionStore.get(user.getId());
        if (oldSession != null) {
            sessionStore.remove(oldSession);
        }

        // 保存新的 session
        sessionStore.put(sessionId, user.getId());
        userSessionStore.put(user.getId(), sessionId);

        result.put("success", true);
        result.put("message", "登录成功");
        result.put("sessionId", sessionId);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("nickname", user.getNickname());
        result.put("score", user.getScore());
        return result;
    }

    /**
     * Get user by session ID
     */
    public Map<String, Object> getUserBySession(String sessionId) {
        Long userId = sessionStore.get(sessionId);
        if (userId == null) {
            return null;
        }

        User user = this.getById(userId);
        if (user == null || user.getStatus() == 0) {
            return null;
        }

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("userId", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("score", user.getScore());
        return userInfo;
    }

    /**
     * Clear session
     */
    public void clearSession(String sessionId) {
        Long userId = sessionStore.remove(sessionId);
        if (userId != null) {
            userSessionStore.remove(userId);
        }
    }

    /**
     * Get user info by username
     */
    public User getUserByUsername(String username) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        return this.getOne(wrapper);
    }
}
