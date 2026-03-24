-- =====================================================
-- V214: Create AGENCIAS catalog with 100 bank branches
-- This catalog is linked to the 'agencia' field in participants
-- =====================================================

-- Insert the main catalog (level 1) - ignore if exists
INSERT IGNORE INTO custom_catalog_read_model (
    code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES (
    'AGENCIAS',
    'Agencias Bancarias',
    'Catalogo de agencias y sucursales del banco para asignacion de clientes',
    1, NULL, NULL, NULL, 1, 1, 10, NOW(), 'system'
);

-- Get the catalog ID (use existing if INSERT IGNORE skipped)
SET @catalog_id = (SELECT id FROM custom_catalog_read_model WHERE code = 'AGENCIAS' LIMIT 1);

-- Insert 100 agency items (level 2) - use IGNORE to skip duplicates
INSERT IGNORE INTO custom_catalog_read_model (
    code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES
-- QUITO - Agencias principales
('AG-QUI-001', 'Agencia Matriz - Centro Historico', 'Av. Venezuela y Chile, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 1, NOW(), 'system'),
('AG-QUI-002', 'Agencia La Mariscal', 'Av. Amazonas y Patria, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 2, NOW(), 'system'),
('AG-QUI-003', 'Agencia Quicentro Norte', 'C.C. Quicentro Shopping, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 3, NOW(), 'system'),
('AG-QUI-004', 'Agencia El Bosque', 'C.C. El Bosque, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 4, NOW(), 'system'),
('AG-QUI-005', 'Agencia Cumbaya', 'Av. Interocenica, Cumbaya', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 5, NOW(), 'system'),
('AG-QUI-006', 'Agencia Tumbaco', 'Av. Interocenica, Tumbaco', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 6, NOW(), 'system'),
('AG-QUI-007', 'Agencia San Rafael', 'Av. General Enriquez, San Rafael', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 7, NOW(), 'system'),
('AG-QUI-008', 'Agencia Conocoto', 'Av. Camilo Ponce, Conocoto', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 8, NOW(), 'system'),
('AG-QUI-009', 'Agencia Carapungo', 'Av. Padre Luis Vacari, Carapungo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 9, NOW(), 'system'),
('AG-QUI-010', 'Agencia Calderon', 'Av. Capitan Geovanny Calles, Calderon', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 10, NOW(), 'system'),
('AG-QUI-011', 'Agencia Cotocollao', 'Av. Diego de Vasquez, Cotocollao', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 11, NOW(), 'system'),
('AG-QUI-012', 'Agencia La Prensa', 'Av. La Prensa y Homero Salas, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 12, NOW(), 'system'),
('AG-QUI-013', 'Agencia El Recreo', 'C.C. El Recreo, Quito Sur', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 13, NOW(), 'system'),
('AG-QUI-014', 'Agencia Chillogallo', 'Av. Mariscal Sucre, Chillogallo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 14, NOW(), 'system'),
('AG-QUI-015', 'Agencia Quitumbe', 'C.C. Quicentro Sur, Quitumbe', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 15, NOW(), 'system'),
('AG-QUI-016', 'Agencia Villaflora', 'Av. Rodrigo de Chavez, Villaflora', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 16, NOW(), 'system'),
('AG-QUI-017', 'Agencia La Y', 'Av. America y Naciones Unidas, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 17, NOW(), 'system'),
('AG-QUI-018', 'Agencia Iñaquito', 'Av. Amazonas y Naciones Unidas, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 18, NOW(), 'system'),
('AG-QUI-019', 'Agencia Carolina', 'Av. Eloy Alfaro y Portugal, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 19, NOW(), 'system'),
('AG-QUI-020', 'Agencia Gonzalez Suarez', 'Av. Gonzalez Suarez, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 20, NOW(), 'system'),

-- GUAYAQUIL - Agencias principales
('AG-GYE-001', 'Agencia Principal Guayaquil', 'Av. 9 de Octubre y Malecon, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 21, NOW(), 'system'),
('AG-GYE-002', 'Agencia Mall del Sol', 'C.C. Mall del Sol, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 22, NOW(), 'system'),
('AG-GYE-003', 'Agencia San Marino', 'C.C. San Marino, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 23, NOW(), 'system'),
('AG-GYE-004', 'Agencia Policentro', 'C.C. Policentro, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 24, NOW(), 'system'),
('AG-GYE-005', 'Agencia Urdesa', 'Av. Victor Emilio Estrada, Urdesa', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 25, NOW(), 'system'),
('AG-GYE-006', 'Agencia Kennedy', 'Av. Francisco de Orellana, Kennedy', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 26, NOW(), 'system'),
('AG-GYE-007', 'Agencia Alborada', 'Av. Rodolfo Baquerizo, Alborada', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 27, NOW(), 'system'),
('AG-GYE-008', 'Agencia Sauces', 'Av. Principal Sauces, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 28, NOW(), 'system'),
('AG-GYE-009', 'Agencia Duran', 'Av. Jaime Nebot, Duran', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 29, NOW(), 'system'),
('AG-GYE-010', 'Agencia Samborondon', 'Km 1.5 via Samborondon', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 30, NOW(), 'system'),
('AG-GYE-011', 'Agencia Ciudad Celeste', 'Urbanizacion Ciudad Celeste, Samborondon', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 31, NOW(), 'system'),
('AG-GYE-012', 'Agencia Rio Centro Los Ceibos', 'C.C. Rio Centro Los Ceibos, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 32, NOW(), 'system'),
('AG-GYE-013', 'Agencia Mall del Sur', 'C.C. Mall del Sur, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 33, NOW(), 'system'),
('AG-GYE-014', 'Agencia Riocentro Norte', 'C.C. Riocentro Norte, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 34, NOW(), 'system'),
('AG-GYE-015', 'Agencia Paseo Shopping', 'C.C. Paseo Shopping, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 35, NOW(), 'system'),

-- CUENCA
('AG-CUE-001', 'Agencia Principal Cuenca', 'Calle Bolivar y Borrero, Centro Cuenca', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 36, NOW(), 'system'),
('AG-CUE-002', 'Agencia Mall del Rio', 'C.C. Mall del Rio, Cuenca', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 37, NOW(), 'system'),
('AG-CUE-003', 'Agencia Monay Shopping', 'C.C. Monay Shopping, Cuenca', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 38, NOW(), 'system'),
('AG-CUE-004', 'Agencia El Arenal', 'Av. de las Americas, El Arenal', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 39, NOW(), 'system'),
('AG-CUE-005', 'Agencia Totoracocha', 'Av. Gonzalez Suarez, Totoracocha', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 40, NOW(), 'system'),
('AG-CUE-006', 'Agencia Yanuncay', 'Av. Primero de Mayo, Yanuncay', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 41, NOW(), 'system'),
('AG-CUE-007', 'Agencia Miraflores', 'Av. Miraflores, Cuenca', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 42, NOW(), 'system'),
('AG-CUE-008', 'Agencia Gran Colombia', 'Av. Gran Colombia, Cuenca', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 43, NOW(), 'system'),

-- AMBATO
('AG-AMB-001', 'Agencia Principal Ambato', 'Calle Bolivar y Castillo, Ambato', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 44, NOW(), 'system'),
('AG-AMB-002', 'Agencia Mall de los Andes', 'C.C. Mall de los Andes, Ambato', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 45, NOW(), 'system'),
('AG-AMB-003', 'Agencia Ficoa', 'Av. Los Guaytambos, Ficoa', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 46, NOW(), 'system'),
('AG-AMB-004', 'Agencia Huachi Chico', 'Av. Atahualpa, Huachi Chico', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 47, NOW(), 'system'),

-- SANTO DOMINGO
('AG-SDO-001', 'Agencia Principal Santo Domingo', 'Av. Quito y Tulcan, Santo Domingo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 48, NOW(), 'system'),
('AG-SDO-002', 'Agencia Paseo Shopping SD', 'C.C. Paseo Shopping, Santo Domingo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 49, NOW(), 'system'),
('AG-SDO-003', 'Agencia Via Quevedo', 'Km 1 Via Quevedo, Santo Domingo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 50, NOW(), 'system'),

-- MACHALA
('AG-MAC-001', 'Agencia Principal Machala', 'Calle Rocafuerte y Guayas, Machala', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 51, NOW(), 'system'),
('AG-MAC-002', 'Agencia Paseo Shopping Machala', 'C.C. Paseo Shopping, Machala', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 52, NOW(), 'system'),
('AG-MAC-003', 'Agencia Puerto Bolivar', 'Av. Bolivar Madero, Puerto Bolivar', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 53, NOW(), 'system'),

-- MANTA
('AG-MAN-001', 'Agencia Principal Manta', 'Av. 4 de Noviembre, Manta', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 54, NOW(), 'system'),
('AG-MAN-002', 'Agencia Mall del Pacifico', 'C.C. Mall del Pacifico, Manta', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 55, NOW(), 'system'),
('AG-MAN-003', 'Agencia Tarqui', 'Av. 24 de Mayo, Tarqui', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 56, NOW(), 'system'),

-- PORTOVIEJO
('AG-PTV-001', 'Agencia Principal Portoviejo', 'Calle Bolivar y Chile, Portoviejo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 57, NOW(), 'system'),
('AG-PTV-002', 'Agencia Paseo Shopping Portoviejo', 'C.C. Paseo Shopping, Portoviejo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 58, NOW(), 'system'),

-- LOJA
('AG-LOJ-001', 'Agencia Principal Loja', 'Calle Bolivar y Rocafuerte, Loja', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 59, NOW(), 'system'),
('AG-LOJ-002', 'Agencia Valle', 'Av. Pio Jaramillo Alvarado, Loja', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 60, NOW(), 'system'),
('AG-LOJ-003', 'Agencia Sur Loja', 'Av. Manuel Agustin Aguirre, Loja', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 61, NOW(), 'system'),

-- RIOBAMBA
('AG-RIO-001', 'Agencia Principal Riobamba', 'Calle 10 de Agosto y Espana, Riobamba', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 62, NOW(), 'system'),
('AG-RIO-002', 'Agencia Paseo Shopping Riobamba', 'C.C. Paseo Shopping, Riobamba', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 63, NOW(), 'system'),
('AG-RIO-003', 'Agencia Condamine', 'Av. Canónigo Ramos, Riobamba', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 64, NOW(), 'system'),

-- IBARRA
('AG-IBA-001', 'Agencia Principal Ibarra', 'Calle Oviedo y Bolivar, Ibarra', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 65, NOW(), 'system'),
('AG-IBA-002', 'Agencia Laguna Mall', 'C.C. Laguna Mall, Ibarra', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 66, NOW(), 'system'),
('AG-IBA-003', 'Agencia El Olivo', 'Av. El Retorno, El Olivo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 67, NOW(), 'system'),

-- ESMERALDAS
('AG-ESM-001', 'Agencia Principal Esmeraldas', 'Calle Bolivar y 9 de Octubre, Esmeraldas', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 68, NOW(), 'system'),
('AG-ESM-002', 'Agencia Multiplaza', 'C.C. Multiplaza, Esmeraldas', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 69, NOW(), 'system'),

-- QUEVEDO
('AG-QVD-001', 'Agencia Principal Quevedo', 'Av. 7 de Octubre y Bolivar, Quevedo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 70, NOW(), 'system'),
('AG-QVD-002', 'Agencia Quevedo Shopping', 'C.C. Quevedo Shopping, Quevedo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 71, NOW(), 'system'),

-- BABAHOYO
('AG-BAB-001', 'Agencia Principal Babahoyo', 'Calle 10 de Agosto y Bolivar, Babahoyo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 72, NOW(), 'system'),
('AG-BAB-002', 'Agencia Babahoyo Norte', 'Av. Universitaria, Babahoyo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 73, NOW(), 'system'),

-- LATACUNGA
('AG-LAT-001', 'Agencia Principal Latacunga', 'Calle Quito y Padre Salcedo, Latacunga', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 74, NOW(), 'system'),
('AG-LAT-002', 'Agencia Malteria Plaza', 'C.C. Malteria Plaza, Latacunga', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 75, NOW(), 'system'),

-- TULCAN
('AG-TUL-001', 'Agencia Principal Tulcan', 'Calle Bolivar y 10 de Agosto, Tulcan', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 76, NOW(), 'system'),
('AG-TUL-002', 'Agencia Rumichaca', 'Av. Panamericana, Rumichaca', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 77, NOW(), 'system'),

-- COCA
('AG-COC-001', 'Agencia Principal Coca', 'Av. Alejandro Labaka, Francisco de Orellana', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 78, NOW(), 'system'),

-- LAGO AGRIO
('AG-LAG-001', 'Agencia Principal Lago Agrio', 'Av. Quito y Colombia, Lago Agrio', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 79, NOW(), 'system'),

-- PUYO
('AG-PUY-001', 'Agencia Principal Puyo', 'Calle 9 de Octubre y Atahualpa, Puyo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 80, NOW(), 'system'),

-- TENA
('AG-TEN-001', 'Agencia Principal Tena', 'Av. 15 de Noviembre, Tena', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 81, NOW(), 'system'),

-- SALINAS
('AG-SAL-001', 'Agencia Principal Salinas', 'Av. General Enriquez, Salinas', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 82, NOW(), 'system'),
('AG-SAL-002', 'Agencia La Libertad', 'Av. 9 de Octubre, La Libertad', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 83, NOW(), 'system'),

-- MILAGRO
('AG-MIL-001', 'Agencia Principal Milagro', 'Calle 9 de Octubre y Garcia Moreno, Milagro', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 84, NOW(), 'system'),

-- DAULE
('AG-DAU-001', 'Agencia Principal Daule', 'Av. Principal, Daule', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 85, NOW(), 'system'),

-- AZOGUES
('AG-AZO-001', 'Agencia Principal Azogues', 'Calle Bolivar y Sucre, Azogues', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 86, NOW(), 'system'),

-- GUARANDA
('AG-GUA-001', 'Agencia Principal Guaranda', 'Calle 7 de Mayo y Sucre, Guaranda', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 87, NOW(), 'system'),

-- OTAVALO
('AG-OTA-001', 'Agencia Principal Otavalo', 'Calle Bolivar y Garcia Moreno, Otavalo', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 88, NOW(), 'system'),

-- ATACAMES
('AG-ATA-001', 'Agencia Atacames', 'Av. 21 de Noviembre, Atacames', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 89, NOW(), 'system'),

-- BAHIA DE CARAQUEZ
('AG-BAH-001', 'Agencia Bahia de Caraquez', 'Av. Bolivar, Bahia de Caraquez', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 90, NOW(), 'system'),

-- JIPIJAPA
('AG-JIP-001', 'Agencia Jipijapa', 'Calle Bolivar y 9 de Octubre, Jipijapa', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 91, NOW(), 'system'),

-- HUAQUILLAS
('AG-HUA-001', 'Agencia Huaquillas', 'Av. La Republica, Huaquillas', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 92, NOW(), 'system'),

-- SANTA ROSA
('AG-SRO-001', 'Agencia Santa Rosa', 'Calle Sucre y Colon, Santa Rosa', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 93, NOW(), 'system'),

-- PASAJE
('AG-PAS-001', 'Agencia Pasaje', 'Calle Bolivar y Rocafuerte, Pasaje', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 94, NOW(), 'system'),

-- ZAMORA
('AG-ZAM-001', 'Agencia Zamora', 'Calle Sevilla de Oro, Zamora', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 95, NOW(), 'system'),

-- MACAS
('AG-MCS-001', 'Agencia Macas', 'Calle Soasti y 10 de Agosto, Macas', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 96, NOW(), 'system'),

-- GALAPAGOS
('AG-GAL-001', 'Agencia Puerto Ayora', 'Av. Charles Darwin, Puerto Ayora, Galapagos', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 97, NOW(), 'system'),
('AG-GAL-002', 'Agencia San Cristobal', 'Av. Charles Darwin, San Cristobal, Galapagos', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 98, NOW(), 'system'),

-- VENTANILLAS CORPORATIVAS
('AG-CORP-001', 'Ventanilla Corporativa Matriz', 'Piso 15, Edificio Corporativo, Quito', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 99, NOW(), 'system'),
('AG-CORP-002', 'Ventanilla Corporativa Guayaquil', 'Piso 12, Torre Empresarial, Guayaquil', 2, @catalog_id, 'AGENCIAS', 'Agencias Bancarias', 1, 0, 100, NOW(), 'system');

-- Log the creation
SELECT CONCAT('Created AGENCIAS catalog with ', COUNT(*), ' items') AS result
FROM custom_catalog_read_model
WHERE parent_catalog_code = 'AGENCIAS';
