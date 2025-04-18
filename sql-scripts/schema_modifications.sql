-- modify profiles table
alter table profiles add column courses jsonb default '[]'::jsonb;
-- courses will store array of objects like [{courseId: string, role: string}]

-- modify courses table
alter table courses add column creator_id uuid references auth.users(id);
alter table courses add column members jsonb default '[]'::jsonb;
-- members will store array of objects like [{userId: uuid, role: string}]