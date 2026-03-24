-- Add sidebar_text_color column to brand_template table
ALTER TABLE brand_template
ADD COLUMN sidebar_text_color VARCHAR(20) DEFAULT '#FFFFFF' AFTER sidebar_bg_color;

-- Update existing records to have a default white text color
UPDATE brand_template SET sidebar_text_color = '#FFFFFF' WHERE sidebar_text_color IS NULL;
