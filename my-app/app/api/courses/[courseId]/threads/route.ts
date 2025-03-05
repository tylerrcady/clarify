import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/utils/search";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const courseId = pathSegments[pathSegments.indexOf("courses") + 1];

        const supabase = await createClient();
        const { data: threads } = await supabase.rpc("get_threads_with_votes", {
            course_id_param: courseId,
        });

        const {
            data: { user },
        } = await supabase.auth.getUser();
        let userVotes: { [key: string]: string } = {};

        if (user) {
            const { data: votes } = await supabase
                .from("thread_votes")
                .select("thread_id, vote_type")
                .eq("user_id", user.id);

            if (votes) {
                userVotes = votes.reduce(
                    (
                        acc: { [key: string]: string },
                        vote: { thread_id: string; vote_type: string }
                    ) => {
                        acc[vote.thread_id] = vote.vote_type;
                        return acc;
                    },
                    {}
                );
            }
        }

        return NextResponse.json({ threads, userVotes }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const courseId = pathSegments[pathSegments.indexOf("courses") + 1];

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { title, content, tags } = await request.json();

        const { data: enrollment } = await supabase
            .from("course_enrollments")
            .select("courses")
            .eq("email", user.email)
            .single();

        if (!enrollment) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const courseEnrollment = enrollment.courses.find(
            (c: { courseId: string }) => c.courseId === courseId
        );

        if (!courseEnrollment) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const embedding = await generateEmbedding(`${title}\n${content}`);

        const { data: thread, error } = await supabase
            .from("threads")
            .insert({
                course_id: courseId,
                title,
                content,
                tags,
                creator_id: user.id,
                creator_role: courseEnrollment.role,
                embedding,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to create thread" },
                { status: 500 }
            );
        }

        await supabase.from("thread_anonymous_names").insert({
            thread_id: thread.id,
            user_id: user.id,
            anonymous_name: "OP",
        });

        return NextResponse.json({ thread }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
