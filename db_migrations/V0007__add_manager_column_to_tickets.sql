ALTER TABLE t_p7235020_alipay_landing_page.tickets 
ADD COLUMN IF NOT EXISTS manager VARCHAR(50);

UPDATE t_p7235020_alipay_landing_page.tickets 
SET manager = assigned_to 
WHERE assigned_to IS NOT NULL;