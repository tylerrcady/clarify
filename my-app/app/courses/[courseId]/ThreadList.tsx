import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ThreadListProps {
    courseId: string;
}

export default function ThreadList({ courseId }: ThreadListProps) {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [showNewThread, setShowNewThread] = useState(false);
    const [newThread, setNewThread] = useState({
        title: "",
        content: "",
        tags: "",
    });

    const fetchThreads = async () => {
        try {
            const response = await fetch(`/api/courses/${courseId}/threads`);
            if (response.ok) {
                const data = await response.json();
                setThreads(data.threads);
            }
        } catch (error) {
            console.error("Failed to fetch threads:", error);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, [courseId]);

    interface Thread {
        id: string;
        title: string;
        content: string;
        tags: string[];
        creator_role: string;
        created_at: string;
        comments: { count: number } | number;
    }

    const createThread = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch(`/api/courses/${courseId}/threads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newThread,
                tags: newThread.tags.split(",").map((tag) => tag.trim()),
            }),
        });

        if (response.ok) {
            setShowNewThread(false);
            setNewThread({ title: "", content: "", tags: "" });
            fetchThreads();
        }
    };

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
                    onSubmit={createThread}
                    className="space-y-4 p-4 border rounded-lg"
                >
                    <Input
                        placeholder="Thread Title"
                        value={newThread.title}
                        onChange={(e) =>
                            setNewThread({
                                ...newThread,
                                title: e.target.value,
                            })
                        }
                        required
                    />
                    <textarea
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                        placeholder="Thread Content"
                        value={newThread.content}
                        onChange={(e) =>
                            setNewThread({
                                ...newThread,
                                content: e.target.value,
                            })
                        }
                        required
                    />
                    <Input
                        placeholder="Tags (comma-separated)"
                        value={newThread.tags}
                        onChange={(e) =>
                            setNewThread({ ...newThread, tags: e.target.value })
                        }
                    />
                    <div className="flex gap-2">
                        <Button type="submit">Create Thread</Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowNewThread(false)}
                        >
                            Cancel
                        </Button>
                    </div>
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
            </div>
        </div>
    );
}
