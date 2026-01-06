// Database types for Supabase
// These match the schema in supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SweepStatus =
  | 'pending'
  | 'simulating'
  | 'executing'
  | 'bridging'
  | 'completed'
  | 'failed';

// Quote row type
export interface Quote {
  id: string;
  user_address: string;
  from_chain_id: number;
  to_chain_id: number;
  destination: string;
  user_balance: string;
  estimated_receive: string;
  gas_cost: string;
  service_fee: string;
  bridge_fee: string;
  max_relayer_compensation: string;
  max_fee_per_gas: string;
  max_priority_fee_per_gas: string;
  gas_limit: number;
  deadline: number;
  nonce: number;
  created_at: string;
  expires_at: string;
}

// Quote insert type (without auto-generated fields)
export interface QuoteInsert {
  user_address: string;
  from_chain_id: number;
  to_chain_id: number;
  destination: string;
  user_balance: string;
  estimated_receive: string;
  gas_cost: string;
  service_fee: string;
  bridge_fee: string;
  max_relayer_compensation: string;
  max_fee_per_gas: string;
  max_priority_fee_per_gas: string;
  gas_limit: number;
  deadline: number;
  nonce: number;
  expires_at: string;
}

// Sweep row type
export interface Sweep {
  id: string;
  quote_id: string | null;
  user_address: string;
  destination: string;
  from_chain_id: number;
  to_chain_id: number;
  status: SweepStatus;
  amount_sent: string | null;
  relayer_compensation: string | null;
  tx_hash: string | null;
  bridge_tx_hash: string | null;
  error_message: string | null;
  signature: string | null;
  created_at: string;
  updated_at: string;
}

// Sweep insert type
export interface SweepInsert {
  quote_id?: string | null;
  user_address: string;
  destination: string;
  from_chain_id: number;
  to_chain_id: number;
  status: SweepStatus;
  amount_sent?: string | null;
  relayer_compensation?: string | null;
  tx_hash?: string | null;
  bridge_tx_hash?: string | null;
  error_message?: string | null;
  signature?: string | null;
}

// Nonce row type
export interface Nonce {
  user_address: string;
  chain_id: number;
  current_nonce: number;
}

// Nonce insert type
export interface NonceInsert {
  user_address: string;
  chain_id: number;
  current_nonce: number;
}

// Metric row type
export interface Metric {
  id: string;
  chain_id: number;
  sweep_count: number;
  total_volume: string;
  total_fees: string;
  date: string;
}

// Database schema for Supabase client
export interface Database {
  public: {
    Tables: {
      quotes: {
        Row: Quote;
        Insert: QuoteInsert;
        Update: Partial<QuoteInsert>;
      };
      sweeps: {
        Row: Sweep;
        Insert: SweepInsert;
        Update: Partial<SweepInsert>;
      };
      nonces: {
        Row: Nonce;
        Insert: NonceInsert;
        Update: Partial<NonceInsert>;
      };
      metrics: {
        Row: Metric;
        Insert: Omit<Metric, 'id'>;
        Update: Partial<Omit<Metric, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      sweep_status: SweepStatus;
    };
  };
}
