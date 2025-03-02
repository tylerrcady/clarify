"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Edit, Trash, MoreVertical, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagInput } from "@/components/TagInput";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { VoteButtons } from "@/components/VoteButtons";

interface Thread {
    course_id: any;
    id: string;
    title: string;
    creator_role: string;
    creator_id: string;
    created_at: string;
    content: string;
    tags: string[];
}

interface Comment {
    id: string;
    anonymous_name: string;
    creator_role: string;
    creator_id: string;
    created_at: string;
    content: string;
}

export default function ThreadDiscussion({
    thread: initialThread,
}: {
    thread: Thread;
}) {
    const router = useRouter();
    const [thread, setThread] = useState<Thread>(initialThread);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    const [isEditingThread, setIsEditingThread] = useState(false);
    const [editedThreadTitle, setEditedThreadTitle] = useState(thread.title);
    const [editedThreadContent, setEditedThreadContent] = useState(
        thread.content
    );
    const [editedThreadTags, setEditedThreadTags] = useState<string[]>(
        thread.tags || []
    );
    const [isThreadSubmitting, setIsThreadSubmitting] = useState(false);

    const [editingCommentId, setEditingCommentId] = useState<string | null>(
        null
    );
    const [editedCommentContent, setEditedCommentContent] = useState("");

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            setCurrentUser(user.id);
        }
    };

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
        fetchCurrentUser();
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
                setNewComment("");
                fetchComments();
            }
        } catch (error) {
            console.error("Error posting comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditComment = async (commentId: string) => {
        try {
            const response = await fetch(
                `/api/threads/${thread.id}/comments/${commentId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: editedCommentContent }),
                }
            );

            if (response.ok) {
                fetchComments();
                setEditingCommentId(null);
            } else {
                const error = await response.json();
                console.error("Error updating comment:", error);
            }
        } catch (error) {
            console.error("Error updating comment:", error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            const response = await fetch(
                `/api/threads/${thread.id}/comments/${commentId}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                fetchComments();
            } else {
                const error = await response.json();
                console.error("Error deleting comment:", error);
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const handleEditThread = async () => {
        setIsThreadSubmitting(true);
        try {
            const response = await fetch(`/api/threads/${thread.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editedThreadTitle,
                    content: editedThreadContent,
                    tags: editedThreadTags,
                }),
            });

            if (response.ok) {
                const { thread: updatedThread } = await response.json();
                setThread(updatedThread);
                setIsEditingThread(false);
            } else {
                const error = await response.json();
                console.error("Error updating thread:", error);
            }
        } catch (error) {
            console.error("Error updating thread:", error);
        } finally {
            setIsThreadSubmitting(false);
        }
    };

    const handleDeleteThread = async () => {
        try {
            const response = await fetch(`/api/threads/${thread.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                router.push(`/courses/${thread.course_id}`);
            } else {
                const error = await response.json();
                console.error("Error deleting thread:", error);
            }
        } catch (error) {
            console.error("Error deleting thread:", error);
        }
    };

    return (
        <div className="flex-1 w-full max-w-4xl p-4 space-y-8 overflow-y-auto">
            <div className="space-y-6">
                {/* Thread details */}
                <div className="border rounded-lg p-4 bg-card">
                    {isEditingThread ? (
                        <form onSubmit={handleEditThread} className="space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="title"
                                    className="text-sm font-medium"
                                >
                                    Title
                                </label>
                                <Input
                                    id="title"
                                    value={editedThreadTitle}
                                    onChange={(e) =>
                                        setEditedThreadTitle(e.target.value)
                                    }
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
                                    value={editedThreadContent}
                                    onChange={(e) =>
                                        setEditedThreadContent(e.target.value)
                                    }
                                    placeholder="Thread content"
                                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="tags"
                                    className="text-sm font-medium"
                                >
                                    Tags
                                </label>
                                <TagInput
                                    tags={editedThreadTags}
                                    setTags={setEditedThreadTags}
                                    placeholder="Press Enter or comma to add tags"
                                />
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditingThread(false)}
                                    disabled={isThreadSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isThreadSubmitting}
                                >
                                    {isThreadSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="flex items-start">
                                <VoteButtons
                                    itemId={thread.id}
                                    itemType="thread"
                                />
                                <div className="flex-1 ml-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <h1 className="text-2xl font-bold">
                                            {thread.title}
                                        </h1>
                                        <div className="flex items-center gap-2">
                                            {currentUser ===
                                                thread.creator_id && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setEditedThreadTitle(
                                                                    thread.title
                                                                );
                                                                setEditedThreadContent(
                                                                    thread.content
                                                                );
                                                                setEditedThreadTags(
                                                                    thread.tags ||
                                                                        []
                                                                );
                                                                setIsEditingThread(
                                                                    true
                                                                );
                                                            }}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() =>
                                                                handleDeleteThread()
                                                            }
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex gap-2 flex-wrap">
                                            {thread.tags &&
                                                thread.tags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        variant="secondary"
                                                        className="mb-4"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-4 break-all">
                                        Posted by {thread.creator_role} •{" "}
                                        {new Date(
                                            thread.created_at
                                        ).toLocaleDateString()}
                                    </div>
                                    <p className="whitespace-pre-wrap break-all">
                                        {thread.content}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
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
                                    <div className="flex">
                                        <VoteButtons
                                            itemId={comment.id}
                                            itemType="comment"
                                            threadId={thread.id}
                                        />
                                        <div className="flex-1 ml-2">
                                            <div className="flex justify-between items-center mb-2 break-all">
                                                <span className="font-medium">
                                                    {comment.anonymous_name ||
                                                        "Anonymous"}
                                                </span>
                                                <div className="flex items-center gap-2 break-all">
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(
                                                            comment.created_at
                                                        ).toLocaleDateString()}
                                                    </span>
                                                    {currentUser ===
                                                        comment.creator_id && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setEditingCommentId(
                                                                            comment.id
                                                                        );
                                                                        setEditedCommentContent(
                                                                            comment.content
                                                                        );
                                                                    }}
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => {
                                                                        handleDeleteComment(
                                                                            comment.id
                                                                        );
                                                                    }}
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>
                                            {editingCommentId === comment.id ? (
                                                <form
                                                    onSubmit={() =>
                                                        handleEditComment(
                                                            comment.id
                                                        )
                                                    }
                                                    className="space-y-2"
                                                >
                                                    <textarea
                                                        value={
                                                            editedCommentContent
                                                        }
                                                        onChange={(e) =>
                                                            setEditedCommentContent(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        required
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditingCommentId(
                                                                    null
                                                                )
                                                            }
                                                        >
                                                            <X className="h-4 w-4 mr-1" />{" "}
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            type="submit"
                                                        >
                                                            <Check className="h-4 w-4 mr-1" />{" "}
                                                            Save
                                                        </Button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <p className="whitespace-pre-wrap break-all">
                                                    {comment.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
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
        </div>
    );
}
