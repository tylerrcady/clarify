import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface Thread {
    id: string;
    title: string;
    content: string;
    embedding: any;
    created_at: string;
    creator_role: string;
}

interface GraphNode {
    id: string;
    size: number;
    threads: Thread[];
    centroid_id: string; // first thread is the centroid
}

// note: added new batch similarities function that is infinitely quicker (one RPC call versus many)

const SIMILARITY_THRESHOLD = 0.55;
const LINK_THRESHOLD = 0.5;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get("courseId");

        if (!courseId) {
            return NextResponse.json(
                { error: "Missing courseId parameter" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: threads, error } = await supabase
            .from("threads")
            .select("id, title, content, embedding, created_at, creator_role")
            .eq("course_id", courseId);

        if (error) throw error;

        if (!threads.length) return NextResponse.json({ nodes: [], links: [] });

        // ! updated to batch function (one call versus many)
        const threadIds = threads.map((t) => t.id);
        const { data: similarities, error: similarityError } =
            await supabase.rpc("batch_get_thread_similarities", {
                thread_ids: threadIds,
            });

        if (similarityError) throw similarityError;

        const nodes = [];
        const threadToNode = new Map();

        for (const thread of threads) {
            let assigned = false;
            for (const node of nodes) {
                const similarity = similarities.find(
                    (s: {
                        thread1_id: string;
                        thread2_id: string;
                        similarity: number;
                    }) =>
                        (s.thread1_id === thread.id &&
                            s.thread2_id === node.centroid_id) ||
                        (s.thread2_id === thread.id &&
                            s.thread1_id === node.centroid_id)
                )?.similarity;

                if (similarity >= SIMILARITY_THRESHOLD) {
                    node.threads.push(thread);
                    node.size++;
                    threadToNode.set(thread.id, node.id);
                    assigned = true;
                    break;
                }
            }

            if (!assigned) {
                const newNode: GraphNode = {
                    id: `node_${nodes.length}`,
                    size: 1,
                    threads: [thread],
                    centroid_id: thread.id,
                };
                nodes.push(newNode);
                threadToNode.set(thread.id, newNode.id);
            }
        }

        const centroidIds = nodes.map((n) => n.centroid_id);
        const { data: centroidSimilarities, error: centroidSimilarityError } =
            await supabase.rpc("batch_get_thread_similarities", {
                thread_ids: centroidIds,
            });

        if (centroidSimilarityError) throw centroidSimilarityError;

        interface Link {
            source: string;
            target: string;
            value: number;
        }

        const links: Link[] = centroidSimilarities
            .filter(
                (s: { similarity: number }) => s.similarity > LINK_THRESHOLD
            )
            .map(
                (s: {
                    thread1_id: string;
                    thread2_id: string;
                    similarity: number;
                }) => ({
                    source: threadToNode.get(s.thread1_id) as string,
                    target: threadToNode.get(s.thread2_id) as string,
                    value: s.similarity,
                })
            );

        return NextResponse.json({ nodes, links });
    } catch (error) {
        console.error("Error generating knowledge graph:", error);
        return NextResponse.json(
            { error: "Failed to generate knowledge graph" },
            { status: 500 }
        );
    }
}
