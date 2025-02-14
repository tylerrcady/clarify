import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CoursePage from "./CoursePageClient";

interface Params {
    params: {
        courseId: string;
    };
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

    const { data: course } = await supabase
        .from("courses")
        .select("*, members")
        .eq("id", courseId)
        .single();

    if (!course) {
        return redirect("/protected");
    }

    return (
        <CoursePage initialCourse={course} user={user} courseId={courseId} />
    );
}
