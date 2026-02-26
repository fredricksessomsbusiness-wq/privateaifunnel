create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  stripe_customer_id text unique,
  whop_user_id text,
  created_at timestamptz default now()
);

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

alter table users enable row level security;
alter table purchases enable row level security;
alter table access enable row level security;
