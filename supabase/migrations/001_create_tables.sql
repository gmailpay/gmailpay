-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Profiles (auto-created on signup via trigger)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Public profiles readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid()=id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create or replace trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

-- Gmail Submissions
create table if not exists public.gmail_submissions (
  id uuid default gen_random_uuid() primary key,
  email_address text not null,
  submitted_by text not null,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz default now()
);
alter table public.gmail_submissions enable row level security;
create policy "Users see own submissions" on public.gmail_submissions for select using (true);
create policy "Users can insert" on public.gmail_submissions for insert with check (true);
create policy "Admins can update" on public.gmail_submissions for update using (true);

-- Withdrawals
create table if not exists public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  amount integer not null,
  bank_name text,
  bank_account_number text,
  status text default 'pending' check (status in ('pending','paid')),
  created_at timestamptz default now()
);
alter table public.withdrawals enable row level security;
create policy "Users see own withdrawals" on public.withdrawals for select using (true);
create policy "Users can insert" on public.withdrawals for insert with check (true);
create policy "Admins can update" on public.withdrawals for update using (true);

-- Referrals
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_email text not null,
  referred_email text not null,
  referral_bonus_paid boolean default false,
  power_bonus_paid boolean default false,
  created_at timestamptz default now()
);
alter table public.referrals enable row level security;
create policy "Users see own referrals" on public.referrals for select using (true);
create policy "Anyone can insert" on public.referrals for insert with check (true);
create policy "Admins can update" on public.referrals for update using (true);

-- Reserved Usernames
create table if not exists public.reserved_usernames (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  gmail_address text not null,
  created_at timestamptz default now()
);
alter table public.reserved_usernames enable row level security;
create policy "Users see own" on public.reserved_usernames for select using (true);
create policy "Users can insert" on public.reserved_usernames for insert with check (true);

-- App Settings
create table if not exists public.app_settings (
  id uuid default gen_random_uuid() primary key,
  setting_key text unique not null,
  submissions_open boolean default true,
  created_at timestamptz default now()
);
alter table public.app_settings enable row level security;
create policy "Anyone can read" on public.app_settings for select using (true);
create policy "Admins can modify" on public.app_settings for all using (true);

-- Payout Logs
create table if not exists public.payout_logs (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  withdrawal_id uuid,
  amount integer,
  bank_name text,
  bank_account_number text,
  cleared_by_admin1 boolean default false,
  final_payout_done boolean default false,
  email_sent boolean default false,
  created_at timestamptz default now()
);
alter table public.payout_logs enable row level security;
create policy "Anyone can read" on public.payout_logs for select using (true);
create policy "Anyone can insert" on public.payout_logs for insert with check (true);
create policy "Admins can update" on public.payout_logs for update using (true);

-- Insert default settings
insert into public.app_settings (setting_key, submissions_open) values ('main', true) on conflict do nothing;
