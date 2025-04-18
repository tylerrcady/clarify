create table admin_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  user_email text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table courses (
  id uuid default uuid_generate_v4() primary key,
  code text not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);