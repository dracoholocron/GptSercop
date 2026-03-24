-- Cambiar columna type de ENUM a VARCHAR para soportar todos los tipos de institución financiera
-- El frontend envía: BANCO, CORRESPONSAL, FINTECH
-- El enum Java ahora incluye: BANCO, CORRESPONSAL, FINTECH, BANCO_COMERCIAL, BANCO_CORRESPONSAL, BANCO_CENTRAL, INSTITUCION_FINANCIERA
ALTER TABLE financial_institution_readmodel
    MODIFY COLUMN type VARCHAR(50) NOT NULL;
