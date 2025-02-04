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

export default async function ProtectedPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/sign-in");
    }

    // Mock data remains the same
    const mockCourses = [
        {
            id: 1,
            code: "CS 2200",
            name: "Systems and Networks",
            unreadPosts: 5,
        },
        {
            id: 2,
            code: "CS 3510",
            name: "Design & Analysis of Algorithms",
            unreadPosts: 2,
        },
    ];

    const mockRecentDiscussions = [
        {
            id: 1,
            title: "Project 1 Clarification",
            course: "CS 2200",
            replies: 12,
        },
        {
            id: 2,
            title: "Midterm Review Questions",
            course: "CS 3510",
            replies: 8,
        },
    ];

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
                                    {mockCourses.map((course) => (
                                        <Link
                                            // href={`/protected/courses/${course.id}`}
                                            href={"/"}
                                            key={course.id}
                                        >
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                            >
                                                <div className="flex justify-between w-full items-center">
                                                    <span className="truncate">
                                                        {course.code}
                                                    </span>
                                                    {course.unreadPosts > 0 && (
                                                        <span className="bg-primary text-primary-foreground px-2 rounded-full text-xs">
                                                            {course.unreadPosts}
                                                        </span>
                                                    )}
                                                </div>
                                            </Button>
                                        </Link>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Join Course
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Quick Stats - Grid for all screen sizes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Active Courses
                                </h4>
                                <p className="text-2xl font-bold">
                                    {mockCourses.length}
                                </p>
                            </div>
                            <div className="border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Total Discussions
                                </h4>
                                <p className="text-2xl font-bold">24</p>
                            </div>
                            <div className="border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Unread Posts
                                </h4>
                                <p className="text-2xl font-bold">7</p>
                            </div>
                        </div>

                        {/* Recent Discussions - Responsive Card Layout */}
                        <div className="border rounded-lg">
                            <div className="p-4 border-b">
                                <h3 className="text-lg font-semibold">
                                    Recent Discussions
                                </h3>
                            </div>
                            <div className="divide-y">
                                {mockRecentDiscussions.map((discussion) => (
                                    <div
                                        key={discussion.id}
                                        className="p-4 hover:bg-muted/50"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                            <div>
                                                <h4 className="font-medium">
                                                    {discussion.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {discussion.course} •{" "}
                                                    {discussion.replies} replies
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full sm:w-auto"
                                            >
                                                View Thread
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Features Preview - Responsive Grid */}
                        <div className="border rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-4">
                                AI-Powered Features
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium">
                                        Smart Summaries
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Get AI-generated summaries of long
                                        discussion threads
                                    </p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium">
                                        Knowledge Graph
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Visualize connections between related
                                        topics
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
