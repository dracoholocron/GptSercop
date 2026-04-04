/**
 * Consultas SQL reutilizables para el módulo analítico.
 * Todas las queries operan sobre el esquema Prisma existente.
 */

export const Q_MARKET_BY_ENTITY = `
  SELECT
    e.id            AS "entityId",
    e.name          AS "entityName",
    e.code          AS "entityCode",
    COUNT(c.id)     AS "contractCount",
    COALESCE(SUM(c.amount), 0) AS "totalAmount"
  FROM "Entity" e
  LEFT JOIN "ProcurementPlan" pp ON pp."entityId" = e.id
  LEFT JOIN "Tender" t          ON t."procurementPlanId" = pp.id
  LEFT JOIN "Contract" c        ON c."tenderId" = t.id
  WHERE ($1::int IS NULL OR pp.year = $1)
  GROUP BY e.id, e.name, e.code
  ORDER BY "totalAmount" DESC
  LIMIT 50
` as const;

export const Q_MARKET_BY_PROCESS_TYPE = `
  SELECT
    COALESCE(t."processType", 'sin_tipo')  AS "processType",
    COUNT(t.id)                            AS "tenderCount",
    COALESCE(SUM(c.amount), 0)             AS "totalAmount",
    AVG(c.amount)                          AS "avgAmount"
  FROM "Tender" t
  LEFT JOIN "Contract" c ON c."tenderId" = t.id
  LEFT JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
  WHERE ($1::int IS NULL OR pp.year = $1)
  GROUP BY t."processType"
  ORDER BY "totalAmount" DESC
` as const;

export const Q_COMPETITION_BY_SECTOR = `
  SELECT
    COALESCE(t."processType", 'sin_tipo')           AS "processType",
    COUNT(t.id)                                      AS "tenderCount",
    AVG(bid_counts."bidCount")                       AS "avgBidders",
    SUM(CASE WHEN bid_counts."bidCount" = 1 THEN 1 ELSE 0 END) AS "singleBidderCount",
    ROUND(
      100.0 * SUM(CASE WHEN bid_counts."bidCount" = 1 THEN 1 ELSE 0 END)
      / NULLIF(COUNT(t.id), 0),
      2
    )                                                AS "singleBidderPct"
  FROM "Tender" t
  JOIN (
    SELECT "tenderId", COUNT(*) AS "bidCount"
    FROM "Bid"
    GROUP BY "tenderId"
  ) bid_counts ON bid_counts."tenderId" = t.id
  LEFT JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
  WHERE ($1::int IS NULL OR pp.year = $1)
  GROUP BY t."processType"
  ORDER BY "avgBidders" ASC
` as const;

export const Q_HHI_BY_ENTITY = `
  SELECT
    e.id        AS "entityId",
    e.name      AS "entityName",
    ROUND(
      SUM(POWER(100.0 * c.amount / NULLIF(entity_total.total, 0), 2))::numeric,
      2
    )           AS "hhi"
  FROM "Contract" c
  JOIN "Tender" t          ON t.id = c."tenderId"
  JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
  JOIN "Entity" e           ON e.id = pp."entityId"
  JOIN (
    SELECT pp2."entityId", SUM(c2.amount) AS total
    FROM "Contract" c2
    JOIN "Tender" t2 ON t2.id = c2."tenderId"
    JOIN "ProcurementPlan" pp2 ON pp2.id = t2."procurementPlanId"
    WHERE ($1::int IS NULL OR pp2.year = $1)
    GROUP BY pp2."entityId"
  ) entity_total ON entity_total."entityId" = pp."entityId"
  WHERE ($1::int IS NULL OR pp.year = $1)
  GROUP BY e.id, e.name, entity_total.total
  ORDER BY "hhi" DESC
  LIMIT 20
` as const;

export const Q_PAC_VS_EXECUTED = `
  SELECT
    e.id                                          AS "entityId",
    e.name                                        AS "entityName",
    COUNT(t.id)                                   AS "planned",
    SUM(CASE WHEN t.status IN ('awarded','active','closed') THEN 1 ELSE 0 END) AS "executed",
    COALESCE(SUM(pp.totalAmount), 0)              AS "plannedAmount",
    COALESCE(SUM(c.amount), 0)                    AS "executedAmount",
    ROUND(
      100.0 * SUM(CASE WHEN t.status IN ('awarded','active','closed') THEN 1 ELSE 0 END)
      / NULLIF(COUNT(t.id), 0),
      2
    )                                             AS "executionRate"
  FROM "Entity" e
  JOIN "ProcurementPlan" pp ON pp."entityId" = e.id
  JOIN "Tender" t            ON t."procurementPlanId" = pp.id
  LEFT JOIN "Contract" c     ON c."tenderId" = t.id
  WHERE ($1::int IS NULL OR pp.year = $1)
  GROUP BY e.id, e.name
  ORDER BY "executionRate" ASC
  LIMIT 30
` as const;
