create table public.profiles (
  id uuid references auth.users on delete cascade,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

alter table public.profiles enable row level security;

-- create a policy to allow users to view their own profile
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

-- create a policy to allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- function to handle new user creation
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, is_admin)
  values (new.id, false);
  return new;
end;
$$;

-- trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();