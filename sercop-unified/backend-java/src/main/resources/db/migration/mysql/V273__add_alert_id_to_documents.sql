ALTER TABLE documents ADD COLUMN alert_id VARCHAR(100);
CREATE INDEX idx_doc_alert ON documents(alert_id);

ALTER TABLE document_readmodel ADD COLUMN alert_id VARCHAR(100);
CREATE INDEX idx_doc_rm_alert ON document_readmodel(alert_id);
