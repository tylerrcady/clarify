create table courses (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    code text not null,
    creator_id uuid references auth.users not null,
    members jsonb[] default '{}' -- array of {email, role} objects
);

create table course_enrollments (
    email text primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    courses jsonb[] default '{}' -- array of {courseId, role} objects
);