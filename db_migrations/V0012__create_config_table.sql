-- Создание таблицы для конфигурации Telegram
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Вставка начальной конфигурации с вашими данными
INSERT INTO config (id, telegram_bot_token, telegram_chat_id) 
VALUES (1, '8180849078:AAFEyOjNjFkl_JM4sUB0eGfaGGUEwlJ9TIE', '-1002437535631')
ON CONFLICT (id) DO NOTHING;