import { SearchResult as SearchResultType } from "./types";
import Link from "next/link";
import { format } from "date-fns";

interface SearchResultProps {
    result: SearchResultType;
}

export function SearchResult({ result }: SearchResultProps) {
    const isThread = result.type === "thread";
    const href = isThread
        ? `/courses/${result.course_id}/thread/${result.id}`
        : `/courses/${result.course_id}/thread/${result.parent_id}#comment-${result.id}`;

    return (
        <Link
            href={href}
            className="block p-4 rounded-lg border hover:border-primary transition-colors"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">
                    {isThread ? result.title : "Comment in thread"}
                </h3>
                <span className="text-sm text-muted-foreground">
                    {format(new Date(result.created_at), "MMM d, yyyy")}
                </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
                {result.content}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
                Match score: {(result.similarity * 100).toFixed(1)}%
            </div>
        </Link>
    );
}
