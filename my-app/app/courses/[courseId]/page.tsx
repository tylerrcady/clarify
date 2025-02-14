import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CoursePage from "./CoursePageClient";

interface Params {
    params: Promise<{ courseId: string }>;
}

export default async function CoursePageWrapper({ params }: Params) {
    const { courseId } = await params;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/sign-in");
    }

    // Fetch the course
    const { data: course } = await supabase
        .from("courses")
        .select("*, members")
        .eq("id", courseId)
        .single();

    if (!course) {
        return redirect("/protected");
    }

    // Check if user is the creator
    const isCreator = course.creator_id === user.id;

    if (!isCreator) {
        // If not creator, check if user is enrolled
        const { data: enrollment } = await supabase
            .from("course_enrollments")
            .select("courses")
            .eq("email", user.email)
            .single();

        const isEnrolled = enrollment?.courses?.some(
            (c: { courseId: string }) => c.courseId === courseId
        );

        if (!isEnrolled) {
            // User is neither creator nor enrolled
            return redirect("/protected");
        }
    }

    return (
        <CoursePage initialCourse={course} user={user} courseId={courseId} />
    );
}
