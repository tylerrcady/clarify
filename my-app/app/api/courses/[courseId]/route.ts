import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const courseId = pathSegments[pathSegments.indexOf("courses") + 1];

        if (!courseId) {
            return NextResponse.json(
                { error: "Course ID not found" },
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

        const { data: course } = await supabase
            .from("courses")
            .select("creator_id")
            .eq("id", courseId)
            .single();

        if (!course || course.creator_id !== user.id) {
            return NextResponse.json(
                {
                    error: "Unauthorized - only course creator can delete course",
                },
                { status: 403 }
            );
        }

        const { error: deleteError } = await supabase.rpc("delete_course", {
            course_id_param: courseId,
        });

        if (deleteError) {
            return NextResponse.json(
                { error: "Failed to delete course" },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Course deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
