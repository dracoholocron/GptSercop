-- V20260220 - Extend brand_template with typography, content colors, and 3 bank templates

ALTER TABLE brand_template
  ADD COLUMN font_family VARCHAR(100) DEFAULT 'Inter',
  ADD COLUMN font_url VARCHAR(500) NULL,
  ADD COLUMN content_bg_color VARCHAR(20) DEFAULT '#F7FAFC',
  ADD COLUMN content_bg_color_dark VARCHAR(20) DEFAULT '#2D3748',
  ADD COLUMN card_bg_color VARCHAR(20) DEFAULT '#FFFFFF',
  ADD COLUMN card_bg_color_dark VARCHAR(20) DEFAULT '#2D3748',
  ADD COLUMN border_color VARCHAR(20) DEFAULT '#E2E8F0',
  ADD COLUMN border_color_dark VARCHAR(20) DEFAULT '#4A5568',
  ADD COLUMN text_color VARCHAR(20) DEFAULT '#1A202C',
  ADD COLUMN text_color_dark VARCHAR(20) DEFAULT '#F7FAFC',
  ADD COLUMN text_color_secondary VARCHAR(20) DEFAULT '#718096',
  ADD COLUMN text_color_secondary_dark VARCHAR(20) DEFAULT '#A0AEC0';

-- Banco Guayaquil
INSERT INTO brand_template (
  code, name, description, company_name, company_short_name,
  primary_color, secondary_color, accent_color,
  sidebar_bg_color, sidebar_text_color, header_bg_color,
  font_family, font_url,
  content_bg_color, content_bg_color_dark,
  card_bg_color, card_bg_color_dark,
  border_color, border_color_dark,
  text_color, text_color_dark,
  text_color_secondary, text_color_secondary_dark,
  dark_mode_enabled, is_active, is_default, is_editable, display_order,
  created_at, updated_at, created_by, updated_by
) VALUES (
  'BANCO_GUAYAQUIL', 'Banco Guayaquil', 'Tema inspirado en Banco Guayaquil - azul corporativo',
  'Banco Guayaquil', 'BG',
  '#1e87f0', '#222222', '#f0506e',
  '#222222', '#FFFFFF', '#f8f8f8',
  'Nunito Sans', 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap',
  '#f8f8f8', '#1a1f2e',
  '#FFFFFF', '#2a2f3e',
  '#e5e5e5', '#3a3f4e',
  '#333333', '#e8e8e8',
  '#999999', '#aaaaaa',
  true, false, false, true, 10,
  NOW(), NOW(), 'system', 'system'
);

-- Banco Pichincha
INSERT INTO brand_template (
  code, name, description, company_name, company_short_name,
  primary_color, secondary_color, accent_color,
  sidebar_bg_color, sidebar_text_color, header_bg_color,
  font_family, font_url,
  content_bg_color, content_bg_color_dark,
  card_bg_color, card_bg_color_dark,
  border_color, border_color_dark,
  text_color, text_color_dark,
  text_color_secondary, text_color_secondary_dark,
  dark_mode_enabled, is_active, is_default, is_editable, display_order,
  created_at, updated_at, created_by, updated_by
) VALUES (
  'BANCO_PICHINCHA', 'Banco Pichincha', 'Tema inspirado en Banco Pichincha - amarillo y azul oscuro',
  'Banco Pichincha', 'BP',
  '#FDDA24', '#1A1A2E', '#FFB800',
  '#1A1A2E', '#FFFFFF', '#FDDA24',
  'Poppins', 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  '#FFFDF0', '#1A1A2E',
  '#FFFFFF', '#2A2A40',
  '#E8E0C0', '#3A3A55',
  '#1A1A2E', '#F5F0E0',
  '#6A6A80', '#A0A0B5',
  true, false, false, true, 11,
  NOW(), NOW(), 'system', 'system'
);

-- Banco Internacional
INSERT INTO brand_template (
  code, name, description, company_name, company_short_name,
  primary_color, secondary_color, accent_color,
  sidebar_bg_color, sidebar_text_color, header_bg_color,
  font_family, font_url,
  content_bg_color, content_bg_color_dark,
  card_bg_color, card_bg_color_dark,
  border_color, border_color_dark,
  text_color, text_color_dark,
  text_color_secondary, text_color_secondary_dark,
  dark_mode_enabled, is_active, is_default, is_editable, display_order,
  created_at, updated_at, created_by, updated_by
) VALUES (
  'BANCO_INTERNACIONAL', 'Banco Internacional', 'Tema inspirado en Banco Internacional - naranja corporativo',
  'Banco Internacional', 'BI',
  '#f47120', '#2c3e50', '#e74c3c',
  '#1a252f', '#FFFFFF', '#FFFFFF',
  'Raleway', 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap',
  '#FFF8F0', '#1e2a34',
  '#FFFFFF', '#2a3a48',
  '#F0D8C0', '#3c4e5e',
  '#2c3e50', '#f0e8e0',
  '#6a7a8a', '#a0b0c0',
  true, false, false, true, 12,
  NOW(), NOW(), 'system', 'system'
);
