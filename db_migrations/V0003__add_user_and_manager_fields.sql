-- Add missing fields to tickets table
ALTER TABLE t_p7235020_alipay_landing_page.tickets 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);

-- Add missing fields to ticket_messages table
ALTER TABLE t_p7235020_alipay_landing_page.ticket_messages 
ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);