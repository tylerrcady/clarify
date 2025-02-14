import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";

type EnrollmentRow = {
    Name: string;
    Email: string;
    "GT ID": string;
    "GT Account": string;
    "Major(s)": string;
    Role: string;
    "Section(s)": string;
    "Confidential?": string;
    "Grade Mode": string;
    "Last course activity": string;
    "Total course activity": string;
};

export async function POST(request: NextRequest) {
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
        const data = xlsx.utils.sheet_to_json(worksheet) as EnrollmentRow[];

        const processedEmails = new Set<string>();
        let updatedMembers = [...(course.members || [])];

        for (const row of data) {
            const email = row.Email?.toLowerCase();
            let role: string;
            const inputRole = row.Role?.toLowerCase()?.trim();
            if (inputRole === "ta") {
                role = "TA";
            } else if (inputRole === "teacher") {
                role = "Teacher";
            } else {
                role = "Student";
            }

            if (email && !processedEmails.has(email)) {
                processedEmails.add(email);

                const { data: existingEnrollment } = await supabase
                    .from("course_enrollments")
                    .select("courses")
                    .eq("email", email)
                    .single();

                if (existingEnrollment) {
                    const updatedCourses = [...existingEnrollment.courses];
                    const existingCourseIndex = updatedCourses.findIndex(
                        (c) => c.courseId === courseId
                    );

                    if (existingCourseIndex === -1) {
                        updatedCourses.push({ courseId, role });
                    } else {
                        updatedCourses[existingCourseIndex].role = role;
                    }

                    await supabase
                        .from("course_enrollments")
                        .update({ courses: updatedCourses })
                        .eq("email", email);
                } else {
                    await supabase.from("course_enrollments").insert({
                        email,
                        courses: [{ courseId, role }],
                    });
                }

                const existingMemberIndex = updatedMembers.findIndex(
                    (member) => member.email === email
                );
                if (existingMemberIndex === -1) {
                    updatedMembers.push({ email, role });
                } else {
                    updatedMembers[existingMemberIndex].role = role;
                }
            }
        }

        await supabase
            .from("courses")
            .update({ members: updatedMembers })
            .eq("id", courseId);

        return NextResponse.json(
            {
                message: "Enrollment successful",
                processed: processedEmails.size,
            },
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
