import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Loader2,
    MessageSquare,
    PlusCircle,
    MoreVertical,
    Edit,
    Trash,
    ChevronDown,
} from "lucide-react";
import { TagInput } from "@/components/TagInput";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoteButtons } from "@/components/VoteButtons";
import { createClient } from "@/utils/supabase/client";
import { SearchComponent } from "@/components/Search/Search";
import KnowledgeGraph from "@/components/KnowledgeGraph";

interface ThreadListProps {
    courseId: string;
}

interface Thread {
    id: string;
    title: string;
    content: string;
    tags: string[];
    creator_role: string;
    creator_id: string;
    created_at: string;
    comments: { count: number } | number;
}

export default function ThreadList({ courseId }: ThreadListProps) {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewThread, setShowNewThread] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState("");
    const [newThreadContent, setNewThreadContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    const [editThreadId, setEditThreadId] = useState<string | null>(null);
    const [editedThreadTitle, setEditedThreadTitle] = useState("");
    const [editedThreadContent, setEditedThreadContent] = useState("");
    const [editedThreadTags, setEditedThreadTags] = useState<string[]>([]);
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"threadList" | "graph">(
        "threadList"
    );

    // ! added for pagination in milestone 5
    const [currentPage, setCurrentPage] = useState(1);
    const threadsPerPage = 5;

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            setCurrentUser(user.id);
        }
    };

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
        fetchCurrentUser();
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

    const handleEditThread = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editThreadId) return;

        setIsEditSubmitting(true);
        try {
            const response = await fetch(`/api/threads/${editThreadId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editedThreadTitle,
                    content: editedThreadContent,
                    tags: editedThreadTags,
                }),
            });

            if (response.ok) {
                fetchThreads();
                setEditThreadId(null);
            } else {
                const error = await response.json();
                console.error("Error updating thread:", error);
            }
        } catch (error) {
            console.error("Error updating thread:", error);
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const handleDeleteThread = async (threadId: string) => {
        if (!threadId) return;

        try {
            const response = await fetch(`/api/threads/${threadId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                fetchThreads();
            } else {
                const error = await response.json();
                console.error("Error deleting thread:", error);
            }
        } catch (error) {
            console.error("Error deleting thread:", error);
        }
    };

    const uniqueTags = Array.from(
        new Set(threads.flatMap((thread) => thread.tags))
    );

    const filteredThreads = selectedTag
        ? threads.filter((thread) => thread.tags.includes(selectedTag))
        : threads;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mt-2">
                    <h2 className="text-xl font-bold">Discussions</h2>
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
            <div className="flex justify-between items-center mt-2">
                <h2 className="text-xl font-bold">Discussions</h2>
                <Button
                    onClick={() => {
                        setViewMode("threadList");
                        setShowNewThread(true);
                    }}
                >
                    New Thread
                </Button>
            </div>
            <div className="border-b pb-4">
                <SearchComponent courseId={courseId} />
            </div>
            {filteredThreads.length != 0 && (
                <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-4">
                        <label
                            htmlFor="view-mode"
                            className="text-sm font-medium mr-2"
                        >
                            View Mode:
                        </label>
                    </div>
                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="view-mode"
                                checked={viewMode === "graph"}
                                onChange={() =>
                                    setViewMode(
                                        viewMode === "graph"
                                            ? "threadList"
                                            : "graph"
                                    )
                                }
                                className="form-checkbox"
                            />
                            <span className="text-sm font-medium">
                                Graph View
                            </span>
                        </label>
                    </div>
                </div>
            )}
            {viewMode != "graph" && (
                <div className="flex md:flex-row justify-between items-center mt-4 space-y-2 md:space-y-0">
                    <label htmlFor="tag-filter" className="text-sm font-medium">
                        Filter by Tag:
                    </label>
                    <div className="relative">
                        <select
                            id="tag-filter"
                            value={selectedTag || ""}
                            onChange={(e) =>
                                setSelectedTag(e.target.value || null)
                            }
                            className="border rounded-md pl-3 pr-8 py-2 text-sm appearance-none"
                        >
                            <option value="">All Tags</option>
                            {uniqueTags.map((tag) => (
                                <option key={tag} value={tag}>
                                    {tag}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none h-4 w-4" />
                    </div>
                </div>
            )}
            {viewMode === "graph" ? (
                <div className="h-96">
                    <KnowledgeGraph courseId={courseId} />
                </div>
            ) : (
                <>
                    {showNewThread && (
                        <form
                            onSubmit={handleCreateThread}
                            className="space-y-4 border rounded-lg p-4 bg-card"
                        >
                            <h3 className="text-lg font-medium">
                                Create New Thread
                            </h3>

                            <div className="space-y-2">
                                <label
                                    htmlFor="title"
                                    className="text-sm font-medium"
                                >
                                    Title
                                </label>
                                <Input
                                    id="title"
                                    value={newThreadTitle}
                                    onChange={(e) =>
                                        setNewThreadTitle(e.target.value)
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
                                    value={newThreadContent}
                                    onChange={(e) =>
                                        setNewThreadContent(e.target.value)
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
                                    tags={tags}
                                    setTags={setTags}
                                    placeholder="Press Enter or comma to add tags"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Add relevant tags to help others find your
                                    thread
                                </p>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowNewThread(false)}
                                    type="button"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Thread"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-4">
                        {filteredThreads && filteredThreads.length > 0 && (
                            <div className="flex justify-between items-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(prev - 1, 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                >
                                    &larr; Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of{" "}
                                    {Math.ceil(
                                        filteredThreads.length / threadsPerPage
                                    )}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(
                                                prev + 1,
                                                Math.ceil(
                                                    filteredThreads.length /
                                                        threadsPerPage
                                                )
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        Math.ceil(
                                            filteredThreads.length /
                                                threadsPerPage
                                        )
                                    }
                                >
                                    Next &rarr;
                                </Button>
                            </div>
                        )}
                        {filteredThreads
                            .slice(
                                (currentPage - 1) * threadsPerPage,
                                currentPage * threadsPerPage
                            )
                            .map((thread) => (
                                <div key={thread.id}>
                                    {editThreadId != thread.id ? (
                                        <div className="p-4 border rounded-lg mt-4">
                                            <div className="flex items-start">
                                                <div className="flex-1 ml-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col gap-2">
                                                            <Link
                                                                href={`/courses/${courseId}/thread/${thread.id}`}
                                                            >
                                                                <h3 className="text-lg font-medium hover:underline break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                                    {
                                                                        thread.title
                                                                    }
                                                                </h3>
                                                            </Link>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                                <span>
                                                                    {
                                                                        thread.creator_role
                                                                    }
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {new Date(
                                                                        thread.created_at
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>

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
                                                                            setEditThreadId(
                                                                                thread.id
                                                                            );
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
                                                                        }}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => {
                                                                            handleDeleteThread(
                                                                                thread.id
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

                                                    <Link
                                                        href={`/courses/${courseId}/thread/${thread.id}`}
                                                    >
                                                        <p className="mt-2 break-words [word-break:normal] [overflow-wrap:anywhere] hyphens-auto">
                                                            {thread.content}
                                                        </p>
                                                        {thread.tags &&
                                                            thread.tags.length >
                                                                0 && (
                                                                <div className="flex gap-2 flex-wrap mt-4">
                                                                    {thread.tags.map(
                                                                        (
                                                                            tag
                                                                        ) => (
                                                                            <Badge
                                                                                key={
                                                                                    tag
                                                                                }
                                                                                variant="secondary"
                                                                            >
                                                                                {
                                                                                    tag
                                                                                }
                                                                            </Badge>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </Link>
                                                    <div className="flex w-full justify-end">
                                                        <VoteButtons
                                                            itemId={thread.id}
                                                            itemType="thread"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <form
                                            onSubmit={handleEditThread}
                                            className="space-y-4 border rounded-lg p-4 bg-card"
                                        >
                                            <h3 className="text-lg font-medium">
                                                Edit Thread
                                            </h3>

                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="edit-title"
                                                    className="text-sm font-medium"
                                                >
                                                    Title
                                                </label>
                                                <Input
                                                    id="edit-title"
                                                    value={editedThreadTitle}
                                                    onChange={(e) =>
                                                        setEditedThreadTitle(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Thread title"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="edit-content"
                                                    className="text-sm font-medium"
                                                >
                                                    Content
                                                </label>
                                                <textarea
                                                    id="edit-content"
                                                    value={editedThreadContent}
                                                    onChange={(e) =>
                                                        setEditedThreadContent(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Thread content"
                                                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="edit-tags"
                                                    className="text-sm font-medium"
                                                >
                                                    Tags
                                                </label>
                                                <TagInput
                                                    tags={editedThreadTags}
                                                    setTags={
                                                        setEditedThreadTags
                                                    }
                                                    placeholder="Press Enter or comma to add tags"
                                                />
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setEditThreadId(null)
                                                    }
                                                    type="button"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={isEditSubmitting}
                                                >
                                                    {isEditSubmitting ? (
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
                                    )}
                                </div>
                            ))}
                        {filteredThreads.length == 0 && (
                            <div className="text-center py-12 border rounded-lg bg-muted/20">
                                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                    No discussions yet
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    Be the first to start a discussion in this
                                    course!
                                </p>
                                <Button onClick={() => setShowNewThread(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Start a New Thread
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
