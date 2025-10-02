CREATE TABLE IF NOT EXISTS t_p7235020_alipay_landing_page.blocked_users (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  blocked_at TIMESTAMP DEFAULT NOW(),
  blocked_by TEXT DEFAULT 'admin',
  reason TEXT
);

CREATE INDEX idx_blocked_users_session_id ON t_p7235020_alipay_landing_page.blocked_users(session_id);