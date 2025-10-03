CREATE TABLE IF NOT EXISTS visitors (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT true,
    page_views INTEGER DEFAULT 1
);

CREATE INDEX idx_visitors_session ON visitors(session_id);
CREATE INDEX idx_visitors_online ON visitors(is_online);
CREATE INDEX idx_visitors_last_activity ON visitors(last_activity);