package com.game.doudizhu;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.game.doudizhu.mapper")
public class DoudizhuApplication {
    public static void main(String[] args) {
        SpringApplication.run(DoudizhuApplication.class, args);
    }
}
