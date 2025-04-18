create or replace function delete_course(course_id_param uuid)
returns void
language plpgsql
security definer
as $$
begin
    -- delete all thread votes for threads in this course
    delete from thread_votes
    where thread_id in (
        select id from threads where course_id = course_id_param
    );

    -- delete all threads in the course
    delete from threads
    where course_id = course_id_param;

    -- update course_enrollments to remove this course
    update course_enrollments
    set courses = coalesce(
        (
            select array_agg(c)::jsonb[]
            from (
                select c
                from unnest(courses) c
                where (c->>'courseId')::uuid != course_id_param
            ) sub
        ),
        '{}'::jsonb[]
    )
    where exists (
        select 1
        from unnest(courses) c
        where (c->>'courseId')::uuid = course_id_param
    );

    -- finally delete the course itself
    delete from courses
    where id = course_id_param;
end;
$$;