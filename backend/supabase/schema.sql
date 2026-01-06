-- ZeroDust Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sweep status enum
CREATE TYPE sweep_status AS ENUM (
  'pending',
  'simulating',
  'executing',
  'bridging',
  'completed',
  'failed'
);

-- Quotes table (ephemeral, short TTL)
-- Stores quote data before user signs
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  from_chain_id INTEGER NOT NULL,
  to_chain_id INTEGER NOT NULL,
  destination TEXT NOT NULL,
  user_balance TEXT NOT NULL,
  estimated_receive TEXT NOT NULL,
  gas_cost TEXT NOT NULL,
  service_fee TEXT NOT NULL,
  bridge_fee TEXT NOT NULL,
  max_relayer_compensation TEXT NOT NULL,
  max_fee_per_gas TEXT NOT NULL,
  max_priority_fee_per_gas TEXT NOT NULL,
  gas_limit INTEGER NOT NULL,
  deadline INTEGER NOT NULL,
  nonce INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Sweeps table (permanent record)
-- Stores all sweep executions
CREATE TABLE sweeps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id),
  user_address TEXT NOT NULL,
  destination TEXT NOT NULL,
  from_chain_id INTEGER NOT NULL,
  to_chain_id INTEGER NOT NULL,
  status sweep_status NOT NULL DEFAULT 'pending',
  amount_sent TEXT,
  relayer_compensation TEXT,
  tx_hash TEXT,
  bridge_tx_hash TEXT,
  error_message TEXT,
  signature TEXT, -- EIP-712 signature for processing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nonces table (for quick lookup)
-- Tracks next available nonce per user per chain
CREATE TABLE nonces (
  user_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  current_nonce INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_address, chain_id)
);

-- Metrics table (anonymized daily stats)
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER NOT NULL,
  sweep_count INTEGER DEFAULT 0,
  total_volume TEXT DEFAULT '0',
  total_fees TEXT DEFAULT '0',
  date DATE NOT NULL,
  UNIQUE(chain_id, date)
);

-- Indexes for performance
CREATE INDEX idx_quotes_user ON quotes(user_address);
CREATE INDEX idx_quotes_expires ON quotes(expires_at);
CREATE INDEX idx_sweeps_user ON sweeps(user_address);
CREATE INDEX idx_sweeps_status ON sweeps(status);
CREATE INDEX idx_sweeps_created ON sweeps(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on sweeps
CREATE TRIGGER update_sweeps_updated_at
  BEFORE UPDATE ON sweeps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment nonce after successful sweep
CREATE OR REPLACE FUNCTION increment_nonce(p_user_address TEXT, p_chain_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_nonce INTEGER;
BEGIN
  -- Insert or update nonce, returning the new value
  INSERT INTO nonces (user_address, chain_id, current_nonce)
  VALUES (LOWER(p_user_address), p_chain_id, 1)
  ON CONFLICT (user_address, chain_id)
  DO UPDATE SET current_nonce = nonces.current_nonce + 1
  RETURNING current_nonce INTO v_nonce;

  RETURN v_nonce;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (Row Level Security)
-- Enable RLS on all tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sweeps ENABLE ROW LEVEL SECURITY;
ALTER TABLE nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for backend)
-- These policies allow the service role to bypass RLS
CREATE POLICY "Service role full access on quotes"
  ON quotes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on sweeps"
  ON sweeps FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on nonces"
  ON nonces FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on metrics"
  ON metrics FOR ALL
  USING (auth.role() = 'service_role');

-- Cleanup old quotes (run periodically)
-- Quotes expire after 60 seconds, we can clean up after 1 hour
CREATE OR REPLACE FUNCTION cleanup_expired_quotes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM quotes
  WHERE expires_at < NOW() - INTERVAL '1 hour'
  AND id NOT IN (SELECT quote_id FROM sweeps WHERE quote_id IS NOT NULL);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE quotes IS 'Ephemeral quote data before user signs authorization';
COMMENT ON TABLE sweeps IS 'Permanent record of all sweep executions';
COMMENT ON TABLE nonces IS 'Tracks next available nonce per user per chain';
COMMENT ON TABLE metrics IS 'Anonymized daily statistics per chain';
COMMENT ON COLUMN sweeps.status IS 'pending -> simulating -> executing -> [bridging] -> completed/failed';
