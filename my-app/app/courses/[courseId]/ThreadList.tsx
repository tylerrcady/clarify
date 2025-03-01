import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MessageSquare, PlusCircle } from "lucide-react";
import { TagInput } from "@/components/TagInput";

interface ThreadListProps {
    courseId: string;
}

interface Thread {
    id: string;
    title: string;
    content: string;
    tags: string[];
    creator_role: string;
    created_at: string;
    comments: { count: number } | number;
}

export default function ThreadList({ courseId }: ThreadListProps) {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewThread, setShowNewThread] = useState(false);
    const [newThread, setNewThread] = useState({
        title: "",
        content: "",
        tags: "",
    });
    const [newThreadTitle, setNewThreadTitle] = useState("");
    const [newThreadContent, setNewThreadContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchThreads = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/courses/${courseId}/threads`);
            const data = await response.json();
            setThreads(data.threads);
        } catch (error) {
            console.error("Error fetching threads:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, [courseId]);

    const handleCreateThread = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/courses/${courseId}/threads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newThreadTitle,
                    content: newThreadContent,
                    tags: tags,
                }),
            });

            if (response.ok) {
                setNewThreadTitle("");
                setNewThreadContent("");
                setTags([]);
                fetchThreads();
            }
        } catch (error) {
            console.error("Error creating thread:", error);
        } finally {
            setIsSubmitting(false);
            setShowNewThread(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Discussion Threads</h2>
                    <Skeleton className="h-10 w-32" />
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2 mt-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Discussions</h2>
                <Button onClick={() => setShowNewThread(true)}>
                    New Thread
                </Button>
            </div>

            {showNewThread && (
                <form
                    onSubmit={handleCreateThread}
                    className="space-y-4 border rounded-lg p-4 bg-card"
                >
                    <h3 className="text-lg font-medium">Create New Thread</h3>

                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium">
                            Title
                        </label>
                        <Input
                            id="title"
                            value={newThreadTitle}
                            onChange={(e) => setNewThreadTitle(e.target.value)}
                            placeholder="Thread title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="content"
                            className="text-sm font-medium"
                        >
                            Content
                        </label>
                        <textarea
                            id="content"
                            value={newThreadContent}
                            onChange={(e) =>
                                setNewThreadContent(e.target.value)
                            }
                            placeholder="Thread content"
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="tags" className="text-sm font-medium">
                            Tags
                        </label>
                        <TagInput
                            tags={tags}
                            setTags={setTags}
                            placeholder="Press Enter or comma to add tags"
                        />
                        <p className="text-xs text-muted-foreground">
                            Add relevant tags to help others find your thread
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Thread"
                        )}
                    </Button>
                </form>
            )}

            <div className="space-y-4">
                {threads.map((thread) => (
                    <Link
                        href={`/courses/${courseId}/thread/${thread.id}`}
                        key={thread.id}
                    >
                        <div
                            key={thread.id}
                            className="p-4 border rounded-lg mt-4"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-medium">
                                    {thread.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{thread.creator_role}</span>
                                    <span>•</span>
                                    <span>
                                        {new Date(
                                            thread.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <p className="mt-2">{thread.content}</p>
                            <div className="mt-4 flex gap-2">
                                {thread.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Link>
                ))}
                {threads.length == 0 && (
                    <div className="text-center py-12 border rounded-lg bg-muted/20">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            No discussions yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Be the first to start a discussion in this course!
                        </p>
                        <Button onClick={() => setShowNewThread(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Start a New Thread
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
