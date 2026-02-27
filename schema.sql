create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  email text unique not null,
  phone text,
  stripe_customer_id text unique,
  whop_user_id text,
  created_at timestamptz default now()
);
alter table users add column if not exists first_name text;
alter table users add column if not exists phone text;

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  product_type text not null,
  amount integer not null,
  stripe_payment_intent_id text unique,
  created_at timestamptz default now()
);

create table if not exists access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) unique,
  entry_unlocked boolean default false,
  bump1_unlocked boolean default false,
  bump2_unlocked boolean default false,
  bump3_unlocked boolean default false,
  upsell1_unlocked boolean default false,
  upsell2_unlocked boolean default false,
  updated_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  first_name text not null,
  email text not null,
  phone text not null,
  consent_marketing boolean not null default false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamptz default now()
);

alter table users enable row level security;
alter table purchases enable row level security;
alter table access enable row level security;
alter table leads enable row level security;
