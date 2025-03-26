import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/utils/search";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const query = url.searchParams.get("q");
        const courseId = url.searchParams.get("courseId");
        const searchType = url.searchParams.get("type") || "semantic";

        if (!query) {
            return NextResponse.json(
                { error: "Search query is required" },
                { status: 400 }
            );
        }

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

        const { data: enrollment } = await supabase
            .from("course_enrollments")
            .select("courses")
            .eq("email", user.email)
            .single();

        const enrolledCourseIds =
            enrollment?.courses.map((c: { courseId: string }) => c.courseId) ||
            [];

        if (courseId) {
            const courseEnrollment = enrollment?.courses.find(
                (c: { courseId: string }) => c.courseId === courseId
            );

            if (!courseEnrollment) {
                return NextResponse.json(
                    { error: "Not enrolled in this course" },
                    { status: 403 }
                );
            }
        }

        let results;
        if (searchType === "semantic") {
            const queryEmbedding = await generateEmbedding(query);
            const { data, error } = await supabase.rpc("match_content", {
                query_embedding: queryEmbedding,
                similarity_threshold: 0.3, // modify the similarity threshold here (lower is more generalized) [default: 0.7]
                match_count: 20,
                course_filter: courseId || null,
                allowed_courses: courseId ? null : enrolledCourseIds,
            });
            if (error) throw error;
            results = data;
        } else {
            const { data, error } = await supabase.rpc("full_text_search", {
                search_query: query,
                match_count: 20,
                course_filter: courseId || null,
                allowed_courses: courseId ? null : enrolledCourseIds,
            });
            if (error) throw error;
            results = data;
        }

        return NextResponse.json({ results }, { status: 200 });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
