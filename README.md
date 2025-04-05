# CS 4365 Project: Clarify
Clarify challenges the preconceptions of how a traditional educational forum operates and what
it should provide. We take advantage of the reality of knowledge obsolescence and rejuvenation
to stray from current leaders like Piazza and Ed Discussion, which abandon older, yet important
information, while obfuscating current up-to-date resources.
## Milestones

### Milestone 4: Knowledge Graphs
Develop and integrate topical knowledge graphs for improved information visualization.

#### Database Schema:
The database schema for milesone 4 is the same as the database schema for milestone 3 (apart from updated RPCs).


#### Example of Features:
If you decide not to request admin privileges to view features, you can view a general example of milestone 4 features below.

> Knowledge Graph:

---

### Milestone 3: AI Summarization and Search
Implement AI-driven summarization for threads and enhance search capabilities.

#### Database Schema:
The database schema for milesone 3 is the same as the database schema for milestone 2.


#### Example of Features:
If you decide not to request admin privileges to view features, you can view a general example of milestone 3 features below.

> AI-Summarization (generated from thread and comment content):

![image](https://github.com/user-attachments/assets/89dbeee1-2e8f-4999-a5e8-4360935533ee)

> Full-text Search:

![image](https://github.com/user-attachments/assets/fdb7ba58-a164-4872-9a33-3cfc1557a822)

> Semantic Search (notice how a thread appears that doesn't contain the search word):

![image](https://github.com/user-attachments/assets/0971089b-ed61-44ea-b6c7-beb8b01d0f58)

> Tag Filters:

![image](https://github.com/user-attachments/assets/751b2be2-2fd0-480f-87ed-b7746b01cdde)

---

### Milestone 2: Core Forum Development
Implement fundamental anonymized forum features such as threads, comments, and tags.

#### Example Delete Course Procedure/RPC:

```
create or replace function delete_course(course_id_param uuid)
returns void
language plpgsql
security definer
as $$
begin
    -- Delete all thread votes for threads in this course
    delete from thread_votes
    where thread_id in (
        select id from threads where course_id = course_id_param
    );

    -- Delete all threads in the course
    delete from threads
    where course_id = course_id_param;

    -- Update course_enrollments to remove this course
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

    -- Finally delete the course itself
    delete from courses
    where id = course_id_param;
end;
$$;
```

#### Database Schema:
This is the current database schema visualization for milestone 2.

![database-schema-2](https://github.com/user-attachments/assets/91b48eb7-aba2-41e9-8bb3-b554089d954d)


#### General Flow Figures:
If you decide not to request admin privileges to view features, you can view the general flow of milestone 2 implementations below (blurred intentionally).

![demo-figures-2](https://github.com/user-attachments/assets/fb4c8162-870a-48bc-a329-9c000a6801b1)

---

### Milestone 1: Authentication and Enrollment
Integrate Canvas's roster export schema for seamless course setup and user authentication.
#### Mock Canvas Roster Export Data:
I cannot provide any real data for confidentiality, however, anyone with Canvas course access can acquire this file for their course.

| Name              | Email                   | GT ID       | GT Account | Major(s) | Role    | Section(s) | Confidential? | Grade Mode   | Last Course Activity      | Total Course Activity |
|------------------|------------------------|-------------|------------|----------|---------|------------|---------------|--------------|----------------------|-------------------|
| Doe, John A     | tylercadya@gmail.com    | 903111111   | jdoe3      | us/c/coc/bscs/a/cs/cs08/info/internetwork-infrastructure | Student  | 202408/CS/2200/A/80169, 202408/CS/2200/A03/88677 | N/A           | Letter Grade | 2024-12-10 10:00 EST  | 100:30:15  |
| Smith, Jane B   | tylercadyb@gmail.com    | 903222222   | jsmith9    | us/c/coc/bscs/a/cs/cs30/info/internetwork-systems | TA       | 202408/CS/2200/A/80169, 202408/CS/2200/A04/88678 | N/A           | Letter Grade | 2024-12-12 14:30 EST  | 120:45:30  |
| Brown, Charlie C | tylercadyc@gmail.com    | 903333333   | cbrown7    | us/m/mgt/bsba/a/ba/mg04/information technology | Teacher  | 202408/CS/2200/A/80169, 202408/CS/2200/A05/88679 | N/A           | Letter Grade | 2024-12-15 09:45 EST  | 95:20:10   |

#### Database Schema:
This is the current database schema visualization for milestone 1.

![database-schema](https://github.com/user-attachments/assets/7bdbb937-5853-46bb-8a5d-94057e40c9a4)


#### General Flow Figures:
If you decide not to request admin privileges to view features, you can view the general flow of milestone 1 implementations below (blurred intentionally).

![demo-figures](https://github.com/user-attachments/assets/11c504dc-da2c-4405-9cd2-a366875d8560)
