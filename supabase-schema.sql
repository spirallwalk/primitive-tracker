-- Run this in your Supabase SQL editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  habit_id text not null,
  logged_at date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, habit_id, logged_at)
);

-- Index for weekly leaderboard query
create index if not exists habit_logs_logged_at_idx on habit_logs(logged_at);
create index if not exists habit_logs_user_id_idx on habit_logs(user_id);
