import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    LayoutDashboard,
    BookOpen,
    MessageSquare,
    Plus,
    Settings,
    Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type Course = {
    id: string;
    name: string;
    code: string;
    creator_id: string;
};

type CourseEnrollment = {
    email: string;
    courses: Array<{
        courseId: string;
        role: string;
    }>;
};

export default async function ProtectedPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/sign-in");
    }

    // Fetch user's admin status
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    // Fetch courses created by the user
    const { data: createdCourses = [] } = await supabase
        .from("courses")
        .select("*")
        .eq("creator_id", user.id);

    // Fetch the user's enrollment data
    const { data: enrollment } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("email", user.email)
        .single();

    // Fetch enrolled courses
    let enrolledCourses: Course[] = [];
    if (enrollment?.courses && enrollment.courses.length > 0) {
        const courseIds: string[] = enrollment.courses.map(
            (c: { courseId: string; role: string }) => c.courseId
        );
        const { data: courses } = await supabase
            .from("courses")
            .select("*")
            .in("id", courseIds);

        if (courses) {
            enrolledCourses = courses.filter(
                (course) => course.creator_id !== user.id
            );
        }
    }

    // The rest of your component remains the same...
    return (
        <div className="flex-1 w-full">
            {/* Top Navigation Bar - Responsive */}
            <div className="border-b">
                <div className="flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center px-4 py-3 sm:py-0 container mx-auto gap-3 sm:gap-0">
                    <h2 className="text-xl sm:text-2xl font-bold">Dashboard</h2>
                    <div className="flex flex-col sm:flex-row sm:ml-auto w-full sm:w-auto gap-2 sm:gap-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search discussions..."
                                className="pl-8"
                            />
                        </div>
                        <Link href={"/settings"}>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content - Responsive Grid */}
            <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar - Collapsible on Mobile */}
                    <div className="lg:col-span-3">
                        <div className="space-y-4">
                            {/* Navigation Section */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">
                                    Navigation
                                </h3>
                                <nav className="flex flex-row lg:flex-col gap-2">
                                    <Button
                                        variant="ghost"
                                        className="justify-start flex-1 lg:flex-none"
                                    >
                                        <LayoutDashboard className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">
                                            Overview
                                        </span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="justify-start flex-1 lg:flex-none"
                                    >
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">
                                            My Courses
                                        </span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="justify-start flex-1 lg:flex-none"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">
                                            Discussions
                                        </span>
                                    </Button>
                                </nav>
                            </div>

                            {/* Courses Section */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">
                                    My Courses
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                                    {[
                                        ...(createdCourses || []),
                                        ...(enrolledCourses || []),
                                    ].map((course) => (
                                        <Link
                                            href={`/courses/${course.id}`}
                                            key={course.id}
                                        >
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                            >
                                                <div className="flex justify-between w-full items-center">
                                                    <span className="truncate mr-2">
                                                        {course.code}
                                                    </span>
                                                    {course.creator_id ===
                                                        user.id && (
                                                        <span className="bg-primary text-primary-foreground px-2 rounded-full text-xs">
                                                            ★
                                                        </span>
                                                    )}
                                                </div>
                                            </Button>
                                        </Link>
                                    ))}
                                    {userProfile?.is_admin && (
                                        <Link href="/settings">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Course
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Active Courses
                                </h4>
                                <p className="text-2xl font-bold">
                                    {(createdCourses || []).length +
                                        (enrolledCourses || []).length}
                                </p>
                            </div>
                            <div className="border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Created Courses
                                </h4>
                                <p className="text-2xl font-bold">
                                    {(createdCourses || []).length}
                                </p>
                            </div>
                            <div className="border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Enrolled Courses
                                </h4>
                                <p className="text-2xl font-bold">
                                    {(enrolledCourses || []).length}
                                </p>
                            </div>
                        </div>

                        {/* Created Courses Section */}
                        {(createdCourses || []).length > 0 && (
                            <div className="border rounded-lg">
                                <div className="p-4 border-b">
                                    <h3 className="text-lg font-semibold">
                                        Created Courses
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {(createdCourses || []).map((course) => (
                                        <Link
                                            href={`/courses/${course.id}`}
                                            key={course.id}
                                        >
                                            <div className="border rounded-lg p-4 hover:bg-muted/50">
                                                <h4 className="font-medium">
                                                    {course.name}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {course.code}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Enrolled Courses Section */}
                        {(enrolledCourses || []).length > 0 && (
                            <div className="border rounded-lg">
                                <div className="p-4 border-b">
                                    <h3 className="text-lg font-semibold">
                                        Enrolled Courses
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {(enrolledCourses || []).map((course) => (
                                        <Link
                                            href={`/courses/${course.id}`}
                                            key={course.id}
                                        >
                                            <div className="border rounded-lg p-4 hover:bg-muted/50">
                                                <h4 className="font-medium">
                                                    {course.name}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {course.code}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
