"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface Thread {
    id: string;
    title: string;
    creator_role: string;
    created_at: string;
    content: string;
    tags: string[];
}

interface Comment {
    id: string;
    anonymous_name: string;
    creator_role: string;
    created_at: string;
    content: string;
}

export default function ThreadDiscussion({ thread }: { thread: Thread }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/threads/${thread.id}/comments`);
            const data = await response.json();
            setComments(data.comments);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [thread.id]);

    const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/threads/${thread.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment }),
            });

            if (response.ok) {
                const data = await response.json();
                setComments([...comments, data.comment]);
                setNewComment("");
                fetchComments();
            }
        } catch (error) {
            console.error("Error posting comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Thread details */}
            <div className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold">{thread.title}</h1>
                    <div className="flex gap-2">
                        {thread.tags &&
                            thread.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                    </div>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                    Posted by {thread.creator_role} •{" "}
                    {new Date(thread.created_at).toLocaleDateString()}
                </div>
                <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>

            {/* Comments section */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Comments</h2>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="border rounded-lg p-4 space-y-2"
                            >
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ))}
                    </div>
                ) : comments.length > 0 ? (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="border rounded-lg p-4"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">
                                        {comment.anonymous_name || "Anonymous"}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {new Date(
                                            comment.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-8 text-muted-foreground">
                        No comments yet. Be the first to comment!
                    </p>
                )}

                {/* Comment form */}
                <form onSubmit={handleSubmitComment} className="mt-6">
                    <div className="space-y-2">
                        <label
                            htmlFor="comment"
                            className="text-sm font-medium"
                        >
                            Add a comment
                        </label>
                        <textarea
                            id="comment"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write your comment here..."
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2"
                        disabled={isSubmitting || !newComment.trim()}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            "Post Comment"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
