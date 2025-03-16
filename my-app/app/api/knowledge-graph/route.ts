import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const SIMILARITY_THRESHOLD = 0.85; // ! alter this accordingly

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

        const nodes: GraphNode[] = [];

        for (const thread of threads) {
            let assigned = false;

            for (const node of nodes) {
                const { data: similarity, error: similarityError } =
                    await supabase.rpc("get_thread_similarity", {
                        thread1_id: thread.id,
                        thread2_id: node.centroid_id,
                    });

                if (similarityError) throw similarityError;

                if (similarity >= SIMILARITY_THRESHOLD) {
                    node.threads.push(thread);
                    node.size++;
                    assigned = true;
                    break;
                }
            }

            if (!assigned) {
                nodes.push({
                    id: `node_${nodes.length}`,
                    size: 1,
                    threads: [thread],
                    centroid_id: thread.id,
                });
            }
        }

        const links = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const { data: similarity, error: similarityError } =
                    await supabase.rpc("get_thread_similarity", {
                        thread1_id: nodes[i].centroid_id,
                        thread2_id: nodes[j].centroid_id,
                    });

                if (similarityError) throw similarityError;

                if (similarity > 0.5) {
                    // ! adjust this as needed
                    links.push({
                        source: nodes[i].id,
                        target: nodes[j].id,
                        value: similarity,
                    });
                }
            }
        }

        return NextResponse.json({ nodes, links });
    } catch (error) {
        console.error("Error generating knowledge graph:", error);
        return NextResponse.json(
            { error: "Failed to generate knowledge graph" },
            { status: 500 }
        );
    }
}
