import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function CoursePage(context: {
    params: { courseId: string };
}) {
    const params = await context.params;
    const courseId = params.courseId;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/sign-in");
    }

    const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

    if (!course) {
        return redirect("/protected");
    }

    // Get course enrollments
    const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("course_id", courseId);

    const isCreator = course.creator_id === user.id;

    if (isCreator) {
        return (
            <div className="flex-1 w-full max-w-4xl p-4 space-y-8">
                <h1 className="text-2xl font-bold">
                    {course.name} ({course.code})
                </h1>

                <div className="p-6 border rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                        Course Enrollment
                    </h2>
                    <form
                        action={`/api/courses/${courseId}/enroll`}
                        method="POST"
                        encType="multipart/form-data"
                    >
                        <Input
                            type="file"
                            name="file"
                            accept=".xlsx,.xls"
                            required
                        />
                        <Button type="submit" className="mt-4">
                            Upload Enrollment File
                        </Button>
                    </form>
                </div>

                <div className="p-6 border rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                        Course Members
                    </h2>
                    <div className="space-y-2">
                        {enrollments?.map((enrollment) => (
                            <div
                                key={enrollment.id}
                                className="flex justify-between items-center p-2 border rounded"
                            >
                                <span>{enrollment.email}</span>
                                <span>{enrollment.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-4xl p-4">
            <h1 className="text-2xl font-bold">
                {course.name} ({course.code})
            </h1>
            <p className="mt-4">Course content coming soon!</p>
        </div>
    );
}
