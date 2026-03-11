-- SERCOP V2 Expanded Foundation – esquema de referencia
-- Relación: organizations -> pac_plans -> tenders -> bids -> evaluations -> contracts

create table organizations (
  id uuid primary key,
  code varchar(50) unique not null,
  legal_name varchar(500) not null,
  organization_type varchar(50) not null,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  organization_id uuid references organizations(id),
  email varchar(255) unique not null,
  full_name varchar(255) not null,
  status varchar(30) not null,
  created_at timestamptz not null default now()
);

create table providers (
  id uuid primary key,
  ruc varchar(13) unique not null,
  legal_name varchar(500) not null,
  trade_name varchar(500),
  status varchar(30) not null,
  province varchar(120),
  canton varchar(120),
  address text,
  created_at timestamptz not null default now()
);

create table pac_plans (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  fiscal_year integer not null,
  status varchar(30) not null,
  version_no integer not null,
  total_amount numeric(18,2) not null default 0
);

create table tenders (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  pac_plan_id uuid references pac_plans(id),
  code varchar(80) unique not null,
  title varchar(500) not null,
  description text,
  status varchar(30) not null,
  procurement_method varchar(80) not null,
  estimated_amount numeric(18,2) not null default 0
);

create table bids (
  id uuid primary key,
  tender_id uuid not null references tenders(id),
  provider_id uuid not null references providers(id),
  status varchar(30) not null,
  offered_amount numeric(18,2),
  submitted_at timestamptz not null default now()
);

create table evaluations (
  id uuid primary key,
  tender_id uuid not null references tenders(id),
  bid_id uuid not null references bids(id),
  technical_score numeric(10,2),
  financial_score numeric(10,2),
  total_score numeric(10,2),
  status varchar(30) not null
);

create table contracts (
  id uuid primary key,
  tender_id uuid not null references tenders(id),
  provider_id uuid not null references providers(id),
  contract_no varchar(80) unique not null,
  status varchar(30) not null,
  amount numeric(18,2) not null default 0
);

create table documents (
  id uuid primary key,
  owner_type varchar(50) not null,
  owner_id uuid not null,
  document_type varchar(80) not null,
  file_name varchar(255) not null,
  storage_key varchar(1000) not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key,
  actor_id uuid,
  action varchar(120) not null,
  entity_type varchar(80) not null,
  entity_id uuid,
  payload jsonb,
  occurred_at timestamptz not null default now()
);
