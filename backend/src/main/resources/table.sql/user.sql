create table if not exists doudizhu.user
(
    id           bigint auto_increment comment '用户ID'
        primary key,
    username     varchar(50)                        not null comment '用户名',
    password     varchar(255)                       not null comment '密码',
    nickname     varchar(50)                        null comment '昵称',
    avatar       varchar(255)                       null comment '头像URL',
    score        int      default 1000              null comment '积分',
    games_played int      default 0                 null comment '总场次',
    games_won    int      default 0                 null comment '胜场',
    status       tinyint  default 1                 null comment '状态: 0-禁用, 1-正常',
    create_time  datetime default CURRENT_TIMESTAMP null comment '创建时间',
    update_time  datetime default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint uk_username
        unique (username)
)
    comment '用户表' collate = utf8mb4_unicode_ci;

