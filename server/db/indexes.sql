-- Performance indexes for scan_history table
CREATE INDEX IF NOT EXISTS idx_scan_history_session_id ON scan_history(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_category ON scan_history(category);

-- Performance indexes for listings table
CREATE INDEX IF NOT EXISTS idx_listings_session_id ON listings(session_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_status_category ON listings(status, category);
