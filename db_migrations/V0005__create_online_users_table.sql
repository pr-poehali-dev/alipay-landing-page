
CREATE TABLE IF NOT EXISTS t_p7235020_alipay_landing_page.online_users (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(45)
);

CREATE INDEX idx_online_users_last_seen ON t_p7235020_alipay_landing_page.online_users(last_seen);
