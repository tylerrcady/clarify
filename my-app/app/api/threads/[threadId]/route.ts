import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/utils/search";

export async function PUT(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const threadId = pathSegments[pathSegments.indexOf("threads") + 1];

        const { title, content, tags } = await request.json();

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: thread, error: threadError } = await supabase
            .from("threads")
            .select("*")
            .eq("id", threadId)
            .single();

        if (threadError || !thread) {
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404 }
            );
        }

        if (thread.creator_id !== user.id) {
            return NextResponse.json(
                { error: "You can only edit your own threads" },
                { status: 403 }
            );
        }

        const embedding = await generateEmbedding(`${title}\n${content}`);

        const { data: updatedThread, error } = await supabase
            .from("threads")
            .update({
                title,
                content,
                tags,
                embedding,
                updated_at: new Date().toISOString(),
            })
            .eq("id", threadId)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to update thread" },
                { status: 500 }
            );
        }

        return NextResponse.json({ thread: updatedThread }, { status: 200 });
    } catch (error) {
        console.error("Error updating thread:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const threadId = pathSegments[pathSegments.indexOf("threads") + 1];

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: thread, error: threadError } = await supabase
            .from("threads")
            .select("*")
            .eq("id", threadId)
            .single();

        if (threadError || !thread) {
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404 }
            );
        }

        if (thread.creator_id !== user.id) {
            return NextResponse.json(
                { error: "You can only delete your own threads" },
                { status: 403 }
            );
        }

        const { error: commentsError } = await supabase
            .from("comments")
            .delete()
            .eq("thread_id", threadId);

        if (commentsError) {
            return NextResponse.json(
                { error: "Failed to delete thread comments" },
                { status: 500 }
            );
        }

        const { error: namesError } = await supabase
            .from("thread_anonymous_names")
            .delete()
            .eq("thread_id", threadId);

        if (namesError) {
            return NextResponse.json(
                { error: "Failed to delete thread anonymous names" },
                { status: 500 }
            );
        }

        const { error } = await supabase
            .from("threads")
            .delete()
            .eq("id", threadId);

        if (error) {
            return NextResponse.json(
                { error: "Failed to delete thread" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error deleting thread:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
