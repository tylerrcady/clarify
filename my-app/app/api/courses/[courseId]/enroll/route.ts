import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";

export async function POST(
    request: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        const courseId = params.courseId;

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
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet);

        for (const row of data as any[]) {
            const email = row.email;

            if (email) {
                const { error } = await supabase
                    .from("course_enrollments")
                    .upsert(
                        {
                            email: email.toLowerCase(),
                            course_id: courseId,
                            role: "Student",
                        },
                        {
                            onConflict: "email,course_id",
                        }
                    );

                if (error) {
                    console.error(`Error enrolling ${email}:`, error);
                }
            }
        }

        return NextResponse.json(
            { message: "Enrollment successful" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error processing enrollment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
