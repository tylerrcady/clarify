-- threads table
create table threads (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  content text not null,
  tags text[] default '{}',
  creator_id uuid references auth.users(id),
  creator_role text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- comments table
create table comments (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references threads(id) on delete cascade,
  content text not null,
  creator_id uuid references auth.users(id),
  creator_role text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- anonymous names table (for thread-specific anonymity)
create table thread_anonymous_names (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references threads(id) on delete cascade,
  user_id uuid references auth.users(id),
  anonymous_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(thread_id, user_id)
);