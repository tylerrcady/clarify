export interface SearchResult {
    id: string;
    title: string;
    content: string;
    created_at: string;
    course_id: string;
    similarity: number;
    type: "thread" | "comment";
    parent_id: string | null;
}
