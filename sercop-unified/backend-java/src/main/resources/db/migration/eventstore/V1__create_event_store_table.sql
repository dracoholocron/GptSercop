-- =============================================================================
-- Event Store Table
-- Almacena todos los eventos del sistema (Event Sourcing)
-- =============================================================================

CREATE TABLE IF NOT EXISTS event_store (
    eventId VARCHAR(255) NOT NULL,
    aggregateId VARCHAR(255) NOT NULL,
    aggregateType VARCHAR(100) NOT NULL,
    version BIGINT NOT NULL,
    eventType VARCHAR(100) NOT NULL,
    eventData TEXT NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    performedBy VARCHAR(100),
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    metadata TEXT,
    PRIMARY KEY (eventId),
    INDEX idx_aggregateId (aggregateId),
    INDEX idx_aggregateType (aggregateType),
    INDEX idx_eventType (eventType),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de snapshots para optimización
CREATE TABLE IF NOT EXISTS event_snapshots (
    snapshotId VARCHAR(255) NOT NULL,
    aggregateId VARCHAR(255) NOT NULL,
    aggregateType VARCHAR(100) NOT NULL,
    version BIGINT NOT NULL,
    snapshotData TEXT NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    PRIMARY KEY (snapshotId),
    INDEX idx_snapshot_aggregateId (aggregateId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
