# Arquitectura de Software

Arquitectura recomendada:

Modular Monolith evolucionable a microservicios.

Componentes:

Frontend:
- Portal público
- Portal proveedores
- Portal entidades

Backend:
- API Gateway
- Servicios de dominio

Servicios principales:

- Proveedores
- Contratación
- Documentos
- Analítica

Infraestructura:

- Kubernetes
- PostgreSQL
- Redis
- Object Storage