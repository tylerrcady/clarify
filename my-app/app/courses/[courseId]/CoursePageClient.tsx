"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage, Message } from "@/components/form-message";
import ThreadList from "./ThreadList";
import { fetchUpdatedCourseMembers } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function CoursePage({
    initialCourse,
    user,
    courseId,
}: {
    initialCourse: any;
    user: any;
    courseId: string;
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [members, setMembers] = useState(initialCourse?.members || []);
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    const isCreator = initialCourse?.creator_id === user?.id;

    const handleDeleteCourse = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                router.push("/dashboard");
            } else {
                const data = await response.json();
                setMessage({
                    error: data.error || "Failed to delete course",
                });
            }
        } catch (error) {
            setMessage({
                error: "An error occurred while deleting the course",
            });
        }
        setIsDeleting(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUploading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);

        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    success: `Successfully enrolled ${data.processed} students`,
                });

                const updatedMembers =
                    await fetchUpdatedCourseMembers(courseId);

                if (updatedMembers) {
                    setMembers(updatedMembers);
                }
            } else {
                setMessage({
                    error: data.error || "Failed to process enrollments",
                });
            }
        } catch (error) {
            setMessage({ error: "An unexpected error occurred" });
        } finally {
            setIsUploading(false);
            formRef.current?.reset();
        }
    };

    if (!initialCourse) {
        return null;
    }

    return (
        <div className="flex-1 w-full max-w-4xl p-4">
            <h1 className="text-2xl font-bold">
                {initialCourse.name} ({initialCourse.code})
            </h1>
            {isCreator && (
                <div className="flex-1 w-full max-w-4xl space-y-8 mt-4 mb-4">
                    <div className="p-6 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">
                            Course Enrollment
                        </h2>
                        <form
                            ref={formRef}
                            onSubmit={handleSubmit}
                            encType="multipart/form-data"
                        >
                            <Input
                                type="file"
                                name="file"
                                accept=".xlsx,.xls"
                                required
                                className="hover:cursor-pointer"
                            />
                            <Button
                                type="submit"
                                className="mt-4"
                                disabled={isUploading}
                            >
                                {isUploading
                                    ? "Uploading..."
                                    : "Upload Enrollment File"}
                            </Button>
                        </form>
                        {message && <FormMessage message={message} />}
                    </div>

                    <div className="p-6 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">
                            Course Members
                        </h2>
                        <div className="space-y-2">
                            {members?.map(
                                (
                                    member: { email: string; role: string },
                                    index: number
                                ) => (
                                    <div
                                        key={index}
                                        className="flex flex-wrap justify-between items-center p-2 border rounded"
                                    >
                                        <span>{member.email}</span>
                                        <span>{member.role}</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    <div className="p-6 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">
                            Delete Course
                        </h2>
                        <p className="text-sm">
                            There is no undoing this operation.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCourse}
                            className="mt-4"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Course"}
                        </Button>
                    </div>
                </div>
            )}
            <ThreadList courseId={courseId} />
        </div>
    );
}
