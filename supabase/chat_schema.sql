-- 1. Create profiles table (User Directory)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- 2. Create friend requests table
create table if not exists friend_requests (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sender_id, receiver_id)
);

-- 3. Create direct messages table
create table if not exists direct_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Security (RLS)
alter table profiles enable row level security;
alter table friend_requests enable row level security;
alter table direct_messages enable row level security;

-- 5. Policies
-- Profiles
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Friend Requests
create policy "Users can view their own friend requests"
  on friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send friend requests"
  on friend_requests for insert
  with check (auth.uid() = sender_id);

create policy "Users can update requests sent to them"
  on friend_requests for update
  using (auth.uid() = receiver_id);

-- Messages
create policy "Users can view their own messages"
  on direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on direct_messages for insert
  with check (auth.uid() = sender_id);

-- 6. Helper Functions & Triggers

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to search users
create or replace function search_users_by_email(search_term text)
returns table (id uuid, email text, raw_user_meta_data jsonb)
security definer
as $$
begin
  return query
  select 
    au.id, 
    au.email::text, 
    au.raw_user_meta_data
  from auth.users au
  where au.email ilike '%' || search_term || '%';
end;
$$ language plpgsql;

-- 7. Backfill existing users (Optional but recommended)
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;
