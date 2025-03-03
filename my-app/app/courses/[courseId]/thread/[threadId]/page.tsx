import { createClient } from "@/utils/supabase/server";
import ThreadDiscussion from "./ThreadDiscussion";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Params {
    courseId: string;
    threadId: string;
}

export default async function ThreadPage({
    params,
}: {
    params: Promise<Params>;
}) {
    const resolvedParams = await params;

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
        .eq("id", resolvedParams.courseId)
        .single();

    if (!course) {
        return redirect("/dashboard");
    }

    const isCreator = course.creator_id === user.id;

    if (!isCreator) {
        const { data: enrollment } = await supabase
            .from("course_enrollments")
            .select("courses")
            .eq("email", user.email)
            .single();

        const isEnrolled = enrollment?.courses?.some(
            (c: { courseId: string }) => c.courseId === resolvedParams.courseId
        );

        if (!isEnrolled) {
            return redirect("/dashboard");
        }
    }

    const { data: thread } = await supabase
        .from("threads")
        .select("*")
        .eq("id", resolvedParams.threadId)
        .single();

    if (!thread) {
        return <Link href="/dashboard">Redirecting to dashboard...</Link>;
    }

    return <ThreadDiscussion thread={thread} />;
}
