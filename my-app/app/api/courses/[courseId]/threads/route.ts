import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const courseId = pathSegments[pathSegments.indexOf("courses") + 1];

        const supabase = await createClient();
        const { data: threads } = await supabase
            .from("threads")
            .select(
                `
        *,
        comments: comments(count),
        anonymous_names: thread_anonymous_names(anonymous_name)
      `
            )
            .eq("course_id", courseId)
            .order("created_at", { ascending: false });

        return NextResponse.json({ threads }, { status: 200 });
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

        const { data: thread, error } = await supabase
            .from("threads")
            .insert({
                course_id: courseId,
                title,
                content,
                tags,
                creator_id: user.id,
                creator_role: courseEnrollment.role,
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
