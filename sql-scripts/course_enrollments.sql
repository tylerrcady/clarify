create table course_enrollments (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  course_id uuid references courses(id) on delete cascade,
  role text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(email, course_id)
);