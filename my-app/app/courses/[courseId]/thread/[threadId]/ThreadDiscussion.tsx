"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Thread {
    id: string;
    title: string;
    creator_role: string;
    created_at: string;
    content: string;
    tags: string[];
}

export default function ThreadDiscussion({ thread }: { thread: Thread }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/threads/${thread.id}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
            } else {
                console.error("Failed to fetch comments");
                setComments([]);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            setComments([]);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [thread.id]);

    interface Comment {
        id: string;
        anonymous_name: string;
        creator_role: string;
        created_at: string;
        content: string;
    }

    const createComment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch(`/api/threads/${thread.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: newComment }),
        });

        if (response.ok) {
            setNewComment("");
            fetchComments();
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4">
            <div className="p-6 border rounded-lg">
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold">{thread.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{thread.creator_role}</span>
                        <span>•</span>
                        <span>
                            {new Date(thread.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <p className="mt-4">{thread.content}</p>
                <div className="mt-4 flex gap-2">
                    {thread.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                                <span className="font-medium">
                                    {comment.anonymous_name}
                                </span>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{comment.creator_role}</span>
                                    <span>•</span>
                                    <span>
                                        {new Date(
                                            comment.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <p className="mt-2">{comment.content}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground">No comments yet</p>
                )}
            </div>

            <form onSubmit={createComment} className="space-y-4">
                <textarea
                    className="w-full min-h-[100px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                />
                <Button type="submit">Post Comment</Button>
            </form>
        </div>
    );
}
