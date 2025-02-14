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
            .select("creator_id, members")
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

            const { data: userData } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", email)
                .single();

            if (userData) {
                const currentMembers = course.members || [];
                const newMember = { userId: userData.id, role: "Student" };

                const isExistingMember = currentMembers.some(
                    (member: any) => member.userId === userData.id
                );

                if (!isExistingMember) {
                    const updatedMembers = [...currentMembers, newMember];

                    const { error: updateError } = await supabase
                        .from("courses")
                        .update({ members: updatedMembers })
                        .eq("id", courseId);

                    if (updateError) {
                        console.error(
                            `Error adding user ${email}:`,
                            updateError
                        );
                        continue;
                    }

                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("courses")
                        .eq("id", userData.id)
                        .single();

                    const userCourses = profile?.courses || [];
                    const isInUserCourses = userCourses.some(
                        (course: any) => course.courseId === courseId
                    );

                    if (!isInUserCourses) {
                        const updatedCourses = [
                            ...userCourses,
                            { courseId: courseId, role: "Student" },
                        ];

                        await supabase
                            .from("profiles")
                            .update({ courses: updatedCourses })
                            .eq("id", userData.id);
                    }
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
