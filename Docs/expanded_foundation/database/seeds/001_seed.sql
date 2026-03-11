-- Seeds de ejemplo (organizations + providers)

insert into organizations (id, code, legal_name, organization_type)
values
('00000000-0000-0000-0000-000000000001', 'SERCOP', 'Servicio Nacional de Contratación Pública', 'GOVERNMENT'),
('00000000-0000-0000-0000-000000000002', 'MSP', 'Ministerio de Salud Pública', 'GOVERNMENT');

insert into providers (id, ruc, legal_name, trade_name, status, province, canton, address)
values
('10000000-0000-0000-0000-000000000001', '1790000000001', 'Proveedor Demo Uno S.A.', 'Demo Uno', 'APPROVED', 'Pichincha', 'Quito', 'Av. Ejemplo 123'),
('10000000-0000-0000-0000-000000000002', '1790000000002', 'Proveedor Demo Dos Cia. Ltda.', 'Demo Dos', 'DRAFT', 'Guayas', 'Guayaquil', 'Calle Falsa 456');
