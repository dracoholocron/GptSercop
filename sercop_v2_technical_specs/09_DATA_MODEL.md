# Modelo de Datos

Entidades principales:

Provider
Entity
ProcurementPlan
Tender
Bid
Contract

Relaciones:

Entity -> ProcurementPlan
ProcurementPlan -> Tender
Tender -> Bid
Tender -> Contract