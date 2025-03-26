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
import ThreadSummary from "@/components/ThreadSummary";

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
    parent_id: string | null;
    reply_count: number;
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

    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [showRepliesFor, setShowRepliesFor] = useState<Set<string>>(
        new Set()
    );

    const toggleReplies = async (commentId: string) => {
        const newShowRepliesFor = new Set(showRepliesFor);

        if (newShowRepliesFor.has(commentId)) {
            newShowRepliesFor.delete(commentId);
        } else {
            newShowRepliesFor.add(commentId);
        }

        setShowRepliesFor(newShowRepliesFor);
    };

    const handleSubmitReply = async (
        e: React.FormEvent<HTMLFormElement>,
        parentId: string
    ) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/threads/${thread.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: replyContent,
                    parentId: parentId,
                }),
            });

            if (response.ok) {
                setReplyContent("");
                setReplyingToId(null);
                fetchComments();
            }
        } catch (error) {
            console.error("Error posting reply:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser(); // only use this function in client components, use NO other await supabase.function()
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
                fetchComments();
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
                                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
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
                                        {thread.tags &&
                                            thread.tags.length > 0 && (
                                                <div className="flex gap-2 flex-wrap mb-4">
                                                    {thread.tags.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant="secondary"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-4 break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                        {/* use these tailwind classes to display text in a visibly sound manner */}
                                        Posted by {thread.creator_role} •{" "}
                                        {new Date(
                                            thread.created_at
                                        ).toLocaleDateString()}
                                    </div>
                                    <div className="flex w-full flex-col">
                                        <p className="whitespace-pre-wrap break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                            {thread.content}
                                        </p>
                                        <div className="flex w-full justify-end">
                                            <VoteButtons
                                                itemId={thread.id}
                                                itemType="thread"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <ThreadSummary threadId={thread.id} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Comments Section */}
                <div className="space-y-4 mt-6">
                    <h2 className="text-xl font-semibold">Comments</h2>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="border rounded-lg p-4 space-y-2"
                                >
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="flex gap-2 mt-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-muted-foreground">
                            No comments yet. Be the first to comment!
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {/* Top-level comments (no parent) */}
                            {comments
                                .filter((comment) => !comment.parent_id)
                                .map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="flex">
                                            <div className="flex-1 ml-2">
                                                <div className="flex justify-between items-center mb-2 break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                    <span className="font-medium">
                                                        {comment.anonymous_name ||
                                                            "Anonymous"}
                                                    </span>
                                                    <div className="flex items-center gap-2 break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                            <span>
                                                                {
                                                                    comment.creator_role
                                                                }
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {new Date(
                                                                    comment.created_at
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>
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
                                                {editingCommentId ===
                                                comment.id ? (
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
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
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
                                                    <div className="flex w-full flex-col">
                                                        <p className="whitespace-pre-wrap break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                            {comment.content}
                                                        </p>
                                                        <div className="flex w-full justify-between mt-2">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="text-xs text-muted-foreground hover:underline"
                                                                    onClick={() =>
                                                                        setReplyingToId(
                                                                            comment.id
                                                                        )
                                                                    }
                                                                >
                                                                    Reply
                                                                </button>
                                                                {comment.reply_count >
                                                                    0 && (
                                                                    <button
                                                                        className="text-xs text-muted-foreground hover:underline"
                                                                        onClick={() =>
                                                                            toggleReplies(
                                                                                comment.id
                                                                            )
                                                                        }
                                                                    >
                                                                        {showRepliesFor.has(
                                                                            comment.id
                                                                        )
                                                                            ? `Hide (${comment.reply_count})`
                                                                            : `Show (${comment.reply_count})`}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <VoteButtons
                                                                itemId={
                                                                    comment.id
                                                                }
                                                                itemType="comment"
                                                                threadId={
                                                                    thread.id
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Reply form */}
                                                {replyingToId ===
                                                    comment.id && (
                                                    <form
                                                        onSubmit={(e) =>
                                                            handleSubmitReply(
                                                                e,
                                                                comment.id
                                                            )
                                                        }
                                                        className="mt-4 pl-4 border-l-2 border-gray-200"
                                                    >
                                                        <div className="space-y-2">
                                                            <label
                                                                htmlFor="reply"
                                                                className="text-sm font-medium"
                                                            >
                                                                Reply to{" "}
                                                                {comment.anonymous_name ||
                                                                    "Anonymous"}
                                                            </label>
                                                            <textarea
                                                                id="reply"
                                                                value={
                                                                    replyContent
                                                                }
                                                                onChange={(e) =>
                                                                    setReplyContent(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Write your reply here..."
                                                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 mt-2">
                                                            <Button
                                                                type="submit"
                                                                size="sm"
                                                                disabled={
                                                                    isSubmitting ||
                                                                    !replyContent.trim()
                                                                }
                                                            >
                                                                {isSubmitting ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Posting...
                                                                    </>
                                                                ) : (
                                                                    "Post Reply"
                                                                )}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setReplyingToId(
                                                                        null
                                                                    )
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </form>
                                                )}

                                                {/* Replies section */}
                                                {showRepliesFor.has(
                                                    comment.id
                                                ) && (
                                                    <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-4">
                                                        {comments
                                                            .filter(
                                                                (reply) =>
                                                                    reply.parent_id ===
                                                                    comment.id
                                                            )
                                                            .map((reply) => (
                                                                <div
                                                                    key={
                                                                        reply.id
                                                                    }
                                                                    className="border rounded-lg p-4 bg-card"
                                                                >
                                                                    <div className="flex justify-between items-center mb-2 break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                                        <span className="font-medium">
                                                                            {reply.anonymous_name ||
                                                                                "Anonymous"}
                                                                        </span>
                                                                        <div className="flex items-center gap-2 break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                                                <span>
                                                                                    {
                                                                                        comment.creator_role
                                                                                    }
                                                                                </span>
                                                                                <span>
                                                                                    •
                                                                                </span>
                                                                                <span>
                                                                                    {new Date(
                                                                                        comment.created_at
                                                                                    ).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                            {currentUser ===
                                                                                reply.creator_id && (
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
                                                                                                    reply.id
                                                                                                );
                                                                                                setEditedCommentContent(
                                                                                                    reply.content
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
                                                                                                    reply.id
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
                                                                    {editingCommentId ===
                                                                    reply.id ? (
                                                                        <form
                                                                            onSubmit={() =>
                                                                                handleEditComment(
                                                                                    reply.id
                                                                                )
                                                                            }
                                                                            className="space-y-2"
                                                                        >
                                                                            <textarea
                                                                                value={
                                                                                    editedCommentContent
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    setEditedCommentContent(
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
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
                                                                        <div className="flex w-full flex-col">
                                                                            <p className="whitespace-pre-wrap break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                                                {
                                                                                    reply.content
                                                                                }
                                                                            </p>
                                                                            <div className="flex w-full justify-end mt-2">
                                                                                <VoteButtons
                                                                                    itemId={
                                                                                        reply.id
                                                                                    }
                                                                                    itemType="comment"
                                                                                    threadId={
                                                                                        thread.id
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {/* New Comment Form */}
                    <form
                        onSubmit={handleSubmitComment}
                        className="mt-6 space-y-4"
                    >
                        <div>
                            <label
                                htmlFor="comment"
                                className="block text-sm font-medium mb-1"
                            >
                                Add a comment
                            </label>
                            <textarea
                                id="comment"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write your comment here..."
                                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
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
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
