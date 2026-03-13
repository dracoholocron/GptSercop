-- CPC normalized schema

CREATE TABLE "CpcSnapshot" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'sercop',
  "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requestsCount" INTEGER,
  "visitedCount" INTEGER,
  "queueRemaining" INTEGER,
  "errorsCount" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "notes" TEXT,
  CONSTRAINT "CpcSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CpcNode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "levelNum" INTEGER,
  "nodeType" INTEGER,
  "isLeaf" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CpcNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CpcEdge" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "parentNodeId" TEXT,
  "childNodeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CpcEdge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CpcNodeRaw" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "nodeId" TEXT,
  "code" TEXT NOT NULL,
  "parentCode" TEXT,
  "levelNum" INTEGER,
  "nodeType" INTEGER,
  "description" TEXT,
  "idProducto" TEXT,
  "descProducto" TEXT,
  "rawJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CpcNodeRaw_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CpcNode_code_key" ON "CpcNode"("code");
CREATE UNIQUE INDEX "CpcEdge_snapshotId_parentNodeId_childNodeId_key" ON "CpcEdge"("snapshotId", "parentNodeId", "childNodeId");

CREATE INDEX "CpcSnapshot_loadedAt_idx" ON "CpcSnapshot"("loadedAt");
CREATE INDEX "CpcSnapshot_source_idx" ON "CpcSnapshot"("source");
CREATE INDEX "CpcNode_levelNum_idx" ON "CpcNode"("levelNum");
CREATE INDEX "CpcNode_nodeType_idx" ON "CpcNode"("nodeType");
CREATE INDEX "CpcEdge_parentNodeId_idx" ON "CpcEdge"("parentNodeId");
CREATE INDEX "CpcEdge_childNodeId_idx" ON "CpcEdge"("childNodeId");
CREATE INDEX "CpcNodeRaw_snapshotId_idx" ON "CpcNodeRaw"("snapshotId");
CREATE INDEX "CpcNodeRaw_code_idx" ON "CpcNodeRaw"("code");
CREATE INDEX "CpcNodeRaw_parentCode_idx" ON "CpcNodeRaw"("parentCode");
CREATE INDEX "CatalogItem_cpcCode_idx" ON "CatalogItem"("cpcCode");

ALTER TABLE "CatalogItem"
  ADD CONSTRAINT "CatalogItem_cpcCode_fkey"
  FOREIGN KEY ("cpcCode") REFERENCES "CpcNode"("code") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CpcEdge"
  ADD CONSTRAINT "CpcEdge_snapshotId_fkey"
  FOREIGN KEY ("snapshotId") REFERENCES "CpcSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CpcEdge"
  ADD CONSTRAINT "CpcEdge_parentNodeId_fkey"
  FOREIGN KEY ("parentNodeId") REFERENCES "CpcNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CpcEdge"
  ADD CONSTRAINT "CpcEdge_childNodeId_fkey"
  FOREIGN KEY ("childNodeId") REFERENCES "CpcNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CpcNodeRaw"
  ADD CONSTRAINT "CpcNodeRaw_snapshotId_fkey"
  FOREIGN KEY ("snapshotId") REFERENCES "CpcSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CpcNodeRaw"
  ADD CONSTRAINT "CpcNodeRaw_nodeId_fkey"
  FOREIGN KEY ("nodeId") REFERENCES "CpcNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
